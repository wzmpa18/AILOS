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

// v3.2.0: 内容标签映射
const TAG_LABELS = {
  experience: '学习经验',
  study_abroad: '留学移民',
  exam_prep: '备考分享',
  find_partner: '找搭子',
};

// v3.2.0: 获取内容标签列表
router.get('/tags', (req, res) => {
  return ok(res, Object.entries(TAG_LABELS).map(([value, label]) => ({ value, label })));
});

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

// GET /api/v1/social/timeline/feed?page=1&limit=20&type=all|friend|group|system&sort=latest|quality&tag=experience|study_abroad|exam_prep|find_partner
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const type = req.query.type || 'all';
    const sort = req.query.sort || 'latest'; // v3.2.0: latest|quality
    const tag = req.query.tag || ''; // v3.2.0: 内容标签筛选
    const skip = (page - 1) * limit;

    const where = {};
    if (type === 'friend') {
      where.OR = [
        { actorId: req.userId },
        { targetId: req.userId, targetType: 'USER' }
      ];
    }

    // v3.2.0: 内容标签筛选
    if (tag && tag !== 'all') {
      where.tag = tag;
    }

    // v3.2.0: 优质推荐排序 — 优先展示高赞、高收藏、评论多的用户动态
    let orderBy;
    if (sort === 'quality') {
      // 综合热度排序：加精优先 → 点赞数 → 收藏数 → 评论数 → 时间
      orderBy = [
        { isQuality: 'desc' },
        { likeCount: 'desc' },
        { favoriteCount: 'desc' },
        { commentCount: 'desc' },
        { createdAt: 'desc' },
      ];
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    const total = await prisma.socialTimeline.count({ where });
    // P0 FIX: Query more items than needed, then filter out violating content
    const rawItems = await prisma.socialTimeline.findMany({
      where,
      orderBy,
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
        commentCount: item.commentCount || 0,
        // v3.2.0 增量字段
        tag: item.tag || null,
        tagLabel: item.tag ? TAG_LABELS[item.tag] || item.tag : null,
        isQuality: item.isQuality || false,
        favoriteCount: item.favoriteCount || 0,
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

    // v3.2.0: 支持发布时选择内容标签
    const { tag } = req.body;
    const validTags = ['experience', 'study_abroad', 'exam_prep', 'find_partner'];
    const postTag = tag && validTags.includes(tag) ? tag : null;

    const post = await prisma.socialTimeline.create({
      data: {
        actorId: req.userId,
        type: 'post',
        content: content.trim(),
        metadata: JSON.stringify({ images, ...metadata }),
        likeCount: 0,
        commentCount: 0,
        tag: postTag, // v3.2.0: 内容标签
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
      commentCount: 0,
      tag: post.tag,
      tagLabel: post.tag ? TAG_LABELS[post.tag] || post.tag : null,
      isQuality: false,
      favoriteCount: 0,
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

// v3.2.0: POST /api/v1/social/timeline/quality/:id — 管理员加精/取消加精
// Body: { isQuality: true|false }
const { requireAdmin } = require('../middleware/adminAuth');
router.post('/quality/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isQuality } = req.body;
    const post = await prisma.socialTimeline.findUnique({ where: { id: req.params.id } });
    if (!post) return err(res, 'TIMELINE_4010', '动态不存在', 404);

    const updated = await prisma.socialTimeline.update({
      where: { id: req.params.id },
      data: {
        isQuality: isQuality !== false,
        qualityMarkedBy: req.userId,
        qualityMarkedAt: new Date(),
      },
    });

    return ok(res, {
      id: updated.id,
      isQuality: updated.isQuality,
      qualityMarkedBy: updated.qualityMarkedBy,
      qualityMarkedAt: updated.qualityMarkedAt,
    }, isQuality !== false ? '已加精' : '已取消加精');
  } catch (e) {
    console.error(`[Timeline] quality error:`, e.message);
    return err(res, 'TIMELINE_4011', e.message, 500);
  }
});

// v3.2.0: POST /api/v1/social/timeline/favorite/:id — 用户收藏/取消收藏
router.post('/favorite/:id', async (req, res) => {
  try {
    const post = await prisma.socialTimeline.findUnique({ where: { id: req.params.id } });
    if (!post) return err(res, 'TIMELINE_4012', '动态不存在', 404);

    // 收藏数+1或-1（简化实现：每次切换状态）
    const isFavoriting = !req.body.cancel;
    if (isFavoriting) {
      await prisma.socialTimeline.update({
        where: { id: req.params.id },
        data: { favoriteCount: { increment: 1 } },
      });
      return ok(res, { favorited: true, favoriteCount: (post.favoriteCount || 0) + 1 });
    } else {
      await prisma.socialTimeline.update({
        where: { id: req.params.id },
        data: { favoriteCount: { decrement: 1 } },
      });
      return ok(res, { favorited: false, favoriteCount: Math.max(0, (post.favoriteCount || 0) - 1) });
    }
  } catch (e) {
    console.error(`[Timeline] favorite error:`, e.message);
    return err(res, 'TIMELINE_4013', e.message, 500);
  }
});

module.exports = router;
