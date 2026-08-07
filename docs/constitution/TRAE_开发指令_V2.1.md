# TRAE 开发指令 V2.1

## 仓库已公开，同步已打通

仓库 `https://github.com/wzmpa18/AILOS` 已设为**公开**，服务器通过 `codeload.github.com` 可直连下载。以后你每次推送后告诉我 commit hash，我来部署验收。

## 上一轮验收发现（efc0211 之后必须修复）

### 🔴 Bug 1：routes/index.js 双重 /api 前缀

**文件**：`src/server/routes/index.js`

`server/index.js` 已经 `app.use('/api', routes)`，所以 routes/index.js 中**不要再加 `/api` 前缀**。

```js
// ❌ 当前代码（错误）
router.use('/api/dashboard', require('./dashboard'));
router.use('/api/checkin', require('./checkin'));

// ✅ 修复为
router.use('/dashboard', require('./dashboard'));
router.use('/checkin', require('./checkin'));
router.use('/auth', require('./auth'));
router.use('/language', require('./language'));
```

### 🔴 Bug 2：auth.js 方法名不匹配

**文件**：`src/server/routes/auth.js`

控制器实际方法名与路由引用的不一致，导致启动报错 `Route.post() requires a callback function but got a [object Undefined]`。

| 路由引用的旧名 | 控制器实际方法名 | 修复 |
|---|---|---|
| `sendCode` | `sendSmsCode` | 改路由 |
| `phoneLogin` | `phoneAuth` | 改路由 |
| `passwordLogin` | `passwordAuth` | 改路由 |
| `wechatLogin` | `wechatAuth` | 改路由 |

已在服务器端修复。**你必须在 GitHub 仓库中也修复这两个 Bug，下次提交前确认无遗漏。**

---

## 下一步：Module 01 收尾 + Module 02 语言学习核心

### Module 01 剩余（优先级最高）
1. 修复上述两个 Bug 并推送
2. 用户注册时自动初始化签到记录（register API 收到 `{}` 空 body 也会创建用户，需要校验必填字段）
3. Dashboard API 确认返回 `checkInStreak` + `todayCheckedIn` 字段

### Module 02：语言学习核心（待启动）
- 课程 CRUD API
- 单词/句子学习接口
- 学习进度追踪
- AI 对话练习接口

---

## 工作流

```
你写代码 → git push → 通知我 commit hash
    ↓
CodeBuddy 自动部署验收（codeload 下载 → 服务器部署 → API 测试）
    ↓
发现问题 → 反馈给你修复
```

## 注意

- **先修 Bug1 和 Bug2**，否则下次部署同样崩
- 推送前在本地确认 `npm start` 不报错
- 所有 API 需 `authenticate` 中间件保护（未登录返回 401）
