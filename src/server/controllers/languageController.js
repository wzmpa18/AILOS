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
      const body = req.body || {};
      const { nativeLanguage, targetLanguages, interfaceLanguage } = body;
      const validCodes = (await languageService.getSupportedLanguages()).map(l => l.code);

      // 整改2：入参强校验，异常格式直接返回 400（统一格式，不抛 500）
      if (typeof nativeLanguage !== 'string' || !nativeLanguage) {
        return res.status(400).json({ success: false, error: 'nativeLanguage 必须为非空字符串' });
      }
      if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        return res.status(400).json({ success: false, error: 'targetLanguages 必须为非空字符串数组' });
      }
      for (const tl of targetLanguages) {
        if (typeof tl !== 'string') {
          return res.status(400).json({ success: false, error: 'targetLanguages 的每个元素必须为字符串' });
        }
        if (!validCodes.includes(tl)) {
          return res.status(400).json({ success: false, error: `不支持的目标语言编码: ${tl}` });
        }
        if (tl === nativeLanguage) {
          return res.status(400).json({ success: false, error: `目标语言不能与母语相同: ${tl}` });
        }
      }
      if (interfaceLanguage !== undefined && interfaceLanguage !== null && !validCodes.includes(interfaceLanguage)) {
        return res.status(400).json({ success: false, error: `不支持的界面语言编码: ${interfaceLanguage}` });
      }

      const result = await languageService.updateUserLanguages(req.userId, { nativeLanguage, targetLanguages, interfaceLanguage });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = languageController;