const { prisma } = require('../config/database');
const { getContextResolver } = require('../utils/contextResolver');

class VocabularyService {
  async _userLang(userId) {
    try { const ctx = await getContextResolver().resolve(userId); return ctx.targetLanguage || 'ja'; }
    catch (e) { return 'ja'; }
  }
  async addWord(userId, item) {
    const isWord = item.type !== 'sentence';
    const text = (isWord ? (item.word || '') : (item.sentence || '')).trim();
    if (!text) { const e = new Error(isWord ? 'word required' : 'sentence required'); e.status = 400; e.code = 'INVALID_ITEM'; throw e; }
    const lang = item.lang || (await this._userLang(userId));
    const reading = item.reading || '';
    const meaning = item.meaning || '';
    const owned = await prisma.reviewQueue.findFirst({
      where: { userId, contentType: isWord ? 'word' : 'sentence',
        content: { contentType: 'vocabulary', sourceLanguage: lang, contentData: { path: ['word'], equals: text } } },
      include: { content: true },
    });
    if (owned) return { contentId: owned.contentId, reviewQueueId: owned.id, dueDate: owned.dueDate, existed: true };
    const contentData = isWord
      ? { origin: item.origin || 'manual', word: text, reading, meaning }
      : { origin: item.origin || 'manual', sentence: text, reading, meaning };
    const content = await prisma.learningContent.create({
      data: {
        contentType: isWord ? 'vocabulary' : 'grammar',
        sourceType: item.sourceType || 'MANUAL',
        sourceLanguage: lang, targetLanguage: lang, explanationLanguage: item.nativeLang || lang,
        status: 'published', qualityScore: 80, contentData,
      },
    });
    const queue = await prisma.reviewQueue.create({ data: { userId, contentId: content.id, contentType: isWord ? 'word' : 'sentence' } });
    return { contentId: content.id, reviewQueueId: queue.id, dueDate: queue.dueDate, existed: false };
  }
  async listWords(userId, { lang } = {}) {
    const rows = await prisma.reviewQueue.findMany({ where: { userId, contentType: 'word' }, include: { content: true }, orderBy: { createdAt: 'desc' } });
    return rows
      .filter((r) => r.content && r.content.contentType === 'vocabulary')
      .filter((r) => !lang || r.content.sourceLanguage === lang)
      .map((r) => ({
        id: r.contentId,
        word: r.content.contentData && r.content.contentData.word,
        reading: r.content.contentData && r.content.contentData.reading,
        meaning: r.content.contentData && r.content.contentData.meaning,
        lang: r.content.sourceLanguage, dueDate: r.dueDate, createdAt: r.createdAt,
      }));
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
