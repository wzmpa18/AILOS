// ============================================================
// src/services/smsService.js
// 短信服务 — 多供应商支持（阿里云/腾讯云），开发环境Mock
// ============================================================
const config = require('../config');
const logger = require('../utils/logger');

class SmsService {
  /**
   * 发送验证码短信
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} type - 类型（login/register/reset）
   */
  async sendVerificationCode(phone, code, type = 'login') {
    const typeMap = {
      login: '登录验证',
      register: '注册验证',
      reset: '重置密码',
    };
    const purpose = typeMap[type] || '验证';

    // 开发环境：控制台输出验证码
    if (config.env !== 'production') {
      logger.info(`[DEV SMS] To: ${phone}, Code: ${code}, Purpose: ${purpose}`);
      return {
        success: true,
        provider: 'dev-mock',
        requestId: 'dev_' + Date.now(),
      };
    }

    // 生产环境：调用真实短信服务
    switch (config.sms.provider) {
      case 'aliyun':
        return this._sendViaAliyun(phone, code, purpose);
      case 'tencent':
        return this._sendViaTencent(phone, code, purpose);
      default:
        logger.warn(`Unknown SMS provider: ${config.sms.provider}, using mock`);
        return { success: true, provider: 'unknown-mock', requestId: 'unknown_' + Date.now() };
    }
  }

  async _sendViaAliyun(phone, code, purpose) {
    // 阿里云短信服务接入
    // 实际部署时替换为真实SDK调用
    const Core = require('@alicloud/pop-core');
    const client = new Core({
      accessKeyId: config.sms.accessKeyId,
      accessKeySecret: config.sms.accessKeySecret,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25',
    });

    const params = {
      RegionId: 'cn-hangzhou',
      PhoneNumbers: phone,
      SignName: config.sms.signName,
      TemplateCode: config.sms.templateCode,
      TemplateParam: JSON.stringify({ code }),
    };

    const result = await client.request('SendSms', params);
    return { success: true, provider: 'aliyun', requestId: result.RequestId };
  }

  async _sendViaTencent(phone, code, purpose) {
    // 腾讯云短信服务接入
    // 实际部署时替换为真实SDK调用
    const tencentcloud = require('tencentcloud-sdk-nodejs-sms');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: config.sms.accessKeyId,
        secretKey: config.sms.accessKeySecret,
      },
      region: 'ap-guangzhou',
    });

    const result = await client.SendSms({
      PhoneNumberSet: ['+86' + phone],
      SmsSdkAppId: config.sms.sdkAppId,
      SignName: config.sms.signName,
      TemplateId: config.sms.templateCode,
      TemplateParamSet: [code],
    });

    return { success: true, provider: 'tencent', requestId: result.RequestId };
  }
}

module.exports = new SmsService();