const express = require('express');
const router = express.Router();
const { chat, getStats, getQuota } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// POST /api/ai/chat - AI dialogue
router.post('/chat', authenticate, chat);

// GET /api/ai/stats - AI usage statistics
router.get('/stats', authenticate, getStats);

// GET /api/ai/quota - AI quota information
router.get('/quota', authenticate, getQuota);

module.exports = router;