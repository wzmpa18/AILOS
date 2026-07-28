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
    const data = await billing.getStatus(req.userId, req.deviceRisk || null);
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
    const { scene, seconds, requestId } = req.body || {};
    // DEF-P3-01 幂等键：body.requestId 优先，其次 X-Request-Id 头
    const reqId = requestId || req.headers['x-request-id'] || null;
    const result = await billing.consume(req.userId, { scene: scene || 'scan', seconds: Number(seconds), deviceRisk: req.deviceRisk || null, requestId: reqId });
    res.json({ success: true, data: result });
  } catch (err) {
    fail(res, err);
  }
}

// ===== Phase2 Task1 — 支付沙箱链路 =====

// POST /api/billing/payment/create  body: { packageType }
async function createPayment(req, res) {
  try {
    const { packageType } = req.body || {};
    if (!packageType) {
      return fail(res, Object.assign(new Error('缺少 packageType'), { status: 400, code: 'INVALID_PACKAGE' }));
    }
    const order = await billing.createPaymentOrder(req.userId, packageType);
    res.json({ success: true, data: order, message: '订单已创建，请完成支付（沙箱）' });
  } catch (err) {
    fail(res, err);
  }
}

// POST /api/billing/payment/callback  body: { orderNo, paymentId?, result: 'success'|'failed' }
// 沙箱模拟网关回调；真实网关接入时在此之前加验签
async function paymentCallback(req, res) {
  try {
    const { orderNo, paymentId, result } = req.body || {};
    if (!orderNo) {
      return fail(res, Object.assign(new Error('缺少 orderNo'), { status: 400, code: 'INVALID_ORDER' }));
    }
    // 沙箱安全约束：仅允许本人订单回调（真实网关换成验签）
    await billing.getPaymentOrder(req.userId, orderNo);
    const data = await billing.confirmPaymentOrder(orderNo, { paymentId, result: result || 'success' });
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

// GET /api/billing/payment/status/:orderNo
async function paymentStatus(req, res) {
  try {
    const data = await billing.getPaymentOrder(req.userId, req.params.orderNo);
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

// ===== Phase2 Task4 — 会员时长权益映射 =====

// GET /api/billing/membership-benefit
async function membershipBenefit(req, res) {
  try {
    const data = await billing.getMembershipBenefit(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

// POST /api/billing/membership-benefit/claim
async function claimMembershipBenefit(req, res) {
  try {
    const data = await billing.claimMembershipGrant(req.userId);
    res.json({ success: true, data, message: '本月会员赠送时长已到账' });
  } catch (err) {
    fail(res, err);
  }
}

// ===== 第三优先级 Task5 — 管理员对账导出 =====

// GET /api/billing/admin/orders/export?granularity=day|month&date=YYYY-MM-DD|YYYY-MM&format=json|csv
// 须 authenticate + requireAdmin
async function adminExportOrders(req, res) {
  try {
    const { granularity, date, format } = req.query || {};
    const data = await billing.exportOrders({ granularity, date });
    if (format === 'csv') {
      const head = 'orderNo,userId,packageType,status,priceCny,minutesTotal,minutesUsed,expiresAt,createdAt';
      const lines = data.orders.map((o) =>
        [o.orderNo, o.userId, o.packageType, o.status, o.priceCny, o.minutesTotal, o.minutesUsed,
         o.expiresAt ? new Date(o.expiresAt).toISOString() : '',
         o.createdAt ? new Date(o.createdAt).toISOString() : ''].join(',')
      );
      const csv = '\uFEFF' + [head].concat(lines).join('\n')
        + `\n# summary,total=${data.summary.total},paidAmountCny=${data.summary.paidAmountCny},paidUnits=${data.summary.paidUnits}`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="orders_${data.granularity}_${data.date}.csv"`);
      return res.send(csv);
    }
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

// 第三阶段收尾 Item3(1)：GET /api/admin/orders/export
// 参数：startDate,endDate（YYYY-MM-DD，默认当日）；format=csv|json
// 须 authenticate + requireAdmin（普通用户 403 ADMIN_REQUIRED；未登录 401）
async function adminExportOrdersRange(req, res) {
  try {
    const { startDate, endDate, format } = req.query || {};
    const data = await billing.exportOrdersByRange({ startDate, endDate });
    if (format === 'csv') {
      const head = 'orderNo,userId,packageType,priceCny,status,createdAt,paidAt';
      const lines = data.orders.map((o) =>
        [o.orderNo, o.userId, o.packageType, o.priceCny, o.status,
          o.createdAt ? new Date(o.createdAt).toISOString() : '',
          o.paidAt ? new Date(o.paidAt).toISOString() : ''].join(','));
      const csv = '\uFEFF' + [head].concat(lines).join('\n')
        + `\n# summary,total=${data.summary.total},paidAmountCny=${data.summary.paidAmountCny},paidUnits=${data.summary.paidUnits}`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="admin_orders_${data.startDate}_${data.endDate}.csv"`);
      return res.send(csv);
    }
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
}

module.exports = {
  getStatus, getCatalog, buyPackage, consume,
  createPayment, paymentCallback, paymentStatus,
  membershipBenefit, claimMembershipBenefit,
  adminExportOrders,
  adminExportOrdersRange,
};
