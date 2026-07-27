// ============================================================
// src/server/controllers/translateController.js
// Stage11 子模块1 — 拍照翻译（宪法 Appendix E / 附件 L）
// 合规要点：语言从库解析(前端传参一律忽略)；配额/熔断服务端判定；禁先用后扣
// ============================================================
const { getPhotoTranslateService } = require('../../services/photoTranslateService');
const { getOcrQuotaService } = require('../../services/ocrQuotaService');
const { LangConfigError } = require('../../services/contextResolver');
const logger = require('../../utils/logger');

function sendErr(res, err) {
  if (err instanceof LangConfigError || err.code === 'LANG_CONFIG_INCOMPLETE') {
    return res.status(400).json({
      success: false,
      error: { code: 'LANG_CONFIG_INCOMPLETE', message: '用户语言配置不完整，请先完成母语与目标语言设置' },
    });
  }
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? '服务内部错误，请稍后重试' : err.message,
      upgrade: err.upgrade || undefined, // OCR_QUOTA_EXCEEDED → 前端套餐引导
    },
  });
}

// POST /api/translate/photo  { imageBase64, mimeType? } — 语言字段不接收
exports.photoTranslate = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    const result = await getPhotoTranslateService().translatePhoto(req.user.id, { imageBase64, mimeType }, req.deviceRisk || null);
    res.json({ success: true, data: result });
  } catch (err) {
    if (!err.status || err.status >= 500) {
      logger.error('TranslateController', 'photoTranslate 失败', { userId: req.user?.id, error: err.message });
    }
    sendErr(res, err);
  }
};

// GET /api/translate/photo/quota — 配额状态（只读，服务端真值）
exports.getQuota = async (req, res) => {
  try {
    const status = await getOcrQuotaService().getStatus(req.user.id);
    res.json({ success: true, data: status });
  } catch (err) {
    sendErr(res, err);
  }
};

// POST /api/translate/notebook  { type:'word'|'sentence', word/sentence, reading?, meaning? }
exports.addToNotebook = async (req, res) => {
  try {
    const result = await getPhotoTranslateService().addToNotebook(req.user.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (err) {
    sendErr(res, err);
  }
};
