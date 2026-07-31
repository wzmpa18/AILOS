/**
 * Stage 10 阶段3：会员Controller
 * 套餐查询、会员状态、订单创建、支付回调、代付
 */
const membershipService = require('../../services/membershipService');
const { clearRightsCache } = require('../middleware/rightsMiddleware');

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await membershipService.getActivePlans();
    res.json({ success: true, data: plans });
  } catch (e) { next(e); }
};

exports.getStatus = async (req, res, next) => {
  try {
    const rights = await membershipService.getUserRights(req.user.id);
    const orders = await membershipService.getUserOrders(req.user.id, 1, 5);
    res.json({
      success: true,
      data: {
        rights,
        recentOrders: orders.orders,
        totalOrders: orders.total,
      },
    });
  } catch (e) { next(e); }
};

exports.checkPremiumAccess = async (req, res, next) => {
  try {
    const rights = await membershipService.getUserRights(req.user.id);
    const isPremium = rights.level >= 2 && !rights.expired;
    res.json({ success: true, data: { isPremium, rights } });
  } catch (e) { next(e); }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { planId, paymentMethod } = req.body;
    const order = await membershipService.createOrder(req.user.id, planId, paymentMethod || 'wechat');
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
};

exports.processPayment = async (req, res, next) => {
  try {
    const { orderNo, payAmount, channel, notifyId, rawData } = req.body;
    const result = await membershipService.handlePaymentCallback(orderNo, payAmount, channel, notifyId, rawData);
    // 清除权益缓存，使新会员等级即时生效
    clearRightsCache();
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.createProxyPayment = async (req, res, next) => {
  try {
    const { orderNo } = req.body;
    const result = await membershipService.createProxyPayment(orderNo, { payerId: req.user.id });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.getProxyOrder = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await membershipService.getProxyOrder(token);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.processProxyPayment = async (req, res, next) => {
  try {
    const { proxyToken, payAmount, payerInfo } = req.body;
    const result = await membershipService.handleProxyPayment(proxyToken, payAmount, payerInfo || {});
    clearRightsCache();
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await membershipService.getUserOrders(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
};
