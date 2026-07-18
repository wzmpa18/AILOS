import { Injectable, Logger } from '@nestjs/common';
import { MemoryAdapter } from './adapters/memory-adapter';
import { IEventBus, EventHandler, SubscribeOptions, FailedEventRecord } from './event-bus.types';
import { EventEnvelope } from '../permission/permission.types';

/**
 * Event Bus Service — AILOS Runtime 全局事件通信总线
 *
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 *
 * 职责边界:
 * - 实现 IEventBus 接口，对外暴露 publish / subscribe / unsubscribe
 * - 委托 MemoryAdapter 执行核心通信逻辑
 * - 不承载业务逻辑，不感知事件语义
 * - 与 Permission Manager 零耦合（仅复用 EventEnvelope 类型）
 *
 * Phase 1: 内存版，策略模式封装 MemoryAdapter
 * Phase 2: 通过 DI 层替换为 RabbitMQAdapter，业务代码零修改
 */
@Injectable()
export class EventBusService implements IEventBus {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly adapter: MemoryAdapter) {}

  /**
   * 发布事件
   *
   * 签名与 IEventPublisher.publish() 完全一致，保障 Phase 2 DI 替换零代码切换
   */
  async publish<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void> {
    this.logger.debug(
      `Publish: ${eventType} | event_id: ${envelope.event_id} | trace_id: ${envelope.trace_id}`,
    );
    return this.adapter.publish(eventType, envelope);
  }

  /**
   * 订阅事件
   *
   * @returns subscriptionId — 用于后续取消订阅
   */
  async subscribe<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions,
  ): Promise<string> {
    const priority = options?.priority ?? 100;
    return this.adapter.subscribe(eventType, handler as EventHandler, priority, options?.filter);
  }

  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    return this.adapter.unsubscribe(subscriptionId);
  }

  /**
   * 获取失败事件缓冲
   *
   * Phase 1 内存级临时存储，为后续 Audit Log Manager 预留接入入口
   */
  getFailedEvents(): FailedEventRecord[] {
    return this.adapter.getFailedEvents();
  }
}