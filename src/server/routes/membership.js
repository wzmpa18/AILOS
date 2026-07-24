// ============================================================
// src/server/routes/membership.js
// ============================================================
const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate } = require('../middleware/auth');

router.get('/plans', authenticate, membershipController.getPlans);
router.get('/', authenticate, membershipController.getMembership);
router.post('/upgrade', authenticate, membershipController.upgrade);
router.get('/transactions', authenticate, membershipController.getTransactions);

module.exports = router;