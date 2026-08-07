#!/usr/bin/env node
// 修复硬编码链接错位（v1.1.0 真交付执行令·链接合规）
// login.html→landing.html, messages.html→community-messages.html, vip.html→membership.html, games.html→game.html
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');

const map = [
  ['/xuewaiyu/login.html', '/xuewaiyu/landing.html'],
  ['/xuewaiyu/messages.html', '/xuewaiyu/community-messages.html'],
  ['/xuewaiyu/vip.html', '/xuewaiyu/membership.html'],
  ['/xuewaiyu/games.html', '/xuewaiyu/game.html'],
];

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (/\.(html|js)$/.test(e.name)) out.push(full);
  }
  return out;
}
const files = walk(ROOT);
let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const b = s;
  for (const [from, to] of map) {
    // 保留 ?query：直接字符串替换（from 后若跟 ? 也整体替换前缀）
    s = s.split(from + '?').join(to + '?');
    s = s.split(from).join(to);
  }
  if (s !== b) { fs.writeFileSync(f, s); n++; console.log('FIXED ' + path.relative(ROOT, f)); }
}
console.log('=== 修正文件数: ' + n + ' ===');
