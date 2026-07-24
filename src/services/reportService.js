// ============================================================
// src/services/reportService.js
// 学习报告服务 — 日报/周报/月报 + XP统计
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

class ReportService {
  /**
   * 生成或获取今日学习报告
   */
  async getDailyReport(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 尝试获取已有报告
    let report = await prisma.learningReport.findUnique({
      where: { userId_reportDate: { userId, reportDate: today } },
    });

    if (!report) {
      report = await this._generateReport(userId, today);
    }

    return report;
  }

  /**
   * 获取周报（最近7天）
   */
  async getWeeklyReport(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const reports = await prisma.learningReport.findMany({
      where: {
        userId,
        reportDate: { gte: weekAgo, lte: today },
      },
      orderBy: { reportDate: 'asc' },
    });

    // 确保7天都有数据（缺失天补0）
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const found = reports.find(r =>
        r.reportDate.toISOString().split('T')[0] === d.toISOString().split('T')[0]
      );
      dailyData.push(found ? this._formatReport(found) : {
        date: d.toISOString().split('T')[0],
        studyMinutes: 0,
        wordsLearned: 0,
        wordsReviewed: 0,
        xpEarned: 0,
        conversationsCount: 0,
        correctionsCount: 0,
        streakDays: 0,
      });
    }

    const totals = dailyData.reduce((acc, d) => ({
      studyMinutes: acc.studyMinutes + d.studyMinutes,
      wordsLearned: acc.wordsLearned + d.wordsLearned,
      wordsReviewed: acc.wordsReviewed + d.wordsReviewed,
      xpEarned: acc.xpEarned + d.xpEarned,
      conversationsCount: acc.conversationsCount + d.conversationsCount,
      correctionsCount: acc.correctionsCount + d.correctionsCount,
    }), {
      studyMinutes: 0, wordsLearned: 0, wordsReviewed: 0,
      xpEarned: 0, conversationsCount: 0, correctionsCount: 0,
    });

    return {
      period: 'weekly',
      startDate: dailyData[0]?.date,
      endDate: dailyData[dailyData.length - 1]?.date,
      totals,
      dailyData,
    };
  }

  /**
   * 获取用户总览统计
   */
  async getOverview(userId) {
    const [user, totalReports, checkins, srsStats] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, createdAt: true },
      }),
      prisma.learningReport.aggregate({
        where: { userId },
        _sum: {
          studyMinutes: true,
          wordsLearned: true,
          xpEarned: true,
          conversationsCount: true,
        },
      }),
      prisma.checkin.findMany({
        where: { userId },
        orderBy: { checkinDate: 'desc' },
        take: 1,
      }),
      prisma.sRSCard.count({
        where: { deck: { userId } },
      }),
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 今日数据
    const todayReport = await prisma.learningReport.findUnique({
      where: { userId_reportDate: { userId, reportDate: today } },
    });

    // 连续签到天数
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const checkin = await prisma.checkin.findUnique({
        where: { userId_checkinDate: { userId, checkinDate: d } },
      });
      if (checkin && checkin.streak > 0) {
        streak = checkin.streak;
        break;
      }
      if (!checkin) break;
    }

    return {
      user: {
        xp: user?.xp || 0,
        level: user?.level || 1,
        memberSince: user?.createdAt,
      },
      today: todayReport ? this._formatReport(todayReport) : {
        studyMinutes: 0,
        wordsLearned: 0,
        wordsReviewed: 0,
        xpEarned: 0,
        conversationsCount: 0,
        correctionsCount: 0,
      },
      total: {
        studyMinutes: totalReports._sum.studyMinutes || 0,
        wordsLearned: totalReports._sum.wordsLearned || 0,
        xpEarned: totalReports._sum.xpEarned || 0,
        conversationsCount: totalReports._sum.conversationsCount || 0,
        srsCards: srsStats,
      },
      streak,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  async _generateReport(userId, date) {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // 统计今日学习数据
    const [learningEvents, conversationsCount, correctionsCount, srsReviews] = await Promise.all([
      prisma.learningEvent.aggregate({
        where: {
          userId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        _sum: { duration: true },
      }),
      prisma.aIMessage.count({
        where: {
          role: 'user',
          createdAt: { gte: dayStart, lt: dayEnd },
          conversation: { userId },
        },
      }),
      prisma.aICorrection.count({
        where: {
          userId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      prisma.sRSReview.count({
        where: {
          userId,
          reviewedAt: { gte: dayStart, lt: dayEnd },
        },
      }),
    ]);

    const studyMinutes = Math.round((learningEvents._sum.duration || 0) / 60);
    const wordsReviewed = srsReviews;
    const wordsLearned = await prisma.userWord.count({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    });

    // 计算XP
    const xpEarned = studyMinutes * 2 + wordsLearned * 5 + wordsReviewed * 3;

    const report = await prisma.learningReport.create({
      data: {
        userId,
        reportDate: date,
        studyMinutes,
        wordsLearned,
        wordsReviewed,
        xpEarned,
        conversationsCount,
        correctionsCount,
        streakDays: 0,
      },
    });

    return report;
  }

  _formatReport(report) {
    return {
      date: report.reportDate.toISOString().split('T')[0],
      studyMinutes: report.studyMinutes,
      wordsLearned: report.wordsLearned,
      wordsReviewed: report.wordsReviewed,
      xpEarned: report.xpEarned,
      conversationsCount: report.conversationsCount,
      correctionsCount: report.correctionsCount,
      streakDays: report.streakDays,
    };
  }
}

module.exports = new ReportService();