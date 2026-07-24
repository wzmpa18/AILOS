// ============================================================
// src/server/controllers/aiTutorController.js
// Module 03 Step 4 — AI 导师对话控制器
// ============================================================
const aiTutorService = require('../../services/aiTutorService');

const aiTutorController = {
  // GET /api/ai/tutor/dialogue?goalId=
  async getDialogue(req, res, next) {
    try {
      const { goalId } = req.query;
      const limit = parseInt(req.query.limit) || 50;
      const dialogue = await aiTutorService.getDialogue(req.userId, goalId, limit);
      res.json({ success: true, data: dialogue });
    } catch (error) { next(error); }
  },

  // POST /api/ai/tutor/dialogue
  async saveDialogue(req, res, next) {
    try {
      const { role, content, goalId, tokensUsed } = req.body;
      const record = await aiTutorService.saveDialogue(req.userId, {
        role, content, goalId, tokensUsed,
      });
      res.status(201).json({ success: true, data: record });
    } catch (error) { next(error); }
  },

  // POST /api/ai/tutor/chat (Module 03 Step 4)
  async chat(req, res, next) {
    try {
      const { message, goalId, languageContext } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }
      const result = await aiTutorService.chat(req.userId, message, {
        goalId,
        languageContext,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  },
};

module.exports = aiTutorController;