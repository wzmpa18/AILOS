// ============================================================
// src/server/controllers/userController.js
// BUG-016: 用户学习进度查询
// GET /api/user/progress/:lang — 返回 LearningProgress 分层数据
// ============================================================
const prisma = require('../../config/database');
const contentFilter = require('../../utils/contentFilter');

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
          language: lang,
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
   * POST /api/user/progress
   * REQ-04: 定级结果落库（upsert LearningProgress.level by userId+language）
   */
  async saveProgress(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const { language, level } = req.body || {};
      if (!language || !level) {
        return res.status(400).json({ success: false, error: 'language and level are required' });
      }
      const progress = await prisma.learningProgress.upsert({
        where: { userId_language: { userId, language } },
        update: { level },
        create: { userId, language, level },
      });
      return res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/user/profile  &  GET /api/user/me
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

      // 从 UserLanguagePreference 表获取语言偏好
      const langPref = await prisma.userLanguagePreference.findUnique({
        where: { userId },
      });

      return res.json({
        success: true,
        data: {
          ...user,
          nativeLanguage: langPref?.nativeLanguage || 'zh-CN',
          targetLanguage: langPref?.targetLanguage || 'en',
          interfaceLanguage: langPref?.interfaceLanguage || 'zh-CN',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/user/profile
   * Stage 9 P0 Fix: 更新个人资料（昵称/头像/母语/目标语言/界面语言/密码等）
   * 前端 profile.html 调用此接口保存昵称、语言设置等
   * 注意：nativeLanguage/targetLanguage/interfaceLanguage 存储在 UserLanguagePreference 表
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // User 表字段
      const userFields = ['nickname', 'avatar'];
      const userUpdateData = {};

      for (const field of userFields) {
        if (req.body[field] !== undefined) {
          userUpdateData[field] = req.body[field];
        }
      }

      // Stage 9 VETO: 昵称敏感词过滤 (使用 contentFilter.filterContent)
      if (userUpdateData.nickname) {
        const filterResult = contentFilter.auditAndFilter(userUpdateData.nickname, {
          userId,
          scene: 'user_nickname',
        });
        if (!filterResult.passed) {
          return res.status(400).json(filterResult.errorResponse || {
            success: false,
            code: 9004,
            error: 'Nickname contains prohibited content',
          });
        }
      }

      // 密码修改单独处理
      if (req.body.oldPassword && req.body.newPassword) {
        const bcrypt = require('bcryptjs');
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }
        const valid = await bcrypt.compare(req.body.oldPassword, user.passwordHash);
        if (!valid) {
          return res.status(400).json({ success: false, error: '原密码不正确' });
        }
        userUpdateData.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
      }

      // 语言设置写入 UserLanguagePreference 表
      const langFields = ['nativeLanguage', 'targetLanguage', 'interfaceLanguage'];
      const langUpdateData = {};

      for (const field of langFields) {
        if (req.body[field] !== undefined) {
          langUpdateData[field] = req.body[field];
        }
      }

      // 执行更新
      const promises = [];

      if (Object.keys(userUpdateData).length > 0) {
        promises.push(
          prisma.user.update({
            where: { id: userId },
            data: userUpdateData,
          })
        );
      }

      if (Object.keys(langUpdateData).length > 0) {
        promises.push(
          prisma.userLanguagePreference.upsert({
            where: { userId },
            update: langUpdateData,
            create: { userId, ...langUpdateData },
          })
        );
      }

      if (promises.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields to update' });
      }

      await Promise.all(promises);

      // 读取更新后的用户信息
      const updatedUser = await prisma.user.findUnique({
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

      const langPref = await prisma.userLanguagePreference.findUnique({
        where: { userId },
      });

      return res.json({
        success: true,
        data: {
          ...updatedUser,
          nativeLanguage: langPref?.nativeLanguage || 'zh-CN',
          targetLanguage: langPref?.targetLanguage || 'en',
          interfaceLanguage: langPref?.interfaceLanguage || 'zh-CN',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/user/me
   * 删除当前用户账号
   */
  async deleteAccount(req, res, next) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // 软删除：标记为 deleted
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      return res.json({
        success: true,
        message: 'Account deleted',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;