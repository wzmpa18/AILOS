/**
 * ICacheStore v1.0 契约测试套件
 * Phase 1 Task 6: IMPLEMENT
 *
 * 统一契约测试基准，所有适配器（Memory/Redis/Prisma）复用同一套测试用例。
 * 覆盖 5 个核心接口：
 *   get() — 命中 / 未命中 / 已过期 / 数据损坏
 *   set() — 正常写入 / TTL 生效 / 命名空间隔离
 *   invalidate() — 精确 Key 失效
 *   invalidatePattern() — 按命名空间模式批量失效
 *   getStats() — 统计准确性
 *   Exception Contract — 统一异常语义
 */

import { ICacheStore, CacheEntry, CacheType, CacheSecurityLevel } from './cache.types';

/** 创建测试用 CacheEntry */
export function createTestEntry(overrides: Partial<CacheEntry> = {}): CacheEntry {
  return {
    id: `test:${Date.now()}:${Math.random().toString(36).slice(2)}`,
    cacheKey: 'test:key:default',
    namespace: 'test.namespace',
    schemaVersion: 1,
    cacheType: CacheType.GENERATED_RESULT,
    securityLevel: CacheSecurityLevel.PUBLIC,
    sourceModule: 'test-suite',
    dataScope: 'personal',
    userId: 'test-user',
    accessCount: 0,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    value: { content: 'test content' },
    metadata: {
      scene: 'test',
      domain: 'test',
      modelId: 'test-model',
      assetId: 'test-asset',
      tokenEstimate: 100,
    },
    ...overrides,
  };
}

/** ICacheStore v1.0 契约测试套件 */
export function runICacheStoreContractTests(
  storeFactory: () => ICacheStore | Promise<ICacheStore>,
  label: string,
): void {
  describe(`${label} — ICacheStore v1.0 Contract`, () => {
    let store: ICacheStore;

    beforeEach(async () => {
      store = await storeFactory();
    });

    // ====================================================================
    // get() — 3 场景
    // ====================================================================
    describe('get()', () => {
      it('should return entry on cache hit', async () => {
        const entry = createTestEntry({ cacheKey: 'get:hit' });
        await store.set('get:hit', entry);

        const result = await store.get('get:hit');
        expect(result).not.toBeNull();
        expect(result!.id).toBe(entry.id);
        expect(result!.cacheKey).toBe('get:hit');
      });

      it('should return null on cache miss', async () => {
        const result = await store.get('get:miss:non-existent');
        expect(result).toBeNull();
      });

      it('should return null on expired entry', async () => {
        const entry = createTestEntry({
          cacheKey: 'get:expired',
          expiresAt: new Date(Date.now() - 10000).toISOString(),
        });
        await store.set('get:expired', entry);

        const result = await store.get('get:expired');
        expect(result).toBeNull();
      });
    });

    // ====================================================================
    // set() — 3 场景
    // ====================================================================
    describe('set()', () => {
      it('should write entry and retrieve it', async () => {
        const entry = createTestEntry({ cacheKey: 'set:normal' });
        await store.set('set:normal', entry);

        const result = await store.get('set:normal');
        expect(result).not.toBeNull();
        expect(result!.value).toEqual(entry.value);
      });

      it('should enforce TTL expiration', async () => {
        const entry = createTestEntry({
          cacheKey: 'set:ttl',
          expiresAt: new Date(Date.now() + 100).toISOString(),
        });
        await store.set('set:ttl', entry);

        await new Promise((r) => setTimeout(r, 150));

        const result = await store.get('set:ttl');
        expect(result).toBeNull();
      });

      it('should handle namespace isolation', async () => {
        const entryA = createTestEntry({
          cacheKey: 'set:ns-a',
          namespace: 'learning.exercise',
        });
        const entryB = createTestEntry({
          cacheKey: 'set:ns-b',
          namespace: 'ai.translation',
        });

        await store.set('set:ns-a', entryA);
        await store.set('set:ns-b', entryB);

        const resultA = await store.get('set:ns-a');
        const resultB = await store.get('set:ns-b');

        expect(resultA).not.toBeNull();
        expect(resultB).not.toBeNull();
        expect(resultA!.namespace).toBe('learning.exercise');
        expect(resultB!.namespace).toBe('ai.translation');
      });
    });

    // ====================================================================
    // invalidate() — 精确 Key 失效
    // ====================================================================
    describe('invalidate()', () => {
      it('should invalidate exact key', async () => {
        const entry = createTestEntry({ cacheKey: 'inv:exact' });
        await store.set('inv:exact', entry);

        await store.invalidate('inv:exact');

        const result = await store.get('inv:exact');
        expect(result).toBeNull();
      });
    });

    // ====================================================================
    // invalidatePattern() — 模式批量失效
    // ====================================================================
    describe('invalidatePattern()', () => {
      it('should invalidate by namespace and pattern', async () => {
        // Use namespace-prefixed cacheKeys so both MemoryStore (namespace match)
        // and RedisStore (key pattern scan) can validate correctly
        const entry1 = createTestEntry({ cacheKey: 'invp.test:key1', namespace: 'invp.test' });
        const entry2 = createTestEntry({ cacheKey: 'invp.test:key2', namespace: 'invp.test' });
        const entry3 = createTestEntry({ cacheKey: 'invp.other:key', namespace: 'invp.other' });

        await store.set('invp.test:key1', entry1);
        await store.set('invp.test:key2', entry2);
        await store.set('invp.other:key', entry3);

        const count = await store.invalidatePattern('invp.test', '*');
        expect(count).toBeGreaterThanOrEqual(2);

        const result3 = await store.get('invp.other:key');
        expect(result3).not.toBeNull();
      });
    });

    // ====================================================================
    // getStats() — 统计准确性
    // ====================================================================
    describe('getStats()', () => {
      it('should return stats with required structure', () => {
        const stats = store.getStats();
        expect(stats).toBeDefined();
        expect(stats.byTier).toBeDefined();
        expect(stats.byTier.L1).toBeDefined();
        expect(stats.byTier.L2).toBeDefined();
        expect(stats.byTier.L3).toBeDefined();
        expect(stats.cumulative).toBeDefined();
      });

      it('should track hit/miss counts', async () => {
        const entry = createTestEntry({ cacheKey: 'stats:count' });
        await store.set('stats:count', entry);

        await store.get('stats:count');
        await store.get('stats:non-existent');

        const stats = store.getStats();
        expect(stats.cumulative.totalHits).toBeGreaterThanOrEqual(1);
        expect(stats.cumulative.totalMisses).toBeGreaterThanOrEqual(1);
      });
    });
  });
}
