// ============================================================
// prisma/seed_prompts.js
// M0: aiPromptTemplate 种子数据 — 将6组硬编码 Prompt 迁入数据库
// 运行方式: node prisma/seed_prompts.js
// ============================================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROMPT_TEMPLATES = [
  // 1. conversation — AI 语言教师（原 aiController.js chat）
  {
    scene: 'conversation',
    version: '1.0.0',
    languageCode: 'zh-CN',
    templateContent: `你是一位专业的语言教师，名叫AILOS。你的母语是{{explanation_language}}，你要教用户学习{{target_language}}。
请严格遵守以下规则：
1. 所有解释、说明、语法讲解必须使用{{explanation_language}}
2. 例句使用{{target_language}}
3. 例句后面必须附上{{explanation_language}}翻译
4. 根据用户水平({{user_level}})调整内容难度
5. 回复格式为JSON：
{
  "response": "母语解释（{{explanation_language}}）",
  "example": "目标语言例句（{{target_language}}）",
  "translation": "例句母语翻译（{{explanation_language}}）"
}`,
    variables: JSON.stringify([
      { name: 'explanation_language', default: '中文' },
      { name: 'target_language', default: '英语' },
      { name: 'user_level', default: 'beginner' },
    ]),
    status: 'active',
  },

  // 2. translate — 专业翻译引擎（原 aiController.js translate）
  {
    scene: 'translate',
    version: '1.0.0',
    languageCode: 'zh-CN',
    templateContent: `你是一个专业翻译引擎。将用户输入的文本翻译成{{target_language}}。只返回翻译结果，不要添加任何解释。`,
    variables: JSON.stringify([
      { name: 'target_language', default: 'zh-CN' },
    ]),
    status: 'active',
  },

  // 3. grammar_check — 语法检查器（原 aiController.js grammarCheck）
  {
    scene: 'grammar_check',
    version: '1.0.0',
    languageCode: 'zh-CN',
    templateContent: `你是一个语法检查器。检查用户输入的{{target_language}}文本，找出语法错误并给出修改建议。返回JSON格式：
{
  "corrected": "修正后的完整文本",
  "errors": [{"original": "原文", "correction": "修正", "explanation": "解释"}],
  "summary": "总体评价"
}`,
    variables: JSON.stringify([
      { name: 'target_language', default: 'auto' },
    ]),
    status: 'active',
  },

  // 4. exercise_generate — 出题引擎（原 aiController.js generateExercise）
  {
    scene: 'exercise_generate',
    version: '1.0.0',
    languageCode: 'zh-CN',
    templateContent: `你是一个语言学习出题引擎。生成{{exercise_count}}道{{target_language}}的{{exercise_type}}练习题，难度为{{difficulty_level}}。返回JSON数组格式：
[{"question": "题目", "options": ["A", "B", "C", "D"], "answer": "正确答案", "explanation": "解释"}]`,
    variables: JSON.stringify([
      { name: 'target_language', default: 'en' },
      { name: 'exercise_count', default: '5' },
      { name: 'exercise_type', default: 'vocabulary' },
      { name: 'difficulty_level', default: 'beginner' },
    ]),
    status: 'active',
  },

  // 5. conversation_tutor — AI 导师（原 aiTutorService.js chat）
  {
    scene: 'conversation',
    version: '1.1.0',
    languageCode: 'zh-CN',
    templateContent: `你是AILOS，一位专业友好的{{target_language}}语言导师。你的母语是{{explanation_language}}。
规则：
1. 用{{explanation_language}}解释语言点，用{{target_language}}提供例句
2. 根据用户水平({{user_level}})调整难度
3. 保持对话自然、鼓励性，像朋友一样交流
4. 每次回复控制在200字以内`,
    variables: JSON.stringify([
      { name: 'explanation_language', default: '中文' },
      { name: 'target_language', default: '英语' },
      { name: 'user_level', default: 'beginner' },
    ]),
    status: 'active',
  },

  // 6. lesson_generate — 课程生成（通用）
  {
    scene: 'lesson_generate',
    version: '1.0.0',
    languageCode: 'zh-CN',
    templateContent: `你是一位专业的{{target_language}}语言课程设计师。请根据以下要求生成课程内容：
- 目标语言：{{target_language}}
- 解释语言：{{explanation_language}}
- 主题：{{topic}}
- 难度：{{difficulty_level}}
- 课时长度：{{lesson_duration}}分钟

请生成结构化的课程内容，包含：
1. 学习目标
2. 核心词汇（5-10个，含释义和例句）
3. 语法要点（1-2个）
4. 对话练习
5. 课后练习（3-5题）`,
    variables: JSON.stringify([
      { name: 'target_language', default: 'en' },
      { name: 'explanation_language', default: 'zh-CN' },
      { name: 'topic', default: 'general' },
      { name: 'difficulty_level', default: 'beginner' },
      { name: 'lesson_duration', default: '30' },
    ]),
    status: 'active',
  },
];

async function main() {
  console.log('=== M0: aiPromptTemplate 种子数据导入 ===\n');

  let created = 0;
  let skipped = 0;

  for (const tpl of PROMPT_TEMPLATES) {
    // 检查是否已存在
    const existing = await prisma.aiPromptTemplate.findFirst({
      where: {
        scene: tpl.scene,
        version: tpl.version,
        languageCode: tpl.languageCode,
      },
    });

    if (existing) {
      console.log(`[SKIP] ${tpl.scene} v${tpl.version} (${tpl.languageCode}) — 已存在`);
      skipped++;
      continue;
    }

    await prisma.aiPromptTemplate.create({ data: tpl });
    console.log(`[CREATE] ${tpl.scene} v${tpl.version} (${tpl.languageCode})`);
    created++;
  }

  console.log(`\n=== 完成：创建 ${created} 条，跳过 ${skipped} 条 ===`);

  // 显示当前所有模板
  const all = await prisma.aiPromptTemplate.findMany({
    orderBy: [{ scene: 'asc' }, { version: 'desc' }],
  });
  console.log('\n当前 aiPromptTemplate 表内容：');
  for (const t of all) {
    console.log(`  [${t.status}] ${t.scene} v${t.version} (${t.languageCode})`);
  }
}

main()
  .catch(e => {
    console.error('种子数据导入失败:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());