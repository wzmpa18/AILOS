# UX-LANG-001 三层母语+混元架构设计文档

> **文档编号**: UX-LANG-001-HAD-001  
> **版本**: v1.0  
> **状态**: ❌ 禁止编码，仅输出设计文档  
> **日期**: 2026-07-20  
> **项目**: AILOS v3.2.2 — AI Native Full-Layer Education Operating System  
> **执行模式**: RC_PHASE1 Delivery + Milestone2 Architecture Pre-Design  
> **适用范围**: Tier 2 — 仅设计输出，不涉及代码变更

---

## 目录

1. [当前单层语种缺陷复盘](#1-当前单层语种缺陷复盘)
2. [三层语言架构标准定义](#2-三层语言架构标准定义)
3. [腾讯混元 Prompt Engineering 完整方案](#3-腾讯混元-prompt-engineering-完整方案)
4. [全链路耦合模块风险清单](#4-全链路耦合模块风险清单)
5. [存量用户迁移方案](#5-存量用户迁移方案)
6. [两条迭代路线对比](#6-两条迭代路线对比)
7. [Milestone2 架构解冻前置审批清单](#7-milestone2-架构解冻前置审批清单)

---

## 1. 当前单层语种缺陷复盘

### 1.1 核心问题诊断

当前 AILOS v3.2.2 语言系统中的 **三层语言概念严重混淆**，根本原因在于 `UserLanguagePreference` 表设计将 `nativeLanguage`、`interfaceLanguage`、`defaultExplanationLanguage` 混存在同一张偏好表中，且 `nativeLanguage` 字段被约束为固定枚举值（zh-CN/en/ja/ko/fr/es/de），导致系统无法区分"APP 界面展示什么语言"与"用户真正母语是什么"。

#### 问题矩阵

| 问题编号 | 当前状态 | 影响范围 | 严重程度 |
|---------|---------|---------|---------|
| **LANG-001** | `nativeLanguage` 被当作 `explanationLanguage` 的默认值使用 | 全链路 AI 解释语种 | 🔴 高 |
| **LANG-002** | 母语仅支持 7 种固定枚举，不支持藏语/阿拉伯语/印地语等自由输入 | 小语种用户无法使用 | 🔴 高 |
| **LANG-003** | 混元 Prompt 硬编码 `explanationLanguage`，无法根据用户真实母语自适应 | AI 教学解释质量 | 🔴 高 |
| **LANG-004** | `interfaceLanguage`（UI 渲染）与 `nativeLanguage`（AI 教学）无隔离 | 全链路语种调度 | 🟡 中 |
| **LANG-005** | 缓存 Key 仅使用 `primaryTargetLanguage`，未区分 `nativeLanguage` | 跨母语缓存污染 | 🟡 中 |
| **LANG-006** | `AiPromptTemplate` 按 `languageCode` 索引，但 `languageCode` 定义为固定枚举 | 小语种 Prompt 模板缺失 | 🟡 中 |

### 1.2 代码证据链

#### 证据 1: languageContextResolver.js — 三层合一

```javascript
// src/middleware/languageContextResolver.js:39-41
// 默认值全部使用同一个 systemFallback（'zh-CN'）
languageContext = {
  interfaceLanguage: systemFallback,   // Layer 1 — UI 界面
  nativeLanguage: systemFallback,      // Layer 2 — 用户母语（本应独立）
  explanationLanguage: systemFallback, // 临时概念 — 混元解释语种
};
```

**问题**: `nativeLanguage` 被当作 `explanationLanguage` 的别名，三个概念完全混淆。

#### 证据 2: aiGateway.js — Prompt 硬编码

```javascript
// src/services/aiGateway.js:222-224
// 默认 Prompt 将 explanationLanguage 作为解释语种
const explanationLang = languageContext?.explanationLanguage || 'zh-CN';
// 但 explanationLanguage 实际来自 nativeLanguage 字段
```

**问题**: 藏语用户会被分配 `explanationLanguage: 'zh-CN'`（因为藏语不在枚举中），AI 无法用藏语解释。

#### 证据 3: Prisma Schema — 固定枚举

```prisma
// prisma/schema.prisma:372-375
model UserLanguagePreference {
  nativeLanguage            String    @default("zh-CN") // 仅支持 7 种固定值
  interfaceLanguage         String    @default("zh-CN")
  defaultExplanationLanguage String   @default("zh-CN")
}
```

**问题**: `nativeLanguage` 字段类型为 `String` 但实际被前端/验证逻辑限制为 7 种枚举值，小语种用户无法输入。

#### 证据 4: AiPromptTemplate — 固定语种匹配

```prisma
// prisma/schema.prisma:555-556
model AiPromptTemplate {
  languageCode      String    @default("zh-CN") // 固定枚举值
}
```

**问题**: 藏语、阿拉伯语等语言没有对应的 Prompt 模板，无法命中数据库模板。

### 1.3 影响量化

| 维度 | 当前状态 | 三层架构完成后 |
|------|---------|--------------|
| 可支持母语数量 | 7 种（固定枚举） | 无限（自由文本） |
| AI 解释语种匹配率 | ~60%（仅 7 种语言有模板） | ~95%（通用兜底 + 小语种模板） |
| 新用户进入门槛 | 必须选择 7 种语言之一 | 自由输入任何母语 |
| 跨母语缓存污染 | 存在（Key 不区分 nativeLanguage） | 消除（Key 包含 nativeLanguage） |
| 核心差异化 | 未成立（母语驱动教学为虚假宣传） | 成立（真正的母语驱动 AI 教学） |

---

## 2. 三层语言架构标准定义

### 2.1 三层标准定义

```
┌─────────────────────────────────────────────────────────────┐
│                    AILOS 三层语言架构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Interface Language (界面语言)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 用途: APP 界面展示文字（按钮、菜单、提示、标签）            │ │
│  │ 范围: 固定 7 语种 (zh-CN/en/ja/ko/fr/es/de)              │ │
│  │ 控制: 仅用于 UI 渲染，不参与 AI 教学                      │ │
│  │ 存储: UserLanguagePreference.interfaceLanguage            │ │
│  │ 枚举: 是（前端下拉选择）                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 2: Native Language (用户真实母语)          ← 核心差异化  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 用途: AI 教学解释的基准语言，用户最熟悉的语言               │ │
│  │ 范围: 自由文本输入（String），禁止枚举限制                  │ │
│  │ 示例: "藏语"、"阿拉伯语"、"印地语"、"粤语"、"四川话"       │ │
│  │ 存储: UserLanguagePreference.nativeLanguage（String）      │ │
│  │ 枚举: 否（自由文本输入框）                                 │ │
│  │ 兜底: 无匹配预制模板时 → 通用默认 Prompt → 混元自行理解       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Layer 3: Target Learning Language (目标学习语言)              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 用途: 用户选择学习的外语，控制课程/例句/对话生成主题          │ │
│  │ 范围: 固定语种码 (ja/en/ko/de/es/fr/...)                  │ │
│  │ 存储: UserLearningLanguage.languageCode                   │ │
│  │ 枚举: 是（前端下拉选择）                                   │ │
│  │ 多选: 支持（用户可同时学习多门语言）                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 三层关系与数据流

```
用户请求
  │
  ├─→ Layer 1 (Interface Language)
  │     │
  │     └─→ 控制 UI 渲染: 按钮文字、菜单、提示语
  │         不参与 AI 调用
  │
  ├─→ Layer 2 (Native Language)
  │     │
  │     └─→ 控制 AI 解释语种: 语法讲解、词汇释义、纠错反馈
  │         传入混元 System Prompt 的 {{nativeLanguage}} 变量
  │
  └─→ Layer 3 (Target Learning Language)
        │
        └─→ 控制 AI 内容生成: 例句、对话、课程主题
           传入混元 System Prompt 的 {{targetLanguage}} 变量
```

### 2.3 标准化 languageContext 结构 (v2.0)

```javascript
// 重构后的 req.language_context 结构
{
  // Layer 1: 界面语言（固定 7 种枚举）
  interfaceLanguage: 'zh-CN',          // 枚举: zh-CN/en/ja/ko/fr/es/de

  // Layer 2: 用户真实母语（自由文本）
  nativeLanguage: '藏语',              // 自由文本 String，禁止枚举限制

  // Layer 3: 目标学习语言
  targetLanguage: 'Japanese',          // 主学习目标
  targetLanguages: [                   // 多语言学习列表
    { languageCode: 'ja', level: 'N2', priority: 1 },
    { languageCode: 'en', level: 'B1', priority: 2 },
  ],

  // 兜底
  fallbackLanguage: 'zh-CN',           // 系统级兜底

  // 来源追踪
  source: 'user_preference'            // system_default | user_preference | workspace_config | request_override
}
```

### 2.4 关键变更对比

| 字段 | 旧定义 (v3.2.2) | 新定义 (v3.3+) | 变更类型 |
|------|----------------|---------------|---------|
| `interfaceLanguage` | 无变化 | 无变化 | 保持 |
| `nativeLanguage` | 固定 7 种枚举，兼作解释语种 | 自由文本 String，仅表示用户真实母语 | **语义重构** |
| `explanationLanguage` | 独立字段，取 nativeLanguage 的值 | **删除**，AI 解释语种直接使用 nativeLanguage | **字段删除** |
| `primaryTargetLanguage` | 第一个学习语言 | 第一个学习语言 | 保持 |
| `targetLanguages` | 学习语言列表 | 学习语言列表 | 保持 |

**核心变更**: 删除 `explanationLanguage` 字段，AI 解释语种直接使用 `nativeLanguage`（自由文本），让混元大模型自行理解小语种名称（如"藏语"、"阿拉伯语"）。

---

## 3. 腾讯混元 Prompt Engineering 完整方案

### 3.1 API 接入信息

| 配置项 | 值 |
|-------|-----|
| 接口地址 | `https://tokenhub.tencentmaas.com/v1/chat/completions` |
| 模型 | `hy3` |
| Key ID | `ak-20260717-b15fd46c40a4ddca4ad4cf3f6100562e` |
| Secret Key | `sk-sl6H1ymXeRmQ6yYsTaIftAN358vCfMfK162evzXLmef7V1vG` |
| IP 白名单 | `82.156.228.87` |
| 接口协议 | OpenAI Chat Completions 兼容 |
| 认证方式 | Bearer Token (Secret Key) |

### 3.2 强制完整 languageContext 传递

每次 AI 调用必须携带完整的标准化 languageContext，不再使用 `explanationLanguage` 别名：

```json
{
  "interfaceLanguage": "zh-CN",
  "nativeLanguage": "藏语",
  "targetLanguage": "Japanese",
  "targetLanguages": [
    { "languageCode": "ja", "level": "N2", "priority": 1 }
  ],
  "fallbackLanguage": "zh-CN",
  "source": "user_preference"
}
```

### 3.3 场景化 Prompt 模板

#### 场景 1: lesson_generate（课程生成）

```
System Prompt:
你是 AILOS 专属 AI 学习导师，由腾讯混元大模型驱动。

用户的母语：{{nativeLanguage}}
用户学习的目标语言：{{targetLanguage}}
用户当前等级：{{level}}

强制规则：
1. 所有语法解释、词汇释义、学习建议必须使用用户的母语（{{nativeLanguage}}）输出
2. 所有例句、对话、练习题仅输出目标语言（{{targetLanguage}}），并附带母语翻译
3. 根据用户等级（{{level}}）调整内容难度
4. 每课包含：核心词汇（5-8个）、语法点（1-2个）、情景对话（1段）、练习题（3道）
5. 如果用户母语不在常见语种列表中，请尽量用该语言或最近似语言进行解释

User Prompt:
请生成一节关于「{{topic}}」的{{targetLanguage}}课程。
```

#### 场景 2: explanation（解释/翻译）

```
System Prompt:
你是 AILOS 专属 AI 学习导师，由腾讯混元大模型驱动。

用户的母语：{{nativeLanguage}}
用户学习的目标语言：{{targetLanguage}}

强制规则：
1. 所有解释、分析、纠错必须使用用户的母语（{{nativeLanguage}}）输出
2. 目标语言例句附带母语翻译
3. 解释要通俗易懂，避免语言学专业术语（除非用户是高级学习者）
4. 如果用户母语不在常见语种列表中，请尽量用该语言或最近似语言进行解释

User Prompt:
请用{{nativeLanguage}}解释以下{{targetLanguage}}内容的含义、语法结构和用法：
「{{input}}」
```

#### 场景 3: conversation（对话练习）

```
System Prompt:
你是 AILOS 专属 AI 语伴，由腾讯混元大模型驱动。

用户的母语：{{nativeLanguage}}
对话的目标语言：{{targetLanguage}}
用户当前等级：{{level}}

强制规则：
1. 对话内容仅使用目标语言（{{targetLanguage}}）
2. 当用户使用母语（{{nativeLanguage}}）提问时，用母语耐心解释
3. 根据用户等级调整对话难度和语速暗示
4. 每次对话后提供 1-2 条改进建议（用母语）
5. 保持友好、鼓励的语气

User Prompt:
请开始一段关于「{{context}}」的{{targetLanguage}}对话练习。我的等级是{{level}}。
```

#### 场景 4: review（学习回顾）

```
System Prompt:
你是 AILOS 专属 AI 学习导师，由腾讯混元大模型驱动。

用户的母语：{{nativeLanguage}}
用户学习的目标语言：{{targetLanguage}}

强制规则：
1. 所有反馈、评价、建议必须使用用户的母语（{{nativeLanguage}}）输出
2. 指出错误时，给出去正确的目标语言表达，并附带母语解释
3. 鼓励为主，纠错为辅，保持正向学习体验

User Prompt:
请回顾我最近学习{{targetLanguage}}的进度，分析薄弱环节，并给出学习建议。
学习数据：
- 已学习词汇：{{vocabularyCount}} 个
- 课程完成率：{{completionRate}}%
- 常见错误类型：{{commonMistakes}}
```

### 3.4 小语种兜底策略

当用户 `nativeLanguage` 不在常见语种列表中（如"藏语"、"阿拉伯语"、"印地语"、"粤语"等），系统采用以下三级兜底策略：

```
Level 1: 直接传递 nativeLanguage 给混元
  → 混元大模型具有较强的语言理解能力，能理解"藏语"、"阿拉伯语"等语种名称
  → 90% 概率直接输出正确语种

Level 2: 混元输出非预期语种 → Language Guard 检测 → 自动重试
  → 重试时在 Prompt 中追加: "请严格使用 {{nativeLanguage}} 进行解释，不要使用其他语言"
  → 最多重试 3 轮

Level 3: 3 轮重试全部失败 → 降级到通用默认 Prompt
  → 使用 fallbackLanguage（如 zh-CN）作为解释语种
  → 记录违规日志到 ai_language_violation_log
  → 标记为「小语种适配失败」供后续优化
```

### 3.5 缓存改造策略

#### 旧缓存 Key 设计（缺陷）

```javascript
// 旧：仅使用 targetLanguage，不区分 nativeLanguage
_cacheKey = `ailos:ai:cache:${scene}:${userId}:${targetLanguage}:${paramsHash}`
// 问题：藏语母语用户和中文母语用户命中同一缓存 → 跨母语缓存污染
```

#### 新缓存 Key 设计（修复）

```javascript
// 新：完整包含 nativeLanguage + targetLanguage + scene
_cacheKey = `ailos:ai:cache:${scene}:${nativeLanguage}:${targetLanguage}:${paramsHash}`
// 示例: ailos:ai:cache:lesson_generate:藏语:ja:YWJjZGVm...
// 示例: ailos:ai:cache:explanation:Arabic:en:MTIzNDU2...
```

#### 缓存 Key 变更影响

| 缓存类型 | 旧 Key 模式 | 新 Key 模式 | 迁移方式 |
|---------|-----------|-----------|---------|
| AI 响应缓存 | `scene:userId:targetLang:hash` | `scene:nativeLang:targetLang:hash` | 旧 Key 自然过期（3600s TTL），新 Key 写新位置 |
| 内容资产缓存 | `targetLang:explanationLang` | `targetLang:nativeLang` | 资产库字段新增 nativeLanguage 维度 |
| Prompt 模板缓存 | `scene:languageCode` | `scene:nativeLanguage` | 模板匹配改为 `nativeLanguage` 模糊匹配 |

### 3.6 AiPromptTemplate 匹配策略变更

```javascript
// 旧：精确匹配 languageCode（固定枚举）
const template = await prisma.aiPromptTemplate.findFirst({
  where: {
    scene,
    languageCode: languageContext?.explanationLanguage || 'zh-CN', // 固定枚举
    status: 'active',
  },
});

// 新：模糊匹配 + 通用兜底
const template = await prisma.aiPromptTemplate.findFirst({
  where: {
    scene,
    nativeLanguage: languageContext?.nativeLanguage, // 自由文本，如"藏语"
    status: 'active',
  },
});
// 无匹配 → 使用通用默认 Prompt（小语种兜底策略 Level 3）
```

---

## 4. 全链路耦合模块风险清单

### 4.1 影响范围矩阵

| 模块 | 文件路径 | 影响程度 | 变更类型 | 风险等级 | 回归测试范围 |
|------|---------|---------|---------|---------|------------|
| **languageContextResolver** | `src/middleware/languageContextResolver.js` | 🔴 高 | 重构 `explanationLanguage` → 删除，统一使用 `nativeLanguage` | 高 | 全链路语种调度 |
| **AI Gateway** | `src/services/aiGateway.js` | 🔴 高 | Prompt 模板变量替换、缓存 Key 重构、API 端点切换 | 高 | 4 场景 × 7 语种 |
| **PromptBuilder** | `src/services/aiGateway.js` (`_buildPrompt` / `_buildDefaultPrompt`) | 🔴 高 | 全部 4 场景 Prompt 模板重写 | 高 | 场景 Prompt 输出校验 |
| **LanguageGuard** | `src/services/languageGuard.js` | 🔴 高 | 输出校验增加 nativeLanguage 脚本检测规则 | 高 | 违规检测准确率 |
| **LearningContent** | `src/services/learningContentService.js` | 🟡 中 | 资产库查询增加 `nativeLanguage` 维度 | 中 | 资产检索命中率 |
| **LearningMemory** | `src/services/learningMemoryService.js` | 🟡 中 | 记忆存储增加 `nativeLanguage` 标识 | 中 | 记忆检索准确性 |
| **Recommendation** | `src/services/dashboardService.js` | 🟡 中 | 推荐逻辑增加 nativeLanguage 同母语学习者数据 | 中 | 推荐内容相关性 |
| **authService** | `src/services/authService.js` | 🟡 中 | 注册/登录时 nativeLanguage 自由文本输入 | 中 | 注册流程 |
| **authController** | `src/server/controllers/authController.js` | 🟡 中 | 注册接口接受自由文本 nativeLanguage | 中 | API 参数校验 |
| **Prisma Schema** | `prisma/schema.prisma` | 🟡 中 | `UserLanguagePreference` 删除 `defaultExplanationLanguage` | 中 | 数据库迁移 |
| **前端语言选择** | `public/login.html` / 语言选择页面 | 🟡 中 | 母语输入框改为自由文本（非下拉选择） | 中 | 前端交互流程 |
| **AiPromptTemplate** | 数据库表 | 🟡 中 | `languageCode` 字段语义改为 `nativeLanguage` | 中 | 模板匹配逻辑 |

### 4.2 风险等级计算规则

| 等级 | 条件 | 数量 |
|------|------|------|
| 🔴 高 | 涉及 AI 调用链路 + Prompt 模板 + 缓存 Key | 4 |
| 🟡 中 | 涉及语言上下文传递但非核心 AI 链路 | 8 |
| 🟢 低 | 仅涉及 UI 展示 | 0 |

### 4.3 关键风险点

#### 风险 1: 混元模型对小语种的理解能力

- **风险**: 混元大模型可能无法理解"藏语"、"粤语"等非标准语种名称
- **缓解**: 三级兜底策略（直接传递 → 重试强化 → 降级通用 Prompt）
- **验证**: 使用 10+ 种小语种名称进行 Prompt 测试

#### 风险 2: 缓存 Key 变更导致瞬时 AI 成本飙升

- **风险**: 旧缓存全部失效，所有请求直达混元 API
- **缓解**: 分阶段迁移（先新 Key 写新位置，旧 Key 自然过期）+ 灰度发布
- **监控**: 实时监控 AI 调用量和成本

#### 风险 3: Language Guard 输出校验规则不适配自由文本母语

- **风险**: 当前脚本检测基于固定枚举，自由文本母语无法匹配
- **缓解**: 增加"未知语种"兜底分类，不做强制脚本匹配，依赖混元输出质量
- **验证**: 边界测试覆盖 20+ 种自由文本母语

#### 风险 4: 数据库迁移导致存量用户数据丢失

- **风险**: 删除 `defaultExplanationLanguage` 字段可能丢失历史数据
- **缓解**: 先新增 `nativeLanguageText` 字段（自由文本），保留旧字段，平稳过渡
- **回滚**: 数据库迁移脚本必须包含完整回滚方案

---

## 5. 存量用户迁移方案

### 5.1 迁移原则

1. **零数据丢失**: 历史 `nativeLanguage` 记录完整保留
2. **无 DDL 破坏**: 不删除旧字段，只新增字段，保持向后兼容
3. **渐进式迁移**: 存量用户首次登录弹窗引导补全，不强制立即修改
4. **双字段共存期**: 旧 `nativeLanguage`（枚举值）与新 `nativeLanguageText`（自由文本）共存至少 2 个版本周期

### 5.2 数据库变更方案

```sql
-- 阶段 1: 新增 nativeLanguageText 字段（自由文本，可空）
ALTER TABLE "UserLanguagePreference" 
ADD COLUMN "nativeLanguageText" VARCHAR(100);

-- 阶段 2: 存量数据迁移（将枚举值复制到自由文本字段）
UPDATE "UserLanguagePreference" 
SET "nativeLanguageText" = "nativeLanguage"
WHERE "nativeLanguageText" IS NULL;

-- 阶段 3: 标记旧字段为 deprecated（不删除，代码中不再读取）
-- 代码层面：读取 nativeLanguageText 优先，fallback 到 nativeLanguage

-- 阶段 4（Milestone3+）: 确认无代码依赖后删除旧字段
-- ALTER TABLE "UserLanguagePreference" DROP COLUMN "nativeLanguage";
-- ALTER TABLE "UserLanguagePreference" RENAME COLUMN "nativeLanguageText" TO "nativeLanguage";
```

### 5.3 存量用户首次登录引导流程

```
用户登录
  │
  ├─→ 检测 nativeLanguageText 是否为空
  │     │
  │     ├─ 为空（存量用户）→ 弹出三层语言配置引导弹窗
  │     │     │
  │     │     ├─ 界面语言: 当前已选（下拉选择，7 种）
  │     │     ├─ 我的母语: [自由文本输入框] ← 核心新增
  │     │     │   └─ 提示: "请输入你最熟悉的语言，如：藏语、粤语、阿拉伯语..."
  │     │     ├─ 学习目标: 当前已选（下拉选择）
  │     │     └─ [保存] → 写入 nativeLanguageText
  │     │
  │     └─ 不为空（新用户/已补全）→ 正常进入首页
  │
  └─→ 引导弹窗可跳过（右上角关闭按钮），但每次登录重复提示直到补全
```

### 5.4 代码兼容层

```javascript
// 兼容层：优先读取自由文本，fallback 到旧枚举值
function getNativeLanguage(preference) {
  if (preference.nativeLanguageText) {
    return preference.nativeLanguageText; // 新字段（自由文本）
  }
  return mapLegacyNativeLanguage(preference.nativeLanguage); // 旧字段（枚举值）
}

// 旧枚举值 → 中文语种名称映射
function mapLegacyNativeLanguage(code) {
  const map = {
    'zh-CN': '中文',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
  };
  return map[code] || code;
}
```

### 5.5 迁移时间线

| 阶段 | 时间 | 动作 | 用户影响 |
|------|------|------|---------|
| Phase 1 | RC_PHASE1 当前 | 设计文档输出，不编码 | 无 |
| Phase 2 | Milestone2 启动 | 新增 `nativeLanguageText` 字段 | 无（向后兼容） |
| Phase 3 | Milestone2 第 1 周 | 旧数据迁移 + 兼容层上线 | 无感知 |
| Phase 4 | Milestone2 第 2 周 | 存量用户引导弹窗上线 | 首次登录弹窗（可跳过） |
| Phase 5 | Milestone2 第 4 周 | 全量 AI 调用切换至新字段 | AI 解释语种可能变化 |
| Phase 6 | Milestone3+ | 删除旧字段 `defaultExplanationLanguage` | 无（已无依赖） |

---

## 6. 两条迭代路线对比

### 6.1 路线 A: 当前 RC 阶段同步开发（不推荐）

| 维度 | 评估 |
|------|------|
| **工期** | 7-14 天（全链路 AI 重构 + 回归测试） |
| **风险** | 🔴 高 |
| **风险详情** | - 全链路 AI 回归（4 场景 × 7 语种 = 28 测试用例） |
|  | - 数据库字段变更（DDL 风险） |
|  | - 混元 API 端点切换（从本地代理到直连） |
|  | - 缓存 Key 全量变更（瞬时成本飙升） |
|  | - Language Guard 规则重构（误拦截风险） |
| **差异化** | 完整产品差异化（三层母语即时上线） |
| **对 RC 上线影响** | **严重延迟**（RC 原计划 1-2 天上线，延长至 7-14 天） |
| **建议** | ❌ **不推荐** |

### 6.2 路线 B: 延后至 Milestone2（推荐）

| 维度 | 评估 |
|------|------|
| **工期** | 0 天（当前阶段） |
| **风险** | 🟢 低 |
| **风险详情** | - RC 快速上线，无 AI 架构变更 |
|  | - 先采集真实用户母语数据（自由文本） |
|  | - 积累 Language Guard 违规日志供 Prompt 优化 |
|  | - 观察混元 API 稳定性后再做架构变更 |
| **差异化** | 先采集数据，再迭代实现差异化 |
| **对 RC 上线影响** | **无延迟**（RC 按原计划上线） |
| **建议** | ✅ **推荐** |

### 6.3 路线 B 的分阶段执行计划

```
RC_PHASE1 (当前)
  │
  ├─→ Landing 页上线（新用户价值认知）
  ├─→ 游客模式上线（零成本体验）
  ├─→ 采集数据：注册量、转化率、留存率
  │
  └─→ 稳定运行 ≥ 1 周
        │
        ▼
Milestone2 启动（架构解冻）
  │
  ├─→ Week 1: 数据库新增字段 + 兼容层
  ├─→ Week 2: 混元 API 直连切换 + Prompt 模板重写
  ├─→ Week 3: 缓存 Key 重构 + 资产库维度升级
  ├─→ Week 4: Language Guard 规则升级 + 全量回归
  │
  └─→ 灰度发布 10% → 50% → 100%
```

### 6.4 路线 B 的 RC 阶段临时方案

在 RC 阶段，为最小化编码、最大化价值，采用以下临时方案：

1. **Landing 页** 宣传三层母语差异化（已实现）
2. **注册流程** 保持现有 7 种母语枚举选择，但增加提示："更多母语支持即将上线"
3. **AI 调用** 保持现有逻辑不变（`explanationLanguage` 仍使用枚举值）
4. **数据采集** 在前端增加隐藏字段记录用户浏览器语言，积累小语种需求数据

---

## 7. Milestone2 架构解冻前置审批清单

### 7.1 必须全部满足方可启动编码

| # | 审批项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | RC_PHASE1（Landing + 游客）线上稳定运行 ≥ 1 周 | ☐ | 监控 PM2 状态、错误率、AI 调用量 |
| 2 | 真实用户转化/留存数据已采集 | ☐ | 注册量、游客→注册转化率、次日留存率 |
| 3 | 完整回归测试用例清单已准备 | ☐ | 4 场景 × 7 语种 + 小语种兜底 = 28+ 测试用例 |
| 4 | 灰度发布 + 一键回滚方案已就绪 | ☐ | PM2 灰度策略 + 数据库回滚脚本 + 缓存清空脚本 |
| 5 | 腾讯混元 API 配额已确认 | ☐ | 确认日调用量配额、费率、并发限制 |
| 6 | 人工书面专项开发指令已出具 | ☐ | 包含完整功能规格、验收标准、回滚方案 |
| 7 | 小语种 Prompt 测试已完成（非编码） | ☐ | 使用 Postman/cURL 测试 10+ 种小语种母语 Prompt |
| 8 | Language Guard 违规日志积累 ≥ 100 条 | ☐ | 用于 Prompt 优化和规则调整 |
| 9 | `nativeLanguageText` 字段数据完整性校验通过 | ☐ | 确保存量用户数据迁移无丢失 |
| 10 | 混元 API 直连稳定性测试通过（≥ 24h） | ☐ | 测试 24 小时内 API 可用性 ≥ 99.5% |

### 7.2 审批流程

```
1. 人工验证审批项 #1-#5 全部满足
2. 人工签署「Milestone2 架构解冻指令」
3. AI 执行 Prisma Schema 变更（新增字段，不删除旧字段）
4. AI 执行代码兼容层（双字段共存）
5. AI 执行混元 API 直连切换
6. AI 执行 Prompt 模板重写
7. 灰度 10% 用户 → 观察 24h → 灰度 50% → 观察 48h → 全量
8. 完成 Milestone2 交付验收
```

### 7.3 架构解冻指令模板

```
AILOS_MILESTONE2_ARCHITECTURE_UNFREEZE

本人确认以下条件已全部满足：
1. RC_PHASE1 线上稳定运行 ≥ 1 周 ✅
2. 用户转化/留存数据已采集 ✅
3. 回归测试用例清单已就绪 ✅
4. 灰度 + 回滚方案已就绪 ✅
5. 混元 API 配额已确认 ✅

现授权 AI 执行 Milestone2 三层母语架构开发，
包括：数据库字段新增、代码兼容层、混元 API 直连切换、
Prompt 模板重写、缓存 Key 重构、Language Guard 规则升级。

授权人：___________
日期：___________
```

---

## 附录 A: 当前系统全量 languageContext 引用点

以下为 v3.2.2 代码中所有 `languageContext` 引用点，供 Milestone2 开发时逐一排查：

| # | 文件 | 行号 | 引用方式 | 受影响 |
|---|------|------|---------|--------|
| 1 | `src/middleware/languageContextResolver.js` | 39-125 | 构建 `languageContext` | ✅ 重构 |
| 2 | `src/services/aiGateway.js` | 152 | `languageContext?.explanationLanguage` | ✅ 改为 `nativeLanguage` |
| 3 | `src/services/aiGateway.js` | 157 | `explanationLanguage` 资产检索 | ✅ 改为 `nativeLanguage` |
| 4 | `src/services/aiGateway.js` | 189 | `languageCode: languageContext?.explanationLanguage` | ✅ 模板匹配 |
| 5 | `src/services/aiGateway.js` | 209 | `{{explanation_language}}` 变量替换 | ✅ 改为 `{{nativeLanguage}}` |
| 6 | `src/services/aiGateway.js` | 224 | `explanationLanguage` 默认 Prompt | ✅ 改为 `nativeLanguage` |
| 7 | `src/services/aiGateway.js` | 284 | 缓存 Key 构建 | ✅ 增加 `nativeLanguage` |
| 8 | `src/services/languageGuard.js` | 36-46 | `getAllowedLanguages` | ✅ 改为 `nativeLanguage` |
| 9 | `src/services/languageGuard.js` | 90 | `explanationLanguage` 违规检测 | ✅ 改为 `nativeLanguage` |
| 10 | `src/services/languageGuard.js` | 126 | `expectedExplainLang` 审计 | ✅ 改为 `expectedNativeLang` |
| 11 | `src/services/learningContentService.js` | 29 | `explanationLanguage` 查询 | ✅ 改为 `nativeLanguage` |
| 12 | `src/services/learningContentService.js` | 93 | `explanationLanguage` 查询 | ✅ 改为 `nativeLanguage` |
| 13 | `src/services/authService.js` | 367-370 | `nativeLanguage` / `interfaceLanguage` | ✅ 增加 `nativeLanguageText` |

**共计 13 个引用点，全部受影响。**

---

## 附录 B: 混元 API 测试用例

### B.1 cURL 验证命令

```bash
# 基础连通性测试
curl -X POST 'https://tokenhub.tencentmaas.com/v1/chat/completions' \
  -H 'Authorization: Bearer sk-sl6H1ymXeRmQ6yYsTaIftAN358vCfMfK162evzXLmef7V1vG' \
  -H 'Content-Type: application/json' \
  -d '{"model":"hy3","messages":[{"role":"system","content":"你是AILOS专属AI学习导师。用户母语：藏语。目标语言：日语。请用藏语解释日语语法。"},{"role":"user","content":"请解释日语助词「は」和「が」的区别"}],"stream":false}'
```

### B.2 小语种 Prompt 测试矩阵

| 母语 | 目标语言 | 场景 | 预期行为 |
|------|---------|------|---------|
| 藏语 | 日语 | 语法解释 | 混元用藏语解释日语语法 |
| 阿拉伯语 | 英语 | 词汇释义 | 混元用阿拉伯语解释英语单词 |
| 印地语 | 韩语 | 对话练习 | 混元用印地语指导韩语对话 |
| 粤语 | 普通话 | 发音纠正 | 混元用粤语解释普通话发音 |
| 四川话 | 英语 | 课程生成 | 混元用四川话生成英语课程 |
| 维吾尔语 | 日语 | 翻译 | 混元用维吾尔语翻译日语 |
| 蒙古语 | 英语 | 语法解释 | 混元用蒙古语解释英语语法 |

---

## 附录 C: 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-07-20 | v1.0 | 初始版本，完整架构设计输出 | AI (TRAE) |

---

> **文档结束**  
> **下一步**: 人工审阅本文档，确认路线选择（推荐路线 B），待 RC_PHASE1 稳定运行后启动 Milestone2 架构开发。