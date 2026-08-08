const authService = require('../../services/authService');
const authController = {
  // Send SMS code
  async sendSmsCode(req, res, next) {
    try {
      const { phone, type } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone is required' });
      }
      const result = await authService.sendSmsCode(phone, type || 'login');
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Send email verification code
  async sendEmailCode(req, res, next) {
    try {
      const { email, type } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }
      const result = await authService.sendEmailCode(email, type || 'login');
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Phone authentication
  async phoneAuth(req, res, next) {
    try {
      const { phone, code } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone is required' });
      }
      if (!code) {
        return res.status(400).json({ success: false, error: 'Verification code is required' });
      }
      const deviceInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.phoneAuth(phone, code, deviceInfo);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // WeChat authentication
  async wechatAuth(req, res, next) {
    try {
      const { wechatCode } = req.body;
      const deviceInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.wechatAuth(wechatCode, deviceInfo);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Password authentication
  async passwordAuth(req, res, next) {
    try {
      // SUP-03 fix: 兼容 account / phone / email 三种入参格式
      const { account, phone, email, password } = req.body;
      const loginAccount = account || phone || email;
      if (!loginAccount) {
        return res.status(400).json({ success: false, error: 'Account (phone or email) is required' });
      }
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required' });
      }
      const deviceInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.passwordAuth(loginAccount, password, deviceInfo);
      res.json({ success: true, ...result });
    } catch (error) {
      // SUP-03 fix: 无效凭证返回 401（非 500）
      if (['Invalid credentials', 'User not found', 'ACCOUNT_DISABLED'].includes(error.message)) {
        return res.status(401).json({
          success: false,
          error: error.message === 'ACCOUNT_DISABLED' ? '账号已被禁用，无法登录' : error.message,
        });
      }
      // 未设置密码的旧账号，返回 400 并给出明确提示
      if (error.message.includes('尚未设置密码')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      // 账号锁定返回 429
      if (error.message.includes('locked') || error.message.includes('Too many')) {
        return res.status(429).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // Register with password (with SMS/email verification)
  async register(req, res, next) {
    try {
      const { phone, email, password, code, nickname, username, uiLanguage, browserLanguage } = req.body;

      // 必填字段校验
      if (!phone && !email) {
        return res.status(400).json({ success: false, error: 'Phone or email is required' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
      if (!code) {
        return res.status(400).json({ success: false, error: 'Verification code is required' });
      }

      const result = await authService.registerWithPassword(
        phone, email, password, code, nickname || username,
        { uiLanguage, browserLanguage, ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json({ success: true, ...result });
    } catch (error) {
      // 用户已存在返回 409
      if (error.message === 'User already exists') {
        return res.status(409).json({ success: false, error: '该手机号/邮箱已注册，请直接登录' });
      }
      // 验证码错误返回 400
      if (error.message === 'Invalid or expired verification code') {
        return res.status(400).json({ success: false, error: '验证码无效或已过期，请重新获取' });
      }
      next(error);
    }
  },

  // Reset password with verification code
  async resetPassword(req, res, next) {
    try {
      const { phone, email, code, newPassword, method } = req.body;
      const identifier = phone || email;
      
      if (!identifier) {
        return res.status(400).json({ success: false, error: 'Phone or email is required' });
      }
      if (!code) {
        return res.status(400).json({ success: false, error: 'Verification code is required' });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }

      const result = await authService.resetPassword(identifier, newPassword, code, method || 'phone');
      res.json({ success: true, ...result });
    } catch (error) {
      if (['Invalid or expired verification code', 'User not found'].includes(error.message)) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // Logout
  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await authService.logout(req.userId, token);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Create guest session (returns guestId + JWT token + expiresIn)
  async createGuest(req, res, next) {
    try {
      const { deviceId } = req.body;
      const result = await authService.createGuestSession(deviceId || 'web_' + Date.now());
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Update guest progress
  async updateGuestProgress(req, res, next) {
    try {
      const { guestId } = req.params;
      const { progress } = req.body;
      const result = await authService.updateGuestProgress(guestId, progress);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Convert guest to user
  async convertGuest(req, res, next) {
    try {
      const { guestId } = req.params;
      const result = await authService.convertGuestToUser(guestId, req.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;