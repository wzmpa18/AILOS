#!/usr/bin/env node
// 修正 4 个前端页默认头像 /assets/images/default_avatar.png -> /xuewaiyu/assets/images/default_avatar.png
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const files = [
  'public/community-friends.html',
  'public/community-messages.html',
  'public/community-trend.html',
  'public/profile.html',
];
let n = 0;
for (const f of files) {
  const fp = path.join(ROOT, f);
  let s = fs.readFileSync(fp, 'utf8');
  const b = s;
  s = s.replace(/\/assets\/images\/default_avatar\.png/g, '/xuewaiyu/assets/images/default_avatar.png');
  if (s !== b) { fs.writeFileSync(fp, s); n++; console.log('FIXED ' + f); }
}
console.log('=== fixed ' + n + ' files ===');
