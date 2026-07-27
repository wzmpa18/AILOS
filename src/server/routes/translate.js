// ============================================================
// src/server/routes/translate.js
// Stage11 子模块1 — 静态拍照翻译 + OCR 分层限流 + 学习联动
// 全部需登录；语言上下文由服务端从库解析（前端传参忽略）
// ============================================================
const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/photo', translateController.photoTranslate);
router.get('/photo/quota', translateController.getQuota);
router.post('/notebook', translateController.addToNotebook);

// 子模块2 计费链路（附件 L 2.3 命名对齐）：套餐购买 / 试用状态查询
router.post('/package/buy', billingController.buyPackage);
router.get('/trial/status', billingController.getStatus);

module.exports = router;
