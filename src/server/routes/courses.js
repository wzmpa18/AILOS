// ============================================================
// src/server/routes/courses.js
// 学习内容路由
// ============================================================
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开接口（可选认证）
router.get('/languages', optionalAuth, courseController.getLanguages);
router.get('/overview', authenticate, courseController.getOverview);

// 需要认证
router.get('/', authenticate, courseController.getCourses);
router.get('/:courseId', authenticate, courseController.getCourse);
router.get('/:courseId/progress', authenticate, courseController.getProgress);
router.get('/units/:unitId', authenticate, courseController.getUnit);
router.get('/items/:itemId', authenticate, courseController.getItem);
router.post('/items/:itemId/progress', authenticate, courseController.updateProgress);

module.exports = router;