// ============================================================
// src/server/routes/user.js
// Stage 9 P0 Fix: 用户进度查询 + 个人信息路由 + 个人资料更新
// BUG-016/BUG-017: 补齐 GET /user/me 别名 + PUT /user/profile 昵称/语言/头像保存
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

// GET /api/user/progress/:lang — 学习进度分层数据
router.get('/progress/:lang', authenticate, userController.getProgress);
router.post('/progress', authenticate, userController.saveProgress);

// GET /api/user/profile — 用户基本信息
router.get('/profile', authenticate, userController.getProfile);

// GET /api/user/me — 别名（前端 profile.html 调用此路径）
router.get('/me', authenticate, userController.getProfile);

// PUT /api/user/profile — 更新个人资料（昵称/头像/语言/密码）
router.put('/profile', authenticate, userController.updateProfile);

// DELETE /api/user/me — 删除账号
router.delete('/me', authenticate, userController.deleteAccount);

module.exports = router;