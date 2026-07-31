/**
 * Stage 10: 会员权益服务
 * 套餐管理、会员开通、权益校验、代付机制
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// 套餐管理
// ============================================================

async function getActivePlans() {
  return await prisma.membershipPlan.findMany({
    where: { status: 'active' },
    orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
  });
}

async function getPlanByCode(planCode) {
  return await prisma.membershipPlan.findUnique({ where: { planCode } });
}

async function getPlanById(id) {
  return await prisma.membershipPlan.findUnique({ where: { id } });
}

// ============================================================
// 会员开通（事务原子性）
// ============================================================

async function activateMembership(userId, planId, orderId, source = 'direct', proxyPayerId = null) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  const now = new Date();
  const endTime = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  // 事务：创建会员记录 + 更新User会员字段
  const result = await prisma.$transaction(async (tx) => {
    // 1. 创建UserMembership记录
    const membership = await tx.userMembership.create({
      data: {
        userId,
        planId: plan.id,
        planCode: plan.planCode,
        level: plan.level,
        startTime: now,
        endTime,
        status: 'active',
        source,
        orderId,
      },
    });

    // 2. 更新User的membershipLevel和membershipExpiry
    await tx.user.update({
      where: { id: userId },
      data: {
        membershipLevel: plan.planCode,
        membershipExpiry: endTime,
      },
    });

    return membership;
  });

  return result;
}

// ============================================================
// 订单管理
// ============================================================

async function createOrder(userId, planId, paymentMethod = 'wechat') {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.status !== 'active') throw new Error('Invalid plan');

  const orderNo = 'MEM' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();

  const order = await prisma.membershipOrder.create({
    data: {
      userId,
      orderNo,
      membershipLevel: plan.planCode,
      duration: plan.durationDays,
      amount: plan.price,
      currency: 'CNY',
      paymentMethod,
      status: 'pending',
      payChannel: paymentMethod,
    },
  });

  return order;
}

async function getOrder(orderNo) {
  return await prisma.membershipOrder.findUnique({
    where: { orderNo },
    include: { user: { select: { id: true, nickname: true, phone: true } } },
  });
}

async function getUserOrders(userId, page = 1, limit = 20) {
  const [orders, total] = await Promise.all([
    prisma.membershipOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.membershipOrder.count({ where: { userId } }),
  ]);
  return { orders, total, page, limit };
}

// ============================================================
// 支付回调（事务原子性 + 幂等性）
// ============================================================

async function handlePaymentCallback(orderNo, payAmount, channel, notifyId, rawData) {
  // 1. 查询订单
  const order = await prisma.membershipOrder.findUnique({ where: { orderNo } });
  if (!order) throw new Error('Order not found');

  // 2. 幂等性检查：已支付订单不重复处理
  if (order.status === 'paid') {
    // 记录重复回调流水
    await prisma.paymentLog.create({
      data: {
        orderNo,
        notifyId,
        amount: payAmount,
        payStatus: 'duplicate',
        channel,
        rawData,
        errorMessage: 'Duplicate callback for already paid order',
      },
    });
    return { success: true, message: 'Order already paid (idempotent)', order };
  }

  // 3. 金额强校验（整数分单位）
  if (payAmount !== Math.round(Number(order.amount) * 100)) {
    await prisma.paymentLog.create({
      data: {
        orderNo,
        notifyId,
        amount: payAmount,
        payStatus: 'failed',
        channel,
        rawData,
        errorMessage: `Amount mismatch: expected ${Math.round(Number(order.amount) * 100)}, got ${payAmount}`,
      },
    });
    throw new Error('Amount mismatch');
  }

  // 4. 事务：更新订单 + 开通会员 + 写流水
  const result = await prisma.$transaction(async (tx) => {
    // 4a. 更新订单状态
    const updatedOrder = await tx.membershipOrder.update({
      where: { orderNo },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentId: notifyId,
      },
    });

    // 4b. 开通会员
    const plan = await tx.membershipPlan.findFirst({
      where: { planCode: order.membershipLevel },
    });

    if (plan) {
      const now = new Date();
      const endTime = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      await tx.userMembership.create({
        data: {
          userId: order.userId,
          planId: plan.id,
          planCode: plan.planCode,
          level: plan.level,
          startTime: now,
          endTime,
          status: 'active',
          source: order.proxyPayerId ? 'proxy' : 'direct',
          orderId: order.id,
        },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: {
          membershipLevel: plan.planCode,
          membershipExpiry: endTime,
        },
      });
    }

    // 4c. 写支付流水
    await tx.paymentLog.create({
      data: {
        orderNo,
        notifyId,
        amount: payAmount,
        payStatus: 'success',
        channel,
        rawData,
      },
    });

    return updatedOrder;
  });

  return { success: true, order: result };
}

// ============================================================
// 代付机制
// ============================================================

async function createProxyPayment(orderNo, payerInfo = {}) {
  const order = await prisma.membershipOrder.findUnique({ where: { orderNo } });
  if (!order) throw new Error('Order not found');
  if (order.status !== 'pending') throw new Error('Order is not pending');

  const crypto = require('crypto');
  const proxyToken = crypto.randomBytes(16).toString('hex');
  const proxyExpireAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时有效

  const updated = await prisma.membershipOrder.update({
    where: { orderNo },
    data: {
      proxyToken,
      proxyStatus: 'pending',
      proxyExpireAt,
      proxyPayerId: payerInfo.payerId || null,
    },
  });

  return {
    orderNo,
    proxyToken,
    proxyUrl: `/xuewaiyu/membership/proxy-pay.html?token=${proxyToken}`,
    proxyExpireAt,
    planName: order.membershipLevel,
    amount: order.amount,
  };
}

async function getProxyOrder(proxyToken) {
  const order = await prisma.membershipOrder.findUnique({
    where: { proxyToken },
    include: { user: { select: { nickname: true } } },
  });

  if (!order) throw new Error('Invalid proxy token');
  if (order.proxyStatus === 'expired' || (order.proxyExpireAt && order.proxyExpireAt < new Date())) {
    throw new Error('Proxy link expired');
  }
  if (order.status === 'paid') throw new Error('Order already paid');

  return {
    orderNo: order.orderNo,
    planName: order.membershipLevel,
    amount: order.amount,
    duration: order.duration,
    userNickname: order.user?.nickname || '匿名用户',
    proxyStatus: order.proxyStatus,
  };
}

async function handleProxyPayment(proxyToken, payAmount, payerInfo = {}) {
  const order = await prisma.membershipOrder.findUnique({ where: { proxyToken } });
  if (!order) throw new Error('Invalid proxy token');
  if (order.status === 'paid') throw new Error('Order already paid');

  // 复用标准支付回调逻辑，标记为代付
  const result = await handlePaymentCallback(
    order.orderNo,
    payAmount,
    'proxy',
    'proxy_' + Date.now(),
    { ...payerInfo, proxyPayment: true }
  );

  // 更新代付状态
  await prisma.membershipOrder.update({
    where: { orderNo: order.orderNo },
    data: { proxyStatus: 'paid' },
  });

  return result;
}

// ============================================================
// 权益校验
// ============================================================

async function getUserRights(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipLevel: true, membershipExpiry: true },
  });

  if (!user) return { level: 0, levelName: 'free', features: [], quotas: {}, expired: true };

  // 检查是否过期
  const isExpired = user.membershipExpiry && user.membershipExpiry < new Date();

  const levelCode = isExpired ? 'free' : (user.membershipLevel || 'free');
  const levelMap = { free: 0, basic: 1, premium: 2 };
  const levelNum = levelMap[levelCode] || 0;

  const rights = await prisma.membershipRights.findUnique({
    where: { level: levelNum },
  });

  return {
    level: levelNum,
    levelCode,
    levelName: rights?.levelName || (levelCode === 'free' ? '免费用户' : levelCode),
    features: rights?.features || [],
    quotas: rights?.quotas || {},
    dailyLimits: rights?.dailyLimits || {},
    expired: !!isExpired,
    expiry: user.membershipExpiry,
  };
}

async function checkRight(userId, rightName) {
  const rights = await getUserRights(userId);
  if (rights.expired) return { allowed: false, reason: 'Membership expired' };
  if (!rights.features || !rights.features.includes(rightName)) {
    return { allowed: false, reason: 'Feature not available in current plan' };
  }
  return { allowed: true };
}

// ============================================================
// 初始化默认套餐和权益配置
// ============================================================

async function initDefaultPlans() {
  const existing = await prisma.membershipPlan.count();
  if (existing > 0) return { skipped: true, message: 'Plans already initialized' };

  await prisma.$transaction(async (tx) => {
    // 套餐
    await tx.membershipPlan.createMany({
      data: [
        {
          planCode: 'free',
          name: '免费版',
          level: 0,
          price: 0,
          durationDays: 365,
          description: '基础学习功能',
          features: ['basic_learning', 'ai_chat_daily_5', 'social_basic'],
          status: 'active',
          sortOrder: 0,
        },
        {
          planCode: 'basic',
          name: '基础会员',
          level: 1,
          price: 2900,
          durationDays: 30,
          description: '全量学习 + AI提升',
          features: ['full_learning', 'ai_chat_daily_50', 'social_no_ads', 'group_limit_10'],
          status: 'active',
          sortOrder: 1,
        },
        {
          planCode: 'premium',
          name: '高级会员',
          level: 2,
          price: 9900,
          durationDays: 30,
          description: '全功能解锁 + AI无限',
          features: ['full_learning', 'ai_chat_unlimited', 'social_no_ads', 'group_unlimited', 'priority_support', 'ai_companion'],
          status: 'active',
          sortOrder: 2,
        },
      ],
    });

    // 权益配置
    await tx.membershipRights.createMany({
      data: [
        {
          level: 0,
          levelName: '免费用户',
          features: ['basic_learning', 'ai_chat_daily_5', 'social_basic'],
          quotas: { aiChatDaily: 5, groupLimit: 3 },
          dailyLimits: { aiChat: 5 },
        },
        {
          level: 1,
          levelName: '基础会员',
          features: ['full_learning', 'ai_chat_daily_50', 'social_no_ads', 'group_limit_10'],
          quotas: { aiChatDaily: 50, groupLimit: 10 },
          dailyLimits: { aiChat: 50 },
        },
        {
          level: 2,
          levelName: '高级会员',
          features: ['full_learning', 'ai_chat_unlimited', 'social_no_ads', 'group_unlimited', 'priority_support', 'ai_companion'],
          quotas: { aiChatDaily: -1, groupLimit: -1 },
          dailyLimits: { aiChat: -1 },
        },
      ],
    });
  });

  return { success: true, message: 'Default plans and rights initialized' };
}

module.exports = {
  getActivePlans,
  getPlanByCode,
  getPlanById,
  activateMembership,
  createOrder,
  getOrder,
  getUserOrders,
  handlePaymentCallback,
  createProxyPayment,
  getProxyOrder,
  handleProxyPayment,
  getUserRights,
  checkRight,
  initDefaultPlans,
};
