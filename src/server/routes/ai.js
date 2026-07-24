const express = require('express');
const router = express.Router();
const { chat, translate, grammarCheck, generateExercise, getStats, getQuota } = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const aiQuotaMiddleware = require('../middleware/aiQuotaMiddleware');

// POST /api/ai/chat - AI dialogue
router.post('/chat', authenticate, aiQuotaMiddleware, chat);

// POST /api/ai/translate - AI translation
router.post('/translate', authenticate, aiQuotaMiddleware, translate);

// POST /api/ai/grammar-check - AI grammar check
router.post('/grammar-check', authenticate, aiQuotaMiddleware, grammarCheck);

// POST /api/ai/generate-exercise - AI exercise generation
router.post('/generate-exercise', authenticate, aiQuotaMiddleware, generateExercise);

// GET /api/ai/stats - AI usage statistics
router.get('/stats', authenticate, getStats);

// GET /api/ai/quota - AI quota information
router.get('/quota', authenticate, getQuota);

module.exports = router;