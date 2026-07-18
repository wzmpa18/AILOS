# Infrastructure Workbook

**AILOS Infrastructure Baseline v1.0 — Stage A 唯一正式交付物**

| 属性 | 值 |
|------|-----|
| 版本 | 1.0.0 (Baseline) |
| 状态 | Active |
| 最后更新 | 2026-07-18 |
| 关联仓库 | `https://github.com/wzmpa18/AILOS` |
| 当前分支 | `feature/stage-a-server-baseline` |
| 治理规范 | Stage A 基础设施交付体系正式规范（最终冻结版） |

---

## 0. Execution Log

| Date | Module | Checkpoint | Commit | Status |
|------|--------|------------|--------|--------|
| 2026-07-17 | M1 | Repository Baseline Verified | `543161b` | Archived |
| 2026-07-17 | M2 | Inventory Plan Approved | `28b25d6` | Done |
| 2026-07-17 | M2 | Design v1.0 Approved | `6ae2471` | Done |
| 2026-07-18 | M2 | Execute Authorization Request Submitted | `d015a32` | Done |
| 2026-07-18 | M2 | Workbook Initialized | `c8b52b0` | Done |
| 2026-07-18 | M2 | Authorization Approved | *(this commit)* | Done |
| 2026-07-18 | Audit | Code Capability Audit Completed | *(this commit)* | Done |

---

## 1. Module 1: Repository Baseline

**Status: Archived (2026-07-17)**

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

### 1.3 Branch Model

- `main` — 生产就绪代码，受保护分支
- `develop` — 集成分支
- `feature/*` — 功能开发分支
- `hotfix/*` — 紧急修复分支

### 1.4 Commit Convention

Conventional Commits 格式，AILOS 专用 scopes: `infra`, `repo`, `server`, `env`, `ai`, `deploy`, `preview`, `db`, `ci-cd`, `docs`, `security`

### 1.5 Git Hooks

- **commit-msg**: commitlint 校验，Windows 通过 PowerShell wrapper + .ps1 分离模式支持
- **pre-commit**: 合规扫描（敏感文件拦截、硬编码 API Key 检测、直连 AI Provider 拦截）

### 1.6 Security Redlines

- R1: 密钥不入库
- R2: `.env.local` 不入库
- R3: 禁止直连 AI Provider API
- R4: `.gitignore` 覆盖所有敏感文件类型
- R5: PR 必须经过合规检查

### 1.7 Verification

- 0 合规违规
- Windows PowerShell 环境 Git Hooks 验证通过
- Commit 消息校验通过
- PR #1: `https://github.com/wzmpa18/AILOS/pull/1` (Open, 待 Stage A 完成后合并)

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

**Status: Authorized → Checkpoint 1: Inventory Execute**

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

### 2.7 Inventory

**Status: In Progress — Checkpoint 1**

Inventory Plan 已通过评审 (2026-07-17)。授权已批准，启动真实盘点。

盘点维度: 系统信息 / 硬件资源 / 运行服务 / 数据库 / 目录结构 / 端口占用 / 定时任务

四级资产分类:
- **A**: 保留 (AILOS 必需)
- **B**: 备份后清理 (潜在价值)
- **C**: 直接清理 (确认无用)
- **D**: 需确认 (待人工判断)

### 2.8 Confirm

**Status: Pending (Blocked by P1)**

#### 2.8.1 核心资产保护政策 (ADR-007)

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

#### 2.8.2 默认清理规则

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

### 2.9 Backup

**Status: Pending (Blocked by P2)**

强制约束: 未完成备份有效性校验，禁止进入 Cleanup 阶段。

### 2.10 Cleanup

**Status: Pending (Blocked by P3)**

清理范围: 旧言道项目、测试项目、历史部署目录、废弃数据库、冗余 Nginx/PM2 配置、历史日志。

不可逆操作须在工作簿中列出完整待操作清单，经人工回复「确认执行」后方可操作。

### 2.11 Initialize

**Status: Pending (Blocked by P4)**

### 2.12 Verify

**Status: Pending (Blocked by P5)**

### 2.13 Rollback

回滚矩阵 (DB/Config/文件/组件/全量 五级)，详见 Design v1.0。

---

## 3. Module 3: Environment Baseline

**Status: Pending (Blocked by M2)**

| 项目 | 内容 |
|------|------|
| 依赖 | Module 2 Server Baseline 验收通过 |
| 范围 | 多环境配置管理 (dev/staging/prod)、环境变量规范、配置同步机制 |

---

## 4. Module 4: AI Provider Baseline

**Status: Pending (Blocked by M3)**

| 项目 | 内容 |
|------|------|
| 依赖 | Module 3 Environment Baseline 验收通过 |
| 范围 | 腾讯混元 (Hunyuan)、TokenHub 接入、费率控制、模型路由、降级策略 |
| 凭据 | 仅在 Execute 阶段提供，Module 2 不申请、不保存、不使用 |

---

## 5. Module 5: Deployment Baseline

**Status: Pending (Blocked by M4)**

---

## 6. Module 6: Preview Environment

**Status: Pending (Blocked by M5)**

---

## 7. Module 7: Database Baseline

**Status: Pending (Blocked by M6)**

---

## 8. Module 8: CI/CD Baseline

**Status: Pending (Blocked by M7)**

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
- [ ] M2-06: P1 — Inventory Execute (真实盘点)
- [ ] M2-07: P2 — Confirm (资产确认)
- [ ] M2-08: P3 — Backup (全量备份 + 验证)
- [ ] M2-09: P4 — Cleanup (分级清理)
- [ ] M2-10: P5 — Initialize (环境初始化)
- [ ] M2-11: P6 — Verify (验收验证)
- [ ] M2-12: Module 2 正式验收归档

---

## Known Issues

| ID | 描述 | 模块 | 状态 | 计划 |
|----|------|------|------|------|
| KI-01 | TokenHub IP 白名单更新 (PF-01) | M4 | Open | 待 Module 4 Execute 阶段处理 |
| KI-02 | `.env.local` 文件覆盖 (PF-02) | M2/M4 | Open | 待 Module 2 Execute 阶段确认 |
| KI-03 | HunyuanAdapter `response.status` → `response.statusCode` 修复 | M4 | Fixed | 已在 Phase 0 修复 |
| KI-04 | `GET /api/v1/gateway/models` 接口待开发 | M4 | Open | 待 Module 4 Design 阶段设计 |
| KI-05 | Windows Git Hooks 依赖 bash 环境 | M1 | Known | PowerShell 替代方案已部署 |
| KI-06 | CI/CD workflow 仅触发 on main push | M8 | Open | 待 Module 8 添加 PR 触发模式 |

---

## Architecture Decisions

### ADR-001: Infrastructure Workbook 作为唯一交付物

- **Status**: Accepted
- **Date**: 2026-07-18
- **Decision**: 所有 Stage A 模块的方案设计、执行记录、验收结论、架构决策统一维护于 `docs/infrastructure/Infrastructure-Workbook.md`，Git Commit History 作为唯一版本追溯依据。禁止为同一模块生成多份平级的过程性文档。
- **Impact**: 现有 HTML 报告保留为参考附件，后续所有阶段更新仅追加至 Workbook，不再创建独立报告。

### ADR-002: Repository Baseline 分支模型

- **Status**: Accepted
- **Date**: 2026-07-17
- **Decision**: 采用 main/develop/feature/*/hotfix/* 四分支模型，保护 main 和 develop 分支。PR 合并使用 Squash and Merge。
- **Impact**: 所有开发必须遵循分支模型，PR 需要至少 1 个 approve + CI 通过。

### ADR-003: Conventional Commits + AILOS Scopes

- **Status**: Accepted
- **Date**: 2026-07-17
- **Decision**: Commit 消息遵循 Conventional Commits 格式，使用 AILOS 专用 scopes。
- **Impact**: 所有 Commit 消息必须通过 commitlint 校验。

### ADR-004: Server Baseline 纯净化目标

- **Status**: Accepted
- **Date**: 2026-07-17
- **Decision**: Server Baseline 以建立 AILOS 专属纯净运行环境为核心目标，不以兼容存量旧环境为前提。旧项目备份后清理，确需保留的资产单独说明。
- **Impact**: 清理范围覆盖旧言道项目、测试项目、历史部署、废弃数据库、冗余配置、历史日志。

### ADR-005: 单服务器部署 + 多机架构预留

- **Status**: Accepted
- **Date**: 2026-07-17
- **Decision**: 当前阶段采用单台 Ubuntu 22.04 LTS 服务器承载全部 AILOS 服务。多机集群、负载均衡、读写分离等架构属于 v2.0+ 远期规划。
- **Impact**: 目录结构、Nginx 配置、Systemd 服务均不预留多机扩展，但 `/opt/ailos/` 根目录结构支持后续扩展。

### ADR-006: AI Provider 凭据延期至 Module 4

- **Status**: Accepted
- **Date**: 2026-07-17
- **Decision**: 腾讯混元 SecretId/SecretKey、TokenHub 密钥等 AI Provider 凭据不在 Module 2 申请、保存或使用，统一在 Module 4 Execute 阶段提供。
- **Impact**: Module 2 的 .env.local 配置、备份脚本、验证脚本均不涉及 AI Provider 相关配置。

### ADR-007: 核心资产保护政策 (P0-P3 分级)

- **Status**: Accepted
- **Date**: 2026-07-18
- **Decision**: 建立 P0-P3 四级资产分级体系：P0（绝对禁止丢失，如用户数据/密钥/SSL证书）→ P1（可恢复需备份，如代码/配置模板）→ P2（可重新部署，如部署目录/编译产物）→ P3（可直接清理，如日志/缓存/测试项目）。P0 资产与服务器生命周期完全解耦。
- **Impact**: 全项目所有阶段强制执行。所有服务器操作、版本升级、环境重构必须遵守本规则。P0 资产默认禁止删除/覆盖/移动，须具备独立备份与恢复方案。数据迁移遵循「备份→恢复→验证→切流→保留观察→确认删除」全流程。本政策为项目永久基线规则，优先级高于所有其他执行规范。

---

## Appendix

### A. 快速命令参考

**Git 分支操作**
```bash
git checkout feature/stage-a-server-baseline
git pull origin feature/stage-a-server-baseline
```

**Workbook 更新流程**
```bash
# 1. 编辑 Workbook
vim docs/infrastructure/Infrastructure-Workbook.md

# 2. 提交更新
git add docs/infrastructure/Infrastructure-Workbook.md
git commit -m "docs(infra): update workbook - [checkpoint description]"

# 3. 推送
git push origin feature/stage-a-server-baseline
```

**服务器组件版本锁定**
```bash
sudo apt-mark hold nodejs redis-server mariadb-server nginx
apt-mark showhold
```

### B. 引用附件

以下为 Module 2 已交付的独立文档，作为 Workbook 的参考附件保留（不再更新）:

- Server Baseline Design v1.0 (HTML) — 2026-07-17
- Server Execute Authorization Request (HTML) — 2026-07-18
- Server Asset Inventory Plan (HTML) — 2026-07-17
- AILOS Capability Audit Report (Markdown) — 2026-07-18
