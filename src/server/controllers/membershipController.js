// ============================================================
// src/server/controllers/membershipController.js
// 会员控制器
// ============================================================
const membershipService = require('../../services/membershipService');

const membershipController = {
  // GET /api/membership/plans
  async getPlans(req, res, next) {
    try {
      const plans = membershipService.getPlans();
      res.json({ success: true, data: plans });
    } catch (error) { next(error); }
  },

  // GET /api/membership
  async getMembership(req, res, next) {
    try {
      const membership = await membershipService.getUserMembership(req.userId);
      res.json({ success: true, data: membership });
    } catch (error) { next(error); }
  },

  // POST /api/membership/upgrade
  async upgrade(req, res, next) {
    try {
      const { level, durationMonths } = req.body;
      if (!level) {
        return res.status(400).json({ success: false, error: 'level is required' });
      }
      const result = await membershipService.upgradeMembership(
        req.userId, level, durationMonths || 1
      );
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // GET /api/membership/transactions
  async getTransactions(req, res, next) {
    try {
      const transactions = await membershipService.getTransactions(req.userId);
      res.json({ success: true, data: transactions });
    } catch (error) { next(error); }
  },
};

module.exports = membershipController;