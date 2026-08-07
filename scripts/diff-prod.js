/**
 * scripts/diff-prod.js
 * 对比生产页面与本地仓库差异（判断本地是否落后于生产）
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://yandao.vip';
const LOCAL = path.join(__dirname, '..', 'public', 'xuewaiyu');

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ code: res.statusCode, body: d }));
    }).on('error', () => resolve({ code: 0, body: '' }));
  });
}

const TARGETS = ['game.html', 'learn.html', 'translate.html', 'practice.html', 'profile.html', 'about.html', 'home.html'];

(async () => {
  console.log('\n===== 生产 vs 本地 =====\n');
  for (const t of TARGETS) {
    const r = await get(`${BASE}/xuewaiyu/${t}`);
    const lp = path.join(LOCAL, t);
    const local = fs.existsSync(lp) ? fs.readFileSync(lp, 'utf8') : '';
    console.log(`--- ${t} ---`);
    console.log(`  生产: ${r.code}, ${r.body.length}B | 本地: ${local.length}B | ${r.body === local ? '完全一致' : '存在差异'}`);
    console.log(`  生产 common.js=${/assets\/common\.js/.test(r.body)} navItem=${(r.body.match(/nav-item/g) || []).length} 即将上线=${/即将上线/.test(r.body)}`);
    console.log(`  本地 common.js=${/assets\/common\.js/.test(local)} navItem=${(local.match(/nav-item/g) || []).length} 即将上线=${/即将上线/.test(local)}`);
  }

  // 生产 common.js 是否存在（换几个可能路径）
  console.log('\n--- common.js 路径探测 ---');
  for (const p of ['/assets/common.js', '/xuewaiyu/assets/common.js', '/static/common.js', '/js/common.js']) {
    const r = await get(BASE + p);
    console.log(`  ${r.code}  ${p}  (${r.body.length}B)`);
  }
})();
