// ============================================================
// src/services/newsAggregatorService.js
// v3.2.0 站外资讯聚合服务（抓取、去重、存储）
// 对齐《双宪法v3.2.0》：
//   - 前置禁令2：仅存储标题+摘要+来源+原文链接，绝不全文转载
//   - 前置禁令3：频次+配额双重管控，单来源每日请求不超过限定次数
//   - 任务四：所有抓取内容先过敏感词过滤，再进入待审核池
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');
const newsFilter = require('./newsFilterService');
const contentFilter = require('../utils/contentFilter');

// 默认抓取配置
const DEFAULT_CONFIG = {
  summaryMaxLength: 100,     // 摘要最大长度
  requestTimeout: 10000,     // 单次请求超时10秒
  maxArticlesPerSource: 20,  // 单来源单次最大抓取条数
  enableAI: false,           // 默认关闭AI深度处理（零AI额度消耗）
};

/**
 * 获取所有活跃的资讯来源
 */
async function getActiveSources() {
  return prisma.newsSource.findMany({
    where: {
      isActive: true,
      isBlacklist: false,
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * 检查单来源今日抓取次数是否超限
 */
async function checkDailyLimit(sourceId, dailyLimit) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = await prisma.newsArticle.count({
    where: {
      sourceId,
      crawledAt: { gte: today },
    },
  });

  return todayCount < dailyLimit;
}

/**
 * 带指数退避的重试包装器（整改4：失败退避重试机制）
 * @param {Function} fn - 异步函数
 * @param {number} maxRetries - 最大重试次数，默认3
 * @returns {Promise<any>} 函数返回值
 */
async function fetchWithRetry(fn, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (result && result.length > 0) return result;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.info(`[newsAggregator] 第${attempt}/${maxRetries}次抓取返回空，${delay}ms后重试`);
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`[newsAggregator] 第${attempt}/${maxRetries}次抓取失败: ${e.message}，${delay}ms后重试`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  if (lastError) {
    logger.error(`[newsAggregator] ${maxRetries}次重试均失败:`, lastError.message);
  }
  return [];
}

/**
 * 模拟抓取单篇文章（实际生产环境对接RSS/HTML解析）
 * 这里实现一个通用的轻量级HTTP抓取器，支持RSS/JSON feed
 * 合规声明：仅提取标题+摘要+链接，不存储全文内容
 */
async function fetchFromSource(source) {
  const articles = [];

  try {
    // 如果来源有feedUrl（RSS/Atom），尝试解析（整改4：带指数退避重试）
    if (source.feedUrl) {
      const fetched = await fetchWithRetry(() => fetchRssFeed(source.feedUrl, source));
      articles.push(...fetched);
    }

    // 如果来源只有url，记录日志（实际生产对接HTML解析器）
    if (articles.length === 0 && source.url) {
      logger.info(`[newsAggregator] 来源 ${source.name} 无feedUrl或抓取失败，跳过自动抓取（需手动配置或HTML解析器）`);
    }
  } catch (e) {
    logger.error(`[newsAggregator] 抓取来源 ${source.name} 失败:`, e.message);
  }

  return articles;
}

/**
 * 解析RSS/Atom feed
 */
async function fetchRssFeed(feedUrl, source) {
  const https = require('https');
  const http = require('http');
  const client = feedUrl.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    const req = client.get(feedUrl, {
      timeout: DEFAULT_CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YanDaoBot/1.0; +https://yandao.vip)',
        'Accept': 'application/rss+xml, application/xml, application/json, text/xml, */*',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const articles = parseFeedData(data, source);
          resolve(articles);
        } catch (e) {
          logger.error(`[newsAggregator] 解析feed失败 ${feedUrl}:`, e.message);
          resolve([]);
        }
      });
    });

    req.on('error', (e) => {
      logger.error(`[newsAggregator] 请求feed失败 ${feedUrl}:`, e.message);
      resolve([]);
    });

    req.on('timeout', () => {
      req.destroy();
      logger.warn(`[newsAggregator] 请求feed超时 ${feedUrl}`);
      resolve([]);
    });
  });
}

/**
 * 解析RSS/Atom/JSON feed数据
 */
function parseFeedData(data, source) {
  const articles = [];

  // 尝试JSON解析（JSON Feed格式）
  try {
    const json = JSON.parse(data);
    if (json.items && Array.isArray(json.items)) {
      for (const item of json.items.slice(0, DEFAULT_CONFIG.maxArticlesPerSource)) {
        articles.push({
          title: (item.title || '').trim().slice(0, 200),
          summary: newsFilter.truncateSummary(
            item.summary || item.content_text || item.content_html || '',
            DEFAULT_CONFIG.summaryMaxLength
          ),
          originalUrl: item.url || item.id || '',
          author: item.author?.name || source.name,
          publishedAt: item.date_modified || item.date_published || null,
        });
      }
      return articles;
    }
  } catch {
    // 非JSON格式，继续尝试XML
  }

  // XML解析（RSS 2.0 / Atom）
  try {
    // RSS 2.0: <item><title>...</title><description>...</description><link>...</link></item>
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const items = data.match(itemRegex) || [];

    for (const itemXml of items.slice(0, DEFAULT_CONFIG.maxArticlesPerSource)) {
      const title = extractXmlTag(itemXml, 'title');
      const description = extractXmlTag(itemXml, 'description');
      const link = extractXmlTag(itemXml, 'link') || extractCdata(itemXml, 'link');
      const pubDate = extractXmlTag(itemXml, 'pubDate') || extractXmlTag(itemXml, 'published');

      if (title && link) {
        articles.push({
          title: title.trim().slice(0, 200),
          summary: newsFilter.truncateSummary(
            description.replace(/<!\[CDATA\[|\]\]>/g, ''),
            DEFAULT_CONFIG.summaryMaxLength
          ),
          originalUrl: link.trim(),
          author: source.name,
          publishedAt: pubDate ? new Date(pubDate) : null,
        });
      }
    }

    // Atom: <entry><title>...</title><summary>...</summary><link href="..."/></entry>
    if (articles.length === 0) {
      const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
      const entries = data.match(entryRegex) || [];

      for (const entryXml of entries.slice(0, DEFAULT_CONFIG.maxArticlesPerSource)) {
        const title = extractXmlTag(entryXml, 'title');
        const summary = extractXmlTag(entryXml, 'summary') || extractXmlTag(entryXml, 'content');
        const link = extractAtomLink(entryXml);

        if (title && link) {
          articles.push({
            title: title.trim().slice(0, 200),
            summary: newsFilter.truncateSummary(
              summary.replace(/<!\[CDATA\[|\]\]>/g, ''),
              DEFAULT_CONFIG.summaryMaxLength
            ),
            originalUrl: link.trim(),
            author: source.name,
            publishedAt: null,
          });
        }
      }
    }
  } catch (e) {
    logger.error('[newsAggregator] XML解析失败:', e.message);
  }

  return articles;
}

function extractXmlTag(xml, tag) {
  const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return '';
  return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function extractCdata(xml, tag) {
  const regex = new RegExp(`<(?:\\w+:)?${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</(?:\\w+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAtomLink(xml) {
  const regex = /<link[^>]*href=["']([^"']+)["'][^>]*>/i;
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * 存储抓取的文章（去重 + 三层过滤 + 敏感词过滤 → 待审核池）
 */
async function storeArticles(rawArticles, source, config = {}) {
  const { enableAI = DEFAULT_CONFIG.enableAI } = config;
  let stored = 0;
  let filtered = 0;
  let duplicated = 0;

  for (const raw of rawArticles) {
    if (!raw.title || !raw.originalUrl) continue;

    // 去重：基于内容哈希
    const contentHash = newsFilter.generateContentHash(raw.title, raw.originalUrl);
    const existing = await prisma.newsArticle.findUnique({
      where: { contentHash },
    });
    if (existing) {
      duplicated++;
      continue;
    }

    // 第一层+第二层+第三层综合过滤
    const filterResult = await newsFilter.comprehensiveFilter({
      title: raw.title,
      summary: raw.summary,
      sourceId: source.id,
      sourceName: source.name,
    }, { enableAI });

    if (!filterResult.passed) {
      filtered++;
      logger.info(`[newsAggregator] 文章被过滤: "${raw.title}" reason=${filterResult.reason}`);
      continue;
    }

    // 任务四：敏感词过滤（复用contentFilter）
    const sensitiveCheck = contentFilter.auditAndFilter(`${raw.title} ${raw.summary}`, {
      scene: 'news_crawl',
      endpoint: '/api/v1/news/crawl',
    });
    if (!sensitiveCheck.passed) {
      filtered++;
      logger.info(`[newsAggregator] 文章敏感词拦截: "${raw.title}"`);
      continue;
    }

    // 自动分类（基于标题关键词）
    const category = autoCategorize(raw.title, raw.summary);

    // 存储（status=pending，进入待审核池）
    await prisma.newsArticle.create({
      data: {
        sourceId: source.id,
        title: raw.title,
        summary: raw.summary,
        originalUrl: raw.originalUrl,
        author: raw.author || source.name,
        category,
        language: source.language || 'zh-CN',
        status: 'pending', // 任务四：所有抓取内容先进入待审核池
        isAd: filterResult.isAd,
        isOfficialAd: filterResult.isOfficialAd,
        adReason: filterResult.reason,
        aiProcessed: filterResult.aiUsed,
        aiCallCount: filterResult.aiCallCount,
        contentHash,
        publishedAt: raw.publishedAt || null,
      },
    });
    stored++;
  }

  // 更新来源抓取计数
  await prisma.newsSource.update({
    where: { id: source.id },
    data: {
      crawlCount: { increment: 1 },
      lastCrawlAt: new Date(),
    },
  });

  return { stored, filtered, duplicated };
}

/**
 * 自动分类（基于标题/摘要关键词匹配）
 */
function autoCategorize(title, summary) {
  const text = `${title || ''} ${summary || ''}`.toLowerCase();

  const categoryRules = [
    { category: 'learning_method', keywords: ['学习方法', '学习技巧', '单词记忆', '语法', '口语练习', '听力训练', 'language learning', 'study method'] },
    { category: 'study_abroad', keywords: ['留学', '移民', '签证', '申请', 'offer', '大学', '海外', '留学申请', 'study abroad', 'immigration'] },
    { category: 'exam_policy', keywords: ['考试', '托福', '雅思', 'n1', 'n2', 'jlpt', 'toefl', 'ielts', 'gre', '考试政策', '报名', 'exam'] },
    { category: 'culture', keywords: ['文化', '习俗', '节日', '传统', '文化差异', '海外生活', 'culture', 'custom'] },
    { category: 'hotspot', keywords: ['热点', '新闻', '时事', '国际', '全球', 'news', 'world'] },
  ];

  for (const rule of categoryRules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return 'general';
}

/**
 * 执行一轮全量抓取（遍历所有活跃来源）
 */
async function crawlAll(config = {}) {
  const startedAt = Date.now();
  logger.info('[newsAggregator] 开始资讯抓取任务');

  const sources = await getActiveSources();
  let totalStored = 0;
  let totalFiltered = 0;
  let totalDuplicated = 0;
  let sourcesProcessed = 0;

  for (const source of sources) {
    // 频次管控：检查单来源每日抓取上限
    const canCrawl = await checkDailyLimit(source.id, source.dailyLimit || DEFAULT_CONFIG.maxArticlesPerSource);
    if (!canCrawl) {
      logger.info(`[newsAggregator] 来源 ${source.name} 今日抓取已达上限，跳过`);
      continue;
    }

    const rawArticles = await fetchFromSource(source);
    if (rawArticles.length === 0) continue;

    const result = await storeArticles(rawArticles, source, config);
    totalStored += result.stored;
    totalFiltered += result.filtered;
    totalDuplicated += result.duplicated;
    sourcesProcessed++;

    logger.info(`[newsAggregator] 来源 ${source.name}: 新增${result.stored} 过滤${result.filtered} 重复${result.duplicated}`);
  }

  const duration = Date.now() - startedAt;
  logger.info(`[newsAggregator] 抓取完成: 来源${sourcesProcessed} 新增${totalStored} 过滤${totalFiltered} 重复${totalDuplicated} 耗时${duration}ms`);

  return {
    sourcesProcessed,
    totalStored,
    totalFiltered,
    totalDuplicated,
    durationMs: duration,
  };
}

module.exports = {
  crawlAll,
  fetchFromSource,
  storeArticles,
  autoCategorize,
  checkDailyLimit,
  getActiveSources,
  DEFAULT_CONFIG,
};
