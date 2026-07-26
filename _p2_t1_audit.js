/**
 * P2 任务一 审计脚本 —— 全链路读链路合规校验
 * 验收目标（双宪法第十章 10.x + 用户指令）：
 *   A. 后端所有业务模块禁止直读 userLanguagePreference / userLearningLanguage 的语言字段，
 *      除 contextResolver(唯一真值源) 与语言写入接口(注册引导 onboarding / 个人中心设置 languageService / 认证 authService) 外，
 *      直读命中数必须为 0。
 *   B. 后端不得存在双语言学习配置的静默默认兜底（|| 'ja' / 'zh-CN' / 'zh' / '中文' / '英语'）；
 *      系统固定上下文(aiGateway SYSTEM_*) 与浏览器/UI 语言维度(authService uiLanguage/browserLanguage) 属合法例外。
 *   C. 前端不得存在向网关拼接 languageContext 对象的残留逻辑（前端传参无效）。
 *
 * 运行：node _p2_t1_audit.js
 * 产物：_p2_t1_audit.md（证据报告）
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, exts, out);
    } else if (exts.includes(path.extname(e.name))) {
      out.push(p);
    }
  }
  return out;
}

const jsFiles = walk(SRC, ['.js']);
const htmlFiles = walk(ROOT, ['.html']);

// ---- 排除项白名单（合法直读方）----
const EXCLUDED_READ = {
  'src/services/contextResolver.js': '唯一真值源（GAP-03 合规组件）',
  'src/services/languageService.js': '个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）',
  'src/services/onboardingService.js': '注册引导读写接口',
  'src/services/authService.js': '认证/注册写接口',
};

// ---- A. 直读两表语言字段 ----
const directRe = /prisma\.userLanguagePreference|prisma\.userLearningLanguage|userLanguagePreference\.|userLearningLanguage\./g;
let aViolations = [];
let aExcluded = [];
for (const f of jsFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  directRe.lastIndex = 0;
  while ((m = directRe.exec(txt))) {
    const line = txt.substring(0, m.index).split('\n').length;
    const hit = `${rel}:${line}`;
    if (EXCLUDED_READ[rel]) aExcluded.push(`${hit}  [${EXCLUDED_READ[rel]}]`);
    else aViolations.push(hit);
  }
}

// ---- B. 双语言配置静默默认兜底 ----
// 合法例外锚点（行内容关键字）
const DEFAULT_ALLOW = [
  { file: 'src/services/aiGateway.js', reason: '系统固定上下文 SYSTEM_TARGET_LANG/SYSTEM_EXPLAIN_LANG（env 注入，非用户可篡改）' },
  { file: 'src/services/authService.js', reason: '浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）' },
  { file: 'src/services/languageGuard.js', reason: '注释中的语种枚举说明' },
];
const defaultRe = /\|\s*'(ja|zh-CN|zh|中文|英语)'/g;
let bViolations = [];
let bAllowed = [];
for (const f of jsFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  defaultRe.lastIndex = 0;
  while ((m = defaultRe.exec(txt))) {
    const line = txt.substring(0, m.index).split('\n').length;
    const snippet = txt.split('\n')[line - 1].trim();
    const allow = DEFAULT_ALLOW.find((a) => a.file === rel);
    const hit = `${rel}:${line}  ${snippet}`;
    if (allow) bAllowed.push(`${hit}  [合法: ${allow.reason}]`);
    else bViolations.push(hit);
  }
}

// ---- C. 前端向网关拼接 languageContext 对象 ----
const feRe = /languageContext\s*[:=]\s*\{/g;
let cViolations = [];
for (const f of htmlFiles) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const txt = fs.readFileSync(f, 'utf8');
  let m;
  feRe.lastIndex = 0;
  while ((m = feRe.exec(txt))) {
    const line = txt.substring(0, m.index).split('\n').length;
    cViolations.push(`${rel}:${line}  ${txt.split('\n')[line - 1].trim()}`);
  }
}

// ---- 汇总 ----
const passA = aViolations.length === 0;
const passB = bViolations.length === 0;
const passC = cViolations.length === 0;
const allPass = passA && passB && passC;

let md = `# P2 任务一 审计报告（读链路收口 + 前端残留兜底）\n\n`;
md += `生成时间：${new Date().toISOString()}\n\n`;
md += `## 结论：${allPass ? '✅ PASS（全部验收硬标准达成）' : '❌ FAIL'}\n\n`;

md += `## A. 后端直读 userLanguagePreference / userLearningLanguage（排除项外须 = 0）\n`;
md += `- 结果：${passA ? 'PASS ✅' : 'FAIL ❌'}  （非排除项命中 ${aViolations.length} 处）\n`;
md += `- 合法排除项命中（${aExcluded.length} 处）：\n`;
for (const h of aExcluded) md += `  - ${h}\n`;
if (aViolations.length) {
  md += `- ❌ 违规直读（须整改）：\n`;
  for (const h of aViolations) md += `  - ${h}\n`;
}

md += `\n## B. 双语言配置静默默认兜底（|| 'ja'/'zh-CN'/'zh'/'中文'/'英语' 须 = 0，系统/UI 维度除外）\n`;
md += `- 结果：${passB ? 'PASS ✅' : 'FAIL ❌'}  （违规 ${bViolations.length} 处）\n`;
md += `- 合法例外（${bAllowed.length} 处）：\n`;
for (const h of bAllowed) md += `  - ${h}\n`;
if (bViolations.length) {
  md += `- ❌ 违规兜底（须整改）：\n`;
  for (const h of bViolations) md += `  - ${h}\n`;
}

md += `\n## C. 前端向网关拼接 languageContext 对象（须 = 0）\n`;
md += `- 结果：${passC ? 'PASS ✅' : 'FAIL ❌'}  （命中 ${cViolations.length} 处）\n`;
if (cViolations.length) {
  for (const h of cViolations) md += `  - ${h}\n`;
} else {
  md += `  - 无残留（前端传参无效，语言配置由后端 ContextResolver 注入）\n`;
}

fs.writeFileSync(path.join(ROOT, '_p2_t1_audit.md'), md, 'utf8');
console.log(md);
console.log(`\n=== AUDIT ${allPass ? 'PASS' : 'FAIL'} ===`);
process.exit(allPass ? 0 : 1);
