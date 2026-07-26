/**
 * src/services/ocr/hunyuanVisionAdapter.js
 * 默认 OCR 实现 — 腾讯混元视觉模型（OpenAI 兼容 vision 消息）
 * 复用现有 HUNYUAN_API_KEY（.env.production），不新增独立密钥、不新增对账链路。
 */

const axios = require('axios');
const config = require('../../config');

const BASE_URL = (config.hunyuan?.apiUrl || 'https://tokenhub.tencentmaas.com/v1').replace(/\/+$/, '');
const API_URL = BASE_URL + '/chat/completions';
const API_KEY = config.hunyuan?.apiKey || process.env.HUNYUAN_API_KEY;
// tokenhub 在线视觉模型（/v1/models 实测）：hy-vision-2.0-instruct（默认）/ hunyuan-t1-vision-20250916
const MODEL = process.env.OCR_VISION_MODEL || 'hy-vision-2.0-instruct';
const TIMEOUT = 60000;

// 单张图片预估成本（元）— 可被 SystemConfig ocr.unit_cost_cny 覆盖（photoTranslateService 处理）
const DEFAULT_UNIT_COST_CNY = 0.01;

/**
 * 带一次重试的调用：tokenhub 上游存在偶发 504 超时（实测 gateway_error 504001），
 * OCR 请求幂等，超时/5xx/网络错误重试 1 次后仍失败才抛 502。
 */
async function _postWithRetry(payload) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: TIMEOUT,
        responseType: 'json',
      });
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      const retriable = !e.response || status >= 500 || status === 429 ||
        String(e.response?.data?.error?.code || '').startsWith('504');
      if (!retriable || attempt === 1) break;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  const detail = lastErr.response?.data?.error?.message || lastErr.response?.data?.message || lastErr.message;
  const err = new Error(`OCR vision 调用失败: ${String(detail).slice(0, 200)}`);
  err.code = 'OCR_PROVIDER_ERROR';
  err.status = 502;
  throw err;
}

const OCR_SYSTEM_PROMPT =
  '你是一个 OCR 文字识别引擎。请逐字提取图片中的全部可见文字，保持原始语言与换行，' +
  '不要翻译、不要解释、不要添加任何额外内容。若图片无文字，仅输出 [NO_TEXT]。';

async function recognize({ imageBase64, mimeType = 'image/jpeg' }) {
  if (!API_KEY) {
    const err = new Error('OCR provider not configured: HUNYUAN_API_KEY missing');
    err.code = 'OCR_PROVIDER_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }
  const started = Date.now();
  const resp = await _postWithRetry({
    model: MODEL,
    messages: [
      { role: 'system', content: OCR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: '提取图片中的全部文字。' },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 2048,
  });

  const text = (resp.data?.choices?.[0]?.message?.content || '').trim();
  const noText = text === '[NO_TEXT]' || text === '';
  return {
    text: noText ? '' : text,
    confidence: noText ? 0 : 0.9, // 视觉模型无逐字置信度，给固定估值
    provider: 'hunyuan-vision',
    latencyMs: Date.now() - started,
    unitCostCny: DEFAULT_UNIT_COST_CNY,
    raw: { model: MODEL, usage: resp.data?.usage || null },
  };
}

module.exports = { recognize, provider: 'hunyuan-vision' };
