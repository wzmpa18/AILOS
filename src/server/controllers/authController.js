const authService = require('../../services/authService');
const logger = require('../../utils/logger');

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
      const { account, password } = req.body;
      const deviceInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };
      const result = await authService.passwordAuth(account, password, deviceInfo);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // Register with password (with SMS/email verification)
  async register(req, res, next) {
    try {
      const { phone, email, password, code, nickname, uiLanguage, browserLanguage } = req.body;

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
        phone, email, password, code, nickname,
        { uiLanguage, browserLanguage, ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      );
      res.json({ success: true, ...result });
    } catch (error) {
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