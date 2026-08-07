/**
 * 语音模块路由（P1-M）
 * POST /api/v1/voice/tts  — 语音合成（腾讯云兜底，原生不可用时前端调用）
 * POST /api/v1/voice/asr  — 语音识别（腾讯云兜底）
 * 额度：vocab 场景免费无限；ai 场景免费用户每日 5 次，会员无限。
 * 限流：单用户每分钟 10 次。
 * 密钥仅后端，前端不接触。
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireUser } = require('../middleware/auth');
const redis = require('../../config/redis');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');
// P2 Day3：voice 路由改为通过 Brain Facade 统一入口
const brainFacade = require('../../core/brain/facade');

const RATE_LIMIT_PER_MIN = 10;
const AI_FREE_DAILY = 5;
const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 60s 音频约 1-2MB，放宽到 5MB 防误伤

// 语言 code -> 标准 voiceLang（统一归一）
const LANG_SET = new Set(['zh', 'en', 'ja', 'ko', 'fr', 'es', 'de']);

function normLang(lang) {
  if (!lang) return 'en';
  lang = String(lang).toLowerCase();
  if (LANG_SET.has(lang)) return lang;
  // 兼容 BCP47，如 ja-JP -> ja
  const base = lang.split('-')[0];
  return LANG_SET.has(base) ? base : 'en';
}

async function checkRateLimit(userId) {
  const minuteKey = `voice:ratelimit:${userId}:${Math.floor(Date.now() / 60000)}`;
  try {
    const cnt = await redis.incr(minuteKey);
    if (cnt === 1) await redis.expire(minuteKey, 60);
    if (cnt > RATE_LIMIT_PER_MIN) return false;
    return true;
  } catch (e) {
    logger.warn('[voice] rate limit check failed (allow):', e.message);
    return true; // 限流组件异常不阻断主流程
  }
}

// 返回 true 表示额度充足；false 表示超额（仅 ai 场景对免费用户生效）
async function checkQuota(userId, scene, isMember) {
  if (scene !== 'ai') return true; // vocab 免费无限
  if (isMember) return true;       // 会员无限
  const today = new Date().toISOString().slice(0, 10);
  const quotaKey = `voice:quota:${userId}:${today}`;
  try {
    const used = parseInt(await redis.get(quotaKey) || '0', 10);
    if (used >= AI_FREE_DAILY) return false;
    await redis.incr(quotaKey);
    await redis.expireat(quotaKey, Math.floor(Date.now() / 1000) + 86400 * 2);
    return true;
  } catch (e) {
    logger.warn('[voice] quota check failed (allow):', e.message);
    return true;
  }
}

async function logUsage({ userId, scene, type, lang, provider, chars, duration, success, errCode }) {
  try {
    await prisma.voiceUsageLog.create({
      data: { userId, scene, type, lang, provider, chars: chars || 0, duration: duration || 0, success: !!success, errCode: errCode || null },
    });
  } catch (e) {
    logger.warn('[voice] usage log failed (non-fatal):', e.message);
  }
}

// 腾讯云未配置时返回明确错误码（前端友好提示，按钮不隐藏）
function tencentUnavailable(res) {
  return res.status(503).json({
    success: false,
    code: 'TENCENT_NOT_CONFIGURED',
    error: '语音服务暂不可用，请稍后再试',
  });
}

/**
 * POST /tts
 * body: { text, lang, voiceType? , scene? }  scene: vocab | ai
 */
router.post('/tts', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const isMember = req.user && (req.user.membershipLevel === 'basic' || req.user.membershipLevel === 'premium' || req.user.membershipLevel === 'pro');
    const { text, voiceType, scene } = req.body || {};
    const useScene = scene === 'ai' ? 'ai' : 'vocab';
    const lang = normLang(req.body && req.body.lang);

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, code: 'EMPTY_TEXT', error: '文本不能为空' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ success: false, code: 'TEXT_TOO_LONG', error: '文本过长' });
    }

    if (!(await checkRateLimit(userId))) {
      return res.status(429).json({ success: false, code: 'RATE_LIMITED', error: '操作过于频繁，请稍后再试' });
    }
    if (!(await checkQuota(userId, useScene, isMember))) {
      return res.status(403).json({
        success: false, code: 'QUOTA_EXCEEDED',
        error: '今日对话语音额度已用完，升级会员享无限次',
        needUpgrade: true,
      });
    }

    // P2 Day3：通过 Brain Facade 统一入口（isConfigured 检查在 Facade 内部）
    let result;
    try {
      result = await brainFacade.generateVoice(text, lang);
    } catch (e) {
      await logUsage({ userId, scene: useScene, type: 'tts', lang, provider: 'tencent', chars: text.length, success: false, errCode: e.code || 'TTS_FAILED' });
      if (e.quotaExhausted) {
        return res.status(402).json({
          success: false,
          code: 'TTS_QUOTA_EXHAUSTED',
          error: '后端语音额度已用尽，已为你切换到设备原生发音',
        });
      }
      return res.status(502).json({ success: false, code: 'TTS_FAILED', error: '语音合成失败，请重试' });
    }

    if (!result || !result.audioBase64) {
      await logUsage({ userId, scene: useScene, type: 'tts', lang, provider: 'tencent', chars: text.length, success: false, errCode: 'TTS_EMPTY' });
      return res.status(502).json({ success: false, code: 'TTS_FAILED', error: '语音合成失败，请重试' });
    }

    await logUsage({ userId, scene: useScene, type: 'tts', lang, provider: 'tencent', chars: text.length, success: true });
    return res.json({
      success: true,
      audio: result.audioBase64, // base64 mp3
      codec: result.codec || 'mp3',
      lang,
    });
  } catch (e) {
    logger.error('[voice] /tts error:', e.message);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', error: '服务器错误' });
  }
});

/**
 * POST /asr
 * multipart: audio (file) 或 body: { audioBase64, voiceFormat, lang }
 * 录音识别，需登录用户（计费/额度）。
 */
router.post('/asr', authenticate, requireUser, async (req, res) => {
  try {
    const userId = req.userId;
    const isMember = req.user && (req.user.membershipLevel === 'basic' || req.user.membershipLevel === 'premium' || req.user.membershipLevel === 'pro');
    const lang = normLang(req.body && req.body.lang);
    const voiceFormat = (req.body && req.body.voiceFormat) || 'wav';

    let audioBase64 = req.body && req.body.audioBase64;
    // 支持 multipart 上传
    if (!audioBase64 && req.file && req.file.buffer) {
      if (req.file.buffer.length > MAX_AUDIO_BYTES) {
        return res.status(413).json({ success: false, code: 'AUDIO_TOO_LARGE', error: '音频过长，请控制在60秒内' });
      }
      audioBase64 = req.file.buffer.toString('base64');
    }
    if (!audioBase64) {
      return res.status(400).json({ success: false, code: 'NO_AUDIO', error: '未收到音频数据' });
    }

    if (!(await checkRateLimit(userId))) {
      return res.status(429).json({ success: false, code: 'RATE_LIMITED', error: '操作过于频繁，请稍后再试' });
    }
    if (!(await checkQuota(userId, 'ai', isMember))) {
      return res.status(403).json({
        success: false, code: 'QUOTA_EXCEEDED',
        error: '今日对话语音额度已用完，升级会员享无限次',
        needUpgrade: true,
      });
    }

    // P2 Day3：ASR 也通过 Brain Facade
    // isConfigured 检查在 Facade 内部，此处直接调用
    try {
      result = await brainFacade.generateVoice(audioBase64, lang);  // 使用 generateVoice 作为语音识别入口
    } catch (e) {
      return res.status(502).json({ success: false, code: 'ASR_FAILED', error: '语音识别失败，请重试' });
    }
    if (!result) {
      await logUsage({ userId, scene: 'ai', type: 'asr', lang, provider: 'tencent', success: false, errCode: 'TENCENT_NOT_CONFIGURED' });
      return tencentUnavailable(res);
    }

    // P2 Day3：ASR 也通过 Brain Facade（voiceService 已迁移到 core/brain/adapters/）
    const result = await brainFacade.generateVoice(audioBase64, lang);
    if (!result || !result.text) {
      await logUsage({ userId, scene: 'ai', type: 'asr', lang, provider: 'tencent', success: false, errCode: 'ASR_EMPTY' });
      return res.status(502).json({ success: false, code: 'ASR_FAILED', error: '语音识别失败，请重试' });
    }

    await logUsage({ userId, scene: 'ai', type: 'asr', lang, provider: 'tencent', success: true });
    return res.json({ success: true, text: result.text, lang });
  } catch (e) {
    logger.error('[voice] /asr error:', e.message);
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', error: '服务器错误' });
  }
});

module.exports = router;
