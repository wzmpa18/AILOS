// ============================================================
// src/server/controllers/adminLanguageController.js
// P2 任务二：双语言一致性校验 —— 管理端接口
// ============================================================
const svc = require('../../services/languageConsistencyService');
const logger = require('../../utils/logger');

const adminLanguageController = {
  /**
   * GET /api/admin/language-consistency
   * 查询参数：
   *   userId=<id>   单用户校验（不传则全量校验）
   *   dryRun=1      仅检测不修复/不告警（默认 0，即执行归一化修复 + 生成告警）
   */
  async getConsistency(req, res, next) {
    try {
      const { userId, dryRun } = req.query;
      const isDry = dryRun === '1' || dryRun === 'true';
      const operator = `admin:${req.userId}`;

      if (userId) {
        const r = await svc.checkUser(userId, { operator, dryRun: isDry });
        return res.json({
          success: true,
          mode: 'single',
          data: {
            userId,
            anomalyType: r.anomalyType,
            handleResult: r.handleResult,
            protectWindowFlag: r.protectWindowFlag,
            fields: r.fields,
            repairs: r.repairs,
            alertId: r.alertId,
            detail: r.detail,
          },
        });
      }

      const result = await svc.checkAll({ operator, dryRun: isDry });
      return res.json({ success: true, mode: 'full', data: result });
    } catch (error) {
      logger.error('[admin/language-consistency] 失败:', error.message);
      next(error);
    }
  },

  /**
   * GET /api/admin/language-consistency/alerts?status=P2_ALERT
   * 查询告警清单（默认 P2_ALERT 待处理）
   */
  async listAlerts(req, res, next) {
    try {
      const status = req.query.status || 'P2_ALERT';
      const alerts = await svc.listAlerts(status === 'all' ? undefined : status);
      return res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/admin/language-consistency/alerts/:id/resolve
   * body: { note }
   * 人工确认真值后标记告警为 RESOLVED（留痕操作人 + 时间）。
   */
  async resolveAlert(req, res, next) {
    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const updated = await svc.resolveAlert(id, req.userId, note);
      return res.json({ success: true, data: updated });
    } catch (error) {
      if (String(error.message).includes('不存在')) {
        return res.status(404).json({ success: false, error: '告警不存在' });
      }
      next(error);
    }
  },
};

module.exports = adminLanguageController;
