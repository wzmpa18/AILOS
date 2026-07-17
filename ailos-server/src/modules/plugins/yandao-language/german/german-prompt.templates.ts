/**
 * 言道·德语 - 专属Prompt模板
 * 所有Prompt通过AI Gateway统一注入，不硬编码在插件代码中
 */
export const germanPromptTemplates = {
  domain: 'german',
  version: '1.0.0',

  templates: {
    grammar_explanation: {
      system: '你是一个专业的德语语法教师。',
      template: 'Erkläre die deutsche Grammatikregel: {grammar_point} mit 3 Beispielen.',
      outputFormat: '返回语法解释和例句，格式清晰。',
    },
    vocabulary_practice: {
      system: '你是一个德语词汇教学专家。',
      template: 'Generiere 10 deutsche Vokabeln zum Thema {theme} mit Definitionen und Beispielen.',
      outputFormat: '以表格形式返回单词、释义和例句。',
    },
    reading_comprehension: {
      system: '你是一个德语阅读材料编写专家。',
      template: 'Erstelle einen Lesetext für Niveau {level}, ca. {length} Wörter, mit 5 Fragen.',
      outputFormat: '返回短文和5道理解题（含正确答案）。',
    },
    conversation_practice: {
      system: '你是一个德语会话练习引导者。',
      template: 'Erstelle einen deutschen Dialog für {scenario} mit je 5 Austauschen.',
      outputFormat: '返回格式化的对话，标注角色。',
    },
    writing_correction: {
      system: '你是一个德语写作修改专家。',
      template: `Korrigiere die Fehler im folgenden deutschen Text:
{original_text}`,
      outputFormat: '返回错误标注、修改建议和正确版本。',
    },
  },
};
