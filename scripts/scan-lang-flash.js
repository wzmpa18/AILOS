/**
 * scripts/scan-lang-flash.js
 * v1.1.0 深度穿透审计 · 漏洞5 取证脚本
 *
 * 扫描各业务页面首屏是否存在「语言默认值闪烁」：
 *   1. JS 里 language / studyLang 等状态是否硬编码默认语言（如 'en'/'ja'/'zh'）
 *   2. 是否监听 languageChanged 事件
 *   3. 是否存在 .bottom-nav 容器（决定导航是否需等注入）
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'xuewaiyu');
const PAGES = ['home', 'learn', 'chat', 'review', 'translate', 'game', 'profile', 'practice'];

const rows = [];
for (const name of PAGES) {
  const file = path.join(DIR, `${name}.html`);
  if (!fs.existsSync(file)) {
    rows.push({ page: name, exists: false });
    continue;
  }
  const s = fs.readFileSync(file, 'utf8');

  // 硬编码默认学习语言
  const hardDefault = [];
  const re = /(?:language|studyLang|currentLang|lang)\s*[:=]\s*['"](en|ja|zh|ko|fr|de|es)['"]/g;
  let m;
  while ((m = re.exec(s)) !== null) hardDefault.push(m[0].trim());

  rows.push({
    page: name,
    exists: true,
    hardDefault: [...new Set(hardDefault)],
    listensLangChanged: /languageChanged/.test(s),
    hasNavContainer: /class=["'][^"']*bottom-nav/.test(s),
    hasLoadingPlaceholder: /加载中/.test(s),
    usesGetStudyLang: /getStudyLang/.test(s),
  });
}

const out = [];
out.push('=== 漏洞5 首屏语言闪烁扫描 ===');
for (const r of rows) {
  if (!r.exists) { out.push(`[缺失] ${r.page}.html 不存在`); continue; }
  const flags = [];
  if (r.hardDefault.length) flags.push(`硬编码默认语言: ${r.hardDefault.join(' | ')}`);
  if (!r.listensLangChanged) flags.push('未监听 languageChanged');
  if (!r.hasLoadingPlaceholder) flags.push('无“加载中”占位');
  if (!r.hasNavContainer) flags.push('无 .bottom-nav 容器(依赖JS创建)');
  out.push(`${flags.length ? '[需修]' : '[通过]'} ${r.page}.html` + (flags.length ? '\n        - ' + flags.join('\n        - ') : ''));
}
fs.writeFileSync(path.join(__dirname, '..', '_lang_flash_scan.txt'), out.join('\n'), 'utf8');
console.log(out.join('\n'));
