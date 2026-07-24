// ============================================================
// src/services/aiGateway.js
// AI 网关 — 统一AI供应商接口（混元/OpenAI/DeepSeek）
// 所有AI请求通过此网关发出，支持多供应商切换
// ============================================================
const config = require('../config');
const logger = require('../utils/logger');

class AIGateway {
  /**
   * 发送对话请求
   * @param {Array} messages - 消息历史 [{role, content}]
   * @param {Object} options - 可选参数 {language, level, maxTokens}
   */
  async chat(messages, options = {}) {
    const systemPrompt = this._buildSystemPrompt(options);
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    return this._callProvider(fullMessages, options);
  }

  /**
   * 翻译文本
   */
  async translate(text, sourceLang, targetLang) {
    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, no explanations.`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    const result = await this._callProvider(messages, { maxTokens: 1000 });
    return result.content;
  }

  /**
   * 纠错
   */
  async correct(text, language) {
    const systemPrompt = `You are a language tutor. Correct the following ${language} text. Return a JSON with:
{
  "original": "original text",
  "corrected": "corrected text",
  "errors": [{"position": "word/phrase", "type": "grammar/vocabulary/spelling", "explanation": "explanation in Chinese"}],
  "tips": "general improvement tips in Chinese"
}`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    const result = await this._callProvider(messages, { maxTokens: 1500 });
    try {
      return JSON.parse(result.content);
    } catch {
      return { original: text, corrected: text, errors: [], tips: result.content };
    }
  }

  /**
   * 生成练习
   */
  async generateExercise(topic, language, level, exerciseType) {
    const systemPrompt = `You are a language teaching expert. Generate a ${exerciseType} exercise for ${language} learners at ${level} level about "${topic}".
Return a JSON array of questions, each with: { "prompt": "question", "answer": "correct answer", "options": ["A", "B", "C", "D"] }`;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate 5 ${exerciseType} questions about ${topic} in ${language}.` },
    ];

    const result = await this._callProvider(messages, { maxTokens: 2000 });
    try {
      return JSON.parse(result.content);
    } catch {
      return result.content;
    }
  }

  // ============================================================
  // 私有方法
  // ============================================================

  _buildSystemPrompt(options) {
    const { language, level, mode } = options;
    let prompt = 'You are AILOS, a friendly and patient language learning assistant.';

    if (language) {
      prompt += ` You are helping a student learn ${language}.`;
    }
    if (level) {
      prompt += ` The student is at ${level} level.`;
    }
    prompt += ' Respond in a helpful, encouraging tone. Keep explanations simple and clear.';
    if (mode === 'conversation') {
      prompt += ' Engage in natural conversation practice. Gently correct mistakes.';
    }

    return prompt;
  }

  async _callProvider(messages, options = {}) {
    const provider = config.ai.provider || 'hunyuan';

    switch (provider) {
      case 'hunyuan':
        return this._callHunyuan(messages, options);
      case 'openai':
        return this._callOpenAI(messages, options);
      case 'deepseek':
        return this._callDeepSeek(messages, options);
      default:
        // 开发环境：返回模拟响应
        return this._mockResponse(messages, options);
    }
  }

  async _callHunyuan(messages, options) {
    const endpoint = config.ai.apiEndpoint || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ai.apiKey}`,
        },
        body: JSON.stringify({
          model: config.ai.model || 'hunyuan-lite',
          messages,
          max_tokens: options.maxTokens || 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Hunyuan API error:', error);
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
      };
    } catch (error) {
      logger.error('Hunyuan call failed:', error.message);
      // 降级到Mock响应
      if (config.env !== 'production') {
        return this._mockResponse(messages, options);
      }
      throw error;
    }
  }

  async _callOpenAI(messages, options) {
    const endpoint = config.ai.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  async _callDeepSeek(messages, options) {
    const endpoint = config.ai.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model || 'deepseek-chat',
        messages,
        max_tokens: options.maxTokens || 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  }

  _mockResponse(messages, options) {
    const lastMessage = messages[messages.length - 1];
    const userContent = typeof lastMessage.content === 'string' ? lastMessage.content : '';

    logger.info(`[MOCK AI] Responding to: "${userContent.slice(0, 50)}..."`);

    return {
      content: `[Mock AI Response] 你好！我是AILOS学习助手。你说了："${userContent.slice(0, 100)}"。这是开发环境的模拟回复，生产环境将连接到真实AI服务。`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: 'mock',
    };
  }
}

module.exports = new AIGateway();