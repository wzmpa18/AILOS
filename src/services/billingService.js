/**
 * src/services/billingService.js
 * Stage11 子模块2 — 翻译时长计费校验 + 时长扣减全链路（宪法 附件 L v1.0.3）
 *
 * 计费优先级（扣减顺序）：
 *   试用 5 分钟(终身一次, 绑定 userId) → 订阅套餐(单日/周/月, 含算力上限) → 按量时长包(FIFO, 365 天有效期)
 * 硬约束（一票否决合规）：
 *  - 前端仅展示；鉴权/扣减/日志全部后端管控；扣减失败直接拒绝返回译文（否决项 7/8）
 *  - 单日套餐 24h 内累计 6h 上限、月套餐 30 天累计 30h 上限，超出自动扣按量时长包
 *  - 按量时长包 365 天有效期，超期自动作废（否决项 10）
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

const TRIAL_TOTAL_SEC = 300;                          // 5 分钟终身一次
const DAILY_CAP_SEC = 6 * 3600;                        // 单日套餐 24h 内累计 6h
const MONTHLY_CAP_SEC = 30 * 3600;                     // 月套餐 30 天累计 30h
const WEEKLY_CAP_SEC = Number.MAX_SAFE_INTEGER;        // 周套餐无硬性上限（后台限流）

// 套餐目录（服务端唯一真值，前端不可篡改 —— 否决项 8）
const PACKAGE_CATALOG = {
  pay_1h:   { label: '按量时长包 1 小时',   minutes: 60,   priceCny: 19,   kind: 'pay', validityDays: 365 },
  pay_10h:  { label: '按量时长包 10 小时',  minutes: 600,  priceCny: 170,  kind: 'pay', validityDays: 365 },
  pay_30h:  { label: '按量时长包 30 小时',  minutes: 1800, priceCny: 460,  kind: 'pay', validityDays: 365 },
  pay_100h: { label: '按量时长包 100 小时', minutes: 6000, priceCny: 1400, kind: 'pay', validityDays: 365 },
  daily:    { label: '单日套餐',            minutes: 0,    priceCny: 42,   kind: 'sub', durationDays: 1,  capSec: DAILY_CAP_SEC },
  weekly:   { label: '周套餐',              minutes: 0,    priceCny: 78,   kind: 'sub', durationDays: 7,  capSec: WEEKLY_CAP_SEC },
  monthly:  { label: '月套餐',              minutes: 0,    priceCny: 198,  kind: 'sub', durationDays: 30, capSec: MONTHLY_CAP_SEC },
};

const SUB_CAP = { daily: DAILY_CAP_SEC, weekly: WEEKLY_CAP_SEC, monthly: MONTHLY_CAP_SEC };

function pad2(n) { return String(n).padStart(2, '0'); }

class BillingService {
  /** 套餐目录（前端购买页展示用，值来自服务端常量） */
  getCatalog() {
    return Object.entries(PACKAGE_CATALOG).map(([packageType, c]) => ({
      packageType,
      label: c.label,
      kind: c.kind,
      minutes: c.minutes,
      priceCny: c.priceCny,
      validityDays: c.validityDays || null,
      durationDays: c.durationDays || null,
      capSec: c.capSec || null,
    }));
  }

  /** 取或初始化用户计费余额（事务安全） */
  async getOrInitBalance(userId, tx = prisma) {
    let b = await tx.translationBillingBalance.findUnique({ where: { userId } });
    if (!b) {
      b = await tx.translationBillingBalance.create({
        data: { userId, trialTotalSec: TRIAL_TOTAL_SEC, trialUsedSec: 0, subUsedSec: 0 },
      });
    }
    return b;
  }

  /** 前端展示用：用户当前计费状态（只读，前端仅展示） */
  async getStatus(userId) {
    const b = await this.getOrInitBalance(userId);
    const now = new Date();
    const subActive = !!b.subExpiresAt && b.subExpiresAt > now;
    const subType = subActive ? b.subType : null;

    const paidOrders = await prisma.translationPackageOrder.findMany({
      where: { userId, packageType: { startsWith: 'pay_' }, status: 'paid', expiresAt: { gt: now } },
      orderBy: { expiresAt: 'asc' },
    });
    let paidRemainingSec = 0;
    const orders = paidOrders.map((o) => {
      const remaining = o.minutesTotal - o.minutesUsed;
      paidRemainingSec += remaining;
      return { packageType: o.packageType, remainingSec: remaining, expiresAt: o.expiresAt };
    });

    return {
      trial: {
        totalSec: b.trialTotalSec,
        usedSec: b.trialUsedSec,
        remainingSec: Math.max(0, b.trialTotalSec - b.trialUsedSec),
      },
      subscription: subActive
        ? {
            type: subType,
            expiresAt: b.subExpiresAt,
            usedSec: b.subUsedSec,
            capSec: SUB_CAP[subType] || null,
            remainingSec: Math.max(0, (SUB_CAP[subType] || 0) - b.subUsedSec),
          }
        : null,
      paidPackage: { remainingSec: paidRemainingSec, orders },
    };
  }

  /**
   * 时长扣减核心（原子事务，失败即拒绝翻译）
   * @param {string} userId
   * @param {object} opt { scene='scan'|'conversation', seconds }
   * @returns {Promise<{consumedSec, source, orderId, logId, balanceAfterSec}>}
   */
  async consume(userId, { scene = 'scan', seconds } = {}) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      const e = new Error('无效时长');
      e.code = 'INVALID_DURATION';
      e.status = 400;
      throw e;
    }
    seconds = Math.round(seconds);

    return prisma.$transaction(async (tx) => {
      const b = await this.getOrInitBalance(userId, tx);
      const now = new Date();
      let remain = seconds;
      let source = null;
      let orderId = null;

      // 1) 试用 5 分钟（终身一次，绑定 userId）
      if (remain > 0 && b.trialUsedSec < b.trialTotalSec) {
        const use = Math.min(remain, b.trialTotalSec - b.trialUsedSec);
        b.trialUsedSec += use;
        remain -= use;
        if (!source) source = 'trial';
      }

      // 2) 订阅套餐（含算力上限；超出自动落按量包）
      if (remain > 0 && b.subExpiresAt && b.subExpiresAt > now) {
        const cap = SUB_CAP[b.subType] || 0;
        const canUse = Math.max(0, cap - b.subUsedSec);
        if (canUse > 0) {
          const use = Math.min(remain, canUse);
          b.subUsedSec += use;
          remain -= use;
          if (!source) source = 'subscription';
        }
      }

      // 3) 按量时长包（FIFO，先到期先扣；365 天超期自动作废）
      if (remain > 0) {
        const orders = await tx.translationPackageOrder.findMany({
          where: { userId, packageType: { startsWith: 'pay_' }, status: 'paid', expiresAt: { gt: now } },
          orderBy: { expiresAt: 'asc' },
        });
        for (const o of orders) {
          if (remain <= 0) break;
          const left = o.minutesTotal - o.minutesUsed;
          if (left <= 0) continue;
          const use = Math.min(remain, left);
          o.minutesUsed += use;
          remain -= use;
          orderId = o.id;
          await tx.translationPackageOrder.update({
            where: { id: o.id },
            data: { minutesUsed: o.minutesUsed },
          });
          if (!source) source = 'paid_package';
        }
      }

      if (remain > 0) {
        // 时长不足 —— 拒绝翻译（否决项 7：扣减失败直接拒绝返回译文）
        const err = new Error('翻译时长不足，请购买套餐后继续使用');
        err.code = 'TRANSLATION_TIME_EXHAUSTED';
        err.status = 402;
        throw err;
      }

      await tx.translationBillingBalance.update({
        where: { id: b.id },
        data: { trialUsedSec: b.trialUsedSec, subUsedSec: b.subUsedSec },
      });

      const balanceAfterSec =
        Math.max(0, b.trialTotalSec - b.trialUsedSec) +
        (b.subExpiresAt > now ? Math.max(0, (SUB_CAP[b.subType] || 0) - b.subUsedSec) : 0) +
        (await paidRemainingSecOf(tx, userId, now));

      const log = await tx.translationBillingLog.create({
        data: {
          userId,
          scene,
          consumedSec: seconds,
          source,
          orderId,
          balanceAfterSec,
        },
      });

      return { success: true, consumedSec: seconds, source, orderId, logId: log.id, balanceAfterSec };
    });
  }

  /**
   * 统一翻译时长闸门（供所有翻译场景复用：拍照/实时扫描/对话）
   * 校验并原子扣减时长；不足直接抛 402（拒绝服务，不返回译文）。
   * 等价于 consure()，保留语义化命名以便各翻译路由统一调用。
   * @param {string} userId
   * @param {{scene?:'photo'|'scan'|'conversation', seconds:number}} opt
   */
  async requireTranslationQuota(userId, { scene = 'scan', seconds } = {}) {
    return this.consume(userId, { scene, seconds });
  }

  /**
   * 购买套餐（后端计费链路；真实支付网关接入为后续，本方法标记 paid 表示支付成功）
   * 按量包 → 增加按量时长（365 天有效期）；订阅 → 设置当前有效套餐并重置已用时长
   */
  async purchasePackage(userId, packageType) {
    const cat = PACKAGE_CATALOG[packageType];
    if (!cat) {
      const e = new Error('未知套餐类型');
      e.code = 'INVALID_PACKAGE';
      e.status = 400;
      throw e;
    }
    const now = new Date();
    const expiresAt =
      cat.kind === 'pay'
        ? new Date(now.getTime() + cat.validityDays * 86400000)
        : new Date(now.getTime() + cat.durationDays * 86400000);

    const orderNo = 'TR' + now.getTime() + Math.random().toString(36).slice(2, 8).toUpperCase();

    return prisma.$transaction(async (tx) => {
      const order = await tx.translationPackageOrder.create({
        data: {
          userId,
          orderNo,
          packageType,
          minutesTotal: cat.minutes,
          priceCny: cat.priceCny,
          expiresAt,
          status: 'paid',
        },
      });
      if (cat.kind === 'sub') {
        const b = await this.getOrInitBalance(userId, tx);
        await tx.translationBillingBalance.update({
          where: { id: b.id },
          data: { subType: packageType, subExpiresAt: expiresAt, subUsedSec: 0 },
        });
      }
      return {
        orderNo: order.orderNo,
        packageType,
        kind: cat.kind,
        minutesTotal: cat.minutes,
        priceCny: cat.priceCny,
        expiresAt,
      };
    });
  }

  /** 定时清理：订阅过期清零 + 按量包超期标记作废（可被 cron 调用） */
  async expireStale() {
    const now = new Date();
    let clearedSub = 0;
    let expiredPay = 0;
    const expiredSubs = await prisma.translationBillingBalance.findMany({
      where: { subExpiresAt: { lt: now } },
    });
    for (const b of expiredSubs) {
      await prisma.translationBillingBalance.update({
        where: { id: b.id },
        data: { subType: null, subExpiresAt: null, subUsedSec: 0 },
      });
      clearedSub += 1;
    }
    const r = await prisma.translationPackageOrder.updateMany({
      where: { packageType: { startsWith: 'pay_' }, status: 'paid', expiresAt: { lt: now } },
      data: { status: 'expired' },
    });
    expiredPay = r.count || 0;
    logger.info('Billing expireStale', { clearedSub, expiredPay });
    return { clearedSub, expiredPay };
  }
}

// 事务内计算按量包剩余（避免循环依赖，内联查询）
async function paidRemainingSecOf(tx, userId, now) {
  const orders = await tx.translationPackageOrder.findMany({
    where: { userId, packageType: { startsWith: 'pay_' }, status: 'paid', expiresAt: { gt: now } },
    select: { minutesTotal: true, minutesUsed: true },
  });
  return orders.reduce((sum, o) => sum + (o.minutesTotal - o.minutesUsed), 0);
}

let instance = null;
function getBillingService() {
  if (!instance) instance = new BillingService();
  return instance;
}

module.exports = { BillingService, getBillingService, PACKAGE_CATALOG };
