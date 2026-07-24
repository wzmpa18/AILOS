/**
 * src/services/languageGuard.js
 * 语言守卫 — 校验 AI 输入输出语言合规性
 * 被 aiGateway.js 引用
 */
const logger = require('../utils/logger');

class LanguageGuard {
  /**
   * 校验输入文本
   * @param {string} text - 输入文本
   * @param {object} languageContext - 语言上下文
   * @returns {{ violations: Array, violationCount: number }}
   */
  validateInput(text, languageContext) {
    const violations = [];

    if (!text || typeof text !== 'string') {
      return { violations, violationCount: 0 };
    }

    // 检查是否包含敏感内容（仅基础校验，不涉及复杂语义）
    const sensitivePatterns = [
      /(?:恋爱|情侣|AI男友|AI女友|情感陪伴|恋爱模拟|暧昧闲聊)/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'sensitive_content',
          detail: 'Input contains restricted content patterns',
        });
      }
    }

    return { violations, violationCount: violations.length };
  }

  /**
   * 校验输出文本
   * @param {string} text - AI 输出文本
   * @param {object} languageContext - 语言上下文
   * @returns {{ valid: boolean, violations: Array, needsRetry: boolean }}
   */
  validateOutput(text, languageContext) {
    const violations = [];
    const expectedLang = languageContext?.explanationLanguage || 'zh-CN';

    if (!text || typeof text !== 'string') {
      return { valid: false, violations: [{ type: 'empty_output' }], needsRetry: false };
    }

    // 检查是否包含敏感内容
    const sensitivePatterns = [
      /(?:恋爱|情侣|AI男友|AI女友|情感陪伴|恋爱模拟|暧昧闲聊)/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'sensitive_content',
          detail: 'Output contains restricted content patterns',
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      needsRetry: violations.length > 0,
    };
  }
}

// 单例
let _instance = null;
function getLanguageGuard() {
  if (!_instance) {
    _instance = new LanguageGuard();
  }
  return _instance;
}

module.exports = { LanguageGuard, getLanguageGuard };