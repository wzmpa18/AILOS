// ============================================================
// src/server/controllers/reportController.js
// 学习报告控制器
// ============================================================
const reportService = require('../../services/reportService');

const reportController = {
  // GET /api/reports/daily
  async getDailyReport(req, res, next) {
    try {
      const report = await reportService.getDailyReport(req.userId);
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  },

  // GET /api/reports/weekly
  async getWeeklyReport(req, res, next) {
    try {
      const report = await reportService.getWeeklyReport(req.userId);
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  },

  // GET /api/reports/overview
  async getOverview(req, res, next) {
    try {
      const overview = await reportService.getOverview(req.userId);
      res.json({ success: true, data: overview });
    } catch (error) { next(error); }
  },
};

module.exports = reportController;