// ============================================================
// src/server/routes/reports.js
// 学习报表路由 — Module 02 Step 5
// ============================================================
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', reportsController.getSummary);
router.get('/xp-history', reportsController.getXpHistory);

module.exports = router;