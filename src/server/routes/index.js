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

module.exports = router;