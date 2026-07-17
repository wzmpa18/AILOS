/**
 * 言道·英语 - 知识体系定义
 */
export const englishKnowledgeGraph = {
  domain: 'english',
  domainName: '英语',
  version: '1.0.0',

  // 等级体系
  levels: ['A1入门', 'A2基础', 'B1中级', 'B2中高级', 'C1高级'],

  // 技能维度
  skills: ['词汇', '语法', '阅读', '听力', '口语', '写作'],

  // 知识点树（简化版，实际从知识库加载）
  knowledgeTree: {
    root: {
      id: 'english_root',
      title: '英语总览',
      children: [
        {
          id: 'english_vocabulary',
          title: '词汇',
          children: [
            { id: 'english_vocab_basic', title: '基础词汇', level: 1 },
            { id: 'english_vocab_common', title: '常用词汇', level: 2 },
            { id: 'english_vocab_advanced', title: '高级词汇', level: 3 },
          ],
        },
        {
          id: 'english_grammar',
          title: '语法',
          children: [
            { id: 'english_grammar_basic', title: '基础语法', level: 1 },
            { id: 'english_grammar_mid', title: '中级语法', level: 2 },
            { id: 'english_grammar_advanced', title: '高级语法', level: 3 },
          ],
        },
        {
          id: 'english_reading',
          title: '阅读',
          children: [
            { id: 'english_reading_beginner', title: '初级阅读', level: 1 },
            { id: 'english_reading_intermediate', title: '中级阅读', level: 2 },
            { id: 'english_reading_advanced', title: '高级阅读', level: 3 },
          ],
        },
        {
          id: 'english_listening',
          title: '听力',
          children: [
            { id: 'english_listening_basic', title: '基础听力', level: 1 },
            { id: 'english_listening_conv', title: '对话听力', level: 2 },
            { id: 'english_listening_news', title: '新闻听力', level: 3 },
          ],
        },
        {
          id: 'english_speaking',
          title: '口语',
          children: [
            { id: 'english_speaking_pronunciation', title: '发音', level: 1 },
            { id: 'english_speaking_daily', title: '日常对话', level: 2 },
            { id: 'english_speaking_debate', title: '辩论表达', level: 3 },
          ],
        },
        {
          id: 'english_writing',
          title: '写作',
          children: [
            { id: 'english_writing_sentence', title: '造句', level: 1 },
            { id: 'english_writing_paragraph', title: '段落写作', level: 2 },
            { id: 'english_writing_essay', title: '文章写作', level: 3 },
          ],
        },
      ],
    },
  },

  // 技能维度权重
  skillWeights: {
    vocabulary: 0.25,
    grammar: 0.25,
    reading: 0.15,
    listening: 0.15,
    speaking: 0.1,
    writing: 0.1,
  },
};
