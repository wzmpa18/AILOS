import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { MemoryStore } from './stores/memory-store';
import { IAUDIT_LOG_STORE } from './audit-log.provider';

/**
 * Audit Log Module — AILOS Runtime 审计日志模块
 *
 * 设计基线: Audit Log Architecture Design v1.0 (07a6f29)
 *
 * 职责:
 * - 注册 AuditLogSubscriber（@OnEvent 订阅者，由 EventBusModule 自动扫描）
 * - 提供 IAuditLogStore (Symbol) → MemoryStore 的 DI 绑定
 * - 对内聚敛 MemoryStore 实现，对外仅暴露抽象接口
 * - 不标注 @Global()（非全局模块，按需导入）
 */
@Module({
  providers: [
    AuditLogService,
    AuditLogSubscriber,
    MemoryStore,
    {
      provide: IAUDIT_LOG_STORE,
      useExisting: MemoryStore,
    },
  ],
  exports: [IAUDIT_LOG_STORE, AuditLogService],
})
export class AuditLogModule {}