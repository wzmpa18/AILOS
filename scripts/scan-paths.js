#!/usr/bin/env node
// 路径合规全量扫描：禁止 /assets/ 开头（须 /xuewaiyu/assets/）、禁止 /ocr（须 /photo）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SRC = path.join(ROOT, 'src');

let violations = [];
function walk(dir, exts) {
  let out = [];
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  for (const e of ents) {
    if (e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full, exts));
    else if (exts.includes(path.extname(e.name))) out.push(full);
  }
  return out;
}
const files = walk(PUBLIC, ['.html', '.js']).concat(walk(SRC, ['.js', '.html']));

for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  // 禁止 /assets/ 开头（正确应为 /xuewaiyu/assets/）
  const badAsset = txt.match(/["'`]\/assets\//g);
  if (badAsset) violations.push(rel + ' : 含 /assets/ 引用 ' + badAsset.length + ' 处');
  // 禁止前端调 /translate/ocr（后端实为 /translate/photo）
  if (/translate\/ocr/.test(txt)) violations.push(rel + ' : 含 /translate/ocr（应为 /translate/photo）');
}

console.log('=== 路径合规扫描 (' + files.length + ' 个文件) ===');
if (violations.length === 0) {
  console.log('  PASS  零违规路径（无 /assets/ 开头、无 /translate/ocr）');
} else {
  console.log('  违规 ' + violations.length + ' 项:');
  violations.forEach(v => console.log('  - ' + v));
}
process.exit(violations.length === 0 ? 0 : 1);
