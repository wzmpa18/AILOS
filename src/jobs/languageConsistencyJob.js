// ============================================================
// src/jobs/languageConsistencyJob.js
// P2 任务二：每日凌晨双语言一致性巡检定时任务
// 规则：全量校验 → 自动归一化轻度漂移（窗口期外）→ 重度冲突生成 P2_ALERT 并同步账簿
// 调度：默认每日 03:00（可用 LANG_CONSISTENCY_CRON 覆盖）
// ============================================================
const cron = require('node-cron');
const logger = require('../utils/logger');
const svc = require('../services/languageConsistencyService');

let _task = null;

async function runOnce() {
  const startedAt = Date.now();
  logger.info('[langConsistencyJob] 每日一致性巡检开始');
  try {
    const result = await svc.checkAll({ operator: 'system' });
    logger.info('[langConsistencyJob] 巡检完成', {
      runId: result.runId,
      durationMs: Date.now() - startedAt,
      stats: result.stats,
    });
    return result;
  } catch (e) {
    logger.error('[langConsistencyJob] 巡检失败:', e.message);
    throw e;
  }
}

function start() {
  // 测试环境不启动
  if (process.env.NODE_ENV === 'test') return null;
  if (process.env.LANG_CONSISTENCY_JOB_DISABLED === '1') {
    logger.info('[langConsistencyJob] 已通过环境变量禁用');
    return null;
  }
  const expr = process.env.LANG_CONSISTENCY_CRON || '0 3 * * *';
  if (!cron.validate(expr)) {
    logger.error(`[langConsistencyJob] 非法 cron 表达式: ${expr}，任务未启动`);
    return null;
  }
  if (_task) return _task;
  _task = cron.schedule(expr, () => {
    runOnce().catch(() => {});
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });
  logger.info(`[langConsistencyJob] 已调度，cron="${expr}" tz="${process.env.TZ || 'Asia/Shanghai'}"`);
  return _task;
}

function stop() {
  if (_task) {
    _task.stop();
    _task = null;
  }
}

module.exports = { start, stop, runOnce };
