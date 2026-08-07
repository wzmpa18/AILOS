/**
 * src/server/services/languageBillingService.js
 * 自定义语言差异化计费服务
 * 
 * 规则：
 * - 系统预设 7 语言 (en/ja/ko/fr/es/de/zh): 完全免费，不扣减
 * - 自定义语言: 免费项（界面显示/本地存储）不扣减
 * - 自定义语言: AI 生成/翻译/对话/评测: 消耗配额
 */

const logger = require('../../utils/logger');

// 惰性获取 Prisma：避免模块顶层加载时数据库未就绪导致 require 链崩溃
function getPrisma() {
  return require('../../config/database');
}

const SYSTEM_LANGUAGES = ['en', 'ja', 'ko', 'fr', 'es', 'de', 'zh'];

const CHARGEABLE_SERVICES = ['vocab', 'grammar', 'sentence', 'reading', 'translate', 'chat', 'evaluate', 'listening'];

const FREE_SERVICES = ['display', 'storage', 'config', 'navigation'];

/**
 * 判断语言是否为系统预设
 */
function isSystemLanguage(language) {
  return SYSTEM_LANGUAGES.includes(language?.toLowerCase());
}

/**
 * 判断服务是否计费
 */
function isChargeableService(serviceType) {
  return CHARGEABLE_SERVICES.includes(serviceType);
}

/**
 * 获取用户自定义语言配额
 */
async function getQuota(userId) {
  try {
    const prisma = getPrisma();
    let quota = await prisma.customLanguageQuota.findUnique({ where: { userId } });
    if (!quota) {
      // 新建配额：普通用户50次/月
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      quota = await prisma.customLanguageQuota.create({
        data: {
          userId,
          totalQuota: 50,
          usedQuota: 0,
          resetAt: nextMonth,
        },
      });
    }

    // 检查是否需要重置
    const now = new Date();
    if (quota.resetAt && new Date(quota.resetAt) <= now) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      quota = await prisma.customLanguageQuota.update({
        where: { userId },
        data: { usedQuota: 0, resetAt: nextMonth },
      });
    }

    return {
      total: quota.totalQuota,
      used: quota.usedQuota,
      remaining: quota.totalQuota - quota.usedQuota,
      resetAt: quota.resetAt,
    };
  } catch (error) {
    logger.error('LanguageBillingService: getQuota error', error.message);
    return { total: 0, used: 0, remaining: 0, resetAt: null };
  }
}

/**
 * 检查并扣减配额
 * @returns {{ allowed: boolean, remaining: number, reason?: string }}
 */
async function checkAndDeduct(userId, language, serviceType) {
  try {
    // 系统语言 → 免费
    if (isSystemLanguage(language)) {
      return { allowed: true, remaining: -1, free: true };
    }

    // 免费服务类型 → 不扣减
    if (!isChargeableService(serviceType)) {
      return { allowed: true, remaining: -1, free: true };
    }

    // 获取配额
    const quota = await getQuota(userId);

    if (quota.remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        reason: `自定义语言 AI 额度已用尽（${quota.used}/${quota.total}），请升级会员或等待下月重置`,
      };
    }

    // 扣减配额
    const prisma = getPrisma();
    await prisma.customLanguageQuota.update({
      where: { userId },
      data: { usedQuota: { increment: 1 } },
    });

    // 记录消费
    await prisma.languageBillingLog.create({
      data: {
        userId,
        language,
        serviceType,
        costAmount: 1,
        quotaRemaining: quota.remaining - 1,
      },
    });

    return { allowed: true, remaining: quota.remaining - 1 };
  } catch (error) {
    logger.error('LanguageBillingService: checkAndDeduct error', error.message);
    // 计费服务异常时放行（不因计费阻断功能）
    return { allowed: true, remaining: -1, billingError: true };
  }
}

/**
 * 获取用户消费明细
 */
async function getBillingHistory(userId, options = {}) {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20 } = options;
    const records = await prisma.languageBillingLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.languageBillingLog.count({ where: { userId } });

    return {
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('LanguageBillingService: getBillingHistory error', error.message);
    return { records: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
}

module.exports = {
  SYSTEM_LANGUAGES,
  CHARGEABLE_SERVICES,
  isSystemLanguage,
  isChargeableService,
  getQuota,
  checkAndDeduct,
  getBillingHistory,
};
