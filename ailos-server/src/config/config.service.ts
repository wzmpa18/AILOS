import { Injectable, Logger } from '@nestjs/common';

/**
 * 全局配置服务
 *
 * 从环境变量读取配置，禁止硬编码密钥
 * 腾讯混元API密钥通过 .env.local 环境变量注入
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  get dbConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
    };
  }

  get redisConfig() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    };
  }

  get rabbitmqConfig() {
    return {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    };
  }

  /**
   * 腾讯混元API配置 - 密钥仅通过 .env.local 注入
   * 支持主用/备用双接口切换
   * 禁止在任何代码文件中硬编码密钥或接口地址
   */
  getHunyuanConfig() {
    const activeEndpoint = process.env.HUNYUAN_ACTIVE_ENDPOINT || 'primary';
    const isPrimary = activeEndpoint === 'primary';

    return {
      apiKey: process.env.HUNYUAN_API_KEY || '',
      apiEndpoint: isPrimary ? process.env.HUNYUAN_API_ENDPOINT || '' : process.env.HUNYUAN_BACKUP_ENDPOINT || '',
      primaryModel: process.env.HUNYUAN_PRIMARY_MODEL || 'hunyuan-turbo',
      backupModel: process.env.HUNYUAN_BACKUP_MODEL || 'hunyuan-2.0-instruct-20251111',
      activeModel: isPrimary
        ? process.env.HUNYUAN_PRIMARY_MODEL || 'hunyuan-turbo'
        : process.env.HUNYUAN_BACKUP_MODEL || 'hunyuan-2.0-instruct-20251111',
      activeEndpoint: activeEndpoint as 'primary' | 'backup',
      lightweightModel: 'hunyuan-turbo',
      standardModel: 'hunyuan-turbo',
    };
  }

  /**
   * 密钥脱敏显示（仅日志用）
   * 格式: 前8位 + **** + 后4位
   */
  maskApiKey(key: string): string {
    if (!key || key.length < 12) return '***';
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  }
}
