/**
 * src/services/ocr/index.js
 * OCR 适配器工厂 — Stage11 子模块1（宪法 Appendix E / 附件 L）
 *
 * 架构约束（用户指令 + 宪法）：
 * - 统一接口：adapter.recognize({ imageBase64, mimeType }) → { text, confidence, provider, raw }
 * - 业务层只依赖本工厂返回的接口，不耦合具体服务商；
 * - 切换服务商仅需环境变量 OCR_PROVIDER，业务代码零修改。
 *
 * 事实校准（真值：服务器 .env.production）：
 * - 现有混元凭据为 tokenhub OpenAI 兼容 HUNYUAN_API_KEY，并非腾讯云 SecretId/SecretKey；
 *   "复用现有腾讯云凭据、不新增独立密钥"的唯一可行路径 = 默认走混元视觉模型(hunyuanVision)。
 * - tencent-ocr 适配器已就位：配置 TENCENT_SECRET_ID/KEY 后设 OCR_PROVIDER=tencent-ocr 即切换。
 */

const hunyuanVision = require('./hunyuanVisionAdapter');
const tencentOcr = require('./tencentCloudOcrAdapter');

const PROVIDERS = {
  'hunyuan-vision': hunyuanVision,
  'tencent-ocr': tencentOcr,
};

function getOcrAdapter() {
  const name = (process.env.OCR_PROVIDER || 'hunyuan-vision').trim();
  const adapter = PROVIDERS[name];
  if (!adapter) {
    const err = new Error(`Unknown OCR provider: ${name}`);
    err.code = 'OCR_PROVIDER_UNKNOWN';
    err.status = 500;
    throw err;
  }
  return adapter;
}

module.exports = { getOcrAdapter, PROVIDERS };
