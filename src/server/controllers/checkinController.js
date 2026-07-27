// ============================================================
// src/server/controllers/checkinController.js
// 签到控制器：每日签到 + 连续打卡 + XP奖励
// 前端调用: POST /api/checkin (doCheckIn)
// Dashboard: GET /api/dashboard 返回 checkInStreak + todayCheckedIn
// ============================================================
const prisma = require('../../config/database');

const checkinController = {
  /**
   * POST /api/checkin — 执行签到
   * 幂等：同用户同日不可重复签到（利用 @@unique([userId, checkinDate])）
   */
  async doCheckin(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // 取今日日期（UTC+8 北京时间，按日期而非时间戳）
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 查今日是否已签到
      const existing = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: today },
        },
      });

      if (existing) {
        return res.json({
          success: true,
          data: {
            todayCheckedIn: true,
            streak: existing.streak,
            xpAwarded: 0,
            message: 'Already checked in today',
          },
        });
      }

      // 查昨日是否签到（计算连续天数）
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCheckin = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: yesterday },
        },
      });

      const prevStreak = yesterdayCheckin ? yesterdayCheckin.streak : 0;
      const newStreak = prevStreak + 1;

      // 计算奖励XP：每天5 XP，连续7天额外20 XP
      let xpAwarded = 5;
      if (newStreak % 7 === 0) {
        xpAwarded += 20; // 7天连续奖励
      }

      // 写入签到记录
      await prisma.checkin.create({
        data: {
          userId,
          checkinDate: today,
          streak: newStreak,
          xpAwarded,
        },
      });

      return res.json({
        success: true,
        data: {
          todayCheckedIn: true,
          streak: newStreak,
          xpAwarded,
          message: `Check-in successful! Streak: ${newStreak} days`,
        },
      });
    } catch (error) {
      // 幂等冲突：并发重复签到
      if (error.code === 'P2002') {
        return res.json({
          success: true,
          data: {
            todayCheckedIn: true,
            streak: 0,
            xpAwarded: 0,
            message: 'Already checked in today',
          },
        });
      }
      next(error);
    }
  },

  /**
   * GET /api/checkin — 获取签到状态
   * 返回当前连续天数 + 今日是否已签到
   */
  async getCheckinStatus(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayCheckin = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: today },
        },
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCheckin = await prisma.checkin.findUnique({
        where: {
          userId_checkinDate: { userId, checkinDate: yesterday },
        },
      });

      const streak = todayCheckin
        ? todayCheckin.streak
        : (yesterdayCheckin ? yesterdayCheckin.streak : 0);

      return res.json({
        success: true,
        data: {
          todayCheckedIn: !!todayCheckin,
          streak,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = checkinController;