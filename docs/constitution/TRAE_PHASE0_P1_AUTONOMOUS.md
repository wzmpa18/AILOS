# TRAE 监理指令 — P0修复 + P1学习闭环 执行令（终版）

> **身份**: 首席架构师 | **目标**: TRAE（项目原开发者）
> **总原则**: 只补缺口不重构 | 本地开发优先批量完成 → 一次部署 | 全量回写总账
> **总账路径**: `AILOS_指令中心/AILOS_MASTER_LEDGER.md`

---

## 一、TRAE 能力边界（先对齐，避免无意义死磕）

| 你能做的 | 你做不了的 |
|---------|----------|
| 读写本地项目文件 | 可靠SSH连接服务器（已验证，时断时连） |
| 执行本地命令(bash/node) | 直接在服务器上操作Nginx/PM2/SQLite |
| curl线上验证 | 浏览器可视化回归（需人工配合） |
| 生成服务器部署脚本 | 无痕浏览器截图 |

**核心策略**: 
- 能本地做的全在本地做完，P1打包后一次上传
- 需服务器的操作→生成脚本+命令，减少往返次数
- 部署失败有兜底方案，不卡死

---

## 二、永久冻结红线

```
触碰以下任何一条 → 直接判定 TC-001 False Completion → 全部回滚
```

**模块冻结（禁止新增/修改）**:
- ❌ 会员/payment/vip/subscription
- ❌ 机构/organization/school/class
- ❌ 商城/shop/exchange

**架构冻结（禁止绕过）**:
- ❌ T1-T6模块重构（EventBus/AI Gateway/State Manager/Auth/LearningTracks/词库）
- ❌ 前端直调混元API → 必须走 `/api/ai/*` → ai-proxy → 混元
- ❌ 新建独立审计/开发/报告文件 → 唯一文档=总账

---

## 三、BLOCKED上报规范（遇即停，禁止重试）

| 故障 | 判断 | 立即停止 | 上报内容 |
|------|------|---------|---------|
| SSH不可靠 | 连续3次超时/拒绝 | 改为本地生成脚本方案 | 故障+已生成的脚本路径 |
| 数据库锁 | SQLITE_BUSY | 停止所有数据库操作 | 哪个表被锁 |
| AI网关失效 | /api/ai/chat 3次5xx | 停止AI相关开发 | 错误码+响应 |
| PM2崩溃 | restart后status:errored | 停止部署 | 完整错误日志 |
| Nginx损坏 | nginx -t报错 | 回滚conf后停止 | 错误内容 |
| 构建失败 | npm run build≠0 | 停止部署 | 完整构建日志 |

---

# 执行流程

```
┌──────────────────────────────────────────────────┐
│ 阶段A: P0 服务器修复（1次SSH，3步）              │
│   → 输出 RC_READY_P0 → 人工验收                  │
│         ↓                                         │
│    PHASE_COMPLETE_P0（人工签发后进入）            │
│         ↓                                         │
│ 阶段B: P1 本地全量开发（6步，不用服务器）         │
│   → 打包上传 → 一次部署                           │
│         ↓                                         │
│ 阶段C: P1 全链路验收                              │
│   → 输出 RC_READY_P1 → 人工验收                  │
└──────────────────────────────────────────────────┘
```

---

## 阶段A: P0 服务器修复

```
⛔ 硬性闸门：P0全部完成 + RC_READY_P0 + 人工验收签发PHASE_COMPLETE_P0 → 才能进入阶段B
   严禁：P0未完成时写任何P1代码 / P0和P1并行 / 自己判定P0通过跳过验收
```

### A.1 Nginx安全头补全 [服务器操作]
**编号**: P0-ENV-DRIFT-001 | **优先级**: 🔴

**现状**: 仅HSTS，缺X-Content-Type-Options / X-Frame-Options / X-XSS-Protection / CSP

**操作**: 生成一个完整的shell脚本到 `deploy/fix_nginx.sh`，内容：
1. 备份原conf → 追加4个add_header（always参数）→ nginx -t → nginx -s reload
2. 脚本末尾 `curl -sI https://yandao.vip | grep -iE 'x-content|x-frame|x-xss|content-security'`

**验收**: 脚本中curl输出4行全有

**如果SSH可用**: 直接执行脚本
**如果SSH不可靠**: 输出脚本内容，标注"复制到服务器执行"

### A.2 Quota字段修复 [本地操作]
**编号**: BUG-010/QUOTA | **优先级**: 🔴

**问题**: 前端quota显示空白，后端返回字段名与前端消费路径不匹配

**操作**:
1. 全局搜索 `quotas.conversation`（注意这是前端代码，在JSX/JS文件中，不是chat.html）
2. 替换为 `usage.conversation`
3. 仅改此字段路径，不动其他逻辑
4. 构建验证: `cd frontend && npm run build`

**验收**: 构建成功 + 代码中搜索 `quotas.conversation` 返回0结果

### A.3 Token双兼容确认 [本地审查]
**编号**: P2-ENV-DRIFT-006 | **优先级**: 🟡

**操作**:
1. 搜索所有`getToken`实现，确认兼容两套key: `yandao_token_v1` + `auth_tokens`
2. 用两个key分别curl `/api/auth/refresh` 鉴权（如有token）

**验收**: 两种token均可正常鉴权

### A.4 核心路由审计 [只读操作，禁止修改文件]
**操作**: curl以下路由，记下HTTP状态码:
- `GET /api/tracks`
- `GET /api/learning/progress`
- `POST /api/ai/chat`（带auth header）
- `POST /api/auth/login`

### A.5 输出 RC_READY_P0

```
RC_READY_P0
============================================================
A.1 Nginx安全头: [4个curl头完整输出 / 或已生成fix_nginx.sh脚本路径]
A.2 Quota修复: [quotas.conversation搜索结果(应为0) + 构建成功确认]
A.3 Token双兼容: [验证结果]
A.4 路由审计:
  GET /api/tracks → [状态码]
  GET /api/learning/progress → [状态码]
  POST /api/ai/chat → [状态码]
  POST /api/auth/login → [状态码]
============================================================
总账更新确认:
  □ 第7章: T-P0-01~04全部标记✅
  □ 第8章: P0变更日志已追加
  □ 第12章: P0-ENV-DRIFT-001→Mitigated, BUG-010/QUOTA→Regression
  □ 第15章: curl证据已粘贴
  □ 第18章: CurrentTask=P0完成,等待验收
============================================================
阻塞项: [有/无]
等待: 人工验收签发PHASE_COMPLETE_P0
============================================================
```

---

## ⛔ 阶段闸门

```
RC_READY_P0已提交 → 等待人工 → PHASE_COMPLETE_P0签发 → 解锁阶段B
```

**未经此处放行启动阶段B → 全部回滚**

---

## 阶段B: P1 本地全量开发

```
⛔ 规则:
- 所有开发在本地完成，不动服务器
- 每步完成后本地验证(node启动/构建)，不需要部署
- 全部6步完成后 → 统一打包 → 一次上传部署
- 每步修改后必须更新总账对应章节
```

### B.1 新增6张数据库表
**文件**: `backend/config/database.js` → `initTables()` 末尾追加

**表清单**（SQLite DDL，TRAE自行补充完整列定义）:

```sql
-- 1. SRS复习队列
CREATE TABLE IF NOT EXISTS review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  material_type TEXT NOT NULL,      -- vocab/grammar/dialog/...
  material_ref_id TEXT NOT NULL,     -- 关联素材ID
  last_study_at TEXT,
  next_review_at TEXT NOT NULL,      -- 下次复习时间
  forget_weight INTEGER DEFAULT 1,   -- 遗忘权重，越高越频繁
  easiness_factor REAL DEFAULT 2.5,  -- SM-2 EF因子
  interval_hours INTEGER DEFAULT 4,  -- 当前间隔
  repetition_count INTEGER DEFAULT 0,-- 复习次数
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, material_type, material_ref_id)
);

-- 2. AI伴读记录(含Token成本)
CREATE TABLE IF NOT EXISTS ai_tutor_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id INTEGER,
  material_id INTEGER,
  tutor_type TEXT NOT NULL,          -- dialogue/speech/writing
  user_input TEXT,
  ai_output TEXT,
  pronunciation_score INTEGER,       -- 发音打分(仅speech类型)
  token_cost INTEGER DEFAULT 0,      -- 本次消耗Token
  prompt_version TEXT DEFAULT 'v1.0',-- Prompt版本管控
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. 不可变学习事件日志(仅INSERT,禁止UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS learning_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,           -- study/review/ai_tutor/complete
  material_id INTEGER,
  material_type TEXT,
  xp_change INTEGER DEFAULT 0,        -- 本次XP变化
  event_time TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_le_user_time ON learning_events(user_id, event_time);

-- 4. XP积分账本
CREATE TABLE IF NOT EXISTS reward_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source_type TEXT NOT NULL,          -- unit_complete/review/ai_tutor/daily_checkin
  xp_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_ref TEXT,                    -- 来源关联ID
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. AI课程蓝图模板
CREATE TABLE IF NOT EXISTS course_blueprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lang TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  track_type TEXT NOT NULL,
  scene_module TEXT,
  blueprint_type TEXT NOT NULL,      -- lesson/unit/chapter
  title TEXT,
  description TEXT,
  template_schema TEXT,               -- JSON课程结构模板
  prompt_template TEXT,               -- AI生成Prompt模板
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(lang, cefr_level, track_type, scene_module, blueprint_type)
);

-- 6. AI题型蓝图模板
CREATE TABLE IF NOT EXISTS question_blueprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lang TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  question_type TEXT NOT NULL,        -- choice/fill/pronunciation/translation/listening/writing
  difficulty INTEGER DEFAULT 1,       -- 1-5
  title TEXT,
  template_schema TEXT,               -- JSON题型结构
  prompt_template TEXT,               -- AI生成Prompt
  scoring_rules TEXT,                 -- 评分规则JSON
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(lang, cefr_level, question_type, difficulty)
);
```

**种子数据**: 插入课程蓝图+题型蓝图的初始模板（6题型×15语种×6等级核心组合）

**回滚脚本**: `backend/migrations/001_down.sql`（每条DROP TABLE IF EXISTS + 对应索引）

**验收**: 本地启动server→sqlite3 `.tables` 确认6表存在→重启server无报错

### B.2 SRS复习引擎路由
**新建文件**: `backend/routes/reviews.js`

**算法**: 7级间隔 [4h, 10h, 1d, 3d, 7d, 14d, 30d] + SM-2 EF更新
**4端点**: `GET /due` | `POST /add` | `POST /:id/submit` | `GET /stats`
**约束**: 全挂authMiddleware + WHERE user_id=? + 提交写入learning_events + reward_ledger

**验收**: 本地node启动server → curl模拟完整流程(add→due→submit→due确认消失)

### B.3 AI Tutor记录路由
**新建文件**: `backend/routes/aiTutor.js`

**5端点**: `/dialogue` | `/speech` | `/writing` | `/history` | `/stats`
**调用链**: 内部call ai-proxy(8787) → 混元（可用http.request或内部函数调用）
**每笔必写**: ai_tutor_records(token_cost>0) + learning_events(xp_change)

**验收**: curl /dialogue → 查ai_tutor_records表 → token_cost>0

### B.4 学习报表+XP查询路由
**新建文件**: `backend/routes/reports.js`

**端点**:
- `GET /summary?period=7d|30d|all` → 数据源仅learning_events
- `GET /xp/balance` → 数据源仅reward_ledger
- `GET /xp/ledger` → 同上

**验收**: curl返回结构化JSON，无硬编码mock

### B.5 前端API层扩展
**修改文件**: `frontend/src/services/api.js`

追加三个对象: `reviewAPI` / `aiTutorAPI` / `reportAPI`
每个对象封装对应的fetch调用，带auth header

**验收**: `npm run build` 无报错

### B.6 Learn页面去Mock + SRS提醒
**修改文件**: Learn相关页面组件（仅Learn页，不动其他页面）

**改动**:
1. 搜索Learn页中所有硬编码的外语文字（日语/英语/韩语等示例文本）
2. 替换为 `/api/tracks` 或 `/api/learning/*` 动态数据请求
3. 顶部加SRS待复习提醒条：调 `/api/reviews/due` → 显示待复习数量
4. 复习未完成时新课入口置灰 + 提示"请先完成今日复习"

**验收**: 页面无静态Mock文字 + SRS提醒条正常渲染

### B.7 打包准备部署
1. 在 `server.js` 挂载3个新路由（追加，不动已有）
2. `npm run build` 确认成功
3. 打包清单: 
   - `backend/routes/reviews.js`
   - `backend/routes/aiTutor.js`
   - `backend/routes/reports.js`
   - `backend/config/database.js`(修改后)
   - `backend/migrations/001_down.sql`
   - `frontend/src/services/api.js`(修改后)
   - `frontend/dist/`(构建产物)
4. 生成 `deploy/deploy_p1.sh` 服务器部署脚本（含备份+上传+PM2重启+验证）

**如果SSH可用**: 执行部署脚本
**如果SSH不可靠**: 输出脚本+说明，人工执行

---

## 阶段C: P1 全链路验收

### C.1 服务器部署验证（部署后执行）
- 所有新API通过域名可访问
- PM2状态online，日志无ERROR
- 数据库6张新表存在

### C.2 全链路业务验收（无痕浏览器）
```
路径: 注册→登录→定级→学习→SRS复习→AI伴读→查报表
校验点:
  □ 页面无硬编码外语文字
  □ 低等级无法解锁高等级课程
  □ 复习未完锁定新课入口
  □ AI伴读可针对当前教材内容纠错打分
  □ 报表数据来自实际学习记录，非Mock
  □ Chat页quota数字正常显示
  □ 全链路无console红色报错 / 无白屏 / 无404
```

### C.3 输出 RC_READY_P1

```
RC_READY_P1
============================================================
前置确认: PHASE_COMPLETE_P0已签发 ✅

B.1 数据库: [6表sqlite3验证结果 + 种子数据确认]
B.2 SRS: [add→due→submit流程curl + 幂等验证(重复提交不重复发XP)]
B.3 AI Tutor: [dialogue/speech/writing curl + token_cost>0确认]
B.4 报表: [summary/xp-balance/xp-ledger curl完整JSON]
B.5 前端API: [构建成功确认]
B.6 Learn页: [Mock项移除清单 + SRS提醒截图]
B.7 部署: [PM2状态 + 日志确认 + deploy_p1.sh路径]
C.1 部署验证: [新API curl结果]
C.2 全链路验收:
  注册登录 → [通过/失败 + 截图]
  定级测试 → [通过/失败 + 截图]
  学习路径 → [通过/失败 + 截图]
  SRS复习 → [通过/失败 + 截图]
  AI伴读 → [通过/失败 + 截图]
  查看报表 → [通过/失败 + 截图]
============================================================
总账更新确认:
  □ 第7章: T-P1-01~08全部标记✅ + 完成时间
  □ 第8章: P1变更日志逐条追加(每文件/修改内容/时间)
  □ 第12章: 所有修复项状态更新
  □ 第13.2章: 逐文件记录(路径+行号+变更描述)
  □ 第14章: 完整DDL+回滚DDL粘贴
  □ 第15章: curl全集+浏览器截图+AI Gateway消耗日志
  □ 第4章: 新表标记Deployed
  □ 第5章: 新路由完整路径列出
  □ 第18章: CurrentTask=P1完成/等待验收
============================================================
阻塞项: [有/无]
回滚就绪: [001_down.sql + DB备份 + nginx备份路径]
下一阶段: Phase2 AI内容生成框架
等待: 人工验收签发PHASE_COMPLETE_P1
============================================================
```

---

## 四、总账更新规范（每步必做，禁止笼统）

| 章节 | 更新内容 | 禁止 |
|------|---------|------|
| 第7章 | Task ID→✅ + 精确到分钟的时间 | 只写"完成" |
| 第8章 | 操作人/时间/变更文件路径/30字摘要 | 写"已更新" |
| 第12章 | Bug编号/修复方案/代码行号/新状态 | 写"已修复" |
| 第13.2章 | 文件绝对路径 + L行号范围 + 变更描述 | 写"详见代码" |
| 第14章 | 粘贴完整DDL(不可省略列) + 回滚语句 | 写"已执行" |
| 第15章 | 粘贴实际curl命令+返回结果原文 | 写"已验证" |
| 第18章 | CurrentTask=Step X, Status=进行中/完成 | 不更新 |

---

## 五、操作类型规则

| 类型 | 允许 | 禁止 |
|------|------|------|
| 🔵 只读 | 读文件/curl/SELECT | 修改/删除/重命名任何文件 |
| 🔴 数据库 | CREATE TABLE + INSERT | ALTER/DROP已有表 |
| 🔴 后端 | 仅新建routes文件 + 修改database.js/server.js挂载 | 修改已有route逻辑 |
| 🔴 前端 | 仅修改指定页面组件 + api.js | 改路由/全局样式/公共组件 |

---

## 六、最终交付物

| 交付物 | 路径 |
|--------|------|
| Nginx修复脚本 | deploy/fix_nginx.sh |
| P1部署脚本 | deploy/deploy_p1.sh |
| 新路由×3 | backend/routes/reviews.js, aiTutor.js, reports.js |
| 数据库修改 | backend/config/database.js |
| 回滚脚本 | backend/migrations/001_down.sql |
| 前端API层 | frontend/src/services/api.js |
| 前端页面 | Learn页相关组件 |
| 完整总账 | AILOS_MASTER_LEDGER.md全部章节已更新 |

---

**指令结束。从阶段A开始，严格串行。每步完成→更新总账→进入下一步。遇BLOCKED立即停止。**
