// ============================================================
// src/services/contextResolver.js
// GAP-03 / GAP-04 合规组件 —— AI 语言上下文唯一真值源
// 设计铁律：
//  1. 所有 AI / 翻译调用必须通过本组件用 userId 从数据库解析双语言，
//     直接忽略任何前端传入的语言参数（彻底杜绝前端篡改语言配置）。
//  2. 用户双语言配置不完整（缺母语或目标语言）时，直接抛出标准错误，
//     禁止任何静默默认语种兜底（对应宪法第九章 9.3 / 附件 L E.4.2）。
// 数据来源（与宪法 user_profiles.native_language/target_language 对齐）：
//  - 母语 nativeLanguage      -> UserLanguagePreference.nativeLanguage
//  - 目标语言 targetLanguage   -> UserLearningLanguage(languageCode, status=active, 最高优先级)
// ============================================================
const prisma = require('../config/database');
// 归一化规则唯一真源（供本组件与 P2 一致性校验共用，避免逻辑漂移）
const { normalizeLang } = require('../utils/langNormalize');

class LangConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LangConfigError';
    this.code = 'LANG_CONFIG_INCOMPLETE';
    this.httpStatus = 400;
  }
}

/**
 * 用 userId 从数据库解析用户的双语言上下文。
 * @param {string} userId
 * @returns {Promise<{nativeLanguage:string,targetLanguage:string,primaryTargetLanguage:string,explanationLanguage:string}>}
 * @throws {LangConfigError} 当 userId 缺失或双语言配置不完整
 */
async function resolve(userId) {
  if (!userId || userId === 'system') {
    throw new LangConfigError('缺少有效 userId，无法从数据库解析语言上下文');
  }

  const pref = await prisma.userLanguagePreference.findUnique({ where: { userId } });
  if (!pref) {
    throw new LangConfigError('用户语言配置缺失（UserLanguagePreference 不存在），请先完成语言设置');
  }

  const rawNative = pref.nativeLanguage || pref.defaultExplanationLanguage;
  const nativeLanguage = normalizeLang(rawNative);
  if (!nativeLanguage) {
    throw new LangConfigError('用户母语配置缺失（nativeLanguage 为空），请先完成语言设置');
  }

  const learning = await prisma.userLearningLanguage.findFirst({
    where: { userId, status: 'active' },
    orderBy: { priority: 'asc' },
  });
  const targetLanguage = normalizeLang(learning?.languageCode);
  if (!targetLanguage) {
    throw new LangConfigError('用户目标语言配置缺失（无 active UserLearningLanguage），请先完成语言设置');
  }

  return {
    nativeLanguage,
    targetLanguage,
    primaryTargetLanguage: targetLanguage,
    explanationLanguage: nativeLanguage,
  };
}

module.exports = { resolve, LangConfigError, normalizeLang };
