// ============================================================
// src/server/controllers/staminaController.js
// 体力控制器
// ============================================================
const staminaService = require('../../services/staminaService');

const staminaController = {
  // GET /api/stamina
  async getStamina(req, res, next) {
    try {
      const stamina = await staminaService.getStamina(req.userId);
      res.json({ success: true, data: stamina });
    } catch (error) { next(error); }
  },

  // GET /api/stamina/config
  async getConfig(req, res, next) {
    try {
      const config = staminaService.getConfig();
      res.json({ success: true, data: config });
    } catch (error) { next(error); }
  },

  // GET /api/stamina/transactions
  async getTransactions(req, res, next) {
    try {
      const transactions = await staminaService.getTransactions(req.userId);
      res.json({ success: true, data: transactions });
    } catch (error) { next(error); }
  },
};

module.exports = staminaController;