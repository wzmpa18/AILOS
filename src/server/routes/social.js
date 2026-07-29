/**
 * Stage 9 Community: Social Routes
 * All routes mounted at /api/v1/social
 * Constitution v2.2.0 §11, Appendix D.9
 */
const express = require('express');
const router = express.Router();
const { getSocialService } = require('../../services/socialService');
const { authenticate } = require('../middleware/auth');
const logger = require('../../utils/logger');

// All social routes require authentication
router.use(authenticate);

// Response helpers
function ok(res, data = null, message) {
  const body = { success: true };
  if (data !== null && data !== undefined) body.data = data;
  if (message) body.message = message;
  return res.json(body);
}

function err(res, code, message, status = 400) {
  return res.status(status).json({ success: false, error: code, message });
}

// ============================================================
// Friend System (M1)
// ============================================================

/**
 * GET /api/v1/social/friend/search-by-uid?uid=xxx
 * Search user by unique ID with privacy check
 */
router.get('/friend/search-by-uid', async (req, res) => {
  try {
    const { uid } = req.query;
    const social = getSocialService();
    const result = await social.searchByUid(req.userId, uid);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] search-by-uid error: ${e.message}`);
    return err(res, e.code || 'FRIEND_5099', e.message, e.status || 400);
  }
});

/**
 * POST /api/v1/social/friend/add
 * Body: { friendId: "uuid" }
 */
router.post('/friend/add', async (req, res) => {
  try {
    const { friendId } = req.body;
    const social = getSocialService();
    const result = await social.addFriend(req.userId, friendId);
    return ok(res, result, '好友添加成功');
  } catch (e) {
    logger.error(`[Social] add-friend error: ${e.message}`);
    return err(res, e.code || 'FRIEND_5099', e.message, e.status || 400);
  }
});

/**
 * GET /api/v1/social/friend/list
 * Query: tag, search
 */
router.get('/friend/list', async (req, res) => {
  try {
    const { tag, search } = req.query;
    const social = getSocialService();
    const result = await social.getFriendList(req.userId, { tag, search });
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] friend-list error: ${e.message}`);
    return err(res, e.code || 'FRIEND_5099', e.message, e.status || 400);
  }
});

/**
 * PUT /api/v1/social/friend/setting
 * Body: { friendId, remarkName?, tags?, isMuted?, isBlocked? }
 */
router.put('/friend/setting', async (req, res) => {
  try {
    const { friendId, remarkName, tags, isMuted, isBlocked } = req.body;
    const social = getSocialService();
    const result = await social.updateFriendSetting(req.userId, friendId, {
      remarkName,
      tags,
      isMuted,
      isBlocked,
    });
    return ok(res, result, '好友设置已更新');
  } catch (e) {
    logger.error(`[Social] friend-setting error: ${e.message}`);
    return err(res, e.code || 'FRIEND_5099', e.message, e.status || 400);
  }
});

/**
 * DELETE /api/v1/social/friend/:friendId
 */
router.delete('/friend/:friendId', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.removeFriend(req.userId, req.params.friendId);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] remove-friend error: ${e.message}`);
    return err(res, e.code || 'FRIEND_5099', e.message, e.status || 400);
  }
});

// ============================================================
// Privacy Settings
// ============================================================

/**
 * GET /api/v1/social/privacy
 */
router.get('/privacy', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.getPrivacy(req.userId);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] get-privacy error: ${e.message}`);
    return err(res, e.code || 'PRIVACY_5199', e.message, e.status || 400);
  }
});

/**
 * PUT /api/v1/social/privacy
 * Body: { allowUidSearch?, allowGroupInvite?, allowDiscover? }
 */
router.put('/privacy', async (req, res) => {
  try {
    const { allowUidSearch, allowGroupInvite, allowDiscover } = req.body;
    const social = getSocialService();
    const result = await social.updatePrivacy(req.userId, {
      allowUidSearch,
      allowGroupInvite,
      allowDiscover,
    });
    return ok(res, result, '隐私设置已更新');
  } catch (e) {
    logger.error(`[Social] update-privacy error: ${e.message}`);
    return err(res, e.code || 'PRIVACY_5199', e.message, e.status || 400);
  }
});

// ============================================================
// Group System (M2)
// ============================================================

/**
 * POST /api/v1/social/group/create
 */
router.post('/group/create', async (req, res) => {
  try {
    const { name, description, avatarUrl } = req.body;
    const social = getSocialService();
    const result = await social.createGroup(req.userId, { name, description, avatarUrl });
    return ok(res, result, '群组创建成功');
  } catch (e) {
    logger.error(`[Social] create-group error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

/**
 * GET /api/v1/social/group/:id
 */
router.get('/group/:id', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.getGroupDetail(req.params.id, req.userId);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] group-detail error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

/**
 * GET /api/v1/social/group/:id/members
 */
router.get('/group/:id/members', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.getGroupMembers(req.params.id);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] group-members error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

/**
 * POST /api/v1/social/group/:id/members
 * Body: { userId }
 */
router.post('/group/:id/members', async (req, res) => {
  try {
    const { userId } = req.body;
    const social = getSocialService();
    const result = await social.addGroupMember(req.params.id, userId, req.userId);
    return ok(res, result, '成员已添加');
  } catch (e) {
    logger.error(`[Social] add-member error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

/**
 * DELETE /api/v1/social/group/:id/members/:userId
 */
router.delete('/group/:id/members/:userId', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.removeGroupMember(req.params.id, req.params.userId, req.userId);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] remove-member error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

/**
 * PUT /api/v1/social/group/:id/mute-all
 */
router.put('/group/:id/mute-all', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.toggleMuteAll(req.params.id, req.userId);
    return ok(res, result, result.muteAll ? '已开启全员禁言' : '已关闭全员禁言');
  } catch (e) {
    logger.error(`[Social] mute-all error: ${e.message}`);
    return err(res, e.code || 'GROUP_5299', e.message, e.status || 400);
  }
});

// ============================================================
// Message System (M3)
// ============================================================

/**
 * POST /api/v1/social/message/send
 * Body: { targetId?, conversationId?, content, msgType? }
 */
router.post('/message/send', async (req, res) => {
  try {
    const { conversationId, targetId, content, msgType } = req.body;
    const social = getSocialService();
    const result = await social.sendMessage(req.userId, {
      conversationId,
      targetId,
      content,
      msgType,
    });
    return ok(res, result, '消息发送成功');
  } catch (e) {
    logger.error(`[Social] send-message error: ${e.message}`);
    return err(res, e.code || 'MSG_5399', e.message, e.status || 400);
  }
});

/**
 * GET /api/v1/social/message/list?conversationId=xxx&page=1&limit=30
 */
router.get('/message/list', async (req, res) => {
  try {
    const { conversationId, page, limit } = req.query;
    const social = getSocialService();
    const result = await social.getMessages(conversationId, req.userId, {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 30, 100),
    });
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] message-list error: ${e.message}`);
    return err(res, e.code || 'MSG_5399', e.message, e.status || 400);
  }
});

/**
 * GET /api/v1/social/conversation/list
 */
router.get('/conversation/list', async (req, res) => {
  try {
    const social = getSocialService();
    const result = await social.getConversations(req.userId);
    return ok(res, result);
  } catch (e) {
    logger.error(`[Social] conversation-list error: ${e.message}`);
    return err(res, e.code || 'MSG_5399', e.message, e.status || 400);
  }
});

/**
 * POST /api/v1/social/message/revoke
 * Body: { messageId }
 */
router.post('/message/revoke', async (req, res) => {
  try {
    const { messageId } = req.body;
    const social = getSocialService();
    const result = await social.revokeMessage(messageId, req.userId);
    return ok(res, result, '消息已撤回');
  } catch (e) {
    logger.error(`[Social] revoke-message error: ${e.message}`);
    return err(res, e.code || 'MSG_5399', e.message, e.status || 400);
  }
});

module.exports = router;
