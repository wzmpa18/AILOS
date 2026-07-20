# Phase 1 Task 4 Event Bus Architecture Design Document

**AILOS v3.2.0 | Runtime Infrastructure Layer | DESIGN ONLY**

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 (Design Baseline) |
| 状态 | DESIGN — 待评审 |
| 日期 | 2026-07-18 |
| 前置依赖 | Permission Manager v1.0 (FREEZED) |
| 后续模块 | Audit Log Manager, Memory Manager |

---

## 1. Module Positioning

### 1.1 核心职责

Event Bus 是 AILOS Runtime Infrastructure Layer 的全局事件通信总线，承担平台内所有跨模块异步事件的路由、分发与可靠性保障。它不实现任何业务逻辑，仅作为事件传输管道。

### 1.2 在 AILOS 运行时架构中的位置

```
┌─────────────────────────────────────────────────┐
│              AILOS Runtime Layer                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Auth    │  │Permission│  │  Event Bus   │  │
│  │  Layer   │  │ Manager  │  │  (本模块)     │  │
│  │ (FREEZED)│  │(FREEZED) │  │              │  │
│  └──────────┘  └────┬─────┘  └──────┬───────┘  │
│                     │               │           │
│              publish│               │subscribe  │
│                     ▼               ▼           │
│              ┌──────────────────────────┐       │
│              │      Event Bus Core      │       │
│              │   publish / subscribe    │       │
│              │   route / retry / ack    │       │
│              └──────────┬───────────────┘       │
│                         │                       │
│              ┌──────────┼──────────┐            │
│              ▼          ▼          ▼            │
│        ┌─────────┐ ┌────────┐ ┌──────────┐     │
│        │ Audit   │ │ Memory │ │  Future   │     │
│        │ Log     │ │Manager │ │  Modules  │     │
│        │(未实现)  │ │(未实现) │ │          │     │
│        └─────────┘ └────────┘ └──────────┘     │
└─────────────────────────────────────────────────┘
```

### 1.3 上下游边界

**上游（发布方）**：
- Permission Manager — 已通过 `IEventPublisher` 接口在 5 个调用点发布事件，Phase 1 使用 Stub 空实现
- 后续业务模块（Auth、Learning、Asset 等）— 按需接入

**下游（订阅方）**：
- Audit Log Manager — 订阅全平台事件，写入审计日志存储
- Memory Manager — 订阅 `memory.context.updated` 等上下文变更事件
- 未来模块 — 按需订阅

**交互约束**：
- Event Bus 不持有任何业务数据，不进行业务校验
- 发布方与订阅方完全解耦，彼此不感知对方存在
- 所有事件携带完整上下文，订阅方可独立处理，无需回调发布方

### 1.4 Phase 1 vs Phase 2 策略

| 维度 | Phase 1 (当前) | Phase 2 (后续) |
|------|---------------|---------------|
| 传输层 | In-Memory Stub | RabbitMQ (amqplib) |
| 持久化 | 无 | 消息持久化 + 死信队列 |
| 重试 | 同步重试 (≤3次) | 指数退避 + 死信路由 |
| 订阅 | 进程内同步调用 | 多消费者并发 |
| 可靠性 | Best-effort | At-Least-Once |

Phase 1 的 In-Memory Stub 提供与 Phase 2 RabbitMQ 完全一致的接口契约，确保后续切换时零代码修改。

---

## 2. Event Model Design

### 2.1 标准 Envelope（继承冻结合约）

复用 Permission Manager v1.0 已冻结的 `EventEnvelope<T>` 合约，不修改任何字段定义：

```typescript
/** 标准事件 Envelope — Permission Manager v1.0 FREEZED */
export interface EventEnvelope<T = Record<string, unknown>> {
  event_id: string;     // UUID v4，全局唯一
  timestamp: string;    // ISO 8601 格式，发布方生成
  source: string;       // 发布模块标识，格式: "module:version"
  trace_id: string;     // 全链路追踪 ID，贯穿请求→事件→审计
  payload: T;           // 事件载荷，类型由事件类型决定
}
```

**扩展说明**：Event Bus 在 Phase 2 将新增一个内部字段 `routing_key` 用于 RabbitMQ 路由，但该字段不暴露给发布方，由 Event Bus 从 `eventType` 自动推导。

### 2.2 事件分类体系

事件按来源域（Domain）分类，每个域下按实体（Entity）和动作（Action）细分：

| 分类层级 | 说明 | 示例 |
|---------|------|------|
| Domain | 业务域 / 模块域 | permission, auth, learning, asset, memory |
| Entity | 域内实体 | role, permission, user, context |
| Action | 实体动作 | created, updated, deleted, assigned, revoked |

### 2.3 事件生命周期

```
[发布方]                          [Event Bus]                       [订阅方]
   │                                  │                                │
   │ 1. publish(eventType, envelope)  │                                │
   │─────────────────────────────────►│                                │
   │                                  │ 2. validate envelope           │
   │                                  │ 3. resolve subscribers         │
   │                                  │ 4. for each handler:           │
   │                                  │───────────────────────────────►│
   │                                  │      5. handler(payload)       │
   │                                  │◄───────────────────────────────│
   │                                  │ 6. ack / nack                  │
   │ 7. return                        │                                │
   │◄─────────────────────────────────│                                │
```

**Phase 1 行为**：步骤 2-6 在进程内同步执行。若任一 handler 失败，Event Bus 执行重试策略（见 §5），超时则记录失败并继续。

**Phase 2 行为**：步骤 2 在发布方完成，步骤 3-6 通过 RabbitMQ 异步执行，发布方不等待订阅方处理结果。

### 2.4 路由规则

Event Bus 基于 `eventType` 进行路由匹配，支持三种匹配模式：

| 模式 | Phase 1 支持 | 说明 | 示例 |
|------|:---:|------|------|
| 精确匹配 | Yes | 订阅特定事件类型 | `permission.role.assigned` |
| 前缀通配 | Yes | 订阅域下所有事件 | `permission.*` |
| 全局通配 | No | 订阅所有事件（安全限制） | `*` (Phase 1 禁止) |

**路由优先级**：精确匹配 > 前缀通配。同一事件可以同时被多个订阅者处理，处理顺序按注册优先级排列。

### 2.5 全链路追踪机制

`trace_id` 是贯穿全平台请求生命周期的唯一标识，生成规则如下：

- **HTTP 请求入口**：由 LoggingInterceptor 从请求头 `X-Trace-Id` 读取，不存在则生成 UUID v4
- **事件发布时**：发布方从当前请求上下文获取 `trace_id`，写入 `EventEnvelope.trace_id`
- **事件处理时**：订阅方从 `EventEnvelope.trace_id` 读取，注入处理上下文
- **审计日志**：Audit Log Manager 将 `trace_id` 写入每条审计记录，实现事件→审计的反向追溯

---

## 3. Event Naming Convention

### 3.1 命名格式

全平台统一采用 `domain.entity.action` 三段式命名：

```
{domain}.{entity}.{action}
```

| 段位 | 约束 | 示例 |
|------|------|------|
| domain | 小写字母，单数名词 | permission, auth, learning, asset, memory |
| entity | 小写字母，单数名词 | role, permission, user, session, context |
| action | 小写字母，过去式动词 | created, updated, deleted, assigned, revoked |

### 3.2 标准动词集

| 动词 | 语义 | 适用场景 |
|------|------|---------|
| `created` | 实体首次创建 | 角色创建、权限定义 |
| `updated` | 实体属性变更 | 角色名称修改、权限描述更新 |
| `deleted` | 实体软删除 | 角色停用、权限废弃 |
| `assigned` | 关系建立 | 角色分配、权限授予 |
| `revoked` | 关系解除 | 角色移除、权限回收 |
| `accessed` | 资源被访问 | 学习内容访问、资产查看 |
| `denied` | 操作被拒绝 | 权限拒绝、认证失败 |
| `completed` | 流程节点完成 | 学习任务完成、考核通过 |

### 3.3 核心域事件清单

#### Permission Domain（权限域 — 已冻结）

| 事件类型 | Payload | 发布方 | 发布时机 |
|---------|---------|--------|---------|
| `permission.role.assigned` | RoleAssignedPayload | UserRoleService | assignRole() 成功后 |
| `permission.role.unassigned` | RoleUnassignedPayload | UserRoleService | unassignRole() 成功后 |
| `permission.permission.granted` | PermissionGrantedPayload | PermissionService | grantToRole() 成功后 |
| `permission.permission.revoked` | PermissionRevokedPayload | PermissionService | revokeFromRole() 成功后 |
| `permission.access.denied` | PermissionDeniedPayload | PermissionGuard | checkPermission() 拒绝时 |

#### Auth Domain（认证域 — 预留）

| 事件类型 | 说明 | 状态 |
|---------|------|:---:|
| `auth.user.login` | 用户登录成功 | 预留 |
| `auth.user.logout` | 用户登出 | 预留 |
| `auth.session.expired` | 会话过期 | 预留 |
| `auth.token.refreshed` | Token 刷新 | 预留 |

#### Memory Domain（记忆域 — 预留）

| 事件类型 | 说明 | 状态 |
|---------|------|:---:|
| `memory.context.updated` | 上下文状态更新 | 预留 |
| `memory.context.expired` | 上下文过期 | 预留 |
| `memory.insight.generated` | 洞察生成 | 预留 |

#### Learning Domain（学习域 — 预留）

| 事件类型 | 说明 | 状态 |
|---------|------|:---:|
| `learning.task.completed` | 学习任务完成 | 预留 |
| `learning.assessment.passed` | 考核通过 | 预留 |

#### Asset Domain（资产域 — 预留）

| 事件类型 | 说明 | 状态 |
|---------|------|:---:|
| `asset.upload.completed` | 资产上传完成 | 预留 |
| `asset.access.recorded` | 资产访问记录 | 预留 |

### 3.4 命名反例

以下命名模式被明确禁止，设计文档中提供反例以杜绝碎片化：

| 禁止模式 | 反例 | 正确写法 |
|---------|------|---------|
| 省略 domain | `role.assigned` | `permission.role.assigned` |
| 使用现在时动词 | `permission.role.assign` | `permission.role.assigned` |
| 混用大小写 | `Permission.Role.Assigned` | `permission.role.assigned` |
| 使用下划线 | `permission_role_assigned` | `permission.role.assigned` |
| 域不明确 | `data.updated` | `memory.context.updated` |

---

## 4. Publish/Subscribe Architecture

### 4.1 核心接口定义

```typescript
/** Event Bus 统一对外接口 */
export interface IEventBus {
  /** 发布事件 */
  publish<T = Record<string, unknown>>(
    eventType: string,
    envelope: EventEnvelope<T>,
  ): Promise<void>;

  /** 订阅事件 */
  subscribe<T = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions,
  ): Promise<string>; // 返回 subscriptionId

  /** 取消订阅 */
  unsubscribe(subscriptionId: string): Promise<void>;
}

/** 事件处理函数签名 */
export type EventHandler<T = Record<string, unknown>> = (
  envelope: EventEnvelope<T>,
) => Promise<void>;

/** 订阅选项 */
export interface SubscribeOptions {
  priority?: number;    // 处理优先级，数字越小越优先，默认 100
  filter?: (envelope: EventEnvelope) => boolean; // 可选过滤器
}
```

**与 Permission Manager 接口兼容性**：Event Bus 的 `IEventBus.publish()` 签名与 `IEventPublisher.publish()` 完全一致。Phase 2 时，Event Bus 的 RabbitMQ 适配器可直接实现 `IEventPublisher` 接口，Permission Manager 仅需将 `EventPublisherStub` 替换为 Event Bus 实例，无需修改任何调用代码。

### 4.2 模块结构

```
src/infrastructure/event-bus/
├── event-bus.types.ts          # 类型定义：IEventBus, EventHandler, SubscribeOptions
├── event-bus.service.ts        # 核心服务：publish, subscribe, unsubscribe
├── event-bus.module.ts         # @Global() 模块注册
├── event-bus.provider.ts       # Symbol Token 定义
├── adapters/
│   ├── memory-adapter.ts       # Phase 1: In-Memory Stub 实现
│   └── rabbitmq-adapter.ts     # Phase 2: RabbitMQ 实现 (当前仅接口预留)
├── decorators/
│   └── on-event.decorator.ts   # @OnEvent() 声明式订阅装饰器
└── index.ts                    # Barrel Export
```

### 4.3 发布者接口

发布方通过依赖注入获取 `IEventBus` 实例：

```typescript
// Permission Service 中的发布示例（已冻结，仅作参考）
@Injectable()
export class PermissionService {
  constructor(
    @Inject(IEventBus) private readonly eventBus: IEventBus,
  ) {}

  async grantToRole(roleId: string, permissionId: string, operator: string) {
    // 1. 执行业务逻辑
    await this.rolePermissionRepo.create({ roleId, permissionId });

    // 2. 发布事件
    await this.eventBus.publish('permission.permission.granted', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission:v1.0',
      trace_id: this.getTraceId(),
      payload: { roleId, permissionId, grantedBy: operator },
    });
  }
}
```

### 4.4 订阅者接口

订阅方通过 `@OnEvent()` 装饰器声明式订阅，或通过 `IEventBus.subscribe()` 编程式订阅：

```typescript
// 声明式订阅（推荐）
@Injectable()
export class AuditLogSubscriber {
  private readonly logger = new Logger(AuditLogSubscriber.name);

  @OnEvent('permission.*')
  async onPermissionEvent(envelope: EventEnvelope) {
    // 所有 permission 域事件统一写入审计日志
    this.logger.log(`Audit: ${envelope.event_id} — ${envelope.source}`);
    // Phase 2: 写入审计日志存储
  }
}

// 编程式订阅
@Injectable()
export class MemorySubscriber implements OnModuleInit {
  constructor(@Inject(IEventBus) private readonly eventBus: IEventBus) {}

  async onModuleInit() {
    await this.eventBus.subscribe('memory.context.updated', async (envelope) => {
      // 处理上下文更新
    }, { priority: 10 });
  }
}
```

### 4.5 声明式订阅装饰器

```typescript
/** 声明式事件订阅装饰器 */
export function OnEvent(eventPattern: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      EVENT_HANDLER_METADATA,
      { eventPattern, propertyKey },
      target.constructor,
    );
    return descriptor;
  };
}
```

**注册机制**：Event Bus Module 在 `onModuleInit()` 中扫描所有注册的 Provider，提取 `@OnEvent()` 装饰的方法，自动调用 `subscribe()` 注册处理器。这确保了订阅者无需手动管理订阅生命周期。

### 4.6 内部处理流程

```
publish(eventType, envelope)
  │
  ├─ 1. 校验 envelope (event_id, timestamp, source, trace_id 非空)
  │
  ├─ 2. 匹配订阅者
  │     ├─ 精确匹配 eventType
  │     └─ 前缀通配匹配 (e.g. "permission.*" 匹配 "permission.role.assigned")
  │
  ├─ 3. 按 priority 排序订阅者
  │
  └─ 4. 依次执行 handler
        ├─ 成功 → ack
        └─ 失败 → 重试策略 (见 §5)
```

### 4.7 与 Permission Manager 的集成路径

Permission Manager 当前通过 `EventPublisherStub` 发布事件（空实现）。Event Bus 就绪后，集成路径为：

1. Phase 1: Event Bus 内部维护订阅表，但 Permission Manager 仍使用 Stub（两条链路并行，互不干扰）
2. Phase 2: Event Bus 提供 `IEventPublisher` 的 RabbitMQ 实现，Permission Manager 的 DI 容器将 `EventPublisherStub` 替换为 Event Bus 实例
3. **零代码修改**：Permission Manager 的调用代码无需修改 — `IEventPublisher` 接口已冻结，替换仅发生在 DI 层

---

## 5. Reliability Design

### 5.1 重试机制

| 策略参数 | Phase 1 (Memory) | Phase 2 (RabbitMQ) |
|---------|-----------------|-------------------|
| 最大重试次数 | 3 | 3 |
| 退避策略 | 固定间隔 (500ms) | 指数退避 (1s, 2s, 4s) |
| 重试判定 | handler 抛出异常 | nack / timeout |
| 最终失败 | 记录日志，丢弃事件 | 路由至死信队列 |

**Phase 1 实现**：

```typescript
async executeHandler(
  handler: EventHandler,
  envelope: EventEnvelope,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await handler(envelope);
      return; // 成功
    } catch (error) {
      this.logger.warn(
        `Handler failed for "${envelope.event_id}" (attempt ${attempt}/${maxRetries}): ${error.message}`,
      );
      if (attempt === maxRetries) {
        this.logger.error(`Handler exhausted retries for "${envelope.event_id}"`);
        throw error;
      }
      await this.sleep(500);
    }
  }
}
```

### 5.2 幂等性保障

事件可能因重试被多次投递。Event Bus 在以下层面保障幂等性：

- **event_id 去重**：订阅方本地维护已处理事件 ID 的 LRU 缓存（Phase 1: 内存 Map，Phase 2: Redis Set），处理前检查，处理后将 event_id 写入缓存
- **缓存 TTL**：1 小时过期，平衡内存占用与去重窗口
- **订阅方责任**：最终幂等性由订阅方业务逻辑保障，Event Bus 提供去重提示但不对业务结果负责

### 5.3 异常处理

| 异常类型 | Phase 1 处理 | Phase 2 处理 |
|---------|-------------|-------------|
| 订阅方处理失败 | 重试 → 记录日志 | 重试 → 死信队列 |
| 消息格式错误 | 拒绝发布，立即返回异常 | 拒绝发布，nack 无重试 |
| 无匹配订阅者 | 静默返回（no-op） | 静默返回（no-op） |
| 传输层不可用 | 不适用 | 缓冲 + 重连 |

### 5.4 未来消息队列适配器预留

Phase 2 的 RabbitMQ 适配器设计要点：

```typescript
/** RabbitMQ 适配器 — Phase 2 实现 */
export interface IMessageQueueAdapter {
  connect(url: string): Promise<void>;
  disconnect(): Promise<void>;
  publish(routingKey: string, message: Buffer, options?: PublishOptions): Promise<void>;
  subscribe(routingKey: string, handler: MessageHandler): Promise<void>;
}

/** 从 eventType 推导 RabbitMQ routing key */
function eventTypeToRoutingKey(eventType: string): string {
  // "permission.role.assigned" → "event.permission.role.assigned"
  return `event.${eventType}`;
}
```

**适配器切换点**：`EventBusService` 内部通过策略模式持有 `IMessageQueueAdapter` 实例。Phase 1 使用 `MemoryAdapter`，Phase 2 切换为 `RabbitMQAdapter`，对外接口不变，发布方与订阅方零感知。

**RabbitMQ 拓扑设计（Phase 2）**：

```
Exchange: ailos.events (topic)
  │
  ├── Queue: event.permission.* (绑定: event.permission.*)
  │     └── 消费者: Audit Log Subscriber
  │
  ├── Queue: event.memory.* (绑定: event.memory.*)
  │     └── 消费者: Memory Manager
  │
  └── Queue: event.dead-letter (死信队列)
        └── 消费者: 人工/自动排查
```

---

## 6. Compliance Review

### 6.1 架构宪法合规

| 检查项 | 结果 | 说明 |
|--------|:---:|------|
| 模块归属 | PASS | Runtime Infrastructure Layer，横向通用组件 |
| 不修改 Blueprint 核心抽象 | PASS | 事件总线不改变架构分层与模块职责 |
| 不新增业务功能 | PASS | 纯基础设施，不承载业务逻辑 |
| 不新增 Runtime Manager | PASS | 任务明确为 Event Bus，不扩展为 Manager |
| 不新增数据库表 | PASS | Phase 1 无持久化；Phase 2 仅使用 RabbitMQ，不创建业务表 |

### 6.2 双轨原则合规

| 检查项 | 结果 | 说明 |
|--------|:---:|------|
| 仅存在 Personal + Platform 双轨 | PASS | 无 Community 轨道相关设计 |
| 事件数据按 evolution_track 逻辑隔离 | PASS | 预留 `evolution_track` 字段在 Envelope 扩展中，Phase 1 不强制 |
| 术语无违规 | PASS | 全文无 Community / Three-Track 等已删除术语 |

### 6.3 Asset First 合规

| 检查项 | 结果 | 说明 |
|--------|:---:|------|
| 不创建 Asset 领域表 | PASS | Event Bus 不操作业务数据库 |
| 不产生知识资产 | PASS | 事件数据为传输中间态，不持久化在 Event Bus 中 |
| 不影响已有 Asset 模块 | PASS | 与 AssetCenterModule 无耦合 |

### 6.4 已冻结模块兼容性校验

| 冻结模块 | 是否修改 | 兼容方式 |
|---------|:---:|------|
| Permission Manager v1.0 | 否 | `IEventBus.publish()` 签名与 `IEventPublisher.publish()` 完全一致，Phase 2 通过 DI 替换实现 `IEventPublisher` 接口 |
| State Manager v1.0 | 否 | Event Bus 不依赖 State Manager |
| Auth Layer | 否 | 无交互 |
| Prisma Schema | 否 | 无新增表 |

**Permission Manager 集成验证**：

- 5 个已冻结事件类型（`permission.granted` / `permission.revoked` / `role.assigned` / `role.unassigned` / `permission.denied`）全部被 Event Bus 命名规范覆盖
- `EventEnvelope<T>` 五字段格式（event_id / timestamp / source / trace_id / payload）原样复用，未增删任何字段
- `EventPublisherStub` 在 Phase 1 保持不变，Phase 2 替换路径清晰，无需修改 Permission Manager 任何代码

### 6.5 DESIGN ONLY 边界确认

| 禁止项 | 状态 |
|--------|:---:|
| 未编写业务实现代码 | 合规 — 本文档仅含接口定义与架构设计 |
| 未创建数据库表结构 | 合规 — 无 Migration 文件 |
| 未接入 RabbitMQ 实现 | 合规 — Phase 2 接口预留，Phase 1 仅 Memory Stub |
| 未修改 Permission Manager | 合规 — 零修改 |
| 未实现 Audit Log / Memory Manager | 合规 — 仅作为订阅方预留 |
| 未扩大需求范围 | 合规 — 严格 6 章交付 |

---

## Appendix A: 与现有 EventBusService Stub 的差异

当前代码库中 `src/infrastructure/event-bus/event-bus.service.ts` 的 `publish(eventType, payload)` 签名与 `EventEnvelope<T>` 不兼容。设计文档中定义的新接口将替换该 Stub：

| 对比项 | 现有 Stub | 新设计 |
|--------|----------|--------|
| publish 签名 | `(eventType: string, payload: any)` | `(eventType: string, envelope: EventEnvelope<T>)` |
| subscribe 签名 | `(eventType, handler)` | `(eventType, handler, options?)` → 返回 subscriptionId |
| 路由匹配 | 未实现 | 精确 + 前缀通配 |
| 重试机制 | 无 | 3 次重试 + 退避 |
| 模块模式 | @Global() | @Global() + Symbol Token + Interface |

## Appendix B: 依赖关系

| 依赖 | 版本 | 用途 | 阶段 |
|------|------|------|:---:|
| `@nestjs/common` | 11.x | NestJS 依赖注入、装饰器 | Phase 1 |
| `amqplib` | ^0.10.0 | RabbitMQ 客户端 | Phase 2 |
| `@types/amqplib` | ^0.10.0 | amqplib 类型定义 | Phase 2 |
| `ConfigService` | 已存在 | 读取 RABBITMQ_URL | Phase 2 |

## Appendix C: 文件变更清单（IMPLEMENT 阶段）

| 文件 | 操作 | 说明 |
|------|:---:|------|
| `src/infrastructure/event-bus/event-bus.types.ts` | 新增 | 类型定义 |
| `src/infrastructure/event-bus/event-bus.service.ts` | 重写 | 替换现有 Stub |
| `src/infrastructure/event-bus/event-bus.module.ts` | 修改 | 注册新 Provider |
| `src/infrastructure/event-bus/event-bus.provider.ts` | 新增 | Symbol Token |
| `src/infrastructure/event-bus/adapters/memory-adapter.ts` | 新增 | Phase 1 实现 |
| `src/infrastructure/event-bus/adapters/rabbitmq-adapter.ts` | 新增 | Phase 2 接口预留 |
| `src/infrastructure/event-bus/decorators/on-event.decorator.ts` | 新增 | 声明式订阅 |
| `src/infrastructure/event-bus/index.ts` | 新增 | Barrel Export |