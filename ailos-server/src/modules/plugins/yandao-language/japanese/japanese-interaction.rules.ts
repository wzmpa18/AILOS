/**
 * 言道·日语 - 交互规则配置
 */
export const japaneseInteractionRules = {
  domain: 'japanese',
  version: '1.0.0',

  // 练习交互规则
  exercise: {
    maxQuestionsPerSession: 20,
    showAnswerAfterAttempts: 3,
    adaptiveDifficulty: true,
    spacedRepetition: true,
    reviewIntervalHours: [4, 24, 72, 168, 336],
  },

  // 学习路径规则
  learningPath: {
    minDailyGoal: 10, // 最低每日目标（分钟）
    maxDailyGoal: 120,
    unlockThreshold: 0.8, // 解锁下一节点的通过率
    reviewRatio: 0.3, // 复习内容占比
  },

  // 鼓励规则
  encouragement: {
    streakThresholds: [3, 7, 14, 30, 60, 100, 365],
    achievementTriggers: [
      { name: 'first_lesson', condition: '完成第一课', message: '恭喜完成第一课！这是学习之旅的第一步！' },
      { name: 'ten_lessons', condition: '完成10节课', message: '已经完成10节课了，真了不起！' },
      { name: 'perfect_score', condition: '练习满分', message: '满分！你太厉害了！' },
      { name: 'level_up', condition: '等级提升', message: '恭喜升级！你的努力得到了回报！' },
    ],
  },
};
