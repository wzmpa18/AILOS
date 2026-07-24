// ============================================================
// src/server/routes/aiTutor.js
// AI 导师对话路由 — Module 02 Step 4
// ============================================================
const express = require('express');
const router = express.Router();
const aiTutorController = require('../controllers/aiTutorController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dialogue', aiTutorController.getDialogue);
router.post('/dialogue', aiTutorController.saveDialogue);

module.exports = router;