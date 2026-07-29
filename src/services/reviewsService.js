// ============================================================
// src/services/reviewsService.js
// SRS 间隔复习引擎 — 基于 SM-2 算法
// Module 02 Step 3
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

class ReviewsService {
  /**
   * 获取待复习项（按 dueDate 排序）
   */
  async getDueReviews(userId, limit = 20) {
    return prisma.reviewQueue.findMany({
      where: {
        userId,
        dueDate: { lte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });
  }

  /**
   * 获取今日待复习总数
   */
  async getDueCount(userId) {
    const count = await prisma.reviewQueue.count({
      where: {
        userId,
        dueDate: { lte: new Date() },
      },
    });
    return { dueCount: count };
  }

  /**
   * 提交复习结果（SM-2 算法核心）
   * @param {string} userId - 用户ID
   * @param {string} reviewId - ReviewQueue ID
   * @param {number} quality - 记忆质量 0-5
   *   0: 完全忘记
   *   1: 错误，但看到答案后想起来
   *   2: 错误，但答案看起来很熟悉
   *   3: 正确，但需要努力回忆
   *   4: 正确，稍作思考
   *   5: 完全正确，立即反应
   * @param {number} elapsedMs - 答题耗时（毫秒）
   */
  async submitReview(userId, reviewId, quality, _elapsedMs) {
    const review = await prisma.reviewQueue.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) throw new Error('Review item not found');

    if (quality < 0 || quality > 5) {
      throw new Error('Quality must be 0-5');
    }

    // SM-2 算法计算新参数
    const { newEaseFactor, newInterval, newRepetitions, nextDueDate } =
      this._sm2(review.easeFactor, review.interval, review.repetitions, quality);

    // 更新复习队列
    const updated = await prisma.reviewQueue.update({
      where: { id: reviewId },
      data: {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        dueDate: nextDueDate,
        lastReview: new Date(),
      },
    });

    // 奖励 XP
    const xpEarned = quality >= 3 ? 5 : 1;
    try {
      await prisma.rewardLedger.create({
        data: {
          userId,
          type: 'review',
          amount: xpEarned,
          balance: 0, // 实际余额由上层计算
          refId: reviewId,
        },
      });
    } catch (e) {
      logger.warn('Failed to record XP:', e.message);
    }

    return {
      review: updated,
      xpEarned,
      nextDueDate,
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
      if (oldRepetitions === 0) {
        newInterval = 1;
      } else if (oldRepetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(oldInterval * oldEaseFactor);
      }
      newRepetitions = oldRepetitions + 1;
    } else {
      newInterval = 1;
      newRepetitions = 0;
    }

    // 更新 EF
    newEaseFactor = oldEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + newInterval);
    nextDueDate.setHours(0, 0, 0, 0);

    return { newEaseFactor, newInterval, newRepetitions, nextDueDate };
  }

  /**
   * 获取复习统计
   */
  async getStats(userId) {
    const [totalItems, dueItems, reviewedToday] = await Promise.all([
      prisma.reviewQueue.count({ where: { userId } }),
      prisma.reviewQueue.count({
        where: { userId, dueDate: { lte: new Date() } },
      }),
      prisma.reviewQueue.count({
        where: {
          userId,
          lastReview: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalItems,
      dueItems,
      reviewedToday,
      retentionRate: totalItems > 0
        ? Math.round(((totalItems - dueItems) / totalItems) * 100)
        : 0,
    };
  }
}

module.exports = new ReviewsService();