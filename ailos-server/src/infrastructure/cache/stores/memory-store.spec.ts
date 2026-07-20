/**
 * MemoryStore 单元测试 + ICacheStore v1.0 契约验证
 * Phase 1 Task 6: Step 2 TEST
 */
import { MemoryStore } from './memory-store';
import { runICacheStoreContractTests, createTestEntry } from '../cache-contract.helper';
import { CacheEntry, CacheType, CacheSecurityLevel, MAX_MEMORY_ENTRIES } from '../cache.types';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  // ========================================================================
  // ICacheStore v1.0 契约测试套件
  // ========================================================================
  runICacheStoreContractTests(
    () => new MemoryStore(),
    'MemoryStore',
  );

  // ========================================================================
  // MemoryStore 特有功能测试
  // ========================================================================
  describe('Negative Cache', () => {
    it('should store negative cache entry', async () => {
      await store.setNegative('neg:key1');
      const result = await store.get('neg:key1');
      expect(result).toBeNull();
    });

    it('should expire negative cache after TTL', async () => {
      await store.setNegative('neg:key2');
      const memEntry = (store as any).store.get('neg:key2');
      if (memEntry) {
        memEntry.entry.expiresAt = new Date(Date.now() - 1000).toISOString();
      }
      const result = await store.get('neg:key2');
      expect(result).toBeNull();
    });
  });

  describe('Single Flight', () => {
    it('should deduplicate concurrent requests for same key', async () => {
      let callCount = 0;
      const fetcher = async (): Promise<CacheEntry | null> => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return createTestEntry({ cacheKey: 'sf:dedup' });
      };

      const results = await Promise.all([
        store.singleFlight('sf:dedup', fetcher),
        store.singleFlight('sf:dedup', fetcher),
        store.singleFlight('sf:dedup', fetcher),
      ]);

      expect(callCount).toBe(1);
      expect(results[0]?.id).toBe(results[1]?.id);
      expect(results[2]?.id).toBe(results[1]?.id);
    });

    it('should return null on wait timeout', async () => {
      const fetcher = async (): Promise<CacheEntry | null> => {
        await new Promise((r) => setTimeout(r, 6000));
        return createTestEntry({ cacheKey: 'sf:timeout' });
      };

      const firstPromise = store.singleFlight('sf:timeout', fetcher);
      const secondResult = await store.singleFlight('sf:timeout', fetcher);
      expect(secondResult).toBeNull();
    }, 8000);

    it('should return null on lock timeout', async () => {
      const fetcher = async (): Promise<CacheEntry | null> => {
        await new Promise((r) => setTimeout(r, 11000));
        return createTestEntry({ cacheKey: 'sf:lock' });
      };

      const result = await store.singleFlight('sf:lock', fetcher);
      expect(result).toBeNull();
    }, 13000);
  });

  describe('LRU Eviction', () => {
    it('should evict oldest entries when capacity exceeded', async () => {
      for (let i = 0; i < MAX_MEMORY_ENTRIES + 10; i++) {
        const entry = createTestEntry({ cacheKey: `lru:key${i}` });
        await store.set(`lru:key${i}`, entry);
      }
      expect(store.size).toBeLessThanOrEqual(MAX_MEMORY_ENTRIES);
    });
  });

  describe('TTL Jitter', () => {
    it('should apply jitter to TTL', () => {
      const baseTTL = 900;
      const jittered = store.applyJitter(baseTTL);
      expect(jittered).toBeGreaterThanOrEqual(baseTTL * 0.8);
      expect(jittered).toBeLessThanOrEqual(baseTTL * 1.2);
    });
  });

  describe('Stats Tracking', () => {
    it('should track hit/miss counts', async () => {
      const entry = createTestEntry({ cacheKey: 'stats:track' });
      await store.set('stats:track', entry);
      await store.get('stats:track');
      await store.get('stats:non-existent');

      const stats = store.getStats();
      expect(stats.byTier.L1.hitCount).toBeGreaterThanOrEqual(1);
      expect(stats.byTier.L1.missCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cleanup', () => {
    it('should remove expired entries', async () => {
      const entry = createTestEntry({
        cacheKey: 'cleanup:expired',
        expiresAt: new Date(Date.now() - 10000).toISOString(),
      });
      await store.set('cleanup:expired', entry);

      const cleaned = store.cleanup();
      expect(cleaned).toBeGreaterThanOrEqual(1);
      const result = await store.get('cleanup:expired');
      expect(result).toBeNull();
    });
  });
});
