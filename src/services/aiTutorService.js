// ============================================================
// src/services/aiTutorService.js
// Module 03 Step 4 — AI 导师对话记录 + 混元 AI 回复
// M0 接线：统一走 aiGateway，禁止直连混元
// ============================================================
const prisma = require('../config/database');
const { getAIGateway } = require('./aiGateway');
const contextResolver = require('./contextResolver'); // P2-T1: 双语言配置唯一真值源

class AiTutorService {
  /**
   * 获取历史对话（按 goalId 筛选）
   */
  async getDialogue(userId, goalId, limit = 50) {
    const where = { userId };
    if (goalId) where.goalId = goalId;

    return prisma.aiTutorRecord.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        tokensUsed: true,
        createdAt: true,
      },
    });
  }

  /**
   * 保存一条对话记录
   */
  async saveDialogue(userId, data) {
    const { role, content, goalId, tokensUsed } = data;

    if (!role || !content) {
      throw new Error('role and content are required');
    }

    if (!['user', 'assistant'].includes(role)) {
      throw new Error('role must be user or assistant');
    }

    return prisma.aiTutorRecord.create({
      data: {
        userId,
        role,
        content,
        goalId: goalId || null,
        tokensUsed: tokensUsed || 0,
      },
    });
  }

  /**
   * 发送用户消息并获取 AI 回复（Module 03 Step 4）
   * @param {string} userId - 用户ID
   * @param {string} message - 用户消息
   * @param {Object} opts - { goalId, languageContext }
   * @returns {Promise<{userRecord, aiRecord, aiContent}>}
   */
  async chat(userId, message, opts = {}) {
    const { goalId, userLevel: optUserLevel } = opts;

    // 1. 保存用户消息
    const userRecord = await this.saveDialogue(userId, {
      role: 'user',
      content: message,
      goalId,
      tokensUsed: 0,
    });

    // 2. 获取历史对话上下文（最近 20 条）
    const history = await this.getDialogue(userId, goalId, 20);
    const messages = history.map(h => ({
      role: h.role,
      content: h.content,
    }));

    // 3. 构建系统提示词
      // P2-T1: 双语言配置强制从库解析，禁止静默默认兜底（原 '中文'/'英语'）
      const ctx = await contextResolver.resolve(userId);
      const nativeLang = ctx.nativeLanguage;
      const targetLang = ctx.primaryTargetLanguage;
      const userLevel = optUserLevel || 'beginner';

    const systemPrompt = `你是AILOS，一位专业友好的${targetLang}语言导师。你的母语是${nativeLang}。
规则：
1. 用${nativeLang}解释语言点，用${targetLang}提供例句
2. 根据用户水平(${userLevel})调整难度
3. 保持对话自然、鼓励性，像朋友一样交流
4. 每次回复控制在200字以内`;

    // 4. 调用 AI（走 aiGateway）
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20),
    ];

    const aiGateway = getAIGateway();
    const result = await aiGateway.chatWithMessages(aiMessages, {
      userId,
      temperature: 0.7,
      maxTokens: 400,
      languageContext: { nativeLang, targetLang, explanationLanguage: nativeLang, primaryTargetLanguage: targetLang },
      scene: 'conversation',
    });

    // 5. 保存 AI 回复
    const aiRecord = await this.saveDialogue(userId, {
      role: 'assistant',
      content: result.content,
      goalId,
      tokensUsed: result.usage.totalTokens,
    });

    return {
      userRecord,
      aiRecord,
      aiContent: result.content,
      usage: result.usage,
      source: result.source,
    };
  }
}

module.exports = new AiTutorService();