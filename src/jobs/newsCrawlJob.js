// ============================================================
// src/jobs/newsCrawlJob.js
// v3.2.0 站外资讯定时增量抓取任务
// 调度：默认每日 06:00 和 18:00 各执行一次（可用 NEWS_CRAWL_CRON 覆盖）
// 对齐《双宪法v3.2.0》：
//   - 前置禁令3：不高频请求，每日固定时段更新
//   - 任务五：默认关闭AI深度处理，零AI额度消耗
//   - 频次限制：单来源每日请求不超过限定次数
// ============================================================
const cron = require('node-cron');
const logger = require('../utils/logger');
const newsAggregator = require('../services/newsAggregatorService');
const newsFilter = require('../services/newsFilterService');

let _task = null;

/**
 * 执行一轮抓取
 */
async function runOnce() {
  const startedAt = Date.now();
  logger.info('[newsCrawlJob] 定时资讯抓取任务开始');

  try {
    // 整改5：使用全局AI开关状态（管理员可通过后台/api/admin/news/ai-toggle动态切换）
    const enableAI = newsFilter.getAIEnabled();
    const result = await newsAggregator.crawlAll({ enableAI });

    logger.info('[newsCrawlJob] 抓取完成', {
      durationMs: Date.now() - startedAt,
      ...result,
    });

    return result;
  } catch (e) {
    logger.error('[newsCrawlJob] 抓取失败:', e.message);
    throw e;
  }
}

/**
 * 启动定时任务
 */
function start() {
  // 测试环境不启动
  if (process.env.NODE_ENV === 'test') return null;

  // 支持环境变量禁用
  if (process.env.NEWS_CRAWL_JOB_DISABLED === '1') {
    logger.info('[newsCrawlJob] 已通过环境变量禁用');
    return null;
  }

  // 默认每日 06:00 和 18:00 各执行一次
  const expr = process.env.NEWS_CRAWL_CRON || '0 6,18 * * *';
  if (!cron.validate(expr)) {
    logger.error(`[newsCrawlJob] 非法 cron 表达式: ${expr}，任务未启动`);
    return null;
  }

  if (_task) return _task;

  _task = cron.schedule(expr, () => {
    runOnce().catch(() => {});
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  logger.info(`[newsCrawlJob] 已调度，cron="${expr}" tz="${process.env.TZ || 'Asia/Shanghai'}"`);
  return _task;
}

/**
 * 停止定时任务
 */
function stop() {
  if (_task) {
    _task.stop();
    _task = null;
  }
}

module.exports = { start, stop, runOnce };
