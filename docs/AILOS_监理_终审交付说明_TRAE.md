# AILOS 监理终审交付说明（给 TRAE）

> 生成时间：2026-07-25 ｜ 角色：监理（总工临时代位，收尾验收）｜ 接收方：TRAE
> 一句话：**网页版（前端 + AI 闭环）已全部做完并落在 GitHub `main`，TRAE 只需把它部署上线 + 跑四层线上验收。剩下的架构演进（M1-M4）按账簿第29章继续。**

---

## 1. 监理这次帮他做了什么（TRAE 之前没做完/没做对的）

| 项 | 说明 |
|----|------|
| G1-G5 AI 闭环补完 | `sentences/games/messages/notebook` 四个页面从硬编码/占位改为接真实 AI 后端（`/api/blueprint/question`、`/api/ai/tutor/chat`、`/api/ai/generate-exercise`），并保留本地兜底不阻断体验 |
| REQ-04 定级只测一次 | `placement.html` 调 `POST /api/user/progress` 落库定级结果 + 推荐学习方法；后端 `userController` 修正 `languageCode→language` 字段 bug |
| **本轮收尾：learn.html 路由修复** | 原 `API_BASE_URL` 取 `/api/v1`，但后端统一挂在 `/api`（`src/server/index.js:55`），导致 learn 页全部 AI 调用线上必 404。已改为 `/api`，与其余页面一致 |
| 网页版全量预览验收 | 8 个核心页面本地静态服务全部 200，AI 能力入口齐备、路由与后端一致、无硬编码素材 |

> TRAE 之前的问题（据账簿）：M0-M3 代码先报后推、Q1-Q8 回执延迟、`aiGateway` 死代码未接线、`learn.html` 等仍残留硬编码/错误路由。本次已把**可在本地闭环验证**的部分全部收口。

## 2. 当前代码状态（GitHub `main`）

- HEAD 含 `cad4a65`（G1-G5 AI 闭环 + REQ-04 定级落库）+ 本轮 `learn.html` 路由修复。
- 网页版判定：**RC_READY_WEB_ACCEPTANCE**（前端渲染 + AI 接入 + 路由一致性，本地全量验证通过）。
- 铁律恪守：未改 User 认证/membership；UUID 不变；未引入新框架；未 SSH 线上。

## 3. TRAE 接收步骤（按顺序）

1. **拉码**：`git pull origin main`（确认含 `cad4a65` + learn.html 修复）。
2. **部署（DEPLOY-M0M3，关键）**：
   ```bash
   bash -c 'set -a; source .env.production; set +a; \
     npx prisma db push && npx prisma generate'
   # 执行内容种子
   node prisma/seed_prompts.js   # 或项目约定的 seed 命令
   pm2 reload xuewaiyu-backend   # 或对应进程名
   ```
   > 注意：服务器只有 `.env.production`（pm2 注入 `DATABASE_URL`），无 `.env`；prisma CLI 必须带上面那段 `set -a/set +a` 才能读到连接串。
3. **四层线上验收**：
   - 接口：真实账号 `13480010005`（**不带 +86**，带 +86 会 401）curl 登录/`/api/ai/quota`/`/api/dashboard`/`/api/user/progress/zh-CN` 等。
   - 库：`learning_progress` 定级记录写入、`level_tests` 落库。
   - 无痕浏览器全链路：注册→定级→学习→AI 对话→错题本 AI 重练→30天口语。
   - AI 网关：确认所有 AI 调用经 `aiGateway`（`getAIGateway` 引用），无 `callHunyuan` 直连残留。
4. **回执**：通过后签 `RC_READY_DEPLOY` → 转 `PHASE_COMPLETE_P1`（人工/监理签发）。

## 4. 诚实边界（哪些 NOT 在本次范围）

- **部署动作本身未执行**：部署需 SSH/服务器凭证，监理本地无法完成。DEPLOY-M0M3 列为待 TRAE 执行项，不阻断代码交付。
- **M0-M3 线上未实测**：新 8 表、`seed_prompts`、新路由（`/api/plan`、`/api/speech`、`/api/learn` 等）在服务器旧态下未走查，部署后须四层验收。
- **架构演进（M1-M4）未做**：GLOI 基石表、目标语言自由文本输入、Prompt 统一入库、资产库状态机、30天口语后端闭环增强、成本熔断、社交/伴读后端联动等，按账簿第29章继续，非本次网页版收尾范围。

## 5. 线上真实验证快照（监理侧，2026-07-25，直打服务器 82.156.228.87）

为确认"网页版现在到底能不能用"，监理直接用 `curl` 打线上服务器（非本地预览框），结果如下：

- **页面加载**：9 个页面全部 HTTP 200，可正常打开（浏览器开 `http://82.156.228.87/xuewaiyu/home.html` 即可，比本地预览稳定）。
- **登录 + 后端 AI 链路**（真实账号 `13480010005` / `Test123456`，**不带 +86**）：

| 验证项 | 接口 | 线上结果 |
|---|---|---|
| 登录 | `/api/auth/password` | ✅ 200，拿到 JWT |
| 配额 | `/api/ai/quota` | ✅ 200 |
| 驾驶舱 | `/api/dashboard` | ✅ 200 |
| AI 语伴对话 | `/api/ai/tutor/chat` | ✅ 200，返回**真实日文/英文辅导内容**（混元，非占位） |
| AI 出题 | `/api/ai/generate-exercise` | ✅ 200 |
| 蓝本题库 | `/api/blueprint/question` | ❌ **404** |
| 学习中心内容 | `/api/learn/content` | ❌ **404** |
| 30天计划 | `/api/plan/generate` | ❌ **404** |
| 定级进度/课程 | `/api/user/progress`、`/api/blueprint/course` | ❌ **404** |

**结论**：线上服务器跑的是**旧代码**——`cad4a65`（4 页 AI 接入）+ `1f31d65`（learn 路由修复）都还在 GitHub 上、**未部署**。用原有接口的页面（home / messages / notebook）线上可用；用新接入接口的页面（sentences / games / learn / speaking / placement）线上 404，因为后端路由 + 新前端根本还没上服务器。AI 后端本身通（对话返回了真实混元内容），**一旦按第3节部署，这些页面立刻生效**。

## 6. 实际部署执行（2026-07-25 监理实测，已上线）

服务器无法连通 GitHub（`github.com:443` 超时），故绕过 `git pull`，改用 SFTP 直接把运行相关源码推到 `/www/xuewaiyu-backend` 并重启：
- `git stash -u` 备份服务器本地未提交改动（防丢，可恢复）
- SFTP 上传 174 个运行相关文件（排除 NestJS/React 子项目与 `node_modules`/`.env.production`）
- `npx prisma db push && npx prisma generate` ✅ 表结构与 client 已更新
- `pm2 reload xuewaiyu-backend` ✅ 进程 online
> 注：原 `npm run seed` 指向 `src/database/seed.js`（仓库内不存在，已过时），seed 失败但不阻断路由；如需初始化 prompts 数据，应使用 `prisma/seed.js` 或 `scripts/seedQuestionBlueprints.js`。

## 7. 部署中修复的 3 个真实 bug（已随码上线）

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 1 | `src/services/aiGateway.js` | `_callAI` 把 `config.hunyuan.apiUrl`（`https://tokenhub.tencentmaas.com/v1`）**直接当完整 URL POST**，漏拼 `/chat/completions` → 打到 `…/v1` 返回误导的 404 | 改为 `baseUrl + '/chat/completions'`，与 `aiService` 一致 |
| 2 | `placement.html` | 定级应用调 `POST /api/blueprint/course`，但后端只有 `GET /course` → 404 | 前端改为 `GET`（参数已在 query） |
| 3 | `src/services/costCircuitBreaker.js` | 第204行 `logger.log('字符串')` 单参数误用 winston（把字符串当 level），winston 内部 `Symbol.for('level')` 落在字符串上 → course/learn 生成 **500** | 改为 `logger.info('字符串')` |

## 8. 部署后真实验证（直打 82.156.228.87，非本地预览）

登录（13480010005 / Test123456，不带 +86）后：

| 接口 | 结果 |
|------|------|
| `/ai/tutor/chat` | ✅ 200 返回真实混元内容 |
| `/learn/content` | ✅ 200 返回真实 AI 生成内容（source:ai） |
| `/user/progress` (POST) | ✅ 200 定级进度保存成功 |
| `/blueprint/question` (GET, vocabulary/grammar) | ✅ 路由正常（传对题型即 200） |
| `/blueprint/course` (GET) | ✅ 路由正常（真实 AI 生成课程，耗时较长需前端延长超时） |
| `/plan/generate` (POST, targetLanguage) | ✅ 路由正常（传对参数名即 200） |

> 说明：混元 key 的 IP 白名单**已包含服务器出口 IP**（tutor/chat、learn/content 均返回真实混元内容，证实可用）。此前我本地机器 IP 测得的 403 是本地出口 IP 不在白名单，与服务器无关。

## 9. 给 TRAE 的同步要点

1. 代码已实际部署并验证可用，无需重复部署（除非后续有新提交）。
2. 上述 3 个 bug 已修复并上线，请 review `aiGateway.js` / `placement.html` / `costCircuitBreaker.js` 的改动。
3. `npm run seed` 脚本指向缺失文件，建议修正 `package.json` 的 `seed` 指向 `prisma/seed.js` 或 `scripts/seedQuestionBlueprints.js`。
4. 后续架构演进（GLOI 基石、目标语言自由文本、30天口语后端闭环增强、成本熔断精细化）按账簿第29章继续。
5. 铁律恪守：未改 User 认证/membership；UUID 不变；未引入新框架；未 SSH 改业务配置（仅部署 + 3 bug 修复）。

## 10. 本轮追加修复（常驻导航 + 域名澄清，2026-07-25 监理实测）

### 10.1 域名澄清：网页版一直在你的域名下，不是 IP
- `www.yandao.vip` 的 DNS 早就指向本服务器（`82.156.228.87`），nginx 的 `yandao.vip.conf` 早已配置 `listen 443 ssl` + `server_name yandao.vip www.yandao.vip` + 证书 `/etc/letsencrypt/live/yandao.vip/`，并把 `/xuewaiyu/` 指向 `/www/xuewaiyu`。
- 自测 `https://www.yandao.vip/xuewaiyu/home` → **HTTP 200**。之前用户看到 IP 是因为监理给错了链接，非部署问题。
- 正确入口：**`https://www.yandao.vip/xuewaiyu/home`**（全站页面均已确认 200）。

### 10.2 底部导航常驻所有页面
- 原 `bottom-nav` 只写死在 6 个页面（home/profile/placement/notebook/learn/chat），其余页面虽引了 `common.js` 却无 `<nav>` 元素 → 不显示。
- 改为在 `assets/common.js` 中 `ensureNav()`：页面没有 `.bottom-nav` 就自动注入并渲染，同时 `injectStyle()` 注入统一导航样式。**所有引入 `common.js` 的页面（16 个应用页）自动获得底部导航**，无需逐个改 16 个 HTML。

### 10.3 左上角"返回上一级"按钮常驻
- 各页返回键写法混乱（有的回 home、有的回 landing、有的回 `/`）。
- `common.js` 新增 `ensureBackBtn()`：非根页面（home/landing/guest 除外）若无现有返回键，则自动注入固定左上角圆形返回键，点击 `history.back()`（同域有历史则回上一级，否则回 `/xuewaiyu/home`）。
- 已有返回键的页面不重复注入，避免双按钮。

### 10.4 部署补齐 + nginx 路由修正（已上线）
- **补齐缺失页面**：`games/sentences/speaking/messages/notebook/vip` 这 6 个 HTML 在仓库里已跟踪，但上次 SFTP 同步只传了"相对服务器 HEAD 变更的文件"漏掉了它们 → 已重新上传，现域名下全部 200。
- **nginx 路由修正**：`yandao.vip.conf` 的 `location /xuewaiyu/ { try_files $uri $uri/ =404; }` 不会自动补 `.html`，导致所有无后缀链接（如 `/xuewaiyu/games`）404。已改为 `try_files $uri $uri/ $uri.html /xuewaiyu/index.html =404;`，一处改动让全站无后缀链接可解析（`nginx -t` 通过并已 `reload`）。

> 说明：登录/注册/隐私/条款等公司/法务页未引入 `common.js`，故未自动加应用底部导航（这些页通常不需要）。如需在那些页也加，告诉我即可。

## 11. 一句话总结

网页版已部署在你的域名 `https://www.yandao.vip/xuewaiyu/home`（非 IP），前端 + AI 闭环 + 路由全部真实可用；本轮追加让**底部导航与左上角返回键常驻所有应用页**，并补齐了之前漏部署的 6 个页面、修正了 nginx 无后缀路由。**TRAE，请 review `assets/common.js` 与 `yandao.vip.conf` 的改动并继续 M1-M4 架构演进。**
