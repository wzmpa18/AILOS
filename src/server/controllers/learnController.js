/**
 * src/server/controllers/learnController.js
 * 学习内容 API 控制器
 *
 * 职责：
 * - GET /api/learn/content?language={lang}&type={type}&level={level}
 *   获取学习内容（优先从资产库读取，无则走 AI 生成）
 *
 * 策略：
 * 1. 先查 learningContent 资产库（已发布内容）
 * 2. 资产库无匹配内容时，走 AI Gateway 生成
 * 3. AI 生成的内容自动落库为 LearningContent 资产
 * 4. 所有 AI 调用走 aiGateway，并受成本熔断器保护
 */
const { getAIGateway } = require('../../services/aiGateway');
const { getCostCircuitBreaker } = require('../../services/costCircuitBreaker');
const contextResolver = require('../../services/contextResolver'); // P2-T1: 双语言配置唯一真值源
const logger = require('../../utils/logger');
const prisma = require('../../config/database');

// P2-T1: 解释/说明语言强制从库解析；游客/无配置回落系统固定上下文（非用户可篡改维度）
async function resolveExplanationLanguage(userId) {
  try {
    return (await contextResolver.resolve(userId)).explanationLanguage;
  } catch (e) {
    return 'zh-CN'; // 系统固定上下文（游客/无配置）
  }
}

// ==================== 内容类型映射 ====================

/**
 * 前端类型 -> 数据库 contentType
 */
const CONTENT_TYPE_MAP = {
  vocab: 'vocabulary',
  grammar: 'grammar',
  reading: 'reading',
  listening: 'listening',
  quiz: 'quiz',
  lesson: 'lesson',
  course: 'course',
};


/**
 * 每种内容类型的默认数量
 */
const DEFAULT_COUNT = {
  vocab: 10,
  grammar: 8,
  reading: 6,
  listening: 8,
  quiz: 5,
  lesson: 5,
  course: 1,
};

// ==================== AI Prompt 构建 ====================

/**
 * 构建不同内容类型的 AI 生成 Prompt
 */
function buildContentPrompt(language, type, level, count) {
  const languageNames = {
    en: '英语', ja: '日语', ko: '韩语', fr: '法语', es: '西班牙语', de: '德语',
    zh: '中文',
  };
  const langName = languageNames[language] || language;

  const prompts = {
    vocab: `你是一个专业的${langName}词汇教学专家。请为${level}水平的学习者生成${count}个核心词汇。

【输出格式】返回严格 JSON 数组：
[
  {
    "id": "v1",
    "word": "${langName}单词",
    "phonetic": "音标/读音",
    "meaning": "中文含义",
    "example": "包含该单词的${langName}例句，附中文翻译"
  }
]

要求：
- 难度适配 ${level} 水平
- 单词为常用核心词汇
- 例句简短实用
- 只返回 JSON 数组，不要包含其他文字。`,

    grammar: `你是一个专业的${langName}语法教学专家。请为${level}水平的学习者生成${count}个语法点。

【输出格式】返回严格 JSON 数组：
[
  {
    "id": "g1",
    "word": "语法点名称（${langName}）",
    "phonetic": "句型结构/公式",
    "meaning": "中文语法解释",
    "example": "${langName}例句，附中文翻译"
  }
]

要求：
- 语法点递进合理，由浅入深
- 例句清晰展示语法规则
- 只返回 JSON 数组，不要包含其他文字。`,

    reading: `你是一个专业的${langName}阅读教学专家。请为${level}水平的学习者生成${count}篇阅读文章。

【输出格式】返回严格 JSON 数组：
[
  {
    "id": "r1",
    "word": "文章标题（${langName}）",
    "phonetic": "难度级别",
    "meaning": "中文标题翻译",
    "example": "${langName}原文（中等长度），附中文翻译"
  }
]

要求：
- 文章主题贴近日常生活
- 语言难度适配 ${level} 水平
- 文章长度适中（beginner: 50-150词, intermediate: 150-350词, advanced: 300-600词）
- 只返回 JSON 数组，不要包含其他文字。`,

    listening: `你是一个专业的${langName}听力教学专家。请为${level}水平的学习者生成${count}段听力材料。

【输出格式】返回严格 JSON 数组：
[
  {
    "id": "l1",
    "word": "听力标题（${langName}）",
    "phonetic": "难度 - 时长",
    "meaning": "中文标题翻译",
    "example": "[Audio] ${langName}听力脚本全文，附中文翻译"
  }
]

要求：
- 场景真实自然（对话/独白/通知等）
- 语速和词汇适配 ${level} 水平
- 脚本长度适中（beginner: 30-80词, intermediate: 80-200词, advanced: 150-350词）
- 只返回 JSON 数组，不要包含其他文字。`,
  };

  return prompts[type] || prompts.vocab;
}

/**
 * 将 AI 生成的原始内容转换为前端统一格式
 */
function normalizeContentItems(items, type) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    id: item.id || `${type[0]}${index + 1}`,
    word: item.word || item.title || '',
    phonetic: item.phonetic || item.level || '',
    meaning: item.meaning || item.description || '',
    example: item.example || item.content || '',
    // 保留原始数据中的额外字段
    ...(item.options && { options: item.options }),
    ...(item.correctAnswer && { correctAnswer: item.correctAnswer }),
    ...(item.explanation && { explanation: item.explanation }),
  }));
}

/**
 * 将 AI 生成的内容保存到 learningContent 资产库
 */
async function saveToAssetLibrary({ language, type, level, items, sourceType = 'AI_GENERATED' }) {
  try {
    const contentType = CONTENT_TYPE_MAP[type] || type;
    const record = await prisma.learningContent.create({
      data: {
        contentType,
        sourceType,
        sourceLanguage: language,
        targetLanguage: language,
        explanationLanguage: 'zh-CN',
        difficultyLevel: level || 'beginner',
        contentVersion: '1.0.0',
        status: 'published',
        contentData: {
          items,
          generatedAt: new Date().toISOString(),
          language,
          type,
          level,
        },
        qualityScore: 70,
        reuseCount: 0,
      },
    });
    logger.log(`LearnController: 内容已落库 | id=${record.id} | type=${type} | count=${items.length}`);
    return record;
  } catch (error) {
    logger.error('LearnController: 内容落库失败', error.message);
    return null;
  }
}

// ==================== 控制器方法 ====================

const learnController = {
  /**
   * GET /api/learn/content?language={lang}&type={type}&level={level}
   *
   * 获取学习内容：
   * 1. 优先从 learningContent 资产库读取已发布内容
   * 2. 资产库无匹配内容时，走 AI 生成
   * 3. AI 生成内容自动落库
   */
  async getContent(req, res, next) {
    try {
      const { language, type, level } = req.query;

      // 参数校验
      if (!language) {
        return res.status(400).json({ success: false, error: '缺少 language 参数' });
      }
      if (!type) {
        return res.status(400).json({
          success: false,
          error: '缺少 type 参数',
          supportedTypes: Object.keys(CONTENT_TYPE_MAP),
        });
      }
      if (!CONTENT_TYPE_MAP[type]) {
        return res.status(400).json({
          success: false,
          error: `不支持的内容类型: ${type}`,
          supportedTypes: Object.keys(CONTENT_TYPE_MAP),
        });
      }

      const lvl = level || 'beginner';
      const contentType = CONTENT_TYPE_MAP[type];
      const defaultCount = DEFAULT_COUNT[type] || 10;

      // ===== Step 1: 从资产库查询 =====
      try {
        const cachedItems = await prisma.learningContent.findMany({
          where: {
            status: 'published',
            targetLanguage: language,
            contentType,
            difficultyLevel: lvl,
          },
          orderBy: { qualityScore: 'desc' },
          take: 3,
          select: {
            id: true,
            contentType: true,
            sourceType: true,
            difficultyLevel: true,
            qualityScore: true,
            contentData: true,
            createdAt: true,
          },
        });

        if (cachedItems.length > 0) {
          // 资产库命中，提取内容
          const allItems = [];
          for (const cached of cachedItems) {
            const data = cached.contentData;
            if (data && data.items && Array.isArray(data.items)) {
              allItems.push(...data.items);
            }
          }

          if (allItems.length >= defaultCount) {
            // 更新复用计数
            for (const cached of cachedItems) {
              prisma.learningContent.update({
                where: { id: cached.id },
                data: { reuseCount: { increment: 1 } },
              }).catch(() => {});
            }

            const normalizedItems = normalizeContentItems(allItems.slice(0, defaultCount), type);
            logger.log(
              `LearnController: 资产库命中 | language=${language} | type=${type} | count=${normalizedItems.length}`
            );

            return res.json({
              success: true,
              source: 'asset',
              language,
              type,
              level: lvl,
              total: normalizedItems.length,
              items: normalizedItems,
            });
          }
        }
      } catch (cacheError) {
        logger.warn('LearnController: 资产库查询失败，走 AI 生成', cacheError.message);
      }

      // ===== Step 2: 资产库无匹配，走 AI 生成 =====
      const userId = req.userId || 'guest';
      // P2-T1: 解释语言从库解析（游客回落系统固定上下文）
      const explanationLanguage = await resolveExplanationLanguage(userId);

      // 使用成本熔断器保护
      const circuitBreaker = getCostCircuitBreaker();
      const { result: breakerResult, source, quotaStatus } = await circuitBreaker.withCircuitBreaker(
        {
          userId,
          targetLanguage: language,
          contentType,
          difficultyLevel: lvl,
          language: explanationLanguage,
        },
        async () => {
          // 构建 AI Prompt
          const systemPrompt = buildContentPrompt(language, type, lvl, defaultCount);

          // 调用 AI Gateway
          const aiGateway = getAIGateway();
          const aiResult = await aiGateway.chatWithMessages(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请为${language}语言生成${defaultCount}条${type}学习内容，难度为${lvl}。` },
            ],
            {
              userId,
              temperature: 0.7,
              maxTokens: 2048,
              // P2-T1: 不传 languageContext，aiGateway 强制从库解析（忽略传入），取消 'zh-CN' 静默默认
              scene: 'lesson_generate',
            }
          );

          // 解析 AI 响应
          let items;
          try {
            const cleaned = aiResult.content
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            items = JSON.parse(cleaned);
          } catch (e) {
            // 尝试提取 JSON 数组
            const match = aiResult.content.match(/\[[\s\S]*\]/);
            if (match) {
              items = JSON.parse(match[0]);
            } else {
              // 最终回退：返回降级内容
              items = [{
                id: `${type[0]}1`,
                word: '学习内容',
                phonetic: lvl,
                meaning: '系统正在准备内容，请稍后重试',
                example: aiResult.content.slice(0, 300),
              }];
            }
          }

          const normalizedItems = normalizeContentItems(
            Array.isArray(items) ? items : [items],
            type
          );

          // 异步落库（不阻塞响应）
          saveToAssetLibrary({
            language,
            type,
            level: lvl,
            items: normalizedItems,
            sourceType: 'AI_GENERATED',
          }).catch(() => {});

          return {
            items: normalizedItems,
            total: normalizedItems.length,
            usage: aiResult.usage,
            model: aiResult.model,
          };
        }
      );

      // 处理熔断/降级场景
      if (source === 'cache' || source === 'degradation') {
        // 从缓存中提取内容
        const cachedItems = breakerResult.items || [];
        let normalizedItems = [];
        if (cachedItems.length > 0) {
          const allContentItems = [];
          for (const cached of cachedItems) {
            const data = cached.contentData;
            if (data && data.items && Array.isArray(data.items)) {
              allContentItems.push(...data.items);
            } else if (data && Array.isArray(data)) {
              allContentItems.push(...data);
            }
          }
          normalizedItems = normalizeContentItems(allContentItems.slice(0, defaultCount), type);
        }

        return res.json({
          success: true,
          source,
          language,
          type,
          level: lvl,
          total: normalizedItems.length,
          items: normalizedItems,
          degradeMessage: breakerResult.degradeMessage || '',
          quotaStatus: quotaStatus ? {
            level: quotaStatus.level,
            remaining: quotaStatus.remaining,
            dailyTotal: quotaStatus.dailyTotal,
          } : null,
        });
      }

      // AI 正常生成
      return res.json({
        success: true,
        source: 'ai',
        language,
        type,
        level: lvl,
        total: breakerResult.total,
        items: breakerResult.items,
        usage: breakerResult.usage,
        model: breakerResult.model,
        quotaStatus: quotaStatus ? {
          level: quotaStatus.level,
          remaining: quotaStatus.remaining,
          dailyTotal: quotaStatus.dailyTotal,
        } : null,
      });
    } catch (error) {
      logger.error('LearnController.getContent 失败:', error.message);
      next(error);
    }
  },

  /**
   * GET /api/learn/config
   * 返回可用的学习内容配置（供前端参考）
   */
  getLearnConfig(req, res) {
    res.json({
      success: true,
      contentTypes: Object.keys(CONTENT_TYPE_MAP).map((key) => ({
        type: key,
        dbType: CONTENT_TYPE_MAP[key],
        defaultCount: DEFAULT_COUNT[key] || 10,
      })),
      supportedLanguages: ['en', 'ja', 'ko', 'fr', 'es', 'de', 'zh'],
      levels: ['beginner', 'intermediate', 'advanced'],
    });
  },
};

module.exports = learnController;