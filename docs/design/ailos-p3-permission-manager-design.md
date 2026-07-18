# Phase 1 Task 3 Permission Manager Architecture Design Document

## Status
Design Completed / Pending Review

## Architecture Compliance
Yes

## Asset Compliance
Yes

## Dual-Track Compliance
Yes

## State Manager Impact
None（仅读取用户身份上下文，不修改 State Manager 核心抽象）

## Approval Request
Yes

---

## 1. Module Positioning

### 1.1 架构层级归属

```
AILOS v3.2.0 Architecture
│
├── Platform Layer（平台层）
│   ├── User Intent Recognition（用户意图识别层）— v3.2.0 新增，远期
│   ├── Capability Layer（能力层）
│   ├── Billing Layer（计费层）
│   └── Agent Operating Layer（智能体操作层）
│
├── AILOS Runtime（运行时）
│   ├── State Manager          ✅ Frozen v1.1
│   ├── Permission Manager     🚀 Current Design
│   ├── Event Bus              ⏸ Pending
│   ├── Audit Log Manager      ⏸ Pending
│   ├── Memory Manager         ⏸ Pending
│   └── Context Manager        ⏸ Pending
│
├── AI Layer（AI 引擎层）
│   ├── AI Gateway             ✅ 生产级
│   ├── AI Decision Engine     — v3.2.0 新增，远期
│   └── Model Router           ✅ 生产级
│
└── Identity Layer（身份层）
    ├── Auth Layer             ✅ 现有（身份认证）
    └── Digital Identity Twin  — Phase 3
```

**Permission Manager 归属**：AILOS Runtime 层，system_db 域。

### 1.2 核心职责与边界

**核心职责**：
- Role 角色管理（CRUD）
- Permission 权限项管理（CRUD）
- 角色-权限关联管理（绑定/解绑）
- 用户-角色分配（授予/撤销）
- 权限校验入口（Permission Guard — 统一鉴权门禁）
- 组织级权限范围预留（Organization Scope）
- 权限变更事件发布（预留 Event Bus 发布能力）

**绝对不负责**：
- 用户身份认证（Authentication）— 由 Auth Layer 在上游完成
- 用户账号信息管理（User CRUD）— 属 Identity Layer
- AI 调度逻辑 — 属 AI Gateway / Decision Engine
- 资产内容管理 — 属 Asset Engine / Knowledge Hub
- 学习业务逻辑 — 属 Learning Engine
- 审计日志存储 — 属 Audit Log Manager（本模块仅发布事件）
- 其他未授权模块的实现与设计

### 1.3 输入输出能力

| 方向 | 能力 | 说明 |
|------|------|------|
| **输入** | 用户身份上下文（userId, roles, orgId） | 由 Auth Layer 在上游解析 JWT 后注入 Request Context |
| **输入** | 受保护资源标识（resource + action） | 由 Controller 层或 Decorator 传入 |
| **输出** | Allow / Deny 判定结果 | 布尔值 + 拒绝原因码 |
| **输出** | 权限变更事件 | 发布至 Event Bus（预留），含标准 Envelope |
| **输出** | 角色/权限/用户角色数据 | 供管理后台查询使用 |

### 1.4 上下游依赖关系图

```
                         ┌───────────────────────────┐
                         │     Auth Layer (上游)       │
                         │  JWT 解析 → { userId,      │
                         │    roles[], orgId }        │
                         └─────────────┬─────────────┘
                                       │ 注入 Request Context
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Permission Manager                           │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ PermissionGuard │  │ RoleService    │  │ PermissionService│   │
│  │ (校验入口)      │  │ (角色 CRUD)    │  │ (权限项 CRUD)    │   │
│  └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘   │
│          │                   │                     │             │
│          ▼                   ▼                     ▼             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              PermissionRepository (Prisma)               │    │
│  │  Role | Permission | RolePermission | UserRole          │    │
│  └──────────────────────────────────────────────────────────┘    │
│          │                                                       │
│          ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │           Event Publisher (预留，非本模块实现)             │    │
│  │  permission.granted | permission.revoked | role.assigned │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │  Event Bus   │  │ Audit Log    │  │  State       │
           │  (下游)      │  │ Manager      │  │  Manager     │
           │  异步投递    │  │ (下游，远期) │  │  (仅读取     │
           │              │  │              │  │  用户上下文) │
           └──────────────┘  └──────────────┘  └──────────────┘
```

### 1.5 与上下游模块的交互边界

#### 与 Auth Layer 的交互边界

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Layer 职责（上游）                    │
│                                                             │
│  1. 接收 HTTP Request                                       │
│  2. 提取并验证 JWT Token                                    │
│  3. 解析 Token → { userId, membership, orgId }              │
│  4. 查询用户基础角色列表（从 UserRole 表）                    │
│  5. 注入 Request Context                                    │
│                                                             │
│  ───────────────── 边界线 ─────────────────                 │
│                                                             │
│  ❌ 不负责：权限校验判定、资源级访问控制、角色管理              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Permission Manager 职责（本模块）                │
│                                                             │
│  1. 接收 Auth Layer 注入的 { userId, roles[], orgId }       │
│  2. 解析受保护资源 { resource, action }                      │
│  3. 查询角色-权限映射表                                      │
│  4. 执行权限校验判定 → Allow / Deny                          │
│  5. 校验通过 → 放行；拒绝 → 返回 403 + 拒绝原因              │
│                                                             │
│  ───────────────── 边界线 ─────────────────                 │
│                                                             │
│  ❌ 不负责：Token 解析、用户身份认证、用户账号管理              │
└─────────────────────────────────────────────────────────────┘
```

**关键原则**：Authentication（身份认证）与 Authorization（权限校验）严格分离。Auth Layer 回答"你是谁"，Permission Manager 回答"你能做什么"。本模块所有接口默认上游已完成身份认证。

#### 与 State Manager 的交互边界

| 交互项 | 方式 | 说明 |
|--------|------|------|
| 读取用户身份上下文 | 可选读取 | 如需要读取 Auth Layer 之外的运行时用户状态，通过 `StateManager.get('identity:user:{userId}')` 读取 |
| 修改 State Manager | **禁止** | Permission Manager 不通过 State Manager 写入任何数据 |
| 修改 State Manager 核心抽象 | **禁止** | 已冻结，不可修改 |

#### 与 Event Bus 的交互边界

| 事件 | 触发时机 | 交互方式 |
|------|---------|---------|
| `permission.granted` | 权限项授予角色 | 预留 `EventPublisher.publish()` 调用 |
| `permission.revoked` | 权限项从角色移除 | 预留 `EventPublisher.publish()` 调用 |
| `role.assigned` | 角色授予用户 | 预留 `EventPublisher.publish()` 调用 |
| `role.unassigned` | 角色从用户移除 | 预留 `EventPublisher.publish()` 调用 |
| `permission.denied` | 权限校验被拒绝 | 预留 `EventPublisher.publish()` 调用 |

**Phase 1 实现策略**：权限变更操作预留事件发布调用点，但 Event Publisher 为 Stub 实现（空操作），不阻塞主流程。Event Bus Module 就绪后，替换 Stub 为真实 RabbitMQ 发布者。

#### 与 Audit Log Manager 的交互边界

Permission Manager 不直接调用 Audit Log Manager。权限变更事件通过 Event Bus 异步投递，Audit Log Manager 订阅 `permission.*` 和 `role.*` 事件后自行记录。本模块仅负责**发布事件**，不负责**存储审计日志**。

---

## 2. Data Model Design

### 2.1 数据库归属

**归属域**：`system_db`（系统库）

**当前阶段**：单库开发，所有表位于 `DATABASE_URL` 指向的同一数据库实例。

**未来分库**：Phase 1 结束、Phase 2 启动前，通过 `shard_key` 字段 + 数据库迁移脚本执行分库。当前 Schema 设计已按最终分域目标进行。

### 2.2 核心实体

#### 实体 1：Role（角色表）

| 字段 | 类型 | 必填 | 唯一 | 索引 | 说明 |
|------|------|------|------|------|------|
| `role_id` | VARCHAR(64) | ✅ | ✅ (PK) | PRIMARY | 角色唯一标识，UUID v4 |
| `name` | VARCHAR(128) | ✅ | ✅ | UNIQUE | 角色名称，如 `admin`、`member`、`teacher` |
| `display_name` | VARCHAR(256) | ✅ | — | — | 角色显示名称，如"管理员"、"会员" |
| `description` | VARCHAR(512) | — | — | — | 角色描述 |
| `org_scope` | VARCHAR(32) | — | — | INDEX | 组织范围：`global` / `org` / `workspace`。Phase 1 默认 `global` |
| `is_system` | BOOLEAN | ✅ | — | — | 是否系统内置角色（不可删除） |
| `evolution_track` | VARCHAR(32) | ✅ | — | — | 进化轨道：`personal` / `platform`。Phase 1 默认 `platform` |
| `shard_key` | VARCHAR(64) | — | — | INDEX | **预留字段**：分库分表键，未来按 `org_id` 分片 |
| `policy_engine_hook` | VARCHAR(256) | — | — | — | **预留字段**：ABAC Policy Engine 接入点标识 |
| `created_at` | DATETIME | ✅ | — | — | 创建时间 |
| `updated_at` | DATETIME | ✅ | — | — | 更新时间 |
| `deleted_at` | DATETIME | — | — | INDEX | 软删除时间 |

**Prisma Model**：
```prisma
model Role {
  roleId            String    @id @map("role_id") @db.VarChar(64)
  name              String    @unique @db.VarChar(128)
  displayName       String    @map("display_name") @db.VarChar(256)
  description       String?   @db.VarChar(512)
  orgScope          String    @default("global") @map("org_scope") @db.VarChar(32)
  isSystem          Boolean   @default(false) @map("is_system")
  evolutionTrack    String    @default("platform") @map("evolution_track") @db.VarChar(32)
  shardKey          String?   @map("shard_key") @db.VarChar(64)
  policyEngineHook  String?   @map("policy_engine_hook") @db.VarChar(256)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")

  rolePermissions RolePermission[]
  userRoles       UserRole[]

  @@index([orgScope])
  @@index([shardKey])
  @@index([deletedAt])
  @@map("roles")
}
```

#### 实体 2：Permission（权限项表）

| 字段 | 类型 | 必填 | 唯一 | 索引 | 说明 |
|------|------|------|------|------|------|
| `permission_id` | VARCHAR(64) | ✅ | ✅ (PK) | PRIMARY | 权限项唯一标识，UUID v4 |
| `code` | VARCHAR(256) | ✅ | ✅ | UNIQUE | 权限编码，格式 `resource:action`，如 `learning:read`、`admin:user:manage` |
| `name` | VARCHAR(256) | ✅ | — | — | 权限项名称 |
| `resource` | VARCHAR(128) | ✅ | — | INDEX | 资源域，如 `learning`、`admin`、`asset` |
| `action` | VARCHAR(64) | ✅ | — | — | 操作类型：`read`、`write`、`delete`、`manage` |
| `description` | VARCHAR(512) | — | — | — | 权限项描述 |
| `evolution_track` | VARCHAR(32) | ✅ | — | — | 进化轨道：`personal` / `platform` |
| `shard_key` | VARCHAR(64) | — | — | INDEX | **预留字段**：分库分表键 |
| `created_at` | DATETIME | ✅ | — | — | 创建时间 |
| `updated_at` | DATETIME | ✅ | — | — | 更新时间 |
| `deleted_at` | DATETIME | — | — | INDEX | 软删除时间 |

**Prisma Model**：
```prisma
model Permission {
  permissionId   String    @id @map("permission_id") @db.VarChar(64)
  code           String    @unique @db.VarChar(256)
  name           String    @db.VarChar(256)
  resource       String    @db.VarChar(128)
  action         String    @db.VarChar(64)
  description    String?   @db.VarChar(512)
  evolutionTrack String    @default("platform") @map("evolution_track") @db.VarChar(32)
  shardKey       String?   @map("shard_key") @db.VarChar(64)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  rolePermissions RolePermission[]

  @@index([resource])
  @@index([shardKey])
  @@index([deletedAt])
  @@map("permissions")
}
```

#### 实体 3：RolePermission（角色-权限关联表）

| 字段 | 类型 | 必填 | 唯一 | 索引 | 说明 |
|------|------|------|------|------|------|
| `id` | VARCHAR(64) | ✅ | ✅ (PK) | PRIMARY | 关联唯一标识，UUID v4 |
| `role_id` | VARCHAR(64) | ✅ | — | INDEX (FK) | 关联角色 |
| `permission_id` | VARCHAR(64) | ✅ | — | INDEX (FK) | 关联权限项 |
| `granted_by` | VARCHAR(64) | — | — | — | 授权操作人 ID |
| `created_at` | DATETIME | ✅ | — | — | 授权时间 |

**Prisma Model**：
```prisma
model RolePermission {
  id           String   @id @db.VarChar(64)
  roleId       String   @map("role_id") @db.VarChar(64)
  permissionId String   @map("permission_id") @db.VarChar(64)
  grantedBy    String?  @map("granted_by") @db.VarChar(64)
  createdAt    DateTime @default(now()) @map("created_at")

  role       Role       @relation(fields: [roleId], references: [roleId])
  permission Permission @relation(fields: [permissionId], references: [permissionId])

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

#### 实体 4：UserRole（用户-角色关联表）

| 字段 | 类型 | 必填 | 唯一 | 索引 | 说明 |
|------|------|------|------|------|------|
| `id` | VARCHAR(64) | ✅ | ✅ (PK) | PRIMARY | 关联唯一标识，UUID v4 |
| `user_id` | BIGINT | ✅ | — | INDEX (FK) | 关联用户（来自 `users` 表） |
| `role_id` | VARCHAR(64) | ✅ | — | INDEX (FK) | 关联角色 |
| `org_id` | BIGINT | — | — | INDEX | **预留字段**：组织 ID，Phase 1 为 NULL 表示全局 |
| `assigned_by` | VARCHAR(64) | — | — | — | 分配操作人 ID |
| `expires_at` | DATETIME | — | — | — | **预留字段**：角色过期时间 |
| `created_at` | DATETIME | ✅ | — | — | 分配时间 |
| `updated_at` | DATETIME | ✅ | — | — | 更新时间 |

**Prisma Model**：
```prisma
model UserRole {
  id         String    @id @db.VarChar(64)
  userId     BigInt    @map("user_id")
  roleId     String    @map("role_id") @db.VarChar(64)
  orgId      BigInt?   @map("org_id")
  assignedBy String?   @map("assigned_by") @db.VarChar(64)
  expiresAt  DateTime? @map("expires_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  role Role @relation(fields: [roleId], references: [roleId])

  @@unique([userId, roleId, orgId])
  @@index([userId])
  @@index([roleId])
  @@index([orgId])
  @@map("user_roles")
}
```

### 2.3 系统内置数据（Seed）

Phase 1 初始化时自动创建以下内置角色和权限：

**内置角色**：

| name | display_name | is_system | 说明 |
|------|-------------|-----------|------|
| `admin` | 管理员 | true | 全局管理员，拥有所有权限 |
| `member` | 会员 | true | 付费会员，拥有核心功能权限 |
| `free` | 免费用户 | true | 免费用户，拥有基础功能权限 |
| `teacher` | 教师 | true | 教师角色，拥有教学管理权限 |
| `school_admin` | 学校管理员 | true | 学校管理员，拥有组织管理权限 |

**内置权限项**：

| code | resource | action | 说明 |
|------|----------|--------|------|
| `learning:read` | learning | read | 查看学习内容 |
| `learning:write` | learning | write | 创建学习内容 |
| `admin:user:manage` | admin | manage | 管理用户 |
| `admin:role:manage` | admin | manage | 管理角色 |
| `admin:permission:manage` | admin | manage | 管理权限项 |
| `asset:read` | asset | read | 查看资产 |
| `asset:write` | asset | write | 创建/编辑资产 |
| `community:read` | community | read | 查看社区内容 |
| `community:write` | community | write | 发布社区内容 |
| `teacher:manage` | teacher | manage | 教学管理 |
| `org:manage` | org | manage | 组织管理 |

### 2.4 双轨进化数据隔离设计

| 进化轨道 | 适用的权限数据 | 隔离方式 |
|---------|--------------|---------|
| **Personal Evolution** | 用户自定义角色偏好（远期） | `evolution_track = 'personal'` + 应用层校验 |
| **Platform Evolution** | 系统内置角色、全局权限项 | `evolution_track = 'platform'`（当前默认） |

**Phase 1 约束**：所有权限数据默认归属 `platform` 轨道。用户自定义角色功能为远期能力（Phase 3+），当前不实现。`evolution_track` 字段已预留，未来启用时无需 Schema 变更。

**强制红线**：
- 禁止设计第三数据轨道（Community）
- 禁止引入 Community 级独立隔离域
- 个人轨道数据不得进入平台轨道聚合池

---

## 3. Permission Flow Design

### 3.1 完整权限校验全流程图

```
                         ┌──────────────────────┐
                         │     HTTP Request      │
                         │  Authorization:       │
                         │  Bearer <JWT>         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Auth Layer (上游)   │
                         │  1. 解析 JWT Token    │
                         │  2. 提取 userId       │
                         │  3. 提取 membership   │
                         │  4. 提取 orgId        │
                         └──────────┬───────────┘
                                    │ 注入 Request Context
                                    │ { userId, roles[], orgId }
                                    ▼
                         ┌──────────────────────┐
                         │  Permission Guard     │
                         │  (本模块校验入口)      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Step 1: 角色解析     │
                         │  getUserRoles(        │
                         │    userId, orgId)     │
                         └──────────┬───────────┘
                                    │
                          ┌─────────┴─────────┐
                          │ roles.length > 0? │
                          └─────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ No            │               │ Yes
                    ▼               │               ▼
          ┌────────────────┐       │    ┌──────────────────────┐
          │ 返回 403        │       │    │ Step 2: 权限匹配      │
          │ 原因: NO_ROLE   │       │    │ 遍历 roles →          │
          │ 发布 denied 事件│       │    │ 查询 RolePermission   │
          └────────────────┘       │    └──────────┬───────────┘
                                   │               │
                                   │    ┌──────────┴──────────┐
                                   │    │ 匹配到所需 permission? │
                                   │    └──────────┬──────────┘
                                   │               │
                                   │   ┌───────────┼───────────┐
                                   │   │ No        │           │ Yes
                                   │   ▼           │           ▼
                                   │ ┌──────────────────┐ ┌──────────────┐
                                   │ │ 返回 403          │ │ Step 3:      │
                                   │ │ 原因: NO_PERMISSION│ │ 组织范围校验  │
                                   │ │ 发布 denied 事件  │ │ (如启用)     │
                                   │ └──────────────────┘ └──────┬───────┘
                                   │                             │
                                   │                  ┌──────────┴──────────┐
                                   │                  │ orgScope 越界?       │
                                   │                  └──────────┬──────────┘
                                   │                             │
                                   │                 ┌───────────┼───────────┐
                                   │                 │ Yes       │           │ No
                                   │                 ▼           │           ▼
                                   │          ┌──────────────┐  │    ┌──────────────┐
                                   │          │ 返回 403      │  │    │ ✅ ALLOW     │
                                   │          │ 原因: ORG_SCOPE│  │    │ 放行请求     │
                                   │          │ 发布 denied   │  │    └──────────────┘
                                   │          └──────────────┘  │
                                   │                             │
                                   └─────────────────────────────┘
```

### 3.2 异常分支处理

| 异常场景 | 判定条件 | HTTP 状态码 | 错误码 | 审计事件 |
|---------|---------|------------|--------|---------|
| 无角色 | `getUserRoles()` 返回空数组 | 403 | `NO_ROLE` | `permission.denied` |
| 无权限 | 所有角色均无匹配的 permission | 403 | `NO_PERMISSION` | `permission.denied` |
| 组织越界 | `orgScope` 不匹配（远期启用） | 403 | `ORG_SCOPE_VIOLATION` | `permission.denied` |
| 用户不存在 | `userId` 无效 | 401 | `USER_NOT_FOUND` | 不发布（由 Auth Layer 处理） |
| Token 过期 | JWT 验证失败 | 401 | `TOKEN_EXPIRED` | 不发布（由 Auth Layer 处理） |

### 3.3 权限变更事件发布流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限变更操作（如 assignRole）                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ 1. 写入数据库        │
                  │    UserRole 表       │
                  │    新增记录          │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ 2. 构造事件 Envelope │
                  │ {                   │
                  │   event_id: uuid,   │
                  │   timestamp: now,   │
                  │   source: "perm",   │
                  │   trace_id: req.id, │
                  │   payload: {...}    │
                  │ }                   │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ 3. EventPublisher   │
                  │    .publish(        │
                  │      eventType,     │
                  │      envelope)      │
                  │                    │
                  │ Phase 1: Stub (空)  │
                  │ Phase 2: RabbitMQ   │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ 4. 返回操作结果      │
                  │    给调用方         │
                  └─────────────────────┘
```

**事件类型定义**：

| eventType | 触发操作 | payload 核心字段 |
|-----------|---------|-----------------|
| `permission.granted` | 权限项授予角色 | `{ roleId, permissionId, grantedBy }` |
| `permission.revoked` | 权限项从角色移除 | `{ roleId, permissionId, revokedBy }` |
| `role.assigned` | 角色授予用户 | `{ userId, roleId, orgId, assignedBy }` |
| `role.unassigned` | 角色从用户移除 | `{ userId, roleId, orgId, unassignedBy }` |
| `permission.denied` | 权限校验被拒绝 | `{ userId, resource, action, reason }` |

---

## 4. Interface Specification

### 4.1 接口边界声明

**核心原则**：Permission Manager 负责 **Authorization（授权校验）**。**Authentication（身份认证）** 已由 Auth Layer 在上游完成。本模块不承担任何用户身份认证职责。

所有接口设计基于以下前置假设：
- 上游 Auth Layer 已完成 JWT 解析
- `userId`、`roles[]`、`orgId` 已注入 Request Context
- Token 有效性已在上游验证

### 4.2 核心内部接口

#### 接口 1：checkPermission

```typescript
/**
 * 权限校验入口 — 判定用户是否拥有指定资源的指定操作权限
 *
 * @param userId    - 用户 ID（由 Auth Layer 注入）
 * @param resource  - 资源域，如 "learning"、"admin"、"asset"
 * @param action    - 操作类型，如 "read"、"write"、"delete"、"manage"
 * @param orgScope  - 组织范围（可选，Phase 1 预留）
 * @returns Promise<PermissionCheckResult>
 */
checkPermission(
  userId: string,
  resource: string,
  action: string,
  orgScope?: string
): Promise<PermissionCheckResult>

// 返回类型
interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;          // 拒绝原因码
  matchedRole?: string;     // 匹配到的角色名
  matchedPermission?: string; // 匹配到的权限编码
}
```

**错误码定义**：

| 错误码 | HTTP 状态码 | 含义 |
|--------|------------|------|
| `NO_ROLE` | 403 | 用户未分配任何角色 |
| `NO_PERMISSION` | 403 | 用户角色无对应权限 |
| `ORG_SCOPE_VIOLATION` | 403 | 组织范围越权 |
| `USER_NOT_FOUND` | 401 | 用户不存在 |
| `INVALID_RESOURCE` | 400 | 资源标识无效 |
| `INVALID_ACTION` | 400 | 操作类型无效 |

#### 接口 2：getUserRoles

```typescript
/**
 * 获取用户在指定组织下的角色列表
 *
 * @param userId - 用户 ID
 * @param orgId  - 组织 ID（可选，Phase 1 为 undefined 获取全局角色）
 * @returns Promise<UserRoleInfo[]>
 */
getUserRoles(
  userId: string,
  orgId?: string
): Promise<UserRoleInfo[]>

interface UserRoleInfo {
  roleId: string;
  roleName: string;
  displayName: string;
  orgScope: string;
  assignedAt: Date;
}
```

#### 接口 3：assignRole

```typescript
/**
 * 为用户分配角色
 *
 * @param userId   - 目标用户 ID
 * @param roleId   - 角色 ID
 * @param operator - 操作人 ID
 * @param orgId    - 组织 ID（可选，Phase 1 预留）
 * @returns Promise<AssignRoleResult>
 */
assignRole(
  userId: string,
  roleId: string,
  operator: string,
  orgId?: string
): Promise<AssignRoleResult>

interface AssignRoleResult {
  success: boolean;
  userRoleId?: string;     // 新创建的关联记录 ID
  error?: string;          // 失败原因
}
```

**错误码**：

| 错误码 | 含义 |
|--------|------|
| `ROLE_NOT_FOUND` | 角色不存在 |
| `USER_NOT_FOUND` | 用户不存在 |
| `ALREADY_ASSIGNED` | 角色已分配 |
| `OPERATOR_NO_PERMISSION` | 操作人无权限执行此操作 |

#### 接口 4：removePermission

```typescript
/**
 * 从角色移除权限项
 *
 * @param roleId       - 角色 ID
 * @param permissionId - 权限项 ID
 * @param operator     - 操作人 ID
 * @returns Promise<RemovePermissionResult>
 */
removePermission(
  roleId: string,
  permissionId: string,
  operator: string
): Promise<RemovePermissionResult>

interface RemovePermissionResult {
  success: boolean;
  error?: string;
}
```

#### 接口 5：getRolePermissions

```typescript
/**
 * 获取角色的所有权限项
 *
 * @param roleId - 角色 ID
 * @returns Promise<PermissionInfo[]>
 */
getRolePermissions(roleId: string): Promise<PermissionInfo[]>

interface PermissionInfo {
  permissionId: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}
```

#### 接口 6：listRoles

```typescript
/**
 * 列出角色列表（支持分页和筛选）
 *
 * @param params - 查询参数
 * @returns Promise<PaginatedRoles>
 */
listRoles(params?: {
  orgScope?: string;
  isSystem?: boolean;
  offset?: number;
  limit?: number;
}): Promise<PaginatedRoles>

interface PaginatedRoles {
  total: number;
  items: RoleInfo[];
}

interface RoleInfo {
  roleId: string;
  name: string;
  displayName: string;
  description?: string;
  orgScope: string;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}
```

### 4.3 接口调用示例

```typescript
// 场景 1：Controller 层权限校验
@Get('/learning/:courseId')
@RequirePermission('learning', 'read')
async getCourse(@Param('courseId') courseId: string, @Req() req: Request) {
  // @RequirePermission 装饰器已通过 PermissionGuard 完成校验
  // 此处仅处理业务逻辑
  return this.learningService.getCourse(courseId);
}

// 场景 2：Service 层手动校验
async deleteUser(targetUserId: string, operator: RequestContext) {
  const result = await this.permissionManager.checkPermission(
    operator.userId,
    'admin',
    'manage',
  );
  if (!result.allowed) {
    throw new ForbiddenException(result.reason);
  }
  // 执行删除逻辑
}
```

---

## 5. Extension Design

### 5.1 ABAC 未来扩展位置与接入方式

**当前状态**：Phase 1 仅实现 RBAC（User → Role → Permission 三级静态模型）。

**扩展预留**：

```
                            ┌──────────────────────────┐
                            │   Permission Guard        │
                            │   (当前 RBAC 校验入口)     │
                            └────────────┬─────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │ 当前 Phase 1       │                    │ 未来 Phase 2+
                    ▼                    │                    ▼
          ┌──────────────────┐          │          ┌──────────────────┐
          │ RBAC Evaluator   │          │          │ Policy Engine    │
          │ (静态角色-权限)   │          │          │ (ABAC 扩展)      │
          └──────────────────┘          │          │                  │
                                        │          │ 动态属性评估:    │
                                        │          │ • 时间段         │
                                        │          │ • IP 范围        │
                                        │          │ • 配额限制       │
                                        │          │ • 用户属性       │
                                        │          │ • 资源属性       │
                                        │          └──────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │ PolicyEngineHook  │
                              │ (Role 表预留字段)  │
                              │ 指向 Policy 配置   │
                              └───────────────────┘
```

**接入方式**：
1. `Role` 表的 `policy_engine_hook` 字段预留 Policy Engine 接入点
2. `PermissionGuard` 内部预留 `evaluatePolicy()` 扩展方法（Phase 1 为 Stub）
3. 未来 ABAC 启用时，`PermissionGuard.checkPermission()` 内部增加 Policy 评估链：
   ```
   checkPermission() → RBAC Evaluator → Policy Evaluator (ABAC) → Allow/Deny
   ```

### 5.2 组织层级权限扩展方案

**Phase 1 状态**：仅预留 `org_id`、`org_scope` 字段，不实现动态组织权限模型。

**扩展方案**：

```
         ┌──────────────────────────────────┐
         │        Organization (组织)         │
         │  org_id: 1, name: "XX学校"         │
         └──────────────┬───────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │Workspace│   │Workspace│   │Workspace│
    │ 语文组   │   │ 数学组  │   │ 英语组  │
    └─────────┘   └─────────┘   └─────────┘
```

**权限继承规则（远期设计）**：
- 组织级角色 → 继承到所有子 Workspace
- Workspace 级角色 → 仅在该 Workspace 内有效
- 权限校验时：先查 UserRole（org_id 匹配），再查 Role.org_scope

**Phase 1 预留字段**：
- `UserRole.org_id`：组织 ID（当前为 NULL）
- `Role.org_scope`：`global` / `org` / `workspace`（当前默认 `global`）

### 5.3 Policy Engine 接入预留点

| 预留位置 | 预留方式 | 说明 |
|---------|---------|------|
| `Role.policy_engine_hook` | 数据库字段 | 指向 Policy 配置的外部标识 |
| `PermissionGuard.evaluatePolicy()` | 方法 Stub | Phase 1 返回 `true`（放行），未来接入 Policy Engine |
| `PermissionModule` | Module 配置 | 预留 `PolicyEngineModule` 的 optional import |

---

## 6. Compliance Review

### 6.1 Asset First 合规

| 审查项 | 结果 | 说明 |
|--------|------|------|
| Permission Manager 是否产生知识资产？ | **否** | 权限规则是系统配置，非可复用的知识内容。不产生需进入 Asset Lifecycle 的资产 |
| 是否需要纳入 Asset Lifecycle 管理？ | **否** | 权限数据不属于 Generated→Validated→Indexed→Reusable→Premium→Archived 流转范畴 |
| 是否影响未来 Asset Permission Control 能力？ | **是（正向）** | Permission Manager 为未来的资产权限管控提供底座。`asset:read`、`asset:write` 等权限项已预留，未来 Asset Engine 可直接接入 |
| 权限配置变更是否需要全量审计留痕？ | **是** | 所有权限变更操作（角色分配/撤销、权限授予/移除）必须通过 Event Bus 发布事件，供 Audit Log Manager 全量留痕 |

**Asset First 合规结论**：✅ PASS。Permission Manager 本身不产生知识资产，但为资产权限管控提供了必要的安全底座。权限变更事件为未来资产审计提供全链路可追溯能力。

### 6.2 Dual-Track 合规

| 审查项 | 结果 | 说明 |
|--------|------|------|
| 权限数据属于哪条进化轨道？ | **Platform Evolution** | 系统内置角色和全局权限项属于平台级配置，归属 `platform` 轨道 |
| 是否设计了第三数据轨道？ | **否** | 所有数据模型仅包含 `personal` 和 `platform` 两个轨道值 |
| 是否引入 Community 级独立隔离域？ | **否** | 严格遵守 Dual-Track 定义，无 Community 轨道 |
| 如何保障双轨数据隔离？ | **应用层逻辑隔离** | 通过 `evolution_track` 字段 + 应用层强制校验实现。查询时默认过滤 `evolution_track = 'platform'`，未来个人轨道数据通过 `evolution_track = 'personal'` 隔离 |
| 是否预留了物理分库能力？ | **是** | `shard_key` 字段已预留，为未来分库分表提供分片键 |
| 个人轨道数据是否可能进入平台聚合池？ | **否** | 查询逻辑强制按 `evolution_track` 过滤，两条轨道数据在应用层完全隔离 |

**Dual-Track 合规结论**：✅ PASS。严格遵循双轨定义，无第三轨道设计，无数据混淆风险。

### 6.3 State Manager 合规

| 审查项 | 结果 | 说明 |
|--------|------|------|
| 是否修改 State Manager 核心抽象？ | **否** | State Manager 已冻结，Permission Manager 不修改其任何代码 |
| 依赖方式是什么？ | **仅读取** | 如需要读取 Auth Layer 之外的运行时用户状态，通过 `StateManager.get()` 读取，不写入 |
| 是否破坏冻结边界？ | **否** | 所有依赖均为调用方依赖，不要求 State Manager 做任何变更 |
| 是否绕过 State Manager 直接访问 Redis/MySQL？ | **否** | Permission Manager 使用独立的 Prisma Repository 访问自己的表（roles/permissions/role_permissions/user_roles），不直接操作 State Manager 的存储 |

**State Manager 合规结论**：✅ PASS。零影响，零修改，零越界。

### 6.4 审计合规

| 审查项 | 结果 | 说明 |
|--------|------|------|
| 权限变更如何产生审计事件？ | 预留 Event Publisher 调用 | 所有权限变更操作（assignRole/unassignRole/grantPermission/revokePermission）均预留 `EventPublisher.publish()` 调用点 |
| 事件格式是否统一？ | 是 | 使用标准 Envelope 格式：`{ event_id, timestamp, source, trace_id, payload }` |
| 是否满足全链路可追溯？ | 是 | 每个事件包含 `trace_id`（请求链路 ID）、`source`（操作来源）、`operator`（操作人），可追溯至具体操作人和请求上下文 |
| 权限拒绝事件是否记录？ | 是 | `permission.denied` 事件记录所有校验拒绝，含拒绝原因码 |

**审计合规结论**：✅ PASS。权限变更全链路可追溯，事件格式统一，满足未来 Audit Log Manager 接入要求。

---

## 7. Implementation Plan

### 7.1 开发步骤拆解

| 步骤 | 内容 | 产出物 | 预估工时 |
|------|------|--------|---------|
| Step 1 | Prisma Schema 新增 4 张表 | `prisma/schema.prisma` 更新 | 0.5h |
| Step 2 | 核心类型定义 | `permission.types.ts` | 0.5h |
| Step 3 | Role Repository + Service | CRUD + 内置角色 Seed | 1h |
| Step 4 | Permission Repository + Service | CRUD + 内置权限项 Seed | 1h |
| Step 5 | UserRole Repository + Service | 角色分配/撤销 + 查询 | 1h |
| Step 6 | PermissionGuard 实现 | 校验入口 + RBAC 评估 | 1.5h |
| Step 7 | Event Publisher Stub | 标准 Envelope + 预留调用点 | 0.5h |
| Step 8 | @RequirePermission 装饰器 | Controller 层声明式权限 | 0.5h |
| Step 9 | Permission Module 注册 | @Global() 模块 + app.module.ts | 0.5h |
| Step 10 | 单元测试 | 核心场景覆盖 | 2h |
| Step 11 | 集成测试 | Guard + 装饰器端到端 | 1h |
| Step 12 | Build 验证 + 提交 | `npm run build` + arch-check | 0.5h |
| **总计** | | | **~10.5h** |

### 7.2 测试用例范围

| 测试类别 | 测试场景 | 用例数 |
|---------|---------|--------|
| Role CRUD | 创建/查询/更新/软删除角色 | 4 |
| Permission CRUD | 创建/查询/更新/软删除权限项 | 4 |
| Role-Permission | 授予/撤销/查询角色权限 | 3 |
| User-Role | 分配/撤销/查询用户角色 | 3 |
| PermissionGuard | 有权限放行/无权限拒绝/无角色拒绝 | 3 |
| @RequirePermission | 装饰器生效验证 | 2 |
| 事件发布 | 权限变更事件 Envelope 格式验证 | 2 |
| 内置数据 | Seed 数据完整性验证 | 1 |
| **总计** | | **22** |

### 7.3 潜在风险与应对方案

| 风险 | 影响 | 概率 | 应对方案 |
|------|------|------|---------|
| Auth Guard 当前为 Stub（始终返回 true），无法提供真实 userId | PermissionGuard 无法获取真实用户上下文 | 高 | 在 Auth Guard 中注入 Mock userId 用于测试；真实 JWT 解析在 Auth Layer 后续完善后自动生效 |
| Event Bus 当前为 Stub，事件无法真实投递 | 审计事件无法送达 Audit Log Manager | 中 | 事件发布采用 Stub 模式，不阻塞主流程；Event Bus Module 就绪后替换 Stub 即可，无需修改 Permission Manager 代码 |
| UserRole 表与 User 表跨库依赖风险 | 未来分库后 JOIN 查询失效 | 低 | Phase 1 单库开发，无此问题；Phase 2 分库迁移时，UserRole 通过 `user_id` 关联，使用应用层聚合替代数据库 JOIN |
| 内置角色 Seed 数据与未来业务角色冲突 | 角色名称冲突 | 低 | 内置角色使用 `is_system = true` 标记，业务角色使用 `is_system = false`；`name` 字段唯一约束在 Seed 阶段处理 |

### 7.4 预估工作量

| 阶段 | 工时 |
|------|------|
| DESIGN（当前阶段） | 已完成 |
| IMPLEMENT | 7.5h |
| TEST | 2h |
| VERIFY | 0.5h |
| **总计** | **~10h** |

---

## Asset First 专项检查

### 检查 1：Permission Manager 是否直接产生知识资产？

**答案：否。**

Permission Manager 管理的是权限规则和角色配置，属于系统治理基础设施，不属于知识资产范畴。权限规则不进入 Asset Lifecycle 的 Generated→Validated→Indexed→Reusable→Premium→Archived 流转。

### 检查 2：是否需要纳入 Asset Lifecycle 管理？

**答案：否。**

权限数据不属于可复用的知识内容，不需要纳入 Asset Lifecycle。但权限数据本身需要版本化管理（通过 `updated_at` + 审计日志追溯），这与 Asset Lifecycle 是不同的治理维度。

### 检查 3：是否影响未来 Asset Permission Control 能力？

**答案：是（正向贡献）。**

Permission Manager 为未来的资产权限管控提供了统一的安全底座：

- `asset:read`、`asset:write` 权限项已预留，未来 Asset Engine 可直接接入
- 组织级权限范围（`org_scope`）已预留，未来支持"组织内资产可见性控制"
- 权限变更事件已预留发布能力，未来 Asset Permission 变更可全量审计

**架构关系**：
```
Asset Engine (未来)
    │
    │ 调用 checkPermission(userId, 'asset', 'read')
    ▼
Permission Manager (当前设计)
    │
    │ 返回 Allow/Deny
    ▼
Asset Engine 根据权限结果决定是否返回资产内容
```

### 检查 4：权限配置变更是否需要全量审计留痕？

**答案：是。**

所有权限变更操作（角色分配/撤销/权限授予/移除）必须通过 Event Bus 发布标准 Envelope 事件，供 Audit Log Manager 全量留痕。这是 v3.2.0 宪法中"AI 责任仲裁"和"全链路可溯源"的基础数据支撑。

**事件覆盖范围**：
- `role.assigned` / `role.unassigned` — 用户角色变更
- `permission.granted` / `permission.revoked` — 角色权限变更
- `permission.denied` — 权限校验拒绝（安全审计关键数据）

---

## 附录 A：术语统一对照表

| 旧错误表述 | 正式标准表述 | 适用范围 |
|-----------|------------|---------|
| Three-Track Evolution | **Dual-Track Evolution** | 所有文档、代码、注释、提交信息 |
| Community Evolution | **已删除** | 禁止在任何位置出现 |
| Platform Evolution | **Platform Evolution**（不变） | 双轨之一 |
| Personal Evolution | **Personal Evolution**（不变） | 双轨之一 |

---

*文档版本 v1.0.0 · 基于 AILOS v3.2.0 Architecture Constitution · 2026-07-18*
*Design Phase — 禁止编码实现*