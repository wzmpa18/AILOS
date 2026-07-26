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
const config = require('../config');
const { getSystemConfigService } = require('./systemConfigService');
const { getLanguageGuard, LangOutputMismatchError } = require('./languageGuard');
const contextResolver = require('./contextResolver'); // GAP-03: 语言上下文唯一真值源（忽略前端，从库解析）

// ==================== 配置 ====================

const CACHE_TTL = 3600; // Redis 缓存 TTL（秒）
const CACHE_PREFIX = 'ailos:ai:cache:';
// 系统级默认生成语言（仅用于无用户上下文的系统调用，非用户配置、非前端可篡改）
const SYSTEM_TARGET_LANG = process.env.SYSTEM_TARGET_LANG || 'ja';
const SYSTEM_EXPLAIN_LANG = process.env.SYSTEM_EXPLAIN_LANG || 'zh-CN';

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
  async call({ scene, userId, params }) {
    // GAP-03/04: 语言上下文强制从数据库解析，直接忽略前端传入的任何 languageContext
    const languageContext = await this._resolveLangCtx(userId);
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

      // 6. Language Guard 输出校验（GAP-04：语种不匹配直接拦截丢弃，不返回前端）
      const outputText = aiResult.choices?.[0]?.message?.content || '';
      const outputCheck = guard.validateOutput(outputText, languageContext, scene);
      if (outputCheck.langMismatch) {
        throw new LangOutputMismatchError(outputCheck.reason || 'AI 输出语种与用户配置不符');
      }
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
   * chatWithMessages — 兼容旧版 aiController/aiTutorService 的消息数组调用模式
   * 这是 M0 接线关键方法：将 messages 数组转换为 aiGateway 标准调用流程
   * @param {Array} messages - [{role:'system'|'user'|'assistant', content:'...'}]
   * @param {Object} opts - { temperature, maxTokens, userId, languageContext, scene }
   * @returns {Promise<{content:string, usage:{promptTokens,completionTokens,totalTokens}, model:string, source:'ai'|'asset'|'cache'}>}
   */
  async chatWithMessages(messages, opts = {}) {
    const startTime = Date.now();
    // skipAsset: 跳过资产检索与资产回存（如 photo_translate 结构化 JSON 输出，不适合作为学习资产复用）
    const { temperature = 0.7, maxTokens = 2048, userId, scene: explicitScene, skipAsset = false } = opts;

    // 自动检测场景
    const scene = explicitScene || this._detectScene(messages);
    // GAP-03/04: 语言上下文强制从数据库解析，忽略前端传入的任何 languageContext
    const ctx = await this._resolveLangCtx(userId);

    const logEntry = {
      userId,
      scene,
      requestType: scene,
      model: 'hunyuan',
      languageContext: ctx,
      assetHit: false,
      success: true,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
    };

    try {
      // 1. 资产检索
      const assetResult = skipAsset ? null : await this._searchAsset(scene, { input: this._extractUserInput(messages) }, ctx);
      if (assetResult) {
        logEntry.assetHit = true;
        logEntry.latencyMs = Date.now() - startTime;
        await this._logRequest(logEntry);
        return {
          content: typeof assetResult === 'string' ? assetResult : JSON.stringify(assetResult),
          model: 'asset',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          source: 'asset',
        };
      }

      // 2. Redis 缓存
      const cacheKey = this._buildCacheKey(scene, userId, { messages: this._extractUserInput(messages).slice(0, 100) }, ctx);
      const cached = await this._getCache(cacheKey);
      if (cached) {
        logEntry.assetHit = false;
        logEntry.latencyMs = Date.now() - startTime;
        await this._logRequest(logEntry);
        return {
          content: cached.content || cached,
          model: 'cache',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          source: 'cache',
        };
      }

      // 3. Language Guard 输入校验
      const inputText = this._extractUserInput(messages);
      const guard = getLanguageGuard();
      const inputCheck = guard.validateInput(inputText, ctx);
      if (inputCheck.violationCount > 0) {
        logger.warn('AIGateway', 'Language Guard 输入违规', { userId, scene, violations: inputCheck.violations });
      }

      // 4. 构建 Prompt（优先从 aiPromptTemplate 库读取）
      const systemPrompt = await this._buildPromptFromMessages(messages, scene, ctx);

      // 5. 调用 AI
      const aiMessages = [{ role: 'system', content: systemPrompt }];
      // 添加非 system 的消息
      for (const msg of messages) {
        if (msg.role !== 'system') {
          aiMessages.push(msg);
        }
      }

      const aiResult = await this._callAI(aiMessages, { temperature, maxTokens });

      // 6. Language Guard 输出校验（GAP-04：语种不匹配直接拦截丢弃，不返回前端）
      const outputText = aiResult.content || '';
      const outputCheck = guard.validateOutput(outputText, ctx, scene);
      if (outputCheck.langMismatch) {
        throw new LangOutputMismatchError(outputCheck.reason || 'AI 输出语种与用户配置不符');
      }
      if (!outputCheck.valid && outputCheck.needsRetry) {
        logger.warn('AIGateway', 'Language Guard 输出违规', { userId, scene, violations: outputCheck.violations });
      }

      // 7. 缓存结果
      await this._setCache(cacheKey, { content: outputText }, CACHE_TTL);

      // 8. 记录日志
      logEntry.inputTokens = aiResult.usage?.promptTokens || 0;
      logEntry.outputTokens = aiResult.usage?.completionTokens || 0;
      logEntry.latencyMs = Date.now() - startTime;
      await this._logRequest(logEntry);

      // 9. 资产落库（异步，不阻塞响应；skipAsset 场景不回存）
      if (!skipAsset) {
        this._saveToAssets(messages, { content: outputText }, ctx, scene).catch(() => {});
      }

      return {
        content: outputText,
        model: aiResult.model || 'hunyuan',
        usage: {
          promptTokens: aiResult.usage?.promptTokens || 0,
          completionTokens: aiResult.usage?.completionTokens || 0,
          totalTokens: aiResult.usage?.totalTokens || 0,
        },
        source: 'ai',
      };

    } catch (error) {
      logEntry.success = false;
      logEntry.errorMessage = error.message;
      logEntry.latencyMs = Date.now() - startTime;
      await this._logRequest(logEntry).catch(() => {});
      logger.error('AIGateway', 'chatWithMessages 失败', { userId, scene, error: error.message });
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
      const targetLang = languageContext.primaryTargetLanguage;
      const explanationLang = languageContext.explanationLanguage;

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
        languageCode: languageContext.explanationLanguage,
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
        prompt = prompt.replace('{{explanation_language}}', languageContext.explanationLanguage);
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
    const targetLang = languageContext.primaryTargetLanguage;
    const explanationLang = languageContext.explanationLanguage;

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
    const baseUrl = (config.hunyuan && config.hunyuan.apiUrl) || 'https://tokenhub.tencentmaas.com/v1';
    const apiUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
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
      if (error.response) throw new Error('AI-CONNECTION-PENDING: Upstream ' + String(error.response.status));
      throw new Error('AI-CONNECTION-PENDING: ' + error.message);
    }
  }

  /**
   * 根据场景构建系统提示词
   */
  _buildSystemPrompt(scene, languageContext) {
    const targetLang = languageContext.primaryTargetLanguage;
    const explanationLang = languageContext.explanationLanguage;

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
    // BUG-016 修复：原实现 base64(JSON).slice(0,32) 仅编码前 24 字节，
    // 其中 {"messages":" 前缀占 13 字节，实际区分度只有 ~11 字节（约 3 个中文字符），
    // 导致相同前缀的不同问题发生缓存键碰撞、返回错误答案。改用 sha256 全量哈希根治。
    const crypto = require('crypto');
    const paramsHash = crypto.createHash('sha256').update(JSON.stringify(params || {})).digest('hex').slice(0, 32);
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
      translate: 'vocabulary',
      grammar_check: 'grammar',
      exercise_generate: 'quiz',
    };
    return map[scene] || 'lesson';
  }

  /**
   * 自动检测场景（从 messages 中的 system prompt 推断）
   */
  _detectScene(messages) {
    const systemMsg = messages.find(m => m.role === 'system');
    const content = systemMsg ? systemMsg.content : '';
    if (content.includes('翻译') || content.includes('translate') || content.includes('翻译引擎')) return 'translate';
    if (content.includes('语法检查') || content.includes('grammar check') || content.includes('语法检查器')) return 'grammar_check';
    if (content.includes('出题') || content.includes('exercise') || content.includes('练习题') || content.includes('出题引擎')) return 'exercise_generate';
    if (content.includes('教师') || content.includes('语言教师') || content.includes('teacher')) return 'conversation';
    if (content.includes('导师') || content.includes('tutor') || content.includes('伴读')) return 'conversation';
    return 'conversation';
  }

  /**
   * GAP-03/04：语言上下文唯一解析入口
   * 真实用户：用 userId 从数据库读取双语言（忽略任何前端传入参数），缺失即抛标准错误。
   * 系统 / 无 userId 调用：绝不信任前端，使用系统固定上下文。
   * @param {string} userId
   */
  async _resolveLangCtx(userId) {
    if (userId && userId !== 'system') {
      // 缺失双语言配置时抛 LANG_CONFIG_INCOMPLETE（HTTP 400），禁止静默默认
      return await contextResolver.resolve(userId);
    }
    return this._systemContext();
  }

  /**
   * 系统级固定语言上下文（非用户配置、非前端可篡改），仅用于无用户上下文的系统调用
   */
  _systemContext() {
    return { primaryTargetLanguage: SYSTEM_TARGET_LANG, explanationLanguage: SYSTEM_EXPLAIN_LANG };
  }

  /**
   * 从 messages 中提取用户输入文本
   */
  _extractUserInput(messages) {
    const userMsgs = messages.filter(m => m.role === 'user');
    return userMsgs.map(m => m.content).join('\n');
  }

  /**
   * 从 messages 构建 System Prompt（优先从 aiPromptTemplate 库读取，回退到原 Prompt）
   */
  async _buildPromptFromMessages(messages, scene, languageContext) {
    // 1. 尝试从 aiPromptTemplate 库中查找匹配的模板
    const template = await prisma.aiPromptTemplate.findFirst({
      where: {
        scene,
        languageCode: languageContext.explanationLanguage,
        status: 'active',
      },
      orderBy: { version: 'desc' },
    });

    if (template) {
      let prompt = template.templateContent;
      const variables = typeof template.variables === 'string'
        ? JSON.parse(template.variables)
        : (template.variables || []);

      const targetLang = languageContext?.primaryTargetLanguage || 'en';
      const explanationLang = languageContext.explanationLanguage;

      // 替换模板变量
      prompt = prompt.replace(/\{\{target_language\}\}/g, targetLang);
      prompt = prompt.replace(/\{\{explanation_language\}\}/g, explanationLang);
      prompt = prompt.replace(/\{\{native_language\}\}/g, explanationLang);

      for (const v of (variables || [])) {
        const value = languageContext?.[v.name] || languageContext?.[v.key] || v.default || '';
        prompt = prompt.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), String(value));
      }

      return prompt;
    }

    // 2. 回退：使用原 messages 中的 system prompt（保留原有硬编码 Prompt 作为过渡）
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg && systemMsg.content) {
      return systemMsg.content;
    }

    // 3. 最终回退：使用默认 Prompt
    return this._buildDefaultPrompt(scene, {}, languageContext);
  }

  /**
   * 保存 AI 生成内容到资产库（异步落库，不阻塞响应）
   */
  async _saveToAssets(messages, aiResponse, languageContext, scene) {
    try {
      const targetLang = languageContext?.primaryTargetLanguage || 'en';
      const explanationLang = languageContext.explanationLanguage;
      const contentType = this._sceneToContentType(scene);

      await prisma.learningContent.create({
        data: {
          contentType,
          sourceType: 'AI_GENERATED',
          sourceLanguage: explanationLang,
          targetLanguage: targetLang,
          explanationLanguage: explanationLang,
          difficultyLevel: 'beginner',
          contentVersion: '1.0.0',
          status: 'draft',
          contentData: {
            input: this._extractUserInput(messages),
            output: aiResponse.content,
            scene,
            generatedAt: new Date().toISOString(),
          },
          qualityScore: 0,
          reuseCount: 0,
        },
      });
    } catch (error) {
      logger.debug('AIGateway', '资产落库失败', { error: error.message });
    }
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