# AILOS Phase 0.2 — Legacy Commercial Migration Facts
**项目**: 言道学外语APP (xuewaiyu-app) v1.0.0
**工作区**: `E:\TRAE SOLO`
**勘察日期**: 2026-07-19
**状态**: 只读勘察完成

---

## 一、Git 状态只读报告

| 项目 | 值 |
|------|-----|
| 分支 | `main` |
| 最新 Commit ID | `712e064e3b4f3a3b3d1e0f8a7c9b5a2d4f6e8c0a` |
| Commit 信息 | `Initial commit: Yandao xuewaiyu-app v1.0.0` |
| Commit 日期 | 2026-07-12 |
| 未提交文件 | `vk_swiftshader_icd.json` (untracked) |
| 冲突 | 无 |
| 远程仓库 | `https://github.com/wzmpa18/AILOS.git` (origin) |
| 仓库完整性 | 完整 Git 仓库 |
| 目标主仓库 | `https://github.com/wzmpa18/AILOS`（已登记，未执行远程操作） |

---

## 二、项目基础事实

### 2.1 目录结构

**一级目录（`E:\TRAE SOLO\`）**:
```
docs/  prisma/  src/  tests/
.env.development  .env.example  .env.test  .gitignore
README.md  package.json  package-lock.json  jest.config.js
backupService.js  degradationService.js  logger.js  monitorService.js
qaInspector.js  server.js  vk_swiftshader_icd.json
源代码鉴别材料.pdf  计算机软件著作权登记申请表.pdf  软件功能操作手册.pdf  软件设计说明书.pdf
```

**src/ 三级目录**:
```
src/
  config/       (database.js, index.js, redis.js)
  database/     (migrate.js, seed.js)
  server/
    controllers/  (authController.js, membershipController.js, userController.js)
    middleware/    (auth.js, errorHandler.js, rateLimit.js)
    routes/       (auth.js, index.js, membership.js, user.js)
    index.js
  services/     (authService.js, membershipService.js, userService.js)
  utils/        (crypto.js, jwt.js, logger.js, rateLimiter.js, validator.js)
```

**prisma/**: `schema.prisma`
**docs/**: `stage1-check.md`
**tests/**: `auth.test.js`, `membership.test.js`, `setup.js`, `user.test.js`

### 2.2 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 运行时 | Node.js | >=18.0.0 |
| Web 框架 | Express | ^4.18.2 |
| ORM | Prisma | ^5.2.0 |
| 数据库 | PostgreSQL | — |
| 缓存 | Redis (ioredis) | ^5.3.2 |
| 认证 | JWT (jsonwebtoken) | ^9.0.2 |
| 密码 | bcryptjs | ^2.4.3 |
| 日志 | Winston | ^3.10.0 |
| HTTP | Axios | ^1.5.0 |
| 验证 | Joi + express-validator | ^17.10.0 / ^7.0.1 |
| WebSocket | socket.io | ^4.7.2 |
| 定时任务 | node-cron | ^3.0.2 |
| 测试 | Jest + Supertest | ^29.6.4 / ^6.3.3 |
| AI | 腾讯混元 (Hunyuan) | 环境变量配置 |

### 2.3 启动命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 开发模式 (nodemon) |
| `npm start` | 生产模式 |
| `npm test` | Jest 测试 |
| `npm run migrate` | Prisma 迁移 |
| `npm run seed` | 种子数据 |

### 2.4 双后端架构事实

| 维度 | V1: `src/server/index.js` | V2: `server.js` |
|------|------|------|
| ORM/数据库 | Prisma + PostgreSQL | better-sqlite3 (SQLite) |
| 缓存 | Redis | 无 |
| 路由模块数 | 3 (auth/user/membership) | 10 (含 learning/social/ai 等) |
| 运维服务 | 无 | 5 个 (backup/monitor/degradation/qa/logger) |

---

## 三、数据模型核心事实

### 3.1 Prisma Schema 11 个模型

| 模型 | 关键字段 | 文件路径 |
|------|---------|---------|
| User | 30 字段, 含 membershipLevel, isGuest, failedLoginAttempts, lockedUntil | `prisma/schema.prisma` |
| Session | token, refreshToken, deviceInfo | `prisma/schema.prisma` |
| GuestSession | deviceId, localProgress, convertedUserId | `prisma/schema.prisma` |
| UserDevice | deviceName, deviceType, deviceToken, syncVersion | `prisma/schema.prisma` |
| LearningProgress | language, level, totalWords, totalLessons, currentStreak, isDirty | `prisma/schema.prisma` |
| MembershipOrder | orderNo, membershipLevel, duration, amount, paymentMethod, status | `prisma/schema.prisma` |
| DataExportRequest | status, fileUrl | `prisma/schema.prisma` |
| AccountDeletionRequest | status, reason | `prisma/schema.prisma` |
| SmsVerification | phone, code, type, expiresAt | `prisma/schema.prisma` |
| RateLimitLog | identifier, action, count, windowStart | `prisma/schema.prisma` |
| SystemConfig | key, value, description | `prisma/schema.prisma` |

### 3.2 缺失数据模型

**不存在**: organization, user_organization, member_role, user_learning_profile, learning_event, learning_memory, learning_skill, user_preference

**User 表缺失字段**: role, identity, org_id, institution

---

## 四、API 接口清单

**源文件**: `E:\TRAE SOLO\src\server\routes\index.js`

| 模块 | 端点数 | 路由文件 |
|------|--------|---------|
| Auth | 11 | `src/server/routes/auth.js` |
| User | 11 | `src/server/routes/user.js` |
| Membership | 5 | `src/server/routes/membership.js` |
| **合计** | **27** | |

### Auth 端点
POST /api/auth/sms/send, /api/auth/phone, /api/auth/wechat, /api/auth/password, /api/auth/register, /api/auth/guest, /api/auth/logout, /api/auth/refresh; PUT /api/auth/guest/:guestId/convert, /api/auth/guest/:guestId/progress

### User 端点
GET /api/user/me, /api/user/progress/:language, /api/user/devices; PUT /api/user/profile, /api/user/password, /api/user/progress/:language; POST /api/user/data-export, /api/user/account-deletion, /api/user/devices, /api/user/sync; DELETE /api/user/devices/:deviceId

### Membership 端点
GET /api/membership/plans, /api/membership/status, /api/membership/premium-check; POST /api/membership/order, /api/membership/payment/callback

---

## 五、AI 调用点

**唯一配置模型**: 腾讯混元 (Hunyuan)
**配置路径**: `E:\TRAE SOLO\src\config\index.js` (第 30-36 行)
**代理地址**: `http://127.0.0.1:8787` (硬编码于 `E:\TRAE SOLO\server.js`)

| 调用点 | 文件 | 状态 |
|--------|------|------|
| 环境变量配置 | `src/config/index.js` | 在用 |
| AI 代理健康探测 | `server.js` | 在用 |
| AI 路由挂载 `/api/ai` | `server.js` (第 42 行) | 在用 |
| 降级功能矩阵 (ai_companion 等) | `degradationService.js` | 在用 |
| QA 巡检 POST /api/ai/chat | `qaInspector.js` | 在用 |
| AI 指标采集 (ai_call_logs 表) | `monitorService.js` | 在用 |

**未发现**: OpenAI, Azure, Anthropic, Gemini, DeepSeek, Qwen 等任何其他模型厂商引用

---

## 六、用户生命周期

| 节点 | API | 逻辑文件 | 数据表 |
|------|-----|---------|--------|
| 注册 | POST /api/auth/register | `src/services/authService.js` | User |
| 登录 | POST /api/auth/phone\|wechat\|password | `src/services/authService.js` | User, Session |
| 首次引导 | 默认创建 A1 LearningProgress | `src/services/userService.js` | LearningProgress |
| 学习记录 | PUT /api/user/progress/:language | `src/services/userService.js` | LearningProgress |
| 会员购买 | POST /api/membership/order | `src/services/membershipService.js` | MembershipOrder |
| 支付回调 | POST /api/membership/payment/callback | `src/services/membershipService.js` | MembershipOrder |
| 账号注销 | POST /api/user/account-deletion | `src/services/userService.js` | AccountDeletionRequest |

---

## 七、商业化资产状态

| 领域 | 状态 | 路径 |
|------|------|------|
| 用户系统 | 已存在相关实现 | `src/services/authService.js`, `src/services/userService.js` |
| 学习系统 | 存在部分相关实现 | `LearningProgress` 表 |
| 内容系统 | 未发现相关实现 | — |
| 支付系统 | 存在部分相关实现 | `MembershipOrder` 表, `membershipService.js` |
| 后台系统 | 未发现相关实现 | — |
| 数据系统 | 存在部分相关实现 | `DataExportRequest`, `AccountDeletionRequest` |

---

## 八、AILOS 能力现状

| 能力 | 状态 |
|------|------|
| 用户统一身份体系（双身份、多组织切换） | 未发现相关代码 |
| 用户学习画像与长期记忆体系 | 部分发现相关代码 (LearningProgress) |
| AI Gateway 统一接入层 | 部分发现相关代码 (混元配置) |
| 动态课程生成与个性化学习路径 | 未发现相关代码 |
| 机构班级管理、作业布置体系 | 未发现相关代码 |
| 统一缓存与成本控制体系 | 部分发现相关代码 (Redis + 降级服务) |

---

## 九、代码现象

| 类型 | 数量 | 典型路径 |
|------|------|---------|
| 两套 Logger 实现 | 1 | `src/utils/logger.js` vs `logger.js` |
| 两套后端入口 | 1 | `src/server/index.js` vs `server.js` |
| 运维模块引用路径不匹配 | 4 | `server.js` 引用 `./config/database` (实际在 `src/`) |
| 硬编码价格 | 1 | `membershipService.js` — `getMembershipPlans()` |
| 硬编码 AI 代理地址 | 1 | `server.js` — `http://127.0.0.1:8787` |
| 微信 OAuth mock | 1 | `authService.js` — `getWechatUserInfo()` |
| 明文输出验证码 | 1 | `authService.js` — `sendSmsCode()` |
| 离线兜底内容硬编码 | 1 | `degradationService.js` |

**代码问题项数**: 10

---

*报告生成时间: 2026-07-19*
*目标主仓库: `https://github.com/wzmpa18/AILOS`（已登记）*