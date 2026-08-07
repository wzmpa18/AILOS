/**
 * src/server/routes/practice.js
 * AI 自适应句型练习系统路由
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const practiceController = require('../controllers/practiceController');

// 练习配置
router.get('/config', authenticate, (req, res, next) => practiceController.getConfig(req, res, next));
router.post('/config', authenticate, (req, res, next) => practiceController.updateConfig(req, res, next));

// 打卡状态
router.get('/streak', authenticate, (req, res, next) => practiceController.getStreak(req, res, next));

// AI 生成句型
router.get('/sentences', authenticate, (req, res, next) => practiceController.generateSentences(req, res, next));

// 提交练习结果
router.post('/submit', authenticate, (req, res, next) => practiceController.submitResult(req, res, next));

// 练习报告
router.get('/report', authenticate, (req, res, next) => practiceController.getReport(req, res, next));

// 错题复习
router.get('/review-questions', authenticate, (req, res, next) => practiceController.getReviewQuestions(req, res, next));
router.post('/review-submit', authenticate, (req, res, next) => practiceController.submitReview(req, res, next));

module.exports = router;
