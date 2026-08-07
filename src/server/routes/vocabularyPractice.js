/**
 * src/server/routes/vocabularyPractice.js
 * 挂载于 /api/v1/practice
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/vocabularyController');

router.get('/questions', authenticate, ctrl.getQuestions);
router.post('/submit', authenticate, ctrl.submitAnswer);
router.get('/progress', authenticate, ctrl.getProgress);

module.exports = router;
