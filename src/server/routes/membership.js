const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate, requireMembership } = require('../middleware/auth');

// Public routes
router.get('/plans', membershipController.getPlans);

// Protected routes
router.use(authenticate);

router.get('/status', membershipController.getStatus);
router.get('/premium-check', membershipController.checkPremiumAccess);
router.post('/order', membershipController.createOrder);
router.post('/payment/callback', membershipController.processPayment);

module.exports = router;
