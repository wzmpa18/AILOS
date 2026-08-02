/**
 * Stage 9 M5: Social Timeline Routes (动态模块)
 * Mounted at /api/v1/social/timeline
 * Constitution v2.2.1 §11
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const contentFilter = require('../../utils/contentFilter');

const prisma = new PrismaClient();

// Default avatar URL
const DEFAULT_AVATAR = '/assets/images/default_avatar.png';

// All routes require auth
router.use(authenticate);

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

// GET /api/v1/social/timeline/feed?page=1&limit=20&type=all|friend|group|system
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const type = req.query.type || 'all';
    const skip = (page - 1) * limit;

    const where = {};
    if (type === 'friend') {
      where.OR = [
        { actorId: req.userId },
        { targetId: req.userId, targetType: 'USER' }
      ];
    }

    const total = await prisma.socialTimeline.count({ where });
    // P0 FIX: Query more items than needed, then filter out violating content
    const rawItems = await prisma.socialTimeline.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit * 2,  // Fetch 2x to compensate for filtered items
      include: {
        actor: { select: { id: true, nickname: true, avatar: true } }
      }
    });

    // P0 FIX: Filter out content that fails contentFilter audit
    const items = rawItems.filter(item => {
      if (!item.content) return true;
      const audit = contentFilter.auditAndFilter(item.content, {
        userId: req.userId,
        scene: 'feed_display',
        endpoint: '/api/v1/social/timeline/feed',
      });
      return audit.passed;
    }).slice(0, limit);  // Return exactly 'limit' items after filtering

    // Stage 9 S3 VETO: privacy filter - exclude allowDiscover=false users
    const actorIds = [...new Set(items.map(i => i.actor?.id).filter(Boolean))];
    const privacyUsers = await prisma.user.findMany({
      where: { id: { in: actorIds }, privacySettings: { not: null } },
      select: { id: true, privacySettings: true },
    });
    const hiddenIds = new Set();
    for (const u of privacyUsers) {
      try {
        const ps = typeof u.privacySettings === "string" ? JSON.parse(u.privacySettings) : u.privacySettings;
        if (ps && ps.allowDiscover === false) hiddenIds.add(u.id);
      } catch {}
    }
    const filteredItems = hiddenIds.size > 0
      ? items.filter(i => !i.actor || !hiddenIds.has(i.actor.id))
      : items;

    return ok(res, {
      items: filteredItems.map(item => ({
        id: item.id,
        actor: item.actor ? {
          id: item.actor.id,
          nickname: item.actor.nickname,
          avatar: item.actor.avatar || DEFAULT_AVATAR
        } : null,
        type: item.type,
        content: item.content,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
        createdAt: item.createdAt,
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (e) {
    console.error(`[Timeline] feed error:`, e.message);
    return err(res, 'TIMELINE_4001', e.message, 500);
  }
});

// POST /api/v1/social/timeline/post
// Body: { content, type?, images?, metadata? }
router.post('/post', async (req, res) => {
  try {
    const { content, type = 'text', images = [], metadata } = req.body;
    if (!content || !content.trim()) {
      return err(res, 'TIMELINE_4002', '内容不能为空', 400);
    }
    if (content.length > 2000) {
      return err(res, 'TIMELINE_4003', '内容不能超过2000字', 400);
    }

    // Stage 9 S3: 敏感词过滤
    const filterResult = contentFilter.auditAndFilter(content, {
      userId: req.userId,
      scene: "post",
      endpoint: "/api/v1/social/timeline/post",
      clientIP: req.ip || req.connection?.remoteAddress,
    });
    if (!filterResult.passed) {
      const httpCode = filterResult.details?.severity === 'severe' ? 403 : 400;
      return res.status(httpCode).json(filterResult.errorResponse || { success: false, code: 9004, error: 'content blocked' });
    }

    const post = await prisma.socialTimeline.create({
      data: {
        actorId: req.userId,
        type: 'post',
        content: content.trim(),
        metadata: JSON.stringify({ images, ...metadata }),
        likeCount: 0,
        commentCount: 0
      },
      include: {
        actor: { select: { id: true, nickname: true, avatar: true } }
      }
    });

    return ok(res, {
      id: post.id,
      actor: post.actor ? {
        id: post.actor.id,
        nickname: post.actor.nickname,
        avatar: post.actor.avatar || DEFAULT_AVATAR
      } : null,
      type: post.type,
      content: post.content,
      metadata: JSON.parse(post.metadata),
      createdAt: post.createdAt,
      likeCount: 0,
      commentCount: 0
    }, '发布成功');
  } catch (e) {
    console.error(`[Timeline] post error:`, e.message);
    return err(res, 'TIMELINE_4004', e.message, 500);
  }
});

// DELETE /api/v1/social/timeline/post/:id
router.delete('/post/:id', async (req, res) => {
  try {
    const post = await prisma.socialTimeline.findUnique({ where: { id: req.params.id } });
    if (!post) return err(res, 'TIMELINE_4005', '动态不存在', 404);
    if (post.actorId !== req.userId) return err(res, 'TIMELINE_4006', '无权删除', 403);

    await prisma.socialTimeline.delete({ where: { id: req.params.id } });
    return ok(res, null, '已删除');
  } catch (e) {
    console.error(`[Timeline] delete error:`, e.message);
    return err(res, 'TIMELINE_4007', e.message, 500);
  }
});

// POST /api/v1/social/timeline/like/:id
router.post('/like/:id', async (req, res) => {
  try {
    const post = await prisma.socialTimeline.findUnique({ where: { id: req.params.id } });
    if (!post) return err(res, 'TIMELINE_4008', '动态不存在', 404);

    const existing = await prisma.socialTimelineLike.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.userId } }
    });

    if (existing) {
      await prisma.socialTimelineLike.delete({ where: { id: existing.id } });
      await prisma.socialTimeline.update({
        where: { id: req.params.id },
        data: { likeCount: { decrement: 1 } }
      });
      return ok(res, { liked: false, likeCount: Math.max(0, post.likeCount - 1) });
    }

    await prisma.socialTimelineLike.create({
      data: { postId: req.params.id, userId: req.userId }
    });
    await prisma.socialTimeline.update({
      where: { id: req.params.id },
      data: { likeCount: { increment: 1 } }
    });
    return ok(res, { liked: true, likeCount: (post.likeCount || 0) + 1 });
  } catch (e) {
    console.error(`[Timeline] like error:`, e.message);
    return err(res, 'TIMELINE_4009', e.message, 500);
  }
});

module.exports = router;
