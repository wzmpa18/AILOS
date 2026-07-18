import { Injectable, Logger } from '@nestjs/common';
import { IStateProvider } from '../state-manager.types';

/**
 * Default State Provider — 默认通用状态管理
 * 命名空间: default
 * 归属领域: core
 *
 * 管理未明确归属到特定命名空间的通用状态，如：
 * - 临时计算缓存 (temporary computation cache)
 * - 通用键值对 (generic key-value pairs)
 * - 未分类的运行时状态 (unclassified runtime state)
 *
 * 注意：Provider 本身不直接执行 I/O，由 StateManager
 * 通过 Storage Adapter 统一调度。Provider 作为命名空间治理层存在。
 */
@Injectable()
export class DefaultStateProvider implements IStateProvider {
  readonly name = 'default';
  readonly namespace = 'default';
  readonly ownerDomain = 'core';

  private readonly logger = new Logger(DefaultStateProvider.name);

  async initialize(): Promise<void> {
    this.logger.log('DefaultStateProvider initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.log('DefaultStateProvider shutdown');
  }

  /**
   * 读取默认命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async read<T = Record<string, unknown>>(key: string): Promise<T | null> {
    this.ensureNamespace(key);
    return null;
  }

  /**
   * 写入默认命名空间下的状态
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
   * 删除默认命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async delete(key: string): Promise<void> {
    this.ensureNamespace(key);
  }

  /**
   * 命名空间校验：确保 key 属于 default 命名空间
   */
  private ensureNamespace(key: string): void {
    const colonIndex = key.indexOf(':');
    const ns = colonIndex === -1 ? 'default' : key.substring(0, colonIndex);
    if (ns !== 'default') {
      throw new Error(
        `Namespace violation: DefaultStateProvider cannot access "${ns}" namespace. ` +
        `Expected "default".`,
      );
    }
  }
}