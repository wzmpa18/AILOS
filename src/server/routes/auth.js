const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-code', authController.sendCode);
router.post('/phone', authController.phoneLogin);
router.post('/password', authController.passwordLogin);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/wechat', authController.wechatLogin);

module.exports = router;