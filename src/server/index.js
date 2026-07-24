// ============================================================
// src/server/index.js
// 服务启动入口 — 监听端口 + 优雅关闭
// ============================================================
const app = require('./app');
const config = require('../config');
const logger = require('../utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`AILOS Server running on port ${config.port} [${config.env}]`);
  logger.info(`Health check: http://localhost:${config.port}/api/health`);
});

// ============================================================
// 优雅关闭
// ============================================================
function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');

    // 关闭 Prisma 连接
    try {
      const prisma = require('../config/database');
      prisma.$disconnect().then(() => {
        logger.info('Prisma disconnected');
        process.exit(0);
      });
    } catch (e) {
      process.exit(0);
    }
  });

  // 强制退出超时
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

module.exports = server;