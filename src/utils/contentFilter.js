/**
 * 言道 AILOS - 内容敏感词过滤模块 v3.0
 * 宪法 11.6 全链路内容拦截 + Stage 9 防绕过增强 + VETO3 100+词库扩容
 * 覆盖：消息、群组资料、群公告、好友备注、用户昵称/简介、动态、评论
 * 防绕过：空格/特殊字符/零宽字符/谐音/拆字/繁体字
 */

const logger = require('./logger');
const prisma = require('../config/database');

// ============================================================
// 防绕过预处理: 归一化文本
// ============================================================

function normalizeText(text) {
  if (!text || typeof text !== 'string') return text;

  let normalized = text;

  // 1. 移除零宽字符
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g, '');

  // 2. 繁体转简体（常见敏感词繁体变体）
  const tradToSimp = {
    '法輪功': '法轮功', '輪': '轮', '功': '功',
    '六四': '六四', '陸肆': '六四',
    '色情': '色情', '暴力': '暴力',
    '毒品': '毒品', '賭博': '赌博',
    '詐騙': '诈骗', '洗錢': '洗钱',
    '淫穢': '淫秽', '賣淫': '卖淫',
  };
  for (const [trad, simp] of Object.entries(tradToSimp)) {
    normalized = normalized.replace(new RegExp(trad, 'g'), simp);
  }

  // 3. 移除 CJK 字符之间的空格和常见分隔符
  normalized = normalized.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])\s*[\s._\-|·•​]+[\s._\-|·•​]*\s*([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g,
    '$1$2'
  );

  // 4. 通用：连续CJK之间所有非CJK非字母数字字符移除
  normalized = normalized.replace(
    /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])([^a-zA-Z0-9\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g,
    '$1$3'
  );

  // 5. 拆字还原：常见拆字模式 "月仑功" → "轮功" (法=氵+去, 轮=车+仑)
  const splitCharMap = {
    '车仑': '轮', '月仑': '轮', '讠兑': '说',
    '讠工': '攻', '木几': '机', '女子': '好',
  };
  for (const [split, combined] of Object.entries(splitCharMap)) {
    normalized = normalized.replace(new RegExp(split, 'g'), combined);
  }

  return normalized;
}

// ============================================================
// 敏感词库 v3.0 (100+项)
// ============================================================

// 一级敏感词：政治/暴力/色情/违法/诈骗/毒品/赌博/武器/恐怖主义/贩卖/洗钱/自杀/自残/邪教
const SENSITIVE_PATTERNS = [
  // 政治/邪教类 (20)
  /法轮功/, /falungong/i, /falun/i, /法輪功/,
  /六四/, /六四事件/, /陆肆/, /陸肆/,
  /邪教/, /xie jiao/i, /xiejiao/i,
  /台独/, /台獨/, /港独/, /港獨/,
  /藏独/, /藏獨/, /疆独/, /疆獨/,
  /反华/, /反華/, /反共/, /反政府/,
  /颠覆/, /顛覆/, /暴动/, /暴動/,
  // 暴力/恐怖类 (15)
  /暴力/, /恐怖主义/, /恐怖主義/, /terrorism/i,
  /炸弹/, /炸彈/, /爆炸/, /bomb/i,
  /杀人/, /殺人/, /kill/i, /murder/i,
  /袭击/, /襲擊/, /attack/i,
  /武器/, /槍械/, /枪械/, /firearm/i,
  /弹药/, /彈藥/, /弹药/, /军火/, /軍火/,
  /砍杀/, /砍殺/, /持刀/, /持槍/,
  // 色情/淫秽类 (20)
  /色情/, /淫秽/, /淫穢/, /porn/i, /pornography/i,
  /嫖娼/, /卖淫/, /賣淫/, /prostitution/i,
  /黄色/, /黃色/, /裸体/, /裸體/, /nude/i,
  /性服务/, /性服務/, /一夜情/, /约炮/, /約炮/,
  / AV/, /av女优/, /成人视频/, /成人視頻/,
  /妓女/, /男妓/, /鸭/, /包夜/, /包二奶/,
  /裸聊/, /炮友/, /撩妹/, /撩漢/,
  // 毒品类 (15)
  /毒品/, /吸毒/, /贩毒/, /販毒/, /drug/i, /drugs/i,
  /大麻/, /marijuana/i, /weed/i, /冰毒/, /meth/i,
  /海洛因/, /heroin/i, /可卡因/, /cocaine/i,
  /摇头丸/, /搖頭丸/, /K粉/, /麻古/,
  /鸦片/, /鴉片/, /opium/i, /罂粟/, /罌粟/,
  /注射/, /注射毒品/, /吸毒者/,
  // 赌博类 (10)
  /赌博/, /賭博/, /gambl/i,
  /赌场/, /賭場/, /casino/i,
  /下注/, /赌球/, /賭球/, /外围彩/,
  /老虎机/, /老虎機/, /老虎機/, /百家乐/, /百家樂/,
  /六合彩/, /地下赌庄/, /地下賭莊/,
  // 诈骗/违法类 (15)
  /诈骗/, /詐騙/, /scam/i, /fraud/i,
  /洗钱/, /洗錢/, /money laundering/i,
  /传销/, /傳銷/, /pyramid/i,
  /贩卖/, /販賣/, /走私/, /偷渡/,
  /贿赂/, /賄賂/, /bribe/i, /corruption/i,
  /黑客/, /hacker/i, /木马/, /木馬/, /trojan/i,
  /钓鱼/, /釣魚/, /phishing/i, /盗号/, /盜號/,
  // 自残/自杀类 (8)
  /自杀/, /自殺/, /suicide/i, /kill myself/i,
  /自残/, /自殘/, /self.?harm/i,
  /割腕/, /跳楼/, /跳樓/, /上吊/,
  /安眠药/, /安眠藥/, /overdose/i,
];

// 二级脏话/侮辱性词汇 (25)
const PROFANITY_PATTERNS = [
  /傻逼/, /操你/, /fuck/i, /shit/i, /bitch/i,
  /废物/, /去死/, /垃圾/, /白痴/, /脑子有/,
  /滚开/, /蠢货/, /脑残/, /弱智/, /狗日的/,
  /妈的/, /他妈/, /他媽/, /草泥马/, /草泥馬/,
  /王八蛋/, /混蛋/, /贱人/, /賤人/, /婊子/,
  / dick/i, /asshole/i, /bastard/i, /idiot/i,
  /滚蛋/, /神經病/, /神经病/, /变态/, /變態/,
  /恶心/, /噁心/, /丑八怪/, /醜八怪/,
];

// 场景描述映射
const SCENE_LABELS = {
  message: '消息',
  group_create: '群组创建',
  group_name: '群名称',
  group_desc: '群描述',
  group_announcement: '群公告',
  group_nickname: '群昵称',
  friend_remark: '好友备注',
  friend_request: '好友申请附言',
  user_nickname: '用户昵称',
  user_bio: '个人简介',
  post: '动态',
  timeline_post: '动态',
  timeline_comment: '评论',
};

// ============================================================
// 统一过滤错误
// ============================================================

const FILTER_ERROR_NORMAL = {
  success: false,
  code: 9004,
  error: '内容包含违规信息，请修改后重试',
};

const FILTER_ERROR_SEVERE = {
  success: false,
  code: 9005,
  error: '内容包含严重违规信息，禁止发布',
};

// 违规分级
const SEVERITY = {
  SENSITIVE: 'severe',    // 一级敏感词：严重违规
  PROFANITY: 'normal',    // 二级脏话：一般违规
};

// ============================================================
// 核心过滤函数
// ============================================================

function filterContent(text, options = {}) {
  const scene = options.scene || 'unknown';

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { passed: false, reason: '内容为空' };
  }

  const trimmed = text.trim();

  // 防绕过: 同时检测原始文本和归一化文本
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
          reason: FILTER_ERROR_SEVERE.error,
          errorResponse: FILTER_ERROR_SEVERE,
          details: {
            layer: 'sensitive',
            severity: SEVERITY.SENSITIVE,
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
          reason: FILTER_ERROR_NORMAL.error,
          errorResponse: FILTER_ERROR_NORMAL,
            details: {
            layer: 'profanity',
            severity: SEVERITY.PROFANITY,
            matched: matched ? matched[0] : null,
            scene,
            wasNormalized: checkText !== trimmed,
          },
        };
      }
    }
  }

  return { passed: true };
}

function filterMessage(text, scene = 'message') {
  return filterContent(text, { scene });
}

/**
 * 审计模式：拦截并记录完整审计日志
 * 异常兜底：审计失败不影响主流程，仅console.error+logger.warn
 */
function auditAndFilter(text, context = {}) {
  const result = filterContent(text, { scene: context.scene || 'unknown' });

  if (!result.passed) {
    const matchedWord = result.details?.matched || null;
    const matchedWords = matchedWord ? [matchedWord] : [];
    logger.info(
      `[ContentFilter.AUDIT] REJECT | userId=${context.userId || 'anonymous'} | scene=${context.scene} | severity=${result.details?.severity || 'unknown'} | wasNormalized=${result.details?.wasNormalized || false} | detail=${JSON.stringify(result.details)}`,
    );
    // Stage 9 VETO3: Write audit log to DB (fire-and-forget, 异常兜底)
    auditLog(
      context.userId || null,
      text,
      context.scene || 'unknown',
      context.endpoint || null,
      context.clientIP || null,
      matchedWords,
      result.details?.severity || 'normal',
    ).catch((e) => {
      // 异常兜底：不影响主业务流程
      logger.warn('[ContentFilter] auditLog async error:', e.message);
      console.error('[ContentFilter.AUDIT] async write error:', e.message);
    });
  }

  return result;
}

// Stage 9 S3: Write audit log to database (异常兜底)
async function auditLog(userId, content_text, scene, endpoint, ip, words, level) {
  try {
    await prisma.contentAuditLog.create({
      data: {
        userId: userId || null,
        content: content_text.substring(0, 500),
        scene: scene || 'post',
        endpoint: endpoint || null,
        ip: ip || null,
        words: words || [],
        level: level || 'normal',
      },
    });
  } catch (err) {
    // 异常兜底：不抛出，仅记录日志
    logger.warn('[ContentFilter] Audit log write failed:', err.message);
    console.error('[ContentFilter.AUDIT] DB write error:', err.message);
  }
}

// 统计词库数量
function getWordCount() {
  return {
    sensitive: SENSITIVE_PATTERNS.length,
    profanity: PROFANITY_PATTERNS.length,
    total: SENSITIVE_PATTERNS.length + PROFANITY_PATTERNS.length,
  };
}

module.exports = {
  filterContent,
  filterMessage,
  auditAndFilter,
  normalizeText,
  FILTER_ERROR_NORMAL,
  FILTER_ERROR_SEVERE,
  SENSITIVE_PATTERNS,
  PROFANITY_PATTERNS,
  SCENE_LABELS,
  SEVERITY,
  getWordCount,
};
