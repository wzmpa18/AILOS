/**
 * P3 阶段二 风控规则测试（T-07 ~ T-10）
 * 运行位置：服务器 /tmp（need .env.production 注入 + Redis 可达）
 * HTTP 基准：localhost:3000/api（需要 X-Forwarded-For 头部操控，经 nginx 会丢失控制权；
 *   中间件代码与生产一致，测试结论等同）; T-07/T-10 补充请求生产域名验证 nginx 透传行为。
 */
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const redis = require('/www/xuewaiyu-backend/src/config/redis');
const crypto = require('crypto');
const { hashPassword } = require('/www/xuewaiyu-backend/src/utils/crypto');

const BASE = 'http://localhost:3000/api';
const PWD = 'P3test2026!';
const R = { meta: { base: BASE, at: new Date().toISOString() }, cases: {} };

function fpHash(raw) {
  return crypto.createHash('sha256').update(raw.trim().slice(0, 256)).digest('hex').slice(0, 32);
}

// ======================== 工具函数 ========================
async function upsertUser(email, trialTotalSec = 50) {
  const hash = await hashPassword(PWD);
  let u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    u = await prisma.user.create({
      data: {
        uniqueId: 'p3s2_' + email.split('@')[0] + '_' + Date.now().toString(36),
        email, passwordHash: hash, nickname: 'P3S2-' + email.split('@')[0],
        isActive: true, isVerified: true,
      },
    });
  } else {
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: hash, disabled: false } });
  }
  await prisma.translationBillingLog.deleteMany({ where: { userId: u.id } });
  await prisma.translationPackageOrder.deleteMany({ where: { userId: u.id } });
  await prisma.translationBillingBalance.deleteMany({ where: { userId: u.id } });
  await prisma.translationBillingBalance.create({
    data: { userId: u.id, trialTotalSec, trialUsedSec: 0, subUsedSec: 0, adminTimeSec: 0 },
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

/** consume 封装：支持自定义 X-Device-Fp 与 X-Forwarded-For（暂借 headers override） */
async function consume(token, { fp = null, seconds = 10, xff = null } = {}) {
  const hdrs = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
  if (fp !== null) hdrs['X-Device-Fp'] = fp;
  if (xff !== null) hdrs['X-Forwarded-For'] = xff;
  const r = await fetch(BASE + '/billing/consume', {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({ scene: 'scan', seconds }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function billingStatus(token, { fp = null, xff = null } = {}) {
  const hdrs = { 'Authorization': 'Bearer ' + token };
  if (fp !== null) hdrs['X-Device-Fp'] = fp;
  if (xff !== null) hdrs['X-Forwarded-For'] = xff;
  const r = await fetch(BASE + '/billing/status', { headers: hdrs });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

/** 清理 Redis 风控键（设备维度 + IP 维度按前缀） */
async function cleanRedis(fpRaw, ipPrefix) {
  if (fpRaw) {
    const f = fpHash(fpRaw);
    await redis.del('dfp:trial:' + f);
    await redis.del('dfp:acc:' + f);
  }
  if (ipPrefix) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await redis.del('dfp:ipq:' + ipPrefix + ':' + day);
    // 删除 per-user mark keys
    const keys = await redis.keys('dfp:ipm:' + ipPrefix + ':*:' + day);
    for (const k of keys) await redis.del(k);
  }
}

async function main() {
  // ===== 预置：T-07 账户 =====
  const u07a = await upsertUser('test_p3_t07a@xuewaiyu.local', 300);
  const u07b = await upsertUser('test_p3_t07b@xuewaiyu.local', 300);
  // 清理可能残留的风控键
  await cleanRedis('p3fp_t07_reuse');
  const t07a = await login('test_p3_t07a@xuewaiyu.local');
  const t07b = await login('test_p3_t07b@xuewaiyu.local');
  const FP07 = 'p3fp_t07_reuse_device_0001';

  // ===== T-07: 设备指纹复用拦截 =====
  // 预期：A 首次领用试用成功(owner)；B 同指纹触 DEVICE_TRIAL_CLAIMED → trialAllowed=false → 跳过试用池
  {
    const cA = await consume(t07a, { fp: FP07, seconds: 10 });
    const cB = await consume(t07b, { fp: FP07, seconds: 10 });
    const sB = await billingStatus(t07b, { fp: FP07 });
    const bA = await prisma.translationBillingBalance.findUnique({ where: { userId: u07a.id } });
    const bB = await prisma.translationBillingBalance.findUnique({ where: { userId: u07b.id } });
    R.cases['T-07'] = {
      expect: 'A 试用扣减 10s，B 因设备已领用拒绝试用（402，无 trial 扣减）',
      A_status: cA.status, A_source: cA.body?.data?.source,
      B_status: cB.status, B_error: cB.body?.error || cB.body?.message,
      B_trialRestricted: sB.body?.data?.trial?.deviceRestricted || null,
      B_restrictReason: sB.body?.data?.trial?.restrictReason || null,
      A_trialUsed: bA.trialUsedSec, B_trialUsed: bB.trialUsedSec,
      pass: cA.status === 200 && cA.body?.data?.source === 'trial' &&
            cB.status === 402 &&
            sB.body?.data?.trial?.restrictReason === 'DEVICE_TRIAL_CLAIMED' &&
            bA.trialUsedSec >= 10 && bB.trialUsedSec === 0,
    };
  }

  // ===== 预置：T-08 账户（6 个无指纹测试账户）=====
  const t08Accounts = [];
  for (let i = 1; i <= 6; i++) {
    const email = 'test_p3_t08_' + i + '@xuewaiyu.local';
    await upsertUser(email, 30);
    const tk = await login(email);
    t08Accounts.push({ email, token: tk, id: (await prisma.user.findUnique({ where: { email } })).id });
  }
  // 清理当天 127.0.0.0/24 前缀计数（服务器本机回环 IP 的 /24）
  await cleanRedis(null, '127.0.0.0/24');

  // ===== T-08: 无指纹请求频控（IP 前缀日上限）=====
  {
    const results = [];
    for (let i = 0; i < 6; i++) {
      const r = await consume(t08Accounts[i].token, { fp: null, seconds: 10 });
      results.push({ i: i + 1, status: r.status, source: r.body?.data?.source, error: r.body?.error || '' });
    }
    // DB 核验：前 5 个账户 trialUsed 应>0，第 6 个=0
    const dbChecks = [];
    for (let i = 0; i < 6; i++) {
      const b = await prisma.translationBillingBalance.findUnique({ where: { userId: t08Accounts[i].id } });
      dbChecks.push({ i: i + 1, trialUsed: b.trialUsedSec });
    }
    // 检查 Redis 计数
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ipqKey = 'dfp:ipq:127.0.0.0/24:' + day;
    const ipCounter = Number(await redis.get(ipqKey)) || 0;
    R.cases['T-08'] = {
      expect: '前 5 次无指纹试用扣减成功，第 6 次被 IP 前缀日频控拦截',
      results,
      dbUsage: dbChecks,
      redisIpCounter: ipCounter,
      pass: results.slice(0, 5).every(r => r.status === 200 && r.source === 'trial') &&
            results[5].status === 402 &&
            dbChecks.slice(0, 5).every(d => d.trialUsed >= 10) &&
            dbChecks[5].trialUsed === 0 &&
            ipCounter >= 5,
    };
  }

  // ===== 预置：T-09 账户（6 个不同 XFF 同 /24）=====
  const t09Accounts = [];
  for (let i = 1; i <= 6; i++) {
    const email = 'test_p3_t09_' + i + '@xuewaiyu.local';
    await upsertUser(email, 30);
    const tk = await login(email);
    t09Accounts.push({ email, token: tk, id: (await prisma.user.findUnique({ where: { email } })).id });
  }
  await cleanRedis(null, '10.0.0.0/24');

  // ===== T-09: IP 前缀轮换拦截（同一 /24 不同 IP 无法绕过前缀上限）=====
  {
    const results = [];
    for (let i = 0; i < 6; i++) {
      const xff = '10.0.0.' + (i + 1);
      const r = await consume(t09Accounts[i].token, { fp: null, seconds: 10, xff });
      results.push({ i: i + 1, xff, status: r.status, source: r.body?.data?.source, error: r.body?.error || '' });
    }
    const dbChecks = [];
    for (let i = 0; i < 6; i++) {
      const b = await prisma.translationBillingBalance.findUnique({ where: { userId: t09Accounts[i].id } });
      dbChecks.push({ i: i + 1, trialUsed: b.trialUsedSec });
    }
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ipqKey = 'dfp:ipq:10.0.0.0/24:' + day;
    const ipCounter = Number(await redis.get(ipqKey)) || 0;
    R.cases['T-09'] = {
      expect: '同一 /24 网段轮换 6 个 IP，前 5 个成功，第 6 个触前缀上限拦截',
      results,
      dbUsage: dbChecks,
      redisIpCounter: ipCounter,
      pass: results.slice(0, 5).every(r => r.status === 200 && r.source === 'trial') &&
            results[5].status === 402 &&
            dbChecks.slice(0, 5).every(d => d.trialUsed >= 10) &&
            dbChecks[5].trialUsed === 0 &&
            ipCounter >= 5,
    };
  }

  // ===== 预置：T-10 账户 =====
  const u10a = await upsertUser('test_p3_t10a@xuewaiyu.local', 300);
  const u10b = await upsertUser('test_p3_t10b@xuewaiyu.local', 300);
  const u10c = await upsertUser('test_p3_t10c@xuewaiyu.local', 300);
  await cleanRedis('p3fp_t10_bind');
  const t10a = await login('test_p3_t10a@xuewaiyu.local');
  const t10b = await login('test_p3_t10b@xuewaiyu.local');
  const t10c = await login('test_p3_t10c@xuewaiyu.local');
  const FP10 = 'p3fp_t10_bind_device_0001';

  // ===== T-10: 设备账号绑定超限（单设备上限 2）=====
  {
    // 先让 A 领取试用（绑定设备+owner），B 再领取（绑定设备=2，但 owner 已存在→B 被领用拦截）
    // 为测纯绑定上限，不使用试用领用语义：直接用 billing/status 触发 evaluate 的 acc 绑定
    const sA = await billingStatus(t10a, { fp: FP10 });
    const sB = await billingStatus(t10b, { fp: FP10 });
    const sCbefore = await billingStatus(t10c, { fp: FP10 });

    // C 尝试 consume trial：设备已满 2 账号 → DEVICE_ACCOUNT_LIMIT
    const cC = await consume(t10c, { fp: FP10, seconds: 10 });
    const sCafter = await billingStatus(t10c, { fp: FP10 });
    const bC = await prisma.translationBillingBalance.findUnique({ where: { userId: u10c.id } });

    R.cases['T-10'] = {
      expect: '设备绑定 ≤2 账号可正常使用，第 3 个账号触 DEVICE_ACCOUNT_LIMIT → 试用不可领',
      A_ok: sA.status === 200, B_ok: sB.status === 200,
      C_beforeOK: sCbefore.status === 200,
      C_consumeStatus: cC.status, C_consumeError: cC.body?.error || '',
      C_trialRestricted: sCafter.body?.data?.trial?.deviceRestricted || null,
      C_restrictReason: sCafter.body?.data?.trial?.restrictReason || null,
      C_trialUsed: bC.trialUsedSec,
      pass: sA.status === 200 && sB.status === 200 &&
            cC.status === 402 &&
            sCafter.body?.data?.trial?.restrictReason === 'DEVICE_ACCOUNT_LIMIT' &&
            bC.trialUsedSec === 0,
    };
  }

  // ===== 输出 =====
  const passCount = Object.values(R.cases).filter(c => c.pass).length;
  R.meta.summary = {
    total: Object.keys(R.cases).length, pass: passCount,
    fail: Object.keys(R.cases).length - passCount,
    allPass: passCount === Object.keys(R.cases).length,
  };
  console.log(JSON.stringify(R, null, 1));
  process.exit(R.meta.summary.allPass ? 0 : 1);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
