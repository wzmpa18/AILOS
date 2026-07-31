/**
 * 言道 AILOS - 内容敏感词过滤模块 v2.1
 * 宪法 11.6 全链路内容拦截 + Stage 9 防绕过增强
 * 覆盖：消息、群组资料、群公告、好友备注、用户昵称/简介、动态、评论
 */

const logger = require('./logger');
const prisma = require('../config/database');

// ============================================================
// 防绕过预处理: 归一化文本
// ============================================================

/**
 * 防绕过归一化:
 * - 移除零宽字符 (Zero-width spaces, joiners, etc.)
 * - 移除 Unicode 不可见控制字符
 * - 移除 CJK 字符之间的空格和特殊分隔符 (防 "法 轮 功" 绕过)
 * - 中文/英文间保留空格
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let normalized = text;

  // 1. 移除零宽字符
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g, '');

  // 2. 移除 CJK 字符之间的空格和常见分隔符（保留词间空格用于英文）
  // 匹配: CJK字符 + 空格/特殊分隔符 + CJK字符
  normalized = normalized.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])\s*[\s._\-|·•​]+[\s._\-|·•​]*\s*([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g,
    '$1$2'
  );

  // 3. 通用：连续CJK之间所有非CJK非字母数字字符移除
  //    "法!轮@功" → "法轮功", "色 情" → "色情"
  normalized = normalized.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])([^a-zA-Z0-9\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g,
    '$1$3'
  );

  return normalized;
}

// ============================================================
// 敏感词库
// ============================================================

// 一级敏感词（暴力/色情/违法/诈骗/毒品/赌博/武器/恐怖主义/贩卖/洗钱/自杀/自残）
const SENSITIVE_PATTERNS = [
  /暴力/,
  /色情/,
  /毒品/,
  /赌博/,
  /非法/,
  /武器/,
  /自杀/,
  /自残/,
  /诈骗/,
  /洗钱/,
  /恐怖主义/,
  /贩卖/,
  /传销/,
  /邪教/,
  /淫秽/,
  /嫖娼/,
  /卖淫/,
  // Stage 9 防绕过增强: 补充常见变体
  /法轮功/,
  /falungong/i,
  /falun/i,
  /六四/,
];

// 二级脏话/侮辱性词汇 (不区分大小写)
const PROFANITY_PATTERNS = [
  /傻逼/,
  /操你/,
  /fuck/i,
  /shit/i,
  /bitch/i,
  /废物/,
  /去死/,
  /垃圾/,
  /白痴/,
  /脑子有/,
  /滚开/,
  /蠢货/,
  /脑残/,
  /弱智/,
  /狗日的/,
  /妈的/,
];

// 场景描述映射
const SCENE_LABELS = {
  message: '消息',
  group_name: '群名称',
  group_desc: '群描述',
  group_announcement: '群公告',
  group_nickname: '群昵称',
  friend_remark: '好友备注',
  friend_request: '好友申请附言',
  user_nickname: '用户昵称',
  user_bio: '个人简介',
  timeline_post: '动态',
  timeline_comment: '评论',
};

// ============================================================
// 统一过滤错误
// ============================================================

const FILTER_ERROR = {
  success: false,
  code: 9004,
  error: '内容包含违规信息，请修改后重试',
};

// ============================================================
// 核心过滤函数
// ============================================================

/**
 * 检查文本是否包含敏感词（含防绕过预处理）
 * @param {string} text - 待检查文本
 * @param {object} options - { scene: string }
 * @returns {{ passed: boolean, reason?: string, errorResponse?: object }}
 */
function filterContent(text, options = {}) {
  const scene = options.scene || 'unknown';

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { passed: false, reason: '内容为空' };
  }

  const trimmed = text.trim();

  // Stage 9 防绕过: 同时检测原始文本和归一化文本
  const normalized = normalizeText(trimmed);
  const textsToCheck = [trimmed];
  if (normalized !== trimmed) {
    textsToCheck.push(normalized);
  }

  for (const checkText of textsToCheck) {
    // Layer 1: 第一级敏感词检测
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(checkText)) {
        const matched = checkText.match(pattern);
        logger.warn(
          `[ContentFilter] SENSITIVE rejected | scene=${scene}(${SCENE_LABELS[scene] || scene}) | pattern=${pattern.source} | normalized=${checkText !== trimmed} | snippet=${matched ? matched[0] : '?'}`,
        );
        return {
          passed: false,
          reason: FILTER_ERROR.error,
          errorResponse: FILTER_ERROR,
          details: {
            layer: 'sensitive',
            matched: matched ? matched[0] : null,
            scene,
            wasNormalized: checkText !== trimmed,
          },
        };
      }
    }

    // Layer 2: 第二级脏话检测
    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(checkText)) {
        const matched = checkText.match(pattern);
        logger.warn(
          `[ContentFilter] PROFANITY rejected | scene=${scene}(${SCENE_LABELS[scene] || scene}) | pattern=${pattern.source} | snippet=${matched ? matched[0] : '?'}`,
        );
        return {
          passed: false,
          reason: FILTER_ERROR.error,
          errorResponse: FILTER_ERROR,
          details: {
            layer: 'profanity',
            matched: matched ? matched[0] : null,
            scene,
          },
        };
      }
    }
  }

  return { passed: true };
}

/**
 * 便捷方法：过滤消息文本
 */
function filterMessage(text, scene = 'message') {
  return filterContent(text, { scene });
}

/**
 * 审计模式：拦截并记录完整审计日志
 * Stage 9: 增加normalized标记和完整context记录
 */
function auditAndFilter(text, context = {}) {
  const result = filterContent(text, { scene: context.scene || 'unknown' });

  if (!result.passed) {
    const matchedWord = result.details?.matched || null;
    const matchedWords = matchedWord ? [matchedWord] : [];
    logger.info(
      `[ContentFilter.AUDIT] REJECT | userId=${context.userId || 'anonymous'} | scene=${context.scene} | wasNormalized=${result.details?.wasNormalized || false} | detail=${JSON.stringify(result.details)}`,
    );
    // Stage 9 S3: Write audit log to DB (fire-and-forget)
    auditLog(
      context.userId || null,
      text,
      context.scene || 'unknown',
      context.endpoint || null,
      context.clientIP || null,
      matchedWords,
    ).catch((e) => logger.warn('[ContentFilter] auditLog async error:', e.message));
  }

  return result;
}


// Stage 9 S3: Write audit log to database
async function auditLog(userId, content_text, scene, endpoint, ip, words) {
  try {
    await prisma.contentAuditLog.create({
      data: {
        userId: userId || null,
        content: content_text.substring(0, 500),
        scene: scene || 'post',
        endpoint: endpoint || null,
        ip: ip || null,
        words: words || [],
      },
    });
  } catch (err) {
    logger.warn('[ContentFilter] Audit log write failed:', err.message);
  }
}

module.exports = {
  filterContent,
  filterMessage,
  auditAndFilter,
  normalizeText,
  FILTER_ERROR,
  SENSITIVE_PATTERNS,
  PROFANITY_PATTERNS,
  SCENE_LABELS,
};
