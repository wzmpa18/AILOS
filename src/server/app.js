// ============================================================
// src/server/app.js
// Express 应用入口 — AILOS MVP 后端主服务
// ============================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('../config');
const logger = require('../utils/logger');
const routes = require('./routes/index');

const app = express();

// ============================================================
// 安全中间件
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ============================================================
// CORS
// ============================================================
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ============================================================
// 请求解析
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 请求日志
// ============================================================
if (config.env !== 'test') {
  app.use(morgan('short', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ============================================================
// 信任代理（Nginx反向代理后获取真实IP）
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// Redis 注入到 app（供控制器使用）
// ============================================================
try {
  const redis = require('../config/redis');
  app.set('redis', redis);
} catch (e) {
  logger.warn('Redis not available, quota features will be disabled');
}

// ============================================================
// API 路由
// ============================================================
app.use('/api', routes);

// ============================================================
// 404 处理
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// 全局错误处理
// ============================================================
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = config.env === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.env !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;