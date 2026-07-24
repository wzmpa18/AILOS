/**
 * src/services/systemConfigService.js
 * 系统配置服务 — 从 SystemConfig 表动态读取配置
 * 提供 getNumber / getString / getJson 方法
 * 被 membershipService.js 和 aiGateway.js 引用
 */
const prisma = require('../config/database');
const logger = require('../utils/logger');

class SystemConfigService {
  /**
   * 获取配置值（字符串）
   * @param {string} key - 配置键，支持点号分隔嵌套 (ex: "membership.pricing.basic.monthly")
   * @param {*} defaultValue - 默认值
   */
  async get(key, defaultValue = null) {
    try {
      const record = await prisma.systemConfig.findUnique({ where: { key } });
      if (record) return record.value;
      return defaultValue;
    } catch (error) {
      logger.debug('systemConfigService.get error:', error.message);
      return defaultValue;
    }
  }

  /**
   * 获取数字配置值
   * @param {string} key - 配置键
   * @param {number} defaultValue - 默认值
   */
  async getNumber(key, defaultValue = 0) {
    const value = await this.get(key, String(defaultValue));
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 获取 JSON 配置值
   * @param {string} key - 配置键
   * @param {object} defaultValue - 默认值
   */
  async getJson(key, defaultValue = {}) {
    const value = await this.get(key, null);
    if (!value) return defaultValue;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 设置配置值
   * @param {string} key - 配置键
   * @param {string} value - 配置值
   */
  async set(key, value) {
    try {
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
      return true;
    } catch (error) {
      logger.error('systemConfigService.set error:', error.message);
      return false;
    }
  }
}

// 单例导出
let _instance = null;
function getSystemConfigService() {
  if (!_instance) {
    _instance = new SystemConfigService();
  }
  return _instance;
}

module.exports = { SystemConfigService, getSystemConfigService };