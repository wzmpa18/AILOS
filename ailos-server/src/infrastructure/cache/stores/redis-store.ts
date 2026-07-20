/**
 * L2 RedisStore — Redis 缓存适配器
 * Phase 1 Task 6: Step 3 IMPLEMENT
 *
 * 特性:
 * - 独立连接池（不与 StateManager 共享）
 * - 精确 Key 匹配（Phase 1）
 * - volatile-lru 淘汰策略
 * - TTL ±20% 随机抖动
 * - 命名空间硬隔离（ailos:cache:l2:*）
 * - 无 TTL Key 禁止写入
 *
 * 契约: 实现 ICacheStore v1.0 接口
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import {
  ICacheStore,
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheType,
  CacheSecurityLevel,
  CacheLifecycleState,
  DEFAULT_L2_TTL_SECONDS,
  TTL_JITTER_RATIO,
  REDIS_CACHE_PREFIX,
  REGISTERED_NAMESPACES,
  CacheStorageUnavailableError,
} from '../cache.types';

@Injectable()
export class RedisStore implements ICacheStore, OnModuleDestroy {
  private readonly logger = new Logger(RedisStore.name);
  private redis: Redis | null = null;
  private available = false;
  private degraded = false;
  private recoveryTimer: NodeJS.Timeout | null = null;

  // Stats
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private invalidatedCount = 0;
  private totalLatencyMs = 0;
  private requestCount = 0;

  // ============================================================================
  // 生命周期
  // ============================================================================

  async onModuleDestroy(): Promise<void> {
    if (this.recoveryTimer) clearInterval(this.recoveryTimer);
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /** 初始化 Redis 连接 */
  async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT || '6379', 10),
        db: 1, // 缓存专用 DB，与 State (db:0) 隔离
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed after 3 retries, marking as degraded');
            this.markDegraded();
            return null; // 停止重试
          }
          return Math.min(times * 200, 2000);
        },
      });

      await this.redis.connect();
      this.available = true;
      this.degraded = false;
      this.logger.log('RedisStore connected successfully (db:1, cache domain)');
    } catch (error) {
      this.logger.warn(`RedisStore connection failed, operating in degraded mode: ${error}`);
      this.markDegraded();
    }
  }

  /** 标记降级（测试可见） */
  markDegraded(): void {
    this.degraded = true;
    this.available = false;
    // 60 秒后自动重试
    this.recoveryTimer = setInterval(async () => {
      await this.tryRecover();
    }, 60 * 1000);
  }

  private async tryRecover(): Promise<void> {
    try {
      await this.connect();
      if (this.available && this.recoveryTimer) {
        clearInterval(this.recoveryTimer);
        this.recoveryTimer = null;
        this.logger.log('RedisStore recovered from degraded mode');
      }
    } catch {
      // 继续等待下次重试
    }
  }

  /** 检查是否可用 */
  isAvailable(): boolean {
    return this.available && this.redis !== null;
  }

  /** 检查是否降级 */
  isDegraded(): boolean {
    return this.degraded;
  }

  // ============================================================================
  // ICacheStore v1.0 — get
  // ============================================================================

  async get(key: string): Promise<CacheEntry | null> {
    if (!this.isAvailable()) {
      return null; // 降级模式：静默返回 null，不抛异常
    }

    const startTime = Date.now();
    try {
      const redisKey = this.buildRedisKey(key);
      const raw = await this.redis!.get(redisKey);

      if (!raw) {
        this.missCount++;
        return null;
      }

      const entry: CacheEntry = JSON.parse(raw);

      // 检查是否过期
      if (entry.expiresAt && new Date(entry.expiresAt).getTime() <= Date.now()) {
        this.missCount++;
        return null;
      }

      this.hitCount++;
      entry.accessCount++;
      entry.lastAccessedAt = new Date().toISOString();
      return entry;
    } catch (error) {
      this.logger.error(`Redis get error: ${error}`);
      this.missCount++;
      throw new CacheStorageUnavailableError(CacheTier.L2, String(error));
    } finally {
      this.requestCount++;
      this.totalLatencyMs += Date.now() - startTime;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — set
  // ============================================================================

  async set(key: string, entry: CacheEntry): Promise<void> {
    if (!this.isAvailable()) {
      throw new CacheStorageUnavailableError(CacheTier.L2, 'Redis not connected');
    }

    // TTL 强制校验：L2 禁止写入无 TTL 的永久 Key
    if (!entry.expiresAt) {
      throw new Error('L2 RedisStore: TTL is required. Permanent cache only allowed in L3.');
    }
    const ttlSeconds = this.getTTL(entry);

    const redisKey = this.buildRedisKey(key);
    // 短 TTL / 已过期 TTL 使用最小 1 秒兜底，确保条目能写入并快速过期
    const ttlWithJitter = this.applyJitter(Math.max(1, ttlSeconds));

    try {
      await this.redis!.setex(redisKey, ttlWithJitter, JSON.stringify(entry));
    } catch (error) {
      this.logger.error(`Redis set error: ${error}`);
      throw new CacheStorageUnavailableError(CacheTier.L2, String(error));
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidate
  // ============================================================================

  async invalidate(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return; // 降级模式下静默跳过
    }

    const redisKey = this.buildRedisKey(key);
    try {
      const deleted = await this.redis!.del(redisKey);
      if (deleted > 0) {
        this.invalidatedCount++;
      }
    } catch (error) {
      this.logger.error(`Redis invalidate error: ${error}`);
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidatePattern
  // ============================================================================

  async invalidatePattern(namespace: string, pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    const scanPattern = `${REDIS_CACHE_PREFIX}:${namespace}:${pattern}`;
    let count = 0;
    let cursor = '0';

    try {
      do {
        const [newCursor, keys] = await this.redis!.scan(cursor, 'MATCH', scanPattern, 'COUNT', 100);
        cursor = newCursor;
        if (keys.length > 0) {
          const deleted = await this.redis!.del(...keys);
          count += deleted;
        }
      } while (cursor !== '0');

      this.invalidatedCount += count;
      return count;
    } catch (error) {
      this.logger.error(`Redis invalidatePattern error: ${error}`);
      return 0;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — getStats
  // ============================================================================

  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    const avgLatency = this.requestCount > 0 ? this.totalLatencyMs / this.requestCount : 0;

    return {
      byTier: {
        L1: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 },
        L2: {
          hitCount: this.hitCount,
          missCount: this.missCount,
          hitRate,
          evictionCount: this.evictionCount,
          invalidatedCount: this.invalidatedCount,
          avgLatencyMs: avgLatency,
        },
        L3: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 },
      },
      byNamespace: {},
      cumulative: {
        totalHits: this.hitCount,
        totalMisses: this.missCount,
        totalTokensSaved: 0,
        totalEstimatedCostSaved: 0,
        totalEvictions: this.evictionCount,
        totalInvalidated: this.invalidatedCount,
      },
    };
  }

  // ============================================================================
  // 内部方法
  // ============================================================================

  /** 构建 Redis Key */
  private buildRedisKey(key: string): string {
    return `${REDIS_CACHE_PREFIX}:${key}`;
  }

  /** 获取 TTL */
  private getTTL(entry: CacheEntry): number {
    if (!entry.expiresAt) return DEFAULT_L2_TTL_SECONDS;
    const ttlSeconds = Math.floor(
      (new Date(entry.expiresAt).getTime() - Date.now()) / 1000
    );
    return ttlSeconds; // 返回原始值，调用方负责 clamp
  }

  /** TTL 随机抖动 */
  applyJitter(ttlSeconds: number): number {
    const jitter = ttlSeconds * TTL_JITTER_RATIO;
    const offset = (Math.random() - 0.5) * 2 * jitter;
    return Math.max(1, Math.round(ttlSeconds + offset));
  }
}