/**
 * src/server/controllers/blueprintController.js
 * QuestionBlueprint / CourseBlueprint 控制器
 *
 * 职责：
 * - GET /api/blueprint/question?language=&type=&level=&count=  — 通过 QuestionBlueprint 框架 + AI 生成试题
 * - GET /api/blueprint/course?language=&level=                — 通过 CourseBlueprint 框架 + AI 生成课程
 *
 * 所有 AI 调用统一走 aiGateway.chatWithMessages
 * 生成的内容自动落库为 LearningContent 资产
 */
const { getAIGateway } = require('../../services/aiGateway');
const { getCostCircuitBreaker } = require('../../services/costCircuitBreaker');
const contextResolver = require('../../services/contextResolver'); // P2-T1: 双语言配置唯一真值源
const logger = require('../../utils/logger');
const prisma = require('../../config/database');

// P2-T1: 解释/说明语言强制从库解析；游客/无配置回落系统固定上下文（非用户可篡改维度）
async function resolveExplanationLanguage(userId) {
  try {
    return (await contextResolver.resolve(userId)).explanationLanguage;
  } catch (e) {
    return 'zh-CN'; // 系统固定上下文（游客/无配置）
  }
}

// ==================== QuestionBlueprint 框架 ====================

/**
 * QuestionBlueprint — 试题生成蓝图
 * 定义题型、难度、知识点的结构化约束
 */
const QUESTION_BLUEPRINT = {
  vocabulary: {
    label: '词汇题',
    templates: {
      beginner: {
        types: ['multiple_choice', 'matching'],
        wordCount: { min: 3, max: 8 },
        options: 4,
        focus: ['basic_nouns', 'daily_verbs', 'common_adjectives'],
      },
      intermediate: {
        types: ['multiple_choice', 'fill_blank', 'synonym_match'],
        wordCount: { min: 5, max: 12 },
        options: 4,
        focus: ['abstract_nouns', 'phrasal_verbs', 'idioms'],
      },
      advanced: {
        types: ['multiple_choice', 'cloze', 'collocation'],
        wordCount: { min: 8, max: 15 },
        options: 4,
        focus: ['academic_vocabulary', 'nuanced_adjectives', 'formal_register'],
      },
    },
  },
  grammar: {
    label: '语法题',
    templates: {
      beginner: {
        types: ['multiple_choice', 'sentence_reorder'],
        focus: ['tenses_basic', 'articles', 'prepositions', 'word_order'],
      },
      intermediate: {
        types: ['multiple_choice', 'error_correction', 'transformation'],
        focus: ['conditionals', 'passive_voice', 'relative_clauses', 'modals'],
      },
      advanced: {
        types: ['multiple_choice', 'error_correction', 'subjunctive'],
        focus: ['subjunctive_mood', 'inversion', 'cleft_sentences', 'discourse_markers'],
      },
    },
  },
  reading: {
    label: '阅读题',
    templates: {
      beginner: {
        types: ['true_false', 'multiple_choice'],
        passageLength: { min: 50, max: 150 },
        questionsPerPassage: 3,
      },
      intermediate: {
        types: ['multiple_choice', 'short_answer', 'summary'],
        passageLength: { min: 150, max: 350 },
        questionsPerPassage: 5,
      },
      advanced: {
        types: ['multiple_choice', 'inference', 'tone_analysis'],
        passageLength: { min: 300, max: 600 },
        questionsPerPassage: 5,
      },
    },
  },
  listening: {
    label: '听力题',
    templates: {
      beginner: {
        types: ['multiple_choice', 'picture_matching'],
        scriptLength: { min: 30, max: 80 },
        questionsPerScript: 3,
      },
      intermediate: {
        types: ['multiple_choice', 'fill_blank', 'note_taking'],
        scriptLength: { min: 80, max: 200 },
        questionsPerScript: 4,
      },
      advanced: {
        types: ['multiple_choice', 'summary', 'inference'],
        scriptLength: { min: 150, max: 350 },
        questionsPerScript: 5,
      },
    },
  },
};

// ==================== CourseBlueprint 框架 ====================

/**
 * CourseBlueprint — 课程生成蓝图
 * 定义课程结构、模块划分、知识点递进
 */
const COURSE_BLUEPRINT = {
  beginner: {
    modules: [
      { name: '基础入门', topics: ['greetings', 'self_introduction', 'numbers', 'colors', 'family'] },
      { name: '日常生活', topics: ['daily_routine', 'food', 'shopping', 'weather', 'time'] },
      { name: '基础语法', topics: ['present_tense', 'articles', 'basic_prepositions', 'questions'] },
      { name: '实用场景', topics: ['directions', 'restaurant', 'transportation', 'hotel'] },
    ],
    exerciseRatio: 0.4,
  },
  intermediate: {
    modules: [
      { name: '语法进阶', topics: ['past_tense', 'future_tense', 'conditionals', 'passive_voice'] },
      { name: '表达提升', topics: ['opinions', 'comparisons', 'narratives', 'descriptions'] },
      { name: '场景扩展', topics: ['workplace', 'travel', 'health', 'technology'] },
      { name: '文化理解', topics: ['traditions', 'festivals', 'social_norms', 'media'] },
    ],
    exerciseRatio: 0.45,
  },
  advanced: {
    modules: [
      { name: '高级语法', topics: ['subjunctive', 'inversion', 'discourse', 'register'] },
      { name: '学术表达', topics: ['essay_writing', 'debate', 'presentation', 'research'] },
      { name: '专业领域', topics: ['business', 'science', 'literature', 'politics'] },
      { name: '母语级表达', topics: ['idioms', 'humor', 'nuance', 'style'] },
    ],
    exerciseRatio: 0.5,
  },
};

// ==================== 辅助函数 ====================

/**
 * 构建试题生成的 System Prompt
 */
function buildQuestionPrompt(language, type, level, count) {
  const blueprint = QUESTION_BLUEPRINT[type];
  if (!blueprint) {
    throw new Error(`Unsupported question type: ${type}`);
  }

  const levelConfig = blueprint.templates[level] || blueprint.templates.beginner;
  const types = levelConfig.types || ['multiple_choice'];

  const languageNames = {
    en: '英语', ja: '日语', ko: '韩语', fr: '法语', es: '西班牙语', de: '德语',
    zh: '中文',
  };
  const langName = languageNames[language] || language;

  return `你是一个专业的${langName}语言学习出题引擎（QuestionBlueprint）。

请严格按照以下蓝图生成试题：

【蓝图参数】
- 语言: ${langName} (${language})
- 题型: ${blueprint.label}
- 难度: ${level}
- 数量: ${count} 道
- 可用题型: ${types.join(', ')}
${levelConfig.wordCount ? `- 词汇范围: ${levelConfig.wordCount.min}-${levelConfig.wordCount.max} 个词` : ''}
${levelConfig.passageLength ? `- 文章长度: ${levelConfig.passageLength.min}-${levelConfig.passageLength.max} 词` : ''}
${levelConfig.scriptLength ? `- 脚本长度: ${levelConfig.scriptLength.min}-${levelConfig.scriptLength.max} 词` : ''}
${levelConfig.focus ? `- 知识点: ${levelConfig.focus.join(', ')}` : ''}

【输出格式】
返回严格 JSON 数组，每道题包含以下字段：
{
  "id": "题目唯一标识",
  "type": "题型",
  "question": "题目内容（使用${langName}）",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "correctAnswer": "正确答案",
  "explanation": "中文解释",
  "knowledgePoint": "知识点",
  "difficulty": "难度级别"
}

只返回 JSON 数组，不要包含任何其他文字。`;
}

/**
 * 构建课程生成的 System Prompt
 */
function buildCoursePrompt(language, level) {
  const blueprint = COURSE_BLUEPRINT[level] || COURSE_BLUEPRINT.beginner;
  const modules = blueprint.modules;

  const languageNames = {
    en: '英语', ja: '日语', ko: '韩语', fr: '法语', es: '西班牙语', de: '德语',
    zh: '中文',
  };
  const langName = languageNames[language] || language;

  const moduleDescriptions = modules.map((m, i) =>
    `模块${i + 1}: ${m.name} — 话题: ${m.topics.join(', ')}`
  ).join('\n');

  return `你是一个专业的${langName}语言课程设计引擎（CourseBlueprint）。

请严格按照以下蓝图生成课程：

【蓝图参数】
- 语言: ${langName} (${language})
- 难度: ${level}
- 练习比例: ${Math.round(blueprint.exerciseRatio * 100)}%
- 模块结构:
${moduleDescriptions}

【输出格式】
返回严格 JSON 对象，包含以下字段：
{
  "courseId": "课程唯一标识",
  "language": "${language}",
  "level": "${level}",
  "title": "课程标题",
  "description": "课程描述",
  "totalLessons": 数字,
  "modules": [
    {
      "moduleId": "模块ID",
      "name": "模块名称",
      "description": "模块描述",
      "lessons": [
        {
          "lessonId": "课时ID",
          "title": "课时标题",
          "type": "lesson|exercise|review",
          "learningObjectives": ["目标1", "目标2"],
          "keyVocabulary": ["词汇1", "词汇2"],
          "keyGrammar": ["语法点1"],
          "estimatedMinutes": 数字
        }
      ]
    }
  ]
}

只返回 JSON 对象，不要包含任何其他文字。`;
}

/**
 * 内容类型映射（前端类型 -> 数据库 contentType）
 */
function mapContentType(frontendType) {
  const map = {
    vocab: 'vocabulary',
    grammar: 'grammar',
    reading: 'reading',
    listening: 'listening',
    quiz: 'quiz',
    course: 'course',
    lesson: 'lesson',
  };
  return map[frontendType] || frontendType;
}

/**
 * 将 AI 生成的内容保存到 learningContent 资产库
 */
async function saveToLearningContent({ language, type, level, content, sourceType = 'AI_GENERATED' }) {
  try {
    const record = await prisma.learningContent.create({
      data: {
        contentType: mapContentType(type),
        sourceType,
        sourceLanguage: language,
        targetLanguage: language,
        explanationLanguage: 'zh-CN',
        difficultyLevel: level || 'beginner',
        contentVersion: '1.0.0',
        status: 'published',
        contentData: typeof content === 'string' ? JSON.parse(content) : content,
        qualityScore: 70,
        reuseCount: 0,
      },
    });
    logger.log(`BlueprintController: 内容已落库 | id=${record.id} | type=${type} | language=${language}`);
    return record;
  } catch (error) {
    logger.error('BlueprintController: 内容落库失败', error.message);
    return null;
  }
}

// ==================== 控制器方法 ====================

const blueprintController = {
  /**
   * GET /api/blueprint/question?language={lang}&type={type}&level={level}&count={n}
   * 通过 QuestionBlueprint 框架 + AI 生成试题
   */
  async generateQuestions(req, res, next) {
    try {
      const { language, type, level, count: countStr } = req.query;

      // 参数校验
      if (!language) {
        return res.status(400).json({ success: false, error: '缺少 language 参数' });
      }
      if (!type) {
        return res.status(400).json({ success: false, error: '缺少 type 参数 (vocab|grammar|reading|listening)' });
      }
      if (!QUESTION_BLUEPRINT[type]) {
        return res.status(400).json({
          success: false,
          error: `不支持的题型: ${type}`,
          supportedTypes: Object.keys(QUESTION_BLUEPRINT),
        });
      }

      const lvl = level || 'beginner';
      const count = Math.min(parseInt(countStr) || 5, 20);

      // 获取用户 ID（游客用占位）
      const userId = req.userId || 'guest';
      // P2-T1: 解释语言从库解析（游客回落系统固定上下文）
      const explanationLanguage = await resolveExplanationLanguage(userId);

      // 使用成本熔断器保护
      const circuitBreaker = getCostCircuitBreaker();
      const { result, source, quotaStatus } = await circuitBreaker.withCircuitBreaker(
        {
          userId,
          targetLanguage: language,
          contentType: mapContentType(type),
          difficultyLevel: lvl,
          language: explanationLanguage,
        },
        async () => {
          // 构建 Prompt
          const systemPrompt = buildQuestionPrompt(language, type, lvl, count);

          // 调用 AI Gateway
          const aiGateway = getAIGateway();
          const aiResult = await aiGateway.chatWithMessages(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请生成${count}道${language}语言的${type}练习题，难度为${lvl}。` },
            ],
            {
              userId,
              temperature: 0.7,
              maxTokens: 2048,
              // P2-T1: 不传 languageContext，aiGateway 强制从库解析（忽略传入），取消 'zh-CN' 静默默认
              scene: 'exercise_generate',
            }
          );

          // 解析 AI 响应
          let questions;
          try {
            const cleaned = aiResult.content
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            questions = JSON.parse(cleaned);
          } catch (e) {
            // 尝试提取 JSON 数组
            const match = aiResult.content.match(/\[[\s\S]*\]/);
            if (match) {
              questions = JSON.parse(match[0]);
            } else {
              questions = [{
                id: 'fallback_1',
                type: 'multiple_choice',
                question: aiResult.content.slice(0, 500),
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                explanation: 'AI 生成结果解析异常，请重试',
                knowledgePoint: 'general',
                difficulty: 'beginner',
              }];
            }
          }

          const questionsArray = Array.isArray(questions) ? questions : [questions];

          // 异步落库（不阻塞响应）
          saveToLearningContent({
            language,
            type,
            level: lvl,
            content: questionsArray,
            sourceType: 'AI_GENERATED',
          }).catch(() => {});

          return {
            questions: questionsArray,
            total: questionsArray.length,
            usage: aiResult.usage,
            model: aiResult.model,
          };
        }
      );

      res.json({
        success: true,
        ...result,
        source,
        quotaStatus: quotaStatus ? {
          level: quotaStatus.level,
          remaining: quotaStatus.remaining,
          dailyTotal: quotaStatus.dailyTotal,
        } : null,
        language,
        type,
        level: lvl,
      });
    } catch (error) {
      logger.error('BlueprintController.generateQuestions 失败:', error.message);
      next(error);
    }
  },

  /**
   * GET /api/blueprint/course?language={lang}&level={level}
   * 通过 CourseBlueprint 框架 + AI 生成课程
   */
  async generateCourse(req, res, next) {
    try {
      const { language, level } = req.query;

      // 参数校验
      if (!language) {
        return res.status(400).json({ success: false, error: '缺少 language 参数' });
      }

      const lvl = level || 'beginner';
      if (!COURSE_BLUEPRINT[lvl]) {
        return res.status(400).json({
          success: false,
          error: `不支持的难度级别: ${lvl}`,
          supportedLevels: Object.keys(COURSE_BLUEPRINT),
        });
      }

      const userId = req.userId || 'guest';
      // P2-T1: 解释语言从库解析（游客回落系统固定上下文）
      const explanationLanguage = await resolveExplanationLanguage(userId);

      // 使用成本熔断器保护
      const circuitBreaker = getCostCircuitBreaker();
      const { result, source, quotaStatus } = await circuitBreaker.withCircuitBreaker(
        {
          userId,
          targetLanguage: language,
          contentType: 'course',
          difficultyLevel: lvl,
          language: explanationLanguage,
        },
        async () => {
          // 构建 Prompt
          const systemPrompt = buildCoursePrompt(language, lvl);

          // 调用 AI Gateway
          const aiGateway = getAIGateway();
          const aiResult = await aiGateway.chatWithMessages(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请为${language}语言设计一个${lvl}级别的完整课程。` },
            ],
            {
              userId,
              temperature: 0.7,
              maxTokens: 3072,
              // P2-T1: 不传 languageContext，aiGateway 强制从库解析（忽略传入），取消 'zh-CN' 静默默认
              scene: 'course_generation',
            }
          );

          // 解析 AI 响应
          let course;
          try {
            const cleaned = aiResult.content
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .trim();
            course = JSON.parse(cleaned);
          } catch (e) {
            const match = aiResult.content.match(/\{[\s\S]*\}/);
            if (match) {
              course = JSON.parse(match[0]);
            } else {
              course = {
                courseId: `course_${Date.now()}`,
                language,
                level: lvl,
                title: `${language} ${lvl} 课程`,
                description: aiResult.content.slice(0, 300),
                totalLessons: 0,
                modules: [],
              };
            }
          }

          // 异步落库（不阻塞响应）
          saveToLearningContent({
            language,
            type: 'course',
            level: lvl,
            content: course,
            sourceType: 'AI_GENERATED',
          }).catch(() => {});

          return {
            course,
            usage: aiResult.usage,
            model: aiResult.model,
          };
        }
      );

      res.json({
        success: true,
        ...result,
        source,
        quotaStatus: quotaStatus ? {
          level: quotaStatus.level,
          remaining: quotaStatus.remaining,
          dailyTotal: quotaStatus.dailyTotal,
        } : null,
        language,
        level: lvl,
      });
    } catch (error) {
      logger.error('BlueprintController.generateCourse 失败:', error.message);
      next(error);
    }
  },

  /**
   * GET /api/blueprint/config
   * 返回可用的 Blueprint 配置（供前端参考）
   */
  getBlueprintConfig(req, res) {
    res.json({
      success: true,
      questionTypes: Object.keys(QUESTION_BLUEPRINT).map((key) => ({
        type: key,
        label: QUESTION_BLUEPRINT[key].label,
        levels: Object.keys(QUESTION_BLUEPRINT[key].templates),
      })),
      courseLevels: Object.keys(COURSE_BLUEPRINT).map((key) => ({
        level: key,
        modulesCount: COURSE_BLUEPRINT[key].modules.length,
        exerciseRatio: COURSE_BLUEPRINT[key].exerciseRatio,
      })),
    });
  },
};

module.exports = blueprintController;