// ============================================================
// src/server/routes/org/teachers.js
// Phase 4 P2: 机构老师管理路由（仅机构管理员可操作）
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireOrgAdmin } = require('../../middleware/orgAuth');
const orgTeacherService = require('../../../services/orgTeacherService');
const logger = require('../../../utils/logger');

// 所有路由均需机构管理员权限
router.use(authenticate, requireOrgAdmin);

// GET /api/org/teachers — 获取机构所有老师
router.get('/', async (req, res) => {
  try {
    const teachers = await orgTeacherService.listTeachers(req.orgId);
    return res.json({ success: true, data: { teachers, total: teachers.length } });
  } catch (error) {
    logger.error('[org/teachers] 列表失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to list teachers', code: error.code || 'LIST_ERROR',
    });
  }
});

// POST /api/org/teachers — 创建/邀请老师
router.post('/', async (req, res) => {
  try {
    const { phone, email, nickname, password, classIds } = req.body;
    const teacher = await orgTeacherService.createTeacher(req.orgId, { phone, email, nickname, password, classIds });
    return res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    logger.error('[org/teachers] 创建失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to create teacher', code: error.code || 'CREATE_ERROR',
    });
  }
});

// PUT /api/org/teachers/:id — 更新老师信息
router.put('/:id', async (req, res) => {
  try {
    const result = await orgTeacherService.updateTeacher(req.orgId, req.params.id, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('[org/teachers] 更新失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to update teacher', code: error.code || 'UPDATE_ERROR',
    });
  }
});

// DELETE /api/org/teachers/:id — 移除老师
router.delete('/:id', async (req, res) => {
  try {
    const result = await orgTeacherService.removeTeacher(req.orgId, req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('[org/teachers] 移除失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to remove teacher', code: error.code || 'REMOVE_ERROR',
    });
  }
});

module.exports = router;
