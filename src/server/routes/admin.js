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
const adminController = require('../controllers/adminController');

// 双语言一致性校验（全量 / 单用户）
router.get('/language-consistency', authenticate, requireAdmin, adminLanguageController.getConsistency);

// 告警清单查询
router.get('/language-consistency/alerts', authenticate, requireAdmin, adminLanguageController.listAlerts);

// 告警人工处置（确认真值 → RESOLVED）
router.post('/language-consistency/alerts/:id/resolve', authenticate, requireAdmin, adminLanguageController.resolveAlert);

// 管理员身份
router.get('/me', authenticate, requireAdmin, adminController.getMe);

// 订单查询（按账号 / 时间区间 / 异常状态 / 类型筛选）
router.get('/orders', authenticate, requireAdmin, adminController.listOrders);

// 订单导出 CSV（带 BOM，复用管理员鉴权）
router.get('/orders/export', authenticate, requireAdmin, adminController.exportOrders);

// 用户时长查询
router.get('/users/billing', authenticate, requireAdmin, adminController.searchUserBilling);

// 用户时长手动调整（增加 / 扣减，强制留痕）
router.post('/users/billing/adjust', authenticate, requireAdmin, adminController.adjustUserTime);

// 异常订单标记
router.post('/orders/:id/abnormal', authenticate, requireAdmin, adminController.markOrderAbnormal);

// 操作日志
router.get('/operation-logs', authenticate, requireAdmin, adminController.listOperationLogs);

module.exports = router;
