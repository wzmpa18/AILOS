const languageService = require('../../services/languageService');

// 语言编码规范化：前端使用 'zh'，后端存储 'zh-CN'，统一映射
function normalizeLangCode(code) {
  if (!code || typeof code !== 'string') return code;
  return code === 'zh' ? 'zh-CN' : code;
}

const languageController = {
  async getLanguages(req, res, next) {
    try {
      const result = await languageService.getUserLanguages(req.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async updateLanguages(req, res, next) {
    try {
      const body = req.body || {};
      const { nativeLanguage, targetLanguages, interfaceLanguage } = body;

      // 整改2：入参强校验，异常格式直接返回 400（统一格式，不抛 500）
      if (typeof nativeLanguage !== 'string' || !nativeLanguage.trim()) {
        return res.status(400).json({ success: false, error: 'nativeLanguage 必须为非空字符串' });
      }
      if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        return res.status(400).json({ success: false, error: 'targetLanguages 必须为非空数组' });
      }

      // 规范化 targetLanguages：兼容两种入参格式
      //   格式1（旧）: ["ja", "ko"]                     —— 字符串数组
      //   格式2（新）: [{code: "ja", level: "beginner"}] —— 对象数组（前端 language.html 使用）
      const normalizedTargets = [];
      for (const tl of targetLanguages) {
        let code, level;
        if (typeof tl === 'string') {
          code = tl;
          level = 'beginner';
        } else if (tl && typeof tl === 'object' && typeof tl.code === 'string') {
          code = tl.code;
          level = tl.level || 'beginner';
        } else {
          return res.status(400).json({ success: false, error: 'targetLanguages 的每个元素必须为字符串或包含 code 字段的对象' });
        }
        if (!code.trim()) {
          return res.status(400).json({ success: false, error: '目标语言编码不能为空' });
        }
        normalizedTargets.push({ code: code.trim(), level });
      }

      // 规范化语言编码：zh -> zh-CN（前端使用 zh，后端存储 zh-CN）
      const normalizedNative = normalizeLangCode(nativeLanguage.trim());
      const normalizedInterface = interfaceLanguage ? normalizeLangCode(interfaceLanguage) : undefined;
      const normalizedTargetCodes = normalizedTargets.map((t) => ({
        code: normalizeLangCode(t.code),
        level: t.level,
      }));

      // 校验目标语言不能与母语相同（规范化后比较）
      for (const t of normalizedTargetCodes) {
        if (t.code === normalizedNative) {
          return res.status(400).json({ success: false, error: `目标语言不能与母语相同: ${t.code}` });
        }
      }

      // 注意：不再校验 validCodes，允许自定义语言编码（Bug 2：自定义语言功能）
      // 预定义语言和自定义语言均由 languageService 统一处理存储

      const result = await languageService.updateUserLanguages(req.userId, {
        nativeLanguage: normalizedNative,
        targetLanguages: normalizedTargetCodes,
        interfaceLanguage: normalizedInterface,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = languageController;
