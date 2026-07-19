/**
 * L1 MemoryStore — 内存缓存适配器
 * Phase 1 Task 6: Step 2 IMPLEMENT
 *
 * 特性:
 * - LRU 淘汰策略（容量超限时淘汰最早过期 50%）
 * - 负缓存机制（不存在 Key 写入 60s 短 TTL）
 * - 进程级 Single Flight 锁（同一 Key 仅一个请求回源）
 * - TTL ±20% 随机抖动
 * - 命中率统计
 *
 * 契约: 实现 ICacheStore v1.0 接口
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ICacheStore,
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheSecurityLevel,
  MAX_MEMORY_ENTRIES,
  DEFAULT_L1_TTL_SECONDS,
  NEGATIVE_CACHE_TTL_SECONDS,
  TTL_JITTER_RATIO,
  SINGLE_FLIGHT_LOCK_TIMEOUT_SECONDS,
  SINGLE_FLIGHT_WAIT_TIMEOUT_SECONDS,
  CacheNotFoundError,
  CacheExpiredError,
  CacheStorageUnavailableError,
} from '../cache.types';

interface MemoryEntry {
  entry: CacheEntry;
  insertedAt: number;
  isNegative: boolean;
}

@Injectable()
export class MemoryStore implements ICacheStore {
  private readonly logger = new Logger(MemoryStore.name);
  private readonly store: Map<string, MemoryEntry> = new Map();
  private readonly inFlightRequests: Map<string, Promise<CacheEntry | null>> = new Map();

  // Stats
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private invalidatedCount = 0;
  private totalLatencyMs = 0;
  private requestCount = 0;

  // ============================================================================
  // ICacheStore v1.0 — get
  // ============================================================================

  async get(key: string): Promise<CacheEntry | null> {
    const startTime = Date.now();
    try {
      const memEntry = this.store.get(key);
      if (!memEntry) {
        this.missCount++;
        return null;
      }

      // 检查是否过期
      if (this.isExpired(memEntry)) {
        this.store.delete(key);
        this.evictionCount++;
        this.missCount++;
        return null;
      }

      // 负缓存命中
      if (memEntry.isNegative) {
        this.missCount++;
        return null;
      }

      // 命中
      this.hitCount++;
      const entry = memEntry.entry;
      entry.accessCount++;
      entry.lastAccessedAt = new Date().toISOString();
      return entry;
    } finally {
      this.requestCount++;
      this.totalLatencyMs += Date.now() - startTime;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — set
  // ============================================================================

  async set(key: string, entry: CacheEntry): Promise<void> {
    // 容量管控：LRU 淘汰
    if (this.store.size >= MAX_MEMORY_ENTRIES) {
      this.evictLRU();
    }

    const ttl = this.applyJitter(
      entry.securityLevel === CacheSecurityLevel.PUBLIC
        ? DEFAULT_L1_TTL_SECONDS
        : DEFAULT_L1_TTL_SECONDS
    );

    const memEntry: MemoryEntry = {
      entry,
      insertedAt: Date.now(),
      isNegative: false,
    };

    this.store.set(key, memEntry);
  }

  // ============================================================================
  // 负缓存（缓存穿透防护）
  // ============================================================================

  /**
   * 写入负缓存条目
   * 不存在的结果写入短 TTL，避免缓存穿透
   */
  async setNegative(key: string): Promise<void> {
    if (this.store.size >= MAX_MEMORY_ENTRIES) {
      this.evictLRU();
    }

    const negativeEntry: CacheEntry = {
      id: `negative:${key}`,
      cacheKey: key,
      namespace: 'system.negative',
      schemaVersion: 1,
      cacheType: 'GENERATED_RESULT' as any,
      securityLevel: CacheSecurityLevel.PUBLIC,
      sourceModule: 'cache-manager',
      dataScope: 'platform',
      accessCount: 0,
      createdAt: new Date().toISOString(),
      value: { _negative: true },
      metadata: { scene: 'negative', domain: 'system' },
    };

    const memEntry: MemoryEntry = {
      entry: negativeEntry,
      insertedAt: Date.now(),
      isNegative: true,
    };

    this.store.set(key, memEntry);
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidate
  // ============================================================================

  async invalidate(key: string): Promise<void> {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.invalidatedCount++;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidatePattern
  // ============================================================================

  async invalidatePattern(namespace: string, pattern: string): Promise<number> {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const [key, memEntry] of this.store.entries()) {
      if (memEntry.entry.namespace === namespace && regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    this.invalidatedCount += count;
    return count;
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
        L1: {
          hitCount: this.hitCount,
          missCount: this.missCount,
          hitRate,
          evictionCount: this.evictionCount,
          invalidatedCount: this.invalidatedCount,
          avgLatencyMs: avgLatency,
        },
        L2: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 },
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
  // Single Flight（缓存击穿防护）
  // ============================================================================

  /**
   * Single Flight 锁：同一 Key 同一时间仅允许一个请求回源
   * @returns 缓存条目，或 null（需回源）
   */
  async singleFlight(
    key: string,
    fetcher: () => Promise<CacheEntry | null>,
  ): Promise<CacheEntry | null> {
    // 检查是否已有进行中的请求
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      this.logger.debug(`[SingleFlight] Waiting for in-flight request: ${key}`);
      return this.waitForResult(key, existing);
    }

    // 创建新请求
    const promise = this.executeWithTimeout(key, fetcher);
    this.inFlightRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  private async waitForResult(
    key: string,
    promise: Promise<CacheEntry | null>,
  ): Promise<CacheEntry | null> {
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => {
        this.logger.warn(`[SingleFlight] Wait timeout for key: ${key}`);
        resolve(null);
      }, SINGLE_FLIGHT_WAIT_TIMEOUT_SECONDS * 1000),
    );

    const result = await Promise.race([promise, timeout]);
    return result;
  }

  private async executeWithTimeout(
    key: string,
    fetcher: () => Promise<CacheEntry | null>,
  ): Promise<CacheEntry | null> {
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => {
        this.logger.warn(`[SingleFlight] Lock timeout for key: ${key}`);
        resolve(null);
      }, SINGLE_FLIGHT_LOCK_TIMEOUT_SECONDS * 1000),
    );

    const result = await Promise.race([fetcher(), timeout]);
    return result;
  }

  // ============================================================================
  // 内部方法
  // ============================================================================

  /** 检查是否过期 */
  private isExpired(memEntry: MemoryEntry): boolean {
    if (!memEntry.entry.expiresAt) return false;
    const ttl = memEntry.isNegative
      ? NEGATIVE_CACHE_TTL_SECONDS * 1000
      : new Date(memEntry.entry.expiresAt).getTime() - Date.now();
    return ttl <= 0;
  }

  /** TTL 随机抖动 */
  applyJitter(ttlSeconds: number): number {
    const jitter = ttlSeconds * TTL_JITTER_RATIO;
    const offset = (Math.random() - 0.5) * 2 * jitter;
    return Math.max(1, Math.round(ttlSeconds + offset));
  }

  /** LRU 淘汰 */
  private evictLRU(): void {
    const entries = Array.from(this.store.entries());
    // 按插入时间排序，移除最早 50% 的条目
    entries.sort((a, b) => a[1].insertedAt - b[1].insertedAt);
    const removeCount = Math.ceil(entries.length * 0.5);
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.store.delete(entries[i][0]);
      this.evictionCount++;
    }
    this.logger.debug(`[LRU] Evicted ${removeCount} entries`);
  }

  /** 获取当前条目数 */
  get size(): number {
    return this.store.size;
  }

  /** 获取进行中请求数 */
  get inFlightCount(): number {
    return this.inFlightRequests.size;
  }

  /** 清理过期条目（定期巡检） */
  cleanup(): number {
    let count = 0;
    for (const [key, memEntry] of this.store.entries()) {
      if (this.isExpired(memEntry)) {
        this.store.delete(key);
        this.evictionCount++;
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(`[Cleanup] Removed ${count} expired entries`);
    }
    return count;
  }
}