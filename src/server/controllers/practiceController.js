/**
 * src/server/controllers/practiceController.js
 * AI 自适应句型练习系统控制器
 */

const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const { getAIGateway } = require('../../services/aiGateway');
const practiceService = require('../services/practiceService');

// ==================== 语言标准化 ====================

function normalizeLanguage(lang) {
  if (!lang) return null;
  const m = (lang || '').toLowerCase();
  const map = {
    'ja': 'ja', 'jp': 'ja', 'ja-jp': 'ja', 'japanese': 'ja',
    'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'english': 'en',
    'ko': 'ko', 'kr': 'ko', 'ko-kr': 'ko', 'korean': 'ko',
    'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'chinese': 'zh',
    'fr': 'fr', 'fr-fr': 'fr', 'french': 'fr',
    'de': 'de', 'de-de': 'de', 'german': 'de',
    'es': 'es', 'es-es': 'es', 'spanish': 'es',
  };
  return map[m] || lang.toLowerCase();
}

// ==================== 练习配置 ====================

const practiceController = {

  /**
   * GET /api/practice/config
   * 获取用户练习配置
   */
  async getConfig(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      let config = await prisma.practiceConfig.findUnique({ where: { userId } });
      if (!config) {
        config = await prisma.practiceConfig.create({
          data: { userId, durationMinutes: 10 },
        });
      }
      return res.json({ success: true, data: config });
    } catch (error) {
      logger.error('PracticeController: getConfig error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/practice/config
   * 设置每日练习时长
   */
  async updateConfig(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const { durationMinutes } = req.body;
      if (![10, 20, 30].includes(durationMinutes) && durationMinutes < 5) {
        return res.status(400).json({ success: false, error: '练习时长无效，支持: 10/20/30 分钟或自定义≥5分钟' });
      }
      const config = await prisma.practiceConfig.upsert({
        where: { userId },
        create: { userId, durationMinutes },
        update: { durationMinutes },
      });
      return res.json({ success: true, data: config });
    } catch (error) {
      logger.error('PracticeController: updateConfig error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/practice/streak
   * 获取连续打卡状态
   */
  async getStreak(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const config = await prisma.practiceConfig.findUnique({ where: { userId } });
      return res.json({
        success: true,
        currentDay: config?.currentDay || 1,
        streakDays: config?.streakDays || 0,
        totalDays: 30,
        hasPracticedToday: config?.lastPracticeAt
          ? new Date(config.lastPracticeAt).toDateString() === new Date().toDateString()
          : false,
      });
    } catch (error) {
      logger.error('PracticeController: getStreak error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  // ==================== 句型生成（AI） ====================

  /**
   * GET /api/practice/sentences?language=en&level=beginner
   * 根据用户配置 + AI 动态生成句型练习
   */
  async generateSentences(req, res) {
    // P3 修复：禁止默认英语。无 language 参数时返回 400 要求前端显式传入。
    const language = req.query.language;
    const level = req.query.level || 'beginner';
    try {
      const userId = req.userId || req.user?.id;
      
      // 3 秒数据库超时保护
      const dbPromise = prisma.practiceConfig.findUnique({ where: { userId } });
      const dbTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      );
      const config = await Promise.race([dbPromise, dbTimeout]);
      // v1.1.0 修复：优先使用本次请求显式传入的时长（前端实时选择），
      // 其次落到已保存配置，最后兜底 10 分钟。修复"自定义时长不生效"Bug。
      const queryDuration = parseInt(req.query.duration || req.query.durationMinutes, 10);
      const durationMinutes = (Number.isFinite(queryDuration) && queryDuration >= 5 && queryDuration <= 120)
        ? queryDuration
        : (config?.durationMinutes || 10);

      // 标准化语言代码
      const normalizedLang = normalizeLanguage(language);
      const resolvedLevel = level || 'beginner';

      if (!normalizedLang) {
        return res.status(400).json({ success: false, error: '缺少 language 参数' });
      }

      // 获取薄弱点（3 秒超时，超时返回空数组继续）
      const wpPromise = practiceService.getWeakPoints(userId);
      const wpTimeout = new Promise((resolve) =>
        setTimeout(() => resolve([]), 3000)
      );
      const weakPoints = await Promise.race([wpPromise, wpTimeout]);

      // 计算句型和分布
      const totalCount = practiceService.calcSentenceCount(durationMinutes, resolvedLevel);
      const distribution = practiceService.calcDistribution(totalCount);

      // 构建 AI Prompt
      const prompt = practiceService.buildSentencePrompt(normalizedLang, resolvedLevel, distribution, weakPoints);

      // 调用 AI 生成（通过工厂获取单例），15 秒超时强制兜底
      const gateway = getAIGateway();
      const aiPromise = gateway.call({
        scene: 'sentence_practice',
        userId,
        params: {
          input: prompt,
          language: normalizedLang,
          level: resolvedLevel,
          type: 'sentence_generation',
        },
      });
      
      // 10 秒超时保护：超时则直接走兜底，不等待 AI
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 10000)
      );
      
      const aiResult = await Promise.race([aiPromise, timeoutPromise]);

      let sentences = [];
      try {
        const content = aiResult.result;
        if (typeof content === 'string') {
          sentences = JSON.parse(content);
        } else if (Array.isArray(content)) {
          sentences = content;
        } else if (content && typeof content === 'object') {
          sentences = content.choices?.[0]?.message?.content
            ? JSON.parse(content.choices[0].message.content)
            : [];
        }
      } catch (parseError) {
        logger.error('PracticeController: AI result parse error', parseError.message);
        // v1.1.0 修复：兜底数量必须匹配时长换算出的 totalCount，不再写死 5
        sentences = generateFallbackSentences(normalizedLang, resolvedLevel, totalCount);
      }

      if (!sentences || sentences.length === 0) {
        sentences = generateFallbackSentences(normalizedLang, resolvedLevel, totalCount);
      }

      // 异步存储到内容库
      practiceService.saveSentencesToContent(sentences, normalizedLang, resolvedLevel, userId).catch(e =>
        logger.error('PracticeController: saveSentences async error', e.message));

      return res.json({
        success: true,
        source: aiResult.source,
        language: normalizedLang,
        level: resolvedLevel,
        distribution,
        weakPoints,
        totalCount: sentences.length,
        sentences,
      });
    } catch (error) {
      logger.error('PracticeController: generateSentences error', error.message);
      // 兜底：AI 异常时返回本地句型库，不直接 500
      // v1.1.0 修复：即使走异常兜底，数量也要匹配用户选择的时长
      let fbDuration = parseInt(req.query.duration || req.query.durationMinutes, 10);
      if (!Number.isFinite(fbDuration) || fbDuration < 5 || fbDuration > 120) fbDuration = 10;
      const fbCount = practiceService.calcSentenceCount(fbDuration, level || 'beginner');
      const fallback = generateFallbackSentences(language, level, fbCount);
      return res.json({
        success: true,
        source: 'fallback',
        language,
        level,
        totalCount: fallback.length,
        sentences: fallback,
      });
    }
  },

  /**
   * POST /api/practice/submit
   * 提交练习结果
   */
  async submitResult(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const {
        language,
        level,
        languageType,
        durationMinutes,
        totalCount,
        correctCount,
        wrongQuestions, // [{ questionType, sentence, meaning, grammarPoint, userAnswer, correctAnswer }]
      } = req.body;

      if (!totalCount || correctCount === undefined) {
        return res.status(400).json({ success: false, error: '缺少 totalCount / correctCount' });
      }

      const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

      // 分析薄弱点
      const weakPointsSet = new Set();
      if (wrongQuestions && wrongQuestions.length > 0) {
        wrongQuestions.forEach(q => {
          if (q.grammarPoint) weakPointsSet.add(q.grammarPoint);
        });
      }

      // 创建练习记录
      const record = await prisma.sentencePracticeRecord.create({
        data: {
          userId,
          sessionDate: new Date(),
          level: level || 'beginner',
          language: language || 'ja',
          languageType: languageType || 'system',
          totalCount,
          correctCount,
          accuracy,
          durationMinutes: durationMinutes || 10,
          pattern: {
            basicCount: Math.round(totalCount * 0.5),
            consolidationCount: Math.round(totalCount * 0.3),
            improvementCount: totalCount - Math.round(totalCount * 0.5) - Math.round(totalCount * 0.3),
          },
          weakPoints: [...weakPointsSet],
          isCompleted: true,
        },
      });

      // 错题入库
      if (wrongQuestions && wrongQuestions.length > 0) {
        const wrongData = wrongQuestions.map(q => ({
          userId,
          recordId: record.id,
          questionType: q.questionType || 'fill_blank',
          sentence: q.sentence || '',
          meaning: q.meaning || '',
          grammarPoint: q.grammarPoint || '',
          userAnswer: q.userAnswer || '',
          correctAnswer: q.correctAnswer || '',
          language: language || 'ja',
        }));

        await prisma.wrongQuestion.createMany({ data: wrongData });
      }

      // 更新打卡
      await updateStreak(userId);

      return res.json({
        success: true,
        data: {
          recordId: record.id,
          accuracy,
          weakPoints: [...weakPointsSet],
          wrongCount: wrongQuestions?.length || 0,
        },
      });
    } catch (error) {
      logger.error('PracticeController: submitResult error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/practice/report
   * 获取练习报告
   */
  async getReport(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 今日报告
      const todayRecord = await prisma.sentencePracticeRecord.findFirst({
        where: {
          userId,
          createdAt: { gte: today },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 本周统计
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const weekRecords = await prisma.sentencePracticeRecord.findMany({
        where: {
          userId,
          createdAt: { gte: weekStart },
        },
      });

      const weekTotal = weekRecords.reduce((s, r) => s + r.totalCount, 0);
      const weekCorrect = weekRecords.reduce((s, r) => s + r.correctCount, 0);
      const weekAccuracy = weekTotal > 0 ? weekCorrect / weekTotal : 0;
      const weekSessions = weekRecords.length;

      // 薄弱点汇总
      const weekWeak = new Map();
      weekRecords.forEach(r => {
        if (r.weakPoints && Array.isArray(r.weakPoints)) {
          r.weakPoints.forEach(p => weekWeak.set(p, (weekWeak.get(p) || 0) + 1));
        }
      });
      const topWeakPoints = [...weekWeak.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([point, count]) => ({ point, count }));

      // 待复习错题
      const pendingReview = await prisma.wrongQuestion.count({
        where: {
          userId,
          reviewedCorrect: false,
          reviewedAt: null,
        },
      });

      // 连续打卡
      const config = await prisma.practiceConfig.findUnique({ where: { userId } });

      return res.json({
        success: true,
        data: {
          today: todayRecord
            ? { totalCount: todayRecord.totalCount, correctCount: todayRecord.correctCount, accuracy: Number(todayRecord.accuracy) }
            : null,
          week: { sessions: weekSessions, totalSentences: weekTotal, accuracy: Number(weekAccuracy.toFixed(2)) },
          topWeakPoints,
          pendingReview,
          streakDays: config?.streakDays || 0,
          currentDay: config?.currentDay || 1,
        },
      });
    } catch (error) {
      logger.error('PracticeController: getReport error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/practice/review-questions
   * 获取待复习错题
   */
  async getReviewQuestions(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const questions = await prisma.wrongQuestion.findMany({
        where: {
          userId,
          reviewedCorrect: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return res.json({ success: true, data: questions, total: questions.length });
    } catch (error) {
      logger.error('PracticeController: getReviewQuestions error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * POST /api/practice/review-submit
   * 提交复习结果
   */
  async submitReview(req, res) {
    try {
      const userId = req.userId || req.user?.id;
      const { questionId, isCorrect } = req.body;

      const question = await prisma.wrongQuestion.findFirst({
        where: { id: questionId, userId },
      });

      if (!question) {
        return res.status(404).json({ success: false, error: '错题不存在' });
      }

      await prisma.wrongQuestion.update({
        where: { id: questionId },
        data: {
          reviewedAt: new Date(),
          reviewedCorrect: !!isCorrect,
          reviewCount: (question.reviewCount || 0) + 1,
        },
      });

      return res.json({ success: true });
    } catch (error) {
      logger.error('PracticeController: submitReview error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};

// ==================== 打卡更新 ====================

async function updateStreak(userId) {
  try {
    const config = await prisma.practiceConfig.findUnique({ where: { userId } });
    if (!config) return;

    const now = new Date();
    const last = config.lastPracticeAt ? new Date(config.lastPracticeAt) : null;
    const today = new Date(now.toDateString());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streakDays = config.streakDays;
    let currentDay = config.currentDay;

    if (!last || last < yesterday) {
      streakDays = 1; // 断层，重新开始
    } else if (last >= yesterday && last < today) {
      streakDays += 1; // 连续
    }
    // last >= today: 今天已经打过卡，不变

    // currentDay 不超过30
    if (last && last < today) {
      currentDay = Math.min(currentDay + 1, 30);
    }

    await prisma.practiceConfig.update({
      where: { userId },
      data: { streakDays, currentDay, lastPracticeAt: now },
    });
  } catch (error) {
    logger.error('PracticeController: updateStreak error', error.message);
  }
}

// ==================== 兜底句型（AI 不可用时） ====================

function generateFallbackSentences(language, level, count) {
  const pool = {
    en: [
      { sentence: 'Hello, how are you?', phonetic: '/həˈloʊ haʊ ɑːr juː/', meaning: '你好，你好吗？', grammar: '问候句型 + 疑问副词 how 表示状态', scene: '日常问候场景' },
      { sentence: 'I like reading books.', phonetic: '/aɪ laɪk ˈriːdɪŋ bʊks/', meaning: '我喜欢读书。', grammar: '主语 + 动词 + 动名词宾语', scene: '表达兴趣爱好' },
      { sentence: 'Where is the nearest station?', phonetic: '/wɛr ɪz ðə ˈnɪrəst ˈsteɪʃən/', meaning: '最近的车站在哪里？', grammar: '特殊疑问句 where + 最高级 nearest', scene: '问路场景' },
      { sentence: 'She has been studying for three hours.', phonetic: '/ʃiː hæz biːn ˈstʌdiɪŋ fɔːr θriː aʊərz/', meaning: '她已经学习了三个小时。', grammar: '现在完成进行时 has been + V-ing', scene: '描述持续动作' },
      { sentence: 'If I were you, I would accept the offer.', phonetic: '/ɪf aɪ wɜːr juː aɪ wʊd ækˈsɛpt ðə ˈɔːfər/', meaning: '如果我是你，我会接受这个提议。', grammar: '虚拟语气 if + were + would', scene: '给出建议' },
      { sentence: 'The book was written by a famous author.', phonetic: '/ðə bʊk wʌz ˈrɪtən baɪ ə ˈfeɪməs ˈɔːθər/', meaning: '这本书是一位著名作家写的。', grammar: '被动语态 was/were + 过去分词', scene: '描述事物来源' },
      { sentence: 'Could you tell me how to get there?', phonetic: '/kʊd juː tɛl miː haʊ tə ɡɛt ðɛr/', meaning: '你能告诉我怎么去那里吗？', grammar: '礼貌请求 could + 宾语从句', scene: '礼貌问询场景' },
      { sentence: 'I have never been to Japan before.', phonetic: '/aɪ hæv ˈnɛvər biːn tə dʒəˈpæn bɪˈfɔːr/', meaning: '我以前从未去过日本。', grammar: '现在完成时 have + been + never', scene: '谈论经历' },
      { sentence: 'What time does the meeting start?', phonetic: '/wʌt taɪm dʌz ðə ˈmiːtɪŋ stɑːrt/', meaning: '会议几点开始？', grammar: '特殊疑问句 what time + 助动词 does', scene: '会议场景' },
      { sentence: 'I would like to order a coffee, please.', phonetic: '/aɪ wʊd laɪk tu ˈɔːrdər ə ˈkɔːfi pliːz/', meaning: '我想点一杯咖啡，谢谢。', grammar: '委婉表达 would like + to + 动词', scene: '点餐场景' },
    ],
    ja: [
      { sentence: '今日はいい天気ですね。', phonetic: 'きょうはいいてんきですね', meaning: '今天天气真好。', grammar: '～ですね 用于寻求同意的表达', scene: '日常寒暄场景' },
      { sentence: 'すみません、駅はどこですか。', phonetic: 'すみません、えきはどこですか', meaning: '请问，车站在哪里？', grammar: '～はどこですか 询问地点', scene: '问路场景' },
      { sentence: '日本語を勉強しています。', phonetic: 'にほんごをべんきょうしています', meaning: '我正在学习日语。', grammar: '～ています 表示持续动作', scene: '自我介绍场景' },
      { sentence: 'もう一度言っていただけますか。', phonetic: 'もういちどいっていただけますか', meaning: '能请您再说一遍吗？', grammar: 'いただけますか 谦让语请求', scene: '请求重复' },
      { sentence: '昨日の映画はとても面白かったです。', phonetic: 'きのうのえいがはとてもおもしろかったです', meaning: '昨天的电影非常有趣。', grammar: 'い形容词过去式 ～かった', scene: '分享感受' },
      { sentence: '来週の旅行が楽しみです。', phonetic: 'らいしゅうのりょこうがたのしみです', meaning: '期待下周的旅行。', grammar: '～が楽しみ 表示期待', scene: '谈论计划' },
      { sentence: 'この料理はとても美味しいです。', phonetic: 'このりょうりはとてもおいしいです', meaning: '这道菜非常好吃。', grammar: '～は～です 描述事物性质', scene: '餐饮场景' },
      { sentence: '明日何時に起きますか。', phonetic: 'あしたなんじにおきますか', meaning: '明天几点起床？', grammar: '疑問詞 + か 询问信息', scene: '日常对话' },
    ],
    zh: [
      { sentence: '今天天气真好！', phonetic: 'jīn tiān tiān qì zhēn hǎo', meaning: '今天天气真好！', grammar: '感叹句 "真" 表程度', scene: '日常寒暄场景' },
      { sentence: '请问地铁站在哪里？', phonetic: 'qǐng wèn dì tiě zhàn zài nǎ lǐ', meaning: '请问地铁站在哪里？', grammar: '疑问句 "在哪里" 询问地点', scene: '问路场景' },
      { sentence: '我正在准备明天的演讲。', phonetic: 'wǒ zhèng zài zhǔn bèi míng tiān de yǎn jiǎng', meaning: '我正在准备明天的演讲。', grammar: '进行时 "正在" + 动词', scene: '工作学习场景' },
      { sentence: '这个问题比较复杂。', phonetic: 'zhè gè wèn tí bǐ jiào fù zá', meaning: '这个问题比较复杂。', grammar: '"比较" 作程度副词修饰形容词', scene: '讨论场景' },
      { sentence: '你觉得这个方案怎么样？', phonetic: 'nǐ jué de zhè gè fāng àn zěn me yàng', meaning: '你觉得这个方案怎么样？', grammar: '"怎么样" 用于征求意见', scene: '会议场景' },
    ],
    ko: [
      { sentence: '안녕하세요, 반갑습니다.', phonetic: 'annyeonghaseyo, bangapseumnida', meaning: '你好，很高兴见到你。', grammar: '습니다/ㅂ니다 正式尊敬阶终结语尾', scene: '初次见面问候' },
      { sentence: '이것은 얼마예요?', phonetic: 'igeoseun eolmayeyo', meaning: '这个多少钱？', grammar: '은/는 主题助词 + 예요 疑问终结', scene: '购物场景' },
      { sentence: '한국어를 배우고 있어요.', phonetic: 'hangugeoreul baeugo isseoyo', meaning: '我正在学韩语。', grammar: '고 있다 进行时 + 요 非正式尊敬', scene: '自我介绍场景' },
      { sentence: '지하철역이 어디에 있어요?', phonetic: 'jihacheolyeogi eodie isseoyo', meaning: '地铁站在哪里？', grammar: '이/가 主格助词 + 에 处所格', scene: '问路场景' },
    ],
    fr: [
      { sentence: 'Bonjour, comment allez-vous?', phonetic: '/bɔ̃ʒuʁ kɔmɑ̃ ale vu/', meaning: '你好，你好吗？', grammar: '正式问候 Bonjour + 倒装疑问 comment allez-vous', scene: '日常问候场景' },
      { sentence: 'Je voudrais un café, s\'il vous plaît.', phonetic: '/ʒə vudʁɛ œ̃ kafe sil vu plɛ/', meaning: '我想要一杯咖啡，谢谢。', grammar: '条件式 voudrais 表达礼貌请求', scene: '点餐场景' },
      { sentence: 'Où est la gare?', phonetic: '/u ɛ la ɡaʁ/', meaning: '火车站在哪里？', grammar: '疑问副词 Où + est-ce que 或倒装', scene: '问路场景' },
      { sentence: 'J\'apprends le français depuis un an.', phonetic: '/ʒapʁɑ̃ lə fʁɑ̃sɛ dəpɥi œ̃ nɑ̃/', meaning: '我学法语已经一年了。', grammar: 'depuis + 时间段 表示持续至今', scene: '语言学习场景' },
    ],
    de: [
      { sentence: 'Guten Morgen, wie geht es Ihnen?', phonetic: '/ˈɡuːtən ˈmɔʁɡən viː ɡeːt ɛs ˈiːnən/', meaning: '早上好，您怎么样？', grammar: '尊称 Ihnen（第三格） + 固定问候语', scene: '日常问候场景' },
      { sentence: 'Ich möchte ein Bier, bitte.', phonetic: '/ɪç ˈmœçtə aɪn biːɐ ˈbɪtə/', meaning: '我想要一杯啤酒，谢谢。', grammar: 'möchte（mögen 的虚拟式）表礼貌请求', scene: '点餐场景' },
      { sentence: 'Wo ist der Bahnhof?', phonetic: '/voː ɪst deːɐ ˈbaːnhoːf/', meaning: '火车站在哪里？', grammar: '疑问词 Wo + 动词第二位 ist + 主格', scene: '问路场景' },
      { sentence: 'Ich lerne seit einem Jahr Deutsch.', phonetic: '/ɪç ˈlɛʁnə zaɪt ˈaɪnəm jaːɐ dɔʏtʃ/', meaning: '我学德语一年了。', grammar: 'seit + 第三格 表示持续时间', scene: '语言学习场景' },
    ],
    es: [
      { sentence: '¡Hola! ¿Cómo estás?', phonetic: '/ˈola ˈkomo esˈtas/', meaning: '你好！你好吗？', grammar: '疑问词 Cómo + estar 表示状态', scene: '日常问候场景' },
      { sentence: 'Quisiera un café, por favor.', phonetic: '/kiˈsjeɾa un kaˈfe poɾ faˈboɾ/', meaning: '我想要一杯咖啡，谢谢。', grammar: 'quisiera（querer 的虚拟式）表礼貌', scene: '点餐场景' },
      { sentence: '¿Dónde está la estación?', phonetic: '/ˈdonde esˈta la estaˈsjon/', meaning: '车站在哪里？', grammar: '疑问词 Dónde + estar + 定冠词', scene: '问路场景' },
      { sentence: 'Estoy aprendiendo español.', phonetic: '/esˈtoj apɾenˈdjendo espaˈɲol/', meaning: '我正在学西班牙语。', grammar: 'estar + gerundio 进行时结构', scene: '语言学习场景' },
    ],
  };

  // 标准化后匹配，默认用日语兜底（项目主推语言为日语）
  const lang = normalizeLanguage(language) || 'ja';
  const langPool = pool[lang] || pool['ja'];
  if (!langPool || langPool.length === 0) return [];

  // v1.1.0 修复：兜底句数必须满足按时长换算出的数量。
  // 本地句库容量有限时循环取用并标注轮次，保证"30分钟比10分钟题目更多"。
  const want = Math.max(1, Math.min(parseInt(count, 10) || 5, 100));
  const result = [];
  for (let i = 0; i < want; i++) {
    const base = langPool[i % langPool.length];
    const round = Math.floor(i / langPool.length);
    result.push(round === 0 ? { ...base } : { ...base, scene: `${base.scene}（复习第${round + 1}轮）` });
  }
  return result;
}

// v1.1.0：导出内部兜底生成器，供自测脚本直测（不改变对外路由行为）
practiceController.__generateFallbackSentences = generateFallbackSentences;

module.exports = practiceController;
