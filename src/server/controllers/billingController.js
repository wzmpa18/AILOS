/**
 * src/server/controllers/billingController.js
 * Stage11 子模块2 — 计费状态/套餐目录/购买/时长扣减 接口
 * 所有接口需登录；鉴权/扣减/日志全部后端管控（前端仅展示）
 */
const { getBillingService } = require('../../services/billingService');

const billing = getBillingService();

function fail(res, err) {
  const status = err.status || 500;
  const code = err.code || 'BILLING_ERROR';
  return res.status(status).json({ success: false, error: code, message: err.message });
}

// GET /api/billing/status  （亦作为 /api/translate/trial/status 别名）
async function getStatus(req, res) {
  try {
    const data = await billing.getStatus(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

// GET /api/billing/packages
async function getCatalog(req, res) {
  try {
    res.json({ success: true, data: billing.getCatalog() });
  } catch (err) {
    fail(res, err);
  }
}

// POST /api/billing/package/buy  （亦作为 /api/translate/package/buy 别名）
// body: { packageType }
async function buyPackage(req, res) {
  try {
    const { packageType } = req.body || {};
    if (!packageType) {
      return fail(res, Object.assign(new Error('缺少 packageType'), { status: 400, code: 'INVALID_PACKAGE' }));
    }
    const order = await billing.purchasePackage(req.userId, packageType);
    res.json({ success: true, data: order, message: '购买成功（演示支付，已标记为已支付）' });
  } catch (err) {
    fail(res, err);
  }
}

// POST /api/billing/consume  供实时扫描/对话翻译调用（亦可用于联调验证）
// body: { scene, seconds }
async function consume(req, res) {
  try {
    const { scene, seconds } = req.body || {};
    const result = await billing.consume(req.userId, { scene: scene || 'scan', seconds: Number(seconds) });
    res.json({ success: true, data: result });
  } catch (err) {
    fail(res, err);
  }
}

module.exports = { getStatus, getCatalog, buyPackage, consume };
