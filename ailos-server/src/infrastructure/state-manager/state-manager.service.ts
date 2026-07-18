import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IStateManager,
  StateEntry,
  StateSetOptions,
  AtomicUpdateResult,
  BatchEntry,
  StateSnapshot,
  StateLifecycleStage,
  OwnerType,
} from './state-manager.types';
import { ProviderRegistry } from './provider-registry';
import { MysqlStorageAdapter } from './mysql-storage.adapter';
import { RedisStorageAdapter } from './redis-storage.adapter';
import { SessionStateProvider } from './providers/session-state.provider';
import { SystemStateProvider } from './providers/system-state.provider';
import { DefaultStateProvider } from './providers/default-state.provider';

/**
 * State Manager — AILOS Runtime 统一状态管理核心
 *
 * 设计基线：State Manager Design Confirmation v1.1 (Frozen)
 *
 * 数据一致性规则（永久不可修改）：
 * - MySQL = 唯一持久化真值源，数据恢复、版本回滚的唯一依据
 * - Redis = 运行时缓存层，不具备最终数据效力，仅用于加速读取
 * - Write Flow: MySQL 事务提交 → 成功 → Redis 缓存更新 → 返回
 * - Read Flow:  Redis 命中 → 返回; 未命中 → MySQL 查询 → 回写 Redis → 返回
 */
@Injectable()
export class StateManager implements IStateManager, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StateManager.name);

  constructor(
    private readonly providerRegistry: ProviderRegistry,
    private readonly mysql: MysqlStorageAdapter,
    private readonly redis: RedisStorageAdapter,
    private readonly sessionProvider: SessionStateProvider,
    private readonly systemProvider: SystemStateProvider,
    private readonly defaultProvider: DefaultStateProvider,
  ) {}

  // ============================================
  // 生命周期
  // ============================================

  async onModuleInit(): Promise<void> {
    this.logger.log('StateManager initializing...');

    // 连接存储适配器
    await this.mysql.connect();
    await this.redis.connect();

    // 注册内置 Provider
    const builtInProviders = [
      {
        provider: this.sessionProvider,
        registration: {
          provider_name: 'session',
          state_namespace: 'session',
          owner_domain: 'core',
        },
      },
      {
        provider: this.systemProvider,
        registration: {
          provider_name: 'system',
          state_namespace: 'system',
          owner_domain: 'core',
        },
      },
      {
        provider: this.defaultProvider,
        registration: {
          provider_name: 'default',
          state_namespace: 'default',
          owner_domain: 'core',
        },
      },
    ];

    for (const { provider, registration } of builtInProviders) {
      await provider.initialize();
      this.providerRegistry.register(provider, registration);
    }

    this.logger.log('StateManager initialized with 3 built-in providers');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('StateManager shutting down...');
    await this.redis.disconnect();
    await this.mysql.disconnect();
    this.logger.log('StateManager shutdown complete');
  }

  // ============================================
  // 键解析
  // ============================================

  /**
   * 从 state_key 解析 namespace 和纯 key
   * 格式: namespace:rest_of_key → { namespace, stateKey }
   * 无冒号 → namespace='default'
   */
  private parseKey(key: string): { namespace: string; stateKey: string } {
    const colonIndex = key.indexOf(':');
    if (colonIndex === -1) {
      return { namespace: 'default', stateKey: key };
    }
    return {
      namespace: key.substring(0, colonIndex),
      stateKey: key,
    };
  }

  /**
   * 校验命名空间访问权限
   * 返回该命名空间对应的 provider_name，无权限则抛出异常
   */
  private authorizeNamespace(namespace: string): string {
    const provider = this.providerRegistry.resolve(namespace);
    if (!provider) {
      throw new Error(
        `Namespace "${namespace}" is not registered. ` +
        `Register a Provider for this namespace before accessing state.`,
      );
    }
    return provider.name;
  }

  // ============================================
  // 单键 CRUD
  // ============================================

  async get<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const { namespace, stateKey } = this.parseKey(key);
    this.authorizeNamespace(namespace);

    // 1. 查询 Redis 缓存
    const cached = await this.redis.read({ state_key: stateKey, namespace });
    if (cached) {
      // 检查 TTL 是否过期
      if (cached.ttl && cached.ttl < Date.now()) {
        this.logger.debug(`Cache expired for "${stateKey}", falling back to MySQL`);
      } else {
        return cached.state_value as unknown as T;
      }
    }

    // 2. 回退到 MySQL
    const entry = await this.mysql.read({ state_key: stateKey, namespace });
    if (!entry) return null;

    // 检查 TTL 是否过期
    if (entry.ttl && entry.ttl < Date.now()) {
      this.logger.debug(`State expired for "${stateKey}"`);
      return null;
    }

    // 3. 回写 Redis 缓存预热
    await this.redis.write(entry);

    return entry.state_value as unknown as T;
  }

  async set<T = Record<string, unknown>>(
    key: string,
    value: T,
    options?: StateSetOptions,
  ): Promise<void> {
    const { namespace, stateKey } = this.parseKey(key);
    const effectiveNamespace = options?.namespace || namespace;
    const providerName = this.authorizeNamespace(effectiveNamespace);

    const ttl = options?.ttlSeconds
      ? Date.now() + options.ttlSeconds * 1000
      : null;

    const entry: Omit<StateEntry, 'created_at' | 'updated_at'> = {
      state_id: randomUUID(),
      namespace: effectiveNamespace,
      state_key: stateKey,
      state_value: value as Record<string, unknown>,
      provider_name: providerName,
      owner_type: options?.ownerType || 'system',
      owner_id: options?.ownerId || '',
      version: 1,
      ttl,
      deleted_at: null,
    };

    // 1. MySQL 写入（Source of Truth）
    await this.mysql.write(entry);

    // 2. Redis 缓存更新（失败不阻塞写入成功）
    await this.redis.write(entry);
  }

  async delete(key: string): Promise<void> {
    const { namespace, stateKey } = this.parseKey(key);
    this.authorizeNamespace(namespace);

    // 1. MySQL 软删除
    await this.mysql.softDelete(stateKey);

    // 2. Redis 缓存删除
    await this.redis.softDelete(stateKey);
  }

  // ============================================
  // 原子更新（乐观锁）
  // ============================================

  async atomicUpdate<T = Record<string, unknown>>(
    key: string,
    updater: (current: T | null) => T,
    expectedVersion?: number,
  ): Promise<AtomicUpdateResult> {
    const { namespace, stateKey } = this.parseKey(key);
    this.authorizeNamespace(namespace);

    // 1. 从 MySQL 读取当前版本（Source of Truth，确保版本号准确）
    const current = await this.mysql.read({ state_key: stateKey, namespace });

    if (!current) {
      if (expectedVersion !== undefined) {
        return { success: false, newVersion: expectedVersion };
      }
      // 首次写入：使用 updater(null) 创建
      const newValue = updater(null);
      const entry: Omit<StateEntry, 'created_at' | 'updated_at'> = {
        state_id: randomUUID(),
        namespace,
        state_key: stateKey,
        state_value: newValue as Record<string, unknown>,
        provider_name: this.authorizeNamespace(namespace),
        owner_type: 'system',
        owner_id: '',
        version: 1,
        ttl: null,
        deleted_at: null,
      };
      await this.mysql.write(entry);
      await this.redis.write(entry);
      return { success: true, newVersion: 1 };
    }

    const currentVersion = current.version;
    const effectiveVersion = expectedVersion !== undefined
      ? expectedVersion
      : currentVersion;

    // 版本冲突检测
    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      return {
        success: false,
        newVersion: currentVersion,
        currentValue: current.state_value,
      };
    }

    // 2. 应用更新函数
    const currentValue = current.state_value as T | null;
    const newValue = updater(currentValue);

    // 3. MySQL 乐观锁更新
    const result = await this.mysql.update(
      stateKey,
      newValue as Record<string, unknown>,
      effectiveVersion,
    );

    if (result.success) {
      // 4. 更新 Redis 缓存
      const updated = await this.mysql.read({ state_key: stateKey, namespace });
      if (updated) {
        await this.redis.write(updated);
      }
    }

    return result;
  }

  // ============================================
  // 批量操作
  // ============================================

  async batchGet<T = Record<string, unknown>>(
    keys: string[],
  ): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    // 校验所有 key 的命名空间
    for (const key of keys) {
      const { namespace } = this.parseKey(key);
      this.authorizeNamespace(namespace);
    }

    // 1. 批量查询 Redis
    const redisResults = await this.redis.batchRead(keys);
    const missedKeys: string[] = [];

    for (const key of keys) {
      const entry = redisResults.get(key);
      if (entry && (!entry.ttl || entry.ttl >= Date.now())) {
        result.set(key, entry.state_value as unknown as T);
      } else {
        missedKeys.push(key);
      }
    }

    // 2. 未命中查 MySQL
    if (missedKeys.length > 0) {
      const mysqlResults = await this.mysql.batchRead(missedKeys);
      const writeBackEntries: Omit<StateEntry, 'created_at' | 'updated_at'>[] = [];

      for (const key of missedKeys) {
        const entry = mysqlResults.get(key);
        if (entry && (!entry.ttl || entry.ttl >= Date.now())) {
          result.set(key, entry.state_value as unknown as T);
          writeBackEntries.push(entry);
        } else {
          result.set(key, null);
        }
      }

      // 3. 回写 Redis
      if (writeBackEntries.length > 0) {
        await this.redis.batchWrite(writeBackEntries);
      }
    }

    return result;
  }

  async batchSet(entries: BatchEntry[]): Promise<void> {
    const stateEntries: Omit<StateEntry, 'created_at' | 'updated_at'>[] = [];

    for (const entry of entries) {
      const { namespace } = this.parseKey(entry.key);
      const providerName = this.authorizeNamespace(
        entry.options?.namespace || namespace,
      );
      const effectiveNamespace = entry.options?.namespace || namespace;
      const ttl = entry.ttlSeconds
        ? Date.now() + entry.ttlSeconds * 1000
        : null;

      stateEntries.push({
        state_id: randomUUID(),
        namespace: effectiveNamespace,
        state_key: entry.key,
        state_value: entry.value,
        provider_name: providerName,
        owner_type: entry.options?.ownerType || 'system',
        owner_id: entry.options?.ownerId || '',
        version: 1,
        ttl,
        deleted_at: null,
      });
    }

    // 1. MySQL 批量写入
    await this.mysql.batchWrite(stateEntries);

    // 2. Redis 批量缓存
    await this.redis.batchWrite(stateEntries);
  }

  async batchDelete(keys: string[]): Promise<void> {
    for (const key of keys) {
      const { namespace } = this.parseKey(key);
      this.authorizeNamespace(namespace);
    }

    await this.mysql.batchDelete(keys);
    await this.redis.batchDelete(keys);
  }

  // ============================================
  // 快照 / 恢复
  // ============================================

  async snapshot(namespace: string): Promise<StateSnapshot> {
    this.authorizeNamespace(namespace);

    const entries = await this.mysql.snapshot(namespace);
    const snapshotData: Record<string, Record<string, unknown>> = {};

    for (const [key, entry] of entries) {
      snapshotData[key] = entry.state_value;
    }

    this.logger.log(
      `Snapshot created: namespace=${namespace}, entries=${entries.size}`,
    );

    return {
      namespace,
      exportedAt: new Date(),
      version: 1,
      entries: snapshotData,
    };
  }

  async restore(namespace: string, snapshot: StateSnapshot): Promise<void> {
    this.authorizeNamespace(namespace);

    const entries = new Map<string, StateEntry>();
    const now = new Date();

    for (const [key, value] of Object.entries(snapshot.entries)) {
      entries.set(key, {
        state_id: randomUUID(),
        namespace,
        state_key: key,
        state_value: value,
        provider_name: this.authorizeNamespace(namespace),
        owner_type: 'system',
        owner_id: '',
        version: snapshot.version,
        ttl: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    }

    // 1. MySQL 恢复
    await this.mysql.restore(namespace, entries);

    // 2. Redis 缓存恢复
    await this.redis.restore(namespace, entries);

    this.logger.log(
      `Snapshot restored: namespace=${namespace}, entries=${entries.size}`,
    );
  }

  // ============================================
  // 生命周期查询
  // ============================================

  /**
   * 获取状态的当前生命周期节点
   * Create → Active → Updated → Expired → Archived → Deleted
   */
  async getLifecycle(key: string): Promise<StateLifecycleStage> {
    const { namespace, stateKey } = this.parseKey(key);

    const entry = await this.mysql.read({ state_key: stateKey, namespace });
    if (!entry) return 'deleted';
    if (entry.deleted_at) return 'deleted';
    if (entry.ttl && entry.ttl < Date.now()) return 'expired';
    if (entry.version > 1) return 'updated';
    return 'active';
  }

  /**
   * 清理过期状态
   * 将 ttl 已过期的记录标记为软删除
   */
  async cleanupExpired(): Promise<number> {
    const count = await this.mysql.cleanupExpired();
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired state entries`);
    }
    return count;
  }
}