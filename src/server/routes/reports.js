// ============================================================
// src/server/routes/reports.js
// 学习报告路由
// ============================================================
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/daily', authenticate, reportController.getDailyReport);
router.get('/weekly', authenticate, reportController.getWeeklyReport);
router.get('/overview', authenticate, reportController.getOverview);

module.exports = router;