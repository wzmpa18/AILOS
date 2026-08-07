const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// ============ 获取考试等级列表 ============
router.get('/levels', async (req, res) => {
  try {
    const levels = [
      { language:'ja', level:'N5', name:'JLPT N5', desc:'入门级', questionCount:48, duration:'105分钟', passScore:90, totalScore:180 },
      { language:'ja', level:'N4', name:'JLPT N4', desc:'基础级', questionCount:60, duration:'125分钟', passScore:90, totalScore:180 },
    ];
    res.json({ success:true, data: { levels } });
  } catch(e) { res.status(500).json({ success:false, error:'获取失败' }); }
});

// ============ 开始考试（抽取题目） ============
router.post('/start', authenticate, async (req, res) => {
  try {
    const { language, level } = req.body;
    if (!language || !level) return res.status(400).json({ success:false, error:'请选择语言和等级' });

    const { PrismaClient } = require('@prisma/client');
    const crypto = require('crypto');
    const prisma = new PrismaClient();

    // 检查是否有进行中的考试
    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM exam_record WHERE user_id = $1 AND language = $2 AND level = $3 AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1`,
      req.userId, language, level
    );
    if (existing && existing.length > 0) {
      await prisma.$disconnect();
      return res.json({ success:true, data: { recordId: existing[0].id, resumed: true } });
    }

    const recordId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO exam_record (id, user_id, language, level, status, started_at) VALUES ($1, $2, $3, $4, 'in_progress', NOW())`,
      recordId, req.userId, language, level
    );

    await prisma.$disconnect();
    res.json({ success:true, data: { recordId, resumed: false } });
  } catch(e) { res.status(500).json({ success:false, error:'开始考试失败' }); }
});

// ============ 获取考题（按模块） ============
router.get('/questions', authenticate, async (req, res) => {
  try {
    const { language, level, module } = req.query;
    if (!language || !level) return res.status(400).json({ success:false, error:'缺少参数' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    let query = `SELECT id, language, level, module, question_type, question_number, question_text, options, points FROM exam_question_bank WHERE language = $1 AND level = $2 AND is_active = true`;
    const params = [language, level];
    if (module) { query += ' AND module = $3'; params.push(module); }
    query += ' ORDER BY module, question_number';

    const questions = await prisma.$queryRawUnsafe(query, ...params);
    await prisma.$disconnect();

    const list = (questions || []).map(q => ({
      id: q.id, module: q.module, questionType: q.question_type,
      questionNumber: q.question_number, questionText: q.question_text,
      options: JSON.parse(q.options || '[]'), points: q.points,
    }));

    // 按模块分组
    const grouped = {};
    list.forEach(q => {
      if (!grouped[q.module]) grouped[q.module] = { module: q.module, questions: [], totalPoints: 0 };
      grouped[q.module].questions.push(q);
      grouped[q.module].totalPoints += q.points;
    });

    res.json({ success:true, data: { modules: Object.values(grouped), totalQuestions: list.length } });
  } catch(e) { res.status(500).json({ success:false, error:'获取考题失败' }); }
});

// ============ 提交答案 ============
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { recordId, answers } = req.body;
    if (!recordId || !answers) return res.status(400).json({ success:false, error:'缺少参数' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 获取正确答案
    const questionIds = answers.map(a => a.questionId);
    const correctAnswers = await prisma.$queryRawUnsafe(
      `SELECT id, correct_answer, points, module FROM exam_question_bank WHERE id = ANY($1::uuid[])`,
      questionIds
    );

    const answerMap = {};
    (correctAnswers || []).forEach(c => { answerMap[c.id] = c; });

    // 评分
    let totalScore = 0, vocabScore = 0, grammarScore = 0, readingScore = 0, listeningScore = 0;
    const gradedAnswers = answers.map(a => {
      const correct = answerMap[a.questionId];
      const isCorrect = correct && a.answer === correct.correct_answer;
      const pts = correct ? correct.points : 0;
      if (isCorrect) {
        totalScore += pts;
        if (correct.module === 'vocabulary') vocabScore += pts;
        else if (correct.module === 'grammar_reading') grammarScore += pts;
        else if (correct.module === 'listening') listeningScore += pts;
      }
      return { questionId: a.questionId, answer: a.answer, correct: isCorrect, points: isCorrect ? pts : 0 };
    });

    // 总分换算为180分制
    const maxVocab = 20, maxGrammar = 50, maxListening = 30;
    const scaledVocab = Math.min(60, Math.round(vocabScore / maxVocab * 60));
    const scaledGrammar = Math.min(60, Math.round(grammarScore / maxGrammar * 60));
    const scaledListening = Math.min(60, Math.round(listeningScore / maxListening * 60));
    const scaledTotal = scaledVocab + scaledGrammar + scaledListening;

    await prisma.$executeRawUnsafe(
      `UPDATE exam_record SET total_score = $1, vocab_score = $2, grammar_score = $3, listening_score = $4, passed = $5, status = 'completed', answers = $6, submitted_at = NOW() WHERE id = $7`,
      scaledTotal, scaledVocab, scaledGrammar, scaledListening, scaledTotal >= 90, JSON.stringify(gradedAnswers), recordId
    );

    // 错题同步复习队列
    const wrongItems = gradedAnswers.filter(a => !a.correct);
    if (wrongItems.length > 0) {
      const dailyPlanService = require('../services/dailyPlanService');
      try {
        await dailyPlanService.syncWrongItems(req.userId, wrongItems.map(w => ({
          word: w.questionId, type: 'exam', content: '', language: 'ja', level: '待加强',
          itemId: 'exam_' + w.questionId,
        })));
      } catch(e) {}
    }

    await prisma.$disconnect();

    res.json({ success:true, data: {
      totalScore: scaledTotal, vocabScore: scaledVocab, grammarScore: scaledGrammar, listeningScore: scaledListening,
      passed: scaledTotal >= 90, totalQuestions: answers.length,
      correctCount: gradedAnswers.filter(a => a.correct).length,
      wrongCount: wrongItems.length,
    }});
  } catch(e) { res.status(500).json({ success:false, error:'提交失败' }); }
});

// ============ 考试记录列表 ============
router.get('/records', authenticate, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const records = await prisma.$queryRawUnsafe(
      `SELECT * FROM exam_record WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      req.userId
    );
    await prisma.$disconnect();
    const list = (records || []).map(r => ({
      id: r.id, language: r.language, level: r.level,
      totalScore: r.total_score, passed: r.passed,
      status: r.status, startedAt: r.started_at, submittedAt: r.submitted_at,
    }));
    res.json({ success:true, data: { records: list } });
  } catch(e) { res.status(500).json({ success:false, error:'获取失败' }); }
});

module.exports = router;
