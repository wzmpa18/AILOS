/**
 * 自定义强化学习路由（模块九：词汇+语法双支持）
 * 
 * POST /api/content/custom — 根据关键词生成/检索强化学习内容
 * GET  /api/content/custom?keyword=xxx — 查询库中已有内容
 * 
 * 实现逻辑：
 *   1. 本地内容库检索（LearningContent + VocabularyWord 表）
 *   2. 命中直接返回（秒级）
 *   3. 未命中调用AI生成，自动入库（下次复用）
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAIGateway } = require('../../services/aiGateway');
const contextResolver = require('../../services/contextResolver');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * GET /api/content/custom?keyword=xxx&type=vocabulary|grammar
 * 查询库中已有自定义强化内容
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { keyword, type } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'keyword required' });
    }

    const langCtx = await contextResolver.resolve(req.userId);
    const targetLang = langCtx.primaryTargetLanguage;

    const items = await prisma.learningContent.findMany({
      where: {
        targetLanguage: targetLang,
        status: 'published',
        contentType: type === 'grammar' ? 'grammar' : 'vocabulary',
        contentData: { path: ['keywords'], array_contains: [keyword] },
      },
      select: {
        id: true, contentType: true, difficultyLevel: true,
        contentData: true, qualityScore: true, createdAt: true,
      },
      orderBy: { qualityScore: 'desc' },
      take: 5,
    });

    return res.json({
      success: true,
      items: items.map(i => ({
        id: i.id,
        type: i.contentType,
        level: i.difficultyLevel,
        data: i.contentData,
        score: i.qualityScore,
        source: 'asset',
      })),
      total: items.length,
    });
  } catch (error) {
    logger.error('[customContent] GET failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/content/custom
 * body: { keyword, type: 'vocabulary'|'grammar', level? }
 * 
 * 1. 检索库中匹配内容
 * 2. 无匹配则AI生成 + 入库
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { keyword, type, level } = req.body || {};
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ success: false, error: 'keyword required' });
    }

    const contentType = type === 'grammar' ? 'grammar' : 'vocabulary';
    const keywords = Array.isArray(keyword) ? keyword : [keyword.trim()];

    // GAP-03：语言从库解析
    const langCtx = await contextResolver.resolve(req.userId);
    const targetLang = langCtx.primaryTargetLanguage;
    const explainLang = langCtx.explanationLanguage;
    const difficultyLevel = level || 'beginner';

    // Step 1: 检索库中已有内容
    const existing = await prisma.learningContent.findFirst({
      where: {
        targetLanguage: targetLang,
        status: 'published',
        contentType,
        difficultyLevel,
        contentData: { path: ['keywords'], array_contains: [keywords[0]] },
      },
      orderBy: { qualityScore: 'desc' },
    });

    if (existing) {
      // 更新复用计数
      await prisma.learningContent.update({
        where: { id: existing.id },
        data: { reuseCount: { increment: 1 } },
      }).catch(() => {});

      return res.json({
        success: true,
        item: {
          id: existing.id,
          type: existing.contentType,
          level: existing.difficultyLevel,
          data: existing.contentData,
          score: existing.qualityScore,
        },
        source: 'asset',
      });
    }

    // Step 2: AI生成
    const systemPrompt = buildCustomPrompt(contentType, targetLang, explainLang, keywords, difficultyLevel);

    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请为以下关键词生成强化学习内容：${keywords.join('、')}` },
      ],
      {
        userId: req.userId,
        temperature: 0.7,
        maxTokens: 1500,
        languageContext: { primaryTargetLanguage: targetLang, explanationLanguage: explainLang },
        scene: contentType === 'grammar' ? 'grammar_check' : 'lesson_generate',
        skipAsset: true, // 自定义生成场景不复用资产
      }
    );

    // 解析AI返回
    let contentData;
    try {
      contentData = JSON.parse(result.content);
    } catch (e) {
      contentData = {
        explanation: result.content,
        keywords,
        generatedAt: new Date().toISOString(),
      };
    }
    // 确保 keywords 字段存在
    contentData.keywords = keywords;

    // Step 3: 入库（异步，不阻塞响应）
    let savedId = null;
    try {
      const saved = await prisma.learningContent.create({
        data: {
          contentType,
          sourceType: 'AI_GENERATED',
          sourceLanguage: explainLang,
          targetLanguage: targetLang,
          explanationLanguage: explainLang,
          difficultyLevel,
          contentVersion: '1.0.0',
          status: 'published',
          contentData,
          qualityScore: 70,
          reuseCount: 1,
        },
      });
      savedId = saved.id;
    } catch (saveErr) {
      logger.warn('[customContent] 入库失败:', saveErr.message);
    }

    return res.json({
      success: true,
      item: {
        id: savedId,
        type: contentType,
        level: difficultyLevel,
        data: contentData,
        score: 70,
      },
      source: 'ai',
      keywords,
    });
  } catch (error) {
    logger.error('[customContent] POST failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 构建自定义强化内容的系统Prompt
 */
function buildCustomPrompt(contentType, targetLang, explainLang, keywords, level) {
  const langNames = { ja: '日语', en: '英语', ko: '韩语', fr: '法语', de: '德语', es: '西班牙语' };
  const langName = langNames[targetLang] || targetLang;

  const funRule = `内容风格：优先使用贴近生活、轻松有趣的场景和例句，融入日常对话中的自然表达，避免生硬机械的教材式句子。让用户学得轻松、记得牢。所有语法、用词必须100%准确。`;

  if (contentType === 'grammar') {
    return `你是一位${langName}语法教师。请为以下语法点生成强化学习内容：${keywords.join('、')}。
目标语言：${targetLang}，解释语言：${explainLang}，难度：${level}。
${funRule}

请以JSON格式返回（不要输出其他文字）：
{
  "title": "语法点名称（${explainLang}）",
  "explanation": "详细语法讲解（${explainLang}，包含用法、规则、注意事项）",
  "examples": [{"sentence": "${targetLang}例句", "translation": "${explainLang}翻译", "note": "要点说明"}],
  "exercises": [{"question": "${targetLang}练习题", "answer": "正确答案", "hint": "提示"}],
  "commonMistakes": [{"wrong": "常见错误", "correct": "正确用法", "reason": "错误原因"}],
  "summary": "一句话总结（${explainLang}）"
}`;
  }

  return `你是一位${langName}词汇教师。请为以下词汇生成强化学习内容：${keywords.join('、')}。
目标语言：${targetLang}，解释语言：${explainLang}，难度：${level}。
${funRule}

请以JSON格式返回（不要输出其他文字）：
{
  "title": "词汇主题（${explainLang}）",
  "words": [{"word": "${targetLang}单词", "reading": "读音/假名", "meaning": "${explainLang}释义", "example": "例句", "exampleTranslation": "例句翻译"}],
  "usage": "词汇用法总结（${explainLang}）",
  "exercises": [{"question": "${targetLang}练习题", "answer": "正确答案", "hint": "提示"}],
  "tips": "记忆技巧/联想（${explainLang}）"
}`;
}

module.exports = router;
