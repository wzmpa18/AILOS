/**
 * P3 阶段二 T-08 回归测试：无指纹请求 IP 前缀日频控（受控 XFF 前缀）
 * 根因：服务器本机回环 IPv6 ::1 → 前缀非 127.0.0.0/24 → clean 落空 → 残存计数器
 * 修复：统一用 X-Forwarded-For: 192.168.100.x 控制前缀精确匹配
 */
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const redis = require('/www/xuewaiyu-backend/src/config/redis');
const { hashPassword } = require('/www/xuewaiyu-backend/src/utils/crypto');

const BASE = 'http://localhost:3000/api';
const PWD = 'P3test2026!';
const PREFIX = '192.168.100.0/24';
const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');

async function upsertUser(email, trialTotalSec = 30) {
  const hash = await hashPassword(PWD);
  let u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    u = await prisma.user.create({
      data: {
        uniqueId: 'p3s2t08fix_' + email.split('@')[0] + '_' + Date.now().toString(36),
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

async function main() {
  // 先做账户初始化（让 Redis 连接有足够时间建立，enableOfflineQueue:false 不能提前发命令）
  const accounts = [];
  for (let i = 1; i <= 6; i++) {
    const email = 'test_p3_t08fix_' + i + '@xuewaiyu.local';
    await upsertUser(email, 30);
    const u = await prisma.user.findUnique({ where: { email } });
    const r = await fetch(BASE + '/auth/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: email, password: PWD }),
    });
    const j = await r.json();
    if (r.status !== 200) throw new Error('login fail ' + email);
    accounts.push({ id: u.id, token: j.tokens.accessToken });
  }

  // Redis 连接此时已就绪，清理受控前缀计数器
  console.error('[cleanup] deleting ' + PREFIX + ' keys for ' + day);
  await redis.del('dfp:ipq:' + PREFIX + ':' + day);
  const markKeys = await redis.keys('dfp:ipm:' + PREFIX + ':*:' + day);
  for (const k of markKeys) await redis.del(k);
  console.error('[cleanup] done, ipq=' + (await redis.get('dfp:ipq:' + PREFIX + ':' + day) || 'nil') + ', markKeys=' + markKeys.length);

  const results = [];
  for (let i = 0; i < 6; i++) {
    const xff = '192.168.100.' + (i + 1);
    const r = await fetch(BASE + '/billing/consume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accounts[i].token,
        'X-Forwarded-For': xff,
        // 无 X-Device-Fp：模拟无指纹请求
      },
      body: JSON.stringify({ scene: 'scan', seconds: 10 }),
    });
    const body = await r.json().catch(() => ({}));
    results.push({ i: i + 1, xff, status: r.status, source: body?.data?.source, error: body?.error || '' });
  }

  const dbChecks = [];
  for (let i = 0; i < 6; i++) {
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: accounts[i].id } });
    dbChecks.push({ i: i + 1, trialUsed: b.trialUsedSec });
  }

  const ipqKey = 'dfp:ipq:' + PREFIX + ':' + day;
  const ipCounter = Number(await redis.get(ipqKey)) || 0;

  const pass = results.slice(0, 5).every(r => r.status === 200 && r.source === 'trial') &&
              results[5].status === 402 &&
              dbChecks.slice(0, 5).every(d => d.trialUsed >= 10) &&
              dbChecks[5].trialUsed === 0 &&
              ipCounter >= 5;

  console.log(JSON.stringify({ pass, results, dbChecks, ipCounter }, null, 1));
  process.exit(pass ? 0 : 1);
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
