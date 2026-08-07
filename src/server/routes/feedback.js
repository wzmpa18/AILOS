/**
 * src/server/routes/feedback.js
 * v1.1.0 意见反馈路由（增量新增，不影响任何存量路由）
 *
 * POST /api/feedback           提交反馈（支持截图上传，登录/游客均可）
 * GET  /api/feedback/types     获取问题类型枚举
 * GET  /api/feedback/list      管理端查看（需登录）
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();

const feedbackService = require('../services/feedbackService');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

// 漏洞3 修复：反馈提交 IP 级限流（同一 IP 1 分钟最多 3 次，超出 429）
// 直接在此构造以便自定义中文提示，避免默认英文报错暴露给用户。
const feedbackSubmitLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, error: '提交过于频繁，请稍后再试（每分钟最多 3 次）' },
});

// ---------- 截图上传（可选，最多 3 张，单张 5MB） ----------
const UPLOAD_DIR = path.join(feedbackService.DATA_DIR, 'screenshots');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { /* ignore */ }

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // 漏洞3 修复：文件名 100% 由服务端生成，绝不拼接任何用户输入。
    //   扩展名先经白名单校验（仅字母数字，长度<=5），不匹配一律降级为 .png，
    //   彻底杜绝 ../ 路径遍历与空字节截断等注入写入任意目录的风险。
    const rawExt = path.extname(String(file.originalname || '')).toLowerCase();
    const ext = /^\.[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : '.png';
    const safeName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, path.basename(safeName));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(null, false); // 非图片静默忽略，不阻断提交
  },
});

// multer 错误不得导致 500，统一降级为无截图继续提交
function safeUpload(req, res, next) {
  upload.array('screenshots', 3)(req, res, (err) => {
    if (err) req._uploadError = err.message;
    next();
  });
}

/** 问题类型枚举 */
router.get('/types', (req, res) => {
  res.json({
    success: true,
    types: Object.keys(feedbackService.TYPE_LABELS).map((k) => ({
      value: k,
      label: feedbackService.TYPE_LABELS[k],
    })),
  });
});

/** 提交反馈 */
router.post('/', feedbackSubmitLimiter, optionalAuth, safeUpload, async (req, res) => {
  try {
    const body = req.body || {};
    let description = String(body.description || '').trim();

    if (!description) {
      return res.status(400).json({ success: false, error: '请填写问题描述' });
    }

    // 漏洞3 修复：内容长度硬限制。超出 2000 字直接截断并提示，
    // 杜绝用户提交几十 MB 内容写满服务器磁盘。
    let truncated = false;
    if (description.length > 2000) {
      description = description.slice(0, 2000);
      truncated = true;
    }
    // 联系方式同样限长，避免超长字段撑爆落盘文件
    const contact = String(body.contact || '').trim().slice(0, 200);

    const screenshots = (req.files || []).map((f) => f.filename);

    const result = await feedbackService.submitFeedback({
      type: body.type,
      description,
      contact,
      screenshots,
      userId: req.userId || (req.user && req.user.id) || null,
      page: body.page || req.get('referer') || null,
      userAgent: req.get('user-agent') || null,
    });

    return res.json({
      success: true,
      message: truncated
        ? '反馈已提交（描述超过 2000 字，已自动截断保存），我们会尽快查阅处理。'
        : '反馈已提交，我们会尽快查阅处理。',
      truncated,
      ticketId: result.ticketId,
      mailed: result.mailed,
    });
  } catch (error) {
    // 兜底：任何异常都不返回英文报错，给友好中文提示
    return res.status(500).json({ success: false, error: '提交失败，请稍后重试' });
  }
});

/** 管理端列表（v1.1.0 刚性执行令 P0 雷2 修复：仅管理员可访问，杜绝全量反馈隐私泄露） */
router.get('/list', authenticate, requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({ success: true, items: feedbackService.listFeedback(limit) });
});

module.exports = router;
