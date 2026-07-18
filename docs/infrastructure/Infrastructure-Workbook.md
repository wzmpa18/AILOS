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
| 2026-07-18 | M2 | Execute Authorization Request Submitted | `d015a32` | Pending Review |
| 2026-07-18 | M2 | Workbook Initialized | *(this commit)* | Done |

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

**Status: Design Approved → Awaiting Execute Authorization**

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

**Server Execute Authorization Request** 已提交，等待审批。

| 项目 | 内容 |
|------|------|
| 提交日期 | 2026-07-18 |
| 状态 | Pending Review |
| 授权范围 | Inventory Execute / Backup / Cleanup / Initialize / Verify |
| 有效期 | 审批通过后 7 个自然日 |
| AI Provider | 不涉及 (归属 Module 4) |

**所需权限 (P1-P6)**:
- P1: 服务器 IP
- P2: SSH 端口
- P3: SSH 用户名 (sudo)
- P4: SSH 登录凭据
- P5: sudo 权限 (含 apt/systemctl)
- P6: 登录说明 (跳板机/VPN 等)

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

**Status: Pending (Blocked by Authorization)**

Inventory Plan 已通过评审 (2026-07-17)。待授权后执行真实盘点。

盘点维度: 运行环境 / 网络与域名 / 存量项目 / 数据资产 / 系统配置

四级资产分类:
- **A**: 保留 (AILOS 必需)
- **B**: 备份后清理 (潜在价值)
- **C**: 直接清理 (确认无用)
- **D**: 需确认 (待人工判断)

### 2.8 Confirm

**Status: Pending (Blocked by P1)**

### 2.9 Backup

**Status: Pending (Blocked by P2)**

强制约束: 未完成备份有效性校验，禁止进入 Cleanup 阶段。

### 2.10 Cleanup

**Status: Pending (Blocked by P3)**

清理范围: 旧言道项目、测试项目、历史部署目录、废弃数据库、冗余 Nginx/PM2 配置、历史日志。

不可逆操作须在工作簿中列出待操作清单，经人工确认后方可执行。

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
- [ ] M2-05: 获取服务器授权凭据
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