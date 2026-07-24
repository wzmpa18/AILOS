// ============================================================
// src/services/srsService.js
// SRS 间隔重复系统 — 基于 SM-2 算法
// 核心：根据用户记忆质量调整复习间隔
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

class SRSService {
  // ============================================================
  // 牌组管理
  // ============================================================

  async getDecks(userId) {
    return prisma.sRSDeck.findMany({
      where: { userId },
      include: {
        _count: { select: { cards: true } },
        cards: {
          where: { nextReviewAt: { lte: new Date() } },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDeck(userId, deckId) {
    const deck = await prisma.sRSDeck.findFirst({
      where: { id: deckId, userId },
      include: {
        cards: {
          orderBy: { nextReviewAt: 'asc' },
        },
      },
    });
    if (!deck) throw new Error('Deck not found');
    return deck;
  }

  async createDeck(userId, data) {
    const { title, language, description } = data;
    return prisma.sRSDeck.create({
      data: { userId, title, language, description: description || null },
    });
  }

  async deleteDeck(userId, deckId) {
    const deck = await prisma.sRSDeck.findFirst({
      where: { id: deckId, userId },
    });
    if (!deck) throw new Error('Deck not found');

    await prisma.sRSReview.deleteMany({
      where: { card: { deckId } },
    });
    await prisma.sRSCard.deleteMany({ where: { deckId } });
    await prisma.sRSDeck.delete({ where: { id: deckId } });

    return { success: true };
  }

  // ============================================================
  // 卡片管理
  // ============================================================

  async addCard(userId, deckId, data) {
    const deck = await prisma.sRSDeck.findFirst({
      where: { id: deckId, userId },
    });
    if (!deck) throw new Error('Deck not found');

    const card = await prisma.sRSCard.create({
      data: {
        deckId,
        front: data.front,
        back: data.back,
        notes: data.notes || null,
      },
    });

    await prisma.sRSDeck.update({
      where: { id: deckId },
      data: { cardCount: { increment: 1 } },
    });

    return card;
  }

  async addCardsBatch(userId, deckId, cards) {
    const deck = await prisma.sRSDeck.findFirst({
      where: { id: deckId, userId },
    });
    if (!deck) throw new Error('Deck not found');

    const created = await prisma.sRSCard.createMany({
      data: cards.map(c => ({
        deckId,
        front: c.front,
        back: c.back,
        notes: c.notes || null,
      })),
    });

    await prisma.sRSDeck.update({
      where: { id: deckId },
      data: { cardCount: { increment: cards.length } },
    });

    return { created: created.count };
  }

  async deleteCard(userId, cardId) {
    const card = await prisma.sRSCard.findFirst({
      where: { id: cardId },
      include: { deck: true },
    });
    if (!card || card.deck.userId !== userId) {
      throw new Error('Card not found');
    }

    await prisma.sRSReview.deleteMany({ where: { cardId } });
    await prisma.sRSCard.delete({ where: { id: cardId } });
    await prisma.sRSDeck.update({
      where: { id: card.deckId },
      data: { cardCount: { decrement: 1 } },
    });

    return { success: true };
  }

  // ============================================================
  // 复习 — 核心 SM-2 算法
  // ============================================================

  /**
   * 获取待复习卡片
   */
  async getDueCards(userId, deckId, limit = 20) {
    const where = {
      deck: { userId, id: deckId },
      nextReviewAt: { lte: new Date() },
    };

    return prisma.sRSCard.findMany({
      where,
      orderBy: { nextReviewAt: 'asc' },
      take: limit,
    });
  }

  /**
   * 获取今日待复习总数
   */
  async getDueCount(userId) {
    const count = await prisma.sRSCard.count({
      where: {
        deck: { userId },
        nextReviewAt: { lte: new Date() },
      },
    });
    return { dueCount: count };
  }

  /**
   * 提交复习结果（SM-2 算法核心）
   * @param {number} quality - 记忆质量 0-5
   *   0: 完全忘记
   *   1: 错误，但看到答案后想起来
   *   2: 错误，但答案看起来很熟悉
   *   3: 正确，但需要努力回忆
   *   4: 正确，稍作思考
   *   5: 完全正确，立即反应
   */
  async reviewCard(userId, cardId, quality, elapsedMs) {
    const card = await prisma.sRSCard.findFirst({
      where: { id: cardId },
      include: { deck: true },
    });
    if (!card || card.deck.userId !== userId) {
      throw new Error('Card not found');
    }

    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be 0-5');
    }

    // 记录复习
    await prisma.sRSReview.create({
      data: {
        cardId,
        userId,
        quality,
        elapsedMs: elapsedMs || null,
      },
    });

    // SM-2 算法计算新参数
    const { newEaseFactor, newInterval, newRepetitions, nextReviewAt } =
      this._sm2(card.easeFactor, card.interval, card.repetitions, quality);

    // 更新卡片
    const updated = await prisma.sRSCard.update({
      where: { id: cardId },
      data: {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReviewAt,
        lastReviewAt: new Date(),
      },
    });

    // 奖励XP
    const xpEarned = quality >= 3 ? 5 : 1;
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpEarned } },
      });
    } catch (e) {
      logger.warn('Failed to award XP:', e.message);
    }

    return {
      card: updated,
      xpEarned,
      nextReviewAt,
    };
  }

  /**
   * SM-2 算法
   * 参考: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
   */
  _sm2(oldEaseFactor, oldInterval, oldRepetitions, quality) {
    let newEaseFactor = oldEaseFactor;
    let newInterval = 0;
    let newRepetitions = 0;

    if (quality >= 3) {
      // 正确回答
      if (oldRepetitions === 0) {
        newInterval = 1; // 1天
      } else if (oldRepetitions === 1) {
        newInterval = 6; // 6天
      } else {
        newInterval = Math.round(oldInterval * oldEaseFactor);
      }
      newRepetitions = oldRepetitions + 1;
    } else {
      // 错误回答 — 重置
      newInterval = 1; // 明天再复习
      newRepetitions = 0;
    }

    // 更新 EF
    newEaseFactor = oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);
    nextReviewAt.setHours(0, 0, 0, 0);

    return { newEaseFactor, newInterval, newRepetitions, nextReviewAt };
  }

  // ============================================================
  // 统计
  // ============================================================

  async getStats(userId) {
    const [totalCards, dueCards, reviewsToday, totalReviews] = await Promise.all([
      prisma.sRSCard.count({ where: { deck: { userId } } }),
      prisma.sRSCard.count({
        where: { deck: { userId }, nextReviewAt: { lte: new Date() } },
      }),
      prisma.sRSReview.count({
        where: {
          userId,
          reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.sRSReview.count({ where: { userId } }),
    ]);

    return {
      totalCards,
      dueCards,
      reviewsToday,
      totalReviews,
      retentionRate: totalReviews > 0
        ? Math.round((totalReviews - reviewsToday) / totalReviews * 100)
        : 0,
    };
  }
}

module.exports = new SRSService();