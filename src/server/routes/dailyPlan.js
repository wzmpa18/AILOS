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

module.exports = router;