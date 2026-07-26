const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-code', authController.sendSmsCode);
router.post('/send-email-code', authController.sendEmailCode);
router.post('/phone', authController.phoneAuth);
router.post('/password', authController.passwordAuth);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/wechat', authController.wechatAuth);

// BUG-019: 游客模式路由（之前遗漏，导致前端 /api/auth/guest 404）
router.post('/guest', authController.createGuest);
router.put('/guest/:guestId/progress', authController.updateGuestProgress);
router.post('/guest/:guestId/convert', authController.convertGuest);

module.exports = router;