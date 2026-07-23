// ============================================================
// src/server/controllers/dashboardController.js
// 学习驾驶舱：首页数据聚合
// GET /api/dashboard
// 返回：用户信息、学习统计、AI额度、签到状态、连续天数
// ============================================================
const prisma = require('../../config/database');

const dashboardController = {
  /**
   * GET /api/dashboard
   * 返回用户首页所需全部数据
   */
  async getDashboard(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // 1. 用户基本信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          phone: true,
          xp: true,
          level: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // 2. 签到状态
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayCheckin = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: today },
        },
      }).catch(() => null);

      const yesterdayCheckin = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: yesterday },
        },
      }).catch(() => null);

      const checkInStreak = todayCheckin
        ? todayCheckin.streak
        : (yesterdayCheckin ? yesterdayCheckin.streak : 0);

      const todayCheckedIn = !!todayCheckin;

      // 3. AI 使用额度（从 Redis 或数据库获取）
      let aiQuota = { conversation: 0, correction: 0, maxConversation: 5, maxCorrection: 3 };
      try {
        // 尝试从 Redis 获取当日使用量
        const redis = req.app.get('redis');
        if (redis) {
          const dateKey = today.toISOString().split('T')[0];
          const convKey = `quota:${userId}:${dateKey}:conversation`;
          const corrKey = `quota:${userId}:${dateKey}:correction`;
          const [conv, corr] = await Promise.all([
            redis.get(convKey).catch(() => 0),
            redis.get(corrKey).catch(() => 0),
          ]);
          aiQuota.conversation = parseInt(conv) || 0;
          aiQuota.correction = parseInt(corr) || 0;
        }
      } catch (e) {
        // Redis 不可用时返回默认值
      }

      // 4. 学习统计
      let learningStats = {
        totalWords: 0,
        totalMinutes: 0,
        todayMinutes: 0,
        streak: 0,
      };
      try {
        // 总学习时长（分钟）
        const learningEvents = await prisma.learningEvent.aggregate({
          where: { userId },
          _sum: { duration: true },
        }).catch(() => ({ _sum: { duration: 0 } }));
        learningStats.totalMinutes = Math.round((learningEvents._sum?.duration || 0) / 60);

        // 今日学习时长
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const todayEvents = await prisma.learningEvent.aggregate({
          where: {
            userId,
            createdAt: { gte: todayStart, lt: todayEnd },
          },
          _sum: { duration: true },
        }).catch(() => ({ _sum: { duration: 0 } }));
        learningStats.todayMinutes = Math.round((todayEvents._sum?.duration || 0) / 60);

        // 词汇量
        const wordCount = await prisma.userWord.count({
          where: { userId },
        }).catch(() => 0);
        learningStats.totalWords = wordCount;
      } catch (e) {
        // 学习事件表可能不存在，返回默认值
      }

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
            phone: user.phone,
            xp: user.xp || 0,
            level: user.level || 1,
          },
          checkin: {
            todayCheckedIn,
            checkInStreak,
          },
          aiQuota: {
            used: {
              conversation: aiQuota.conversation,
              correction: aiQuota.correction,
            },
            max: {
              conversation: aiQuota.maxConversation,
              correction: aiQuota.maxCorrection,
            },
          },
          learning: learningStats,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = dashboardController;