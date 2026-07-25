/**
 * src/services/dailyPlanService.js
 * 30天学习计划服务 — Phase 2（已对齐真实 Prisma 模型 DailyLearningPlan）
 *
 * 修复说明（SUP-05）：
 *   原实现引用不存在的 prisma.dailyPlan / prisma.dailyPlanCompletion（schema 中无此模型），
 *   所有 /api/plan/* 调用必然 TypeError 500。
 *   现全部改用真实模型 DailyLearningPlan（userId+dayNumber 唯一，逐日一行）。
 *
 * 功能：
 *   - generatePlan(userId, targetLanguage, level, duration) - 生成30天每日学习计划
 *   - getTodayPlan(userId) - 获取今日计划
 *   - completeDay(userId, dayNumber, score) - 完成当日学习
 *   - getProgress(userId) - 获取30天进度
 *
 * AI 调用走 aiGateway（失败自动回退规则生成）
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const aiGateway = getAIGateway();

class DailyPlanService {
  /**
   * 生成30天每日学习计划（幂等：已有未完成计划则直接返回）
   */
  async generatePlan(userId, targetLanguage, level, duration = 30) {
    try {
      if (!userId || !targetLanguage || !level) {
        throw new Error('userId, targetLanguage, and level are required');
      }

      // 已存在计划且未全部完成 → 返回现有计划
      const existing = await prisma.dailyLearningPlan.findMany({
        where: { userId },
        orderBy: { dayNumber: 'asc' },
      });
      if (existing.length > 0 && existing.some((d) => d.status !== 'completed')) {
        logger.info('User already has an active plan, returning existing', { userId, days: existing.length });
        return this._summarize(existing);
      }

      // AI 生成（失败回退规则生成）
      let days = null;
      try {
        days = await this._aiGenerateDays(userId, targetLanguage, level, duration);
      } catch (e) {
        logger.warn('AI plan generation failed, using fallback', { userId, error: e.message });
      }
      if (!days) days = this._generateFallbackDays(targetLanguage, level, duration);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const rows = days.slice(0, duration).map((d, i) => ({
        userId,
        dayNumber: i + 1,
        planDate: new Date(today.getTime() + i * 86400000),
        targetLanguage,
        focusArea: d.focusArea || 'vocabulary',
        scene: d.scene || 'social',
        duration: d.duration || 30,
        tasks: d.tasks || [],
        contentSnapshot: { title: d.title || `第${i + 1}天`, phase: d.phase || '', level },
        status: 'pending',
      }));

      await prisma.$transaction([
        prisma.dailyLearningPlan.deleteMany({ where: { userId } }),
        prisma.dailyLearningPlan.createMany({ data: rows }),
      ]);

      const created = await prisma.dailyLearningPlan.findMany({
        where: { userId }, orderBy: { dayNumber: 'asc' },
      });
      logger.info('Daily plan generated successfully', { userId, targetLanguage, days: created.length });
      return this._summarize(created);
    } catch (error) {
      logger.error('Generate daily plan failed:', error);
      throw error;
    }
  }

  /**
   * 获取今日学习计划（首个未完成的天，若当日之前有跳过则以日期定位）
   */
  async getTodayPlan(userId) {
    try {
      if (!userId) throw new Error('userId is required');

      const all = await prisma.dailyLearningPlan.findMany({
        where: { userId }, orderBy: { dayNumber: 'asc' },
      });
      if (all.length === 0) {
        return { hasPlan: false, message: 'No active plan found. Please generate a plan first.' };
      }

      const next = all.find((d) => d.status !== 'completed');
      if (!next) {
        return { hasPlan: true, completed: true, message: 'All days completed!', progress: 100 };
      }

      const completedCount = all.filter((d) => d.status === 'completed').length;
      return {
        hasPlan: true,
        targetLanguage: next.targetLanguage,
        level: next.contentSnapshot?.level || null,
        currentDay: next.dayNumber,
        totalDays: all.length,
        progress: Math.round((completedCount / all.length) * 100),
        content: {
          day: next.dayNumber,
          title: next.contentSnapshot?.title || `第${next.dayNumber}天`,
          phase: next.contentSnapshot?.phase || '',
          focusArea: next.focusArea,
          scene: next.scene,
          duration: next.duration,
          tasks: next.tasks,
        },
        todayCompleted: false,
        todayScore: null,
      };
    } catch (error) {
      logger.error('Get today plan failed:', error);
      throw error;
    }
  }

  /**
   * 完成当日学习
   */
  async completeDay(userId, dayNumber, score = 0) {
    try {
      if (!userId || !dayNumber) throw new Error('userId and dayNumber are required');

      const day = await prisma.dailyLearningPlan.findUnique({
        where: { userId_dayNumber: { userId, dayNumber: Number(dayNumber) } },
      });
      if (!day) throw new Error(`Day ${dayNumber} not found in plan`);

      if (day.status === 'completed') {
        return {
          success: true, alreadyCompleted: true, dayNumber: day.dayNumber,
          score: day.score, completedAt: day.completedAt,
        };
      }

      const updated = await prisma.dailyLearningPlan.update({
        where: { userId_dayNumber: { userId, dayNumber: Number(dayNumber) } },
        data: { status: 'completed', score: Math.round(score), completedAt: new Date() },
      });

      const [total, completed] = await Promise.all([
        prisma.dailyLearningPlan.count({ where: { userId } }),
        prisma.dailyLearningPlan.count({ where: { userId, status: 'completed' } }),
      ]);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      logger.info('Daily plan day completed', { userId, dayNumber, score, progress });
      return {
        success: true, dayNumber: updated.dayNumber, score: updated.score,
        progress, planCompleted: progress >= 100, completedAt: updated.completedAt,
      };
    } catch (error) {
      logger.error('Complete day failed:', error);
      throw error;
    }
  }

  /**
   * 获取30天学习进度
   */
  async getProgress(userId) {
    try {
      if (!userId) throw new Error('userId is required');

      const all = await prisma.dailyLearningPlan.findMany({
        where: { userId }, orderBy: { dayNumber: 'asc' },
      });
      if (all.length === 0) return { hasPlan: false, message: 'No active plan found' };

      const completions = all.filter((d) => d.status === 'completed');
      const completedDays = completions.map((d) => ({
        dayNumber: d.dayNumber, score: d.score || 0, completedAt: d.completedAt,
      }));
      const totalScore = completedDays.reduce((s, c) => s + (c.score || 0), 0);
      const averageScore = completedDays.length > 0 ? Math.round(totalScore / completedDays.length) : 0;
      const progress = Math.round((completions.length / all.length) * 100);
      const currentDay = (all.find((d) => d.status !== 'completed') || all[all.length - 1]).dayNumber;
      const remainingDays = all.length - completions.length;

      return {
        hasPlan: true,
        targetLanguage: all[0].targetLanguage,
        level: all[0].contentSnapshot?.level || null,
        duration: all.length,
        currentDay,
        progress,
        completedDays,
        totalCompletions: completions.length,
        averageScore,
        streak: this._calculateStreak(completions),
        remainingDays,
        status: progress >= 100 ? 'completed' : 'active',
        startedAt: all[0].createdAt,
        estimatedCompletion: remainingDays > 0
          ? new Date(Date.now() + remainingDays * 86400000).toISOString().split('T')[0]
          : null,
      };
    } catch (error) {
      logger.error('Get progress failed:', error);
      throw error;
    }
  }

  // ==================== 内部方法 ====================

  _summarize(rows) {
    const completed = rows.filter((d) => d.status === 'completed').length;
    return {
      hasPlan: true,
      targetLanguage: rows[0]?.targetLanguage || null,
      level: rows[0]?.contentSnapshot?.level || null,
      totalDays: rows.length,
      progress: rows.length ? Math.round((completed / rows.length) * 100) : 0,
      days: rows.map((d) => ({
        day: d.dayNumber,
        title: d.contentSnapshot?.title || `第${d.dayNumber}天`,
        focusArea: d.focusArea,
        scene: d.scene,
        duration: d.duration,
        status: d.status,
      })),
    };
  }

  async _aiGenerateDays(userId, targetLanguage, level, duration) {
    const prompt = `为水平${level}的${targetLanguage}学习者制定${duration}天学习计划，返回严格JSON数组（不要任何多余文字）：
[{"day":1,"title":"当日主题","phase":"阶段名","focusArea":"listening|speaking|vocabulary|grammar","scene":"shopping|dining|travel|medical|housing|social","duration":30,"tasks":[{"type":"vocabulary","description":"任务描述","count":10}]}]`;
    const resp = await aiGateway.chatWithMessages(
      [{ role: 'user', content: prompt }],
      { userId, scene: 'chat', temperature: 0.6, maxTokens: 8000 },
    );
    const content = resp.content || '';
    const fence = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = (fence && fence[1]) || content.match(/(\[[\s\S]*\])/)?.[1];
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length < 10) return null;
      const days = [];
      for (let i = 0; i < duration; i++) days.push(parsed[i] || { ...parsed[i % parsed.length], day: i + 1 });
      return days;
    } catch (e) {
      return null;
    }
  }

  /**
   * 规则回退计划（AI不可用时的兜底方案）
   */
  _generateFallbackDays(targetLanguage, level, duration) {
    const focusAreas = ['vocabulary', 'grammar', 'listening', 'speaking'];
    const scenes = ['social', 'dining', 'shopping', 'travel', 'housing', 'medical'];
    const days = [];
    for (let i = 1; i <= duration; i++) {
      const phase = i <= duration / 3 ? '基础巩固' : i <= (duration * 2) / 3 ? '场景应用' : '综合实战';
      days.push({
        day: i,
        title: `第${i}天：${phase}训练`,
        phase,
        focusArea: focusAreas[(i - 1) % focusAreas.length],
        scene: scenes[(i - 1) % scenes.length],
        duration: 30,
        tasks: [
          { type: 'vocabulary', description: `${level}核心词汇记忆`, count: 10 },
          { type: 'speaking', description: '口语跟读练习', count: 5 },
          { type: 'dialogue', description: '情景对话模拟', count: 1 },
        ],
      });
    }
    return days;
  }

  /**
   * 计算连续学习天数
   */
  _calculateStreak(completions) {
    if (!completions || completions.length === 0) return 0;

    const sortedDays = completions
      .filter((c) => c.completedAt)
      .map((c) => new Date(c.completedAt).toISOString().split('T')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();
    if (sortedDays.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diffDays = (new Date(sortedDays[i]) - new Date(sortedDays[i + 1])) / 86400000;
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  }
}

// ==================== 单例 ====================

let _instance = null;

function getDailyPlanService() {
  if (!_instance) {
    _instance = new DailyPlanService();
  }
  return _instance;
}

module.exports = {
  DailyPlanService,
  getDailyPlanService,
};
