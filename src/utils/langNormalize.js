// ============================================================
// src/utils/langNormalize.js
// 语种归一化：唯一真源（供 contextResolver 与一致性校验共用）
// 将库中可能存储的中文/英文全称/代码统一为守卫可识别的短码
// （ja / zh / en / ko / fr / es / de ...），避免 LanguageGuard 误判。
// 纯函数，无任何 IO / 依赖，便于单测与跨模块复用。
// ============================================================
function normalizeLang(code) {
  if (!code) return null;
  const c = String(code).toLowerCase().trim();
  const map = {
    'ja': 'ja', 'japanese': 'ja', '日语': 'ja', '日文': 'ja', 'jp': 'ja', 'jpn': 'ja',
    'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'chinese': 'zh', '中文': 'zh', '汉语': 'zh', 'cn': 'zh',
    'en': 'en', 'english': 'en', '英语': 'en', '英文': 'en',
    'ko': 'ko', 'korean': 'ko', '韩语': 'ko', '韩文': 'ko',
    'fr': 'fr', 'french': 'fr', '法语': 'fr', '法文': 'fr',
    'es': 'es', 'spanish': 'es', '西班牙语': 'es', '西语': 'es',
    'de': 'de', 'german': 'de', '德语': 'de', '德文': 'de',
  };
  if (map[c]) return map[c];
  return c.slice(0, 2); // 兜底：取前两位（如 'zh-CN' -> 'zh'）
}

module.exports = { normalizeLang };
