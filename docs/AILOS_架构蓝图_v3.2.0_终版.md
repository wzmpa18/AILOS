# AILOS 软件架构蓝图 v3.2.0 终版

> **文档版本**: v3.2.0 终版（架构蓝图 v3.0.0 与 v3.2.0 架构增量合并）
> **合并说明**: 本文档为架构蓝图v3.0.0与v3.2.0架构增量的完整合并终版，v3.2.0增量 appended 于文末
> **文档性质**: AILOS 项目唯一法定架构依据，与双宪法 v2.6.0、系统图谱 v3.0.0 具有同等最高强制约束力
> **生成日期**: 2026-08-05 | **生效日期**: 2026-08-05
> **基准基线**: 双宪法 v2.6.0 + 系统图谱 v3.0.0 + P2 内核治理落地 + P3 审计底座闭环
> **适用对象**: 所有开发者、架构师、审计人员、运维人员

---

# 第一编：全局分层架构

## 1.1 DDD 五层架构总图

```
┌─────────────────────────────────────────────────────────────┐
│ 接入层 (Presentation)                                       │
│ 27 HTML 页面 + common.js 统一引擎                           │
│ 规则: 仅调用 CoreOS Facade，禁止直连下层                    │
├─────────────────────────────────────────────────────────────┤
│ 应用层 (Application)                                        │
│ Controller → Service 编排                                   │
│ 规则: 仅编排业务逻辑，禁止包含领域知识                      │
├─────────────────────────────────────────────────────────────┤
│ 领域层 (Domain) ─── 三大核心域刚性隔离 ───                  │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│ │ Core OS 域  │  │ Brain 内核域│  │ 业务领域层           │   │
│ │ 基础设施    │  │ AI 统一出口 │  │ 学习/社交/计费/翻译  │   │
│ │ 缓存管理器  │  │ 模型适配器  │  │ 仅通过标准接口调用   │   │
│ │ 权限认证    │  │ LanguageGuard│  │ 禁止跳层直连         │   │
│ │ 通用工具    │  │ 额度/审计    │  │                      │   │
│ └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ 基础设施层 (Infrastructure)                                 │
│ PostgreSQL (SSOT) + Redis (只读缓存) + 文件存储             │
│ 规则: 仅 Repository 可写 DB，仅 CacheManager 可写 Redis     │
├─────────────────────────────────────────────────────────────┤
│ 外部服务层 (External)                                       │
│ 混元 API / 腾讯云 TTS-ASR / 微信支付 / 短信                 │
│ 规则: 仅 Brain 内核适配器可调用，业务层绝对禁止直连         │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 合法调用链路 vs 违宪跳层对照表

| 调用路径 | 是否合法 | 违宪等级 | 宪法条款 |
|---------|---------|---------|---------|
| 页面 → Controller → Service → Repository → DB | ✅ 合法 | — | — |
| 页面 → Controller → BrainFacade → 适配器 → 第三方 API | ✅ 合法 | — | — |
| Service → CacheManager.invalidate() → Redis | ✅ 合法 | — | — |
| 页面 → fetch('/api/ai/chat') 直接调 AI | ❌ 一级违宪 | 🔴 | CoreOS 6.2 + HARD-02 |
| Service → axios.post(混元API) 直连模型 | ❌ 一级违宪 | 🔴 | CoreOS 6.2 |
| Service → redis.set() 直写缓存 | ❌ 一级违宪 | 🔴 | CoreOS 0.1 |
| 词汇Service → 支付Service 直接调用 | ❌ 一级违宪 | 🔴 | CoreOS 0.2 |
| 页面 → localStorage.setItem() 改语言 | ❌ 一级违宪 | 🔴 | 产品宪法 9.2 |

### 1.2.1 AI 网关访问边界（HARD-02 补全）

**核心原则：AI 网关仅对后端服务内部开放，不对前端直接暴露接口。**

```
✅ 合法路径:
  前端 → fetch('/api/learn/generate') → learnController → BrainFacade.generateText() → 混元API
  前端 → fetch('/api/translate') → translateController → BrainFacade.generateText() → 混元API
  前端 → fetch('/api/v1/voice/synthesize') → voiceController → BrainFacade.generateVoice() → TTS

❌ 一级违宪路径:
  前端 → fetch('/api/ai/chat') 直连 AI 网关       ← 绕过 BrainFacade 的 LanguageGuard/额度/审计
  前端 → fetch('/api/ai/generate-exercise')         ← 绕过 BrainFacade
  前端 → fetch('/api/ai/quota')                     ← 绕过统一额度管理
  前端 → fetch('/api/ai/tutor/chat')                ← 绕过 BrainFacade
```

**违宪判定标准：**
- 前端直连 `/api/ai/*` 网关端点 → **一级违宪**，CI 扫描 + DependencyGuard 运行时双重拦截
- 拦截方式：DependencyGuard 基于请求来源（Referer）自动判定前端请求 → 403 + 9001
- 例外：`/api/ai/quota` 等配额查询必须通过业务 Controller 中转（如 `/api/user/quota` → userController → BrainFacade）

## 1.3 全量数据流向图

```
用户请求 → Controller → Service → Repository → PostgreSQL (SSOT 写入)
                                         ↓
                                    BrainFacade → 适配器 → 第三方 API
                                         ↓
                                   AuditLogger → audit_logs 表
                                         ↓
                                   QuotaManager → 额度扣减
                                         ↓
                                   EventBus → CacheManager → Redis (缓存失效)
                                         ↓
                                   前端 ← API 响应 (JSON)
                                         ↓
                                   前端 localStorage (只读副本)
```

---

# 第二编：核心模块架构标准化

## 2.1 Brain AI 内核模块

### 2.1.1 统一 Facade 接口规范

```javascript
// ✅ 合法调用
const brain = require('src/core/brain/facade');
const result = await brain.generateText(messages, { userId, targetLang });
const voice = await brain.generateVoice(text, lang);
const ocr = await brain.recognizeImage(base64, { mimeType });

// ❌ 一级违宪调用
const aiService = require('src/services/aiService');
await aiService.callHunyuan(messages); // 业务层禁止直连
```

### 2.1.2 三大强制串联环节

```
generateText() 调用链路:
  ① LanguageGuard. validateInput(messages, targetLang)
  ② aiService. callHunyuan(messages, opts)
  ③ AuditLogger. log('generateText', userId, meta)

generateVoice() 调用链路:
  ① LanguageGuard. validateInput([{content: text}], lang)
  ② voiceAdapter. synthesize(text, lang)
  ③ AuditLogger. log('generateVoice', null, meta)

recognizeImage() 调用链路:
  ① ocrAdapter. recognize(imageBase64, opts)
  ② AuditLogger. log('recognizeImage', userId, meta)

缺失任意一环 → 判定架构违宪 (9001)
```

### 2.1.3 适配器分层规则

| 层级 | 职责 | 可见性 |
|------|------|--------|
| BrainFacade | 统一入口 + 三环节串联 | 业务层可见 |
| 适配器层 (adapters/) | 厂商差异收敛 | 仅 Brain 内核可见 |
| 第三方 SDK | 原生 API 调用 | 仅适配器层可见 |

### 2.1.4 降级/熔断/缓存策略

| 场景 | 触发条件 | 处理 |
|------|---------|------|
| ai-proxy 不可用 | 超时 30s | 抛出 AI_SERVICE_UNAVAILABLE |
| 模型限流 | HTTP 429 | 指数退避重试 (最多 3 次) |
| 缓存命中 | Redis 存在 | 直接返回 (TTL=3600s) |
| 额度耗尽 | quota <= 0 | 返回 402 QUOTA_EXHAUSTED |

## 2.2 缓存 SSOT 体系

### 2.2.1 CacheManager 唯一写入口

```javascript
// ✅ 合法 (业务层)
const cm = require('src/core/cacheManager');
await cm.invalidate(`profile:${userId}`); // 缓存失效

// ❌ 一级违宪 (业务层)
const redis = require('src/config/redis');
await redis.set(key, value); // 禁止直写
```

### 2.2.2 缓存 Key 命名规范

| 类别 | 格式 | TTL | 示例 |
|------|------|-----|------|
| 用户资料 | `profile:{userId}` | — | `profile:abc123` |
| Token 黑名单 | `blacklist:token:{hash}` | Token TTL | `blacklist:token:sha256` |
| 用户级黑名单 | `blacklist:uid:{userId}` | 30d | `blacklist:uid:abc123` |
| 设备风控 | `dfp:{type}:{key}` | 24h | `dfp:trial:fpHash` |
| AI 缓存 | `ailos:ai:cache:{hash}` | 1h | `ailos:ai:cache:sha256` |

### 2.2.3 缓存一致性保障

```
数据变更 → Service 写 DB → 发布 DataChanged 事件 → CacheManager.invalidate() → Redis 删除
→ 下次请求 → Cache Miss → 从 DB 回源 → 写入 Redis (只读副本)
```

## 2.3 水平测试模块（架构固化）

### 2.3.1 标准架构

```
前端 placement.html → fetch('/api/blueprint/question?language=ja&type=vocabulary&level=beginner&count=6')
→ BrainFacade.generateText() → AI 生成纯日语题目
→ 前端渲染 (无硬编码题库)
```

### 2.3.2 双语言绑定规则

| 语言维度 | 绑定规则 | 读取方式 |
|---------|---------|---------|
| 题目语言 | 用户 targetLanguage | ContextResolver.resolve(userId).primaryTargetLanguage |
| 界面文案 | 用户 uiLanguage | getUILang() → localStorage (只读副本) |
| 题目解析 | 用户 nativeLanguage | ContextResolver.resolve(userId).explanationLanguage |

**禁止**: 前端传 lang 参数 → 后端一律忽略，从 SSOT 读取

### 2.3.3 全链路时序图

```
用户点击「开始测试」
  → placement.html: 读取 token + AILOS.getStudyLang()
  → fetch('/api/blueprint/question?language=' + lang + '&count=6')
  → blueprintController: ContextResolver.resolve(userId) → targetLang
  → BrainFacade.generateText(messages, {targetLang})
  → AI 生成 6 道纯目标语言题目
  → 返回前端: [{question, options, correctAnswer}]
  → placement.html: 渲染题目 + 用户答题
  → 提交答案 → 计算 CEFR 等级
  → 结果页: 等级 + 分项能力 + 学习路线 + 跳转入口
```

### 2.3.4 前端加载执行标准（根治 ANSI 污染 + 竞态）

```
1. HTML 解析 → <script src="common.js?v=20260804p2"> 同步加载
2. common.js IIFE 执行 → window.AILOS 就绪
3. DOMContentLoaded → IIFE 内部 init()
4. init() → applyUIText() → renderNav() → installTamperDetection()
5. 页面就绪 → startBtn.onclick 绑定

规则:
- 禁止在 common.js 之前执行任何业务逻辑
- 禁止在 window.AILOS 未就绪时调用其方法
- 所有 JS 文件末尾不得含 ANSI 转义序列 (CI 扫描拦截)
- 所有 <script> 标签必须带版本号 ?v=xxx 防缓存
```

---

# 第三编：治理体系架构固化

## 3.1 DependencyGuard 运行时防护

### 3.1.1 架构位置

```
Express 中间件栈:
  helmet → cors → bodyParser → compression → logger → rateLimiter
  → dependencyGuard ← 全局硬拦截 (所有 /api/* 必经)
  → routes
```

### 3.1.2 三类拦截规范（HARD-03 改造：废弃 Header 自报身份）

| 检测类型 | 触发方式（v2.0） | 旧方式（已废弃） | 返回码 | 日志 |
|---------|-----------------|---------------|--------|------|
| 直连 AI | **路由归属**：Referer 含前端页面 → 拦截 `/api/ai/*` 网关端点 | ~~X-Caller-Module Header~~ | 403 + 9001 | DIRECT_AI_CALL_FORBIDDEN |
| 跨模块调用 | **调用栈**：`new Error().stack` 获取调用文件路径 → 判定 Service 归属领域 → 匹配 forbiddenPairs | ~~X-Caller-Module Header~~ | 403 + 9001 | CROSS_DOMAIN_CALL |
| Redis 直写 | **底层 SDK 拦截**：在 `src/config/redis.js` 层面注入写操作检测，非 CacheManager 调用直接拒绝 | ~~X-Redis-Write Header~~ | 403 + 9001 | DIRECT_REDIS_WRITE |

**核心改造原则**：
- 完全废弃 `X-Caller-Module` / `X-Caller-Service` / `X-Redis-Write` / `X-Caller-File` 等自报身份 Header
- 基于路由归属、调用文件路径、模块上下文自动识别调用方身份
- 不信任前端/调用方传入的任何身份标识（软约束=没约束）

### 3.1.3 部署后实测标准（HARD-03 绕过验证）

| 测试用例 | curl 命令 | 预期 |
|---------|----------|------|
| 伪造 brain Header | `curl -H "X-Caller-Module: core/brain" -H "Referer: https://xxx/vocabulary.html" /api/ai/chat` | 403 + 9001（Referer检测到前端来源） |
| 不传任何 Header | `curl /api/ai/chat` | 403 + 9001（默认判定为前端请求） |
| 前端直连 AI | `curl -H "Referer: https://xxx/vocabulary.html" /api/ai/chat` | 403 + 9001（路由归属拦截） |
| 合法后端调用 | 后端 Service 内部 `require('src/core/brain/facade')` | 放行（调用栈确认来自 BrainFacade） |
| 伪造 CacheManager Header 写 Redis | `curl -H "X-Caller-File: core/cacheManager.js" -H "X-Redis-Write: true" /api/user/profile` | 403 + 9001（底层SDK调用栈检测） |

## 3.2 CI 违宪扫描静态防护

### 3.2.1 检测维度

| 维度 | 检测内容 | 绕过防护 |
|------|---------|---------|
| 直连模型 | hunyuan/deepseek/tencentcloud 域名 | 字符串拼接检测 |
| 直写缓存 | redis.set/setex/hset/del | 变量名模糊匹配 |
| 跨模块耦合 | Service import 其他领域 Service | — |
| 密钥泄露 | API_KEY/SECRET 硬编码 | 注释内代码检测 |
| 动态加载 | require 拼接/动态 import/eval | 正则匹配 |
| 版本号 | Commit Message [图谱版本:vX.Y.Z] | 正则校验 |
| **前端硬编码题库（HARD-04 新增）** | HTML/JS 中含 question/option/answer 的硬编码数组，未走 API 加载 | 变量名模糊匹配 + 上下文检测 |

### 3.2.1a 前端硬编码题库检测规则（HARD-04 补全）

**检测对象**：所有 `public/**/*.html` 和 `public/**/*.js` 文件

**检测模式**：
```
1. 硬编码数组模式: /\b(?:questions|questionBank|quizData|examData)\s*[:=]\s*\[/g
2. 题目字段模式:   /\{\s*(?:q|question|ask)\s*:\s*['"\`][^'\"\`]{10,}['"\`]\s*,\s*(?:opts|options|answers|a)\s*:/g
3. API加载检测:    同一文件中是否同时存在 fetch('/api/...question...') 或 fetch('/api/blueprint/...')
4. 判定逻辑:       命中模式1或2 + 未命中模式3 → 一级违宪（兜底题库也算硬编码，API失败应提示重试而非静默降级）
```

**违宪判定**：
- 前端硬编码任何语种的题库 → 一级违宪，CI 扫描阻断
- 所有学习类题目必须由后端 AI 生成（经 BrainFacade → LanguageGuard），前端仅负责渲染
- 即使是 API 失败兜底，也不允许硬编码题库（应提示用户重试）

**典型案例**：`placement.html` 硬编码 7 种语言各 6 题（含中/英/日/韩/法/西/德），虽然 API 优先加载但兜底题库仍存在，需全部删除。

### 3.2.2 白名单审批流程

```
开发提交豁免申请 → 总工程师审批 → 登记入账 (EXEMPT 编号)
→ 更新豁免分册 + 架构变更分册
→ 复核周期: 核心模型 6 月 / 基础设施 12 月
→ 复核不通过 → 豁免作废 → 按一级违宪整改
```

## 3.3 台账审计体系

### 3.3.1 三大台账关联关系

```
MASTER_LEDGER_v3.0.0.md (总账)
  ├── audit_ledger_violations.md (违宪销号)
  │     └── 双向关联 → audit_ledger_exemptions.md (豁免)
  ├── audit_ledger_defects.md (缺陷闭环)
  ├── audit_ledger_architecture.md (架构变更)
  └── audit_ledger_compliance.md (合规风险)
```

### 3.3.2 更新强制流程

```
代码变更 → 24h 内更新总账 → 绑定 Git SHA + 图谱版本号 + 违宪编号
→ 账簿校验脚本自动检测 (7 类规则)
→ 不通过 → 驳回合并
```

---

# 第四编：规则对照表

## 4.1 宪法条款 → 架构规则 → 违宪判定

| 宪法条款 | 架构规则 | 违宪行为 | 判定标准 |
|---------|---------|---------|---------|
| CoreOS 0.1 SSOT | 仅 Repository 写 DB，仅 CacheManager 写 Redis | Service 直写缓存 | CI 扫描命中 → 9001 |
| CoreOS 0.2 DDD | 跨领域仅通过 EventBus | Service 直接 import 其他领域 | DependencyGuard 拦截 → 9001 |
| CoreOS 0.4 Brain | 所有 AI 经 BrainFacade | 业务层直连模型 API | CI 扫描命中 → 9001 |
| CoreOS 6.2 LanguageGuard | AI 输出语种校验 | 非目标语言输出 | BrainFacade 内部拦截 |
| 产品宪法 3.1 三维语言 | 语言从 SSOT 读取 | 前端传 lang 参数 | ContextResolver 忽略前端参数 |
| 产品宪法 9.2 串语禁令 | 题目语言=targetLang | 硬编码英语题库 | CI 扫描命中 → 9001 |
| Z1.1 历史无豁免 | 所有旁路必须整改 | "历史遗留"理由 | 驳回 → 限期整改 |
| Z1.3 图谱外非法 | 所有接口/服务必须登记 | 未登记功能 | 禁止上线 |

## 4.2 遗留问题架构级解决方案

| 问题 | 架构方案 | 落地排期 |
|------|---------|---------|
| DependencyGuard 未实测 | 标准化测试用例 + 部署后验证报告 | 部署日 |
| 前端加载竞态 | common.js 同步加载 + window.AILOS 就绪检测 | P2 已固化 |
| ANSI 污染 | CI 扫描检测 + pre-commit hook 拦截 | P2 已固化 |
| 母语锁定 | 首次设置永久锁定 + 修改需二次确认 | P3 审计 |
| 内容差异化 | 词汇/语法/阅读 type 参数强制隔离 | P3 审计 |

## 4.3 架构历史问题库（HARD-04 典型案例）

| 编号 | 问题 | 根因 | 架构教训 | 状态 |
|------|------|------|---------|------|
| AH-001 | placement.html 串语 | 前端硬编码英语题库，API失败静默降级 | 所有学习类题目必须由后端AI生成，前端仅渲染 | ✅ 已修复 |
| AH-002 | 蓝图标注前端直连AI为合法 | 架构文档审查不严 | 所有AI请求必经Controller→BrainFacade，前端禁止直连/api/ai/* | ✅ HARD-02 补全 |
| AH-003 | DependencyGuard基于Header信任 | 让调用方自报身份 | 基于路由归属+调用栈自动识别，不信任任何Header | ✅ HARD-03 补全 |
| AH-004 | 蓝图无机器可读元数据 | CI只能靠人工对照文档 | 必须配套JSON元数据，CI基于JSON做一致性校验 | ✅ HARD-01 补全 |

**审计参照规则**：凡涉及"前端硬编码内容""调用方自报身份""AI直连绕过""文档无机器可读"四类问题，以上案例作为判例直接引用，无需重新论证。

---

> **蓝图版本**: v3.0.0 (HARD-01~04 补全) | **归档路径**: docs/constitution/AILOS_软件架构蓝图_v3.0.0.md
> **配套元数据**: architecture-blueprint-v3.0.0.json（CI 唯一比对基准）
> **版本绑定**: 蓝图 v3.0.0 = 图谱 v3.0.0 = 宪法 v2.6.0，三者同步更新，版本不一致判定审计不通过
> **冻结状态**: 4 项硬伤已补全，正式冻结生效

---

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- v3.2.0 架构增量（以下为合并追加内容，源自 docs/架构蓝图v3.2.0增量.md） -->
<!-- ═══════════════════════════════════════════════════════════ -->

# AILOS 架构蓝图 v3.2.0 增量更新

> **文档性质**: AILOS 项目软件架构蓝图 v3.2.0 社交板块升级增量，与既有架构蓝图 v3.0.0、双宪法 v2.6.0（含 v3.2.0 增量条款）、系统图谱 v3.0.0 具同等最高强制约束力
> **文档版本**: v3.2.0（社交板块升级·架构增量）
> **基准基线**: 架构蓝图 v3.0.0 + 双宪法 v2.6.0 + P3 终验通过（14e544f）
> **生效日期**: 2026-08-07
> **适用对象**: 所有开发者、架构师、审计人员、运维人员
> **冲突规则**: 本增量与架构蓝图 v3.0.0 冲突时以本增量为准；本增量未覆盖事项沿用 v3.0.0 正文

---

## 升级总述

v3.2.0 架构增量在 v3.0.0 五层 DDD 架构基础上，新增「社交域资讯模块」与「站内动态优质推荐升级」两块能力。本次增量严格遵循既有分层铁律（接入层 → 应用层 → 领域层 → 基础设施层 → 外部服务层），并强化三项合规约束：

1. 资讯域 AI 能力统一收口至 BrainFacade，业务代码零直连大模型；
2. 抓取-审核-展示全链路状态机闭环，pending 内容前台不可见；
3. 三层去广告架构默认零 AI 消耗，AI 层可开关。

---

## 第一编：社交域资讯模块架构设计

### 1.1 数据模型（Prisma schema 增量）

新增 4 个模型，全部归属社交域，写入 `prisma/schema.prisma`：

```prisma
// 资讯来源（受控白名单）
model NewsSource {
  id          String   @id @default(cuid())
  name        String                     // 来源名称
  url         String   @unique           // 来源首页/Feed URL
  sourceType  String                     // media | education | official
  isWhitelist Boolean @default(false)    // 是否白名单（允许官方广告）
  dailyLimit  Int      @default(2)       // 每日抓取上限
  status      String   @default("active")// active | blocked
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  articles    NewsArticle[]
  auditLogs   NewsAuditLog[]
}

// 资讯文章（聚合卡片）
model NewsArticle {
  id          String   @id @default(cuid())
  sourceId    String
  source      NewsSource @relation(fields: [sourceId], references: [id])
  title       String                     // 原标题直显
  summary     String   @db.VarChar(100)  // ≤100 字摘要
  sourceUrl   String                     // 原文跳转链接
  author      String?                    // 原作者（如有）
  category    String?                    // 分类打标
  status      String   @default("pending")// pending | approved | rejected | taken_down
  aiProcessed Boolean @default(false)    // 是否经过 AI 处理
  crawledAt   DateTime @default(now())
  approvedAt  DateTime?
  approvedBy  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  reports     NewsReport[]
  auditLogs   NewsAuditLog[]

  @@index([status, crawledAt])
  @@index([sourceId])
}

// 用户举报
model NewsReport {
  id          String   @id @default(cuid())
  articleId   String
  article     NewsArticle @relation(fields: [articleId], references: [id])
  reporterId  String?                    // 举报用户（可匿名）
  reason      String                     // 举报理由
  status      String   @default("pending")// pending | handled
  handledBy   String?
  handledAt   DateTime?
  createdAt   DateTime @default(now())
}

// 审计日志（来源/文章/举报全量操作）
model NewsAuditLog {
  id           String   @id @default(cuid())
  action       String                     // source_add | source_block | approve | reject | takedown | report_handle | ai_toggle
  operatorId   String?
  targetType   String                     // source | article | report
  targetId     String
  source       NewsSource?  @relation(fields: [sourceId], references: [id])
  sourceId     String?
  article      NewsArticle? @relation(fields: [articleId], references: [id])
  articleId    String?
  beforeStatus String?
  afterStatus  String?
  reason       String?
  createdAt    DateTime @default(now())

  @@index([targetType, targetId])
  @@index([createdAt])
}
```

### 1.2 服务层设计

资讯域服务层严格遵循「领域隔离、Facade 收口」原则，新增 3 个 Service：

| 服务 | 职责 | AI 依赖 | 文件 |
|------|------|---------|------|
| `newsFilterService` | 三层去广告 + 敏感词过滤 | 可选（默认关闭） | `src/services/newsFilterService.js` |
| `newsAggregatorService` | 抓取聚合 + 去重 + 入库 | 无 | `src/services/newsAggregatorService.js` |
| `newsService` | 前台查询展示（仅 approved） | 无 | `src/services/newsService.js` |

**调用关系**：

```
newsCrawlJob (定时任务)
   └─→ newsAggregatorService.crawlOnce()
          ├─→ fetchFromSource(source)        // 拉取 Feed
          ├─→ parseFeedData(raw)              // 解析为标准结构
          ├─→ newsFilterService.filter(item)  // 三层去广告 + 敏感词
          └─→ storeArticles(items)            // 去重 + 入 pending 池

newsService.getNewsList()                      // 前台查询
   └─→ 仅返回 status=approved 的文章
```

### 1.3 路由层设计

路由分公开与管理两套，均挂载至 `src/server/routes/index.js`：

| 路由 | 方法 | 鉴权 | 用途 | 文件 |
|------|------|------|------|------|
| `/api/v1/news/list` | GET | 公开 | 资讯列表（仅 approved） | `src/server/routes/news.js` |
| `/api/v1/news/detail/:id` | GET | 公开 | 资讯卡片详情 | `src/server/routes/news.js` |
| `/api/v1/news/report` | POST | 用户 | 提交举报 | `src/server/routes/news.js` |
| `/api/admin/news/sources` | GET/POST | 管理员 | 来源列表/新增 | `src/server/routes/adminNews.js` |
| `/api/admin/news/audit` | GET/POST | 管理员 | 待审核列表/审核 | `src/server/routes/adminNews.js` |
| `/api/admin/news/takedown` | POST | 管理员 | 一键下架 | `src/server/routes/adminNews.js` |
| `/api/admin/news/block-source` | POST | 管理员 | 拉黑来源 | `src/server/routes/adminNews.js` |
| `/api/admin/news/crawl-now` | POST | 管理员 | 手动立即抓取 | `src/server/routes/adminNews.js` |
| `/api/admin/news/ai-toggle` | POST | 管理员 | 开关 AI 深度处理 | `src/server/routes/adminNews.js` |

**路由挂载**（`src/server/routes/index.js` 增量）：

```javascript
router.use('/api/v1/news', require('./news'));
router.use('/api/admin/news', require('./adminNews'));
```

### 1.4 定时任务设计

新增定时任务 `newsCrawlJob`，在 `src/server/index.js` 启动时注册：

```javascript
// src/jobs/newsCrawlJob.js
// cron: 每日 06:00 / 18:00 增量抓取
const cron = '0 6,18 * * *';

async function run() {
  const sources = await NewsSource.findMany({ where: { status: 'active' } });
  for (const source of sources) {
    // 受 dailyLimit 管控
    await newsAggregatorService.crawlOnce(source);
  }
}
```

**启动注册**（`src/server/index.js` 增量）：

```javascript
require('./jobs/newsCrawlJob').start(); // 启动 newsCrawlJob
```

---

## 第二编：数据流说明

### 2.1 抓取流程

```
newsCrawlJob (cron 06:00/18:00)
   │
   ▼
newsAggregatorService.crawlOnce(source)
   │
   ├─ ① fetchFromSource(source.url)      // 拉取 Feed/HTML
   │
   ├─ ② parseFeedData(raw)               // 解析为 {title, summary, url, author}
   │      └─ summary 超 100 字 → 截断
   │
   ├─ ③ storeArticles(items)
   │      ├─ 去重（sourceUrl 唯一）
   │      ├─ newsFilterService.filter(item)
   │      │    ├─ 第一层：关键词规则过滤（AD_KEYWORD_PATTERNS, SENSITIVE_KEYWORDS）
   │      │    ├─ 第二层：AI 辅助识别（enableAI=true 时，brainFacade.generateText）
   │      │    └─ 第三层：白名单机制（isWhitelist）
   │      └─ status=pending 入待审核池
   │
   ▼
完成（等待人工审核）
```

### 2.2 展示流程

```
前端 community-trend.html (站外资讯 Tab)
   │
   ▼
fetch('/api/v1/news/list?page=1&category=ja')
   │
   ▼
newsService.getNewsList({ status: 'approved' })   // 仅返回 approved
   │
   ▼
返回: [{ title, summary(≤100字), sourceName, author, sourceUrl }]
   │
   ▼
前端渲染卡片 → 标题 + 摘要 + 来源 + 跳转链接（新标签页）
```

### 2.3 审核流程

```
管理员 admin-news.html
   │
   ▼
GET /api/admin/news/audit?status=pending      // 拉取待审核列表
   │
   ▼
管理员审阅 → POST /api/admin/news/audit
   { articleId, action: 'approve' | 'reject', reason }
   │
   ├─ approve → status=approved, approvedAt, approvedBy
   └─ reject  → status=rejected
   │
   ▼
写入 NewsAuditLog（action, operatorId, beforeStatus, afterStatus, reason）
```

### 2.4 举报流程

```
用户点击举报 → POST /api/v1/news/report { articleId, reason }
   │
   ▼
创建 NewsReport (status=pending)
   │
   ▼
管理员后台 GET /api/admin/news/reports
   │
   ▼
管理员处理 → POST /api/admin/news/report-handle
   { reportId, action: 'dismiss' | 'takedown' }
   │
   ├─ takedown → NewsArticle.status=taken_down（自动下架）
   └─ dismiss  → NewsReport.status=handled
   │
   ▼
写入 NewsAuditLog
```

---

## 第三编：配额管控规则

### 3.1 默认零 AI 消耗

- 系统默认 `enableAI=false`，资讯域仅使用第一层（关键词规则）+ 第三层（白名单）过滤，**零 AI 额度消耗**；
- 第二层 AI 辅助识别需后台显式开启后方可生效，开启动作写入审计日志。

### 3.2 单条 AI 调用限制

- 开启 AI 时，**单条资讯 AI 调用限制 1 次**；
- 摘要 + 广告识别 + 分类打标合并为一次 `brainFacade.generateText()` 调用，禁止拆分多次；
- 超出 1 次 → 抛 `AI_QUOTA_EXCEEDED`，该条回退纯规则过滤。

### 3.3 AI 调用审计链路

```
newsFilterService (第二层)
   │
   ▼
BrainFacade.generateText(messages, { userId: null, source: 'news_filter' })
   │
   ├─ LanguageGuard.validateInput()
   ├─ aiService.callHunyuan()
   └─ AuditLogger.log('news_filter', null, meta)   // 自动写入审计
   │
   ▼
aiQuotaService.consume('news_domain', 1)            // 配额扣减
```

### 3.4 抓取频次管控

| 管控点 | 机制 | 说明 |
|--------|------|------|
| 定时触发 | cron `0 6,18 * * *` | 每日 06:00 / 18:00 固定时段 |
| 单来源上限 | `NewsSource.dailyLimit` | 超限自动停止该来源当日抓取 |
| 手动触发 | 管理员 `/api/admin/news/crawl-now` | 受 dailyLimit 约束，写入审计 |
| 失败退避 | 连续失败 3 次 → 指数退避 | 上限 30 分钟 |

---

## 第四编：三层去广告架构

资讯域去广告采用三层递进过滤，默认仅启用第一层与第三层（零 AI 消耗），第二层可开关：

### 4.1 第一层：关键词规则过滤（零 AI 消耗）

```
newsFilterService.ruleFilter(item)
   │
   ├─ AD_KEYWORD_PATTERNS 匹配（广告关键词正则）
   ├─ SENSITIVE_KEYWORDS 匹配（敏感词）
   └─ 命中 → 标记 flagged，拒绝入库
```

- 纯规则匹配，零 AI 消耗；
- 规则库沿用既有 `AD_KEYWORD_PATTERNS`、`SENSITIVE_KEYWORDS` 体系，可后台维护。

### 4.2 第二层：AI 辅助识别（可开关，默认关闭）

```
if (enableAI === true) {
  newsFilterService.aiFilter(item)
    └─ brainFacade.generateText(广告识别 prompt)
          └─ 返回 isAd / category / summary
}
```

- 经 BrainFacade 调度，禁止直连大模型；
- 默认关闭，开启后单条限 1 次调用；
- 开启时同时产出 AI 摘要与分类打标。

### 4.3 第三层：白名单机制

```
newsFilterService.whitelistFilter(source)
   │
   ├─ NewsSource.isWhitelist === true → 允许官方广告（不误杀）
   └─ isWhitelist === false → 严格过滤广告内容
```

- 仅白名单来源允许保留官方广告标识；
- 非白名单来源的广告内容一律过滤。

### 4.4 三层协同时序

```
item 进入过滤
   │
   ▼
第一层 ruleFilter ──命中──→ 拒绝入库（flagged）
   │ 未命中
   ▼
第二层 aiFilter（enableAI?）
   ├─ false → 跳过
   └─ true → brainFacade.generateText() ──识别为广告──→ 拒绝入库
   │ 未识别为广告
   ▼
第三层 whitelistFilter
   └─ 非白名单来源含广告特征 → 过滤
   │ 通过
   ▼
status=pending 入待审核池
```

---

## 第五编：站内动态升级

### 5.1 SocialTimeline 字段增量

既有 `SocialTimeline` 模型新增 5 个字段，用于优质推荐与标签体系：

| 字段 | 类型 | 说明 |
|------|------|------|
| `tag` | String? | 动态标签：`experience` \| `study_abroad` \| `exam_prep` \| `find_partner` |
| `isQuality` | Boolean @default(false) | 是否优质（后台审核标记加精） |
| `qualityMarkedBy` | String? | 加精操作人 |
| `qualityMarkedAt` | DateTime? | 加精时间 |
| `favoriteCount` | Int @default(0) | 收藏数 |

```prisma
// SocialTimeline 增量字段
model SocialTimeline {
  // ... 既有字段
  tag             String?                    // experience | study_abroad | exam_prep | find_partner
  isQuality       Boolean  @default(false)   // 优质标识（后台审核标记）
  qualityMarkedBy String?
  qualityMarkedAt DateTime?
  favoriteCount   Int      @default(0)
}
```

### 5.2 优质推荐排序

`socialTimeline` 路由的列表查询排序规则升级为多级权重：

```
排序优先级:
  isQuality (优质优先) → likeCount → favoriteCount → commentCount → createdAt
```

```javascript
// src/server/routes/socialTimeline.js 增量
const list = await prisma.socialTimeline.findMany({
  where: { ... },
  orderBy: [
    { isQuality: 'desc' },
    { likeCount: 'desc' },
    { favoriteCount: 'desc' },
    { commentCount: 'desc' },
    { createdAt: 'desc' },
  ],
});
```

### 5.3 标签体系

| 标签值 | 含义 | 场景 |
|--------|------|------|
| `experience` | 学习经验分享 | 用户发布学习心得 |
| `study_abroad` | 留学相关 | 留学资讯、申请经验 |
| `exam_prep` | 备考相关 | 考级备考交流 |
| `find_partner` | 找语伴 | 语言交换、学习搭子 |

- 标签由用户发布时选择，后台可校正；
- 前端支持按标签筛选动态列表。

### 5.4 加精标识机制

- `isQuality` 由**后台审核标记**，普通用户无权自行设置；
- 加精操作记录 `qualityMarkedBy` + `qualityMarkedAt`，写入审计；
- 加精动态在列表中置顶优先展示，并显示「优质」标识。

---

## 第六编：前端页面架构

### 6.1 双 Tab 页面（community-trend.html 增量）

`public/community-trend.html` 升级为双 Tab 结构：

| Tab | 内容 | 数据源 |
|-----|------|--------|
| 站内动态 | SocialTimeline 优质推荐 + 标签筛选 | `/api/v1/social-timeline` |
| 站外资讯 | NewsArticle 聚合卡片 | `/api/v1/news/list` |

- 两个 Tab 共享同一页面框架，切换时仅切换数据请求；
- 站外资讯卡片严格渲染「标题 + 摘要 + 来源 + 跳转链接」四要素。

### 6.2 后台管理页面（admin-news.html 新增）

`public/admin-news.html` 为新增后台管理页面，功能模块：

| 模块 | 功能 |
|------|------|
| 来源管理 | 新增/删除/拉黑/恢复来源 |
| 待审核池 | 查看 pending 列表，approve/reject |
| 内容管理 | approved 内容列表，一键下架 |
| 举报处理 | 用户举报列表，dismiss/takedown |
| AI 开关 | 开关 AI 深度处理 |
| 立即抓取 | 手动触发抓取（受 dailyLimit 约束） |
| 审计日志 | 查看 NewsAuditLog |

---

## 附：v3.2.0 架构增量合规自检

| 检查项 | 状态 |
|--------|------|
| 资讯域 AI 调用统一走 BrainFacade | ✅ |
| 业务代码零直连大模型 | ✅ |
| 默认 enableAI=false，零 AI 消耗 | ✅ |
| 单条 AI 调用限 1 次 | ✅ |
| 抓取频次 cron + dailyLimit 双重管控 | ✅ |
| 三层去广告架构完整 | ✅ |
| pending 内容前台不可见 | ✅ |
| 审核操作全量写入 NewsAuditLog | ✅ |
| 站外资讯仅标题+摘要+来源+链接 | ✅ |
| SocialTimeline 优质推荐排序生效 | ✅ |

> **v3.2.0 架构增量定稿。与双宪法 v3.2.0 增量条款、终验审计报告 v3.2.0 同步生效。**
