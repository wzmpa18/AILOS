const express = require('express');
const router = express.Router();
const { chat, translate, grammarCheck, generateExercise, getStats, getQuota } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// POST /api/ai/chat - AI dialogue
router.post('/chat', authenticate, chat);

// POST /api/ai/translate - AI translation
router.post('/translate', authenticate, translate);

// POST /api/ai/grammar-check - AI grammar check
router.post('/grammar-check', authenticate, grammarCheck);

// POST /api/ai/generate-exercise - AI exercise generation
router.post('/generate-exercise', authenticate, generateExercise);

// GET /api/ai/stats - AI usage statistics
router.get('/stats', authenticate, getStats);

// GET /api/ai/quota - AI quota information
router.get('/quota', authenticate, getQuota);

module.exports = router;