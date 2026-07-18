import { EventEnvelope } from '../permission/permission.types';

// ============================================
// 审计日志级别
// ============================================

export type AuditLogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// ============================================
// 审计分类
// ============================================

export type AuditCategory =
  | 'PERMISSION'
  | 'AUTH'
  | 'DATA'
  | 'SYSTEM'
  | 'COMPLIANCE';

// ============================================
// 审计日志子结构
// ============================================

/** 操作主体 */
export interface AuditActor {
  user_id?: string;
  role?: string;
  ip?: string;
  user_agent?: string;
}

/** 操作目标 */
export interface AuditTarget {
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
}

/** 变更详情 */
export interface AuditChange {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changed_fields?: string[];
}

/** 审计元数据 */
export interface AuditMetadata {
  request_ip?: string;
  user_agent?: string;
  extra?: Record<string, unknown>;
}

// ============================================
// 核心实体：AuditLogEntry
// ============================================

/**
 * 审计日志核心实体
 *
 * 设计原则：
 * - 所有字段均为不可变记录（immutable log）
 * - trace_id 贯穿全链路，关联请求→事件→审计
 * - evolution_track 隔离双轨数据
 * - language 仅存在于 payload 数据层，不进入表结构
 */
export interface AuditLogEntry {
  /** 日志唯一标识 (UUID v7) */
  id: string;
  /** 关联事件 ID，来自 EventEnvelope.event_id */
  event_id: string;
  /** 事件类型，遵循 domain.entity.action 三段式 */
  event_type: string;
  /** 事件来源模块 */
  source: string;
  /** 全链路追踪 ID，来自 EventEnvelope.trace_id */
  trace_id: string;
  /** 关联 ID — 用于串联同一业务流程的多条日志 */
  correlation_id?: string;
  /** 事件发生时间戳 */
  timestamp: string;
  /** 审计日志落盘时间戳 */
  ingested_at: string;
  /** 操作主体 */
  actor: AuditActor;
  /** 操作目标 */
  target: AuditTarget;
  /** 变更详情 (before/after diff) */
  changes?: AuditChange;
  /** 事件原始 payload (结构化数据) */
  payload: Record<string, unknown>;
  /** 日志级别 */
  level: AuditLogLevel;
  /** 审计分类 */
  category: AuditCategory;
  /** 演进轨道 */
  evolution_track: 'personal' | 'platform';
  /** 元数据 */
  metadata: AuditMetadata;
}

// ============================================
// 查询参数与结果
// ============================================

export interface AuditLogQueryParams {
  from?: string;
  to?: string;
  event_types?: string[];
  categories?: AuditCategory[];
  levels?: AuditLogLevel[];
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  trace_id?: string;
  evolution_track?: 'personal' | 'platform';
  page?: number;
  page_size?: number;
  order_by?: 'timestamp' | 'ingested_at';
  order_dir?: 'asc' | 'desc';
}

export interface AuditLogCountParams {
  from?: string;
  to?: string;
  categories?: AuditCategory[];
  levels?: AuditLogLevel[];
  evolution_track?: 'personal' | 'platform';
}

export interface AuditLogQueryResult {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PurgeOptions {
  before?: string;
  categories?: AuditCategory[];
  max_count?: number;
}

// ============================================
// 存储抽象接口
// ============================================

/**
 * 审计日志存储抽象接口
 *
 * Phase 1: MemoryStore 实现
 * Phase 2: PrismaStore / ElasticsearchStore 实现
 * 业务层仅依赖此接口，具体存储实现可插拔替换
 */
export interface IAuditLogStore {
  append(entry: AuditLogEntry): Promise<void>;
  query(params: AuditLogQueryParams): Promise<AuditLogQueryResult>;
  getById(id: string): Promise<AuditLogEntry | null>;
  count(params?: AuditLogCountParams): Promise<number>;
  purge(options: PurgeOptions): Promise<number>;
}

// ============================================
// 常量
// ============================================

/** Phase 1 内存存储上限 */
export const MAX_MEMORY_ENTRIES = 10_000;

/** 默认保留天数 */
export const DEFAULT_RETENTION_DAYS = 90;

// ============================================
// 事件→分类映射表
// ============================================

/** 权限域事件 → 分类/级别 精确映射 */
export const PERMISSION_EVENT_MAP: Record<string, { category: AuditCategory; level: AuditLogLevel }> = {
  'permission.granted': { category: 'PERMISSION', level: 'WARNING' },
  'permission.revoked': { category: 'PERMISSION', level: 'WARNING' },
  'role.assigned': { category: 'PERMISSION', level: 'WARNING' },
  'role.unassigned': { category: 'PERMISSION', level: 'WARNING' },
  'permission.denied': { category: 'PERMISSION', level: 'ERROR' },
};

/** 前缀规则：事件类型后缀 → 分类/级别 */
export const PREFIX_EVENT_RULES: Array<{ suffix: string; category: AuditCategory; level: AuditLogLevel }> = [
  { suffix: '.created', category: 'DATA', level: 'INFO' },
  { suffix: '.updated', category: 'DATA', level: 'INFO' },
  { suffix: '.deleted', category: 'DATA', level: 'WARNING' },
];

/** 系统域前缀 */
export const SYSTEM_EVENT_PREFIX = 'system.';

/** 认证域前缀 */
export const AUTH_EVENT_PREFIX = 'auth.';

/** 默认分类（无匹配时使用） */
export const DEFAULT_CATEGORY: AuditCategory = 'DATA';
export const DEFAULT_LEVEL: AuditLogLevel = 'INFO';