const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const learningContentController = require('../controllers/learningContentController');

// All content routes require authentication
router.use(authenticate);

router.get('/', learningContentController.getContent);
router.get('/summary', learningContentController.getSummary);
router.get('/:id', learningContentController.getContentById);

module.exports = router;