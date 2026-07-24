const axios = require('axios');
const logger = require('../../utils/logger');
const prisma = require('../../config/database');
const aiQuotaService = require('../../services/aiQuotaService');

const config = require('../../config');
const HUNYUAN_CONFIG = {
  endpoint: (config.hunyuan.apiUrl || 'https://tokenhub.tencentmaas.com/v1') + '/chat/completions',
  model: config.hunyuan.model || 'hy3',
  apiKey: config.hunyuan.apiKey || process.env.HUNYUAN_API_KEY,
  maxTokens: 500,
  temperature: 0.7,
};

const AI_REQUEST_LOG = [];

async function chat(req, res) {
  try {
    const { userInput, languageContext, conversationId } = req.body;

    // Guest mode blocking
    if (!req.user || !req.userId) {
      return res.json({
        success: false,
        error: 'GUEST_BLOCKED',
        message: '请先登录以使用AI对话功能',
        message_en: 'Please login to use AI chat',
      });
    }

    // AI 额度检查
    const quotaCheck = await aiQuotaService.checkQuota(req.userId, 'conversation');
    if (!quotaCheck.allowed) {
      return res.json({
        success: false,
        error: 'AI-CONNECTION-PENDING',
        errorType: 'QUOTA_EXHAUSTED',
        message: '今日AI对话次数已用完，请明天再试',
        message_en: 'Daily AI conversation quota exhausted, please try again tomorrow',
        quota: {
          remaining: quotaCheck.remaining,
          dailyTotal: quotaCheck.dailyTotal,
          resetTime: quotaCheck.resetTime,
        },
      });
    }

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'Empty input' });
    }

    const ctx = languageContext || {};
    const nativeLang = ctx.nativeLang || '中文';
    const targetLang = ctx.targetLang || '英语';
    const userLevel = ctx.userLevel || 'beginner';

    // Build system prompt
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
    
    const resp = await axios.post(HUNYUAN_CONFIG.endpoint, {
      model: HUNYUAN_CONFIG.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      max_tokens: HUNYUAN_CONFIG.maxTokens,
      temperature: HUNYUAN_CONFIG.temperature,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': HUNYUAN_CONFIG.apiKey,
      },
      timeout: 30000,
    });

    const latency = Date.now() - startTime;
    const aiMsg = resp.data.choices?.[0]?.message?.content || '';
    const usage = resp.data.usage || {};

    // Parse AI response as JSON
    let parsed;
    try {
      parsed = JSON.parse(aiMsg);
    } catch (e) {
      // Fallback: wrap plain text
      parsed = {
        response: aiMsg,
        example: '',
        translation: ''
      };
    }

    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Log request
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: req.userId,
      nativeLang,
      targetLang,
      userLevel,
      inputLength: userInput.length,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      latency_ms: latency,
      conversationId: convId,
    };
    AI_REQUEST_LOG.push(logEntry);
    if (AI_REQUEST_LOG.length > 1000) AI_REQUEST_LOG.shift();
    logger.info('AI Chat', logEntry);

    // 记录AI用量到额度服务
    const totalTokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
    await aiQuotaService.recordUsage(req.userId, 'conversation', totalTokens).catch(e => {
      logger.error('AI Chat: recordUsage failed', e.message);
    });

    // 持久化AI请求日志到 Prisma AiRequestLog
    await prisma.aiRequestLog.create({
      data: {
        userId: req.userId,
        scene: 'conversation',
        requestType: 'conversation',
        model: HUNYUAN_CONFIG.model,
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        latencyMs: latency,
        languageContext: {
          nativeLang,
          targetLang,
          userLevel,
        },
        assetHit: false,
        success: true,
      },
    }).catch(e => {
      logger.error('AI Chat: AiRequestLog create failed', e.message);
    });

    res.json({
      success: true,
      response: parsed.response,
      example: parsed.example,
      translation: parsed.translation,
      conversationId: convId,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    });
  } catch (err) {
    logger.error('AI Chat Error:', err.message);

    let errorType = 'UPSTREAM_ERROR';
    let errorMessage = 'AI服务暂时不可用，请稍后重试';
    let errorMessageEn = 'AI service is temporarily unavailable';

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ETIME') {
      errorType = 'TIMEOUT';
      errorMessage = 'AI响应超时，请稍后重试';
      errorMessageEn = 'AI response timeout, please try again later';
      logger.error('AI Timeout:', err.code);
    } else if (err.response && err.response.status === 429) {
      errorType = 'RATE_LIMITED';
      errorMessage = 'AI请求过于频繁，请稍后重试';
      errorMessageEn = 'Too many AI requests, please try again later';
      logger.error('AI Rate Limited:', err.response.status);
    } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      errorType = 'UPSTREAM_ERROR';
      errorMessage = 'AI服务认证失败，请联系管理员';
      errorMessageEn = 'AI service authentication failed, please contact administrator';
      logger.error('AI Auth Failed:', err.response.status);
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ENETUNREACH') {
      errorType = 'UPSTREAM_ERROR';
      errorMessage = 'AI服务网络连接失败，请稍后重试';
      errorMessageEn = 'AI service network error, please try again later';
      logger.error('AI Network Error:', err.code);
    } else if (err.response) {
      errorType = 'UPSTREAM_ERROR';
      errorMessage = 'AI上游服务异常，请稍后重试';
      errorMessageEn = 'AI upstream service error, please try again later';
      const respData = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
      logger.error('Hunyuan API Error:', err.response.status, respData.substring(0, 200));
    }

    // 持久化失败日志到 Prisma AiRequestLog
    await prisma.aiRequestLog.create({
      data: {
        userId: req.userId || null,
        scene: 'conversation',
        requestType: 'conversation',
        model: HUNYUAN_CONFIG.model,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        success: false,
        errorMessage: `${errorType}: ${err.message}`,
      },
    }).catch(() => {});

    res.json({
      success: false,
      error: 'AI-CONNECTION-PENDING',
      errorType: errorType,
      message: errorMessage,
      message_en: errorMessageEn,
    });
  }
}
function getStats(req, res) {
  const totalRequests = AI_REQUEST_LOG.length;
  const totalTokens = AI_REQUEST_LOG.reduce((sum, e) => sum + e.totalTokens, 0);
  const recentLogs = AI_REQUEST_LOG.slice(-20);

  res.json({
    success: true,
    data: {
      totalRequests,
      totalTokens,
      recentLogs,
    },
  });
}

/**
 * GET /api/ai/quota
 * 获取用户AI额度信息
 */
async function getQuota(req, res) {
  try {
    if (!req.user || !req.userId) {
      return res.json({
        success: false,
        error: 'GUEST_BLOCKED',
        message: '请先登录以查看AI额度',
        message_en: 'Please login to view AI quota',
      });
    }

    const quota = await aiQuotaService.getQuota(req.userId);
    res.json({
      success: true,
      data: quota,
    });
  } catch (err) {
    logger.error('AI Quota Error:', err.message);
    res.json({
      success: false,
      error: 'AI-CONNECTION-PENDING',
      errorType: 'UPSTREAM_ERROR',
      message: '获取额度信息失败',
      message_en: 'Failed to get quota information',
    });
  }
}

module.exports = { chat, getStats, getQuota };