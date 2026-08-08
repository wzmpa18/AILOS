// ============================================================
// src/services/distributionService.js
// 两级分销系统服务
// 严格两级分销：直推15%、间推5%，禁止三级以上
// 佣金规则永久固化在代码中，不通过配置文件修改
// 所有佣金变动写入审计日志
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ===== 佣金规则永久固化（不可通过配置文件修改）=====
const DIRECT_RATE = 0.15;   // 直推佣金比例 15%
const INDIRECT_RATE = 0.05; // 间推佣金比例 5%
const SETTLE_DAYS = 7;      // 结算周期：订单完成7天后转为可提现
const MIN_WITHDRAWAL = 1;   // 最低提现金额 1 元
const DEFAULT_AVATAR = '/assets/images/default_avatar.png';

// 邀请码字符集（大写字母 + 数字，去除易混淆字符）
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;

/**
 * 写入佣金变动审计日志
 * @param {string} action - 动作类型：create/settle/withdraw/freeze
 * @param {object} detail - 审计详情
 */
function auditCommissionLog(action, detail) {
  logger.info({
    module: 'distributionService',
    auditType: 'commission',
    action,
    detail,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 手机号脱敏：保留前3后4，中间4位用*替代
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号，如 138****1234
 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '';
  const head = phone.slice(0, 3);
  const tail = phone.slice(-4);
  return `${head}****${tail}`;
}

/**
 * 邮箱脱敏：保留首字母和@后域名
 * @param {string} email - 邮箱
 * @returns {string} 脱敏后的邮箱，如 a***@example.com
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (!local) return email;
  const firstChar = local.slice(0, 1);
  return `${firstChar}***@${domain}`;
}

/**
 * 计算佣金金额
 * @param {number} orderAmount - 订单金额
 * @param {number} level - 佣金级别：1=直推，2=间推
 * @returns {number} 佣金金额
 */
function calculateCommission(orderAmount, level) {
  if (typeof orderAmount !== 'number' || orderAmount < 0) {
    throw new Error('Invalid orderAmount');
  }
  // 严格两级分销：禁止三级以上
  if (level === 1) {
    return Math.round(orderAmount * DIRECT_RATE * 100) / 100;
  } else if (level === 2) {
    return Math.round(orderAmount * INDIRECT_RATE * 100) / 100;
  }
  throw new Error(`Invalid commission level: ${level}. Only level 1 (direct) and 2 (indirect) are allowed.`);
}

/**
 * 根据级别获取佣金比例
 * @param {number} level - 1 或 2
 * @returns {number} 佣金比例
 */
function getRateByLevel(level) {
  if (level === 1) return DIRECT_RATE;
  if (level === 2) return INDIRECT_RATE;
  throw new Error(`Invalid commission level: ${level}. Only level 1 and 2 are allowed.`);
}

/**
 * 生成6位邀请码（大写字母+数字，去除易混淆字符）
 * @returns {string} 6位邀请码
 */
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

/**
 * 生成唯一的邀请码（确保数据库中不重复）
 * @returns {Promise<string>} 唯一邀请码
 */
async function generateUniqueInviteCode() {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    const existing = await prisma.user.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!existing) return code;
    code = generateInviteCode();
    attempts++;
  }
  // 极端情况下追加随机后缀
  return code + Math.floor(Math.random() * 9);
}

/**
 * 记录佣金
 * @param {string} userId - 获得佣金的用户ID（上级）
 * @param {string} fromUserId - 贡献佣金的用户ID（下级）
 * @param {string|null} orderId - 来源订单ID
 * @param {number} orderAmount - 订单金额
 * @param {number} level - 佣金级别：1=直推，2=间推
 * @returns {Promise<object>} 佣金记录
 */
async function recordCommission(userId, fromUserId, orderId, orderAmount, level) {
  try {
    // 严格校验级别：仅允许1或2
    if (level !== 1 && level !== 2) {
      throw new Error(`Commission level must be 1 or 2, got ${level}`);
    }

    const rate = getRateByLevel(level);
    const amount = calculateCommission(orderAmount, level);

    const commission = await prisma.commission.create({
      data: {
        userId,
        fromUserId,
        orderId: orderId || null,
        level,
        rate,
        orderAmount,
        amount,
        status: 'pending',
      },
    });

    // 写入审计日志
    auditCommissionLog('create', {
      commissionId: commission.id,
      userId,
      fromUserId,
      orderId,
      level,
      rate,
      orderAmount,
      amount,
      status: 'pending',
    });

    logger.info(`Commission recorded: userId=${userId} fromUserId=${fromUserId} level=${level} amount=${amount}`);
    return commission;
  } catch (error) {
    logger.error('recordCommission failed:', error);
    throw error;
  }
}

/**
 * 获取分销统计
 * @param {string} userId - 用户ID
 * @returns {Promise<object>} 分销统计数据
 */
async function getDistributionStats(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, inviteCode: true, referrer: true, directReferrer: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 查询所有佣金记录聚合
    const commissions = await prisma.commission.findMany({
      where: { userId },
      select: { amount: true, status: true, level: true },
    });

    const totalEarnings = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingAmount = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const settledAmount = commissions
      .filter(c => c.status === 'settled')
      .reduce((sum, c) => sum + c.amount, 0);
    const withdrawnAmount = commissions
      .filter(c => c.status === 'withdrawn')
      .reduce((sum, c) => sum + c.amount, 0);
    const frozenAmount = commissions
      .filter(c => c.status === 'frozen')
      .reduce((sum, c) => sum + c.amount, 0);

    // 直推人数：directReferrer == userId 的用户数
    const directCount = await prisma.user.count({
      where: { directReferrer: userId },
    });

    // 间推人数：直推用户的直推用户数
    // 先获取所有直推用户ID，再统计他们的直推用户
    const directReferrals = await prisma.user.findMany({
      where: { directReferrer: userId },
      select: { id: true },
    });
    const directReferralIds = directReferrals.map(u => u.id);
    const indirectCount = directReferralIds.length > 0
      ? await prisma.user.count({
          where: { directReferrer: { in: directReferralIds } },
        })
      : 0;

    return {
      inviteCode: user.inviteCode || null,
      hasReferrer: !!user.referrer,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      settledAmount: Math.round(settledAmount * 100) / 100,  // 可提现金额
      withdrawnAmount: Math.round(withdrawnAmount * 100) / 100,
      frozenAmount: Math.round(frozenAmount * 100) / 100,
      directCount,
      indirectCount,
      directRate: DIRECT_RATE,
      indirectRate: INDIRECT_RATE,
    };
  } catch (error) {
    logger.error('getDistributionStats failed:', error);
    throw error;
  }
}

/**
 * 获取团队列表（直推/间推），手机号邮箱脱敏
 * @param {string} userId - 用户ID
 * @param {string} level - 'direct' 或 'indirect'
 * @param {number} page - 页码
 * @param {number} limit - 每页条数
 * @returns {Promise<object>} 团队列表
 */
async function getTeamMembers(userId, level = 'direct', page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    if (level === 'direct') {
      // 直推：directReferrer == userId
      const [members, total] = await Promise.all([
        prisma.user.findMany({
          where: { directReferrer: userId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
            email: true,
            createdAt: true,
            membershipLevel: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({
          where: { directReferrer: userId },
        }),
      ]);

      return {
        members: members.map(m => ({
          id: m.id,
          nickname: m.nickname || '未设置昵称',
          avatar: m.avatar || DEFAULT_AVATAR,
          phone: maskPhone(m.phone),
          email: maskEmail(m.email),
          membershipLevel: m.membershipLevel,
          joinedAt: m.createdAt,
          level: 'direct',
        })),
        total,
        page,
        limit,
      };
    } else if (level === 'indirect') {
      // 间推：直推用户的直推用户
      const directReferrals = await prisma.user.findMany({
        where: { directReferrer: userId },
        select: { id: true },
      });
      const directReferralIds = directReferrals.map(u => u.id);

      if (directReferralIds.length === 0) {
        return { members: [], total: 0, page, limit };
      }

      const [members, total] = await Promise.all([
        prisma.user.findMany({
          where: { directReferrer: { in: directReferralIds } },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phone: true,
            email: true,
            createdAt: true,
            membershipLevel: true,
            directReferrer: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({
          where: { directReferrer: { in: directReferralIds } },
        }),
      ]);

      // 构建 directReferrerId -> directReferral 映射，用于展示间推来源
      const directReferralMap = new Map(
        directReferrals.map(u => [u.id, u.id])
      );

      return {
        members: members.map(m => ({
          id: m.id,
          nickname: m.nickname || '未设置昵称',
          avatar: m.avatar || DEFAULT_AVATAR,
          phone: maskPhone(m.phone),
          email: maskEmail(m.email),
          membershipLevel: m.membershipLevel,
          joinedAt: m.createdAt,
          level: 'indirect',
          viaUserId: m.directReferrer,
        })),
        total,
        page,
        limit,
      };
    }

    throw new Error(`Invalid level parameter: ${level}. Use 'direct' or 'indirect'.`);
  } catch (error) {
    logger.error('getTeamMembers failed:', error);
    throw error;
  }
}

/**
 * 获取佣金明细
 * @param {string} userId - 用户ID
 * @param {number} page - 页码
 * @param {number} limit - 每页条数
 * @returns {Promise<object>} 佣金明细列表
 */
async function getCommissionRecords(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.commission.findMany({
        where: { userId },
        include: {
          fromUser: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.commission.count({ where: { userId } }),
    ]);

    return {
      records: records.map(r => ({
        id: r.id,
        orderId: r.orderId,
        fromUserId: r.fromUserId,
        fromUserNickname: r.fromUser?.nickname || '未知用户',
        fromUserAvatar: r.fromUser?.avatar || DEFAULT_AVATAR,
        level: r.level,
        levelText: r.level === 1 ? '直推' : '间推',
        rate: r.rate,
        orderAmount: r.orderAmount,
        amount: r.amount,
        status: r.status,
        statusText: {
          pending: '待结算',
          settled: '可提现',
          withdrawn: '已提现',
          frozen: '冻结',
        }[r.status] || r.status,
        settledAt: r.settledAt,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    logger.error('getCommissionRecords failed:', error);
    throw error;
  }
}

/**
 * 申请提现（最低1元）
 * @param {string} userId - 用户ID
 * @param {number} amount - 提现金额
 * @param {string} method - 提现方式：wechat / alipay
 * @param {string} account - 收款账号
 * @returns {Promise<object>} 提现记录
 */
async function requestWithdrawal(userId, amount, method, account) {
  try {
    // 参数校验
    if (!amount || amount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL} CNY`);
    }
    if (!method || !['wechat', 'alipay'].includes(method)) {
      throw new Error('Invalid withdrawal method, must be wechat or alipay');
    }
    if (!account || !account.trim()) {
      throw new Error('Withdrawal account is required');
    }

    // 查询可提现余额（status='settled' 的佣金总额）
    const settledCommissions = await prisma.commission.findMany({
      where: { userId, status: 'settled' },
      select: { id: true, amount: true },
      orderBy: { settledAt: 'asc' },
    });

    const availableBalance = settledCommissions.reduce((sum, c) => sum + c.amount, 0);
    const roundedAvailable = Math.round(availableBalance * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > roundedAvailable) {
      throw new Error(`Insufficient balance. Available: ${roundedAvailable} CNY, requested: ${roundedAmount} CNY`);
    }

    // 创建提现记录
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: roundedAmount,
        method,
        account: account.trim(),
        status: 'pending',
      },
    });

    // 冻结对应金额的佣金（FIFO：从最早的 settled 开始冻结）
    let remaining = roundedAmount;
    const frozenCommissionIds = [];
    for (const commission of settledCommissions) {
      if (remaining <= 0) break;
      remaining -= commission.amount;
      frozenCommissionIds.push(commission.id);
    }

    if (frozenCommissionIds.length > 0) {
      await prisma.commission.updateMany({
        where: { id: { in: frozenCommissionIds } },
        data: { status: 'frozen' },
      });

      // 写入审计日志
      auditCommissionLog('freeze', {
        withdrawalId: withdrawal.id,
        userId,
        amount: roundedAmount,
        frozenCommissionIds,
        method,
        account: maskPhone(account) || maskEmail(account),
      });
    }

    logger.info(`Withdrawal requested: userId=${userId} amount=${roundedAmount} method=${method} withdrawalId=${withdrawal.id}`);
    return withdrawal;
  } catch (error) {
    logger.error('requestWithdrawal failed:', error);
    throw error;
  }
}

/**
 * 获取提现记录
 * @param {string} userId - 用户ID
 * @param {number} page - 页码
 * @param {number} limit - 每页条数
 * @returns {Promise<object>} 提现记录列表
 */
async function getWithdrawalRecords(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where: { userId } }),
    ]);

    return {
      records: records.map(r => ({
        id: r.id,
        amount: r.amount,
        method: r.method,
        methodText: r.method === 'wechat' ? '微信' : '支付宝',
        account: r.method === 'wechat' ? maskPhone(r.account) : maskEmail(r.account),
        status: r.status,
        statusText: {
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝',
          paid: '已到账',
        }[r.status] || r.status,
        remark: r.remark,
        reviewedAt: r.reviewedAt,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    logger.error('getWithdrawalRecords failed:', error);
    throw error;
  }
}

/**
 * 结算佣金（订单完成7天后转为可提现）
 * 定时任务调用，扫描所有 pending 状态且超过结算周期的佣金记录
 * @returns {Promise<object>} 结算结果统计
 */
async function settleCommissions() {
  try {
    const settleBefore = new Date(Date.now() - SETTLE_DAYS * 24 * 60 * 60 * 1000);

    // 查询所有待结算且超过7天的佣金记录
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: settleBefore },
      },
      select: { id: true, userId: true, amount: true, orderId: true },
    });

    if (pendingCommissions.length === 0) {
      logger.info('settleCommissions: no pending commissions to settle');
      return { settled: 0, totalAmount: 0 };
    }

    const commissionIds = pendingCommissions.map(c => c.id);
    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

    // 批量更新为已结算
    const result = await prisma.commission.updateMany({
      where: { id: { in: commissionIds } },
      data: {
        status: 'settled',
        settledAt: new Date(),
      },
    });

    // 写入审计日志
    auditCommissionLog('settle', {
      count: result.count,
      commissionIds,
      totalAmount: Math.round(totalAmount * 100) / 100,
      settledAt: new Date().toISOString(),
    });

    logger.info(`Commissions settled: count=${result.count} totalAmount=${totalAmount}`);
    return {
      settled: result.count,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  } catch (error) {
    logger.error('settleCommissions failed:', error);
    throw error;
  }
}

/**
 * 获取邀请排行榜（周榜/月榜）
 * 按邀请人数排名
 * @param {string} type - 'week' 或 'month'
 * @param {number} limit - 返回条数
 * @returns {Promise<object>} 排行榜列表
 */
async function getLeaderboard(type = 'week', limit = 20) {
  try {
    if (!['week', 'month'].includes(type)) {
      throw new Error(`Invalid leaderboard type: ${type}. Use 'week' or 'month'.`);
    }

    // 计算时间范围
    const now = new Date();
    let startDate;
    if (type === 'week') {
      // 本周开始（周一）
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // 周日为0，转为6
      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 本月开始
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 统计每个用户在时间范围内邀请的人数（通过 ReferralLink 表）
    const leaderboard = await prisma.referralLink.groupBy({
      by: ['referrerId'],
      where: {
        boundAt: { gte: startDate },
      },
      _count: {
        refereeId: true,
      },
      orderBy: {
        _count: {
          refereeId: 'desc',
        },
      },
      take: limit,
    });

    if (leaderboard.length === 0) {
      return { type, list: [] };
    }

    // 查询用户信息
    const referrerIds = leaderboard.map(item => item.referrerId);
    const users = await prisma.user.findMany({
      where: { id: { in: referrerIds } },
      select: { id: true, nickname: true, avatar: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return {
      type,
      typeText: type === 'week' ? '周榜' : '月榜',
      startDate,
      list: leaderboard.map((item, index) => {
        const user = userMap.get(item.referrerId);
        return {
          rank: index + 1,
          userId: item.referrerId,
          nickname: user?.nickname || '未知用户',
          avatar: user?.avatar || DEFAULT_AVATAR,
          inviteCount: item._count.refereeId,
        };
      }),
    };
  } catch (error) {
    logger.error('getLeaderboard failed:', error);
    throw error;
  }
}

/**
 * 获取邀请海报数据
 * @param {string} userId - 用户ID
 * @returns {Promise<object>} 海报数据
 */
async function getInvitePosterData(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uniqueId: true,
        nickname: true,
        avatar: true,
        inviteCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 获取分销统计概要
    const stats = await getDistributionStats(userId);

    return {
      user: {
        id: user.id,
        nickname: user.nickname || '言道外语用户',
        avatar: user.avatar || DEFAULT_AVATAR,
      },
      inviteCode: user.inviteCode || user.uniqueId,
      uniqueId: user.uniqueId,
      stats: {
        directCount: stats.directCount,
        indirectCount: stats.indirectCount,
        totalEarnings: stats.totalEarnings,
      },
      rules: {
        directRate: DIRECT_RATE,
        indirectRate: INDIRECT_RATE,
        directRateText: '15%',
        indirectRateText: '5%',
      },
    };
  } catch (error) {
    logger.error('getInvitePosterData failed:', error);
    throw error;
  }
}

module.exports = {
  // 常量导出（供外部只读引用）
  DIRECT_RATE,
  INDIRECT_RATE,
  SETTLE_DAYS,
  MIN_WITHDRAWAL,
  // 方法导出
  calculateCommission,
  recordCommission,
  getDistributionStats,
  getTeamMembers,
  getCommissionRecords,
  requestWithdrawal,
  getWithdrawalRecords,
  settleCommissions,
  getLeaderboard,
  getInvitePosterData,
  maskPhone,
  maskEmail,
  generateUniqueInviteCode,
  getRateByLevel,
};
