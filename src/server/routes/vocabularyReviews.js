/**
 * src/server/routes/vocabularyReviews.js
 * 挂载于 /api/v1/reviews —— 错题本与复习闭环
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/vocabularyController');

router.get('/wrong-questions', authenticate, ctrl.listWrongQuestions);
router.delete('/wrong-questions/:id', authenticate, ctrl.deleteWrongQuestion);
router.delete('/wrong-questions', authenticate, ctrl.clearWrongQuestions);
router.post('/practice', authenticate, ctrl.buildReviewPractice);
router.post('/wrong-questions/merge-guest', authenticate, ctrl.mergeGuestWrongQuestions);

module.exports = router;
