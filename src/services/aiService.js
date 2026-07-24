// ============================================================
// src/services/aiService.js
// AI 对话服务 — 额度检查 + 对话管理 + 翻译 + 纠错
// ============================================================
const prisma = require('../config/database');
const redis = require('../config/redis');
const aiGateway = require('./aiGateway');
const config = require('../config');
const logger = require('../utils/logger');

class AIService {
  // ============================================================
  // 对话
  // ============================================================

  async chat(userId, message, options = {}) {
    // 检查额度
    const quotaCheck = await this._checkQuota(userId, 'conversation');
    if (!quotaCheck.allowed) {
      throw new Error(`Daily conversation limit reached (${quotaCheck.used}/${quotaCheck.max}). Please upgrade or wait for reset.`);
    }

    // 获取对话历史
    const history = options.conversationId
      ? await this._getConversationHistory(options.conversationId)
      : [];

    const messages = [
      ...history.slice(-10), // 最近10条
      { role: 'user', content: message },
    ];

    // 调用AI
    const response = await aiGateway.chat(messages, {
      language: options.language,
      level: options.level,
      mode: 'conversation',
    });

    // 保存对话记录
    if (options.conversationId) {
      await this._saveMessage(options.conversationId, 'user', message);
      await this._saveMessage(options.conversationId, 'assistant', response.content);
    } else {
      // 创建新对话
      const conversation = await prisma.aIConversation.create({
        data: {
          userId,
          title: message.slice(0, 50),
          language: options.language || 'auto',
          level: options.level || 'A1',
        },
      });
      await this._saveMessage(conversation.id, 'user', message);
      await this._saveMessage(conversation.id, 'assistant', response.content);
      options.conversationId = conversation.id;
    }

    // 增加使用计数
    await this._incrementQuota(userId, 'conversation');

    return {
      conversationId: options.conversationId,
      message: response.content,
      usage: response.usage,
    };
  }

  // ============================================================
  // 翻译
  // ============================================================

  async translate(userId, text, sourceLang, targetLang) {
    const quotaCheck = await this._checkQuota(userId, 'conversation');
    if (!quotaCheck.allowed) {
      throw new Error('Daily conversation limit reached.');
    }

    const translated = await aiGateway.translate(text, sourceLang, targetLang);

    // 保存翻译记录
    await prisma.aITranslation.create({
      data: {
        userId,
        sourceText: text,
        translatedText: typeof translated === 'string' ? translated : translated.content,
        sourceLang,
        targetLang,
      },
    });

    await this._incrementQuota(userId, 'conversation');

    return { translated: typeof translated === 'string' ? translated : translated.content };
  }

  // ============================================================
  // 纠错
  // ============================================================

  async correct(userId, text, language) {
    const quotaCheck = await this._checkQuota(userId, 'correction');
    if (!quotaCheck.allowed) {
      throw new Error(`Daily correction limit reached (${quotaCheck.used}/${quotaCheck.max}).`);
    }

    const result = await aiGateway.correct(text, language);

    // 保存纠错记录
    await prisma.aICorrection.create({
      data: {
        userId,
        originalText: text,
        correctedText: result.corrected || text,
        errors: result.errors || [],
        tips: result.tips || '',
        language,
      },
    });

    await this._incrementQuota(userId, 'correction');

    return result;
  }

  // ============================================================
  // 生成练习
  // ============================================================

  async generateExercise(userId, topic, language, level, exerciseType) {
    const quotaCheck = await this._checkQuota(userId, 'conversation');
    if (!quotaCheck.allowed) {
      throw new Error('Daily conversation limit reached.');
    }

    const exercise = await aiGateway.generateExercise(topic, language, level, exerciseType);
    await this._incrementQuota(userId, 'conversation');

    return { exercise };
  }

  // ============================================================
  // 对话历史
  // ============================================================

  async getConversations(userId) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        language: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(userId, conversationId) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, createdAt: true },
        },
      },
    });
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  async deleteConversation(userId, conversationId) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');

    await prisma.aIMessage.deleteMany({ where: { conversationId } });
    await prisma.aIConversation.delete({ where: { id: conversationId } });

    return { success: true };
  }

  // ============================================================
  // 额度管理
  // ============================================================

  async getQuota(userId) {
    const quota = await prisma.userQuota.findUnique({ where: { userId } });
    if (!quota) {
      return { conversation: { used: 0, max: 5 }, correction: { used: 0, max: 3 } };
    }

    return {
      conversation: { used: quota.dailyConversation, max: quota.maxConversation },
      correction: { used: quota.dailyCorrection, max: quota.maxCorrection },
    };
  }

  async _checkQuota(userId, type) {
    const quota = await prisma.userQuota.findUnique({ where: { userId } });
    if (!quota) {
      return { allowed: true, used: 0, max: 5 };
    }

    // 检查是否需要重置
    const now = new Date();
    if (quota.resetAt && now >= quota.resetAt) {
      await prisma.userQuota.update({
        where: { userId },
        data: {
          dailyConversation: 0,
          dailyCorrection: 0,
          resetAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0),
        },
      });
      return { allowed: true, used: 0, max: type === 'conversation' ? quota.maxConversation : quota.maxCorrection };
    }

    const used = type === 'conversation' ? quota.dailyConversation : quota.dailyCorrection;
    const max = type === 'conversation' ? quota.maxConversation : quota.maxCorrection;

    return { allowed: used < max, used, max };
  }

  async _incrementQuota(userId, type) {
    const field = type === 'conversation' ? 'dailyConversation' : 'dailyCorrection';
    await prisma.userQuota.update({
      where: { userId },
      data: { [field]: { increment: 1 } },
    });
  }

  // ============================================================
  // 私有方法
  // ============================================================

  async _getConversationHistory(conversationId) {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
      take: 20,
    });
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  async _saveMessage(conversationId, role, content) {
    await prisma.aIMessage.create({
      data: { conversationId, role, content },
    });
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }
}

module.exports = new AIService();