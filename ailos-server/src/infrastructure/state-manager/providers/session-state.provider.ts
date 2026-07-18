import { Injectable, Logger } from '@nestjs/common';
import { IStateProvider } from '../state-manager.types';

/**
 * Session State Provider — 会话状态管理
 * 命名空间: session
 * 归属领域: core
 *
 * 管理用户会话相关的临时状态，如：
 * - 会话元数据 (session metadata)
 * - 用户偏好 (user preferences)
 * - 临时工作状态 (temporary work state)
 *
 * 注意：Provider 本身不直接执行 I/O，由 StateManager
 * 通过 Storage Adapter 统一调度。Provider 作为命名空间治理层存在。
 */
@Injectable()
export class SessionStateProvider implements IStateProvider {
  readonly name = 'session';
  readonly namespace = 'session';
  readonly ownerDomain = 'core';

  private readonly logger = new Logger(SessionStateProvider.name);

  async initialize(): Promise<void> {
    this.logger.log('SessionStateProvider initialized');
  }

  async shutdown(): Promise<void> {
    this.logger.log('SessionStateProvider shutdown');
  }

  /**
   * 读取会话命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async read<T = Record<string, unknown>>(key: string): Promise<T | null> {
    this.ensureNamespace(key);
    return null;
  }

  /**
   * 写入会话命名空间下的状态
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
   * 删除会话命名空间下的状态
   * 由 StateManager 调度，Provider 仅做命名空间校验
   */
  async delete(key: string): Promise<void> {
    this.ensureNamespace(key);
  }

  /**
   * 命名空间校验：确保 key 属于 session 命名空间
   */
  private ensureNamespace(key: string): void {
    const colonIndex = key.indexOf(':');
    const ns = colonIndex === -1 ? key : key.substring(0, colonIndex);
    if (ns !== 'session') {
      throw new Error(
        `Namespace violation: SessionStateProvider cannot access "${ns}" namespace. ` +
        `Expected "session".`,
      );
    }
  }
}