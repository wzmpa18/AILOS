const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard
router.use('/api/dashboard', require('./dashboard'));

// Checkin
router.use('/api/checkin', require('./checkin'));

// Auth
router.use('/api/auth', require('./auth'));

// Language
router.use('/api/language', require('./language'));

module.exports = router;