/**
 * src/services/photoTranslateService.js
 * Stage11 子模块1 — 静态拍照翻译编排（宪法 Appendix E + 附件 L）
 *
 * 链路：预扣配额(禁先用后扣) → OCR 适配器识别 → aiGateway 翻译(语言从库解析,前端传参忽略)
 *       → 结构化结果(原文+目标语译文+母语解析+生词/句型) → 计量落库结算
 * 学习联动：生词→LearningContent(vocabulary)+ReviewQueue(word)；句型→grammar/sentence
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const contextResolver = require('./contextResolver');
const { getOcrAdapter } = require('./ocr');
const { getOcrQuotaService } = require('./ocrQuotaService');
const { getAIGateway } = require('./aiGateway');
const { getBillingService } = require('./billingService');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // base64 解码后 5MB 上限

class PhotoTranslateService {
  /**
   * 拍照翻译主流程
   * @param {string} userId
   * @param {{imageBase64:string, mimeType?:string}} input - 前端语言参数一律不收
   */
  async translatePhoto(userId, { imageBase64, mimeType }) {
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      const err = new Error('imageBase64 required');
      err.status = 400; err.code = 'INVALID_IMAGE';
      throw err;
    }
    // 去掉可能的 dataURL 前缀
    const m = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/s);
    if (m) { mimeType = m[1]; imageBase64 = m[2]; }
    const approxBytes = Math.floor(imageBase64.length * 0.75);
    if (approxBytes > MAX_IMAGE_BYTES) {
      const err = new Error('图片超过 5MB 上限');
      err.status = 413; err.code = 'IMAGE_TOO_LARGE';
      throw err;
    }

    // 双语言硬校验（未配置 → LangConfigError → 400 LANG_CONFIG_INCOMPLETE，零兜底）
    const langCtx = await contextResolver.resolve(userId);

    const adapter = getOcrAdapter();
    const quota = getOcrQuotaService();

    // 1) 预扣占坑（超限 403 / 熔断 503，禁先用后扣）
    const logId = await quota.reserve(userId, adapter.provider);
    const started = Date.now();

    try {
      // 2) OCR 识别
      const ocr = await adapter.recognize({ imageBase64, mimeType: mimeType || 'image/jpeg' });
      if (!ocr.text) {
        await quota.settle(logId, { success: false, errorCode: 'NO_TEXT', latencyMs: Date.now() - started });
        const err = new Error('未识别到文字，请对准文字重拍');
        err.status = 422; err.code = 'OCR_NO_TEXT';
        throw err;
      }

      // 3) 翻译时长闸门（调用前校验+扣减；不足 402 拒绝；禁先用后扣）
      const estSec = Math.max(5, Math.ceil(ocr.text.length / 20));
      const billing = await getBillingService().requireTranslationQuota(userId, { scene: 'photo', seconds: estSec });

      // 4) 翻译 + 母语解析（走 AI 网关：语言从库解析、LanguageGuard 输出校验、计量入 aiRequestLog）
      const gateway = getAIGateway();
      const sysPrompt =
        `你是言道翻译引擎。用户母语=${langCtx.nativeLanguage}，目标语言=${langCtx.targetLanguage}。` +
        `对给定原文输出严格 JSON（不要 markdown 代码块）：` +
        `{"translation":"目标语言(${langCtx.targetLanguage})译文","nativeExplanation":"用母语(${langCtx.nativeLanguage})对原文要点/语法/文化背景的简明解析",` +
        `"words":[{"word":"目标语言生词","reading":"读音(可空)","meaning":"母语释义"}],` +
        `"sentences":[{"sentence":"目标语言重点句型","meaning":"母语释义"}]}` +
        ` words 取 3-8 个最有学习价值的词，sentences 取 1-3 句。`;
      // scene=photo_translate：走网关全链路(库解析语言/敏感词校验/计量日志)；
      // skipAsset 跳过资产检索与回存（结构化混语 JSON，不适合资产复用，也避免资产误命中）
      const ai = await gateway.chatWithMessages([
        { role: 'system', content: sysPrompt },
        { role: 'user', content: `原文：\n${ocr.text.slice(0, 3000)}` },
      ], { userId, scene: 'photo_translate', temperature: 0.3, maxTokens: 1500, skipAsset: true });

      const parsed = this._parseResult(ai.content);

      // 4) 结算计量（成功）
      await quota.settle(logId, {
        success: true,
        ocrTextLen: ocr.text.length,
        estCostCny: ocr.unitCostCny || 0,
        latencyMs: Date.now() - started,
      });

      const status = await quota.getStatus(userId);
      return {
        originalText: ocr.text,
        translation: parsed.translation,
        nativeExplanation: parsed.nativeExplanation,
        words: parsed.words,
        sentences: parsed.sentences,
        languageContext: { native: langCtx.nativeLanguage, target: langCtx.targetLanguage },
        ocr: { provider: ocr.provider, confidence: ocr.confidence },
        quota: { dailyFreeLimit: status.dailyFreeLimit, used: status.used, remaining: status.remaining },
        billing: { consumedSec: billing.consumedSec, source: billing.source, balanceAfterSec: billing.balanceAfterSec },
      };
    } catch (err) {
      // OCR/翻译失败 → 释放配额（failed 不计入）
      if (err.code !== 'OCR_NO_TEXT') {
        await quota.settle(logId, {
          success: false,
          errorCode: err.code || 'TRANSLATE_FAILED',
          latencyMs: Date.now() - started,
        });
      }
      throw err;
    }
  }

  _parseResult(content) {
    const fallback = { translation: (content || '').trim(), nativeExplanation: '', words: [], sentences: [] };
    if (!content) return fallback;
    try {
      const jsonStr = content.replace(/^```(json)?/m, '').replace(/```\s*$/m, '').trim();
      const j = JSON.parse(jsonStr);
      return {
        translation: String(j.translation || '').trim() || fallback.translation,
        nativeExplanation: String(j.nativeExplanation || '').trim(),
        words: Array.isArray(j.words) ? j.words.slice(0, 10).map((w) => ({
          word: String(w.word || ''), reading: String(w.reading || ''), meaning: String(w.meaning || ''),
        })).filter((w) => w.word) : [],
        sentences: Array.isArray(j.sentences) ? j.sentences.slice(0, 5).map((s) => ({
          sentence: String(s.sentence || ''), meaning: String(s.meaning || ''),
        })).filter((s) => s.sentence) : [],
      };
    } catch (e) {
      return fallback;
    }
  }

  /**
   * 学习联动：生词入词汇本 / 句型入错题本（LearningContent + ReviewQueue，SRS 复习引擎可见）
   * @param {string} userId
   * @param {{type:'word'|'sentence', word?:string, reading?:string, meaning?:string, sentence?:string}} item
   */
  async addToNotebook(userId, item) {
    const langCtx = await contextResolver.resolve(userId);
    const isWord = item.type !== 'sentence';
    const text = isWord ? (item.word || '').trim() : (item.sentence || '').trim();
    if (!text) {
      const err = new Error(isWord ? 'word required' : 'sentence required');
      err.status = 400; err.code = 'INVALID_ITEM';
      throw err;
    }

    const content = await prisma.learningContent.create({
      data: {
        contentType: isWord ? 'vocabulary' : 'grammar',
        sourceType: 'AI_GENERATED',
        sourceLanguage: langCtx.targetLanguage,
        targetLanguage: langCtx.targetLanguage,
        explanationLanguage: langCtx.nativeLanguage,
        status: 'published',
        qualityScore: 80,
        contentData: {
          origin: 'photo_translate',
          word: isWord ? text : undefined,
          sentence: isWord ? undefined : text,
          reading: item.reading || '',
          meaning: item.meaning || '',
        },
      },
    });
    const queue = await prisma.reviewQueue.create({
      data: {
        userId,
        contentId: content.id,
        contentType: isWord ? 'word' : 'sentence',
      },
    });
    logger.info('PhotoTranslate', '收藏入库', { userId, type: isWord ? 'word' : 'sentence', contentId: content.id });
    return { contentId: content.id, reviewQueueId: queue.id, dueDate: queue.dueDate };
  }
}

let instance = null;
function getPhotoTranslateService() {
  if (!instance) instance = new PhotoTranslateService();
  return instance;
}

module.exports = { PhotoTranslateService, getPhotoTranslateService };
