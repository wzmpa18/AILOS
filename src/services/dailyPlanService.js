/**
 * src/services/dailyPlanService.js
 * 30天口语速成服务 — Phase 2
 *
 * 功能：
 *   - generatePlan(userId, targetLanguage, level, duration) - AI生成30天每日学习计划
 *   - getTodayPlan(userId) - 获取今日计划
 *   - completeDay(userId, dayNumber, score) - 完成当日学习
 *   - getProgress(userId) - 获取30天进度
 *
 * 所有AI调用走 aiGateway
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const aiGateway = getAIGateway();

class DailyPlanService {
  /**
   * AI生成30天每日学习计划
   * @param {string} userId - 用户ID
   * @param {string} targetLanguage - 目标语言
   * @param {string} level - 用户等级 (beginner|intermediate|advanced)
   * @param {number} duration - 计划天数 (默认30)
   * @returns {Promise<Object>} 生成的计划对象
   */
  async generatePlan(userId, targetLanguage, level, duration = 30) {
    try {
      if (!userId || !targetLanguage || !level) {
        throw new Error('userId, targetLanguage, and level are required');
      }

      // 检查是否已存在进行中的计划
      const existingPlan = await prisma.dailyPlan.findFirst({
        where: { userId, status: 'active' },
      });
      if (existingPlan) {
        logger.info('User already has an active plan, returning existing', { userId, planId: existingPlan.id });
        return existingPlan;
      }

      const languageContext = {
        primaryTargetLanguage: targetLanguage,
        explanationLanguage: 'zh-CN',
      };

      // 通过 aiGateway 生成30天计划
      const aiResponse = await aiGateway.call({
        scene: 'lesson_generate',
        userId,
        languageContext,
        params: {
          topic: `30-day oral Chinese speaking crash course for ${targetLanguage} learners`,
          level,
          duration,
          language: targetLanguage,
          type: 'daily_plan',
        },
      });

      // 解析AI返回的计划内容
      const planContent = this._parsePlanContent(aiResponse.result, duration);

      // 创建计划记录
      const plan = await prisma.dailyPlan.create({
        data: {
          userId,
          targetLanguage,
          level,
          duration,
          status: 'active',
          planData: planContent,
          currentDay: 0,
          totalDays: duration,
          progress: 0,
          metadata: {
            generatedAt: new Date().toISOString(),
            aiSource: aiResponse.source,
          },
        },
      });

      logger.info('Daily plan generated successfully', { userId, planId: plan.id, targetLanguage });
      return plan;
    } catch (error) {
      logger.error('Generate daily plan failed:', error);
      throw error;
    }
  }

  /**
   * 获取今日学习计划
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 今日计划内容
   */
  async getTodayPlan(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const plan = await prisma.dailyPlan.findFirst({
        where: { userId, status: 'active' },
      });

      if (!plan) {
        return { hasPlan: false, message: 'No active plan found. Please generate a plan first.' };
      }

      const currentDay = plan.currentDay + 1;
      if (currentDay > plan.duration) {
        return { hasPlan: true, completed: true, message: 'All 30 days completed!', progress: 100 };
      }

      const dayContent = plan.planData && plan.planData.days
        ? plan.planData.days.find(d => d.day === currentDay)
        : null;

      // 检查今日是否已完成
      const todayCompletion = await prisma.dailyPlanCompletion.findFirst({
        where: {
          planId: plan.id,
          dayNumber: currentDay,
        },
      });

      return {
        hasPlan: true,
        planId: plan.id,
        targetLanguage: plan.targetLanguage,
        level: plan.level,
        currentDay,
        totalDays: plan.duration,
        progress: plan.progress,
        content: dayContent || null,
        todayCompleted: !!todayCompletion,
        todayScore: todayCompletion ? todayCompletion.score : null,
      };
    } catch (error) {
      logger.error('Get today plan failed:', error);
      throw error;
    }
  }

  /**
   * 完成当日学习
   * @param {string} userId - 用户ID
   * @param {number} dayNumber - 完成的天数
   * @param {number} score - 当日得分 (0-100)
   * @returns {Promise<Object>} 完成结果
   */
  async completeDay(userId, dayNumber, score = 0) {
    try {
      if (!userId || !dayNumber) {
        throw new Error('userId and dayNumber are required');
      }

      const plan = await prisma.dailyPlan.findFirst({
        where: { userId, status: 'active' },
      });

      if (!plan) {
        throw new Error('No active plan found');
      }

      if (dayNumber > plan.duration) {
        throw new Error(`Day number ${dayNumber} exceeds plan duration ${plan.duration}`);
      }

      // 检查是否已完成
      const existingCompletion = await prisma.dailyPlanCompletion.findFirst({
        where: { planId: plan.id, dayNumber },
      });

      if (existingCompletion) {
        return {
          success: true,
          alreadyCompleted: true,
          dayNumber,
          score: existingCompletion.score,
          completedAt: existingCompletion.completedAt,
        };
      }

      // 记录完成
      const completion = await prisma.dailyPlanCompletion.create({
        data: {
          planId: plan.id,
          userId,
          dayNumber,
          score,
          completedAt: new Date(),
        },
      });

      // 更新计划进度
      const completedDays = await prisma.dailyPlanCompletion.count({
        where: { planId: plan.id },
      });
      const newProgress = Math.round((completedDays / plan.duration) * 100);

      const updateData = {
        currentDay: Math.max(plan.currentDay, dayNumber),
        progress: newProgress,
      };

      if (newProgress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      await prisma.dailyPlan.update({
        where: { id: plan.id },
        data: updateData,
      });

      logger.info('Daily plan day completed', { userId, planId: plan.id, dayNumber, score, progress: newProgress });

      return {
        success: true,
        dayNumber,
        score,
        progress: newProgress,
        planCompleted: newProgress >= 100,
        completedAt: completion.completedAt,
      };
    } catch (error) {
      logger.error('Complete day failed:', error);
      throw error;
    }
  }

  /**
   * 获取30天学习进度
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 进度详情
   */
  async getProgress(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const plan = await prisma.dailyPlan.findFirst({
        where: { userId, status: 'active' },
      });

      if (!plan) {
        return { hasPlan: false, message: 'No active plan found' };
      }

      const completions = await prisma.dailyPlanCompletion.findMany({
        where: { planId: plan.id },
        orderBy: { dayNumber: 'asc' },
      });

      const completedDays = completions.map(c => ({
        dayNumber: c.dayNumber,
        score: c.score,
        completedAt: c.completedAt,
      }));

      const totalScore = completions.reduce((sum, c) => sum + c.score, 0);
      const averageScore = completions.length > 0
        ? Math.round(totalScore / completions.length)
        : 0;

      // 计算连续学习天数
      const streak = this._calculateStreak(completions);

      // 计算剩余天数
      const remainingDays = plan.duration - plan.currentDay;

      return {
        hasPlan: true,
        planId: plan.id,
        targetLanguage: plan.targetLanguage,
        level: plan.level,
        duration: plan.duration,
        currentDay: plan.currentDay,
        progress: plan.progress,
        completedDays,
        totalCompletions: completions.length,
        averageScore,
        streak,
        remainingDays,
        status: plan.status,
        startedAt: plan.createdAt,
        estimatedCompletion: remainingDays > 0
          ? this._estimateCompletionDate(new Date(), remainingDays)
          : null,
      };
    } catch (error) {
      logger.error('Get progress failed:', error);
      throw error;
    }
  }

  // ==================== 内部方法 ====================

  /**
   * 解析AI返回的计划内容
   * @param {any} aiResult - AI返回结果
   * @param {number} duration - 计划天数
   * @returns {Object} 结构化的计划数据
   */
  _parsePlanContent(aiResult, duration) {
    try {
      // 如果AI返回的是结构化JSON，直接使用
      if (typeof aiResult === 'object' && aiResult.days) {
        return aiResult;
      }

      // 如果返回的是choices格式
      const content = aiResult.choices?.[0]?.message?.content || aiResult.content || '';
      if (!content) {
        return this._generateFallbackPlan(duration);
      }

      // 尝试从文本中提取JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.days) return parsed;
        } catch (e) {
          logger.debug('Failed to parse AI response as JSON, using fallback');
        }
      }

      return this._generateFallbackPlan(duration);
    } catch (error) {
      logger.error('Parse plan content failed:', error);
      return this._generateFallbackPlan(duration);
    }
  }

  /**
   * 生成回退计划（AI不可用时的兜底方案）
   */
  _generateFallbackPlan(duration) {
    const days = [];
    for (let i = 1; i <= duration; i++) {
      const phase = i <= 10 ? '基础发音' : i <= 20 ? '日常对话' : '实战演练';
      days.push({
        day: i,
        phase,
        title: `第${i}天：${phase}训练`,
        topics: [
          `${phase}核心词汇学习`,
          `${phase}句型练习`,
          `${phase}情景对话`,
        ],
        exercises: [
          { type: 'vocabulary', count: 10, description: '核心词汇记忆' },
          { type: 'speaking', count: 5, description: '口语跟读练习' },
          { type: 'dialogue', count: 1, description: '情景对话模拟' },
        ],
        tips: `坚持每天练习，重点掌握${phase}的基础知识`,
        estimatedMinutes: 25,
      });
    }
    return { days, totalDays: duration, generatedBy: 'fallback' };
  }

  /**
   * 计算连续学习天数
   */
  _calculateStreak(completions) {
    if (!completions || completions.length === 0) return 0;

    const sortedDays = completions
      .map(c => new Date(c.completedAt).toISOString().split('T')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort()
      .reverse();

    let streak = 1;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
      return 0;
    }

    for (let i = 0; i < sortedDays.length - 1; i++) {
      const current = new Date(sortedDays[i]);
      const previous = new Date(sortedDays[i + 1]);
      const diffDays = (current - previous) / 86400000;
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 估算完成日期
   */
  _estimateCompletionDate(startDate, remainingDays) {
    const date = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < remainingDays) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
    return date.toISOString().split('T')[0];
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