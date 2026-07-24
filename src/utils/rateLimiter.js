// ============================================================
// src/utils/rateLimiter.js
// 基于Redis的速率限制器 — Redis不可用时优雅降级（放行）
// ============================================================
const redis = require('../config/redis');
const logger = require('./logger');

/**
 * 检查速率限制
 * @param {string} key - 限制键（如手机号、IP）
 * @param {string} action - 动作类型
 * @param {number} maxAttempts - 最大尝试次数
 * @param {number} windowSeconds - 时间窗口（秒）
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
async function checkRateLimit(key, action, maxAttempts = 5, windowSeconds = 900) {
  const redisKey = `ratelimit:${action}:${key}`;

  try {
    const current = await redis.get(redisKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxAttempts) {
      const ttl = await redis.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds),
      };
    }

    // 原子递增
    const newCount = await redis.incr(redisKey);
    if (newCount === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    return {
      allowed: true,
      remaining: maxAttempts - newCount,
      resetAt: Math.floor(Date.now() / 1000) + windowSeconds,
    };
  } catch (err) {
    // Redis不可用时放行（开发环境或降级模式）
    logger.warn('Rate limiter unavailable, allowing request:', err.message);
    return { allowed: true, remaining: maxAttempts, resetAt: 0 };
  }
}

module.exports = { checkRateLimit };