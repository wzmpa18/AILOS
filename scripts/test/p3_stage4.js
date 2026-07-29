/**
 * P3 阶段四 管理后台权限测试（T-15 ~ T-17）
 * T-15: 普通用户越权 /api/admin/* → 403
 * T-16: 未登录访问 admin.html → 前端守卫生效（后端不直接处理 HTML，测 /api/admin/me 无 token→401）
 * T-17: 敏感操作绕过前端弹窗直接调 API，不传 opPassword → 403
 */
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const { hashPassword } = require('/www/xuewaiyu-backend/src/utils/crypto');

const BASE = 'http://localhost:3000/api';
const PWD = 'P3test2026!';
const TS = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const R = { meta: { base: BASE, at: new Date().toISOString(), ts: TS }, cases: {} };

async function newUser(label) {
  const email = 'test_p3_s4_' + label + '_' + TS + '@xuewaiyu.local';
  const hash = await hashPassword(PWD);
  const u = await prisma.user.create({
    data: { uniqueId: 'p3s4_' + label + '_' + TS, email, passwordHash: hash, nickname: 'P3S4-' + label, isActive: true, isVerified: true },
  });
  return { u, email };
}

async function login(email) {
  const r = await fetch(BASE + '/auth/password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: email, password: PWD }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function adminLogin() {
  // 用内联 fetch 而非 login() 辅助，排除辅助函数潜在问题
  const body = JSON.stringify({ account: '13480010005', password: 'Test123456' });
  console.error('[adminLogin] body=', body);
  const r = await fetch(BASE + '/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  console.error('[adminLogin] status=', r.status, 'success=', j.success, 'error=', j.error);
  if (r.status !== 200) throw new Error('admin login fail: ' + r.status + ' ' + JSON.stringify(j));
  return j.tokens.accessToken;
}

async function api(token, path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function main() {
  const admToken = await adminLogin();

  // ===== T-15: 普通用户越权拦截 =====
  const { u: u15, email: t15e } = await newUser('t15');
  const login15 = await login(t15e);
  const userToken = login15.body?.tokens?.accessToken;
  const adminEndpoints = [
    { method: 'GET', path: '/admin/orders' },
    { method: 'GET', path: '/admin/users' },
    { method: 'GET', path: '/admin/users/billing' },
    { method: 'GET', path: '/admin/operation-logs' },
    { method: 'POST', path: '/admin/users/status', body: { userId: u15.id, disabled: true, opPassword: 'Admin@2026' } },
    { method: 'POST', path: '/admin/users/reset-password', body: { userId: u15.id, opPassword: 'Admin@2026', newPassword: 'x' } },
  ];
  const t15Results = [];
  for (const ep of adminEndpoints) {
    const r = await api(userToken, ep.path, ep.method, ep.body || null);
    t15Results.push({ path: ep.path, method: ep.method, status: r.status, error: r.body?.error || '' });
  }
  R.cases['T-15'] = {
    expect: '普通用户调用所有 /api/admin/* 接口均返回 403',
    results: t15Results,
    all403: t15Results.every(r => r.status === 403),
    pass: t15Results.every(r => r.status === 403),
  };

  // ===== T-16: 未登录前端守卫 =====
  // 无 token 调 /api/admin/me → 401（后端守卫）
  const noAuthMe = await api(null, '/admin/me');
  // 无 token 调 /api/admin/orders → 401
  const noAuthOrders = await api(null, '/admin/orders');
  R.cases['T-16'] = {
    expect: '未登录访问管理接口返回 401，不暴露后台结构',
    meWithoutToken: noAuthMe.status, meWithoutTokenError: noAuthMe.body?.error || '',
    ordersWithoutToken: noAuthOrders.status, ordersWithoutTokenError: noAuthOrders.body?.error || '',
    pass: noAuthMe.status === 401 && noAuthOrders.status === 401,
  };

  // ===== T-17: 敏感操作二次校验（绕过前端弹窗，不传 opPassword）=====
  const { u: u17 } = await newUser('t17');
  // 创建按量订单用于退款测试
  await prisma.translationPackageOrder.create({
    data: {
      userId: u17.id, orderNo: 'P3-T17-DUMMY-' + TS, packageType: 'pay_1h',
      priceCny: 19, minutesTotal: 3600, minutesUsed: 0, status: 'paid',
      expiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });
  const orders = await prisma.translationPackageOrder.findMany({ where: { userId: u17.id }, orderBy: { createdAt: 'desc' }, take: 1 });
  const orderId = orders[0]?.id;
  // 1. adjustUserTime 不传 opPassword
  const adjNoOp = await api(admToken, '/admin/users/billing/adjust', 'POST', {
    userId: u17.id, amount: 300, reason: 'P3 T-17 adjust test',
  });
  // 2. setUserStatus 不传 opPassword
  const statusNoOp = await api(admToken, '/admin/users/status', 'POST', {
    userId: u17.id, disabled: true, reason: 'P3 T-17 disable test',
  });
  // 3. refund 不传 opPassword（如果 orderId 存在）
  let refundNoOp = { status: 'N/A' };
  if (orderId) {
    refundNoOp = await api(admToken, '/admin/orders/' + orderId + '/refund', 'POST', {
      reason: 'P3 T-17 refund test',
    });
  }
  R.cases['T-17'] = {
    expect: 'adjust/disable/refund 不传 opPassword 均返回 403（二次校验生效，前端弹窗可绕过）',
    adjustNoOp: adjNoOp.status, adjustError: adjNoOp.body?.error || '',
    statusNoOp: statusNoOp.status, statusError: statusNoOp.body?.error || '',
    refundNoOp: refundNoOp.status, refundError: refundNoOp.body?.error || '',
    pass: adjNoOp.status === 403 && statusNoOp.status === 403 && (refundNoOp.status === 403 || refundNoOp.status === 'N/A'),
  };

  // ===== 输出 =====
  const passCount = Object.values(R.cases).filter(c => c.pass).length;
  R.meta.summary = { total: 3, pass: passCount, fail: 3 - passCount, allPass: passCount === 3 };
  console.log(JSON.stringify(R, null, 1));
  process.exit(R.meta.summary.allPass ? 0 : 1);
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
