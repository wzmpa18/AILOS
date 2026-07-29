/**
 * P3 阶段三 用户账号测试（T-11 ~ T-14）—— 幂等版（时间戳+Math.random 唯一邮箱）
 */
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const { hashPassword } = require('/www/xuewaiyu-backend/src/utils/crypto');

const BASE = 'http://localhost:3000/api';
const PWD = 'P3test2026!';
const OP_PWD = 'Admin@2026';
const ADMIN_EMAIL = '13480010005';
const ADMIN_PASS = 'Test123456';
const TS = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const R = { meta: { base: BASE, at: new Date().toISOString(), ts: TS }, cases: {} };

async function newUser(label, pwd = PWD) {
  const email = 'test_p3_s3_' + label + '_' + TS + '@xuewaiyu.local';
  const hash = await hashPassword(pwd);
  const u = await prisma.user.create({
    data: {
      uniqueId: 'p3s3_' + label + '_' + TS,
      email, passwordHash: hash, nickname: 'P3S3-' + label,
      isActive: true, isVerified: true,
    },
  });
  await prisma.translationBillingBalance.create({
    data: { userId: u.id, trialTotalSec: 300, trialUsedSec: 0, subUsedSec: 0, adminTimeSec: 0 },
  });
  return { u, email };
}

async function login(email, pwd = PWD) {
  const r = await fetch(BASE + '/auth/password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: email, password: pwd }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function api(token, path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function adminLogin() {
  const r = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (r.status !== 200) throw new Error('admin login fail');
  return r.body.tokens.accessToken;
}

async function main() {
  // ===== T-11: 并发登录无冲突（每次全新账号）=====
  const { email: t11e } = await newUser('t11');
  const logins = await Promise.all(Array.from({ length: 8 }, () =>
    fetch(BASE + '/auth/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: t11e, password: PWD }),
    }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
  ));
  const tokens = logins.filter(l => l.status === 200).map(l => l.body?.tokens?.accessToken);
  const uniqueTokens = new Set(tokens);
  {
    const ok = logins.filter(l => l.status === 200).length;
    R.cases['T-11'] = {
      expect: '8 并发登录全部成功，8 互异 token，无 500',
      okCount: ok, totalCount: 8, uniqueTokens: uniqueTokens.size,
      statuses: logins.map(l => l.status),
      pass: ok === 8 && uniqueTokens.size === 8 && !logins.some(l => l.status === 500),
    };
  }

  // ===== T-12: 禁用账号登录拦截 =====
  const admToken = await adminLogin();
  const { u: u12, email: t12e } = await newUser('t12');
  const preLogin = await login(t12e);
  const disableRes = await api(admToken, '/admin/users/status', 'POST', {
    userId: u12.id, disabled: true, opPassword: OP_PWD, reason: 'P3 T-12',
  });
  const postLogin = await login(t12e);
  await api(admToken, '/admin/users/status', 'POST', {
    userId: u12.id, disabled: false, opPassword: OP_PWD, reason: 'P3 T-12 cleanup',
  });
  R.cases['T-12'] = {
    expect: '禁用后登录 401 "账号已被禁用"',
    preLoginOK: preLogin.status === 200,
    disableChanged: disableRes.body?.changed === true,
    postLoginStatus: postLogin.status,
    postLoginError: postLogin.body?.error || '',
    pass: preLogin.status === 200 && disableRes.body?.changed === true && postLogin.status === 401,
  };

  // ===== T-13: 密码重置失效验证 =====
  const { u: u13, email: t13e } = await newUser('t13');
  const newPwd = 'NewP3test2026!';
  const preOld = await login(t13e, PWD);
  await api(admToken, '/admin/users/reset-password', 'POST', {
    userId: u13.id, opPassword: OP_PWD, newPassword: newPwd,
  });
  const postOld = await login(t13e, PWD);
  const postNew = await login(t13e, newPwd);
  await api(admToken, '/admin/users/reset-password', 'POST', {
    userId: u13.id, opPassword: OP_PWD, newPassword: PWD,
  });
  R.cases['T-13'] = {
    expect: '重置后旧密码 401，新密码 200',
    preOldOK: preOld.status === 200,
    postOldStatus: postOld.status, postNewStatus: postNew.status,
    pass: preOld.status === 200 && postOld.status === 401 && postNew.status === 200,
  };

  // ===== T-14: 过期 Token 鉴权拦截 =====
  const jwt = require('/www/xuewaiyu-backend/node_modules/jsonwebtoken');
  const expiredToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000000', uniqueId: 'p3_t14_expired' },
    'yandao_jwt_secret_key_2024_production',
    { expiresIn: '-1s' }
  );
  const protectedCall = await api(expiredToken, '/billing/status');
  R.cases['T-14'] = {
    expect: '过期 token 访问受保护接口返回 401',
    protectedStatus: protectedCall.status,
    protectedError: protectedCall.body?.error || '',
    pass: protectedCall.status === 401,
  };

  // ===== 输出 =====
  const passCount = Object.values(R.cases).filter(c => c.pass).length;
  R.meta.summary = { total: 4, pass: passCount, fail: 4 - passCount, allPass: passCount === 4 };
  console.log(JSON.stringify(R, null, 1));
  process.exit(R.meta.summary.allPass ? 0 : 1);
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
