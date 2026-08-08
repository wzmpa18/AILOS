// ============================================================
// src/server/routes/distribution.js
// 两级分销系统路由
// 所有端点均需要 authenticate 中间件
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const distributionService = require('../../services/distributionService');

// 所有分销路由都需要登录认证
router.use(authenticate);

// GET /api/distribution/stats - 分销统计
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await distributionService.getDistributionStats(req.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/distribution/team?page=1&level=direct|indirect - 团队列表
router.get('/team', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const level = req.query.level || 'direct';

    if (!['direct', 'indirect'].includes(level)) {
      return res.status(400).json({ success: false, error: 'Invalid level parameter, use direct or indirect' });
    }

    const result = await distributionService.getTeamMembers(req.userId, level, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/distribution/commissions?page=1 - 佣金明细
router.get('/commissions', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await distributionService.getCommissionRecords(req.userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/distribution/withdraw - 申请提现 { amount, method, account }
router.post('/withdraw', async (req, res, next) => {
  try {
    const { amount, method, account } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }
    if (!method) {
      return res.status(400).json({ success: false, error: 'Withdrawal method is required' });
    }
    if (!account) {
      return res.status(400).json({ success: false, error: 'Withdrawal account is required' });
    }

    const result = await distributionService.requestWithdrawal(req.userId, amount, method, account);
    res.json({ success: true, data: result });
  } catch (error) {
    // 余额不足、金额不足等业务错误返回 400
    if (
      error.message.includes('Minimum withdrawal') ||
      error.message.includes('Insufficient balance') ||
      error.message.includes('Invalid withdrawal method') ||
      error.message.includes('account is required')
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

// GET /api/distribution/withdrawals?page=1 - 提现记录
router.get('/withdrawals', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await distributionService.getWithdrawalRecords(req.userId, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/distribution/leaderboard?type=week|month - 排行榜
router.get('/leaderboard', async (req, res, next) => {
  try {
    const type = req.query.type || 'week';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    if (!['week', 'month'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type parameter, use week or month' });
    }

    const result = await distributionService.getLeaderboard(type, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/distribution/poster - 邀请海报数据
router.get('/poster', async (req, res, next) => {
  try {
    const result = await distributionService.getInvitePosterData(req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
