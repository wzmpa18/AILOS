/**
 * src/server/controllers/vocabularyController.js
 * 词汇学习全链路控制器
 */

const vocabularyService = require('../services/vocabularyService');
const prisma = require('../../config/database');

function ok(res, data) {
  return res.json({ success: true, data });
}

function fail(res, status, code, message) {
  return res.status(status).json({ success: false, code, error: message, message });
}

/** GET /api/v1/practice/questions */
async function getQuestions(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const { lang, level, type, limit } = req.query;
    const result = await vocabularyService.getQuestions({
      userId,
      lang,
      level,
      type,
      limit,
    });

    if (!result.questions.length) {
      return fail(res, 404, 'NO_QUESTIONS', `暂无 ${result.language} 语言的词库数据`);
    }

    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/practice/submit */
async function submitAnswer(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const { questionId, userAnswer, lang, level, timeCost, fromReview } = req.body || {};
    if (!questionId) return fail(res, 400, 'MISSING_QUESTION_ID', 'questionId 不能为空');

    const result = await vocabularyService.submitAnswer({
      userId,
      questionId,
      userAnswer,
      lang,
      level,
      timeCost,
      fromReview: fromReview === true || fromReview === 'true',
    });

    return ok(res, result);
  } catch (err) {
    if (err.statusCode) return fail(res, err.statusCode, err.code || 'ERROR', err.message);
    return next(err);
  }
}

/** GET /api/v1/practice/progress */
async function getProgress(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const { lang, level } = req.query;
    const result = await vocabularyService.getProgress({ userId, lang, level });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

// ==================== 错题本（第二优先级）====================

/** GET /api/v1/reviews/wrong-questions */
async function listWrongQuestions(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const language = vocabularyService.normalizeLang(req.query.lang);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 50);

    const where = { userId, language };
    const [total, rows] = await Promise.all([
      prisma.wrongQuestion.count({ where }),
      prisma.wrongQuestion.findMany({
        where,
        orderBy: [{ reviewedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const words = await prisma.vocabularyWord.findMany({
      where: { language, word: { in: rows.map((r) => r.sentence) }, isActive: true },
      select: { word: true, phonetic: true },
    });
    const phoneticMap = {};
    for (const w of words) phoneticMap[w.word] = w.phonetic || '';

    const items = rows.map((r) => ({
      id: r.id,
      word: r.sentence,
      phonetic: phoneticMap[r.sentence] || '',
      meaning: r.meaning || r.correctAnswer || '',
      correctAnswer: r.correctAnswer || r.meaning || '',
      userAnswer: r.userAnswer || '',
      wrongCount: r.reviewCount || 1,
      lastWrongAt: r.reviewedAt || r.createdAt,
      questionType: r.questionType,
      language: r.language,
      createdAt: r.createdAt,
    }));

    return ok(res, {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      limit: vocabularyService.WRONG_LIMIT,
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/v1/reviews/wrong-questions/:id */
async function deleteWrongQuestion(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const { id } = req.params;
    const row = await prisma.wrongQuestion.findUnique({ where: { id } });
    if (!row) return fail(res, 404, 'NOT_FOUND', '错题不存在');
    if (row.userId !== userId) return fail(res, 403, 'FORBIDDEN', '无权操作该错题');

    await prisma.wrongQuestion.delete({ where: { id } });
    return ok(res, { id, deleted: true });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/v1/reviews/wrong-questions —— 清空 */
async function clearWrongQuestions(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const language = vocabularyService.normalizeLang(req.query.lang || (req.body && req.body.lang));
    const r = await prisma.wrongQuestion.deleteMany({ where: { userId, language } });
    return ok(res, { deleted: r.count, language });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/reviews/practice —— 错题重练组卷 */
async function buildReviewPractice(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const body = req.body || {};
    const language = vocabularyService.normalizeLang(body.lang || req.query.lang);
    const limit = Math.min(Math.max(parseInt(body.limit, 10) || 10, 1), 30);

    const wrongs = await prisma.wrongQuestion.findMany({
      where: { userId, language },
      orderBy: [{ reviewCount: 'desc' }, { reviewedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    if (wrongs.length === 0) {
      return fail(res, 404, 'NO_WRONG_QUESTIONS', '错题本为空，先去练习吧');
    }

    // 错题的 sentence 字段存的是单词，回查词库拿到完整题目
    const words = await prisma.vocabularyWord.findMany({
      where: { language, word: { in: wrongs.map((w) => w.sentence) }, isActive: true },
    });
    if (words.length === 0) {
      return fail(res, 404, 'NO_QUESTIONS', '错题对应的词库数据不存在');
    }

    const shuffled = words.sort(() => Math.random() - 0.5).slice(0, limit);
    const pickedIds = shuffled.map((w) => w.id);

    const distractors = await prisma.vocabularyWord.findMany({
      where: { language, isActive: true, id: { notIn: pickedIds } },
      select: { meaning: true },
      take: 200,
    });
    const pool = distractors.map((d) => d.meaning).sort(() => Math.random() - 0.5);

    const questions = shuffled.map((w) => {
      const used = new Set([w.meaning]);
      const wrongOpts = [];
      for (const m of pool) {
        if (wrongOpts.length >= 3) break;
        if (!m || used.has(m)) continue;
        used.add(m);
        wrongOpts.push(m);
      }
      const options = [w.meaning, ...wrongOpts].sort(() => Math.random() - 0.5);
      return {
        id: w.id,
        word: w.word,
        phonetic: w.phonetic || '',
        meaning: w.meaning,
        level: w.level,
        example: w.example || '',
        exampleMeaning: w.exampleMeaning || '',
        type: 'choice',
        options,
        answer: options.indexOf(w.meaning),
      };
    });

    return ok(res, { language, type: 'choice', fromReview: true, questions });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/v1/reviews/wrong-questions/merge-guest —— 游客错题合并入库 */
async function mergeGuestWrongQuestions(req, res, next) {
  try {
    const userId = req.userId || (req.user && req.user.id);
    if (!userId) return fail(res, 401, 'UNAUTHORIZED', '请先登录');

    const body = req.body || {};
    const language = vocabularyService.normalizeLang(body.lang);
    const items = Array.isArray(body.items) ? body.items : [];
    const result = await vocabularyService.mergeGuestWrongQuestions({ userId, language, items });
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getQuestions,
  submitAnswer,
  getProgress,
  listWrongQuestions,
  deleteWrongQuestion,
  clearWrongQuestions,
  buildReviewPractice,
  mergeGuestWrongQuestions,
};
