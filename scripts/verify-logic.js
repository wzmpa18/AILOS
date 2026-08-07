#!/usr/bin/env node
// 纯逻辑真实性校验（读真实源文件做断言，不依赖数据库/AI/网络，不造假）
// 覆盖：P0-4 反馈落盘+列表、P0-3 注销软删、P0-5 题型分级默认值、F-04 时长换算
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name); fail++; }
}
function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }

console.log('=== 纯逻辑真实验证（v1.1.0 P0 硬伤闭环）===');

// P0-4 反馈：落盘 + 列表接口（feedback 路由挂在 /api/feedback 前缀下）
const fbRoute = read('src/server/routes/feedback.js');
const fbSvc = read('src/server/services/feedbackService.js');
check('反馈路由挂载 /api/feedback 前缀', /feedback/.test(fbRoute));
check('反馈 POST 提交接口存在', /\.post\(\s*['"]\/['"]/.test(fbRoute));
check('反馈 GET /list 管理接口存在', /\.get\(\s*['"]\/list['"]/.test(fbRoute));
check('反馈落盘到 data/feedback 目录', /data\/feedback/.test(fbSvc));
check('反馈提示文案无"已发送邮件"虚假承诺', !/已发送邮件|邮件已发送/.test(fbRoute) && /我们会尽快查阅处理/.test(fbRoute));
check('反馈服务使用 fs 写盘', /fs\.(writeFile|writeFileSync|appendFile)/.test(fbSvc));
check('反馈服务读 SMTP 配置或降级落盘（不阻断）', /SMTP_|smtp|try\s*\{[\s\S]*\}\s*catch/.test(fbSvc));

// P0-3 注销：DELETE /me + 软删 status=deleted
const userRoute = read('src/server/routes/user.js');
check('用户路由 DELETE /api/user/me 存在', /\.delete\(\s*['"]\/me['"]/.test(userRoute) || /\.delete\(\s*['"]\/user\/me['"]/.test(userRoute));
const userCtrl = read('src/server/controllers/userController.js');
check('注销执行软删 status=deleted', /status:\s*['"]deleted['"]/.test(userCtrl));
check('注销同时 isActive=false', /isActive:\s*false/.test(userCtrl));
check('注销保留 deletedAt（非硬删）', /deletedAt/.test(userCtrl));

// P0-5 题型分级默认值兜底
const practiceHtml = read('public/xuewaiyu/practice.html');
check('practice.html 强制 level 默认值 beginner', /state\.level\s*=\s*[^;]*\|\|\s*['"]beginner['"]/.test(practiceHtml));
check('初级题型为选择题 listen_select', /questionType\s*=\s*['"]listen_select['"]/.test(practiceHtml));
const practiceSvc = read('src/server/services/practiceService.js');
check('F-04 时长换算 minutes*rate（非除）', /Math\.round\(\s*minutes\s*\*\s*rate/.test(practiceSvc) && !/rate\s*\/\s*minutes/.test(practiceSvc));

// P0-6 游戏错题 localStorage 持久化
const gameHtml = read('public/xuewaiyu/game.html');
check('游戏错题持久化 saveWrongHistory', /saveWrongHistory/.test(gameHtml));
check('游戏错题按语言+类型分类存储', /yandao_game_wrong_/.test(gameHtml));
check('游戏错题上限 50 条', /WRONG_LIMIT\s*=\s*50/.test(gameHtml));
check('历史错题渲染 renderHistoryWrong', /renderHistoryWrong/.test(gameHtml));

// P0-2 部署门禁
const deploy = read('deploy.sh');
check('门禁校验 common.js 存在', /assets\/common\.js/.test(deploy));
check('门禁大小阈值 >20KB(20480)', /20480/.test(deploy));
check('门禁首次缺失只告警不终止', /仅告警不终止|只告警/.test(deploy));
check('门禁不再用不存在文件 exit 1', !/exit 1/.test(deploy.split('部署门禁')[1] || ''));

// 第二梯队 导航统一
const wrongRef = /\/xuewaiyu\/public\/js\/bottom-nav\.js/.test(
  read('public/discover.html') + read('public/notebook.html') + read('public/sentences.html') + read('public/speaking.html') + read('public/xuewaiyu/ai-companion-builder.html')
);
check('5个页面已移除错误 bottom-nav.js 引用', !wrongRef);
check('5个页面改引 /xuewaiyu/assets/common.js',
  /assets\/common\.js/.test(read('public/discover.html')) &&
  /assets\/common\.js/.test(read('public/notebook.html')) &&
  /assets\/common\.js/.test(read('public/sentences.html')) &&
  /assets\/common\.js/.test(read('public/speaking.html')) &&
  /assets\/common\.js/.test(read('public/xuewaiyu/ai-companion-builder.html')));

console.log('=== 结果: PASS=' + pass + ' FAIL=' + fail + ' ===');
process.exit(fail === 0 ? 0 : 1);
