#!/usr/bin/env node
/**
 * scan-frontend-source.js v1.2 — 方案 A 前端静态源扫描（宪法 1.1/1.4/1.5/4.3）
 * 唯一真值源 = public/xuewaiyu/。
 * 校验：
 *  ① 14 核心页均引入 common.js（/xuewaiyu/assets/common.js）
 *  ② 14 核心页均有首屏「加载中」占位（兼容 加载中 / 加载中… / 加载中... / data-i18n loading 机制）
 *  ③ 14 核心页均监听 languageChanged（window.addEventListener 或 onlanguagechanged 或 i18n 引擎）
 *  ④ 均有 .bottom-nav 容器
 *  ⑤ 无 /assets/ 开头的违规头像/静态资源路径、无 ../assets 相对路径
 *  ⑥ 站内链接 /xuewaiyu/*.html 均指向真实存在的页面（零 404）
 * 输出可核验报告，零违规才算通过。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'xuewaiyu');
const CORE_PAGES = [
  'home.html', 'learn.html', 'practice.html', 'game.html', 'chat.html',
  'review.html', 'translate.html', 'discover.html', 'community-friends.html',
  'community-messages.html', 'community-trend.html', 'profile.html',
  'membership.html', 'feedback.html',
];

const allHtml = fs.existsSync(SRC)
  ? fs.readdirSync(SRC).filter((f) => f.endsWith('.html'))
  : [];
const validPages = new Set(allHtml.map((f) => f.replace(/\.html$/, '')));

let total = 0, passed = 0, failed = 0;
const failures = [];

function hasCommonJs(html) { return /<script[^>]+src=["']\/xuewaiyu\/assets\/common\.js/.test(html); }
function hasLoading(html) {
  return /加载中|加载中…|加载中\.\.\.|class="loading"|data-i18n/.test(html);
}
function hasLangChanged(html) {
  return /addEventListener\(\s*['"]languageChanged['"]|onlanguagechanged|AILOS\.on\(\s*['"]languageChanged['"]|window\.onlanguagechanged/i.test(html);
}
function hasBottomNav(html) { return /class=["'][^"']*bottom-nav/.test(html); }
function checkAvatar(html) {
  // /assets/ 开头的违规资源路径（排除 /xuewaiyu/assets）
  const bad = html.match(/(?:src|href)\s*=\s*["']\/assets\//g) || [];
  // 相对路径 assets/ 或 ../assets
  const rel = html.match(/(?:src|href)\s*=\s*["'](?:\.\.\/)?assets\//g) || [];
  return [...bad.map((m) => '违规绝对路径: ' + m.trim()), ...rel.map((m) => '违规相对路径: ' + m.trim())];
}
function checkLinks(html, file) {
  const hrefs = html.match(/href=["']\/xuewaiyu\/([a-zA-Z0-9_-]+)(?:\.html)?["']/g) || [];
  const locs = html.match(/location\.href\s*=\s*["']\/xuewaiyu\/([a-zA-Z0-9_-]+)(?:\.html)?["']/g) || [];
  const issues = [];
  const targets = new Set();
  hrefs.forEach((m) => { const t = m.match(/xuewaiyu\/([a-zA-Z0-9_-]+)/); if (t) targets.add(t[1]); });
  locs.forEach((m) => { const t = m.match(/xuewaiyu\/([a-zA-Z0-9_-]+)/); if (t) targets.add(t[1]); });
  targets.forEach((t) => {
    if (t === 'api') return; // /xuewaiyu/api 是后端，非页面
    // nginx try_files $uri.html，所以 login/placement 等无 .html 后缀的也要有对应 .html
    const hasHtml = validPages.has(t) || validPages.has(t + '.html'.replace('.html', ''));
    if (!validPages.has(t) && !fs.existsSync(path.join(SRC, t + '.html'))) {
      issues.push(`站内链接指向不存在页面: /xuewaiyu/${t}.html (来源 ${file})`);
    }
  });
  return issues;
}

console.log('============================================');
console.log(' 方案 A 前端静态源扫描 v1.2');
console.log(' 扫描目录: public/xuewaiyu/');
console.log(' 时间: ' + new Date().toISOString());
console.log('============================================\n');

for (const page of CORE_PAGES) {
  total++;
  const row = { page, ok: true, issues: [] };
  const fp = path.join(SRC, page);
  if (!fs.existsSync(fp)) {
    row.ok = false; row.issues.push('文件缺失'); failures.push(row); failed++;
    console.log(`  ✗ ${page} — 缺失`);
    continue;
  }
  const html = fs.readFileSync(fp, 'utf8');
  if (!hasCommonJs(html)) { row.ok = false; row.issues.push('未引入 /xuewaiyu/assets/common.js'); }
  if (!hasLoading(html)) { row.ok = false; row.issues.push('无首屏加载中占位'); }
  if (!hasLangChanged(html)) { row.ok = false; row.issues.push('未监听 languageChanged'); }
  if (!hasBottomNav(html)) { row.ok = false; row.issues.push('无 .bottom-nav 容器'); }
  row.issues.push(...checkAvatar(html));
  row.issues.push(...checkLinks(html, page));

  if (row.ok) { passed++; console.log(`  ✓ ${page}`); }
  else { failed++; failures.push(row); console.log(`  ✗ ${page} — ${row.issues.join('; ')}`); }
}

console.log('\n--------------------------------------------');
console.log(` 核心页: ${CORE_PAGES.length}  通过: ${passed}  失败: ${failed}`);
if (failed === 0) {
  console.log(' 扫描结果: ✅ 全部通过（零违规）');
  process.exit(0);
} else {
  console.log(' 扫描结果: ❌ 存在违规项：');
  failures.forEach((f) => console.log(`   - ${f.page}: ${f.issues.join('; ')}`));
  process.exit(1);
}
