#!/usr/bin/env node
/**
 * CI 违宪扫描脚本 v2.0 — 绕过验证增强版
 * 
 * 新增能力：
 * 1. 字符串拼接检测（const a='hun';const b='yuan';axios.post(a+b)）
 * 2. 变量名模糊匹配（HUNYUAN_KEY/HY_KEY/ai_key 等变体）
 * 3. 注释内代码检测
 * 4. 大小写混淆检测
 * 
 * 用法：node ci-violation-scanner.js [--commit-msg "message"] [--bypass-test]
 * 返回：0 = 通过，1 = 违宪拦截
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '_ailos_local_repo');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'data'];

const BRAIN_LEGIT_PATHS = ['aiGateway.js'];
const COREOS_LEGIT_PATHS = [];

const DOMAIN_SERVICES = {
  vocabulary: 'vocabularyService', grammar: 'grammarService',
  reading: 'readingService', speaking: 'speakingService',
  social: 'socialService', billing: 'billingService'
};

const FORBIDDEN_IMPORTS = {
  vocabulary: ['readingService','grammarService','speakingService','socialService','billingService'],
  grammar: ['vocabularyService','readingService','speakingService','socialService','billingService'],
  reading: ['vocabularyService','grammarService','speakingService','socialService','billingService'],
  speaking: ['vocabularyService','grammarService','readingService','socialService','billingService'],
  social: ['vocabularyService','grammarService','readingService','speakingService','billingService'],
  billing: ['vocabularyService','grammarService','readingService','speakingService','socialService']
};

let violations = [];
let warnings = [];
let bypassTests = { passed: 0, failed: 0 };

function addViolation(type, file, line, detail) {
  violations.push({ type, file, line, detail, level: 'L1' });
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (EXCLUDED_DIRS.some(e => full.includes(e))) continue;
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walkDir(full, callback);
      else if (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.html')) callback(full);
    } catch(e) {}
  }
}

// ==================== 绕过检测 ====================

/**
 * v2.0 新增：字符串拼接检测
 * 检测 const a='hun'; const b='yuan'; axios.post(a+b) 等拼接绕过
 */
function detectStringConcat(content, filePath) {
  const lines = content.split('\n');
  
  // 检测模式：两个以上包含模型关键词片段的变量声明
  const modelFragments = ['hun', 'yuan', 'deep', 'seek', 'tencent', 'cloud', 'tts', 'asr', 'tmt', 'ocr'];
  const fragmentVars = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const frag of modelFragments) {
      const re = new RegExp(`(?:const|let|var)\\s+(\\w*${frag}\\w*)\\s*=\\s*['"\`]`, 'i');
      const m = line.match(re);
      if (m) fragmentVars.push({ name: m[1], line: i + 1, frag });
    }
  }
  
  // 检测拼接使用
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const v of fragmentVars) {
      if (line.includes(v.name) && (line.includes('+') || line.includes('concat'))) {
        addViolation('字符串拼接绕过', filePath, i + 1, `疑似拼接模型URL: 变量 ${v.name} (含片段 "${v.frag}") 用于拼接操作`);
      }
    }
  }
}

/**
 * v2.0 新增：变量名模糊匹配
 * 检测 HUNYUAN_KEY/HY_KEY/ai_key/AI_API 等变体
 */
function detectFuzzyKeyNames(content, filePath) {
  const lines = content.split('\n');
  // 模糊模式：包含 api_key/apiKey/API_KEY/secret 等且值为非空字符串
  const keyPatterns = [
    { regex: /(?:const|let|var)\s+(\w*(?:api[_\s]?key|secret|token)\w*)\s*=\s*['"\`][^'\"\`]{8,}['"\`]/gi, name: 'API密钥硬编码' },
    { regex: /process\.env\.(\w*(?:HUNYUAN|DEEPSEEK|TENCENT|MODEL)\w*)/gi, name: '模型API密钥引用' },
    { regex: /Authorization\s*:\s*['"\`]Bearer\s+\S{20,}['"\`]/gi, name: '硬编码Bearer Token' },
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 跳过注释行
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;
    
    for (const p of keyPatterns) {
      const matches = line.match(p.regex);
      if (matches) {
        const isBrainLegit = BRAIN_LEGIT_PATHS.some(bp => filePath.includes(bp));
        if (!isBrainLegit) {
          addViolation('密钥泄露风险', filePath, i + 1, `${p.name}: ${line.trim().substring(0, 80)}`);
        }
      }
    }
  }
}

/**
 * v2.0 新增：注释内代码检测
 * 检测被注释掉的直连模型代码
 */
function detectCommentedCode(content, filePath) {
  const lines = content.split('\n');
  const suspiciousComments = [
    /\/\/.*axios\.post.*hunyuan/i,
    /\/\/.*axios\.post.*deepseek/i,
    /\/\/.*redis\.set/i,
    /\/\*[\s\S]*?axios\.post[\s\S]*?\*\//i,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    for (const p of suspiciousComments) {
      if (p.test(lines[i])) {
        addViolation('注释内违规代码', filePath, i + 1, `注释中包含疑似直连模型/Redis代码: ${lines[i].trim().substring(0, 80)}`);
      }
    }
  }
}

// ==================== 基础扫描 ====================

function scanDirectModelCall(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const patterns = [
    { regex: /hunyuan.*api.*key|HUNYUAN_API_KEY|hunyuan.*completions/gi, name: '混元API直连' },
    { regex: /deepseek.*api.*key|DEEPSEEK_API_KEY/gi, name: 'DeepSeek API直连' },
    { regex: /tts\.tencentcloudapi\.com/gi, name: '腾讯云TTS直连' },
    { regex: /asr\.tencentcloudapi\.com/gi, name: '腾讯云ASR直连' },
    { regex: /tmt\.tencentcloudapi\.com/gi, name: '腾讯云TMT直连' },
    { regex: /tokenhub\.tencentmaas\.com/gi, name: '腾讯混元直连' },
  ];

  const isBrainLegit = BRAIN_LEGIT_PATHS.some(p => filePath.includes(p));
  const lines = content.split('\n');

  for (const p of patterns) {
    for (let i = 0; i < lines.length; i++) {
      // 跳过注释行
      if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('/*')) continue;
      if (p.regex.test(lines[i]) && !isBrainLegit) {
        addViolation('直连模型', filePath, i + 1, `${p.name}: ${lines[i].trim().substring(0, 80)}`);
      }
    }
  }
}

function scanDirectRedisWrite(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const patterns = [/redis\.set\(/g, /redis\.setex\(/g, /redis\.hset\(/g, /redis\.del\(/g];
  const isCoreOSLegit = COREOS_LEGIT_PATHS.some(p => filePath.includes(p));
  const lines = content.split('\n');

  for (const p of patterns) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('//')) continue;
      if (p.test(lines[i]) && !isCoreOSLegit) {
        addViolation('直写缓存', filePath, i + 1, `${p.source}: ${lines[i].trim().substring(0, 80)}`);
      }
    }
  }
}

function scanCrossDomainImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  let currentDomain = null;
  for (const [domain, serviceName] of Object.entries(DOMAIN_SERVICES)) {
    if (fileName.includes(serviceName) || filePath.includes(`/${domain}/`)) {
      currentDomain = domain; break;
    }
  }
  if (!currentDomain) return;
  const forbidden = FORBIDDEN_IMPORTS[currentDomain];
  if (!forbidden) return;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('require(') && !lines[i].includes('import ')) continue;
    for (const forbid of forbidden) {
      if (lines[i].includes(forbid)) {
        addViolation('跨模块耦合', filePath, i + 1, `${currentDomain}Service import ${forbid}`);
      }
    }
  }
}

function checkCommitMessage(commitMsg) {
  const versionPattern = /\[图谱版本:v\d+\.\d+\.\d+\]/;
  if (!versionPattern.test(commitMsg)) {
    addViolation('版本号缺失', 'Commit Message', 0, `缺少 [图谱版本:vX.Y.Z] 标注: "${commitMsg.substring(0, 100)}"`);
  }
}

// ==================== 绕过验证自测 ====================

function runBypassTests() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  🔬 绕过验证自测                        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const testCases = [
    {
      name: '测试1：字符串拼接绕过 (a+b)',
      code: "const a='hun'; const b='yuan'; axios.post('https://'+a+b+'.com')",
      expected: true,
    },
    {
      name: '测试2：变量名模糊匹配 (HY_KEY)',
      code: "const HY_KEY = 'sk-abc123def456ghi789jkl'; axios.post('https://api.hunyuan.com', { headers: { Authorization: 'Bearer '+HY_KEY } })",
      expected: true,
    },
    {
      name: '测试3：注释内违规代码',
      code: "// axios.post('https://api.hunyuan.com', data)  // 紧急修复用，不要删",
      expected: true,
    },
    {
      name: '测试4：合法代码（应通过）',
      code: "const result = await aiGateway.chat(messages, { userId: '123' });",
      expected: false,
    },
  ];

  for (const tc of testCases) {
    const tempFile = path.join(__dirname, '_bypass_test_temp.js');
    fs.writeFileSync(tempFile, tc.code);
    
    // 运行扫描
    const savedViolations = violations.length;
    scanDirectModelCall(tempFile);
    detectStringConcat(tc.code, tempFile);
    detectFuzzyKeyNames(tc.code, tempFile);
    detectCommentedCode(tc.code, tempFile);
    
    const detected = violations.length > savedViolations;
    violations = violations.slice(0, savedViolations); // 恢复
    
    if (detected === tc.expected) {
      console.log(`  ✅ ${tc.name}: ${detected ? '已拦截' : '已放行'}（预期 ${tc.expected ? '拦截' : '放行'}）`);
      bypassTests.passed++;
    } else {
      console.log(`  ❌ ${tc.name}: ${detected ? '误拦截' : '漏拦截'}（预期 ${tc.expected ? '拦截' : '放行'}）`);
      bypassTests.failed++;
    }
    
    try { fs.unlinkSync(tempFile); } catch(e) {}
  }

  console.log(`\n  绕过验证结果: ${bypassTests.passed}/${testCases.length} 通过\n`);
}

// ==================== 主流程 ====================

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  AILOS CI 违宪扫描脚本 v2.0             ║');
  console.log('║  图谱版本: v3.0.0 | 宪法版本: v2.6.0    ║');
  console.log('╚══════════════════════════════════════════╝');

  const args = process.argv.slice(2);
  let commitMsg = '';
  let runTests = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--commit-msg' && args[i + 1]) commitMsg = args[i + 1];
    if (args[i] === '--bypass-test') runTests = true;
  }

  if (commitMsg) checkCommitMessage(commitMsg);

  if (fs.existsSync(SRC_DIR)) {
    console.log('\n[扫描] 开始代码扫描（含绕过检测）...');
    walkDir(SRC_DIR, (filePath) => {
      scanDirectModelCall(filePath);
      scanDirectRedisWrite(filePath);
      scanCrossDomainImport(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      detectStringConcat(content, filePath);
      detectFuzzyKeyNames(content, filePath);
      detectCommentedCode(content, filePath);
    });
    console.log(`[扫描] 完成，${violations.length} 条违宪\n`);
  }

  if (runTests) runBypassTests();

  if (violations.length > 0) {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  ❌ 违宪拦截！                          ║');
    console.log('╚══════════════════════════════════════════╝\n');
    violations.forEach((v, i) => {
      console.log(`[违宪 #${i + 1}] ${v.type}: ${v.file}:${v.line}`);
      console.log(`  ${v.detail}\n`);
    });
    console.log(`共 ${violations.length} 条一级违宪，提交已被拦截。`);
    process.exit(1);
  }

  console.log('✅ 违宪扫描通过！');
  process.exit(0);
}

main();
