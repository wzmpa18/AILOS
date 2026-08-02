/**
 * Stage 9 Community: Social Service
 * Friend system, group management, messaging, privacy
 * Constitution v2.2.1 §11, Appendix C.5/D.9
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
  return new SocialError(code, message, status);
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

  async getMyProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, uniqueId: true, nickname: true, avatar: true, createdAt: true },
    });
    if (!user) throw fail('PROFILE_5001', '用户不存在', 404);
    const friendCount = await prisma.friendSetting.count({ where: { userId, isBlocked: false } });
    const groupCount = await prisma.groupMember.count({ where: { userId } });
    return {
      id: user.id, uniqueId: user.uniqueId, nickname: user.nickname,
      avatar: user.avatar || DEFAULT_AVATAR, friendCount, groupCount, createdAt: user.createdAt,
    };
  }

  async searchByUid(searcherId, targetUid) {
    if (!targetUid || targetUid.trim().length === 0) {
      throw fail('FRIEND_5001', '请输入要搜索的UID');
    }
    const target = await prisma.user.findUnique({
      where: { uniqueId: targetUid.trim() },
      select: { id: true, uniqueId: true, nickname: true, avatar: true, privacySettings: true },
    });
    if (!target) throw fail('FRIEND_5002', '未找到该用户', 404);
    if (target.id === searcherId) throw fail('FRIEND_5003', '不能搜索自己');
    const privacy = getPrivacy(target);
    if (!privacy.allowUidSearch) throw fail('FRIEND_5004', '该用户未开放UID搜索');
    const existing = await prisma.friendSetting.findUnique({
      where: { userId_friendId: { userId: searcherId, friendId: target.id } },
    });
    return {
      id: target.id, uniqueId: target.uniqueId, nickname: target.nickname,
      avatar: target.avatar, isFriend: !!existing, isBlocked: existing?.isBlocked || false,
    };
  }

  async addFriend(userId, friendId) {
    if (!friendId) throw fail('FRIEND_5010', '缺少目标用户ID');
    if (userId === friendId) throw fail('FRIEND_5011', '不能添加自己为好友');
    const target = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, privacySettings: true, isActive: true },
    });
    if (!target || !target.isActive) throw fail('FRIEND_5012', '用户不存在或已注销', 404);
    const privacy = getPrivacy(target);
    if (!privacy.allowUidSearch) throw fail('FRIEND_5013', '该用户未开放好友添加');
    const existing = await prisma.friendSetting.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });
    if (existing) {
      if (existing.isBlocked) throw fail('FRIEND_5014', '无法添加：对方已被您拉黑');
      throw fail('FRIEND_5015', '你们已经是好友了');
    }
    const reverseSetting = await prisma.friendSetting.findUnique({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
    });
    if (reverseSetting?.isBlocked) throw fail('FRIEND_5016', '无法添加：对方已将您拉黑');
    const settings = await prisma.$transaction(async (tx) => {
      const s1 = await tx.friendSetting.create({ data: { userId, friendId, tags: [] } });
      await tx.friendSetting.create({ data: { userId: friendId, friendId: userId, tags: [] } });
      return s1;
    });
    logger.info(`[Social] Friend added: ${userId} <-> ${friendId}`);
    return { id: settings.id, userId, friendId, createdAt: settings.createdAt };
  }

  async getFriendList(userId, filters = {}) {
    const { tag, search } = filters;
    const settings = await prisma.friendSetting.findMany({
      where: { userId },
      include: { friend: { select: { id: true, uniqueId: true, nickname: true, avatar: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    let friends = settings.map((fs) => ({
      id: fs.id, friendId: fs.friendId, friendUniqueId: fs.friend.uniqueId,
      friendNickname: fs.remarkName || fs.friend.nickname || '未知用户',
      friendAvatar: fs.friend.avatar || DEFAULT_AVATAR, remarkName: fs.remarkName,
      tags: typeof fs.tags === 'string' ? JSON.parse(fs.tags) : (fs.tags || []),
      isMuted: fs.isMuted, isBlocked: fs.isBlocked,
      createdAt: fs.createdAt, updatedAt: fs.updatedAt,
    }));
    if (tag) friends = friends.filter((f) => f.tags.includes(tag));
    if (search) {
      const s = search.toLowerCase();
      friends = friends.filter((f) =>
        f.friendNickname.toLowerCase().includes(s) || (f.remarkName || '').toLowerCase().includes(s));
    }
    return { total: friends.length, friends };
  }

  async updateFriendSetting(userId, friendId, updates = {}) {
    if (!friendId) throw fail('FRIEND_5020', '缺少好友ID');
    const existing = await prisma.friendSetting.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });
    if (!existing) throw fail('FRIEND_5021', '你们还不是好友', 404);
    const data = {};
    if (updates.remarkName !== undefined) data.remarkName = updates.remarkName || null;
    if (updates.tags !== undefined) data.tags = Array.isArray(updates.tags) ? updates.tags : [];
    if (updates.isMuted !== undefined) data.isMuted = !!updates.isMuted;
    if (updates.isBlocked !== undefined) data.isBlocked = !!updates.isBlocked;
    if (Object.keys(data).length === 0) throw fail('FRIEND_5022', '没有需要更新的设置');
    const updated = await prisma.friendSetting.update({ where: { id: existing.id }, data });
    logger.info(`[Social] Friend setting updated: ${userId} -> ${friendId}`);
    return {
      id: updated.id, userId: updated.userId, friendId: updated.friendId,
      remarkName: updated.remarkName,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags,
      isMuted: updated.isMuted, isBlocked: updated.isBlocked, updatedAt: updated.updatedAt,
    };
  }

  async removeFriend(userId, friendId) {
    if (!friendId) throw fail('FRIEND_5030', '缺少好友ID');
    await prisma.$transaction(async (tx) => {
      await tx.friendSetting.deleteMany({
        where: { OR: [{ userId, friendId }, { userId: friendId, friendId: userId }] },
      });
    });
    logger.info(`[Social] Friend removed: ${userId} <-> ${friendId}`);
    return { success: true, message: '已删除好友' };
  }

  // ============================================================
  // Privacy Settings
  // ============================================================

  async updatePrivacy(userId, settings = {}) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw fail('PRIVACY_5100', '用户不存在', 404);
    const current = getPrivacy(user);
    const updated = { ...current };
    if (settings.allowUidSearch !== undefined) updated.allowUidSearch = !!settings.allowUidSearch;
    if (settings.allowGroupInvite !== undefined) updated.allowGroupInvite = !!settings.allowGroupInvite;
    if (settings.allowDiscover !== undefined) updated.allowDiscover = !!settings.allowDiscover;
    await prisma.user.update({ where: { id: userId }, data: { privacySettings: updated } });
    logger.info(`[Social] Privacy updated: ${userId}`);
    return updated;
  }

  async getPrivacy(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, privacySettings: true },
    });
    if (!user) throw fail('PRIVACY_5101', '用户不存在', 404);
    return getPrivacy(user);
  }

  // ============================================================
  // Group System (M2)
  // ============================================================

  // ============================================================
  // Profile & Search (Stage 9 S3)
  // ============================================================

  async getUserProfile(viewerId, targetUidOrId) {
    if (!targetUidOrId) throw fail('PROFILE_5100', 'Missing user identifier');
    const target = await prisma.user.findFirst({
      where: {
        OR: [
          { uniqueId: targetUidOrId.trim() },
          { id: targetUidOrId.trim() },
        ],
      },
      select: { id: true, uniqueId: true, nickname: true, avatar: true, privacySettings: true },
    });
    if (!target) throw fail('PROFILE_5101', 'User not found', 404);
    if (target.id === viewerId) {
      // Self: return full profile with stats
      const friendCount = await prisma.friendSetting.count({ where: { userId: viewerId, isBlocked: false } });
      const groupCount = await prisma.groupMember.count({ where: { userId: viewerId } });
      return { id: target.id, uniqueId: target.uniqueId, nickname: target.nickname,
        avatar: target.avatar || DEFAULT_AVATAR, friendCount, groupCount, isSelf: true };
    }
    // Others: check privacy
    const privacy = getPrivacy(target);
    const isFriend = !!(await prisma.friendSetting.findUnique({
      where: { userId_friendId: { userId: viewerId, friendId: target.id } },
    }));
    if (!isFriend && !privacy.allowDiscover) {
      // Privacy ON: show basic info only, no dynamic list
      return {
        id: target.id, uniqueId: target.uniqueId, nickname: target.nickname,
        avatar: target.avatar || DEFAULT_AVATAR, isFriend: false, isPrivate: true,
        message: 'User has disabled public display',
        posts: [],
      };
    }
    // Friend or privacy OFF: show full info + recent posts
    const recentPosts = await prisma.socialTimeline.findMany({
      where: { actorId: target.id, type: 'post' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, content: true, createdAt: true, likeCount: true, commentCount: true },
    });
    return {
      id: target.id, uniqueId: target.uniqueId, nickname: target.nickname,
      avatar: target.avatar || DEFAULT_AVATAR, isFriend, isPrivate: false,
      posts: recentPosts,
    };
  }

  async searchByNickname(searcherId, query) {
    if (!query || query.trim().length === 0) throw fail('SEARCH_5200', 'Search query required');
    if (query.trim().length < 2) throw fail('SEARCH_5201', 'Search query too short (min 2 chars)');
    const results = await prisma.user.findMany({
      where: {
        nickname: { contains: query.trim(), mode: 'insensitive' },
        id: { not: searcherId },
        isActive: true,
      },
      select: { id: true, uniqueId: true, nickname: true, avatar: true, privacySettings: true },
      take: 20,
    });
    // Filter out users with privacy ON (allowDiscover=false)
    const filtered = [];
    for (const u of results) {
      const privacy = getPrivacy(u);
      if (privacy.allowDiscover !== false) {
        filtered.push({ id: u.id, uniqueId: u.uniqueId, nickname: u.nickname, avatar: u.avatar || DEFAULT_AVATAR });
      }
    }
    return { results: filtered, total: filtered.length };
  }

  async createGroup(userId, { name, description, avatarUrl } = {}) {
    if (!name || name.trim().length === 0) throw fail('GROUP_5200', '群名称不能为空');
    if (name.trim().length > 50) throw fail('GROUP_5201', '群名称不能超过50个字符');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.group.count({ where: { ownerId: userId, createdAt: { gte: today } } });
    if (todayCount >= 5) throw fail('GROUP_5202', '今日建群数量已达上限（5个）');
    const group = await prisma.group.create({
      data: { name: name.trim(), description: description || null, avatarUrl: avatarUrl || null, ownerId: userId, createdVia: 'manual', maxMembers: 50 },
    });
    await prisma.groupMember.create({ data: { groupId: group.id, userId, role: 'owner' } });
    logger.info(`[Social] Group created: ${group.id} by ${userId}`);
    return { id: group.id, name: group.name, description: group.description, ownerId: group.ownerId, maxMembers: group.maxMembers, memberCount: 1, createdAt: group.createdAt };
  }

  async getMyGroups(userId) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: { group: true },
      orderBy: { joinTime: 'desc' },
    });
    return memberships.map((m) => ({
      id: m.group.id, name: m.group.name, description: m.group.description,
      avatarUrl: m.group.avatarUrl, ownerId: m.group.ownerId,
      maxMembers: m.group.maxMembers, status: m.group.status,
      myRole: m.role, myMute: m.mute, joinTime: m.joinTime,
      createdAt: m.group.createdAt,
    }));
  }

  async getGroupDetail(groupId, userId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) throw fail('GROUP_5210', '群组不存在', 404);
    const isOwner = group.ownerId === userId;
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    return {
      id: group.id, name: group.name, description: group.description, avatarUrl: group.avatarUrl,
      announcement: group.announcement, ownerId: group.ownerId, createdVia: group.createdVia,
      maxMembers: group.maxMembers, muteAll: group.muteAll, status: group.status,
      memberCount: group._count.members, isOwner, myRole: membership?.role || null,
      myMute: membership?.mute || false, createdAt: group.createdAt, updatedAt: group.updatedAt,
    };
  }

  async getGroupMembers(groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, uniqueId: true, nickname: true, avatar: true } } },
      orderBy: { joinTime: 'asc' },
    });
    return members.map((m) => ({
      id: m.id, userId: m.userId, userUniqueId: m.user.uniqueId,
      userNickname: m.groupNickname || m.user.nickname || '未知用户',
      userAvatar: m.user.avatar || DEFAULT_AVATAR, role: m.role, mute: m.mute, joinTime: m.joinTime,
    }));
  }

  async addGroupMember(groupId, targetUserId, operatorId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5220', '群组不存在', 404);
    const opMembership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: operatorId } } });
    if (!opMembership || !['owner', 'admin'].includes(opMembership.role)) throw fail('GROUP_5221', '仅群主和管理员可添加成员', 403);
    const existing = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } });
    if (existing) throw fail('GROUP_5222', '该用户已在群中');
    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) throw fail('GROUP_5223', '群成员已满');
    const member = await prisma.groupMember.create({ data: { groupId, userId: targetUserId, role: 'member' } });
    return { id: member.id, groupId, userId: targetUserId, role: 'member' };
  }

  async removeGroupMember(groupId, targetUserId, operatorId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5230', '群组不存在', 404);
    if (group.ownerId === targetUserId) throw fail('GROUP_5231', '无法移除群主');
    const opMembership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: operatorId } } });
    if (!opMembership || !['owner', 'admin'].includes(opMembership.role)) throw fail('GROUP_5232', '仅群主和管理员可移除成员', 403);
    await prisma.groupMember.deleteMany({ where: { groupId, userId: targetUserId } });
    return { success: true, message: '已移除成员' };
  }

  async toggleMuteAll(groupId, userId) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw fail('GROUP_5240', '群组不存在', 404);
    if (group.ownerId !== userId) throw fail('GROUP_5241', '仅群主可操作全员禁言', 403);
    const updated = await prisma.group.update({ where: { id: groupId }, data: { muteAll: !group.muteAll } });
    return { id: updated.id, muteAll: updated.muteAll };
  }

  // ============================================================
  // Message System (M3)
  // ============================================================

  async getOrCreateConversation(userId, targetId, type = 'single') {
    let existing = await prisma.conversation.findFirst({ where: { type, targetId } });
    if (!existing) {
      const participants = [userId, ...(type === 'single' ? [targetId] : [])];
      existing = await prisma.conversation.create({ data: { type, targetId, participants } });
      logger.info(`[Social] Conversation created: ${existing.id} (${type})`);
    }
    return existing;
  }

  async sendMessage(userId, { conversationId, targetId, content, msgType = 'text' } = {}) {
    if (!content || content.trim().length === 0) throw fail('MSG_5300', '消息内容不能为空');
    if (content.length > 5000) throw fail('MSG_5301', '消息内容过长（最大5000字）');
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation) throw fail('MSG_5302', '会话不存在', 404);
    } else if (targetId) {
      conversation = await this.getOrCreateConversation(userId, targetId, 'single');
    } else {
      throw fail('MSG_5303', '缺少会话ID或目标ID');
    }
    if (conversation.type === 'group') {
      const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: conversation.targetId, userId } } });
      if (!membership) throw fail('MSG_5304', '你不在该群中', 403);
      const group = await prisma.group.findUnique({ where: { id: conversation.targetId } });
      if (group?.muteAll && membership.role !== 'owner') throw fail('MSG_5305', '全员禁言中，仅群主可发言');
    }
    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: userId, content: content.trim(), msgType },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMsgId: message.id, lastMsgPreview: content.trim().substring(0, 100), lastMsgTime: message.createdAt },
    });
    logger.info(`[Social] Message sent: ${message.id} in ${conversation.id}`);
    return { id: message.id, conversationId: message.conversationId, senderId: message.senderId, content: message.content, msgType: message.msgType, createdAt: message.createdAt };
  }

  async getMessages(conversationId, userId, { page = 1, limit = 30 } = {}) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw fail('MSG_5310', '会话不存在', 404);
    let participants = conversation.participants;
    if (typeof participants === 'string') participants = JSON.parse(participants);
    if (!Array.isArray(participants) || !participants.includes(userId)) throw fail('MSG_5311', '无权访问该会话', 403);
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: { sender: { select: { id: true, uniqueId: true, nickname: true, avatar: true } } },
        orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);
    const unreadIds = messages.filter((m) => m.senderId !== userId && !m.isRead).map((m) => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({ where: { id: { in: unreadIds } }, data: { isRead: true } });
    }
    const result = messages.reverse().map((m) => ({
      id: m.id, conversationId: m.conversationId, senderId: m.senderId,
      senderNickname: m.sender.nickname || '未知用户', senderAvatar: m.sender.avatar || DEFAULT_AVATAR,
      content: m.isRevoked ? '[消息已撤回]' : m.content,
      msgType: m.msgType, isRead: m.isRead, isRevoked: m.isRevoked,
      isMe: m.senderId === userId, createdAt: m.createdAt,
    }));
    return { conversationId, type: conversation.type, targetId: conversation.targetId, total, page, limit, messages: result };
  }

  async getConversations(userId, { limit = 20 } = {}) {
    // P0-2 Fix: raw SQL $1 = ANY(participants) causes PostgreSQL type mismatch;
    // use Prisma native has operator instead.
    const conversations = await prisma.conversation.findMany({
      where: { participants: { has: userId } },
      select: { id: true, type: true, targetId: true, lastMsgPreview: true, lastMsgTime: true, updatedAt: true },
      orderBy: { lastMsgTime: { sort: 'desc', nulls: 'last' } },
      take: limit,
    });
    return conversations;
  }

  async revokeMessage(messageId, userId) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw fail('MSG_5320', '消息不存在', 404);
    if (message.senderId !== userId) throw fail('MSG_5321', '只能撤回自己的消息', 403);
    const diff = Date.now() - message.createdAt.getTime();
    if (diff > 2 * 60 * 1000) throw fail('MSG_5322', '超过2分钟无法撤回');
    const updated = await prisma.message.update({
      where: { id: messageId }, data: { isRevoked: true, revokedAt: new Date() },
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
