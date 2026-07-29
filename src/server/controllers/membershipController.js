const membershipService = require('../../services/membershipService');
const membershipController = {
  // Get membership status
  async getStatus(req, res, next) {
    try {
      const status = await membershipService.getMembershipStatus(req.userId);
      res.json({ success: true, status });
    } catch (error) {
      next(error);
    }
  },

  // Get membership plans
  async getPlans(req, res, next) {
    try {
      const plans = membershipService.getMembershipPlans();
      res.json({ success: true, plans });
    } catch (error) {
      next(error);
    }
  },

  // Create order
  async createOrder(req, res, next) {
    try {
      const { membershipLevel, duration, paymentMethod } = req.body;
      const order = await membershipService.createOrder(
        req.userId,
        membershipLevel,
        duration,
        paymentMethod
      );
      res.json({ success: true, order });
    } catch (error) {
      next(error);
    }
  },

  // Process payment callback
  async processPayment(req, res, next) {
    try {
      const { orderNo, paymentId, status } = req.body;
      const result = await membershipService.processPayment(orderNo, paymentId, status);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Check premium access
  async checkPremiumAccess(req, res, next) {
    try {
      const hasAccess = await membershipService.hasPremiumAccess(req.userId);
      res.json({ success: true, hasAccess });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = membershipController;
