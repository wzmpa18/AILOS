/**
 * 言道·英语 - 专属Prompt模板
 * 所有Prompt通过AI Gateway统一注入，不硬编码在插件代码中
 */
export const englishPromptTemplates = {
  domain: 'english',
  version: '1.0.0',

  templates: {
    grammar_explanation: {
      system: '你是一个专业的英语语法教师。',
      template: 'Please explain the English grammar rule: {grammar_point}, with 3 examples.',
      outputFormat: '返回语法解释和例句，格式清晰。',
    },
    vocabulary_practice: {
      system: '你是一个英语词汇教学专家。',
      template: 'Generate 10 English vocabulary words about {theme} with definitions and example sentences.',
      outputFormat: '以表格形式返回单词、释义和例句。',
    },
    reading_comprehension: {
      system: '你是一个英语阅读材料编写专家。',
      template:
        'Create a reading passage suitable for {level} level, approximately {length} words, with 5 comprehension questions.',
      outputFormat: '返回短文和5道理解题（含正确答案）。',
    },
    conversation_practice: {
      system: '你是一个英语会话练习引导者。',
      template: 'Create an English dialogue for {scenario} with 5 exchanges each.',
      outputFormat: '返回格式化的对话，标注角色。',
    },
    writing_correction: {
      system: '你是一个英语写作修改专家。',
      template: `Correct the errors in the following English writing and provide suggestions:
{original_text}`,
      outputFormat: '返回错误标注、修改建议和正确版本。',
    },
  },
};
