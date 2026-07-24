// ============================================================
// src/server/routes/stamina.js
// ============================================================
const express = require('express');
const router = express.Router();
const staminaController = require('../controllers/staminaController');
const { authenticate } = require('../middleware/auth');

router.get('/config', authenticate, staminaController.getConfig);
router.get('/', authenticate, staminaController.getStamina);
router.get('/transactions', authenticate, staminaController.getTransactions);

module.exports = router;