// ============================================================
// src/server/controllers/reportsController.js
// 学习报表控制器 — Module 02 Step 5
// ============================================================
const ReportsService = require('../../services/reportsService');
const reportsService = new ReportsService();

const reportsController = {
  // GET /api/reports/summary
  async getSummary(req, res, next) {
    try {
      const summary = await reportsService.getSummary(req.userId);
      res.json({ success: true, data: summary });
    } catch (error) { next(error); }
  },

  // GET /api/reports/xp-history
  async getXpHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
      const result = await reportsService.getXpHistory(req.userId, page, pageSize);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  },
};

module.exports = reportsController;