// ============================================================
// src/server/routes/reports.js
// 学习报表路由 — Module 02 Step 5
// ============================================================
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 根路由：/api/reports 直接返回学习报告摘要（修复部署冒烟 404）
router.get('/', reportsController.getSummary);
router.get('/summary', reportsController.getSummary);
router.get('/xp-history', reportsController.getXpHistory);

module.exports = router;