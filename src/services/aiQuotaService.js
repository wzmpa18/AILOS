/**
 * src/services/aiQuotaService.js
 * AI 额度管理服务
 *
 * 功能：
 * - 免费用户每日限制：对话5次/天、纠错3次/天
 * - 付费会员按套餐级别扩容（free=5/3, basic=20/10, premium=50/30, flagship=100/50）
 * - 通过查询 AiUsageDailyStatistic 表统计当日用量
 * - 每日00:00通过Redis缓存自动重置
 * - 暴露方法：checkQuota(userId, type)、recordUsage(userId, type, tokens)、getQuota(userId)
 */

const prisma = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

// 各会员等级对应的每日额度
const QUOTA_TIERS = {
  free:     { conversation: 5,   correction: 3 },
  basic:    { conversation: 20,  correction: 10 },
  premium:  { conversation: 50,  correction: 30 },
  flagship: { conversation: 100, correction: 50 },
};

const REDIS_PREFIX = 'ai:quota:';

class AiQuotaService {
  /**
   * 获取用户当前生效的会员等级
   */
  async _getUserLevel(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { membershipLevel: true, membershipExpiry: true },
      });
      if (!user) return 'free';
      // 检查会员是否过期
      if (user.membershipExpiry && user.membershipExpiry < new Date()) {
        return 'free';
      }
      return user.membershipLevel || 'free';
    } catch (e) {
      logger.error('AiQuotaService', '获取用户等级失败', { userId, error: e.message });
      return 'free';
    }
  }

  /**
   * 获取今日日期字符串 (YYYY-MM-DD)
   */
  _getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * 构建 Redis 缓存键
   */
  _getRedisKey(userId, type) {
    const today = this._getToday();
    return `${REDIS_PREFIX}${userId}:${today}:${type}`;
  }

  /**
   * 计算距离午夜的剩余秒数（用于 Redis TTL）
   */
  _getSecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.ceil((midnight - now) / 1000);
  }

  /**
   * 从数据库获取当日用量（Redis 降级备用）
   */
  async _getDbUsage(userId, type) {
    try {
      const today = new Date(this._getToday());
      const stats = await prisma.aiUsageDailyStatistic.findFirst({
        where: {
          userId,
          date: today,
          requestType: type,
        },
      });
      return stats ? stats.totalRequests : 0;
    } catch (e) {
      logger.error('AiQuotaService', 'DB用量查询失败', { userId, type, error: e.message });
      return 0;
    }
  }

  /**
   * 获取当前用量（优先 Redis，降级 DB）
   */
  async _getUsage(userId, type) {
    const key = this._getRedisKey(userId, type);
    try {
      const count = await redis.get(key);
      if (count !== null) {
        return parseInt(count, 10);
      }
    } catch (e) {
      logger.debug('AiQuotaService', 'Redis读取失败，降级到DB', { error: e.message });
    }
    return await this._getDbUsage(userId, type);
  }

  /**
   * 递增用量计数（Redis + 自动过期到午夜）
   */
  async _incrementUsage(userId, type) {
    const key = this._getRedisKey(userId, type);
    const ttl = this._getSecondsUntilMidnight();
    try {
      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.expire(key, ttl);
      }
      return newCount;
    } catch (e) {
      logger.debug('AiQuotaService', 'Redis递增失败', { error: e.message });
      const dbCount = await this._getDbUsage(userId, type);
      return dbCount + 1;
    }
  }

  /**
   * checkQuota - 检查用户是否有剩余额度
   * @param {string} userId - 用户ID
   * @param {string} type - 类型: 'conversation' | 'correction'
   * @returns {Promise<{ allowed: boolean, remaining: number, dailyTotal: number, resetTime: string }>}
   */
  async checkQuota(userId, type) {
    const level = await this._getUserLevel(userId);
    const tier = QUOTA_TIERS[level] || QUOTA_TIERS.free;
    const dailyTotal = tier[type] || 0;
    const used = await this._getUsage(userId, type);
    const remaining = Math.max(0, dailyTotal - used);
    const allowed = remaining > 0;

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    return {
      allowed,
      remaining,
      dailyTotal,
      resetTime: midnight.toISOString(),
    };
  }

  /**
   * recordUsage - 记录AI用量
   * @param {string} userId - 用户ID
   * @param {string} type - 类型: 'conversation' | 'correction'
   * @param {number} tokens - 消耗的token数
   */
  async recordUsage(userId, type, tokens = 0) {
    await this._incrementUsage(userId, type);

    // 同步更新数据库日统计
    const today = new Date(this._getToday());
    try {
      await prisma.aiUsageDailyStatistic.upsert({
        where: {
          date_userId_requestType: {
            date: today,
            userId,
            requestType: type,
          },
        },
        create: {
          date: today,
          userId,
          requestType: type,
          totalRequests: 1,
          inputTokens: Math.floor(tokens / 2),
          outputTokens: Math.floor(tokens / 2),
          estimatedCost: 0,
          assetHitRate: 0,
        },
        update: {
          totalRequests: { increment: 1 },
          inputTokens: { increment: Math.floor(tokens / 2) },
          outputTokens: { increment: Math.floor(tokens / 2) },
        },
      });
    } catch (e) {
      logger.error('AiQuotaService', '更新日统计失败', { userId, type, error: e.message });
    }
  }

  /**
   * getQuota - 获取用户完整额度信息
   * @param {string} userId - 用户ID
   * @returns {Promise<{ level: string, tiers: object, usage: object, resetTime: string }>}
   */
  async getQuota(userId) {
    const level = await this._getUserLevel(userId);
    const tier = QUOTA_TIERS[level] || QUOTA_TIERS.free;

    const conversationUsed = await this._getUsage(userId, 'conversation');
    const correctionUsed = await this._getUsage(userId, 'correction');

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    return {
      level,
      tiers: {
        conversation: tier.conversation,
        correction: tier.correction,
      },
      usage: {
        conversation: {
          used: conversationUsed,
          remaining: Math.max(0, tier.conversation - conversationUsed),
        },
        correction: {
          used: correctionUsed,
          remaining: Math.max(0, tier.correction - correctionUsed),
        },
      },
      resetTime: midnight.toISOString(),
    };
  }
}

module.exports = new AiQuotaService();