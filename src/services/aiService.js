// ============================================================
// src/services/aiService.js — P2 整改：Brain 内核统一 AI 出口
// 删除 _callDirect() 直连路径，所有请求经 ai-proxy 或 Brain 降级策略
// 密钥通过 config 注入（CI 环境变量），业务层无权限读取
// ============================================================
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const prisma = require('../config/database');

const AI_PROXY_URL = process.env.AI_PROXY_URL || 'http://localhost:8787/v1/chat';
const HUNYUAN_MODEL = config.hunyuan?.model || 'hunyuan-lite';
const DEFAULT_MAX_TOKENS = 500;
const REQUEST_TIMEOUT = 30000;

class AiService {
  /**
   * callHunyuan — Brain 内核统一 AI 调用入口（P2 整改后）
   * 仅允许 aiGateway 内部调用，业务层调用直接阻断
   * 走 ai-proxy 或 Brain 降级策略，不存在直连路径
   */
  async callHunyuan(messages, opts = {}) {
    // P2 整改：调用来源检测升级为强制阻断
    const stack = new Error().stack || '';
    const isFromGateway = stack.includes('aiGateway') || stack.includes('AIGateway');
    if (!isFromGateway) {
      logger.error('AI_SERVICE_VIOLATION', '检测到非 aiGateway 的直连调用！业务层必须走 aiGateway', {
        caller: stack.split('\n').slice(1, 4).map(s => s.trim()).join(' | '),
      });
      throw new Error('AI_DIRECT_CALL_FORBIDDEN (9001): 必须通过 aiGateway 调用 AI，直连路径已删除');
    }
    const { temperature = 0.7, maxTokens = DEFAULT_MAX_TOKENS, userId } = opts;

    // 1. 优先 ai-proxy
    try {
      const result = await this._callProxy(messages, { temperature, maxTokens });
      result.source = 'proxy';
      if (userId) await this._logUsage(userId, result);
      return result;
    } catch (proxyErr) {
      logger.warn('aiService: proxy failed', proxyErr.message);
    }

    // 2. P2 整改：回退走 aiGateway 降级策略，不再直连混元
    throw new Error('AI_SERVICE_UNAVAILABLE: ai-proxy 不可用，请检查服务状态。直连路径已按宪法 Z1.2 删除');
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
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: REQUEST_TIMEOUT,
      responseType: 'json',
      responseEncoding: 'utf8',
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
   * 记录用量
   */
  async _logUsage(userId, result) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.aiUsageDailyStatistic.upsert({
        where: { date_userId_requestType: { date: today, userId, requestType: 'conversation' } },
        create: { date: today, userId, requestType: 'conversation', totalRequests: 1, inputTokens: result.usage.promptTokens || 0, outputTokens: result.usage.completionTokens || 0, estimatedCost: 0, assetHitRate: 0 },
        update: { totalRequests: { increment: 1 }, inputTokens: { increment: result.usage.promptTokens || 0 }, outputTokens: { increment: result.usage.completionTokens || 0 } },
      });
    } catch (e) {
      logger.warn('aiService: _logUsage failed', e.message);
    }
  }
}

module.exports = new AiService();