/**
 * src/services/ocrQuotaService.js
 * OCR 分层限流 + 全局成本熔断（宪法 Appendix E：日 50 张 / 单日成本阈值 / 禁先用后扣）
 *
 * 预扣模型（禁止先使用后扣费）：
 *   reserve() 在事务内 count 当日非 failed 记录 → 未超限才插入 pending 占坑行 → 返回 logId
 *   OCR/翻译成功 → settle(logId, success)；失败 → settle(logId, failed)（failed 不计入配额）
 * 阈值来源（服务端唯一真值，前端不可控——一票否决项3合规）：
 *   SystemConfig ocr.daily_free_limit（默认 50 张/日/用户）
 *   SystemConfig ocr.daily_cost_limit_cny（默认 50 元/日/全局，达到即熔断免费入口）
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getSystemConfigService } = require('./systemConfigService');

const DEFAULT_DAILY_FREE_LIMIT = 50;
const DEFAULT_DAILY_COST_LIMIT_CNY = 50;

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { gte: start, lt: now };
}

class OcrQuotaService {
  async getLimits() {
    const cfg = getSystemConfigService();
    const [freeLimit, costLimit] = await Promise.all([
      cfg.getNumber('ocr.daily_free_limit', DEFAULT_DAILY_FREE_LIMIT),
      cfg.getNumber('ocr.daily_cost_limit_cny', DEFAULT_DAILY_COST_LIMIT_CNY),
    ]);
    return { freeLimit, costLimit };
  }

  /** 查询当前用户配额状态（前端展示用，只读） */
  async getStatus(userId) {
    const { freeLimit, costLimit } = await this.getLimits();
    const createdAt = todayRange();
    const [used, agg] = await Promise.all([
      prisma.ocrUsageLog.count({ where: { userId, createdAt, status: { not: 'failed' } } }),
      prisma.ocrUsageLog.aggregate({ where: { createdAt, status: { not: 'failed' } }, _sum: { estCostCny: true } }),
    ]);
    const globalCost = Number(agg._sum.estCostCny || 0);
    return {
      dailyFreeLimit: freeLimit,
      used,
      remaining: Math.max(0, freeLimit - used),
      globalFuseTriggered: globalCost >= costLimit,
    };
  }

  /**
   * 预扣占坑：超限/熔断直接抛错拦截（403 OCR_QUOTA_EXCEEDED / 503 OCR_COST_LIMIT）
   * @returns {Promise<string>} pending 记录 id
   */
  async reserve(userId, provider) {
    const { freeLimit, costLimit } = await this.getLimits();
    const createdAt = todayRange();

    // 全局成本熔断（先于个人配额，成本失控立即止损）
    const agg = await prisma.ocrUsageLog.aggregate({
      where: { createdAt, status: { not: 'failed' } },
      _sum: { estCostCny: true },
    });
    if (Number(agg._sum.estCostCny || 0) >= costLimit) {
      logger.warn('OcrQuota', '全局成本熔断触发', { costLimit });
      const err = new Error('今日免费拍照翻译额度已用完（全局成本保护），请明日再试');
      err.code = 'OCR_COST_LIMIT';
      err.status = 503;
      throw err;
    }

    // 事务内 count + 插入占坑，防并发绕过
    return prisma.$transaction(async (tx) => {
      const used = await tx.ocrUsageLog.count({
        where: { userId, createdAt, status: { not: 'failed' } },
      });
      if (used >= freeLimit) {
        const err = new Error(`今日免费识别 ${freeLimit} 张已用完，开通套餐享更多额度`);
        err.code = 'OCR_QUOTA_EXCEEDED';
        err.status = 403;
        err.upgrade = true; // 前端据此弹套餐引导
        throw err;
      }
      const row = await tx.ocrUsageLog.create({
        data: { userId, provider, status: 'pending' },
      });
      return row.id;
    });
  }

  /** 结算：成功记成本/文本长度；失败标 failed 释放配额 */
  async settle(logId, { success, ocrTextLen = 0, estCostCny = 0, latencyMs = 0, errorCode = null }) {
    await prisma.ocrUsageLog.update({
      where: { id: logId },
      data: {
        status: success ? 'success' : 'failed',
        ocrTextLen,
        estCostCny,
        latencyMs,
        errorCode,
      },
    }).catch((e) => logger.error('OcrQuota', 'settle 失败', { logId, error: e.message }));
  }
}

let instance = null;
function getOcrQuotaService() {
  if (!instance) instance = new OcrQuotaService();
  return instance;
}

module.exports = { OcrQuotaService, getOcrQuotaService };
