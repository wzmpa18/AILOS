// ============================================================
// src/services/inviteService.js
// 邀请返利系统 — 邀请码 + 注册奖励 + 佣金
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { generateRandomString } = require('../utils/crypto');

const REWARD_CONFIG = {
  inviterReward: 10,      // 邀请人奖励（元）
  inviteeReward: 5,       // 被邀请人奖励（元）
  inviterXpBonus: 50,     // 邀请人XP奖励
  inviteeXpBonus: 20,     // 被邀请人XP奖励
  commissionRate: 0.1,    // 佣金比例（10%）
};

class InviteService {
  getConfig() {
    return REWARD_CONFIG;
  }

  /**
   * 生成或获取邀请码
   */
  async getInviteCode(userId) {
    let inviteCode = await prisma.inviteCode.findUnique({
      where: { userId },
    });

    if (!inviteCode) {
      const code = this._generateCode();
      inviteCode = await prisma.inviteCode.create({
        data: { userId, code },
      });
    }

    return inviteCode;
  }

  /**
   * 通过邀请码注册
   */
  async applyInviteCode(inviteCodeStr, inviteeUserId) {
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: inviteCodeStr },
    });

    if (!inviteCode || !inviteCode.isActive) {
      throw new Error('Invalid or expired invite code');
    }

    if (inviteCode.usageCount >= inviteCode.maxUses) {
      throw new Error('Invite code has reached maximum uses');
    }

    if (inviteCode.userId === inviteeUserId) {
      throw new Error('Cannot invite yourself');
    }

    // 检查是否已被邀请过
    const existing = await prisma.inviteRecord.findFirst({
      where: { inviteeUserId },
    });
    if (existing) {
      throw new Error('Already registered via invite');
    }

    // 创建邀请记录
    const record = await prisma.inviteRecord.create({
      data: {
        inviteCodeId: inviteCode.id,
        inviterUserId: inviteCode.userId,
        inviteeUserId,
        status: 'registered',
        rewardedAt: new Date(),
      },
    });

    // 更新邀请码使用次数
    await prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usageCount: { increment: 1 } },
    });

    // 发放奖励
    // 邀请人获得佣金
    await prisma.commission.create({
      data: {
        userId: inviteCode.userId,
        amount: REWARD_CONFIG.inviterReward,
        currency: 'CNY',
        status: 'pending',
        source: 'invite_reward',
        reference: `invite_${record.id}`,
      },
    });

    // 邀请人获得XP
    try {
      await prisma.user.update({
        where: { id: inviteCode.userId },
        data: { xp: { increment: REWARD_CONFIG.inviterXpBonus } },
      });
    } catch (e) {
      logger.warn('Failed to award inviter XP:', e.message);
    }

    // 被邀请人获得XP
    try {
      await prisma.user.update({
        where: { id: inviteeUserId },
        data: { xp: { increment: REWARD_CONFIG.inviteeXpBonus } },
      });
    } catch (e) {
      logger.warn('Failed to award invitee XP:', e.message);
    }

    logger.info(`Invite applied: ${inviteCode.userId} invited ${inviteeUserId} via code ${inviteCodeStr}`);

    return {
      record,
      rewards: {
        inviterReward: REWARD_CONFIG.inviterReward,
        inviterXpBonus: REWARD_CONFIG.inviterXpBonus,
        inviteeXpBonus: REWARD_CONFIG.inviteeXpBonus,
      },
    };
  }

  /**
   * 获取邀请统计
   */
  async getInviteStats(userId) {
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { userId },
    });

    if (!inviteCode) {
      return { code: null, totalInvites: 0, totalRewards: 0, records: [] };
    }

    const records = await prisma.inviteRecord.findMany({
      where: { inviteCodeId: inviteCode.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inviteeUserId: true,
        status: true,
        rewardedAt: true,
        createdAt: true,
      },
    });

    const commissions = await prisma.commission.aggregate({
      where: {
        userId,
        source: 'invite_reward',
        status: 'completed',
      },
      _sum: { amount: true },
    });

    return {
      code: inviteCode.code,
      usageCount: inviteCode.usageCount,
      maxUses: inviteCode.maxUses,
      totalInvites: records.length,
      totalRewards: commissions._sum.amount || 0,
      records,
    };
  }

  /**
   * 获取佣金记录
   */
  async getCommissions(userId) {
    return prisma.commission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  _generateCode() {
    return generateRandomString(8).toUpperCase();
  }
}

module.exports = new InviteService();