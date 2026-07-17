import { Injectable, Logger } from '@nestjs/common';

/**
 * 事件总线服务 - 跨模块异步通信的唯一基础设施
 *
 * 命名规则：领域.对象.动作 (如 lesson.completed)
 * 投递保障：至少一次投递，消费端必须实现幂等
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  async publish(eventType: string, payload: any): Promise<void> {
    /* TODO: Phase 1 */
  }
  async subscribe(eventType: string, handler: (payload: any) => Promise<void>): Promise<void> {
    /* TODO: Phase 1 */
  }
}
