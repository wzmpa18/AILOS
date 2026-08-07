/**
 * scripts/fetch-missing.js
 * 回迁生产环境已上线、但仓库中缺失的页面（宪法：存量功能零删除）
 * 仅在本地不存在时才拉取，不覆盖仓库已有版本。
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = 'https://yandao.vip';
const DIR = path.join(__dirname, '..', 'public', 'xuewaiyu');

const TARGETS = ['review.html', 'ai-companion-builder.html'];

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 20000 }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ code: res.statusCode, body: d }));
    }).on('error', (e) => resolve({ code: 0, body: String(e.message) }));
  });
}

(async () => {
  for (const t of TARGETS) {
    const local = path.join(DIR, t);
    if (fs.existsSync(local)) { console.log(`skip (已存在): ${t}`); continue; }
    const r = await get(`${BASE}/xuewaiyu/${t}`);
    if (r.code === 200 && r.body.length > 500) {
      fs.writeFileSync(local, r.body, 'utf8');
      console.log(`fetched: ${t} (${r.body.length}B)`);
    } else {
      console.log(`FAILED: ${t} -> HTTP ${r.code}, ${r.body.length}B`);
    }
  }
})();
