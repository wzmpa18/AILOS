/**
 * src/services/costCircuitBreaker.js
 * AI 成本熔断器 — 额度耗尽时的降级与缓存回退
 *
 * 功能：
 * 1. 检查用户 AI 额度是否耗尽（通过 aiQuotaService）
 * 2. 额度耗尽时返回资产库缓存内容（走 learningContent 表）
 * 3. 如果缓存也没有，返回降级提示而非报错
 * 4. 熔断阈值可配置（从 SystemConfig 读取）
 * 5. 与 aiGateway 集成
 *
 * 熔断三级策略：
 *   Level 1 (WARN):   额度使用 >= 80% — 标记预警，仍可调用 AI
 *   Level 2 (SOFT):   额度使用 >= 95% — 软熔断，优先走资产库缓存
 *   Level 3 (HARD):   额度耗尽           — 硬熔断，仅返回缓存/降级内容
 */

const prisma = require('../config/database');
const aiQuotaService = require('./aiQuotaService');
const { getSystemConfigService } = require('./systemConfigService');
const logger = require('../utils/logger');

// ==================== 默认配置 ====================
const DEFAULT_CONFIG = {
  // 熔断阈值（百分比，0-1）
  warnThreshold: 0.80,       // 预警阈值：额度使用 >= 80%
  softBreakThreshold: 0.95,  // 软熔断阈值：额度使用 >= 95%
  hardBreakThreshold: 1.0,   // 硬熔断阈值：额度耗尽

  // 降级配置
  fallbackCacheTtl: 86400,   // 降级缓存 TTL（秒）
  maxCacheItems: 20,         // 降级时最多返回的缓存条数

  // 降级提示文案
  degradationMessages: {
    zh: '您的AI额度已用完，以下是系统为您准备的缓存学习内容。明日0点自动重置额度。',
    en: 'Your AI quota has been exhausted. Here are cached learning materials for you. Quota resets at midnight.',
    ja: 'AI利用枠が上限に達しました。キャッシュされた学習コンテンツをご利用ください。',
    ko: 'AI 할당량이 소진되었습니다. 캐시된 학습 콘텐츠를 이용해 주세요.',
  },
};

class CostCircuitBreaker {
  /**
   * 获取配置（从 SystemConfig 动态读取，合并默认值）
   */
  async _getConfig() {
    try {
      const systemConfig = getSystemConfigService();
      const dbConfig = await systemConfig.getJson('cost_circuit_breaker', {});
      return { ...DEFAULT_CONFIG, ...dbConfig };
    } catch (error) {
      logger.debug('CostCircuitBreaker: 读取配置失败，使用默认配置', error.message);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 检查用户 AI 额度状态
   * @param {string} userId - 用户 ID
   * @returns {Promise<{ level: 'NORMAL'|'WARN'|'SOFT'|'HARD', allowed: boolean, remaining: number, dailyTotal: number, usagePct: number, degradeMessage: string }>}
   */
  async checkQuota(userId) {
    try {
      const quota = await aiQuotaService.getQuota(userId);
      const config = await this._getConfig();

      const usagePct = quota.dailyTotal > 0
        ? (quota.used / quota.dailyTotal)
        : 0;

      let level = 'NORMAL';
      let allowed = true;
      let degradeMessage = '';

      if (usagePct >= config.hardBreakThreshold) {
        level = 'HARD';
        allowed = false;
        degradeMessage = config.degradationMessages.zh;
      } else if (usagePct >= config.softBreakThreshold) {
        level = 'SOFT';
        allowed = false;
        degradeMessage = config.degradationMessages.zh;
      } else if (usagePct >= config.warnThreshold) {
        level = 'WARN';
        allowed = true;
      }

      return {
        level,
        allowed,
        remaining: quota.remaining,
        dailyTotal: quota.dailyTotal,
        usagePct: Math.round(usagePct * 100) / 100,
        degradeMessage,
        resetTime: quota.resetTime,
      };
    } catch (error) {
      logger.error('CostCircuitBreaker: checkQuota 失败', error.message);
      // 出错时放行，避免阻塞用户
      return {
        level: 'NORMAL',
        allowed: true,
        remaining: 0,
        dailyTotal: 0,
        usagePct: 0,
        degradeMessage: '',
        resetTime: null,
      };
    }
  }

  /**
   * 额度耗尽时，从 learningContent 资产库获取缓存内容
   * @param {Object} params
   * @param {string} params.targetLanguage - 目标语言
   * @param {string} params.contentType - 内容类型 (vocabulary|grammar|reading|listening|quiz|lesson)
   * @param {string} [params.difficultyLevel] - 难度级别
   * @param {string} [params.language] - UI 语言（用于降级提示）
   * @returns {Promise<{ items: Array, source: 'cache'|'degradation', degradeMessage: string }>}
   */
  async getCachedContent({ targetLanguage, contentType, difficultyLevel, language = 'zh' }) {
    const config = await this._getConfig();

    try {
      // 从 learningContent 表查询已发布的内容
      const where = {
        status: 'published',
        targetLanguage,
        contentType,
        ...(difficultyLevel && { difficultyLevel }),
      };

      const items = await prisma.learningContent.findMany({
        where,
        orderBy: { qualityScore: 'desc' },
        take: config.maxCacheItems,
        select: {
          id: true,
          contentType: true,
          sourceType: true,
          targetLanguage: true,
          difficultyLevel: true,
          qualityScore: true,
          reuseCount: true,
          contentData: true,
          createdAt: true,
        },
      });

      if (items.length > 0) {
        logger.log(
          `CostCircuitBreaker: 缓存命中 | targetLanguage=${targetLanguage} | contentType=${contentType} | count=${items.length}`
        );
        return {
          items,
          source: 'cache',
          degradeMessage: '',
        };
      }

      // 缓存也无内容，返回降级提示
      const degradeMsg = config.degradationMessages[language] || config.degradationMessages.zh;
      logger.warn(
        `CostCircuitBreaker: 降级无缓存 | targetLanguage=${targetLanguage} | contentType=${contentType}`
      );

      return {
        items: [],
        source: 'degradation',
        degradeMessage: degradeMsg,
      };
    } catch (error) {
      logger.error('CostCircuitBreaker: getCachedContent 失败', error.message);
      const degradeMsg = config.degradationMessages[language] || config.degradationMessages.zh;

      return {
        items: [],
        source: 'degradation',
        degradeMessage: degradeMsg,
      };
    }
  }

  /**
   * 统一入口：带熔断保护的 AI 调用
   * 与 aiGateway 集成，在调用 AI 前先检查额度
   *
   * @param {Object} params
   * @param {string} params.userId - 用户 ID
   * @param {string} params.targetLanguage - 目标语言
   * @param {string} params.contentType - 内容类型
   * @param {string} [params.difficultyLevel] - 难度级别
   * @param {string} [params.language] - UI 语言
   * @param {Function} aiCallFn - AI 调用函数（当额度充足时回调）
   * @returns {Promise<{ result: any, source: 'ai'|'cache'|'degradation', quotaStatus: Object }>}
   */
  async withCircuitBreaker({ userId, targetLanguage, contentType, difficultyLevel, language = 'zh' }, aiCallFn) {
    // 1. 检查额度
    const quotaStatus = await this.checkQuota(userId);

    // 2. 额度充足，允许 AI 调用
    if (quotaStatus.allowed) {
      logger.log(
        `CostCircuitBreaker: 额度充足，放行 AI 调用 | userId=${userId} | level=${quotaStatus.level} | remaining=${quotaStatus.remaining}`
      );
      try {
        const result = await aiCallFn();
        return { result, source: 'ai', quotaStatus };
      } catch (aiError) {
        // AI 调用失败，回退到缓存
        logger.warn('CostCircuitBreaker: AI 调用失败，回退缓存', aiError.message);
        const cached = await this.getCachedContent({ targetLanguage, contentType, difficultyLevel, language });
        return { result: cached, source: cached.source, quotaStatus };
      }
    }

    // 3. 额度不足，走缓存/降级
    logger.warn(
      `CostCircuitBreaker: 熔断触发 | userId=${userId} | level=${quotaStatus.level} | usagePct=${quotaStatus.usagePct}`
    );

    const cached = await this.getCachedContent({ targetLanguage, contentType, difficultyLevel, language });
    return { result: cached, source: cached.source, quotaStatus };
  }

  /**
   * 获取当前熔断器状态摘要（供管理后台查看）
   */
  async getStatus() {
    const config = await this._getConfig();
    return {
      thresholds: {
        warn: config.warnThreshold,
        softBreak: config.softBreakThreshold,
        hardBreak: config.hardBreakThreshold,
      },
      fallbackConfig: {
        cacheTtl: config.fallbackCacheTtl,
        maxCacheItems: config.maxCacheItems,
      },
    };
  }

  /**
   * 更新熔断器配置（写入 SystemConfig）
   * @param {Object} newConfig - 新配置（部分更新）
   */
  async updateConfig(newConfig) {
    try {
      const systemConfig = getSystemConfigService();
      const currentConfig = await systemConfig.getJson('cost_circuit_breaker', {});
      const merged = { ...DEFAULT_CONFIG, ...currentConfig, ...newConfig };
      await systemConfig.set('cost_circuit_breaker', JSON.stringify(merged));
      logger.log('CostCircuitBreaker: 配置已更新', merged);
      return { success: true, config: merged };
    } catch (error) {
      logger.error('CostCircuitBreaker: 更新配置失败', error.message);
      return { success: false, error: error.message };
    }
  }
}

// 单例导出
let _instance = null;

function getCostCircuitBreaker() {
  if (!_instance) {
    _instance = new CostCircuitBreaker();
  }
  return _instance;
}

module.exports = { CostCircuitBreaker, getCostCircuitBreaker };