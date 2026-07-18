import { EventEnvelope } from '../permission/permission.types';

/**
 * Event Bus 核心类型定义
 * AILOS Runtime — Phase 1 Task 4
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 *
 * EventEnvelope 所有权归 Permission Manager v1.0 冻结定义，
 * 本模块仅 import 复用，禁止重新声明。
 */

// ============================================
// 核心接口
// ============================================

/** 事件处理函数签名 */
export type EventHandler<T extends Record<string, unknown> = Record<string, unknown>> = (
  envelope: EventEnvelope<T>,
) => Promise<void>;

/** 订阅选项 */
export interface SubscribeOptions {
  /** 处理优先级，数字越小越优先，默认 100 */
  priority?: number;
  /** 可选过滤器 */
  filter?: (envelope: EventEnvelope) => boolean;
}

/** Event Bus 统一对外接口 */
export interface IEventBus {
  /** 发布事件 */
  publish<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void>;

  /** 订阅事件，返回 subscriptionId */
  subscribe<T extends Record<string, unknown> = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions,
  ): Promise<string>;

  /** 取消订阅 */
  unsubscribe(subscriptionId: string): Promise<void>;

  /** 获取失败事件缓冲（仅用于审计 / 排查，Phase 1 内存级） */
  getFailedEvents(): FailedEventRecord[];
}

// ============================================
// 内部类型
// ============================================

/** 订阅条目 */
export interface SubscriptionEntry {
  id: string;
  eventType: string;
  handler: EventHandler;
  priority: number;
  filter?: (envelope: EventEnvelope) => boolean;
}

/** 失败事件记录 */
export interface FailedEventRecord {
  event_id: string;
  event_type: string;
  trace_id: string;
  retry_count: number;
  error_type: string;
  error_message: string;
  timestamp: string;
}

/** 消息队列适配器接口 — Phase 2 预留 */
export interface IMessageQueueAdapter {
  connect(url: string): Promise<void>;
  disconnect(): Promise<void>;
  publish(routingKey: string, message: Buffer, options?: PublishOptions): Promise<void>;
  subscribe(routingKey: string, handler: MessageHandler): Promise<void>;
}

/** Phase 2 发布选项 */
export interface PublishOptions {
  persistent?: boolean;
  expiration?: string;
}

/** Phase 2 消息处理函数 */
export type MessageHandler = (message: Buffer) => Promise<void>;

// ============================================
// 常量
// ============================================

/** 单事件 payload 体积上限 */
export const MAX_PAYLOAD_SIZE = 64 * 1024; // 64KB

/** 最大重试次数 */
export const MAX_RETRY_COUNT = 3;

/** 重试间隔（毫秒） */
export const RETRY_DELAY_MS = 500;

/** 已处理事件 ID 去重缓存 TTL（毫秒） */
export const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000; // 1 hour

/** 通配符匹配符号 */
export const WILDCARD = '*';

/** @OnEvent 装饰器元数据 Key */
export const EVENT_HANDLER_METADATA = Symbol('EVENT_HANDLER_METADATA');

/** 装饰器处理器元数据 */
export interface OnEventMetadata {
  eventPattern: string;
  propertyKey: string;
}