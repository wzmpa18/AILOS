// ============================================================
// src/services/membershipService.js
// 会员服务 — 等级管理 + 额度 + 权益
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

const MEMBERSHIP_PLANS = {
  free: {
    name: '免费版',
    dailyConversation: 5,
    dailyCorrection: 3,
    maxDecks: 3,
    maxCardsPerDeck: 50,
    price: 0,
  },
  basic: {
    name: '基础版',
    dailyConversation: 30,
    dailyCorrection: 15,
    maxDecks: 10,
    maxCardsPerDeck: 200,
    price: 29.9,
  },
  pro: {
    name: '专业版',
    dailyConversation: 100,
    dailyCorrection: 50,
    maxDecks: 50,
    maxCardsPerDeck: 1000,
    price: 79.9,
  },
  enterprise: {
    name: '企业版',
    dailyConversation: 999,
    dailyCorrection: 999,
    maxDecks: 999,
    maxCardsPerDeck: 9999,
    price: 299.9,
  },
};

class MembershipService {
  getPlans() {
    return MEMBERSHIP_PLANS;
  }

  async getUserMembership(userId) {
    let membership = await prisma.membership.findUnique({
      where: { userId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: { userId, level: 'free' },
      });
    }

    // 检查是否过期
    if (membership.expiresAt && membership.expiresAt < new Date() && membership.level !== 'free') {
      membership = await prisma.membership.update({
        where: { userId },
        data: { level: 'free', expiresAt: null },
      });
      logger.info(`Membership expired for user ${userId}, downgraded to free`);
    }

    const plan = MEMBERSHIP_PLANS[membership.level] || MEMBERSHIP_PLANS.free;

    return {
      level: membership.level,
      plan,
      startedAt: membership.startedAt,
      expiresAt: membership.expiresAt,
      autoRenew: membership.autoRenew,
      isExpired: membership.expiresAt ? membership.expiresAt < new Date() : false,
    };
  }

  async upgradeMembership(userId, level, durationMonths = 1) {
    if (!MEMBERSHIP_PLANS[level]) {
      throw new Error(`Invalid membership level: ${level}`);
    }

    const plan = MEMBERSHIP_PLANS[level];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const membership = await prisma.membership.upsert({
      where: { userId },
      update: {
        level,
        startedAt: new Date(),
        expiresAt,
        autoRenew: false,
      },
      create: {
        userId,
        level,
        startedAt: new Date(),
        expiresAt,
      },
    });

    // 记录交易
    await prisma.membershipTransaction.create({
      data: {
        userId,
        type: 'upgrade',
        level,
        amount: plan.price * durationMonths,
        currency: 'CNY',
        status: 'completed',
        paymentMethod: 'system',
      },
    });

    // 更新用户额度
    await prisma.userQuota.upsert({
      where: { userId },
      update: {
        maxConversation: plan.dailyConversation,
        maxCorrection: plan.dailyCorrection,
      },
      create: {
        userId,
        maxConversation: plan.dailyConversation,
        maxCorrection: plan.dailyCorrection,
        resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
      },
    });

    logger.info(`User ${userId} upgraded to ${level} membership`);

    return { membership, plan };
  }

  async getTransactions(userId) {
    return prisma.membershipTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new MembershipService();