const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-code', authController.sendSmsCode);
router.post('/phone', authController.phoneAuth);
router.post('/password', authController.passwordAuth);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/wechat', authController.wechatAuth);

module.exports = router;