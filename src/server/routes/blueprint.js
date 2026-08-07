/**
 * src/server/routes/blueprint.js
 * Blueprint 路由 — QuestionBlueprint / CourseBlueprint API
 *
 * GET /api/blueprint/question?language=&type=&level=&count=  — AI 生成试题 (需登录)
 * GET /api/blueprint/course?language=&level=                  — AI 生成课程 (需登录)
 * GET /api/blueprint/config                                   — 获取 Blueprint 配置 (需登录)
 * GET /api/blueprint/questions?language=&level=&count=        — P3: 从预生成题库取题（公开，无需登录）
 */
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const blueprintController = require('../controllers/blueprintController');

// ==================== P3: 预生成题库取题（无需登录，placement.html 游客可见） ====================
// GET /api/blueprint/questions?language=ja&level=beginner&count=6
// 从 PlacementQuestionBank 表取题，毫秒级响应（无AI调用延迟）
// 修复：之前挂在 router.use(authenticate) 下，导致游客访问 401
router.get('/questions', optionalAuth, blueprintController.getPlacementQuestions);

// ==================== 以下路由需要登录 ====================
router.use(optionalAuth);

// GET /api/blueprint/question?language=en&type=vocab&level=beginner&count=10
router.get('/question', blueprintController.generateQuestions);

// GET /api/blueprint/course?language=en&level=beginner
router.get('/course', blueprintController.generateCourse);

// GET /api/blueprint/config
router.get('/config', blueprintController.getBlueprintConfig);

module.exports = router;