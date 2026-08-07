// ============================================================
// src/services/reportsService.js
// 学习报表 + XP 查询服务 — Module 02 Step 5
// ============================================================
class ReportsService {
  // 惰性获取 Prisma：避免模块顶层加载时数据库未就绪导致 require 链崩溃
  _prisma() {
    if (!this._prismaInstance) {
      this._prismaInstance = require('../config/database');
    }
    return this._prismaInstance;
  }
  /**
   * 学习摘要 — 今日/本周学习数据
   */
  async getSummary(userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // 今日复习数
    const reviewsToday = await this._prisma().reviewQueue.count({
      where: { userId, lastReview: { gte: todayStart } },
    });

    // 本周复习数
    const reviewsThisWeek = await this._prisma().reviewQueue.count({
      where: { userId, lastReview: { gte: weekStart } },
    });

    // 今日 XP
    const xpToday = await this._prisma().rewardLedger.aggregate({
      where: { userId, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    });

    // 本周 XP
    const xpThisWeek = await this._prisma().rewardLedger.aggregate({
      where: { userId, createdAt: { gte: weekStart } },
      _sum: { amount: true },
    });

    // 总复习项
    const totalItems = await this._prisma().reviewQueue.count({ where: { userId } });

    // 待复习项
    const dueItems = await this._prisma().reviewQueue.count({
      where: { userId, dueDate: { lte: now } },
    });

    // 连续签到天数 — 从 checkinController 获取（Checkin 模型使用 Int userId，与 UUID 不兼容，需通过 /api/checkin 接口获取）
    // TODO: 统一 Checkin.userId 为 UUID String 后，直接查询
    const streak = 0;

    // 最近学习事件数
    const recentEvents = await this._prisma().learningEvent.count({
      where: { userId, createdAt: { gte: weekStart } },
    });

    return {
      today: {
        reviews: reviewsToday,
        xp: xpToday._sum.amount || 0,
      },
      thisWeek: {
        reviews: reviewsThisWeek,
        xp: xpThisWeek._sum.amount || 0,
        events: recentEvents,
      },
      overall: {
        totalItems,
        dueItems,
        streak,
        retentionRate: totalItems > 0
          ? Math.round(((totalItems - dueItems) / totalItems) * 100)
          : 0,
      },
    };
  }

  /**
   * XP 流水
   */
  async getXpHistory(userId, page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this._prisma().rewardLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this._prisma().rewardLedger.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

module.exports = ReportsService;