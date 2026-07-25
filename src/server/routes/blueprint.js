/**
 * src/server/routes/blueprint.js
 * Blueprint 路由 — QuestionBlueprint / CourseBlueprint API
 *
 * GET /api/blueprint/question?language=&type=&level=&count=  — AI 生成试题
 * GET /api/blueprint/course?language=&level=                  — AI 生成课程
 * GET /api/blueprint/config                                   — 获取 Blueprint 配置
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const blueprintController = require('../controllers/blueprintController');

// 所有 Blueprint 路由需要认证（游客可访问但降级）
router.use(authenticate);

// GET /api/blueprint/question?language=en&type=vocab&level=beginner&count=10
router.get('/question', blueprintController.generateQuestions);

// GET /api/blueprint/course?language=en&level=beginner
router.get('/course', blueprintController.generateCourse);

// GET /api/blueprint/config
router.get('/config', blueprintController.getBlueprintConfig);

module.exports = router;