/**
 * State Manager — AILOS Runtime 统一状态管理模块
 * Phase 1 Task 2: State Manager Implementation
 *
 * 设计基线: State Manager Design Confirmation v1.1 (Frozen)
 * 架构合规: arch-check: layer=runtime, gateway=true, risk=low
 */

// 核心服务
export { StateManager } from './state-manager.service';
export { StateManagerModule } from './state-manager.module';

// 类型定义
export {
  IStateManager,
  IStateProvider,
  IProviderRegistry,
  IStorageAdapter,
  StateEntry,
  StateSetOptions,
  AtomicUpdateResult,
  BatchEntry,
  StateSnapshot,
  ProviderRegistration,
  StateLifecycleStage,
  OwnerType,
} from './state-manager.types';

// 治理组件
export { ProviderRegistry } from './provider-registry';

// 存储适配器
export { MysqlStorageAdapter } from './mysql-storage.adapter';
export { RedisStorageAdapter } from './redis-storage.adapter';

// 内置 Provider
export { SessionStateProvider } from './providers/session-state.provider';
export { SystemStateProvider } from './providers/system-state.provider';
export { DefaultStateProvider } from './providers/default-state.provider';