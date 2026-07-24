// ============================================================
// src/config/index.js
// 全局配置中心 — 所有环境变量统一入口
// ============================================================
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  jwt: {
    secret: process.env.JWT_SECRET || 'ailos-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  database: {
    url: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/ailos',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'aliyun',
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || 'AILOS',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'hunyuan',
    apiKey: process.env.AI_API_KEY || '',
    apiEndpoint: process.env.AI_API_ENDPOINT || '',
    model: process.env.AI_MODEL || 'hunyuan-lite',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

module.exports = config;