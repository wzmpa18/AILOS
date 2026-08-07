/**
 * scripts/fix-asset-paths.js
 * v1.1.0 修复：统一静态资源引用路径为生产可用的 /xuewaiyu/assets/
 *
 * 背景：deploy.sh 只同步 public/xuewaiyu/*，public/assets 从未部署，
 *       导致生产 /assets/common.js 恒 404，页面底部导航与登录态静默失效。
 *       生产实际可用路径为 /xuewaiyu/assets/common.js。
 * 同时移除不存在的 tokens.css 引用，避免无谓 404。
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'xuewaiyu');
let changed = 0;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const fp = path.join(DIR, f);
  let c = fs.readFileSync(fp, 'utf8');
  const orig = c;

  // 1) /assets/xxx -> /xuewaiyu/assets/xxx（避免重复替换）
  c = c.replace(/(src|href)="\/assets\//g, '$1="/xuewaiyu/assets/');

  // 2) 移除不存在的 tokens.css（生产与本地均无此文件）
  c = c.replace(/[ \t]*<link[^>]*tokens\.css[^>]*>\s*\r?\n?/gi, '');

  if (c !== orig) {
    fs.writeFileSync(fp, c, 'utf8');
    console.log('fixed: ' + f);
    changed++;
  }
}
console.log('changed files: ' + changed);
