// ============================================================
// src/server/routes/org/classes.js
// Phase 4 P2: 机构班级管理路由（管理员可全管，老师仅查看自己的班级）
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireOrgTeacher } = require('../../middleware/orgAuth');
const orgClassService = require('../../../services/orgClassService');
const logger = require('../../../utils/logger');

// 所有路由需要机构老师或管理员权限
router.use(authenticate, requireOrgTeacher);

// GET /api/org/classes — 获取班级列表
router.get('/', async (req, res) => {
  try {
    // 如果当前用户是老师，只返回自己负责的班级
    const filter = {};
    if (req.orgRole === 'teacher') {
      filter.teacherId = req.userId;
    } else if (req.query.teacherId) {
      filter.teacherId = req.query.teacherId;
    }
    if (req.query.status) filter.status = req.query.status;

    const classes = await orgClassService.listClasses(req.orgId, filter);
    return res.json({ success: true, data: { classes, total: classes.length } });
  } catch (error) {
    logger.error('[org/classes] 列表失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to list classes', code: error.code || 'LIST_ERROR',
    });
  }
});

// POST /api/org/classes — 创建班级（仅管理员）
router.post('/', async (req, res) => {
  try {
    if (req.orgRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can create classes', code: 'ADMIN_ONLY' });
    }
    const cls = await orgClassService.createClass(req.orgId, req.body);
    return res.status(201).json({ success: true, data: cls });
  } catch (error) {
    logger.error('[org/classes] 创建失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to create class', code: error.code || 'CREATE_ERROR',
    });
  }
});

// PUT /api/org/classes/:id — 更新班级（仅管理员）
router.put('/:id', async (req, res) => {
  try {
    if (req.orgRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can update classes', code: 'ADMIN_ONLY' });
    }
    const cls = await orgClassService.updateClass(req.orgId, req.params.id, req.body);
    return res.json({ success: true, data: cls });
  } catch (error) {
    logger.error('[org/classes] 更新失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to update class', code: error.code || 'UPDATE_ERROR',
    });
  }
});

// DELETE /api/org/classes/:id — 归档班级（仅管理员）
router.delete('/:id', async (req, res) => {
  try {
    if (req.orgRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admin can delete classes', code: 'ADMIN_ONLY' });
    }
    const result = await orgClassService.deleteClass(req.orgId, req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('[org/classes] 删除失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to delete class', code: error.code || 'DELETE_ERROR',
    });
  }
});

// GET /api/org/classes/:id/students — 获取班级学生列表
router.get('/:id/students', async (req, res) => {
  try {
    // 老师只能查看自己班级的学生
    const cls = await orgClassService.listClasses(req.orgId, {});
    const targetClass = cls.find((c) => c.id === req.params.id);
    if (!targetClass) {
      return res.status(404).json({ success: false, error: 'Class not found', code: 'CLASS_NOT_FOUND' });
    }
    if (req.orgRole === 'teacher' && targetClass.teacher?.id !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not your class', code: 'NOT_YOUR_CLASS' });
    }

    const students = await orgClassService.listClassStudents(req.orgId, req.params.id);
    return res.json({ success: true, data: { students, total: students.length } });
  } catch (error) {
    logger.error('[org/classes] 学生列表失败:', error.message);
    return res.status(error.status || 500).json({
      success: false, error: error.message || 'Failed to list students', code: error.code || 'STUDENT_LIST_ERROR',
    });
  }
});

module.exports = router;
