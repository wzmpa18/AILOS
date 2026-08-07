#!/usr/bin/env node
// 前端静态真实验证：模拟生产 docroot /www/xuewaiyu（即 /xuewaiyu/ 前缀）
// 不依赖 Express/prisma，纯静态 serve + 链接爬取，验证：核心页 200、导航注入、站内链接不 404
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');

const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json' };

// 生产 docroot 是 /www/xuewaiyu，站点同时含 public/ 根级页 + public/xuewaiyu/ 页。
// 模拟顺序：先 cp public/*，再 cp public/xuewaiyu/* 覆盖同名。
function resolve(prodPath) {
  // prodPath 形如 /xuewaiyu/home 或 /xuewaiyu/home.html 或 /xuewaiyu/assets/common.js
  // 或 /xuewaiyu/public/js/page-header.js（部署后位于 $WWW_DIR/public/js/，对应仓库 public/js/）
  let rel = prodPath.replace(/^\/xuewaiyu\//, '');
  // 仓库根目录即 public/，请求中的 public/ 前缀是 docroot 内层级，需映射回仓库
  let relNoPub = rel.replace(/^public\//, '');
  const cands = [];
  // 优先 xuewaiyu 覆盖版，再根级（模拟 deploy.sh cp 顺序）
  cands.push(path.join(ROOT, 'xuewaiyu', rel));
  cands.push(path.join(ROOT, relNoPub));
  cands.push(path.join(ROOT, rel));
  // 无扩展名 fallback 到 .html（模拟生产 nginx/Express try_files）
  if (!path.extname(rel)) {
    cands.push(path.join(ROOT, 'xuewaiyu', rel + '.html'));
    cands.push(path.join(ROOT, relNoPub + '.html'));
    cands.push(path.join(ROOT, rel + '.html'));
  }
  for (const c of cands) if (fs.existsSync(c)) return c;
  return null;
}

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/' || p === '') p = '/index.html';
  if (!p.startsWith('/xuewaiyu/')) { res.writeHead(404); res.end('not under /xuewaiyu'); return; }
  const fp = resolve(p);
  if (!fp) { res.writeHead(404); res.end('404'); return; }
  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

const CORE = [
  'home','profile','practice','learn','game','translate','about','feedback',
  'account-security','review','membership','onboarding','placement','discover'
];
// 核心页在 /xuewaiyu/ 下
const corePages = CORE.map(c => '/xuewaiyu/' + c + '.html');

function get(url) {
  return new Promise((resolve2, reject) => {
    http.get('http://127.0.0.1:8099' + url, (r) => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => resolve2({ status: r.statusCode, body }));
    }).on('error', reject);
  });
}

server.listen(8099, async () => {
  let pass = 0, fail = 0;
  const failList = [];
  console.log('=== 前端静态真实验证（模拟 /xuewaiyu/ docroot）===');

  // 1) 核心页 200 + 含 bottom-nav 容器 + 引 common.js
  for (const page of corePages) {
    const r = await get(page);
    const ok200 = r.status === 200;
    const hasNav = /class="bottom-nav"/.test(r.body);
    const hasCommonJs = /assets\/common\.js/.test(r.body);
    const ok = ok200 && hasNav && hasCommonJs;
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${page} 200=${ok200} nav=${hasNav} commonJs=${hasCommonJs}`);
    if (ok) pass++; else { fail++; failList.push(page); }
  }

  // 2) 站内链接爬取：收集所有 /xuewaiyu/ 链接，检查不 404
  const seen = new Set();
  let linkChecked = 0, linkFail = 0;
  async function crawl(url) {
    if (seen.has(url)) return;
    seen.add(url);
    const r = await get(url);
    if (r.status !== 200) return;
    const links = [...r.body.matchAll(/(?:href|src)="(\/xuewaiyu\/[^"?#]+)"/g)].map(m => m[1]);
    for (const l of links) {
      if (seen.has(l)) continue;
      const lr = await get(l);
      linkChecked++;
      if (lr.status !== 200) { linkFail++; failList.push('link 404: ' + l + ' (from ' + url + ')'); console.log('  FAIL link 404: ' + l); }
      seen.add(l);
    }
  }
  for (const page of corePages) await crawl(page);

  // 3) common.js 自身可达 + 大小 >20KB
  const common = await get('/xuewaiyu/assets/common.js');
  const size = common.body.length;
  const commonOk = common.status === 200 && size > 20480;
  console.log(`  ${commonOk ? 'PASS' : 'FAIL'} /xuewaiyu/assets/common.js 200=${common.status===200} size=${size}B(>20KB=${size>20480})`);
  if (commonOk) pass++; else fail++;

  console.log('=== 链接爬取: 检查 ' + linkChecked + ' 个站内链接, 404=' + linkFail + ' ===');
  console.log('=== 结果: PASS=' + pass + ' FAIL=' + fail + ' ===');
  server.close();
  process.exit(fail === 0 ? 0 : 1);
});
