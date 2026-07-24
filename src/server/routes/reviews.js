// ============================================================
// src/server/routes/reviews.js
// SRS 复习路由 — Module 02 Step 3
// ============================================================
const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/due', reviewsController.getDueReviews);
router.get('/due-count', reviewsController.getDueCount);
router.get('/stats', reviewsController.getStats);
router.post('/:id/submit', reviewsController.submitReview);

module.exports = router;