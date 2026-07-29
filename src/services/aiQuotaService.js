// ============================================================
// src/services/aiQuotaService.js
// Module 03 Step 5 — AI 每日额度管理（V3.2 规范）
// 免费 50/日，Premium 200/日，基于 AiUsageDailyStatistic 计数
// TODO: 待 membership 模块解冻后接入 User.isPremium 判断
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

const FREE_DAILY_LIMIT = 50;

class AiQuotaService {
  /**
   * 获取今日零点日期
   */
  _getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 获取用户每日额度上限
   * TODO: 待 membership 解冻后，通过 User.isPremium 字段判断：
   *   isPremium === true → PREMIUM_DAILY_LIMIT (200)
   *   isPremium === false/undefined → FREE_DAILY_LIMIT (50)
   * 当前 User 表无 isPremium 字段，统一返回免费额度
   */
  async _getDailyLimit(_userId) {
    // TODO: const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
    // TODO: return user?.isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
    return FREE_DAILY_LIMIT;
  }

  /**
   * 获取今日已用 AI 次数（基于 AiUsageDailyStatistic）
   */
  async _getTodayUsage(userId) {
    try {
      const today = this._getToday();
      const stats = await prisma.aiUsageDailyStatistic.aggregate({
        where: { userId, date: today },
        _sum: { totalRequests: true },
      });
      return stats._sum.totalRequests || 0;
    } catch (e) {
      logger.warn('aiQuotaService: _getTodayUsage failed', e.message);
      return 0;
    }
  }

  /**
   * checkQuota — 检查用户是否有剩余额度
   * @param {string} userId
   * @returns {Promise<{allowed: boolean, remaining: number, dailyTotal: number, resetTime: string}>}
   */
  async checkQuota(userId) {
    const [dailyLimit, used] = await Promise.all([
      this._getDailyLimit(userId),
      this._getTodayUsage(userId),
    ]);
    const remaining = Math.max(0, dailyLimit - used);
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    return {
      allowed: remaining > 0,
      remaining,
      dailyTotal: dailyLimit,
      resetTime: midnight.toISOString(),
    };
  }

  /**
   * recordUsage — 记录 AI 用量到 AiUsageDailyStatistic
   * @param {string} userId
   * @param {string} requestType - conversation / correction
   * @param {number} tokens - 消耗 token 数
   */
  async recordUsage(userId, requestType = 'conversation', tokens = 0) {
    const today = this._getToday();
    try {
      await prisma.aiUsageDailyStatistic.upsert({
        where: {
          date_userId_requestType: {
            date: today,
            userId,
            requestType,
          },
        },
        create: {
          date: today,
          userId,
          requestType,
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
      logger.error('aiQuotaService: recordUsage failed', { userId, requestType, error: e.message });
    }
  }

  /**
   * getQuota — 获取用户完整额度信息
   * @param {string} userId
   * @returns {Promise<{dailyTotal: number, used: number, remaining: number, resetTime: string}>}
   */
  async getQuota(userId) {
    const [dailyLimit, used] = await Promise.all([
      this._getDailyLimit(userId),
      this._getTodayUsage(userId),
    ]);
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    return {
      dailyTotal: dailyLimit,
      used,
      remaining: Math.max(0, dailyLimit - used),
      resetTime: midnight.toISOString(),
    };
  }
}

module.exports = new AiQuotaService();