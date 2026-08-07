/**
 * scripts/probe-prod.js
 * 生产环境页面/接口可达性探测（v1.1.0 验收证据）
 * 用法: node scripts/probe-prod.js [baseUrl]
 */
const https = require('https');
const http = require('http');

const BASE = process.argv[2] || 'https://yandao.vip';

const PAGES = [
  '/xuewaiyu/home',
  '/xuewaiyu/learn.html',
  '/xuewaiyu/chat.html',
  '/xuewaiyu/review.html',
  '/xuewaiyu/community-friends.html',
  '/xuewaiyu/ai-companion-builder.html',
  '/xuewaiyu/profile.html',
  '/xuewaiyu/game.html',
  '/xuewaiyu/translate.html',
  '/xuewaiyu/practice.html',
  '/xuewaiyu/about.html',
  '/xuewaiyu/terms.html',
  '/xuewaiyu/privacy.html',
  '/xuewaiyu/membership.html',
  '/xuewaiyu/account-security.html',
  '/xuewaiyu/feedback.html',
  '/assets/common.js',
];

const APIS = [
  '/api/feedback/types',
];

function probe(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'GET', timeout: 15000 }, (res) => {
      let len = 0;
      res.on('data', (c) => { len += c.length; });
      res.on('end', () => resolve({ code: res.statusCode, len }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ code: 'TIMEOUT', len: 0 }); });
    req.on('error', (e) => resolve({ code: 'ERR:' + e.code, len: 0 }));
    req.end();
  });
}

(async () => {
  console.log(`\n===== 生产探测 ${BASE} =====\n`);
  let bad = 0;

  console.log('[页面]');
  for (const p of PAGES) {
    const r = await probe(BASE + p);
    const ok = r.code === 200;
    if (!ok) bad++;
    console.log(`  ${ok ? 'OK  ' : 'BAD '} ${r.code}\t${String(r.len).padStart(7)}B  ${p}`);
  }

  console.log('\n[接口]');
  for (const a of APIS) {
    const r = await probe(BASE + a);
    const ok = r.code === 200;
    if (!ok) bad++;
    console.log(`  ${ok ? 'OK  ' : 'BAD '} ${r.code}\t${String(r.len).padStart(7)}B  ${a}`);
  }

  console.log(`\n===== 异常 ${bad} 项 =====\n`);
})();
