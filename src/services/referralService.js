/**
 * Stage 10 阶段4：邀请关系服务
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bindReferral(referrerId, refereeId, inviteCode, source = 'share_link') {
  // 检查被邀请人是否已绑定过
  const existing = await prisma.referralLink.findUnique({
    where: { refereeId },
  });
  if (existing) {
    return { success: false, message: 'User already has a referrer' };
  }

  // 检查邀请人存在
  const referrer = await prisma.user.findUnique({ where: { id: referrerId } });
  if (!referrer) {
    return { success: false, message: 'Referrer not found' };
  }

  const referral = await prisma.referralLink.create({
    data: { referrerId, refereeId, inviteCode, source },
  });

  return { success: true, data: referral };
}

async function getReferralByCode(inviteCode) {
  // inviteCode就是用户的uniqueId
  const referrer = await prisma.user.findUnique({
    where: { uniqueId: inviteCode },
    select: { id: true, nickname: true, uniqueId: true },
  });
  return referrer;
}

async function getMyReferrals(userId, page = 1, limit = 20) {
  const [referrals, total] = await Promise.all([
    prisma.referralLink.findMany({
      where: { referrerId: userId },
      include: {
        referee: { select: { id: true, nickname: true, avatar: true, createdAt: true } },
      },
      orderBy: { boundAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referralLink.count({ where: { referrerId: userId } }),
  ]);

  return {
    referrals: referrals.map(r => ({
      id: r.id,
      refereeId: r.refereeId,
      refereeNickname: r.referee?.nickname || '未知用户',
      refereeAvatar: r.referee?.avatar || DEFAULT_AVATAR,
      boundAt: r.boundAt,
      source: r.source,
    })),
    total,
    page,
    limit,
  };
}

async function getMyReferrer(userId) {
  const referral = await prisma.referralLink.findUnique({
    where: { refereeId: userId },
    include: {
      referrer: { select: { id: true, nickname: true, uniqueId: true, avatar: true } },
    },
  });

  if (!referral) return null;

  return {
    referrerId: referral.referrerId,
    referrerNickname: referral.referrer?.nickname || '未知',
    referrerUniqueId: referral.referrer?.uniqueId || '',
    boundAt: referral.boundAt,
  };
}

module.exports = { bindReferral, getReferralByCode, getMyReferrals, getMyReferrer };
