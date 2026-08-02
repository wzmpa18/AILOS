// ============================================================
// src/server/controllers/userController.js
// BUG-016: 用户学习进度查询
// GET /api/user/progress/:lang — 返回 LearningProgress 分层数据
// ============================================================
const prisma = require('../../config/database');
const contentFilter = require('../../utils/contentFilter');

// Default avatar URL — parrot image for the language learning app
const DEFAULT_AVATAR = '/assets/images/default_avatar.png';

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

      // P0 FIX: Query UserLearningLanguage table for real target language
      const learningLanguages = await prisma.userLearningLanguage.findMany({
        where: { userId, status: 'active' },
        orderBy: { priority: 'asc' },
      });

      function toFrontendCode(code) {
        if (!code) return null;
        const base = code.split('-')[0].toLowerCase();
        const map = { 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'ja-jp': 'ja', 'ko-kr': 'ko', 'en-us': 'en', 'en-gb': 'en', 'fr-fr': 'fr', 'es-es': 'es', 'de-de': 'de' };
        return map[code.toLowerCase()] || base;
      }

      let targetLanguage = 'en';
      let assessedLevel = null;
      if (learningLanguages && learningLanguages.length > 0) {
        targetLanguage = toFrontendCode(learningLanguages[0].languageCode) || 'en';
        assessedLevel = learningLanguages[0].level || null;
      }

      const LANG_NAMES = { ja: '日语', en: '英语', ko: '韩语', fr: '法语', es: '西班牙语', de: '德语', zh: '中文' };

      return res.json({
        success: true,
        data: {
          ...user,
          avatar: user.avatar || DEFAULT_AVATAR,
          nativeLanguage: toFrontendCode(langPref?.nativeLanguage) || 'zh',
          targetLanguage: targetLanguage,
          targetLanguageName: LANG_NAMES[targetLanguage] || targetLanguage,
          assessedLevel: assessedLevel,
          interfaceLanguage: toFrontendCode(langPref?.interfaceLanguage) || 'zh',
          explanationLanguage: toFrontendCode(langPref?.defaultExplanationLanguage) || 'zh',
          userLearningLanguages: learningLanguages.map(l => ({
            languageCode: l.languageCode,
            language: toFrontendCode(l.languageCode) || l.languageCode,
            level: l.level,
            status: l.status,
            priority: l.priority,
          })),
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
          endpoint: '/api/user/profile',
          clientIP: req.ip || req.connection?.remoteAddress,
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
      const langFields = ['nativeLanguage', 'defaultExplanationLanguage', 'interfaceLanguage'];
      const langUpdateData = {};

      for (const field of langFields) {
        if (req.body[field] !== undefined) {
          langUpdateData[field] = req.body[field];
        }
      }

      // P0 FIX: targetLanguage writes to UserLearningLanguage table, not defaultExplanationLanguage
      if (req.body['targetLanguage'] !== undefined) {
        const targetLangCode = req.body['targetLanguage'];
        const dbLangCode = { ja: 'ja-JP', en: 'en-US', ko: 'ko-KR', fr: 'fr-FR', es: 'es-ES', de: 'de-DE', zh: 'zh-CN' }[targetLangCode] || targetLangCode;

        // Will be added to promises array below
        // Stored for later execution
        if (!global._targetLangUpsert) global._targetLangUpsert = {};
        global._targetLangUpsert.userId = userId;
        global._targetLangUpsert.dbLangCode = dbLangCode;
      }

      // 执行更新
      const promises = [];

      // P0 FIX: Add targetLanguage upsert to promises
      if (global._targetLangUpsert && global._targetLangUpsert.userId === userId) {
        const upsertUserId = global._targetLangUpsert.userId;
        const upsertLangCode = global._targetLangUpsert.dbLangCode;
        promises.push(
          prisma.userLearningLanguage.upsert({
            where: { userId_languageCode: { userId: upsertUserId, languageCode: upsertLangCode } },
            update: { status: 'active' },
            create: { userId: upsertUserId, languageCode: upsertLangCode, status: 'active', priority: 1 },
          }).then(async () => {
            await prisma.userLearningLanguage.updateMany({
              where: { userId: upsertUserId, NOT: { languageCode: upsertLangCode } },
              data: { status: 'inactive' },
            });
          })
        );
        delete global._targetLangUpsert;
      }

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

      // P0 FIX: Query UserLearningLanguage for real target language
      const updatedLearningLangs = await prisma.userLearningLanguage.findMany({
        where: { userId, status: 'active' },
        orderBy: { priority: 'asc' },
      });

      function toFc(code) {
        if (!code) return null;
        const base = code.split('-')[0].toLowerCase();
        const map = { 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hk': 'zh', 'ja-jp': 'ja', 'ko-kr': 'ko', 'en-us': 'en', 'en-gb': 'en', 'fr-fr': 'fr', 'es-es': 'es', 'de-de': 'de' };
        return map[code.toLowerCase()] || base;
      }

      let updatedTargetLang = 'en';
      if (updatedLearningLangs && updatedLearningLangs.length > 0) {
        updatedTargetLang = toFc(updatedLearningLangs[0].languageCode) || 'en';
      }

      return res.json({
        success: true,
        data: {
          ...updatedUser,
          avatar: updatedUser.avatar || DEFAULT_AVATAR,
          nativeLanguage: toFc(langPref?.nativeLanguage) || 'zh',
          targetLanguage: updatedTargetLang,
          interfaceLanguage: toFc(langPref?.interfaceLanguage) || 'zh',
          explanationLanguage: toFc(langPref?.defaultExplanationLanguage) || 'zh',
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