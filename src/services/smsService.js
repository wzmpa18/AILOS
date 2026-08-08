/**
 * SMS & Email Service — Tencent Cloud SDK v4
 * 集成腾讯云短信(SMS)和邮件(SES)服务
 * 
 * SDK v4.x API: 使用纯对象参数，无需 Model 类
 * 配置位置：.env.production (TENCENT_SECRET_ID / TENCENT_SECRET_KEY / SMS_APP_ID / SMS_TEMPLATE_ID / ...)
 */
const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

let SmsClient, SesClient;

class SmsEmailService {
  constructor() {
    this.secretId = process.env.TENCENT_SECRET_ID || '';
    this.secretKey = process.env.TENCENT_SECRET_KEY || '';
    this.smsAppId = process.env.SMS_APP_ID || '';
    this.smsTemplateId = process.env.SMS_TEMPLATE_ID || '';
    this.smsSignName = process.env.SMS_SIGN_NAME || 'AILOS';
    this.smsRegion = process.env.SMS_REGION || 'ap-guangzhou';
    this.sesFromEmail = process.env.SES_FROM_EMAIL || '';
    this.sesTemplateId = process.env.SES_TEMPLATE_ID || '';
    this.sesRegion = process.env.SES_REGION || 'ap-hongkong';
    // 检测是否为占位符值（防止用户未填写真实密钥时误判为已配置）
    const isPlaceholder = (val) => !val || val.includes('请填入') || val.includes('your_') || val.length < 10;
    this.isConfigured = !isPlaceholder(this.secretId) && !isPlaceholder(this.secretKey);
    this._initSdk();
  }

  _initSdk() {
    try {
      const smsSdk = require('tencentcloud-sdk-nodejs-sms');
      SmsClient = smsSdk.sms.v20210111.Client;
      
      const sesSdk = require('tencentcloud-sdk-nodejs-ses');
      SesClient = sesSdk.ses.v20201002.Client;
      
      logger.info('Tencent Cloud SDK v4 loaded successfully');
    } catch (e) {
      logger.error(`Tencent Cloud SDK load failed: ${e.message}`, { stack: e.stack });
    }
  }

  _genCode(len = 6) {
    return crypto.randomInt(Math.pow(10, len - 1), Math.pow(10, len) - 1).toString();
  }

  async sendVerificationCode(phone, code, _type = 'login') {
    if (!this.isConfigured) {
      logger.warn('SMS not configured');
      if (config.env !== 'production') {
        logger.info(`SMS mock — code for ${phone}: ${code}`);
        return { success: true, requestId: 'MOCK_DEV', provider: 'tencent' };
      }
      throw new Error('SMS service not configured');
    }

    if (!SmsClient) {
      logger.error('SmsClient is not initialized');
      if (config.env !== 'production') {
        logger.info(`SMS mock (no SDK) — code for ${phone}: ${code}`);
        return { success: true, requestId: 'MOCK_NO_SDK', provider: 'tencent' };
      }
      throw new Error('SMS SDK not initialized');
    }

    const expireMinutes = 5;
    // BUG-020: 国际号码支持 — 前端传入 E.164 格式（如 +12025550123）时原样透传；
    // 传入纯国内号码时保持旧行为（补 +86），完全向后兼容。
    const isE164 = /^\+\d{6,18}$/.test(phone);
    const cleanPhone = phone.replace(/^\+86/, '');
    const e164Phone = isE164 && !phone.startsWith('+86') ? phone : `+86${cleanPhone}`;
    try {
      const client = new SmsClient({
        credential: { secretId: this.secretId, secretKey: this.secretKey },
        region: this.smsRegion,
      });

      const params = {
        SmsSdkAppId: this.smsAppId,
        SignName: this.smsSignName,
        TemplateId: this.smsTemplateId,
        TemplateParamSet: [code, String(expireMinutes)],
        PhoneNumberSet: [e164Phone],
      };

      const resp = await client.SendSms(params);
      const [status] = resp.SendStatusSet;
      if (status.Code !== 'Ok') {
        logger.error(`SMS API failed for ${phone}: ${status.Code} — ${status.Message}`);
        const err = new Error(status.Message || status.Code);
          err.code = status.Code;
          err.tencentError = status;
          throw err;
      }

      logger.info(`SMS sent to ${phone} — RequestId: ${resp.RequestId}`);
      return { success: true, requestId: resp.RequestId, provider: 'tencent' };
    } catch (e) {
      logger.error(`SMS send error for ${phone}: ${e.message}`, { code: e.code, stack: e.stack });
      // Preserve Tencent error code for upstream handling
      if (e.code) {
        const err = new Error(e.message);
        err.code = e.code;
        throw err;
      }
      throw e;
    }
  }

  async sendEmailCode(email, code) {
    if (!this.isConfigured) {
      if (config.env !== 'production') {
        logger.info(`Email mock — code for ${email}: ${code}`);
        return { success: true, requestId: 'MOCK_DEV', provider: 'tencent' };
      }
      throw new Error('Email service not configured');
    }

    if (!SesClient) {
      if (config.env !== 'production') {
        return { success: true, requestId: 'MOCK_NO_SDK', provider: 'tencent' };
      }
      throw new Error('Email SDK not initialized');
    }

    try {
      const client = new SesClient({
        credential: { secretId: this.secretId, secretKey: this.secretKey },
        region: this.sesRegion,
      });

      const params = {
        FromEmailAddress: this.sesFromEmail,
        Destination: [email],
        Subject: '【言道外语】您的验证码',
        Template: {
          TemplateID: Number(this.sesTemplateId),
          TemplateData: JSON.stringify({ code }),
        },
      };

      const resp = await client.SendEmail(params);
      logger.info(`Email sent to ${email} — RequestId: ${resp.RequestId}`);
      return { success: true, requestId: resp.RequestId, provider: 'tencent' };
    } catch (e) {
      logger.error(`Email send error for ${email}: ${e.message}`, { code: e.code, stack: e.stack });
      throw e;
    }
  }
}

const smsEmailService = new SmsEmailService();
module.exports = smsEmailService;