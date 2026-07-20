# Phase 1 Task 5 Audit Log Manager Architecture Design v1.0

**Document Version**: v1.0  
**Design Baseline**: — (Design Phase, No Implementation)  
**Status**: DESIGN ONLY  
**Author**: TRAE / AI Programming Agent  
**Date**: 2026-07-19  
**Governance**: AILOS v3.2.0 七步生命周期治理 — DESIGN Stage

---

## 目录

1. [Module Positioning](#1-module-positioning)
2. [Audit Log Model Design](#2-audit-log-model-design)
3. [Event Bus Integration](#3-event-bus-integration)
4. [Storage Architecture](#4-storage-architecture)
5. [Compliance Review](#5-compliance-review)
6. [Language Neutral Validation](#6-language-neutral-validation)

---

## 1. Module Positioning

### 1.1 层级定位

Audit Log Manager 位于 AILOS Runtime Infrastructure Layer，是平台的**审计日志子系统**，与 Event Bus 形成标准的生产者-订阅者关系：

```
┌─────────────────────────────────────────────────────────┐
│                  BUSINESS LAYER                          │
│  AiGateway │ AssetCenter │ LearningEngine │ Companion... │
└──────────────────────────┬──────────────────────────────┘
                           │ publish(eventType, envelope)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              RUNTIME INFRASTRUCTURE LAYER                │
│                                                         │
│  ┌──────────────┐    subscribe      ┌────────────────┐  │
│  │  Event Bus   │◄──────────────────│  Audit Log     │  │
│  │  v1.0 🔒     │    @OnEvent()     │  Manager       │  │
│  │              │                   │  (DESIGN)      │  │
│  └──────────────┘                   └───────┬────────┘  │
│                                             │           │
│  ┌──────────────┐                   ┌───────▼────────┐  │
│  │ Permission   │                   │  Audit Log     │  │
│  │ Manager v1.0 │                   │  Store         │  │
│  │ 🔒           │                   │  (Abstract)    │  │
│  └──────────────┘                   └────────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ State Manager│  │  Auth Layer  │  │   Cache      │  │
│  │ v1.0 🔒      │  │              │  │   Module     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 模块边界

| 边界维度 | 定义 |
|----------|------|
| 上游依赖 | Event Bus v1.0 (🔒) — 通过 @OnEvent() 订阅事件 |
| 类型依赖 | Permission Manager v1.0 (🔒) — 复用 EventEnvelope 合约 |
| 下游消费者 | Admin Module、Compliance Engine — 查询审计日志 |
| 不依赖 | 任何业务模块内部逻辑，不反向耦合生产者 |
| 不承载 | 业务逻辑、权限校验、实时告警 |

### 1.3 职责定义

| 职责 | 说明 |
|------|------|
| 事件订阅 | 通过 @OnEvent() 订阅标准事件，自动接收全平台审计事件 |
| 日志标准化 | 将 EventEnvelope 转换为统一 AuditLogEntry 格式 |
| 日志持久化 | 通过 IAuditLogStore 抽象接口存储审计日志 |
| 日志查询 | 提供多维度检索能力：时间范围、用户、事件类型、trace_id |
| 全链路追溯 | 基于 trace_id / correlation_id 串联请求→事件→审计全链路 |
| 数据留存 | 可配置的日志保留策略 |

### 1.4 与冻结模块的关系

| 冻结模块 | 关系 | 约束 |
|----------|------|------|
| Event Bus v1.0 🔒 | 订阅方 | 仅通过 @OnEvent() 订阅，不修改 Event Bus 核心接口 |
| Permission Manager v1.0 🔒 | 类型复用 | 复用 EventEnvelope<T> 合约，不修改字段语义 |
| State Manager v1.0 🔒 | 无直接依赖 | 互不耦合 |
| Auth Layer | 间接关联 | 仅读取审计日志中的 user_id / role 上下文，不修改 Auth 逻辑 |

---

## 2. Audit Log Model Design

### 2.1 核心实体：AuditLogEntry

```typescript
/**
 * 审计日志核心实体
 *
 * 设计原则：
 * - 所有字段均为不可变记录（immutable log）
 * - trace_id 贯穿全链路，关联请求→事件→审计
 * - evolution_track 隔离双轨数据
 * - language 仅存在于 payload 数据层，不进入表结构
 */
interface AuditLogEntry {
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

  /** 关联 ID — 用于串联同一业务流程的多条日志 (如 request_id) */
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

interface AuditActor {
  /** 用户 ID */
  user_id?: string;
  /** 用户角色 */
  role?: string;
  /** 客户端 IP */
  ip?: string;
  /** User-Agent */
  user_agent?: string;
}

interface AuditTarget {
  /** 目标实体类型 (如 role, permission, user, asset, course) */
  entity_type: string;
  /** 目标实体 ID */
  entity_id?: string;
  /** 目标实体名称（可读） */
  entity_name?: string;
}

interface AuditChange {
  /** 变更前状态 */
  before?: Record<string, unknown>;
  /** 变更后状态 */
  after?: Record<string, unknown>;
  /** 变更字段列表 */
  changed_fields?: string[];
}

interface AuditMetadata {
  /** 请求来源 IP */
  request_ip?: string;
  /** 请求来源 User-Agent */
  user_agent?: string;
  /** 扩展字段 */
  extra?: Record<string, unknown>;
}
```

### 2.2 日志级别与分类

```
AuditLogLevel:
  INFO      — 常规操作记录（如角色查看）
  WARNING   — 敏感操作（如权限变更）
  ERROR     — 操作失败（如权限拒绝）
  CRITICAL  — 安全关键事件（如批量删除、系统配置变更）

AuditCategory:
  PERMISSION   — 权限相关：授权、撤销、角色分配、角色移除
  AUTH         — 认证相关：登录、登出、Token 刷新
  DATA         — 数据操作：创建、更新、删除
  SYSTEM       — 系统事件：配置变更、模块启停
  COMPLIANCE   — 合规相关：GDPR 数据导出、账户删除
```

### 2.3 事件→日志映射规则

| 事件类型 (event_type) | 日志分类 (category) | 日志级别 (level) |
|-----------------------|---------------------|-------------------|
| `permission.granted` | PERMISSION | WARNING |
| `permission.revoked` | PERMISSION | WARNING |
| `role.assigned` | PERMISSION | WARNING |
| `role.unassigned` | PERMISSION | WARNING |
| `permission.denied` | PERMISSION | ERROR |
| `*.created` | DATA | INFO |
| `*.updated` | DATA | INFO |
| `*.deleted` | DATA | WARNING |
| `auth.login` | AUTH | INFO |
| `auth.logout` | AUTH | INFO |
| `system.*` | SYSTEM | INFO |

**映射策略**: 基于事件类型前缀自动路由，无需逐一手动配置。新事件类型自动归入 DATA / INFO 默认分类。

### 2.4 数据留存策略

| 策略维度 | Phase 1 | Phase 2 预留 |
|----------|---------|-------------|
| 默认保留期 | 90 天 | 可配置（30/90/180/365 天） |
| WARNING 及以上 | 永久保留 | 可配置独立保留策略 |
| 存储上限 | 内存 10,000 条 | 可配置上限 + 自动清理 |
| 清理策略 | 超过上限时 FIFO | 定时任务 + 过期清理 |

---

## 3. Event Bus Integration

### 3.1 订阅方案

Audit Log Manager 作为 **Event Bus 标准订阅方**，通过 `@OnEvent()` 装饰器声明式订阅事件：

```typescript
@Injectable()
export class AuditLogSubscriber {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * 订阅全平台权限域事件
   * 通配匹配: permission.* 覆盖所有 permission 域事件
   * 优先级: 50 (高于默认 100，确保审计日志优先落盘)
   */
  @OnEvent('permission.*')
  async onPermissionEvent(envelope: EventEnvelope): Promise<void> {
    await this.auditLogService.ingest(envelope);
  }

  /**
   * 订阅全平台事件（兜底）
   * 捕获所有未被其他订阅者专门处理的事件
   * 优先级: 200 (最低优先级，不阻塞业务订阅者)
   */
  @OnEvent('*')
  async onAnyEvent(envelope: EventEnvelope): Promise<void> {
    await this.auditLogService.ingest(envelope);
  }
}
```

### 3.2 订阅优先级策略

| 订阅模式 | 优先级 | 说明 |
|----------|--------|------|
| `permission.*` | 50 | 权限域事件优先落盘，高于默认 100 |
| `auth.*` | 50 | 认证域事件优先落盘 |
| `*` (全局通配) | 200 | 兜底捕获，最低优先级，不阻塞业务 |

### 3.3 事件→日志转换流程

```
EventEnvelope<T>
       │
       ▼
┌──────────────────────────────────────┐
│ 1. 事件类型路由                       │
│    event_type → category + level      │
│    (基于映射规则自动分类)              │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 2. payload 标准化                    │
│    提取 actor / target / changes     │
│    (基于 payload 结构自动推断)        │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 3. AuditLogEntry 组装                │
│    填充 const 字段 + 生成 ingested_at │
│    附加 metadata                      │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 4. 持久化                            │
│    IAuditLogStore.append(entry)      │
│    (Phase 1: MemoryStore)            │
└──────────────────────────────────────┘
```

### 3.4 trace_id 全链路关联

```
HTTP Request (X-Trace-Id: trace-abc-123)
       │
       ▼
PermissionService.grantPermission()
       │
       ▼
IEventPublisher.publish('permission.granted', {
  event_id: 'evt-xyz-789',
  trace_id: 'trace-abc-123',   ← 透传
  payload: { ... }
})
       │
       ▼
EventBus → MemoryAdapter → @OnEvent 订阅者
       │
       ▼
AuditLogSubscriber.onPermissionEvent()
       │
       ▼
AuditLogEntry {
  trace_id: 'trace-abc-123',   ← 关联回 HTTP 请求
  event_id: 'evt-xyz-789',     ← 关联回事件
  ...
}
```

**关联链路**: `trace_id` 贯穿 HTTP 请求 → 业务操作 → 事件发布 → 审计日志，实现全链路可追溯。

### 3.5 异常处理策略

| 场景 | 处理方式 |
|------|----------|
| 订阅者内部异常 | 由 Event Bus 重试机制保障（3 次重试） |
| 持久化失败 | 记录到失败缓冲，不阻塞事件分发 |
| payload 解析失败 | 记录原始 payload 为 `raw_payload`，标记 `parse_error: true` |
| 存储满 | 日志告警，FIFO 淘汰最旧记录 |

---

## 4. Storage Architecture

### 4.1 存储抽象层

```typescript
/**
 * 审计日志存储抽象接口
 *
 * Phase 1: MemoryStore 实现
 * Phase 2: PrismaStore / ElasticsearchStore 实现
 * 业务层仅依赖此接口，具体存储实现可插拔替换
 */
interface IAuditLogStore {
  /** 追加日志 */
  append(entry: AuditLogEntry): Promise<void>;

  /** 查询日志 */
  query(params: AuditLogQueryParams): Promise<AuditLogQueryResult>;

  /** 按 ID 获取日志 */
  getById(id: string): Promise<AuditLogEntry | null>;

  /** 获取日志总数 */
  count(params?: AuditLogCountParams): Promise<number>;

  /** 清理过期日志 */
  purge(options: PurgeOptions): Promise<number>;
}

interface AuditLogQueryParams {
  /** 时间范围 */
  from?: string;
  to?: string;

  /** 事件类型过滤 */
  event_types?: string[];

  /** 分类过滤 */
  categories?: AuditCategory[];

  /** 级别过滤 */
  levels?: AuditLogLevel[];

  /** 操作人过滤 */
  actor_id?: string;

  /** 目标实体过滤 */
  entity_type?: string;
  entity_id?: string;

  /** 全链路追踪 */
  trace_id?: string;

  /** 轨道过滤 */
  evolution_track?: 'personal' | 'platform';

  /** 分页 */
  page?: number;
  page_size?: number;

  /** 排序 */
  order_by?: 'timestamp' | 'ingested_at';
  order_dir?: 'asc' | 'desc';
}

interface AuditLogQueryResult {
  items: AuditLogEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

### 4.2 Phase 1: MemoryStore

| 属性 | 值 |
|------|-----|
| 存储介质 | 进程内存 (Map) |
| 容量上限 | 10,000 条 |
| 查询能力 | 全量内存扫描 + 条件过滤 |
| 数据持久化 | 无（进程重启丢失） |
| 适用场景 | Phase 1 开发验证 + 架构验证 |

**Phase 1 约束**:
- 仅实现 IAuditLogStore 契约的 MemoryStore 版本
- 不创建数据库表、Migration 文件、ORM 模型
- 不引入外部存储依赖（PostgreSQL、Elasticsearch 等）

### 4.3 Phase 2 演进方案（预留设计）

```
Phase 1: MemoryStore (In-Memory)
                    │
                    ▼
Phase 2: PrismaStore (PostgreSQL)
         └─ 审计日志表 (audit_logs)
         └─ Prisma ORM 模型
         └─ 数据库索引 + 分页查询
                    │
                    ▼
Phase 3: ElasticsearchStore (可选)
         └─ 全文检索
         └─ 聚合分析
         └─ 可视化仪表盘
```

**演进约束**:
- Phase 1→Phase 2 切换通过 DI 层替换，业务代码零修改
- 存储实现必须完整实现 IAuditLogStore 接口
- 新增存储实现不得修改 IAuditLogStore 接口契约

### 4.4 查询 API 设计

```typescript
/**
 * 审计日志查询服务
 *
 * 对外暴露查询能力，供 Admin Module、Compliance Engine 使用
 * 不暴露存储实现细节
 */
@Injectable()
export class AuditLogQueryService {
  constructor(
    @Inject(IAuditLogStore) private readonly store: IAuditLogStore,
  ) {}

  /** 按时间范围查询 */
  async queryByTimeRange(from: string, to: string, page?: PaginationParams): Promise<AuditLogQueryResult>;

  /** 按用户查询 */
  async queryByUser(userId: string, page?: PaginationParams): Promise<AuditLogQueryResult>;

  /** 按事件类型查询 */
  async queryByEventType(eventType: string, page?: PaginationParams): Promise<AuditLogQueryResult>;

  /** 按 trace_id 全链路追溯 */
  async queryByTraceId(traceId: string): Promise<AuditLogEntry[]>;

  /** 高级组合查询 */
  async query(params: AuditLogQueryParams): Promise<AuditLogQueryResult>;
}
```

---

## 5. Compliance Review

### 5.1 架构宪法合规

| 审查项 | 标准 | 结果 |
|--------|------|------|
| 层级归属 | Runtime Infrastructure Layer | 通过 — 审计日志为基础设施能力 |
| 模块边界 | 不承载业务逻辑 | 通过 — 仅日志接收、标准化、存储、查询 |
| 依赖方向 | 仅依赖冻结模块，不反向耦合 | 通过 — 依赖 Event Bus / Permission Manager（均为冻结），不反向 |
| 横向通用 | 全平台可用，非特定业务模块 | 通过 — 全平台审计日志统一入口 |

### 5.2 Asset First 合规

| 审查项 | 标准 | 结果 |
|--------|------|------|
| 类型复用 | EventEnvelope 从 Permission Manager 冻结定义 import | 通过 — 单一来源，不重复声明 |
| 接口注入 | 通过 @Inject(IAuditLogStore) 依赖抽象 | 通过 — 存储实现可插拔 |
| 不暴露内部实现 | 对外仅暴露查询 API，不暴露存储细节 | 通过 — IAuditLogStore 不对外导出 |
| 新模块适配冻结 | 不要求冻结模块修改 | 通过 — 零侵入 Event Bus / Permission Manager |

### 5.3 双轨原则合规

| 审查项 | 标准 | 结果 |
|--------|------|------|
| evolution_track 隔离 | 审计日志按 track 区分 | 通过 — AuditLogEntry.evolution_track 字段隔离 |
| 禁止 Community 轨道 | 不存在 Community 相关设计 | 通过 — 仅 Personal + Platform |
| 权限隔离 | 查询时按 track 过滤 | 通过 — AuditLogQueryParams 支持 evolution_track 过滤 |

### 5.4 冻结模块兼容性

| 冻结模块 | 是否修改 | 兼容方案 |
|----------|----------|----------|
| Event Bus v1.0 🔒 | **否** | 通过 @OnEvent() 标准订阅，不修改 Event Bus 核心接口 |
| Permission Manager v1.0 🔒 | **否** | 复用 EventEnvelope 类型，不修改字段语义 |
| State Manager v1.0 🔒 | **否** | 无直接依赖，互不耦合 |
| Auth Layer | **否** | 仅读取审计日志中的 user_id 上下文，不修改 Auth 逻辑 |
| Prisma Schema | **否** | Phase 1 无数据库表，Phase 2 新增审计日志表（不影响现有表） |

### 5.5 阶段边界合规

| 审查项 | 标准 | 结果 |
|--------|------|------|
| DESIGN ONLY | 无实现代码 | 通过 |
| 无数据库表 | 无 Migration 文件 | 通过 |
| 无越界模块 | 未涉及 Memory Manager、Learning Engine 等 | 通过 |
| 无业务逻辑 | 未定义任何业务规则 | 通过 |

---

## 6. Language Neutral Validation

### 6.1 语言无关原则符合性验证

| 验证维度 | 标准 | 设计结果 |
|----------|------|----------|
| 模块命名 | 不含语言标识 | AuditLogManager — 无语言相关命名 |
| 类命名 | 不含语言标识 | AuditLogEntry / AuditLogService / AuditLogSubscriber — 无语言相关命名 |
| 事件类型 | 不含语言标识 | 遵循 domain.entity.action，无语言前缀/后缀 |
| 数据模型 | 语言仅在 payload 数据层 | language 是 payload 中的字段，不进入表结构 |
| 表结构 | 不含语言列 | 无按语言拆分的表或列 |
| 查询接口 | 语言作为过滤参数 | query params 中可过滤 payload 中的 language 字段 |

### 6.2 禁止范式清单

| 错误范式 | 禁止原因 |
|----------|----------|
| `JapaneseAuditLog` | 语言硬编码在类名中 |
| `audit_logs_ja` / `audit_logs_en` | 按语言拆分表结构 |
| `language` 列在 AuditLogEntry 顶层 | 语言应位于 payload 数据层 |
| `ja-JP` 出现在事件类型中 | 事件类型应为语言无关的能力描述 |

### 6.3 正确范式

```typescript
// 正确：审计日志不感知语言
const entry: AuditLogEntry = {
  // ...
  payload: {
    language: 'ja-JP',      // 语言仅在 payload 数据层
    course_id: 'c001',
    user_id: 'u001',
  },
};
```

---

## 7. 设计决策记录

### 7.1 架构决策

| 决策 ID | 决策 | 理由 |
|---------|------|------|
| AD-001 | 通过 @OnEvent() 订阅，非直接依赖 EventBusService | 与 Event Bus 保持松耦合，符合事件驱动架构 |
| AD-002 | 全局通配 `*` 兜底订阅 | 确保所有事件都被审计，无遗漏 |
| AD-003 | 存储层抽象 IAuditLogStore | 支持 Phase 1→2 平滑迁移，业务代码零修改 |
| AD-004 | Phase 1 仅 MemoryStore，不创建数据库表 | 遵循 DESIGN 阶段边界，不越界 |
| AD-005 | trace_id / correlation_id 双 ID 关联 | 支持单请求追踪 + 跨请求业务流程关联 |

### 7.2 设计权衡

| 权衡项 | 选择 | 权衡理由 |
|--------|------|----------|
| 存储容量 | Phase 1: 10,000 条内存上限 | 开发阶段够用，避免内存膨胀 |
| 查询性能 | Phase 1: 内存扫描 | 开发阶段数据量小，满足需求 |
| 事件覆盖 | 通配 + 精确双重订阅 | 保底全覆盖 + 关键域优先 |

---

## 8. 设计基线

| 属性 | 值 |
|------|-----|
| 设计版本 | v1.0 |
| 设计日期 | 2026-07-19 |
| 设计阶段 | DESIGN ONLY |
| 前置冻结基线 | Event Bus v1.0 (4891c66) / Permission Manager v1.0 (c74bbfc) |
| 下一阶段 | 提交 REVIEW → 等待总工程师评审 |
| 双轨合规 | Personal + Platform (无 Community) |
| 语言原则 | Language Neutral Principle — 语言仅在数据层 |

---

## 附录 A: 禁止实现清单 (DESIGN ONLY 边界)

以下为 IMPLEMENT 阶段授权前严格禁止的行为：

- ❌ 创建 `src/infrastructure/audit-log/` 目录及任何实现文件
- ❌ 创建 `AuditLogService`、`AuditLogSubscriber`、`MemoryStore` 等实现类
- ❌ 创建数据库表、Migration 文件、Prisma Schema 扩展
- ❌ 修改 Event Bus、Permission Manager 任何已冻结代码
- ❌ 引入 `@nestjs/event-emitter` 或其他事件库
- ❌ 实现任何查询 API 端点

## 附录 B: 命名规范引用

| 规范 | 来源 |
|------|------|
| `domain.entity.action` 三段式命名 | Event Bus v1.0 Event Naming Registry |
| 8 个标准动词 | created, updated, deleted, assigned, unassigned, granted, revoked, denied |
| EventEnvelope<T> 5 字段合约 | Permission Manager v1.0 冻结定义 |
| Language Neutral Principle | AILOS v3.2.0 架构宪法红线 |