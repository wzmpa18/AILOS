# ADR-005: Content Asset 资产生命周期管理

- **日期**: 2026-07-19
- **状态**: Accepted
- **决策者**: AILOS Architecture Team
- **关联旧项目路径**: 无（全新资产，旧项目无内容资产库）

## Context（背景）

### 旧项目现状

旧项目（言道学外语APP v1.0.0）无内容资产库。经 Phase 0.2 勘察，确认以下事实：

1. **无内容资产表**：数据库中不存在任何内容存储、复用、版本管理相关表
2. **所有 AI 生成内容一次性消费**：AI 生成的课程内容、练习题目、学习材料在输出后即被丢弃，无复用机制
3. **无复用机制**：同一场景的 AI 请求（如"生成 10 道 N3 语法选择题"）每次都会重新调用大模型，造成重复成本
4. **无质量评估**：AI 生成内容无质量评分、无审核流程，低质量内容直接输出给用户
5. **无生命周期管理**：内容无版本概念，无状态流转，无归档机制

勘察报告中"商业化资产状态"明确标注：**内容系统 -- 未发现相关实现**。

### 架构蓝图要求

根据 AILOS v3.2.1 架构蓝图：

- **资产第一原则**（宪法原则四）：AI 生成不是终点，资产沉淀才是终点。所有 AI 生成且通过质量校验的内容，必须进入资产生命周期管理，成为可复用的平台资产
- **北极星核心指标**：Asset Reuse Rate（资产复用率）是 AILOS 三大北极星指标之首，衡量 AI 请求中通过资产复用满足的比例
- **资产生命周期管理原则**（宪法 3.3）：Generated -> Validated -> Indexed -> Reusable -> Premium Asset -> Archived
- **核心逻辑**：AILOS 不是追求生成最多 AI 内容的系统，而是追求资产复用率最高、边际成本最低、学习效果最好的系统

## Decision（决策）

### 核心决策

所有 AI 输出素材（课程内容、练习题目、学习材料、翻译结果、解释说明）标准化入库，建立完整的 **生命周期状态机**。后续同类请求优先从资产库复用，仅资产库无匹配时才触发 AI 重新生成。

### 技术方案

#### 生命周期状态机

```
draft（草稿）
    |
    v
generating（AI 生成中）
    |
    v
reviewing（审核中）
    |
    +---> failed（审核不通过，进入重生成队列）
    |
    v
approved（审核通过）
    |
    v
published（已发布，进入复用池）
    |
    v
archived（归档，退出复用池）
```

状态流转规则：

| 状态 | 说明 | 可流转至 |
|------|------|---------|
| `draft` | 初始草稿，内容尚未生成 | generating |
| `generating` | AI 正在生成内容 | reviewing, failed |
| `reviewing` | 人工/自动审核中 | approved, failed |
| `approved` | 审核通过，等待发布 | published |
| `published` | 已发布，进入复用池，可被后续请求命中 | archived |
| `archived` | 已归档，退出复用池，不再参与匹配 | -- |
| `failed` | 生成/审核失败，进入重生成队列 | generating |

#### 新增数据表

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `learning_content` | content_type (course/quiz/explanation/translation/exercise), source_language, target_language, explanation_language, difficulty_level (A1-C2), content_body (JSON), content_version, status, quality_score (0-100), reuse_count, ai_session_id, prompt_template_version, generated_at, published_at, archived_at | 核心内容资产表，存储所有 AI 生成的学习内容，支持多语种、多版本、多难度等级 |

#### 关键字段说明

- `source_language` / `target_language` / `explanation_language`：三语种字段，完整描述内容的多语言属性（如源语言=中文、目标语言=日文、解释语言=中文）
- `difficulty_level`：基于 CEFR 标准（A1-C2），支持按难度级别匹配
- `content_version`：语义化版本号，支持内容迭代追溯
- `quality_score`：综合质量评分（0-100），`approved` 状态且评分 >= 60 方可进入复用池
- `reuse_count`：复用次数计数器，高复用内容自动晋级优先调度

#### 资产复用匹配逻辑

当 AI 请求进入 Gateway 时，优先执行资产匹配：

1. 根据 `content_type` + `source_language` + `target_language` + `explanation_language` + `difficulty_level` 构建查询条件
2. 在 `learning_content` 表中查询 `status = 'published'` 且 `quality_score >= 60` 的内容
3. 按 `reuse_count DESC, quality_score DESC` 排序，取 Top 1
4. 命中后更新 `reuse_count` +1，记录 `asset_hit = true` 到 `ai_request_log`
5. 未命中则进入 AI 生成流程，生成后的内容进入 `draft` 状态

## Consequences（影响）

### 正面影响

1. **系统性降低 AI 成本**：随着资产库积累，Asset Reuse Rate 持续提升，单位请求的边际成本趋近于零
2. **内容质量可控**：标准化审核流程（`draft -> generating -> reviewing -> approved -> published`）确保只有高质量内容进入复用池
3. **可度量的北极星指标**：`reuse_count`、`quality_score`、`asset_hit` 等字段直接支撑 Asset Reuse Rate 计算
4. **长期竞争力**：AILOS 的长期竞争力不来自单一模型能力，而来自知识资产规模、质量和复用效率 -- 本 ADR 是这一战略的落地基础

### 负面影响

1. **存储成本**：所有 AI 生成内容持久化存储，随业务增长持续膨胀，需设计冷热数据分离和归档策略
2. **审核瓶颈**：`reviewing` 状态依赖人工审核，可能成为内容产出瓶颈，Phase 2 需引入自动质量评估
3. **冷启动问题**：系统初期资产库为空，Asset Reuse Rate 为 0，所有请求需走 AI 生成，前期成本较高

## Constraints（边界约束）

- **Phase 1 仅实现状态机 + 基础复用**：完整的状态流转 + 基于 `content_type`/`language`/`difficulty_level` 的精确匹配复用
- **自动质量评估暂不实现**：Phase 1 的 `reviewing` 状态依赖人工审核，不引入自动评分模型
- **语义相似匹配暂不实现**：Phase 1 仅支持精确字段匹配（如 content_type + language + difficulty），不支持向量相似度语义匹配
- **内容 A/B 测试暂不实现**：Phase 1 不进行多版本内容的效果对比
- **旧项目无迁移内容**：此 ADR 为全新资产，无旧项目数据迁移需求

## Future Iterations（远期迭代）

- **Phase 2**: 自动质量评分，AI 生成内容自动评估语法正确性、教学有效性、难度匹配度，减少人工审核依赖
- **Phase 2**: 语义相似匹配，基于向量化（Embedding）实现内容语义级匹配，相似度 >= 0.92 的内容自动复用
- **Phase 3**: 内容 A/B 测试，多版本内容效果对比，自动淘汰低效内容、推广高效内容
- **Phase 3**: 内容个性化推荐，基于用户 Ability Model 和 Learning Profile 自动匹配最优内容
- **Phase 4**: 内容共创与社区资产，允许教师/机构上传自有内容，经审核后进入公共资产池
- **Phase 4**: 跨语言内容迁移，高质量内容自动翻译为多语言版本，进入不同语言资产池

## References（参考）

- [AILOS v3.2.1 架构蓝图 - 第二卷 宪法层 原则四：资产第一原则](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 第二卷 宪法层 3.3 资产生命周期管理原则](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 第七卷 Learning Layer (Asset Lifecycle Management)](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 0.3 北极星核心指标](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [Phase 0.2 旧项目资产勘察报告 - 七、商业化资产状态](E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md)
