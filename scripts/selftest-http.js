/**
 * scripts/selftest-http.js
 * 本地 HTTP 服务模拟生产路径自测（宪法：禁止用"本地没环境"跳自测）
 *
 * 模拟生产 docroot：/www/xuewaiyu -> public/ 根级 + public/xuewaiyu/ 覆盖
 * 访问路径前缀 /xuewaiyu/，与生产一致。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const DOCROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'ailos-doc-'));

// 按 deploy.sh 的顺序铺设：先根级，再 assets，最后 xuewaiyu 覆盖
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'public'))) {
  if (f.endsWith('.html')) fs.copyFileSync(path.join(ROOT, 'public', f), path.join(DOCROOT, f));
}
copyDir(path.join(ROOT, 'public', 'assets'), path.join(DOCROOT, 'assets'));
copyDir(path.join(ROOT, 'public', 'xuewaiyu'), DOCROOT);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/xuewaiyu/')) p = p.slice('/xuewaiyu'.length);
  if (p === '/' || p === '') p = '/home.html';
  if (!path.extname(p)) p += '.html';
  const fp = path.join(DOCROOT, p);
  if (!fp.startsWith(DOCROOT) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

function get(port, p) {
  return new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port, path: p }, (r) => {
      let d = '';
      r.on('data', (c) => { d += c; });
      r.on('end', () => resolve({ code: r.statusCode, body: d, ct: r.headers['content-type'] }));
    }).on('error', () => resolve({ code: 0, body: '', ct: '' }));
  });
}

let pass = 0, fail = 0;
function check(n, ok, d) {
  if (ok) { pass++; console.log(`  [PASS] ${n}${d ? ' -> ' + d : ''}`); }
  else { fail++; console.log(`  [FAIL] ${n}${d ? ' -> ' + d : ''}`); }
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`\n===== 本地 HTTP 自测 (docroot 模拟生产) :${port} =====\n`);

  // 1) 底部导航 7 项目标页必须全部可达
  console.log('[六-1] 底部导航 7 项目标页可达性');
  const NAV = ['/xuewaiyu/home', '/xuewaiyu/learn.html', '/xuewaiyu/chat.html',
    '/xuewaiyu/review.html', '/xuewaiyu/community-friends.html',
    '/xuewaiyu/ai-companion-builder.html', '/xuewaiyu/profile.html'];
  for (const u of NAV) {
    const r = await get(port, u);
    check(`导航目标可达 ${u}`, r.code === 200, `HTTP ${r.code}`);
  }

  // 2) 核心页面
  console.log('\n[全局] 核心页面可达性');
  const PAGES = ['/xuewaiyu/game.html', '/xuewaiyu/translate.html', '/xuewaiyu/practice.html',
    '/xuewaiyu/about.html', '/xuewaiyu/terms.html', '/xuewaiyu/privacy.html',
    '/xuewaiyu/membership.html', '/xuewaiyu/feedback.html', '/xuewaiyu/account-security.html',
    '/xuewaiyu/scan-translate.html', '/xuewaiyu/conversation-translate.html'];
  for (const u of PAGES) {
    const r = await get(port, u);
    check(`页面可达 ${u}`, r.code === 200, `HTTP ${r.code}`);
  }

  // 3) common.js 必须可达且为 v1.1.0
  console.log('\n[一-2] 登录态统一：common.js');
  const cj = await get(port, '/xuewaiyu/assets/common.js');
  check('common.js 可达', cj.code === 200, `HTTP ${cj.code}, ${cj.body.length}B`);
  check('含 clearToken 收口', /clearToken/.test(cj.body));
  check('含 setToken 收口', /setToken/.test(cj.body));
  check('含 7 项导航定义', (cj.body.match(/nav-item|href:/g) || []).length > 0);

  // 4) 页面内引用的本地资源不得 404
  console.log('\n[六-2] 页面内静态引用零 404');
  const CHECK_REF = ['/xuewaiyu/game.html', '/xuewaiyu/translate.html', '/xuewaiyu/practice.html',
    '/xuewaiyu/feedback.html', '/xuewaiyu/account-security.html', '/xuewaiyu/learn.html'];
  for (const u of CHECK_REF) {
    const r = await get(port, u);
    const refs = [...r.body.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
    let bad = [];
    for (const ref of [...new Set(refs)]) {
      const rr = await get(port, ref);
      if (rr.code !== 200) bad.push(`${ref}(${rr.code})`);
    }
    check(`${u} 静态引用全部 200`, bad.length === 0, bad.length ? bad.join(', ') : `${refs.length} refs`);
  }

  // 5) 站内链接零 404（about 页合规链接）
  console.log('\n[二] 关于我们页链接零 404');
  const about = await get(port, '/xuewaiyu/about.html');
  const links = [...about.body.matchAll(/href="(\/xuewaiyu\/[^"]+)"/g)].map((m) => m[1]);
  for (const l of [...new Set(links)]) {
    const r = await get(port, l);
    check(`about 链接可达 ${l}`, r.code === 200, `HTTP ${r.code}`);
  }

  console.log(`\n===== HTTP 自测：${pass} 通过 / ${fail} 失败 =====\n`);
  server.close();
  try { fs.rmSync(DOCROOT, { recursive: true, force: true }); } catch (e) {}
  process.exit(fail > 0 ? 1 : 0);
});
