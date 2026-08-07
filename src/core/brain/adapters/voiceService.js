/**
 * 语音服务 — P2 整改：Brain VoiceSubsystem（唯一语音出口）
 * 密钥通过 CI 环境变量注入，业务层无权限读取
 * 所有 TTS/ASR 请求必经此模块，禁止业务层直连腾讯云
 * 
 * 关联违宪：VC-A010~A011, VC-B014~B015
 * 整改状态：P2 标记为 Brain 合法子系统（待完整 Brain 重构时迁入内核）
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

// P2 整改：密钥仅通过环境变量注入，代码中不存明文
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID || '';
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || '';

// Brain VoiceSubsystem 合法端点
const TTS_HOST = 'tts.tencentcloudapi.com';
const ASR_HOST = 'asr.tencentcloudapi.com';

// 语言 code -> 腾讯云 TTS VoiceType（标准语音合成基础音色，已逐一验真）
// 参考腾讯云 TTS VoiceType 列表：https://cloud.tencent.com/document/product/1073/34103
const TTS_VOICE_TYPE = {
  zh: 101001,   // 中文普通话女声
  en: 101003,   // 英文女声
  ja: 101050,   // 日文女声
  ko: 101052,   // 韩文女声
  fr: 101054,   // 法文女声
  es: 101056,   // 西班牙文女声
  de: 101058,   // 德文女声
};

const ASR_ENGINE = {
  zh: '16k_zh',
  en: '16k_en',
  ja: '16k_ja',
  ko: '16k_ko',
  fr: '16k_fr',
  es: '16k_es',
  de: '16k_de',
};

function isConfigured() {
  return !!(TENCENT_SECRET_ID && TENCENT_SECRET_KEY);
}

/** TC3-HMAC-SHA256 签名 */
function sign(secretKey, date, service, strToSign) {
  const hmac = (key, data) => crypto.createHmac('sha256', key).update(data, 'utf8').digest();
  const secretDate = hmac(Buffer.from('TC3' + secretKey, 'utf8'), date);
  const secretService = hmac(secretDate, service);
  const secretSigning = hmac(secretService, 'tc3_request');
  return hmac(secretSigning, strToSign).toString('hex');
}

/**
 * 调用腾讯云 API（通用签名 v3）
 * @param {string} host 接口域名
 * @param {string} action Action 名
 * @param {object} payload 请求体
 */
async function callTencent(host, action, payload) {
  const service = host.split('.')[0];
  const version = service === 'tts' ? '2019-08-23' : '2019-06-14';
  const region = '';
  const endpoint = host;
  const contentType = 'application/json; charset=utf-8';

  const now = Math.floor(Date.now() / 1000);
  const date = new Date(now * 1000).toISOString().slice(0, 10);

  const payloadStr = JSON.stringify(payload);
  const hashedPayload = crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex');

  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = [
    'POST', '/', '', canonicalHeaders, signedHeaders, hashedPayload,
  ].join('\n');

  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonical = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
  const stringToSign = [
    'TC3-HMAC-SHA256', now, credentialScope, hashedCanonical,
  ].join('\n');

  const authorization = [
    `TC3-HMAC-SHA256 Credential=${TENCENT_SECRET_ID}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${sign(TENCENT_SECRET_KEY, date, service, stringToSign)}`,
  ].join(', ');

  const url = `https://${endpoint}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'X-TC-Action': action,
      'X-TC-Version': version,
      'X-TC-Timestamp': String(now),
      'Authorization': authorization,
    },
    body: payloadStr,
  });

  const data = await resp.json();
  if (data.Response && data.Response.Error) {
    const err = new Error(data.Response.Error.Message || 'Tencent API error');
    err.code = data.Response.Error.Code;
    throw err;
  }
  return data.Response;
}

/**
 * 语音合成（TTS）
 * @param {string} text 文本
 * @param {string} lang 语言 code
 * @returns {Promise<{audioBase64:string, codec:string}|null>} 无密钥返回 null
 */
async function textToVoice(text, lang) {
  if (!isConfigured()) return null;
  const voiceType = TTS_VOICE_TYPE[lang] || TTS_VOICE_TYPE.en;
  try {
    const resp = await callTencent(TTS_HOST, 'TextToVoice', {
      Text: text,
      SessionId: crypto.randomUUID(),
      VoiceType: voiceType,
      Codec: 'mp3',
      SampleRate: 16000,
    });
    // 失败自动重试 1 次
    if (resp && resp.Audio) {
      return { audioBase64: resp.Audio, codec: 'mp3' };
    }
    return null;
  } catch (e) {
    logger.warn('[voiceService] TTS retry-once...', e.code || e.message);
    try {
      const resp = await callTencent(TTS_HOST, 'TextToVoice', {
        Text: text,
        SessionId: crypto.randomUUID(),
        VoiceType: voiceType,
        Codec: 'mp3',
        SampleRate: 16000,
      });
      return resp && resp.Audio ? { audioBase64: resp.Audio, codec: 'mp3' } : null;
    } catch (e2) {
      logger.error('[voiceService] TTS failed after retry:', e2.code || e2.message);
      // 透传腾讯云业务错误码，便于路由层给出精确提示（如资源包耗尽）
      const err = new Error(e2.code || e2.message || 'TTS_FAILED');
      err.code = e2.code || 'TTS_FAILED';
      err.quotaExhausted = /PkgExhausted|Quota|ResourceInsufficient/.test(e2.code || '');
      throw err;
    }
  }
}

/**
 * 语音识别（ASR）
 * @param {string} audioBase64 base64 音频
 * @param {string} lang 语言 code
 * @param {string} voiceFormat 音频格式（wav/mp3/m4a 等）
 * @returns {Promise<{text:string}|null>} 无密钥返回 null
 */
async function sentenceRecognition(audioBase64, lang, voiceFormat = 'wav') {
  if (!isConfigured()) return null;
  const eng = ASR_ENGINE[lang] || ASR_ENGINE.en;
  try {
    const resp = await callTencent(ASR_HOST, 'SentenceRecognition', {
      EngSerViceType: eng,
      SourceType: 1,
      VoiceFormat: voiceFormat,
      Data: audioBase64,
      DataLen: 0,
      WordInfo: 0,
    });
    if (resp && resp.Result) {
      return { text: String(resp.Result).trim() };
    }
    return null;
  } catch (e) {
    logger.error('[voiceService] ASR failed:', e.code || e.message);
    return null;
  }
}

module.exports = {
  isConfigured,
  textToVoice,
  sentenceRecognition,
};
