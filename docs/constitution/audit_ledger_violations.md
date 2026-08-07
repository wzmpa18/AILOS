# 上市审计子账簿 — 一级违宪销号分册

> **账簿版本**: v3.0.0 | **主账簿**: MASTER_LEDGER_v3.0.0 | **图谱版本**: v3.0.0
> **归档路径**: docs/constitution/audit_ledger_violations.md

---

## 分册说明

本分册逐条对应《增补4_违宪整改总台账》中 7 项一级违宪，每条包含完整销号链路。上市审计时作为一级违宪闭环的唯一凭证。

---

## VC-001：aiService._callDirect() 直连混元 API

| 字段 | 值 |
|------|---|
| 主账簿编号 | PRJ-ST1-001（关联 P2 整改） |
| 违宪编号 | VC-001 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | `aiService._callDirect()` 通过 `axios.post(HUNYUAN_API_URL)` 直连混元大模型 |
| 根因 | aiService 同时包含网关路径和直连路径，直连路径为历史遗留 |
| 整改方案 | 删除 `_callDirect()` 函数，所有 AI 请求统一经 Brain 内核 ModelRouter |
| 责任部门 | AI调度中心·模型路由部 |
| 直接责任人 | 待指派 |
| Deadline | P2 内核阶段（2026-08-12） |
| 当前进度 | 0%（待整改） |
| 销号标准 | ① `_callDirect()` 完全删除 ② LanguageGuard 校验生效 ③ CI扫描无直连代码 |
| 验收证据路径 | 待提供 |
| 状态 | ⚠️ PENDING |
| 操作留痕 | [2026-08-05 AI监理] 从增补4迁移，标记PENDING |

## VC-002：hunyuanVisionAdapter 独立密钥直连 OCR

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-002 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | OCR适配器用独立 HUNYUAN_API_KEY 直连 tokenhub.tencentmaas.com |
| 根因 | OCR路径完全独立，未纳入Brain管控 |
| 整改方案 | 重构为 Brain OCRSubsystem |
| 责任部门 | AI调度中心·视觉识别部 |
| 直接责任人 | 待指派 |
| Deadline | P2 内核阶段 |
| 当前进度 | 0% |
| 状态 | ⚠️ PENDING |
| 操作留痕 | [2026-08-05 AI监理] 迁移 |

## VC-003：voiceService 直连腾讯云 TTS

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-003 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | TTS合成直连 tts.tencentcloudapi.com |
| 整改方案 | 重构为 Brain VoiceSubsystem |
| 责任部门 | AI调度中心·语音交互部 |
| Deadline | P2 内核阶段 |
| 当前进度 | 0% |
| 状态 | ⚠️ PENDING |

## VC-004：voiceService 直连腾讯云 ASR

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-004 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | 语音识别直连 asr.tencentcloudapi.com |
| 整改方案 | 同 VC-003 |
| 责任部门 | AI调度中心·语音交互部 |
| Deadline | P2 内核阶段 |
| 当前进度 | 0% |
| 状态 | ⚠️ PENDING |

## VC-005：前端可直连未授权内部 API

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-005 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | 27个HTML页面可直接fetch任何/api/*接口 |
| 整改方案 | DependencyGuard全局中间件拦截 |
| 责任部门 | CoreOS治理中心·安全合规部 |
| Deadline | P2 内核阶段 |
| 当前进度 | 0% |
| 状态 | ⚠️ PENDING |

## VC-006：window.AILOS 暴露写操作方法

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-006 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | setUILang/setStudyLang 直接写localStorage绕过SSOT |
| 整改方案 | 仅暴露只读方法，写操作走后端接口 |
| 责任部门 | 产品研发中心·前端基础架构部 |
| Deadline | P2 内核阶段 |
| 当前进度 | 0% |
| 状态 | ⚠️ PENDING |

## VC-007：placement.html 硬编码英语题库（已销号）

| 字段 | 值 |
|------|---|
| 违宪编号 | VC-007 |
| 违宪等级 | 🔴 一级违宪 |
| 违宪描述 | 原硬编码英语题目数组 |
| 根因 | 开发时未接入API |
| 整改方案 | 改为 /api/blueprint/question?language=ja 加载 |
| 责任部门 | 产品研发中心·学习产品部 |
| 验收证据 | 截图 shots/placement_manual2.png（日语题正常显示） |
| 状态 | ✅ FROZEN（已销号） |
| 销号日期 | 2026-08-05 |
| 操作留痕 | [2026-08-05 AI监理] 修复完成，API加载验证通过 → FROZEN |

---

> **分册最后更新**: 2026-08-05 | **销号进度**: 1/7 (14%)
