/**
 * AI Quota Service - Daily quota tracking for AI features
 * Quota: FREE=5/3, basic=20, premium=50, flagship=100
 * Resets daily at 00:00 via Redis key expiry
 */
const redis = require('../config/redis');
const prisma = require('../config/database');
const logger = require('../../utils/logger');

const FREE_QUOTA = { conversation: 5, correction: 3 };
const MEMBER_QUOTA = {
  free: { conversation: 5, correction: 3 },
  basic: { conversation: 20, correction: 20 },
  premium: { conversation: 50, correction: 50 },
  flagship: { conversation: 100, correction: 100 },
};

function getToday() { return new Date().toISOString().slice(0, 10); }
function getResetAt() {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function buildKey(userId, date, type) { return 'ailos:quota:' + userId + ':' + date + ':' + type; }

function getQuotaLimit(user, type) {
  if (user && user.membershipLevel && MEMBER_QUOTA[user.membershipLevel]) {
    return MEMBER_QUOTA[user.membershipLevel][type] || FREE_QUOTA[type];
  }
  return FREE_QUOTA[type];
}

async function checkQuota(userId, type) {
  try {
    const today = getToday();
    const key = buildKey(userId, today, type);
    const usedStr = await redis.get(key);
    const used = usedStr ? parseInt(usedStr, 10) : 0;

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { membershipLevel: true },
      });
    } catch (e) { /* fallback to free */ }

    const total = getQuotaLimit(user, type);
    const remaining = Math.max(0, total - used);
    return { allowed: remaining > 0, remaining, total, resetAt: getResetAt() };
  } catch (err) {
    logger.error('checkQuota error:', err.message);
    return { allowed: true, remaining: 1, total: 1, resetAt: getResetAt() };
  }
}

async function consumeQuota(userId, type) {
  try {
    const today = getToday();
    const key = buildKey(userId, today, type);
    const used = await redis.incr(key);
    if (used === 1) {
      const now = new Date();
      const eod = new Date(now); eod.setHours(23, 59, 59, 999);
      const ttl = Math.ceil((eod.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttl);
    }
    let user = null;
    try { user = await prisma.user.findUnique({ where: { id: userId }, select: { membershipLevel: true } }); } catch (e) {}
    const total = getQuotaLimit(user, type);
    return { success: true, used, remaining: Math.max(0, total - used), total };
  } catch (err) {
    logger.error('consumeQuota error:', err.message);
    return { success: false, used: 0, remaining: 0, total: 0 };
  }
}

async function getQuota(userId) {
  try {
    const today = getToday();
    let user = null;
    try { user = await prisma.user.findUnique({ where: { id: userId }, select: { membershipLevel: true } }); } catch (e) {}
    const types = ['conversation', 'correction'];
    const result = { userId, membershipLevel: user?.membershipLevel || 'free', resetAt: getResetAt(), quotas: {} };
    for (const type of types) {
      const key = buildKey(userId, today, type);
      const usedStr = await redis.get(key);
      const used = usedStr ? parseInt(usedStr, 10) : 0;
      const total = getQuotaLimit(user, type);
      result.quotas[type] = { used, total, remaining: Math.max(0, total - used), allowed: (total - used) > 0 };
    }
    return result;
  } catch (err) {
    logger.error('getQuota error:', err.message);
    return { userId, membershipLevel: 'free', resetAt: getResetAt(), quotas: { conversation: { used: 0, total: 5, remaining: 5, allowed: true }, correction: { used: 0, total: 3, remaining: 3, allowed: true } } };
  }
}

module.exports = { checkQuota, consumeQuota, getQuota, FREE_QUOTA, MEMBER_QUOTA };