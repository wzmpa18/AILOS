#!/usr/bin/env node
// 批量修正后端/前端默认头像等 /assets/ 开头路径 -> /xuewaiyu/assets/
// 生产 docroot = /www/xuewaiyu，/assets/ 恒 404，必须先补 /xuewaiyu 前缀
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const targets = [
  'src/services/orgClassService.js',
  'src/services/orgAuthService.js',
  'src/server/routes/socialTimeline.js',
  'src/server/routes/social.js',
  'src/server/routes/org/auth.js',
  'src/services/authService.js',
  'src/server/controllers/userController.js',
  'src/server/controllers/dashboardController.js',
  'public/home.html',
];

let changed = 0;
for (const t of targets) {
  const fp = path.join(ROOT, t);
  if (!fs.existsSync(fp)) { console.log('skip (not found): ' + t); continue; }
  let s = fs.readFileSync(fp, 'utf8');
  const before = s;
  // 仅替换默认头像类路径（不误伤其他）
  s = s.replace(/\/assets\/images\/default_avatar\.png/g, '/xuewaiyu/assets/images/default_avatar.png');
  s = s.replace(/\/assets\/default-avatar\.png/g, '/xuewaiyu/assets/default-avatar.png');
  if (s !== before) {
    fs.writeFileSync(fp, s);
    changed++;
    console.log('FIXED: ' + t);
  } else {
    console.log('no-change: ' + t);
  }
}
console.log('=== 修正文件数: ' + changed + ' ===');
