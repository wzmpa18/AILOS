/**
 * scripts/probe-assets.js
 * 判定生产静态资源根目录与 common.js 真实可用路径
 */
const https = require('https');
const BASE = 'https://yandao.vip';

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ code: res.statusCode, body: d, ct: res.headers['content-type'] }));
    }).on('error', (e) => resolve({ code: 0, body: String(e.code), ct: '' }));
  });
}

(async () => {
  const paths = [
    '/assets/common.js',
    '/xuewaiyu/assets/common.js',
    '/assets/tokens.css',
    '/xuewaiyu/assets/tokens.css',
  ];
  for (const p of paths) {
    const r = await get(BASE + p);
    const isJs = /javascript|css/.test(r.ct || '');
    console.log(`\n=== ${p}`);
    console.log(`  code=${r.code} ct=${r.ct} len=${r.body.length} 真资源=${isJs}`);
    console.log(`  head: ${r.body.slice(0, 120).replace(/\s+/g, ' ')}`);
    if (isJs) {
      console.log(`  含 getToken=${/getToken/.test(r.body)} 含 clearToken=${/clearToken/.test(r.body)} 含 NAV=${/bottom-nav|navItems|NAV_ITEMS/.test(r.body)}`);
    }
  }
})();
