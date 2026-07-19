# Infrastructure Workbook

**AILOS Infrastructure Baseline v1.0 — Stage A 唯一正式交付物**

| 属性 | 值 |
|------|-----|
| 版本 | 1.0.0 (Baseline) |
| 状态 | Active — Phase 1 Foundation Execution |
| 最后更新 | 2026-07-19 (Task 4 FREEZE + Task 5 FREEZE + v3.2.1 架构对齐) |
| 关联仓库 | `https://github.com/wzmpa18/AILOS` |
| 当前分支 | `feature/stage-a-server-baseline` |
| 架构蓝图 | AILOS Software Architecture Blueprint v3.2.1 (Frozen) |
| 开发总纲 | AILOS v3.2.0 Implementation Constitution & Development Plan |
| 治理修正 | AILOS v3.1.1 Stage A Governance Amendment v1.0 |
| 治理规范 | Stage A 基础设施交付体系正式规范（最终冻结版） |

---

## 0. Execution Log

| Date | Module | Checkpoint | Commit | Status |
|------|--------|------------|--------|--------|
| 2026-07-17 | M1 | Repository Baseline Verified | `543161b` | Archived |
| 2026-07-17 | M2 | Inventory Plan Approved | `28b25d6` | Design Approved |
| 2026-07-17 | M2 | Design v1.0 Approved | `6ae2471` | Design Approved |
| 2026-07-18 | M2 | Execute Authorization Request Submitted | `d015a32` | Design Approved |
| 2026-07-18 | M2 | Workbook Initialized | `c8b52b0` | Done |
| 2026-07-18 | M2 | Authorization Approved | `63a32f3` | Design Approved |
| 2026-07-18 | Audit | Code Capability Audit Completed | `e5694d1` | Verified Done |
| 2026-07-18 | Blueprint | v3.1.1 Implementation Constitution Published | `9024726` | Design Approved |
| 2026-07-18 | Governance | v1.0 Governance Amendment Applied | `b6b6fa6` | Done |
| 2026-07-18 | Phase 1 | Task 1: Server Dependencies | `58af0df` | Verified Done |
| 2026-07-18 | Phase 1 | Task 2: State Manager | `d374853` | Verified Done |
| 2026-07-18 | Phase 1 | Task 3: Permission Manager | `c74bbfc` | Implemented |
| 2026-07-18 | Phase 1 | Task 4: Event Bus | `4891c66` | **FREEZED v1.0** |
| 2026-07-19 | Phase 1 | Task 5: Audit Log | a51edc5 | **FREEZED v1.0** 🔒 |
| 2026-07-19 | Phase 1 | Task 6: Cache L2/L3 | — | DESIGN 🚀 |

---

## 1. Module 1: Repository Baseline

**Status: Archived**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | N/A (初始状态) |
| Current Status | Archived |
| Evidence Level | Full |
| Evidence Location | `.commitlintrc.js`, `.husky/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.gitignore` |
| Commit Hash | `543161b` |
| Reviewer | 总工程师 |
| Verification Date | 2026-07-17 |

### 1.1 Summary

Module 1 (Repository Baseline) 是 Infrastructure Baseline v1.0 的首个组件，建立了 AILOS 项目的 Git 仓库治理基线，包括分支模型、Commit 规范、Git Hooks 合规检查、PR 模板与安全扫描体系。

### 1.2 Deliverables

| 交付物 | 类型 | 位置 |
|--------|------|------|
| Commitlint 配置 | 代码 | `.commitlintrc.js` |
| Git Hooks (commit-msg) | 代码 | `.husky/commit-msg` + `.husky/commit-msg.ps1` |
| Git Hooks (pre-commit) | 代码 | `.husky/pre-commit` + `.husky/pre-commit.ps1` |
| PR 模板 | 代码 | `.github/PULL_REQUEST_TEMPLATE.md` |
| 增强 .gitignore | 代码 | `.gitignore` |

### 1.3 Evidence (5-Class)

| 证据类型 | 状态 | 说明 |
|----------|------|------|
| Implementation | ✅ | 5 个交付物全部实装 |
| Testing | ✅ | Windows PowerShell Git Hooks 验证通过，0 合规违规 |
| Execution | ✅ | Commit 消息校验通过，CI 流水线触发成功 |
| Compliance | ✅ | 符合 Repository Baseline v1.0 规范 |
| Acceptance | ✅ | 2026-07-17 总工程师验收归档 |

### 1.4 Branch Model

- `main` — 生产就绪代码，受保护分支
- `develop` — 集成分支
- `feature/*` — 功能开发分支
- `hotfix/*` — 紧急修复分支

### 1.5 Commit Convention

Conventional Commits 格式，AILOS 专用 scopes: `infra`, `repo`, `server`, `env`, `ai`, `deploy`, `preview`, `db`, `ci-cd`, `docs`, `security`

### 1.6 Git Hooks

- **commit-msg**: commitlint 校验，Windows 通过 PowerShell wrapper + .ps1 分离模式支持
- **pre-commit**: 合规扫描（敏感文件拦截、硬编码 API Key 检测、直连 AI Provider 拦截）

### 1.7 Security Redlines

- R1: 密钥不入库
- R2: `.env.local` 不入库
- R3: 禁止直连 AI Provider API
- R4: `.gitignore` 覆盖所有敏感文件类型
- R5: PR 必须经过合规检查

### 1.8 Branch & Commits

```
Repository: `https://github.com/wzmpa18/AILOS`
Branch: feature/stage-a-repository-baseline
Commits: 936bd8f → 543161b
PR: #1 (Open)
Tag: N/A
```

---

## 2. Module 2: Server Baseline

**Status: Execute In Progress**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Execute In Progress |
| Evidence Level | Partial |
| Evidence Location | `infrastructure/server-baseline/`, `docs/infrastructure/Infrastructure-Workbook.md` |
| Commit Hash | `d015a32` (Authorization), pending Checkpoint 1 |
| Reviewer | 待验证 |
| Verification Date | 待验证 |

### 2.1 Design Overview

Server Baseline v1.0 以建立 AILOS 专属纯净运行环境为核心目标，基于 Ubuntu 22.04 LTS 单机部署，采用 Nginx → Node.js → Redis/MariaDB 分层架构。设计覆盖 7 个维度：环境版本、目录结构、权限体系、部署架构、备份方案、清理计划、回滚机制。

### 2.2 Environment Specifications

| 组件 | 版本 | 安装源 |
|------|------|--------|
| OS | Ubuntu 22.04 LTS (Jammy) | — |
| Node.js | 20.x LTS (Iron) | NodeSource |
| Redis | 7.0.x | Redis 官方源 |
| MariaDB | 10.11 LTS | MariaDB 官方源 |
| Nginx | 1.24.x | Nginx 官方源 |
| PM2 | 5.3.x | npm registry |

所有组件安装后通过 `apt-mark hold` 锁定版本，禁止自动升级。

### 2.3 Directory Structure

```
/opt/ailos/
├── app/          # 应用代码 (Git 工作目录)
├── config/       # 配置文件 (敏感文件 0600)
├── data/         # 持久化数据 (uploads, sessions)
├── logs/         # 应用日志 (app, nginx, pm2)
├── backup/       # 备份目录 (db, config, pre-cleanup)
├── scripts/      # 运维脚本 (deploy, backup, rollback, health-check, cleanup)
└── releases/     # 版本发布归档
```

### 2.4 Security Architecture

- **用户**: `ailos:ailos` 运行应用，sudo 最小权限
- **SSH**: 密钥认证，禁止 root 登录，禁止密码认证
- **UFW**: 仅开放 22 (受限 IP)、80、443
- **内部服务**: Redis :6379、MariaDB :3306、Node.js :3000 均仅监听 localhost
- **7 条安全红线**: 密钥不入库、`.env.local` 不入库、数据库仅本地监听、SSH 密钥认证、端口最小化、HTTPS 强制、敏感文件 0600

### 2.5 Deployment Topology

```
Internet (:443) → Nginx 1.24 → Node.js 20.x (:3000) → Redis 7.0 (:6379)
                                                        → MariaDB 10.11 (:3306)
                                                        ↕ PM2 5.3 (Process Manager)
```

### 2.6 Authorization

**Status: Approved (2026-07-18)**

| 项目 | 内容 |
|------|------|
| 审批日期 | 2026-07-18 |
| 授权账号 | root 权限账号（含完整 sudo 权限） |
| 授权范围 | Inventory Execute / Backup / Cleanup / Initialize / Verify |
| 有效期 | 自凭据发放之日起 7 天；Module 2 验收完成后凭据立即失效 |
| 凭据发放 | 通过独立安全渠道 |
| AI Provider | 不涉及 (归属 Module 4) |

**禁止操作**:
- 不得修改域名解析
- 不得调整云服务器安全组 / 防火墙策略
- 不得操作未列入清理清单的资产
- 不得部署业务代码
- 不得申请或配置任何 AI Provider 相关凭据

**分阶段执行计划 (~22h / 5 天)**:

| 阶段 | 操作 | 预计耗时 | 关键产出 |
|------|------|---------|---------|
| P1: Inventory Execute | 真实资产盘点 | 2h | Server Asset Inventory Report |
| P2: Confirm | 资产确认 | 1h | 最终资产分类表 |
| P3: Backup | 全量备份 + 验证 | 4h | Server Backup Manifest |
| P4: Cleanup | 分级清理 (C→B→D) | 5h | Server Cleanup Report |
| P5: Initialize | 环境初始化 | 6h | 标准环境就绪 |
| P6: Verify | 验收验证 | 4h | Environment Verification Report |

**重大差异暂停规则**: 如 Inventory Execute 发现与设计假设存在重大差异，立即暂停，提交 Design Review Update。

### 2.7 Checkpoint 执行顺序（冻结）

```
Module 2: Server Baseline
        │
        ▼
Checkpoint 1: Inventory Execute
        │
        ▼
Checkpoint 2: Confirm
        │
        ▼
Checkpoint 3: Backup
        │
        ▼
Checkpoint 4: Cleanup
        │
        ▼
Checkpoint 5: Initialize
        │
        ▼
Checkpoint 6: Verify
        │
        ▼
Module 2: Verified Done
```

每完成一个 Checkpoint，必须同步更新：Infrastructure Workbook、Execution Log、Evidence Record、Module Status。

### 2.8 Inventory

**Status: Checkpoint 1 — Inventory Execute**

Inventory Plan 已通过评审 (2026-07-17)。授权已批准，待启动真实盘点。

盘点维度: 系统信息 / 硬件资源 / 运行服务 / 数据库 / 目录结构 / 端口占用 / 定时任务

四级资产分类:
- **A**: 保留 (AILOS 必需)
- **B**: 备份后清理 (潜在价值)
- **C**: 直接清理 (确认无用)
- **D**: 需确认 (待人工判断)

### 2.9 Confirm

**Status: Pending (Blocked by Checkpoint 1)**

#### 2.9.1 核心资产保护政策 (ADR-007)

**P0-P3 资产分级定义**:

| 优先级 | 资产类型 | 删除权限 | 说明 |
|--------|---------|---------|------|
| **P0** | 用户数据库、用户上传文件、环境密钥 (.env/Secret/API Key)、SSL 证书及私钥、数据库加密密钥 | 永久禁止删除 | 项目核心业务资产 |
| **P1** | Git 仓库代码、项目核心配置模板 | 须备份确认后操作 | 可通过仓库恢复 |
| **P2** | 前端部署目录、后端部署目录、运行时编译产物 | 可清理重建 | 可通过代码重新部署 |
| **P3** | 运行日志、缓存文件、临时文件、测试项目、历史进程残留、废弃演示环境 | 可直接清理 | 不影响业务运行 |

**永久治理规则**:
- 所有 P0 级资产默认禁止删除、禁止覆盖、禁止移动
- P0 资产必须具备独立备份与恢复方案，备份后执行抽样恢复验证
- 代码发布、环境重构、服务器升级不得影响 P0 资产完整性
- P0 敏感信息严禁提交至 Git 仓库、写入公开文档、输出到日志文件
- 数据迁移遵循「备份 → 恢复到新环境 → 功能验证 → 业务验证 → 切流 → 旧环境保留观察 → 确认后删除」全流程
- P0 资产与服务器生命周期完全解耦：服务器可按需重建，P0 资产不受影响

#### 2.9.2 默认清理规则

**保留资产（默认不清理）**:
- 当前线上运行的前端站点及对应部署目录
- 已部署的 SSL 证书及相关配置文件
- 操作系统基础组件与系统默认服务

**默认清理资产（备份后清理）**:
- 所有历史后端项目、测试项目、演示项目（含旧言道项目）
- 所有废弃部署目录、临时文件、历史代码归档
- 存量 PM2 历史进程与对应服务配置
- 冗余 Nginx 站点配置（前端站点与证书配置除外）
- 废弃测试数据库实例与冗余账号
- 历史运行日志、无关定时任务
- 与 AILOS 无关的其他运行环境、工具与残留文件

**当前阶段说明**: 服务器暂未正式运营，无真实用户数据、用户上传文件等业务类 P0 资产。现有 SSL 证书、系统级核心配置属于 P0 范畴，默认保留。存量测试数据库、测试项目配置属于 P3 级资产，完成备份后可按计划清理。

### 2.10 Backup

**Status: Pending (Blocked by Checkpoint 2)**

强制约束: 未完成备份有效性校验，禁止进入 Cleanup 阶段。

### 2.11 Cleanup

**Status: Pending (Blocked by Checkpoint 3)**

清理范围: 旧言道项目、测试项目、历史部署目录、废弃数据库、冗余 Nginx/PM2 配置、历史日志。

不可逆操作须在工作簿中列出完整待操作清单，经人工回复「确认执行」后方可操作。

### 2.12 Initialize

**Status: Pending (Blocked by Checkpoint 4)**

### 2.13 Verify

**Status: Pending (Blocked by Checkpoint 5)**

### 2.14 Rollback

回滚矩阵 (DB/Config/文件/组件/全量 五级)，详见 Design v1.0。

---

## 3. Module 3: Environment Baseline

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | `config/env/` 目录 (dev/staging/prod 三环境模板) |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

| 项目 | 内容 |
|------|------|
| 依赖 | Module 2 Server Baseline 验收通过 |
| 范围 | 多环境配置管理 (dev/staging/prod)、环境变量规范、配置同步机制 |

---

## 4. Module 4: AI Provider Baseline

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | `ailos-server/src/modules/gateway/` (AI Gateway 生产级代码) |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

| 项目 | 内容 |
|------|------|
| 依赖 | Module 3 Environment Baseline 验收通过 |
| 范围 | 腾讯混元 (Hunyuan)、TokenHub 接入、费率控制、模型路由、降级策略 |
| 凭据 | 仅在 Execute 阶段提供，Module 2 不申请、不保存、不使用 |

---

## 5. Module 5: Deployment Baseline

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | `deploy/docker-compose.yml` (7 服务定义) |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

---

## 6. Module 6: Preview Environment

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | — |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

---

## 7. Module 7: Database Baseline

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | `prisma/schema.prisma` (25 模型), `sql/schemas/` (7 DDL) |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

---

## 8. Module 8: CI/CD Baseline

**Status: Design Approved**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Design Approved |
| Evidence Level | None |
| Evidence Location | `.github/workflows/ci-cd.yml` (v2.0.0, 4 阶段) |
| Commit Hash | — |
| Reviewer | 待验收 |
| Verification Date | 待验收 |

---

## 9. Phase 1: Foundation Execution

**Status: In Progress**

### 9.1 Task 1: Server Dependencies

**Status: Verified Done**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | N/A |
| Current Status | Verified Done |
| Evidence Level | Full |
| Evidence Location | `ailos-server/package.json`, `ailos-server/package-lock.json` |
| Commit Hash | `58af0df` |
| Reviewer | 待总工程师验收 |
| Verification Date | 2026-07-18 |

**已安装依赖（19 运行时 + 3 类型）**:

| 依赖 | 版本 | 用途 |
|------|------|------|
| @prisma/client | ^7.0.0 | ORM 客户端 |
| mysql2 | ^3.11.0 | MySQL 驱动 |
| @nestjs/jwt | ^11.0.0 | JWT 签发/验证 |
| @nestjs/passport | ^11.0.0 | Passport 集成 |
| passport-jwt | ^4.0.0 | JWT 认证策略 |
| ioredis | ^5.4.0 | Redis 客户端 |
| amqplib | ^0.10.0 | RabbitMQ 客户端 |
| class-validator | ^0.15.0 | DTO 参数校验 |
| class-transformer | ^0.5.0 | DTO 类型转换 |
| @nestjs/config | ^4.0.0 | 配置管理 |
| bcrypt | ^5.1.0 | 密码加密 |
| @types/amqplib | ^0.10.0 | amqplib 类型 |
| @types/bcrypt | ^5.0.0 | bcrypt 类型 |
| @types/passport-jwt | ^4.0.0 | passport-jwt 类型 |

**证据（5类）**:

| 证据类型 | 状态 | 说明 |
|----------|------|------|
| Implementation | ✅ | `ailos-server/package.json` + `ailos-server/package-lock.json` |
| Testing | ✅ | `npm run build` PASS，325 构建产物，0 Error |
| Execution | ✅ | `npm install` 成功，95 packages added |
| Compliance | ✅ | arch-check: layer=infrastructure, gateway=true, risk=low |
| Acceptance | ✅ | 19 个依赖全部可 resolve，环境模板已覆盖配置项 |


### 9.2 Task 2: State Manager

**Status: Verified Done**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Verified Done |
| Evidence Level | Full |
| Evidence Location | `ailos-server/src/infrastructure/state-manager/` (13 files) |
| Commit Hash | `d374853` |
| Reviewer | 待总工程师验收 |
| Verification Date | 2026-07-18 |

**实现范围**:

| 组件 | 文件 | 说明 |
|------|------|------|
| 核心类型 | `state-manager.types.ts` | 8 interfaces + 3 types + 2 enums |
| Provider Registry | `provider-registry.ts` | 命名空间隔离、Provider 生命周期管理 |
| MySQL Adapter | `mysql-storage.adapter.ts` | Source of Truth 持久化适配器 |
| Redis Adapter | `redis-storage.adapter.ts` | 缓存层适配器（Graceful Degradation） |
| StateManager Core | `state-manager.service.ts` | 统一调度逻辑、CRUD、原子更新、快照/恢复 |
| Session Provider | `providers/session-state.provider.ts` | 命名空间: `session` |
| System Provider | `providers/system-state.provider.ts` | 命名空间: `system` |
| Default Provider | `providers/default-state.provider.ts` | 命名空间: `default` |
| Module | `state-manager.module.ts` | @Global() 全局模块 |
| Barrel Export | `index.ts` | 统一导出 |
| Prisma Schema | `prisma/schema.prisma` | `runtime_state` 表（12 字段白名单） |
| App Module | `src/app.module.ts` | 注册 StateManagerModule |
| 测试 | `state-manager.service.spec.ts` | 24 项核心场景测试 |

**数据一致性规则（已冻结）**:
- MySQL = 唯一持久化真值源
- Redis = 运行时缓存层，不具备最终数据效力
- Write Flow: MySQL 事务提交 → Redis 缓存更新
- Read Flow: Redis 命中 → 返回; 未命中 → MySQL 查询 → 回写 Redis

**Provider Governance**:
- 3 个内置 Provider 通过统一 Registry 注册
- 命名空间隔离强制生效：`session.*` / `system.*` / `default.*`
- 越权访问被拦截并返回失败

**证据（5类）**:

| 证据类型 | 状态 | 说明 |
|----------|------|------|
| Implementation | ✅ | 13 个文件，核心类型 + Provider Registry + 存储适配器 + StateManager + 3 Provider + Module + Prisma Schema |
| Testing | ✅ | 24/24 测试通过（CRUD、原子更新、批量操作、快照恢复、命名空间隔离、生命周期） |
| Execution | ✅ | `npm run build` PASS，零错误 |
| Compliance | ✅ | arch-check: layer=runtime, gateway=true, risk=low; 无业务字段侵入; 无模块越界 |
| Acceptance | ✅ | 自测通过，所有验收标准 100% PASS |


**下一步**: Task 3: Permission Manager DESIGN 阶段（✅ 已完成，待 IMPLEMENT 授权）

### 9.3 Task 2.5: Architecture Alignment Review

**Status: Verified Done**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Design Approved |
| Current Status | Verified Done |
| Evidence Level | Full |
| Evidence Location | 审查报告（对话内交付） |
| Commit Hash | `51f05db` (Workbook update) |
| Reviewer | 总工程师 |
| Verification Date | 2026-07-18 |

**审查结论**: v3.2.0 架构宪法与 Phase 1 代码基线完全对齐，零冲突，零越界，零 ACR 提交。

**术语修正**: Three-Track Evolution → Dual-Track Evolution（删除 Community 轨道）

### 9.4 Task 3: Permission Manager Architecture Design

**Status: Design Completed**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | Pending Authorization |
| Current Status | Design Completed |
| Evidence Level | Design Document |
| Evidence Location | `docs/design/ailos-p3-permission-manager-design.md` |
| Commit Hash | `ae336eb` |
| Reviewer | 待总工程师评审 |
| Verification Date | 2026-07-18 |

**设计范围**:
- 7+1 强制章节：Module Positioning / Data Model / Permission Flow / Interface Spec / Extension Design / Compliance Review / Implementation Plan / Asset First 专项检查
- 4 个 Prisma 实体：Role / Permission / RolePermission / UserRole
- 6 个核心接口：checkPermission / getUserRoles / assignRole / removePermission / getRolePermissions / listRoles
- 5 项工程裁决全部执行：RBAC / 独立审计 / Dual-Track / 标准 Envelope / system_db 域

**合规状态**:
- Asset First: ✅ PASS
- Dual-Track: ✅ PASS
- State Manager: ✅ PASS（零影响）
- 审计合规: ✅ PASS

**下一步**: 待总工程师设计评审通过后，申请 IMPLEMENT 授权

## 10. Governance Rules

### 10.1 模块状态机（四级·强制）

```
Design Approved → Execute In Progress → Verified Done → Archived
```

**禁止状态**：Done / Completed / Fixed / Known / Pending (Blocked by...)
**禁止跳级**：任何模块不得从 Design Approved 直接跳到 Verified Done 或 Archived

### 10.2 五类证据强制规则

任何交付标记为 Verified Done 前，必须集齐：Implementation / Testing / Execution / Compliance / Acceptance

### 10.3 Known Issues 状态流转（四级·强制）

```
Open → Resolved Pending Verify → Verified Done → Closed
```

禁止 Open → Fixed 直接跳转。

### 10.4 AI 前置架构闸门（Pre-Development Gate）

所有 AI 工具生成代码前，必须输出架构检查结果，并写入 Commit Message 格式: `arch-check: layer=xxx, gateway=true, risk=xxx`

### 10.5 禁止 AI 自行扩大范围

| 禁止项 | 原因 |
|--------|------|
| 新增业务功能 | 需等待 Runtime 底座形成 |
| 新增 Agent | 需等待 Runtime 底座形成 |
| 新增 Domain | 需等待 Runtime 底座形成 |
| 新增 Runtime Manager | 统一在 Phase 2 阶段完成 |
| 新增数据库表 | 需经过 Data Model Review |
| 重新设计 Runtime | 架构已冻结 |
| 修改 Blueprint 核心抽象 | 架构已冻结 |

仅允许执行以下行为：状态修正、文档治理、执行准备、证据体系完善。

---

## Execute Checklist

### Module 1: Repository Baseline

- [x] M1-01: Commitlint 配置 (`.commitlintrc.js`)
- [x] M1-02: Git Hooks — commit-msg (PowerShell wrapper + .ps1)
- [x] M1-03: Git Hooks — pre-commit (合规扫描)
- [x] M1-04: PR 模板 (`.github/PULL_REQUEST_TEMPLATE.md`)
- [x] M1-05: 增强 `.gitignore`
- [x] M1-06: PR #1 创建并推送
- [x] M1-07: Module 1 正式验收归档

### Module 2: Server Baseline

- [x] M2-01: Inventory Plan 设计 + 评审通过
- [x] M2-02: Design v1.0 方案设计 + 评审通过
- [x] M2-03: Execute Authorization Request 提交
- [x] M2-04: Infrastructure Workbook 初始化
- [x] M2-05: 获取服务器授权凭据
- [ ] M2-06: Checkpoint 1 — Inventory Execute (真实盘点)
- [ ] M2-07: Checkpoint 2 — Confirm (资产确认)
- [ ] M2-08: Checkpoint 3 — Backup (全量备份 + 验证)
- [ ] M2-09: Checkpoint 4 — Cleanup (分级清理)
- [ ] M2-10: Checkpoint 5 — Initialize (环境初始化)
- [ ] M2-11: Checkpoint 6 — Verify (验收验证)
- [ ] M2-12: Module 2 正式验收归档

### Phase 1: Foundation

- [x] P1-T1: Server Dependencies — 依赖安装 + 编译验证
- [x] P1-T2: State Manager — Verified Done
- [x] P1-T3: Permission Manager — **FREEZED v1.0**
- [x] P1-T4: Event Bus — **FREEZED v1.0** (4891c66)
- [x] P1-T5: Audit Log — **FREEZED v1.0** 🔒
- [ ] P1-T6: Cache L2/L3 — **DESIGN 🚀**
- [ ] P1-T6: Cache L2/L3 — 待授权
- [ ] P1-T7: Content Audit — 待授权

---

## Known Issues

| ID | 描述 | 模块 | 状态 | 验证步骤 | 计划 |
|----|------|------|------|---------|------|
| KI-01 | TokenHub IP 白名单更新 (PF-01) | M4 | Open | — | 待 Module 4 Execute 阶段处理 |
| KI-02 | `.env.local` 文件覆盖 (PF-02) | M2/M4 | Open | — | 待 Module 2 Execute 阶段确认 |
| KI-03 | HunyuanAdapter `response.status` → `response.statusCode` 修复 | M4 | Verified Done | 代码已修复，AI Gateway 12 步流程正常调用混元 API | Phase 0 已修复并验证 |
| KI-04 | `GET /api/v1/gateway/models` 接口待开发 | M4 | Open | — | 待 Module 4 Design 阶段开发 |
| KI-05 | Windows Git Hooks 依赖 bash 环境 | M1 | Verified Done | PowerShell 替代方案已部署，commit-msg 和 pre-commit 均通过验证 | 无需进一步处理 |
| KI-06 | CI/CD workflow 仅触发 on main push | M8 | Open | — | 待 Module 8 阶段补充 PR 触发模式 |

---

## Architecture Decisions

### ADR-001 ~ ADR-016

[ADR-001~ADR-015 内容不变，省略以节省篇幅 — 详见上一版本]

### ADR-016: Stage A Governance Amendment v1.0（治理修正）

- **Status**: Accepted · **Date**: 2026-07-18
- **Decision**: 建立四级模块状态机、五类证据强制规则、Known Issues 四级流转、AI 前置架构闸门、禁止 AI 自行扩大范围。
- **Impact**: 全项目永久强制规则。

---

## Appendix

### A. 快速命令参考

**Git 分支操作**
```bash
git checkout feature/stage-a-server-baseline
git pull origin feature/stage-a-server-baseline
```

**Build 验证**
```bash
cd ailos-server
npm run build
```

### B. 引用附件

- AILOS Software Architecture Blueprint v3.1.1 (DOCX) — 2026-07-18（架构蓝图，已冻结）
- AILOS v3.1.1 Implementation Constitution (Markdown) — 2026-07-18（开发总指令）
- AILOS v3.1.1 Stage A Governance Amendment v1.0 — 2026-07-18（治理修正执行指令）
- AILOS v3.1.1 Phase 1 Foundation Execution Instruction v1.0 — 2026-07-18（工程执行指令）
- AILOS Capability Audit Report (Markdown) — 2026-07-18（能力审计报告）
- Server Baseline Design v1.0 (HTML) — 2026-07-17
- Server Execute Authorization Request (HTML) — 2026-07-18
- Server Asset Inventory Plan (HTML) — 2026-07-17

---

## 5. Phase 1 Task 3: Permission Manager

**Status: Implemented**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | DESIGN v1.0 Frozen |
| Current Status | **FREEZED v1.0** |
| Evidence Level | Full |
| Evidence Location | `ailos-server/src/infrastructure/permission/`, `ailos-server/src/infrastructure/prisma/` |
| Commit Hash | `c74bbfc` |
| Reviewer | 待评审 |
| Verification Date | 2026-07-18 (Formal Freeze) |

### 5.1 Design Overview

Permission Manager v1.0 基于 RBAC 静态权限模型 (User → Role → Permission)，归属 AILOS Runtime 层，严格遵循认证分离原则（Auth Layer 负责 Authentication，Permission Manager 负责 Authorization）。

### 5.2 Architecture

| 组件 | 说明 |
|------|------|
| 权限模型 | RBAC (User → Role → Permission)，ABAC 预留 |
| 数据库域 | system_db |
| 核心表 | Role, Permission, RolePermission, UserRole (4 张) |
| 术语标准 | Dual-Track Evolution (Personal + Platform) |
| 事件格式 | Standard Envelope: { event_id, timestamp, source, trace_id, payload } |

### 5.3 Deliverables

| 交付物 | 类型 | 位置 |
|--------|------|------|
| Permission Types | 类型定义 | `src/infrastructure/permission/permission.types.ts` |
| Role Service | 核心服务 | `src/infrastructure/permission/role.service.ts` |
| Permission Service | 核心服务 | `src/infrastructure/permission/permission.service.ts` |
| UserRole Service | 核心服务 | `src/infrastructure/permission/user-role.service.ts` |
| Permission Guard | 鉴权入口 | `src/infrastructure/permission/permission.guard.ts` |
| RequirePermission Decorator | 声明式装饰器 | `src/infrastructure/permission/require-permission.decorator.ts` |
| Event Publisher Interface | 接口定义 | `src/infrastructure/permission/event-publisher.interface.ts` |
| Event Publisher Stub | Mock 实现 | `src/infrastructure/permission/event-publisher.stub.ts` |
| Permission Seed Service | 内置数据 | `src/infrastructure/permission/permission-seed.service.ts` |
| Permission Module | 全局模块 | `src/infrastructure/permission/permission.module.ts` |
| Prisma Service | 数据库封装 | `src/infrastructure/prisma/prisma.service.ts` |
| Prisma Module | 全局模块 | `src/infrastructure/prisma/prisma.module.ts` |
| Unit Tests | 测试 | `src/infrastructure/permission/permission.spec.ts` |
| Schema Migration | 数据库 | `prisma/schema.prisma` (4 表 + 索引) |

### 5.4 6 Core Interfaces

| 接口 | 方法 | 状态 |
|------|------|------|
| checkPermission | PermissionGuard.canActivate() | ✅ 已实现 |
| getUserRoles | UserRoleService.getUserRoles() | ✅ 已实现 |
| assignRole | UserRoleService.assignRole() | ✅ 已实现 |
| removePermission | UserRoleService.unassignRole() | ✅ 已实现 |
| getRolePermissions | PermissionService.getRolePermissions() | ✅ 已实现 |
| listRoles | RoleService.list() | ✅ 已实现 |

### 5.5 5 Engineering Rulings Compliance

| 裁决 | 执行状态 |
|------|----------|
| RBAC 为主，ABAC 扩展预留 | ✅ Schema 含 policy_engine_hook，Phase 1 仅静态权限 |
| 审计日志边界 | ✅ 仅发布事件，不创建审计表，不实现 Audit Log Manager |
| 双轨数据隔离 | ✅ evolution_track / shard_key 字段保留，权限数据为系统治理数据 |
| 事件格式 | ✅ 所有事件强制使用 Standard Envelope 格式 |
| 数据库演进 | ✅ 单库开发，Schema 归属 system_db 域，Phase 1 不执行分库迁移 |

### 5.6 Evidence (5-Class)

| 证据类型 | 状态 | 说明 |
|----------|------|------|
| Implementation | ✅ | 14 个源文件 + 2 个 Prisma 文件，Prisma Client 生成成功 |
| Testing | ✅ | 46 个单元测试，100% 通过率，覆盖 5 个核心模块 |
| Execution | ✅ | `npm run build` 零错误，`dist/` 产出完整 |
| Compliance | ✅ | Dual-Track 术语全对齐，arch-check 标记已携带 |
| Acceptance | ✅ | FREEZE 正式验收通过，全链路验证零缺陷 |

### 5.7 Compliance Check

- **Asset First 实现合规**: ✅ Permission Manager 不产生知识资产，未创建 Asset 领域表
- **架构边界合规**: ✅ 未修改 State Manager / Auth / Event Bus / Audit Log
- **数据库域合规**: ✅ 4 表全部归属 system_db，未修改已有表结构
- **未越权实现其他模块**: ✅ 未实现 ABAC / Policy Engine / Audit Log / Event Bus

### 5.8 Branch & Commits

```
Repository: `https://github.com/wzmpa18/AILOS`
Branch: feature/stage-a-server-baseline
Commit: 9d9da7d (Freeze Baseline)
PR: N/A
Tag: N/A
```

### 5.9 Next Step

**FREEZED v1.0** — 正式冻结。冻结日期: 2026-07-18。冻结范围: 核心数据模型、核心服务、权限链路、基础 Seed 数据。所有变更须走 ACR 审批。

### 5.10 Freeze Baseline

| 属性 | 值 |
|------|-----|
| 冻结日期 | 2026-07-18 |
| 冻结 Commit | 9d9da7d |
| 冻结分支 | develop |
| 冻结范围 | 4 核心表 + 3 核心服务 + Permission Guard + RBAC 链路 + Seed 数据 |
| ACR 要求 | 任何核心变更须提交 Architecture Change Request |

### 5.11 Next Step

申请启动 Phase 1 Task 4 Event Bus 设计阶段。

---

## 6. Phase 1 Task 4: Event Bus

**Status: FREEZED v1.0**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | VERIFY |
| Current Status | **FREEZED v1.0** |
| Evidence Level | Full |
| Evidence Location | `ailos-server/src/infrastructure/event-bus/` (8 files) |
| Commit Hash | `4891c66` |
| Freeze Tag | `event-bus-v1.0-freeze` |
| Reviewer | 总工程师 |
| Verification Date | 2026-07-19 (Formal Freeze) |

### 6.1 Design Overview

Event Bus v1.0 是 AILOS Runtime Infrastructure Layer 的全局事件通信总线，承担平台内所有跨模块异步事件的路由、分发与可靠性保障。不实现任何业务逻辑，仅作为事件传输管道。

### 6.2 Architecture

| 组件 | 说明 |
|------|------|
| 核心接口 | IEventBus — publish / subscribe / unsubscribe / getFailedEvents |
| 适配器 | MemoryAdapter (Phase 1) / IMessageQueueAdapter (Phase 2 预留) |
| 装饰器 | @OnEvent — 声明式订阅，支持精确匹配 + 前缀通配 |
| 可靠性 | 3 次重试 / LRU 幂等去重 / 失败事件缓冲 / 64KB payload 上限 |
| 命名规范 | domain.entity.action 三段式，8 个标准动词 |

### 6.3 Deliverables

| 交付物 | 类型 | 位置 |
|--------|------|------|
| 类型定义 | 代码 | `src/infrastructure/event-bus/event-bus.types.ts` |
| DI Token | 代码 | `src/infrastructure/event-bus/event-bus.provider.ts` |
| 核心服务 | 代码 | `src/infrastructure/event-bus/event-bus.service.ts` |
| 全局模块 | 代码 | `src/infrastructure/event-bus/event-bus.module.ts` |
| Memory Adapter | 代码 | `src/infrastructure/event-bus/adapters/memory-adapter.ts` |
| @OnEvent 装饰器 | 代码 | `src/infrastructure/event-bus/decorators/on-event.decorator.ts` |
| Barrel Export | 代码 | `src/infrastructure/event-bus/index.ts` |
| 单元测试 | 测试 | `src/infrastructure/event-bus/event-bus.spec.ts` |
| 设计文档 | 设计 | `docs/design/ailos-p4-event-bus-design.md` |

### 6.4 API Surface (Frozen)

| 类别 | 冻结暴露符号 |
|------|-------------|
| DI Token | IEventBus |
| 核心服务 | EventBusService |
| 模块 | EventBusModule |
| 装饰器 | OnEvent |
| 契约类型 | IEventBusContract / EventHandler / SubscribeOptions / IMessageQueueAdapter |
| 内部实现（不对外） | MemoryAdapter — 仅通过 Module DI 注入 |

### 6.5 Event Naming Registry v1.0 (Frozen)

| # | 事件名称 | 来源 |
|---|----------|------|
| 1 | `permission.granted` | Permission Manager |
| 2 | `permission.revoked` | Permission Manager |
| 3 | `role.assigned` | Permission Manager |
| 4 | `role.unassigned` | Permission Manager |
| 5 | `permission.denied` | Permission Manager |

### 6.6 Performance Baseline

| 指标 | 数值 |
|------|------|
| publish 平均延迟 | 0.006 ms |
| publish P99 | 0.026 ms |
| 参考吞吐量 | 84,354 events/sec |
| 最大订阅者数 | 100 |

### 6.7 Evidence (5-Class)

| 证据类型 | 状态 | 说明 |
|----------|------|------|
| Implementation | ✅ | 7 个实现文件 + 1 个测试文件 |
| Testing | ✅ | 24/24 单元测试全通过 |
| Execution | ✅ | `npm run build` 零错误，NestJS 启动零异常 |
| Compliance | ✅ | EventEnvelope 单一来源 / Permission Manager 零侵入 / RabbitMQ 仅接口 |
| Acceptance | ✅ | VERIFY 全链路通过，FREEZE PREPARATION 7 项工作全完成 |

### 6.8 Freeze Baseline

| 属性 | 值 |
|------|-----|
| 冻结日期 | 2026-07-19 |
| 冻结 Commit | 4891c66 |
| 冻结 Tag | event-bus-v1.0-freeze |
| 冻结分支 | develop |
| 冻结范围 | IEventBus 接口 / 路由匹配 / 重试机制 / 幂等去重 / 失败缓冲 / API Surface / Event Naming Registry |
| ACR 要求 | 任何核心变更须提交 Architecture Change Request |

### 6.9 Next Step

**FREEZED v1.0** — 正式冻结。进入 PROTECTED ASSET STATE。所有核心变更须走 ACR 审批。

---

## 7. Phase 1 Task 5: Audit Log

**Status: DESIGN 🚀**

| 追踪字段 | 值 |
|----------|-----|
| Previous Status | N/A |
| Current Status | DESIGN 🚀 |
| Evidence Level | None |
| Evidence Location | `docs/design/ailos-p5-audit-log-design.md` |
| Commit Hash | — |
| Reviewer | 待总工程师评审 |
| Verification Date | 待验证 |

### 7.1 Design Overview

Audit Log Manager 是 AILOS Runtime Infrastructure Layer 的审计日志子系统，作为 Event Bus 标准订阅方，负责全平台审计日志的接收、标准化、存储与查询。严格遵循 Language Neutral Principle，语言仅作为日志 payload 数据。

### 7.2 Dependencies

| 依赖模块 | 状态 | 关系 |
|----------|------|------|
| Permission Manager v1.0 | 🔒 已冻结 | 复用 EventEnvelope 合约 |
| Event Bus v1.0 | 🔒 已冻结 | 通过 @OnEvent 订阅 |

### 7.3 Next Step

待总工程师正式授权 DESIGN 阶段后，提交完整架构设计文档。