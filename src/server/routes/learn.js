/**
 * src/server/routes/learn.js
 * 学习内容 API 路由
 *
 * GET /api/learn/content?language=&type=&level=  — 获取学习内容（资产优先，无则AI生成）
 * GET /api/learn/config                          — 获取学习配置
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const learnController = require('../controllers/learnController');

// 学习内容路由（游客和登录用户均可访问）
router.use(authenticate);

// GET /api/learn/content?language=en&type=vocab&level=beginner
router.get('/content', learnController.getContent);

// GET /api/learn/content/:type/:language/:level  (兼容路径参数格式)
router.get('/content/:type/:language/:level', (req, res, next) => learnController.getContentByPath(req, res, next));

// GET /api/learn/config
router.get('/config', learnController.getLearnConfig);

module.exports = router;