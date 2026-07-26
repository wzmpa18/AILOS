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
const MODEL = process.env.OCR_VISION_MODEL || 'hunyuan-t1-vision';
const TIMEOUT = 60000;

// 单张图片预估成本（元）— 可被 SystemConfig ocr.unit_cost_cny 覆盖（photoTranslateService 处理）
const DEFAULT_UNIT_COST_CNY = 0.01;

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
  const resp = await axios.post(API_URL, {
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
  }, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${API_KEY}`,
    },
    timeout: TIMEOUT,
    responseType: 'json',
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
