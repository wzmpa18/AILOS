// ============================================================
// src/server/middleware/aiQuotaMiddleware.js
// Module 03 Step 5 — AI 每日额度限制中间件
// 免费 50/日，Premium 200/日，超 → 429
// ============================================================
const aiQuotaService = require('../../services/aiQuotaService');
const logger = require('../../utils/logger');

/**
 * AI 额度检查中间件
 * 基于 AiUsageDailyStatistic 计数，超出每日额度返回 429
 * 若额度检查异常则 fail-open，允许请求通过
 */
async function aiQuotaMiddleware(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'GUEST_BLOCKED',
        message: '请先登录',
      });
    }

    const quota = await aiQuotaService.checkQuota(req.userId);
    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: 'QUOTA_EXHAUSTED',
        message: '今日AI使用次数已用完，请明天再试',
        quota: {
          remaining: quota.remaining,
          dailyTotal: quota.dailyTotal,
          resetTime: quota.resetTime,
        },
      });
    }

    next();
  } catch (err) {
    // Fail-open: 额度检查失败时不阻断用户请求
    logger.error('aiQuotaMiddleware error:', err.message);
    next();
  }
}

module.exports = aiQuotaMiddleware;