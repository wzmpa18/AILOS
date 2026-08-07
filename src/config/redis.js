const Redis = require('ioredis');
const config = require('./index');
const path = require('path');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return 200;
  },
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message);
});

// ==================== HARD-03: 底层 SDK 写操作拦截 ====================
// 不信任任何 Header，在 Redis 客户端层面直接拦截非 CacheManager 的写操作

const WRITE_METHODS = ['set', 'setex', 'setnx', 'hset', 'hmset', 'hsetnx', 'del', 'hdel', 
                       'expire', 'expireat', 'incr', 'decr', 'incrby', 'decrby', 'lpush', 
                       'rpush', 'lpop', 'rpop', 'sadd', 'srem', 'zadd', 'zrem', 'append'];

const ALLOWED_WRITE_FILES = ['core/cacheManager.js'];

/**
 * 从调用栈判断调用方是否为 CacheManager
 * 不信任任何外部传入的身份标识
 */
function isCallerCacheManager() {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');
  // 跳过: Error行 + isCallerCacheManager自身 + 当前拦截器 + redis.js自身
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/\((.+?):\d+:\d+\)/) || line.match(/at\s+(.+?):\d+:\d+/);
    if (match && match[1]) {
      const filePath = match[1].replace(/\\/g, '/');
      // 跳过 node_modules（ioredis 内部调用）
      if (filePath.includes('node_modules')) continue;
      // 跳过 config/redis.js 自身
      if (filePath.includes('config/redis')) continue;
      
      // 检查是否为 CacheManager
      for (const allowed of ALLOWED_WRITE_FILES) {
        if (filePath.includes(allowed)) return true;
      }
      // 找到第一个非基础设施调用方 → 不是 CacheManager
      console.error(`[RedisGuard] DIRECT_REDIS_WRITE_BLOCKED: 非 CacheManager 直写 Redis 被拦截`);
      console.error(`[RedisGuard] 调用方: ${filePath}`);
      return false;
    }
  }
  // 无法确定调用方 → 保守策略：允许（避免误杀基础设施初始化）
  return true;
}

// 对每个写操作方法注入拦截
for (const method of WRITE_METHODS) {
  if (typeof redis[method] === 'function') {
    const original = redis[method].bind(redis);
    redis[method] = function(...args) {
      if (!isCallerCacheManager()) {
        const err = new Error(`DEPEND_VIOLATION(9001): 业务层禁止直接写 Redis (${method})，必须通过 CoreOS CacheManager`);
        err.code = 9001;
        err.violation = 'DIRECT_REDIS_WRITE';
        return Promise.reject(err);
      }
      return original(...args);
    };
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit().catch(() => {});
});

module.exports = redis;
