# ADR-002: GLOI Global Language Context Layer

- **日期**: 2026-07-19
- **状态**: Accepted
- **决策者**: AILOS Architecture Team
- **关联旧项目路径**: `E:\TRAE SOLO\prisma\schema.prisma` (LearningProgress.language 字段)

## Context（背景）

### 旧项目现状

旧项目（言道学外语APP v1.0.0）无任何语言配置层。经 Phase 0.2 勘察，确认以下事实：

1. `LearningProgress` 表（`prisma/schema.prisma`）中仅存在单一 `language` 字段，用于记录用户当前学习语种，无多语种支持能力
2. 系统无任何 `user_language_preference`、`user_learning_language`、`language_config` 等语言相关配置表
3. 无语言上下文注入机制：AI 调用、前端 UI、内容生成、通知推送均未考虑多语种场景
4. 代码层面无任何语言判定逻辑或语言路由

### 架构蓝图要求

根据 AILOS v3.2.1 架构蓝图 **第五卷 5.6 节 GLOI**，语言能力被定位为 **Core Infrastructure 层**，与 AI Gateway、Event Bus、Permission Manager 平级，不属于任何业务域。关键要求：

- GLOI 是全局唯一语言调度中枢，覆盖前端 UI、AI Gateway、Content、Notification 四大消费端
- 所有业务逻辑的语种判定必须经过 GLOI 解析输出，禁止硬编码 language 判断逻辑
- 语言身份必须包含文化语境、受众画像、正式度等完整属性，而非单一语言代码
- 禁止按语言拆分数据表、拆分服务、拆分模块
- 所有 AI 请求必须通过 Language Resolver 注入完整语言上下文

## Decision（决策）

### 核心决策

将 GLOI 定位为 **AILOS 一级强制底层基础设施**，所有模块的语言相关逻辑必须通过 GLOI 提供的标准接口处理，禁止业务模块自行实现语言体系。

### 技术方案

#### 新增核心组件

| 组件 | 职责 |
|------|------|
| `user_language_preference` 表 | 存储用户界面语言偏好（ui_locale）、母语（native_language）、交互语言（interaction_language）、客服语言（preferred_support_language） |
| `user_learning_language` 表 | 存储用户正在学习的语言（learning_language），支持多语种同时学习，与 LearningProgress 一对一关联 |
| Language Context Resolver | 运行时语言上下文解析器，组装用户当前语言上下文：输入语言、输出语言、解释语言、学习语言 |
| Language Guard | 请求级语言校验中间件，拦截非法语言组合（如输入语言与输出语言相同）、记录违规次数 |

#### 四大消费端覆盖

| 消费端 | 语言注入方式 | 说明 |
|--------|------------|------|
| 前端 UI | 根据 `ui_locale` 动态加载 i18n 资源包 | 界面文案、日期格式、货币格式 |
| AI Gateway | 通过 Language Resolver 注入完整 `AIGenerationLanguageContext` | 输入语言身份、输出语言身份、解释语言身份、领域、意图 |
| Content | 所有内容资产通过 `language_identity_id` 关联语言身份 | 内容的多语言版本路由 |
| Notification | 根据 `preferred_support_language` 选择推送语言 | 邮件、短信、站内通知 |

#### 强制规则

所有业务逻辑的语种判定（如"当前用户是否在学习日语"、"生成内容的目标语言"、"解释说明的语言"）必须经过 Language Context Resolver 解析输出，**禁止在业务代码中硬编码 language 判断逻辑**。

错误示例：
```javascript
// 禁止：业务代码硬编码 language 判断
if (user.language === 'ja') { ... }
const prompt = "You are a Japanese teacher...";
```

正确示例：
```javascript
// 正确：通过 GLOI 解析
const ctx = languageContextResolver.resolve(uid, workspaceId);
// ctx.learning_language, ctx.explanation_language, ctx.output_identity
const prompt = await languageResolver.buildPrompt(scenario, ctx);
```

## Consequences（影响）

### 正面影响

1. **语言逻辑集中管控**：所有语种判定、翻译、本地化逻辑收敛至 GLOI，避免各模块重复造轮子
2. **多语种支持开箱即用**：新增语言仅需在 `language_identities` 表中注册新身份，不触及业务代码
3. **AI Prompt 语言一致性**：所有 AI 请求经过 Language Resolver 统一注入语言上下文，杜绝 Prompt 中语言描述不一致问题
4. **内容资产跨语言流通**：内容与语言身份解耦，同一内容可拥有多个语言版本，通过版本图管理

### 负面影响

1. **增加系统复杂度**：GLOI 作为新增基础设施层，增加了一层抽象和运行时开销
2. **学习成本**：所有业务开发者需理解 GLOI 接口规范，禁止直接操作语言字段
3. **迁移成本**：旧项目 `LearningProgress.language` 字段需迁移至 `user_learning_language` 表

## Constraints（边界约束）

- **MVP 仅实现三类基础校验**：
  1. 输入校验：确保 `input_identity` 和 `output_identity` 为合法语言身份
  2. 输出校验：确保 AI 返回内容的语言与 `output_identity` 一致
  3. 违规计数：记录语言不匹配次数，触发告警
- **多轮翻译暂不实现**：MVP 仅支持单轮翻译，多轮翻译（如中文 -> 英文 -> 日文）在 Phase 2 实现
- **语言 Agent 暂不实现**：MVP 不包含独立的语言智能 Agent，语言智能层（Layer 4）仅架构预留
- **智能语种推荐暂不实现**：MVP 不根据用户行为自动推荐学习语种

## Future Iterations（远期迭代）

- **Phase 2**: 多轮翻译管道，支持 A 语言 -> B 语言 -> C 语言的链式翻译
- **Phase 2**: Translation Memory Service 落地，历史翻译对全局复用，降低重复翻译成本
- **Phase 2**: Terminology Service 落地，全局术语库保障 IP 和术语翻译一致性
- **Phase 3**: Language Intelligence Service（语言智能层），包含文化理解、语境转换、风格迁移
- **Phase 3**: 智能语种推荐，基于用户行为、学习画像、全球趋势推荐学习语种
- **Phase 3**: Language Asset Marketplace 语言资产市场，术语包、风格包、翻译记忆包作为可交易资产

## References（参考）

- [AILOS v3.2.1 架构蓝图 - 第五卷 5.6 节 GLOI](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - ADR-016 GLOI Principle](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [Phase 0.2 旧项目资产勘察报告 - 三、数据模型核心事实](E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md)
- 旧项目 LearningProgress 模型: `E:\TRAE SOLO\prisma\schema.prisma`
