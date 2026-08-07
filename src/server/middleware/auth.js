const { verifyToken } = require('../../utils/jwt');
const redis = require('../../config/redis');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const { isUserUsable } = require('../utils/userState');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // ===== v1.1.0 宪法 2.1 鉴权 fail-close 铁律 =====
    //   安全默认最严格：Redis 黑名单查询异常/超时/失败时【默认拒绝访问】(401)，
    //   绝不放行。仅当环境变量 AUTH_FAIL_OPEN=true 显式开启时才降级放行，生产默认关闭。
    const AUTH_FAIL_OPEN = process.env.AUTH_FAIL_OPEN === 'true';
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

    // 单 token 黑名单校验（独立生效）
    try {
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        logger.error(`[auth] 单token黑名单命中 ip=${clientIp} error=Token is blacklisted`);
        return res.status(401).json({
          success: false,
          error: '系统安全校验失败，请稍后重试',
        });
      }
    } catch (redisError) {
      logger.error(`[auth] Redis黑名单查询异常 ip=${clientIp} error=${redisError.message}`);
      if (!AUTH_FAIL_OPEN) {
        return res.status(401).json({
          success: false,
          error: '系统安全校验失败，请稍后重试',
        });
      }
      logger.warn('[auth] AUTH_FAIL_OPEN=true，Redis异常时降级放行');
    }

    const payload = verifyToken(token);

    // 宪法 2.2 全设备下线校验（不依赖 isActive 兜底）。
    //   注销时写入 blacklist:uid:<userId> = <吊销时刻秒级时间戳>，
    //   凡签发时间(iat) 早于该时刻的 token 一律失效，覆盖所有已登录设备。
    //   Redis 不可用时默认拒绝（fail-close），绝不因 Redis 抖动而放行已注销账号。
    try {
      const subjectId = payload.isGuest ? payload.guestId : payload.userId;
      if (subjectId) {
        const revokedAt = await redis.get(`blacklist:uid:${subjectId}`);
        if (revokedAt && payload.iat && Number(payload.iat) < Number(revokedAt)) {
          logger.error(`[auth] 用户级黑名单命中 ip=${clientIp} userId=${subjectId} error=账号已注销`);
          return res.status(401).json({
            success: false,
            error: '账号已注销，令牌已失效',
          });
        }
      }
    } catch (redisError) {
      logger.error(`[auth] Redis用户级黑名单查询异常 ip=${clientIp} userId=${payload.userId || ''} error=${redisError.message}`);
      if (!AUTH_FAIL_OPEN) {
        return res.status(401).json({
          success: false,
          error: '系统安全校验失败，请稍后重试',
        });
      }
      logger.warn('[auth] AUTH_FAIL_OPEN=true，Redis异常时降级放行');
    }

    // Guest token: restricted access, no User lookup needed
    if (payload.isGuest && payload.guestId) {
      const guestSession = await prisma.guestSession.findUnique({
        where: { id: payload.guestId },
      });

      if (!guestSession || guestSession.convertedAt) {
        return res.status(401).json({
          success: false,
          error: 'Guest session expired or converted',
        });
      }

      req.guestId = payload.guestId;
      req.isGuest = true;
      return next();
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    // 漏洞7 修复：软删除判定「唯一标准」= isActive。
    //   status 只作辅助标记，且必须兼容存量数据的 NULL（存量用户 status 为 null 属正常，
    //   绝不能因 status !== 'active' 就判定禁用，否则存量用户会全员登录失败）。
    if (!user || !isUserUsable(user)) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    req.user = user;
    req.userId = user.id;

    // 模块三：滑动续期 —— accessToken 剩余 < 7 天时自动签发新 token 下发响应头，
    // 活跃用户无需重新登录。jti 每次刷新均重新生成，旧 token 在各自过期前仍可用。
    try {
      const { getExpiry, generateTokens } = require('../../utils/jwt');
      const remain = getExpiry(token);
      const SEVEN_DAYS = 7 * 24 * 3600;
      if (remain > 0 && remain < SEVEN_DAYS) {
        const fresh = generateTokens({
          userId: user.id,
          account: payload.account,
          phone: payload.phone,
          email: payload.email,
          role: payload.role,
        });
        if (fresh && fresh.accessToken) {
          res.set('X-Access-Token', fresh.accessToken);
        }
      }
    } catch (renewErr) {
      logger.warn('[auth] token 滑动续期失败(不影响本次请求):', renewErr.message);
    }

    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = verifyToken(token);

        // Guest token
        if (payload.isGuest && payload.guestId) {
          const guestSession = await prisma.guestSession.findUnique({
            where: { id: payload.guestId },
          });

          if (guestSession && !guestSession.convertedAt) {
            req.guestId = payload.guestId;
            req.isGuest = true;
          }
        } else {
          // Regular user token
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
          });

          // 漏洞7：与 authenticate 使用同一套可用性判定，禁止两套逻辑并存
          if (isUserUsable(user)) {
            req.user = user;
            req.userId = user.id;
          }
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const requireMembership = (requiredLevel = 'basic') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const membershipService = require('../../services/membershipService');
      const hasAccess = await membershipService.verifyMembership(req.userId, requiredLevel);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Membership level insufficient',
          requiredLevel,
        });
      }

      next();
    } catch (error) {
      logger.error('Membership check failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Membership check failed',
      });
    }
  };
};

// Guest-only middleware: blocks guest access to write/paid endpoints
const requireUser = async (req, res, next) => {
  try {
    if (req.isGuest || !req.userId) {
      return res.status(403).json({
        success: false,
        error: 'This feature requires a registered account',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireMembership,
  requireUser,
};