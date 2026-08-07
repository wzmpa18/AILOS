/**
 * src/server/routes/languageBilling.js — 自定义语言配额 + 计费
 * 挂载于 /api/language/custom (父路由已含 /custom 前缀)
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const languageBillingController = require('../controllers/languageBillingController');

// 自定义语言配额查询  →  GET /api/language/custom/quota
router.get('/quota', authenticate, (req, res, next) => languageBillingController.getQuota(req, res, next));

// 消费明细  →  GET /api/language/custom/history
router.get('/history', authenticate, (req, res, next) => languageBillingController.getHistory(req, res, next));

// 预检可用性  →  GET /api/language/custom/check
router.get('/check', authenticate, (req, res, next) => languageBillingController.checkAvailability(req, res, next));

module.exports = router;
