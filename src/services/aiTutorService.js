// ============================================================
// src/services/aiTutorService.js
// AI 导师对话记录服务 — Module 02 Step 4
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

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
}

module.exports = new AiTutorService();