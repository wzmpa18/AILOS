/**
 * Stage 9 Community: Social Service
 * Friend system, group management, messaging, privacy
 * Constitution v2.2.0 §11, Appendix C.5/D.9
 */
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ============================================================
// Error helpers
// ============================================================

class SocialError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function fail(code, message, status = 400) {
  const e = new SocialError(code, message, status);
  return e;
}

// ============================================================
// Helper: get privacy settings with defaults
// ============================================================

function getPrivacy(user) {
  const defaults = { allowUidSearch: true, allowGroupInvite: true, allowDiscover: true };
  if (!user.privacySettings) return defaults;
  try {
    const ps = typeof user.privacySettings === 'string' ? JSON.parse(user.privacySettings) : user.privacySettings;
    return { ...defaults, ...ps };
  } catch {
    return defaults;
  }
}

// ============================================================
// Friend System (M1)
// ============================================================

class SocialService {

  /**
   * Search user by UID (unique identifier)
   * Privacy check: user must have allowUidSearch = true
   */
  async searchByUid(searcherId, targetUid) {
    if (!targetUid || targetUid.trim().length === 0) {
      throw fail('FRIEND_5001', '请输入要搜索的UID');
    }

    const target = await prisma.user.findUnique({
      where: { uniqueId: targetUid.trim() },
      select: {
        id: true,
        uniqueId: true,
        nickname: true,
        avatar: true,
        privacySettings: true,
      },
    });

    if (!target) {
      throw fail('FRIEND_5002', '未找到该用户', 404);
    }

    if (target.id === searcherId) {
      throw fail('FRIEND_5003', '不能搜索自己');
    }

    const privacy = getPrivacy(target);
    if (!privacy.allowUidSearch) {
      throw fail('FRIEND_5004', '该用户未开放UID搜索');
    }

    // Check existing relationship
    const existing = await prisma.friendSetting.findUnique({
      where: {
        userId_friendId: {
          userId: searcherId,
          friendId: target.id,
        },
      },
    });

    return {
      id: target.id,
      uniqueId: target.uniqueId,
      nickname: target.nickname,
      avatar: target.avatar,
      isFriend: !!existing,
      isBlocked: existing?.isBlocked || false,
    };
  }

  /**
   * Add friend / send friend request
   * - Check privacy (allowUidSearch MUST be true to add)
   * - Check not blocked
   * - Check no duplicate
   */
  async addFriend(userId, friendId) {
    if (!friendId) throw fail('FRIEND_5010', '缺少目标用户ID');

    if (userId === friendId) {
      throw fail('FRIEND_5011', '不能添加自己为好友');
    }

    // Check target exists and privacy
    const target = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, privacySettings: true, isActive: true },
    });

    if (!target || !target.isActive) {
      throw fail('FRIEND_5012', '用户不存在或已注销', 404);
    }

    const privacy = getPrivacy(target);
    if (!privacy.allowUidSearch) {
      throw fail('FRIEND_5013', '该用户未开放好友添加');
    }

    // Check if already friends
    const existing = await prisma.friendSetting.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    if (existing) {
      if (existing.isBlocked) {
        throw fail('FRIEND_5014', '无法添加：对方已被您拉黑');
      }
      throw fail('FRIEND_5015', '你们已经是好友了');
    }

    // Check if target has blocked us
    const reverseSetting = await prisma.friendSetting.findUnique({
      where: {
        userId_friendId: { userId: friendId, friendId: userId },
      },
    });
    if (reverseSetting?.isBlocked) {
      throw fail('FRIEND_5016', '无法添加：对方已将您拉黑');
    }

    // Create mutual friend relationship (bidirectional)
    const settings = await prisma.$transaction(async (tx) => {
      const s1 = await tx.friendSetting.create({
        data: { userId, friendId, tags: [] },
      });

      // Create reverse entry for the target user
      await tx.friendSetting.create({
        data: { userId: friendId, friendId: userId, tags: [] },
      });

      return s1;
    });

    logger.info(`[Social] Friend added: ${userId} <-> ${friendId}`);

    return {
      id: settings.id,
      userId,
      friendId,
      createdAt: settings.createdAt,
    };
  }

  /**
   * Get friend list with optional filters (remark, tags)
   * Redis cache: 300s
   */
  async getFriendList(userId, filters = {}) {
    const { tag, search } = filters;

    const where = { userId };

    const settings = await prisma.friendSetting.findMany({
      where,
      include: {
        friend: {
          select: {
            id: true,
            uniqueId: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let friends = settings.map((fs) => ({
      id: fs.id,
      friendId: fs.friendId,
      friendUniqueId: fs.friend.uniqueId,
      friendNickname: fs.remarkName || fs.friend.nickname || '未知用户',
      friendAvatar: fs.friend.avatar,
      remarkName: fs.remarkName,
      tags: typeof fs.tags === 'string' ? JSON.parse(fs.tags) : (fs.tags || []),
      isMuted: fs.isMuted,
      isBlocked: fs.isBlocked,
      createdAt: fs.createdAt,
      updatedAt: fs.updatedAt,
    }));

    // Filter by tag
    if (tag) {
      friends = friends.filter((f) => f.tags.includes(tag));
    }

    // Filter by search (nickname or remark)
    if (search) {
      const s = search.toLowerCase();
      friends = friends.filter(
        (f) =>
          f.friendNickname.toLowerCase().includes(s) ||
          (f.remarkName || '').toLowerCase().includes(s)
      );
    }

    return { total: friends.length, friends };
  }

  /**
   * Update friend settings: remark, tags, mute, block
   */
  async updateFriendSetting(userId, friendId, updates = {}) {
    if (!friendId) throw fail('FRIEND_5020', '缺少好友ID');

    const existing = await prisma.friendSetting.findUnique({
      where: {
        userId_friendId: { userId, friendId },
      },
    });

    if (!existing) {
      throw fail('FRIEND_5021', '你们还不是好友', 404);
    }

    const data = {};

    if (updates.remarkName !== undefined) {
      data.remarkName = updates.remarkName || null;
    }
    if (updates.tags !== undefined) {
      data.tags = Array.isArray(updates.tags) ? updates.tags : [];
    }
    if (updates.isMuted !== undefined) {
      data.isMuted = !!updates.isMuted;
    }
    if (updates.isBlocked !== undefined) {
      data.isBlocked = !!updates.isBlocked;
    }

    if (Object.keys(data).length === 0) {
      throw fail('FRIEND_5022', '没有需要更新的设置');
    }

    const updated = await prisma.friendSetting.update({
      where: { id: existing.id },
      data,
    });

    logger.info(`[Social] Friend setting updated: ${userId} -> ${friendId}`);

    return {
      id: updated.id,
      userId: updated.userId,
      friendId: updated.friendId,
      remarkName: updated.remarkName,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags,
      isMuted: updated.isMuted,
      isBlocked: updated.isBlocked,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete friend (both directions)
   */
  async removeFriend(userId, friendId) {
    if (!friendId) throw fail('FRIEND_5030', '缺少好友ID');

    await prisma.$transaction(async (tx) => {
      await tx.friendSetting.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });
    });

    logger.info(`[Social] Friend removed: ${userId} <-> ${friendId}`);

    return { success: true, message: '已删除好友' };
  }

  // ============================================================
  // Privacy Settings
  // ============================================================

  /**
   * Update user privacy settings
   */
  async updatePrivacy(userId, settings = {}) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw fail('PRIVACY_5100', '用户不存在', 404);

    const current = getPrivacy(user);
    const updated = { ...current };

    if (settings.allowUidSearch !== undefined) {
      updated.allowUidSearch = !!settings.allowUidSearch;
    }
    if (settings.allowGroupInvite !== undefined) {
      updated.allowGroupInvite = !!settings.allowGroupInvite;
    }
    if (settings.allowDiscover !== undefined) {
      updated.allowDiscover = !!settings.allowDiscover;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { privacySettings: updated },
    });

    logger.info(`[Social] Privacy updated: ${userId}`);

    return updated;
  }

  /**
   * Get current privacy settings
   */
  async getPrivacy(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, privacySettings: true },
    });

    if (!user) throw fail('PRIVACY_5101', '用户不存在', 404);

    return getPrivacy(user);
  }

  // ============================================================
  // Group System (M2 - placeholder for now)
  // ============================================================

  /**
   * Create a manual group
   */
  async createGroup(userId, { name, description, avatarUrl } = {}) {
    if (!name || name.trim().length === 0) {
      throw fail('GROUP_5200', '群名称不能为空');
    }

    if (name.trim().length > 50) {
      throw fail('GROUP_5201', '群名称不能超过50个字符');
    }

    // Check daily group creation limit (5 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await prisma.group.count({
      where: {
        ownerId: userId,
        createdAt: { gte: today },
      },
    });

    if (todayCount >= 5) {
      throw fail('GROUP_5202', '今日建群数量已达上限（5个）');
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || null,
        avatarUrl: avatarUrl || null,
        ownerId: userId,
        createdVia: 'manual',
        maxMembers: 50,
      },
    });

    // Auto-join creator as owner
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'owner',
      },
    });

    logger.info(`[Social] Group created: ${group.id} by ${userId}`);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      ownerId: group.ownerId,
      maxMembers: group.maxMembers,
      memberCount: 1,
      createdAt: group.createdAt,
    };
  }

  /**
   * Get group detail
   */
  async getGroupDetail(groupId, userId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!group) throw fail('GROUP_5210', '群组不存在', 404);

    const isOwner = group.ownerId === userId;

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      announcement: group.announcement,
      ownerId: group.ownerId,
      createdVia: group.createdVia,
      maxMembers: group.maxMembers,
      muteAll: group.muteAll,
      status: group.status,
      memberCount: group._count.members,
      isOwner,
      myRole: membership?.role || null,
      myMute: membership?.mute || false,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            uniqueId: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { joinTime: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      userUniqueId: m.user.uniqueId,
      userNickname: m.groupNickname || m.user.nickname || '未知用户',
      userAvatar: m.user.avatar,
      role: m.role,
      mute: m.mute,
      joinTime: m.joinTime,
    }));
  }

  /**
   * Add member to group
   */
  async addGroupMember(groupId, targetUserId, operatorId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5220', '群组不存在', 404);

    // Check operator is owner or admin
    const operatorMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: operatorId } },
    });
    if (!operatorMembership || !['owner', 'admin'].includes(operatorMembership.role)) {
      throw fail('GROUP_5221', '仅群主和管理员可添加成员', 403);
    }

    // Check target not already member
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (existing) throw fail('GROUP_5222', '该用户已在群中');

    // Check capacity
    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) {
      throw fail('GROUP_5223', '群成员已满');
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: targetUserId,
        role: 'member',
      },
    });

    return { id: member.id, groupId, userId: targetUserId, role: 'member' };
  }

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId, targetUserId, operatorId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5230', '群组不存在', 404);

    // Cannot remove owner
    if (group.ownerId === targetUserId) {
      throw fail('GROUP_5231', '无法移除群主');
    }

    // Check operator permission
    const operatorMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: operatorId } },
    });
    if (!operatorMembership || !['owner', 'admin'].includes(operatorMembership.role)) {
      throw fail('GROUP_5232', '仅群主和管理员可移除成员', 403);
    }

    await prisma.groupMember.deleteMany({
      where: { groupId, userId: targetUserId },
    });

    return { success: true, message: '已移除成员' };
  }

  /**
   * Toggle mute all
   */
  async toggleMuteAll(groupId, userId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5240', '群组不存在', 404);

    if (group.ownerId !== userId) {
      throw fail('GROUP_5241', '仅群主可操作全员禁言', 403);
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { muteAll: !group.muteAll },
    });

    return { id: updated.id, muteAll: updated.muteAll };
  }
  // ============================================================
  // Message System (M3)
  // ============================================================

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(userId, targetId, type = 'single') {
    // For single chat, use type+targetId as the unique key
    let existing = await prisma.conversation.findFirst({
      where: { type, targetId },
    });

    if (!existing) {
      const participants = [userId, ...(type === 'single' ? [targetId] : [])];

      existing = await prisma.conversation.create({
        data: { type, targetId, participants },
      });

      logger.info(`[Social] Conversation created: ${existing.id} (${type})`);
    }

    return existing;
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(userId, { conversationId, targetId, content, msgType = 'text' } = {}) {
    if (!content || content.trim().length === 0) {
      throw fail('MSG_5300', '消息内容不能为空');
    }

    if (content.length > 5000) {
      throw fail('MSG_5301', '消息内容过长（最大5000字）');
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) throw fail('MSG_5302', '会话不存在', 404);
    } else if (targetId) {
      conversation = await this.getOrCreateConversation(userId, targetId, 'single');
    } else {
      throw fail('MSG_5303', '缺少会话ID或目标ID');
    }

    // For group chat, check membership
    if (conversation.type === 'group') {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: conversation.targetId, userId } },
      });
      if (!membership) throw fail('MSG_5304', '你不在该群中', 403);
      // Check muteAll
      const group = await prisma.group.findUnique({ where: { id: conversation.targetId } });
      if (group?.muteAll && membership.role !== 'owner') {
        throw fail('MSG_5305', '全员禁言中，仅群主可发言');
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: content.trim(),
        msgType,
      },
    });

    // Update conversation's last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMsgId: message.id,
        lastMsgPreview: content.trim().substring(0, 100),
        lastMsgTime: message.createdAt,
      },
    });

    logger.info(`[Social] Message sent: ${message.id} in ${conversation.id}`);

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      msgType: message.msgType,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get messages in a conversation (paginated)
   */
  async getMessages(conversationId, userId, { page = 1, limit = 30 } = {}) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw fail('MSG_5310', '会话不存在', 404);

    // Verify user has access to this conversation
    let participants = conversation.participants;
    if (typeof participants === 'string') {
      participants = JSON.parse(participants);
    }
    if (!Array.isArray(participants) || !participants.includes(userId)) {
      throw fail('MSG_5311', '无权访问该会话', 403);
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              uniqueId: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Mark messages as read (batch)
    const unreadIds = messages
      .filter((m) => m.senderId !== userId && !m.isRead)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { isRead: true },
      });
    }

    const result = messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderNickname: m.sender.nickname || '未知用户',
      senderAvatar: m.sender.avatar,
      content: m.isRevoked ? '[消息已撤回]' : m.content,
      msgType: m.msgType,
      isRead: m.isRead,
      isRevoked: m.isRevoked,
      isMe: m.senderId === userId,
      createdAt: m.createdAt,
    }));

    return {
      conversationId,
      type: conversation.type,
      targetId: conversation.targetId,
      total,
      page,
      limit,
      messages: result,
    };
  }

  /**
   * Get user's conversation list
   */
  async getConversations(userId, { limit = 20 } = {}) {
    // Use raw SQL for JSONB array containment since Prisma's array_contains doesn't support JSONB
    const conversations = await prisma.$queryRawUnsafe(`
      SELECT id, type, "targetId", "lastMsgPreview", "lastMsgTime", "updatedAt"
      FROM conversations
      WHERE participants @> '["${userId}"]'::jsonb
      ORDER BY "lastMsgTime" DESC NULLS LAST
      LIMIT $1
    `, limit);

    return (conversations || []).map((c) => ({
      id: c.id,
      type: c.type,
      targetId: c.targetId,
      lastMsgPreview: c.lastMsgPreview,
      lastMsgTime: c.lastMsgTime,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Revoke a message (within 2 minutes)
   */
  async revokeMessage(messageId, userId) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) throw fail('MSG_5320', '消息不存在', 404);
    if (message.senderId !== userId) throw fail('MSG_5321', '只能撤回自己的消息', 403);

    const now = new Date();
    const diff = now.getTime() - message.createdAt.getTime();
    if (diff > 2 * 60 * 1000) {
      throw fail('MSG_5322', '超过2分钟无法撤回');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isRevoked: true, revokedAt: now },
    });

    return { id: updated.id, isRevoked: true, revokedAt: updated.revokedAt };
  }

}

// Singleton
let instance = null;
function getSocialService() {
  if (!instance) instance = new SocialService();
  return instance;
}

module.exports = { SocialService, getSocialService, SocialError };
