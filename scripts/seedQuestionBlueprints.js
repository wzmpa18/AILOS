#!/usr/bin/env node
// ============================================================
// scripts/seedQuestionBlueprints.js
// Module 03 Step 6 — QuestionBlueprint 种子数据
// 基于现有 LearningContent 生成测验题目，供 SRS/AI 出题使用
// 幂等：若已有 Blueprint 则跳过
// ============================================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 默认种子内容（当 LearningContent 为空时填充）
const DEFAULT_CONTENTS = [
  {
    contentType: 'vocabulary',
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en',
    explanationLanguage: 'zh-CN',
    difficultyLevel: 'beginner',
    contentData: {
      words: [
        { word: 'hello', translation: '你好', partOfSpeech: 'interjection' },
        { word: 'goodbye', translation: '再见', partOfSpeech: 'interjection' },
        { word: 'thank you', translation: '谢谢', partOfSpeech: 'phrase' },
        { word: 'please', translation: '请', partOfSpeech: 'adverb' },
        { word: 'sorry', translation: '对不起', partOfSpeech: 'adjective' },
        { word: 'morning', translation: '早晨', partOfSpeech: 'noun' },
        { word: 'night', translation: '晚上', partOfSpeech: 'noun' },
        { word: 'friend', translation: '朋友', partOfSpeech: 'noun' },
        { word: 'family', translation: '家庭', partOfSpeech: 'noun' },
        { word: 'water', translation: '水', partOfSpeech: 'noun' },
      ],
    },
  },
  {
    contentType: 'grammar',
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en',
    explanationLanguage: 'zh-CN',
    difficultyLevel: 'beginner',
    contentData: {
      topics: [
        { title: 'Present Simple', rule: '主语 + 动词原形', example: 'I eat breakfast.' },
        { title: 'Present Continuous', rule: '主语 + am/is/are + 动词-ing', example: 'I am eating.' },
        { title: 'Past Simple', rule: '主语 + 动词过去式', example: 'I ate breakfast.' },
        { title: 'Articles a/an', rule: 'a 用于辅音前，an 用于元音前', example: 'a book / an apple' },
        { title: 'Plural Nouns', rule: '名词 + s/es', example: 'cats / boxes' },
      ],
    },
  },
  {
    contentType: 'dialogue',
    sourceLanguage: 'zh-CN',
    targetLanguage: 'en',
    explanationLanguage: 'zh-CN',
    difficultyLevel: 'beginner',
    contentData: {
      scenes: [
        { title: 'Greeting', dialogue: 'A: Hello! How are you?\nB: I\'m fine, thank you. And you?' },
        { title: 'Ordering Food', dialogue: 'A: Can I have a coffee, please?\nB: Sure. Anything else?' },
        { title: 'Asking Directions', dialogue: 'A: Excuse me, where is the station?\nB: Go straight and turn left.' },
      ],
    },
  },
];

// 根据内容类型和难度生成题目
function generateQuestions(content) {
  const questions = [];
  const data = content.contentData || {};

  switch (content.contentType) {
    case 'vocabulary': {
      const words = data.words || [];
      for (const w of words) {
        // 英译中
        questions.push({
          contentId: content.id,
          question: `"${w.word}" 的中文意思是？`,
          answer: w.translation,
          options: JSON.stringify(_generateOptions(w.translation, words, 'translation')),
          difficulty: content.difficultyLevel === 'beginner' ? 1 : content.difficultyLevel === 'intermediate' ? 2 : 3,
        });
        // 中译英
        questions.push({
          contentId: content.id,
          question: `"${w.translation}" 的英文是？`,
          answer: w.word,
          options: JSON.stringify(_generateOptions(w.word, words, 'word')),
          difficulty: content.difficultyLevel === 'beginner' ? 1 : content.difficultyLevel === 'intermediate' ? 2 : 3,
        });
      }
      break;
    }
    case 'grammar': {
      const topics = data.topics || [];
      for (const t of topics) {
        questions.push({
          contentId: content.id,
          question: `语法点 "${t.title}" 的构成规则是？`,
          answer: t.rule,
          options: null,
          difficulty: 2,
        });
        questions.push({
          contentId: content.id,
          question: `以下哪个句子正确使用了 "${t.title}"？`,
          answer: t.example,
          options: JSON.stringify([t.example, _scrambleExample(t.example), _scrambleExample(t.example)]),
          difficulty: 2,
        });
      }
      break;
    }
    case 'dialogue': {
      const scenes = data.scenes || [];
      for (const s of scenes) {
        questions.push({
          contentId: content.id,
          question: `场景 "${s.title}" 中，如何用英语打招呼？`,
          answer: s.dialogue.split('\n')[0].replace(/^[AB]:\s*/, ''),
          options: null,
          difficulty: 1,
        });
      }
      break;
    }
    default:
      break;
  }

  return questions;
}

// 生成干扰选项
function _generateOptions(correct, items, field) {
  const others = items
    .filter(i => i[field] !== correct)
    .map(i => i[field])
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [correct, ...others].sort(() => Math.random() - 0.5);
  return options;
}

// 简单打乱句子
function _scrambleExample(example) {
  const words = example.split(' ');
  if (words.length <= 3) return example;
  const i = Math.floor(Math.random() * (words.length - 1)) + 1;
  const j = Math.floor(Math.random() * (words.length - 1)) + 1;
  [words[i], words[j]] = [words[j], words[i]];
  return words.join(' ');
}

async function main() {
  console.log('[Seed] QuestionBlueprint 种子脚本启动...\n');

  // 1. 检查是否已有 Blueprint
  const existingCount = await prisma.questionBlueprint.count();
  if (existingCount > 0) {
    console.log(`[Seed] 已有 ${existingCount} 条 QuestionBlueprint，跳过（幂等）。`);
    await prisma.$disconnect();
    return;
  }

  // 2. 查询现有 LearningContent
  let contents = await prisma.learningContent.findMany({
    where: { status: 'published' },
    take: 50,
  });

  console.log(`[Seed] 找到 ${contents.length} 条已发布 LearningContent`);

  // 3. 若无内容，插入默认种子
  if (contents.length === 0) {
    console.log('[Seed] LearningContent 为空，插入默认种子内容...');
    for (const c of DEFAULT_CONTENTS) {
      const created = await prisma.learningContent.create({
        data: {
          contentType: c.contentType,
          sourceType: 'MANUAL',
          sourceLanguage: c.sourceLanguage,
          targetLanguage: c.targetLanguage,
          explanationLanguage: c.explanationLanguage,
          difficultyLevel: c.difficultyLevel,
          status: 'published',
          contentData: c.contentData,
        },
      });
      contents.push(created);
    }
    console.log(`[Seed] 已插入 ${contents.length} 条默认 LearningContent`);
  }

  // 4. 为每条内容生成题目
  let totalQuestions = 0;
  for (const content of contents) {
    const questions = generateQuestions(content);
    if (questions.length === 0) continue;

    await prisma.questionBlueprint.createMany({
      data: questions,
    });
    totalQuestions += questions.length;
    console.log(`[Seed] ${content.contentType} (${content.difficultyLevel}): 生成 ${questions.length} 题`);
  }

  console.log(`\n[Seed] 完成！共生成 ${totalQuestions} 条 QuestionBlueprint`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('[Seed] 失败:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});