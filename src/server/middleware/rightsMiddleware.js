/**
 * Stage 10 阶段3：权益校验中间件
 * requireRight(rightCode) — 白名单放行，其余拦截
 */
const membershipService = require('../../services/membershipService');

// 权益码缓存（避免每次请求都查DB）
let rightsCache = null;
let rightsCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60秒缓存

async function getRightsCache() {
  if (rightsCache && Date.now() - rightsCacheTime < CACHE_TTL) {
    return rightsCache;
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    rightsCache = await prisma.membershipRights.findMany();
    rightsCacheTime = Date.now();
  } finally {
    await prisma.$disconnect();
  }
  return rightsCache;
}

function clearRightsCache() {
  rightsCache = null;
  rightsCacheTime = 0;
}

/**
 * 权益校验中间件
 * @param {string|Array} rightCode — 单个权益码或权益码数组（任一满足即可）
 * @returns {Function} Express middleware
 */
function requireRight(rightCode) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          code: 1001,
          error: 'Authentication required',
        });
      }

      const rights = await membershipService.getUserRights(req.user.id);
      if (rights.expired) {
        return res.status(403).json({
          success: false,
          code: 9001,
          error: 'Membership expired, please renew to access this feature',
        });
      }

      const codes = Array.isArray(rightCode) ? rightCode : [rightCode];
      const userFeatures = rights.features || [];

      // 白名单放行：用户拥有任一所需权益码即放行
      const hasRight = codes.some(code => userFeatures.includes(code));

      if (!hasRight) {
        return res.status(403).json({
          success: false,
          code: 9002,
          error: 'This feature requires a higher membership plan',
          requiredRight: codes,
          currentLevel: rights.levelCode,
        });
      }

      // 将权益信息附加到req对象
      req.userRights = rights;
      next();
    } catch (e) {
      console.error('[requireRight] Error:', e.message);
      return res.status(500).json({
        success: false,
        code: 5000,
        error: 'Rights check failed',
      });
    }
  };
}

/**
 * 配额校验中间件（用于每日次数限制）
 * @param {string} quotaName — 配额名称（如aiText, aiScreenshot）
 */
function requireQuota(quotaName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, code: 1001, error: 'Authentication required' });
      }

      const rights = await membershipService.getUserRights(req.user.id);
      const dailyLimits = rights.dailyLimits || {};
      const limit = dailyLimits[quotaName];

      // -1表示不限次
      if (limit === -1 || limit === undefined) {
        req.userRights = rights;
        return next();
      }

      // 0表示无权限
      if (limit === 0) {
        return res.status(403).json({
          success: false,
          code: 9002,
          error: 'This feature requires a higher membership plan',
          quotaName,
        });
      }

      // 检查当日使用量（需要Redis或DB计数器，此处简化为放行，实际配额由各模块自行检查）
      req.userRights = rights;
      req.quotaLimit = limit;
      next();
    } catch (e) {
      console.error('[requireQuota] Error:', e.message);
      return res.status(500).json({ success: false, code: 5000, error: 'Quota check failed' });
    }
  };
}

module.exports = { requireRight, requireQuota, clearRightsCache };
