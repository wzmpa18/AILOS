/**
 * src/services/ocr/tencentCloudOcrAdapter.js
 * 备选 OCR 实现 — 腾讯云通用印刷体识别 GeneralBasicOCR（TC3-HMAC-SHA256 签名）
 * 需要环境变量 TENCENT_SECRET_ID / TENCENT_SECRET_KEY（未配置时明确报错，不静默兜底）。
 * 切换方式：OCR_PROVIDER=tencent-ocr（业务代码零修改）。
 */

const crypto = require('crypto');
const axios = require('axios');

const HOST = 'ocr.tencentcloudapi.com';
const SERVICE = 'ocr';
const ACTION = 'GeneralBasicOCR';
const VERSION = '2018-11-19';
const REGION = process.env.TENCENT_OCR_REGION || 'ap-guangzhou';
// 腾讯云通用印刷体 OCR 单价（元/千次 1000 次以内阶梯的近似单张成本）
const DEFAULT_UNIT_COST_CNY = 0.15;

function hmac(key, msg) { return crypto.createHmac('sha256', key).update(msg, 'utf8').digest(); }
function sha256hex(msg) { return crypto.createHash('sha256').update(msg, 'utf8').digest('hex'); }

function buildHeaders(payload, secretId, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const canonicalRequest = [
    'POST', '/', '',
    `content-type:application/json; charset=utf-8\nhost:${HOST}\n`,
    'content-type;host',
    sha256hex(payload),
  ].join('\n');

  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = ['TC3-HMAC-SHA256', timestamp, credentialScope, sha256hex(canonicalRequest)].join('\n');

  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, SERVICE);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign, 'utf8').digest('hex');

  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Host': HOST,
    'X-TC-Action': ACTION,
    'X-TC-Version': VERSION,
    'X-TC-Region': REGION,
    'X-TC-Timestamp': String(timestamp),
    'Authorization': `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`,
  };
}

async function recognize({ imageBase64 }) {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) {
    const err = new Error('OCR provider not configured: TENCENT_SECRET_ID/KEY missing');
    err.code = 'OCR_PROVIDER_NOT_CONFIGURED';
    err.status = 503;
    throw err;
  }
  const started = Date.now();
  const payload = JSON.stringify({ ImageBase64: imageBase64 });
  const resp = await axios.post(`https://${HOST}/`, payload, {
    headers: buildHeaders(payload, secretId, secretKey),
    timeout: 30000,
    responseType: 'json',
  });

  const r = resp.data?.Response;
  if (r?.Error) {
    const err = new Error(`TencentOCR ${r.Error.Code}: ${r.Error.Message}`);
    err.code = 'OCR_PROVIDER_ERROR';
    err.status = 502;
    throw err;
  }
  const detections = r?.TextDetections || [];
  const text = detections.map((d) => d.DetectedText).join('\n').trim();
  const avgConf = detections.length
    ? detections.reduce((s, d) => s + (d.Confidence || 0), 0) / detections.length / 100
    : 0;
  return {
    text,
    confidence: Number(avgConf.toFixed(3)),
    provider: 'tencent-ocr',
    latencyMs: Date.now() - started,
    unitCostCny: DEFAULT_UNIT_COST_CNY,
    raw: { requestId: r?.RequestId, lines: detections.length },
  };
}

module.exports = { recognize, provider: 'tencent-ocr' };
