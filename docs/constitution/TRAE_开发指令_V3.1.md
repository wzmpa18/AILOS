# TRAE 开发指令 V3.1 — Module 02：学习生态闭环

> **版本说明**：V3.0 已作废（基于错误假设 better-sqlite3 + BigInt）。本指令基于 2026-07-24 服务器真实审计结果。
> **架构真相**：Express + **Prisma + PostgreSQL**，ID 类型为 `String @id @default(uuid())`，非 BigInt。
> **约束**：遵循蓝图 v3.2.1（冻结）、实施宪章 v3.1.1、总账 LEDGER。严禁破坏现有路由与用户体验。

---

## 一、当前真实状态（审计结论）

### 已存在但未激活
- `src/server/routes/content.js` + `learningContentController.js` + `learningContentService.js` → **未挂载**
- `src/server/routes/ai.js` → **未挂载**
- `src/server/routes/membership.js` → **未挂载**（冻结模块，本指令不动）
- `src/server/routes/monitoring.js` → **未挂载**
- `src/server/routes/user.js` → **未挂载**

### 已存在 Prisma 模型（29个）
User, Session, GuestSession, UserDevice, LearningProgress, MembershipOrder, DataExportRequest, AccountDeletionRequest, SmsVerification, RateLimitLog, SystemConfig, UserIdentity, Workspace, Organization, OrganizationMember, UserLanguagePreference, UserLearningLanguage, **LearningGoal, LearningPlan, LearningEvent**, LearningAbilityModel, LearningProfile, LearningMemory, AiPromptTemplate, AiUsageDailyStatistic, **LearningContent**, AiRequestLog, AiLanguageViolationLog, Checkin

### 缺失（Module 02 需新建）
| 模型 | 用途 | 关联 |
|------|------|------|
| `ReviewQueue` | SRS 复习队列（SM-2 算法） | userId→User, contentId→LearningContent |
| `AiTutorRecord` | AI 导师对话记录 | userId→User, goalId→LearningGoal |
| `RewardLedger` | XP/积分流水 | userId→User |
| `QuestionBlueprint` | 测验题目模板 | contentId→LearningContent |

---

## 二、Module 02 执行步骤（逐项目，每项独立 commit）

### Step 1：挂载已存在的内容路由 [低风险]
**文件**：`src/server/routes/index.js`
```js
const contentRoutes = require('./content');
// 在现有 router.use 后添加：
router.use('/content', contentRoutes);
```
**验证**：`GET /api/content?type=word&language=ja` → 200（需登录401）
**commit**：`feat(module02): mount content route`

### Step 2：新增 4 个 Prisma 模型 [中风险]
**文件**：`prisma/schema.prisma`（追加到文件末尾，保持 `String @id @default(uuid())` 风格）

```prisma
model ReviewQueue {
  id          String   @id @default(uuid())
  userId      String
  contentId   String
  contentType String   // word/sentence/grammar
  interval    Int      @default(0)    // SM-2 interval days
  easeFactor  Float    @default(2.5)
  repetitions Int      @default(0)
  dueDate     DateTime @default(now())
  lastReview  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, dueDate])
}

model AiTutorRecord {
  id          String   @id @default(uuid())
  userId      String
  goalId      String?
  role        String   // user/assistant
  content     String   // 对话内容
  tokensUsed  Int      @default(0)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}

model RewardLedger {
  id          String   @id @default(uuid())
  userId      String
  type        String   // xp/checkin/streak/referral
  amount      Int
  balance     Int      // 变动后余额
  refId       String?  // 关联业务ID
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
}

model QuestionBlueprint {
  id          String   @id @default(uuid())
  contentId   String
  question    String
  answer      String
  options     String?  // JSON数组，选择题用
  difficulty  Int      @default(1)
  createdAt   DateTime @default(now())
}
```

**迁移**：`npx prisma migrate dev --name module02_add_models --create-only` → 审阅 SQL → `npx prisma migrate dev`
**验证**：`npx prisma validate` 通过；新表在 PostgreSQL 创建成功
**commit**：`feat(module02): add ReviewQueue/AiTutorRecord/RewardLedger/QuestionBlueprint models`

### Step 3：SRS 复习引擎 [核心]
**新建**：`src/server/routes/reviews.js` + `src/server/controllers/reviewsController.js` + `src/server/services/reviewsService.js`
**挂载**：`router.use('/reviews', reviewsRoutes);`（index.js）
**路由**：
- `GET /api/reviews/due` → 返回到期复习项（按 dueDate 排序）
- `POST /api/reviews/:id/submit` → 提交复习结果（quality 0-5），更新 SM-2 算法
- `GET /api/reviews/stats` → 复习统计
**算法**：标准 SM-2（interval/easeFactor/repetitions 计算）
**验证**：提交 quality=5 → interval 增长；dueDate 推后
**commit**：`feat(module02): SRS review engine`

### Step 4：AI 导师对话记录
**新建**：`src/server/routes/aiTutor.js` + `controllers/aiTutorController.js` + `services/aiTutorService.js`
**挂载**：`router.use('/ai/tutor', aiTutorRoutes);`
**路由**：
- `GET /api/ai/tutor/dialogue?goalId=` → 历史对话
- `POST /api/ai/tutor/dialogue` → 保存一条对话（role/content/tokensUsed）
**验证**：保存后 GET 能取回
**commit**：`feat(module02): AI tutor dialogue records`

### Step 5：学习报表 + XP
**新建**：`src/server/routes/reports.js` + `controllers/reportsController.js` + `services/reportsService.js`
**挂载**：`router.use('/reports', reportsRoutes);`
**路由**：
- `GET /api/reports/summary` → 今日/本周学习时长、XP、连续天数、薄弱点
- `GET /api/reports/xp-history` → XP 流水（来自 RewardLedger）
**验证**：返回 JSON 结构正确
**commit**：`feat(module02): learning reports + XP query`

### Step 6：前端 API 层
**文件**：`frontend/src/services/api.js`（已存在则追加）
**新增方法**：`getContent()`, `getDueReviews()`, `submitReview()`, `getReportSummary()`, `getAiTutorDialogue()`, `saveAiTutorDialogue()`
**验证**：`cd frontend && npm run build` 通过
**commit**：`feat(module02): frontend API layer`

### Step 7：Learn 页去 Mock
**文件**：`frontend/src/pages/Learn.jsx`（或对应页面）
**改动**：将硬编码 mock 数据替换为 Step 6 的 API 调用
**验证**：页面正常加载真实数据
**commit**：`feat(module02): Learn page use real API`

### Step 8：集成部署
- `npx prisma generate`
- `npm run build`（frontend）
- 部署脚本：复用现有 `deploy/` 下脚本或 `ecosystem.config.js`
**验证**：全链路回归（见第三节）
**commit**：`chore(module02): production deploy`

---

## 三、验收标准（CodeBuddy 执行）

每项 Step 完成后推送到 GitHub，CodeBuddy 执行：
1. `wget codeload.github.com/wzmpa18/AILOS/zip/main` → 解压 → rsync（排除 node_modules/.env）
2. `cd /www/xuewaiyu-backend && npx prisma migrate deploy && npm install --production`
3. `pm2 restart xuewaiyu-backend`
4. 验证：
   - `GET /api/health` → 200 healthy
   - `GET /api/content` → 401（需登录）
   - `GET /api/reviews/due` → 401
   - `GET /api/reports/summary` → 401
   - 原有 7 路由无回归
5. 报告每项 ✅/🔴

---

## 四、禁止事项（Guardrails）

1. ❌ 不修改 `User` 模型及现有 29 个模型结构
2. ❌ 不修改 `auth.js` / `authController` / 认证逻辑
3. ❌ 不修改 `membership.js`（冻结模块）
4. ❌ 不使用 BigInt / INTEGER AUTOINCREMENT（必须 UUID String）
5. ❌ 不删除任何现有路由
6. ❌ 不改动前端路由结构（仅替换数据源）
7. ❌ 不引入新依赖框架（保持 Express + Prisma + React）

---

## 五、完成判定

Module 02 完成 = Step 1-8 全部 ✅ 且全链路回归通过。
完成后进入 Module 03（AI 对话引擎增强）或 Epic2（会员付费），以 LEDGER 为准。
