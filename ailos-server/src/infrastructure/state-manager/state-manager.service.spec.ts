import { Test, TestingModule } from '@nestjs/testing';
import { StateManager } from './state-manager.service';
import { ProviderRegistry } from './provider-registry';
import { MysqlStorageAdapter } from './mysql-storage.adapter';
import { RedisStorageAdapter } from './redis-storage.adapter';
import { SessionStateProvider } from './providers/session-state.provider';
import { SystemStateProvider } from './providers/system-state.provider';
import { DefaultStateProvider } from './providers/default-state.provider';
import { ConfigService } from '../../config/config.service';
import {
  StateEntry,
  BatchEntry,
} from './state-manager.types';

/**
 * State Manager 核心场景测试
 *
 * 测试策略：
 * - 单元测试使用 Mock 适配器，验证核心调度逻辑
 * - 集成测试需要真实 MySQL/Redis，在基础设施就绪后执行
 */
describe('StateManager', () => {
  let stateManager: StateManager;
  let providerRegistry: ProviderRegistry;

  // Mock 存储
  const mockMysqlStore = new Map<string, StateEntry>();
  const mockRedisStore = new Map<string, StateEntry>();

  /** 创建 MySQL 适配器 Mock */
  function createMysqlMock() {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockImplementation(
        (entry: { state_key: string; namespace: string }) => {
          const result = mockMysqlStore.get(entry.state_key);
          // 软删除检查
          if (result && result.deleted_at) return Promise.resolve(null);
          // TTL 过期检查
          if (result && result.ttl && result.ttl < Date.now()) return Promise.resolve(null);
          return Promise.resolve(result || null);
        },
      ),
      write: jest.fn().mockImplementation(
        (entry: Omit<StateEntry, 'created_at' | 'updated_at'>) => {
          const full: StateEntry = {
            ...entry,
            created_at: new Date(),
            updated_at: new Date(),
          };
          mockMysqlStore.set(entry.state_key, full);
          return Promise.resolve();
        },
      ),
      update: jest.fn().mockImplementation(
        (
          key: string,
          value: Record<string, unknown>,
          expectedVersion: number,
        ) => {
          const current = mockMysqlStore.get(key);
          if (!current || current.deleted_at || current.version !== expectedVersion) {
            return Promise.resolve({
              success: false,
              newVersion: current?.version ?? expectedVersion,
            });
          }
          const newVersion = expectedVersion + 1;
          current.state_value = value;
          current.version = newVersion;
          current.updated_at = new Date();
          return Promise.resolve({ success: true, newVersion });
        },
      ),
      softDelete: jest.fn().mockImplementation((key: string) => {
        const entry = mockMysqlStore.get(key);
        if (entry) {
          entry.deleted_at = new Date();
          entry.updated_at = new Date();
        }
        return Promise.resolve();
      }),
      batchRead: jest.fn().mockImplementation((keys: string[]) => {
        const result = new Map<string, StateEntry | null>();
        for (const key of keys) {
          const entry = mockMysqlStore.get(key);
          if (entry && !entry.deleted_at && (!entry.ttl || entry.ttl >= Date.now())) {
            result.set(key, entry);
          } else {
            result.set(key, null);
          }
        }
        return Promise.resolve(result);
      }),
      batchWrite: jest.fn().mockImplementation(
        (entries: Omit<StateEntry, 'created_at' | 'updated_at'>[]) => {
          for (const entry of entries) {
            mockMysqlStore.set(entry.state_key, {
              ...entry,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
          return Promise.resolve();
        },
      ),
      batchDelete: jest.fn().mockImplementation((keys: string[]) => {
        for (const key of keys) {
          const entry = mockMysqlStore.get(key);
          if (entry) {
            entry.deleted_at = new Date();
            entry.updated_at = new Date();
          }
        }
        return Promise.resolve();
      }),
      snapshot: jest.fn().mockImplementation((namespace: string) => {
        const result = new Map<string, StateEntry>();
        for (const [, entry] of mockMysqlStore) {
          if (entry.namespace === namespace && !entry.deleted_at) {
            result.set(entry.state_key, { ...entry });
          }
        }
        return Promise.resolve(result);
      }),
      restore: jest.fn().mockImplementation(
        (namespace: string, entries: Map<string, StateEntry>) => {
          // 软删除现有命名空间下的所有条目
          for (const [, entry] of mockMysqlStore) {
            if (entry.namespace === namespace && !entry.deleted_at) {
              entry.deleted_at = new Date();
              entry.updated_at = new Date();
            }
          }
          // 写入快照数据
          for (const [key, entry] of entries) {
            mockMysqlStore.set(key, { ...entry });
          }
          return Promise.resolve();
        },
      ),
      cleanupExpired: jest.fn().mockResolvedValue(0),
    };
  }

  /** 创建 Redis 适配器 Mock */
  function createRedisMock() {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockImplementation(
        (entry: { state_key: string; namespace: string }) => {
          const result = mockRedisStore.get(entry.state_key);
          if (result && result.deleted_at) return Promise.resolve(null);
          if (result && result.ttl && result.ttl < Date.now()) return Promise.resolve(null);
          return Promise.resolve(result || null);
        },
      ),
      write: jest.fn().mockImplementation(
        (entry: Omit<StateEntry, 'created_at' | 'updated_at'>) => {
          mockRedisStore.set(entry.state_key, {
            ...entry,
            created_at: new Date(),
            updated_at: new Date(),
          });
          return Promise.resolve();
        },
      ),
      update: jest.fn().mockImplementation(
        (key: string, value: Record<string, unknown>, version: number) => {
          const current = mockRedisStore.get(key);
          if (!current) {
            return Promise.resolve({ success: false, newVersion: version });
          }
          const newVersion = version + 1;
          current.state_value = value;
          current.version = newVersion;
          current.updated_at = new Date();
          return Promise.resolve({ success: true, newVersion });
        },
      ),
      softDelete: jest.fn().mockImplementation((key: string) => {
        mockRedisStore.delete(key);
        return Promise.resolve();
      }),
      batchRead: jest.fn().mockImplementation((keys: string[]) => {
        const result = new Map<string, StateEntry | null>();
        for (const key of keys) {
          const entry = mockRedisStore.get(key);
          if (entry && !entry.deleted_at && (!entry.ttl || entry.ttl >= Date.now())) {
            result.set(key, entry);
          } else {
            result.set(key, null);
          }
        }
        return Promise.resolve(result);
      }),
      batchWrite: jest.fn().mockImplementation(
        (entries: Omit<StateEntry, 'created_at' | 'updated_at'>[]) => {
          for (const entry of entries) {
            mockRedisStore.set(entry.state_key, {
              ...entry,
              created_at: new Date(),
              updated_at: new Date(),
            });
          }
          return Promise.resolve();
        },
      ),
      batchDelete: jest.fn().mockImplementation((keys: string[]) => {
        for (const key of keys) {
          mockRedisStore.delete(key);
        }
        return Promise.resolve();
      }),
      snapshot: jest.fn().mockResolvedValue(new Map<string, StateEntry>()),
      restore: jest.fn().mockImplementation(
        (namespace: string, entries: Map<string, StateEntry>) => {
          // 清除现有缓存
          for (const [key] of mockRedisStore) {
            const entry = mockRedisStore.get(key);
            if (entry && entry.namespace === namespace) {
              mockRedisStore.delete(key);
            }
          }
          // 写入快照数据
          for (const [key, entry] of entries) {
            mockRedisStore.set(key, { ...entry });
          }
          return Promise.resolve();
        },
      ),
      cleanupExpired: jest.fn().mockResolvedValue(0),
    };
  }

  beforeEach(async () => {
    mockMysqlStore.clear();
    mockRedisStore.clear();

    const mockConfigService = {
      dbConfig: { host: 'localhost', port: 3306 },
      redisConfig: { host: 'localhost', port: 6379 },
      rabbitmqConfig: { url: 'amqp://localhost:5672' },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderRegistry,
        SessionStateProvider,
        SystemStateProvider,
        DefaultStateProvider,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MysqlStorageAdapter, useFactory: createMysqlMock },
        { provide: RedisStorageAdapter, useFactory: createRedisMock },
        StateManager,
      ],
    }).compile();

    stateManager = module.get<StateManager>(StateManager);
    providerRegistry = module.get<ProviderRegistry>(ProviderRegistry);

    // 手动初始化 Provider（绕过 OnModuleInit 的 connect 调用）
    const builtInProviders = [
      module.get<SessionStateProvider>(SessionStateProvider),
      module.get<SystemStateProvider>(SystemStateProvider),
      module.get<DefaultStateProvider>(DefaultStateProvider),
    ];

    for (const provider of builtInProviders) {
      await provider.initialize();
      try {
        providerRegistry.register(provider, {
          provider_name: provider.name,
          state_namespace: provider.namespace,
          owner_domain: provider.ownerDomain,
        });
      } catch {
        // 已注册则跳过
      }
    }
  });

  // ============================================
  // 1. State CRUD 单键读写
  // ============================================
  describe('State CRUD', () => {
    it('should set and get a state value', async () => {
      await stateManager.set('session:test_key', { hello: 'world' });
      const value = await stateManager.get('session:test_key');
      expect(value).toEqual({ hello: 'world' });
    });

    it('should return null for non-existent key', async () => {
      const value = await stateManager.get('session:nonexistent');
      expect(value).toBeNull();
    });

    it('should delete a state value', async () => {
      await stateManager.set('session:to_delete', { data: 123 });
      const valueBefore = await stateManager.get('session:to_delete');
      expect(valueBefore).toEqual({ data: 123 });

      await stateManager.delete('session:to_delete');
      const valueAfter = await stateManager.get('session:to_delete');
      expect(valueAfter).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      await stateManager.set('session:ttl_test', { temp: true }, {
        ttlSeconds: -1, // 已过期
      });
      const value = await stateManager.get('session:ttl_test');
      expect(value).toBeNull();
    });

    it('should support nested objects', async () => {
      const complex = {
        user: { id: 1, name: 'test' },
        settings: { theme: 'dark' },
        tags: ['a', 'b', 'c'],
      };
      await stateManager.set('system:complex', complex);
      const value = await stateManager.get('system:complex');
      expect(value).toEqual(complex);
    });
  });

  // ============================================
  // 2. Atomic Update 原子更新
  // ============================================
  describe('Atomic Update', () => {
    it('should atomically update a value', async () => {
      await stateManager.set('session:counter', { count: 0 });

      const result = await stateManager.atomicUpdate<{ count: number }>(
        'session:counter',
        (current) => ({ count: (current?.count ?? 0) + 1 }),
      );

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(2);

      const value = await stateManager.get<{ count: number }>('session:counter');
      expect(value?.count).toBe(1);
    });

    it('should fail on version conflict', async () => {
      await stateManager.set('session:versioned', { v: 1 });

      const result = await stateManager.atomicUpdate(
        'session:versioned',
        (current) => ({ v: (current as any)?.v + 1 }),
        999, // 错误的版本号
      );

      expect(result.success).toBe(false);
    });

    it('should create new entry if key does not exist', async () => {
      const result = await stateManager.atomicUpdate<{ created: boolean }>(
        'session:new_atomic',
        () => ({ created: true }),
      );

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(1);

      const value = await stateManager.get<{ created: boolean }>(
        'session:new_atomic',
      );
      expect(value?.created).toBe(true);
    });

    it('should support multiple sequential updates', async () => {
      await stateManager.set('session:seq', { n: 0 });

      for (let i = 0; i < 5; i++) {
        const result = await stateManager.atomicUpdate<{ n: number }>(
          'session:seq',
          (current) => ({ n: (current?.n ?? 0) + 1 }),
        );
        expect(result.success).toBe(true);
      }

      const value = await stateManager.get<{ n: number }>('session:seq');
      expect(value?.n).toBe(5);
    });
  });

  // ============================================
  // 3. Batch Operations 批量操作
  // ============================================
  describe('Batch Operations', () => {
    it('should batch set and get', async () => {
      const entries: BatchEntry[] = [
        { key: 'session:batch_1', value: { id: 1 } },
        { key: 'session:batch_2', value: { id: 2 } },
        { key: 'session:batch_3', value: { id: 3 } },
      ];

      await stateManager.batchSet(entries);

      const result = await stateManager.batchGet([
        'session:batch_1',
        'session:batch_2',
        'session:batch_3',
        'session:nonexistent',
      ]);

      expect(result.get('session:batch_1')).toEqual({ id: 1 });
      expect(result.get('session:batch_2')).toEqual({ id: 2 });
      expect(result.get('session:batch_3')).toEqual({ id: 3 });
      expect(result.get('session:nonexistent')).toBeNull();
    });

    it('should batch delete', async () => {
      await stateManager.batchSet([
        { key: 'session:del_1', value: { x: 1 } },
        { key: 'session:del_2', value: { x: 2 } },
      ]);

      await stateManager.batchDelete(['session:del_1', 'session:del_2']);

      const result = await stateManager.batchGet([
        'session:del_1',
        'session:del_2',
      ]);
      expect(result.get('session:del_1')).toBeNull();
      expect(result.get('session:del_2')).toBeNull();
    });
  });

  // ============================================
  // 4. Snapshot / Restore 快照恢复
  // ============================================
  describe('Snapshot / Restore', () => {
    it('should create and restore a snapshot', async () => {
      await stateManager.set('session:snap_1', { a: 1 });
      await stateManager.set('session:snap_2', { b: 2 });

      const snapshot = await stateManager.snapshot('session');
      expect(snapshot.namespace).toBe('session');
      expect(Object.keys(snapshot.entries).length).toBeGreaterThanOrEqual(2);

      // 修改数据
      await stateManager.set('session:snap_1', { a: 999 });

      // 恢复快照
      await stateManager.restore('session', snapshot);

      const restored = await stateManager.get('session:snap_1');
      expect(restored).toEqual({ a: 1 });
    });
  });

  // ============================================
  // 5. Provider Namespace Isolation 命名空间隔离
  // ============================================
  describe('Provider Namespace Isolation', () => {
    it('should reject unregistered namespace access', async () => {
      await expect(
        stateManager.get('unregistered:some_key'),
      ).rejects.toThrow(/not registered/);
    });

    it('should allow access to registered namespaces', async () => {
      await stateManager.set('default:test', { ok: true });
      const value = await stateManager.get('default:test');
      expect(value).toEqual({ ok: true });
    });

    it('should reject duplicate provider registration', () => {
      expect(() => {
        providerRegistry.register(
          {
            name: 'session_dup',
            namespace: 'session',
            ownerDomain: 'core',
            initialize: jest.fn(),
            shutdown: jest.fn(),
            read: jest.fn(),
            write: jest.fn(),
            delete: jest.fn(),
          },
          {
            provider_name: 'session_dup',
            state_namespace: 'session',
            owner_domain: 'core',
          },
        );
      }).toThrow(/already claimed/);
    });

    it('should reject duplicate provider name', () => {
      expect(() => {
        providerRegistry.register(
          {
            name: 'session',
            namespace: 'other',
            ownerDomain: 'core',
            initialize: jest.fn(),
            shutdown: jest.fn(),
            read: jest.fn(),
            write: jest.fn(),
            delete: jest.fn(),
          },
          {
            provider_name: 'session',
            state_namespace: 'other',
            owner_domain: 'core',
          },
        );
      }).toThrow(/already registered/);
    });
  });

  // ============================================
  // 6. State Lifecycle 生命周期
  // ============================================
  describe('State Lifecycle', () => {
    it('should return active for newly created state', async () => {
      await stateManager.set('session:lifecycle', { stage: 'new' });
      const stage = await stateManager.getLifecycle('session:lifecycle');
      expect(stage).toBe('active');
    });

    it('should return updated after modification', async () => {
      await stateManager.set('session:lifecycle_mod', { v: 1 });
      await stateManager.atomicUpdate<{ v: number }>(
        'session:lifecycle_mod',
        (current) => ({ v: (current?.v ?? 0) + 1 }),
      );
      const stage = await stateManager.getLifecycle('session:lifecycle_mod');
      expect(stage).toBe('updated');
    });

    it('should return deleted after soft delete', async () => {
      await stateManager.set('session:lifecycle_del', { v: 1 });
      await stateManager.delete('session:lifecycle_del');
      const stage = await stateManager.getLifecycle('session:lifecycle_del');
      expect(stage).toBe('deleted');
    });

    it('should return deleted for non-existent key', async () => {
      const stage = await stateManager.getLifecycle('session:never_existed');
      expect(stage).toBe('deleted');
    });
  });

  // ============================================
  // 7. Provider Registry
  // ============================================
  describe('Provider Registry', () => {
    it('should list all registered providers', () => {
      const list = providerRegistry.list();
      expect(list.length).toBeGreaterThanOrEqual(3);
      const names = list.map((r) => r.provider_name);
      expect(names).toContain('session');
      expect(names).toContain('system');
      expect(names).toContain('default');
    });

    it('should resolve namespace to provider', () => {
      const provider = providerRegistry.resolve('session');
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('session');
    });

    it('should return undefined for unknown namespace', () => {
      const provider = providerRegistry.resolve('unknown');
      expect(provider).toBeUndefined();
    });

    it('should unregister a provider', () => {
      const tempProvider = {
        name: 'temp_test',
        namespace: 'temp_test',
        ownerDomain: 'core',
        initialize: jest.fn().mockResolvedValue(undefined),
        shutdown: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue(null),
        write: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      providerRegistry.register(tempProvider, {
        provider_name: 'temp_test',
        state_namespace: 'temp_test',
        owner_domain: 'core',
      });

      expect(providerRegistry.get('temp_test')).toBeDefined();

      providerRegistry.unregister('temp_test');

      expect(providerRegistry.get('temp_test')).toBeUndefined();
      expect(providerRegistry.resolve('temp_test')).toBeUndefined();
    });
  });
});