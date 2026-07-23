// ============================================================
// src/server/routes/dashboard.js
// 学习驾驶舱路由
// ============================================================
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard - 获取首页全部数据
router.get('/', authenticate, dashboardController.getDashboard);

module.exports = router;