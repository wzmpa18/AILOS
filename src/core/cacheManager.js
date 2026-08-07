/**
 * Core OS CacheManager — SSOT 唯一缓存写入口
 * 
 * P2 整改：红线 3 强制标准
 * 仅此组件有权执行 Redis 写操作
 * 业务层只能调用此组件的 invalidate 方法触发缓存失效
 * 
 * 关联违宪：VC-C001~C008
 */
const logger = require('../utils/logger');

let _redis = null;
function getRedis() {
  if (!_redis) {
    try { _redis = require('../config/redis'); } catch (e) {
      logger.warn('[CacheManager] Redis 不可用');
      _redis = null;
    }
  }
  return _redis;
}

const CacheManager = {
  /**
   * 缓存失效 — 业务层唯一允许的缓存写操作
   * @param {string} pattern - 缓存 Key 模式，如 'user:123:*'
   */
  async invalidate(pattern) {
    const redis = getRedis();
    if (!redis) return;
    try {
      // 删除匹配的 Key
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info('[CacheManager] invalidated', { pattern, count: keys.length });
        }
      } else {
        await redis.del(pattern);
        logger.info('[CacheManager] invalidated', { key: pattern });
      }
    } catch (e) {
      logger.error('[CacheManager] invalidate failed', e.message);
    }
  },

  /**
   * Token 黑名单写入 — 安全合规必需场景
   * 仅 auth 领域可用，其他业务层禁止
   */
  async blacklistToken(token, ttl) {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.setex(`blacklist:token:${token}`, ttl, '1');
    } catch (e) {
      logger.error('[CacheManager] blacklistToken failed', e.message);
    }
  },

  /**
   * 用户级全设备吊销
   */
  async blacklistUser(userId, ttl) {
    const redis = getRedis();
    if (!redis) return;
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      await redis.setex(`blacklist:uid:${userId}`, ttl, String(nowSec));
    } catch (e) {
      logger.error('[CacheManager] blacklistUser failed', e.message);
    }
  },

  /**
   * 风控标记 — 安全合规必需场景
   */
  async setRiskFlag(key, value, ttl) {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(key, String(value), 'EX', ttl);
    } catch (e) {
      logger.error('[CacheManager] setRiskFlag failed', e.message);
    }
  },

  /**
   * 风控计数器
   */
  async incrRiskCounter(key, ttl) {
    const redis = getRedis();
    if (!redis) return 0;
    try {
      const val = await redis.incr(key);
      await redis.expire(key, ttl);
      return val;
    } catch (e) {
      return 0;
    }
  },
};

module.exports = CacheManager;
