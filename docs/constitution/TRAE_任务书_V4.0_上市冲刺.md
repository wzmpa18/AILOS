# TRAE 任务书 V4.0 — AILOS 上市冲刺（总工程师签发）

> 签发时间：2026-07-24
> 签发人：总工程师/监理（Local）
> 接收人：TRAE
> 依据：蓝图 v3.2.1（唯一架构真值源）+ 总账簿 `AILOS_MASTER_LEDGER.md` 第29章审计结论
> 效力：本任务书覆盖此前所有未完成指令。**先回执，后动工；串行闸门，禁止跳步。**

---

## 〇、老板总纲（最高约束，任何实现不得与之冲突）

1. **AILOS = AI 原生操作系统**：所有互动/功能/内容由 AI 通过 **AI Gateway 唯一入口** 动态生成与调度，不是静态教材库。
2. **首次进入 → 选语言**：母语与「要学习的语言」**均支持用户自由文本输入**——AI 按用户需求 + APP 的框架自动生成对应资源（含考试）。
3. **必须有试题/课程框架**（QuestionBlueprint / CourseBlueprint）：由程序调取 AI 拉取/导入资源，**严禁写死内容**。
4. **全部机制 = 调取 AI 资源 + 控制 AI 不越权**：LanguageGuard、权限隔离、成本治理等 guardrails 必须真实生效。

## 铁律（违反任意一条 = 验收直接 FAIL）

| # | 铁律 |
|---|------|
| 1 | `userId` 一律 UUID，禁止 Int 自增；严禁改 User 认证/membership 逻辑 |
| 2 | **禁止业务代码直连混元/任何模型 API**，一切模型调用必经 `aiGateway` |
| 3 | **禁止硬编码 Prompt**，一切 Prompt 必经 `aiPromptTemplate` 库（版本化） |
| 4 | 串行闸门：M0 → M1 → M2 → M3 → M4，前一阶段未签收不得进入下一阶段 |
| 5 | 每阶段完成必须提交 `RC_READY_<阶段号>` 回执 + 自测证据（接口响应/库查询截图或日志） |
| 6 | TRAE 禁止 SSH 登录线上服务器；部署由监理执行 |
| 7 | 单一真值源：一套 schema、一套前端、一套后端，禁止再造平行副本 |

---

## 一、第一步（立即执行）：书面回执 Q1–Q8，禁止跳过任何一条

| # | 问题 | 必答要点 |
|---|------|---------|
| Q1 | **双世界**：`ailos-server/`(TS)+`frontend/ailos-app`(React) 与 `src/`(JS)+根静态 HTML 两套并存 | 哪套是 canonical 真值源？另一套是废弃实验还是候选重构？后续以谁为准？ |
| Q2 | **死 Gateway**：`aiGateway.js` 写得规范却无任何运行时 require（0 接线） | 是 MVP 有意延期还是疏忽？直连 `aiService.callHunyuan` 是否临时过渡？接线计划？ |
| Q3 | **出题框架**：`QuestionBlueprint` 模型在 `src/` 内 0 引用，种子仅 2 条且 contentData 结构不匹配 | 考试到底由谁生成？硬编码 Prompt 那版是终态还是过渡？ |
| Q4 | **目标语言自定义**：`language.html` 仅母语可自由输入，目标语言是固定卡片 | 是设计取舍还是待补？（老板总纲要求：目标语言也须可自由输入） |
| Q5 | **30 天口语速成**：`LearningPlan` 模型在，但无 `daily_learning_plans`/`speech_evaluation_records`，账簿 26.11 判 0% | 到底做没做？做在哪？ |
| Q6 | **GLOI**：v3.2.1 列为基石，schema 内 0 个 GLOI 表 | 是范围外还是被砍？若要做，哪些表优先级最高？ |
| Q7 | **成本熔断**：每日 50 额度耗尽后行为？ | 阻断 / 降级到资产缓存 / 仍直连？有无成本硬上限开关？ |
| Q8 | **资产回填**：`learning_content` 资产库如何填充？ | AI 自动回填 / 运营手工 / 当前为空导致每次直连？有无回填任务？ |

**回执格式**：逐条编号作答，写入 `docs/TRAE_回执_Q1-Q8.md` 并提交；不许口头带过。

---

## 二、M0 收口治理（P0，回执通过后立即启动）

**目标：消灭架构违规，确立单一真值源。**

1. **统一双世界（G9）**：按 Q1 结论确定 canonical（监理预判：`src/`(JS) + 根静态 HTML 为线上部署态即 canonical）；冻结/归档另一套（React/TS 移入 `_archive/` 或删除）；删除重复 `schema.prisma`，全库只留一份。
2. **aiGateway 接线为唯一入口（G1）**：
   - `aiController.js`（行47/130/168/212/261）、`aiTutorService.js`（行100）全部改为调用 `aiGateway`；
   - `aiService.callHunyuan` 只允许被 `aiGateway` 内部调用（可加运行时断言/日志防绕过）；
   - 验收标准：全局搜索业务层 0 处直连；`aiRequestLog` 记录 100% 请求。
3. **Prompt 全部入库（G3 前置）**：把 aiController 内联的 教师/翻译引擎/语法器/出题引擎 4 组 Prompt 迁入 `aiPromptTemplate`（带版本号），gateway 的 PromptBuilder 读库渲染。

**交付**：`RC_READY_M0` + 证据（无直连搜索结果、aiRequestLog 样例、Prompt 库记录）。

---

## 三、M1 语言根基（GLOI + 自定义语言）

1. **GLOI 表落地（G4）**：按 Q6 回执的优先级，最少先落地 `language_identities`、`content_language_versions`、`translation_memory_entries`、`terminology_entries`（UUID 主键，Prisma db push 后必 generate）。
2. **目标语言自由文本输入（G7）**：`language.html` 目标语言增加与母语一致的自由输入框，后端 `UserLearningLanguage` 接受任意语言标识（AI 归一化为 BCP-47 + 显示名）。
3. **资产生命周期状态机（G2）**：`LearningContent` 增加状态字段 Generated→Validated→Indexed→Reusable→Premium→Archived，gateway 生成后自动落库为 Generated 资产。

**交付**：`RC_READY_M1` + 证据（GLOI 表查询、任意语言（如"粤语"/"斯瓦希里语"）注册成功、资产落库记录）。

---

## 四、M2 内容引擎（产品核心）

1. **框架驱动出题（G6）**：接通 `QuestionBlueprint`/`CourseBlueprint` → gateway → AI 生成 → 结构校验 → 落库为资产；补齐种子蓝本（听/说/读/写各题型），contentData 结构与消费端严格对齐。
2. **消灭硬编码内容（G10）**：`learn.html`（行617 硬编码词汇）、`placement.html`（6 题硬编码）改为调用后端 AI 动态生成接口，语言跟随用户所选目标语言。
3. **30 天口语速成（G8，P0）**：
   - 建表：`daily_learning_plans`、`speech_evaluation_records`（UUID）；
   - 服务：`dailyPlanService`（AI 生成 30 天个性化计划）、`speechEvaluateService`（口语评测）；
   - 接口 + 前端页面接通，进度可视化。

**交付**：`RC_READY_M2` + 证据（同一蓝本生成两种语言试题、placement 动态出题、30 天计划 API 全链路响应）。

---

## 五、M3 闭环增强

1. **用户意图识别层（G5）**：入口统一识别意图 → 路由到对应能力（学习/考试/伴读/翻译）。
2. **成本熔断/降级（G11）**：额度或成本超阈值 → 先查资产库/缓存 → 命中则 0 成本返回，未命中返回明确降级提示；熔断开关入 `systemConfig`。
3. **社交/伴读后端联动（G12）**：`discover.html`/`ai-companion-builder.html` 与 `companion_settings` 真实联通并验证。

**交付**：`RC_READY_M3` + 证据。

---

## 六、M4 上市运营

1. **四层验收**：接口层（真实 token 全接口 200/401 正确）；数据层（库内记录一致）；体验层（无痕浏览器全流程）；治理层（aiRequestLog 全记录、全局 0 直连）。
2. **支付**：腾讯支付接口审核通过后接入（当前冻结非永久，预留接口）。
3. **APP 打包**：Capacitor 包裹 `/www/xuewaiyu` 静态前端，后端复用 `xuewaiyu-backend`，产出 Android APK（iOS 后续）。
4. **公司站**：`yandao-company` 下载页更新版本与下载链接。

**交付**：`RC_READY_LAUNCH` + 完整验收报告 → 监理终审 → 部署上线。

---

## 七、汇报纪律

- 每阶段回执写入 `docs/`，同时通知监理更新总账簿；
- 遇到与蓝图冲突、技术不可行、需要老板决策的事项：**立即停下书面上报，不许自作主张改架构**；
- 所有提交走 Git（GitHub `wzmpa18/AILOS` main），提交信息带阶段号（如 `M0-1: aiGateway接线`）。

> **现在的唯一动作：提交 Q1–Q8 回执。回执未过审，M0 不得开工。**
