// ============================================================
// src/server/controllers/aiController.js
// AI 对话控制器 — 对话/翻译/纠错/练习/额度
// ============================================================
const aiService = require('../../services/aiService');
const logger = require('../../utils/logger');

const aiController = {
  // POST /api/ai/chat
  async chat(req, res, next) {
    try {
      const userId = req.userId;
      const { message, conversationId, language, level } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const result = await aiService.chat(userId, message, {
        conversationId: conversationId || null,
        language,
        level,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('limit reached')) {
        return res.status(429).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // POST /api/ai/translate
  async translate(req, res, next) {
    try {
      const userId = req.userId;
      const { text, sourceLang, targetLang } = req.body;

      if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ success: false, error: 'text, sourceLang, and targetLang are required' });
      }

      const result = await aiService.translate(userId, text, sourceLang, targetLang);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('limit reached')) {
        return res.status(429).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // POST /api/ai/correct
  async correct(req, res, next) {
    try {
      const userId = req.userId;
      const { text, language } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Text is required' });
      }

      const result = await aiService.correct(userId, text, language || 'auto');
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('limit reached')) {
        return res.status(429).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // POST /api/ai/exercise
  async generateExercise(req, res, next) {
    try {
      const userId = req.userId;
      const { topic, language, level, exerciseType } = req.body;

      if (!topic || !language || !level || !exerciseType) {
        return res.status(400).json({ success: false, error: 'topic, language, level, and exerciseType are required' });
      }

      const result = await aiService.generateExercise(userId, topic, language, level, exerciseType);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('limit reached')) {
        return res.status(429).json({ success: false, error: error.message });
      }
      next(error);
    }
  },

  // GET /api/ai/conversations
  async getConversations(req, res, next) {
    try {
      const userId = req.userId;
      const conversations = await aiService.getConversations(userId);
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/ai/conversations/:id
  async getConversation(req, res, next) {
    try {
      const userId = req.userId;
      const conversationId = parseInt(req.params.id, 10);
      const conversation = await aiService.getConversation(userId, conversationId);
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/ai/conversations/:id
  async deleteConversation(req, res, next) {
    try {
      const userId = req.userId;
      const conversationId = parseInt(req.params.id, 10);
      const result = await aiService.deleteConversation(userId, conversationId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/ai/quota
  async getQuota(req, res, next) {
    try {
      const userId = req.userId;
      const quota = await aiService.getQuota(userId);
      res.json({ success: true, data: quota });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = aiController;