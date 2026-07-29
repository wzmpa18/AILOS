const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard
router.use('/dashboard', require('./dashboard'));

// Checkin
router.use('/checkin', require('./checkin'));

// Auth
router.use('/auth', require('./auth'));

// Language
router.use('/language', require('./language'));

// Content (Module 02 Step 1 — 学习内容体系)
router.use('/content', require('./content'));

// Reviews (Module 02 Step 3 — SRS 复习引擎)
router.use('/reviews', require('./reviews'));

// AI Tutor (Module 02 Step 4 — AI 导师对话记录)
router.use('/ai/tutor', require('./aiTutor'));

// Reports (Module 02 Step 5 — 学习报表 + XP)
router.use('/reports', require('./reports'));

// User (BUG-016: 用户进度查询 + 个人信息)
router.use('/user', require('./user'));

// Membership
router.use('/membership', require('./membership'));

// AI (Module 03 — AI 对话引擎)
router.use('/ai', require('./ai'));

// Daily Plan (Phase 2 — 30天口语速成)
router.use('/plan', require('./dailyPlan'));

// Speech Evaluate (Phase 2 — 口语评测)
router.use('/speech', require('./speechEvaluate'));

// Blueprint (Phase 3 — QuestionBlueprint / CourseBlueprint AI 生成)
router.use('/blueprint', require('./blueprint'));

// Learn (Phase 3 — 学习内容动态 API)
router.use('/learn', require('./learn'));

// Onboarding (蓝图 Stage 2/3/4 — 首次引导：身份/语言/定级/目标/伴读/30天计划)
router.use('/onboarding', require('./onboarding'));

// Admin (P2 任务二 — 双语言一致性校验 + 告警处置；管理员 allowlist 鉴权)
router.use('/admin', require('./admin'));

// Translate (Stage11 子模块1 — 静态拍照翻译 + OCR 分层限流熔断)
router.use('/translate', require('./translate'));

// Organization (Phase 4 P2 — 机构端 B-end 管理后台，独立路由 /api/org)
router.use('/org', require('./org'));

module.exports = router;