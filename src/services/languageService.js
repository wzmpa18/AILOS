const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文', nameEn: 'Chinese', nameLocal: '中文' },
  { code: 'en', name: '英语', nameEn: 'English', nameLocal: 'English' },
  { code: 'ja', name: '日语', nameEn: 'Japanese', nameLocal: '日本語' },
  { code: 'ko', name: '韩语', nameEn: 'Korean', nameLocal: '한국어' },
  { code: 'fr', name: '法语', nameEn: 'French', nameLocal: 'Français' },
  { code: 'es', name: '西班牙语', nameEn: 'Spanish', nameLocal: 'Español' },
  { code: 'de', name: '德语', nameEn: 'German', nameLocal: 'Deutsch' },
];

// 前端使用的等级值
const FRONTEND_LEVELS = ['beginner', 'intermediate', 'advanced'];

// CEFR 等级 -> 前端等级映射（向后兼容旧数据）
const CEFR_TO_FRONTEND_LEVEL = {
  'A1': 'beginner', 'A2': 'beginner',
  'B1': 'intermediate', 'B2': 'intermediate',
  'C1': 'advanced', 'C2': 'advanced',
};

// 后端存储编码 -> 前端编码（zh-CN -> zh）
function toFrontendCode(code) {
  if (!code) return code;
  return code === 'zh-CN' ? 'zh' : code;
}

// 前端编码 -> 后端存储编码（zh -> zh-CN）
function toBackendCode(code) {
  if (!code) return code;
  return code === 'zh' ? 'zh-CN' : code;
}

// 规范化等级：前端等级直接使用，CEFR 等级映射为前端等级，兜底 beginner
function normalizeLevel(level) {
  if (!level) return 'beginner';
  if (FRONTEND_LEVELS.includes(level)) return level;
  if (CEFR_TO_FRONTEND_LEVEL[level]) return CEFR_TO_FRONTEND_LEVEL[level];
  return 'beginner';
}

class LanguageService {
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  async getUserLanguages(userId) {
    try {
      const preference = await prisma.userLanguagePreference.findUnique({
        where: { userId },
      });

      const learningLanguages = await prisma.userLearningLanguage.findMany({
        where: { userId, status: 'active' },
        orderBy: { priority: 'asc' },
      });

      return {
        nativeLanguage: toFrontendCode(preference?.nativeLanguage || null),
        interfaceLanguage: toFrontendCode(preference?.interfaceLanguage || null),
        targetLanguages: learningLanguages.map((l) => ({
          code: toFrontendCode(l.languageCode),       // 前端兼容字段（zh-CN -> zh）
          languageCode: l.languageCode,                // 原始存储编码，向后兼容（dashboardService 等使用）
          level: normalizeLevel(l.level),              // 规范化为前端等级（beginner/intermediate/advanced）
          priority: l.priority,
        })),
        isConfigured: !!(preference?.nativeLanguage && learningLanguages.length > 0),
        supportedLanguages: SUPPORTED_LANGUAGES,
      };
    } catch (error) {
      logger.error('Get user languages failed:', error);
      throw error;
    }
  }

  async updateUserLanguages(userId, { nativeLanguage, targetLanguages, interfaceLanguage }) {
    try {
      if (!nativeLanguage) {
        const err = new Error('nativeLanguage is required');
        err.statusCode = 400;
        throw err;
      }
      if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        const err = new Error('At least one target language is required');
        err.statusCode = 400;
        throw err;
      }

      // 规范化母语编码（兼容 zh 和 zh-CN）
      const normalizedNative = toBackendCode(nativeLanguage);

      // 规范化目标语言：统一为 {code, level} 对象，兼容字符串和对象两种入参
      // Bug 2：允许自定义语言编码（不在 SUPPORTED_LANGUAGES 中的语言直接存储名称）
      const normalizedTargets = [];
      const seenCodes = new Set();
      for (const tl of targetLanguages) {
        let code, level;
        if (typeof tl === 'string') {
          code = tl;
          level = 'beginner';
        } else if (tl && typeof tl === 'object' && typeof tl.code === 'string') {
          code = tl.code;
          level = tl.level || 'beginner';
        } else {
          const err = new Error('targetLanguages 的每个元素必须为字符串或包含 code 字段的对象');
          err.statusCode = 400;
          throw err;
        }
        code = toBackendCode(code.trim());
        if (!code) {
          const err = new Error('目标语言编码不能为空');
          err.statusCode = 400;
          throw err;
        }
        if (code === normalizedNative) {
          const err = new Error(`目标语言不能与母语相同: ${code}`);
          err.statusCode = 400;
          throw err;
        }
        if (seenCodes.has(code)) {
          continue; // 去重，避免同一语言重复写入
        }
        seenCodes.add(code);
        normalizedTargets.push({ code, level: normalizeLevel(level) });
      }

      if (normalizedTargets.length === 0) {
        const err = new Error('At least one target language is required');
        err.statusCode = 400;
        throw err;
      }

      // 规范化界面语言（兼容 zh 和 zh-CN，缺省时回退到母语）
      const normalizedInterface = interfaceLanguage ? toBackendCode(interfaceLanguage) : normalizedNative;
      const uiLang = normalizedInterface || normalizedNative;

      await prisma.$transaction([
        prisma.userLanguagePreference.upsert({
          where: { userId },
          update: {
            nativeLanguage: normalizedNative,
            interfaceLanguage: uiLang,
            defaultExplanationLanguage: normalizedNative,
            fallbackLanguage: 'zh-CN',
          },
          create: {
            userId,
            nativeLanguage: normalizedNative,
            interfaceLanguage: uiLang,
            defaultExplanationLanguage: normalizedNative,
            fallbackLanguage: 'zh-CN',
          },
        }),
        prisma.userLearningLanguage.updateMany({
          where: { userId, status: 'active' },
          data: { status: 'inactive' },
        }),
      ]);

      for (let i = 0; i < normalizedTargets.length; i++) {
        await prisma.userLearningLanguage.upsert({
          where: {
            userId_languageCode: {
              userId,
              languageCode: normalizedTargets[i].code,
            },
          },
          update: {
            status: 'active',
            priority: i,
            level: normalizedTargets[i].level,
          },
          create: {
            userId,
            languageCode: normalizedTargets[i].code,
            level: normalizedTargets[i].level,
            priority: i,
            status: 'active',
          },
        });
      }

      logger.info(`Language preferences updated for user ${userId}: native=${normalizedNative}, targets=${normalizedTargets.map(t => t.code).join(',')}`);

      // 整改1：语言修改成功后强制清空该用户 AI 响应缓存，避免旧语言缓存命中
      try {
        await getAIGateway().clearUserCache(userId);
      } catch (cacheErr) {
        logger.warn('LanguageService', 'clearUserCache after language update failed', { error: cacheErr.message });
      }

      return { success: true };
    } catch (error) {
      logger.error('Update user languages failed:', error);
      throw error;
    }
  }
}

module.exports = new LanguageService();
