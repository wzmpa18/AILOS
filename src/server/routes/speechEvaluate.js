/**
 * src/server/routes/speechEvaluate.js
 * 口语评测路由
 *
 * 路由：
 *   POST /api/speech/evaluate  - 提交口语评测
 *   GET  /api/speech/history    - 获取评测历史
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSpeechEvaluateService } = require('../../services/speechEvaluateService');

const speechEvaluateService = getSpeechEvaluateService();

/**
 * POST /api/speech/evaluate
 * 提交口语评测
 * Body: { transcript, referenceText, targetLanguage }
 */
router.post('/evaluate', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { transcript, referenceText, targetLanguage } = req.body;

    if (!transcript || !referenceText || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'transcript, referenceText, and targetLanguage are required',
      });
    }

    const result = await speechEvaluateService.evaluate(
      userId,
      transcript,
      referenceText,
      targetLanguage,
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/speech/history
 * 获取评测历史
 * Query: ?limit=20
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await speechEvaluateService.getHistory(userId, limit);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;