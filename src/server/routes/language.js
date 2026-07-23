const express = require('express');
const router = express.Router();
const languageController = require('../controllers/languageController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, languageController.getLanguages);
router.put('/', authenticate, languageController.updateLanguages);

module.exports = router;