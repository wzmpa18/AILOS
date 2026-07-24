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

// Module 03 Step 4 — AI 导师对话（接通混元）
router.post('/chat', aiTutorController.chat);

module.exports = router;