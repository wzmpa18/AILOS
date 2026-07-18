import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '../event-bus/decorators/on-event.decorator';
import { EventEnvelope } from '../permission/permission.types';
import { AuditLogService } from './audit-log.service';

/**
 * Audit Log Subscriber — Event Bus 标准订阅方
 *
 * 设计基线: Audit Log Architecture Design v1.0 (07a6f29)
 *
 * 通过 @OnEvent() 声明式订阅，不直接调用 EventBusService 内部方法。
 * 优先级策略:
 *   permission.* — 50 (权限域事件优先落盘)
 *   * (全局通配) — 200 (兜底，最低优先级，不阻塞业务)
 */
@Injectable()
export class AuditLogSubscriber {
  private readonly logger = new Logger(AuditLogSubscriber.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * 订阅全平台权限域事件
   * 通配匹配: permission.* 覆盖所有 permission 域事件
   */
  @OnEvent('permission.*')
  async onPermissionEvent(envelope: EventEnvelope): Promise<void> {
    this.logger.debug(`[permission.*] Received: ${envelope.event_id}`);
    await this.auditLogService.ingest(envelope);
  }

  /**
   * 订阅全平台事件（兜底）
   * 捕获所有未被其他订阅者专门处理的事件
   */
  @OnEvent('*')
  async onAnyEvent(envelope: EventEnvelope): Promise<void> {
    this.logger.debug(`[*] Received: ${envelope.event_id}`);
    await this.auditLogService.ingest(envelope);
  }
}