# ADR-003: Goal 驱动五层学习数据模型

- **日期**: 2026-07-19
- **状态**: Accepted
- **决策者**: AILOS Architecture Team
- **关联旧项目路径**: `E:\TRAE SOLO\prisma\schema.prisma` (LearningProgress 模型)

## Context（背景）

### 旧项目现状

旧项目（言道学外语APP v1.0.0）的学习数据模型极度简化。经 Phase 0.2 勘察，确认以下事实：

1. `LearningProgress` 表（`prisma/schema.prisma`）仅包含 `language`、`level`、`totalWords`、`totalLessons`、`currentStreak`、`isDirty` 共 6 个业务字段
2. **无学习目标**：系统无法定义"我想在 3 个月内达到 N2 水平"之类目标，所有学习行为无方向性
3. **无能力画像**：无 `user_learning_profile`、`learning_skill` 等表，无法刻画用户听说读写各维度能力
4. **无长期记忆**：无 `learning_memory`、`learning_event` 等表，用户学习历史无法追溯，AI 无法形成对用户的长期认知
5. 勘察报告中明确列出缺失项：`user_learning_profile`、`learning_event`、`learning_memory`、`learning_skill`

### 架构蓝图要求

根据 AILOS v3.2.1 架构蓝图 **第四卷 Digital Identity Twin**，用户学习数据应包含：

- Profile：静态属性 + 行为模式 + 学习能力 + 情绪模式 + 偏好
- Timeline：成功/失败/暂停/转向/成长历史
- Knowledge Graph：跨 Domain 知识图谱
- Memory：长期记忆

蓝图还定义了 **Intent -> Goal -> Mission -> Plan -> Execution Graph -> Workflow -> Capability -> AI** 的唯一执行链，学习目标（Goal）是驱动全链路的核心源头。

## Decision（决策）

### 核心决策

采用 **Goal 驱动五层学习数据模型**，以学习目标为全链路驱动源头，自上而下依次为：

1. **Goal（学习目标）**：用户定义的长期/中期学习目标（如"通过 JLPT N2"、"掌握 2000 个商务词汇"）
2. **Plan（学习计划）**：由 AI 根据 Goal 拆解出的阶段性计划，含时间线、里程碑、资源分配
3. **Event（学习事件）**：每次学习活动的事件流水记录，仅做记录不做反向改写
4. **Ability Model（能力画像）**：基于 Event 异步计算的多维度能力模型（词汇、语法、听力、口语、阅读、写作）
5. **Profile（学习画像）** + **Memory（长期记忆）**：用户整体学习特征 + AI 长期记忆

### 技术方案

#### 新增数据表

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `learning_goal` | user_id, workspace_id, language, goal_type (exam/vocabulary/fluency/certification), target_level, target_date, status, priority | 用户学习目标，一个用户可拥有多个目标，但同一语种仅一个活跃目标 |
| `learning_plan` | goal_id, plan_type (daily/weekly/monthly/phase), start_date, end_date, ai_generated_plan (JSON), status, progress_percentage | AI 根据 Goal 生成的阶段性学习计划 |
| `learning_event` | user_id, workspace_id, language, event_type (vocabulary_practice/grammar_exercise/listening/reading/speaking/writing/quiz/review), event_data (JSON), duration_seconds, score, ai_session_id | 学习事件流水，以 insert-only 模式记录，不反向改写 Goal 或 Plan |
| `learning_ability_model` | user_id, language, dimension (vocabulary/grammar/listening/speaking/reading/writing), score, confidence, last_updated | 能力画像，基于 Event 异步批量更新，不同语种完全隔离 |
| `learning_profile` | user_id, preferred_learning_style (visual/auditory/kinesthetic/reading), preferred_time_of_day, avg_session_duration, attention_span, motivation_level | 学习画像，刻画用户学习习惯与偏好 |
| `learning_memory` | user_id, memory_type (factual/knowledge/experience/pattern), content (JSON), importance_score, decay_rate, last_recalled_at | 长期记忆，AI 对用户学习历史的认知积累 |

#### 核心设计原则

1. **Event 仅做流水，不反向改写目标**：`learning_event` 是 append-only 流水表，只记录发生的事实，不修改 `learning_goal` 或 `learning_plan` 的状态。Goal/Plan 的进度更新由独立的异步任务完成
2. **Ability Model 异步更新**：能力画像不随每次 Event 实时更新，而是通过定时任务（如每日凌晨）批量计算，避免高频写入
3. **不同语种完全隔离**：`learning_ability_model`、`learning_goal` 按 `language` 字段隔离，英语学习数据不影响日语能力画像
4. **User ID 归属**：所有学习数据归属 UID，而非 Workspace，用户切换组织后学习数据不丢失（但 `workspace_id` 字段保留以支持数据隔离查询）

## Consequences（影响）

### 正面影响

1. **目标驱动学习**：AI 根据用户 Goal 动态生成 Plan，学习路径千人千面，而非固定课程
2. **能力画像可量化**：从单一 `level` 字段升级为六维度能力评分，精准定位薄弱环节
3. **AI 长期记忆**：`learning_memory` 表让 AI 真正"记住"用户的学习历史、常见错误、擅长领域
4. **数据可追溯**：`learning_event` 流水表完整记录学习历程，支持学习效果分析与回溯

### 负面影响

1. **数据库复杂度显著提升**：从 1 张 `LearningProgress` 表扩展为 6 张新表，查询复杂度增加
2. **异步一致性**：Ability Model 异步更新意味着能力画像存在延迟（最多 24 小时），不适合实时能力判定场景
3. **存储成本**：`learning_event` append-only 模式持续增长，需设计归档策略

## Constraints（边界约束）

- **Phase 1 仅实现基础数据模型**：6 张新表的 CRUD 操作 + Goal->Plan 的简单 AI 拆解，不包含复杂自适应算法
- **Ability Model 使用简单加权算法**：Phase 1 不引入机器学习模型，能力评分基于 Event 的简单加权平均
- **Memory 仅支持事实型记忆**：Phase 1 的 `learning_memory` 仅存储 AI 生成的用户学习事实摘要，不包含知识图谱、社交关系等复杂记忆
- **旧表保留**：`LearningProgress` 表保留但标记为 deprecated，逐步迁移至新模型

## Future Iterations（远期迭代）

- **Phase 2**: AI 自适应路径规划，根据 Ability Model 实时调整学习路径，自动跳过已掌握内容、强化薄弱环节
- **Phase 2**: 学习预测模型，基于历史 Event 预测用户完成 Goal 的时间、可能遇到的瓶颈
- **Phase 3**: 跨语种能力迁移，利用已掌握语种的能力画像加速新语种学习（如利用英语基础加速法语学习）
- **Phase 3**: Knowledge Graph（知识图谱），将用户学习内容建立跨领域知识关联
- **Phase 4**: 协作学习与群体智能，基于相似用户的学习路径优化群体推荐

## References（参考）

- [AILOS v3.2.1 架构蓝图 - 第四卷 Identity Layer (Digital Identity Twin)](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 第七卷 Learning Layer](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [Phase 0.2 旧项目资产勘察报告 - 三、数据模型核心事实](E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md)
- 旧项目 LearningProgress 模型: `E:\TRAE SOLO\prisma\schema.prisma`
