/**
 * src/server/middleware/deviceRisk.js
 * 第三阶段 P1 — 设备指纹风控中间件（挂载于 authenticate 之后）
 * 仅评估并附加 req.deviceRisk，不直接拦截请求；
 * 试用扣减闸门在 billingService.consume 内部依据 trialAllowed 强制执行（服务端真值）。
 */
const { getDeviceRiskService } = require('../../services/deviceRiskService');

const attachDeviceRisk = async (req, _res, next) => {
  try {
    const uid = req.userId || (req.user && req.user.id);
    if (uid) {
      const svc = getDeviceRiskService();
      const fpHash = svc.normalizeFp(req.headers['x-device-fp']);
      const ipPrefix = svc.ipPrefixFrom(req);
      req.deviceRisk = await svc.evaluate(uid, fpHash, ipPrefix);
    }
  } catch (_err) {
    // fail-open：风控异常不阻断业务
    req.deviceRisk = { trialAllowed: true, reason: 'RISK_CHECK_ERROR' };
  }
  next();
};

module.exports = { attachDeviceRisk };
