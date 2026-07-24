const learningContentService = require('../../services/learningContentService');
const logger = require('../../utils/logger');

const learningContentController = {
  /**
   * GET /api/content
   * Query params: type, language, difficulty, page, pageSize
   */
  async getContent(req, res, next) {
    try {
      const { type, language, difficulty, page, pageSize } = req.query;
      const languageContext = req.language_context;
      const targetLanguage = language || languageContext?.primaryTargetLanguage || 'ja';

      const result = await learningContentService.getContent({
        contentType: type,
        targetLanguage,
        difficultyLevel: difficulty || 'beginner',
        page: parseInt(page) || 1,
        pageSize: Math.min(parseInt(pageSize) || 20, 50),
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('LearningContentController.getContent failed:', error);
      next(error);
    }
  },

  /**
   * GET /api/content/summary
   * Returns content type counts for the user's target language
   */
  async getSummary(req, res, next) {
    try {
      const languageContext = req.language_context;
      const { language } = req.query;
      const targetLanguage = language || languageContext?.primaryTargetLanguage || 'ja';

      const summary = await learningContentService.getContentSummary(targetLanguage);

      res.json({ success: true, targetLanguage, summary });
    } catch (error) {
      logger.error('LearningContentController.getSummary failed:', error);
      next(error);
    }
  },

  /**
   * GET /api/content/:id
   * Get single content item detail
   */
  async getContentById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await learningContentService.getContentById(id);

      res.json({ success: true, item });
    } catch (error) {
      logger.error('LearningContentController.getContentById failed:', error);
      next(error);
    }
  },
};

module.exports = learningContentController;