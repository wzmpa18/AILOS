const languageService = require('../../services/languageService');
const logger = require('../../utils/logger');

const languageController = {
  async getLanguages(req, res, next) {
    try {
      const result = await languageService.getUserLanguages(req.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async updateLanguages(req, res, next) {
    try {
      const { nativeLanguage, targetLanguages, interfaceLanguage } = req.body;
      const result = await languageService.updateUserLanguages(req.userId, {
        nativeLanguage,
        targetLanguages,
        interfaceLanguage,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = languageController;