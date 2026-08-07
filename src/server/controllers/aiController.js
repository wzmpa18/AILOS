// ============================================================
// src/server/controllers/aiController.js
// Module 03 — AI 对话引擎控制器
// M0 接线：所有 AI 调用统一走 aiGateway，禁止直连混元
// ============================================================
const { getAIGateway } = require('../../services/aiGateway');
const aiQuotaService = require('../../services/aiQuotaService');
const contextResolver = require('../../services/contextResolver'); // GAP-03: 语言从库解析
const logger = require('../../utils/logger');
const prisma = require('../../config/database');

const AI_REQUEST_LOG = [];

// ============================================================
// POST /api/ai/chat
// ============================================================
async function chat(req, res) {
  try {
    const { userInput, languageContext, conversationId, mode } = req.body;

    if (!req.user || !req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED', message: '请先登录' });
    }

    if (!userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'Empty input' });
    }

    // GAP-03：双语言强制从数据库解析，前端传入的 languageContext 被忽略（杜绝篡改）
    const lang = await contextResolver.resolve(req.userId);
    const nativeLang = lang.nativeLanguage;
    const targetLang = lang.targetLanguage;
    const userLevel = (languageContext && languageContext.userLevel) || 'beginner';

    // 模块五：AI 对话重构 —— 专业外教 + 固定 4 段结构 + 三模式区分 + 难度适配 + 纠错机制
    const MODE_DESC = {
      daily: '日常交流：围绕衣食住行、社交出行、职场沟通等生活实用场景展开对话，轻松幽默、实用有趣',
      business: '商务职场：覆盖邮件、会议、谈判、汇报等专业场景，表达正式、专业严谨',
      exam: '应试备考：围绕对应等级考点、语法专项、真题例句展开，目标提分通过考试，严谨专业',
    };
    const modeKey = (mode === 'business' || mode === 'exam') ? mode : 'daily';
    const modeDesc = MODE_DESC[modeKey];
    
    // 趣味化规则（宪法模块十：全量学习内容趣味化改造）
    const funRules = modeKey === 'exam'
      ? '请在专业严谨的基础上，例句场景尽量贴近生活实际，不要完全脱离日常语境。'
      : '请优先使用贴近生活、轻松幽默的例句和场景，可融入网络热梗、日常搞笑段子，让用户在学习中感到愉悦。禁止生硬机械的教材式表达。所有内容语法、用词必须100%准确。';
    
    const systemPrompt = `你是一位专业的${targetLang}外教，名叫AILOS，全程围绕语言学习展开，不输出与语言学习无关的闲聊内容。
用户母语为${nativeLang}，正在学习${targetLang}，当前水平为${userLevel}（beginner入门 / elementary初级 / intermediate中级 / advanced高级）。
学习模式：${modeDesc}。请严格按该模式调整场景与用词，难度匹配${userLevel}（入门不超纲、高级不简单，循序渐进不跳级）。
${funRules}

回复必须遵守固定结构，且严格以 JSON 格式返回（不要输出 JSON 以外的任何文字）：
{
  "response": "用${nativeLang}对本次对话/知识点做母语讲解，并在末尾给出一个互动引导提问（用${targetLang}提问，引导用户开口/输入，形成学习闭环）",
  "example": "一条地道的${targetLang}例句（与该模式/知识点相关，避免生硬机械）",
  "translation": "上述例句的${nativeLang}翻译",
  "knowledge": "1-2个核心词汇或语法点讲解（用${nativeLang}说明用法与注意事项；若为应试模式则对应考点）"
}
纠错机制：若用户输入存在语法或用词错误，在 response 中自然纠正并说明错误原因，给出标准正确表达，不要单独列纠错字段。
每条回复都必须包含上述4个字段，不得缺失。`;

    const startTime = Date.now();
    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      { userId: req.userId, temperature: 0.7, maxTokens: 500, languageContext: { nativeLang, targetLang, userLevel }, scene: 'conversation' }
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

    const status = err.httpStatus || (errorType === 'QUOTA_EXHAUSTED' ? 429 : 502);
    res.status(status).json({
      success: false,
      error: errorType,
      errorType,
      code: err.code,
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
    const { text, sourceLang } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    // GAP-03：目标语言由库解析，前端 targetLang 被忽略
    const lang = await contextResolver.resolve(req.userId);
    const tgt = lang.targetLanguage;
    const src = sourceLang || lang.explanationLanguage || 'auto';

    const systemPrompt = `你是一个专业翻译引擎。将用户输入的文本翻译成${tgt}。只返回翻译结果，不要添加任何解释。`;

    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { userId: req.userId, temperature: 0.3, maxTokens: 300, languageContext: { primaryTargetLanguage: tgt, explanationLanguage: src }, scene: 'translate' }
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
    const errorType = _classifyError(err);
    const status = err.httpStatus || 502;
    const message = _errorMessage(errorType);
    res.status(status).json({ success: false, error: errorType, errorType, code: err.code, message: message.zh });
  }
}

// ============================================================
// POST /api/ai/grammar-check
// ============================================================
async function grammarCheck(req, res) {
  try {
    const { text } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    // GAP-03：被检查语言由库解析（用户目标语言），前端 language 被忽略
    const langInfo = await contextResolver.resolve(req.userId);
    const lang = langInfo.targetLanguage;
    const systemPrompt = `你是一个语法检查器。检查用户输入的${lang}文本，找出语法错误并给出修改建议。返回JSON格式：
{
  "corrected": "修正后的完整文本",
  "errors": [{"original": "原文", "correction": "修正", "explanation": "解释"}],
  "summary": "总体评价"
}`;

    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { userId: req.userId, temperature: 0.3, maxTokens: 400, languageContext: { primaryTargetLanguage: lang, explanationLanguage: 'zh-CN' }, scene: 'grammar_check' }
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
    const errorType = _classifyError(err);
    const status = err.httpStatus || 502;
    const message = _errorMessage(errorType);
    res.status(status).json({ success: false, error: errorType, errorType, code: err.code, message: message.zh });
  }
}

// ============================================================
// POST /api/ai/generate-exercise
// ============================================================
async function generateExercise(req, res) {
  try {
    const { level, type, count } = req.body;

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'GUEST_BLOCKED' });
    }

    // GAP-03：出题语言由库解析（用户目标语言），前端 language 被忽略
    const langInfo = await contextResolver.resolve(req.userId);
    const lang = langInfo.targetLanguage;
    const lvl = level || 'beginner';
    const exType = type || 'vocabulary';
    const cnt = Math.min(count || 5, 10);

    const systemPrompt = `你是一个语言学习出题引擎。生成${cnt}道${lang}的${exType}练习题，难度为${lvl}。
题目内容请优先使用贴近生活、轻松有趣的场景和例句，融入日常对话中的自然表达，避免生硬机械的教材式句子。所有语法、用词必须100%准确。
返回JSON数组格式：[{"question": "题目", "options": ["A", "B", "C", "D"], "answer": "正确答案", "explanation": "解释"}]`;

    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `生成${cnt}道${exType}练习题` },
      ],
      { userId: req.userId, temperature: 0.7, maxTokens: 800, languageContext: { primaryTargetLanguage: lang, explanationLanguage: 'zh-CN' }, scene: 'exercise_generate' }
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
    const errorType = _classifyError(err);
    const status = err.httpStatus || 502;
    const message = _errorMessage(errorType);
    res.status(status).json({ success: false, error: errorType, errorType, code: err.code, message: message.zh });
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
  if (err.code === 'LANG_CONFIG_INCOMPLETE') return 'LANG_CONFIG_INCOMPLETE';
  if (err.code === 'LANG_OUTPUT_MISMATCH') return 'LANG_OUTPUT_MISMATCH';
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'TIMEOUT';
  if (err.response?.status === 429) return 'RATE_LIMITED';
  if (err.response?.status === 401 || err.response?.status === 403) return 'AUTH_FAILED';
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') return 'NETWORK_ERROR';
  return 'UPSTREAM_ERROR';
}

function _errorMessage(type) {
  const messages = {
    LANG_CONFIG_INCOMPLETE: { zh: '用户语言配置不完整，请先在个人中心完成母语与目标语言设置', en: 'Language config incomplete' },
    LANG_OUTPUT_MISMATCH: { zh: 'AI 输出语种与您的语言配置不符，已被拦截', en: 'AI output language mismatch' },
    TIMEOUT: { zh: 'AI响应超时，请稍后重试', en: 'AI response timeout' },
    RATE_LIMITED: { zh: 'AI请求过于频繁，请稍后重试', en: 'Too many AI requests' },
    AUTH_FAILED: { zh: 'AI服务认证失败，请联系管理员', en: 'AI auth failed' },
    NETWORK_ERROR: { zh: 'AI服务网络连接失败', en: 'AI network error' },
    UPSTREAM_ERROR: { zh: 'AI服务暂时不可用，请稍后重试', en: 'AI service unavailable' },
  };
  return messages[type] || messages.UPSTREAM_ERROR;
}

module.exports = { chat, translate, grammarCheck, generateExercise, getStats, getQuota };