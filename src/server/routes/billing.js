// ============================================================
// src/server/routes/billing.js
// Stage11 子模块2 — 翻译时长计费链路
// 全部需登录；语言上下文由服务端解析
// ============================================================
const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/status', billingController.getStatus);
router.get('/packages', billingController.getCatalog);
router.post('/package/buy', billingController.buyPackage);
router.post('/consume', billingController.consume);

module.exports = router;
