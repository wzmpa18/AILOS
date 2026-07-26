// ============================================================
// src/server/routes/translate.js
// Stage11 子模块1 — 静态拍照翻译 + OCR 分层限流 + 学习联动
// 全部需登录；语言上下文由服务端从库解析（前端传参忽略）
// ============================================================
const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/photo', translateController.photoTranslate);
router.get('/photo/quota', translateController.getQuota);
router.post('/notebook', translateController.addToNotebook);

module.exports = router;
