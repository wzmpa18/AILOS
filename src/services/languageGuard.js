// ============================================================
// src/services/languageGuard.js
// 内容安全 + 语种合规守卫
// GAP-04：从「仅日志告警」升级为「直接拦截丢弃异常输出」
// 兼容现有网关调用：getLanguageGuard() 工厂返回 { validateInput, validateOutput }
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

/**
 * 轻量语种识别（基于 Unicode 字符区间启发式）
 * 返回: 'ja' | 'ko' | 'zh' | 'en' | 'other'
 */
function detectLanguage(text) {
  if (!text) return 'other';
  if (/[぀-ゟ]/.test(text) || /[゠-ヿ]/.test(text)) return 'ja'; // 平假名 / 片假名
  if (/[가-힣]/.test(text)) return 'ko'; // 谚文
  if (/[一-鿿]/.test(text)) return 'zh'; // CJK 汉字
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
    validateInput(text, ctx) {
      const violations = _matchSensitive(text);
      return { violationCount: violations.length, violations };
    },
    /**
     * 输出校验（GAP-04 升级为拦截）
     * @param {string} text AI 输出
     * @param {Object} ctx 语言上下文（含 primaryTargetLanguage）
     * @param {string} scene 场景
     * @returns {{valid:boolean, needsRetry:boolean, violations:Array, langMismatch:boolean, reason:string}}
     */
    validateOutput(text, ctx, scene) {
      const violations = _matchSensitive(text);
      const expectedLang = ctx && ctx.primaryTargetLanguage;
      let langMismatch = false;
      if (expectedLang && scene && (scene === 'conversation' || scene === 'translate')) {
        if (expectedLang === 'en') {
          // 拉丁字母目标语：输出含拉丁字母（例句为英文）即合规；母语解释含中文不致误杀
          langMismatch = !/[A-Za-z]/.test(text || '');
        } else {
          const detected = detectLanguage(text);
          if (detected !== 'other' && detected !== expectedLang) {
            langMismatch = true;
          }
        }
      }
      const valid = violations.length === 0 && !langMismatch;
      const needsRetry = violations.some(v => v.retry);
      const reasonParts = [];
      if (violations.length) reasonParts.push(violations.map(v => v.reason).join('; '));
      if (langMismatch) reasonParts.push(`输出语种不匹配：期望 ${expectedLang}，实际 ${detectLanguage(text)}`);
      return { valid, needsRetry, violations, langMismatch, reason: reasonParts.join('; ') };
    },
  };
}

module.exports = { getLanguageGuard, validateInput: (t) => ({ violationCount: _matchSensitive(t).length, violations: _matchSensitive(t) }), validateOutput: (t, ctx, scene) => getLanguageGuard().validateOutput(t, ctx, scene), detectLanguage, LangOutputMismatchError };
