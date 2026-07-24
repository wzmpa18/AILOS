// ============================================================
// src/services/aiService.js
// Module 03 Step 1 — AI Gateway 客户端
// 优先 ai-proxy(:8787)，失败回退直接调混元
// ============================================================
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const prisma = require('../config/database');

const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:8787/v1/chat';
const HUNYUAN_BASE_URL = config.hunyuan?.apiUrl || 'https://tokenhub.tencentmaas.com/v1';
const HUNYUAN_API_URL = HUNYUAN_BASE_URL.replace(/\/+$/, '') + '/chat/completions';
const HUNYUAN_API_KEY = config.hunyuan?.apiKey || process.env.HUNYUAN_API_KEY;
const HUNYUAN_MODEL = config.hunyuan?.model || 'hunyuan-lite';
const DEFAULT_MAX_TOKENS = 500;
const REQUEST_TIMEOUT = 30000;

class AiService {
  /**
   * callHunyuan — 统一 AI 调用入口
   * @param {Array} messages - [{role:'system'|'user'|'assistant', content:'...'}]
   * @param {Object} opts - { temperature, maxTokens, userId }
   * @returns {Promise<{content:string, usage:{promptTokens,completionTokens,totalTokens}, model:string, source:'proxy'|'direct'}>}
   */
  async callHunyuan(messages, opts = {}) {
    const { temperature = 0.7, maxTokens = DEFAULT_MAX_TOKENS, userId } = opts;

    // 1. 优先 ai-proxy
    try {
      const result = await this._callProxy(messages, { temperature, maxTokens });
      result.source = 'proxy';
      if (userId) await this._logUsage(userId, result);
      return result;
    } catch (proxyErr) {
      logger.warn('aiService: proxy failed, falling back to direct', proxyErr.message);
    }

    // 2. 回退直接调混元
    if (!HUNYUAN_API_KEY) {
      throw new Error('AI-CONNECTION-PENDING: Hunyuan API key not configured');
    }

    const result = await this._callDirect(messages, { temperature, maxTokens });
    result.source = 'direct';
    if (userId) await this._logUsage(userId, result);
    return result;
  }

  /**
   * 通过 ai-proxy 调用
   */
  async _callProxy(messages, opts) {
    const resp = await axios.post(AI_PROXY_URL, {
      model: HUNYUAN_MODEL,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: REQUEST_TIMEOUT,
    });

    const data = resp.data;
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      content,
      model: data.model || HUNYUAN_MODEL,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    };
  }

  /**
   * 直接调混元 API
   */
  async _callDirect(messages, opts) {
    const resp = await axios.post(HUNYUAN_API_URL, {
      model: HUNYUAN_MODEL,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUNYUAN_API_KEY}`,
      },
      timeout: REQUEST_TIMEOUT,
    });

    const data = resp.data;
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      content,
      model: data.model || HUNYUAN_MODEL,
      usage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
      },
    };
  }

  /**
   * 记录用量到 AiUsageDailyStatistic
   */
  async _logUsage(userId, result) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.aiUsageDailyStatistic.upsert({
        where: {
          date_userId_requestType: {
            date: today,
            userId,
            requestType: 'conversation',
          },
        },
        create: {
          date: today,
          userId,
          requestType: 'conversation',
          totalRequests: 1,
          inputTokens: result.usage.promptTokens || 0,
          outputTokens: result.usage.completionTokens || 0,
          estimatedCost: 0,
          assetHitRate: 0,
        },
        update: {
          totalRequests: { increment: 1 },
          inputTokens: { increment: result.usage.promptTokens || 0 },
          outputTokens: { increment: result.usage.completionTokens || 0 },
        },
      });
    } catch (e) {
      logger.warn('aiService: _logUsage failed', e.message);
    }
  }
}

module.exports = new AiService();