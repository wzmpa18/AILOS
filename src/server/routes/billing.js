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

// Phase2 Task1 — 支付沙箱链路：下单 → 回调 → 状态查询
router.post('/payment/create', billingController.createPayment);
router.post('/payment/callback', billingController.paymentCallback);
router.get('/payment/status/:orderNo', billingController.paymentStatus);

// Phase2 Task4 — 会员时长权益映射与领取
router.get('/membership-benefit', billingController.membershipBenefit);
router.post('/membership-benefit/claim', billingController.claimMembershipBenefit);

module.exports = router;
