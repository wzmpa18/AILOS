const prisma = require('../config/database');
const logger = require('../utils/logger');
const { generateRandomString } = require('../utils/crypto');
const { getSystemConfigService } = require('./systemConfigService');

class MembershipService {
  // Get user membership status
  async getMembershipStatus(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          membershipOrders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isExpired = user.membershipExpiry && user.membershipExpiry < new Date();
      const effectiveLevel = isExpired ? 'free' : user.membershipLevel;

      return {
        level: effectiveLevel,
        expiry: user.membershipExpiry,
        isActive: !isExpired && user.membershipLevel !== 'free',
        lastOrder: user.membershipOrders[0] || null,
      };
    } catch (error) {
      logger.error('Get membership status failed:', error);
      throw error;
    }
  }

  // Create membership order
  async createOrder(userId, membershipLevel, duration, paymentMethod) {
    try {
      const orderNo = 'MW' + Date.now() + generateRandomString(8);
      
      // Calculate amount based on level and duration — from system_config
      const amount = this.calculatePrice(membershipLevel, duration);

      const order = await prisma.membershipOrder.create({
        data: {
          userId,
          orderNo,
          membershipLevel,
          duration,
          amount,
          currency: 'CNY',
          paymentMethod,
          status: 'pending',
        },
      });

      return order;
    } catch (error) {
      logger.error('Create order failed:', error);
      throw error;
    }
  }

  // Process payment callback
  async processPayment(orderNo, paymentId, status) {
    try {
      const order = await prisma.membershipOrder.findUnique({
        where: { orderNo },
        include: { user: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'pending') {
        throw new Error('Order already processed');
      }

      const updateData = {
        paymentId,
        status,
      };

      if (status === 'paid') {
        updateData.paidAt = new Date();

        // Update user membership
        const currentExpiry = order.user.membershipExpiry || new Date();
        const newExpiry = new Date(
          Math.max(currentExpiry.getTime(), Date.now()) + order.duration * 24 * 60 * 60 * 1000
        );

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            membershipLevel: order.membershipLevel,
            membershipExpiry: newExpiry,
          },
        });
      }

      await prisma.membershipOrder.update({
        where: { id: order.id },
        data: updateData,
      });

      return { success: true, order };
    } catch (error) {
      logger.error('Process payment failed:', error);
      throw error;
    }
  }

  // Check if user has access to premium features
  async hasPremiumAccess(userId) {
    try {
      const membership = await this.getMembershipStatus(userId);
      return membership.isActive && (membership.level === 'premium' || membership.level === 'basic');
    } catch (error) {
      logger.error('Check premium access failed:', error);
      return false;
    }
  }

  // Verify membership (middleware helper)
  async verifyMembership(userId, requiredLevel = 'basic') {
    try {
      const membership = await this.getMembershipStatus(userId);
      
      const levelHierarchy = { free: 0, basic: 1, premium: 2 };
      const userLevel = levelHierarchy[membership.level] || 0;
      const requiredLevelValue = levelHierarchy[requiredLevel] || 0;

      if (!membership.isActive || userLevel < requiredLevelValue) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Verify membership failed:', error);
      return false;
    }
  }

  // Get membership plans — 定价从 system_config 动态读取
  getMembershipPlans() {
    const sysConfig = getSystemConfigService();

    const basicMonthly = sysConfig.getNumber('membership.pricing.basic.monthly', 28);
    const basicQuarterly = sysConfig.getNumber('membership.pricing.basic.quarterly', 78);
    const basicYearly = sysConfig.getNumber('membership.pricing.basic.yearly', 288);
    const premiumMonthly = sysConfig.getNumber('membership.pricing.premium.monthly', 58);
    const premiumQuarterly = sysConfig.getNumber('membership.pricing.premium.quarterly', 168);
    const premiumYearly = sysConfig.getNumber('membership.pricing.premium.yearly', 588);

    return [
      {
        level: 'basic',
        name: '基础会员',
        price: { monthly: basicMonthly, quarterly: basicQuarterly, yearly: basicYearly },
        features: [
          '无限制学习',
          '离线下载',
          '去除广告',
          '基础学习报告',
        ],
      },
      {
        level: 'premium',
        name: '高级会员',
        price: { monthly: premiumMonthly, quarterly: premiumQuarterly, yearly: premiumYearly },
        features: [
          '包含基础会员所有权益',
          'AI智能辅导',
          '专属学习路径',
          '优先客服支持',
          '高级学习报告',
          '多语种无限切换',
        ],
      },
    ];
  }

  // Calculate price — 从 system_config 动态读取
  calculatePrice(level, duration) {
    const sysConfig = getSystemConfigService();
    const durationMap = { 30: 'monthly', 90: 'quarterly', 365: 'yearly' };
    const period = durationMap[duration] || 'monthly';

    const priceKey = `membership.pricing.${level}.${period}`;
    const price = sysConfig.getNumber(priceKey);
    if (price > 0) {
      return price;
    }

    // Fallback to hardcoded defaults (legacy compatibility)
    const plans = this.getMembershipPlans();
    const plan = plans.find(p => p.level === level);
    if (!plan) {
      throw new Error('Invalid membership level');
    }
    return plan.price[period] || plan.price.monthly;
  }

  // Expire memberships (cron job)
  async expireMemberships() {
    try {
      const expiredUsers = await prisma.user.findMany({
        where: {
          membershipExpiry: { lt: new Date() },
          membershipLevel: { not: 'free' },
        },
      });

      for (const user of expiredUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { membershipLevel: 'free' },
        });
      }

      logger.info(`Expired ${expiredUsers.length} memberships`);
      return expiredUsers.length;
    } catch (error) {
      logger.error('Expire memberships failed:', error);
      throw error;
    }
  }
}

module.exports = new MembershipService();