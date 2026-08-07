/**
 * src/server/controllers/languageBillingController.js
 * 自定义语言配额查询 + 消费记录
 */

const billingService = require('../services/languageBillingService');
const logger = require('../../utils/logger');

const languageBillingController = {

  /**
   * GET /api/language/custom/quota
   * 查询自定义语言剩余配额
   */
  async getQuota(req, res) {
    try {
      const userId = req.user.id;
      const quota = await billingService.getQuota(userId);
      const history = await billingService.getBillingHistory(userId, { limit: 5 });
      return res.json({
        success: true,
        data: {
          quota,
          recentUsage: history.records,
          systemLanguages: billingService.SYSTEM_LANGUAGES,
        },
      });
    } catch (error) {
      logger.error('LanguageBillingController: getQuota error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/language/custom/history?page=1&limit=20
   * 查询消费明细
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const result = await billingService.getBillingHistory(userId, { page, limit });
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error('LanguageBillingController: getHistory error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/language/custom/check
   * 前端预检某个自定义语言 + 服务是否可以免费使用
   */
  async checkAvailability(req, res) {
    try {
      const userId = req.user.id;
      const { language, service } = req.query;

      if (!language || !service) {
        return res.status(400).json({ success: false, error: '缺少 language 和 service 参数' });
      }

      const isSystem = billingService.isSystemLanguage(language);
      const isFree = !billingService.isChargeableService(service);

      if (isSystem || isFree) {
        return res.json({ success: true, data: { available: true, free: true } });
      }

      const quota = await billingService.getQuota(userId);
      return res.json({
        success: true,
        data: {
          available: quota.remaining > 0,
          free: false,
          remaining: quota.remaining,
          total: quota.total,
        },
      });
    } catch (error) {
      logger.error('LanguageBillingController: checkAvailability error', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = languageBillingController;
