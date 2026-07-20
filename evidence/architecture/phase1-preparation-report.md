# AILOS Phase 1.0 Architecture Preparation Report

**文档版本**: v1.0.0
**编制日期**: 2026-07-19
**文档状态**: Architecture Preparation -- Completed
**编制依据**: AILOS v3.2.1 架构蓝图 + Phase 0.2 Legacy Commercial Migration Facts
**工作区锁定**: `E:\TRAE SOLO` (xuewaiyu-app v1.0.0, Locked)
**目标主仓库**: `https://github.com/wzmpa18/AILOS`

---

## 第一章：分层新旧资产完整梳理（任务一）

基于 Phase 0.2 事实报告（`E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md`），对旧项目（言道学外语APP xuewaiyu-app v1.0.0）全部资产进行三级分类梳理。

---

### 1.1 可直接复用资产

以下资产无需任何修改，可直接保留并迁移至 AILOS 架构。

| 序号 | 资产名称 | 覆盖范围 | 源码路径 | 复用理由 |
|------|---------|---------|---------|---------|
| 1 | 用户登录认证体系 | Auth 11个端点、JWT鉴权、bcrypt密码加密 | `src/server/routes/auth.js`, `src/services/authService.js`, `src/utils/jwt.js`, `src/utils/crypto.js` | 认证逻辑成熟稳定，JWT + bcrypt 为行业标准方案，与 AILOS 统一身份原则兼容，无需改造 |
| 2 | 支付订单系统 | MembershipOrder 表、5个端点、支付回调 | `src/server/routes/membership.js`, `src/services/membershipService.js`, `prisma/schema.prisma` (MembershipOrder 模型) | 会员购买/支付回调链路完整，新旧会员状态可无缝衔接，仅需对接新 Permission Manager |
| 3 | 会员权益 + 隐私合规 | DataExportRequest、AccountDeletionRequest 模型 | `prisma/schema.prisma` | 数据导出、账号注销等隐私合规功能已实现，符合 GDPR/个人信息保护法要求，100%保留 |
| 4 | Express/Prisma/Redis 基础设施 | Web框架、ORM、缓存、数据库连接 | `src/config/database.js`, `src/config/redis.js`, `src/config/index.js`, `package.json` | Node.js + Express + Prisma + PostgreSQL + Redis 技术栈与 AILOS 蓝图完全一致，直接作为 V1 统一架构基础 |
| 5 | 通用中间件 | auth 中间件、errorHandler、rateLimiter | `src/server/middleware/auth.js`, `src/server/middleware/errorHandler.js`, `src/server/middleware/rateLimit.js` | 鉴权、错误处理、限流中间件逻辑完整，可直接复用，仅需扩展 workspace 上下文注入 |
| 6 | 工具函数库 | crypto、jwt、logger、validator | `src/utils/crypto.js`, `src/utils/jwt.js`, `src/utils/logger.js`, `src/utils/validator.js` | 底层工具函数无业务耦合，全量保留 |
| 7 | 种子数据与迁移脚本 | 数据库初始化 | `src/database/migrate.js`, `src/database/seed.js` | 迁移框架和种子数据逻辑可复用，后续新增表追加迁移脚本即可 |
| 8 | 测试体系 | Jest + Supertest 测试框架 | `tests/auth.test.js`, `tests/membership.test.js`, `tests/user.test.js`, `tests/setup.js`, `jest.config.js` | 测试框架和用例可复用，新增模块追加对应测试 |
| 9 | 系统配置与限流 | RateLimitLog、SystemConfig 模型 | `prisma/schema.prisma` | 系统级配置管理和限流日志可直接复用 |
| 10 | 短信验证 | SmsVerification 模型 | `prisma/schema.prisma` | 短信验证码发送与校验逻辑保留 |

**存量 Prisma 模型完整保留清单**（`prisma/schema.prisma`）：

| 模型 | 保留状态 | 说明 |
|------|---------|------|
| User | 全字段保留 | 30个字段全保留，新增字段可空 |
| Session | 全字段保留 | token/refreshToken/deviceInfo 全保留 |
| GuestSession | 全字段保留 | 游客模式保留 |
| UserDevice | 全字段保留 | 多设备同步保留 |
| LearningProgress | 全字段保留 | 旧学习进度保留，新增字段可空 |
| MembershipOrder | 全字段保留 | 会员订单100%保留 |
| DataExportRequest | 全字段保留 | 隐私合规保留 |
| AccountDeletionRequest | 全字段保留 | 账号注销保留 |
| SmsVerification | 全字段保留 | 短信验证保留 |
| RateLimitLog | 全字段保留 | 限流日志保留 |
| SystemConfig | 全字段保留 | 系统配置保留 |

**存量 API 端点保留清单**（27个端点全部保留）：

| 模块 | 端点数 | 路由文件 | 保留状态 |
|------|--------|---------|---------|
| Auth | 11 | `src/server/routes/auth.js` | 全保留 |
| User | 11 | `src/server/routes/user.js` | 全保留 |
| Membership | 5 | `src/server/routes/membership.js` | 全保留 |

---

### 1.2 待改造兼容资产

以下资产存在架构不匹配、硬编码、技术债务等问题，需进行定向改造后方可纳入 AILOS 架构。

| 序号 | 资产名称 | 问题描述 | 源码路径 | 改造方案 |
|------|---------|---------|---------|---------|
| 1 | 旧混元 AI 6处调用点 | AI调用分散在多个模块，无统一入口，代理地址硬编码 | `server.js` (AI代理健康探测、AI路由挂载 `/api/ai`)、`src/config/index.js` (环境变量配置)、`degradationService.js` (降级功能矩阵)、`qaInspector.js` (QA巡检)、`monitorService.js` (AI指标采集) | 全部迁移至 AILOS AI Gateway 统一入口，移除硬编码代理地址 `http://127.0.0.1:8787`，由 AI Gateway 统一调度、缓存、日志、限流 |
| 2 | LearningProgress 原始学习进度表 | 单一 language 字段，无学习事件/能力模型/画像/记忆体系 | `prisma/schema.prisma` (LearningProgress 模型)、`src/services/userService.js` | 存量数据全量导入 learning_event 表，新建五层模型（Goal -> Plan -> Event -> Ability Model -> Profile -> Memory），旧表保留兼容 |
| 3 | 简易登录流程 | 无身份上下文（identity_type）、无 workspace 概念，仅手机号/微信/密码登录后直接返回 token | `src/services/authService.js`、`src/server/routes/auth.js` | 登录后注入 Context Resolver：基于 Token + 请求头动态生成三元上下文（用户+当前空间+角色），存量用户默认分配个人 workspace |
| 4 | 基础权限逻辑 | 仅 User.membershipLevel 字段判断会员等级，无 RBAC/ABAC 角色体系 | `prisma/schema.prisma` (User 模型)、`src/server/middleware/auth.js` | 对接 Permission Manager RBAC，新增 organization_member.role 字段，旧 membershipLevel 保留向下兼容 |
| 5 | 硬编码问题（价格、AI代理、降级内容） | 价格硬编码于 `membershipService.js`、AI代理地址硬编码于 `server.js`、离线兜底内容硬编码于 `degradationService.js` | `src/services/membershipService.js` (getMembershipPlans)、`server.js` (第42行及AI代理地址)、`degradationService.js` | 提取为 SystemConfig 配置项或环境变量，由配置中心统一管理 |
| 6 | 双后端架构 | V1 (`src/server/index.js` Prisma+Redis) vs V2 (`server.js` better-sqlite3) 两套后端共存 | `src/server/index.js`、`server.js` | 统一为 V1 架构（Prisma + PostgreSQL + Redis），废弃 V2 SQLite 方案，V2 中 10 个路由模块按需迁移至 V1 架构 |
| 7 | 微信 OAuth mock | `authService.js` 中 `getWechatUserInfo()` 为 mock 实现 | `src/services/authService.js` | 对接真实微信 OAuth API |
| 8 | 明文输出验证码 | `authService.js` 中 `sendSmsCode()` 将验证码明文输出到日志 | `src/services/authService.js` | 生产环境移除明文日志，仅保留脱敏哈希 |
| 9 | 两套 Logger 实现 | `src/utils/logger.js` (Winston) vs `logger.js` (根目录) 两套日志系统 | `src/utils/logger.js`、`logger.js` | 统一使用 `src/utils/logger.js` (Winston)，删除根目录冗余 logger.js |
| 10 | 运维模块引用路径不匹配 | `server.js` 中引用 `./config/database` 实际路径为 `src/config/database.js` | `server.js` | 随 V2 废弃一并解决，V1 统一架构下路径自动对齐 |

---

### 1.3 全新待建核心资产

以下为 AILOS 蓝图要求的核心资产，旧项目中完全不存在，需从零构建。

#### 1.3.1 User Identity 身份上下文体系

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| user_identity 表 | P0 | 关联旧 User 表 (user_id FK)，新增字段全部可空 | 区分个人/机构身份类型 |
| workspace 表 | P0 | 存量用户自动分配默认个人 workspace | 资源归属最小容器 |
| organization 表 | P0 | 全新表，无存量数据 | 机构基础信息 |
| organization_member 表 | P0 | 全新表，无存量数据 | 机构成员关系 |
| Context Resolver | P0 | 基于旧 JWT Token + 请求头动态解析 | 每次请求生成三元上下文 |

#### 1.3.2 GLOI 全局语言层

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| user_language_preference 表 | P0 | 存量用户默认中文母语+英文兜底 | 用户语言偏好配置 |
| user_learning_language 表 | P0 | 从旧 LearningProgress.language 初始化 | 用户学习语种管理 |
| Language Context Resolver | P0 | 每次请求自动读取用户语言配置 | 标准化语言上下文 |
| Language Guard (MVP) | P1 | 输入/输出校验，违规写入 ai_request_log | 语言安全防护 |

#### 1.3.3 五层目标驱动学习模型

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| Learning Goal | P0 | 无存量数据，全新创建 | 学习目标定义 |
| Learning Plan | P0 | 无存量数据，全新创建 | 学习计划 |
| Learning Event | P0 | 旧 LearningProgress 全量导入 | 学习事件流水 |
| Learning Ability Model | P0 | 基于旧 LearningProgress 初始化基础能力 | 六维能力模型 |
| Learning Profile | P0 | 基于旧数据初始化初始画像 | 用户学习画像 |
| Learning Memory | P1 | 无存量数据，全新创建 | 长期记忆体系 |

#### 1.3.4 MVP AI Gateway

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| AI Gateway 统一入口 | P0 | 替换旧 6 处分散调用点 | 全系统唯一 AI 入口 |
| ai_prompt_template 表 | P0 | 全新表，无存量数据 | Prompt 模板管理 |
| ai_request_log 表 | P0 | 全新表，替代旧 monitorService AI 指标采集 | 全链路调用日志 |
| 资产优先策略 | P0 | 对接 learning_content 资产库 | 缓存优先于模型调用 |

#### 1.3.5 learning_content 内容资产库

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| learning_content 表 | P0 | 全新表，无存量数据 | AI 生成内容标准化入库 |
| 内容复用机制 | P0 | 全新逻辑 | 同类请求优先复用 |

#### 1.3.6 轻量化机构模块

| 组件 | 优先级 | 存量对接边界 | 说明 |
|------|--------|-------------|------|
| organization 基础表 | P0 | 全新表 | 已在 1.3.1 中包含 |
| organization_member 基础表 | P0 | 全新表 | 已在 1.3.1 中包含 |
| task 表 | P1 | 全新表 | 机构任务 |
| task_progress 表 | P1 | 全新表 | 任务进度 |

---

## 第二章：全量数据库迁移设计（任务二）

本章基于 AILOS v3.2.1 架构蓝图及 ADR-016 (GLOI Principle)，结合 Phase 0.2 事实报告中 11 个 Prisma 存量模型，输出完整新表设计。

**核心约束**：
- 所有新增表字段中，新增字段必须可空（NULL 允许）
- 存量 11 个 Prisma 模型完整保留，不删不改
- 新表通过外键关联旧表，不破坏存量数据完整性

---

### 2.1 User Identity 用户身份分层体系

#### 2.1.1 user_identity 表

```sql
-- 用户身份标识表，关联旧 User 表
CREATE TABLE user_identity (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    default_workspace_id UUID,  -- 可空，默认个人空间
    identity_type   VARCHAR(20) NOT NULL DEFAULT 'personal',  -- personal / organization
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE UNIQUE INDEX idx_user_identity_user_id ON user_identity(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | 外键关联旧 User 表 |
| default_workspace_id | UUID | YES | 默认工作空间，迁移时设为个人空间ID |
| identity_type | VARCHAR(20) | NOT NULL | 身份类型，个人/机构，默认 personal |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.1.2 workspace 表

```sql
-- 工作空间表，资源归属的最小容器
CREATE TABLE workspace (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(20) NOT NULL DEFAULT 'personal',  -- personal / organization
    owner_id        UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    organization_id UUID,  -- 可空，个人空间为 NULL
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_workspace_owner_id ON workspace(owner_id);
CREATE INDEX idx_workspace_organization_id ON workspace(organization_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| name | VARCHAR(100) | NOT NULL | 空间名称 |
| type | VARCHAR(20) | NOT NULL | personal / organization |
| owner_id | UUID | NOT NULL | 所有者，FK->User |
| organization_id | UUID | YES | 关联机构，个人空间为 NULL |
| is_default | BOOLEAN | NOT NULL | 是否默认空间 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.1.3 organization 表

```sql
-- 机构表
CREATE TABLE organization (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,  -- 可空
    logo_url        VARCHAR(500),  -- 可空
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / suspended / inactive
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| name | VARCHAR(200) | NOT NULL | 机构名称 |
| description | TEXT | YES | 机构描述 |
| logo_url | VARCHAR(500) | YES | Logo URL |
| status | VARCHAR(20) | NOT NULL | active/suspended/inactive |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.1.4 organization_member 表

```sql
-- 机构成员关系表
CREATE TABLE organization_member (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'student',  -- admin / teacher / student
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / inactive / invited
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- 索引
CREATE INDEX idx_org_member_org_id ON organization_member(organization_id);
CREATE INDEX idx_org_member_user_id ON organization_member(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| organization_id | UUID | NOT NULL | 机构ID |
| user_id | UUID | NOT NULL | 用户ID |
| role | VARCHAR(20) | NOT NULL | admin / teacher / student |
| status | VARCHAR(20) | NOT NULL | active / inactive / invited |
| joined_at | TIMESTAMP | NOT NULL | 加入时间 |

#### 2.1.5 Context Resolver 运行规则

```
请求进入 -> JWT Token 解析 UID
    -> 读取请求头 workspace_id（可选）
    -> 若未指定 workspace_id -> 读取 user_identity.default_workspace_id
    -> 查询 workspace 获取 type + organization_id
    -> 若 workspace.type = organization -> 查询 organization_member 获取 role
    -> 生成三元上下文：
        {
            user_id: UID,
            current_workspace: { workspace_id, type, organization_id },
            current_role: "personal" | "admin" | "teacher" | "student"
        }
    -> 注入 req.context 供下游使用
```

**存量兼容**：旧 User 表 role 字段保留不删，向下兼容。存量用户 `user_identity.identity_type = 'personal'`，自动分配独立个人 workspace（`type = 'personal'`, `is_default = true`）。

---

### 2.2 GLOI 全局语言分层（完整数据库设计）

#### 2.2.1 user_language_preference 表

```sql
-- 用户语言偏好配置表
CREATE TABLE user_language_preference (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    interface_language          VARCHAR(10) NOT NULL DEFAULT 'zh-CN',  -- 界面显示语言
    native_language             VARCHAR(10) NOT NULL DEFAULT 'zh-CN',  -- 母语
    default_explanation_language VARCHAR(10) NOT NULL DEFAULT 'zh-CN', -- 默认解释语言
    fallback_language           VARCHAR(10) NOT NULL DEFAULT 'en',     -- 兜底语言
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_lang_pref_user_id ON user_language_preference(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| interface_language | VARCHAR(10) | NOT NULL | 界面语言，默认 zh-CN |
| native_language | VARCHAR(10) | NOT NULL | 母语，默认 zh-CN |
| default_explanation_language | VARCHAR(10) | NOT NULL | 默认解释语言，默认 zh-CN |
| fallback_language | VARCHAR(10) | NOT NULL | 兜底语言，默认 en |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.2.2 user_learning_language 表

```sql
-- 用户学习语种管理表
CREATE TABLE user_learning_language (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    language_code   VARCHAR(10) NOT NULL,  -- ISO 639-1，如 ja, en, ko
    level           VARCHAR(10) NOT NULL DEFAULT 'A1',  -- A1/A2/B1/B2/C1/C2
    priority        INTEGER NOT NULL DEFAULT 1,  -- 优先级，数字越小越高
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / inactive
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, language_code)
);

CREATE INDEX idx_learn_lang_user_id ON user_learning_language(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| language_code | VARCHAR(10) | NOT NULL | ISO 639-1 语言代码 |
| level | VARCHAR(10) | NOT NULL | CEFR 等级 |
| priority | INTEGER | NOT NULL | 优先级，1=最高 |
| status | VARCHAR(20) | NOT NULL | active / inactive |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**示例数据**：

| user_id | language_code | level | priority | status |
|---------|--------------|-------|----------|--------|
| uid-001 | ja | N2 | 1 | active |
| uid-001 | en | B2 | 2 | active |
| uid-001 | ko | A1 | 3 | active |

#### 2.2.3 Language Context Resolver 运行规则

```
每次请求 -> 读取 user_language_preference（获取 interface_language, native_language, fallback_language）
    -> 读取 user_learning_language（获取当前学习语种列表及优先级）
    -> 标准化生成全局语言上下文：
        {
            user_language: {
                interface: "zh-CN",
                native: "zh-CN",
                explanation: "zh-CN",
                fallback: "en"
            },
            learning_languages: [
                { code: "ja", level: "N2", priority: 1 },
                { code: "en", level: "B2", priority: 2 },
                { code: "ko", level: "A1", priority: 3 }
            ],
            active_learning_language: "ja"  // 优先级最高的 active 语种
        }
    -> 注入 req.language_context 供下游使用
```

#### 2.2.4 Language Guard (MVP) 规则

| 校验点 | 规则 | 违规处理 |
|--------|------|---------|
| 输入校验 | 用户输入语种必须与当前学习语种匹配 | 拦截并提示，记录至 ai_request_log |
| 输出校验 | AI 生成内容的语言必须与请求 output_identity 一致 | 标记为质量异常，触发重生成 |
| 违规计数 | 每次违规写入 ai_request_log.error_message | 累计 3 次触发人工审核 |

#### 2.2.5 全库语种绑定规范

**learning_content 表新增字段**（在 2.5 节完整定义）：

| 新增字段 | 说明 |
|---------|------|
| source_language | 源语言代码 |
| target_language | 目标语言代码 |
| explanation_language | 解释语言代码 |
| difficulty_level | 难度等级 |
| content_version | 内容版本号 |
| status | 状态枚举 |

**learning_ability_model 强制绑定**：

| 字段 | 说明 |
|------|------|
| language_code | 强制绑定，不同语种数据完全隔离 |

**learning_content.status 枚举**：

| 状态值 | 说明 |
|--------|------|
| draft | 草稿 |
| generating | AI 生成中 |
| reviewing | 审核中 |
| approved | 审核通过 |
| published | 已发布 |
| archived | 已归档 |
| failed | 生成失败 |

---

### 2.3 Goal 驱动五层学习数据流

#### 2.3.1 Learning Goal 表

```sql
-- 学习目标表
CREATE TABLE learning_goal (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    workspace_id    UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    goal_type       VARCHAR(50) NOT NULL,  -- daily / weekly / milestone / exam / certification
    target_language VARCHAR(10) NOT NULL,  -- 目标语种
    target_level    VARCHAR(10),  -- 可空，目标等级
    description     TEXT,  -- 可空，目标描述
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / completed / paused / cancelled
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goal_user_id ON learning_goal(user_id);
CREATE INDEX idx_goal_workspace_id ON learning_goal(workspace_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| workspace_id | UUID | NOT NULL | FK->workspace |
| goal_type | VARCHAR(50) | NOT NULL | daily/weekly/milestone/exam/certification |
| target_language | VARCHAR(10) | NOT NULL | 目标语种 |
| target_level | VARCHAR(10) | YES | 目标等级 |
| description | TEXT | YES | 目标描述 |
| status | VARCHAR(20) | NOT NULL | active/completed/paused/cancelled |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.3.2 Learning Plan 表

```sql
-- 学习计划表
CREATE TABLE learning_plan (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id         UUID NOT NULL REFERENCES learning_goal(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    plan_type       VARCHAR(50) NOT NULL,  -- daily / weekly / custom
    schedule        JSONB,  -- 可空，排课计划 JSON
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / completed / paused
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plan_goal_id ON learning_plan(goal_id);
CREATE INDEX idx_plan_user_id ON learning_plan(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| goal_id | UUID | NOT NULL | FK->learning_goal |
| user_id | UUID | NOT NULL | FK->User |
| plan_type | VARCHAR(50) | NOT NULL | daily/weekly/custom |
| schedule | JSONB | YES | 排课计划 JSON |
| status | VARCHAR(20) | NOT NULL | active/completed/paused |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.3.3 Learning Event 表

```sql
-- 学习事件流水表（仅做流水，不反向改写目标）
CREATE TABLE learning_event (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    workspace_id    UUID NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,  -- lesson_complete / word_learned / quiz_taken / exercise_done / streak_update
    language_code   VARCHAR(10) NOT NULL,  -- 关联语种
    data            JSONB NOT NULL DEFAULT '{}',  -- 事件数据 JSON
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_user_id ON learning_event(user_id);
CREATE INDEX idx_event_workspace_id ON learning_event(workspace_id);
CREATE INDEX idx_event_created_at ON learning_event(created_at);
CREATE INDEX idx_event_language_code ON learning_event(language_code);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| workspace_id | UUID | NOT NULL | FK->workspace |
| event_type | VARCHAR(50) | NOT NULL | lesson_complete/word_learned/quiz_taken/exercise_done/streak_update |
| language_code | VARCHAR(10) | NOT NULL | 关联语种 |
| data | JSONB | NOT NULL | 事件数据 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**设计原则**：Event 仅做流水记录，不反向改写 Goal 或 Plan。Event 产生后由异步任务驱动下游更新。

#### 2.3.4 Learning Ability Model 表

```sql
-- 学习能力模型表（六维评估，不同语种数据完全隔离）
CREATE TABLE learning_ability_model (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    language_code   VARCHAR(10) NOT NULL,  -- 强制绑定语种
    dimension       VARCHAR(20) NOT NULL,  -- vocabulary / grammar / listening / speaking / reading / writing
    score           DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 0-100 分
    level           VARCHAR(10) NOT NULL DEFAULT 'A1',  -- CEFR 等级
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, language_code, dimension)
);

CREATE INDEX idx_ability_user_id ON learning_ability_model(user_id);
CREATE INDEX idx_ability_language_code ON learning_ability_model(language_code);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| language_code | VARCHAR(10) | NOT NULL | 强制绑定语种 |
| dimension | VARCHAR(20) | NOT NULL | vocabulary/grammar/listening/speaking/reading/writing |
| score | DECIMAL(5,2) | NOT NULL | 0-100 评分 |
| level | VARCHAR(10) | NOT NULL | CEFR 等级 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**约束**：(user_id, language_code, dimension) 唯一，不同语种数据完全隔离。

#### 2.3.5 Learning Profile 表

```sql
-- 用户学习画像表
CREATE TABLE learning_profile (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    overall_level   VARCHAR(10) NOT NULL DEFAULT 'A1',  -- 综合等级
    strengths       JSONB NOT NULL DEFAULT '[]',  -- 优势维度
    weaknesses      JSONB NOT NULL DEFAULT '[]',  -- 薄弱维度
    learning_style  VARCHAR(50),  -- 可空，学习风格
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE INDEX idx_profile_user_id ON learning_profile(user_id);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| overall_level | VARCHAR(10) | NOT NULL | 综合 CEFR 等级 |
| strengths | JSONB | NOT NULL | 优势维度数组 |
| weaknesses | JSONB | NOT NULL | 薄弱维度数组 |
| learning_style | VARCHAR(50) | YES | 学习风格 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

#### 2.3.6 Learning Memory 表

```sql
-- 长期学习记忆表
CREATE TABLE learning_memory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    memory_type     VARCHAR(50) NOT NULL,  -- error_pattern / success_pattern / interest / habit / milestone
    content         JSONB NOT NULL DEFAULT '{}',  -- 记忆内容
    importance      DECIMAL(3,2) NOT NULL DEFAULT 0.50,  -- 重要性 0-1
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_user_id ON learning_memory(user_id);
CREATE INDEX idx_memory_type ON learning_memory(memory_type);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | NOT NULL | FK->User |
| memory_type | VARCHAR(50) | NOT NULL | error_pattern/success_pattern/interest/habit/milestone |
| content | JSONB | NOT NULL | 记忆内容 |
| importance | DECIMAL(3,2) | NOT NULL | 重要性 0-1 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

#### 2.3.7 异步更新机制

```
Learning Event 产生
    -> 异步 Job 入队
    -> 更新 Learning Ability Model（按 language_code + dimension 计算）
    -> 更新 Learning Profile（聚合各维度计算 overall_level）
    -> 长期沉淀 Learning Memory（周期性分析事件模式）
```

**关键规则**：Event 仅做流水，不同语种 Ability Model 完全隔离，异步更新不阻塞请求响应。

---

### 2.4 MVP AI Gateway

#### 2.4.1 ai_prompt_template 表

```sql
-- AI Prompt 模板表
CREATE TABLE ai_prompt_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene           VARCHAR(50) NOT NULL,  -- lesson_generate / explanation / conversation / review
    version         VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    language_code   VARCHAR(10) NOT NULL,  -- 关联语种
    template_content TEXT NOT NULL,  -- Prompt 模板内容
    variables       JSONB NOT NULL DEFAULT '[]',  -- 模板变量定义
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / deprecated / testing
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(scene, version, language_code)
);

CREATE INDEX idx_prompt_scene ON ai_prompt_template(scene);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| scene | VARCHAR(50) | NOT NULL | lesson_generate/explanation/conversation/review |
| version | VARCHAR(20) | NOT NULL | 语义化版本号 |
| language_code | VARCHAR(10) | NOT NULL | 关联语种 |
| template_content | TEXT | NOT NULL | Prompt 模板内容 |
| variables | JSONB | NOT NULL | 模板变量定义 |
| status | VARCHAR(20) | NOT NULL | active/deprecated/testing |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

**场景枚举**：

| 场景值 | 说明 | 来源 |
|--------|------|------|
| lesson_generate | 课程生成 | 旧项目混元 AI 调用点 |
| explanation | 解释/讲解 | 旧项目混元 AI 调用点 |
| conversation | AI 对话 | 旧项目 `/api/ai/chat` |
| review | 复习/回顾 | 旧项目混元 AI 调用点 |

#### 2.4.2 ai_request_log 表

```sql
-- AI 请求日志表（全链路可溯源）
CREATE TABLE ai_request_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID,  -- 可空，匿名请求
    scene               VARCHAR(50) NOT NULL,  -- lesson_generate / explanation / conversation / review
    model               VARCHAR(100) NOT NULL,  -- 使用的模型
    prompt_template_id  UUID,  -- 可空，关联模板
    input_tokens        INTEGER NOT NULL DEFAULT 0,
    output_tokens       INTEGER NOT NULL DEFAULT 0,
    latency_ms          INTEGER NOT NULL DEFAULT 0,  -- 延迟毫秒
    language_context    JSONB,  -- 可空，语言上下文 JSON
    asset_hit           BOOLEAN NOT NULL DEFAULT false,  -- 是否命中资产缓存
    request_type        VARCHAR(20) NOT NULL DEFAULT 'ai_generate',  -- ai_generate / cache_hit / template
    success             BOOLEAN NOT NULL DEFAULT true,
    error_message       TEXT,  -- 可空
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_log_user_id ON ai_request_log(user_id);
CREATE INDEX idx_ai_log_scene ON ai_request_log(scene);
CREATE INDEX idx_ai_log_created_at ON ai_request_log(created_at);
CREATE INDEX idx_ai_log_asset_hit ON ai_request_log(asset_hit);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| user_id | UUID | YES | FK->User，匿名请求可空 |
| scene | VARCHAR(50) | NOT NULL | 场景 |
| model | VARCHAR(100) | NOT NULL | 模型名称 |
| prompt_template_id | UUID | YES | FK->ai_prompt_template |
| input_tokens | INTEGER | NOT NULL | 输入 Token 数 |
| output_tokens | INTEGER | NOT NULL | 输出 Token 数 |
| latency_ms | INTEGER | NOT NULL | 延迟毫秒 |
| language_context | JSONB | YES | 语言上下文 |
| asset_hit | BOOLEAN | NOT NULL | 是否命中资产缓存 |
| request_type | VARCHAR(20) | NOT NULL | ai_generate/cache_hit/template |
| success | BOOLEAN | NOT NULL | 是否成功 |
| error_message | TEXT | YES | 错误信息 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

#### 2.4.3 资产/缓存优先级策略

```
AI 请求进入 AI Gateway
    -> 优先级 1：learning_content 内容资产库精确匹配 (source_language + target_language + scene + difficulty)
    -> 优先级 2：Redis 短期缓存（语义相似度 >= 0.92）
    -> 优先级 3：大模型调用（腾讯混元）
    -> 结果入库：生成内容经校验后写入 learning_content 资产库
    -> 日志记录：每次调用写入 ai_request_log
```

**MVP 阶段暂缓**：
- 多模型路由（V1.0 仅腾讯混元）
- 智能降级决策矩阵
- 复杂阶梯计费
- Cost Simulation Engine（成本预测模拟器）
- Model Competition Engine（模型竞争引擎）

---

### 2.5 learning_content AI 内容资产库

```sql
-- AI 内容资产库表
CREATE TABLE learning_content (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type            VARCHAR(50) NOT NULL,  -- lesson / exercise / quiz / explanation / conversation / flashcard
    source_type             VARCHAR(20) NOT NULL DEFAULT 'AI_GENERATED',  -- AI_GENERATED / MANUAL
    source_language         VARCHAR(10) NOT NULL,  -- 源语言
    target_language         VARCHAR(10) NOT NULL,  -- 目标语言
    explanation_language    VARCHAR(10) NOT NULL,  -- 解释语言
    difficulty_level        VARCHAR(10) NOT NULL DEFAULT 'A1',  -- 难度等级
    content_version         VARCHAR(20) NOT NULL DEFAULT '1.0.0',  -- 内容版本
    status                  VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft / generating / reviewing / approved / published / archived / failed
    quality_score           DECIMAL(3,2) NOT NULL DEFAULT 0.00,  -- 质量评分 0-1
    reuse_count             INTEGER NOT NULL DEFAULT 0,  -- 复用次数
    content_data            JSONB NOT NULL DEFAULT '{}',  -- 内容数据 JSON
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_type ON learning_content(content_type);
CREATE INDEX idx_content_languages ON learning_content(source_language, target_language);
CREATE INDEX idx_content_status ON learning_content(status);
CREATE INDEX idx_content_quality ON learning_content(quality_score DESC);
CREATE INDEX idx_content_reuse ON learning_content(reuse_count DESC);
```

**字段说明**：

| 字段 | 类型 | 可空 | 说明 |
|------|------|------|------|
| id | UUID | NOT NULL | 主键 |
| content_type | VARCHAR(50) | NOT NULL | lesson/exercise/quiz/explanation/conversation/flashcard |
| source_type | VARCHAR(20) | NOT NULL | AI_GENERATED / MANUAL |
| source_language | VARCHAR(10) | NOT NULL | 源语言 |
| target_language | VARCHAR(10) | NOT NULL | 目标语言 |
| explanation_language | VARCHAR(10) | NOT NULL | 解释语言 |
| difficulty_level | VARCHAR(10) | NOT NULL | CEFR 难度 |
| content_version | VARCHAR(20) | NOT NULL | 语义化版本 |
| status | VARCHAR(20) | NOT NULL | 内容状态枚举 |
| quality_score | DECIMAL(3,2) | NOT NULL | 0-1 质量评分 |
| reuse_count | INTEGER | NOT NULL | 复用次数 |
| content_data | JSONB | NOT NULL | 内容数据 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | 更新时间 |

**资产规则**：
- 所有 AI 输出素材必须经过校验入库（status: approved -> published）
- 后续同类请求优先复用（source_language + target_language + content_type + difficulty_level 匹配）
- 高复用资产（reuse_count >= 10）自动晋级为优质资产，优先调度
- 低质量（quality_score < 0.5）且低复用资产自动归档

---

### 2.6 轻量化机构 MVP

#### 2.6.1 基础表（已在 2.1 节定义）

- `organization` 表：机构基础信息
- `organization_member` 表：机构成员关系

#### 2.6.2 task 表（机构任务）

```sql
-- 机构任务表（P1）
CREATE TABLE task (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,  -- 可空
    target_language VARCHAR(10) NOT NULL,  -- 目标语种
    due_date        TIMESTAMP,  -- 可空，截止日期
    status          VARCHAR(20) NOT NULL DEFAULT 'active',  -- active / completed / cancelled
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_org_id ON task(organization_id);
```

#### 2.6.3 task_progress 表（任务进度）

```sql
-- 任务进度表（P1）
CREATE TABLE task_progress (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 0-100
    completed_at        TIMESTAMP,  -- 可空，完成时间
    
    UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX idx_task_progress_user_id ON task_progress(user_id);
```

**P2 后置说明**：班级管理、排课系统、完整教务系统（课程表、考勤、成绩单）全部 P2 后置，MVP 仅保留机构基础表 + 任务/进度。

---

## 第三章：存量数据完整迁移兼容方案（任务三）

### 3.1 用户体系迁移

**旧 User 表处理原则**：
- 全字段保留，不删不改
- 新增字段允许为空（NULL）
- 旧 `role` 字段保留向下兼容

**迁移策略**：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 新增 user_identity 表 | 为每个存量用户创建记录，identity_type='personal' |
| 2 | 新增 workspace 表 | 为每个存量用户创建个人空间，type='personal', is_default=true |
| 3 | 关联 default_workspace_id | 将个人空间ID回写至 user_identity.default_workspace_id |
| 4 | 新增 user_language_preference | 存量用户默认：interface_language='zh-CN', native_language='zh-CN', fallback_language='en' |
| 5 | 新增 user_learning_language | 从旧 LearningProgress.language 字段初始化，level 默认 A1，priority 默认 1 |

**存量用户默认配置**：
```json
{
    "user_identity": {
        "identity_type": "personal",
        "default_workspace_id": "<自动生成个人空间ID>"
    },
    "workspace": {
        "name": "我的学习空间",
        "type": "personal",
        "is_default": true
    },
    "user_language_preference": {
        "interface_language": "zh-CN",
        "native_language": "zh-CN",
        "default_explanation_language": "zh-CN",
        "fallback_language": "en"
    }
}
```

### 3.2 会员订单迁移

**MembershipOrder 表**：100% 保留，不删不改，新旧会员状态无缝衔接。

**存量会员权益映射**：
- 旧 `User.membershipLevel` 字段保留，继续作为向下兼容的权限判断依据
- 新 RBAC 体系通过 Permission Manager 独立管理，不与旧字段冲突

### 3.3 旧学习进度迁移

**迁移路径**：

```
旧 LearningProgress 表
    -> 全量导入 learning_event 表（每条记录转化为 event）
    -> 同步初始化 learning_ability_model（基于 language + level 生成六维初始评分）
    -> 同步初始化 learning_profile（基于 LearningProgress 生成初始画像）
    -> 旧 LearningProgress 表保留不删，新增字段可空
```

**LearningProgress -> Learning Event 映射规则**：

| 旧字段 | 新字段 | 映射逻辑 |
|--------|--------|---------|
| language | language_code | 直接映射 |
| level | data.level | 写入 data JSON |
| totalWords | data.total_words | 写入 data JSON |
| totalLessons | data.total_lessons | 写入 data JSON |
| currentStreak | data.current_streak | 写入 data JSON |
| updatedAt | created_at | 时间戳映射 |

**LearningProgress -> Learning Ability Model 初始化**：
- 按 language_code 创建六维记录（vocabulary, grammar, listening, speaking, reading, writing）
- 初始 score 基于旧 level 估算：A1=10, A2=25, B1=40, B2=55, C1=70, C2=85
- 后续通过 Learning Event 异步更新

### 3.4 迁移约束

| 约束 | 要求 |
|------|------|
| 可灰度执行 | 新增表/字段通过 migration 脚本分批执行，不阻塞线上服务 |
| 完整回滚方案 | 每个 migration 脚本配备对应回滚脚本，可一键回退 |
| 不破坏线上存量业务 | 旧 API 端点全部保留，新旧数据并存，业务代码逐步切换 |
| 事务性保证 | 每批次迁移在一个数据库事务中完成，失败自动回滚 |
| 数据校验 | 迁移前后进行数据行数校验、抽样比对，确保数据完整性 |

### 3.5 迁移步骤

```
Step 1：新增表 + 新增字段
    - 执行 Prisma migration 创建所有新表（user_identity, workspace, organization, organization_member,
      user_language_preference, user_learning_language, learning_goal, learning_plan, learning_event,
      learning_ability_model, learning_profile, learning_memory, ai_prompt_template, ai_request_log,
      learning_content, task, task_progress）
    - 旧表新增可空字段（不影响存量数据）
    - 预计耗时：1 个 migration 文件，< 5 分钟

Step 2：存量数据转换脚本
    - 运行脚本：为每个存量 User 创建 user_identity + workspace + user_language_preference
    - 运行脚本：LearningProgress 全量导入 learning_event + 初始化 ability_model + profile
    - 预计耗时：取决于数据量，预估 < 30 分钟

Step 3：灰度验证
    - 选取 5% 用户流量切换至新 API（带 workspace 上下文的认证流程）
    - 监控错误率、延迟、数据一致性
    - 预计耗时：2-3 天

Step 4：全量切换
    - 所有流量切换至新架构
    - 旧 API 保留但标记为 deprecated
    - 预计耗时：1 天

Step 5：旧字段标记 deprecated
    - User.role 标记 @deprecated
    - LearningProgress 标记 @deprecated（数据保留，不再写入）
    - 预计耗时：1 天
```

---

## 第四章：P0/P1/P2 三级开发任务分级（任务五）

### 4.1 P0 上线必做（30天商业化 MVP）

| 序号 | 任务名称 | 预估工期 | 依赖关系 | 对应旧资产路径 |
|------|---------|---------|---------|---------------|
| P0-1 | 统一 V1 架构（废弃 V2 SQLite） | 2天 | 无 | `server.js` (V2 入口), `src/server/index.js` (V1 入口) |
| P0-2 | 移除硬编码（价格/AI代理/降级内容） | 1天 | P0-1 | `src/services/membershipService.js`, `server.js`, `degradationService.js` |
| P0-3 | User Identity 4张表创建 + migration | 1天 | P0-1 | `prisma/schema.prisma` (存量 User 模型) |
| P0-4 | Context Resolver 实现 | 2天 | P0-3 | `src/server/middleware/auth.js` (扩展) |
| P0-5 | Workspace 默认分配逻辑 + 存量用户迁移脚本 | 2天 | P0-3, P0-4 | `src/services/userService.js` |
| P0-6 | GLOI user_language_preference + user_learning_language 建表 | 1天 | P0-1 | `prisma/schema.prisma` |
| P0-7 | Language Context Resolver 实现 | 2天 | P0-6 | 全新逻辑 |
| P0-8 | 五层学习模型建表（Goal/Plan/Event/Ability/Profile） | 1天 | P0-1 | `prisma/schema.prisma` (LearningProgress 旧表) |
| P0-9 | LearningProgress -> Learning Event 迁移脚本 | 1天 | P0-8 | `src/services/userService.js` (旧学习进度逻辑) |
| P0-10 | Ability Model 初始化 + 异步更新机制 | 3天 | P0-8, P0-9 | 全新逻辑 |
| P0-11 | 旧 6 处 AI 调用点迁移至 AI Gateway | 3天 | P0-1 | `server.js`, `degradationService.js`, `qaInspector.js`, `monitorService.js`, `src/config/index.js` |
| P0-12 | AI Gateway 核心实现（统一入口 + 资产优先 + 日志） | 4天 | P0-11 | 全新逻辑，替代旧分散调用 |
| P0-13 | ai_prompt_template + ai_request_log 建表 | 1天 | P0-1 | 全新表 |
| P0-14 | learning_content 资产库建表 + 入库逻辑 | 2天 | P0-12 | 全新逻辑 |
| P0-15 | 存量用户迁移全量脚本（含灰度验证） | 2天 | P0-5, P0-7, P0-9 | 全部存量表 |
| P0-16 | 集成测试 + 端到端测试 | 3天 | P0-1~P0-15 | `tests/` 目录扩展 |
| P0-17 | 线上灰度部署 + 监控 | 2天 | P0-16 | PM2 xuewaiyu-backend (id 9) |

**P0 总计**：预估 33 人天，并行开发可压缩至 20-25 个自然日。

**P0 依赖关系图**：
```
P0-1 (统一架构)
    |-- P0-2 (移除硬编码)
    |-- P0-3 (User Identity 建表)
    |       |-- P0-4 (Context Resolver)
    |       |-- P0-5 (Workspace 分配 + 迁移)
    |-- P0-6 (GLOI 建表)
    |       |-- P0-7 (Language Context Resolver)
    |-- P0-8 (五层模型建表)
    |       |-- P0-9 (LearningProgress 迁移)
    |               |-- P0-10 (Ability Model 异步更新)
    |-- P0-11 (AI 调用点迁移)
    |       |-- P0-12 (AI Gateway 核心)
    |               |-- P0-14 (learning_content 资产库)
    |-- P0-13 (AI 日志建表)
            |-- P0-12

P0-15 (全量迁移脚本) <- P0-5, P0-7, P0-9
P0-16 (集成测试) <- P0-1~P0-15
P0-17 (灰度部署) <- P0-16
```

### 4.2 P1 上线2周商业增强

| 序号 | 任务名称 | 预估工期 | 依赖关系 | 对应旧资产路径 |
|------|---------|---------|---------|---------------|
| P1-1 | Learning Memory 建表 + 异步沉淀逻辑 | 2天 | P0-8 | 全新逻辑 |
| P1-2 | Language Guard MVP 实现 | 2天 | P0-7, P0-12 | 全新逻辑 |
| P1-3 | Permission Manager RBAC 对接 (organization_member.role) | 3天 | P0-3 | `src/server/middleware/auth.js` |
| P1-4 | 轻量化机构 task + task_progress 建表 + CRUD | 2天 | P0-3 | 全新逻辑 |
| P1-5 | learning_content 复用策略优化（语义匹配） | 2天 | P0-14 | 全新逻辑 |
| P1-6 | AI Gateway 缓存优化（Redis 语义缓存） | 2天 | P0-12 | `src/config/redis.js` |
| P1-7 | 微信 OAuth 真实对接 | 2天 | P0-3 | `src/services/authService.js` (getWechatUserInfo mock) |
| P1-8 | 两套 Logger 统一 | 1天 | P0-1 | `src/utils/logger.js`, `logger.js` |
| P1-9 | 明文验证码日志移除 | 1天 | P0-1 | `src/services/authService.js` (sendSmsCode) |

**P1 总计**：预估 17 人天，P0 上线后 2 周内完成。

### 4.3 P2 远期蓝图（一期不开发）

| 序号 | 任务名称 | 说明 |
|------|---------|------|
| P2-1 | 多模型路由（接入 OpenAI / Claude / DeepSeek 等） | 一期仅腾讯混元 |
| P2-2 | 智能降级决策矩阵（五级降级） | 一期仅资产优先+缓存+模型三层 |
| P2-3 | 复杂阶梯计费系统 | 一期仅基础会员体系 |
| P2-4 | Cost Simulation Engine（成本预测模拟器） | 架构预留 |
| P2-5 | Model Competition Engine（模型竞争引擎） | 架构预留 |
| P2-6 | 完整教务系统（班级/排课/考勤/成绩单） | 一期仅基础机构+任务 |
| P2-7 | Language Asset Marketplace（语言资产市场） | Phase 3 前不落地 |
| P2-8 | GLOI 完整子服务体系（TM/Terminology/Localization/Quality/Intelligence） | 一期仅 Language Context + Guard |
| P2-9 | 多语言 AI Agent 协同 | 架构预留 |
| P2-10 | 全球内容发行与跨境流通 | 架构预留 |
| P2-11 | AI 创作者平台（小说/剧本/游戏/视频脚本） | 架构预留 |
| P2-12 | 数字人多语言语音与表达 | 架构预留 |
| P2-13 | 插件市场 + Agent 市场 + Marketplace | 架构预留 |
| P2-14 | 开发者平台 + API 开放 | 架构预留 |

---

## 附录 A：新增表汇总

| 序号 | 表名 | 所属模块 | 优先级 | 关联旧表 |
|------|------|---------|--------|---------|
| 1 | user_identity | User Identity | P0 | User (user_id FK) |
| 2 | workspace | User Identity | P0 | User (owner_id FK) |
| 3 | organization | User Identity / Organization | P0 | 无 |
| 4 | organization_member | User Identity / Organization | P0 | User (user_id FK) |
| 5 | user_language_preference | GLOI | P0 | User (user_id FK) |
| 6 | user_learning_language | GLOI | P0 | User (user_id FK), LearningProgress (language) |
| 7 | learning_goal | Learning Layer | P0 | User (user_id FK), workspace (workspace_id FK) |
| 8 | learning_plan | Learning Layer | P0 | learning_goal (goal_id FK), User (user_id FK) |
| 9 | learning_event | Learning Layer | P0 | User (user_id FK), workspace (workspace_id FK), LearningProgress (数据源) |
| 10 | learning_ability_model | Learning Layer | P0 | User (user_id FK) |
| 11 | learning_profile | Learning Layer | P0 | User (user_id FK) |
| 12 | learning_memory | Learning Layer | P1 | User (user_id FK) |
| 13 | ai_prompt_template | AI Gateway | P0 | 无 |
| 14 | ai_request_log | AI Gateway | P0 | User (user_id FK, 可空) |
| 15 | learning_content | AI Gateway / Content | P0 | 无 |
| 16 | task | Organization | P1 | organization (organization_id FK), User (creator_id FK) |
| 17 | task_progress | Organization | P1 | task (task_id FK), User (user_id FK) |

**总计新增表**：17 张

---

## 附录 B：存量表保留清单

| 序号 | 表名 | 保留状态 | 新增可空字段 |
|------|------|---------|-------------|
| 1 | User | 全保留 | 无（关联通过新表 user_identity 实现） |
| 2 | Session | 全保留 | 无 |
| 3 | GuestSession | 全保留 | 无 |
| 4 | UserDevice | 全保留 | 无 |
| 5 | LearningProgress | 全保留 | 可新增 language_code 对齐新规范 |
| 6 | MembershipOrder | 全保留 | 无 |
| 7 | DataExportRequest | 全保留 | 无 |
| 8 | AccountDeletionRequest | 全保留 | 无 |
| 9 | SmsVerification | 全保留 | 无 |
| 10 | RateLimitLog | 全保留 | 无 |
| 11 | SystemConfig | 全保留 | 无 |

**总计存量保留表**：11 张（全部保留，不删不改）

---

## 附录 C：架构设计依据

| 依据 | 路径 | 版本 |
|------|------|------|
| AILOS 架构蓝图 | `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md` | v3.2.1 (Architecture Frozen) |
| 旧项目资产勘察 | `E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md` | Phase 0.2 |
| 工作区校验锁定 | `E:\AILOS_Project\evidence\legacy-migration\workspace-verification-report.md` | 2026-07-19 |
| ADR-016 GLOI 原则 | `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md` (ADR-016) | 已采纳 |
| 资产第一原则 | `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md` (原则四) | v3.2.0 |
| 三轨进化原则 | `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md` (原则五) | v3.2.0 |

---

## 附录 D：回执模板

---

### ARCHITECTURE_PREPARATION_COMPLETED

**文档标识**：`E:\AILOS_Project\evidence\architecture\phase1-preparation-report.md`

**声明**：AILOS Phase 1.0 Architecture Preparation 已完成。

**完成内容**：

- [x] 第一章：分层新旧资产完整梳理（可直接复用 10 项资产、待改造 10 项资产、全新待建 6 大核心资产模块）
- [x] 第二章：全量数据库迁移设计（17 张新表完整字段定义 + Context Resolver / Language Resolver / 异步更新机制）
- [x] 第三章：存量数据完整迁移兼容方案（5 步迁移步骤 + 灰度方案 + 回滚方案 + 存量默认配置）
- [x] 第四章：P0/P1/P2 三级开发任务分级（P0 17 项 33 人天 + P1 9 项 17 人天 + P2 14 项远期预留）

**存档状态**：Phase 1 Preparation -- Completed

**下一阶段**：Phase 1.1 Detailed Design（基于本报告开展详细模块设计）

**核心约束确认**：
- [x] 所有新增字段可空，存量表完整保留
- [x] 严格区分 MVP 一期与远期功能
- [x] 所有设计绑定旧项目真实文件路径
- [x] 对齐 AILOS v3.2.1 架构蓝图全部约束

**编制人**：架构师
**批准人**：总工程师
**日期**：2026-07-19

---

*报告结束 -- AILOS Phase 1.0 Architecture Preparation*