# AILOS 软件架构蓝图 v3.0.0

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
