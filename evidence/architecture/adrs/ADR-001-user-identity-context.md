# ADR-001: User Identity & Runtime Context System

- **日期**: 2026-07-19
- **状态**: Accepted
- **决策者**: AILOS Architecture Team
- **关联旧项目路径**: `E:\TRAE SOLO\prisma\schema.prisma` (User 模型), `E:\TRAE SOLO\src\services\authService.js`

## Context（背景）

### 旧项目现状

旧项目（言道学外语APP v1.0.0）仅存在单一 `User` 表（30 字段，位于 `prisma/schema.prisma`），包含 `membershipLevel`、`isGuest`、`failedLoginAttempts`、`lockedUntil` 等字段。经 Phase 0.2 勘察，确认存在以下结构性缺失：

1. **无身份分层**：User 表无 `role`、`identity` 字段，无法区分个人学习者、教师、学校管理员、企业管理员等角色
2. **无 Workspace 概念**：不存在 `organization`、`user_organization`、`member_role` 等组织归属表，用户无法归属到任何机构或工作空间
3. **无角色体系**：无 RBAC/ABAC 权限模型，所有用户权限平权
4. **无多身份切换**：用户仅能以一个身份操作，无法在同一账号下切换个人学习、教师工作台、机构管理后台等不同视图

### 架构蓝图要求

根据 AILOS v3.2.1 架构蓝图 **第四卷 Identity Layer**，明确提出：

- 一个用户、一个账号、多个角色、多组织、多终端、终身学习
- User 拥有多个 Role（Personal/Teacher/SchoolAdmin/EnterpriseAdmin/AIAgent）
- 用户可加入多个 Organization 和 Workspace
- 所有学习数据、社交关系、AI 记忆均归属于 UID，而非单个身份
- 角色切换时，数据视图随身份变化，但账号不变、历史数据不变

## Decision（决策）

### 核心决策

建立 **User Identity 三层体系**：User (UID) --> Identity (身份实例) --> Workspace x Role (角色 + 工作空间)

采用 **Runtime Context Resolver** 组件动态计算用户当前的三元上下文（UID + Workspace + Role），而非在请求中硬编码身份信息。

### 技术方案

#### 新增数据表

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `user_identity` | user_id, identity_type (personal/teacher/school_admin/enterprise_admin), display_name, avatar, is_primary | 用户身份实例，一个用户可拥有多个身份，其中一个是主身份 |
| `workspace` | workspace_type (personal/classroom/school/enterprise), org_id, name, status | 工作空间，资源归属的最小容器 |
| `workspace_member` | workspace_id, user_identity_id, role, joined_at, status | 工作空间成员关联，记录用户在某个 Workspace 中的角色 |
| `runtime_context` | uid, current_identity_id, current_workspace_id, context_hash, expires_at | 运行时上下文快照，缓存当前激活的上下文组合 |

#### Context Resolver 组件

Runtime Context Resolver 作为中间件部署于请求入口，负责：

1. 从 JWT Token 中解析 UID
2. 读取当前激活的 Identity（用户可切换）
3. 读取当前激活的 Workspace（用户可切换）
4. 组装三元上下文 `(UID, Workspace, Role)`
5. 注入请求上下文，供下游所有业务模块使用

#### 存量用户迁移策略

- 所有旧项目 `User` 表存量用户，默认分配 `user_identity` 为 `personal` 类型
- 默认创建 `personal` 类型的 `workspace` 并关联
- 迁移脚本幂等，可重复执行

## Consequences（影响）

### 正面影响

1. **统一身份底座**：一个账号终身使用，学习数据不因角色切换、组织变更、毕业离校而丢失
2. **数据归属清晰**：所有学习数据、AI 记忆、社交关系均归属于 UID，而非单个身份或组织
3. **上下文隔离**：不同 Workspace 下的数据视图完全隔离，学校管理员无法看到学生个人学习数据
4. **扩展性**：未来新增角色类型（如 Developer、AI Agent）仅需新增 identity_type 枚举值，无需改动核心模型

### 负面影响

1. **查询复杂度提升**：所有业务查询需额外携带 `workspace_id` 过滤条件
2. **迁移成本**：存量 `User` 表需执行数据迁移，Login/Register 流程需重构
3. **前端复杂度**：需实现角色切换 UI、上下文感知路由

## Constraints（边界约束）

- **Phase 1 仅实现 Personal 身份完整闭环**：个人注册、登录、个人 Workspace、个人学习数据，teacher/school_admin/enterprise_admin 仅作 `identity_type` 枚举预留
- **暂不实现 RBAC/ABAC 权限引擎**：Phase 1 使用简单的角色枚举判断，权限矩阵在 Phase 2 引入
- **暂不实现多 Workspace 切换**：Phase 1 用户仅拥有一个 Personal Workspace，多 Workspace 支持和切换 UI 在 Phase 2 实现
- **组织归属模型残留**：`workspace.org_id` 字段预留，Phase 1 始终为 NULL

## Future Iterations（远期迭代）

- **Phase 2**: 机构管理后台（SchoolAdmin）、教师工作台（Teacher）、企业培训后台（EnterpriseAdmin）完整落地
- **Phase 2**: 多 Workspace 切换，用户可在个人空间、学校空间、企业空间之间无缝切换
- **Phase 3**: ABAC 属性级权限控制，支持基于用户属性、资源属性、环境属性的动态权限判定
- **Phase 3**: 组织内角色继承与委托授权（如校长可将管理权限委托给年级组长）
- **Phase 4**: 跨组织身份联合（如教师同时属于多个学校）

## References（参考）

- [AILOS v3.2.1 架构蓝图 - 第四卷 Identity Layer](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [Phase 0.2 旧项目资产勘察报告 - 三、数据模型核心事实](E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md)
- 旧项目 User 模型: `E:\TRAE SOLO\prisma\schema.prisma`
- 旧项目 Auth Service: `E:\TRAE SOLO\src\services\authService.js`
