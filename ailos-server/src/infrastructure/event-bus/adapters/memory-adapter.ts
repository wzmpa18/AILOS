import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SubscriptionEntry,
  EventHandler,
  FailedEventRecord,
  MAX_PAYLOAD_SIZE,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  IDEMPOTENCY_TTL_MS,
  WILDCARD,
} from '../event-bus.types';
import { EventEnvelope } from '../../permission/permission.types';

/**
 * Memory Adapter — Phase 1 In-Memory Event Bus 实现
 *
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 *
 * 核心约束:
 * - 单事件 publish 延迟 < 10ms
 * - 订阅者异常不阻塞其他订阅者
 * - 64KB payload 上限
 * - 失败事件不静默丢弃，进入缓冲队列
 * - event_id 去重（LRU 缓存，1h TTL）
 */
@Injectable()
export class MemoryAdapter {
  private readonly logger = new Logger(MemoryAdapter.name);

  /** 订阅表: eventType → SubscriptionEntry[] */
  private readonly subscriptions = new Map<string, SubscriptionEntry[]>();

  /** 已处理事件 ID 去重缓存: event_id → timestamp */
  private readonly processedEvents = new Map<string, number>();

  /** 失败事件缓冲 */
  private readonly failedEvents: FailedEventRecord[] = [];

  /** 去重缓存清理定时器 */
  private cleanupTimer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    this.logger.log('Memory adapter initialized');
    // 定期清理过期去重缓存
    this.cleanupTimer = setInterval(() => this.cleanupProcessedCache(), 5 * 60 * 1000);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.processedEvents.clear();
    this.failedEvents.length = 0;
    this.logger.log('Memory adapter destroyed');
  }

  // ============================================
  // 发布
  // ============================================

  async publish<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void> {
    // 校验 payload 体积
    const payloadSize = Buffer.byteLength(JSON.stringify(envelope.payload), 'utf-8');
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      throw new Error(
        `Event payload exceeds ${MAX_PAYLOAD_SIZE} bytes limit (actual: ${payloadSize} bytes). ` +
        `eventType: ${eventType}, event_id: ${envelope.event_id}`,
      );
    }

    // 幂等检查（在迭代订阅者之前，避免第一个订阅者标记后阻止后续订阅者）
    if (this.isProcessed(envelope.event_id)) {
      this.logger.debug(`Duplicate event skipped: ${envelope.event_id}`);
      return;
    }

    // 匹配订阅者
    const matchedHandlers = this.matchSubscribers(eventType);

    if (matchedHandlers.length === 0) {
      // 无匹配订阅者，静默返回
      return;
    }

    // 按优先级执行
    for (const entry of matchedHandlers) {
      await this.executeWithRetry(entry, eventType, envelope);
    }

    // 所有订阅者处理完毕后标记已处理
    this.markProcessed(envelope.event_id);
  }

  // ============================================
  // 订阅管理
  // ============================================

  async subscribe(
    eventType: string,
    handler: EventHandler,
    priority = 100,
    filter?: (envelope: EventEnvelope) => boolean,
  ): Promise<string> {
    const id = randomUUID();
    const entry: SubscriptionEntry = {
      id,
      eventType,
      handler,
      priority,
      filter,
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(entry);
    // 按优先级排序
    existing.sort((a, b) => a.priority - b.priority);
    this.subscriptions.set(eventType, existing);

    this.logger.log(`Subscribed: ${eventType} → ${id} (priority: ${priority})`);
    return id;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    let removed = false;
    for (const [eventType, entries] of this.subscriptions.entries()) {
      const filtered = entries.filter((e) => e.id !== subscriptionId);
      if (filtered.length !== entries.length) {
        removed = true;
        if (filtered.length === 0) {
          this.subscriptions.delete(eventType);
        } else {
          this.subscriptions.set(eventType, filtered);
        }
      }
    }
    if (removed) {
      this.logger.log(`Unsubscribed: ${subscriptionId}`);
    }
  }

  /** 获取所有订阅（用于模块扫描注册） */
  registerSubscription(
    eventType: string,
    handler: EventHandler,
    priority = 100,
    filter?: (envelope: EventEnvelope) => boolean,
  ): string {
    const id = randomUUID();
    const entry: SubscriptionEntry = {
      id,
      eventType,
      handler,
      priority,
      filter,
    };

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(entry);
    existing.sort((a, b) => a.priority - b.priority);
    this.subscriptions.set(eventType, existing);

    return id;
  }

  // ============================================
  // 查询
  // ============================================

  getFailedEvents(): FailedEventRecord[] {
    return [...this.failedEvents];
  }

  getSubscriptionCount(): number {
    let count = 0;
    for (const entries of this.subscriptions.values()) {
      count += entries.length;
    }
    return count;
  }

  // ============================================
  // 内部方法
  // ============================================

  /** 匹配订阅者：精确匹配 + 前缀通配 */
  private matchSubscribers(eventType: string): SubscriptionEntry[] {
    const results: SubscriptionEntry[] = [];

    for (const [pattern, entries] of this.subscriptions.entries()) {
      if (this.isPatternMatch(pattern, eventType)) {
        results.push(...entries);
      }
    }

    // 按优先级排序
    results.sort((a, b) => a.priority - b.priority);

    return results;
  }

  /** 判断订阅模式是否匹配事件类型 */
  private isPatternMatch(pattern: string, eventType: string): boolean {
    // 精确匹配
    if (pattern === eventType) return true;
    // 前缀通配：domain.* 匹配 domain.sub.action
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix + '.');
    }
    return false;
  }

  /** 带重试的处理器执行 */
  private async executeWithRetry<T extends Record<string, unknown> = Record<string, unknown>>(
    entry: SubscriptionEntry,
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void> {
    // 可选过滤器
    if (entry.filter && !entry.filter(envelope)) {
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_COUNT + 1; attempt++) {
      try {
        await entry.handler(envelope as EventEnvelope);
        // 成功
        return;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Handler failed for "${envelope.event_id}" (attempt ${attempt}/${MAX_RETRY_COUNT + 1}): ${error.message}`,
        );

        if (attempt < MAX_RETRY_COUNT + 1) {
          await this.sleep(RETRY_DELAY_MS);
        }
      }
    }

    // 重试耗尽 → 记录失败
    this.recordFailedEvent(eventType, envelope, lastError!);
  }

  /** 记录失败事件 */
  private recordFailedEvent<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
    error: Error,
  ): void {
    const record: FailedEventRecord = {
      event_id: envelope.event_id,
      event_type: eventType,
      trace_id: envelope.trace_id,
      retry_count: MAX_RETRY_COUNT,
      error_type: error.constructor.name,
      error_message: error.message,
      timestamp: new Date().toISOString(),
    };

    this.failedEvents.push(record);

    // 缓冲区上限保护
    if (this.failedEvents.length > 1000) {
      this.failedEvents.shift();
    }

    this.logger.error(
      `Failed event buffered: ${envelope.event_id} | ` +
      `type: ${eventType} | trace: ${envelope.trace_id} | error: ${error.message}`,
    );
  }

  /** 幂等去重：检查是否已处理 */
  private isProcessed(eventId: string): boolean {
    const timestamp = this.processedEvents.get(eventId);
    if (!timestamp) return false;
    if (Date.now() - timestamp > IDEMPOTENCY_TTL_MS) {
      this.processedEvents.delete(eventId);
      return false;
    }
    return true;
  }

  /** 标记事件已处理 */
  private markProcessed(eventId: string): void {
    this.processedEvents.set(eventId, Date.now());
  }

  /** 清理过期去重缓存 */
  private cleanupProcessedCache(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [eventId, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > IDEMPOTENCY_TTL_MS) {
        this.processedEvents.delete(eventId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired idempotency entries`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}