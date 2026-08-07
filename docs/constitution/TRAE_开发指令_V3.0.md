# TRAE 开发指令 V3.0 — 从零到上线全模块冲刺

> **签发**: 首席架构师 | **基准**: 蓝图 v3.2.1 + 总账 V2.1 + Phase1终版执行令
> **仓库**: https://github.com/wzmpa18/AILOS（已公开） | **服务器**: 82.156.228.87
> **部署方式**: TRAE推送GitHub → CodeBuddy codeload下载部署验收

---

## 一、项目当前真实状态

### 已完成（冻结不动）
- JWT 认证（/api/auth/*）
- Dashboard 基础查询（/api/dashboard）
- 签到系统（/api/checkin）
- Prisma Schema：User/Session/LearningProgress/LearningPlan 等 25+ 表
- 蓝图架构已冻结 v3.2.1

### 已部署但待验收
- `5e8bc13`：Bug修复（auth方法名+routes双重/api前缀），已验证通过

### 缺失的核心功能（按优先级）

| 优先级 | 模块 | 当前状态 |
|--------|------|---------|
| 🔴 P0 | 学习内容API（课程/词汇/语法） | **完全缺失** |
| 🔴 P0 | AI对话后端（/api/ai/*） | **完全缺失** |
| 🔴 P0 | 前端页面 | 服务器只有旧版HTML，无React构建产物 |
| 🟡 P1 | SRS复习引擎 | 缺失 |
| 🟡 P1 | 学习报告/统计 | 缺失 |
| 🟡 P1 | 会员/体力系统 | 表有但API缺失 |
| 🟢 P2 | AI Tutor记录 | 缺失 |
| 🟢 P2 | 推荐返利 | 缺失 |

---

## 二、开发顺序（严格串行，一个Module完成后推送验收）

```
Module 02 → Module 03 → Module 04 → Module 05 → Module 06 → Module 07
（后端核心）→（AI对话）→（学习闭环）→（复习+报告）→（会员+体力）→（前端打包）
```

---

## Module 02：学习内容体系（数据库 + API）

### 2.1 扩展 Prisma Schema

在 `prisma/schema.prisma` 中新增以下模型：

```prisma
// ===== 语言 =====
model Language {
  id        String   @id @default(uuid())
  code      String   @unique // zh, en, ja, ko, fr, de, es, pt, ru, ar, th, vi, it, nl, tr
  name      String   // 中文, English, 日本語...
  nativeName String  // 中文, English, 日本語...
  flag      String?  // emoji flag
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  courses        Course[]
  learningPlans  LearningPlan[]
}

// ===== 课程 =====
model Course {
  id          String   @id @default(uuid())
  languageId  String
  language    Language @relation(fields: [languageId], references: [id])
  title       String   // 新概念英语第一册 / 大家的日语初级1
  subtitle    String?
  description String?
  level       String   // A1, A2, B1, B2, C1, C2
  category    String   // textbook, exam, conversation, business
  coverImage  String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  units       CourseUnit[]
}

// ===== 课程单元 =====
model CourseUnit {
  id          String   @id @default(uuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])
  title       String   // Unit 1: 自我介绍
  description String?
  unitIndex   Int      // 排序序号
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  items       CourseItem[]
}

// ===== 学习条目（词汇/句子/语法/对话）=====
model CourseItem {
  id          String   @id @default(uuid())
  unitId      String
  unit        CourseUnit @relation(fields: [unitId], references: [id])
  type        String   // vocabulary, sentence, grammar, dialogue, reading
  sourceText  String   // 原文（学习目标语言）
  targetText  String   // 翻译（用户母语）
  phonetic    String?  // 音标/罗马音
  partOfSpeech String? // 词性
  grammarNote String?  // 语法说明
  example     String?  // 例句
  audioUrl    String?  // 音频链接
  imageUrl    String?  // 配图
  difficulty  Int      @default(1) // 1-5
  tags        String?  // 逗号分隔标签
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ===== 用户学习记录 =====
model UserCourseProgress {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  courseId        String
  courseItemId    String
  status          String   @default("new") // new, learning, reviewing, mastered
  correctCount    Int      @default(0)
  incorrectCount  Int      @default(0)
  lastReviewedAt  DateTime?
  nextReviewAt    DateTime?
  easeFactor      Float    @default(2.5)
  interval        Int      @default(0)
  repetitions     Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 2.2 创建 API 路由

**文件: `src/server/routes/languages.js`**
```
GET    /api/languages          → 获取所有语言列表
GET    /api/languages/:id      → 获取单个语言详情
```

**文件: `src/server/routes/courses.js`**
```
GET    /api/courses                 → 获取课程列表（支持 ?languageId=&level=&category=）
GET    /api/courses/:id             → 获取课程详情（含单元列表）
GET    /api/courses/:id/units       → 获取课程所有单元
GET    /api/units/:id/items         → 获取单元所有学习条目（支持 ?type=vocabulary&page=&limit=）
GET    /api/items/:id               → 获取单个学习条目详情
```

**文件: `src/server/routes/progress.js`**
```
GET    /api/progress/user/:userId              → 用户学习进度汇总
GET    /api/progress/course/:courseId           → 用户在指定课程的进度
POST   /api/progress/update                     → 更新学习进度（正确/错误计数+SRS参数）
GET    /api/progress/review-queue               → 获取待复习列表
```

### 2.3 种子数据

创建 `prisma/seed.js`，至少包含：
- 15种语言的基础数据
- 日语：《大家的日语》初级1 前3课（每课10-15个词汇+5个句子+2段对话）
- 英语：《新概念英语》第一册前3课
- 韩语：《标准韩国语》第一册前3课

### 2.4 验收标准
```
✅ GET /api/languages 返回15种语言
✅ GET /api/courses?languageId=ja 返回日语课程列表
✅ GET /api/units/:id/items 返回学习条目（含原文+翻译+音标）
✅ POST /api/progress/update 更新并返回新的SRS参数
✅ GET /api/progress/review-queue 返回到期待复习条目
✅ 所有接口需 authenticate 中间件（未登录返回401）
✅ 所有接口都有错误处理（不crash PM2）
```

---

## Module 03：AI 对话引擎（后端）

### 3.1 创建 AI 路由

**文件: `src/server/routes/ai.js`**
```
POST   /api/ai/chat              → AI自由对话
POST   /api/ai/translate         → 翻译
POST   /api/ai/grammar-check     → 语法检查
POST   /api/ai/pronunciation     → 发音评估（文本）
POST   /api/ai/generate-exercise → 根据学习进度生成练习
POST   /api/ai/dialogue-practice → 场景对话练习
```

### 3.2 AI Proxy 集成

已有 `ai-proxy.mjs`（端口8787），创建 `src/services/aiService.js`：
- 统一调用 ai-proxy（内部转发至腾讯混元）
- 每个请求记录 token 消耗
- 按用户每日额度做限制（免费用户每日50次，Premium 200次）
- 支持流式响应（SSE）

### 3.3 验收标准
```
✅ POST /api/ai/chat 返回AI回复
✅ POST /api/ai/translate 返回翻译结果
✅ 超过免费额度返回429
✅ 不登录返回401
```

---

## Module 04：学习闭环（进度+SRS+报告）

### 4.1 SRS 复习引擎

在 `src/services/srsService.js` 实现 SM-2 算法：
- 7级间隔：[4h, 10h, 1d, 3d, 7d, 14d, 30d]
- 正确回答：EF += (0.1 - (5-q) * (0.08 + (5-q) * 0.02))，interval *= EF
- 错误回答：重复次数归零，间隔回退到4h
- 每个学习条目独立SRS状态

### 4.2 学习报告 API

**文件: `src/server/routes/reports.js`**
```
GET    /api/reports/daily           → 今日学习统计（学习时长/单词数/正确率）
GET    /api/reports/weekly          → 本周趋势（每天学习量）
GET    /api/reports/monthly         → 月度报告
GET    /api/reports/achievements    → 成就列表
```

### 4.3 验收标准
```
✅ SRS算法正确计算下次复习时间
✅ 复习队列按到期时间排序
✅ 报告包含学习时长、单词数、正确率、连续天数
```

---

## Module 05：会员 + 体力 + 返利

### 5.1 会员 API

**文件: `src/server/routes/membership.js`**
```
GET    /api/membership/status       → 当前会员状态
GET    /api/membership/plans        → 可用套餐列表
POST   /api/membership/order        → 创建订单
POST   /api/membership/callback     → 支付回调
```

### 5.2 体力系统 API

```
GET    /api/hearts                   → 当前体力
POST   /api/hearts/consume           → 消耗体力
GET    /api/hearts/history           → 体力变更记录
```

### 5.3 推荐返利 API

```
GET    /api/referral/code            → 获取推荐码
GET    /api/referral/stats           → 推荐统计
GET    /api/referral/commissions     → 佣金记录
```

### 5.4 验收标准
```
✅ 会员状态正确返回（free/basic/premium）
✅ 体力消耗正确（学习消耗1心，5分钟恢复1心）
✅ 推荐码唯一且可追踪
```

---

## Module 06：前端 React SPA（从源码构建）

### 6.1 基础页面

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | HomePage | 学习概览、今日任务、连续打卡 |
| `/login` | LoginPage | 手机号/邮箱/微信登录 |
| `/register` | RegisterPage | 注册+选择母语+选择学习语言 |
| `/learn` | LearnPage | 课程列表→单元→学习条目→答题 |
| `/review` | ReviewPage | SRS复习队列 |
| `/ai-chat` | AIChatPage | AI自由对话 |
| `/profile` | ProfilePage | 个人信息、学习报告、设置 |
| `/membership` | MembershipPage | 会员套餐 |

### 6.2 关键要求

- 使用 React 18 + Vite + Zustand
- 所有 API 调用统一通过 `src/services/api.js`
- Token 管理使用 Zustand persist
- 响应式设计（移动端优先）
- 构建产物放到 `frontend/dist/`

### 6.3 验收标准
```
✅ npm run build 无报错
✅ 构建产物 < 2MB（gzip后）
✅ 所有页面可访问（至少骨架UI）
✅ API调用走统一axios实例
```

---

## Module 07：最终集成 + 全链路验收

### 7.1 部署脚本

创建 `deploy.sh`：
```bash
#!/bin/bash
# 1. 拉取最新代码
# 2. npm install
# 3. npx prisma generate + npx prisma db push
# 4. npm run build（前端）
# 5. 复制前端构建产物到 /www/xuewaiyu/
# 6. pm2 reload ecosystem.config.js --env production
```

### 7.2 全链路测试用例

| 序号 | 测试场景 | 预期结果 |
|------|---------|---------|
| 1 | 注册新用户 | 200 + JWT |
| 2 | 选择学习语言 | 200 + 初始化学习计划 |
| 3 | 获取课程列表 | 返回对应语言课程 |
| 4 | 获取学习条目 | 返回词汇/句子/语法 |
| 5 | 提交答题结果 | 更新SRS参数 |
| 6 | 获取复习队列 | 返回到期条目 |
| 7 | AI对话 | 返回AI回复 |
| 8 | 签到 | 返回连续天数 |
| 9 | 学习报告 | 返回统计数字 |

---

## 三、执行规则

### 必须遵守
1. **严格串行**：Module 02 → 03 → 04 → 05 → 06 → 07，一个完成推送后再做下一个
2. **每次推送**：告诉我 commit hash 和完成了哪个 Module 的哪些接口
3. **回写总账**：每完成一个 Module，更新 `AILOS_MASTER_LEDGER.md` 的任务状态
4. **不碰冻结**：不重构已有认证/签到/Dashboard系统
5. **错误处理**：每个 controller 方法都必须 try-catch，不能 crash PM2
6. **认证中间件**：所有学习/AI/会员/报告路由必须使用 `authenticate` 中间件

### 禁止
- ❌ 新建独立文档（一切回写总账）
- ❌ 修改蓝图架构
- ❌ 直调混元API（必须走 ai-proxy）
- ❌ 跳过 Module 顺序
- ❌ 声称完成但未实际推送代码

---

## 四、当前启动指令

**从 Module 02 开始**：扩展 Prisma Schema（Language/Course/CourseUnit/CourseItem/UserCourseProgress 模型）→ 创建 API 路由 → 编写种子数据 → 推送 → 告诉 CodeBuddy commit hash。

---

*指令版本: V3.0 | 签发时间: 2026-07-23 | 下一个里程碑: Module 02 完成 → 部署验收*
