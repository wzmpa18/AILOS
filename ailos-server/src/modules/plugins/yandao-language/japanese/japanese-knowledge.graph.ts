/**
 * 言道·日语 - 知识体系定义
 */
export const japaneseKnowledgeGraph = {
  domain: 'japanese',
  domainName: '日语',
  version: '1.0.0',

  // 等级体系
  levels: ['N5入门', 'N4基础', 'N3中级', 'N2中高级', 'N1高级'],

  // 技能维度
  skills: ['词汇', '语法', '阅读', '听力', '会话', '写作'],

  // 知识点树（简化版，实际从知识库加载）
  knowledgeTree: {
    root: {
      id: 'japanese_root',
      title: '日语总览',
      children: [
        {
          id: 'japanese_vocabulary',
          title: '词汇',
          children: [
            { id: 'japanese_vocab_basic', title: '基础词汇', level: 1 },
            { id: 'japanese_vocab_common', title: '常用词汇', level: 2 },
            { id: 'japanese_vocab_advanced', title: '高级词汇', level: 3 },
          ],
        },
        {
          id: 'japanese_grammar',
          title: '语法',
          children: [
            { id: 'japanese_grammar_basic', title: '基础语法', level: 1 },
            { id: 'japanese_grammar_mid', title: '中级语法', level: 2 },
            { id: 'japanese_grammar_advanced', title: '高级语法', level: 3 },
          ],
        },
        {
          id: 'japanese_reading',
          title: '阅读',
          children: [
            { id: 'japanese_reading_beginner', title: '初级阅读', level: 1 },
            { id: 'japanese_reading_intermediate', title: '中级阅读', level: 2 },
            { id: 'japanese_reading_advanced', title: '高级阅读', level: 3 },
          ],
        },
        {
          id: 'japanese_listening',
          title: '听力',
          children: [
            { id: 'japanese_listening_basic', title: '基础听力', level: 1 },
            { id: 'japanese_listening_conv', title: '对话听力', level: 2 },
            { id: 'japanese_listening_news', title: '新闻听力', level: 3 },
          ],
        },
        {
          id: 'japanese_speaking',
          title: '口语',
          children: [
            { id: 'japanese_speaking_pronunciation', title: '发音', level: 1 },
            { id: 'japanese_speaking_daily', title: '日常对话', level: 2 },
            { id: 'japanese_speaking_debate', title: '辩论表达', level: 3 },
          ],
        },
        {
          id: 'japanese_writing',
          title: '写作',
          children: [
            { id: 'japanese_writing_sentence', title: '造句', level: 1 },
            { id: 'japanese_writing_paragraph', title: '段落写作', level: 2 },
            { id: 'japanese_writing_essay', title: '文章写作', level: 3 },
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
