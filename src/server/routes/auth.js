const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, smsLimiter } = require('../middleware/rateLimit');

router.post('/send-code', smsLimiter, authController.sendSmsCode);
router.post('/send-email-code', smsLimiter, authController.sendEmailCode);
router.post('/phone', loginLimiter, authController.phoneAuth);
router.post('/password', loginLimiter, authController.passwordAuth);
router.post('/login', loginLimiter, authController.passwordAuth); // Alias: frontend uses /login, actual endpoint is /password
router.post('/register', registerLimiter, authController.register);
router.post('/reset-password', loginLimiter, authController.resetPassword);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/wechat', authController.wechatAuth);

// GET /api/auth/check-exists - 注册查重接口（公开，无需登录）
router.get('/check-exists', authController.checkExists);

// BUG-019: 游客模式路由（之前遗漏，导致前端 /api/auth/guest 404）
router.post('/guest', authController.createGuest);
router.put('/guest/:guestId/progress', authController.updateGuestProgress);
router.post('/guest/:guestId/convert', authController.convertGuest);

module.exports = router;