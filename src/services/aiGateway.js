/**
 * src/services/aiGateway.js
 * MVP AI Gateway — Phase 1 P0 v1.2
 * 
 * 标准调用链路：
 *   业务模块 → ContextResolver → GlobalLanguageLayer → LanguageGuard → PromptBuilder → 腾讯混元
 * 
 * 资产/缓存优先级（成本控制核心）：
 *   1. learning_content 内容资产库 → 命中直接返回
 *   2. 无匹配检索 Redis 短期缓存
 *   3. 缓存未命中才发起大模型调用
 * 
 * 场景枚举：lesson_generate | explanation | conversation | review
 * 
 * 暂缓功能（二期）：多模型路由、智能降级、复杂阶梯计费、AI Agent 工作流
 */

const prisma = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const axios = require('axios');
const config = require('../../config');
const config = require('../config');
const { getSystemConfigService } = require('./systemConfigService');
const { getLanguageGuard } = require('./languageGuard');

// ==================== 配置 ====================

const CACHE_TTL = 3600; // Redis 缓存 TTL（秒）
const CACHE_PREFIX = 'ailos:ai:cache:';

class AIGateway {
  /**
   * 统一 AI 调用入口
   * @param {Object} params
   * @param {string} params.scene - 场景: lesson_generate, explanation, conversation, review
   * @param {string} params.userId - 用户 ID
   * @param {Object} params.languageContext - 语言上下文
   * @param {Object} params.params - 场景参数
   * @returns {Promise<{ result: any, source: string, assetHit: boolean, latencyMs: number }>}
   */
  async call({ scene, userId, languageContext, params }) {
    const startTime = Date.now();
    const logEntry = {
      userId,
      scene,
      requestType: scene,
      model: 'hunyuan',
      languageContext,
      assetHit: false,
      success: true,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
    };

    try {
      // 1. 资产检索：learning_content 内容资产库
      const assetResult = await this._searchAsset(scene, params, languageContext);
      if (assetResult) {
        logEntry.assetHit = true;
        logEntry.latencyMs = Date.now() - startTime;
        await this._logRequest(logEntry);
        return { result: assetResult, source: 'asset', assetHit: true, latencyMs: logEntry.latencyMs };
      }

      // 2. Redis 短期缓存
      const cacheKey = this._buildCacheKey(scene, userId, params, languageContext);
      const cached = await this._getCache(cacheKey);
      if (cached) {
        logEntry.assetHit = false;
        logEntry.latencyMs = Date.now() - startTime;
        await this._logRequest(logEntry);
        return { result: cached, source: 'cache', assetHit: false, latencyMs: logEntry.latencyMs };
      }

      // 3. Language Guard 输入校验
      const inputText = params.input || params.text || '';
      const guard = getLanguageGuard();
      const inputCheck = guard.validateInput(inputText, languageContext);
      if (inputCheck.violationCount > 0) {
        logger.warn('AIGateway', 'Language Guard 输入违规', {
          userId,
          scene,
          violations: inputCheck.violations,
        });
      }

      // 4. 构建 Prompt
      const prompt = await this._buildPrompt(scene, params, languageContext);

      // 5. 调用腾讯混元（外部 API）
      const aiResult = await this._callAI(prompt, languageContext, scene);

      // 6. Language Guard 输出校验
      const outputText = aiResult.choices?.[0]?.message?.content || '';
      const outputCheck = guard.validateOutput(outputText, languageContext);
      if (!outputCheck.valid && outputCheck.needsRetry) {
        logger.warn('AIGateway', 'Language Guard 输出违规，需要重试', {
          userId, scene, violations: outputCheck.violations,
        });
      }

      // 7. 缓存结果
      await this._setCache(cacheKey, aiResult, CACHE_TTL);

      // 8. 记录日志
      logEntry.inputTokens = aiResult.usage?.prompt_tokens || 0;
      logEntry.outputTokens = aiResult.usage?.completion_tokens || 0;
      logEntry.latencyMs = Date.now() - startTime;
      await this._logRequest(logEntry);

      return { result: aiResult, source: 'ai', assetHit: false, latencyMs: logEntry.latencyMs };

    } catch (error) {
      logEntry.success = false;
      logEntry.errorMessage = error.message;
      logEntry.latencyMs = Date.now() - startTime;
      await this._logRequest(logEntry).catch(() => {});

      logger.error('AIGateway', 'AI 调用失败', {
        userId, scene, error: error.message,
      });
      throw error;
    }
  }

  /**
   * 获取每日成本统计
   * @param {string} date - 日期 (YYYY-MM-DD)
   * @param {string} [userId] - 可选用户过滤
   */
  async getDailyStatistics(date, userId = null) {
    const where = { date: new Date(date) };
    if (userId) {
      where.userId = userId;
    }

    const stats = await prisma.aiUsageDailyStatistic.findMany({
      where,
      orderBy: { requestType: 'asc' },
    });

    return stats;
  }

  // ==================== 内部方法 ====================

  /**
   * 检索内容资产库
   */
  async _searchAsset(scene, params, languageContext) {
    try {
      const targetLang = languageContext?.primaryTargetLanguage || 'ja';
      const explanationLang = languageContext?.explanationLanguage || 'zh-CN';

      const assets = await prisma.learningContent.findMany({
        where: {
          targetLanguage: targetLang,
          explanationLanguage: explanationLang,
          status: 'published',
          contentType: this._sceneToContentType(scene),
        },
        orderBy: { reuseCount: 'desc' },
        take: 1,
      });

      if (assets.length > 0) {
        // 更新复用计数
        await prisma.learningContent.update({
          where: { id: assets[0].id },
          data: { reuseCount: { increment: 1 } },
        }).catch(() => {});

        return assets[0].contentData;
      }
      return null;
    } catch (error) {
      logger.debug('AIGateway', '资产检索失败', { error: error.message });
      return null;
    }
  }

  /**
   * 构建 Prompt
   */
  async _buildPrompt(scene, params, languageContext) {
    // 查找匹配的 Prompt 模板
    const template = await prisma.aiPromptTemplate.findFirst({
      where: {
        scene,
        languageCode: languageContext?.explanationLanguage || 'zh-CN',
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (template) {
      let prompt = template.templateContent;
      const variables = typeof template.variables === 'string'
        ? JSON.parse(template.variables)
        : template.variables;

      for (const v of (variables || [])) {
        const value = params[v.name] || params[v.key] || '';
        prompt = prompt.replace(`{{${v.name}}}`, String(value));
      }

      // 注入语言上下文
      if (languageContext) {
        prompt = prompt.replace('{{target_language}}', languageContext.primaryTargetLanguage || '');
        prompt = prompt.replace('{{explanation_language}}', languageContext.explanationLanguage || 'zh-CN');
      }

      return prompt;
    }

    // 无模板时，使用默认 Prompt 构建
    return this._buildDefaultPrompt(scene, params, languageContext);
  }

  /**
   * 构建默认 Prompt
   */
  _buildDefaultPrompt(scene, params, languageContext) {
    const targetLang = languageContext?.primaryTargetLanguage || 'ja';
    const explanationLang = languageContext?.explanationLanguage || 'zh-CN';

    const basePrompts = {
      lesson_generate: `Generate a ${targetLang} language lesson. Explain in ${explanationLang}. Topic: ${params.topic || 'general'}. Level: ${params.level || 'beginner'}.`,
      explanation: `Explain the following ${targetLang} content in ${explanationLang}: ${params.input || params.text || ''}`,
      conversation: `Have a conversation in ${targetLang}. User's native language is ${explanationLang}. Context: ${params.context || 'general'}.`,
      review: `Review the user's ${targetLang} learning progress and provide feedback in ${explanationLang}.`,
    };

    return basePrompts[scene] || basePrompts.explanation;
  }

  /**
   * 调用 AI 模型（腾讯混元 — 外部 API）
   * 使用外部 Hunyuan API: https://tokenhub.tencentmaas.com/v1/chat/completions
   */
  async _callAI(messages, options = {}) {
    const apiUrl = (config.hunyuan && config.hunyuan.apiUrl) || 'https://tokenhub.tencentmaas.com/v1/chat/completions';
    const apiKey = (config.hunyuan && config.hunyuan.apiKey) || process.env.HUNYUAN_API_KEY;
    const model = (config.hunyuan && config.hunyuan.model) || 'hunyuan-lite';
    const { temperature = 0.7, maxTokens = 2048, stream = false } = options;
    if (!apiKey) { throw new Error('Hunyuan API key not configured'); }
    try {
      const response = await axios({ method: 'POST', url: apiUrl, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, data: { model, messages, temperature, max_tokens: maxTokens, stream }, timeout: 30000, responseType: 'json' });
      const data = response.data; const usage = data.usage || {};
      return { success: true, content: data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content || '' : '' , model: data.model || model, usage: { promptTokens: usage.prompt_tokens || 0, completionTokens: usage.completion_tokens || 0, totalTokens: usage.total_tokens || 0 }, raw: data };
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') throw new Error('AI-CONNECTION-PENDING: Request timeout');
      if (error.response) throw new Error('AI-CONNECTION-PENDING: Upstream ' + str(error.response.status));
      throw new Error('AI-CONNECTION-PENDING: ' + error.message);
    }
  }

  /**
   * 根据场景构建系统提示词
   */
  _buildSystemPrompt(scene, languageContext) {
    const targetLang = languageContext?.primaryTargetLanguage || 'ja';
    const explanationLang = languageContext?.explanationLanguage || 'zh-CN';

    const prompts = {
      lesson_generate: `You are a professional ${targetLang} language teacher. Generate lessons in ${targetLang} with explanations in ${explanationLang}.`,
      explanation: `You are a helpful ${targetLang} language tutor. Explain everything in ${explanationLang}.`,
      conversation: `You are a friendly ${targetLang} conversation partner. Have a natural conversation in ${targetLang}. When the user doesn't understand, explain in ${explanationLang}.`,
      review: `You are a ${targetLang} language assessment expert. Provide detailed feedback in ${explanationLang}.`,
    };

    return prompts[scene] || `You are a helpful language learning assistant. Respond in the user's target language with explanations in their native language.`;
  }

  /**
   * 构建缓存 Key
   */
  _buildCacheKey(scene, userId, params, languageContext) {
    const targetLang = languageContext?.primaryTargetLanguage || 'default';
    const paramsHash = Buffer.from(JSON.stringify(params || {})).toString('base64').slice(0, 32);
    return `${CACHE_PREFIX}${scene}:${userId}:${targetLang}:${paramsHash}`;
  }

  /**
   * 获取缓存
   */
  async _getCache(key) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.debug('AIGateway', '缓存读取失败', { error: error.message });
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async _setCache(key, value, ttl) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.debug('AIGateway', '缓存写入失败', { error: error.message });
    }
  }

  /**
   * 记录 AI 请求日志
   */
  async _logRequest(logEntry) {
    try {
      await prisma.aiRequestLog.create({
        data: {
          userId: logEntry.userId,
          scene: logEntry.scene,
          requestType: logEntry.requestType,
          model: logEntry.model,
          inputTokens: logEntry.inputTokens,
          outputTokens: logEntry.outputTokens,
          latencyMs: logEntry.latencyMs,
          languageContext: logEntry.languageContext,
          assetHit: logEntry.assetHit,
          success: logEntry.success,
          errorMessage: logEntry.errorMessage,
        },
      });
    } catch (error) {
      logger.error('AIGateway', '日志写入失败', { error: error.message });
    }
  }

  /**
   * 场景映射到内容类型
   */
  _sceneToContentType(scene) {
    const map = {
      lesson_generate: 'lesson',
      explanation: 'grammar',
      conversation: 'dialogue',
      review: 'lesson',
    };
    return map[scene] || 'lesson';
  }
}

// ==================== 单例 ====================

let _instance = null;

function getAIGateway() {
  if (!_instance) {
    _instance = new AIGateway();
  }
  return _instance;
}

module.exports = {
  AIGateway,
  getAIGateway,
};