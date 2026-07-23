/**
 * AILOS Deploy Route
 * 
 * 注册部署 Webhook 路由到 Express
 * 在 index.js 中添加：app.use('/api/deploy', deployRouter)
 */

const express = require('express');
const router = express.Router();
const { deployWebhook, deployStatus } = require('../controllers/deployWebhook');

// POST /api/deploy - 触发部署
router.post('/', deployWebhook);

// GET /api/deploy/status - 查看部署状态
router.get('/status', deployStatus);

module.exports = router;