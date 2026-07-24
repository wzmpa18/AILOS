const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, checkinController.getCheckinStatus);
router.get('/status', authenticate, checkinController.getCheckinStatus); // SUP-04: /status 别名
router.post('/', authenticate, checkinController.doCheckin);

module.exports = router;