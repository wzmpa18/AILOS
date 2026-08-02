// ============================================================
// src/services/orgAuthService.js
// Phase 4 P2: 机构端认证服务（零侵入 C 端 authService，纯增量）
// ============================================================
const prisma = require('../config/database');
const { generateTokens } = require('../utils/jwt');
const { comparePassword } = require('../utils/crypto');
const { checkRateLimit } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

class OrgAuthService {
  /**
   * 机构管理员/老师登录
   * @param {string} account - 手机号/邮箱
   * @param {string} password - 密码
   * @param {object} deviceInfo - { ipAddress, userAgent, deviceId }
   * @returns {{ user, tokens, orgContext }}
   */
  async login(account, password, deviceInfo = {}) {
    try {
      // 限流
      const rateLimit = await checkRateLimit(account, 'org_login', 10, 900);
      if (!rateLimit.allowed) {
        throw { status: 429, message: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' };
      }

      // 查找用户
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: account },
            { email: account },
          ],
        },
      });

      if (!user || !user.passwordHash) {
        throw { status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
      }

      if (!user.isActive) {
        throw { status: 403, message: 'Account is disabled', code: 'ACCOUNT_DISABLED' };
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw { status: 423, message: 'Account is temporarily locked', code: 'ACCOUNT_LOCKED' };
      }

      // 验证密码
      const isValid = await comparePassword(password, user.passwordHash);
      if (!isValid) {
        const failedAttempts = user.failedLoginAttempts + 1;
        const updateData = { failedLoginAttempts: failedAttempts };
        if (failedAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        await prisma.user.update({ where: { id: user.id }, data: updateData });
        throw { status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
      }

      // 查找机构成员身份（admin 或 teacher）
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId: user.id,
          status: 'active',
          role: { in: ['admin', 'teacher'] },
          organization: { status: 'active' },
        },
        include: { organization: true },
        orderBy: { joinedAt: 'desc' },
      });

      if (memberships.length === 0) {
        throw { status: 403, message: 'No organization access. This login is for institution staff only.', code: 'NO_ORG_ACCESS' };
      }

      // 更新登录状态
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: deviceInfo.ipAddress,
        },
      });

      // 生成 token（注入 org 上下文）
      const primaryMembership = memberships[0];
      const tokens = generateTokens({
        userId: user.id,
        uniqueId: user.uniqueId,
        orgId: primaryMembership.organizationId,
        orgRole: primaryMembership.role,
      });

      // 创建 session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          deviceInfo: deviceInfo.userAgent || 'unknown',
          ipAddress: deviceInfo.ipAddress || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      logger.info(`[orgAuth] 机构登录成功: userId=${user.id}, orgId=${primaryMembership.organizationId}, role=${primaryMembership.role}`);

      return {
        user: this._sanitizeUser(user),
        tokens,
        orgContext: memberships.map((m) => ({
          orgId: m.organizationId,
          orgName: m.organization.name,
          orgLogo: m.organization.logoUrl,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      };
    } catch (error) {
      if (error.status) throw error;
      logger.error('[orgAuth] 登录失败:', error.message);
      throw { status: 500, message: 'Login failed', code: 'LOGIN_ERROR' };
    }
  }

  /**
   * 获取当前用户的机构上下文
   */
  async getOrgContext(userId) {
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        status: 'active',
        organization: { status: 'active' },
      },
      include: { organization: true },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      orgId: m.organizationId,
      orgName: m.organization.name,
      orgLogo: m.organization.logoUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * 切换当前活跃机构
   */
  async switchOrg(userId, targetOrgId) {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId: targetOrgId,
        status: 'active',
        organization: { status: 'active' },
        role: { in: ['admin', 'teacher'] },
      },
      include: { organization: true },
    });

    if (!membership) {
      throw { status: 403, message: 'No access to this organization', code: 'ORG_ACCESS_DENIED' };
    }

    const tokens = generateTokens({
      userId,
      orgId: membership.organizationId,
      orgRole: membership.role,
    });

    return {
      tokens,
      orgContext: {
        orgId: membership.organizationId,
        orgName: membership.organization.name,
        role: membership.role,
      },
    };
  }

  _sanitizeUser(user) {
    return {
      id: user.id,
      uniqueId: user.uniqueId,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar || '/assets/images/default_avatar.png',
      membershipLevel: user.membershipLevel,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}

module.exports = new OrgAuthService();
