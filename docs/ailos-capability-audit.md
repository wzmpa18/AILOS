# AILOS 能力审计报告

**审计日期**: 2026-07-18  
**审计范围**: 四层架构全量代码（Foundation → AI Kernel → System Services → Applications）  
**审计方法**: 代码级逐文件审计，以实际代码为准，不接受推测  
**核心结论**: AI Kernel 编排层达到生产级，但基础设施依赖（Cache/Auth/EventBus/Log）和安全审核仍为 Mock/骨架；所有业务模块为 Phase 1 原型（内存存储）；前端为零业务代码的空 Expo 模板

---

## 一、AI Kernel 审计结果（12 项）

| 序号 | 能力 | 状态 | 代码路径 | 当前能力描述 | 缺失部分 | 依赖 | 建议优先级 |
|------|------|------|----------|-------------|---------|------|-----------|
| 1 | **AI Gateway** | ✅ | `ailos-server/src/modules/gateway/ai-gateway.service.ts` (515行) | 完整 12 步编排流程：Admission→Auth→Cost→Cache→Template→Route→Prompt→ModelCall→Audit→Writeback→Log→Response。真实调用混元 API，含重试和五级降级 | 缺少请求体 DTO 校验装饰器、缺少 Swagger 文档注解 | 无 | Stage A |
| 2 | **Model Router** | ✅ | `ailos-server/src/modules/gateway/model-router.service.ts` (138行) | 9 场景→模型映射，Provider 扩展机制已预留（registerProvider），含成本数据 | 所有 9 场景均映射到同一模型 `hunyuan-turbo`，无场景差异化；定价硬编码未与实时 API 同步；仅支持腾讯混元单 Provider | 无 | Stage A |
| 3 | **Prompt Builder** | ✅ | `ailos-server/src/modules/gateway/prompt-injection.service.ts` (234行) | 11 个场景 Prompt 模板（9 业务 + 1 safety + 1 fallback），版本化管理 v1.0.0，`{variable}` 占位符替换，`updatePrompt()` 运行时更新 | 所有 Prompt 硬编码在 `initializePromptLibrary()` 中，未从外部配置/数据库加载；缺多语言 Prompt 模板 | 无 | Stage A |
| 4 | **Capability Registry** | ❌ | 无 | 无任何能力注册中心代码 | 完全缺失：无能力注册/发现/版本管理/依赖声明机制 | 无 | Stage B |
| 5 | **Workflow Engine** | ❌ | 无 | 无工作流引擎 | 完全缺失：12 步编排为硬编码线性流程，不可配置、不可扩展、不可编排自定义工作流 | 无 | Stage B |
| 6 | **Tool Registry** | ❌ | 无 | 无工具注册中心 | 完全缺失：AI Gateway 无 Function Calling / Tool Use 能力，无工具注册、Schema 定义、调用执行框架 | 无 | Stage B |
| 7 | **State Manager** | ❌ | 无 | 无状态管理器 | 完全缺失：所有状态（会话上下文、用户状态、学习进度）存于内存 Map，无持久化、无分布式、无状态恢复 | 无 | Stage A |
| 8 | **Policy Engine** | 🟡 | `ailos-server/src/modules/gateway/cost-circuit-breaker.service.ts` (185行) | 三级成本熔断（用户/模块/全局），日预算 + 配额管理，动态配置 `updateConfig()` | 仅覆盖成本策略，无安全策略、内容策略、流量策略、AB 测试策略；依赖 Mock Cache 存储策略状态 | Cache | Stage A |
| 9 | **Event Bus** | ❌ | `ailos-server/src/infrastructure/event-bus/event-bus.service.ts` (19行) | 全局模块已注册，`publish()` 和 `subscribe()` 方法体均为 `/* TODO: Phase 1 */` | 完全缺失：零实现，模块间无事件通信机制 | 无 | Stage A |
| 10 | **Memory Manager** | 🟡 | `ailos-server/src/modules/companion-engine/companion-engine.service.ts` (298行) | 陪伴引擎内置记忆系统：创建/检索/淘汰（上限 1000，按重要性排序），情绪日志 + 成长事件 | 记忆检索为关键词匹配（非向量检索），内存存储无持久化，不可跨模块复用；不是独立的 Memory Manager 服务 | Cache, VectorDB | Stage B |
| 11 | **Context Manager** | 🟡 | 隐式分布于 `ai-gateway.service.ts` 的 12 步流程中 | 请求上下文在 12 步流程中传递（GatewayRequest → GatewayResponse），含 userId/scene/domain/structuredParams | 无独立 Context Manager 服务；无会话上下文持久化；无多轮对话历史管理；无上下文窗口压缩 | 无 | Stage A |
| 12 | **Permission Manager** | ❌ | `ailos-server/src/infrastructure/auth/auth.service.ts` (29行) | AuthService 为纯 Mock：`validateToken()` 硬编码返回 `{ valid: true, userId: 'mock_user', level: 'free' }`，`checkPermission()` 始终返回 `true`，AuthGuard 始终放行 | 完全缺失：无真实用户认证、无 JWT 验证、无 RBAC/ABAC 权限模型、无 API Key 验证 | Auth | Stage A |

**状态说明**：✅ = 已实现，可直接使用 | 🟡 = 部分实现，需要补全 | ❌ = 未实现，需要新建

---

## 二、System Services 审计结果（9 项）

| 序号 | 服务 | 状态 | 代码路径 | 代码行数 | 方法数 | API端点 | 核心评价 |
|------|------|------|----------|---------|--------|---------|---------|
| 1 | **Plugin System** | 🟡 | `modules/plugins/` | ~193 | 11 | 0 | 插件框架完整（注册/加载/卸载/热插拔/灰度），5 个语言插件子目录有配置文件；缺真实沙箱加载和持久化 |
| 2 | **Learning Engine** | 🟡 | `modules/learning-engine/` | ~368 | 13 | 8 | 学习路径生成、自适应难度调节、测评系统、进度追踪、知识追踪完整；路径节点为硬编码生成，未集成 AI Gateway |
| 3 | **Companion Engine** | 🟡 | `modules/companion-engine/` | ~355 | 13 | 8 | 人设系统（5 维性格）、记忆系统、性格演化、成长系统完整；聊天响应为 Mock 模板，记忆检索为关键词匹配 |
| 4 | **Asset Center** | 🟡 | `modules/asset-center/` | ~979 | 40+ | 15 | 6 子服务（用户资产/知识资产/反馈/同步/备份/版本兼容），架构最完整；知识资产有搜索/审核/晋级机制；全量内存存储 |
| 5 | **Entitlement Center** | 🟡 | `modules/entitlement-center/` | ~208 | 8 | 6 | 三级会员（FREE/MEMBER/PREMIUM）+ 配额管理 + 功能/模型权限检查完整；过期自动降级逻辑正确 |
| 6 | **Community** | 🟡 | `modules/community/` | ~178 | 14 | 8 | 关注/打卡/动态/评论/点赞/排行榜/分享功能完整；打卡连续签到 streak 计算正确 |
| 7 | **Marketing** | 🟡 | `modules/marketing/` | ~204 | 10 | 8 | 二级分销（一级 10% + 二级 5%）、佣金冻结、提现审核、签到积分完整；`purchaseMembership` 未联动权益中心 |
| 8 | **Developer Center** | 🟡 | `modules/developer-center/` | ~77 | 6 | 3 | 仅 API Key 管理 + 插件注册；无 API 配额/文档/沙箱/统计 |
| 9 | **Admin** | 🟡 | `modules/admin/` | ~185 | 12 | 9 | 模块开关/配置管理/审计日志/灰度管理框架完整；`getUserList`/`getCostDashboard`/`freezeUser` 等核心功能为占位 |

**关键发现**：9 个 System Services 模块全部为 **Phase 1 原型**，业务逻辑骨架完整但全部使用 `Map`/`Array` 内存存储，重启即丢失数据，无任何 ORM（Prisma/TypeORM）调用。DTO 定义完整，模块间解耦设计良好。

---

## 三、Foundation 层审计结果

| 序号 | 模块 | 状态 | 文件数 | 核心评价 |
|------|------|------|--------|---------|
| 1 | **CI/CD** | ✅ | 1 | v2.0.0，4 阶段流水线（Lint→Build&Test→Docker→Deploy），含 MySQL 8.0 + Redis 7 服务容器；缺少前端 CI |
| 2 | **Prisma Schema** | ✅ | 1 (525行) | 25 个模型，10 个枚举，七库分离，映射规范完整；与 SQL schema 存在表结构差异；`package.json` 未包含 `@prisma/client` 依赖 |
| 3 | **SQL Schemas** | ✅ | 7 | 七库独立 DDL（user/learning/companion/knowledge/social/marketing/system），独立账号 + 权限分级；与 Prisma schema 未完全对齐 |
| 4 | **Deploy** | ✅ | 5 | docker-compose 7 服务（Nginx/AILOS×2/MySQL/Redis/RabbitMQ/Prometheus/Grafana），Nginx 安全头+HSTS+限流；缺 SSL 证书、Dashboard、告警规则 |
| 5 | **Env Config** | ✅ | 3 | dev/staging/prod 三环境模板，覆盖数据库/缓存/队列/JWT/AI API/日志/监控/灰度；密钥使用 `CHANGE_ME` 占位符 |
| 6 | **Compliance** | ✅ | 5 | 30 错误码 + 3 级扫描 + pre-commit hook，CI/CD 已集成 |
| 7 | **Server Dependencies** | ❌ | 1 | `package.json` 仅含 NestJS 基础骨架（6 个运行时依赖），缺 `@prisma/client`/`mysql2`/`@nestjs/jwt`/`ioredis`/`amqplib`/`class-validator`/`@nestjs/config` 等 8+ 核心依赖 |
| 8 | **Event Bus** | ❌ | 1 | 零实现，`publish()`/`subscribe()` 均为 TODO |
| 9 | **Auth** | ❌ | 2 | 纯 Mock，AuthGuard 始终放行，零安全防护 |
| 10 | **Cache** | 🟡 | 1 | L1 内存缓存已实现（TTL+LRU），L2 Redis/L3 持久化未实现；`semanticMatch` 为 Jaccard 相似度（非向量检索） |
| 11 | **Logging** | 🟡 | 2 | HTTP 请求拦截器已实现；结构化日志服务（操作/AI调用/审计）全部 TODO |

---

## 四、Applications 层审计结果

| 模块 | 状态 | 文件数 | 核心评价 |
|------|------|--------|---------|
| **ailos-app (前端)** | ❌ | 14 | 仅 `npx create-expo-app` 初始模板，`App.tsx` 仅渲染一行默认文字。零业务代码：无页面/组件/导航/状态管理/API 调用/认证/UI 库。与后端 25 个模型、7 个业务库的架构完全不对应 |

---

## 五、依赖关系确认

| 能力 | 依赖项 | 状态 | 是否已满足 |
|------|--------|------|-----------|
| AI Gateway | 无（基础能力） | ✅ | — |
| Model Router | AI Gateway | ✅ | 已集成在 Gateway 的 Step 6 |
| Prompt Builder | AI Gateway | ✅ | 已集成在 Gateway 的 Step 7 |
| Capability Registry | 无 | ❌ | 不存在，无依赖 |
| Workflow Engine | 无 | ❌ | 不存在，无依赖 |
| Tool Registry | 无 | ❌ | 不存在，无依赖 |
| State Manager | Cache | 🟡 | Cache 仅 L1 可用，L2/L3 缺失 |
| Policy Engine | Cache, State Manager | 🟡 | 依赖 Cache 存储策略状态（Mock） |
| Event Bus | 无 | ❌ | 零实现，阻塞所有跨模块通信 |
| Memory Manager | Cache, VectorDB | 🟡 | 依赖 Cache 和向量检索（均缺失） |
| Context Manager | State Manager, Cache | 🟡 | 依赖 State Manager 和 Cache |
| Permission Manager | Auth | ❌ | Auth 为 Mock，零安全防护 |

---

## 六、缺口分析

### 6.1 State Manager

**当前状态**：不存在。所有模块使用内存 `Map`/`Array` 存储，重启即丢失全部数据。

**缺失内容**：
- [ ] 分布式会话状态存储（Redis 或数据库）
- [ ] 状态持久化与恢复机制
- [ ] 状态版本管理与迁移
- [ ] 跨请求状态一致性保障

**建议完成阶段**：Stage A（优先级最高，是 Cache 和所有业务模块持久化的前提）

**预估工作量**：集成 Redis 会话存储 + 数据库持久化，约 16h

---

### 6.2 Event Bus

**当前状态**：`event-bus.service.ts` 的两个方法体均为 `/* TODO: Phase 1 */`，完全无实现。所有模块间通信均未通过事件总线。

**缺失内容**：
- [ ] 事件发布/订阅机制
- [ ] 事件持久化（防止丢失）
- [ ] 事件重试与死信队列
- [ ] 事件 Schema 定义与版本管理

**建议完成阶段**：Stage A（跨模块通信的核心基础设施）

**预估工作量**：集成 RabbitMQ（已在 docker-compose 中定义），约 12h

---

### 6.3 Permission Manager

**当前状态**：`AuthService` 为纯 Mock —— `validateToken()` 返回硬编码的 `mock_user`，`checkPermission()` 始终返回 `true`，`AuthGuard` 始终放行。所有 API 端点无任何鉴权保护。

**缺失内容**：
- [ ] JWT Token 签发与验证
- [ ] RBAC 权限模型（Admin/Member/Free）
- [ ] API Key 验证（Developer Center 中已生成 Key 但未验证）
- [ ] 细粒度权限控制（模块级 + 操作级）

**建议完成阶段**：Stage A（安全红线，不可延后）

**预估工作量**：集成 `@nestjs/jwt` + `@nestjs/passport`，实现 RBAC，约 20h

---

### 6.4 Context Manager

**当前状态**：无独立服务。请求上下文仅在 AI Gateway 的 12 步流程中隐式传递（`GatewayRequest → GatewayResponse`），无会话上下文持久化，无多轮对话历史管理。

**缺失内容**：
- [ ] 会话创建与管理
- [ ] 多轮对话历史存储与压缩
- [ ] 上下文窗口管理（Token 预算）
- [ ] 跨请求上下文恢复

**建议完成阶段**：Stage A（AI 对话体验的基础）

**预估工作量**：基于 Redis 的会话上下文管理，约 12h

---

### 6.5 Policy Engine

**当前状态**：`cost-circuit-breaker.service.ts` 仅覆盖成本策略（三级熔断），无安全策略、内容策略、流量策略、AB 测试策略。依赖 Mock Cache 存储策略状态。

**缺失内容**：
- [ ] 安全策略引擎（请求频率限制、IP 黑名单、异常检测）
- [ ] 内容策略引擎（敏感词库升级、多语言审核）
- [ ] 流量策略引擎（动态路由、负载均衡）
- [ ] AB 测试策略引擎
- [ ] 策略热更新（无需重启服务）

**建议完成阶段**：Stage B（成本策略已可用，其余策略可延后）

**预估工作量**：40h（含安全/内容/流量/AB 四个子引擎）

---

### 6.6 Memory Manager

**当前状态**：陪伴引擎内置记忆系统（创建/检索/淘汰），但检索为关键词匹配（非向量检索），内存存储无持久化，不可跨模块复用。不是独立的 Memory Manager 服务。

**缺失内容**：
- [ ] 独立 Memory Manager 服务（可被 Companion Engine、Learning Engine 等复用）
- [ ] 向量嵌入与语义检索
- [ ] 记忆优先级排序与淘汰策略
- [ ] 长期记忆持久化

**建议完成阶段**：Stage B（需向量数据库支持）

**预估工作量**：集成向量数据库 + 语义检索，约 24h

---

### 6.7 三个未实现能力（Capability Registry / Workflow Engine / Tool Registry）

**共同特征**：这三项能力在代码库中完全不存在，属于 v2.0+ 远期架构规划。

| 能力 | 当前替代方案 | 建议阶段 |
|------|-------------|---------|
| Capability Registry | 无；模块通过 NestJS DI 直接注册 | Stage B |
| Workflow Engine | 12 步硬编码线性流程 | Stage B |
| Tool Registry | 无；AI Gateway 无 Function Calling 能力 | Stage B |

**当前不阻塞开发**：AI Gateway 的 12 步硬编码流程已能满足当前阶段的 AI 调用需求。这三个能力在业务复杂度增长到需要可编排工作流、多工具调用、能力动态发现时才有实际价值。

---

## 七、修复优先级矩阵

### Stage A 必须修复（阻塞生产上线）

| 优先级 | 能力 | 当前状态 | 缺失原因 | 预估工时 |
|--------|------|---------|---------|---------|
| **P0** | Permission Manager | ❌ Mock | 零安全防护，所有接口无鉴权 | 20h |
| **P0** | Server Dependencies | ❌ 缺失 | 缺 Prisma/JWT/Redis/RabbitMQ 等 8+ 核心依赖 | 8h |
| **P0** | State Manager | ❌ 缺失 | 所有数据重启即丢失 | 16h |
| **P1** | Event Bus | ❌ 零实现 | 跨模块通信完全阻塞 | 12h |
| **P1** | Context Manager | 🟡 隐式 | 无会话上下文持久化 | 12h |
| **P1** | Cache L2/L3 | 🟡 L1 only | Redis + 数据库持久化缺失 | 8h |
| **P1** | Content Audit | ❌ 玩具级 | 8 个正则关键词，不满足安全要求 | 8h |

### Stage B 建议修复（增强能力）

| 优先级 | 能力 | 当前状态 | 预估工时 |
|--------|------|---------|---------|
| **P2** | Policy Engine | 🟡 仅成本策略 | 40h |
| **P2** | Memory Manager | 🟡 仅陪伴引擎内置 | 24h |
| **P2** | Capability Registry | ❌ 不存在 | 16h |
| **P2** | Workflow Engine | ❌ 不存在 | 32h |
| **P3** | Tool Registry | ❌ 不存在 | 24h |

### Stage A + Stage B 总预估：~220h（约 5.5 周 / 1 人）

---

## 八、总体结论

**代码总量**: ~9,937 行 TypeScript（含 108 个源文件）+ 8 个 SQL 文件 + 11 个部署配置

**四层架构状态**:

| 层级 | 完成度 | 可生产使用 |
|------|--------|-----------|
| Foundation | 60% | 部分（CI/CD/SQL/Deploy/Env/Compliance 可用，依赖/鉴权/缓存不可用） |
| AI Kernel | 45% | 受限（编排层可调用 AI，但安全/鉴权/持久化/审核均缺失） |
| System Services | 30% | 否（全部内存存储，无持久化） |
| Applications | 0% | 否（空 Expo 模板，零业务代码） |

**一句话总结**: AI Kernel 的 12 步编排流程和混元适配器已达到生产级，但三个关键基础设施（Auth、Cache、EventBus）仍为 Mock/骨架，ContentAudit 为玩具级实现，所有业务模块使用内存存储，前端为零代码空模板。当前状态可演示 AI 调用流程，但不可部署到生产环境。Stage A 的 7 个 P0/P1 缺口修复是生产上线的前提条件。

---

*审计报告基于 2026-07-18 代码基线 `feature/stage-a-server-baseline` (commit `63a32f3`)*
