// ============================================================
// src/server/routes/admin.js
// P2 任务二：管理端路由（一致性校验 + 告警处置）
// 全部路由：authenticate（登录）→ requireAdmin（管理员 allowlist）
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const adminLanguageController = require('../controllers/adminLanguageController');
const billingController = require('../controllers/billingController');

// 双语言一致性校验（全量 / 单用户）
router.get('/language-consistency', authenticate, requireAdmin, adminLanguageController.getConsistency);

// 告警清单查询
router.get('/language-consistency/alerts', authenticate, requireAdmin, adminLanguageController.listAlerts);

// 告警人工处置（确认真值 → RESOLVED）
router.post('/language-consistency/alerts/:id/resolve', authenticate, requireAdmin, adminLanguageController.resolveAlert);

// 第三阶段收尾 Item3(1)：管理员订单对账导出（日期区间，默认当日）
router.get('/orders/export', authenticate, requireAdmin, billingController.adminExportOrdersRange);

module.exports = router;
