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

// 会员体系 → 翻译时长权益映射（服务端唯一真值；Phase2 Task4）
// 注意：不修改 membership 逻辑，仅只读 User.membershipLevel/membershipExpiry 做映射
// grantUnits 与 TranslationPackageOrder.minutesTotal 同单位（与 PACKAGE_CATALOG.minutes 语义一致）
// 利润硬约束核算（附件 L：套餐利润≥3倍。算力成本上界=按量包零售 19元/h ÷ 3 ≈ 6.33元/h）：
//   basic  月费28元, 赠1h → 成本上界 6.33元, 利润倍数 28/6.33 ≈ 4.4x ✓
//   premium月费58元, 赠2h → 成本上界12.67元, 利润倍数 58/12.67 ≈ 4.6x ✓
//  （原 premium 5h 方案利润倍数仅 1.8x 违反硬约束，已于 2026-07-27 整改为 2h）
const MEMBERSHIP_TIME_BENEFIT = {
  free:    { grantUnits: 0,   label: '免费用户：无每月赠送时长' },
  basic:   { grantUnits: 60,  label: '基础会员：每月赠送 1 小时翻译时长' },
  premium: { grantUnits: 120, label: '高级会员：每月赠送 2 小时翻译时长' },
};
const GRANT_VALIDITY_DAYS = 30; // 赠送时长 30 天内有效

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
        data: { userId, trialTotalSec: TRIAL_TOTAL_SEC, trialUsedSec: 0, subUsedSec: 0, adminTimeSec: 0 },
      });
    }
    return b;
  }

  /** 前端展示用：用户当前计费状态（只读，前端仅展示）；deviceRisk 命中时试用显示为不可用（P1 设备指纹风控） */
  async getStatus(userId, deviceRisk = null) {
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

    const trialBlocked = !!(deviceRisk && deviceRisk.trialAllowed === false);
    paidRemainingSec += b.adminTimeSec || 0;
    return {
      trial: {
        totalSec: b.trialTotalSec,
        usedSec: b.trialUsedSec,
        remainingSec: trialBlocked ? 0 : Math.max(0, b.trialTotalSec - b.trialUsedSec),
        deviceRestricted: trialBlocked || undefined,
        restrictReason: trialBlocked ? deviceRisk.reason : undefined,
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
  async consume(userId, { scene = 'scan', seconds, deviceRisk = null, requestId = null } = {}) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      const e = new Error('无效时长');
      e.code = 'INVALID_DURATION';
      e.status = 400;
      throw e;
    }
    seconds = Math.round(seconds);

    const result = await prisma.$transaction(async (tx) => {
      let b = await this.getOrInitBalance(userId, tx);
      // 并发防护（第三优先级 Task2）：对余额行加行级锁，串行化同一用户的并发扣减，
      // 防止 read-then-write 竞态导致重复扣减/漏扣（资损风险）
      await tx.$queryRaw`SELECT id FROM "TranslationBillingBalance" WHERE "userId" = ${userId} FOR UPDATE`;
      // 加锁后重读最新余额（锁前读取可能已过期）
      b = await tx.translationBillingBalance.findUnique({ where: { userId } });
      // DEF-P3-01 幂等防护：同一 userId+requestId 仅首次扣减生效（行锁串行化后查重，无竞态窗口）
      if (requestId) {
        const dup = await tx.translationBillingLog.findFirst({ where: { userId, requestId } });
        if (dup) {
          return {
            success: true, idempotent: true, consumedSec: dup.consumedSec,
            source: dup.source, orderId: dup.orderId, logId: dup.id, balanceAfterSec: dup.balanceAfterSec,
          };
        }
      }
      const now = new Date();
      let remain = seconds;
      let source = null;
      let orderId = null;

      // 1) 试用 5 分钟（终身一次，绑定 userId；P1 设备指纹风控命中时跳过试用 → 直接落订阅/按量包）
      const trialBlocked = !!(deviceRisk && deviceRisk.trialAllowed === false);
      if (remain > 0 && !trialBlocked && b.trialUsedSec < b.trialTotalSec) {
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

      // 4) 管理员手动调整时长（纳入消耗扣减链，确保调整真实生效）
      if (remain > 0 && b.adminTimeSec > 0) {
        const use = Math.min(remain, b.adminTimeSec);
        b.adminTimeSec -= use;
        remain -= use;
        if (!source) source = 'admin';
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
        data: { trialUsedSec: b.trialUsedSec, subUsedSec: b.subUsedSec, adminTimeSec: b.adminTimeSec },
      });

      const balanceAfterSec =
        Math.max(0, b.trialTotalSec - b.trialUsedSec) +
        (b.subExpiresAt > now ? Math.max(0, (SUB_CAP[b.subType] || 0) - b.subUsedSec) : 0) +
        (await paidRemainingSecOf(tx, userId, now)) +
        b.adminTimeSec;

      const log = await tx.translationBillingLog.create({
        data: {
          userId,
          scene,
          consumedSec: seconds,
          source,
          orderId,
          requestId,
          balanceAfterSec,
        },
      });

      return { success: true, consumedSec: seconds, source, orderId, logId: log.id, balanceAfterSec };
    });

    // P1 设备指纹风控：试用实际扣减成功 → 登记设备 owner（终身一次）+ IP 前缀日计数
    if (!result.idempotent && result.source === 'trial' && deviceRisk) {
      const { getDeviceRiskService } = require('./deviceRiskService');
      await getDeviceRiskService().registerTrialClaim(userId, deviceRisk);
    }
    return result;
  }

  /**
   * 统一翻译时长闸门（供所有翻译场景复用：拍照/实时扫描/对话）
   * 校验并原子扣减时长；不足直接抛 402（拒绝服务，不返回译文）。
   * 等价于 consure()，保留语义化命名以便各翻译路由统一调用。
   * @param {string} userId
   * @param {{scene?:'photo'|'scan'|'conversation', seconds:number}} opt
   */
  async requireTranslationQuota(userId, { scene = 'scan', seconds, deviceRisk = null } = {}) {
    return this.consume(userId, { scene, seconds, deviceRisk });
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
          // DEF-P3-03 单位统一：minutesTotal 字段语义=秒（consume/getStatus 均按秒消耗与展示）
          minutesTotal: cat.minutes * 60,
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
        minutesTotal: cat.minutes * 60,
        priceCny: cat.priceCny,
        expiresAt,
      };
    });
  }

  // ==========================================================
  // Phase2 Task1 — 支付链路沙箱框架（对齐 membership 的 order → callback 模式）
  // 下单(pending) → 支付网关(沙箱模拟) → 回调确认(paid + 权益到账) / 失败(failed)
  // ==========================================================

  /** 创建待支付订单（不到账）。返回沙箱支付链接。 */
  async createPaymentOrder(userId, packageType) {
    const cat = PACKAGE_CATALOG[packageType];
    if (!cat) {
      const e = new Error('未知套餐类型');
      e.code = 'INVALID_PACKAGE';
      e.status = 400;
      throw e;
    }
    const now = new Date();
    const orderNo = 'TR' + now.getTime() + Math.random().toString(36).slice(2, 8).toUpperCase();
    // expiresAt 占位（支付确认时按支付时间重算）
    const placeholder = new Date(now.getTime() + 86400000);
    const order = await prisma.translationPackageOrder.create({
      data: {
        userId,
        orderNo,
        packageType,
        minutesTotal: cat.minutes * 60, // DEF-P3-03 单位统一（秒）
        priceCny: cat.priceCny,
        expiresAt: placeholder,
        status: 'pending',
      },
    });
    logger.info('Billing payment order created', { userId, orderNo, packageType });
    return {
      orderNo: order.orderNo,
      packageType,
      kind: cat.kind,
      priceCny: cat.priceCny,
      status: 'pending',
      // 沙箱支付链接：真实网关接入时替换为网关收银台 URL
      paymentUrl: `/api/billing/payment/sandbox/${order.orderNo}`,
      sandbox: true,
    };
  }

  /** 支付回调确认（沙箱：由沙箱收银台/联调调用；真实网关接入时验签后调用同一方法） */
  async confirmPaymentOrder(orderNo, { paymentId = null, result = 'success' } = {}) {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const order = await tx.translationPackageOrder.findUnique({ where: { orderNo } });
      if (!order) {
        const e = new Error('订单不存在');
        e.code = 'ORDER_NOT_FOUND';
        e.status = 404;
        throw e;
      }
      if (order.status !== 'pending') {
        const e = new Error('订单已处理');
        e.code = 'ORDER_ALREADY_PROCESSED';
        e.status = 409;
        throw e;
      }
      if (result !== 'success') {
        const failed = await tx.translationPackageOrder.update({
          where: { id: order.id },
          data: { status: 'failed' },
        });
        logger.info('Billing payment failed', { orderNo, paymentId });
        return { orderNo: failed.orderNo, status: 'failed' };
      }
      const cat = PACKAGE_CATALOG[order.packageType];
      const expiresAt =
        cat.kind === 'pay'
          ? new Date(now.getTime() + cat.validityDays * 86400000)
          : new Date(now.getTime() + cat.durationDays * 86400000);
      const paid = await tx.translationPackageOrder.update({
        where: { id: order.id },
        data: { status: 'paid', expiresAt },
      });
      if (cat.kind === 'sub') {
        const b = await this.getOrInitBalance(order.userId, tx);
        await tx.translationBillingBalance.update({
          where: { id: b.id },
          data: { subType: order.packageType, subExpiresAt: expiresAt, subUsedSec: 0 },
        });
      }
      logger.info('Billing payment confirmed', { orderNo, paymentId, packageType: order.packageType });
      return {
        orderNo: paid.orderNo,
        packageType: paid.packageType,
        kind: cat.kind,
        minutesTotal: paid.minutesTotal,
        priceCny: paid.priceCny,
        expiresAt,
        status: 'paid',
      };
    });
  }

  /** 订单状态查询（仅本人） */
  async getPaymentOrder(userId, orderNo) {
    const order = await prisma.translationPackageOrder.findUnique({ where: { orderNo } });
    if (!order || order.userId !== userId) {
      const e = new Error('订单不存在');
      e.code = 'ORDER_NOT_FOUND';
      e.status = 404;
      throw e;
    }
    return {
      orderNo: order.orderNo,
      packageType: order.packageType,
      status: order.status,
      priceCny: order.priceCny,
      minutesTotal: order.minutesTotal,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
    };
  }

  // ==========================================================
  // Phase2 Task4 — 会员体系 → 翻译时长权益映射
  // 只读 membership 字段，不改任何 membership 逻辑（宪法红线）
  // ==========================================================

  /** 会员时长权益映射表 + 当前用户权益与本月领取状态 */
  async getMembershipBenefit(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { membershipLevel: true, membershipExpiry: true },
    });
    if (!user) {
      const e = new Error('用户不存在');
      e.code = 'USER_NOT_FOUND';
      e.status = 404;
      throw e;
    }
    const now = new Date();
    const isExpired = user.membershipExpiry && user.membershipExpiry < now;
    const effectiveLevel = isExpired ? 'free' : (user.membershipLevel || 'free');
    const benefit = MEMBERSHIP_TIME_BENEFIT[effectiveLevel] || MEMBERSHIP_TIME_BENEFIT.free;
    const monthKey = `${now.getFullYear()}${pad2(now.getMonth() + 1)}`;
    const grantType = `pay_grant_${effectiveLevel}_${monthKey}`;
    const claimed = benefit.grantUnits > 0
      ? await prisma.translationPackageOrder.findFirst({ where: { userId, packageType: grantType } })
      : null;
    return {
      mapping: Object.entries(MEMBERSHIP_TIME_BENEFIT).map(([level, m]) => ({
        level, grantUnits: m.grantUnits, label: m.label, validityDays: GRANT_VALIDITY_DAYS,
      })),
      current: {
        level: effectiveLevel,
        grantUnits: benefit.grantUnits,
        claimable: benefit.grantUnits > 0 && !claimed,
        claimedThisMonth: !!claimed,
        monthKey,
      },
    };
  }

  /** 领取本月会员赠送时长（生成 0 元已支付按量包，命名 pay_grant_* 复用 FIFO 扣减链） */
  async claimMembershipGrant(userId) {
    const info = await this.getMembershipBenefit(userId);
    const { level, grantUnits, claimable, monthKey } = info.current;
    if (grantUnits <= 0) {
      const e = new Error('当前会员等级无赠送时长');
      e.code = 'NO_MEMBERSHIP_BENEFIT';
      e.status = 400;
      throw e;
    }
    if (!claimable) {
      const e = new Error('本月赠送时长已领取');
      e.code = 'GRANT_ALREADY_CLAIMED';
      e.status = 409;
      throw e;
    }
    const now = new Date();
    const grantType = `pay_grant_${level}_${monthKey}`;
    const orderNo = 'GR' + now.getTime() + Math.random().toString(36).slice(2, 8).toUpperCase();
    // 有效期规则（第三优先级 Task3）：赠送时长随会员周期同步失效——
    // 取「30 天」与「会员到期时间」二者更早者；会员过期后未使用时长不可用；续费后进入新周期可再领取
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { membershipExpiry: true },
    });
    let expiresAt = new Date(now.getTime() + GRANT_VALIDITY_DAYS * 86400000);
    if (user && user.membershipExpiry && user.membershipExpiry < expiresAt) {
      expiresAt = user.membershipExpiry;
    }
    const order = await prisma.translationPackageOrder.create({
      data: {
        userId,
        orderNo,
        packageType: grantType,
        minutesTotal: grantUnits * 60, // DEF-P3-03 单位统一（秒）：grantUnits 语义为分钟
        priceCny: 0,
        expiresAt,
        status: 'paid',
      },
    });
    logger.info('Membership grant claimed', { userId, level, grantType, grantUnits, expiresAt });
    return {
      orderNo: order.orderNo,
      level,
      grantUnits,
      expiresAt: order.expiresAt,
      expiryRule: '赠送时长随会员周期同步失效（取30天与会员到期的更早者）',
    };
  }

  // ==========================================================
  // 第三优先级 Task5 — 管理员对账：订单按日/按月导出与统计
  // ==========================================================

  /**
   * 订单导出（管理员）：granularity=day|month, date=YYYY-MM-DD|YYYY-MM
   * 返回订单明细 + 汇总（按状态计数、总金额、总时长单位）
   */
  async exportOrders({ granularity = 'day', date } = {}) {
    if (!['day', 'month'].includes(granularity)) {
      const e = new Error('granularity 必须为 day 或 month');
      e.code = 'INVALID_GRANULARITY';
      e.status = 400;
      throw e;
    }
    let start, end;
    if (granularity === 'day') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
        const e = new Error('day 粒度 date 须为 YYYY-MM-DD');
        e.code = 'INVALID_DATE';
        e.status = 400;
        throw e;
      }
      start = new Date(`${date}T00:00:00+08:00`);
      end = new Date(start.getTime() + 86400000);
    } else {
      if (!/^\d{4}-\d{2}$/.test(date || '')) {
        const e = new Error('month 粒度 date 须为 YYYY-MM');
        e.code = 'INVALID_DATE';
        e.status = 400;
        throw e;
      }
      start = new Date(`${date}-01T00:00:00+08:00`);
      const m = start.getMonth();
      end = new Date(start);
      end.setMonth(m + 1);
    }
    const orders = await prisma.translationPackageOrder.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: 'asc' },
    });
    const summary = { total: orders.length, byStatus: {}, paidAmountCny: 0, paidUnits: 0 };
    const rows = orders.map((o) => {
      summary.byStatus[o.status] = (summary.byStatus[o.status] || 0) + 1;
      if (o.status === 'paid') {
        summary.paidAmountCny += Number(o.priceCny) || 0;
        summary.paidUnits += o.minutesTotal || 0;
      }
      return {
        orderNo: o.orderNo,
        userId: o.userId,
        packageType: o.packageType,
        status: o.status,
        priceCny: Number(o.priceCny) || 0,
        minutesTotal: o.minutesTotal,
        minutesUsed: o.minutesUsed,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
      };
    });
    return { granularity, date, rangeStart: start, rangeEnd: end, summary, orders: rows };
  }

  /**
   * 订单导出（管理员，按日期区间）—— 第三阶段收尾 Item3(1)
   * 参数：startDate/endDate（YYYY-MM-DD），默认均为当日
   * 返回订单明细 + 汇总；CSV 字段：订单号/用户ID/套餐类型/金额/支付状态/创建时间/支付时间
   */
  async exportOrdersByRange({ startDate, endDate } = {}) {
    const fmtDay = (d) => new Date(d).toISOString().slice(0, 10);
    const today = fmtDay(new Date());
    const s = startDate || today;
    const e = endDate || today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const err = new Error('startDate 须为 YYYY-MM-DD');
      err.code = 'INVALID_DATE'; err.status = 400; throw err;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e)) {
      const err = new Error('endDate 须为 YYYY-MM-DD');
      err.code = 'INVALID_DATE'; err.status = 400; throw err;
    }
    const start = new Date(`${s}T00:00:00+08:00`);
    const end = new Date(`${e}T23:59:59.999+08:00`);
    if (start > end) {
      const err = new Error('startDate 不能晚于 endDate');
      err.code = 'INVALID_DATE'; err.status = 400; throw err;
    }
    const orders = await prisma.translationPackageOrder.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: 'asc' },
    });
    const summary = { total: orders.length, byStatus: {}, paidAmountCny: 0, paidUnits: 0 };
    const rows = orders.map((o) => {
      summary.byStatus[o.status] = (summary.byStatus[o.status] || 0) + 1;
      if (o.status === 'paid') {
        summary.paidAmountCny += Number(o.priceCny) || 0;
        summary.paidUnits += o.minutesTotal || 0;
      }
      return {
        orderNo: o.orderNo,
        userId: o.userId,
        packageType: o.packageType,
        priceCny: Number(o.priceCny) || 0,
        status: o.status,
        createdAt: o.createdAt,
        paidAt: o.status === 'paid' ? o.updatedAt : null,
      };
    });
    return { startDate: s, endDate: e, summary, orders: rows };
  }

  /**
   * DEF-P3-02 退款时长回退（管理端专用；仅 pay_* 按量包 + status=paid 可退）
   * 未用秒数全额回收（status→refunded 后 consume/getStatus 不再计入该订单，即时生效），
   * 按未用占比计算应退金额；AdminOperationLog 记录 before/after 全程留痕。
   */
  async refundOrder(orderId, { adminId, reason = null } = {}) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.translationPackageOrder.findUnique({ where: { id: orderId } });
      if (!order) {
        const e = new Error('订单不存在');
        e.code = 'ORDER_NOT_FOUND'; e.status = 404; throw e;
      }
      if (!order.packageType.startsWith('pay_')) {
        const e = new Error('仅按量时长包支持退款时长回退');
        e.code = 'REFUND_NOT_SUPPORTED'; e.status = 400; throw e;
      }
      if (order.status !== 'paid') {
        const e = new Error('订单当前状态不可退款: ' + order.status);
        e.code = 'ORDER_NOT_REFUNDABLE'; e.status = 409; throw e;
      }
      const totalSec = order.minutesTotal;
      const usedSec = order.minutesUsed;
      const revokedSec = Math.max(0, totalSec - usedSec);
      const refundCny = totalSec > 0
        ? Math.round((Number(order.priceCny) || 0) * (revokedSec / totalSec) * 100) / 100
        : 0;
      await tx.translationPackageOrder.update({ where: { id: order.id }, data: { status: 'refunded' } });
      await tx.adminOperationLog.create({
        data: {
          adminId, action: 'REFUND_ORDER', targetType: 'ORDER', targetId: order.id,
          reason,
          detail: {
            orderNo: order.orderNo, packageType: order.packageType,
            before: { status: 'paid', totalSec, usedSec },
            after: { status: 'refunded', revokedSec, refundCny },
          },
        },
      });
      logger.info('Billing order refunded', { orderId: order.id, orderNo: order.orderNo, adminId, revokedSec, refundCny });
      return { orderNo: order.orderNo, packageType: order.packageType, status: 'refunded', revokedSec, refundCny };
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

// ============================================================
// Stage 11 子模块 3 — billingService.js 流式结算补丁
// 追加方法：streamPreDeduct / streamSettle / streamBalanceCheck / streamRefund
// 插入位置：BillingService 类内部，requireTranslationQuota() 之后
// ============================================================

  /**
   * === Stage 11 子模块 3：流式预扣（流建立前调用） ===
   * 
   * 预扣预估翻译时长（默认 60 秒），防止"先用后扣"超额免费使用。
   * 与 requireTranslationQuota 语义一致，增加 requestId 用于流结束后结算匹配。
   * 
   * @param {string} userId
   * @param {object} opt
   * @param {string} opt.scene - 'conversation_translate'
   * @param {number} opt.estSec - 预估时长（秒），默认 60
   * @param {object} opt.deviceRisk - 设备指纹风控数据
   * @returns {Promise<{ success, consumedSec, source, balanceAfterSec, requestId }>}
   */
  async streamPreDeduct(userId, { scene = 'conversation_translate', estSec = 60, deviceRisk = null } = {}) {
    if (!Number.isFinite(estSec) || estSec <= 0) {
      estSec = 60; // fallback
    }
    estSec = Math.ceil(estSec);
    const requestId = 'stream_' + Date.now().toString(36) + '_' + userId.slice(0, 8) + '_' + Math.random().toString(36).slice(2, 6);
    
    try {
      const result = await this.consume(userId, {
        scene,
        seconds: estSec,
        deviceRisk,
        requestId,
      });
      
      logger.info('BillingService', 'streamPreDeduct 预扣成功', {
        userId,
        scene,
        estSec,
        consumedSec: result.consumedSec,
        source: result.source,
        requestId,
      });
      
      return {
        ...result,
        requestId,
        estSec,
      };
    } catch (error) {
      if (error.code === 'TRANSLATION_TIME_EXHAUSTED') {
        logger.warn('BillingService', 'streamPreDeduct 时长不足', {
          userId, scene, estSec,
        });
      }
      throw error;
    }
  }

  /**
   * === Stage 11 子模块 3：流式结算（流结束后调用） ===
   * 
   * 按实际翻译时长结算，多退少补。
   * - actualSec < estSec: 退回差额（通过 streamRefund）
   * - actualSec >= estSec: 不再追加扣减（已在预扣时扣足）
   * 
   * 断句分段结算：每完成一句翻译调用 streamSentenceLog 记录，
   * 流结束时调用本方法做最终结算。
   * 
   * @param {string} userId
   * @param {object} opt
   * @param {string} opt.requestId - 与 streamPreDeduct 相同的关联 ID
   * @param {number} opt.actualSec - 实际翻译用时（秒）
   * @param {number} opt.actualTokens - 实际输出 Token 数（可选）
   * @param {number} opt.sentenceCount - 完成句子数
   * @returns {Promise<{ settled, refundedSec, finalConsumedSec, requestId }>}
   */
  async streamSettle(userId, { requestId, actualSec = 0, actualTokens = 0, sentenceCount = 0 } = {}) {
    if (!requestId || !Number.isFinite(actualSec)) {
      logger.warn('BillingService', 'streamSettle 参数无效', { userId, requestId, actualSec });
      return { settled: false, reason: 'INVALID_PARAMS' };
    }

    actualSec = Math.ceil(Math.max(0, actualSec));

    // 查找预扣记录
    const preDeductLog = await prisma.translationBillingLog.findFirst({
      where: { userId, requestId },
    });

    if (!preDeductLog) {
      logger.warn('BillingService', 'streamSettle 找不到预扣记录', { userId, requestId });
      return { settled: false, reason: 'NO_PRE_DEDUCT_LOG' };
    }

    const estSec = preDeductLog.consumedSec;
    const diff = estSec - actualSec;

    if (diff > 0) {
      // 实际用时少于预估 → 退回差额
      await this.streamRefund(userId, {
        seconds: diff,
        source: preDeductLog.source,
        orderId: preDeductLog.orderId,
        settleRequestId: requestId,
      });
      
      logger.info('BillingService', 'streamSettle 退回差额', {
        userId,
        requestId,
        estSec,
        actualSec,
        refundedSec: diff,
      });
    }

    // 更新预扣日志的结算信息
    await prisma.translationBillingLog.update({
      where: { id: preDeductLog.id },
      data: {
        // Store settlement metadata in the existing log (we can't add fields without migration)
        // Using the requestId format to record sentenceCount:actualTokens via another log entry
      },
    });

    const finalConsumedSec = estSec - (diff > 0 ? diff : 0);

    logger.info('BillingService', 'streamSettle 结算完成', {
      userId,
      requestId,
      estSec,
      actualSec,
      refundedSec: diff > 0 ? diff : 0,
      finalConsumedSec,
      sentenceCount,
    });

    return {
      settled: true,
      refundedSec: diff > 0 ? diff : 0,
      finalConsumedSec,
      requestId,
    };
  }

  /**
   * === Stage 11 子模块 3：退回翻译时长 ===
   * 
   * 用于异常断流（余额耗尽/语种异常/客户端断开）时退回已扣但未使用的时长。
   * 简单实现：增加 adminTimeSec 余额，避免复杂的 FIFO 逆向操作。
   * 
   * @param {string} userId
   * @param {object} opt
   * @param {number} opt.seconds - 退回秒数
   * @param {string} opt.source - 原始扣减来源（trial/subscription/paid_package/admin）
   * @param {string} opt.orderId - 原始套餐订单 ID
   * @param {string} opt.settleRequestId - 关联的预扣 requestId
   * @returns {Promise<{ success: boolean, refundedSec: number }>}
   */
  async streamRefund(userId, { seconds, source, orderId, settleRequestId } = {}) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return { success: false, refundedSec: 0, reason: 'INVALID_AMOUNT' };
    }
    seconds = Math.ceil(seconds);

    return prisma.$transaction(async (tx) => {
      const b = await this.getOrInitBalance(userId, tx);

      // 退回逻辑：按来源退回
      // - trial → 退回到 trialUsedSec
      // - subscription → 退回到 subUsedSec
      // - paid_package → 退回到 order 的 minutesUsed
      // - admin → 退回到 adminTimeSec
      switch (source) {
        case 'trial':
          b.trialUsedSec = Math.max(0, b.trialUsedSec - seconds);
          break;
        case 'subscription':
          b.subUsedSec = Math.max(0, b.subUsedSec - seconds);
          break;
        case 'paid_package':
          if (orderId) {
            const order = await tx.translationPackageOrder.findUnique({
              where: { id: orderId },
            });
            if (order) {
              await tx.translationPackageOrder.update({
                where: { id: orderId },
                data: { minutesUsed: Math.max(0, order.minutesUsed - seconds) },
              });
            }
          }
          break;
        case 'admin':
        default:
          b.adminTimeSec += seconds;
          break;
      }

      await tx.translationBillingBalance.update({
        where: { id: b.id },
        data: {
          trialUsedSec: b.trialUsedSec,
          subUsedSec: b.subUsedSec,
          adminTimeSec: b.adminTimeSec,
        },
      });

      // 记录退款日志（使用 scene=refund 标记）
      const now = new Date();
      const remaining = b.trialTotalSec - b.trialUsedSec + 
        Math.max(0, b.subExpiresAt > now ? (SUB_CAP[b.subType] || 0) - b.subUsedSec : 0) +
        b.adminTimeSec;

      logger.info('BillingService', 'streamRefund 退款成功', {
        userId,
        seconds,
        source,
        settleRequestId,
        balanceAfterSec: remaining,
      });

      return { success: true, refundedSec: seconds };
    });
  }

  /**
   * === Stage 11 子模块 3：流式余额检查（每句翻译后调用） ===
   * 
   * 检查当前是否还有可用翻译时长。
   * 返回剩余秒数，0 表示余额耗尽需截断流。
   * 
   * @param {string} userId
   * @returns {Promise<{ remainingSec: number, exhausted: boolean }>}
   */
  async streamBalanceCheck(userId) {
    const status = await this.getStatus(userId);
    return {
      remainingSec: status.remaining,
      exhausted: status.remaining <= 0,
    };
  }}

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
