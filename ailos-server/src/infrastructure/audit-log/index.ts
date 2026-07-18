/**
 * Audit Log Manager — AILOS Runtime 审计日志子系统
 * Phase 1 Task 5: IMPLEMENT
 *
 * 设计基线: Audit Log Architecture Design v1.0 (07a6f29)
 * 冻结基线: Event Bus v1.0 (4891c66) / Permission Manager v1.0 (c74bbfc)
 *
 * 目录结构:
 *   audit-log.types.ts          — 核心类型定义
 *   audit-log.provider.ts       — Symbol DI Token
 *   audit-log.service.ts        — 门面服务（标准化+存储+查询）
 *   audit-log.subscriber.ts     — @OnEvent 订阅者
 *   audit-log.module.ts         — 模块注册
 *   stores/memory-store.ts      — Phase 1 内存存储
 */

// DI Token
export { IAUDIT_LOG_STORE } from './audit-log.provider';

// 核心服务
export { AuditLogService } from './audit-log.service';

// 订阅者
export { AuditLogSubscriber } from './audit-log.subscriber';

// 模块
export { AuditLogModule } from './audit-log.module';

// 类型（type-only re-export）
export type {
  AuditLogEntry,
  AuditLogLevel,
  AuditCategory,
  AuditActor,
  AuditTarget,
  AuditChange,
  AuditMetadata,
  AuditLogQueryParams,
  AuditLogCountParams,
  AuditLogQueryResult,
  PurgeOptions,
} from './audit-log.types';

// IAuditLogStore 接口类型（type-only）
export type { IAuditLogStore } from './audit-log.types';

// 常量
export {
  MAX_MEMORY_ENTRIES,
  DEFAULT_RETENTION_DAYS,
  PERMISSION_EVENT_MAP,
  PREFIX_EVENT_RULES,
  SYSTEM_EVENT_PREFIX,
  AUTH_EVENT_PREFIX,
  DEFAULT_CATEGORY,
  DEFAULT_LEVEL,
} from './audit-log.types';

// 内部实现不对外暴露:
// MemoryStore — 仅通过 Module DI 注入，不进入 barrel export