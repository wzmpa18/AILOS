/**
 * src/server/routes/dailyPlan.js
 * 30天口语速成路由
 *
 * 路由：
 *   GET  /api/plan/today     - 获取今日计划
 *   POST /api/plan/generate   - 生成30天计划
 *   POST /api/plan/complete   - 完成当日学习
 *   GET  /api/plan/progress   - 获取进度
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDailyPlanService } = require('../../services/dailyPlanService');

const dailyPlanService = getDailyPlanService();

/**
 * GET /api/plan/today
 * 获取今日学习计划
 */
router.get('/today', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await dailyPlanService.getTodayPlan(userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/plan/generate
 * 生成30天学习计划
 * Body: { targetLanguage, level, duration? }
 */
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { targetLanguage, level, duration } = req.body;

    if (!targetLanguage || !level) {
      return res.status(400).json({
        success: false,
        error: 'targetLanguage and level are required',
      });
    }

    const result = await dailyPlanService.generatePlan(
      userId,
      targetLanguage,
      level,
      duration || 30,
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/plan/complete
 * 完成当日学习
 * Body: { dayNumber, score? }
 */
router.post('/complete', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { dayNumber, score } = req.body;

    if (!dayNumber) {
      return res.status(400).json({
        success: false,
        error: 'dayNumber is required',
      });
    }

    const result = await dailyPlanService.completeDay(userId, dayNumber, score || 0);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/plan/progress
 * 获取30天学习进度
 */
router.get('/progress', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const result = await dailyPlanService.getProgress(userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// P3 任务4.3: 发音评测提交（零AI调用，纯规则打分）
router.post('/pronunciation', authenticate, async (req, res) => {
  try {
    const { text, language, duration, size } = req.body;
    if (!text) return res.status(400).json({ success: false, error: '缺少文本内容' });

    const result = dailyPlanService.evaluatePronunciation(
      { duration: duration || 0, size: size || 0 },
      text,
      language || 'ja'
    );

    if (result.level === '待加强') {
      await dailyPlanService.syncWrongItems(req.user.userId, [{
        word: text, type: 'speaking', content: text,
        language: language || 'ja', level: '待加强',
        itemId: 'pron_' + text.substring(0, 20)
      }]);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Pronunciation evaluation failed:', error.message);
    res.status(500).json({ success: false, error: '发音评测失败，请重试' });
  }
});

// P3 任务4.3: 错题批量同步复习队列
router.post('/sync-wrong', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, error: '缺少错题数据' });

    const count = await dailyPlanService.syncWrongItems(req.user.userId, items);
    res.json({ success: true, data: { synced: count } });
  } catch (error) {
    logger.error('Wrong items sync failed:', error.message);
    res.status(500).json({ success: false, error: '错题同步失败' });
  }
});

module.exports = router;