# TRAE 回执 Q1–Q8（任务书 V4.0 第一步）

> 回执人：TRAE（本地 IDE）
> 回执时间：2026-07-25
> 审计方式：实读全部源码 + schema + 全局搜索

---

## Q1：双世界 — 哪套是 canonical 真值源？

**答：`src/`(Express.js) + 根目录静态 HTML 为 canonical 生产真值源。**

- **World A（生产）**：`src/server/`（Express.js）+ `src/services/`（14个服务） + `prisma/schema.prisma`（PostgreSQL UUID，30+模型） + 根目录 18 个 HTML 文件。这是**当前线上部署态**，服务器 `/www/xuewaiyu-backend` 运行的就是这套代码。
- **World B（蓝图/实验）**：`ailos-server/`（NestJS v2.0.0 骨架，七库架构，MySQL BigInt，缺数据库依赖）+ `frontend/ailos-app/`（Vite+React SPA，已有构建产物）。这是**架构蓝图阶段产物**，从未部署到线上。
- **结论**：以 World A 为 canonical。World B 移入 `_archive/` 归档。`ailos-server/prisma/schema.prisma` 删除（MySQL BigInt 与 PostgreSQL UUID 冲突，TC-001 红线）。全库只留一份 `prisma/schema.prisma`。

## Q2：死 Gateway — aiGateway.js 未接线是疏忽还是有意？

**答：架构设计正确但实现遗漏。是 MVP 阶段的疏忽，不是有意延期。**

- `aiGateway.js`（355行）实现了完整的 GLOI 架构：资产检索→Redis缓存→LanguageGuard校验→Prompt模板构建→混元调用→LanguageGuard输出校验→成本日志。设计完全正确。
- 但**全局 0 处 require/import**。`aiController.js`（4个端点）和 `aiTutorService.js`（1个端点）全部绕过它，直接调用 `aiService.callHunyuan()`。
- `aiService.js` 是事实上的"轻量网关"（仅做代理/直连回退），缺失资产命中、缓存、LanguageGuard、Prompt模板化等关键能力。
- **接线计划**：M0 立即执行。`aiController.js` 和 `aiTutorService.js` 全部改为调用 `aiGateway`；`aiService.callHunyuan` 降级为 `aiGateway` 内部私有方法。

## Q3：出题框架 — QuestionBlueprint 0 引用，考试由谁生成？

**答：当前考试/练习题由 `aiController.js` 硬编码 Prompt 直连混元生成，QuestionBlueprint 模型虽已定义但从未被运行时代码使用。**

- `QuestionBlueprint` 模型在 `prisma/schema.prisma:761` 定义完整（含 contentId, question, answer, options, difficulty, questionType, skillType 等字段）。
- 种子脚本 `scripts/seedQuestionBlueprints.js` 存在但仅生成 2 条 listening 类型数据，且 contentData 结构与消费端不匹配。
- 实际出题路径：`aiController.js:258` 硬编码 Prompt `"你是一个语言学习出题引擎..."` → `aiService.callHunyuan()` → 混元。
- **修复计划**：M2 接通 `QuestionBlueprint` → `aiGateway` → AI 生成 → 结构校验 → 落库为 `LearningContent` 资产。补齐日/英/韩/西/法/德 6 语种种子蓝本。

## Q4：目标语言自定义 — 是设计取舍还是待补？

**答：待补，非设计取舍。老板总纲明确要求目标语言也须可自由文本输入。**

- `language.html` 当前：母语支持固定卡片 + 自由文本输入框（`customNativeInput`），但目标语言仅 7 种固定卡片（中/英/日/韩/法/西/德）。
- 后端 `UserLearningLanguage` 模型 `languageCode` 字段为 String 类型，具备接受任意语言标识的能力。
- **修复计划**：M1 在 `language.html` 目标语言区域增加与母语一致的自由文本输入框；后端 API 接受任意语言标识，AI 归一化为 BCP-47 + 显示名。

## Q5：30 天口语速成 — 到底做没做？

**答：0%。完全未做。**

- 全局搜索 `daily_learning_plans`、`speech_evaluation_records`、`dailyPlanService`、`speechEvaluateService`、`reminderService` → **零匹配**。
- Schema 中无 `daily_learning_plans` 表、无 `speech_evaluation_records` 表。
- `LearningPlan` 模型存在但仅为基础骨架，无 30 天个性化排课逻辑。
- 账簿 26.11 判 0% 是正确的。
- **修复计划**：M2 完整实现。建表→服务层→API→前端页面，串行不可跳跃。

## Q6：GLOI — 是范围外还是被砍？

**答：被遗漏。蓝图 v3.2.1 列 GLOI 为基石，但 schema 仅 2 张关联表，缺少 4 张核心表。**

- 当前仅有：`UserLanguagePreference`（用户语言偏好）+ `UserLearningLanguage`（多语言学习）。
- 缺失：`language_identities`（语言身份注册）、`content_language_versions`（多语言内容版本）、`translation_memory_entries`（翻译记忆）、`terminology_entries`（术语库）。
- **优先级**：`language_identities` > `content_language_versions` > `translation_memory_entries` > `terminology_entries`。
- **修复计划**：M1 落地全部 4 张表，UUID 主键，Prisma db push。

## Q7：成本熔断 — 额度耗尽后行为？

**答：当前仅软限制（前端提示"今日额度已用完"），无硬熔断。**

- `aiQuotaService.js` 有 `checkQuota()` 方法，返回 `{ allowed: false }` 时拒绝请求。
- 但 `aiController.js` 的 chat 端点**未强制执行** quota 检查结果——即使 quota 返回 false，请求仍可能发出。
- 无成本硬上限开关（`systemConfig` 中无 costLimit 配置）。
- 无降级到资产缓存逻辑。
- **修复计划**：M3 实现。额度耗尽 → 先查 `LearningContent` 资产库/Redis 缓存 → 命中则 0 成本返回 → 未命中返回明确降级提示。熔断开关入 `systemConfig`。

## Q8：资产回填 — learning_content 如何填充？

**答：当前 learning_content 表为空，导致每次请求都直连混元，无缓存命中。**

- `LearningContent` 模型已定义，但无回填任务。
- `aiGateway.js` 有 `_searchAsset()` 方法（已实现但未接线），理论上可检索资产库。
- 当前路径：`aiController.js` → `aiService.callHunyuan()` → 混元 → 返回 → 不落库。
- **修复计划**：M1 实现资产状态机（Generated→Validated→Indexed→Reusable→Premium→Archived）。aiGateway 每次生成后自动落库为 Generated 资产。种子数据批量导入日/英/韩 A1-A2 生活口语素材（30+ 条/语言）。

---

## 总结

| Q# | 状态 | 行动 |
|----|------|------|
| Q1 | 双世界，World A 为 canonical | M0：归档 World B |
| Q2 | aiGateway 死代码，5处直连 | M0：接线为唯一入口 |
| Q3 | QuestionBlueprint 0引用 | M2：接通 + 补齐种子 |
| Q4 | 目标语言固定卡片 | M1：改为自由文本输入 |
| Q5 | 30天口语速成 0% | M2：完整实现 |
| Q6 | GLOI 缺 4 张表 | M1：落地全部表 |
| Q7 | 无硬熔断 | M3：熔断+降级 |
| Q8 | 资产库为空 | M1：状态机+自动回填 |