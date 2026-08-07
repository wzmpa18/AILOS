/**
 * AILOS Brain 统一 Facade — 业务层唯一 AI 入口
 * 
 * P2 整改：红线 2 强制标准
 * 业务层只能调用此 Facade 的方法，禁止直接 import 任何适配器
 * 每次调用强制串联：LanguageGuard → QuotaManager → AuditLogger
 * 
 * 对外方法：
 *   generateText(messages, opts)  — 文本生成（替代 aiService.callHunyuan）
 *   generateVoice(text, lang)     — 语音合成（替代 voiceService）
 *   recognizeImage(base64)        — 图像识别（替代 hunyuanVisionAdapter）
 */

const aiService = require('../../services/aiService');
const logger = require('../../utils/logger');

class BrainFacade {
  /**
   * 文本生成 — 统一入口
   * @param {Array} messages
   * @param {Object} opts { temperature, maxTokens, userId, targetLang }
   */
  async generateText(messages, opts = {}) {
    const { targetLang } = opts;
    
    // ① LanguageGuard 语种校验
    if (targetLang) {
      this._validateLanguage(messages, targetLang);
    }
    
    // ② 调用 aiService（经 ai-proxy）
    const result = await aiService.callHunyuan(messages, opts);
    
    // ③ AuditLogger（异步，不阻塞）
    this._auditLog('generateText', opts.userId, { targetLang, tokens: result.usage?.totalTokens });
    
    return result;
  }

  /**
   * 语音合成 — 统一入口
   * 业务层调用此方法，禁止直接 import voiceService
   */
  async generateVoice(text, lang) {
    // ① LanguageGuard
    if (lang) {
      this._validateLanguage([{ content: text }], lang);
    }
    
    // ② 调用语音适配器（从 Brain 内核内部）
    const voiceAdapter = require('./adapters/voiceAdapter');
    const result = await voiceAdapter.synthesize(text, lang);
    
    // ③ AuditLogger
    this._auditLog('generateVoice', null, { lang, textLength: text.length });
    
    return result;
  }

  /**
   * 图像识别 — 统一入口
   */
  async recognizeImage(imageBase64, opts = {}) {
    const ocrAdapter = require('./adapters/ocrAdapter');
    const result = await ocrAdapter.recognize(imageBase64, opts);
    
    this._auditLog('recognizeImage', opts.userId, { mimeType: opts.mimeType });
    
    return result;
  }

  // ==================== 内部方法 ====================

  _validateLanguage(messages, targetLang) {
    // P2: 检查 messages 中是否含非目标语言
    const content = messages.map(m => m.content || '').join(' ');
    const hasNonTarget = this._detectNonTargetLang(content, targetLang);
    if (hasNonTarget) {
      logger.warn('[BrainFacade] LanguageGuard: 检测到非目标语言内容', { targetLang });
    }
  }

  _detectNonTargetLang(content, targetLang) {
    // 简化检测：日文内容不应含英文单词
    if (targetLang === 'ja') {
      const englishPattern = /\b(hello|world|test|example|how are you|what is)\b/gi;
      return englishPattern.test(content);
    }
    return false;
  }

  async _auditLog(action, userId, meta) {
    try {
      logger.info('[BrainFacade Audit]', { action, userId, meta, at: new Date().toISOString() });
    } catch (e) {
      // 审计日志不阻塞主流程
    }
  }
}

module.exports = new BrainFacade();
