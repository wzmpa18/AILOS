/**
 * State Manager 核心类型定义
 * AILOS Runtime — Phase 1 Task 2
 * 设计基线：State Manager Design Confirmation v1.1 (Frozen)
 */

/** 状态归属类型 */
export type OwnerType = 'user' | 'session' | 'domain' | 'system';

/** 状态生命周期节点 */
export type StateLifecycleStage =
  | 'created'
  | 'active'
  | 'updated'
  | 'expired'
  | 'archived'
  | 'deleted';

/** 状态条目（数据库行映射） */
export interface StateEntry {
  state_id: string;
  namespace: string;
  state_key: string;
  state_value: Record<string, unknown>;
  provider_name: string;
  owner_type: OwnerType;
  owner_id: string;
  version: number;
  ttl: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/** 状态写入参数 */
export interface StateSetOptions {
  ttlSeconds?: number;
  ownerType?: OwnerType;
  ownerId?: string;
  namespace?: string;
}

/** 原子更新结果 */
export interface AtomicUpdateResult {
  success: boolean;
  newVersion: number;
  currentValue?: Record<string, unknown> | null;
}

/** 批量写入条目 */
export interface BatchEntry {
  key: string;
  value: Record<string, unknown>;
  ttlSeconds?: number;
  options?: StateSetOptions;
}

/** 快照数据 */
export interface StateSnapshot {
  namespace: string;
  exportedAt: Date;
  version: number;
  entries: Record<string, Record<string, unknown>>;
}

/** State Manager 统一对外接口 */
export interface IStateManager {
  get<T = Record<string, unknown>>(key: string): Promise<T | null>;
  set<T = Record<string, unknown>>(
    key: string,
    value: T,
    options?: StateSetOptions,
  ): Promise<void>;
  delete(key: string): Promise<void>;

  atomicUpdate<T = Record<string, unknown>>(
    key: string,
    updater: (current: T | null) => T,
    expectedVersion?: number,
  ): Promise<AtomicUpdateResult>;

  batchGet<T = Record<string, unknown>>(
    keys: string[],
  ): Promise<Map<string, T | null>>;
  batchSet(entries: BatchEntry[]): Promise<void>;
  batchDelete(keys: string[]): Promise<void>;

  snapshot(namespace: string): Promise<StateSnapshot>;
  restore(namespace: string, snapshot: StateSnapshot): Promise<void>;
}

/** State Provider 抽象接口 */
export interface IStateProvider {
  readonly name: string;
  readonly namespace: string;
  readonly ownerDomain: string;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  read<T = Record<string, unknown>>(key: string): Promise<T | null>;
  write<T = Record<string, unknown>>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Provider 注册信息 */
export interface ProviderRegistration {
  provider_name: string;
  state_namespace: string;
  owner_domain: string;
}

/** Provider Registry 接口 */
export interface IProviderRegistry {
  register(provider: IStateProvider, registration: ProviderRegistration): void;
  unregister(providerName: string): void;
  get(providerName: string): IStateProvider | undefined;
  resolve(namespace: string): IStateProvider | undefined;
  list(): ProviderRegistration[];
}

/** 存储适配器抽象接口 */
export interface IStorageAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  read(entry: {
    state_key: string;
    namespace: string;
  }): Promise<StateEntry | null>;
  write(entry: Omit<StateEntry, 'created_at' | 'updated_at'>): Promise<void>;
  update(
    key: string,
    value: Record<string, unknown>,
    version: number,
  ): Promise<{ success: boolean; newVersion: number }>;
  softDelete(key: string): Promise<void>;
  batchRead(
    keys: string[],
  ): Promise<Map<string, StateEntry | null>>;
  batchWrite(entries: Omit<StateEntry, 'created_at' | 'updated_at'>[]): Promise<void>;
  batchDelete(keys: string[]): Promise<void>;
  snapshot(namespace: string): Promise<Map<string, StateEntry>>;
  restore(
    namespace: string,
    entries: Map<string, StateEntry>,
  ): Promise<void>;
  cleanupExpired(): Promise<number>;
}
