import { Injectable, Logger } from '@nestjs/common';
import { IEventPublisher } from './event-publisher.interface';
import { EventEnvelope } from './permission.types';

/**
 * Event Publisher Stub — Phase 1 空实现
 *
 * 权限变更操作预留事件发布调用点，不阻塞主流程。
 * Event Bus Module 就绪后，替换为真实 RabbitMQ 发布者。
 */
@Injectable()
export class EventPublisherStub implements IEventPublisher {
  private readonly logger = new Logger(EventPublisherStub.name);

  async publish<T = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void> {
    this.logger.debug(
      `[STUB] Event "${eventType}" published: trace_id=${envelope.trace_id}`,
    );
    // Phase 1: 空实现，不阻塞主流程
    // Phase 2: 替换为 RabbitMQ channel.publish()
  }
}