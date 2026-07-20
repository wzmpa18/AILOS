/**
 * RedisStore 单元测试 + ICacheStore v1.0 契约验证
 * Phase 1 Task 6: Step 3 TEST
 */
import { RedisStore } from './redis-store';
import { runICacheStoreContractTests, createTestEntry } from '../cache-contract.helper';

const mockRedis: Record<string, string> = {};
const mockRedisTTL: Record<string, number> = {};

jest.mock('ioredis', () => {
  const mockRedisInstance = {
    get: jest.fn((key: string) => {
      if (mockRedisTTL[key] && mockRedisTTL[key] < Date.now()) {
        delete mockRedis[key];
        delete mockRedisTTL[key];
        return Promise.resolve(null);
      }
      return Promise.resolve(mockRedis[key] || null);
    }),
    set: jest.fn((key: string, value: string, ...args: any[]) => {
      mockRedis[key] = value;
      if (args.length > 0 && args[0] === 'EX') {
        mockRedisTTL[key] = Date.now() + (args[1] || 0) * 1000;
      }
      return Promise.resolve('OK');
    }),
    setex: jest.fn((key: string, ttl: number, value: string) => {
      mockRedis[key] = value;
      mockRedisTTL[key] = Date.now() + ttl * 1000;
      return Promise.resolve('OK');
    }),
    del: jest.fn((...keys: string[]) => {
      let count = 0;
      for (const key of keys) {
        if (mockRedis[key] !== undefined) {
          delete mockRedis[key];
          delete mockRedisTTL[key];
          count++;
        }
      }
      return Promise.resolve(count);
    }),
    scan: jest.fn((cursor: string, ...args: any[]) => {
      // Parse MATCH and COUNT from args
      let matchPattern = '*';
      let count = 100;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === 'MATCH' && i + 1 < args.length) matchPattern = args[i + 1];
        if (args[i] === 'COUNT' && i + 1 < args.length) count = args[i + 1];
      }
      // Simple pattern matching
      const regex = new RegExp('^' + matchPattern.replace(/\*/g, '.*') + '$');
      const matched = Object.keys(mockRedis).filter(k => regex.test(k));
      return Promise.resolve(['0', matched]);
    }),
    connect: jest.fn(() => Promise.resolve()),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(() => Promise.resolve('OK')),
    on: jest.fn(),
    once: jest.fn(),
    info: jest.fn(() => Promise.resolve('used_memory:1048576')),
    status: 'ready',
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockRedisInstance),
  };
});

describe('RedisStore', () => {
  let store: RedisStore;

  beforeEach(async () => {
    Object.keys(mockRedis).forEach((k) => delete mockRedis[k]);
    Object.keys(mockRedisTTL).forEach((k) => delete mockRedisTTL[k]);
    store = new RedisStore();
    await store.connect();
  });

  afterEach(async () => {
    await store.onModuleDestroy();
  });

  // ICacheStore v1.0 契约测试套件
  runICacheStoreContractTests(
    async () => {
      const s = new RedisStore();
      await s.connect();
      return s;
    },
    'RedisStore',
  );

  describe('TTL Enforcement', () => {
    it('should reject entries without expiresAt (permanent cache)', async () => {
      const entry = createTestEntry({
        cacheKey: 'ttl:permanent',
        expiresAt: undefined,
      });
      await expect(store.set('ttl:permanent', entry)).rejects.toThrow();
    });

    it('should allow entries with short TTL (expired or near-expiry)', async () => {
      const entry = createTestEntry({
        cacheKey: 'ttl:short',
        expiresAt: new Date(Date.now() + 100).toISOString(),
      });
      await expect(store.set('ttl:short', entry)).resolves.toBeUndefined();
    });
  });

  describe('Degraded Mode', () => {
    it('should return null in degraded mode', async () => {
      store.markDegraded();
      const result = await store.get('degraded:key');
      expect(result).toBeNull();
    });
  });
});
