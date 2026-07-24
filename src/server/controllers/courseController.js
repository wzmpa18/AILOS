// ============================================================
// src/server/controllers/courseController.js
// 学习内容控制器 — 课程体系 + 用户进度
// ============================================================
const courseService = require('../../services/courseService');
const logger = require('../../utils/logger');

const courseController = {
  // GET /api/courses/languages
  async getLanguages(req, res, next) {
    try {
      const languages = await courseService.getLanguages();
      res.json({ success: true, data: languages });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses?language=ja
  async getCourses(req, res, next) {
    try {
      const { language } = req.query;
      if (!language) {
        return res.status(400).json({ success: false, error: 'Language code is required' });
      }
      const courses = await courseService.getCoursesByLanguage(language);
      res.json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses/:courseId
  async getCourse(req, res, next) {
    try {
      const courseId = parseInt(req.params.courseId, 10);
      const course = await courseService.getCourseById(courseId);
      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses/units/:unitId
  async getUnit(req, res, next) {
    try {
      const unitId = parseInt(req.params.unitId, 10);
      const unit = await courseService.getUnitById(unitId);
      res.json({ success: true, data: unit });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses/items/:itemId
  async getItem(req, res, next) {
    try {
      const itemId = parseInt(req.params.itemId, 10);
      const item = await courseService.getItemById(itemId);
      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses/:courseId/progress
  async getProgress(req, res, next) {
    try {
      const userId = req.userId;
      const courseId = parseInt(req.params.courseId, 10);
      const progress = await courseService.getUserProgress(userId, courseId);
      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/courses/items/:itemId/progress
  async updateProgress(req, res, next) {
    try {
      const userId = req.userId;
      const itemId = parseInt(req.params.itemId, 10);
      const { status, score } = req.body;

      if (!status && score === undefined) {
        return res.status(400).json({ success: false, error: 'status or score is required' });
      }

      const validStatuses = ['not_started', 'in_progress', 'completed'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const progress = await courseService.updateItemProgress(userId, itemId, { status, score });
      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/courses/overview
  async getOverview(req, res, next) {
    try {
      const userId = req.userId;
      const overview = await courseService.getLearningOverview(userId);
      res.json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = courseController;