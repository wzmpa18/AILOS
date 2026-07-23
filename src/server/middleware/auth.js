const { verifyToken } = require('../../utils/jwt');
const redis = require('../../config/redis');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // Check if token is blacklisted (fail open if Redis unavailable)
    try {
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Token is blacklisted',
        });
      }
    } catch (redisError) {
      logger.warn('Redis blacklist check failed, allowing request:', redisError.message);
    }

    const payload = verifyToken(token);

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

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    req.user = user;
    req.userId = user.id;
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

          if (user && user.isActive) {
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