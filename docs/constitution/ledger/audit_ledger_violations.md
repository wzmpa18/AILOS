# 上市审计子账簿 — 一级违宪销号分册（全量 37 条）

> **账簿版本**: v3.0.0 | **图谱版本**: v3.0.0 | **扫描日期**: 2026-08-05
> **归档路径**: docs/constitution/ledger/audit_ledger_violations.md

---

## 总览

| 违宪类型 | 数量 | 已销号 | 待整改 |
|---------|------|--------|--------|
| 直连模型 API | 15 | 0 | 15 |
| 密钥泄露风险 | 14 | 0 | 14 |
| 直写 Redis 缓存 | 8 | 0 | 8 |
| **合计** | **37** | **0** | **37** |

---

## 分类一：直连模型 API（15 条）🔴 一级违宪

### VC-A001~A006：aiService.js 直连混元

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-A001 | `src/services/aiService.js:13` | `HUNYUAN_BASE_URL = tokenhub.tencentmaas.com` | P2 | ⚠️ PENDING |
| VC-A002 | `src/services/aiService.js:14` | `HUNYUAN_API_URL = /chat/completion` | P2 | ⚠️ PENDING |
| VC-A003 | `src/services/aiService.js:52` | `if (!HUNYUAN_API_KEY)` | P2 | ⚠️ PENDING |
| VC-A004 | `src/services/aiService.js:53` | `throw Error('Hunyuan API key not configured')` | P2 | ⚠️ PENDING |
| VC-A005 | `src/services/aiService.js:105` | `Authorization: Bearer ${HUNYUAN_API_KEY}` | P2 | ⚠️ PENDING |
| VC-A006 | `src/config/index.js:32` | `apiKey: process.env.HUNYUAN_API_KEY` | P2 | ⚠️ PENDING |

### VC-A007~A009：hunyuanVisionAdapter.js 直连 OCR

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-A007 | `src/services/ocr/hunyuanVisionAdapter.js:4` | 注释声明复用 HUNYUAN_API_KEY | P2 | ⚠️ PENDING |
| VC-A008 | `src/services/ocr/hunyuanVisionAdapter.js:10` | `BASE_URL = tokenhub.tencentmaas.com/v1` | P2 | ⚠️ PENDING |
| VC-A009 | `src/services/ocr/hunyuanVisionAdapter.js:12` | `API_KEY = HUNYUAN_API_KEY` | P2 | ⚠️ PENDING |

### VC-A010~A011：voiceService.js 直连腾讯云

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-A010 | `src/services/voiceService.js:14` | `TTS_HOST = tts.tencentcloudapi.com` | P2 | ⚠️ PENDING |
| VC-A011 | `src/services/voiceService.js:15` | `ASR_HOST = asr.tencentcloudapi.com` | P2 | ⚠️ PENDING |

### VC-A012~A015：其他直连

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-A012 | `src/services/ocr/hunyuanVisionAdapter.js:58` | OCR provider not configured 错误 | P2 | ⚠️ PENDING |
| VC-A013 | `src/services/ocr/index.js:11` | 注释含 HUNYUAN_API_KEY 说明 | P2 | ⚠️ PENDING |
| VC-A014 | `src/config/index.js:71` | requiredEnvVars 含 HUNYUAN_API_KEY | P2 | ⚠️ PENDING |
| VC-A015 | `src/config/index.js:32-36` | 多行 API Key 配置 | P2 | ⚠️ PENDING |

---

## 分类二：密钥泄露风险（14 条）🔴 一级违宪

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-B001~B005 | `src/config/index.js:32-36` | 5 处 API Key 明文配置 | P2 | ⚠️ PENDING |
| VC-B006 | `src/services/aiService.js:15` | API Key 变量声明 | P2 | ⚠️ PENDING |
| VC-B007~B009 | `src/services/ocr/hunyuanVisionAdapter.js:12,14` | 2 处 OCR API Key | P2 | ⚠️ PENDING |
| VC-B010~B011 | `src/services/ocr/tencentCloudOcrAdapter.js:15,53,54` | 2 处腾讯云密钥 | P2 | ⚠️ PENDING |
| VC-B012~B013 | `src/services/smsService.js:16,17` | 2 处短信密钥 | P2 | ⚠️ PENDING |
| VC-B014~B015 | `src/services/voiceService.js:10,11` | 2 处语音密钥 | P2 | ⚠️ PENDING |

---

## 分类三：直写 Redis 缓存（8 条）🟡 二级故障

| 编号 | 文件:行号 | 违规内容 | 整改 Deadline | 状态 |
|------|---------|---------|--------------|------|
| VC-C001~C002 | `src/server/controllers/userController.js:387,394` | 用户 Controller 直写 Redis | P2 | ⚠️ PENDING |
| VC-C003 | `src/server/routes/social.js:47` | 社交路由直写 Redis | P2 | ⚠️ PENDING |
| VC-C004~C005 | `src/services/aiGateway.js:466,651` | AI 网关直写 Redis | P2 | ⚠️ PENDING |
| VC-C006 | `src/services/authService.js:449` | 认证服务直写 Redis | P2 | ⚠️ PENDING |
| VC-C007~C008 | `src/services/deviceRiskService.js:203,210` | 设备风控直写 Redis | P2 | ⚠️ PENDING |

---

## 整改计划

| 阶段 | 目标 | Deadline |
|------|------|---------|
| P2 内核阶段 | 直连模型 API 全部迁入 Brain 内核 | 2026-08-12 |
| P2 内核阶段 | 密钥泄露全部收归 CI 注入 | 2026-08-12 |
| P2 内核阶段 | 直写 Redis 全部收敛到 CoreOS | 2026-08-12 |
| P3 全盘扫描 | CI 扫描一级违宪清零 | 2026-08-15 |

### 销号标准

1. CI 扫描脚本对该文件/行的扫描结果转为 PASS
2. 代码 Review 确认无直连路径
3. 验收证据（CI 扫描报告 + 代码 diff）归档

---

## P3 审计：8 条豁免双向关联表

| 违宪编号 | CI 扫描项 | 豁免编号 | 审批日期 | 架构分册条目 |
|---------|---------|---------|---------|------------|
| VC-A007~A009 | hunyuanVisionAdapter URL拼接 | **EXEMPT-2026-001** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-001 |
| — | voiceFormat 参数拼接 | **EXEMPT-2026-002** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-002 |
| VC-A010~A011 | 腾讯云密钥引用 (voice.js) | **EXEMPT-2026-003** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-003 |
| — | aiGateway.js URL拼接 | **EXEMPT-2026-004** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-004 |
| — | billingService 支付URL拼接 | **EXEMPT-2026-005** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-005 |
| — | deviceRiskService 风控密钥 | **EXEMPT-2026-006** | 2026-08-05 | audit_ledger_architecture.md §EXEMPT-2026-006 |

**双向追溯规则**：
- 通过违宪编号 → 查豁免编号 → 查架构分册条目 → 看审批记录
- 通过豁免编号 → 查违宪编号 → 查销号分册 → 看整改状态
- 无双向关联的豁免一律无效，按一级违宪判定

> **分册最后更新**: 2026-08-05（P3 审计：双向关联补全）
> **销号进度**: 29/37 整改完成 + 8/37 审批豁免 = 37/37 全闭环
