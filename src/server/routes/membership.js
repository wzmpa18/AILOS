/**
 * Stage 10 阶段3：会员路由
 * 套餐查询/会员状态/订单/支付回调/代付/订单历史
 */
const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate } = require('../middleware/auth');

// Public: 查看套餐（无需登录）
router.get('/plans', membershipController.getPlans);

// Protected: 需登录
router.use(authenticate);

// 会员状态
router.get('/status', membershipController.getStatus);
router.get('/premium-check', membershipController.checkPremiumAccess);

// 订单管理
router.get('/orders', membershipController.getOrders);
router.post('/order', membershipController.createOrder);

// 支付回调
router.post('/payment/callback', membershipController.processPayment);

// 代付机制
router.post('/proxy/create', membershipController.createProxyPayment);
router.get('/proxy/order', membershipController.getProxyOrder);
router.post('/proxy/pay', membershipController.processProxyPayment);

module.exports = router;
