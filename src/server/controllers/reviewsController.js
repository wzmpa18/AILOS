// ============================================================
// src/server/controllers/reviewsController.js
// SRS 复习控制器 — Module 02 Step 3
// ============================================================
const reviewsService = require('../../services/reviewsService');

const reviewsController = {
  // GET /api/reviews/due
  async getDueReviews(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const reviews = await reviewsService.getDueReviews(req.userId, limit);
      res.json({ success: true, data: reviews, count: reviews.length });
    } catch (error) { next(error); }
  },

  // GET /api/reviews/due-count
  async getDueCount(req, res, next) {
    try {
      const result = await reviewsService.getDueCount(req.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // POST /api/reviews/:id/submit
  async submitReview(req, res, next) {
    try {
      const { id } = req.params;
      const { quality, elapsedMs } = req.body;
      if (quality === undefined || quality < 0 || quality > 5) {
        return res.status(400).json({ success: false, error: 'quality must be 0-5' });
      }
      const result = await reviewsService.submitReview(req.userId, id, quality, elapsedMs);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },

  // GET /api/reviews/stats
  async getStats(req, res, next) {
    try {
      const stats = await reviewsService.getStats(req.userId);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  },
};

module.exports = reviewsController;