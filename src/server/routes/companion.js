/**
 * 伴读计划路由（模块十一：个性化定制伴读）
 * 
 * GET  /api/companion/plan — 获取用户当前学习计划
 * POST /api/companion/plan — 创建/更新个性化学习计划
 * GET  /api/companion/daily — 获取今日学习任务
 * POST /api/companion/daily/complete — 完成今日任务
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contextResolver = require('../../services/contextResolver');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * GET /api/companion/plan
 * 获取用户当前学习计划
 */
router.get('/plan', authenticate, async (req, res) => {
  try {
    const langCtx = await contextResolver.resolve(req.userId);
    const targetLang = langCtx.primaryTargetLanguage;

    // 获取或创建用户配置
    const companionProfile = await prisma.companionProfile.findUnique({
      where: { userId: req.userId },
    });

    // 获取今日计划
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayPlan = await prisma.dailyLearningPlan.findFirst({
      where: {
        userId: req.userId,
        targetLanguage: targetLang,
        planDate: { gte: today, lt: todayEnd },
      },
    });

    return res.json({
      success: true,
      profile: companionProfile ? {
        name: companionProfile.name,
        personality: companionProfile.personality,
        voiceStyle: companionProfile.voiceStyle,
        avatarEmoji: companionProfile.avatarEmoji,
      } : null,
      todayPlan: todayPlan ? {
        id: todayPlan.id,
        dayNumber: todayPlan.dayNumber,
        focusArea: todayPlan.focusArea,
        scene: todayPlan.scene,
        duration: todayPlan.duration,
        tasks: typeof todayPlan.tasks === 'string' ? JSON.parse(todayPlan.tasks) : todayPlan.tasks,
        status: todayPlan.status,
        score: todayPlan.score,
      } : null,
      targetLanguage: targetLang,
    });
  } catch (error) {
    logger.error('[companion] GET plan failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/companion/plan
 * body: { goal, dailyMinutes, weaknesses, targetLevel, personality }
 * 创建/更新个性化学习计划
 */
router.post('/plan', authenticate, async (req, res) => {
  try {
    const { goal, dailyMinutes, weaknesses, targetLevel, personality } = req.body || {};
    const langCtx = await contextResolver.resolve(req.userId);
    const targetLang = langCtx.primaryTargetLanguage;

    // 保存伴读配置
    const profileData = {
      name: personality || 'AILOS',
      description: goal ? `学习目标：${goal}，每日${dailyMinutes || 30}分钟` : '我的学习搭子',
      personality: goal || '日常交流',
      voiceStyle: null,
      avatarEmoji: getEmoji(goal),
    };

    await prisma.companionProfile.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...profileData },
      update: profileData,
    });

    // 生成每日学习计划
    const today = new Date();
    const planData = generateDailyPlan(targetLang, goal, dailyMinutes || 30, weaknesses || [], targetLevel || 'beginner');

    const existing = await prisma.dailyLearningPlan.findFirst({
      where: {
        userId: req.userId,
        targetLanguage: targetLang,
        planDate: { gte: new Date(today.setHours(0, 0, 0, 0)), lt: new Date(today.setHours(23, 59, 59, 999)) },
      },
    });

    let todayPlan;
    if (existing) {
      todayPlan = await prisma.dailyLearningPlan.update({
        where: { id: existing.id },
        data: {
          focusArea: planData.focusArea,
          scene: planData.scene,
          duration: planData.duration,
          tasks: planData.tasks,
        },
      });
    } else {
      todayPlan = await prisma.dailyLearningPlan.create({
        data: {
          userId: req.userId,
          dayNumber: 1,
          planDate: new Date(),
          targetLanguage: targetLang,
          focusArea: planData.focusArea,
          scene: planData.scene,
          duration: planData.duration,
          tasks: planData.tasks,
          status: 'pending',
        },
      });
    }

    return res.json({
      success: true,
      profile: profileData,
      todayPlan: {
        id: todayPlan.id,
        focusArea: todayPlan.focusArea,
        scene: todayPlan.scene,
        duration: todayPlan.duration,
        tasks: typeof todayPlan.tasks === 'string' ? JSON.parse(todayPlan.tasks) : todayPlan.tasks,
        status: todayPlan.status,
      },
    });
  } catch (error) {
    logger.error('[companion] POST plan failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/companion/daily/complete
 * body: { planId, score }
 * 完成今日学习任务
 */
router.post('/daily/complete', authenticate, async (req, res) => {
  try {
    const { planId, score } = req.body || {};
    if (!planId) {
      return res.status(400).json({ success: false, error: 'planId required' });
    }

    const plan = await prisma.dailyLearningPlan.update({
      where: { id: planId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        score: score || 80,
      },
    });

    // 生成次日计划
    const langCtx = await contextResolver.resolve(req.userId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const existingNext = await prisma.dailyLearningPlan.findFirst({
      where: {
        userId: req.userId,
        planDate: { gte: tomorrow },
      },
    });

    if (!existingNext) {
      const nextDay = (plan.dayNumber || 0) + 1;
      const nextFocus = score >= 80 ? 'listening' : plan.focusArea; // 正确率高切换模块，低则强化
      await prisma.dailyLearningPlan.create({
        data: {
          userId: req.userId,
          dayNumber: nextDay,
          planDate: tomorrow,
          targetLanguage: plan.targetLanguage,
          focusArea: nextFocus,
          scene: 'daily',
          duration: plan.duration,
          tasks: buildTasksForArea(nextFocus, plan.targetLanguage),
          status: 'pending',
        },
      });
    }

    return res.json({ success: true, completed: true });
  } catch (error) {
    logger.error('[companion] complete failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 辅助函数 ====================

function getEmoji(goal) {
  const map = { '日常交流': '💬', '应试备考': '📚', '商务职场': '💼', '旅行': '✈️' };
  return map[goal] || '🤖';
}

function generateDailyPlan(lang, goal, minutes, weaknesses, level) {
  const focusAreas = ['vocabulary', 'grammar', 'listening', 'speaking'];
  const focus = weaknesses.length > 0 ? weaknesses[0] : focusAreas[Math.floor(Math.random() * 4)];

  return {
    focusArea: focus,
    scene: goal || 'daily',
    duration: minutes,
    tasks: buildTasksForArea(focus, lang),
  };
}

function buildTasksForArea(focusArea, lang) {
  const taskTemplates = {
    vocabulary: [
      { type: 'learn', title: `学习10个${lang}核心词汇`, duration: 10, link: 'vocabulary.html' },
      { type: 'practice', title: '词汇选择题练习', duration: 10, link: 'practice.html' },
      { type: 'review', title: '复习昨日生词', duration: 5, link: 'vocabulary.html?mode=review' },
    ],
    grammar: [
      { type: 'learn', title: '学习一个核心语法点', duration: 10, link: 'sentences.html?module=grammar' },
      { type: 'practice', title: '语法填空练习', duration: 10, link: 'practice.html' },
      { type: 'review', title: '错题复习', duration: 5, link: 'vocabulary.html?mode=wrong' },
    ],
    listening: [
      { type: 'listen', title: '听力训练（短对话）', duration: 15, link: 'practice.html?mode=listening' },
      { type: 'practice', title: '听写练习', duration: 10, link: 'practice.html' },
    ],
    speaking: [
      { type: 'speak', title: 'AI对话练习', duration: 10, link: 'chat.html' },
      { type: 'practice', title: '跟读训练', duration: 10, link: 'practice.html?mode=speak' },
    ],
  };

  return taskTemplates[focusArea] || taskTemplates.vocabulary;
}

module.exports = router;
