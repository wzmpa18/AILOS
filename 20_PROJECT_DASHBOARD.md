# 20_PROJECT_DASHBOARD.md

**AILOS 项目控制台 — 全项目唯一状态入口与成长账簿**

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 创建日期 | 2026-07-19 |
| 当前阶段 | Engineering Phase |
| 最高规范 | `00_ENGINEERING_CHARTER.md` |
| 架构基线 | `10_ARCHITECTURE_BLUEPRINT.md` v3.2.1 |
| 维护规则 | 所有模块状态、进度、变更仅更新此文件，禁止创建独立报告 |

---

## 1. Project Overview（项目总览）

**AILOS** = AI Learning Operating System

全球终身学习基础设施。AI 原生、动态生成、千人千面、成本可控、模块化绝对解耦的智能学习底层操作系统。以 Digital Identity Twin 为核心、以 Outcome 为北极星、由 AILOS Runtime 驱动用户生命周期。长期竞争力来自知识资产规模、质量和复用效率。

| 维度 | 当前状态 |
|------|---------|
| 基础架构 | Stage A 基础设施基线 8/8 模块设计完成，4/8 模块已冻结 |
| 核心业务 | AI Gateway 框架就绪，5 级降级矩阵已实现 |
| 插件系统 | 6 语言插件骨架就绪（英/日/韩/德/西 + shared） |
| 前端 | React Native (Expo) 骨架就绪 |
| 部署 | Docker Compose 7 服务定义完成 |
| 商业化迁移 | Phase 1.0 架构设计完成，等待人工冻结确认 |

---

## 2. Chronicle（项目编年史）

| 日期 | 事件 | 类型 |
|------|------|------|
| 2026-07-16 | AILOS 项目启动，架构蓝图 v1.0.0 发布 | 里程碑 |
| 2026-07-17 | 架构 v2.0.0 → v3.0.0（Platform Edition）；Repository Baseline 归档 | 里程碑 |
| 2026-07-17 | Module 1 (Repository Baseline) 归档，Commit `543161b` | 冻结 |
| 2026-07-18 | 架构 v3.1.0（架构冻结）+ v3.1.1（Language Independence） | 里程碑 |
| 2026-07-18 | 架构 v3.2.0（架构宪法升级：资产第一、三轨进化、北极星指标） | 里程碑 |
| 2026-07-18 | Phase 1 Task 1: Server Dependencies 验收通过 | 冻结 |
| 2026-07-18 | Phase 1 Task 2: State Manager 验收通过，Commit `d374853` | 冻结 |
| 2026-07-18 | Phase 1 Task 3: Permission Manager 实现完成，Commit `c74bbfc` | 冻结 |
| 2026-07-18 | Phase 1 Task 4: Event Bus 冻结 v1.0，Commit `4891c66` | 冻结 |
| 2026-07-19 | 架构 v3.2.1（GLOI 正式纳入核心底座，ADR-016） | 里程碑 |
| 2026-07-19 | Phase 1 Task 5: Audit Log 正式冻结，Commit `a51edc5` | 冻结 |
| 2026-07-19 | Phase 1 Task 6: Cache L2/L3 设计审批通过（v2.1），Commit `a2212e6` | 决策 |
| 2026-07-19 | **Architecture Phase 结束，Engineering Phase 启动** | 里程碑 |
| 2026-07-19 | `00_ENGINEERING_CHARTER.md` 正式生效，工程治理设计封顶 | 决策 |
| 2026-07-19 | Task 6 Cache L2/L3 Step 1 完成（模块骨架 + 契约测试套件 + 构建通过） | 进度 |
| 2026-07-19 | 仓库结构冻结 v1.0，19 一级目录/文件 | 冻结 |
| 2026-07-19 | Task 6 Cache L2/L3 实现完成，70/70 测试通过，构建通过，模块冻结 | 冻结 |
| 2026-07-19 | Phase 0.2 旧项目全资产勘察完成，63 页事实报告归档 | 里程碑 |
| 2026-07-19 | **Phase 1.0 Architecture Preparation 全部完成，7 份架构文档归档** | 里程碑 |


---

## 3. Current Status（当前整体状态与完成度）

### Stage A 基础设施基线

| Module | 名称 | 状态 | 完成度 |
|--------|------|------|--------|
| M1 | Repository Baseline | Archived | 100% |
| M2 | Server Baseline | Design Approved | 25% |
| M3 | Environment Baseline | Design Approved | 20% |
| M4 | AI Provider Baseline | Design Approved | 20% |
| M5 | Deployment Baseline | Design Approved | 20% |
| M6 | Preview Environment | Design Approved | 10% |
| M7 | Database Baseline | Design Approved | 25% |
| M8 | CI/CD Baseline | Design Approved | 20% |

### Phase 1 Foundation Tasks

| Task | 名称 | 状态 | 完成度 |
|------|------|------|--------|
| T1 | Server Dependencies | Frozen | 100% |
| T2 | State Manager | Frozen | 100% |
| T3 | Permission Manager | Frozen | 100% |
| T4 | Event Bus | Frozen | 100% |
| T5 | Audit Log | Frozen | 100% |
| T6 | Cache L2/L3 | Frozen | 100% |
| T7+ | 待规划 | Pending | 0% |

### Phase 1.0 Architecture Preparation（商业化迁移架构设计）

| 交付物 | 路径 | 状态 |
|--------|------|------|
| 主架构报告 | `evidence/architecture/phase1-preparation-report.md` | 完成 |
| ADR-001: User Identity & Context | `evidence/architecture/adrs/ADR-001-user-identity-context.md` | 完成 |
| ADR-002: GLOI Global Language | `evidence/architecture/adrs/ADR-002-gloi-global-language.md` | 完成 |
| ADR-003: Goal-Driven Learning | `evidence/architecture/adrs/ADR-003-goal-driven-learning-model.md` | 完成 |
| ADR-004: AI Gateway MVP | `evidence/architecture/adrs/ADR-004-ai-gateway-mvp.md` | 完成 |
| ADR-005: Content Asset Lifecycle | `evidence/architecture/adrs/ADR-005-content-asset-lifecycle.md` | 完成 |
| GLOI 专项设计 | `evidence/architecture/gloi-design.md` | 完成 |
| 前端 i18n 评估 | 已包含在 GLOI 专项设计第 6 章 | 完成 |

---

## 4. Active Module（当前开发中模块）

**无活跃开发模块 — Phase 1.0 架构设计已完成，等待人工冻结确认**

| 属性 | 值 |
|------|-----|
| 当前阶段 | Phase 1.0 Architecture Preparation |
| 状态 | 设计完成，等待人工架构冻结确认 |
| 下一阶段 | 架构冻结确认后启动 P0 编码开发 |
| 文档路径 | `evidence/architecture/phase1-preparation-report.md` |

---

## 5. Frozen Modules（已冻结模块清单）

| 模块 | 版本 | 冻结标识 | 冻结日期 | 核心资产 |
|------|------|---------|---------|---------|
| Event Bus | v1.0 | `ailos-v3.2.0-task4-eventbus-frozen` | 2026-07-18 | `IEventBus`, `EventEnvelope<T>`, MemoryAdapter, `@OnEvent` |
| Permission Manager | v1.0 | `ailos-v3.2.0-task3-permission-frozen` | 2026-07-18 | RBAC (Role/Permission/RolePermission/UserRole), PermissionGuard |
| State Manager | v1.0 | `ailos-v3.2.0-task2-state-frozen` | 2026-07-18 | RuntimeState, Redis/MySQL Storage Adapter, Provider Registry |
| Audit Log | v1.0 | `AILOS-AUDITLOG-v1.0-FROZEN-20260719` | 2026-07-19 | `IAuditLogStore`, `AuditLogEntry`, MemoryStore |
| Cache L2/L3 | v1.0 | `AILOS-CACHE-v1.0-FROZEN-20260719` | 2026-07-19 | `ICacheStore`, `CacheEntry`, `CacheStats`, MemoryStore/RedisStore/PrismaStore, CacheManager |

**冻结模块修改规则：** 修改核心接口/数据结构/事件格式须提交 Architecture Change Request (ACR)。

**已登记偏差：**
- `DEV-AUDIT-001`: Event Bus `*` wildcard pattern 未实现（Audit Log 订阅使用精确事件类型匹配）

---

## 6. Roadmap（开发路线图）

```
Phase 0: Architecture Design     ============ 100%  已完成
Phase 1: Infrastructure Foundation
  T1 Server Dependencies     ============ 100%  已冻结
  T2 State Manager           ============ 100%  已冻结
  T3 Permission Manager      ============ 100%  已冻结
  T4 Event Bus               ============ 100%  已冻结
  T5 Audit Log               ============ 100%  已冻结
  T6 Cache L2/L3             ============ 100%  已冻结
  T7+ (待规划)                             0%  待规划
Phase 1.0: Architecture Preparation      100%  设计完成，等待冻结确认
Phase 2: Business Modules                  0%  待启动
Phase 3: AI Companion                      0%  待启动
Phase 4: Ecosystem & Marketplace           0%  待启动
```

---

## 7. Decisions（核心架构决策汇总）

| ID | 决策 | 日期 | 影响范围 |
|----|------|------|---------|
| ADR-001 | 单仓库 Monorepo 结构 | 2026-07-16 | 全局 |
| ADR-007 | P0-P3 核心资产保护分级 | 2026-07-18 | 运维 |
| ADR-016 | GLOI 纳入核心底座 | 2026-07-19 | 全局 |
| D-001 | 九阶段生命周期治理流程 | 2026-07-18 | 开发流程 |
| D-002 | Dual-Track Evolution (Personal + Platform) | 2026-07-18 | 数据架构 |
| D-003 | Language Neutral Principle (语言无关) | 2026-07-18 | 全局 |
| D-004 | 资产第一原则 (Asset First) | 2026-07-18 | 全局 |
| D-005 | 工程治理设计封顶 | 2026-07-19 | 工程体系 |
| D-006 | Cache Key 含完整语言维度与资产版本 (GLOI) | 2026-07-19 | 缓存层 |
| DEC-006 | 商业化迁移架构准备启动 | 2026-07-19 | 商业化 |
| DEC-007 | User Identity 体系为核心架构 | 2026-07-19 | 身份体系 |
| DEC-008 | AI Gateway MVP 裁剪原则 | 2026-07-19 | AI Gateway |
| DEC-009 | 机构功能轻量化上线 | 2026-07-19 | 机构模块 |
| DEC-010 | ADR 架构决策强制输出 | 2026-07-19 | 治理流程 |
| DEC-011 | GLOI 全球化语言底层基础设施强制落地 | 2026-07-19 | 全局 |
| DEC-012 | 多语种学习、内容、日志、全局语言层专项修正 | 2026-07-19 | 全局 |

---

## 8. Tech Debt（全局技术债清单）

| ID | 描述 | 优先级 | 登记日期 | 目标版本 |
|----|------|--------|---------|---------|
| TD-001 | Event Bus 仅实现内存适配器，需 RabbitMQ 适配器 | P1 | 2026-07-18 | Phase 2 |
| TD-002 | Permission Manager 未实现 Policy Engine (ABAC) | P2 | 2026-07-18 | Phase 2 |
| TD-003 | State Manager 未实现 Redis Cluster 分片 | P2 | 2026-07-18 | Phase 2 |
| TD-004 | Audit Log 仅内存存储，需数据库持久化 | P1 | 2026-07-19 | Phase 2 |
| TD-005 | Cache 语义匹配 (Semantic Cache) 为 Phase 2 能力 | P2 | 2026-07-19 | Phase 2 |
| TD-006 | Cache 分布式锁 (Redlock) 为 Phase 2 能力 | P2 | 2026-07-19 | Phase 2 |
| TD-007 | Cache 后台预热 (Warmup) 为 Phase 2 能力 | P2 | 2026-07-19 | Phase 2 |
| TD-008 | 7 个 Modules (M2-M8) 仅设计完成，未执行落地 | P0 | 2026-07-18 | 按需启动 |
| TD-009 | 旧项目双后端架构需统一为 Prisma+PostgreSQL | P0 | 2026-07-19 | Phase 1.0 P0 |
| TD-010 | 旧项目 6 处分散 AI 调用点需统一接入 AI Gateway | P0 | 2026-07-19 | Phase 1.0 P0 |
| TD-011 | 旧项目硬编码价格/AI代理地址/降级内容需提取为配置 | P0 | 2026-07-19 | Phase 1.0 P0 |

---

## 9. Known Issues（已知问题与修复记录）

| ID | 问题 | 状态 | 发现日期 | 修复日期 |
|----|------|------|---------|---------|
| DEV-AUDIT-001 | Event Bus 不支持 `*` wildcard 模式 | 已登记偏差 | 2026-07-19 | Phase 2 |

---

## 10. Repository Health（仓库健康度）

| 指标 | 值 | 状态 |
|------|-----|------|
| 构建状态 | Passing | 正常 |
| 冻结模块完整性 | 5/5 模块冻结标识完整 | 正常 |
| 代码规范 | ESLint + Prettier 配置就绪 | 正常 |
| Commit 规范 | Conventional Commits + AILOS scopes | 正常 |
| Git Hooks | commitlint + pre-commit 合规扫描 | 正常 |
| CI/CD | GitHub Actions 4 阶段流水线定义完成 | 就绪 |
| 测试覆盖 | 5/5 冻结模块单元测试 100% 通过 (70 测试) | 正常 |
| Phase 1.0 架构文档 | 7/7 交付物完整归档 | 正常 |

---

## 11. Milestones（里程碑节点）

| 里程碑 | 日期 | 状态 |
|--------|------|------|
| M0: 项目启动 | 2026-07-16 | 已完成 |
| M1: 架构宪法 v3.0.0 | 2026-07-17 | 已完成 |
| M2: 架构冻结 v3.1.0 | 2026-07-18 | 已完成 |
| M3: 架构宪法升级 v3.2.0 | 2026-07-18 | 已完成 |
| M4: GLOI 纳入 v3.2.1 | 2026-07-19 | 已完成 |
| M5: 基础设施 4 模块冻结 | 2026-07-19 | 已完成 |
| M6: Architecture Phase 结束 | 2026-07-19 | 已完成 |
| M7: Cache 模块完成 | 2026-07-19 | 已完成 |
| M8: Phase 1 基础设施闭环 | 待定 | 待执行 |
| M9: Phase 1.0 架构设计完成 | 2026-07-19 | 已完成 |
| M10: Phase 2 业务模块启动 | 待定 | 待执行 |

---

## 13. Repository Assets（仓库资产清单）

**Repository Structure Freeze v1.0 — 2026-07-19**

| 路径 | 类型 | 说明 |
|------|------|------|
| `00_ENGINEERING_CHARTER.md` | 权威文档 | 工程宪章（最高规范） |
| `10_ARCHITECTURE_BLUEPRINT.md` | 权威文档 | 架构蓝图 v3.2.1（设计唯一依据） |
| `20_PROJECT_DASHBOARD.md` | 控制台 | 项目唯一状态入口与成长账簿 |
| `ailos-server/` | 代码 | 后端 NestJS 服务（含 src/） |
| `ailos-app/` | 代码 | 前端 React Native (Expo) |
| `sql/` | 数据库 | DDL Schema + 迁移 + 种子数据 |
| `prisma/` | 数据库 | Prisma Schema (ORM) |
| `config/` | 配置 | 环境配置模板（dev/staging/prod） |
| `deploy/` | 部署 | Docker Compose 7 服务定义 |
| `plugins/` | 插件 | 6 语言插件 + 5 领域插件 |
| `prompt_library/` | Prompt | 集中式 Prompt 版本管理 |
| `tests/` | 测试 | E2E / Integration / Unit |
| `infrastructure/` | 基础设施 | 服务器基线文档 |
| `assets/` | 资产 | 品牌素材 / 字体 / 音效 |
| `backups/` | 备份 | 日常备份 + 升级前备份 |
| `archive/` | 归档 | 历史设计文档、审计报告、偏差记录 |
| `docs/` | 文档 | 当前设计文档 + 基础设施工作簿 |
| `evidence/` | 证据 | Phase 0.2 勘察报告 + Phase 1.0 架构文档 + ADR |
| `.github/` | CI/CD | GitHub Actions 4 阶段流水线 |
| `.husky/` | Git Hooks | commitlint + pre-commit 合规扫描 |

**一级目录结构（已冻结，修改须经 ACR 审批）：**
- 上述 20 个一级目录/文件为 Repository Structure v1.0
- 新增一级目录须提交 Architecture Change Request
- 允许在现有目录内自由组织文件


## 13. Legacy Migration — 言道学外语开发工作区

| 属性 | 值 |
|------|-----|
| 状态 | Phase 1.0 架构设计完成，7 份文档归档，等待人工冻结确认 |
| 唯一开发根目录 | `E:\TRAE SOLO` |
| 项目名 | xuewaiyu-app v1.0.0 |
| 线上对应 | PM2 xuewaiyu-backend (82.156.228.87) |
| 线上版本一致性 | 完全匹配 |
| 工作区锁定状态 | Locked (2026-07-19) |
| Excluded Workspace | 6 个目录已永久排除 |
| 证据路径 | `evidence/legacy-migration/workspace-verification-report.md` |
| Phase 0.2 证据 | `evidence/discovery/legacy-commercial-migration-facts.md` |
| Phase 0.2 完成 | 2026-07-19 |
| Phase 1.0 证据 | `evidence/architecture/phase1-preparation-report.md` |
| Phase 1.0 完成 | 2026-07-19 |
| ADR 文档 | 5 份 (`evidence/architecture/adrs/`) |
| GLOI 专项 | `evidence/architecture/gloi-design.md` |
| API 接口总数 | 27 |
| 业务数据表 | 11 (存量) + 17 (新增) |
| AI 调用点 | 6 (仅腾讯混元，待统一接入 AI Gateway) |
| 代码问题 | 10 项 |

### Excluded Workspace 清单
| # | 路径 | 大小 | 原因 |
|---|------|------|------|
| 1 | D:\最新言道学习APP | — | 旧版 Capacitor 项目 |
| 2 | D:\GendouApp | — | 旧版基础结构 |
| 3 | E:\yandaoAPP | 4.7 MB | Vite 前端原型 |
| 4 | E:\最新言道APP2026-7-16 | 0.6 MB | 文档目录 |
| 5 | E:\新言道外语 | 1037 MB | TRAE IDE 安装 |
| 6 | C:\Users\ZhuanZ\xuewaiyu-patch | 0 MB | 空目录 |

### 服务器部署信息
| 进程名 | 版本 | 脚本路径 | 状态 |
|--------|------|---------|------|
| xuewaiyu-backend | 1.0.0 | /www/xuewaiyu-backend/server.js | online (3D) |
| yandao-backend | 1.0.0 | /www/yandao-app/backend-v2/server.js | online (6D) |

---
## 12. Next Action（下一步动作）

1. **Phase 1.0 架构冻结确认**: 等待人工审核 7 份架构文档，确认后进入 P0 编码开发阶段
2. **P0 开发启动**: 冻结确认后，按 P0 任务清单依次启动：User Identity + GLOI → AI Gateway → 五层学习模型 → 内容资产库 → 支付兼容
3. **Dashboard**: 持续更新本文件，禁止创建独立报告