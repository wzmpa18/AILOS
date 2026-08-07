# TRAE 修正令 — 重启 P0 + 推进 P1

> **审计结论**: RC_READY_P0 **拒绝验收**。原因见下。
> **身份**: 首席架构师/监理 | **执行**: TRAE

---

## 一、RC_READY_P0 为什么被拒绝（你必须知道）

你提交的 P0 回执声称修改了 `chat.html`, `login.html`, `learn.html`, `profile.html`。

**真相：这四个文件在项目源码中不存在。**

你的项目不是多个独立 HTML 页面，而是一个 React SPA（Vite 构建）。实际文件是：

| 你声称修改的 | 实际文件 | 
|-----------|---------|
| chat.html | `frontend/src/pages/AIChatPage.jsx` |
| login.html | 无独立文件，登录逻辑在 store + api.js |
| learn.html | `frontend/src/pages/LearningPage.jsx` / `LearnPage.jsx` / `EnhancedLearningPage.jsx` |
| profile.html | `frontend/src/pages/ProfilePage.jsx` |

**这意味着你做了一轮零有效改动。** 问题不在你的能力，在于你对项目文件结构的认知有偏差。这份指令会修正它。

---

## 二、当前真实状态（我帮你审计完了）

### 前端真实情况

```
Token存储：Zustand store → localStorage（key是zustand persist自动生成的）
  → 不存在 "yandao_token_v1" 或 "auth_tokens" 这两个key
  → 双Token兼容问题在你的React版本中不存在

Quota系统：frontend/src/services/aiThrottle.js（getDailyChatUsage函数）
  → 不存在 "d.data.quotas.conversation" 或 "d.data.usage.conversation"
  → 这个bug在你的React源码中不存在

文件结构：React 18 SPA + Vite
  → 入口：frontend/index.html → 挂载到 #root
  → 页面组件：frontend/src/pages/*.jsx
  → 状态管理：frontend/src/store/useStore.js (Zustand + persist)
  → API层：frontend/src/services/api.js (axios)
```

### 后端真实架构

```
两套后端进程：

ai-proxy.mjs (端口8787) → PM2管理 → 生产环境主进程
  处理：/api/ai/chat, /api/verify/*, /api/auth/*(mock版)
  
server.js (端口3000) → 有全部学习路由 + 真实数据库
  处理：/api/tracks/*, /api/learning/*, 真实JWT认证

你的路由审计真相：
  /api/tracks → 404    → server.js有这路由但生产环境可能没启动
  /api/learning/progress → 404 → 同上
  /api/ai/chat → 401   → ai-proxy.mjs有这路由但没有token验证
  /api/auth/login → 400 → 可能是server.js在处理（因为ai-proxy的mock版永远返回200）
```

---

## 三、修正后的执行计划

```
Step 1: 服务器现状摸底（搞清楚到底跑了什么）
Step 2: P0环境修复（基于真实情况）
Step 3: RC_READY_P0_REAL → 人工验收
        ↓
Step 4: P1本地开发（React源码 + SQLite增量）
Step 5: 部署 + 验收
```

---

## Step 1: 服务器现状摸底 [只读，禁止改任何东西]

**目的**: 搞清楚生产环境到底跑了几个进程、Nginx怎么分发的。

### 1.1 检查运行进程
在服务器上执行（SSH或人工）：
```bash
pm2 list
ps aux | grep -E 'node|nginx' | grep -v grep
```

### 1.2 检查Nginx路由分发
```bash
cat /www/server/panel/vhost/nginx/yandao.vip.conf
# 或其他nginx conf路径
```
**关注**: 哪些 `/api/*` 路径被 proxy_pass 到哪个端口（8787还是3000）

### 1.3 检查实际部署的代码
```bash
ls -la /www/xuewaiyu/          # React构建产物
ls -la /www/yandao-app/         # 后端代码
find /www -name "server.js" -type f 2>/dev/null  # 找server.js位置
find /www -name "ai-proxy.mjs" -type f 2>/dev/null  # 找ai-proxy
```

### 1.4 输出"服务器现状报告"
格式：
```
[运行进程]
  PM2:
    进程名 | 脚本路径 | 状态
  ps aux:
    node进程 | 端口 | CMD

[Nginx路由]
  /api/ai/* → proxy_pass http://...:8787
  /api/*    → proxy_pass http://...:3000 (或其他)
  /         → root /www/...

[代码位置]
  前端源码: ...
  React构建产物: ...
  server.js: ...
  ai-proxy.mjs: ...
  SQLite数据库: ...
```

---

## Step 2: P0 环境修复（每个子项最小化、可直接执行）

### 2.1 Nginx安全头 [1条命令]

**不生成脚本，直接给命令**。SSH到服务器，先备份，再追加：

```bash
# 备份
cp /www/server/panel/vhost/nginx/yandao.vip.conf /tmp/yandao.vip.conf.bak

# 编辑：在server块内（如有Strict-Transport-Security那行后面）加4行
# TRAE：请直接输出需要添加的4行，标注插入位置（在哪个server块、哪行后面）
```

**验收**: 如果SSH可用→nginx -t → reload → curl验证。如果SSH不可用→输出精确的修改指令（原始行+插入位置），人工执行。

### 2.2 确认两后端都启动 [可选，取决于状态]

如果Step 1发现 server.js 没运行：
```bash
cd /www/yandao-app && pm2 start server.js --name xuewaiyu-server
```
然后再测试 `/api/tracks` 是否可用。

### 2.3 Token问题 - **仅当生产环境有旧HTML页面才需要修**

如果你的生产服务器上确实部署了旧版HTML文件（不是React构建产物），并且它们有独立的token逻辑，那才需要修。

但React源码中：token是Zustand store管理的，读的是persist自动存储的key，不存在`yandao_token_v1`/`auth_tokens`兼容问题。

**请确认**: 生产环境前端是React构建产物还是旧HTML？

### 2.4 Quota问题 - **在React源码中不存在**

`quotas.conversation` / `usage.conversation` 在你的React前端源码中 **0个匹配**。

如果线上有quota显示问题，原因可能是：
- `aiThrottle.js` 的 `getDailyChatUsage()` 计算逻辑
- 或者只在旧HTML文件中存在此bug

**请定位**: `frontend/src/services/aiThrottle.js` → 检查 `getDailyChatUsage` 函数返回结构。

---

## Step 3: 输出 RC_READY_P0_REAL

格式：
```
RC_READY_P0_REAL
============================================================
S1 服务器现状:
  PM2进程: [列表]
  Nginx路由: [摘录关键路由映射]
  代码位置: [路径]

S2.1 Nginx安全头: [已添加/待人工执行，命令+插入位置]
S2.2 双后端: [server.js状态 → 已启动/无需操作/步骤]
S2.3 Token: [React无此问题/旧HTML已修复路径]
S2.4 Quota: [React无此bug/aiThrottle.js检查结果]

路由验证(curl实际结果):
  GET /api/tracks → [状态码]
  GET /api/learning/progress → [状态码]
  POST /api/ai/chat → [状态码]
  POST /api/auth/login → [状态码]
============================================================
```

---

## Step 4: P1 本地开发 [RC_READY_P0_REAL验收通过后启动]

```
⛔ 闸门: PHASE_COMPLETE_P0签发前 禁止进入Step 4
```

### 4.1 新增数据库表 [文件: backend/config/database.js]

在 `initTables()` 函数末尾追加6张表（SQLite CREATE TABLE IF NOT EXISTS）。

具体DDL见之前指令中的"阶段B B.1"部分。

**重点**: 表设计已改为贴合现有架构（无Prisma，纯SQLite DDL）。

### 4.2 SRS复习引擎 [新建: backend/routes/reviews.js]

4个端点，算法用7级间隔 [4h,10h,1d,3d,7d,14d,30d] + SM-2 EF更新。

### 4.3 AI Tutor记录 [新建: backend/routes/aiTutor.js]

5个端点，内部调ai-proxy.mjs → 混元，每笔记录token_cost。

**重要**: 你的 `/api/ai/chat` 实际在 ai-proxy.mjs 中（不是server.js）。AI Tutor路由新增时，必须确认调用链正确：
- 新路由 `POST /api/ai/tutor/dialogue` 需要在哪处理？
- 选项A: 加到 ai-proxy.mjs（像/api/ai/chat一样）
- 选项B: 加到 server.js，内部HTTP请求 ai-proxy.mjs

**建议**: 加到 server.js，内部 http.request localhost:8787 调 ai-proxy。这样可以利用server.js的SQLite写ai_tutor_records表。

### 4.4 报表路由 [新建: backend/routes/reports.js]

`GET /summary`, `GET /xp/balance`, `GET /xp/ledger`，数据源仅 learning_events 和 reward_ledger。

### 4.5 前端API层 [修改: frontend/src/services/api.js]

追加 `reviewAPI`, `aiTutorAPI`, `reportAPI` 三个对象。

### 4.6 Learn页面增强 [修改: frontend/src/pages/LearningPage.jsx 或 LearnPage.jsx]

- 顶部加SRS待复习数量提示
- 复习未完新课入口置灰

### 4.7 server.js挂载新路由

```javascript
// 在server.js末尾追加（不动已有路由）
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/ai/tutor', require('./routes/aiTutor'));
app.use('/api/reports', require('./routes/reports'));
```

---

## Step 5: 部署 + 验收

### 5.1 构建
```bash
cd frontend && npm run build
```

### 5.2 打包上传
TRAE生成完整打包清单+部署脚本。如果SSH不可靠→输出脚本+说明。

### 5.3 验收
```
□ server.js重启无报错
□ PM2状态online
□ 新路由curl可访问
□ 6张新表sqlite .tables确认
□ SRS: add→due→submit完整流程
□ AI Tutor: dialogue可通话，token_cost记录
□ Learn页无硬编码文字
```

---

## 六、总账更新（必须用真实文件路径）

| 文件 | 路径 | 操作 |
|------|------|------|
| API层 | frontend/src/services/api.js | 追加三个API对象 |
| Token/Store | frontend/src/store/useStore.js | 不动(已有) |
| Chat页 | frontend/src/pages/AIChatPage.jsx | 不动(已是正确) |
| Learn页 | frontend/src/pages/LearningPage.jsx | 增量修改 |
| Profile | frontend/src/pages/ProfilePage.jsx | 不动(报表数据从新API来) |
| 数据库 | backend/config/database.js | initTables()末尾追加 |
| 主进程 | backend/server.js | 末尾mount新路由 |
| AI代理 | backend/ai-proxy.mjs | 不动(除非需加路由) |

---

## 七、禁止事项（触即回滚）

```
❌ 创建chat.html/login.html/learn.html/profile.html等独立HTML
❌ 在React项目中引用yandao_token_v1/auth_tokens（不存在这两个key）
❌ 修改ai-proxy.mjs的已有路由逻辑
❌ 跳过Step 1服务器摸底直接改代码
❌ 在P0未真实完成时启动P1
```

---

**立即从Step 1开始。不要假设任何事情，先摸清服务器真实状态。**
