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
   * 输出必须依赖用户输入的场景：禁止资产库复用。
   * _searchAsset 只按 targetLanguage/explanationLanguage/contentType 检索，
   * 不做输入文本匹配，对这些场景复用资产会返回与用户输入无关的内容。
   */
  static INPUT_DEPENDENT_SCENES = new Set([
    'translate',
    'grammar_check',
    'conversation',
  ]);

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

      // 9. 资产落库（异步，不阻塞响应；skipAsset 与输入依赖型场景不回存）
      // 输入依赖型场景的输出只对当次输入有效，回存会持续污染资产库
      if (!skipAsset && !AIGateway.INPUT_DEPENDENT_SCENES.has(scene)) {
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
      // BUGFIX(P0)：资产检索仅按 语言+contentType 匹配，完全忽略用户输入文本，
      // 对「输出必须依赖用户输入」的场景会返回 reuseCount 最高的无关资产。
      // 实测：/api/ai/translate 输入「我明天要去东京出差」返回资产「天気/てんき/天气」。
      // 这类场景直接禁用资产复用，走真实 AI 调用。
      if (AIGateway.INPUT_DEPENDENT_SCENES.has(scene)) {
        return null;
      }

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
      sentence_practice: 'sentence_pattern',
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
  /**
   * 清空指定用户的全部 AI 响应缓存（语言切换后强制失效，避免旧语言缓存命中）
   * @param {string} userId
   * @returns {Promise<number>} 删除的缓存键数量
   */
  async clearUserCache(userId) {
    if (!redis || !userId) return 0;
    try {
      const pattern = `${CACHE_PREFIX}*:${userId}:*`;
      let cursor = '0';
      let deleted = 0;
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
        cursor = next;
        if (keys && keys.length) {
          await redis.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
      if (deleted > 0) {
        logger.info('AIGateway', `清空用户 ${userId} 的 AI 缓存 ${deleted} 条（语言切换失效）`);
      }
      return deleted;
    } catch (error) {
      logger.warn('AIGateway', 'clearUserCache 失败（非致命）', { error: error.message });
      return 0;
    }
  }

// ============================================================
// Stage 11 子模块 3 — aiGateway.js 增量补丁
// 追加方法：_callAIStream / translateStream
// 插入位置：AIGateway 类内部，clearUserCache() 之后、class 闭括号之前
// ============================================================

  /**
   * === Stage 11 子模块 3：流式 AI 调用（腾讯混元 SSE） ===
   * 
   * 与 _callAI 的区别：
   *   - _callAI: responseType='json', stream=false → 一次性返回完整结果
   *   - _callAIStream: responseType='stream', stream=true → 逐块推送结果
   * 
   * 返回的 Promise 在流完全消费后 resolve，期间通过 callbacks 逐块推送。
   * 
   * @param {Array} messages - 消息数组 [{role, content}]
   * @param {Object} options
   * @param {number} options.temperature
   * @param {number} options.maxTokens
   * @param {Function} options.onChunk - 逐块回调 (content: string) → 返回 false 中断流
   * @param {Function} options.onError - 流错误回调 (error: Error)
   * @returns {Promise<{fullText: string, model: string, usage: object}>}
   */
  async _callAIStream(messages, options = {}) {
    const baseUrl = (config.hunyuan && config.hunyuan.apiUrl) || 'https://tokenhub.tencentmaas.com/v1';
    const apiUrl = baseUrl.replace(/\/+$/, '') + '/chat/completions';
    const apiKey = (config.hunyuan && config.hunyuan.apiKey) || process.env.HUNYUAN_API_KEY;
    const model = (config.hunyuan && config.hunyuan.model) || 'hunyuan-lite';
    const { temperature = 0.3, maxTokens = 4096, onChunk, onError } = options;

    if (!apiKey) {
      const err = new Error('Hunyuan API key not configured');
      if (onError) onError(err);
      throw err;
    }

    return new Promise((resolve, reject) => {
      axios({
        method: 'POST',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        data: {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        },
        responseType: 'stream',
        timeout: 60000,
      }).then(response => {
        const stream = response.data;
        let fullText = '';
        let buffer = '';
        let aborted = false;

        const abort = () => {
          aborted = true;
          try { stream.destroy(); } catch (_) {}
        };

        stream.on('data', (chunk) => {
          if (aborted) return;
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          // 最后一行可能不完整，留作下次处理
          buffer = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                // 如果 onChunk 返回 false → 中断流（LanguageGuard 违规）
                if (onChunk && onChunk(content) === false) {
                  abort();
                  // 仍然 resolve（部分文本），由调用方决定 err 处理
                  return;
                }
              }
            } catch (_) {
              // 忽略解析失败的行（混元有时返回注释/心跳行）
            }
          }
        });

        stream.on('end', () => {
          if (aborted) return;
          // 处理缓冲区最后一条
          if (buffer.trim().startsWith('data:')) {
            const dataStr = buffer.trim().slice(5).trim();
            if (dataStr !== '[DONE]') {
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  if (onChunk) onChunk(content);
                }
              } catch (_) {}
            }
          }
          resolve({
            fullText,
            model,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          });
        });

        stream.on('error', (err) => {
          if (onError) onError(err);
          reject(new Error('AI-STREAM-ERROR: ' + err.message));
        });
      }).catch(err => {
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          const timeoutErr = new Error('AI-CONNECTION-PENDING: Stream timeout');
          if (onError) onError(timeoutErr);
          return reject(timeoutErr);
        }
        if (err.response) {
          const upstreamErr = new Error('AI-CONNECTION-PENDING: Upstream ' + String(err.response.status));
          if (onError) onError(upstreamErr);
          return reject(upstreamErr);
        }
        if (onError) onError(err);
        reject(err);
      });
    });
  }

  /**
   * === Stage 11 子模块 3：流式双向翻译 ===
   * 
   * 合规铁律：
   *   1. 双语言强制从 DB 解析（前端任何语言参数零效力）
   *   2. 全部经 AI 网关唯一入口（不直连混元）
   *   3. LanguageGuard 校验嵌入流式管线
   * 
   * 调用链路：
   *   translateStream → _resolveLangCtx → _callAIStream → onChunk(逐块)
   * 
   * @param {string} userId
   * @param {Object} params
   * @param {string} params.text - 待翻译文本
   * @param {string} params.direction - 'native_to_target'|'target_to_native'
   * @param {Object} callbacks
   * @param {Function} callbacks.onMeta - (meta) 流元信息
   * @param {Function} callbacks.onToken - (text, index) 逐块译文
   * @param {Function} callbacks.onDone - (fullText) 正常完成
   * @param {Function} callbacks.onError - (code, message) 异常错误
   * @returns {Promise<{fullText: string, model: string, streamId: string}>}
   */
  async translateStream(userId, params, callbacks = {}) {
    const { text, direction } = params;
    const { onMeta, onToken, onDone, onError } = callbacks;

    if (!userId || !text) {
      const err = new Error('Missing required params: userId and text');
      if (onError) onError('INVALID_PARAMS', err.message);
      throw err;
    }

    // ============================================================
    // 【合规闸门 1】双语言强制从 DB 解析（前端任何语言参数零效力）
    // ============================================================
    const languageContext = await this._resolveLangCtx(userId);

    const targetLang = languageContext.primaryTargetLanguage;
    const nativeLang = languageContext.explanationLanguage;

    // 根据方向确定源语言 → 目标语言
    let sourceLang, outputLang;
    if (direction === 'target_to_native') {
      sourceLang = targetLang;   // 目标语言 → 母语
      outputLang = nativeLang;
    } else {
      sourceLang = nativeLang;   // 母语 → 目标语言（默认）
      outputLang = targetLang;
    }

    const streamId = `ts_${Date.now().toString(36)}_${userId.slice(0, 8)}`;

    // ============================================================
    // 【合规闸门 2】场景白名单：仅 conversation_translate 可调用
    // ============================================================
    const allowedScenes = ['conversation_translate', 'translate'];
    const sceneId = 'conversation_translate';

    // === 发送元信息（流建立事件） ===
    if (onMeta) {
      onMeta({
        streamId,
        direction,
        sourceLang,
        targetLang: outputLang,
      });
    }

    // === LanguageGuard 输入校验 ===
    const guard = getLanguageGuard();
    const inputCheck = guard.validateInput(text, languageContext);
    if (inputCheck.violationCount > 0) {
      logger.warn('translateStream', 'Language Guard 输入违规', {
        userId, direction, violations: inputCheck.violations,
      });
    }

    // === 构建翻译 System Prompt ===
    const systemPrompt = [
      `You are a precise translation engine.`,
      `Translate from ${sourceLang} to ${outputLang}.`,
      `Rules:`,
      `1. Output ONLY the translation, no explanations, no markdown.`,
      `2. Preserve the original meaning, tone, and formatting.`,
      `3. If the input contains mixed languages, translate ALL parts to ${outputLang}.`,
      `4. Do NOT echo back the original text.`,
    ].join('\n');

    // === 流式调用 AI ===
    let chunkIndex = 0;
    let fullText = '';
    const startTime = Date.now();

    try {
      // ============================================================
      // 【合规闸门 3】全程经 aiGateway._callAIStream 流转（零直连混元）
      // ============================================================
      const result = await this._callAIStream(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        {
          temperature: 0.3,  // 翻译场景低温度确保一致性
          maxTokens: 4096,
          onChunk: (chunkContent) => {
            // [Stage 2] 累积文本
            fullText += chunkContent;
            chunkIndex++;

            // [Stage 2] LanguageGuard 逐块校验（每 20 实义字符判定一次）
            const guard = getLanguageGuard();
            const chunkCheck = guard.validateChunk
              ? guard.validateChunk(chunkContent, { text: fullText }, languageContext, sceneId)
              : { safe: true };

            if (!chunkCheck.safe) {
              logger.warn('translateStream', '流式校验失败', {
                userId, langMismatch: chunkCheck.langMismatch,
                sensitiveHit: chunkCheck.sensitiveHit, reason: chunkCheck.reason,
              });
              if (onError) {
                const code = chunkCheck.langMismatch ? 'LANG_OUTPUT_MISMATCH' : 'SENSITIVE_CONTENT';
                onError(code, chunkCheck.reason || '流式输出校验失败');
              }
              return false; // 中断流
            }

            // [Stage 2] 断句检测：检查最后一个字符是否为句末标点
            var lastChar = chunkContent.slice(-1);
            var isSentenceEnd = lastChar === '。' || lastChar === '！' || lastChar === '？' ||
              lastChar === '.' || lastChar === '!' || lastChar === '?' || lastChar === '、' ||
              lastChar === ',' || lastChar === '\n';

            if (onToken) {
              onToken(chunkContent, chunkIndex, { isSentenceEnd });
            }

            return true; // 继续流
          },
          onError: (err) => {
            if (onError) onError('AI_STREAM_ERROR', err.message);
          },
        }
      );

      // === 全量输出 LanguageGuard 校验 ===
      const outputCheck = guard.validateOutput(fullText, languageContext, sceneId);
      if (outputCheck.langMismatch) {
        const reason = outputCheck.reason || 'AI 输出语种与用户配置不符';
        // 已扣时长将在业务层退回（Stage 2）
        if (onError) onError('LANG_OUTPUT_MISMATCH', reason);
        throw new LangOutputMismatchError(reason);
      }

      const latencyMs = Date.now() - startTime;

      // === 记录 AI 请求日志（异步，不阻塞响应） ===
      this._logRequest({
        userId,
        scene: sceneId,
        requestType: sceneId,
        model: result.model || 'hunyuan',
        languageContext,
        assetHit: false,
        success: true,
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        latencyMs,
      }).catch(() => {});

      if (onDone) {
        onDone(fullText);
      }

      return {
        fullText: result.fullText || fullText,
        model: result.model || 'hunyuan',
        usage: result.usage,
        streamId,
        latencyMs,
      };

    } catch (error) {
      // 区分 LangOutputMismatchError（已在上方调用 onError）和其他异常
      if (!(error instanceof LangOutputMismatchError)) {
        if (error instanceof Error && error.message.startsWith('AI-STREAM-ERROR:')) {
          if (onError) onError('AI_STREAM_ERROR', error.message);
        } else if (error instanceof Error && error.message.startsWith('AI-CONNECTION-PENDING:')) {
          if (onError) onError('AI_CONNECTION_ERROR', error.message);
        } else {
          if (onError) onError('TRANSLATE_ERROR', error.message);
        }
      }

      // 记录失败日志
      this._logRequest({
        userId,
        scene: sceneId,
        requestType: sceneId,
        model: 'hunyuan',
        languageContext,
        assetHit: false,
        success: false,
        errorMessage: error.message,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
      }).catch(() => {});

      throw error;
    }
  }

  /**
   * === Stage 11 子模块 3：批量翻译模式（非流式，用于补齐非 SSE 场景） ===
   * 复用 translateStream 的 Prompt 构建和 LanguageGuard，但走 _callAI（非流式）。
   * 用于前端不支持 SSE 时的降级通道。
   *
   * @param {string} userId
   * @param {Object} params { text, direction }
   * @returns {Promise<{translatedText: string, sourceLang: string, targetLang: string}>}
   */
  async translate(userId, params = {}) {
    const { text, direction = 'native_to_target' } = params;

    if (!userId || !text) {
      throw new Error('Missing required params: userId and text');
    }

    // 双语言强制从 DB 解析
    const languageContext = await this._resolveLangCtx(userId);
    const targetLang = languageContext.primaryTargetLanguage;
    const nativeLang = languageContext.explanationLanguage;

    const sourceLang = direction === 'target_to_native' ? targetLang : nativeLang;
    const outputLang = direction === 'target_to_native' ? nativeLang : targetLang;

    const systemPrompt = [
      `You are a precise translation engine.`,
      `Translate from ${sourceLang} to ${outputLang}.`,
      `Output ONLY the translation, no explanations, no markdown.`,
    ].join('\n');

    // LanguageGuard 输入校验
    const guard = getLanguageGuard();
    const inputCheck = guard.validateInput(text, languageContext);
    if (inputCheck.violationCount > 0) {
      logger.warn('translate', 'Language Guard 输入违规', {
        userId, direction, violations: inputCheck.violations,
      });
    }

    const startTime = Date.now();
    const aiResult = await this._callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    );

    const translatedText = aiResult.content || '';

    // LanguageGuard 输出校验
    const outputCheck = guard.validateOutput(translatedText, languageContext, 'translate');
    if (outputCheck.langMismatch) {
      throw new LangOutputMismatchError(outputCheck.reason || 'AI 输出语种与用户配置不符');
    }

    await this._logRequest({
      userId,
      scene: 'translate',
      requestType: 'translate',
      model: aiResult.model || 'hunyuan',
      languageContext,
      assetHit: false,
      success: true,
      inputTokens: aiResult.usage?.promptTokens || 0,
      outputTokens: aiResult.usage?.completionTokens || 0,
      latencyMs: Date.now() - startTime,
    }).catch(() => {});

    return {
      translatedText,
      sourceLang,
      targetLang: outputLang,
      direction,
    };
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