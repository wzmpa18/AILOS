// ============================================================
// src/config/database.js
// Prisma 客户端单例 — 全局唯一数据库连接
// ============================================================
const { PrismaClient } = require('./generated');
const logger = require('../utils/logger');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });

    prisma.$connect()
      .then(() => logger.info('Prisma connected to database'))
      .catch((err) => logger.error('Prisma connection failed:', err));
  }
  return prisma;
}

module.exports = getPrismaClient();