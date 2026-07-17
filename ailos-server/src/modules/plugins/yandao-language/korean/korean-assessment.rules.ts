/**
 * 言道·韩语 - 测评规则
 */
export const koreanAssessmentRules = {
  domain: 'korean',
  version: '1.0.0',

  entry: {
    questionCount: 30,
    timeLimitSeconds: 1800,
    dimensions: ['vocabulary', 'grammar', 'reading'],
    passingScore: 0.6,
    levelMapping: {
      0.0: 1,
      0.3: 2,
      0.5: 3,
      0.7: 4,
      0.85: 5,
    },
  },

  progress: {
    questionCount: 20,
    timeLimitSeconds: 1200,
    dimensions: ['comprehensive'],
    passingScore: 0.7,
  },

  levelUp: {
    questionCount: 40,
    timeLimitSeconds: 2400,
    dimensions: ['all'],
    passingScore: 0.8,
  },
};
