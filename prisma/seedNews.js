// ============================================================
// prisma/seedNews.js
// v3.2.0 资讯来源种子数据初始化
// 预设权威资讯源、教育平台、官方媒体
// 对齐《双宪法v3.2.0》知识产权合规条款：禁止抓取无版权内容
// ============================================================
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 预设权威资讯源（仅使用公开RSS/Atom feed，不抓取无版权内容）
const SEED_SOURCES = [
  {
    name: '中国教育在线-外语频道',
    url: 'https://foreign.eol.cn',
    feedUrl: '',
    category: 'learning_method',
    language: 'zh-CN',
    isActive: true,
    isWhitelist: false,
    dailyLimit: 10,
  },
  {
    name: '教育部考试中心',
    url: 'https://www.neea.edu.cn',
    feedUrl: '',
    category: 'exam_policy',
    language: 'zh-CN',
    isActive: true,
    isWhitelist: true, // 官方来源，加入白名单
    dailyLimit: 5,
  },
  {
    name: '中国留学网',
    url: 'https://www.cscse.edu.cn',
    feedUrl: '',
    category: 'study_abroad',
    language: 'zh-CN',
    isActive: true,
    isWhitelist: true,
    dailyLimit: 8,
  },
  {
    name: 'BBC Learning English',
    url: 'https://www.bbc.co.uk/learningenglish',
    feedUrl: 'https://feeds.bbci.co.uk/learningenglish/english/features/6-minute/english/rss',
    category: 'learning_method',
    language: 'en',
    isActive: true,
    isWhitelist: false,
    dailyLimit: 5,
  },
  {
    name: 'Japan Foundation',
    url: 'https://www.jpf.go.jp',
    feedUrl: '',
    category: 'exam_policy',
    language: 'ja',
    isActive: true,
    isWhitelist: false,
    dailyLimit: 5,
  },
  {
    name: 'ETS托福考试官网',
    url: 'https://www.ets.org/toefl',
    feedUrl: '',
    category: 'exam_policy',
    language: 'en',
    isActive: true,
    isWhitelist: true,
    dailyLimit: 5,
  },
  {
    name: '英国文化教育协会',
    url: 'https://www.britishcouncil.cn',
    feedUrl: '',
    category: 'culture',
    language: 'zh-CN',
    isActive: true,
    isWhitelist: true,
    dailyLimit: 8,
  },
  {
    name: 'Goethe-Institut',
    url: 'https://www.goethe.de',
    feedUrl: '',
    category: 'culture',
    language: 'de',
    isActive: true,
    isWhitelist: false,
    dailyLimit: 5,
  },
];

async function main() {
  console.log('[seedNews] 开始初始化资讯来源种子数据...');

  let created = 0;
  let skipped = 0;

  for (const source of SEED_SOURCES) {
    // 检查是否已存在（按name去重）
    const existing = await prisma.newsSource.findUnique({
      where: { name: source.name },
    });

    if (existing) {
      console.log(`[seedNews] 跳过已存在: ${source.name}`);
      skipped++;
      continue;
    }

    await prisma.newsSource.create({ data: source });
    console.log(`[seedNews] 新增来源: ${source.name} (${source.category})`);
    created++;
  }

  console.log(`[seedNews] 完成: 新增${created} 跳过${skipped}`);
}

main()
  .catch((e) => {
    console.error('[seedNews] 失败:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
