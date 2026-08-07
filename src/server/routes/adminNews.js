// ============================================================
// src/server/routes/adminNews.js
// v3.2.0 后台资讯管理路由
// Mounted at /api/admin/news
// 功能：来源管理、内容审核、置顶、广告投放、违规下架、举报处理、审计日志
// 全部路由：authenticate → requireAdmin
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const newsFilter = require('../../services/newsFilterService');

// 全部路由需要管理员权限
router.use(authenticate, requireAdmin);

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

/**
 * 记录审计日志
 */
async function writeAuditLog(articleId, operatorId, action, beforeState, afterState, detail) {
  try {
    await prisma.newsAuditLog.create({
      data: {
        articleId: articleId || null,
        operatorId,
        action,
        beforeState: beforeState || null,
        afterState: afterState || null,
        detail: detail ? (typeof detail === 'string' ? { text: detail } : detail) : null,
      },
    });
  } catch (e) {
    logger.error('[adminNews] 审计日志写入失败:', e.message);
  }
}

// ============================================================
// 资讯来源管理
// ============================================================

// GET /api/admin/news/sources — 来源列表
router.get('/sources', async (req, res) => {
  try {
    const sources = await prisma.newsSource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, sources);
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5001', e.message, 500);
  }
});

// POST /api/admin/news/sources — 新增来源
router.post('/sources', async (req, res) => {
  try {
    const { name, url, feedUrl, category, language, isActive, isWhitelist, dailyLimit, metadata } = req.body;
    if (!name || !url) return err(res, 'ADMIN_NEWS_4001', '来源名称和URL不能为空', 400);

    const source = await prisma.newsSource.create({
      data: {
        name, url, feedUrl: feedUrl || null,
        category: category || 'general',
        language: language || 'zh-CN',
        isActive: isActive !== false,
        isWhitelist: isWhitelist === true,
        dailyLimit: dailyLimit || 10,
        metadata: metadata || null,
      },
    });

    await writeAuditLog(null, req.userId, 'source_create', null, source.id, { name, url });
    return ok(res, source, '来源创建成功');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5002', e.message, 500);
  }
});

// PUT /api/admin/news/sources/:id — 更新来源
router.put('/sources/:id', async (req, res) => {
  try {
    const existing = await prisma.newsSource.findUnique({ where: { id: req.params.id } });
    if (!existing) return err(res, 'ADMIN_NEWS_4002', '来源不存在', 404);

    const { name, url, feedUrl, category, language, isActive, isWhitelist, isBlacklist, dailyLimit, metadata } = req.body;
    const updated = await prisma.newsSource.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        url: url || undefined,
        feedUrl: feedUrl !== undefined ? feedUrl : undefined,
        category: category || undefined,
        language: language || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isWhitelist: isWhitelist !== undefined ? isWhitelist : undefined,
        isBlacklist: isBlacklist !== undefined ? isBlacklist : undefined,
        dailyLimit: dailyLimit || undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    });

    await writeAuditLog(null, req.userId, 'source_update', existing.isBlacklist ? 'blacklisted' : 'active', updated.isBlacklist ? 'blacklisted' : 'active', { sourceId: req.params.id, changes: req.body });
    return ok(res, updated, '来源更新成功');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5003', e.message, 500);
  }
});

// POST /api/admin/news/sources/:id/block — 拉黑来源
router.post('/sources/:id/block', async (req, res) => {
  try {
    const existing = await prisma.newsSource.findUnique({ where: { id: req.params.id } });
    if (!existing) return err(res, 'ADMIN_NEWS_4003', '来源不存在', 404);

    await prisma.newsSource.update({
      where: { id: req.params.id },
      data: { isBlacklist: true, isActive: false },
    });

    await writeAuditLog(null, req.userId, 'source_block', 'active', 'blacklisted', { sourceId: req.params.id, sourceName: existing.name });
    return ok(res, null, '来源已拉黑');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5004', e.message, 500);
  }
});

// POST /api/admin/news/sources/:id/unblock — 解除拉黑
router.post('/sources/:id/unblock', async (req, res) => {
  try {
    await prisma.newsSource.update({
      where: { id: req.params.id },
      data: { isBlacklist: false, isActive: true },
    });

    await writeAuditLog(null, req.userId, 'source_unblock', 'blacklisted', 'active', { sourceId: req.params.id });
    return ok(res, null, '来源已解除拉黑');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5005', e.message, 500);
  }
});

// DELETE /api/admin/news/sources/:id — 删除来源
router.delete('/sources/:id', async (req, res) => {
  try {
    const existing = await prisma.newsSource.findUnique({ where: { id: req.params.id } });
    if (!existing) return err(res, 'ADMIN_NEWS_4004', '来源不存在', 404);

    await prisma.newsSource.delete({ where: { id: req.params.id } });
    await writeAuditLog(null, req.userId, 'source_delete', 'exists', 'deleted', { sourceId: req.params.id, sourceName: existing.name });
    return ok(res, null, '来源已删除');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5006', e.message, 500);
  }
});

// ============================================================
// 资讯内容审核与管理
// ============================================================

// GET /api/admin/news/articles — 资讯列表（含待审核）
router.get('/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const status = req.query.status || undefined;
    const category = req.query.category || undefined;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (category && category !== 'all') where.category = category;

    const [total, items] = await Promise.all([
      prisma.newsArticle.count({ where }),
      prisma.newsArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          source: { select: { id: true, name: true, isWhitelist: true } },
        },
      }),
    ]);

    return ok(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5007', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/approve — 审核通过
router.post('/articles/:id/approve', async (req, res) => {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    if (!article) return err(res, 'ADMIN_NEWS_4005', '资讯不存在', 404);

    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: req.userId,
      },
    });

    await writeAuditLog(req.params.id, req.userId, 'approve', article.status, 'approved');
    return ok(res, updated, '审核通过');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5008', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/reject — 审核拒绝
router.post('/articles/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    if (!article) return err(res, 'ADMIN_NEWS_4006', '资讯不存在', 404);

    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: req.userId,
        adReason: reason || 'admin_rejected',
      },
    });

    await writeAuditLog(req.params.id, req.userId, 'reject', article.status, 'rejected', { reason });
    return ok(res, updated, '已拒绝');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5009', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/offline — 下架
router.post('/articles/:id/offline', async (req, res) => {
  try {
    const { reason } = req.body;
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    if (!article) return err(res, 'ADMIN_NEWS_4007', '资讯不存在', 404);

    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: {
        status: 'offline',
        adReason: reason || 'admin_offline',
      },
    });

    await writeAuditLog(req.params.id, req.userId, 'offline', article.status, 'offline', { reason });
    return ok(res, updated, '已下架');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5010', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/pin — 置顶
router.post('/articles/:id/pin', async (req, res) => {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    if (!article) return err(res, 'ADMIN_NEWS_4008', '资讯不存在', 404);

    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: { isPinned: true },
    });

    await writeAuditLog(req.params.id, req.userId, 'pin', `pinned:${article.isPinned}`, 'pinned:true');
    return ok(res, updated, '已置顶');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5011', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/unpin — 取消置顶
router.post('/articles/:id/unpin', async (req, res) => {
  try {
    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: { isPinned: false },
    });

    await writeAuditLog(req.params.id, req.userId, 'unpin', 'pinned:true', 'pinned:false');
    return ok(res, updated, '已取消置顶');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5012', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/ad-place — 投放官方广告
router.post('/articles/:id/ad-place', async (req, res) => {
  try {
    const article = await prisma.newsArticle.findUnique({
      where: { id: req.params.id },
      include: { source: { select: { isWhitelist: true } } },
    });
    if (!article) return err(res, 'ADMIN_NEWS_4009', '资讯不存在', 404);

    // 仅白名单来源的官方广告允许展示
    if (!article.source?.isWhitelist) {
      return err(res, 'ADMIN_NEWS_4010', '仅白名单来源可投放官方广告', 400);
    }

    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: { isOfficialAd: true },
    });

    await writeAuditLog(req.params.id, req.userId, 'ad_place', `ad:false`, 'ad:true');
    return ok(res, updated, '官方广告已投放');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5013', e.message, 500);
  }
});

// POST /api/admin/news/articles/:id/ad-remove — 撤销官方广告
router.post('/articles/:id/ad-remove', async (req, res) => {
  try {
    const updated = await prisma.newsArticle.update({
      where: { id: req.params.id },
      data: { isOfficialAd: false },
    });

    await writeAuditLog(req.params.id, req.userId, 'ad_remove', 'ad:true', 'ad:false');
    return ok(res, updated, '官方广告已撤销');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5014', e.message, 500);
  }
});

// ============================================================
// 举报处理
// ============================================================

// GET /api/admin/news/reports — 举报列表
router.get('/reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const status = req.query.status || 'pending';
    const skip = (page - 1) * limit;

    const where = {};
    if (status !== 'all') where.status = status;

    const [total, items] = await Promise.all([
      prisma.newsReport.count({ where }),
      prisma.newsReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          article: { select: { id: true, title: true, originalUrl: true, status: true } },
          reporter: { select: { id: true, nickname: true } },
        },
      }),
    ]);

    return ok(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5015', e.message, 500);
  }
});

// POST /api/admin/news/reports/:id/resolve — 处理举报
router.post('/reports/:id/resolve', async (req, res) => {
  try {
    const { action, reason } = req.body; // action: resolve|dismiss
    const report = await prisma.newsReport.findUnique({ where: { id: req.params.id } });
    if (!report) return err(res, 'ADMIN_NEWS_4011', '举报记录不存在', 404);

    await prisma.newsReport.update({
      where: { id: req.params.id },
      data: { status: action === 'dismiss' ? 'dismissed' : 'resolved' },
    });

    // 如果确认违规，自动下架文章
    if (action === 'resolve') {
      await prisma.newsArticle.update({
        where: { id: report.articleId },
        data: { status: 'offline', adReason: reason || 'report_confirmed' },
      });
      await writeAuditLog(report.articleId, req.userId, 'offline', 'approved', 'offline', { reason: 'report_confirmed', reportId: req.params.id });
    }

    return ok(res, null, action === 'dismiss' ? '举报已驳回' : '举报已处理，文章已下架');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5016', e.message, 500);
  }
});

// ============================================================
// 审计日志
// ============================================================

// GET /api/admin/news/audit-logs — 审计日志列表
router.get('/audit-logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const action = req.query.action || undefined;
    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;

    const [total, items] = await Promise.all([
      prisma.newsAuditLog.count({ where }),
      prisma.newsAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          operator: { select: { id: true, nickname: true } },
          article: { select: { id: true, title: true } },
        },
      }),
    ]);

    return ok(res, {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5017', e.message, 500);
  }
});

// ============================================================
// 统计面板
// ============================================================

// GET /api/admin/news/stats — 统计概览
router.get('/stats', async (req, res) => {
  try {
    const [
      totalSources,
      activeSources,
      totalArticles,
      pendingArticles,
      approvedArticles,
      totalReports,
      pendingReports,
      aiCalls,
    ] = await Promise.all([
      prisma.newsSource.count(),
      prisma.newsSource.count({ where: { isActive: true, isBlacklist: false } }),
      prisma.newsArticle.count(),
      prisma.newsArticle.count({ where: { status: 'pending' } }),
      prisma.newsArticle.count({ where: { status: 'approved' } }),
      prisma.newsReport.count(),
      prisma.newsReport.count({ where: { status: 'pending' } }),
      prisma.newsArticle.aggregate({ _sum: { aiCallCount: true } }),
    ]);

    return ok(res, {
      sources: { total: totalSources, active: activeSources },
      articles: { total: totalArticles, pending: pendingArticles, approved: approvedArticles },
      reports: { total: totalReports, pending: pendingReports },
      aiCalls: { total: aiCalls._sum.aiCallCount || 0, enabled: newsFilter.getAIEnabled() },
    });
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5018', e.message, 500);
  }
});

// ============================================================
// 全局AI开关（整改5：支持管理员动态切换AI辅助过滤）
// ============================================================

// GET /api/admin/news/ai-status — 获取全局AI开关状态
router.get('/ai-status', async (req, res) => {
  try {
    return ok(res, { aiEnabled: newsFilter.getAIEnabled() });
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5019', e.message, 500);
  }
});

// POST /api/admin/news/ai-toggle — 切换全局AI开关
// Body: { enabled: true|false }
router.post('/ai-toggle', async (req, res) => {
  try {
    const { enabled } = req.body;
    const beforeState = newsFilter.getAIEnabled();
    newsFilter.setAIEnabled(enabled !== false);
    const afterState = newsFilter.getAIEnabled();

    await writeAuditLog(null, req.userId, 'ai_toggle', String(beforeState), String(afterState), { enabled: afterState });

    logger.info(`[adminNews] AI开关切换: ${beforeState} → ${afterState} (操作人: ${req.userId})`);
    return ok(res, { aiEnabled: afterState }, afterState ? 'AI辅助过滤已开启' : 'AI辅助过滤已关闭');
  } catch (e) {
    return err(res, 'ADMIN_NEWS_5020', e.message, 500);
  }
});

module.exports = router;
