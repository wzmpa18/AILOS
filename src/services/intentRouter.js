/**
 * src/services/intentRouter.js
 * 意图识别层 — Phase 2
 *
 * 功能：
 *   - route(userInput, languageContext) - 识别用户意图并路由到对应能力
 *
 * 支持的意图：learn, test, companion, translate, grammar_check, chat
 *
 * 使用 aiGateway 进行意图识别
 */

const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const aiGateway = getAIGateway();

/**
 * 支持的意图类型枚举
 */
const INTENT_TYPES = {
  LEARN: 'learn',
  TEST: 'test',
  COMPANION: 'companion',
  TRANSLATE: 'translate',
  GRAMMAR_CHECK: 'grammar_check',
  CHAT: 'chat',
};

/**
 * 意图对应的路由能力描述
 */
const INTENT_CAPABILITIES = {
  [INTENT_TYPES.LEARN]: {
    name: '学习模式',
    description: '进入语言学习模式，提供课程内容、词汇讲解、语法分析等',
    scene: 'lesson_generate',
    defaultAction: 'startLesson',
  },
  [INTENT_TYPES.TEST]: {
    name: '测试模式',
    description: '进入语言测试模式，提供练习题、测验、口语评测等',
    scene: 'exercise_generate',
    defaultAction: 'startTest',
  },
  [INTENT_TYPES.COMPANION]: {
    name: '伴读模式',
    description: '进入AI伴读模式，提供对话练习、情景模拟等',
    scene: 'conversation',
    defaultAction: 'startConversation',
  },
  [INTENT_TYPES.TRANSLATE]: {
    name: '翻译模式',
    description: '进入翻译模式，提供多语言互译功能',
    scene: 'translate',
    defaultAction: 'translate',
  },
  [INTENT_TYPES.GRAMMAR_CHECK]: {
    name: '语法检查',
    description: '进入语法检查模式，提供语法纠错和建议',
    scene: 'grammar_check',
    defaultAction: 'grammarCheck',
  },
  [INTENT_TYPES.CHAT]: {
    name: '自由对话',
    description: '进入自由对话模式，提供开放式问答',
    scene: 'conversation',
    defaultAction: 'chat',
  },
};

class IntentRouter {
  /**
   * 识别用户意图并路由到对应能力
   * @param {string} userInput - 用户输入文本
   * @param {Object} languageContext - 语言上下文
   * @param {string} languageContext.primaryTargetLanguage - 目标语言
   * @param {string} languageContext.explanationLanguage - 解释语言
   * @returns {Promise<Object>} 路由结果
   */
  async route(userInput, languageContext) {
    try {
      if (!userInput) {
        throw new Error('userInput is required');
      }

      const ctx = languageContext || {
        primaryTargetLanguage: 'en',
        explanationLanguage: 'zh-CN',
      };

      const startTime = Date.now();

      // 1. 快速关键词匹配（无需AI调用，响应更快）
      const quickIntent = this._quickKeywordMatch(userInput);
      if (quickIntent) {
        logger.info('IntentRouter', 'Quick keyword match', {
          input: userInput.slice(0, 50),
          intent: quickIntent,
          method: 'keyword',
        });

        return {
          intent: quickIntent,
          capability: INTENT_CAPABILITIES[quickIntent],
          confidence: 0.85,
          matchedBy: 'keyword',
          latencyMs: Date.now() - startTime,
        };
      }

      // 2. AI意图识别
      const aiResponse = await aiGateway.call({
        scene: 'explanation',
        userId: 'system',
        languageContext: ctx,
        params: {
          input: userInput,
          text: userInput,
          type: 'intent_recognition',
        },
      });

      // 解析AI返回的意图
      const intent = this._parseIntent(aiResponse.result, userInput);

      logger.info('IntentRouter', 'AI intent recognition', {
        input: userInput.slice(0, 50),
        intent,
        method: 'ai',
        latencyMs: Date.now() - startTime,
      });

      return {
        intent,
        capability: INTENT_CAPABILITIES[intent] || INTENT_CAPABILITIES[INTENT_TYPES.CHAT],
        confidence: 0.9,
        matchedBy: 'ai',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('IntentRouter', 'Intent routing failed, falling back to chat', {
        error: error.message,
      });
      // 失败时回退到chat模式
      return {
        intent: INTENT_TYPES.CHAT,
        capability: INTENT_CAPABILITIES[INTENT_TYPES.CHAT],
        confidence: 0.3,
        matchedBy: 'fallback',
        error: error.message,
        latencyMs: 0,
      };
    }
  }

  /**
   * 批量路由：识别多个用户输入
   * @param {Array<string>} inputs - 用户输入列表
   * @param {Object} languageContext - 语言上下文
   * @returns {Promise<Array<Object>>} 路由结果列表
   */
  async routeBatch(inputs, languageContext) {
    const results = [];
    for (const input of inputs) {
      const result = await this.route(input, languageContext);
      results.push({ input: input.slice(0, 100), ...result });
    }
    return results;
  }

  // ==================== 内部方法 ====================

  /**
   * 快速关键词匹配（无需AI调用）
   * @param {string} userInput - 用户输入
   * @returns {string|null} 匹配的意图类型，null表示未匹配
   */
  _quickKeywordMatch(userInput) {
    const input = userInput.toLowerCase().trim();

    // 翻译意图
    const translatePatterns = [
      /翻译/, /翻译一下/, /翻译成/, /怎么翻译/, /什么意思/,
      /translate/, /what does .* mean/, /how to say/,
      /\btraduire\b/, /\btraducir\b/, /\b翻訳\b/, /\b번역\b/,
    ];
    for (const pattern of translatePatterns) {
      if (pattern.test(input)) return INTENT_TYPES.TRANSLATE;
    }

    // 语法检查意图
    const grammarPatterns = [
      /语法/, /语法检查/, /语法错误/, /帮我检查/,
      /grammar/, /grammar check/, /correct/,
      /\bgrammaire\b/, /\bgramática\b/, /\b文法\b/, /\b문법\b/,
    ];
    for (const pattern of grammarPatterns) {
      if (pattern.test(input)) return INTENT_TYPES.GRAMMAR_CHECK;
    }

    // 测试意图
    const testPatterns = [
      /测试/, /考试/, /测验/, /出题/, /练习/,
      /test/, /quiz/, /exam/, /exercise/, /practice/,
      /\bexamen\b/, /\bprüfung\b/, /\bテスト\b/, /\b시험\b/,
    ];
    for (const pattern of testPatterns) {
      if (pattern.test(input)) return INTENT_TYPES.TEST;
    }

    // 学习意图
    const learnPatterns = [
      /学习/, /教我/, /上课/, /课程/, /单词/, /发音/,
      /learn/, /teach/, /lesson/, /vocabulary/, /pronunciation/,
      /\bapprendre\b/, /\baprender\b/, /\b lernen\b/, /\b学ぶ\b/, /\b배우\b/,
    ];
    for (const pattern of learnPatterns) {
      if (pattern.test(input)) return INTENT_TYPES.LEARN;
    }

    // 伴读意图
    const companionPatterns = [
      /对话/, /聊天/, /跟读/, /伴读/, /陪我/,
      /conversation/, /chat/, /talk/, /speak/, /dialogue/,
      /口语/, /oral/, /speaking/,
      /\b会話\b/, /\b대화\b/,
    ];
    for (const pattern of companionPatterns) {
      if (pattern.test(input)) return INTENT_TYPES.COMPANION;
    }

    return null; // 未匹配到明确意图，交给AI
  }

  /**
   * 解析AI返回的意图识别结果
   * @param {any} aiResult - AI返回结果
   * @param {string} userInput - 原始用户输入
   * @returns {string} 意图类型
   */
  _parseIntent(aiResult, _userInput) {
    try {
      const content = aiResult.choices?.[0]?.message?.content || aiResult.content || aiResult;

      if (typeof content === 'string') {
        // 尝试提取JSON
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            const intent = (parsed.intent || parsed.intentType || '').toLowerCase();
            if (Object.values(INTENT_TYPES).includes(intent)) return intent;
          } catch (e) {
            logger.debug('IntentRouter', 'Failed to parse AI intent JSON');
          }
        }

        // 从文本中提取意图关键词
        const lower = content.toLowerCase();
        if (lower.includes('translate') || lower.includes('翻译')) return INTENT_TYPES.TRANSLATE;
        if (lower.includes('grammar') || lower.includes('语法')) return INTENT_TYPES.GRAMMAR_CHECK;
        if (lower.includes('test') || lower.includes('quiz') || lower.includes('测试')) return INTENT_TYPES.TEST;
        if (lower.includes('learn') || lower.includes('lesson') || lower.includes('学习')) return INTENT_TYPES.LEARN;
        if (lower.includes('conversation') || lower.includes('companion') || lower.includes('对话')) return INTENT_TYPES.COMPANION;
      }

      if (typeof content === 'object' && content.intent) {
        const intent = String(content.intent).toLowerCase();
        if (Object.values(INTENT_TYPES).includes(intent)) return intent;
      }

      return INTENT_TYPES.CHAT;
    } catch (error) {
      logger.error('IntentRouter', 'Parse intent failed:', error);
      return INTENT_TYPES.CHAT;
    }
  }
}

// ==================== 导出 ====================

let _instance = null;

function getIntentRouter() {
  if (!_instance) {
    _instance = new IntentRouter();
  }
  return _instance;
}

module.exports = {
  IntentRouter,
  getIntentRouter,
  INTENT_TYPES,
  INTENT_CAPABILITIES,
};