/**
 * Brain OCRSubsystem 适配器 — P2 整改：视觉识别唯一出口
 * 
 * 业务层禁止直接 import 此文件，必须通过 BrainFacade.recognizeImage()
 * 
 * 关联违宪：VC-A007~A009, VC-B007~B009
 */
const logger = require('../../../utils/logger');

/**
 * 图像识别
 * @param {string} imageBase64 - base64 图片数据
 * @param {Object} opts - { mimeType, userId }
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function recognize(imageBase64, opts = {}) {
  try {
    // P2 Day3：OCR 适配器已迁移到 Brain 内核
    const hunyuanAdapter = require('./hunyuanVisionAdapter');
    return await hunyuanAdapter.recognize(imageBase64, opts);
  } catch (e) {
    logger.error('[OCRAdapter] 识别失败:', e.message);
    throw e;
  }
}

module.exports = { recognize };
