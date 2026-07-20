# GLOI 全局语言专项独立设计附件 & 前端国际化评估报告

**文档版本**: v1.0.0  
**定稿日期**: 2026-07-19  
**文档状态**: Architecture Design Attachment · GLOI 专项独立设计  
**关联蓝图**: `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md`（AILOS v3.2.1）  
**关联勘察报告**: `E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md`（Phase 0.2）  
**关联锁定报告**: `E:\AILOS_Project\evidence\legacy-migration\workspace-verification-report.md`（工作区锁定）  
**维护责任**: AILOS 总工程师  

---

## 1. GLOI 概述

### 1.1 定义

**GLOI** = **Global Language Operating Infrastructure**（全局语言底层基础设施）。

GLOI 是 AILOS v3.2.1 架构中定义的一级强制底层基础设施，定位为全平台语言能力的统一底座，与 AI Gateway、Event Bus、Permission Manager 平级，属于 Core Infrastructure 层，不属于任何业务域。

### 1.2 定位

| 维度 | 说明 |
|------|------|
| 架构层级 | Core Infrastructure 层（一级强制底层） |
| 同级模块 | AI Gateway、Event Bus、Permission Manager |
| 管辖范围 | 全平台所有语言相关逻辑、数据、接口、资产 |
| 生效规则 | 立即生效，所有新增模块 DESIGN 阶段必须包含 GLOI 合规审查 |
| 追溯规则 | 现有已冻结模块（Permission / Event Bus / Audit Log）不追溯，后续迭代逐步对齐 |

### 1.3 核心原则

1. **语言是数据层参数，内容是独立资产**：语言代码只是数据表中的一个字段值，内容本身不因语言而改变其资产属性。日语版本的课程和中文版本的课程是同一资产的多个语言版本，不是两个独立资产。

2. **禁止任何业务模块单独读取语言字段做判断**：所有业务逻辑中的语种判定、语言切换、多语言路由，必须通过 GLOI 提供的标准接口完成，不得在业务代码中硬编码 `if (language === 'ja')` 等判断逻辑。

3. **全球内容流通的底层协议**：GLOI 的本质是构建一个全球内容无障碍流通的底层系统，支撑未来学习、小说、剧本、游戏、知识库、Agent 等所有场景的跨语言流通。

4. **语言身份完整性**：语言身份不仅包含语言代码（ISO 639-1），还包含文化语境、受众画像、正式度、书写系统等完整属性，解决「同语言不同文化」的问题。

5. **语言资产全生命周期管理**：翻译记忆、术语库、风格库、文化配置等语言类资产，遵循统一的「创建 -> 生成 -> 审核 -> 质量门禁 -> 发布 -> 复用 -> 版本迭代 -> 归档」生命周期，与资产第一原则对齐。

### 1.4 关联文档

| 文档 | 章节 | 关联内容 |
|------|------|---------|
| `10_ARCHITECTURE_BLUEPRINT.md` | 第 5 卷 5.6 节 | GLOI 完整架构定义：五层语言架构模型、子服务体系、语言资产生命周期、全层级强制红线 |
| `10_ARCHITECTURE_BLUEPRINT.md` | ADR-016 | Global Language Operating Infrastructure Principle：7 条核心原则 + 4 条后果约束 |
| `10_ARCHITECTURE_BLUEPRINT.md` | 第 5 卷 5.6.5 | 全层级强制红线：代码层/数据层/缓存层/Prompt 层/资产权限层 |
| `10_ARCHITECTURE_BLUEPRINT.md` | 附录 E | 28 层架构映射（L2.5-L2.11, L3.1 为 GLOI 子服务） |
| `10_ARCHITECTURE_BLUEPRINT.md` | 附录 B | 术语表：GLOI、Language Identity、Language Intelligence、Content Language Version 等 |
| `legacy-commercial-migration-facts.md` | 全文 | 旧项目应收账款：User 表 30 字段、LearningProgress 表含 language 字段、无语言偏好表 |
| `workspace-verification-report.md` | 第四节 | 唯一开发根目录 `E:\TRAE SOLO`，锁定状态 |

---

## 2. user_language_preference + user_learning_language 完整表结构

### 2.1 设计总则

**存量兼容原则**：以下两张表均为新增表，不修改现有 `User` 表（30 字段）和 `LearningProgress` 表（16 字段）的任何字段。所有新增字段默认可空（`NULL`），存量数据完整保留。

**关联原则**：两张表均通过 `user_id`（UUID）外键关联到 `User.id`，一对一（`user_language_preference`）和一对多（`user_learning_language`）。

**旧项目路径映射**：
- 现有 `User` 表：`E:\TRAE SOLO\prisma\schema.prisma`（第 11-64 行）
- 现有 `LearningProgress` 表：`E:\TRAE SOLO\prisma\schema.prisma`（第 134-162 行），含 `language` 字段（`String`，目标语言）和 `level` 字段（`String`，当前等级 A1-C2）

---

### 2.2 user_language_preference（用户语言偏好表）

**用途**：存储用户与平台交互的语言偏好配置，每个用户仅有一条记录。

**Prisma Schema 定义**：

```prisma
model UserLanguagePreference {
  id                        String   @id @default(uuid())
  userId                    String   @unique
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 界面展示语种：控制前端 UI 文字、按钮、弹窗、系统推送的语言
  interfaceLanguage         String   @default("zh-CN")  // VARCHAR(10), NOT NULL

  // 用户母语：用户最熟悉的语言，用于 AI 讲解的默认基准
  nativeLanguage            String   @default("zh-CN")  // VARCHAR(10), NOT NULL

  // 默认 AI 讲解语种：AI 生成解释、分析、反馈时使用的语言
  defaultExplanationLanguage String  @default("zh-CN")  // VARCHAR(10), NOT NULL

  // 兜底语种：当目标语言无对应翻译/内容时，回退到此语言
  fallbackLanguage          String   @default("en")     // VARCHAR(10), NOT NULL

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([userId])
  @@map("user_language_preference")
}
```

**字段详细说明**：

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | UUID | PK, NOT NULL | `uuid()` | 主键 |
| `userId` | UUID | FK->User.id, UNIQUE, NOT NULL | - | 关联用户，一对一 |
| `interfaceLanguage` | VARCHAR(10) | NOT NULL | `'zh-CN'` | 界面展示语种，控制前端 UI 文字、按钮、弹窗、系统推送 |
| `nativeLanguage` | VARCHAR(10) | NOT NULL | `'zh-CN'` | 用户母语，AI 讲解的默认基准语种 |
| `defaultExplanationLanguage` | VARCHAR(10) | NOT NULL | `'zh-CN'` | 默认 AI 讲解语种，AI 生成解释/分析/反馈时使用的语言 |
| `fallbackLanguage` | VARCHAR(10) | NOT NULL | `'en'` | 兜底语种，无对应翻译时回退，通常为英文 |
| `createdAt` | DateTime | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | DateTime | NOT NULL | `updatedAt` | 更新时间 |

**语言代码取值规范**：
- 使用 BCP 47 语言标签格式（如 `zh-CN`、`en-US`、`ja-JP`）
- `interfaceLanguage` 和 `defaultExplanationLanguage` 可独立设置，互不干扰
- `fallbackLanguage` 建议设置为 `en`（英文），作为全球通用兜底语种

**MVP 阶段数据初始化策略**：
- 新用户注册时，默认创建一条记录，所有字段取默认值
- 用户可在设置页面修改语言偏好
- 用户未设置时，`interfaceLanguage` 从客户端 `Accept-Language` 请求头推断

---

### 2.3 user_learning_language（用户学习语言表）

**用途**：存储用户正在学习的目标语言及其等级，支持多语言并行学习，每个用户可以有多条记录。

**Prisma Schema 定义**：

```prisma
model UserLearningLanguage {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 学习目标语言代码，如 ja, en, ko, de, es, fr
  languageCode  String                        // VARCHAR(10), NOT NULL

  // 当前等级，如 N2, B2, A1, beginner
  level         String                        // VARCHAR(20), NOT NULL

  // 排序权重，数字越小优先级越高
  priority      Int      @default(0)          // INTEGER, DEFAULT 0

  // 学习状态：active（活跃学习中）/ inactive（暂停）/ completed（已结业）
  status        String   @default("active")   // VARCHAR(20), DEFAULT 'active'

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, languageCode])
  @@index([userId])
  @@index([languageCode])
  @@index([status])
  @@map("user_learning_language")
}
```

**字段详细说明**：

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | UUID | PK, NOT NULL | `uuid()` | 主键 |
| `userId` | UUID | FK->User.id, NOT NULL | - | 关联用户 |
| `languageCode` | VARCHAR(10) | NOT NULL | - | 学习目标语言代码（如 `ja`、`en`、`ko`、`de`、`es`、`fr`） |
| `level` | VARCHAR(20) | NOT NULL | - | 当前等级（如 `N2`、`B2`、`A1`、`beginner`） |
| `priority` | INTEGER | NOT NULL | `0` | 排序权重，数字越小优先级越高，用于多语言并行的主次排序 |
| `status` | VARCHAR(20) | NOT NULL | `'active'` | 学习状态：`active`（活跃学习中）、`inactive`（暂停）、`completed`（已结业） |
| `createdAt` | DateTime | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | DateTime | NOT NULL | `updatedAt` | 更新时间 |

**约束说明**：
- `@@unique([userId, languageCode])`：同一用户不能重复添加同一语言
- `status` 取值：`active`、`inactive`、`completed`
- `priority` 用于多语言并行场景下的主次排序，与前端展示顺序和 AI 调度优先级相关

**与现有 LearningProgress 表的关系**：
- 现有 `LearningProgress` 表（`E:\TRAE SOLO\prisma\schema.prisma` 第 134-162 行）的 `language` 字段记录了目标语言，`level` 字段记录了当前等级
- `user_learning_language` 表是学习语言配置的**主数据源**，`LearningProgress` 表是学习进度的**运行时状态**
- 两者通过 `(userId, languageCode)` 实现逻辑关联，但不设数据库级外键约束（两个表可能在不同阶段独立演进）

---

### 2.4 示例数据

以下展示同一用户（`user_id = 'a1b2c3d4-...'`）并行学习三门语言的数据。

#### user_language_preference

| id | user_id | interface_language | native_language | default_explanation_language | fallback_language | created_at | updated_at |
|----|---------|-------------------|-----------------|------------------------------|-------------------|------------|------------|
| `p1-uuid` | `a1b2c3d4-...` | `zh-CN` | `zh-CN` | `zh-CN` | `en` | 2026-07-19T00:00:00Z | 2026-07-19T00:00:00Z |

#### user_learning_language

| id | user_id | language_code | level | priority | status | created_at | updated_at |
|----|---------|---------------|-------|----------|--------|------------|------------|
| `l1-uuid` | `a1b2c3d4-...` | `ja` | `N2` | 1 | `active` | 2026-07-19T00:00:00Z | 2026-07-19T00:00:00Z |
| `l2-uuid` | `a1b2c3d4-...` | `en` | `B2` | 2 | `active` | 2026-07-19T00:00:00Z | 2026-07-19T00:00:00Z |
| `l3-uuid` | `a1b2c3d4-...` | `ko` | `beginner` | 3 | `active` | 2026-07-19T00:00:00Z | 2026-07-19T00:00:00Z |

**场景解读**：
- 该用户母语为中文，界面使用中文，AI 讲解默认用中文
- 日语 N2 是第一优先级（priority=1），为主要学习目标
- 英语 B2 是第二优先级（priority=2），为次要学习目标
- 韩语入门是第三优先级（priority=3），为兴趣探索
- 当 AI 讲解一门语言中的语法点时，`default_explanation_language = zh-CN` 确保 AI 用中文解释（而非用目标语言本身解释，避免初学者理解困难）

---

## 3. Global Language Context Layer 四层消费调度逻辑

### 3.1 架构图（文字描述）

```
                          +---------------------------------+
                          |   Global Language Context Layer  |
                          |   （全局唯一语言调度中枢）         |
                          |                                  |
                          |   输入：user_language_preference  |
                          |        + user_learning_language   |
                          |   输出：统一的 Language Context   |
                          +---------------+------------------+
                                          |
           +------------------------------+------------------------------+
           |                              |                              |
           v                              v                              v
 +-------------------+        +-------------------+        +-------------------+
 |  Branch 1          |        |  Branch 2          |        |  Branch 3          |
 |  Frontend          |        |  AI Gateway        |        |  Content System    |
 |  前端消费           |        |  AI 消费            |        |  内容消费           |
 +-------------------+        +-------------------+        +-------------------+
           |
           v
 +-------------------+
 |  Branch 4          |
 |  Notification      |
 |  推送/邮件消费      |
 +-------------------+
```

**设计原则**：
- 全局唯一调度中枢：所有消费分支统一从 Global Language Context Layer 获取语言上下文，不允许各自独立读取数据库
- 上下文注入：Language Context 以结构化对象形式注入各消费分支，而非原始字段值
- 禁止直读：禁止任何消费分支直接读取 `user_language_preference` 或 `user_learning_language` 表

---

### 3.2 消费分支详细设计

#### 分支 1：Frontend（前端消费）

**消费目标**：控制界面文字、按钮、弹窗、系统推送的多语言展示。

**接入方式**：API 响应头注入。

```
请求流程：
  前端请求 -> API Gateway 中间件 -> 读取 user_language_preference.interface_language
    -> 注入响应头 X-Content-Language: ja
    -> 前端从 API 响应头读取语言上下文
    -> 前端 i18n 框架按语言代码动态切换 UI
```

**技术实现规范**：

| 环节 | 实现方式 | 说明 |
|------|---------|------|
| 语言上下文获取 | API 响应头 `X-Content-Language` | 每个 API 响应携带当前用户的语言偏好 |
| 前端初始化 | 登录后首次 API 响应获取语言 | 读取 `X-Content-Language` 设置 i18n 实例 |
| 语言切换 | 用户手动切换后调用 `PUT /api/user/language-preference` | 更新数据库后，后续 API 响应头自动切换 |
| 兜底策略 | 浏览器 `navigator.language` | API 未返回时使用浏览器语言兜底 |

**现有代码基础（旧项目路径）**：
- API 路由入口：`E:\TRAE SOLO\src\server\routes\index.js`（第 27 个端点）
- 认证中间件：`E:\TRAE SOLO\src\server\middleware\auth.js`
- 尚未实现语言偏好相关端点，需在 Phase 1 新增

#### 分支 2：AI Gateway（AI 消费）

**消费目标**：约束 Prompt 输入输出语种，拦截跨语言混乱，确保 AI 生成内容语言符合用户期望。

**接入方式**：Language Context Resolver 在 Gateway 层注入语言约束到 System Prompt。

```
请求流程：
  业务模块发起 AI 请求 -> AI Gateway 接收
    -> Language Resolver（GLOI 内）读取：
        - user_language_preference.default_explanation_language（讲解语种）
        - user_learning_language[priority=1].language_code（当前主要学习语种）
        - user_language_preference.native_language（用户母语）
    -> Context Builder 组装完整语言上下文
    -> Prompt Composer 将语言约束注入 System Prompt
    -> 发送给 Model
```

**System Prompt 注入示例**（日语 N2 用户场景）：

```
[System]
You are an AI language tutor. The user is a native Chinese speaker learning Japanese at N2 level.
- The user's question may be in Chinese or Japanese; respond in both languages when appropriate.
- All explanations and grammar analysis MUST be in Chinese (zh-CN).
- All example sentences MUST be in Japanese with Chinese translations.
- DO NOT output explanations in English or Japanese unless explicitly requested.
- If the user asks in Japanese, acknowledge the question in Japanese but provide the explanation in Chinese.
```

**Language Context Resolver 输入输出契约**：

```typescript
// 输入：从 GLOI 层获取的原始偏好
interface LanguageResolverInput {
  interfaceLanguage: string;            // 来自 user_language_preference
  nativeLanguage: string;
  defaultExplanationLanguage: string;
  fallbackLanguage: string;
  learningLanguages: {                  // 来自 user_learning_language
    languageCode: string;
    level: string;
    priority: number;
  }[];
}

// 输出：注入 AI Gateway 的结构化语言上下文
interface AIGlobalLanguageContext {
  input_identity: LanguageIdentityContext;       // 输入语言身份
  output_identity: LanguageIdentityContext;       // 输出语言身份
  explanation_identity: LanguageIdentityContext;  // 讲解语言身份
  intent: 'conversation' | 'translation' | 'creation' | 'education';
  domain: string;
  primary_learning_language?: string;             // 主要学习语种
  primary_learning_level?: string;                // 主要学习等级
}
```

**现有代码基础（旧项目路径）**：
- AI 代理配置：`E:\TRAE SOLO\server.js`（第 42 行 `/api/ai` 路由挂载）
- 混元模型配置：`E:\TRAE SOLO\src\config\index.js`（第 30-36 行）
- 降级服务：`E:\TRAE SOLO\degradationService.js`
- 当前无 Language Resolver 实现，需在 Phase 1 新增

#### 分支 3：Content System（内容消费）

**消费目标**：统一素材、习题、讲解的语种标识，确保内容按语种索引和过滤。

**接入方式**：`learning_content` 表强制绑定语言三字段。

```
数据模型强制约束：
  learning_content 表字段：
    source_language  VARCHAR(10) NOT NULL  -- 素材源语言（如教材原文语言）
    target_language  VARCHAR(10) NOT NULL  -- 目标学习语言（如用户正在学的语言）
    explanation_language VARCHAR(10) NOT NULL -- 讲解/注释使用的语言

  查询规则：
    SELECT * FROM learning_content
    WHERE target_language = :user_learning_language
      AND explanation_language = :user_explanation_language
    ORDER BY difficulty_level;

  禁止行为：
    X 禁止跨语种混排（如日语学习列表中出现韩语内容）
    X 禁止 source_language / target_language / explanation_language 使用默认值
    X 禁止在业务代码中硬编码语言过滤条件
```

**与现有学习进度表的关系**：
- 现有 `LearningProgress` 表（`E:\TRAE SOLO\prisma\schema.prisma` 第 134-162 行）的 `language` 字段即 `target_language` 的概念雏形
- Phase 1 需将 `LearningProgress.language` 与 `user_learning_language.language_code` 建立逻辑关联
- 未来 `learning_content` 表的 `target_language` 字段应与 `LearningProgress.language` 保持一致

#### 分支 4：Notification（推送/邮件消费）

**消费目标**：多语言通知文案，按用户 `interface_language` 自动匹配。

**接入方式**：Notification 模板绑定 `language_code`，发送时按用户偏好匹配。

```
数据模型：
  notification_template 表：
    id              UUID PK
    template_key    VARCHAR(50) NOT NULL   -- 模板标识（如 learning_reminder）
    language_code   VARCHAR(10) NOT NULL   -- 语言代码
    title           VARCHAR(200) NOT NULL  -- 通知标题
    body            TEXT NOT NULL          -- 通知正文
    UNIQUE(template_key, language_code)

发送流程：
  1. 业务触发通知事件（如每日学习提醒）
  2. Notification Service 读取 user_language_preference.interface_language
  3. 查询 notification_template WHERE template_key = ? AND language_code = ?
  4. 未匹配到对应语言模板时，fallback 到 fallback_language
  5. 渲染并发送
```

**现有代码基础（旧项目路径）**：
- 当前无通知模板表，无推送服务，需在 Phase 1 从零建设

---

### 3.3 强制规则

| 编号 | 规则 | 强制等级 | 说明 |
|------|------|---------|------|
| GCL-01 | 所有业务逻辑语种判定必须经过 Global Language Context Layer 解析输出 | 必须 | 禁止业务模块直接读取 `user_language_preference` 或 `user_learning_language` 表 |
| GCL-02 | 禁止硬编码 language 判断逻辑 | 必须 | 错误示例：`if (language === 'ja') { ... }`；正确做法：通过 Language Context 对象统一获取语言配置 |
| GCL-03 | 禁止任何模块单独读取语言字段做判断 | 必须 | 语言字段的读取和解析统一由 GLOI 层完成，业务模块仅消费解析后的结构化上下文 |
| GCL-04 | 四条消费分支必须通过统一接口获取语言上下文 | 必须 | 前端、AI Gateway、Content System、Notification 四者的语言上下文来源一致 |
| GCL-05 | 语言上下文变更必须实时同步至所有消费分支 | 必须 | 用户修改语言偏好后，所有分支的下一次请求必须使用新上下文 |

---

## 4. Language Guard 校验规则

### 4.1 输入校验

**目标**：检测用户输入语言是否与当前学习目标语种匹配。

**校验逻辑**：

```
输入校验流程：
  User Input 进入 AI Gateway
    -> Language Guard 检测输入语言代码
    -> 与 user_learning_language[priority=1].language_code 比对
    -> 匹配：正常通行
    -> 不匹配：标记但不拒绝，记录 language_violation_count
```

**处理规则**：

| 场景 | 判定 | 处理方式 |
|------|------|---------|
| 日语学习者输入日语提问 | 通过 | 正常处理 |
| 日语学习者输入中文提问 | 标记 | 不拒绝，记录 `language_violation_count +1`，在 AI 响应中增加「请尽量用日语提问以提升练习效果」提示 |
| 日语学习者输入韩语提问 | 标记 | 不拒绝，记录 `language_violation_count +1`，提示语言不匹配 |
| 日语学习者输入混合语言 | 标记 | 不拒绝，记录 `language_violation_count +1` |

**MVP 阶段策略**：
- 仅标记不阻断：所有输入语种不匹配的情况仅记录计数，不拒绝用户请求
- 提示友好：在 AI 响应末尾附加语言使用建议，不强制切换
- 二期加入：连续 N 次违规后自动提示切换语言模式

### 4.2 输出校验

**目标**：拦截与预设讲解语种冲突的 AI 输出文本。

**校验逻辑**：

```
输出校验流程：
  AI Model 返回响应
    -> Language Guard 检测输出语言代码
    -> 与 user_language_preference.default_explanation_language 比对
    -> 匹配：正常输出
    -> 不匹配：拦截并重试
```

**处理规则**：

| 场景 | 判定 | 处理方式 |
|------|------|---------|
| 用户 `explanation_language=zh-CN`，AI 返回中文 | 通过 | 正常输出 |
| 用户 `explanation_language=zh-CN`，AI 返回日语 | 拦截 | 拦截该响应，自动重试（最多 3 次），重试时强化 System Prompt 中的语言约束 |
| 用户 `explanation_language=zh-CN`，AI 返回英文 | 拦截 | 同上，拦截并重试 |
| 3 次重试后仍不匹配 | 降级 | 返回响应，前端标注「语言检测未通过」，记录 `language_violation_count` |

**重试策略**：

```
重试流程：
  第 1 次拦截：强化 System Prompt 语言约束，重新请求
  第 2 次拦截：进一步强化约束 + 增加显式语言指令，重新请求
  第 3 次拦截：最后一次尝试，使用最严格的语言约束
  3 次后仍失败：降级输出，前端标注「语言检测未通过」
```

**成本责任判定**（与 ADR-016 和 AI 责任仲裁对齐）：
- 输出语言不匹配属于**平台责任**（AI 未遵守语言约束），重试成本由平台承担，不扣用户额度

### 4.3 违规记录

**数据结构**：写入 `ai_request_log` 表的 `language_context` 字段（JSON 格式）。

```json
{
  "language_context": {
    "expected_input_language": "ja",
    "detected_input_language": "zh-CN",
    "expected_output_language": "zh-CN",
    "detected_output_language": "ja",
    "language_violation_count": 3,
    "violations": [
      {
        "timestamp": "2026-07-19T10:30:00Z",
        "type": "input_mismatch",
        "expected": "ja",
        "detected": "zh-CN",
        "action": "flagged"
      },
      {
        "timestamp": "2026-07-19T10:35:00Z",
        "type": "output_mismatch",
        "expected": "zh-CN",
        "detected": "ja",
        "action": "retried",
        "retry_count": 2
      }
    ]
  }
}
```

**计数规则**：
- `language_violation_count`：累计违规次数，按照 `(user_id, month)` 维度统计
- 每个自然月重置计数
- 输入违规和输出违规合并计数

**MVP 阶段策略**：
- 仅记录不阻断：所有违规仅写入日志，不触发任何业务阻断
- 数据用途：用于分析 AI 语言输出质量，为二期自动纠正提供数据基础
- 二期加入：当 `language_violation_count` 超过阈值时，自动触发 Language Context 强化策略

---

## 5. 全库语种绑定规范

### 5.1 learning_content 表语种字段

**定位**：`learning_content` 是 AILOS 学习内容的核心存储表，承载所有课程、素材、习题、讲解内容。

**强制语种字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `source_language` | VARCHAR(10) | NOT NULL，无默认值 | 素材源语言（如教材原文语言、视频原声语言）。必须显式指定，禁止默认值。 |
| `target_language` | VARCHAR(10) | NOT NULL，无默认值 | 目标学习语言（如用户正在学习的语言，日语教材的 target_language 为 `ja`）。必须显式指定，禁止默认值。 |
| `explanation_language` | VARCHAR(10) | NOT NULL，无默认值 | 讲解/注释语言（如用中文解释日语语法点，则为 `zh-CN`）。必须显式指定，禁止默认值。 |

**强制约束**：
- 三者必须显式指定，**禁止使用任何默认值**（包括数据库 `DEFAULT` 和代码层默认值）
- 插入数据时必须校验三个字段均非空，否则拒绝写入
- 查询时必须包含至少一个语言过滤条件，禁止全语种混查

**示例数据**：

| content_id | source_language | target_language | explanation_language | 说明 |
|------------|-----------------|-----------------|----------------------|------|
| `c-001` | `ja` | `ja` | `zh-CN` | 日语教材内容，用中文讲解 |
| `c-002` | `en` | `en` | `zh-CN` | 英语教材内容，用中文讲解 |
| `c-003` | `ja` | `ja` | `en` | 日语教材内容，用英文讲解（面向英语母语者） |

**存量数据兼容**：`learning_content` 表在现有 Prisma Schema 中**不存在**（旧项目勘察报告确认「Content System 未发现相关实现」），因此无需迁移存量数据，从零按规范建设。

**旧项目痕迹**：`E:\TRAE SOLO\prisma\schema.prisma` 中无 `learning_content` 表定义，Phase 1 需从零创建。

---

### 5.2 learning_ability_model 语种隔离

**定位**：用户学习能力模型，存储词汇量、语法掌握度、听力水平等能力评估数据。

**强制语种隔离规则**：

| 规则 | 说明 |
|------|------|
| 强制绑定 `language_code` | 每条能力记录必须绑定一个语言代码 |
| 不同语种数据完全隔离 | 日语词汇能力与英语词汇能力独立存储、独立计算、独立评估 |
| 不合并评分 | 禁止跨语种合并能力评分（如将日语词汇量和英语词汇量求和） |
| 不跨语种推断 | 禁止用日语语法能力推断英语语法能力 |

**表结构设计**：

```prisma
model LearningAbilityModel {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  languageCode    String                        // VARCHAR(10), NOT NULL -- 强制绑定
  vocabularySize  Int      @default(0)          // 词汇量
  grammarLevel    String?                       // 语法等级
  listeningLevel  String?                       // 听力等级
  readingLevel    String?                       // 阅读等级
  speakingLevel   String?                       // 口语等级
  overallScore    Float?                        // 综合评分

  assessedAt      DateTime @default(now())      // 最近评估时间
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, languageCode])
  @@index([userId])
  @@index([languageCode])
  @@map("learning_ability_model")
}
```

**与现有 LearningProgress 的关系**：
- 现有 `LearningProgress` 表（`E:\TRAE SOLO\prisma\schema.prisma` 第 134-162 行）已按 `@@unique([userId, language])` 隔离，这是正确的语种隔离设计
- `learning_ability_model` 表是能力评估的**结构化存储**，`LearningProgress` 表是学习进度的**运行时快照**
- 两者通过 `(userId, languageCode)` 实现逻辑关联

---

### 5.3 其他表语种约束

| 表名 | 绑定字段 | 约束说明 |
|------|---------|---------|
| `ai_prompt_template` | `language_code` VARCHAR(10) NOT NULL | 每个 Prompt 模板绑定目标语言，AI Gateway 按用户学习语言匹配模板 |
| `learning_goal` | `target_language` VARCHAR(10) NOT NULL | 每个学习目标必须绑定目标语言，禁止跨语言的学习目标 |
| `notification_template` | `language_code` VARCHAR(10) NOT NULL | 每个通知/邮件模板绑定语言代码，发送时按用户 `interface_language` 匹配 |
| `membership_plan` | `available_languages` JSON | 会员计划可指定支持的语言列表（如某课程仅支持日语和英语），`NULL` 表示全语言支持 |
| `system_config` | `language_code` VARCHAR(10) NULLABLE | 系统配置项可按语言维度隔离（如不同语言的默认欢迎语），`NULL` 表示全局配置 |

**SQL 强制约束示例**：

```sql
-- 所有语言字段必须使用标准语言代码约束
ALTER TABLE learning_content
  ADD CONSTRAINT chk_source_language CHECK (source_language ~ '^[a-z]{2}(-[A-Z]{2})?$');

ALTER TABLE learning_content
  ADD CONSTRAINT chk_target_language CHECK (target_language ~ '^[a-z]{2}(-[A-Z]{2})?$');

ALTER TABLE learning_content
  ADD CONSTRAINT chk_explanation_language CHECK (explanation_language ~ '^[a-z]{2}(-[A-Z]{2})?$');

-- 禁止三个字段中有任何一个为 NULL
ALTER TABLE learning_content
  ADD CONSTRAINT chk_language_not_null
  CHECK (source_language IS NOT NULL
     AND target_language IS NOT NULL
     AND explanation_language IS NOT NULL);
```

---

## 6. 前端国际化资产评估清单

### 6.1 排查结果

**排查范围**：对 `E:\TRAE SOLO`（唯一开发根目录，工作区锁定）进行全面国际化资产排查。

#### 排查路径 1：`E:\TRAE SOLO\locales\`

| 项目 | 详情 |
|------|------|
| 文件数量 | 55 个 `.pak` 文件 |
| 文件列表 | `af.pak`, `am.pak`, `ar.pak`, `bg.pak`, `bn.pak`, `ca.pak`, `cs.pak`, `da.pak`, `de.pak`, `el.pak`, `en-GB.pak`, `en-US.pak`, `es-419.pak`, `es.pak`, `et.pak`, `fa.pak`, `fi.pak`, `fil.pak`, `fr.pak`, `gu.pak`, `he.pak`, `hi.pak`, `hr.pak`, `hu.pak`, `id.pak`, `it.pak`, `ja.pak`, `kn.pak`, `ko.pak`, `lt.pak`, `lv.pak`, `ml.pak`, `mr.pak`, `ms.pak`, `nb.pak`, `nl.pak`, `pl.pak`, `pt-BR.pak`, `pt-PT.pak`, `ro.pak`, `ru.pak`, `sk.pak`, `sl.pak`, `sr.pak`, `sv.pak`, `sw.pak`, `ta.pak`, `te.pak`, `th.pak`, `tr.pak`, `uk.pak`, `ur.pak`, `vi.pak`, `zh-CN.pak`, `zh-TW.pak` |
| 判定 | **不是项目国际化文件** |
| 判定依据 | `.pak` 是 Electron/Chromium 运行时自带的 UI 语言包格式，属于 Chromium 框架的 locale 资源文件，不是应用层 i18n 翻译文件。这些文件存在于任何 Electron 应用的安装目录中，与项目业务逻辑无关。 |

#### 排查路径 2：`E:\TRAE SOLO\aha_doctor\resources\lang\`

| 项目 | 详情 |
|------|------|
| 文件数量 | 3 个 `.gdstrings.ini` 文件 |
| 目录结构 | `en_US/gdstrings.ini`, `ja_JP/gdstrings.ini`, `zh_CN/gdstrings.ini` |
| 判定 | **不是项目国际化文件** |
| 判定依据 | `.gdstrings.ini` 是 GODOT 游戏引擎的字符串翻译文件格式。`aha_doctor` 目录推测为 GODOT 引擎的某个工具或插件，其多语言文件是 GODOT 引擎自身的本地化机制，不是 Express 后端项目的 i18n 文件。 |

#### 排查路径 3：项目源代码

| 排查项 | 结果 |
|--------|------|
| i18n 框架 | 未发现。`package.json` 中无 `i18next`、`react-i18next`、`vue-i18n`、`formatjs` 等任何 i18n 依赖 |
| 多语言切换逻辑 | 未发现。源代码中无语言切换、locale 设置、语言检测相关代码 |
| 语言状态管理 | 未发现。无 Redux/Vuex/Context 中的语言状态 |
| 翻译文件 | 未发现。无 JSON/YAML/PO 等格式的翻译文件 |
| 前端代码 | 不存在。该项目是纯后端 API 项目（Express + Prisma），前端代码不在当前仓库中 |

#### 综合结论

**该项目无前端国际化框架，需从零建设。**

| 结论项 | 详情 |
|--------|------|
| 项目类型 | 纯后端 API 项目（Express + Prisma + PostgreSQL + Redis） |
| 前端代码位置 | 不在当前仓库中（`E:\TRAE SOLO` 仅含后端代码） |
| i18n 框架 | 无 |
| 多语言切换逻辑 | 无 |
| 翻译文件 | 无 |
| 语言状态管理 | 无 |
| 前端国际化建设起点 | 从零开始 |

**旧项目代码路径确认**：
- 项目根目录：`E:\TRAE SOLO`
- 后端入口：`E:\TRAE SOLO\src\server\index.js`（V1）和 `E:\TRAE SOLO\server.js`（V2）
- 路由定义：`E:\TRAE SOLO\src\server\routes\index.js`
- 无前端目录（如 `client/`、`web/`、`frontend/`、`app/` 等均不存在）

---

### 6.2 Phase 1 预留改造点位

鉴于前端代码不在当前仓库中，以下为前端项目启动时必须从零建设的国际化改造点位：

| 编号 | 改造点位 | 说明 | 优先级 |
|------|---------|------|--------|
| FE-01 | i18n 框架搭建 | 前端项目启动时需从零建设 i18n 框架（推荐 react-i18next 或 vue-i18n，取决于前端技术选型） | P0 |
| FE-02 | 语言上下文获取 | 从 API 响应头 `X-Content-Language` 获取语言上下文，作为前端 i18n 的语言切换依据 | P0 |
| FE-03 | 语言切换 UI 组件 | 建设语言选择器组件（下拉菜单/底部弹窗），支持用户手动切换界面语言 | P0 |
| FE-04 | 翻译文件管理 | 建设翻译文件目录结构（JSON/YAML 格式，按语种分目录，按模块分子文件） | P0 |
| FE-05 | 语言偏好持久化 | 用户切换语言后调用 `PUT /api/user/language-preference` 更新后端偏好，确保跨设备同步 | P0 |
| FE-06 | 登录页翻译 | 登录/注册页面为首次接触点，需优先完成多语言翻译 | P0 |
| FE-07 | 新手引导翻译 | 新手引导流程的多语言翻译，支持日语/英语/韩语等目标用户语言 | P1 |
| FE-08 | 学习页翻译 | 学习主页面（课程列表、学习进度、AI 对话）的多语言翻译 | P1 |
| FE-09 | 支付页翻译 | 会员购买/支付页面的多语言翻译 | P1 |
| FE-10 | 兜底语言策略 | 浏览器 `navigator.language` 作为 API 响应头未返回时的兜底语言检测 | P1 |

---

### 6.3 推荐前端 i18n 技术方案

#### 技术选型

| 维度 | 推荐方案 | 备选方案 | 说明 |
|------|---------|---------|------|
| 框架 | `react-i18next` | `vue-i18n`（Vue 技术栈） | 取决于前端框架选型。React Native 兼容性：`react-i18next` 完全支持 |
| 语言检测 | API 响应头优先 | `navigator.language` 兜底 | 优先从后端获取语言偏好，保证跨设备一致性 |
| 翻译文件格式 | JSON | YAML | JSON 是前端项目通用格式，无需额外解析器 |
| 动态加载 | 按需加载语言包 | - | 减小首屏加载体积，仅加载当前语言和 fallback 语言 |
| 命名空间 | 按模块分目录 | - | 登录/学习/支付/通用 各自独立文件，便于维护 |

#### 翻译文件目录结构建议

```
frontend/
  src/
    locales/
      zh-CN/
        common.json         # 通用：按钮、提示、错误信息
        auth.json           # 登录/注册
        onboarding.json     # 新手引导
        learning.json       # 学习主页
        payment.json        # 支付/会员
      en/
        common.json
        auth.json
        onboarding.json
        learning.json
        payment.json
      ja/
        common.json
        auth.json
        onboarding.json
        learning.json
        payment.json
      ko/
        ...
```

#### i18n 初始化流程

```
前端启动
  -> 读取 localStorage 中缓存的 language 设置（如有）
  -> 发起首次 API 请求（如 GET /api/user/me）
  -> 从响应头 X-Content-Language 获取语言代码
  -> 与 localStorage 缓存比对
    -> 一致：直接使用缓存的语言包
    -> 不一致：更新 localStorage，动态加载新语言包
  -> 初始化 i18n 实例
  -> 渲染 UI
```

#### 语言切换流程

```
用户点击语言选择器
  -> 前端立即切换 i18n 语言（乐观更新，提升体验）
  -> 异步调用 PUT /api/user/language-preference
    { "interfaceLanguage": "ja" }
  -> 后端更新 user_language_preference 表
  -> 后续 API 请求的响应头自动携带 X-Content-Language: ja
  -> 如果 API 调用失败，回滚到原语言
```

---

## 附录 A：旧项目代码路径速查

| 项目 | 路径 |
|------|------|
| 项目根目录 | `E:\TRAE SOLO` |
| Prisma Schema | `E:\TRAE SOLO\prisma\schema.prisma` |
| V1 后端入口 | `E:\TRAE SOLO\src\server\index.js` |
| V2 后端入口 | `E:\TRAE SOLO\server.js` |
| 路由汇总 | `E:\TRAE SOLO\src\server\routes\index.js` |
| 认证中间件 | `E:\TRAE SOLO\src\server\middleware\auth.js` |
| 用户服务 | `E:\TRAE SOLO\src\services\userService.js` |
| AI 配置 | `E:\TRAE SOLO\src\config\index.js` |
| 降级服务 | `E:\TRAE SOLO\degradationService.js` |
| 监控服务 | `E:\TRAE SOLO\monitorService.js` |
| QA 巡检 | `E:\TRAE SOLO\qaInspector.js` |
| 勘误报告 | `E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md` |
| 工作区锁定 | `E:\AILOS_Project\evidence\legacy-migration\workspace-verification-report.md` |
| 架构蓝图 | `E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md` |

---

## 附录 B：MVP 一期 vs 远期功能分界

| 功能 | Phase | 状态 |
|------|-------|------|
| `user_language_preference` 表 | Phase 1 | 需创建 |
| `user_learning_language` 表 | Phase 1 | 需创建 |
| API 响应头 `X-Content-Language` 注入 | Phase 1 | 需实现 |
| Language Context Resolver（AI Gateway 内） | Phase 1 | 需实现 |
| `learning_content` 表三语种字段 | Phase 1 | 需创建 |
| `learning_ability_model` 表 | Phase 1 | 需创建 |
| `notification_template` 表 | Phase 1 | 需创建 |
| Language Guard 输入校验（标记不阻断） | Phase 1 | 需实现 |
| Language Guard 输出校验（拦截重试） | Phase 1 | 需实现 |
| `ai_request_log.language_context` 字段 | Phase 1 | 需新增 |
| Language Guard 自动纠正 | Phase 2 | 远期 |
| 前端 i18n 框架搭建 | Phase 1（前端项目启动时） | 需从零建设 |
| 前端语言切换 UI 组件 | Phase 1（前端项目启动时） | 需从零建设 |
| Translation Memory Service | Phase 2 | 远期 |
| Terminology Service | Phase 2 | 远期 |
| Localization Service | Phase 2 | 远期 |
| Quality Evaluation Service | Phase 2 | 远期 |
| Language Intelligence Service | Phase 2 | 远期 |
| Language Asset Marketplace | Phase 3 | 远期 |
| GLOI 子服务完整落地 | Phase 2-3 | 远期 |

---

**文档结束**

*最后更新：2026-07-19*  
*关联蓝图版本：AILOS v3.2.1*  
*关联 ADR：ADR-016 Global Language Operating Infrastructure Principle*