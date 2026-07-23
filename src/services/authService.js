const prisma = require('../config/database');
const redis = require('../config/redis');
const { generateTokens, generateGuestToken, verifyToken } = require('../utils/jwt');
const { hashPassword, comparePassword, generateSmsCode, generateRandomString } = require('../utils/crypto');
const { checkRateLimit } = require('../utils/rateLimiter');
const smsService = require('./smsService');
const logger = require('../utils/logger');
const config = require('../config');

class AuthService {
  // Phone + SMS login/register
  async phoneAuth(phone, code, deviceInfo) {
    try {
      const rateLimit = await checkRateLimit(phone, 'sms_login', 5, 900);
      if (!rateLimit.allowed) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const smsVerification = await prisma.smsVerification.findFirst({
        where: {
          phone,
          code,
          type: 'login',
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!smsVerification) {
        throw new Error('Invalid or expired verification code');
      }

      await prisma.smsVerification.update({
        where: { id: smsVerification.id },
        data: { verified: true },
      });

      let user = await prisma.user.findUnique({ where: { phone } });
      
      if (!user) {
        user = await this._createUserWithIdentity({ phone });
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: deviceInfo?.ipAddress,
        },
      });

      const tokens = generateTokens({ userId: user.id, uniqueId: user.uniqueId });
      await this.createSession(user.id, tokens, deviceInfo);

      return { user: this.sanitizeUser(user), tokens };
    } catch (error) {
      logger.error('Phone auth failed:', error);
      throw error;
    }
  }

  // WeChat login
  async wechatAuth(wechatCode, deviceInfo) {
    try {
      const wechatUserInfo = await this.getWechatUserInfo(wechatCode);

      let user = await prisma.user.findUnique({
        where: { wechatOpenId: wechatUserInfo.openid },
      });

      if (!user) {
        user = await this._createUserWithIdentity({
          wechatOpenId: wechatUserInfo.openid,
          wechatUnionId: wechatUserInfo.unionid,
          nickname: wechatUserInfo.nickname,
          avatar: wechatUserInfo.headimgurl,
        });
      }

      const tokens = generateTokens({ userId: user.id, uniqueId: user.uniqueId });
      await this.createSession(user.id, tokens, deviceInfo);

      return { user: this.sanitizeUser(user), tokens };
    } catch (error) {
      logger.error('WeChat auth failed:', error);
      throw error;
    }
  }

  // Password login
  async passwordAuth(account, password, deviceInfo) {
    try {
      const rateLimit = await checkRateLimit(account, 'password_login', 10, 900);
      if (!rateLimit.allowed) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: account },
            { email: account },
          ],
        },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const updateData = { failedLoginAttempts };

        if (failedAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        throw new Error('Invalid credentials');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: deviceInfo?.ipAddress,
        },
      });

      const tokens = generateTokens({ userId: user.id, uniqueId: user.uniqueId });
      await this.createSession(user.id, tokens, deviceInfo);

      return { user: this.sanitizeUser(user), tokens };
    } catch (error) {
      logger.error('Password auth failed:', error);
      throw error;
    }
  }

  // Send SMS verification code
  async sendSmsCode(phone, type = 'login') {
    try {
      const rateLimit = await checkRateLimit(phone, 'sms_send', 5, 900);
      if (!rateLimit.allowed) {
        throw new Error('Too many SMS requests. Please try again later.');
      }

      const code = generateSmsCode(6);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.smsVerification.create({
        data: {
          phone,
          code,
          type,
          expiresAt,
        },
      });

      try {
        const smsResult = await smsService.sendVerificationCode(phone, code, type);
        logger.info(`SMS sent to ${phone} via ${smsResult.provider} — RequestId: ${smsResult.requestId}`);
      } catch (smsError) {
        logger.error(`SMS send failed for ${phone}: ${smsError.message}`);
        if (config.env !== 'production') {
          logger.info(`DEV fallback — SMS Code for ${phone}: ${code}`);
        } else {
          throw new Error('SMS verification code send failed. Please try again later.');
        }
      }

      return {
        success: true,
        expiresAt,
        code: config.env === 'production' ? undefined : code,
      };
    } catch (error) {
      logger.error('Send SMS code failed:', error);
      throw error;
    }
  }

  // Send email verification code
  async sendEmailCode(email, type = 'login') {
    try {
      const rateLimit = await checkRateLimit(email, 'email_send', 5, 900);
      if (!rateLimit.allowed) {
        throw new Error('Too many email requests. Please try again later.');
      }

      const code = generateSmsCode(6);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.smsVerification.create({
        data: {
          phone: email,
          code,
          type: type + '_email',
          expiresAt,
        },
      });

      if (config.env !== 'production') {
        logger.info(`Email Code for ${email}: ${code}`);
      }

      return { success: true, expiresAt, code: config.env === 'production' ? undefined : code };
    } catch (error) {
      logger.error('Send email code failed:', error);
      throw error;
    }
  }

  // Register with password (with SMS/email verification)
  async registerWithPassword(phone, email, password, code, nickname, context = {}) {
    try {
      if (code) {
        const identifier = phone || email;
        if (!identifier) {
          throw new Error('Phone or email is required for verification');
        }

        const verification = await prisma.smsVerification.findFirst({
          where: {
            phone: identifier,
            code,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!verification) {
          throw new Error('Invalid or expired verification code');
        }

        await prisma.smsVerification.update({
          where: { id: verification.id },
          data: { verified: true },
        });
      }

      const conditions = [];
      if (phone) conditions.push({ phone });
      if (email) conditions.push({ email });

      if (conditions.length > 0) {
        const existingUser = await prisma.user.findFirst({
          where: { OR: conditions },
        });

        if (existingUser) {
          throw new Error('User already exists');
        }
      }

      const user = await this._createUserWithIdentity({
        phone,
        email,
        password,
        nickname,
        context,
      });

      const tokens = generateTokens({ userId: user.id, uniqueId: user.uniqueId });
      const deviceInfo = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      };
      await this.createSession(user.id, tokens, deviceInfo);

      return { user: this.sanitizeUser(user), tokens };
    } catch (error) {
      logger.error('Register with password failed:', error);
      throw error;
    }
  }

  // Internal: create user with identity, workspace, and language preference
  async _createUserWithIdentity({ phone, email, password, wechatOpenId, wechatUnionId, nickname, avatar, context = {} }) {
    const passwordHash = password ? await hashPassword(password) : null;
    const uniqueId = generateRandomString(16);

    const user = await prisma.user.create({
      data: {
        uniqueId,
        phone: phone || null,
        email: email || null,
        passwordHash,
        wechatOpenId: wechatOpenId || null,
        wechatUnionId: wechatUnionId || null,
        nickname: nickname || null,
        avatar: avatar || null,
        membershipLevel: 'free',
        isActive: true,
        isVerified: true,
      },
    });

    const identity = await prisma.userIdentity.create({
      data: {
        userId: user.id,
        identityType: 'personal',
        metadata: {
          registrationSource: 'web',
          uiLanguage: context.uiLanguage || 'zh',
          browserLanguage: context.browserLanguage || 'zh-CN',
        },
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: nickname ? `${nickname}的个人空间` : '我的学习空间',
        type: 'personal',
        ownerId: user.id,
        isDefault: true,
        config: { language: context.uiLanguage || 'zh' },
      },
    });

    await prisma.userIdentity.update({
      where: { id: identity.id },
      data: { defaultWorkspaceId: workspace.id },
    });

    const uiLang = context.uiLanguage || 'zh';
    const browserLang = context.browserLanguage || 'zh-CN';
    const nativeLang = browserLang.startsWith('zh') ? 'zh-CN' : 
                       browserLang.startsWith('ja') ? 'ja' : 
                       browserLang.startsWith('en') ? 'en' : 'zh-CN';

    try {
      await prisma.userLanguagePreference.create({
        data: {
          userId: user.id,
          nativeLanguage: nativeLang,
          defaultExplanationLanguage: nativeLang,
          fallbackLanguage: "zh-CN",
          interfaceLanguage: uiLang,
        },
      });
    } catch (e) {
      logger.warn('Failed to create language preference:', e.message);
    }

    // 初始化签到记录（新用户 streak=0，等待首次签到）
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.checkin.create({
        data: {
          userId: user.id,
          checkinDate: today,
          streak: 0,
          xpAwarded: 0,
        },
      });
      logger.info(`Checkin record initialized for user ${user.id}`);
    } catch (e) {
      if (e.code === 'P2002') {
        logger.info(`Checkin record already exists for user ${user.id}`);
      } else {
        logger.warn(`Failed to initialize checkin for user ${user.id}:`, e.message);
      }
    }

    // 初始化免费额度（free 用户每日5次对话+3次纠错）
    try {
      await prisma.userQuota.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          dailyConversation: 0,
          dailyCorrection: 0,
          maxConversation: 5,
          maxCorrection: 3,
          resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
        },
        update: {},
      });
      logger.info(`Quota initialized for user ${user.id}`);
    } catch (e) {
      logger.warn(`Failed to initialize quota for user ${user.id}:`, e.message);
    }

    logger.info(`New user registered: ${user.id} (${phone || email || wechatOpenId})`);
    return user;
  }

  // Logout
  async logout(userId, token) {
    try {
      await prisma.session.deleteMany({
        where: { userId, token },
      });

      try {
        await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, '1');
      } catch (e) {
        logger.warn('Redis blacklist failed (non-fatal):', e.message);
      }

      return { success: true };
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const payload = verifyToken(refreshToken);
      if (payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      try {
        const isBlacklisted = await redis.exists(`blacklist:${refreshToken}`);
        if (isBlacklisted) {
          throw new Error('Token is blacklisted');
        }
      } catch (e) {
        // Redis not available, skip blacklist check
      }

      const tokens = generateTokens({ userId: payload.userId, uniqueId: payload.uniqueId });

      await prisma.session.updateMany({
        where: { userId: payload.userId, refreshToken },
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          lastUsedAt: new Date(),
        },
      });

      return { tokens };
    } catch (error) {
      logger.error('Refresh token failed:', error);
      throw error;
    }
  }

  // Guest session management
  async createGuestSession(deviceId) {
    try {
      const guestSession = await prisma.guestSession.create({
        data: {
          deviceId,
          lastActiveAt: new Date(),
        },
      });

      // Generate 2-hour guest JWT token
      const { token, expiresIn } = generateGuestToken(guestSession.id);

      logger.info(`Guest session created: ${guestSession.id} (device: ${deviceId})`);

      return {
        guestId: guestSession.id,
        token,
        expiresIn,
      };
    } catch (error) {
      logger.error('Create guest session failed:', error);
      throw error;
    }
  }

  async updateGuestProgress(guestId, progress) {
    try {
      const guestSession = await prisma.guestSession.findUnique({
        where: { id: guestId },
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      if (guestSession.convertedAt) {
        throw new Error('Guest session already converted');
      }

      // Whitelist: only allow specific progress fields
      const whitelistedProgress = {};
      const allowedKeys = ['viewedLessons', 'completedSamples', 'currentStep', 'preferredLanguage'];
      for (const key of allowedKeys) {
        if (progress[key] !== undefined) {
          whitelistedProgress[key] = progress[key];
        }
      }

      await prisma.guestSession.update({
        where: { id: guestId },
        data: {
          localProgress: {
            ...(guestSession.localProgress || {}),
            ...whitelistedProgress,
          },
          lastActiveAt: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      logger.error('Update guest progress failed:', error);
      throw error;
    }
  }

  async convertGuestToUser(guestId, userId) {
    try {
      const guestSession = await prisma.guestSession.findUnique({
        where: { id: guestId },
      });

      if (!guestSession) {
        throw new Error('Guest session not found');
      }

      if (guestSession.convertedAt) {
        throw new Error('Guest session already converted');
      }

      // Migrate whitelisted progress data only
      if (guestSession.localProgress) {
        const whitelisted = {};
        const allowedKeys = ['viewedLessons', 'completedSamples', 'currentStep', 'preferredLanguage'];
        for (const key of allowedKeys) {
          if (guestSession.localProgress[key] !== undefined) {
            whitelisted[key] = guestSession.localProgress[key];
          }
        }

        if (Object.keys(whitelisted).length > 0) {
          logger.info(`Migrating whitelisted guest progress for user ${userId}: ${JSON.stringify(whitelisted)}`);
        }
      }

      await prisma.guestSession.update({
        where: { id: guestId },
        data: {
          convertedUserId: userId,
          convertedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      logger.error('Convert guest to user failed:', error);
      throw error;
    }
  }

  // Helper methods
  async createSession(userId, tokens, deviceInfo) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
        expiresAt,
      },
    });
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async getWechatUserInfo(code) {
    return {
      openid: 'mock_wechat_openid_' + generateRandomString(8),
      unionid: 'mock_wechat_unionid_' + generateRandomString(8),
      nickname: 'WeChat User',
      headimgurl: 'https://example.com/avatar.jpg',
    };
  }
}

module.exports = new AuthService();