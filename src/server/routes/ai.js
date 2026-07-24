// ============================================================
// src/server/routes/ai.js
// AI 对话路由
// ============================================================
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// 对话
router.post('/chat', authenticate, aiController.chat);

// 翻译
router.post('/translate', authenticate, aiController.translate);

// 纠错
router.post('/correct', authenticate, aiController.correct);

// 生成练习
router.post('/exercise', authenticate, aiController.generateExercise);

// 对话历史
router.get('/conversations', authenticate, aiController.getConversations);
router.get('/conversations/:id', authenticate, aiController.getConversation);
router.delete('/conversations/:id', authenticate, aiController.deleteConversation);

// 额度查询
router.get('/quota', authenticate, aiController.getQuota);

module.exports = router;