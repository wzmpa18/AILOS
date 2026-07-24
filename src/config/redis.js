// ============================================================
// src/config/redis.js
// Redis 客户端 — 支持连接失败优雅降级
// ============================================================
const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

let redis = null;
let redisAvailable = false;

function getRedisClient() {
  if (redis) return redis;

  try {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis retry limit exceeded, marking as unavailable');
          redisAvailable = false;
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      redisAvailable = false;
      logger.warn('Redis error (non-fatal):', err.message);
    });

    redis.on('close', () => {
      redisAvailable = false;
    });

    // 尝试连接（非阻塞）
    redis.connect().catch(() => {
      logger.warn('Redis initial connection failed, will retry');
    });
  } catch (err) {
    logger.warn('Redis initialization failed:', err.message);
    redisAvailable = false;
    redis = null;
  }

  return redis;
}

// 代理对象：Redis 不可用时返回 fallback 值
const redisProxy = new Proxy({}, {
  get(target, prop) {
    const client = getRedisClient();
    if (!client || !redisAvailable) {
      // 返回安全的 fallback
      if (prop === 'get') return async () => null;
      if (prop === 'set') return async () => 'OK';
      if (prop === 'setex') return async () => 'OK';
      if (prop === 'del') return async () => 0;
      if (prop === 'exists') return async () => 0;
      if (prop === 'incr') return async () => 1;
      if (prop === 'expire') return async () => 1;
      if (prop === 'ttl') return async () => -1;
      return async () => null;
    }
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

module.exports = redisProxy;