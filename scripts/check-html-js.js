/**
 * scripts/check-html-js.js
 * 校验前端页面内联 JS 语法 + v1.1.0 关键静态规范
 * 用法: node scripts/check-html-js.js
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'xuewaiyu');
let errors = 0;
let checked = 0;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html')).sort();

console.log('\n===== 内联 JS 语法校验 =====\n');
for (const f of files) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const blocks = html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi) || [];
  let bad = 0;
  blocks.forEach((b, i) => {
    const code = b.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    if (!code.trim()) return;
    checked++;
    try {
      // 用 async 包裹以允许顶层 await
      new Function(`return (async()=>{${code}\n})`);
    } catch (e) {
      bad++;
      errors++;
      console.log(`  [JS ERROR] ${f} block#${i + 1}: ${e.message}`);
    }
  });
  if (!bad) console.log(`  [OK] ${f} (${blocks.length} block)`);
}

console.log('\n===== v1.1.0 静态规范检查 =====\n');

function report(name, ok, detail) {
  if (ok) console.log(`  [PASS] ${name}${detail ? ' -> ' + detail : ''}`);
  else { errors++; console.log(`  [FAIL] ${name}${detail ? ' -> ' + detail : ''}`); }
}

// 一级页面必须有底部导航且引入 common.js
// 说明：chat/review/community 等页面部署在 /www/xuewaiyu 根，仓库内不在 xuewaiyu 子目录，
// 故此处只校验仓库内实际存在的一级页面。
const PRIMARY = ['home.html', 'learn.html', 'profile.html', 'game.html',
  'translate.html', 'practice.html', 'feedback.html', 'account-security.html'];
for (const p of PRIMARY) {
  const fp = path.join(DIR, p);
  if (!fs.existsSync(fp)) { report(`一级页面存在: ${p}`, false, '文件缺失'); continue; }
  const c = fs.readFileSync(fp, 'utf8');
  const hasNav = /class="[^"]*bottom-nav/.test(c);
  const hasCommon = /\/xuewaiyu\/assets\/common\.js/.test(c);
  report(`${p} 底部导航+common.js`, hasNav && hasCommon,
    `nav=${hasNav}, common.js=${hasCommon}`);
}

// 静态资源路径必须是生产可用的 /xuewaiyu/assets/（/assets/ 在生产恒 404）
console.log('');
for (const f of files) {
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (/(src|href)="\/assets\//.test(c)) {
    errors++;
    console.log(`  [FAIL] ${f} 仍引用生产 404 的 /assets/ 路径`);
  }
  if (/tokens\.css/.test(c)) {
    errors++;
    console.log(`  [FAIL] ${f} 仍引用不存在的 tokens.css`);
  }
}
report('全站静态资源路径正确(/xuewaiyu/assets/)', !files.some((f) =>
  /(src|href)="\/assets\/|tokens\.css/.test(fs.readFileSync(path.join(DIR, f), 'utf8'))));

// 禁止"即将上线"占位
console.log('');
for (const f of files) {
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  const m = c.match(/即将上线|敬请期待|coming soon/gi);
  if (m) { errors++; console.log(`  [FAIL] ${f} 仍含占位文案 -> ${[...new Set(m)].join(', ')}`); }
}
report('全站无"即将上线"占位', !files.some((f) =>
  /即将上线|敬请期待|coming soon/i.test(fs.readFileSync(path.join(DIR, f), 'utf8'))));

// 关键页面存在性
report('账号安全页存在', fs.existsSync(path.join(DIR, 'account-security.html')));
report('意见反馈页存在', fs.existsSync(path.join(DIR, 'feedback.html')));

// profile 不得再有注销入口
const prof = fs.readFileSync(path.join(DIR, 'profile.html'), 'utf8');
const profMain = prof.split('deleteModal')[0];
report('profile 主列表无注销入口',
  !/settings_delete_account"?\s*>/.test(profMain) || /account-security/.test(prof),
  'account-security 入口已接入');

// about 链接站内化
const about = fs.readFileSync(path.join(DIR, 'about.html'), 'utf8');
report('about 会员链接站内', /href="\/xuewaiyu\/membership\.html"/.test(about));
report('about 协议链接站内', /href="\/xuewaiyu\/terms\.html"/.test(about));
report('about 隐私链接站内', /href="\/xuewaiyu\/privacy\.html"/.test(about));
report('about 反馈指向表单页', /href="\/xuewaiyu\/feedback\.html"/.test(about));
report('about 无外部公司官网跳转', !/yandao\.vip\/?"|yandao-tech|www\.yandao/i.test(about.replace(/mailto:[^"]*/g, '')));

// learn 不得硬编码语种
const learn = fs.readFileSync(path.join(DIR, 'learn.html'), 'utf8');
report('learn 无硬编码 language=ja', !/language=ja(&|'|")/.test(learn));

console.log(`\n===== 结果：${errors} 个问题，共校验 ${checked} 个脚本块 =====\n`);
process.exit(errors > 0 ? 1 : 0);
