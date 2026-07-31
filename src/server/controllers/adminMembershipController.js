/**
 * Stage 10 阶段5 任务1：管理后台会员与订单管理增量方法
 * 纯增量追加到adminController，不修改已有方法
 */
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

// ============================================================
// 会员管理：查询任意用户会员状态
// ============================================================
async function getUserMembership(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, nickname: true, phone: true,
        membershipLevel: true, membershipExpiry: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const memberships = await prisma.userMembership.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const orders = await prisma.membershipOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const rights = await prisma.membershipRights.findMany({ orderBy: { level: 'asc' } });
    const userLevel = user.membershipLevel || 'free';
    const levelMap = { free: 0, basic: 1, premium: 2 };
    const currentRights = rights.find(r => r.level === (levelMap[userLevel] || 0));

    res.json({
      success: true,
      data: {
        user,
        memberships,
        orders,
        rights: currentRights,
        allRights: rights,
      },
    });
  } catch (e) {
    logger.error('[Admin] getUserMembership:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
}

// ============================================================
// 会员管理：手动调整会员时长（操作留痕）
// ============================================================
async function adjustMembershipTime(req, res) {
  try {
    const { userId, deltaDays, reason } = req.body;
    if (!userId || deltaDays === undefined) {
      return res.status(400).json({ success: false, error: 'userId and deltaDays required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, membershipLevel: true, membershipExpiry: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const beforeExpiry = user.membershipExpiry;
    const baseTime = beforeExpiry && beforeExpiry > new Date() ? beforeExpiry : new Date();
    const afterExpiry = new Date(baseTime.getTime() + deltaDays * 24 * 60 * 60 * 1000);

    // 事务：更新User + 创建UserMembership记录 + 写操作日志
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { membershipExpiry: afterExpiry },
      });

      await tx.userMembership.create({
        data: {
          userId,
          planCode: user.membershipLevel || 'basic',
          level: user.membershipLevel === 'premium' ? 2 : 1,
          startTime: new Date(),
          endTime: afterExpiry,
          status: 'active',
          source: 'admin_adjust',
          orderId: null,
        },
      });

      // 操作留痕
      await tx.systemConfig.create({
        data: {
          key: 'admin_membership_adjust',
          value: JSON.stringify({
            userId, nickname: user.nickname,
            deltaDays, reason: reason || 'No reason provided',
            beforeExpiry: beforeExpiry?.toISOString() || 'null',
            afterExpiry: afterExpiry.toISOString(),
            operator: req.user?.id || 'admin',
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return { beforeExpiry, afterExpiry };
    });

    res.json({
      success: true,
      data: {
        userId,
        nickname: user.nickname,
        deltaDays,
        beforeExpiry: result.beforeExpiry,
        afterExpiry: result.afterExpiry,
        reason,
      },
    });
  } catch (e) {
    logger.error('[Admin] adjustMembershipTime:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
}

// ============================================================
// 套餐配置管理：上下线、改价格、改权益
// ============================================================
async function listPlans(req, res) {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { level: 'asc' },
    });
    res.json({ success: true, data: plans });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    const { price, durationDays, description, features, status, sortOrder } = req.body;

    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Plan not found' });

    const updateData = {};
    if (price !== undefined) updateData.price = Math.round(price);
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = features;
    if (status !== undefined) updateData.status = status;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updated = await prisma.membershipPlan.update({
      where: { id },
      data: updateData,
    });

    // 操作留痕
    await prisma.systemConfig.create({
      data: {
        key: 'admin_plan_update',
        value: JSON.stringify({
          planId: id, before: existing, after: updated,
          operator: req.user?.id || 'admin',
          timestamp: new Date().toISOString(),
        }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    logger.error('[Admin] updatePlan:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
}

// ============================================================
// 代付记录模块：查询所有代付订单
// ============================================================
async function listProxyOrders(req, res) {
  try {
    const { status, page, pageSize } = req.query;
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;

    const where = { proxyStatus: { not: 'none' } };
    if (status) where.proxyStatus = status;

    const [orders, total] = await Promise.all([
      prisma.membershipOrder.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * size,
        take: size,
      }),
      prisma.membershipOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map(o => ({
          id: o.id,
          orderNo: o.orderNo,
          userId: o.userId,
          userNickname: o.user?.nickname,
          userPhone: o.user?.phone,
          membershipLevel: o.membershipLevel,
          amount: o.amount,
          status: o.status,
          proxyStatus: o.proxyStatus,
          proxyPayerId: o.proxyPayerId,
          proxyExpireAt: o.proxyExpireAt,
          createdAt: o.createdAt,
          paidAt: o.paidAt,
        })),
        total,
        page: pageNum,
        pageSize: size,
      },
    });
  } catch (e) {
    logger.error('[Admin] listProxyOrders:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = {
  getUserMembership,
  adjustMembershipTime,
  listPlans,
  updatePlan,
  listProxyOrders,
};
