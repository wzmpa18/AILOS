/**
 * src/server/services/vocabularyService.js
 * 词汇学习全链路服务层（真实落库，无任何假数据）
 *
 * 依赖模型：VocabularyWord / VocabularyProgress / VocabularyDailyStat
 * 复用模型：LearningProgress（进度/连续天数）、WrongQuestion（错题）、User.xp（经验）
 */

const prisma = require('../../config/database');

const LEVELS = ['beginner', 'intermediate', 'advanced'];
// 相邻难度降级顺序：当前难度词量不足时按此顺序补齐
const LEVEL_FALLBACK = {
  beginner: ['beginner', 'intermediate', 'advanced'],
  intermediate: ['intermediate', 'beginner', 'advanced'],
  advanced: ['advanced', 'intermediate', 'beginner'],
};

// 前端可能传中文/别名，统一归一化
const LEVEL_ALIAS = {
  初级: 'beginner',
  中级: 'intermediate',
  高级: 'advanced',
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  easy: 'beginner',
  medium: 'intermediate',
  hard: 'advanced',
  A1: 'beginner',
  A2: 'beginner',
  B1: 'intermediate',
  B2: 'intermediate',
  C1: 'advanced',
  C2: 'advanced',
};

const XP_PER_CORRECT = 10;
const XP_PER_WRONG = 2;
const MASTER_THRESHOLD = 2; // 累计答对 2 次判定掌握
const MAX_LIVES = 5;

function normalizeLevel(level) {
  if (!level) return 'beginner';
  return LEVEL_ALIAS[String(level).trim()] || 'beginner';
}

function normalizeLang(lang) {
  if (!lang) return 'ja';
  return String(lang).trim().toLowerCase().slice(0, 8);
}

/** 今天 00:00（服务器本地时区）的 Date，用于 @db.Date 唯一键 */
function todayDate() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 抽题：按难度随机抽取，本次不重复；不足自动降级到相邻难度补齐
 */
async function getQuestions({ userId, lang, level, type = 'choice', limit = 10 }) {
  const language = normalizeLang(lang);
  const lv = normalizeLevel(level);
  const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 30);
  const qType = type === 'spell' ? 'spell' : 'choice';

  // 读取该用户在此语言下的既有学习进度，用于「学习优先级」排序。
  // 纯随机抽题会导致同一个词极难被重复抽中，掌握度（需答对 MASTER_THRESHOLD 次）
  // 几乎永远无法达成，进度条长期停在 0，这里必须按学习状态分层。
  const progressRows = await prisma.vocabularyProgress.findMany({
    where: { userId, language },
    select: { wordId: true, correctCount: true, mastered: true },
  });
  const progressMap = new Map(progressRows.map((p) => [p.wordId, p]));

  const picked = [];
  const pickedIds = new Set();
  // 兜底池：已掌握的词，只有在未学/未掌握的词不够时才拿来补齐
  const masteredBackup = [];

  for (const tryLevel of LEVEL_FALLBACK[lv]) {
    if (picked.length >= n) break;
    const pool = await prisma.vocabularyWord.findMany({
      where: { language, level: tryLevel, isActive: true },
      select: { id: true, word: true, phonetic: true, meaning: true, example: true, exampleMeaning: true, level: true },
    });

    // 分层：0=从未学过（最优先）1=学过但未掌握 2=已掌握（兜底）
    const fresh = [];
    const learning = [];
    for (const w of shuffle(pool)) {
      const p = progressMap.get(w.id);
      if (!p) fresh.push(w);
      else if (!p.mastered) learning.push(w);
      else masteredBackup.push(w);
    }
    // 未掌握的词里，答对次数越少越优先（离掌握越远越该练）
    learning.sort((a, b) => {
      const ca = (progressMap.get(a.id) || {}).correctCount || 0;
      const cb = (progressMap.get(b.id) || {}).correctCount || 0;
      return ca - cb;
    });

    for (const w of [...learning, ...fresh]) {
      if (picked.length >= n) break;
      if (pickedIds.has(w.id)) continue;
      pickedIds.add(w.id);
      picked.push(w);
    }
  }

  // 未学/未掌握的词已抽尽仍不足 n 题时，用已掌握的词复习补齐
  for (const w of shuffle(masteredBackup)) {
    if (picked.length >= n) break;
    if (pickedIds.has(w.id)) continue;
    pickedIds.add(w.id);
    picked.push(w);
  }

  if (picked.length === 0) {
    return { language, level: lv, type: qType, questions: [] };
  }

  // 干扰项池：优先取「同难度」同语言其他词的释义，保证干扰项难度贴合当前关卡；
  // 同难度不足时再降级到全语言词库补齐（避免初级题混入高级抽象词，选项一眼可排除）。
  const pickedLevels = Array.from(new Set(picked.map((w) => w.level)));
  const sameLevelPool = await prisma.vocabularyWord.findMany({
    where: { language, isActive: true, level: { in: pickedLevels }, id: { notIn: Array.from(pickedIds) } },
    select: { meaning: true, level: true },
    take: 300,
  });
  const anyLevelPool = await prisma.vocabularyWord.findMany({
    where: { language, isActive: true, id: { notIn: Array.from(pickedIds) } },
    select: { meaning: true, level: true },
    take: 300,
  });
  const poolByLevel = {};
  for (const row of sameLevelPool) {
    if (!row.meaning) continue;
    (poolByLevel[row.level] = poolByLevel[row.level] || []).push(row.meaning);
  }
  const fallbackMeanings = shuffle(anyLevelPool.map((d) => d.meaning).filter(Boolean));

  const questions = picked.map((w) => {
    // 安全：答题阶段绝不下发正确答案。
    //   - 不返回 meaning（正确释义）
    //   - 不返回 answer（正确项下标 / 正确拼写）
    // 判分完全在服务端进行，正确答案随 submit 响应的 correctAnswer 一并返回。
    const base = {
      id: w.id,
      word: w.word,
      phonetic: w.phonetic || '',
      level: w.level,
      example: w.example || '',
      exampleMeaning: w.exampleMeaning || '',
      type: qType,
    };

    if (qType === 'spell') {
      // 拼写题：给释义拼单词。此处 meaning 是题干（必须下发），答案是 word，故隐藏 word。
      return {
        id: w.id,
        meaning: w.meaning,
        phonetic: w.phonetic || '',
        level: w.level,
        exampleMeaning: w.exampleMeaning || '',
        type: qType,
        options: [],
      };
    }

    // 选择题：正确释义 + 3 个干扰释义（同难度优先）
    const wrongs = [];
    const used = new Set([w.meaning]);
    const sameLevel = shuffle(poolByLevel[w.level] || []);
    for (const m of sameLevel) {
      if (wrongs.length >= 3) break;
      if (!m || used.has(m)) continue;
      used.add(m);
      wrongs.push(m);
    }
    for (const m of fallbackMeanings) {
      if (wrongs.length >= 3) break;
      if (!m || used.has(m)) continue;
      used.add(m);
      wrongs.push(m);
    }
    // 极端情况（词库过小）：宁可减少选项数量，也不造假占位
    const options = shuffle([w.meaning, ...wrongs]);
    return { ...base, options };
  });

  return { language, level: lv, type: qType, questions };
}

/** 读取或创建 LearningProgress */
async function ensureLearningProgress(userId, language) {
  let lp = await prisma.learningProgress.findUnique({
    where: { userId_language: { userId, language } },
  });
  if (!lp) {
    lp = await prisma.learningProgress.create({
      data: { userId, language, level: 'A1' },
    });
  }
  return lp;
}

/** 计算连续学习天数（基于 lastStudyDate） */
function calcStreak(lp) {
  const today = todayDate().getTime();
  const oneDay = 86400000;
  if (!lp.lastStudyDate) return 1;
  const last = new Date(lp.lastStudyDate);
  const lastDay = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const diff = Math.round((today - lastDay) / oneDay);
  if (diff === 0) return lp.currentStreak || 1; // 今天已学过
  if (diff === 1) return (lp.currentStreak || 0) + 1; // 昨天学过，连上
  return 1; // 断签，重新计数
}

/** 错题写入/更新（同用户同词只累加次数，不重复新增） */
async function upsertWrongQuestion({ userId, language, word, meaning, userAnswer, correctAnswer, questionType }) {
  const existing = await prisma.wrongQuestion.findFirst({
    where: { userId, language, sentence: word, questionType },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return prisma.wrongQuestion.update({
      where: { id: existing.id },
      data: {
        reviewCount: { increment: 1 },
        userAnswer: userAnswer == null ? existing.userAnswer : String(userAnswer),
        correctAnswer: correctAnswer == null ? existing.correctAnswer : String(correctAnswer),
        reviewedAt: new Date(),
        reviewedCorrect: false,
      },
    });
  }

  return prisma.wrongQuestion.create({
    data: {
      userId,
      language,
      questionType,
      sentence: word,
      meaning: meaning || null,
      userAnswer: userAnswer == null ? null : String(userAnswer),
      correctAnswer: correctAnswer == null ? null : String(correctAnswer),
      reviewCount: 1,
      reviewedCorrect: false,
    },
  });
}

/** 错题上限：单用户单语言 50 条，超出删最早 */
const WRONG_LIMIT = 50;
async function enforceWrongLimit(userId, language) {
  const count = await prisma.wrongQuestion.count({ where: { userId, language } });
  if (count <= WRONG_LIMIT) return 0;
  const overflow = count - WRONG_LIMIT;
  const oldest = await prisma.wrongQuestion.findMany({
    where: { userId, language },
    orderBy: { createdAt: 'asc' },
    take: overflow,
    select: { id: true },
  });
  if (oldest.length === 0) return 0;
  await prisma.wrongQuestion.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
  return oldest.length;
}

/** 答对时移出错题本（同词） */
async function resolveWrongQuestion(userId, language, word) {
  const rows = await prisma.wrongQuestion.findMany({
    where: { userId, language, sentence: word },
    select: { id: true },
  });
  if (rows.length === 0) return 0;
  await prisma.wrongQuestion.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  return rows.length;
}

/**
 * 提交答题：判分 + 全量落库
 */
async function submitAnswer({ userId, questionId, userAnswer, lang, level, timeCost, fromReview = false }) {
  const word = await prisma.vocabularyWord.findUnique({ where: { id: questionId } });
  if (!word) {
    const err = new Error('题目不存在');
    err.statusCode = 404;
    err.code = 'QUESTION_NOT_FOUND';
    throw err;
  }

  const language = normalizeLang(lang || word.language);
  const lv = normalizeLevel(level || word.level);
  const seconds = Math.min(Math.max(parseInt(timeCost, 10) || 0, 0), 600);

  // 判分：统一按「文本内容」比对。
  // 选择题：前端回传所选选项的释义文本；拼写题：前端回传拼写的单词。
  // 服务端不接受纯索引，避免选项乱序导致误判（选项顺序由服务端随机生成且不落库）。
  const raw = userAnswer == null ? '' : String(userAnswer).trim();
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');
  const isCorrect =
    raw !== '' && (norm(raw) === norm(word.meaning) || norm(raw) === norm(word.word));

  const now = new Date();
  const xpGain = isCorrect ? XP_PER_CORRECT : XP_PER_WRONG;

  // ---- 落库（事务保证一致性）----
  const result = await prisma.$transaction(async (tx) => {
    // 1) 单词掌握度
    const vp = await tx.vocabularyProgress.findUnique({
      where: { userId_wordId: { userId, wordId: word.id } },
    });
    let correctCount = isCorrect ? 1 : 0;
    let wrongCount = isCorrect ? 0 : 1;
    if (vp) {
      correctCount = vp.correctCount + (isCorrect ? 1 : 0);
      wrongCount = vp.wrongCount + (isCorrect ? 0 : 1);
      await tx.vocabularyProgress.update({
        where: { id: vp.id },
        data: {
          correctCount,
          wrongCount,
          mastered: correctCount >= MASTER_THRESHOLD,
          lastSeenAt: now,
          language,
        },
      });
    } else {
      await tx.vocabularyProgress.create({
        data: {
          userId,
          wordId: word.id,
          language,
          correctCount,
          wrongCount,
          mastered: correctCount >= MASTER_THRESHOLD,
          lastSeenAt: now,
        },
      });
    }

    // 2) 每日统计
    const statDate = todayDate();
    const stat = await tx.vocabularyDailyStat.findUnique({
      where: { userId_language_statDate: { userId, language, statDate } },
    });
    if (stat) {
      await tx.vocabularyDailyStat.update({
        where: { id: stat.id },
        data: {
          studySeconds: stat.studySeconds + seconds,
          answered: stat.answered + 1,
          correct: stat.correct + (isCorrect ? 1 : 0),
          xpGained: stat.xpGained + xpGain,
        },
      });
    } else {
      await tx.vocabularyDailyStat.create({
        data: {
          userId,
          language,
          statDate,
          studySeconds: seconds,
          answered: 1,
          correct: isCorrect ? 1 : 0,
          xpGained: xpGain,
        },
      });
    }

    // 3) 用户经验
    const user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpGain } },
      select: { xp: true },
    });

    // 4) LearningProgress（掌握数 / 时长 / 连续天数）
    let lp = await tx.learningProgress.findUnique({
      where: { userId_language: { userId, language } },
    });
    if (!lp) {
      lp = await tx.learningProgress.create({ data: { userId, language, level: 'A1' } });
    }
    const masteredTotal = await tx.vocabularyProgress.count({
      where: { userId, language, mastered: true },
    });
    const streak = calcStreak(lp);
    lp = await tx.learningProgress.update({
      where: { id: lp.id },
      data: {
        totalWords: masteredTotal,
        totalTime: lp.totalTime + Math.round(seconds / 60),
        currentStreak: streak,
        longestStreak: Math.max(lp.longestStreak || 0, streak),
        lastStudyDate: now,
      },
    });

    return { user, lp, masteredTotal, streak };
  });

  // ---- 错题本（事务外，避免长事务）----
  let wrongDelta = 0;
  if (isCorrect) {
    if (fromReview) {
      wrongDelta = -(await resolveWrongQuestion(userId, language, word.word));
    }
  } else {
    await upsertWrongQuestion({
      userId,
      language,
      word: word.word,
      meaning: word.meaning,
      userAnswer: raw,
      correctAnswer: word.meaning,
      questionType: 'vocab_choice',
    });
    await enforceWrongLimit(userId, language);
    wrongDelta = 1;
  }

  const wrongTotal = await prisma.wrongQuestion.count({ where: { userId, language } });
  const totalWords = await prisma.vocabularyWord.count({ where: { language, level: lv, isActive: true } });

  return {
    isCorrect,
    correctAnswer: word.meaning,
    word: word.word,
    phonetic: word.phonetic || '',
    example: word.example || '',
    exampleMeaning: word.exampleMeaning || '',
    explanation: isCorrect
      ? `回答正确！「${word.word}」的意思是「${word.meaning}」。`
      : `回答错误。「${word.word}」的正确释义是「${word.meaning}」${word.example ? `，例：${word.example}` : ''}`,
    xpGained: xpGain,
    xp: result.user.xp,
    userLevel: Math.floor(result.user.xp / 100) + 1,
    currentLevel: result.lp.level,
    learnedWords: result.masteredTotal,
    totalWords,
    streakDays: result.streak,
    wrongTotal,
    wrongDelta,
    maxLives: MAX_LIVES,
  };
}

/**
 * 游客错题合并入库（登录后调用）
 * items: [{ word, meaning, questionType?, language? }]
 * 规则：同用户同语言同词去重累加；超限 50 条覆盖最早；以客户端传入 language 为准，缺省回退当前语言
 */
async function mergeGuestWrongQuestions({ userId, language, items }) {
  if (!Array.isArray(items) || items.length === 0) return { merged: 0 };
  const baseLang = normalizeLang(language);
  let merged = 0;

  for (const it of items) {
    const word = (it.word || '').toString().trim();
    if (!word) continue;
    const lang = normalizeLang(it.language || baseLang);
    const meaning = it.meaning != null ? String(it.meaning) : null;
    const qType = it.questionType || 'vocab_choice';

    const existing = await prisma.wrongQuestion.findFirst({
      where: { userId, language: lang, sentence: word, questionType: qType },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      await prisma.wrongQuestion.update({
        where: { id: existing.id },
        data: {
          reviewCount: { increment: 1 },
          meaning: meaning == null ? existing.meaning : meaning,
          reviewedAt: new Date(),
          reviewedCorrect: false,
        },
      });
    } else {
      await prisma.wrongQuestion.create({
        data: {
          userId,
          language: lang,
          questionType: qType,
          sentence: word,
          meaning,
          reviewedCorrect: false,
          reviewCount: 1,
        },
      });
    }
    merged++;
    await enforceWrongLimit(userId, lang);
  }

  return { merged };
}

/** 学习进度查询 */
async function getProgress({ userId, lang, level }) {
  const language = normalizeLang(lang);
  const lv = normalizeLevel(level);

  const lp = await prisma.learningProgress.findUnique({
    where: { userId_language: { userId, language } },
  });

  const [learnedWords, totalWords, totalAllWords, user, stat, wrongTotal] = await Promise.all([
    prisma.vocabularyProgress.count({ where: { userId, language, mastered: true } }),
    prisma.vocabularyWord.count({ where: { language, level: lv, isActive: true } }),
    prisma.vocabularyWord.count({ where: { language, isActive: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
    prisma.vocabularyDailyStat.findUnique({
      where: { userId_language_statDate: { userId, language, statDate: todayDate() } },
    }),
    prisma.wrongQuestion.count({ where: { userId, language } }),
  ]);

  const xp = user ? user.xp : 0;
  const todayMinutes = stat ? Math.round(stat.studySeconds / 60) : 0;

  return {
    language,
    level: lv,
    currentLevel: lp ? lp.level : 'A1',
    learnedWords,
    totalWords,
    totalAllWords,
    progressPercent: totalWords > 0 ? Math.min(100, Math.round((learnedWords / totalWords) * 100)) : 0,
    todayMinutes,
    todayAnswered: stat ? stat.answered : 0,
    todayCorrect: stat ? stat.correct : 0,
    streakDays: lp ? lp.currentStreak : 0,
    longestStreak: lp ? lp.longestStreak : 0,
    xp,
    userLevel: Math.floor(xp / 100) + 1,
    wrongTotal,
    maxLives: MAX_LIVES,
  };
}

module.exports = {
  LEVELS,
  MAX_LIVES,
  WRONG_LIMIT,
  normalizeLang,
  normalizeLevel,
  getQuestions,
  submitAnswer,
  getProgress,
  ensureLearningProgress,
  upsertWrongQuestion,
  enforceWrongLimit,
  resolveWrongQuestion,
  mergeGuestWrongQuestions,
  todayDate,
};
