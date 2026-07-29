// ============================================================
// src/server/routes/org/auth.js
// Phase 4 P2: 机构端认证路由
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const orgAuthService = require('../../../services/orgAuthService');
const logger = require('../../../utils/logger');

// POST /api/org/auth/login — 机构管理员/老师登录
router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({
        success: false,
        error: 'Account and password are required',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await orgAuthService.login(account, password, deviceInfo);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    logger.error('[org/auth] 登录失败:', error.message);
    return res.status(status).json({
      success: false,
      error: error.message || 'Login failed',
      code: error.code || 'LOGIN_ERROR',
    });
  }
});

// GET /api/org/auth/me — 获取当前用户机构上下文
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.isGuest || !req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const orgContext = await orgAuthService.getOrgContext(req.userId);

    return res.json({
      success: true,
      data: {
        userId: req.userId,
        user: req.user ? {
          id: req.user.id,
          phone: req.user.phone,
          email: req.user.email,
          nickname: req.user.nickname,
          avatar: req.user.avatar,
        } : null,
        orgContext,
      },
    });
  } catch (error) {
    logger.error('[org/auth] me 失败:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to get org context',
      code: 'ORG_CONTEXT_ERROR',
    });
  }
});

// POST /api/org/auth/switch — 切换活跃机构
router.post('/switch', authenticate, async (req, res) => {
  try {
    if (req.isGuest || !req.userId) {
      return res.status(401).json({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const { orgId } = req.body;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'orgId is required', code: 'ORG_ID_REQUIRED' });
    }

    const result = await orgAuthService.switchOrg(req.userId, orgId);

    return res.json({ success: true, data: result });
  } catch (error) {
    const status = error.status || 500;
    logger.error('[org/auth] switch 失败:', error.message);
    return res.status(status).json({ success: false, error: error.message, code: error.code || 'SWITCH_ERROR' });
  }
});

module.exports = router;
