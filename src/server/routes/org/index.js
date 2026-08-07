// ============================================================
// src/server/routes/org/index.js
// Phase 4 P2: 机构端路由中枢（全部挂载在 /api/org 下）
// ============================================================
const express = require('express');
const router = express.Router();

// 机构认证
router.use('/auth', require('./auth'));

// 老师管理
router.use('/teachers', require('./teachers'));

// 学生管理（P2新增）
router.use('/students', require('./students'));

// 班级管理
router.use('/classes', require('./classes'));

// 作业管理（P2新增）
router.use('/homework', require('./homework'));

router.use('/courses', require('./courses'));

router.use('/reports', require('./reports'));

module.exports = router;
