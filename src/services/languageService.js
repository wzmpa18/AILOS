const prisma = require('../config/database');
const logger = require('../utils/logger');

const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文', nameEn: 'Chinese', nameLocal: '中文' },
  { code: 'en', name: '英语', nameEn: 'English', nameLocal: 'English' },
  { code: 'ja', name: '日语', nameEn: 'Japanese', nameLocal: '日本語' },
  { code: 'ko', name: '韩语', nameEn: 'Korean', nameLocal: '한국어' },
  { code: 'fr', name: '法语', nameEn: 'French', nameLocal: 'Français' },
  { code: 'es', name: '西班牙语', nameEn: 'Spanish', nameLocal: 'Español' },
  { code: 'de', name: '德语', nameEn: 'German', nameLocal: 'Deutsch' },
];

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
        nativeLanguage: preference?.nativeLanguage || null,
        interfaceLanguage: preference?.interfaceLanguage || null,
        targetLanguages: learningLanguages.map((l) => ({
          languageCode: l.languageCode,
          level: l.level,
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
      if (!nativeLanguage) throw new Error('nativeLanguage is required');
      if (!targetLanguages || targetLanguages.length === 0) {
        throw new Error('At least one target language is required');
      }

      const validCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
      if (!validCodes.includes(nativeLanguage)) {
        throw new Error(`Invalid native language: ${nativeLanguage}`);
      }
      for (const tl of targetLanguages) {
        if (!validCodes.includes(tl)) {
          throw new Error(`Invalid target language: ${tl}`);
        }
        if (tl === nativeLanguage) {
          throw new Error(`Target language cannot be same as native language: ${tl}`);
        }
      }

      const uiLang = interfaceLanguage || nativeLanguage;

      await prisma.$transaction([
        prisma.userLanguagePreference.upsert({
          where: { userId },
          update: {
            nativeLanguage,
            interfaceLanguage: uiLang,
            defaultExplanationLanguage: nativeLanguage,
            fallbackLanguage: 'zh-CN',
          },
          create: {
            userId,
            nativeLanguage,
            interfaceLanguage: uiLang,
            defaultExplanationLanguage: nativeLanguage,
            fallbackLanguage: 'zh-CN',
          },
        }),
        prisma.userLearningLanguage.updateMany({
          where: { userId, status: 'active' },
          data: { status: 'inactive' },
        }),
      ]);

      for (let i = 0; i < targetLanguages.length; i++) {
        await prisma.userLearningLanguage.upsert({
          where: {
            userId_languageCode: {
              userId,
              languageCode: targetLanguages[i],
            },
          },
          update: {
            status: 'active',
            priority: i + 1,
            level: 'A1',
          },
          create: {
            userId,
            languageCode: targetLanguages[i],
            level: 'A1',
            priority: i + 1,
            status: 'active',
          },
        });
      }

      logger.info(`Language preferences updated for user ${userId}: native=${nativeLanguage}, targets=${targetLanguages.join(',')}`);

      return { success: true };
    } catch (error) {
      logger.error('Update user languages failed:', error);
      throw error;
    }
  }
}

module.exports = new LanguageService();