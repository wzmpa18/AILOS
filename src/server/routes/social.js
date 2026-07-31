/**
 * Stage 9 Community: Social Routes
 * REST endpoints for friend system, group management, messaging, privacy
 * Constitution v2.2.1 §11, Appendix C.5/D.9
 */
const express = require('express');
const router = express.Router();
const { getSocialService } = require('../../services/socialService');
const { authenticate } = require('../middleware/auth');
const contentFilter = require('../../utils/contentFilter');

// ============================================================
// Auth middleware wrapper
// ============================================================
function auth(req, res, next) {
  authenticate(req, res, next);
}

function getUid(req) {
  return req.user?.id || req.user?.userId || null;
}

// ============================================================
// Privacy Settings (M1)
// ============================================================

// GET /api/social/privacy - Get current user's privacy settings
router.get('/privacy', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const settings = await svc.getPrivacy(getUid(req));
    res.json({ success: true, data: settings });
  } catch (e) {
    next(e);
  }
});

// PUT /api/social/privacy - Update privacy settings
router.put('/privacy', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.updatePrivacy(getUid(req), req.body);
    // Stage 9 S3: Clear Redis cache on privacy change
    try {
      const redis = require('../../config/redis');
      const userId = getUid(req);
      await redis.del(`profile:${userId}`);
      await redis.del(`feed:${userId}`);
    } catch (cacheErr) {
      console.warn(`[Privacy] cache clear: ${cacheErr.message}`);
    }
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// Friend System (M1)
// ============================================================

// GET /api/social/friends - List friends with optional tag/search filters
router.get('/friends', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getFriendList(getUid(req), {
      tag: req.query.tag,
      search: req.query.search,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/friends/search-by-uid - Search user by UID
router.get('/friends/search-by-uid', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.searchByUid(getUid(req), req.query.uid);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/friends/search-by-nickname - Search user by nickname (privacy-aware)
router.get('/friends/search-by-nickname', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.searchByNickname(getUid(req), req.query.q || '');
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// POST /api/social/friends/add - Send friend request
router.post('/friends/add', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.addFriend(getUid(req), req.body.friendId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// PUT /api/social/friends/:friendId - Update friend settings (tag/alias)
router.put('/friends/:friendId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.updateFriendSetting(getUid(req), req.params.friendId, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/social/friends/:friendId - Remove friend
router.delete('/friends/:friendId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.removeFriend(getUid(req), req.params.friendId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// Group Management (M1)
// ============================================================

// POST /api/social/groups - Create a group
router.post('/groups', auth, async (req, res, next) => {
  try {
    // Stage 9 VETO: 群组名称敏感词过滤
    if (req.body.name) {
      const filterResult = contentFilter.auditAndFilter(req.body.name, {
        userId: getUid(req),
        scene: 'group_name',
        endpoint: '/api/v1/social/group',
        clientIP: req.ip || req.connection?.remoteAddress,
      });
      if (!filterResult.passed) {
        return res.status(filterResult.details?.severity === 'severe' ? 403 : 400).json(filterResult.errorResponse || { success: false, code: 9004, error: 'Group name contains prohibited content' });
      }
    }
    const svc = getSocialService();
    const result = await svc.createGroup(getUid(req), req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/groups - List my groups
router.get('/groups', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getMyGroups(getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/groups/:id - Get group detail
router.get('/groups/:id', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getGroupDetail(req.params.id, getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/groups/:id/members - List group members
router.get('/groups/:id/members', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getGroupMembers(req.params.id);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// POST /api/social/groups/:id/members - Join group / add member
router.post('/groups/:id/members', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.addGroupMember(req.params.id, getUid(req), req.body.userId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/social/groups/:id/members/:userId - Remove member / leave group
router.delete('/groups/:id/members/:userId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.removeGroupMember(req.params.id, getUid(req), req.params.userId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// PUT /api/social/groups/:id/mute-all - Toggle mute-all (group announcement)
router.put('/groups/:id/mute-all', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.toggleMuteAll(req.params.id, getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// Messaging (M1)
// ============================================================

// GET /api/social/conversations - List conversations
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getConversations(getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// POST /api/social/messages - Send message
router.post('/messages', auth, async (req, res, next) => {
  try {
    // Stage 9 VETO: 消息内容敏感词过滤
    if (req.body.content) {
      const filterResult = contentFilter.auditAndFilter(req.body.content, {
        userId: getUid(req),
        scene: 'message',
        endpoint: '/api/v1/social/message',
        clientIP: req.ip || req.connection?.remoteAddress,
      });
      if (!filterResult.passed) {
        return res.status(filterResult.details?.severity === 'severe' ? 403 : 400).json(filterResult.errorResponse || { success: false, code: 9004, error: 'Message contains prohibited content' });
      }
    }
    const svc = getSocialService();
    const result = await svc.sendMessage(getUid(req), req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/messages/:conversationId - Get messages in conversation
router.get('/messages/:conversationId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const result = await svc.getMessages(req.params.conversationId, getUid(req), { page, limit });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// POST /api/social/messages/:messageId/revoke - Revoke a message
router.post('/messages/:messageId/revoke', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.revokeMessage(req.params.messageId, getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// User Profile & Share (P0-5: Share Profile)
// ============================================================

// GET /api/social/profile - Get current user's own profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getMyProfile(getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/profile/:uid - View user profile (Stage 9 S3: privacy-aware)
router.get('/profile/:uid', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.getUserProfile(getUid(req), req.params.uid);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// GET /api/social/share-link - Generate share link for current user
router.get('/share-link', auth, async (req, res, next) => {
  try {
    const userId = getUid(req);
    const prisma = require('../../config/database');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { uniqueId: true, nickname: true, avatar: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const shareUrl = `https://yandao.vip/xuewaiyu/profile.html?share=${encodeURIComponent(user.uniqueId)}`;
    // QR code via qrserver API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    res.json({
      success: true,
      data: {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        avatar: user.avatar,
        shareUrl,
        qrCodeUrl: qrUrl,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================
// SocialError handler
// ============================================================
const { SocialError } = require('../../services/socialService');
router.use((err, req, res, next) => {
  if (err instanceof SocialError) {
    return res.status(err.status || 400).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }
  next(err);
});

module.exports = router;
