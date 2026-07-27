// ============================================================
// src/services/languageGuard.js
// 内容安全 + 语种合规守卫
// GAP-04：从「仅日志告警」升级为「直接拦截丢弃异常输出」
// 兼容现有网关调用：getLanguageGuard() 工厂返回 { validateInput, validateOutput }
// 语种合规（根因重构 2026-07-26）：放弃「整段检测 + 单语种优先」的错误方案，
//   改为「目标语字符占比校验」——排除母语解释脚本字符后，目标语字符占比 ≥ 60% 即合规。
//   全语种统一（日语假名、韩语谚文、拉丁语系 en/fr/es/de 统一、中文汉字），一次性根治
//   拉丁语系因含母语中文解释被误判为 zh 而返回 422 的误杀问题；同时保留对纯无关内容的拦截能力。
//   禁止逐语种打补丁。
// ============================================================

// 敏感内容模式（恋爱/情侣/成人向等，AI 语言教学场景不应生成）
const SENSITIVE_PATTERNS = [
  { pattern: /恋爱|情侣|约会|告白|表白|男女朋友|暧昧|调情|亲吻|接吻|性爱|做爱|上床|约炮|色情|裸照|裸体|私密部位|胸|下面|自慰|手淫|性交|炮友|百合|耽美|肉番|里番|本子|工口|18禁/i, reason: '包含敏感/成人向内容', retry: true },
  { pattern: /如何.{0,6}(脱|勾引|诱惑|撩).{0,6}(异性|男生|女生|男人|女人)/i, reason: '包含不当社交引导', retry: true },
  { pattern: /(写|生成|编).{0,6}(情书|黄|色情|成人).{0,6}(故事|小说|文案|内容)/i, reason: '包含违规生成请求', retry: true },
];

class LangOutputMismatchError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LangOutputMismatchError';
    this.code = 'LANG_OUTPUT_MISMATCH';
    this.httpStatus = 422;
  }
}

// 目标语合规阈值：排除母语脚本后，目标语字符占比 ≥ 该值即视为合规
const TARGET_LANG_MIN_RATIO = 0.6;

// —— 书写系统(脚本)识别正则 ——
const SCRIPT_RE = {
  kana: /[\u3040-\u30ff]/,        // 平假名 + 片假名（日语特征）
  hangul: /[\uac00-\ud7a3]/,      // 谚文（韩语）
  cjk: /[\u4e00-\u9fff]/,         // CJK 汉字（中文 / 日文汉字）
  latin: /[A-Za-z\u00c0-\u024f]/, // 拉丁字母 + 拉丁扩展（含 é ñ ü ß à ç 等法/西/德重音字符）
};

// 语言代码 -> 该语言作为「目标语」时计入的脚本集合
function scriptsForLang(lang) {
  switch ((lang || '').toLowerCase()) {
    case 'ja': return ['kana', 'cjk'];   // 日语：假名 + 汉字
    case 'ko': return ['hangul'];        // 韩语：谚文
    case 'zh': return ['cjk'];           // 中文：汉字
    case 'en':
    case 'fr':
    case 'es':
    case 'de':
    case 'it':
    case 'pt':
      return ['latin'];                  // 拉丁语系统一按拉丁字母判定
    default: return null;                // 未知语种：不做语种拦截（fail-open，避免误杀）
  }
}

// 从 AI 原始输出中抽取「内容文本」用于语种判定。
// AI 网关常返回结构化 JSON（如 {response, example, translation}）或 ```json 代码块，
// 若直接对整段 JSON 判定，英文键名(response/example/translation)会污染占比分母导致误杀。
// 本函数解析 JSON 并仅收集其字符串「值」（剔除键名）；非 JSON 则原样返回。
function extractContent(text) {
  let s = String(text || '').trim();
  if (!s) return s;
  // 去除 markdown 代码块围栏
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  if (!(s.startsWith('{') || s.startsWith('['))) return String(text || '');
  try {
    const obj = JSON.parse(s);
    const vals = [];
    const walk = (v) => {
      if (v == null) return;
      if (typeof v === 'string') vals.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (typeof v === 'object') Object.values(v).forEach(walk); // 仅取值，忽略键名
    };
    walk(obj);
    const joined = vals.join(' ').trim();
    return joined || String(text || '');
  } catch (e) {
    return String(text || '');
  }
}

// 统计文本中各书写系统的实义字符数（忽略空白、标点、数字、符号）
function countScripts(text) {
  const c = { kana: 0, hangul: 0, cjk: 0, latin: 0 };
  for (const ch of String(text || '')) {
    if (SCRIPT_RE.kana.test(ch)) c.kana++;
    else if (SCRIPT_RE.hangul.test(ch)) c.hangul++;
    else if (SCRIPT_RE.cjk.test(ch)) c.cjk++;
    else if (SCRIPT_RE.latin.test(ch)) c.latin++;
  }
  return c;
}

/**
 * 目标语字符占比合规判定（全语种统一根因方案）
 * 规则：统计目标语脚本字符数，排除「母语专属脚本」字符（母语解释不参与判定），
 *       目标语字符在剩余实义字符中占比 ≥ TARGET_LANG_MIN_RATIO 即合规。
 *       目标语字符为 0（且有实义字符）直接判不匹配，保留拦截能力。
 * @param {string} text 待判定文本
 * @param {string} targetLang 目标语言代码
 * @param {string} nativeLang 母语代码（用于排除母语解释字符）
 * @returns {{mismatch:boolean, ratio:number, targetCount:number, meaningful:number}}
 */
function evaluateLangCompliance(text, targetLang, nativeLang) {
  const tset = scriptsForLang(targetLang);
  if (!tset) return { mismatch: false, ratio: 1, targetCount: 0, meaningful: 0 }; // 未知目标语，放行
  const content = extractContent(text); // 剔除 JSON 键名等结构噪声，仅判定内容
  const c = countScripts(content);
  const meaningful = c.kana + c.hangul + c.cjk + c.latin;
  if (meaningful === 0) return { mismatch: false, ratio: 1, targetCount: 0, meaningful: 0 }; // 纯符号/空白，交由其它规则

  const targetCount = tset.reduce((s, k) => s + c[k], 0);
  // 目标语完全无特征字符 -> 判定不匹配（保留拦截能力，防漏拦）
  if (targetCount === 0) return { mismatch: true, ratio: 0, targetCount, meaningful };

  // 日语特判：自然日语句必含假名；纯汉字（疑似纯中文冒充）视为不匹配，防母语汉字漏拦
  if ((targetLang || '').toLowerCase() === 'ja' && c.kana === 0) {
    return { mismatch: true, ratio: targetCount / meaningful, targetCount, meaningful };
  }

  // 排除「母语专属脚本」字符（母语解释部分不参与占比判定）
  const nset = scriptsForLang(nativeLang) || [];
  const nativeOnly = nset.filter((k) => !tset.includes(k));
  const excluded = nativeOnly.reduce((s, k) => s + c[k], 0);
  const denom = meaningful - excluded;
  const ratio = denom > 0 ? targetCount / denom : 1;

  return { mismatch: ratio < TARGET_LANG_MIN_RATIO, ratio, targetCount, meaningful };
}

/**
 * 轻量语种识别（保留：仅用于 reason 描述与向后兼容导出，不再用于合规判定主逻辑）
 * 返回: 'ja' | 'ko' | 'zh' | 'en' | 'other'
 */
function detectLanguage(text) {
  if (!text) return 'other';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja'; // 平假名 / 片假名
  if (/[\uac00-\ud7a3]/.test(text)) return 'ko'; // 谚文
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // CJK 汉字
  if (/[A-Za-z]/.test(text)) return 'en'; // 拉丁字母
  return 'other';
}

function _matchSensitive(text) {
  const violations = [];
  for (const p of SENSITIVE_PATTERNS) {
    if (p.pattern.test(text || '')) violations.push({ reason: p.reason, retry: p.retry });
  }
  return violations;
}

function getLanguageGuard() {
  return {
    validateInput(text, _ctx) {
      const violations = _matchSensitive(text);
      return { violationCount: violations.length, violations };
    },
    /**
     * 输出校验（GAP-04 拦截 + 根因重构：目标语字符占比校验）
     * @param {string} text AI 输出
     * @param {Object} ctx 语言上下文（含 primaryTargetLanguage、nativeLanguage）
     * @param {string} scene 场景
     * @returns {{valid:boolean, needsRetry:boolean, violations:Array, langMismatch:boolean, reason:string}}
     */
    validateOutput(text, ctx, scene) {
      const violations = _matchSensitive(text);
      const expectedLang = ctx && ctx.primaryTargetLanguage;
      const nativeLang = ctx && ctx.nativeLanguage;
      let langMismatch = false;
      let compliance = null;
      if (expectedLang && scene && (scene === 'conversation' || scene === 'translate')) {
        compliance = evaluateLangCompliance(text, expectedLang, nativeLang);
        langMismatch = compliance.mismatch;
      }
      const valid = violations.length === 0 && !langMismatch;
      const needsRetry = violations.some((v) => v.retry);
      const reasonParts = [];
      if (violations.length) reasonParts.push(violations.map((v) => v.reason).join('; '));
      if (langMismatch) {
        const pct = compliance ? Math.round(compliance.ratio * 100) : 0;
        reasonParts.push(`输出语种不匹配：期望 ${expectedLang}，目标语字符占比 ${pct}%（阈值 ${TARGET_LANG_MIN_RATIO * 100}%）`);
      }
      return { valid, needsRetry, violations, langMismatch, reason: reasonParts.join('; ') };
    },
  };
}

module.exports = {
  getLanguageGuard,
  validateInput: (t) => ({ violationCount: _matchSensitive(t).length, violations: _matchSensitive(t) }),
  validateOutput: (t, ctx, scene) => getLanguageGuard().validateOutput(t, ctx, scene),
  detectLanguage,
  evaluateLangCompliance,
  extractContent,
  scriptsForLang,
  LangOutputMismatchError,
};
