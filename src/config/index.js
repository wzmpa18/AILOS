const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

dotenv.config({ path: path.join(__dirname, `../../${envFile}`), override: true });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  hunyuan: {
    apiKey: process.env.HUNYUAN_API_KEY,
    apiUrl: process.env.HUNYUAN_API_URL,
    apiUrlBackup: process.env.HUNYUAN_API_URL_BACKUP,
    model: process.env.HUNYUAN_MODEL,
    modelBackup: process.env.HUNYUAN_MODEL_BACKUP,
  },
  
  sms: {
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    templateId: process.env.SMS_TEMPLATE_ID,
  },
  
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
  
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'HUNYUAN_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && env === 'production') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config;
