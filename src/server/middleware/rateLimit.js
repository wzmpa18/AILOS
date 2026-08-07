const rateLimit = require('express-rate-limit');
const config = require('../../config');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');

/**
 * v1.1.0 宪法 2.4：统一 Redis 级滑动窗口限流（多进程/多实例计数一致）。
 *   ① 计数器存 Redis（incr + 首次设置 TTL），pm2 多进程共享同一计数；
 *   ② Redis 不可用时自动回退进程内 Map 计数（fail-soft），并输出 ERROR 级告警；
 *   ③ 超出返回 429 + 统一中文提示。
 * 说明：express-rate-limit 的内存计数在 pm2 多进程下互不共享，故反馈/登录/注册
 *       三个关键接口改用本函数，确保「第 4 次必 429」在多实例下依然成立。
 */

// 进程内降级计数（仅 Redis 不可用时启用），key -> {count, resetAt}
const fallbackStore = new Map();

function redisCount(key, windowSec) {
  return new Promise((resolve, reject) => {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, windowSec, 'NX'); // 仅首次设置窗口 TTL，避免每次重置
    multi.exec((err, results) => {
      if (err) return reject(err);
      const count = results && results[0] ? Number(results[0]) : 1;
      resolve(count);
    });
  });
}

function fallbackCount(key, windowSec) {
  const now = Date.now();
  const hit = fallbackStore.get(key);
  if (!hit || now > hit.resetAt) {
    const fresh = { count: 1, resetAt: now + windowSec * 1000 };
    fallbackStore.set(key, fresh);
    return 1;
  }
  hit.count += 1;
  return hit.count;
}

/**
 * 创建 Redis 级限流中间件。
 * @param {object} opts { windowMs, max, message, keyPrefix, keyGenerator }
 */
const createRedisRateLimiter = (opts = {}) => {
  const windowMs = opts.windowMs || 60 * 1000;
  const windowSec = Math.ceil(windowMs / 1000);
  const max = opts.max || 5;
  const keyPrefix = opts.keyPrefix || 'rate';
  const message = opts.message || { success: false, error: '请求过于频繁，请稍后再试' };
  const degraded = { active: false };

  return async (req, res, next) => {
    if (req.path === '/health') return next();
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userId = req.userId || '';
    const key = `${keyPrefix}:${opts.keyGenerator ? opts.keyGenerator(req) : ip}`;

    let count;
    try {
      count = await redisCount(key, windowSec);
    } catch (e) {
      // 降级到进程内计数，并告警（禁止静默失效）
      if (!degraded.active) {
        degraded.active = true;
        logger.error(`[rateLimit] Redis 不可用，限流降级为进程内计数（多实例不共享） key=${key} error=${e.message}`);
      }
      count = fallbackCount(key, windowSec);
    }

    if (count > max) {
      return res.status(429).json(message);
    }
    next();
  };
};

// ===== 内存级（express-rate-limit）保留给非关键低频接口 =====
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    max: options.max || config.rateLimit.maxRequests,
    message: options.message || {
      success: false,
      error: '请求过于频繁，请稍后再试',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    skip: (req) => req.path === '/health',
  });
};

// 反馈提交：Redis 级，同一 IP 1 分钟最多 3 次（宪法 2.4）
const feedbackLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000,
  max: 3,
  keyPrefix: 'rate:feedback:ip',
  message: { success: false, error: '提交过于频繁，请 1 分钟后再试' },
});

// 登录：Redis 级，同一 IP 15 分钟最多 5 次（宪法 2.4）
const loginLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'rate:login:ip',
  message: { success: false, error: '登录尝试过于频繁，请 15 分钟后再试' },
});

// 注册：Redis 级，同一 IP 15 分钟最多 3 次（宪法 2.4）
const registerLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyPrefix: 'rate:register:ip',
  message: { success: false, error: '注册过于频繁，请稍后再试' },
});

// 非关键低频接口（保留内存级）
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const smsLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
const apiLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });

module.exports = {
  createRateLimiter,
  createRedisRateLimiter,
  authLimiter,
  smsLimiter,
  apiLimiter,
  feedbackLimiter,
  loginLimiter,
  registerLimiter,
};
