/**
 * CacheManager 门面编排测试
 * Phase 1 Task 6: Step 5 TEST
 *
 * 覆盖:
 * - 分层查询编排（L1→L2→L3 逐级 + 回写）
 * - 分层写入编排（按安全分级 + 写入校验）
 * - 故障降级（L2/L3 不可用时自动跳过）
 * - 统计聚合
 * - 写入安全校验（安全等级/命名空间/Schema版本/Payload大小）
 * - 强制刷新
 * - 事件发布
 */

import { CacheManager } from './cache.service';
import { MemoryStore } from './stores/memory-store';
import { RedisStore } from './stores/redis-store';
import { PrismaStore } from './stores/prisma-store';
import {
  CacheEntry,
  CacheType,
  CacheSecurityLevel,
  CacheTier,
  CacheRejectionReason,
  CacheSetOptions,
} from './cache.types';
import { createTestEntry } from './cache-contract.helper';

describe('CacheManager', () => {
  let manager: CacheManager;
  let mockMemoryStore: jest.Mocked<MemoryStore>;
  let mockRedisStore: jest.Mocked<RedisStore>;
  let mockPrismaStore: jest.Mocked<PrismaStore>;

  beforeEach(() => {
    mockMemoryStore = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidatePattern: jest.fn(),
      getStats: jest.fn(),
      setNegative: jest.fn().mockResolvedValue(undefined),
      singleFlight: jest.fn(),
      cleanup: jest.fn().mockReturnValue(0),
      isAvailable: jest.fn(() => true),
      isDegraded: jest.fn(() => false),
      connect: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    mockRedisStore = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidatePattern: jest.fn(),
      getStats: jest.fn(),
      isAvailable: jest.fn(() => true),
      isDegraded: jest.fn(() => false),
      connect: jest.fn(),
      onModuleDestroy: jest.fn(),
      markDegraded: jest.fn(),
    } as any;

    mockPrismaStore = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      invalidatePattern: jest.fn(),
      getStats: jest.fn(),
      archiveLowReuse: jest.fn(),
      purgeArchived: jest.fn(),
      isAvailable: jest.fn(() => true),
      isDegraded: jest.fn(() => false),
      connect: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    // Default stats
    mockMemoryStore.getStats.mockReturnValue({
      byTier: { L1: { hitCount: 10, missCount: 5, hitRate: 0.67, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 1 }, L2: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 }, L3: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 } },
      byNamespace: {},
      cumulative: { totalHits: 10, totalMisses: 5, totalTokensSaved: 100, totalEstimatedCostSaved: 0.5, totalEvictions: 0, totalInvalidated: 0 },
    });
    mockRedisStore.getStats.mockReturnValue({
      byTier: { L1: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 }, L2: { hitCount: 5, missCount: 3, hitRate: 0.63, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 3 }, L3: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 } },
      byNamespace: {},
      cumulative: { totalHits: 5, totalMisses: 3, totalTokensSaved: 50, totalEstimatedCostSaved: 0.25, totalEvictions: 0, totalInvalidated: 0 },
    });
    mockPrismaStore.getStats.mockReturnValue({
      byTier: { L1: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 }, L2: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 }, L3: { hitCount: 2, missCount: 1, hitRate: 0.67, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 50 }, },
      byNamespace: {},
      cumulative: { totalHits: 2, totalMisses: 1, totalTokensSaved: 20, totalEstimatedCostSaved: 0.1, totalEvictions: 0, totalInvalidated: 0 },
    });

    manager = new CacheManager(mockMemoryStore, mockRedisStore, mockPrismaStore);
  });

  // ====================================================================
  // get() — 分层查询编排
  // ====================================================================
  describe('get() — Layered Query', () => {
    it('should return from L1 on cache hit', async () => {
      const entry = createTestEntry({ cacheKey: 'get:l1:direct' });
      mockMemoryStore.get.mockResolvedValue(entry);

      const result = await manager.get('get:l1:direct');
      expect(result).not.toBeNull();
      expect(result!.cacheKey).toBe('get:l1:direct');
      expect(mockMemoryStore.get).toHaveBeenCalledWith('get:l1:direct');
      expect(mockRedisStore.get).not.toHaveBeenCalled();
    });

    it('should fall through L1 to L2 on L1 miss', async () => {
      mockMemoryStore.get.mockResolvedValue(null);
      const entry = createTestEntry({ cacheKey: 'get:l2:fallback' });
      mockRedisStore.get.mockResolvedValue(entry);
      // singleFlight: call the executor
      mockMemoryStore.singleFlight.mockImplementation(async (_key: string, fn: () => Promise<any>) => fn());

      const result = await manager.get('get:l2:fallback');
      expect(result).not.toBeNull();
      expect(result!.cacheKey).toBe('get:l2:fallback');
      expect(mockRedisStore.get).toHaveBeenCalledWith('get:l2:fallback');
      // Should backfill L1
      expect(mockMemoryStore.set).toHaveBeenCalled();
    });

    it('should fall through L1→L2 to L3 on both miss', async () => {
      mockMemoryStore.get.mockResolvedValue(null);
      mockRedisStore.get.mockResolvedValue(null);
      const entry = createTestEntry({ cacheKey: 'get:l3:deep' });
      mockPrismaStore.get.mockResolvedValue(entry);
      mockMemoryStore.singleFlight.mockImplementation(async (_key: string, fn: () => Promise<any>) => fn());

      const result = await manager.get('get:l3:deep');
      expect(result).not.toBeNull();
      expect(result!.cacheKey).toBe('get:l3:deep');
      expect(mockPrismaStore.get).toHaveBeenCalledWith('get:l3:deep');
      // Should backfill L2 and L1
      expect(mockRedisStore.set).toHaveBeenCalled();
      expect(mockMemoryStore.set).toHaveBeenCalled();
    });

    it('should return null on full miss (all layers)', async () => {
      mockMemoryStore.get.mockResolvedValue(null);
      mockRedisStore.get.mockResolvedValue(null);
      mockPrismaStore.get.mockResolvedValue(null);
      mockMemoryStore.singleFlight.mockImplementation(async (_key: string, fn: () => Promise<any>) => fn());

      const result = await manager.get('get:full:miss');
      expect(result).toBeNull();
      // Should write negative cache
      expect(mockMemoryStore.setNegative).toHaveBeenCalledWith('get:full:miss');
    });

    it('should skip L2 when degraded', async () => {
      mockMemoryStore.get.mockResolvedValue(null);
      mockRedisStore.isDegraded.mockReturnValue(true);
      const entry = createTestEntry({ cacheKey: 'get:l2:degraded' });
      mockPrismaStore.get.mockResolvedValue(entry);
      mockMemoryStore.singleFlight.mockImplementation(async (_key: string, fn: () => Promise<any>) => fn());

      const result = await manager.get('get:l2:degraded');
      expect(result).not.toBeNull();
      expect(mockRedisStore.get).not.toHaveBeenCalled();
      expect(mockPrismaStore.get).toHaveBeenCalled();
    });

    it('should skip L3 when degraded', async () => {
      mockMemoryStore.get.mockResolvedValue(null);
      mockRedisStore.get.mockResolvedValue(null);
      mockPrismaStore.isDegraded.mockReturnValue(true);
      mockMemoryStore.singleFlight.mockImplementation(async (_key: string, fn: () => Promise<any>) => fn());

      const result = await manager.get('get:l3:degraded');
      expect(result).toBeNull();
      expect(mockPrismaStore.get).not.toHaveBeenCalled();
    });
  });

  // ====================================================================
  // set() — 分层写入编排
  // ====================================================================
  describe('set() — Layered Write', () => {
    it('should write to all tiers by default', async () => {
      const entry = createTestEntry({ cacheKey: 'set:all' });
      await manager.set('set:all', entry, { skipSecurityCheck: true });

      expect(mockMemoryStore.set).toHaveBeenCalledWith('set:all', entry);
      expect(mockRedisStore.set).toHaveBeenCalledWith('set:all', entry);
      expect(mockPrismaStore.set).toHaveBeenCalledWith('set:all', entry);
    });

    it('should write only to specified tiers', async () => {
      const entry = createTestEntry({ cacheKey: 'set:l1only' });
      await manager.set('set:l1only', entry, {
        skipSecurityCheck: true,
        tiers: [CacheTier.L1],
      });

      expect(mockMemoryStore.set).toHaveBeenCalled();
      expect(mockRedisStore.set).not.toHaveBeenCalled();
      expect(mockPrismaStore.set).not.toHaveBeenCalled();
    });

    it('should skip L2 when degraded', async () => {
      mockRedisStore.isDegraded.mockReturnValue(true);
      const entry = createTestEntry({ cacheKey: 'set:l2degraded' });
      await manager.set('set:l2degraded', entry, { skipSecurityCheck: true });

      expect(mockMemoryStore.set).toHaveBeenCalled();
      expect(mockRedisStore.set).not.toHaveBeenCalled();
      expect(mockPrismaStore.set).toHaveBeenCalled();
    });

    it('should skip L3 when degraded', async () => {
      mockPrismaStore.isDegraded.mockReturnValue(true);
      const entry = createTestEntry({ cacheKey: 'set:l3degraded' });
      await manager.set('set:l3degraded', entry, { skipSecurityCheck: true });

      expect(mockMemoryStore.set).toHaveBeenCalled();
      expect(mockRedisStore.set).toHaveBeenCalled();
      expect(mockPrismaStore.set).not.toHaveBeenCalled();
    });

    it('should continue on individual store failures', async () => {
      mockRedisStore.set.mockRejectedValue(new Error('Redis error'));
      const entry = createTestEntry({ cacheKey: 'set:partial' });
      await manager.set('set:partial', entry, { skipSecurityCheck: true });

      // L1 and L3 should still succeed
      expect(mockMemoryStore.set).toHaveBeenCalled();
      expect(mockPrismaStore.set).toHaveBeenCalled();
    });
  });

  // ====================================================================
  // invalidate() — 全层级失效
  // ====================================================================
  describe('invalidate()', () => {
    it('should invalidate across all tiers', async () => {
      await manager.invalidate('inv:all');

      expect(mockMemoryStore.invalidate).toHaveBeenCalledWith('inv:all');
      expect(mockRedisStore.invalidate).toHaveBeenCalledWith('inv:all');
      expect(mockPrismaStore.invalidate).toHaveBeenCalledWith('inv:all');
    });
  });

  // ====================================================================
  // invalidatePattern() — 并行模式失效
  // ====================================================================
  describe('invalidatePattern()', () => {
    it('should invalidate pattern across all tiers in parallel', async () => {
      mockMemoryStore.invalidatePattern.mockResolvedValue(3);
      mockRedisStore.invalidatePattern.mockResolvedValue(2);
      mockPrismaStore.invalidatePattern.mockResolvedValue(1);

      const count = await manager.invalidatePattern('test.ns', 'test:*');

      expect(count).toBe(6);
      expect(mockMemoryStore.invalidatePattern).toHaveBeenCalledWith('test.ns', 'test:*');
      expect(mockRedisStore.invalidatePattern).toHaveBeenCalledWith('test.ns', 'test:*');
      expect(mockPrismaStore.invalidatePattern).toHaveBeenCalledWith('test.ns', 'test:*');
    });

    it('should handle partial failures gracefully', async () => {
      mockMemoryStore.invalidatePattern.mockResolvedValue(3);
      mockRedisStore.invalidatePattern.mockRejectedValue(new Error('Redis down'));
      mockPrismaStore.invalidatePattern.mockResolvedValue(1);

      const count = await manager.invalidatePattern('test.ns', 'test:*');
      expect(count).toBe(4); // 3 + 0 + 1
    });
  });

  // ====================================================================
  // getStats() — 聚合统计
  // ====================================================================
  describe('getStats()', () => {
    it('should aggregate stats from all tiers', () => {
      const stats = manager.getStats();

      expect(stats.cumulative.totalHits).toBe(17); // 10 + 5 + 2
      expect(stats.cumulative.totalMisses).toBe(9); // 5 + 3 + 1
      expect(stats.cumulative.totalTokensSaved).toBe(170); // 100 + 50 + 20
      expect(stats.byTier.L1.hitCount).toBe(10);
      expect(stats.byTier.L2.hitCount).toBe(5);
      expect(stats.byTier.L3.hitCount).toBe(2);
    });
  });

  // ====================================================================
  // 写入安全校验
  // ====================================================================
  describe('Write Security Validation', () => {
    it('should reject PROHIBITED security level', async () => {
      const entry = createTestEntry({
        cacheKey: 'sec:prohibited',
        securityLevel: CacheSecurityLevel.PROHIBITED,
      });

      await expect(manager.set('sec:prohibited', entry)).rejects.toThrow();
    });

    it('should reject unregistered namespace', async () => {
      const entry = createTestEntry({
        cacheKey: 'sec:badns',
        namespace: 'unregistered.bad.namespace',
      });

      await expect(manager.set('sec:badns', entry)).rejects.toThrow();
    });

    it('should reject invalid schema version', async () => {
      const entry = createTestEntry({
        cacheKey: 'sec:badschema',
        schemaVersion: 999,
      });

      await expect(manager.set('sec:badschema', entry)).rejects.toThrow();
    });

    it('should reject oversized payload', async () => {
      const entry = createTestEntry({
        cacheKey: 'sec:oversized',
        value: { data: 'x'.repeat(70000) },
      });

      await expect(manager.set('sec:oversized', entry)).rejects.toThrow();
    });

    it('should skip security check when skipSecurityCheck is true', async () => {
      const entry = createTestEntry({
        cacheKey: 'sec:skip',
        securityLevel: CacheSecurityLevel.PROHIBITED,
      });

      await manager.set('sec:skip', entry, { skipSecurityCheck: true });
      // Should not throw, and should have written
      expect(mockMemoryStore.set).toHaveBeenCalled();
    });
  });

  // ====================================================================
  // forceRefresh()
  // ====================================================================
  describe('forceRefresh()', () => {
    it('should invalidate specific key', async () => {
      const count = await manager.forceRefresh('test.ns', 'refresh:key');
      expect(count).toBe(1);
      expect(mockMemoryStore.invalidate).toHaveBeenCalledWith('refresh:key');
    });

    it('should invalidate all keys in namespace when no key specified', async () => {
      mockMemoryStore.invalidatePattern.mockResolvedValue(5);
      mockRedisStore.invalidatePattern.mockResolvedValue(3);
      mockPrismaStore.invalidatePattern.mockResolvedValue(2);

      const count = await manager.forceRefresh('test.ns');
      expect(count).toBe(10);
      expect(mockMemoryStore.invalidatePattern).toHaveBeenCalledWith('test.ns', '.*');
    });
  });

  // ====================================================================
  // Event Publishing
  // ====================================================================
  describe('Asset Event Handlers', () => {
    it('onAssetUpdated should invalidate L2 and L3', async () => {
      await manager.onAssetUpdated({ assetId: 'asset-123' });
      expect(mockRedisStore.invalidatePattern).toHaveBeenCalled();
      expect(mockPrismaStore.invalidatePattern).toHaveBeenCalled();
    });

    it('onAssetDeleted should invalidate all tiers', async () => {
      await manager.onAssetDeleted({ assetId: 'asset-456' });
      expect(mockMemoryStore.invalidatePattern).toHaveBeenCalled();
      expect(mockRedisStore.invalidatePattern).toHaveBeenCalled();
      expect(mockPrismaStore.invalidatePattern).toHaveBeenCalled();
    });

    it('onAssetArchived should invalidate L2 and L3', async () => {
      await manager.onAssetArchived({ assetId: 'asset-789' });
      expect(mockRedisStore.invalidatePattern).toHaveBeenCalled();
      expect(mockPrismaStore.invalidatePattern).toHaveBeenCalled();
    });
  });
});
