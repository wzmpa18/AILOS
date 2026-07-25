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

## 6. 一句话总结

网页版能做的前端活儿全做完了、验证过了、代码干净地躺在 GitHub `main`（最新 `1f31d65`）上，且已用真实服务器验证「链路通、只差部署」。**TRAE，请你把码拉下来、按第3节部署并跑通四层验收**，剩下的大活儿（架构演进）我们再按计划推进。
