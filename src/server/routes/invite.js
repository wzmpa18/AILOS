// ============================================================
// src/server/routes/invite.js
// ============================================================
const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { authenticate } = require('../middleware/auth');

router.get('/config', authenticate, inviteController.getConfig);
router.get('/code', authenticate, inviteController.getInviteCode);
router.post('/apply', authenticate, inviteController.applyInviteCode);
router.get('/stats', authenticate, inviteController.getInviteStats);
router.get('/commissions', authenticate, inviteController.getCommissions);

module.exports = router;