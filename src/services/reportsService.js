// ============================================================
// src/services/reportsService.js
// 学习报表 + XP 查询服务 — Module 02 Step 5
// ============================================================
const prisma = require('../config/database');
class ReportsService {
  /**
   * 学习摘要 — 今日/本周学习数据
   */
  async getSummary(userId) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    // 今日复习数
    const reviewsToday = await prisma.reviewQueue.count({
      where: { userId, lastReview: { gte: todayStart } },
    });

    // 本周复习数
    const reviewsThisWeek = await prisma.reviewQueue.count({
      where: { userId, lastReview: { gte: weekStart } },
    });

    // 今日 XP
    const xpToday = await prisma.rewardLedger.aggregate({
      where: { userId, createdAt: { gte: todayStart } },
      _sum: { amount: true },
    });

    // 本周 XP
    const xpThisWeek = await prisma.rewardLedger.aggregate({
      where: { userId, createdAt: { gte: weekStart } },
      _sum: { amount: true },
    });

    // 总复习项
    const totalItems = await prisma.reviewQueue.count({ where: { userId } });

    // 待复习项
    const dueItems = await prisma.reviewQueue.count({
      where: { userId, dueDate: { lte: now } },
    });

    // 连续签到天数 — 从 checkinController 获取（Checkin 模型使用 Int userId，与 UUID 不兼容，需通过 /api/checkin 接口获取）
    // TODO: 统一 Checkin.userId 为 UUID String 后，直接查询
    const streak = 0;

    // 最近学习事件数
    const recentEvents = await prisma.learningEvent.count({
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
      prisma.rewardLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.rewardLedger.count({ where: { userId } }),
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

module.exports = new ReportsService();