/**
 * 言道·西班牙语 - 专属Prompt模板
 * 所有Prompt通过AI Gateway统一注入，不硬编码在插件代码中
 */
export const spanishPromptTemplates = {
  domain: 'spanish',
  version: '1.0.0',

  templates: {
    grammar_explanation: {
      system: '你是一个专业的西班牙语语法教师。',
      template: 'Explica la regla gramatical: {grammar_point} en español, con 3 ejemplos.',
      outputFormat: '返回语法解释和例句，格式清晰。',
    },
    vocabulary_practice: {
      system: '你是一个西班牙语词汇教学专家。',
      template: 'Genera 10 palabras en español sobre {theme} con definiciones y ejemplos.',
      outputFormat: '以表格形式返回单词、释义和例句。',
    },
    reading_comprehension: {
      system: '你是一个西班牙语阅读材料编写专家。',
      template: 'Crea un texto de lectura para nivel {level}, aproximadamente {length} palabras, con 5 preguntas.',
      outputFormat: '返回短文和5道理解题（含正确答案）。',
    },
    conversation_practice: {
      system: '你是一个西班牙语会话练习引导者。',
      template: 'Crea un diálogo en español para {scenario} con 5 intercambios cada uno.',
      outputFormat: '返回格式化的对话，标注角色。',
    },
    writing_correction: {
      system: '你是一个西班牙语写作修改专家。',
      template: `Corrige los errores en el siguiente texto en español:
{original_text}`,
      outputFormat: '返回错误标注、修改建议和正确版本。',
    },
  },
};
