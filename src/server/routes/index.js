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

// Content (Module 02 Step 1 — 学习内容体系)
router.use('/content', require('./content'));

module.exports = router;