// ============================================================
// src/server/controllers/inviteController.js
// 邀请返利控制器
// ============================================================
const inviteService = require('../../services/inviteService');

const inviteController = {
  // GET /api/invite/config
  async getConfig(req, res, next) {
    try {
      const config = inviteService.getConfig();
      res.json({ success: true, data: config });
    } catch (error) { next(error); }
  },

  // GET /api/invite/code
  async getInviteCode(req, res, next) {
    try {
      const code = await inviteService.getInviteCode(req.userId);
      res.json({ success: true, data: code });
    } catch (error) { next(error); }
  },

  // POST /api/invite/apply
  async applyInviteCode(req, res, next) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: 'code is required' });
      }
      const result = await inviteService.applyInviteCode(code, req.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // GET /api/invite/stats
  async getInviteStats(req, res, next) {
    try {
      const stats = await inviteService.getInviteStats(req.userId);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  },

  // GET /api/invite/commissions
  async getCommissions(req, res, next) {
    try {
      const commissions = await inviteService.getCommissions(req.userId);
      res.json({ success: true, data: commissions });
    } catch (error) { next(error); }
  },
};

module.exports = inviteController;