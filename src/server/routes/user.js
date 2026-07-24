// ============================================================
// src/server/routes/user.js
// BUG-016: 用户进度查询 + 个人信息路由
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

// GET /api/user/progress/:lang — 学习进度分层数据
router.get('/progress/:lang', authenticate, userController.getProgress);

// GET /api/user/profile — 用户基本信息
router.get('/profile', authenticate, userController.getProfile);

module.exports = router;