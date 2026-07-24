// ============================================================
// src/server/routes/srs.js
// SRS 间隔重复路由
// ============================================================
const express = require('express');
const router = express.Router();
const srsController = require('../controllers/srsController');
const { authenticate } = require('../middleware/auth');

// 统计
router.get('/stats', authenticate, srsController.getStats);
router.get('/due-count', authenticate, srsController.getDueCount);

// 牌组
router.get('/decks', authenticate, srsController.getDecks);
router.post('/decks', authenticate, srsController.createDeck);
router.get('/decks/:id', authenticate, srsController.getDeck);
router.delete('/decks/:id', authenticate, srsController.deleteDeck);

// 卡片
router.post('/decks/:id/cards', authenticate, srsController.addCard);
router.post('/decks/:id/cards/batch', authenticate, srsController.addCardsBatch);
router.delete('/cards/:id', authenticate, srsController.deleteCard);

// 复习
router.get('/decks/:id/review', authenticate, srsController.getDueCards);
router.post('/cards/:id/review', authenticate, srsController.reviewCard);

module.exports = router;