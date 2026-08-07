/**
 * src/server/services/practiceService.js
 * AI 自适应句型练习系统 — Prompt 模板 + 句型生成引擎
 * 
 * 对齐 CEFR 标准，支持 7 种系统语言 + 自定义语言
 * 生成策略：基础句型(50%) → 巩固句型(30%) → 提升句型(20%)
 */

const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const { getLanguageGuard } = require('../../services/languageGuard');

// ==================== CEFR 难度映射 ====================

const CEFR_LEVEL_MAP = {
  beginner: 'A1-A2',
  intermediate: 'B1-B2',
  advanced: 'C1-C2',
};

// ==================== 时长 → 句型数量换算 ====================

/**
 * 时长 → 句型数量换算
 *
 * v1.1.0 Bug 修复：原实现为 durationMinutes / rate，与注释语义相反。
 *   rate 的单位是「句/分钟」，应当相乘而非相除。
 *   旧逻辑后果：① 30分钟算出 60 句，远超实际可完成量；
 *              ② 高级(0.3)反而比初级(0.5)题目更多（100 vs 60），难度越高题越多，逻辑颠倒。
 *   现改为 durationMinutes * rate，符合注释标注的 2min/句、2.5min/句、3.3min/句。
 *   保留 Math.max(3, ...) 下限，不改变对外函数签名与调用方。
 */
function calcSentenceCount(durationMinutes, level) {
  const baseRate = {
    beginner: 0.5,      // 0.5句/分钟 → 2min/句（含思考时间）
    intermediate: 0.4,  // 0.4句/分钟 → 2.5min/句
    advanced: 0.3,      // 0.3句/分钟 → ~3.3min/句
  };
  const rate = baseRate[level] || 0.4;
  const minutes = Math.max(1, parseInt(durationMinutes, 10) || 10);
  const count = Math.max(3, Math.round(minutes * rate));
  return count;
}

// ==================== 句型分布 ====================

function calcDistribution(totalCount) {
  const basic = Math.max(1, Math.round(totalCount * 0.5));
  const consolidation = Math.max(1, Math.round(totalCount * 0.3));
  const improvement = totalCount - basic - consolidation;
  return {
    basicCount: basic,
    consolidationCount: consolidation,
    improvementCount: improvement,
    totalCount,
  };
}

// ==================== AI Prompt 模板 ====================

function buildSentencePrompt(language, level, distribution, weakPoints) {
  const cefr = CEFR_LEVEL_MAP[level] || 'A1-A2';
  const weakSection = weakPoints && weakPoints.length > 0
    ? `\n\n重点强化知识点（来自历史错题）: ${weakPoints.join(', ')}`
    : '\n\n无特定薄弱点提示，按标准生成。';

  const prompt = `你是语言教学专家，请严格按以下规格生成句型练习内容。

【目标语言】${language}
【CEFR等级】${cefr}
【句型数量分布】
- 基础句型（简单日常表达）: ${distribution.basicCount} 句
- 巩固句型（包含一至两个语法点）: ${distribution.consolidationCount} 句
- 提升句型（复杂语法结构）: ${distribution.improvementCount} 句
${weakSection}

【每个句型必须包含以下字段】
1. sentence: 目标语言原句
2. phonetic: 发音标注（音标或罗马字，无法标注则用空字符串）
3. meaning: 中文翻译
4. grammar: 语法解析（50-100字，说明核心语法点）
5. scene: 场景说明（一句话描述使用场景）

【输出格式】
严格返回 JSON 数组，每个元素为上述字段对象。不要带 markdown 代码块标记。
直接返回: [{"sentence": "...", "phonetic": "...", ...}, ...]

【质量要求】
- 句型不重复、不超纲
- 每句的 grammar 解析必须准确
- scene 必须贴合真实生活场景
- 进阶句型难度递增明显`;

  return prompt;
}

// ==================== 题型 Prompt ====================

function buildQuestionPrompt(sentenceObj, questionType, language) {
  const s = sentenceObj.sentence;
  const m = sentenceObj.meaning || '';

  switch (questionType) {
    case 'listen_select': {
      // 听音选义：改成选择题形式（正确和干扰项）
      return `Given the sentence "${s}" (${m}), generate 3 plausible but wrong meaning options in Chinese. Return JSON: {"correct": "${m}", "options": ["...","...","..."]}`;
    }
    case 'fill_blank': {
      // 填空补全 — generate on client side
      return null;
    }
    case 'shadow_speak': {
      // 跟读评分 — no prompt needed
      return null;
    }
    default:
      return null;
  }
}

// ==================== 错题复习优先级 ====================

async function getWeakPoints(userId, days = 7) {
  try {
    const records = await prisma.sentencePracticeRecord.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - days * 86400000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const allWeak = new Set();
    for (const r of records) {
      if (r.weakPoints && Array.isArray(r.weakPoints)) {
        r.weakPoints.forEach(p => allWeak.add(p));
      }
    }

    // 也从错题库提取
    const recentWrong = await prisma.wrongQuestion.findMany({
      where: {
        userId,
        reviewedCorrect: false,
        createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
      select: { grammarPoint: true },
      take: 20,
    });

    for (const w of recentWrong) {
      if (w.grammarPoint) allWeak.add(w.grammarPoint);
    }

    return [...allWeak].slice(0, 5);
  } catch (error) {
    logger.error('PracticeService: getWeakPoints error', error.message);
    return [];
  }
}

// ==================== 句型存储 ====================

async function saveSentencesToContent(sentences, language, level, userId) {
  try {
    await prisma.learningContent.create({
      data: {
        targetLanguage: language,
        contentType: 'sentence_pattern',
        difficultyLevel: level || 'beginner',
        sourceType: 'ai_generated',
        contentData: { items: sentences, generatedAt: new Date().toISOString() },
        status: 'published',
        qualityScore: 80,
        createdBy: userId,
      },
    });
  } catch (error) {
    logger.error('PracticeService: saveSentences error', error.message);
  }
}

module.exports = {
  CEFR_LEVEL_MAP,
  calcSentenceCount,
  calcDistribution,
  buildSentencePrompt,
  buildQuestionPrompt,
  getWeakPoints,
  saveSentencesToContent,
};
