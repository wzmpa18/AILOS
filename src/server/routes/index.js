const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard
router.use('/dashboard', require('./dashboard'));

// Checkin
router.use('/checkin', require('./checkin'));

// Auth
router.use('/auth', require('./auth'));

// Language
router.use('/language', require('./language'));

module.exports = router;