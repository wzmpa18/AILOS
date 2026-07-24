// ============================================================
// src/server/controllers/aiTutorController.js
// AI 导师对话控制器 — Module 02 Step 4
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
};

module.exports = aiTutorController;