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

// Courses
router.use('/courses', require('./courses'));

// AI
router.use('/ai', require('./ai'));

// SRS
router.use('/srs', require('./srs'));

// Reports
router.use('/reports', require('./reports'));

// Membership
router.use('/membership', require('./membership'));

// Stamina
router.use('/stamina', require('./stamina'));

// Invite
router.use('/invite', require('./invite'));

module.exports = router;