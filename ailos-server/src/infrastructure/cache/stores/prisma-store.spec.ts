/**
 * PrismaStore 单元测试 + ICacheStore v1.0 契约验证
 * Phase 1 Task 6: Step 4 TEST
 */
import { PrismaStore } from './prisma-store';
import { runICacheStoreContractTests, createTestEntry } from '../cache-contract.helper';

const mockDb: any[] = [];

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    cacheEntry: {
      findUnique: jest.fn(({ where }: any) => {
        const entry = mockDb.find((e) => e.cache_key === where.cache_key);
        return Promise.resolve(entry || null);
      }),
      upsert: jest.fn(({ create, update, where }: any) => {
        const idx = mockDb.findIndex((e) => e.cache_key === where.cache_key);
        const data = { ...create, ...update };
        if (idx >= 0) {
          mockDb[idx] = { ...mockDb[idx], ...data };
          return Promise.resolve(mockDb[idx]);
        }
        const newEntry = {
          id: data.id || `prisma:${mockDb.length}`,
          cache_key: where.cache_key,
          namespace: data.namespace || 'test.namespace',
          schema_version: data.schema_version || 1,
          value: JSON.stringify(data.value || {}),
          security_level: data.security_level || 'PUBLIC',
          tenant_id: data.tenant_id || null,
          user_id: data.user_id || null,
          data_scope: data.data_scope || 'personal',
          asset_id: data.asset_id || null,
          source_module: data.source_module || 'test',
          cache_type: data.cache_type || 'GENERATED_RESULT',
          access_count: 0,
          last_accessed_at: new Date(),
          lifecycle_state: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date(),
          expires_at: data.expires_at || null,
        };
        mockDb.push(newEntry);
        return Promise.resolve(newEntry);
      }),
      update: jest.fn(({ data, where }: any) => {
        const idx = mockDb.findIndex((e) => e.cache_key === where.cache_key);
        if (idx >= 0) {
          mockDb[idx] = { ...mockDb[idx], ...data };
          return Promise.resolve(mockDb[idx]);
        }
        return Promise.reject(new Error('Not found'));
      }),
      updateMany: jest.fn(() => Promise.resolve({ count: 0 })),
      delete: jest.fn(({ where }: any) => {
        const idx = mockDb.findIndex((e) => e.cache_key === where.cache_key);
        if (idx >= 0) {
          mockDb.splice(idx, 1);
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      }),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
      count: jest.fn(() => Promise.resolve(mockDb.length)),
      findMany: jest.fn(() => Promise.resolve([...mockDb])),
    },
    $connect: jest.fn(() => Promise.resolve()),
    $disconnect: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock PrismaService — uses camelCase fields matching mapRowToEntry expectations
const mockPrismaService = {
  cacheEntry: {
    findUnique: jest.fn(({ where }: any) => {
      const entry = mockDb.find((e: any) => e.cacheKey === where.cacheKey);
      return Promise.resolve(entry || null);
    }),
    upsert: jest.fn(({ create, update, where }: any) => {
      const idx = mockDb.findIndex((e: any) => e.cacheKey === where.cacheKey);
      const merged = { ...create, ...update };
      if (idx >= 0) {
        mockDb[idx] = { ...mockDb[idx], ...merged };
        return Promise.resolve(mockDb[idx]);
      }
      const newEntry = {
        id: merged.id || `prisma:${mockDb.length}`,
        cacheKey: where.cacheKey,
        namespace: merged.namespace || 'test.namespace',
        schemaVersion: merged.schemaVersion || 1,
        value: merged.value,  // keep as-is (mapRowToEntry handles JSON.parse)
        cacheType: merged.cacheType || 'GENERATED_RESULT',
        securityLevel: merged.securityLevel || 'PUBLIC',
        sourceModule: merged.sourceModule || 'test',
        tenantId: merged.tenantId || null,
        userId: merged.userId || null,
        dataScope: merged.dataScope || 'personal',
        assetId: merged.assetId || null,
        accessCount: merged.accessCount || 0,
        lastAccessedAt: merged.lastAccessedAt ? new Date(merged.lastAccessedAt) : new Date(),
        createdAt: merged.createdAt ? new Date(merged.createdAt) : new Date(),
        updatedAt: new Date(),
        expiresAt: merged.expiresAt ? new Date(merged.expiresAt) : null,
        state: 'ACTIVE',
        archivedAt: null,
        languageIdentityHash: merged.languageIdentityHash || null,
        metadata: merged.metadata || {},
      };
      mockDb.push(newEntry);
      return Promise.resolve(newEntry);
    }),
    update: jest.fn(({ data, where }: any) => {
      const idx = mockDb.findIndex((e: any) => e.cacheKey === where.cacheKey);
      if (idx >= 0) {
        mockDb[idx] = { ...mockDb[idx], ...data, updatedAt: new Date() };
        return Promise.resolve(mockDb[idx]);
      }
      return Promise.reject(new Error('Not found'));
    }),
    updateMany: jest.fn(({ where, data }: any) => {
      let count = 0;
      for (const entry of mockDb) {
        let match = true;
        if (where.namespace && entry.namespace !== where.namespace) match = false;
        if (where.cacheKey && where.cacheKey.contains) {
          if (!entry.cacheKey.includes(where.cacheKey.contains)) match = false;
        }
        if (where.state && entry.state !== where.state) match = false;
        if (match) {
          Object.assign(entry, data, { updatedAt: new Date() });
          count++;
        }
      }
      return Promise.resolve({ count });
    }),
    deleteMany: jest.fn(({ where }: any) => {
      const before = mockDb.length;
      const remaining = mockDb.filter((e: any) => {
        if (where.state && e.state === where.state) return false;
        return true;
      });
      mockDb.length = 0;
      mockDb.push(...remaining);
      return Promise.resolve({ count: before - remaining.length });
    }),
    count: jest.fn(({ where }: any) => {
      let c = mockDb.length;
      if (where && where.state) {
        c = mockDb.filter((e: any) => e.state === where.state).length;
      }
      return Promise.resolve(c);
    }),
    findMany: jest.fn(() => Promise.resolve([...mockDb])),
    findFirst: jest.fn(({ where, orderBy }: any) => {
      let candidates = [...mockDb];
      if (where && where.state) {
        candidates = candidates.filter((e: any) => e.state === where.state);
      }
      if (orderBy && orderBy.lastAccessedAt === 'asc') {
        candidates.sort((a: any, b: any) => new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime());
      }
      return Promise.resolve(candidates[0] || null);
    }),
  },
  $queryRaw: jest.fn(() => Promise.resolve([{ '1': 1 }])),
  $connect: jest.fn(() => Promise.resolve()),
  $disconnect: jest.fn(() => Promise.resolve()),
} as any;

describe('PrismaStore', () => {
  let store: PrismaStore;

  beforeEach(async () => {
    mockDb.length = 0;
    store = new PrismaStore(mockPrismaService);
    await store.connect();
  });

  // ICacheStore v1.0 契约测试套件
  runICacheStoreContractTests(
    async () => {
      const s = new PrismaStore(mockPrismaService);
      await s.connect();
      return s;
    },
    'PrismaStore',
  );

  describe('Lifecycle State Machine', () => {
    it('should set lifecycle on create', async () => {
      const entry = createTestEntry({ cacheKey: 'lifecycle:active' });
      await store.set('lifecycle:active', entry);
      const result = await store.get('lifecycle:active');
      expect(result).not.toBeNull();
    });
  });

  describe('Dual Governance', () => {
    it('should handle IMMUTABLE_ASSET type', async () => {
      const entry = createTestEntry({
        cacheKey: 'dual:immutable',
        cacheType: 'IMMUTABLE_ASSET' as any,
      });
      await store.set('dual:immutable', entry);
      const result = await store.get('dual:immutable');
      expect(result).not.toBeNull();
    });

    it('should handle GENERATED_RESULT type', async () => {
      const entry = createTestEntry({
        cacheKey: 'dual:generated',
        cacheType: 'GENERATED_RESULT' as any,
      });
      await store.set('dual:generated', entry);
      const result = await store.get('dual:generated');
      expect(result).not.toBeNull();
    });
  });
});
