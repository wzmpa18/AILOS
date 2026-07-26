/**
 * src/services/onboardingService.js
 * 首次引导全链路服务 — 蓝图 Stage 2/3/4 合规实现
 *
 * 流程（蓝图 v2.0.0 第 4.2/4.3/4.4 节）：
 *   身份选择(个人/机构) → 选语言 → 自评级别 → 10题定级测试(6选择+2听力+2发音)
 *   → 后端权威评分评级 → 学习目标(考级/商务/生活) → AI伴读角色自定义
 *   → AI生成个性化30天学习计划
 *
 * 数据落库：
 *   UserIdentity / UserLearningLanguage / LearningProgress / LearningAbilityModel
 *   LearningGoal / LearningPlan / CompanionProfile / DailyLearningPlan
 *
 * 所有 AI 调用走 aiGateway（失败自动回退内置题库/规则生成，保证流程永不中断）
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const aiGateway = getAIGateway();

// ==================== 语言/级别体系 ====================

const LANGUAGE_LEVELS = {
  ja: ['N5', 'N4', 'N3', 'N2', 'N1'],
  en: ['A1', 'A2', 'B1', 'B2', 'C1'],
  ko: ['TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5'],
  fr: ['A1', 'A2', 'B1', 'B2', 'C1'],
  es: ['A1', 'A2', 'B1', 'B2', 'C1'],
  de: ['A1', 'A2', 'B1', 'B2', 'C1'],
  zh: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5'],
};

const LANGUAGE_NAMES = {
  ja: '日语', en: '英语', ko: '韩语', fr: '法语', es: '西班牙语', de: '德语', zh: '中文',
};

// 自评档位 → 级别数组下标
const SELF_LEVEL_INDEX = { zero: 0, beginner: 0, elementary: 1, intermediate: 2, advanced: 3 };

// 各语言权威教材（蓝图要求：各国指定/全网受欢迎教材）
const TEXTBOOKS = {
  ja: ['《新标准日本语》', '《大家的日语(みんなの日本語)》', '《GENKI》', 'JLPT官方真题'],
  en: ['《新概念英语》', '剑桥English in Use系列', '《Oxford Word Skills》', '雅思/托福官方指南'],
  ko: ['《延世韩国语》', '《首尔大学韩国语》', 'TOPIK官方真题'],
  fr: ['《你好！法语》', '《Alter Ego+》', '《Reflets走遍法国》', 'DELF/DALF官方教材'],
  es: ['《现代西班牙语》', '《Aula Internacional》', 'DELE官方指南'],
  de: ['《新求精德语强化教程》', '《Menschen》', '《Studio 21》', '歌德学院教材'],
  zh: ['《HSK标准教程》', '《发展汉语》', 'HSK官方大纲'],
};

// 学习方法论（全网大咖方法，蓝图要求）
const METHODOLOGIES = [
  '艾宾浩斯遗忘曲线间隔复习', '可理解性输入(Krashen i+1)', '影子跟读法(Shadowing)',
  '费曼输出法', '沉浸式情景学习', '语块记忆法(Chunking)',
];

// ==================== 内置定级题库（AI 不可用时兜底） ====================
// 每语言：6 选择 + 2 听力 + 2 发音（beginner 基准，高级别优先走 AI 生成）

const FALLBACK_BANKS = {
  ja: {
    choice: [
      { q: '"ありがとう" 的意思是？', opts: ['对不起', '谢谢', '早上好', '再见'], a: 1 },
      { q: '"水" 的日语读法是？', opts: ['みず', 'ひと', 'やま', 'かわ'], a: 0 },
      { q: '选出正确的助词：わたし__学生です。', opts: ['を', 'は', 'に', 'で'], a: 1 },
      { q: '"食べます" 的原形（辞书形）是？', opts: ['食べる', '食べた', '食べて', '食べない'], a: 0 },
      { q: '"きのう" 的意思是？', opts: ['今天', '明天', '昨天', '后天'], a: 2 },
      { q: '选出"去学校"的正确说法：', opts: ['学校を行きます', '学校に行きます', '学校が行きます', '学校は行きます'], a: 1 },
    ],
    listening: [
      { audio: 'おはようございます', q: '你听到的问候是什么时间用的？', opts: ['早上', '中午', '晚上', '睡前'], a: 0 },
      { audio: 'これはいくらですか', q: '说话人在问什么？', opts: ['时间', '价格', '地点', '名字'], a: 1 },
    ],
    speaking: [
      { ref: 'はじめまして、どうぞよろしくおねがいします', meaning: '初次见面，请多关照' },
      { ref: 'わたしはにほんごをべんきょうしています', meaning: '我正在学习日语' },
    ],
  },
  en: {
    choice: [
      { q: '"How are you?" 最自然的回答是？', opts: ['I am 20 years old.', "I'm fine, thanks.", 'My name is Tom.', 'Yes, I do.'], a: 1 },
      { q: '选择正确形式：She ___ to school every day.', opts: ['go', 'goes', 'going', 'gone'], a: 1 },
      { q: '"library" 的意思是？', opts: ['图书馆', '实验室', '餐厅', '车站'], a: 0 },
      { q: '选出正确的比较级：This book is ___ than that one.', opts: ['good', 'better', 'best', 'well'], a: 1 },
      { q: 'I have lived here ___ 2020.', opts: ['for', 'since', 'at', 'on'], a: 1 },
      { q: '"appointment" 最接近的意思是？', opts: ['约会/预约', '任命书', '失望', '装备'], a: 0 },
    ],
    listening: [
      { audio: 'Could you tell me the way to the station?', q: '说话人想知道什么？', opts: ['时间', '去车站的路', '票价', '天气'], a: 1 },
      { audio: 'I would like a cup of coffee, please.', q: '说话人想要什么？', opts: ['茶', '咖啡', '果汁', '水'], a: 1 },
    ],
    speaking: [
      { ref: 'Nice to meet you. I am learning English.', meaning: '很高兴认识你，我正在学英语' },
      { ref: 'Could you speak more slowly, please?', meaning: '请你说慢一点好吗' },
    ],
  },
  ko: {
    choice: [
      { q: '"감사합니다" 的意思是？', opts: ['对不起', '谢谢', '你好', '再见'], a: 1 },
      { q: '"물" 的意思是？', opts: ['火', '水', '山', '人'], a: 1 },
      { q: '选出正确的助词：저__ 학생입니다.', opts: ['는', '를', '에', '와'], a: 0 },
      { q: '"어제" 的意思是？', opts: ['今天', '明天', '昨天', '现在'], a: 2 },
      { q: '"먹다" 的敬语形式是？', opts: ['먹어요', '먹다요', '먹는다', '먹기'], a: 0 },
      { q: '"학교에 가요" 的意思是？', opts: ['在学校', '去学校', '从学校来', '喜欢学校'], a: 1 },
    ],
    listening: [
      { audio: '안녕하세요', q: '这句话是什么意思？', opts: ['你好', '再见', '谢谢', '对不起'], a: 0 },
      { audio: '이거 얼마예요?', q: '说话人在问什么？', opts: ['时间', '价格', '名字', '年龄'], a: 1 },
    ],
    speaking: [
      { ref: '만나서 반갑습니다', meaning: '很高兴认识你' },
      { ref: '저는 한국어를 공부하고 있어요', meaning: '我正在学习韩语' },
    ],
  },
  fr: {
    choice: [
      { q: '"Merci beaucoup" 的意思是？', opts: ['再见', '非常感谢', '不客气', '请'], a: 1 },
      { q: '选择正确形式：Je ___ étudiant.', opts: ['es', 'suis', 'est', 'sont'], a: 1 },
      { q: '"l\'eau" 的意思是？', opts: ['面包', '水', '牛奶', '酒'], a: 1 },
      { q: '"Comment vous appelez-vous ?" 在问什么？', opts: ['年龄', '名字', '国籍', '职业'], a: 1 },
      { q: '选出阴性定冠词：', opts: ['le', 'la', 'les', 'un'], a: 1 },
      { q: '"demain" 的意思是？', opts: ['昨天', '今天', '明天', '现在'], a: 2 },
    ],
    listening: [
      { audio: 'Bonjour, comment allez-vous ?', q: '说话人在做什么？', opts: ['问候', '道歉', '告别', '点菜'], a: 0 },
      { audio: "C'est combien ?", q: '说话人在问什么？', opts: ['价格', '时间', '地点', '天气'], a: 0 },
    ],
    speaking: [
      { ref: 'Enchanté, je m\'appelle Marie.', meaning: '很高兴认识你，我叫玛丽' },
      { ref: "J'apprends le français.", meaning: '我在学法语' },
    ],
  },
  es: {
    choice: [
      { q: '"Gracias" 的意思是？', opts: ['你好', '谢谢', '再见', '对不起'], a: 1 },
      { q: '选择正确形式：Yo ___ estudiante.', opts: ['es', 'soy', 'eres', 'son'], a: 1 },
      { q: '"agua" 的意思是？', opts: ['水', '面包', '肉', '茶'], a: 0 },
      { q: '"¿Cómo te llamas?" 在问什么？', opts: ['名字', '年龄', '住址', '爱好'], a: 0 },
      { q: '"mañana" 的意思是？', opts: ['昨天', '明天/早晨', '中午', '晚上'], a: 1 },
      { q: '选出"我想要一杯咖啡"：', opts: ['Quiero un café', 'Tengo un café', 'Soy un café', 'Hay un café'], a: 0 },
    ],
    listening: [
      { audio: 'Hola, buenos días', q: '这是什么时间的问候？', opts: ['早上', '下午', '晚上', '深夜'], a: 0 },
      { audio: '¿Cuánto cuesta?', q: '说话人在问什么？', opts: ['价格', '时间', '路线', '名字'], a: 0 },
    ],
    speaking: [
      { ref: 'Mucho gusto, me llamo Ana.', meaning: '很高兴认识你，我叫安娜' },
      { ref: 'Estoy aprendiendo español.', meaning: '我正在学西班牙语' },
    ],
  },
  de: {
    choice: [
      { q: '"Danke schön" 的意思是？', opts: ['请', '非常感谢', '再见', '早上好'], a: 1 },
      { q: '选择正确形式：Ich ___ Student.', opts: ['bist', 'bin', 'ist', 'sind'], a: 1 },
      { q: '"Wasser" 的意思是？', opts: ['水', '啤酒', '面包', '牛奶'], a: 0 },
      { q: '"Wie heißen Sie?" 在问什么？', opts: ['名字', '年龄', '职业', '国籍'], a: 0 },
      { q: '选出中性定冠词：', opts: ['der', 'die', 'das', 'den'], a: 2 },
      { q: '"morgen" 的意思是？', opts: ['昨天', '明天', '今天', '现在'], a: 1 },
    ],
    listening: [
      { audio: 'Guten Morgen, wie geht es Ihnen?', q: '说话人在做什么？', opts: ['早上问候', '晚间告别', '道歉', '点餐'], a: 0 },
      { audio: 'Was kostet das?', q: '说话人在问什么？', opts: ['价格', '时间', '地点', '姓名'], a: 0 },
    ],
    speaking: [
      { ref: 'Freut mich, ich heiße Anna.', meaning: '很高兴认识你，我叫安娜' },
      { ref: 'Ich lerne Deutsch.', meaning: '我在学德语' },
    ],
  },
  zh: {
    choice: [
      { q: '"谢谢" 用于什么场合？', opts: ['道歉', '感谢', '告别', '问路'], a: 1 },
      { q: '选出正确语序：', opts: ['我去明天北京', '我明天去北京', '明天北京我去', '去我北京明天'], a: 1 },
      { q: '"图书馆" 是做什么的地方？', opts: ['吃饭', '看书借书', '看病', '买东西'], a: 1 },
      { q: '"一杯咖啡" 中"杯"是？', opts: ['名词', '量词', '动词', '形容词'], a: 1 },
      { q: '"昨天" 指的是？', opts: ['today', 'tomorrow', 'yesterday', 'now'], a: 2 },
      { q: '选出正确的把字句：', opts: ['我把书看了', '我看把书了', '把我书看了', '书把我看了'], a: 0 },
    ],
    listening: [
      { audio: '你好，请问车站怎么走？', q: '说话人想知道什么？', opts: ['时间', '去车站的路', '价格', '天气'], a: 1 },
      { audio: '我想要一杯热水，谢谢。', q: '说话人想要什么？', opts: ['咖啡', '热水', '茶', '果汁'], a: 1 },
    ],
    speaking: [
      { ref: '很高兴认识你，请多关照。', meaning: 'Nice to meet you' },
      { ref: '我正在学习中文。', meaning: 'I am learning Chinese' },
    ],
  },
};

// ==================== 服务 ====================

class OnboardingService {
  // -------- 状态查询（断点续走） --------
  async getStatus(userId) {
    const [identity, langs, companion, planCount, goals, pref] = await Promise.all([
      prisma.userIdentity.findUnique({ where: { userId } }),
      prisma.userLearningLanguage.findMany({ where: { userId, status: 'active' }, orderBy: { priority: 'asc' } }),
      prisma.companionProfile.findUnique({ where: { userId } }),
      prisma.dailyLearningPlan.count({ where: { userId } }),
      prisma.learningGoal.findMany({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.userLanguagePreference.findUnique({ where: { userId } }),
    ]);
    const lang = langs[0] || null;
    const progress = lang
      ? await prisma.learningProgress.findUnique({ where: { userId_language: { userId, language: lang.languageCode } } })
      : null;
    const meta = identity?.metadata || {};
    return {
      identityType: identity?.identityType || null,
      language: lang ? { code: lang.languageCode, level: lang.level } : null,
      placementDone: !!(meta.placementResult) || !!progress,
      placementResult: meta.placementResult || null,
      assessedLevel: progress?.level || null,
      goal: goals[0] ? { goalType: goals[0].goalType, description: goals[0].description, targetLevel: goals[0].targetLevel } : null,
      companion: companion ? {
        name: companion.name, personality: companion.personality, voiceStyle: companion.voiceStyle,
        catchphrase: companion.catchphrase, greeting: companion.greeting, avatarEmoji: companion.avatarEmoji,
      } : null,
      planReady: planCount > 0,
      nativeLanguage: pref?.nativeLanguage || null,
      onboardingComplete: !!(identity && lang && progress && companion && planCount > 0),
    };
  }

  // -------- Step 1: 身份选择 --------
  async setIdentity(userId, identityType, orgName) {
    if (!['personal', 'teacher', 'school', 'enterprise'].includes(identityType)) {
      const err = new Error('identityType must be personal/teacher/school/enterprise');
      err.status = 400; throw err;
    }
    const identity = await prisma.userIdentity.upsert({
      where: { userId },
      update: { identityType, metadata: orgName ? { orgName } : undefined },
      create: { userId, identityType, metadata: orgName ? { orgName } : undefined },
    });
    return { identityType: identity.identityType };
  }

  // -------- Step 2: 选语言 + 自评级别 --------
  async setLanguage(userId, languageCode, selfLevel, nativeLanguage) {
    const result = {};
    if (languageCode) {
      if (!LANGUAGE_LEVELS[languageCode]) {
        const err = new Error(`Unsupported language: ${languageCode}. Supported: ${Object.keys(LANGUAGE_LEVELS).join(',')}`);
        err.status = 400; throw err;
      }
      const level = SELF_LEVEL_INDEX[selfLevel] !== undefined ? selfLevel : 'zero';
      // 仅保留单一 active 目标语言：先停用其余 active 记录，避免 resolve() findFirst 命中旧语言导致“改了不生效”
      await prisma.userLearningLanguage.updateMany({
        where: { userId, status: 'active', NOT: { languageCode } },
        data: { status: 'inactive' },
      });
      await prisma.userLearningLanguage.upsert({
        where: { userId_languageCode: { userId, languageCode } },
        update: { level, status: 'active', priority: 0 },
        create: { userId, languageCode, level, status: 'active', priority: 0 },
      });
      result.languageCode = languageCode;
      result.selfLevel = level;
      result.languageName = LANGUAGE_NAMES[languageCode];
    }
    if (nativeLanguage) {
      await prisma.userLanguagePreference.upsert({
        where: { userId },
        update: { nativeLanguage, defaultExplanationLanguage: nativeLanguage },
        create: { userId, nativeLanguage, defaultExplanationLanguage: nativeLanguage },
      });
      result.nativeLanguage = nativeLanguage;
    }
    return result;
  }

  // -------- Step 3: 定级测试出题（6选择+2听力+2发音） --------
  async startPlacement(userId, languageCode, selfLevel) {
    const lang = languageCode || (await this._getActiveLanguage(userId));
    if (!FALLBACK_BANKS[lang]) { const err = new Error('Unsupported language'); err.status = 400; throw err; }
    const level = selfLevel || 'zero';

    let questions = null;
    // 优先 AI 出题（按自评级别定难度）
    try {
      questions = await this._aiGenerateQuestions(userId, lang, level);
    } catch (e) {
      logger.warn('AI placement generation failed, using fallback bank', { userId, lang, error: e.message });
    }
    if (!questions) questions = this._bankQuestions(lang);

    // 服务端保存含答案的题目会话（前端只拿无答案版本）
    await this._saveSession(userId, { languageCode: lang, selfLevel: level, questions, startedAt: new Date().toISOString() });

    const clientQuestions = questions.map((q) => {
      const { correctIndex, ...rest } = q;
      return rest;
    });
    return { languageCode: lang, total: clientQuestions.length, questions: clientQuestions };
  }

  // -------- Step 4: 提交答案 → 权威评分评级 --------
  async submitPlacement(userId, answers) {
    const session = await this._loadSession(userId);
    if (!session || !session.questions) {
      const err = new Error('No placement session. Call /placement/start first.');
      err.status = 400; throw err;
    }
    const { languageCode, selfLevel, questions } = session;
    const ansMap = {};
    (answers || []).forEach((a) => { ansMap[a.id] = a; });

    let objScore = 0, objTotal = 0, listenScore = 0, listenTotal = 0, speakScore = 0, speakTotal = 0;
    const details = [];

    for (const q of questions) {
      const a = ansMap[q.id] || {};
      if (q.type === 'choice' || q.type === 'listening') {
        const correct = a.selectedIndex === q.correctIndex;
        const pts = correct ? 10 : 0;
        if (q.type === 'choice') { objScore += pts; objTotal += 10; } else { listenScore += pts; listenTotal += 10; }
        details.push({ id: q.id, type: q.type, correct, correctIndex: q.correctIndex, selectedIndex: a.selectedIndex ?? null });
      } else if (q.type === 'speaking') {
        speakTotal += 10;
        let pts;
        if (a.skipped || !a.transcript) {
          pts = 5; // 环境不支持语音识别 → 中性分
          details.push({ id: q.id, type: 'speaking', skipped: true, score: pts });
        } else {
          const sim = this._similarity(a.transcript, q.referenceText);
          pts = Math.round(sim * 10);
          details.push({ id: q.id, type: 'speaking', transcript: a.transcript, similarity: Number(sim.toFixed(2)), score: pts });
        }
        speakScore += pts;
      }
    }

    const totalScore = objScore + listenScore + speakScore;
    const maxScore = objTotal + listenTotal + speakTotal; // 100
    const pct = maxScore > 0 ? totalScore / maxScore : 0;

    // 评级：自评基准 ± 表现修正
    const levels = LANGUAGE_LEVELS[languageCode];
    let idx = SELF_LEVEL_INDEX[selfLevel] ?? 0;
    if (pct >= 0.85) idx += 1;
    else if (pct < 0.4) idx -= 1;
    idx = Math.max(0, Math.min(levels.length - 1, idx));
    const assessedLevel = levels[idx];

    // 落库：LearningProgress（权威级别） + 四维能力模型
    const dims = [
      { dimension: 'vocabulary', score: objTotal ? Math.round((objScore / objTotal) * 100) : 0 },
      { dimension: 'grammar', score: objTotal ? Math.round((objScore / objTotal) * 100) : 0 },
      { dimension: 'listening', score: listenTotal ? Math.round((listenScore / listenTotal) * 100) : 0 },
      { dimension: 'speaking', score: speakTotal ? Math.round((speakScore / speakTotal) * 100) : 0 },
    ];
    await prisma.$transaction([
      prisma.learningProgress.upsert({
        where: { userId_language: { userId, language: languageCode } },
        update: { level: assessedLevel },
        create: { userId, language: languageCode, level: assessedLevel },
      }),
      ...dims.map((d) => prisma.learningAbilityModel.upsert({
        where: { userId_languageCode_dimension: { userId, languageCode, dimension: d.dimension } },
        update: { score: d.score, level: assessedLevel, data: { source: 'placement' } },
        create: { userId, languageCode, dimension: d.dimension, score: d.score, level: assessedLevel, data: { source: 'placement' } },
      })),
      prisma.userLearningLanguage.update({
        where: { userId_languageCode: { userId, languageCode } },
        data: { level: assessedLevel },
      }),
    ]);

    const result = {
      languageCode, totalScore, maxScore, percent: Math.round(pct * 100), assessedLevel,
      dimensions: dims,
      recommendation: this._recommendation(languageCode, assessedLevel, dims),
      details,
    };
    // 保存结果 & 清除会话
    await this._saveSession(userId, null, result);
    return result;
  }

  // -------- Step 5: 学习目标 --------
  async setGoal(userId, goalType, description) {
    const valid = ['exam_prep', 'business', 'daily_life', 'travel', 'interest', 'language_proficiency'];
    const gt = valid.includes(goalType) ? goalType : 'language_proficiency';
    const lang = await this._getActiveLanguage(userId);
    const progress = await prisma.learningProgress.findUnique({
      where: { userId_language: { userId, language: lang } },
    });
    const levels = LANGUAGE_LEVELS[lang];
    const curIdx = Math.max(0, levels.indexOf(progress?.level || levels[0]));
    const targetLevel = levels[Math.min(levels.length - 1, curIdx + 1)];

    // 归档旧目标，创建新目标
    await prisma.learningGoal.updateMany({
      where: { userId, targetLanguage: lang, status: 'active' },
      data: { status: 'archived' },
    });
    const goal = await prisma.learningGoal.create({
      data: { userId, goalType: gt, targetLanguage: lang, targetLevel, description: description || null },
    });
    return { goalId: goal.id, goalType: gt, targetLanguage: lang, targetLevel };
  }

  // -------- Step 6: AI 伴读角色构建 --------
  async buildCompanion(userId, description, name) {
    if (!description || description.trim().length < 2) {
      const err = new Error('description is required'); err.status = 400; throw err;
    }
    const lang = await this._getActiveLanguage(userId).catch(() => 'ja');
    let profile = null;
    try {
      profile = await this._aiBuildCompanion(userId, description, name, lang);
    } catch (e) {
      logger.warn('AI companion build failed, using rule-based fallback', { userId, error: e.message });
    }
    if (!profile) profile = this._fallbackCompanion(description, name);

    const systemPrompt = `你是用户的AI学习搭子「${profile.name}」。性格：${profile.personality}。声音风格：${profile.voiceStyle}。口头禅：「${profile.catchphrase}」。你陪伴用户学习${LANGUAGE_NAMES[lang] || lang}，始终保持角色人设，用鼓励和陪伴感帮助用户坚持学习。回复口语化、亲切，偶尔自然地使用口头禅。`;

    const saved = await prisma.companionProfile.upsert({
      where: { userId },
      update: {
        name: profile.name, description, personality: profile.personality, voiceStyle: profile.voiceStyle,
        catchphrase: profile.catchphrase, greeting: profile.greeting, avatarEmoji: profile.avatarEmoji, systemPrompt,
      },
      create: {
        userId, name: profile.name, description, personality: profile.personality, voiceStyle: profile.voiceStyle,
        catchphrase: profile.catchphrase, greeting: profile.greeting, avatarEmoji: profile.avatarEmoji, systemPrompt,
      },
    });
    return {
      name: saved.name, personality: saved.personality, voiceStyle: saved.voiceStyle,
      catchphrase: saved.catchphrase, greeting: saved.greeting, avatarEmoji: saved.avatarEmoji,
    };
  }

  async getCompanion(userId) {
    const c = await prisma.companionProfile.findUnique({ where: { userId } });
    if (!c) return null;
    return {
      name: c.name, personality: c.personality, voiceStyle: c.voiceStyle,
      catchphrase: c.catchphrase, greeting: c.greeting, avatarEmoji: c.avatarEmoji, systemPrompt: c.systemPrompt,
    };
  }

  // -------- Step 7: 生成个性化30天学习计划 --------
  async generatePlan(userId, focusDescription) {
    const lang = await this._getActiveLanguage(userId);
    const [progress, goals] = await Promise.all([
      prisma.learningProgress.findUnique({ where: { userId_language: { userId, language: lang } } }),
      prisma.learningGoal.findMany({ where: { userId, targetLanguage: lang, status: 'active' }, orderBy: { createdAt: 'desc' }, take: 1 }),
    ]);
    const level = progress?.level || LANGUAGE_LEVELS[lang][0];
    const goal = goals[0] || null;

    let days = null;
    try {
      days = await this._aiGeneratePlan(userId, lang, level, goal, focusDescription);
    } catch (e) {
      logger.warn('AI plan generation failed, using rule-based fallback', { userId, error: e.message });
    }
    if (!days) days = this._fallbackPlan(lang, level, goal, focusDescription);

    // 覆盖式写入 DailyLearningPlan（30 行）
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = days.slice(0, 30).map((d, i) => ({
      userId,
      dayNumber: i + 1,
      planDate: new Date(today.getTime() + i * 86400000),
      targetLanguage: lang,
      focusArea: d.focusArea || 'vocabulary',
      scene: d.scene || 'social',
      duration: d.duration || 30,
      tasks: d.tasks || [],
      contentSnapshot: { title: d.title || `第${i + 1}天`, phase: d.phase || '', textbookRef: d.textbookRef || '', method: d.method || '' },
      status: 'pending',
    }));
    await prisma.$transaction([
      prisma.dailyLearningPlan.deleteMany({ where: { userId } }),
      prisma.dailyLearningPlan.createMany({ data: rows }),
    ]);

    // 关联 LearningPlan 记录（蓝图数据链：Goal → Plan）
    if (goal) {
      await prisma.learningPlan.create({
        data: {
          goalId: goal.id, userId, planType: 'daily',
          schedule: { days: 30, startDate: today.toISOString().slice(0, 10) },
          content: { focusDescription: focusDescription || '', generatedDays: rows.length },
        },
      });
    }

    return {
      totalDays: rows.length,
      startDate: today.toISOString().slice(0, 10),
      language: lang,
      level,
      overview: rows.slice(0, 7).map((r) => ({
        day: r.dayNumber, title: r.contentSnapshot.title, focusArea: r.focusArea, scene: r.scene, duration: r.duration,
      })),
      textbooks: TEXTBOOKS[lang],
    };
  }

  // ==================== AI 生成器 ====================

  async _aiGenerateQuestions(userId, lang, selfLevel) {
    const levelDesc = { zero: '零基础', beginner: '初级', elementary: '初中级', intermediate: '中级', advanced: '高级' }[selfLevel] || '零基础';
    const prompt = `请为${levelDesc}的${LANGUAGE_NAMES[lang]}学习者出10道定级测试题，返回严格JSON（不要任何多余文字）：
{"choice":[{"q":"题干(中文)","opts":["4个选项"],"a":正确下标0-3}](6道选择题，考察词汇和语法),
"listening":[{"audio":"一句${LANGUAGE_NAMES[lang]}原文(将被朗读)","q":"关于这句话的中文问题","opts":["4个中文选项"],"a":正确下标}](2道),
"speaking":[{"ref":"一句${LANGUAGE_NAMES[lang]}朗读句","meaning":"中文意思"}](2道)}`;
    const resp = await aiGateway.chatWithMessages(
      [{ role: 'user', content: prompt }],
      { userId, scene: 'chat', temperature: 0.5, maxTokens: 2000 },
    );
    const json = this._extractJson(resp.content);
    if (!json || !Array.isArray(json.choice) || json.choice.length < 6
      || !Array.isArray(json.listening) || json.listening.length < 2
      || !Array.isArray(json.speaking) || json.speaking.length < 2) return null;
    return this._normalizeQuestions({ choice: json.choice.slice(0, 6), listening: json.listening.slice(0, 2), speaking: json.speaking.slice(0, 2) }, lang);
  }

  _bankQuestions(lang) {
    return this._normalizeQuestions(FALLBACK_BANKS[lang], lang);
  }

  _normalizeQuestions(bank, lang) {
    const out = [];
    bank.choice.forEach((c, i) => out.push({
      id: `c${i + 1}`, type: 'choice', question: c.q, options: c.opts, correctIndex: c.a,
    }));
    bank.listening.forEach((l, i) => out.push({
      id: `l${i + 1}`, type: 'listening', question: l.q, options: l.opts, correctIndex: l.a, audioText: l.audio, lang,
    }));
    bank.speaking.forEach((s, i) => out.push({
      id: `s${i + 1}`, type: 'speaking', referenceText: s.ref, meaning: s.meaning, lang,
    }));
    return out;
  }

  async _aiBuildCompanion(userId, description, name, lang) {
    const prompt = `用户想要一个AI学习搭子，描述如下：「${description}」${name ? `，希望名字叫「${name}」` : ''}。
请根据描述提炼角色设定，返回严格JSON（不要任何多余文字）：
{"name":"名字","personality":"性格特征(30字内)","voiceStyle":"声音风格(如温柔女声/元气少年音)","catchphrase":"口头禅(一句)","greeting":"角色第一次见面对用户说的话(带人设感,50字内)","avatarEmoji":"一个最符合角色的emoji"}`;
    const resp = await aiGateway.chatWithMessages(
      [{ role: 'user', content: prompt }],
      { userId, scene: 'chat', temperature: 0.8, maxTokens: 500 },
    );
    const json = this._extractJson(resp.content);
    if (!json || !json.name || !json.personality) return null;
    return {
      name: String(json.name).slice(0, 20),
      personality: String(json.personality).slice(0, 100),
      voiceStyle: String(json.voiceStyle || '自然亲切').slice(0, 50),
      catchphrase: String(json.catchphrase || '一起加油吧！').slice(0, 50),
      greeting: String(json.greeting || '').slice(0, 200),
      avatarEmoji: String(json.avatarEmoji || '🤖').slice(0, 8),
    };
  }

  _fallbackCompanion(description, name) {
    const d = description || '';
    const gentle = /温柔|软|治愈|姐姐|安静/.test(d);
    const energetic = /元气|活泼|阳光|开朗|少年|运动/.test(d);
    const strict = /严格|督促|自律|狠/.test(d);
    let personality = '亲切耐心，善于鼓励';
    let voiceStyle = '自然亲切';
    let catchphrase = '一起加油吧！';
    let avatarEmoji = '🤖';
    if (gentle) { personality = '温柔治愈，说话轻声细语，总是耐心倾听'; voiceStyle = '温柔女声'; catchphrase = '慢慢来，我陪着你～'; avatarEmoji = '🌸'; }
    else if (energetic) { personality = '元气满满，充满活力，永远给你打气'; voiceStyle = '元气少年音'; catchphrase = '冲鸭！今天也要满分！'; avatarEmoji = '⚡'; }
    else if (strict) { personality = '严格自律，目标感强，会督促你完成每日任务'; voiceStyle = '沉稳有力'; catchphrase = '今日事今日毕。'; avatarEmoji = '🎯'; }
    return {
      name: name || (gentle ? '小樱' : energetic ? '阿光' : strict ? '教官' : '小言'),
      personality, voiceStyle, catchphrase,
      greeting: `你好呀，我是你的学习搭子${name || ''}！从今天开始我会一直陪着你学习，${catchphrase}`,
      avatarEmoji,
    };
  }

  async _aiGeneratePlan(userId, lang, level, goal, focusDescription) {
    const goalDesc = goal ? `学习目标：${{ exam_prep: '考级备考', business: '商务应用', daily_life: '生活交流', travel: '旅行', interest: '兴趣爱好', language_proficiency: '综合提升' }[goal.goalType] || goal.goalType}${goal.description ? `（${goal.description}）` : ''}，目标级别 ${goal.targetLevel}` : '';
    const prompt = `为一名${LANGUAGE_NAMES[lang]}水平${level}的学习者制定30天个性化学习计划。${goalDesc}。
${focusDescription ? `用户重点学习方向：「${focusDescription}」。` : ''}
参考权威教材：${TEXTBOOKS[lang].join('、')}；融合学习方法：${METHODOLOGIES.join('、')}。
返回严格JSON数组（30个元素，不要任何多余文字）：
[{"day":1,"title":"当日主题","phase":"阶段名","focusArea":"listening|speaking|vocabulary|grammar","scene":"shopping|dining|travel|medical|housing|social","duration":30,"textbookRef":"对应教材章节","method":"使用的学习方法","tasks":[{"type":"vocabulary|speaking|listening|grammar|dialogue","description":"任务描述","count":10}]}]`;
    const resp = await aiGateway.chatWithMessages(
      [{ role: 'user', content: prompt }],
      { userId, scene: 'chat', temperature: 0.6, maxTokens: 8000 },
    );
    const json = this._extractJson(resp.content);
    if (!Array.isArray(json) || json.length < 10) return null;
    // 不足30天则循环补齐
    const days = [];
    for (let i = 0; i < 30; i++) days.push(json[i] || { ...json[i % json.length], day: i + 1 });
    return days;
  }

  _fallbackPlan(lang, level, goal, focusDescription) {
    const focusAreas = ['vocabulary', 'grammar', 'listening', 'speaking'];
    const scenes = ['social', 'dining', 'shopping', 'travel', 'housing', 'medical'];
    const phases = [
      { name: '打牢基础', range: [1, 10] },
      { name: '场景应用', range: [11, 20] },
      { name: '综合实战', range: [21, 30] },
    ];
    const books = TEXTBOOKS[lang];
    const goalTag = goal ? ({ exam_prep: '考级冲刺', business: '商务实战', daily_life: '生活会话', travel: '旅行应急', interest: '兴趣拓展' }[goal.goalType] || '综合提升') : '综合提升';
    const days = [];
    for (let i = 1; i <= 30; i++) {
      const phase = phases.find((p) => i >= p.range[0] && i <= p.range[1]);
      const focusArea = focusAreas[(i - 1) % focusAreas.length];
      const scene = scenes[(i - 1) % scenes.length];
      days.push({
        day: i,
        title: `第${i}天 · ${phase.name} · ${goalTag}`,
        phase: phase.name,
        focusArea,
        scene,
        duration: 30,
        textbookRef: `${books[(i - 1) % books.length]} 对应${level}章节`,
        method: METHODOLOGIES[(i - 1) % METHODOLOGIES.length],
        tasks: [
          { type: 'vocabulary', description: `${level}核心词汇学习`, count: 10 },
          { type: focusArea, description: `${phase.name}·${focusArea}专项训练${focusDescription ? `（侧重：${focusDescription.slice(0, 30)}）` : ''}`, count: 5 },
          { type: 'dialogue', description: `${scene}场景对话练习`, count: 1 },
        ],
      });
    }
    return days;
  }

  // ==================== 工具方法 ====================

  async _getActiveLanguage(userId) {
    const lang = await prisma.userLearningLanguage.findFirst({
      where: { userId, status: 'active' }, orderBy: { priority: 'asc' },
    });
    if (!lang) { const err = new Error('No learning language set. Call /onboarding/language first.'); err.status = 400; throw err; }
    return lang.languageCode;
  }

  async _saveSession(userId, session, placementResult) {
    const identity = await prisma.userIdentity.findUnique({ where: { userId } });
    const meta = { ...(identity?.metadata || {}) };
    if (session === null) delete meta.placementSession; else if (session) meta.placementSession = session;
    if (placementResult) {
      meta.placementResult = {
        assessedLevel: placementResult.assessedLevel, percent: placementResult.percent,
        totalScore: placementResult.totalScore, at: new Date().toISOString(),
      };
    }
    await prisma.userIdentity.upsert({
      where: { userId },
      update: { metadata: meta },
      create: { userId, identityType: 'personal', metadata: meta },
    });
  }

  async _loadSession(userId) {
    const identity = await prisma.userIdentity.findUnique({ where: { userId } });
    return identity?.metadata?.placementSession || null;
  }

  _recommendation(languageCode, level, dims) {
    const weakest = dims.reduce((min, d) => (d.score < min.score ? d : min), dims[0]);
    const dimName = { vocabulary: '词汇', grammar: '语法', listening: '听力', speaking: '口语' }[weakest.dimension];
    return `你的${LANGUAGE_NAMES[languageCode]}水平评定为 ${level}。当前最需要加强的是${dimName}（${weakest.score}分）。推荐教材：${TEXTBOOKS[languageCode].slice(0, 2).join('、')}，建议每天投入30分钟，重点做${dimName}专项训练。`;
  }

  _extractJson(content) {
    if (!content) return null;
    if (typeof content === 'object') return content;
    const text = String(content);
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidates = [fence && fence[1], text.match(/(\[[\s\S]*\])/)?.[1], text.match(/(\{[\s\S]*\})/)?.[1]];
    for (const c of candidates) {
      if (!c) continue;
      try { return JSON.parse(c); } catch (e) { /* try next */ }
    }
    return null;
  }

  _similarity(a, b) {
    const na = this._norm(a); const nb = this._norm(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    const dist = this._levenshtein(na, nb);
    return Math.max(0, 1 - dist / Math.max(na.length, nb.length));
  }

  _norm(s) {
    return String(s || '').toLowerCase().replace(/[\s\u3000。、．，,.!！?？'"「」『』:：;；\-～~]/g, '');
  }

  _levenshtein(a, b) {
    const m = a.length; const n = b.length;
    if (m === 0) return n; if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
}

let _instance = null;
function getOnboardingService() {
  if (!_instance) _instance = new OnboardingService();
  return _instance;
}

module.exports = { OnboardingService, getOnboardingService };
