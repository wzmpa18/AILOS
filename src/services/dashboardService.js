const prisma = require('../config/database');
const logger = require('../utils/logger');

class DashboardService {
  /**
   * Get personalized dashboard data for a user
   * Aggregates: learning progress, ability model, recent activity, goals, profile
   */
  async getDashboard(userId, languageContext) {
    try {
      const primaryLanguage = languageContext?.primaryTargetLanguage || 'ja';

      // Parallel fetch all dashboard data
      const [
        user,
        learningLanguages,
        todayEvents,
        abilityModels,
        recentEvents,
        activeGoals,
        learningProfile,
        visibleMemories,
        weeklyStats
      ] = await Promise.all([
        this._getUserBasic(userId),
        this._getLearningLanguages(userId),
        this._getTodayEvents(userId),
        this._getAbilityModels(userId, primaryLanguage),
        this._getRecentEvents(userId, 10),
        this._getActiveGoals(userId),
        this._getLearningProfile(userId),
        this._getVisibleMemories(userId, 5),
        this._getWeeklyStats(userId)
      ]);

      return {
        user,
        primaryLanguage,
        learningLanguages,
        todayStats: this._computeTodayStats(todayEvents),
        abilityModel: abilityModels,
        recentActivity: recentEvents,
        activeGoals,
        learningProfile,
        highlights: visibleMemories,
        weeklyStats
      };
    } catch (error) {
      logger.error('DashboardService.getDashboard failed:', error);
      throw error;
    }
  }

  async _getUserBasic(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        membershipLevel: true,
        uniqueId: true
      }
    });
    return user;
  }

  async _getLearningLanguages(userId) {
    const languages = await prisma.userLearningLanguage.findMany({
      where: { userId, status: 'active' },
      orderBy: { priority: 'asc' },
      select: {
        languageCode: true,
        level: true,
        priority: true
      }
    });

    // Fetch progress for each language
    const withProgress = await Promise.all(
      languages.map(async (lang) => {
        const progress = await prisma.learningProgress.findUnique({
          where: { userId_language: { userId, language: lang.languageCode } },
          select: {
            totalWords: true,
            totalLessons: true,
            totalTime: true,
            currentStreak: true,
            level: true
          }
        });
        return {
          languageCode: lang.languageCode,
          level: lang.level,
          priority: lang.priority,
          progress: progress || {
            totalWords: 0,
            totalLessons: 0,
            totalTime: 0,
            currentStreak: 0,
            level: 'beginner'
          }
        };
      })
    );

    return withProgress;
  }

  async _getTodayEvents(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.learningEvent.findMany({
      where: {
        userId,
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _getAbilityModels(userId, primaryLanguage) {
    const models = await prisma.learningAbilityModel.findMany({
      where: {
        userId,
        languageCode: primaryLanguage
      },
      select: {
        dimension: true,
        score: true,
        level: true
      }
    });

    // Build structured ability map
    const abilityMap = {
      vocabulary: { score: 0, level: 'beginner' },
      grammar: { score: 0, level: 'beginner' },
      listening: { score: 0, level: 'beginner' },
      speaking: { score: 0, level: 'beginner' },
      reading: { score: 0, level: 'beginner' },
      writing: { score: 0, level: 'beginner' }
    };

    for (const m of models) {
      if (abilityMap[m.dimension]) {
        abilityMap[m.dimension] = {
          score: Math.round(m.score),
          level: m.level
        };
      }
    }

    return abilityMap;
  }

  async _getRecentEvents(userId, limit) {
    const events = await prisma.learningEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        languageCode: true,
        data: true,
        duration: true,
        createdAt: true
      }
    });

    return events.map(e => ({
      id: e.id,
      type: e.eventType,
      language: e.languageCode,
      label: this._getEventLabel(e.eventType),
      duration: e.duration,
      time: e.createdAt.toISOString()
    }));
  }

  async _getActiveGoals(userId) {
    const goals = await prisma.learningGoal.findMany({
      where: {
        userId,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        goalType: true,
        targetLanguage: true,
        targetLevel: true,
        description: true,
        deadlineAt: true
      }
    });

    return goals.map(g => ({
      id: g.id,
      type: g.goalType,
      language: g.targetLanguage,
      targetLevel: g.targetLevel,
      description: g.description,
      deadline: g.deadlineAt?.toISOString() || null
    }));
  }

  async _getLearningProfile(userId) {
    const profile = await prisma.learningProfile.findUnique({
      where: { userId },
      select: {
        overallLevel: true,
        strengths: true,
        weaknesses: true,
        learningStyle: true
      }
    });

    if (!profile) {
      return { overallLevel: 'beginner', strengths: [], weaknesses: [], learningStyle: null };
    }

    return {
      overallLevel: profile.overallLevel,
      strengths: Array.isArray(profile.strengths) ? profile.strengths : [],
      weaknesses: Array.isArray(profile.weaknesses) ? profile.weaknesses : [],
      learningStyle: profile.learningStyle
    };
  }

  async _getVisibleMemories(userId, limit) {
    const memories = await prisma.learningMemory.findMany({
      where: {
        userId,
        visibility: 'USER_VISIBLE_MEMORY'
      },
      orderBy: { importance: 'desc' },
      take: limit,
      select: {
        memoryType: true,
        content: true,
        importance: true
      }
    });

    return memories.map(m => ({
      type: m.memoryType,
      content: m.content,
      importance: m.importance
    }));
  }

  async _getWeeklyStats(userId) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const events = await prisma.learningEvent.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo }
      },
      select: {
        eventType: true,
        duration: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyMap = {};
    for (const e of events) {
      const day = e.createdAt.toISOString().split('T')[0];
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, events: 0, minutes: 0 };
      }
      dailyMap[day].events++;
      dailyMap[day].minutes += Math.round((e.duration || 0) / 60);
    }

    return Object.values(dailyMap);
  }

  _computeTodayStats(events) {
    const stats = {
      wordsLearned: 0,
      lessonsCompleted: 0,
      studyTimeSeconds: 0,
      quizzesTaken: 0
    };

    for (const e of events) {
      if (e.eventType === 'vocabulary_learned') stats.wordsLearned++;
      if (e.eventType === 'lesson_complete') stats.lessonsCompleted++;
      if (e.eventType === 'quiz_complete') stats.quizzesTaken++;
      stats.studyTimeSeconds += (e.duration || 0);
    }

    return stats;
  }

  _getEventLabel(eventType) {
    const labels = {
      'lesson_complete': 'Completed a lesson',
      'quiz_complete': 'Finished a quiz',
      'vocabulary_learned': 'Learned new words',
      'grammar_practice': 'Practiced grammar',
      'listening_practice': 'Listening practice',
      'speaking_practice': 'Speaking practice',
      'reading_practice': 'Reading practice',
      'writing_practice': 'Writing practice'
    };
    return labels[eventType] || eventType;
  }
}

module.exports = new DashboardService();