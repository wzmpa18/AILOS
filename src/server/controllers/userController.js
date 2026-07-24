// ============================================================
// src/server/controllers/userController.js
// BUG-016: 用户学习进度查询
// GET /api/user/progress/:lang — 返回 LearningProgress 分层数据
// ============================================================
const prisma = require('../../config/database');

const userController = {
  /**
   * GET /api/user/progress/:lang
   * 返回指定语言的学习进度（词汇/语法/听力/阅读/口语分层数据）
   */
  async getProgress(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { lang } = req.params;
      if (!lang) {
        return res.status(400).json({ success: false, error: 'Language code is required' });
      }

      // 查询 LearningProgress 表
      const progress = await prisma.learningProgress.findMany({
        where: {
          userId,
          languageCode: lang,
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []);

      // 查询词汇量
      const wordCount = await prisma.userWord.count({
        where: { userId },
      }).catch(() => 0);

      // 查询学习时长
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEvents = await prisma.learningEvent.aggregate({
        where: {
          userId,
          createdAt: { gte: today },
        },
        _sum: { duration: true },
      }).catch(() => ({ _sum: { duration: 0 } }));

      const todayMinutes = Math.round((todayEvents._sum?.duration || 0) / 60);

      // 返回分层进度数据
      const response = {
        languageCode: lang,
        vocabulary: {
          learned: wordCount,
          total: 100, // 默认目标
          progress: Math.min(100, Math.round((wordCount / 100) * 100)),
        },
        grammar: {
          learned: progress.filter(p => p.skillType === 'grammar').length,
          total: 50,
          progress: 0,
        },
        listening: {
          learned: progress.filter(p => p.skillType === 'listening').length,
          total: 30,
          progress: 0,
        },
        reading: {
          learned: progress.filter(p => p.skillType === 'reading').length,
          total: 30,
          progress: 0,
        },
        speaking: {
          learned: progress.filter(p => p.skillType === 'speaking').length,
          total: 30,
          progress: 0,
        },
        todayMinutes,
        level: progress[0]?.level || 'beginner',
        lastActiveAt: progress[0]?.updatedAt || null,
      };

      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/user/profile
   * 返回用户基本信息（供前端各页面使用）
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          phone: true,
          email: true,
          xp: true,
          membershipLevel: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;