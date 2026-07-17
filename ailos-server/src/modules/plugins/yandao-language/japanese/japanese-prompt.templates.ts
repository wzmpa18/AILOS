/**
 * 言道·日语 - 专属Prompt模板
 * 所有Prompt通过AI Gateway统一注入，不硬编码在插件代码中
 */
export const japanesePromptTemplates = {
  domain: 'japanese',
  version: '1.0.0',

  templates: {
    grammar_explanation: {
      system: '你是一个专业的日语语法教师。',
      template: '请用中文解释日语语法点：{grammar_point}，并给出3个例句。',
      outputFormat: '返回语法解释和例句，格式清晰。',
    },
    vocabulary_practice: {
      system: '你是一个日语词汇教学专家。',
      template: '请生成10个关于{theme}的日语单词，包含假名、汉字和中文释义。',
      outputFormat: '以表格形式返回单词、释义和例句。',
    },
    reading_comprehension: {
      system: '你是一个日语阅读材料编写专家。',
      template: '请生成一篇适合{level}水平的日语短文，长度约{length}字，并附5道理解题。',
      outputFormat: '返回短文和5道理解题（含正确答案）。',
    },
    conversation_practice: {
      system: '你是一个日语会话练习引导者。',
      template: '请模拟一个{scenario}场景的日语对话，角色A和角色B各5句。',
      outputFormat: '返回格式化的对话，标注角色。',
    },
    writing_correction: {
      system: '你是一个日语写作修改专家。',
      template: `请纠正以下日语写作中的错误，并给出修改建议：
{original_text}`,
      outputFormat: '返回错误标注、修改建议和正确版本。',
    },
  },
};
