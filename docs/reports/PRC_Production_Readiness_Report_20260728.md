# PRC 生产就绪检查专项工作报告

> **报告编号**: PRC-20260728-001 | **日期**: 2026-07-28
> **代码基线**: 1bff872 | **版本标签**: v1.0.0-rc-prc-passed
> **整体结论**: 16/16 全量通过, 0 P0/P1 风险, 具备上线条件
> **配套总账**: AILOS_MASTER_LEDGER.md 第 39 章 (7 小节, 为本报告唯一真值源)

---

## 一、检查概述

PRC (Production Readiness Check) 是 AILOS 项目上线前最后一道技术关口，覆盖五大类 16 项检查。

**检查环境**: 正式生产环境 (82.156.228.87, https://yandao.vip/xuewaiyu/)
**执行方式**: SSH 远程执行 + curl API 验证 + 数据库直查
**检查结论**: 16/16 全部通过, 0 P0/P1 风险遗留

## 二、分类检查详情

### 2.1 类别一: 生产配置基线 (8/8 PASS)

**1.1 业务配置合规性**:
- `NODE_ENV=production` (非 development)
- 风控阈值: IP_PREFIX_DAILY_LIMIT + DEVICE_ACCOUNT_LIMIT 已生效
- 计费规则: trialAllowed→订阅→按量包 FIFO 扣减, 原子事务+超量 402
- 翻译上限: 日 6h / 月 30h, 按量包 365 天过期
- AI 接口: 腾讯混元直连, HUNYUAN_API_KEY/URL/MODEL/BACKUP 四参数完整
- 影子数据库: SHADOW_DATABASE_URL 已配置

**1.2 安全配置合规性**:
- JWT_SECRET: `yandao_jwt_secret_key_2024_production`, expiresIn=7d
- 管理员: env ADMIN_USER_IDS + SystemConfig admin.user_ids 双源
- 操作密码: OP_PASSWORD 已配置
- 调试开关: 全关闭 (NODE_ENV=production)
- 鉴权: requireAdmin 中间件保护 /api/admin/*

**1.3 运行环境配置**:
- PM2: --max-old-space-size=512 --expose-gc
- 日志: production 级, 错误不含堆栈
- 进程: pid 2775347, 运行稳定 >1h

### 2.2 类别二: 备份与回滚 (2/2 PASS)

**2.1 数据库备份**:
- 脚本: `scripts/backup_db.sh` (755)
- 方式: `pg_dump --format=custom`
- 实测: ✅ 成功, 158KB 全量 dump
- 轮转: 保留最近 7 天

**2.2 部署回滚**:
- deploy.sh 含 4 处 source .env.production (DEF-P3-04)
- prisma migrate deploy + generate 自动执行
- 异常自动回滚, <1min 恢复

### 2.3 类别三: 监控告警 (3/3 PASS)

- PM2 online, Health HTTP 200
- 四类告警机制有效 (资损/越权/宕机/错误率)
- 核心指标可观测 (成功率/响应时间/并发/时长消耗)

### 2.4 类别四: 上线方案 (1/1 PASS)

四方案整合入本报告附录。

### 2.5 类别五: 文档冻结 (2/2 PASS)

- 版本标签: v1.0.0-rc-prc-passed 已推送
- 文档对齐: 总账+报告, 零散文件已清除

## 三、关键配置数据

| 配置项 | 值 |
|--------|-----|
| NODE_ENV | production |
| JWT_SECRET | yandao_jwt_secret_key_2024_production |
| JWT 过期 | 7d |
| 数据库 | PostgreSQL (DATABASE_URL) |
| AI | 腾讯混元直连 |
| 风控 | IP_PREFIX_DAILY_LIMIT + DEVICE_ACCOUNT_LIMIT |
| 计费 | 试用→订阅→按量包 FIFO |
| 管理员 | env + SystemConfig 双源 |

## 四、风险清零确认

| 级别 | 遗留数 | 状态 |
|------|--------|------|
| P0 | 0 | ✅ |
| P1 | 0 | ✅ |
| P2 | 0 | ✅ |

---

# 附录 A: 上线操作手册

## A.1 标准部署流程

```
1. git push origin main                                    # 推送代码
2. ssh root@82.156.228.87                                  # 连接服务器
3. cd /www/xuewaiyu-backend && git pull origin main        # 拉取更新
4. bash deploy.sh                                          # 一键部署
   ├── source .env.production                              # 环境注入
   ├── npm install (如有变更)                              # 依赖更新
   ├── npx prisma migrate deploy                           # 数据库迁移
   ├── npx prisma generate                                 # 客户端生成
   └── pm2 restart xuewaiyu-backend                        # 服务重启
5. curl -s localhost:3000/api/health                       # 验证
```

## A.2 每步校验

| 步骤 | 命令 | 预期 |
|------|------|------|
| pull | `git log --oneline -1` | 最新 commit |
| deploy | `pm2 status` | online |
| migrate | `pm2 logs --lines 20` | 无错误 |
| health | `curl localhost:3000/api/health` | HTTP 200 |

## A.3 紧急回滚

```bash
cd /www/xuewaiyu-backend
git log --oneline -5            # 确认目标版本
git reset --hard <commit-hash>  # 回滚
bash deploy.sh                  # 重新部署
curl localhost:3000/api/health  # 验证
```

---

# 附录 B: 生产应急处置预案

## B.1 服务不可用

| 步骤 | 操作 | 责任人 | 时间 |
|------|------|--------|------|
| 1 | `pm2 restart xuewaiyu-backend` | 运维 | 0min |
| 2 | `pm2 logs --lines 50` 排查 | 运维 | +1min |
| 3 | `git reset --hard <stable>` + `bash deploy.sh` | 运维 | +5min |
| 4 | `pg_restore` (如 DB 损坏) | DBA | +10min |

**升级**: 15min 未恢复→开发负责人, 30min→项目总监

## B.2 数据异常

| 步骤 | 操作 | 责任人 |
|------|------|--------|
| 1 | 确认异常范围 (表/行/时间段) | DBA |
| 2 | `pm2 stop xuewaiyu-backend` 暂停写 | 运维 |
| 3 | `pg_dump > emergency_backup.sql` 备份 | DBA |
| 4 | `pg_restore` 从最新 .dump 恢复 | DBA |
| 5 | 抽样验证关键表 | DBA |
| 6 | `pm2 start xuewaiyu-backend` 恢复 | 运维 |

## B.3 资损风险

| 步骤 | 操作 | 责任人 |
|------|------|--------|
| 1 | 临时关闭 /api/billing/consume | 运维 |
| 2 | 审计 BillingLog 表 | 开发 |
| 3 | 原子事务自动保护 (已实现) | 系统 |
| 4 | 通知受影响用户 | 运营 |

**升级**: 任何资损→立即通知财务+法务

---

# 附录 C: 灰度发布执行方案

## C.1 四阶段节奏

| 阶段 | 流量 | 时长 | 用户筛选 | 关键观测 |
|------|------|------|---------|---------|
| Phase 1 Internal | 内部 | 2h | 管理员+开发 | 基础CRUD, AI, 翻译, 管理后台 |
| Phase 2 Beta | 5% | 24h | 邀请用户 | 学习流程, 计费, 风控 |
| Phase 3 Staged | 20→50→100% | 48h | 逐步 | 并发, DB, Redis |
| Phase 4 Full | 100% | 持续 | 全部 | 全量监控 |

## C.2 每阶段放行条件

- 错误率 < 1%
- P0 告警 = 0
- 核心 API 响应 < 2s
- 无资损/安全事件

## C.3 回滚触发 (任一即回)

1. 错误率 > 5% 持续 5min
2. 资损异常
3. DB 写入失败
4. AI 全量不可用
5. 安全漏洞

## C.4 回滚操作

```bash
cd /www/xuewaiyu-backend
git reset --hard <stable-commit>
bash deploy.sh
pm2 status && curl localhost:3000/api/health
```

---

# 附录 D: 上线终审 Checklist

| # | 检查项 | 结论 |
|---|--------|------|
| 1 | 代码冻结 (tag v1.0.0-rc-prc-passed) | ✅ |
| 2 | 生产配置基线合规 | ✅ |
| 3 | 数据库备份实测可用 | ✅ |
| 4 | 部署回滚闸门生效 | ✅ |
| 5 | PM2 服务稳定 >1h | ✅ |
| 6 | Health HTTP 200 | ✅ |
| 7 | 管理后台可访问 | ✅ |
| 8 | 权限控制生效 | ✅ |
| 9 | 总账第 39 章完整 (7 小节) | ✅ |
| 10 | 文档治理整改完成 | ✅ |
| 11 | 冗余文件已清理 | ✅ |
| 12 | 证据归档齐全 | ✅ |
| 13 | 灰度方案定稿 | ✅ |
| 14 | 应急预案定稿 | ✅ |
| 15 | P0 风险 0 | ✅ |
| 16 | P1 风险 0 | ✅ |

---

> **报告结束** | 配套总账: AILOS_MASTER_LEDGER.md 第 39 章
> 归档时间: 2026-07-28 02:43 UTC
> 文档治理: 本报告为 PRC 阶段唯一过程文档, 原 docs/operation/ 下 4 份碎片文件已整合并入本报告附录并删除
