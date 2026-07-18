/**
 * Event Bus — AILOS Runtime 全局事件通信总线
 * Phase 1 Task 4: IMPLEMENT
 *
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 * 冻结基线: Permission Manager v1.0 (6a02bd9) — EventEnvelope 合约
 *
 * 目录结构:
 *   event-bus.types.ts          — 核心类型定义
 *   event-bus.provider.ts       — Symbol DI Token
 *   event-bus.service.ts        — 核心服务实现
 *   event-bus.module.ts         — @Global() 模块注册
 *   adapters/memory-adapter.ts  — Phase 1 In-Memory 适配器
 *   decorators/on-event.decorator.ts — @OnEvent 声明式订阅
 */

// DI Token
export { IEventBus } from './event-bus.provider';

// 核心服务
export { EventBusService } from './event-bus.service';

// 模块
export { EventBusModule } from './event-bus.module';

// 适配器（内部实现，仅通过 Module DI 注入，不对外暴露）
// MemoryAdapter is registered inside EventBusModule, not exported publicly

// 装饰器
export { OnEvent } from './decorators/on-event.decorator';

// 类型（type-only re-export）
export type {
  IEventBus as IEventBusContract,
  EventHandler,
  SubscribeOptions,
  SubscriptionEntry,
  FailedEventRecord,
  IMessageQueueAdapter,
  PublishOptions,
  MessageHandler,
  OnEventMetadata,
} from './event-bus.types';

// 常量
export {
  MAX_PAYLOAD_SIZE,
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  IDEMPOTENCY_TTL_MS,
  WILDCARD,
  EVENT_HANDLER_METADATA,
} from './event-bus.types';