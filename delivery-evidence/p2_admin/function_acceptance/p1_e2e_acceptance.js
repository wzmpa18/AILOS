const BASE = 'http://localhost:3000/api';
const ADMIN = { account: '13480010005', password: 'Test123456' };
const NORMAL = { account: 'test_normal@xuewaiyu.local', password: 'Normal2026!' };
const OP = 'Admin@2026';
const log = (...a) => console.log(...a);

async function j(method, path, body, token) {
  const opt = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opt.headers['Authorization'] = 'Bearer ' + token;
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opt);
  let data = null; try { data = await r.json(); } catch (e) {}
  return { status: r.status, data };
}

(async () => {
  const R = {};
  // 1) 管理员登录
  let r = await j('POST', '/auth/password', ADMIN);
  R.adminLogin = { status: r.status, hasToken: !!(r.data && r.data.tokens && r.data.tokens.accessToken) };
  const tk = r.data && r.data.tokens && r.data.tokens.accessToken;

  // 2) 登录审计日志（证明 LoginLog 表已建 + 管理员审计写入生效）
  r = await j('GET', '/admin/login-logs', null, tk);
  R.loginLogs = {
    status: r.status,
    count: r.data && r.data.count,
    topAccount: r.data && r.data.data && r.data.data[0] && r.data.data[0].account,
  };

  // 3) 用户列表（证明 User.disabled 列存在）
  r = await j('GET', '/admin/users', null, tk);
  R.users = {
    status: r.status,
    count: r.data && r.data.count,
    hasDisabledField: !!(r.data && r.data.data && r.data.data[0] && ('disabled' in r.data.data[0])),
  };
  const nu = (r.data.data || []).find(u => u.email === NORMAL.account || u.uniqueId === NORMAL.account || u.phone === NORMAL.account);
  R.normalFound = !!nu;
  const nid = nu ? nu.id : null;

  // 4) 操作密码：错误应 403，正确(改回默认)应 200
  r = await j('POST', '/admin/security/op-password', { oldPassword: 'wrong', newPassword: 'Admin@2026' }, tk);
  R.opPwdWrong = { status: r.status };
  r = await j('POST', '/admin/security/op-password', { oldPassword: OP, newPassword: OP }, tk);
  R.opPwdOk = { status: r.status };

  if (nid) {
    // 5a) 禁用普通用户
    r = await j('POST', '/admin/users/status', { userId: nid, account: NORMAL.account, disabled: true, opPassword: OP, reason: 'P1验收测试' }, tk);
    R.disable = { status: r.status, changed: r.data && r.data.changed };
    // 5b) 禁用后登录应 401
    r = await j('POST', '/auth/password', NORMAL);
    R.normalLoginAfterDisable = { status: r.status };
    // 5c) 重新启用
    r = await j('POST', '/admin/users/status', { userId: nid, account: NORMAL.account, disabled: false, opPassword: OP, reason: 'P1验收恢复' }, tk);
    R.enable = { status: r.status, changed: r.data && r.data.changed };
    // 5d) 启用后登录应 200
    r = await j('POST', '/auth/password', NORMAL);
    R.normalLoginAfterEnable = { status: r.status };
    // 6) 重置密码（恢复原始密码）
    r = await j('POST', '/admin/users/reset-password', { userId: nid, account: NORMAL.account, opPassword: OP, newPassword: 'Normal2026!' }, tk);
    R.resetPwd = { status: r.status };
    // 6b) 用原密码登录应 200
    r = await j('POST', '/auth/password', NORMAL);
    R.normalLoginAfterReset = { status: r.status };
  } else {
    R.skipUserOps = 'normal test user not found';
  }

  console.log(JSON.stringify(R, null, 2));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
