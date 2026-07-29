/**
 * P3 阶段一 计费一致性测试（T-01 ~ T-06 + 单位一致性检查）
 * 运行位置：服务器 /tmp（need .env.production 注入）
 * HTTP 基准：正式域名 https://yandao.vip/api（生产环境唯一原则）
 * DB 核验：prisma 直连
 */
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const { hashPassword } = require('/www/xuewaiyu-backend/src/utils/crypto');

const BASE = 'https://yandao.vip/api';
const PWD = 'P3test2026!';
const R = { meta: { base: BASE, at: new Date().toISOString() }, cases: {} };

const ACC = {
  t01: 'test_p3_t01@xuewaiyu.local',
  t02: 'test_p3_t02@xuewaiyu.local',
  t03: 'test_p3_t03@xuewaiyu.local',
  t05: 'test_p3_t05@xuewaiyu.local',
  t06: 'test_p3_t06@xuewaiyu.local',
  unit: 'test_p3_unit@xuewaiyu.local',
};

async function upsertUser(email, balancePatch) {
  const hash = await hashPassword(PWD);
  let u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    u = await prisma.user.create({
      data: {
        uniqueId: 'p3_' + email.split('@')[0] + '_' + Date.now().toString(36),
        email, passwordHash: hash, nickname: 'P3测试-' + email.split('@')[0],
        isActive: true, isVerified: true,
      },
    });
  } else {
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: hash, disabled: false } });
  }
  // 清理既有计费痕迹，重置为指定状态
  await prisma.translationBillingLog.deleteMany({ where: { userId: u.id } });
  await prisma.translationPackageOrder.deleteMany({ where: { userId: u.id } });
  await prisma.translationBillingBalance.deleteMany({ where: { userId: u.id } });
  await prisma.translationBillingBalance.create({
    data: Object.assign({ userId: u.id, trialTotalSec: 300, trialUsedSec: 0, subUsedSec: 0, adminTimeSec: 0 }, balancePatch),
  });
  return u;
}

async function login(email) {
  const r = await fetch(BASE + '/auth/password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: email, password: PWD }),
  });
  const j = await r.json().catch(() => ({}));
  if (r.status !== 200) throw new Error('login fail ' + email + ' ' + r.status + ' ' + JSON.stringify(j));
  return j.tokens.accessToken;
}

async function consume(token, fp, seconds, extraHeaders = {}) {
  const r = await fetch(BASE + '/billing/consume', {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, 'X-Device-Fp': fp }, extraHeaders),
    body: JSON.stringify({ scene: 'scan', seconds }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function status(token, fp) {
  const r = await fetch(BASE + '/billing/status', { headers: { Authorization: 'Bearer ' + token, 'X-Device-Fp': fp } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function main() {
  // ===== 预置 =====
  const u01 = await upsertUser(ACC.t01, {});                                   // 试用满 300s
  const u02 = await upsertUser(ACC.t02, { trialUsedSec: 300, adminTimeSec: 90 }); // 幂等测试池 90s
  const u03 = await upsertUser(ACC.t03, { trialUsedSec: 300 });                // 回滚：仅按量包 60 单位
  const u05 = await upsertUser(ACC.t05, { trialUsedSec: 300, adminTimeSec: 30 }); // 余额不足拦截
  const u06 = await upsertUser(ACC.t06, { trialUsedSec: 300 });                // 试用耗尽拦截
  const uUnit = await upsertUser(ACC.unit, { trialUsedSec: 300 });             // 单位一致性
  const o03 = await prisma.translationPackageOrder.create({
    data: { userId: u03.id, orderNo: 'P3T03' + Date.now(), packageType: 'pay_1h', minutesTotal: 60, minutesUsed: 0, priceCny: 19, expiresAt: new Date(Date.now() + 365 * 86400000), status: 'paid' },
  });

  const tk = {};
  for (const k of Object.keys(ACC)) tk[k] = await login(ACC[k]);

  // ===== T-01 并发扣减一致性：5 并发 × 60s，试用池恰好 300s =====
  {
    const fp = 'p3fp_t01_device_0001';
    const rs = await Promise.all([1, 2, 3, 4, 5].map(() => consume(tk.t01, fp, 60)));
    const okCount = rs.filter((r) => r.status === 200).length;
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u01.id } });
    const logs = await prisma.translationBillingLog.findMany({ where: { userId: u01.id } });
    const totalLogged = logs.reduce((s, l) => s + l.consumedSec, 0);
    const st = await status(tk.t01, fp);
    R.cases['T-01'] = {
      expect: '5 请求全部成功，总扣 300s，无超扣/漏扣/重复扣，DB 与接口一致',
      httpOk: okCount, statuses: rs.map((r) => r.status),
      dbTrialUsedSec: b.trialUsedSec, dbLogCount: logs.length, dbLogTotalSec: totalLogged,
      apiTrialRemaining: st.body?.data?.trial?.remainingSec,
      pass: okCount === 5 && b.trialUsedSec === 300 && logs.length === 5 && totalLogged === 300 && st.body?.data?.trial?.remainingSec === 0,
    };
  }

  // ===== T-02 幂等防护：相同 X-Request-Id 3 连发 30s（池 90s）=====
  {
    const fp = 'p3fp_t02_device_0002';
    const reqId = 'p3-idem-' + Date.now();
    const r1 = await consume(tk.t02, fp, 30, { 'X-Request-Id': reqId });
    const r2 = await consume(tk.t02, fp, 30, { 'X-Request-Id': reqId });
    const r3 = await consume(tk.t02, fp, 30, { 'X-Request-Id': reqId });
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u02.id } });
    const deducted = 90 - b.adminTimeSec;
    R.cases['T-02'] = {
      expect: '仅首次扣减生效（-30s），后续返回幂等标识，余额仅变化一次',
      statuses: [r1.status, r2.status, r3.status],
      idempotentFlags: [r1.body?.data?.idempotent, r2.body?.data?.idempotent, r3.body?.data?.idempotent],
      dbAdminTimeSecAfter: b.adminTimeSec, actualDeducted: deducted,
      pass: deducted === 30 && r2.body?.data?.idempotent === true && r3.body?.data?.idempotent === true,
    };
  }

  // ===== T-03 事务回滚：请求 120s > 按量包 60 单位；402 前按量包已被 update，须回滚 =====
  {
    const fp = 'p3fp_t03_device_0003';
    const r = await consume(tk.t03, fp, 120);
    const o = await prisma.translationPackageOrder.findUnique({ where: { id: o03.id } });
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u03.id } });
    const logs = await prisma.translationBillingLog.count({ where: { userId: u03.id } });
    R.cases['T-03'] = {
      expect: '402 + 事务完整回滚：按量包 minutesUsed 仍为 0，无部分扣减，无账单日志',
      status: r.status, code: r.body?.code || r.body?.error,
      orderMinutesUsedAfter: o.minutesUsed, trialUsedAfter: b.trialUsedSec, logCount: logs,
      pass: r.status === 402 && o.minutesUsed === 0 && logs === 0,
    };
  }

  // ===== T-04 退款时长回退：管理端退款端点 =====
  {
    // 管理员登录
    const ar = await fetch(BASE + '/auth/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: '13480010005', password: 'Test123456' }),
    });
    const aj = await ar.json().catch(() => ({}));
    const atk = aj.tokens && aj.tokens.accessToken;
    const rr = await fetch(BASE + '/admin/orders/' + o03.id + '/refund', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + atk },
      body: JSON.stringify({ opPassword: 'Admin@2026', reason: 'P3-T04 退款回退测试' }),
    });
    const rj = await rr.json().catch(() => ({}));
    R.cases['T-04'] = {
      expect: '退款端点存在：订单转 refunded、时长精准回退、审计留痕',
      adminLogin: ar.status, refundStatus: rr.status, refundBody: rj,
      pass: rr.status === 200,
    };
  }

  // ===== T-05 余额不足拦截：请求 60s > 池 30s → 402 且余额不变 =====
  {
    const fp = 'p3fp_t05_device_0005';
    const r = await consume(tk.t05, fp, 60);
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u05.id } });
    R.cases['T-05'] = {
      expect: '402 标准提示；余额保持 30s 不变、不为负',
      status: r.status, code: r.body?.code, error: r.body?.error,
      dbAdminTimeSecAfter: b.adminTimeSec,
      pass: r.status === 402 && b.adminTimeSec === 30,
    };
  }

  // ===== T-06 试用耗尽拦截：trial 300/300 → 402 引导购买，不动其他池 =====
  {
    const fp = 'p3fp_t06_device_0006';
    const r = await consume(tk.t06, fp, 10);
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u06.id } });
    R.cases['T-06'] = {
      expect: '402 + 引导购买提示；无静默扣减其他时长池',
      status: r.status, code: r.body?.code, error: r.body?.error,
      trialUsed: b.trialUsedSec, adminTimeSec: b.adminTimeSec,
      pass: r.status === 402 && b.trialUsedSec === 300 && b.adminTimeSec === 0,
    };
  }

  // ===== UNIT-CHECK 购买 1 小时包后余额单位一致性（静态疑点动态验证）=====
  {
    const fp = 'p3fp_unit_device_0009';
    const br = await fetch(BASE + '/billing/package/buy', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk.unit, 'X-Device-Fp': fp },
      body: JSON.stringify({ packageType: 'pay_1h' }),
    });
    const bj = await br.json().catch(() => ({}));
    const st = await status(tk.unit, fp);
    const remain = st.body?.data?.paidPackage?.remainingSec;
    // 再消费 61s：若单位正确应成功（3600s 池）；若错配（60 单位）将 402
    const cr = await consume(tk.unit, fp, 61);
    R.cases['UNIT-CHECK'] = {
      expect: '购买 pay_1h(60分钟) 后 remainingSec 应为 3600，且可消费 61s',
      buyStatus: br.status, orderNo: bj?.data?.orderNo,
      apiPaidRemainingSec: remain, consume61Status: cr.status,
      pass: remain === 3600 && cr.status === 200,
    };
  }

  // 汇总
  R.summary = Object.fromEntries(Object.entries(R.cases).map(([k, v]) => [k, v.pass ? 'PASS' : 'FAIL']));
  console.log(JSON.stringify(R, null, 2));
  process.exit(0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
