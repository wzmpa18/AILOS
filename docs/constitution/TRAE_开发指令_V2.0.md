# TRAE 开发指令 V2.0 — AILOS MVP 冲刺

## ⚠️ 关键变更：角色分离

| 角色 | 负责 | 工具 |
|------|------|------|
| **TRAE** | 写代码、推 GitHub | 本地开发环境 |
| **CodeBuddy (我)** | 服务器部署、验收审计、运维 | SSH 直接操作服务器 |

**TRAE 你不需要操心任何服务器操作**。代码推送到 GitHub 后，我会负责拉取、部署、重启、验证。项目负责人也不再需要手动执行服务器命令。

---

## 交付物（按优先级）

### P0 — MVP 全部功能开发

严格按照 AILOS 最终开发总目标的 Module 01-10 顺序，逐模块完成。

**当前状态**：Module 01（用户系统）基础已完成，服务器已修复并正常运行。

**起始点**：从 Module 01 剩余工作开始（签到 API 自测、用户初始化验证），然后依次推进。

开发方式：设计 → 接口 → 数据库 → 后端 → 前端 → 联调 → 测试 → 冻结

代码推送后，我会在服务器上：
```
git pull → prisma generate → pm2 restart → API测试 → 验收报告
```

### P1 — 自动部署 (GitHub → 腾讯云)

实现 GitHub push → 自动部署到服务器的完整流水线。

要求在仓库中添加 `.github/workflows/deploy.yml`，内容：
- 触发条件：push 到 main 分支
- 通过 SSH 连接服务器，执行 `git pull && npm install && npx prisma generate && pm2 reload ecosystem.config.js --env production`

### P2 — 自动错误采集 (Sentry)

集成 Sentry 到前端和后端：
- 后端：`@sentry/node` 捕获 Express 错误
- 前端：`@sentry/browser` 捕获 JS 错误
- 配置：DSN 通过环境变量注入

### P3 — 自动监控 (Uptime Kuma)

服务器上部署 Uptime Kuma，监控：
- `https://yandao.vip` HTTP 200
- `https://yandao.vip/api/health` HTTP 200 + JSON valid
- PostgreSQL + Redis 连接状态

---

## 工作流程

```
TRAE写代码 → git push → 通知我 → 我拉取部署 → 我验收审计 → 反馈结果
```

**TRAE 你只需要**：
1. 按要求写代码
2. 推送到 `https://github.com/wzmpa18/AILOS`
3. 按汇报格式输出进度

**我会处理**：
1. 服务器拉取 + 部署
2. API 测试 + 浏览器验证
3. 数据库一致性检查
4. 错误日志分析
5. 验收报告输出

---

## 禁止事项

- ❌ 不要让项目负责人手动执行任何服务器命令
- ❌ 不要修改服务器配置文件（Nginx/PM2/环境变量）
- ❌ 不要偏离模块顺序
- ❌ 不要纠结于非阻塞性 Bug

---

## 汇报格式

每次完成一段工作后输出：
```
1. 当前模块：Module XX - 模块名
2. 模块完成率：XX%
3. 已完成：具体功能列表
4. 剩余工作：待完成项
5. 当前阻塞：有/无，具体原因
6. 已推送：commit hash
7. 需要我验收：具体验收点
```

---

## 立即开始

从 **Module 01 用户系统** 当前状态继续：
1. 确认签到 API (`GET/POST /api/checkin`) 完整功能
2. 确认 Dashboard API 返回 `checkInStreak` + `todayCheckedIn`
3. 完成 Module 01 所有 DoD 项的自测
4. 推送代码

我等你第一个 commit。
