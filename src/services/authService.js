const prisma = require('../config/database');
const redis = require('../config/redis');
const { generateTokens, generateGuestToken, verifyToken } = require('../utils/jwt');
const { hashPassword, comparePassword, generateSmsCode, generateRandomString } = require('../utils/crypto');
const { checkRateLimit } = require('../utils/rateLimiter');
const smsService = require('./smsService');
const logger = require('../utils/logger');
const config = require('../config');
const { getSystemConfigService } = require('./systemConfigService');

// Default avatar URL — cute parrot image for the language learning app
const DEFAULT_AVATAR = '/assets/images/default_avatar.png';

// 判断是否为管理员（用于登录审计等场景）
async function isAdminUser(userId) {
  if (!userId) return false;
  const envAdmins = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (envAdmins.includes(userId)) return true;
  try {
    const cfg = getSystemConfigService();
    const ids = await cfg.getJson('admin.user_ids', []);
    if (Array.isArray(ids) && ids.map(String).includes(String(userId))) return true;
  } catch (e) {
    logger.warn('[authService] isAdminUser check failed:', e.message);
  }
  return false;
}

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

      if (user && user.disabled) {
        throw new Error('ACCOUNT_DISABLED');
      }

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

      if (user && user.disabled) {
        throw new Error('ACCOUNT_DISABLED');
      }

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

      if (!user) {
        throw new Error('Invalid credentials');
      }
      if (!user.passwordHash) {
        throw new Error('该账号尚未设置密码，请使用短信验证码登录或通过找回密码设置密码');
      }

      if (user.disabled) {
        throw new Error('ACCOUNT_DISABLED');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const updateData = { failedLoginAttempts: failedAttempts };

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

      if (await isAdminUser(user.id)) {
        try {
          await prisma.loginLog.create({
            data: {
              adminId: user.id,
              account: user.phone || user.email || account,
              ip: deviceInfo?.ipAddress || null,
              userAgent: deviceInfo?.userAgent || null,
            },
          });
        } catch (logErr) {
          logger.warn('[authService] 写入管理员登录日志失败:', logErr.message);
        }
      }

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
      // 邮件验证码有效期5分钟（与SES模板"有效期5分钟"一致）
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.smsVerification.create({
        data: {
          phone: email,
          code,
          type: type + '_email',
          expiresAt,
        },
      });

      // 优先使用腾讯云SES SDK发送，失败时回退到SMTP(nodemailer)
      let emailSent = false;

      // 方式1: 腾讯云SES SDK API
      if (!emailSent) {
        try {
          const smsService = require('./smsService');
          await smsService.sendEmailCode(email, code);
          emailSent = true;
          logger.info(`Verification email sent to ${email} via Tencent SES API`);
        } catch (sesError) {
          logger.warn(`SES API failed for ${email}: ${sesError.message}, trying SMTP fallback...`);
        }
      }

      // 方式2: SMTP (nodemailer) 回退
      if (!emailSent) {
        const smtpPass = process.env.SMTP_PASS || '';
        const smtpUser = process.env.SMTP_USER || '';
        const isSmtpConfigured = smtpPass && !smtpPass.includes('请填入') && smtpUser;
        
        if (isSmtpConfigured) {
          try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.qcloudmail.com',
              port: parseInt(process.env.SMTP_PORT || '465'),
              secure: true,
              auth: {
                user: smtpUser,
                pass: smtpPass,
              },
            });

            await transporter.sendMail({
              from: `"言道外语" <${smtpUser}>`,
              to: email,
              subject: '【言道外语】您的验证码',
              text: `【言道科技】您的验证码是：${code}，有效期5分钟。请勿泄露给他人。`,
              html: `<div style="padding:20px;font-family:sans-serif;max-width:480px;margin:0 auto;"><h2 style="color:#4F46E5;">言道外语 AILOS</h2><p>您好！</p><p>您的验证码是：</p><h1 style="color:#4F46E5;font-size:36px;letter-spacing:6px;text-align:center;padding:16px 0;">${code}</h1><p style="color:#666;">有效期5分钟。请勿泄露给他人。</p><p style="color:#999;font-size:12px;margin-top:20px;">如非本人操作，请忽略此邮件。</p></div>`,
            });
            emailSent = true;
            logger.info(`Verification email sent to ${email} via SMTP`);
          } catch (smtpError) {
            logger.error(`SMTP send failed for ${email}: ${smtpError.message}`);
          }
        } else {
          logger.warn(`SMTP not configured (placeholder password), skipping SMTP fallback for ${email}`);
        }
      }

      if (!emailSent && config.env === 'production') {
        logger.warn(`All email sending methods failed, code for ${email}: ${code}`);
      }

      if (config.env !== 'production') {
        logger.info(`Email Code for ${email} (type: ${type}): ${code}`);
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

        // 安全修复：按验证码类型过滤，防止跨类型验证码被滥用
        // 手机注册码 type='register'，邮箱注册码 type='register_email'
        const expectedType = phone ? 'register' : 'register_email';
        const verification = await prisma.smsVerification.findFirst({
          where: {
            phone: identifier,
            code,
            type: expectedType,
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

  // Reset password with verification code
  async resetPassword(identifier, newPassword, code, method = 'phone') {
    try {
      // 安全修复：按验证码类型过滤，防止跨类型验证码被滥用（如登录码重置密码）
      const expectedType = method === 'email' ? 'reset_email' : 'reset';
      const verification = await prisma.smsVerification.findFirst({
        where: {
          phone: identifier,
          code,
          type: expectedType,
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

      // Find user by phone or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: identifier },
            { email: identifier },
          ],
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update password
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      logger.info(`Password reset successful for user ${user.id} (${identifier})`);
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      logger.error('Reset password failed:', error);
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
        avatar: avatar || DEFAULT_AVATAR,
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

    // 初始化免费额度（通过 aiQuotaService 管理）
    // 使用每日统计表记录额度使用情况，首次注册不创建记录，由 aiQuotaService 自动按需创建
    logger.info(`Quota tracking available for user ${user.id} via aiQuotaService`);

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
    const { passwordHash: _ph, ...sanitized } = user;
    return sanitized;
  }

  async getWechatUserInfo(_code) {
    return {
      openid: 'mock_wechat_openid_' + generateRandomString(8),
      unionid: 'mock_wechat_unionid_' + generateRandomString(8),
      nickname: 'WeChat User',
      headimgurl: 'https://example.com/avatar.jpg',
    };
  }
}

module.exports = new AuthService();