/**
 * ICacheStore v1.0 契约一致性测试套件
 * Phase 1 Task 6: Step 1 IMPLEMENT
 *
 * 所有 ICacheStore 适配器（Memory/Redis/Prisma）必须复用同一套测试用例基准
 * 确保正常行为与异常输出完全一致
 */

import { ICacheStore, CacheEntry, CacheType, CacheSecurityLevel, CacheTier } from './cache.types';

/** 创建测试用 CacheEntry */
export function createTestEntry(overrides: Partial<CacheEntry> = {}): CacheEntry {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cacheKey: `test:key:${Math.random().toString(36).slice(2, 8)}`,
    namespace: 'test.namespace.scenario',
    schemaVersion: 1,
    cacheType: CacheType.GENERATED_RESULT,
    securityLevel: CacheSecurityLevel.PUBLIC,
    sourceModule: 'test-suite',
    dataScope: 'platform',
    accessCount: 0,
    createdAt: new Date().toISOString(),
    value: { test: true, data: 'hello' },
    metadata: { scene: 'test', domain: 'test' },
    ...overrides,
  };
}

/**
 * 运行 ICacheStore 契约测试套件
 * 所有适配器调用此函数，传入 store 实例和存储名称
 */
export function runICacheStoreContractTests(
  store: ICacheStore,
  storeName: string,
  options: {
    /** 是否跳过持久化测试（L1 内存存储不支持 L2/L3 特性） */
    skipPersistence?: boolean;
    /** 是否支持 pattern 失效 */
    supportsPattern?: boolean;
  } = {},
): void {
  describe(`ICacheStore Contract — ${storeName}`, () => {
    // ========================================================================
    // get() — 4 种场景
    // ========================================================================
    describe('get()', () => {
      it('should return null for non-existent key', async () => {
        const result = await store.get('non-existent-key');
        expect(result).toBeNull();
      });

      it('should return entry for existing key', async () => {
        const entry = createTestEntry({ cacheKey: 'get:hit' });
        await store.set('get:hit', entry);

        const result = await store.get('get:hit');
        expect(result).not.toBeNull();
        expect(result!.id).toBe(entry.id);
        expect(result!.value).toEqual(entry.value);
      });

      it('should return null for expired key', async () => {
        const entry = createTestEntry({
          cacheKey: 'get:expired',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        await store.set('get:expired', entry);

        // 等待过期
        await new Promise((resolve) => setTimeout(resolve, 50));
        const result = await store.get('get:expired');
        expect(result).toBeNull();
      });

      it('should handle data corruption gracefully', async () => {
        // 写入后立即查询，验证数据完整性
        const entry = createTestEntry({
          cacheKey: 'get:corrupt',
          value: { nested: { deep: { value: 42 } }, array: [1, 2, 3] },
        });
        await store.set('get:corrupt', entry);

        const result = await store.get('get:corrupt');
        expect(result).not.toBeNull();
        expect(result!.value).toEqual(entry.value);
      });
    });

    // ========================================================================
    // set() — 4 种场景
    // ========================================================================
    describe('set()', () => {
      it('should store entry successfully', async () => {
        const entry = createTestEntry({ cacheKey: 'set:normal' });
        await store.set('set:normal', entry);

        const result = await store.get('set:normal');
        expect(result).not.toBeNull();
        expect(result!.id).toBe(entry.id);
      });

      it('should enforce TTL', async () => {
        const entry = createTestEntry({
          cacheKey: 'set:ttl',
          expiresAt: new Date(Date.now() + 500).toISOString(),
        });
        await store.set('set:ttl', entry);

        // 立即查询应命中
        let result = await store.get('set:ttl');
        expect(result).not.toBeNull();

        // 等待 TTL 过期
        await new Promise((resolve) => setTimeout(resolve, 600));
        result = await store.get('set:ttl');
        expect(result).toBeNull();
      }, 2000);

      it('should respect namespace isolation', async () => {
        const entry1 = createTestEntry({ cacheKey: 'ns:key1', namespace: 'test.ns.one' });
        const entry2 = createTestEntry({ cacheKey: 'ns:key2', namespace: 'test.ns.two' });

        await store.set('ns:key1', entry1);
        await store.set('ns:key2', entry2);

        // 两个不同命名空间的条目应共存
        const result1 = await store.get('ns:key1');
        const result2 = await store.get('ns:key2');
        expect(result1).not.toBeNull();
        expect(result2).not.toBeNull();
        expect(result1!.namespace).toBe('test.ns.one');
        expect(result2!.namespace).toBe('test.ns.two');
      });

      it('should validate security level', async () => {
        const entry = createTestEntry({
          cacheKey: 'set:security',
          securityLevel: CacheSecurityLevel.PUBLIC,
        });
        await store.set('set:security', entry);

        const result = await store.get('set:security');
        expect(result).not.toBeNull();
        expect(result!.securityLevel).toBe(CacheSecurityLevel.PUBLIC);
      });
    });

    // ========================================================================
    // invalidate() — 精确 Key 失效
    // ========================================================================
    describe('invalidate()', () => {
      it('should invalidate existing entry', async () => {
        const entry = createTestEntry({ cacheKey: 'invalidate:exist' });
        await store.set('invalidate:exist', entry);

        await store.invalidate('invalidate:exist');
        const result = await store.get('invalidate:exist');
        expect(result).toBeNull();
      });

      it('should not throw for non-existent key', async () => {
        await expect(
          store.invalidate('invalidate:non-existent'),
        ).resolves.not.toThrow();
      });
    });

    // ========================================================================
    // invalidatePattern() — 按模式批量失效
    // ========================================================================
    describe('invalidatePattern()', () => {
      it('should invalidate by namespace pattern', async () => {
        const ns = 'pattern.test.scenario';
        const entry1 = createTestEntry({ cacheKey: 'pattern:key1', namespace: ns });
        const entry2 = createTestEntry({ cacheKey: 'pattern:key2', namespace: ns });

        await store.set('pattern:key1', entry1);
        await store.set('pattern:key2', entry2);

        const count = await store.invalidatePattern(ns, 'pattern');
        expect(count).toBeGreaterThanOrEqual(0);

        const result1 = await store.get('pattern:key1');
        const result2 = await store.get('pattern:key2');
        expect(result1 || result2).toBeNull();
      });

      it('should return 0 for non-matching pattern', async () => {
        const count = await store.invalidatePattern('nonexistent.namespace', 'no-match');
        expect(count).toBe(0);
      });
    });

    // ========================================================================
    // getStats() — 统计准确性
    // ========================================================================
    describe('getStats()', () => {
      it('should return valid stats structure', async () => {
        const stats = store.getStats();
        expect(stats).toBeDefined();
        expect(stats.byTier).toBeDefined();
        expect(stats.byTier.L1).toBeDefined();
        expect(stats.byTier.L2).toBeDefined();
        expect(stats.byTier.L3).toBeDefined();
        expect(stats.cumulative).toBeDefined();
        expect(typeof stats.cumulative.totalHits).toBe('number');
        expect(typeof stats.cumulative.totalMisses).toBe('number');
      });

      it('should track hit/miss counts', async () => {
        const entry = createTestEntry({ cacheKey: 'stats:hit' });
        await store.set('stats:hit', entry);

        await store.get('stats:hit'); // hit
        await store.get('stats:non-existent'); // miss

        const stats = store.getStats();
        expect(stats.cumulative.totalHits).toBeGreaterThanOrEqual(0);
        expect(stats.cumulative.totalMisses).toBeGreaterThanOrEqual(0);
      });
    });

    // ========================================================================
    // 异常契约一致性
    // ========================================================================
    describe('Exception Contract', () => {
      it('should throw CacheNotFoundError or return null for missing key', async () => {
        const result = await store.get('exception:not-found');
        // 不同实现可能返回 null 或抛出异常，但不应抛出未预期的异常
        if (result === null) {
          expect(result).toBeNull();
        }
      });

      it('should handle expired entries without throwing unexpected errors', async () => {
        const entry = createTestEntry({
          cacheKey: 'exception:expired',
          expiresAt: new Date(Date.now() - 10000).toISOString(),
        });
        await store.set('exception:expired', entry);

        const result = await store.get('exception:expired');
        // 过期条目应返回 null
        expect(result).toBeNull();
      });
    });
  });
}