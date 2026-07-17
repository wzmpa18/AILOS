import { Injectable, Logger } from '@nestjs/common';
import { SyncEvent } from './dto/asset.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * 多端数据同步服务
 *
 * 核心规则：
 * 1. 用户资产变更实时推送所有端
 * 2. 保障最终一致性
 * 3. 冲突合并策略：以时间戳最新为准
 * 4. 同步失败重试3次，超时进入死信队列
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  // 同步事件队列
  private syncQueue: SyncEvent[] = [];
  private deadLetterQueue: SyncEvent[] = [];
  private readonly MAX_RETRIES = 3;

  /**
   * 推送同步事件
   */
  async pushSyncEvent(event: Omit<SyncEvent, 'timestamp'>): Promise<void> {
    const syncEvent: SyncEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.syncQueue.push(syncEvent);

    // 异步推送所有端
    await this.dispatchToAllDevices(syncEvent);

    this.logger.log(`[Sync] Event pushed: ${event.eventType}, assetId=${event.assetId}`);
  }

  /**
   * 推送到所有端
   */
  private async dispatchToAllDevices(event: SyncEvent): Promise<void> {
    let attempts = 0;
    let success = false;

    while (attempts < this.MAX_RETRIES && !success) {
      try {
        // 实际部署时通过 WebSocket / SSE 推送到各端
        // await this.wsGateway.emit(event.userId, 'asset_sync', event);
        success = true;
      } catch (error) {
        attempts++;
        this.logger.warn(`[Sync] Dispatch attempt ${attempts} failed`);
        if (attempts >= this.MAX_RETRIES) {
          this.deadLetterQueue.push(event);
          this.logger.error(`[Sync] Event moved to dead letter queue: ${event.eventType}`);
        }
      }
    }
  }

  /**
   * 获取同步事件队列
   */
  async getSyncQueue(userId?: string, limit: number = 100): Promise<SyncEvent[]> {
    let events = this.syncQueue;
    if (userId) {
      events = events.filter((e) => e.userId === userId);
    }
    return events.slice(-limit);
  }

  /**
   * 获取死信队列
   */
  async getDeadLetterQueue(): Promise<SyncEvent[]> {
    return this.deadLetterQueue;
  }

  /**
   * 重试死信队列
   */
  async retryDeadLetterQueue(): Promise<number> {
    let retried = 0;
    const events = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const event of events) {
      await this.dispatchToAllDevices(event);
      retried++;
    }

    this.logger.log(`[Sync] Retried ${retried} dead letter events`);
    return retried;
  }
}
