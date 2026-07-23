const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, checkinController.getCheckinStatus);
router.post('/', authenticate, checkinController.doCheckin);

module.exports = router;