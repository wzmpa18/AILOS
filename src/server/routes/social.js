/**
 * Stage 9 Community: Social Routes
 * REST endpoints for friend system, group management, messaging, privacy
 * Constitution v2.2.1 §11, Appendix C.5/D.9
 */
const express = require('express');
const router = express.Router();
const { getSocialService } = require('../../services/socialService');
const { authenticate } = require('../middleware/auth');

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

// POST /api/social/friends/add - Add a friend
router.post('/friends/add', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.addFriend(getUid(req), req.body.friendId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// PUT /api/social/friends/:friendId - Update friend settings (remark/tags/mute/block)
router.put('/friends/:friendId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.updateFriendSetting(getUid(req), req.params.friendId, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/social/friends/:friendId - Remove a friend
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
// Group System (M2)
// ============================================================

// POST /api/social/groups - Create a group
router.post('/groups', auth, async (req, res, next) => {
  try {
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

// POST /api/social/groups/:id/members - Add a member to group
router.post('/groups/:id/members', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.addGroupMember(req.params.id, req.body.userId, getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/social/groups/:id/members/:userId - Remove member from group
router.delete('/groups/:id/members/:userId', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const result = await svc.removeGroupMember(req.params.id, req.params.userId, getUid(req));
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// PUT /api/social/groups/:id/mute-all - Toggle mute all
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
// Message System (M3)
// ============================================================

// GET /api/social/conversations - List conversations
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const limit = parseInt(req.query.limit) || 20;
    const result = await svc.getConversations(getUid(req), { limit });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// POST /api/social/messages - Send a message
router.post('/messages', auth, async (req, res, next) => {
  try {
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

// GET /api/social/profile/:uid - View a user's shared profile
router.get('/profile/:uid', auth, async (req, res, next) => {
  try {
    const svc = getSocialService();
    const uid = req.params.uid;
    const result = await svc.searchByUid(getUid(req), uid);
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
