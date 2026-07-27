const prisma = require('../config/database');
const contextResolver = require('./contextResolver');

class VocabularyService {
  async _userLang(userId) {
    try { const ctx = await contextResolver.resolve(userId); return ctx.targetLanguage || 'ja'; }
    catch (e) { return 'ja'; }
  }
  async addWord(userId, item) {
    const isWord = item.type !== 'sentence';
    const text = (isWord ? (item.word || '') : (item.sentence || '')).trim();
    if (!text) { const e = new Error(isWord ? 'word required' : 'sentence required'); e.status = 400; e.code = 'INVALID_ITEM'; throw e; }
    const lang = item.lang || (await this._userLang(userId));
    const reading = item.reading || '';
    const meaning = item.meaning || '';
    const rqType = isWord ? 'word' : 'sentence';
    const lcType = isWord ? 'vocabulary' : 'grammar';
    const jsonPath = isWord ? ['word'] : ['sentence'];
    // ReviewQueue 与 LearningContent 无 Prisma 关联，两段查询去重
    const candidates = await prisma.learningContent.findMany({
      where: { contentType: lcType, sourceLanguage: lang, contentData: { path: jsonPath, equals: text } },
      select: { id: true },
    });
    if (candidates.length > 0) {
      const owned = await prisma.reviewQueue.findFirst({
        where: { userId, contentType: rqType, contentId: { in: candidates.map((c) => c.id) } },
      });
      if (owned) return { contentId: owned.contentId, reviewQueueId: owned.id, dueDate: owned.dueDate, existed: true };
    }
    const contentData = isWord
      ? { origin: item.origin || 'manual', word: text, reading, meaning }
      : { origin: item.origin || 'manual', sentence: text, reading, meaning };
    // 复用已有内容（单源），无则创建
    let content = candidates.length > 0 ? { id: candidates[0].id } : null;
    if (!content) {
      content = await prisma.learningContent.create({
        data: {
          contentType: lcType,
          sourceType: item.sourceType || 'MANUAL',
          sourceLanguage: lang, targetLanguage: lang, explanationLanguage: item.nativeLang || lang,
          status: 'published', qualityScore: 80, contentData,
        },
      });
    }
    const queue = await prisma.reviewQueue.create({ data: { userId, contentId: content.id, contentType: rqType } });
    return { contentId: content.id, reviewQueueId: queue.id, dueDate: queue.dueDate, existed: false };
  }
  async listWords(userId, { lang } = {}) {
    const rows = await prisma.reviewQueue.findMany({ where: { userId, contentType: 'word' }, orderBy: { createdAt: 'desc' } });
    if (rows.length === 0) return [];
    const contents = await prisma.learningContent.findMany({
      where: { id: { in: rows.map((r) => r.contentId) }, contentType: 'vocabulary' },
    });
    const byId = new Map(contents.map((c) => [c.id, c]));
    return rows
      .filter((r) => byId.has(r.contentId))
      .filter((r) => !lang || byId.get(r.contentId).sourceLanguage === lang)
      .map((r) => {
        const c = byId.get(r.contentId);
        return {
          id: r.contentId,
          word: c.contentData && c.contentData.word,
          reading: c.contentData && c.contentData.reading,
          meaning: c.contentData && c.contentData.meaning,
          lang: c.sourceLanguage, dueDate: r.dueDate, createdAt: r.createdAt,
        };
      });
  }
  async deleteWord(userId, contentId) {
    const del = await prisma.reviewQueue.deleteMany({ where: { userId, contentId, contentType: 'word' } });
    return { deleted: del.count };
  }
  async batchSync(userId, items = []) {
    let added = 0, skipped = 0;
    for (const it of items) {
      try { const r = await this.addWord(userId, it); if (r.existed) skipped++; else added++; }
      catch (e) { skipped++; }
    }
    return { total: items.length, added, skipped };
  }
}

let instance = null;
function getVocabularyService() { if (!instance) instance = new VocabularyService(); return instance; }
module.exports = { VocabularyService, getVocabularyService };
