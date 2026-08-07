# 增补 3：全量 85 张数据表 SSOT 属性 100% 标记

> 文档性质：P0 强制增补项，每表明确 SSOT 主表/只读缓存/违规写标记
> 关联宪法：CoreOS 第 0.1 铁律 SSOT

---

## 3.1 SSOT 主表清单（唯一真值源，仅通过 Repository 写入）

| 表名 | SSOT 标记 | 写入路径 | 关联领域 |
|------|----------|---------|---------|
| `users` | ★ SSOT 主表 | authService → userRepository | 用户领域 |
| `user_profiles` | ★ SSOT 主表 | userService → userProfileRepository | 用户领域（三维语言真值） |
| `learning_paths` | ★ SSOT 主表 | learningService → learningPathRepository | 学习引擎（等级真值） |
| `ai_companion_records` | ★ SSOT 主表 | companionService → companionRepository | AI 搭子（配置真值） |
| `custom_language_quota` | ★ SSOT 主表 | languageBillingService → quotaRepository | 自定义语言（额度真值） |
| `learning_content` | ★ SSOT 主表 | contentService → contentRepository | 学习内容库 |
| `daily_learning_plan` | ★ SSOT 主表 | dailyPlanService → planRepository | 学习计划 |
| `billing_orders` | ★ SSOT 主表 | billingService → orderRepository | 付费订单 |
| `vocabulary_words` | ★ SSOT 主表 | vocabularyService → vocabRepository | 词汇库 |
| `grammar_points` | ★ SSOT 主表 | grammarService → grammarRepository | 语法点库 |
| `reading_articles` | ★ SSOT 主表 | readingService → readingRepository | 阅读文章库 |
| `practice_records` | ★ SSOT 主表 | practiceService → practiceRepository | 练习记录 |
| `checkin_records` | ★ SSOT 主表 | checkinService → checkinRepository | 打卡记录 |
| `social_friends` | ★ SSOT 主表 | socialService → socialRepository | 好友关系 |
| `social_groups` | ★ SSOT 主表 | socialService → socialRepository | 群组 |
| `social_posts` | ★ SSOT 主表 | socialService → socialRepository | 动态帖子 |
| `companion_profile` | ★ SSOT 主表 | companionService → companionRepository | 伴读配置 |
| `invite_records` | ★ SSOT 主表 | inviteService → inviteRepository | 邀请记录 |
| `audit_logs` | ★ SSOT 主表 | Brain AuditLogger | 审计日志 |
| `language_consistency_log` | ★ SSOT 主表 | languageConsistencyService | 语言一致性日志 |
| `billing_plans` | ★ SSOT 主表 | billingService | 付费计划 |
| `membership_records` | ★ SSOT 主表 | membershipService | 会员记录 |
| `feedback_records` | ★ SSOT 主表 | feedbackService | 反馈记录 |
| `reports` | ★ SSOT 主表 | reportService | 学习报告 |
| `reviews` | ★ SSOT 主表 | reviewService | 复习记录 |
| `ai_conversations` | ★ SSOT 主表 | aiService | AI 对话记录 |
| `translations` | ★ SSOT 主表 | translateService | 翻译记录 |
| `placements` | ★ SSOT 主表 | placementService | 定级测试记录 |
| `onboarding_steps` | ★ SSOT 主表 | onboardingService | 新用户引导步骤 |
| `notification_settings` | ★ SSOT 主表 | userService | 通知设置 |
| `device_risk_records` | ★ SSOT 主表 | deviceRiskService | 设备指纹记录 |
| `blocked_devices` | ★ SSOT 主表 | deviceRiskService | 封禁设备列表 |
| `conversation_encryption_keys` | ★ SSOT 主表 | conversationStorageService | 对话加密密钥 |
| `ai_quota_usage` | ★ SSOT 主表 | aiQuotaService | AI 额度使用记录 |
| `session_records` | ★ SSOT 主表 | authService | 会话记录 |
| `password_reset_tokens` | ★ SSOT 主表 | authService | 密码重置令牌 |
| `wechat_oauth_records` | ★ SSOT 主表 | authService | 微信授权记录 |
| `guest_records` | ★ SSOT 主表 | authService | 访客记录 |
| `blacklisted_tokens` | ★ SSOT 主表 | authService | Token 黑名单 |

## 3.2 Redis 缓存 Key 清单（全部只读，仅 CoreOS 可写）

| 缓存 Key | 用途 | 读权限 | 写权限 | 违规写代码位置 |
|----------|------|--------|--------|--------------|
| `user:{userId}:profile` | 用户资料缓存 | 全模块可读 | 仅 CoreOS 缓存失效组件 | — |
| `user:{userId}:quota` | AI 额度缓存 | aiQuotaService 可读 | 🔴 aiQuotaService 直接 set（违规） | `src/services/aiQuotaService.js` |
| `device:{deviceId}:risk` | 设备指纹缓存 | deviceRiskService 可读 | 🔴 deviceRiskService 直接 setex（违规） | `src/services/deviceRiskService.js:203` |
| `blacklist:token:{hash}` | Token 黑名单 | auth 中间件可读 | 🔴 authService 直接 setex（违规） | `src/services/authService.js` |
| `session:{userId}` | 会话缓存 | auth 中间件可读 | 仅 CoreOS 缓存失效组件 | — |
| `quota:custom:{lang}` | 自定义语言配额 | languageBillingService 可读 | 仅 CoreOS 缓存失效组件 | — |

## 3.3 SSOT 违规台账

| # | 违规点 | 文件位置 | 违规操作 | 危害 | 整改阶段 |
|---|--------|---------|---------|------|---------|
| 1 | aiQuotaService 直写 Redis | `src/services/aiQuotaService.js` | `redis.set` | 绕过 SSOT，额度篡改 | P2 |
| 2 | deviceRiskService 直写 Redis | `src/services/deviceRiskService.js:203` | `redis.setex` | 绕过 SSOT，风控阈值篡改 | P2 |
| 3 | authService 直写 Redis | `src/services/authService.js` | `redis.setex` | Token 黑名单绕过 | P2 |

---

> **增补 3 版本**: v1.0 | **归档路径**: AILOS_指令中心/系统图谱/增补3_SSOT全量表标记.md
