// ============================================================
// src/server/routes/checkin.js
// 签到路由：挂载到 /api/checkin
// ============================================================
const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { authenticate } = require('../middleware/auth');

// 获取签到状态（今日是否已签到 + 连续天数）
router.get('/', authenticate, checkinController.getCheckinStatus);

// 执行签到
router.post('/', authenticate, checkinController.doCheckin);

module.exports = router;