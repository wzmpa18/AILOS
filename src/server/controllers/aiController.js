// ============================================================
// src/server/controllers/aiController.js
// Module 03 — AI 对话引擎控制器
// 通过 aiService 统一调用混元（ai-proxy 优先，回退直连）
// ============================================================
const aiService = require('../../services/aiService');
const aiQuotaService = require('../../services/aiQuotaService');
const logger = require('../../utils/logger');
const prisma = require('../../config/database');

const AI_REQUEST_LOG = [];

// ============================================================
// POST /api/ai/chat
// ============================================================
async function chat(req, res) {
  try {
    const { userInput, languageContext, conversationId } = req.body;

    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED', message: '请先登录' });
    }

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'Empty input' });
    }

    const ctx = languageContext || {};
    const nativeLang = ctx.nativeLang || '中文';
    const targetLang = ctx.targetLang || '英语';
    const userLevel = ctx.userLevel || 'beginner';

    const systemPrompt = `你是一位专业的语言教师，名叫AILOS。你的母语是${nativeLang}，你要教用户学习${targetLang}。
请严格遵守以下规则：
1. 所有解释、说明、语法讲解必须使用${nativeLang}
2. 例句使用${targetLang}
3. 例句后面必须附上${nativeLang}翻译
4. 根据用户水平(${userLevel})调整内容难度
5. 回复格式为JSON：
{
  "response": "母语解释（${nativeLang}）",
  "example": "目标语言例句（${targetLang}）",
  "translation": "例句母语翻译（${nativeLang}）"
}`;

    const startTime = Date.now();
    const result = await aiService.callHunyuan(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      { userId: req.userId, temperature: 0.7, maxTokens: 500 }
    );

    const latency = Date.now() - startTime;
    const aiMsg = result.content;

    // 解析 AI 响应
    let parsed;
    try {
      parsed = JSON.parse(aiMsg);
    } catch (e) {
      parsed = { response: aiMsg, example: '', translation: '' };
    }

    // 记录额度
    const totalTokens = result.usage.totalTokens;
    await aiQuotaService.recordUsage(req.userId, 'conversation', totalTokens).catch(e => {
      logger.error('AI Chat: recordUsage failed', e.message);
    });

    // 持久化日志
    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await prisma.aiRequestLog.create({
      data: {
        userId: req.userId,
        scene: 'conversation',
        requestType: 'conversation',
        model: result.model,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        latencyMs: latency,
        languageContext: { nativeLang, targetLang, userLevel },
        assetHit: false,
        success: true,
      },
    }).catch(e => {
      logger.error('AI Chat: AiRequestLog create failed', e.message);
    });

    // 内存日志
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: req.userId,
      nativeLang, targetLang, userLevel,
      inputLength: userInput.length,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      latency_ms: latency,
      conversationId: convId,
    };
    AI_REQUEST_LOG.push(logEntry);
    if (AI_REQUEST_LOG.length > 1000) AI_REQUEST_LOG.shift();

    res.json({
      success: true,
      response: parsed.response,
      example: parsed.example,
      translation: parsed.translation,
      conversationId: convId,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
      source: result.source,
    });
  } catch (err) {
    logger.error('AI Chat Error:', err.message);
    const errorType = _classifyError(err);
    const message = _errorMessage(errorType);

    // 持久化失败日志
    await prisma.aiRequestLog.create({
      data: {
        userId: req.userId || null,
        scene: 'conversation',
        requestType: 'conversation',
        model: 'hunyuan',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        success: false,
        errorMessage: `${errorType}: ${err.message}`,
      },
    }).catch(() => {});

    res.status(errorType === 'QUOTA_EXHAUSTED' ? 429 : 502).json({
      success: false,
      error: 'AI-CONNECTION-PENDING',
      errorType,
      message: message.zh,
      message_en: message.en,
    });
  }
}

// ============================================================
// POST /api/ai/translate
// ============================================================
async function translate(req, res) {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const src = sourceLang || 'auto';
    const tgt = targetLang || 'zh-CN';

    const systemPrompt = `你是一个专业翻译引擎。将用户输入的文本翻译成${tgt}。只返回翻译结果，不要添加任何解释。`;

    const result = await aiService.callHunyuan(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { userId: req.userId, temperature: 0.3, maxTokens: 300 }
    );

    res.json({
      success: true,
      translation: result.content.trim(),
      sourceLang: src,
      targetLang: tgt,
      usage: result.usage,
      source: result.source,
    });
  } catch (err) {
    logger.error('AI Translate Error:', err.message);
    res.status(502).json({ success: false, error: 'AI-CONNECTION-PENDING', message: '翻译服务暂不可用' });
  }
}

// ============================================================
// POST /api/ai/grammar-check
// ============================================================
async function grammarCheck(req, res) {
  try {
    const { text, language } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const lang = language || 'auto';
    const systemPrompt = `你是一个语法检查器。检查用户输入的${lang}文本，找出语法错误并给出修改建议。返回JSON格式：
{
  "corrected": "修正后的完整文本",
  "errors": [{"original": "原文", "correction": "修正", "explanation": "解释"}],
  "summary": "总体评价"
}`;

    const result = await aiService.callHunyuan(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { userId: req.userId, temperature: 0.3, maxTokens: 400 }
    );

    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch (e) {
      parsed = { corrected: result.content, errors: [], summary: '' };
    }

    res.json({
      success: true,
      ...parsed,
      usage: result.usage,
      source: result.source,
    });
  } catch (err) {
    logger.error('AI Grammar Check Error:', err.message);
    res.status(502).json({ success: false, error: 'AI-CONNECTION-PENDING', message: '语法检查服务暂不可用' });
  }
}

// ============================================================
// POST /api/ai/generate-exercise
// ============================================================
async function generateExercise(req, res) {
  try {
    const { language, level, type, count } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    if (!language) {
      return res.status(400).json({ success: false, error: 'Language is required' });
    }

    const lang = language;
    const lvl = level || 'beginner';
    const exType = type || 'vocabulary';
    const cnt = Math.min(count || 5, 10);

    const systemPrompt = `你是一个语言学习出题引擎。生成${cnt}道${lang}的${exType}练习题，难度为${lvl}。返回JSON数组格式：
[{"question": "题目", "options": ["A", "B", "C", "D"], "answer": "正确答案", "explanation": "解释"}]`;

    const result = await aiService.callHunyuan(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `生成${cnt}道${exType}练习题` },
      ],
      { userId: req.userId, temperature: 0.7, maxTokens: 800 }
    );

    let exercises;
    try {
      exercises = JSON.parse(result.content);
    } catch (e) {
      exercises = [{ question: result.content, options: [], answer: '', explanation: '' }];
    }

    res.json({
      success: true,
      exercises: Array.isArray(exercises) ? exercises : [exercises],
      language: lang,
      level: lvl,
      type: exType,
      usage: result.usage,
      source: result.source,
    });
  } catch (err) {
    logger.error('AI Generate Exercise Error:', err.message);
    res.status(502).json({ success: false, error: 'AI-CONNECTION-PENDING', message: '出题服务暂不可用' });
  }
}

// ============================================================
// GET /api/ai/stats
// ============================================================
function getStats(req, res) {
  const totalRequests = AI_REQUEST_LOG.length;
  const totalTokens = AI_REQUEST_LOG.reduce((sum, e) => sum + e.totalTokens, 0);
  const recentLogs = AI_REQUEST_LOG.slice(-20);

  res.json({
    success: true,
    data: { totalRequests, totalTokens, recentLogs },
  });
}

// ============================================================
// GET /api/ai/quota
// ============================================================
async function getQuota(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    const quota = await aiQuotaService.getQuota(req.userId);
    res.json({ success: true, data: quota });
  } catch (err) {
    logger.error('AI Quota Error:', err.message);
    res.status(502).json({ success: false, error: 'UPSTREAM_ERROR', message: '获取额度信息失败' });
  }
}

// ============================================================
// Helpers
// ============================================================
function _classifyError(err) {
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'TIMEOUT';
  if (err.response?.status === 429) return 'RATE_LIMITED';
  if (err.response?.status === 401 || err.response?.status === 403) return 'AUTH_FAILED';
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') return 'NETWORK_ERROR';
  return 'UPSTREAM_ERROR';
}

function _errorMessage(type) {
  const messages = {
    TIMEOUT: { zh: 'AI响应超时，请稍后重试', en: 'AI response timeout' },
    RATE_LIMITED: { zh: 'AI请求过于频繁，请稍后重试', en: 'Too many AI requests' },
    AUTH_FAILED: { zh: 'AI服务认证失败，请联系管理员', en: 'AI auth failed' },
    NETWORK_ERROR: { zh: 'AI服务网络连接失败', en: 'AI network error' },
    UPSTREAM_ERROR: { zh: 'AI服务暂时不可用，请稍后重试', en: 'AI service unavailable' },
  };
  return messages[type] || messages.UPSTREAM_ERROR;
}

module.exports = { chat, translate, grammarCheck, generateExercise, getStats, getQuota };