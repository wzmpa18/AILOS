// ============================================================
// src/server/routes/news.js
// v3.2.0 站外资讯API路由
// Mounted at /api/v1/news
// 对齐《双宪法v3.2.0》社交域资讯聚合条款
// 合规声明：仅展示标题+摘要+来源+原文链接，绝不全文转载
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const newsService = require('../../services/newsService');
const newsAggregator = require('../../services/newsAggregatorService');
const logger = require('../../utils/logger');

// Helpers
function ok(res, data, message) {
  const body = { success: true };
  if (data !== undefined && data !== null) body.data = data;
  if (message) body.message = message;
  return res.json(body);
}
function err(res, code, message, status = 400) {
  return res.status(status).json({ success: false, error: code, message });
}

// ============================================================
// 公开接口（无需登录）：资讯列表、详情、分类
// ============================================================

// GET /api/v1/news/list?page=1&limit=20&category=all&keyword=&sort=latest|hot
router.get('/list', async (req, res) => {
  try {
    const result = await newsService.getNewsList({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category || 'all',
      keyword: req.query.keyword || '',
      sort: req.query.sort || 'latest',
    });
    return ok(res, result);
  } catch (e) {
    logger.error('[news] list error:', e.message);
    return err(res, 'NEWS_5001', e.message, 500);
  }
});

// GET /api/v1/news/detail/:id
router.get('/detail/:id', async (req, res) => {
  try {
    const article = await newsService.getNewsDetail(req.params.id);
    if (!article) return err(res, 'NEWS_4001', '资讯不存在或未通过审核', 404);
    return ok(res, article);
  } catch (e) {
    logger.error('[news] detail error:', e.message);
    return err(res, 'NEWS_5002', e.message, 500);
  }
});

// GET /api/v1/news/categories
router.get('/categories', (req, res) => {
  return ok(res, newsService.getCategories());
});

// ============================================================
// 需登录接口：举报
// ============================================================

// POST /api/v1/news/report/:id
// Body: { reason: violation|ad|infringement|other, detail: string }
router.post('/report/:id', authenticate, async (req, res) => {
  try {
    const { reason, detail } = req.body;
    if (!reason) return err(res, 'NEWS_4002', '请选择举报原因', 400);

    const result = await newsService.reportArticle(
      req.params.id,
      req.userId,
      reason,
      detail
    );

    if (!result.success) return err(res, 'NEWS_4003', result.message, 400);
    return ok(res, null, result.message);
  } catch (e) {
    logger.error('[news] report error:', e.message);
    return err(res, 'NEWS_5003', e.message, 500);
  }
});

// ============================================================
// 管理员接口：手动触发抓取
// ============================================================

// POST /api/v1/news/crawl
// Body: { enableAI?: false }
const { requireAdmin } = require('../middleware/adminAuth');
router.post('/crawl', authenticate, requireAdmin, async (req, res) => {
  try {
    const { enableAI = false } = req.body;
    const result = await newsAggregator.crawlAll({ enableAI });
    return ok(res, result, '抓取完成');
  } catch (e) {
    logger.error('[news] crawl error:', e.message);
    return err(res, 'NEWS_5004', e.message, 500);
  }
});

module.exports = router;
