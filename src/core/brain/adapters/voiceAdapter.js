/**
 * Brain VoiceSubsystem 适配器 — P2 整改：语音合成唯一出口
 * 
 * 业务层禁止直接 import 此文件，必须通过 BrainFacade.generateVoice()
 * 密钥通过 CI 环境变量注入，适配器内部读取，业务层无权限接触
 * 
 * 关联违宪：VC-A010~A011, VC-B014~B015
 */
const crypto = require('crypto');
const logger = require('../../../utils/logger');

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';
const TTS_HOST = 'tts.tencentcloudapi.com';

/**
 * 语音合成
 * @param {string} text - 待合成文本
 * @param {string} lang - 语言代码 (ja/zh/en/ko)
 * @returns {Promise<{audio: Buffer, format: string}>}
 */
async function synthesize(text, lang) {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
    logger.warn('[VoiceAdapter] 密钥未配置，TTS 不可用');
    return null;
  }

  try {
    // P2 Day3：调用 Brain 内核内的 voiceService（已从 services/ 迁移到 core/brain/adapters/）
    const voiceService = require('./voiceService');
    return await voiceService.synthesize(text, lang);
  } catch (e) {
    logger.error('[VoiceAdapter] TTS 失败:', e.message);
    throw e;
  }
}

module.exports = { synthesize };
