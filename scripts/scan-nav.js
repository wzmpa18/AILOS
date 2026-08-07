#!/usr/bin/env node
// 全量核查所有 HTML 的导航合规：是否引入 /xuewaiyu/assets/common.js、nav 容器是否空、是否硬编码导航项
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const results = [];

function walk(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) results.push(full);
  }
}
walk(PUBLIC);

const report = [];
for (const f of results) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(PUBLIC, f);
  const hasCommonJs = /assets\/common\.js/.test(html);
  const navEmpty = /<nav class="bottom-nav"[^>]*>\s*<\/nav>/.test(html)
    || /<nav class="bottom-nav"[^>]*>\s*<!--/.test(html)
    || /<div class="bottom-nav"[^>]*>\s*<\/div>/.test(html);
  // 硬编码导航项：含有 bottom-nav 且含 nav-item 且有 href 或 onclick（非 JS 注入特征）
  const hardCodedNav = /class="nav-item"[^>]*>\s*<a/.test(html) || /class="nav-item"[^>]*>\s*<div[^>]*onclick/.test(html);
  // 错误路径
  const wrongPath = /bottom-nav\.js/.test(html) || /public\/js\/bottom-nav/.test(html);
  report.push({
    file: rel,
    commonJs: hasCommonJs,
    navEmptyOrInjected: navEmpty,
    hardCodedNav,
    wrongPath,
    ok: hasCommonJs && !wrongPath
  });
}

console.log('=== HTML 导航合规扫描 (' + results.length + ' 个文件) ===');
let bad = 0;
for (const r of report) {
  const flag = r.ok ? 'OK ' : 'BAD';
  if (!r.ok) bad++;
  console.log(`[${flag}] ${r.file}  commonJs=${r.commonJs} navEmpty=${r.navEmptyOrInjected} hardCoded=${r.hardCodedNav} wrongPath=${r.wrongPath}`);
}
console.log('=== 不合规数量: ' + bad + ' ===');
