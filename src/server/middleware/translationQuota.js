// ============================================================
// src/server/middleware/translationQuota.js
// 第三优先级 Task2 — 统一翻译时长计费闸门中间件
//
// 用法（各翻译场景直接复用，后续子模块无需重写计费逻辑）：
//   const { requireTranslationQuota } = require('../middleware/translationQuota');
//   router.post('/photo',  authenticate, requireTranslationQuota('photo'),  ctrl.photo);          // 拍照翻译
//   router.post('/stream', authenticate, requireTranslationQuota('conversation'), ctrl.stream);   // 实时对话（预留）
//   router.post('/ar',     authenticate, requireTranslationQuota('scan'),   ctrl.ar);             // AR 扫描（预留）
//
// 行为：
//   - 预检模式（默认）：仅校验余额>0，可服务则放行并挂载 req.billingGate.consume(seconds)
//     供业务在「产出成功后」按实际用量原子扣减（OCR/识别失败不扣费）；
//   - 扣减失败（402）直接拒绝服务，不返回业务结果（否决项 7/8）。
// ============================================================
const { getBillingService } = require('../../services/billingService');

function requireTranslationQuota(scene = 'scan') {
  return async (req, res, next) => {
    try {
      const billing = getBillingService();
      const status = await billing.getStatus(req.userId);
      const available =
        (status.trial ? status.trial.remainingSec : 0) +
        (status.subscription ? status.subscription.remainingSec : 0) +
        (status.paidPackage ? status.paidPackage.remainingSec : 0);
      if (available <= 0) {
        return res.status(402).json({
          success: false,
          error: 'TRANSLATION_TIME_EXHAUSTED',
          message: '翻译时长不足，请购买套餐后继续使用',
          purchaseUrl: '/xuewaiyu/billing.html',
        });
      }
      // 业务在产出成功后调用：原子扣减（并发行锁），失败抛 402 由业务拒绝返回结果
      req.billingGate = {
        scene,
        availableSec: available,
        consume: (seconds) => billing.requireTranslationQuota(req.userId, { scene, seconds }),
      };
      next();
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ success: false, error: err.code || 'BILLING_GATE_ERROR', message: err.message });
    }
  };
}

module.exports = { requireTranslationQuota };
