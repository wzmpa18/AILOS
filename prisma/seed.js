// ============================================================
// prisma/seed.js
// AILOS 种子数据 — 学习内容体系
// 运行: npm run prisma:seed
// ============================================================
const { PrismaClient } = require('../src/config/generated');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AILOS database...\n');

  // ============================================================
  // 1. 语言
  // ============================================================
  console.log('Creating languages...');
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: 'ja' },
      update: { name: '日语', nameEn: 'Japanese', nameLocal: '日本語', isActive: true },
      create: { code: 'ja', name: '日语', nameEn: 'Japanese', nameLocal: '日本語', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'en' },
      update: { name: '英语', nameEn: 'English', nameLocal: 'English', isActive: true },
      create: { code: 'en', name: '英语', nameEn: 'English', nameLocal: 'English', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'ko' },
      update: { name: '韩语', nameEn: 'Korean', nameLocal: '한국어', isActive: true },
      create: { code: 'ko', name: '韩语', nameEn: 'Korean', nameLocal: '한국어', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'fr' },
      update: { name: '法语', nameEn: 'French', nameLocal: 'Français', isActive: true },
      create: { code: 'fr', name: '法语', nameEn: 'French', nameLocal: 'Français', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'es' },
      update: { name: '西班牙语', nameEn: 'Spanish', nameLocal: 'Español', isActive: true },
      create: { code: 'es', name: '西班牙语', nameEn: 'Spanish', nameLocal: 'Español', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'de' },
      update: { name: '德语', nameEn: 'German', nameLocal: 'Deutsch', isActive: true },
      create: { code: 'de', name: '德语', nameEn: 'German', nameLocal: 'Deutsch', isActive: true },
    }),
    prisma.language.upsert({
      where: { code: 'zh-CN' },
      update: { name: '中文', nameEn: 'Chinese', nameLocal: '中文', isActive: true },
      create: { code: 'zh-CN', name: '中文', nameEn: 'Chinese', nameLocal: '中文', isActive: true },
    }),
  ]);
  console.log(`  Created ${languages.length} languages`);

  // ============================================================
  // 2. 日语课程 — N5入门
  // ============================================================
  const ja = await prisma.language.findUnique({ where: { code: 'ja' } });

  console.log('\nCreating Japanese N5 course...');
  const jaN5Course = await prisma.course.upsert({
    where: { id: 1 },
    update: {
      title: '日语N5入门',
      description: '从零开始学日语，掌握五十音图、基础词汇和日常会话。适合完全零基础的日语学习者。',
      level: 'N5',
      sortOrder: 1,
      isPublished: true,
    },
    create: {
      id: 1,
      languageId: ja.id,
      title: '日语N5入门',
      description: '从零开始学日语，掌握五十音图、基础词汇和日常会话。适合完全零基础的日语学习者。',
      level: 'N5',
      sortOrder: 1,
      isPublished: true,
    },
  });

  // Unit 1: 五十音图
  const unit1 = await prisma.courseUnit.upsert({
    where: { id: 1 },
    update: { title: '五十音图', description: '学习日语平假名和片假名', sortOrder: 1 },
    create: { id: 1, courseId: jaN5Course.id, title: '五十音图', description: '学习日语平假名和片假名', sortOrder: 1 },
  });

  await createItems(unit1.id, [
    { itemType: 'lesson', title: 'あ行假名', content: {
      type: 'kana',
      group: 'a-row',
      characters: [
        { kana: 'あ', romaji: 'a', type: 'hiragana' },
        { kana: 'い', romaji: 'i', type: 'hiragana' },
        { kana: 'う', romaji: 'u', type: 'hiragana' },
        { kana: 'え', romaji: 'e', type: 'hiragana' },
        { kana: 'お', romaji: 'o', type: 'hiragana' },
        { kana: 'ア', romaji: 'a', type: 'katakana' },
        { kana: 'イ', romaji: 'i', type: 'katakana' },
        { kana: 'ウ', romaji: 'u', type: 'katakana' },
        { kana: 'エ', romaji: 'e', type: 'katakana' },
        { kana: 'オ', romaji: 'o', type: 'katakana' },
      ],
      tips: 'あ行是日语五十音的第一行，发音类似中文的"阿伊乌诶奥"。',
    }},
    { itemType: 'quiz', title: 'あ行练习', content: {
      type: 'kana_quiz',
      group: 'a-row',
      questions: [
        { prompt: 'あ', answer: 'a', options: ['a', 'i', 'u', 'e'] },
        { prompt: 'い', answer: 'i', options: ['a', 'i', 'u', 'o'] },
        { prompt: 'う', answer: 'u', options: ['e', 'o', 'u', 'a'] },
        { prompt: 'え', answer: 'e', options: ['i', 'e', 'o', 'u'] },
        { prompt: 'お', answer: 'o', options: ['a', 'u', 'e', 'o'] },
      ],
    }},
    { itemType: 'lesson', title: 'か行假名', content: {
      type: 'kana',
      group: 'ka-row',
      characters: [
        { kana: 'か', romaji: 'ka', type: 'hiragana' },
        { kana: 'き', romaji: 'ki', type: 'hiragana' },
        { kana: 'く', romaji: 'ku', type: 'hiragana' },
        { kana: 'け', romaji: 'ke', type: 'hiragana' },
        { kana: 'こ', romaji: 'ko', type: 'hiragana' },
        { kana: 'カ', romaji: 'ka', type: 'katakana' },
        { kana: 'キ', romaji: 'ki', type: 'katakana' },
        { kana: 'ク', romaji: 'ku', type: 'katakana' },
        { kana: 'ケ', romaji: 'ke', type: 'katakana' },
        { kana: 'コ', romaji: 'ko', type: 'katakana' },
      ],
      tips: 'か行是清音，发音时声带不振动。注意"き"的发音介于"ki"和"ke"之间。',
    }},
    { itemType: 'quiz', title: 'か行练习', content: {
      type: 'kana_quiz',
      group: 'ka-row',
      questions: [
        { prompt: 'か', answer: 'ka', options: ['ka', 'ki', 'ku', 'sa'] },
        { prompt: 'き', answer: 'ki', options: ['ka', 'ki', 'ke', 'ko'] },
        { prompt: 'く', answer: 'ku', options: ['ke', 'ko', 'ku', 'ka'] },
        { prompt: 'け', answer: 'ke', options: ['ki', 'ke', 'ku', 'ko'] },
        { prompt: 'こ', answer: 'ko', options: ['ka', 'ku', 'ke', 'ko'] },
      ],
    }},
  ], 1);

  // Unit 2: 基础词汇
  const unit2 = await prisma.courseUnit.upsert({
    where: { id: 2 },
    update: { title: '基础问候', description: '学习日语日常问候语', sortOrder: 2 },
    create: { id: 2, courseId: jaN5Course.id, title: '基础问候', description: '学习日语日常问候语', sortOrder: 2 },
  });

  await createItems(unit2.id, [
    { itemType: 'lesson', title: '问候语', content: {
      type: 'vocabulary',
      category: 'greetings',
      words: [
        { japanese: 'おはようございます', reading: 'ohayou gozaimasu', chinese: '早上好', usage: '上午使用，正式场合' },
        { japanese: 'こんにちは', reading: 'konnichiwa', chinese: '你好', usage: '白天使用，通用问候' },
        { japanese: 'こんばんは', reading: 'konbanwa', chinese: '晚上好', usage: '傍晚/晚上使用' },
        { japanese: 'さようなら', reading: 'sayounara', chinese: '再见', usage: '正式告别，较长时间不见' },
        { japanese: 'ありがとうございます', reading: 'arigatou gozaimasu', chinese: '谢谢', usage: '正式感谢' },
        { japanese: 'すみません', reading: 'sumimasen', chinese: '对不起/打扰了', usage: '道歉或引起注意' },
        { japanese: 'はい', reading: 'hai', chinese: '是/好的', usage: '肯定回答' },
        { japanese: 'いいえ', reading: 'iie', chinese: '不是/不客气', usage: '否定回答' },
      ],
    }},
    { itemType: 'quiz', title: '问候语练习', content: {
      type: 'vocab_quiz',
      category: 'greetings',
      questions: [
        { prompt: 'おはようございます', answer: '早上好', options: ['早上好', '你好', '晚上好', '再见'] },
        { prompt: 'こんにちは', answer: '你好', options: ['早上好', '你好', '晚上好', '谢谢'] },
        { prompt: 'ありがとうございます', answer: '谢谢', options: ['对不起', '再见', '谢谢', '你好'] },
        { prompt: 'すみません', answer: '对不起', options: ['谢谢', '对不起', '你好', '再见'] },
      ],
    }},
    { itemType: 'lesson', title: '自我介绍', content: {
      type: 'vocabulary',
      category: 'self_intro',
      words: [
        { japanese: 'わたし', reading: 'watashi', chinese: '我', usage: '通用第一人称' },
        { japanese: '～です', reading: '~desu', chinese: '是～', usage: '断定句式结尾' },
        { japanese: '～さん', reading: '~san', chinese: '～先生/女士', usage: '敬称后缀' },
        { japanese: 'にほんじん', reading: 'nihonjin', chinese: '日本人', usage: '国籍' },
        { japanese: 'ちゅうごくじん', reading: 'chuugokujin', chinese: '中国人', usage: '国籍' },
        { japanese: 'がくせい', reading: 'gakusei', chinese: '学生', usage: '职业' },
        { japanese: 'かいしゃいん', reading: 'kaishain', chinese: '公司职员', usage: '职业' },
      ],
      grammar: '「AはBです」表示"A是B"。例如：わたしはがくせいです（我是学生）。',
    }},
    { itemType: 'practice', title: '自我介绍练习', content: {
      type: 'composition',
      instructions: '请用日语写出你的自我介绍：',
      template: 'はじめまして。わたしは____です。____じんです。____です。よろしくおねがいします。',
      hints: ['填入你的名字', '填入你的国籍', '填入你的职业'],
    }},
  ], 5);

  // Unit 3: 日常对话
  const unit3 = await prisma.courseUnit.upsert({
    where: { id: 3 },
    update: { title: '日常对话', description: '学习基础日常对话场景', sortOrder: 3 },
    create: { id: 3, courseId: jaN5Course.id, title: '日常对话', description: '学习基础日常对话场景', sortOrder: 3 },
  });

  await createItems(unit3.id, [
    { itemType: 'lesson', title: '在便利店', content: {
      type: 'dialogue',
      scene: 'convenience_store',
      title: 'コンビニで',
      dialogues: [
        { speaker: '店员', japanese: 'いらっしゃいませ。', reading: 'irasshaimase', chinese: '欢迎光临。' },
        { speaker: '顾客', japanese: 'これをおねがいします。', reading: 'kore wo onegai shimasu', chinese: '请给我这个。' },
        { speaker: '店员', japanese: 'かしこまりました。おべんとうはあたためますか？', reading: 'kashikomarimashita. obentou wa atatamemasu ka?', chinese: '好的。便当需要加热吗？' },
        { speaker: '顾客', japanese: 'はい、おねがいします。', reading: 'hai, onegai shimasu', chinese: '是的，拜托了。' },
        { speaker: '店员', japanese: 'ぜんぶで580えんになります。', reading: 'zenbu de gohyaku hachijuu en ni narimasu', chinese: '一共580日元。' },
        { speaker: '顾客', japanese: 'ありがとうございます。', reading: 'arigatou gozaimasu', chinese: '谢谢。' },
      ],
      vocabulary: [
        { japanese: 'おべんとう', reading: 'obentou', chinese: '便当' },
        { japanese: 'あたためます', reading: 'atatamemasu', chinese: '加热' },
        { japanese: 'ぜんぶで', reading: 'zenbu de', chinese: '一共' },
        { japanese: '～えん', reading: '~en', chinese: '～日元' },
      ],
    }},
    { itemType: 'quiz', title: '便利店对话练习', content: {
      type: 'dialogue_quiz',
      scene: 'convenience_store',
      questions: [
        { prompt: '「いらっしゃいませ」的意思是？', answer: '欢迎光临', options: ['欢迎光临', '谢谢惠顾', '请问需要什么', '再见'] },
        { prompt: '「これをおねがいします」的意思是？', answer: '请给我这个', options: ['这个多少钱', '请给我这个', '不需要这个', '这个怎么样'] },
        { prompt: '「おべんとうはあたためますか？」的意思是？', answer: '便当需要加热吗', options: ['便当需要加热吗', '便当好吃吗', '要买便当吗', '便当多少钱'] },
      ],
    }},
    { itemType: 'lesson', title: '在餐厅', content: {
      type: 'dialogue',
      scene: 'restaurant',
      title: 'レストランで',
      dialogues: [
        { speaker: '店员', japanese: 'なんめいさまですか？', reading: 'nanmei sama desu ka?', chinese: '请问几位？' },
        { speaker: '顾客', japanese: 'ふたりです。', reading: 'futari desu', chinese: '两位。' },
        { speaker: '店员', japanese: 'こちらへどうぞ。', reading: 'kochira e douzo', chinese: '这边请。' },
        { speaker: '顾客', japanese: 'メニューをおねがいします。', reading: 'menyuu wo onegai shimasu', chinese: '请给我菜单。' },
        { speaker: '顾客', japanese: 'これをください。', reading: 'kore wo kudasai', chinese: '请给我这个。' },
        { speaker: '顾客', japanese: 'おいしいです！', reading: 'oishii desu', chinese: '很好吃！' },
        { speaker: '顾客', japanese: 'おかいけいをおねがいします。', reading: 'okaikei wo onegai shimasu', chinese: '请结账。' },
      ],
      vocabulary: [
        { japanese: 'なんめいさま', reading: 'nanmei sama', chinese: '几位' },
        { japanese: 'ふたり', reading: 'futari', chinese: '两个人' },
        { japanese: 'メニュー', reading: 'menyuu', chinese: '菜单' },
        { japanese: 'おいしい', reading: 'oishii', chinese: '好吃' },
        { japanese: 'おかいけい', reading: 'okaikei', chinese: '结账' },
      ],
    }},
    { itemType: 'practice', title: '餐厅场景训练', content: {
      type: 'roleplay',
      scene: 'restaurant',
      instructions: '你是顾客，请用日语完成以下对话：',
      prompts: [
        { situation: '店员问几位', expected: 'ふたりです' },
        { situation: '想要菜单', expected: 'メニューをおねがいします' },
        { situation: '要点菜', expected: 'これをください' },
        { situation: '食物很好吃', expected: 'おいしいです' },
        { situation: '要结账', expected: 'おかいけいをおねがいします' },
      ],
    }},
  ], 9);

  console.log('  Japanese N5 course created with 3 units');

  // ============================================================
  // 3. 英语课程 — A1入门
  // ============================================================
  const en = await prisma.language.findUnique({ where: { code: 'en' } });

  console.log('\nCreating English A1 course...');
  const enA1Course = await prisma.course.upsert({
    where: { id: 2 },
    update: {
      title: '英语A1入门',
      description: '零基础英语入门，从字母和基础词汇开始。',
      level: 'A1',
      sortOrder: 1,
      isPublished: true,
    },
    create: {
      id: 2,
      languageId: en.id,
      title: '英语A1入门',
      description: '零基础英语入门，从字母和基础词汇开始。',
      level: 'A1',
      sortOrder: 1,
      isPublished: true,
    },
  });

  const enUnit1 = await prisma.courseUnit.upsert({
    where: { id: 4 },
    update: { title: '基础问候', description: 'Hello, how are you?', sortOrder: 1 },
    create: { id: 4, courseId: enA1Course.id, title: '基础问候', description: 'Hello, how are you?', sortOrder: 1 },
  });

  await createItems(enUnit1.id, [
    { itemType: 'lesson', title: 'Hello & Goodbye', content: {
      type: 'vocabulary',
      category: 'greetings',
      words: [
        { english: 'Hello', chinese: '你好', usage: '通用问候' },
        { english: 'Good morning', chinese: '早上好', usage: '上午使用' },
        { english: 'Good afternoon', chinese: '下午好', usage: '下午使用' },
        { english: 'Good evening', chinese: '晚上好', usage: '晚上使用' },
        { english: 'Goodbye', chinese: '再见', usage: '告别' },
        { english: 'See you later', chinese: '回头见', usage: '非正式告别' },
        { english: 'Nice to meet you', chinese: '很高兴认识你', usage: '初次见面' },
        { english: 'How are you?', chinese: '你好吗？', usage: '询问近况' },
      ],
    }},
    { itemType: 'quiz', title: '问候语练习', content: {
      type: 'vocab_quiz',
      questions: [
        { prompt: '"Good morning" 的意思是？', answer: '早上好', options: ['早上好', '下午好', '晚上好', '再见'] },
        { prompt: '"Nice to meet you" 的意思是？', answer: '很高兴认识你', options: ['你好', '再见', '很高兴认识你', '你好吗'] },
        { prompt: 'How would you respond to "How are you?"', answer: "I'm fine, thank you", options: ["I'm fine, thank you", "Goodbye", "Hello", "See you"] },
      ],
    }},
  ], 13);

  console.log('  English A1 course created with 1 unit');

  // ============================================================
  // 完成
  // ============================================================
  console.log('\nSeed completed successfully!');
  console.log('  Languages: 7 (ja, en, ko, fr, es, de, zh-CN)');
  console.log('  Courses: 2 (Japanese N5, English A1)');
  console.log('  Units: 4');
  console.log('  Items: 12');
}

async function createItems(unitId, items, startId) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await prisma.courseItem.upsert({
      where: { id: startId + i },
      update: {
        title: item.title,
        itemType: item.itemType,
        content: item.content,
        sortOrder: i + 1,
      },
      create: {
        id: startId + i,
        unitId,
        itemType: item.itemType,
        title: item.title,
        content: item.content,
        sortOrder: i + 1,
      },
    });
  }
  console.log(`  Unit ${unitId}: ${items.length} items created`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });