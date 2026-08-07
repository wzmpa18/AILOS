/**
 * src/services/ocr/index.js — P2 终验：OCR 工厂改为通过 Brain Facade
 * 适配器已迁移到 src/core/brain/adapters/，业务层通过 BrainFacade.recognizeImage() 调用
 */
const brainFacade = require('../../core/brain/facade');

function getOcrAdapter() {
  return {
    recognize: async (opts) => brainFacade.recognizeImage(opts.imageBase64, opts),
  };
}

module.exports = { getOcrAdapter };
