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

// 双语言一致性校验（全量 / 单用户）
router.get('/language-consistency', authenticate, requireAdmin, adminLanguageController.getConsistency);

// 告警清单查询
router.get('/language-consistency/alerts', authenticate, requireAdmin, adminLanguageController.listAlerts);

// 告警人工处置（确认真值 → RESOLVED）
router.post('/language-consistency/alerts/:id/resolve', authenticate, requireAdmin, adminLanguageController.resolveAlert);

module.exports = router;
