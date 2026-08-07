// ============================================================
// src/services/newsFilterService.js
// v3.2.0 站外资讯三层去广告过滤服务
// 第一层：关键词规则过滤（零AI额度消耗，默认开启）
// 第二层：AI辅助识别低质广告（可开关，默认关闭，低频调用）
// 第三层：白名单机制（仅白名单来源的官方广告允许展示）
// 对齐《双宪法v3.2.0》前置禁令1：所有AI能力走BrainFacade统一调度层
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');
const brainFacade = require('../core/brain/facade');
const aiQuotaService = require('./aiQuotaService');

// ============================================================
// 全局AI开关状态（整改5：支持管理员动态切换，默认关闭）
// 初始值从环境变量读取，运行时可通过setAIEnabled动态修改
// ============================================================
let _aiEnabledGlobal = process.env.NEWS_AI_ENABLED === 'true';
function getAIEnabled() { return _aiEnabledGlobal; }
function setAIEnabled(enabled) { _aiEnabledGlobal = Boolean(enabled); }

// ============================================================
// 第一层：关键词规则过滤（正则匹配，零AI消耗）
// ============================================================

// 广告营销关键词正则库
const AD_KEYWORD_PATTERNS = [
  // 营销推广类
  /限时(?:抢购|特惠|优惠|折扣)/,
  /立即(?:购买|下单|抢购|咨询|领取)/,
  /免费(?:领取|试用|获取|下载|赠送)/,
  /点击(?:链接|这里|下方|查看)/,
  /扫码(?:关注|购买|领取|加群)/,
  /加(?:微信|QQ|群|客服)[\s:：]?\s*[\w\-]+/,
  /咨询(?:热线|电话|微信|QQ)[\s:：]?\s*[\w\-]+/,
  /报名(?:优惠|立减|赠送|免费)/,
  /原价[\s]*[\d,]+[\s]*[元块][\s]*(?:现价|仅需|只要|现仅)[\s]*[\d,]+/,
  /优惠券|代金券|满减|满赠|买一送一/,
  // 带货导流类
  /私聊|私信|联系我|添加好友/,
  /代理|招商|加盟|合作共赢/,
  /月入[过超]?[\d万]+|日赚|轻松赚钱/,
  /炒股|基金|理财|投资回报/,
  /丰胸|减肥|壮阳|增高|祛斑|祛痘|脱毛/,
  /代购|海淘|正品保证|专柜验货/,
  // 联系方式类
  /1[3-9]\d{9}/, // 手机号
  /(?:QQ|微信|vx|VX|wechat)[\s:：]?\s*[a-zA-Z0-9_]{5,}/,
  // 敏感引流
  /色情|成人|约炮|一夜情|裸聊/,
  /赌博|博彩|彩票|六合彩|赌场/,
  /vpn|翻墙|科学上网|加速器/i,
];

// 敏感词扩展（复用contentFilter的词库，但针对资讯场景做轻量化校验）
const SENSITIVE_KEYWORDS = [
  '法轮功', '六四', '台独', '港独', '藏独', '疆独',
  '反华', '反共', '颠覆', '暴动', '恐怖主义',
  '色情', '淫秽', '卖淫', '赌博', '毒品',
  '诈骗', '洗钱', '走私',
];

/**
 * 第一层过滤：关键词规则匹配
 * @param {string} title - 文章标题
 * @param {string} summary - 文章摘要
 * @returns {{ passed: boolean, reason: string, matchedKeywords: string[] }}
 */
function ruleBasedFilter(title, summary) {
  const text = `${title || ''} ${summary || ''}`;
  const matched = [];

  for (const pattern of AD_KEYWORD_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matched.push(match[0]);
    }
  }

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (text.includes(keyword)) {
      matched.push(keyword);
    }
  }

  if (matched.length > 0) {
    return {
      passed: false,
      reason: 'keyword_rule_blocked',
      matchedKeywords: [...new Set(matched)],
    };
  }

  return { passed: true, reason: null, matchedKeywords: [] };
}

// ============================================================
// 第二层：AI辅助识别低质广告（通过BrainFacade统一调度）
// ============================================================

/**
 * 第二层过滤：AI辅助识别广告内容
 * 前置禁令1合规：通过BrainFacade统一调度层调用，禁止直连大模型
 * 额度管控：单条资讯AI调用限制1次，纳入平台AI配额
 * @param {string} title - 文章标题
 * @param {string} summary - 文章摘要
 * @param {string} sourceName - 来源名称
 * @returns {Promise<{ isAd: boolean, reason: string, aiUsed: boolean }>}
 */
async function aiBasedFilter(title, summary, sourceName) {
  try {
    // 检查AI配额
    const quotaCheck = await aiQuotaService.checkQuota('system');
    if (!quotaCheck.allowed) {
      logger.warn('[newsFilter] AI配额不足，跳过AI辅助过滤');
      return { isAd: false, reason: 'ai_quota_exhausted', aiUsed: false };
    }

    // 构造AI识别prompt
    const messages = [
      {
        role: 'system',
        content: '你是内容审核助手。请判断以下资讯内容是否为广告、营销推广或低质带货内容。仅返回JSON：{"isAd": true/false, "reason": "简要原因"}',
      },
      {
        role: 'user',
        content: JSON.stringify({
          title: (title || '').slice(0, 200),
          summary: (summary || '').slice(0, 300),
          source: sourceName || '',
        }),
      },
    ];

    // 前置禁令1合规：通过BrainFacade统一调度层调用AI
    const result = await brainFacade.generateText(messages, {
      userId: 'system',
      targetLang: 'zh-CN',
      temperature: 0.1,
      maxTokens: 100,
    });

    // 记录AI用量
    await aiQuotaService.recordUsage('system', 'news_ad_detect', result.usage?.totalTokens || 0);

    // 整改3（审计6）：AI调用写入NewsAuditLog，实现操作级审计追溯
    try {
      await prisma.newsAuditLog.create({
        data: {
          articleId: null,
          operatorId: null,
          action: 'ai_process',
          beforeState: 'pending_filter',
          afterState: Boolean(aiResult.isAd) ? 'ai_ad_detected' : 'ai_passed',
          detail: {
            title: (title || '').slice(0, 100),
            source: sourceName || '',
            tokens: result.usage?.totalTokens || 0,
            aiResult: aiResult.isAd ? 'ad_detected' : 'passed',
            reason: aiResult.reason || null,
          },
        },
      });
    } catch (auditErr) {
      logger.error('[newsFilter] AI审计日志写入失败:', auditErr.message);
    }

    // 解析AI返回
    const content = result.content || result.text || '';
    let aiResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { isAd: false, reason: 'parse_failed' };
    } catch {
      aiResult = { isAd: false, reason: 'parse_failed' };
    }

    return {
      isAd: Boolean(aiResult.isAd),
      reason: aiResult.isAd ? `ai_detected: ${aiResult.reason || 'ad_content'}` : null,
      aiUsed: true,
    };
  } catch (e) {
    logger.error('[newsFilter] AI辅助过滤失败:', e.message);
    return { isAd: false, reason: 'ai_error', aiUsed: false };
  }
}

// ============================================================
// 第三层：白名单机制（仅白名单来源的官方广告允许展示）
// ============================================================

/**
 * 第三层过滤：白名单校验
 * @param {string} sourceId - 来源ID
 * @returns {Promise<{ isWhitelist: boolean, allowOfficialAd: boolean }>}
 */
async function whitelistFilter(sourceId) {
  if (!sourceId) return { isWhitelist: false, allowOfficialAd: false };

  try {
    const source = await prisma.newsSource.findUnique({
      where: { id: sourceId },
      select: { isWhitelist: true, isBlacklist: true, name: true },
    });

    if (!source) return { isWhitelist: false, allowOfficialAd: false };
    if (source.isBlacklist) return { isWhitelist: false, allowOfficialAd: false };

    return {
      isWhitelist: source.isWhitelist,
      allowOfficialAd: source.isWhitelist, // 白名单来源允许展示官方广告
    };
  } catch (e) {
    logger.error('[newsFilter] 白名单校验失败:', e.message);
    return { isWhitelist: false, allowOfficialAd: false };
  }
}

// ============================================================
// 综合过滤入口：三层串联
// ============================================================

/**
 * 综合过滤：三层串联执行
 * @param {Object} params - { title, summary, sourceId, sourceName }
 * @param {Object} opts - { enableAI: false } 默认关闭AI深度处理
 * @returns {Promise<{ passed: boolean, isAd: boolean, isOfficialAd: boolean, reason: string, aiUsed: boolean, aiCallCount: number }>}
 */
async function comprehensiveFilter(params, opts = {}) {
  const { title, summary, sourceId, sourceName } = params;
  const { enableAI = false } = opts;
  // 整改5：全局AI开关闭联，全局关闭时强制禁用AI（双重管控）
  const aiActuallyEnabled = enableAI && _aiEnabledGlobal;

  let aiUsed = false;
  let aiCallCount = 0;

  // 第一层：关键词规则过滤（零AI消耗，默认执行）
  const ruleResult = ruleBasedFilter(title, summary);
  if (!ruleResult.passed) {
    return {
      passed: false,
      isAd: true,
      isOfficialAd: false,
      reason: `rule_blocked: ${ruleResult.matchedKeywords.join(', ')}`,
      aiUsed: false,
      aiCallCount: 0,
    };
  }

  // 第三层：白名单校验
  const whitelistResult = await whitelistFilter(sourceId);

  // 第二层：AI辅助识别（可开关，默认关闭；整改5：受全局AI开关管控）
  if (aiActuallyEnabled && !whitelistResult.isWhitelist) {
    const aiResult = await aiBasedFilter(title, summary, sourceName);
    aiUsed = aiResult.aiUsed;
    aiCallCount = aiResult.aiUsed ? 1 : 0;

    if (aiResult.isAd) {
      return {
        passed: false,
        isAd: true,
        isOfficialAd: false,
        reason: aiResult.reason,
        aiUsed,
        aiCallCount,
      };
    }
  }

  // 通过所有过滤层
  return {
    passed: true,
    isAd: false,
    isOfficialAd: whitelistResult.allowOfficialAd && false, // 默认不标记为官方广告，需后台手动投放
    reason: null,
    aiUsed,
    aiCallCount,
  };
}

/**
 * 生成内容哈希（用于增量去重）
 * @param {string} title - 标题
 * @param {string} url - 原文链接
 * @returns {string} MD5哈希
 */
function generateContentHash(title, url) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(`${title}|${url}`).digest('hex');
}

/**
 * 截取摘要（100字以内）
 * @param {string} text - 原始文本
 * @param {number} maxLen - 最大长度，默认100
 * @returns {string} 截取后的摘要
 */
function truncateSummary(text, maxLen = 100) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen - 3) + '...';
}

module.exports = {
  ruleBasedFilter,
  aiBasedFilter,
  whitelistFilter,
  comprehensiveFilter,
  generateContentHash,
  truncateSummary,
  getAIEnabled,
  setAIEnabled,
  AD_KEYWORD_PATTERNS,
  SENSITIVE_KEYWORDS,
};
