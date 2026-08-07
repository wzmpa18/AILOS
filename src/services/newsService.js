// ============================================================
// src/services/newsService.js
// v3.2.0 站外资讯查询服务（列表、详情、分类、举报）
// 对齐《双宪法v3.2.0》社交域资讯聚合条款
// 展示规则：仅展示标题+100字以内摘要+来源标注+原文跳转链接
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

// 分类标签映射
const CATEGORY_LABELS = {
  learning_method: '学习方法',
  study_abroad: '留学移民',
  exam_policy: '考试政策',
  culture: '语种文化',
  hotspot: '海外热点',
  general: '综合资讯',
};

/**
 * 获取已审核通过的资讯列表
 * @param {Object} params - { page, limit, category, keyword, sort }
 * @returns {Promise<{ items: Array, pagination: Object }>}
 */
async function getNewsList(params = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    keyword,
    sort = 'latest',
  } = params;

  const skip = (page - 1) * Math.min(limit, 50);
  const take = Math.min(limit, 50);

  const where = {
    status: 'approved', // 仅展示已审核通过的内容
  };

  if (category && category !== 'all') {
    where.category = category;
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { summary: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  // 排序规则
  let orderBy;
  if (sort === 'hot') {
    orderBy = [{ isPinned: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }];
  } else {
    orderBy = [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  }

  const [total, items] = await Promise.all([
    prisma.newsArticle.count({ where }),
    prisma.newsArticle.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        source: {
          select: { id: true, name: true, isWhitelist: true },
        },
      },
    }),
  ]);

  return {
    items: items.map(formatArticleForDisplay),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

/**
 * 获取资讯详情（仅返回标题+摘要+来源+原文链接，不返回全文）
 */
async function getNewsDetail(articleId) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId, status: 'approved' },
    include: {
      source: {
        select: { id: true, name: true, url: true, isWhitelist: true },
      },
    },
  });

  if (!article) return null;

  // 异步递增浏览次数
  prisma.newsArticle.update({
    where: { id: articleId },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return formatArticleForDisplay(article, true);
}

/**
 * 获取分类标签列表
 */
function getCategories() {
  return Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}

/**
 * 用户举报资讯
 * @param {string} articleId - 文章ID
 * @param {string} reporterId - 举报人ID
 * @param {string} reason - 举报原因
 * @param {string} detail - 举报详情
 */
async function reportArticle(articleId, reporterId, reason, detail) {
  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    return { success: false, message: '资讯不存在' };
  }

  // 检查是否已举报过
  const existing = await prisma.newsReport.findFirst({
    where: { articleId, reporterId },
  });
  if (existing) {
    return { success: false, message: '您已举报过此资讯' };
  }

  await prisma.newsReport.create({
    data: {
      articleId,
      reporterId,
      reason: reason || 'other',
      detail: detail || '',
      status: 'pending',
    },
  });

  // 递增举报次数
  await prisma.newsArticle.update({
    where: { id: articleId },
    data: { reportCount: { increment: 1 } },
  });

  return { success: true, message: '举报已提交，我们将尽快处理' };
}

/**
 * 格式化文章用于前端展示
 * 合规声明：仅返回标题+摘要+来源+原文链接，绝不返回全文
 */
function formatArticleForDisplay(article, isDetail = false) {
  const formatted = {
    id: article.id,
    title: article.title,
    summary: article.summary,
    originalUrl: article.originalUrl, // 原文跳转链接
    author: article.author,
    source: article.source ? {
      id: article.source.id,
      name: article.source.name,
      isWhitelist: article.source.isWhitelist,
    } : null,
    category: article.category,
    categoryLabel: CATEGORY_LABELS[article.category] || '综合资讯',
    tags: article.tags || [],
    isPinned: article.isPinned,
    isOfficialAd: article.isOfficialAd,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt,
    crawledAt: article.crawledAt,
  };

  if (isDetail) {
    formatted.reportCount = article.reportCount;
  }

  return formatted;
}

module.exports = {
  getNewsList,
  getNewsDetail,
  getCategories,
  reportArticle,
  formatArticleForDisplay,
  CATEGORY_LABELS,
};
