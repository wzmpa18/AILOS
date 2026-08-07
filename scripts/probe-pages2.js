const https = require('https');
const BASE = 'https://yandao.vip';
const P = [
  '/xuewaiyu/scan-translate.html',
  '/xuewaiyu/conversation-translate.html',
  '/xuewaiyu/membership.html',
  '/xuewaiyu/terms.html',
  '/xuewaiyu/privacy.html',
  '/xuewaiyu/landing.html',
  '/xuewaiyu/notebook.html',
  '/xuewaiyu/sentences.html',
];
function get(u) {
  return new Promise((r) => {
    https.get(u, { timeout: 12000 }, (res) => {
      let n = 0;
      res.on('data', (c) => { n += c.length; });
      res.on('end', () => r({ c: res.statusCode, n }));
    }).on('error', (e) => r({ c: 'ERR', n: 0 }));
  });
}
(async () => {
  for (const p of P) {
    const r = await get(BASE + p);
    console.log(`${r.c}\t${String(r.n).padStart(7)}B\t${p}`);
  }
})();
