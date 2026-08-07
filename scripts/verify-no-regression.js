/**
 * scripts/verify-no-regression.js
 * 存量功能零删除核验（宪法总纲红线一）
 * 对比 HEAD 版本与工作区版本，确认关键功能点未丢失。
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
function head(p) {
  try { return execSync(`git show HEAD:${p}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch (e) { return ''; }
}
function work(p) {
  const fp = path.join(ROOT, p);
  return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
}

let fail = 0;
function mustKeep(file, features) {
  const o = head(file);
  const n = work(file);
  if (!o) { console.log(`\n[新增文件] ${file}`); return; }
  console.log(`\n--- ${file} ---`);
  for (const f of features) {
    const had = o.includes(f);
    const has = n.includes(f);
    if (had && !has) {
      fail++;
      console.log(`  [丢失!] ${f}`);
    } else if (had) {
      console.log(`  [保留] ${f}`);
    } else if (has) {
      console.log(`  [新增] ${f}`);
    }
  }
}

mustKeep('public/xuewaiyu/translate.html', [
  'capture="environment"', 'FileReader', 'previewImage', 'translateBtn',
  'uploadArea', '原文', '译文', 'bottom-nav', '拍照',
]);

mustKeep('public/xuewaiyu/game.html', [
  'startGame', 'answerQuiz', 'answerListen', 'checkSpelling',
  'showResult', 'speak', '单词闯关', '拼写测试', '听力挑战',
  'quizResult', 'spellResult', 'listenResult',
]);

mustKeep('public/xuewaiyu/practice.html', [
  'listen_select', 'fill_blank', 'shadow_speak', 'speakCurrent',
  'setDuration', 'apiPost', '/api/practice/sentences', '/api/practice/config',
]);

mustKeep('public/xuewaiyu/profile.html', [
  'deleteAccount', 'confirmDeleteAccount', '退出登录', '语言设置',
]);

mustKeep('public/xuewaiyu/learn.html', ['renderContent', 'loadContent', '/content']);

mustKeep('public/xuewaiyu/about.html', [
  'membership.html', 'terms.html', 'privacy.html', 'support@yandao.vip',
]);

mustKeep('src/server/controllers/practiceController.js', [
  'generateSentences', 'generateFallbackSentences', 'calcSentenceCount', 'aiGateway',
]);

mustKeep('src/server/services/practiceService.js', ['calcSentenceCount', 'baseRate']);

console.log(`\n===== 存量功能核验：${fail} 项丢失 =====\n`);
process.exit(fail > 0 ? 1 : 0);
