import { Injectable, Logger } from '@nestjs/common';
import { IStateProvider } from '../state-manager.types';

/**
 * System State Provider — 系统状态管理
 * 命名空间: system
 * 归属领域: core
 *
 * 管理系统级配置和运行时状态，如：
 * - 系统配置快照 (system config snapshots)
 * - 运行时标志 (runtime flags)
 * - 健康检查状态 (health check status)
 * - 功能开关 (feature flags)
 *
 * 注意：Provider 本身不直接执行 I/O，由 StateManager
 * 通过 Storage Adapter 统一调度。Provider 作为命名空间治理层存在。
 */
@Injectable()
export class SystemStateProvider implements IStateProvider {
  readonly name = 'system';
  readonly namespace = 'system';
  readonly ownerDomain = 'core';

  private readonly logger = new Logger(SystemStateProvider.name);

  async initialize(): Promise<void> {
    this.logger.log('SystemStateProvider initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.log('SystemStateProvider shutdown');
  }

  /**
   * 读取系统命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async read<T = Record<string, unknown>>(key: string): Promise<T | null> {
    this.ensureNamespace(key);
    return null;
  }

  /**
   * 写入系统命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async write<T = Record<string, unknown>>(
    key: string,
    _value: T,
    _ttlSeconds?: number,
  ): Promise<void> {
    this.ensureNamespace(key);
  }

  /**
   * 删除系统命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async delete(key: string): Promise<void> {
    this.ensureNamespace(key);
  }

  /**
   * 命名空间校验：确保 key 属于 system 命名空间
   */
  private ensureNamespace(key: string): void {
    const colonIndex = key.indexOf(':');
    const ns = colonIndex === -1 ? key : key.substring(0, colonIndex);
    if (ns !== 'system') {
      throw new Error(
        `Namespace violation: SystemStateProvider cannot access "${ns}" namespace. ` +
        `Expected "system".`,
      );
    }
  }
}