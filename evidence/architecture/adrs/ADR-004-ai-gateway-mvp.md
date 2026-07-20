# ADR-004: AI Gateway MVP 成本控制与日志规范

- **日期**: 2026-07-19
- **状态**: Accepted
- **决策者**: AILOS Architecture Team
- **关联旧项目路径**: `E:\TRAE SOLO\server.js` (第 42 行 AI 路由), `E:\TRAE SOLO\degradationService.js` (降级矩阵), `E:\TRAE SOLO\src\config\index.js` (混元配置)

## Context（背景）

### 旧项目现状

旧项目（言道学外语APP v1.0.0）的 AI 调用架构存在严重问题。经 Phase 0.2 勘察，确认以下事实：

1. **AI 调用点分散在 6 处**：
   - `server.js` 第 42 行：AI 路由挂载 `/api/ai`
   - `server.js`：AI 代理健康探测
   - `degradationService.js`：降级功能矩阵（含 `ai_companion` 等）
   - `qaInspector.js`：QA 巡检 `POST /api/ai/chat`
   - `monitorService.js`：AI 指标采集（`ai_call_logs` 表）
   - `src/config/index.js`：混元环境变量配置（第 30-36 行）

2. **无统一入口**：各模块直接调用 AI 能力，无统一的请求路由、限流、缓存、日志机制
3. **无成本控制**：无 Token 计数、无额度管理、无熔断机制，AI 调用成本不可控
4. **硬编码混元代理地址**：`server.js` 中硬编码 `http://127.0.0.1:8787`，无法灵活切换模型供应商
5. **未发现任何其他模型厂商引用**：仅接入了腾讯混元，无 OpenAI、Azure、Anthropic、Gemini、DeepSeek、Qwen 等

### 架构蓝图要求

根据 AILOS v3.2.1 架构蓝图 **第六卷 AI Layer**，AI Gateway 的核心权责包括：

- 接收所有模块的 AI 请求，统一调度分发（唯一入口原则）
- 成本判断前置：所有请求第一步执行成本与权限校验
- 三级缓存校验与语义级匹配
- 按场景 + 用户权益自动匹配最优成本模型
- 注入对应版本的标准化 Prompt
- 全链路日志记录、成本统计、限流熔断控制
- 语言注入强制链路：所有 AI 请求必须经过 Language Resolver 注入完整语言上下文

## Decision（决策）

### 核心决策

建立 **MVP AI Gateway 统一调用入口**，所有 AI 请求有且仅有一个合法入口。采用 **资产优先策略**：内容资产库 -> Redis 缓存 -> 大模型调用，前三层命中即返回，不进入大模型调用流程。

### 技术方案

#### MVP 架构

```
Business Module
       |
       v
AI Gateway（唯一入口）
       |
       |-- 1. 成本与权限校验（用户额度检查）
       |-- 2. 资产命中检查（learning_content 表）
       |-- 3. 缓存命中检查（Redis 语义匹配）
       |-- 4. Language Resolver 注入语言上下文
       |-- 5. Prompt Composer 组装最终 Prompt
       |-- 6. 模型调用（腾讯混元）
       |-- 7. 全链路日志记录
       |-- 8. 内容审核（安全 + 质量 + 版权）
       |-- 9. 返回结果
```

#### 新增数据表

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `ai_prompt_template` | scenario (learning/companion/domain/agent/system), template_version, template_content, variables (JSON), status, created_at | 版本化场景 Prompt 模板，集中管理、可灰度、可审计 |
| `ai_request_log` | user_id, request_type (chat/generate/translate/analyze), model_name, prompt_template_version, token_count (input/output/total), cost_amount, latency_ms, asset_hit (boolean), cache_hit (boolean), language_context (JSON), response_quality_score, created_at | 全链路 AI 调用日志，含资产命中标记、请求类型、语言上下文 |

#### 资产优先策略

请求处理优先级（严格按顺序，前一级满足绝不进入后一级）：

| 优先级 | 决策层 | 说明 | 成本 |
|--------|--------|------|------|
| 1 | 精确结果缓存 | 相同请求（含完整语言上下文）命中 Redis 缓存 | 约 0 |
| 2 | 内容资产库 | `learning_content` 表中已存在的高质量复用内容 | 约 0 |
| 3 | 大模型调用 | 腾讯混元 API，前两级未命中 | 按 Token 计费 |

#### 日志规范

所有 AI 请求必须记录以下关键字段：

- `asset_hit`：是否命中内容资产库（布尔值，用于计算资产复用率 -- 北极星核心指标）
- `request_type`：请求类型枚举（chat/generate/translate/analyze）
- `language_context`：完整语言上下文 JSON（input_identity、output_identity、explanation_identity）
- `token_count`：输入/输出/总 Token 数
- `cost_amount`：本次调用成本（用于成本归因和北极星指标 AI Cost per Learning Session）
- `prompt_template_version`：使用的 Prompt 模板版本号（用于质量回溯）

## Consequences（影响）

### 正面影响

1. **成本可量化**：所有 AI 调用成本记录在 `ai_request_log` 表，可精确统计北极星指标（Asset Reuse Rate、AI Cost per Learning Session）
2. **调用可追溯**：全链路日志记录，每次 AI 调用可追溯到具体用户、场景、Prompt 版本、语言上下文
3. **资产复用可度量**：`asset_hit` 字段直接支撑资产复用率统计，驱动内容资产建设决策
4. **Prompt 版本化**：`ai_prompt_template` 表支持 Prompt 的灰度发布、快速回滚、影响分析

### 负面影响

1. **引入额外延迟**：Gateway 层增加缓存查询、资产命中检查、权限校验、日志写入等步骤，增加约 10-50ms 延迟
2. **单点风险**：AI Gateway 作为唯一入口，其可用性直接影响全系统 AI 能力，需高可用部署
3. **日志存储成本**：`ai_request_log` 表随调用量线性增长，需设计归档策略

## Constraints（边界约束）

- **MVP 仅支持腾讯混元单一模型**：不接入多模型供应商，`model_name` 字段固定为 `hunyuan`，多模型路由在 Phase 2 实现
- **暂缓智能降级**：MVP 仅支持简单的熔断（连续失败 N 次后返回兜底内容），不支持基于模型质量/成本的智能降级路由
- **暂缓复杂阶梯计费**：MVP 仅记录 Token 和成本，不实现按用户等级、时段、场景的阶梯计费策略
- **暂不实现语义缓存匹配**：MVP 的 Redis 缓存仅支持精确 Key 匹配（`hash(model_id + prompt_version + language_identity_hash + ...)`），不支持向量相似度 >= 0.92 的语义匹配
- **暂不接入 Language Resolver 完整链路**：MVP 仅记录 `language_context` JSON，不强制 Language Resolver 注入，完整 GLOI 语言注入链路由 ADR-002 定义，Phase 2 对齐

## Future Iterations（远期迭代）

- **Phase 2**: 多模型调度（接入 OpenAI、DeepSeek、Qwen 等），按场景 + 成本 + 质量自动路由
- **Phase 2**: 智能降级引擎，根据模型可用性、响应时间、成本自动切换最优模型
- **Phase 2**: 语义缓存匹配，向量相似度 >= 0.92 强制命中缓存
- **Phase 3**: 阶梯计费策略，按用户等级、时段、场景、Token 消耗量差异化定价
- **Phase 3**: AI Agent 工作流，支持多 Agent 协作、任务分解、并行执行
- **Phase 4**: Cost Simulation Engine（成本预测模拟器），上线前预估 AI 成本
- **Phase 4**: Model Competition Engine（模型竞争引擎），A/B 测试不同模型效果

## References（参考）

- [AILOS v3.2.1 架构蓝图 - 第六卷 AI Layer (AI Gateway)](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 第二卷 宪法层 第 1 条 AI 调用宪法](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [AILOS v3.2.1 架构蓝图 - 第二卷 宪法层 第 4 条 成本控制宪法](E:\AILOS_Project\10_ARCHITECTURE_BLUEPRINT.md)
- [Phase 0.2 旧项目资产勘察报告 - 五、AI 调用点](E:\AILOS_Project\evidence\discovery\legacy-commercial-migration-facts.md)
- 旧项目 AI 路由: `E:\TRAE SOLO\server.js` (第 42 行)
- 旧项目降级矩阵: `E:\TRAE SOLO\degradationService.js`
- 旧项目混元配置: `E:\TRAE SOLO\src\config\index.js` (第 30-36 行)
