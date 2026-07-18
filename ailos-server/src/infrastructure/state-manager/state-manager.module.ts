import { Module, Global } from '@nestjs/common';
import { StateManager } from './state-manager.service';
import { ProviderRegistry } from './provider-registry';
import { MysqlStorageAdapter } from './mysql-storage.adapter';
import { RedisStorageAdapter } from './redis-storage.adapter';
import { SessionStateProvider } from './providers/session-state.provider';
import { SystemStateProvider } from './providers/system-state.provider';
import { DefaultStateProvider } from './providers/default-state.provider';

/**
 * State Manager Module — Runtime Core 基础设施
 * @Global() 全局模块，整个应用共享同一个 StateManager 实例
 */
@Global()
@Module({
  providers: [
    ProviderRegistry,
    MysqlStorageAdapter,
    RedisStorageAdapter,
    SessionStateProvider,
    SystemStateProvider,
    DefaultStateProvider,
    StateManager,
  ],
  exports: [
    StateManager,
    ProviderRegistry,
  ],
})
export class StateManagerModule {}