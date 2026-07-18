import { EventEnvelope } from './permission.types';

/**
 * Event Publisher Interface — 权限事件发布抽象
 *
 * Phase 1: Mock Stub 实现，不接入真实消息队列
 * 未来: 替换为 RabbitMQ Event Publisher
 */
export const IEventPublisher = Symbol('IEventPublisher');

export interface IEventPublisher {
  /**
   * 发布权限变更事件
   * @param eventType - 事件类型 (permission.granted | role.assigned 等)
   * @param envelope  - 标准 Envelope 格式事件
   */
  publish<T = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void>;
}