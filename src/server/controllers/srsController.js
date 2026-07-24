// ============================================================
// src/server/controllers/srsController.js
// SRS 间隔重复控制器
// ============================================================
const srsService = require('../../services/srsService');

const srsController = {
  // GET /api/srs/decks
  async getDecks(req, res, next) {
    try {
      const decks = await srsService.getDecks(req.userId);
      res.json({ success: true, data: decks });
    } catch (error) { next(error); }
  },

  // GET /api/srs/decks/:id
  async getDeck(req, res, next) {
    try {
      const deck = await srsService.getDeck(req.userId, parseInt(req.params.id));
      res.json({ success: true, data: deck });
    } catch (error) { next(error); }
  },

  // POST /api/srs/decks
  async createDeck(req, res, next) {
    try {
      const { title, language, description } = req.body;
      if (!title || !language) {
        return res.status(400).json({ success: false, error: 'title and language are required' });
      }
      const deck = await srsService.createDeck(req.userId, { title, language, description });
      res.status(201).json({ success: true, data: deck });
    } catch (error) { next(error); }
  },

  // DELETE /api/srs/decks/:id
  async deleteDeck(req, res, next) {
    try {
      const result = await srsService.deleteDeck(req.userId, parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // POST /api/srs/decks/:id/cards
  async addCard(req, res, next) {
    try {
      const deckId = parseInt(req.params.id);
      const { front, back, notes } = req.body;
      if (!front || !back) {
        return res.status(400).json({ success: false, error: 'front and back are required' });
      }
      const card = await srsService.addCard(req.userId, deckId, { front, back, notes });
      res.status(201).json({ success: true, data: card });
    } catch (error) { next(error); }
  },

  // POST /api/srs/decks/:id/cards/batch
  async addCardsBatch(req, res, next) {
    try {
      const deckId = parseInt(req.params.id);
      const { cards } = req.body;
      if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ success: false, error: 'cards array is required' });
      }
      const result = await srsService.addCardsBatch(req.userId, deckId, cards);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // DELETE /api/srs/cards/:id
  async deleteCard(req, res, next) {
    try {
      const result = await srsService.deleteCard(req.userId, parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // GET /api/srs/decks/:id/review
  async getDueCards(req, res, next) {
    try {
      const deckId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 20;
      const cards = await srsService.getDueCards(req.userId, deckId, limit);
      res.json({ success: true, data: cards, count: cards.length });
    } catch (error) { next(error); }
  },

  // GET /api/srs/due-count
  async getDueCount(req, res, next) {
    try {
      const result = await srsService.getDueCount(req.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // POST /api/srs/cards/:id/review
  async reviewCard(req, res, next) {
    try {
      const cardId = parseInt(req.params.id);
      const { quality, elapsedMs } = req.body;
      if (quality === undefined || quality < 0 || quality > 5) {
        return res.status(400).json({ success: false, error: 'quality must be 0-5' });
      }
      const result = await srsService.reviewCard(req.userId, cardId, quality, elapsedMs);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // GET /api/srs/stats
  async getStats(req, res, next) {
    try {
      const stats = await srsService.getStats(req.userId);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  },
};

module.exports = srsController;