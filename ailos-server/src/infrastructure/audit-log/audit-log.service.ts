import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventEnvelope } from '../permission/permission.types';
import { IAUDIT_LOG_STORE } from './audit-log.provider';
import type { IAuditLogStore } from './audit-log.types';
import {
  AuditLogEntry,
  AuditLogQueryParams,
  AuditLogQueryResult,
  AuditLogLevel,
  AuditCategory,
  AuditActor,
  AuditTarget,
  PERMISSION_EVENT_MAP,
  PREFIX_EVENT_RULES,
  SYSTEM_EVENT_PREFIX,
  AUTH_EVENT_PREFIX,
  DEFAULT_CATEGORY,
  DEFAULT_LEVEL,
} from './audit-log.types';

/**
 * Audit Log Service — 审计日志门面服务
 *
 * 设计基线: Audit Log Architecture Design v1.0 (07a6f29)
 *
 * 内部分层（单一职责）:
 * 1. 标准化单元 (normalize) — EventEnvelope → AuditLogEntry 转换
 * 2. 存储单元 (ingest) — 调用 IAuditLogStore 执行写入
 * 3. 查询单元 (query*) — 多条件查询、分页、全链路追溯
 *
 * 对外通过 IAuditLogStore 依赖抽象，不直接依赖具体存储实现
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @Inject(IAUDIT_LOG_STORE) private readonly store: IAuditLogStore,
  ) {}

  // ============================================
  // 标准化单元：EventEnvelope → AuditLogEntry
  // ============================================

  /**
   * 事件摄入 — 标准化 + 存储
   */
  async ingest(envelope: EventEnvelope): Promise<AuditLogEntry> {
    const entry = this.normalize(envelope);
    await this.store.append(entry);
    this.logger.debug(
      `Audit log ingested: ${entry.id} | ${entry.event_type} | ${entry.category}/${entry.level}`,
    );
    return entry;
  }

  /**
   * 标准化转换：EventEnvelope → AuditLogEntry
   */
  normalize(envelope: EventEnvelope): AuditLogEntry {
    const eventType = this.extractEventType(envelope);
    const { category, level } = this.classifyEvent(eventType);

    const payload = (envelope.payload ?? {}) as Record<string, unknown>;

    return {
      id: randomUUID(),
      event_id: envelope.event_id,
      event_type: eventType,
      source: envelope.source,
      trace_id: envelope.trace_id,
      correlation_id: (payload as any).correlation_id,
      timestamp: envelope.timestamp,
      ingested_at: new Date().toISOString(),
      actor: this.extractActor(payload),
      target: this.extractTarget(payload),
      changes: this.extractChanges(payload),
      payload,
      level,
      category,
      evolution_track: (payload as any).evolution_track ?? 'personal',
      metadata: {
        request_ip: (payload as any).request_ip,
        user_agent: (payload as any).user_agent,
        extra: (payload as any).metadata,
      },
    };
  }

  // ============================================
  // 存储单元：委托 IAuditLogStore
  // ============================================

  /** 按 ID 获取单条日志 */
  async getById(id: string): Promise<AuditLogEntry | null> {
    return this.store.getById(id);
  }

  /** 获取日志总数 */
  async count(params?: { from?: string; to?: string; categories?: AuditCategory[] }): Promise<number> {
    return this.store.count(params);
  }

  // ============================================
  // 查询单元：多维度查询
  // ============================================

  /** 按时间范围查询 */
  async queryByTimeRange(
    from: string,
    to: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<AuditLogQueryResult> {
    return this.store.query({ from, to, page, page_size: pageSize });
  }

  /** 按用户查询 */
  async queryByUser(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<AuditLogQueryResult> {
    return this.store.query({ actor_id: userId, page, page_size: pageSize });
  }

  /** 按事件类型查询 */
  async queryByEventType(
    eventType: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<AuditLogQueryResult> {
    return this.store.query({ event_types: [eventType], page, page_size: pageSize });
  }

  /** 按 trace_id 全链路追溯 */
  async queryByTraceId(traceId: string): Promise<AuditLogEntry[]> {
    const result = await this.store.query({ trace_id: traceId, page_size: 1000 });
    return result.items;
  }

  /** 高级组合查询 */
  async query(params: AuditLogQueryParams): Promise<AuditLogQueryResult> {
    return this.store.query(params);
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  /** 事件分类：event_type → category + level */
  private classifyEvent(eventType: string): { category: AuditCategory; level: AuditLogLevel } {
    // 精确匹配权限域事件
    if (PERMISSION_EVENT_MAP[eventType]) {
      return PERMISSION_EVENT_MAP[eventType];
    }

    // 前缀匹配 created/updated/deleted
    for (const rule of PREFIX_EVENT_RULES) {
      if (eventType.endsWith(rule.suffix)) {
        return { category: rule.category, level: rule.level };
      }
    }

    // 系统域前缀
    if (eventType.startsWith(SYSTEM_EVENT_PREFIX)) {
      return { category: 'SYSTEM', level: 'INFO' };
    }

    // 认证域前缀
    if (eventType.startsWith(AUTH_EVENT_PREFIX)) {
      return { category: 'AUTH', level: 'INFO' };
    }

    return { category: DEFAULT_CATEGORY, level: DEFAULT_LEVEL };
  }

  /** 从 envelope 提取 event_type（兼容多种格式） */
  private extractEventType(envelope: EventEnvelope): string {
    const p = envelope.payload as Record<string, unknown>;
    if (p.event_type) return p.event_type as string;
    if (p.action) return `${envelope.source}.${p.action}`;
    return 'unknown';
  }

  /** 从 payload 提取操作主体 */
  private extractActor(payload: Record<string, unknown>): AuditActor {
    return {
      user_id: (payload.user_id ?? payload.userId) as string | undefined,
      role: (payload.role ?? payload.role_name) as string | undefined,
      ip: (payload.ip ?? payload.request_ip) as string | undefined,
      user_agent: payload.user_agent as string | undefined,
    };
  }

  /** 从 payload 提取操作目标 */
  private extractTarget(payload: Record<string, unknown>): AuditTarget {
    return {
      entity_type: (payload.entity_type ?? payload.entityType ?? 'unknown') as string,
      entity_id: (payload.entity_id ?? payload.entityId) as string | undefined,
      entity_name: (payload.entity_name ?? payload.entityName) as string | undefined,
    };
  }

  /** 从 payload 提取变更详情 */
  private extractChanges(payload: Record<string, unknown>): {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    changed_fields?: string[];
  } | undefined {
    if (payload.before || payload.after || payload.changed_fields) {
      return {
        before: payload.before as Record<string, unknown> | undefined,
        after: payload.after as Record<string, unknown> | undefined,
        changed_fields: payload.changed_fields as string[] | undefined,
      };
    }
    return undefined;
  }
}