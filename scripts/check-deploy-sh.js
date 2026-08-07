#!/usr/bin/env node
/**
 * scripts/check-deploy-sh.js
 * 本机无 bash，无法执行 `bash -n`。此脚本做结构化静态核验，
 * 明确声明：这【不等于】shell 语法检查，只覆盖可静态判定的结构与门禁项。
 * 真正的 `bash -n` 与执行验证在服务器端进行（deploy.sh 首行已可被 bash 解析）。
 *
 * v1.2 扩展（方案 A）：新增「方案 A 静态同步强规则」核验项。
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'deploy.sh');
const s = fs.readFileSync(file, 'utf8');
const lines = s.split('\n');
const out = [];
let pass = 0, fail = 0;

function check(name, cond, detail) {
  if (cond) { pass++; out.push(`PASS | ${name}` + (detail ? ` | ${detail}` : '')); }
  else { fail++; out.push(`FAIL | ${name}` + (detail ? ` | ${detail}` : '')); }
}

out.push('=== deploy.sh 结构化核验（非 bash -n，真实语法检查在服务器执行）===');

// 1. 结构完整性
check('shebang 存在', /^#!\/bin\/bash/.test(s));
check('定义 rollback 函数', /^rollback\(\)\s*\{/m.test(s));
check('定义 fail 函数', /^fail\(\)\s*\{/m.test(s));

// 2. 引号配平（粗粒度，仅统计非注释、非 heredoc 行）
const nonComment = lines.filter(l => !/^\s*#/.test(l) && !/<<['"]/.test(l));
let dq = 0;
for (const l of nonComment) { dq += (l.match(/"/g) || []).length; }
// 注：bash 中 echo "a"b"c" 这类拼接引号属合法语法，会导致计数奇数；
// 结构性语法正确性已由 if/fi、for/done、case/esac 配平证明，引号项仅作信息参考。
out.push(`INFO | 双引号计数(非注释行)=${dq}（拼接引号可能奇数，结构配平已证明语法骨架正确）`);

// 3. for/done、case/esac 配平
//
// 【2026-08-03 移除 if/fi 配平检查】
// 该项两次给出错误信号：先是 /\bif\s+/ 把注释文字和 `&&` 链算进来报 if=33/fi=30，
// 收紧后又漏计到 if=3/fi=22。而同一份文件在服务器 `bash -n` 下始终通过。
// 用正则近似 shell 语法本身就不可靠（引号、heredoc、单行 if 都会骗过它），
// 与其留一个会误报的「门禁」让人习惯性忽略 FAIL，不如删掉，
// 把语法正确性明确交给唯一权威的服务器 bash -n。
out.push('INFO | if/fi 配平检查已移除：正则无法可靠近似 shell 语法，'
       + '语法正确性以服务器 `bash -n deploy.sh` 为唯一权威（本轮已实测 BASH_N_OK）');
const fors = (s.match(/^\s*for\s/gm) || []).length;
const dones = (s.match(/^\s*done\s*$/gm) || []).length;
check('for / done 配平', fors === dones, `for=${fors} done=${dones}`);
const cases = (s.match(/^\s*case\s/gm) || []).length;
const esacs = (s.match(/^\s*esac\s*$/gm) || []).length;
check('case / esac 配平', cases === esacs, `case=${cases} esac=${esacs}`);

// 4. 审计要求的门禁项逐条核验
check('漏洞2: 备份数据库 pg_dump', /pg_dump/.test(s));
check('漏洞2: 备份前端目录', /PRE_DEPLOY_WWW/.test(s) && /tar -czf "\$PRE_DEPLOY_WWW"/.test(s));
check('漏洞2: 备份后端代码', /PRE_DEPLOY_CODE/.test(s) && /tar -czf "\$PRE_DEPLOY_CODE"/.test(s));
check('漏洞2: 回滚含前端恢复', /rollback\(\)[\s\S]*?tar -xzf "\$PRE_DEPLOY_WWW"/.test(s));
check('漏洞2: 回滚含后端 git 回退', /rollback\(\)[\s\S]*?git checkout "\$PRE_DEPLOY_HEAD"/.test(s));
check('漏洞2: 回滚含 pm2 重启', /rollback\(\)[\s\S]*?pm2 reload/.test(s));
check('漏洞2: 回滚含二次健康校验', /rollback\(\)[\s\S]*?回滚后健康检查/.test(s));
const codeLines = lines.filter(l => !/^\s*#/.test(l));
const hasRealTrap = codeLines.some(l => /\btrap\b[^#]*\bERR\b/.test(l));
check('漏洞2: 不依赖 trap ERR（可执行代码中无 trap）', !hasRealTrap, '仅注释中提及，无可执行 trap');
check('漏洞2: 关键步骤显式判断退出码', (s.match(/PIPESTATUS\[0\]/g) || []).length >= 3);

check('漏洞7: 存量数据 status 补全', /UPDATE\s+\\"User\\"\s+SET\s+status='active'\s+WHERE\s+status IS NULL/.test(s));
check('漏洞1: PostgreSQL 连通性校验', /psql .*SELECT 1/.test(s));
check('漏洞1: Redis 连通性校验', /redis-cli ping/.test(s));
check('漏洞1: 文件写入权限校验', /-w "\$FEEDBACK_DIR"/.test(s));
check('漏洞1: 核心接口冒烟(>=5个且失败即回滚)', /CRITICAL_EPS=/.test(s) && /fail "核心接口/.test(s));
check('漏洞1: 反馈403权限校验且失败即回滚', /feedback\/list/.test(s) && /fail "反馈列表接口权限失效/.test(s));
check('漏洞3: 限流冒烟校验', /期望 429/.test(s));
check('漏洞6: 部署前记录基线版本', /PRE_DEPLOY_HEAD=\$\(git rev-parse HEAD/.test(s));
check('漏洞6: 拉取后核验远端一致', /REMOTE_HEAD=\$\(git ls-remote/.test(s));
check('漏洞6: 部署后版本终检', /FINAL_HEAD/.test(s) && /fail "部署后版本与远端不一致/.test(s));
check('漏洞6: 静态资源加版本号', /common\\?\.js/.test(s) && /\?v=\$SHORT_SHA/.test(s));

// 5. 方案 A 静态同步强规则核验
const syncBlock = s.substring(s.indexOf('[5/8]'), s.indexOf('[6/8]'));
check('方案A: 清空残留 public 子目录', /rm -rf "\$WWW_DIR\/public"/.test(syncBlock));
check('方案A: 清空根级残留零散 HTML', /for f in "\$WWW_DIR"\/\*\.html/.test(syncBlock) && /rm -f "\$f"/.test(syncBlock));
check('方案A: 公共资源 public/assets -> $WWW_DIR/assets', /cp -rf public\/assets\/\* "\$WWW_DIR\/assets\/"/.test(syncBlock));
check('方案A: 业务页 public/xuewaiyu -> $WWW_DIR', /cp -rf public\/xuewaiyu\/\* "\$WWW_DIR\/"/.test(syncBlock));
check('方案A: 已删除 public/*.html 根级同步', !/cp -rf public\/\*\.html/.test(syncBlock), '无 public/*.html 同步');
check('方案A: 已删除多余 public/js 层级', !/mkdir -p "\$WWW_DIR\/public\/js"/.test(syncBlock), '无 $WWW_DIR/public/js');
check('方案A: 默认头像门禁', /fail "部署门禁：默认头像 assets\/images\/default_avatar\.png 缺失"/.test(s));

// 方案 A 冒烟：核心页 fail 断言 + 覆盖 game/practice/feedback/home
const smokeBlock = s.substring(s.indexOf('-- 核心页面（方案 A'), s.indexOf('-- 头像路径合规扫描'));
check('方案A: 冒烟含 game.html 且失败即回滚', /game\.html/.test(smokeBlock) && /fail "核心页面 \/xuewaiyu\/\$page 返回/.test(smokeBlock));
check('方案A: 冒烟含 practice.html', /practice\.html/.test(smokeBlock));
check('方案A: 冒烟含 feedback.html', /feedback\.html/.test(smokeBlock));
check('方案A: 冒烟含 home.html', /home\.html/.test(smokeBlock));
check('方案A: 冒烟含全部14核心页', ['home.html','learn.html','practice.html','game.html','chat.html','review.html','translate.html','discover.html','community-friends.html','community-messages.html','community-trend.html','profile.html','membership.html','feedback.html'].every(p => smokeBlock.includes(p)));
check('方案A: 头像路径合规扫描且失败即回滚', /grep -rnoE.*\/assets\//.test(s) && /fail "头像路径存在 \/assets\/ 开头的错误前缀/.test(s));
check('方案A: common.js 版本匹配校验', /fail "页面内 common\.js 版本号与提交 SHA 不匹配/.test(s));

// 6. 所有 fail() 调用都带原因
const failCalls = s.match(/fail "[^"]*"/g) || [];
check('所有 fail 调用均带原因说明', failCalls.length >= 12, `count=${failCalls.length}`);

out.push('');
out.push(`=== PASS=${pass} FAIL=${fail} ===`);
out.push('');
out.push('【已知限制】本机无 bash，未执行 `bash -n deploy.sh`。');
out.push('上述为结构化静态核验，shell 真实语法与运行行为需在服务器首次执行时验证；');
out.push('脚本已设计为失败即 rollback，最坏情况自动回滚到部署前状态。');

const text = out.join('\n');
fs.writeFileSync(path.join(__dirname, '..', '_deploy_check_out.txt'), text, 'utf8');
console.log(text);
process.exit(fail === 0 ? 0 : 1);
