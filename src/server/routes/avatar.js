const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const prisma = require('../../../config/database');
const logger = require('../../utils/logger');

// 内存存储：避免临时文件落盘，校验后再写入目标目录
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 宪法 3.1：最大 2MB
  fileFilter(req, file, cb) {
    const allowed = /^image\/(jpeg|png|webp)$/;
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('INVALID_TYPE'), false); // 仅允许 jpg/png/webp
    }
    cb(null, true);
  },
});

const AVATAR_DIR = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'avatars');
const ALLOWED_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// POST /api/user/avatar — 上传头像（宪法 3.1 全链路）
router.post('/avatar', auth.authenticate, upload.single('avatar'), async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ success: false, error: '未检测到上传文件' });
    }
    const ext = ALLOWED_EXT[req.file.mimetype];
    if (!ext) {
      return res.status(400).json({ success: false, error: '头像文件类型仅支持 jpg/png/webp' });
    }
    // 文件名：crypto 随机 + 扩展名白名单（杜绝路径遍历）
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

    // 删除旧头像（避免磁盘垃圾）
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } });
      if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const old = path.join(__dirname, '..', '..', '..', user.avatar);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    } catch (_) { /* 旧头像不存在则忽略 */ }

    fs.writeFileSync(path.join(AVATAR_DIR, filename), req.file.buffer);
    const url = `/uploads/avatars/${filename}`;

    // 持久化到 User 表
    await prisma.user.update({ where: { id: userId }, data: { avatar: url } });

    logger.info(`[Avatar] 上传成功 userId=${userId} url=${url}`);
    res.json({ success: true, data: { url } });
  } catch (e) {
    if (e.message === 'INVALID_TYPE') {
      return res.status(400).json({ success: false, error: '头像文件类型仅支持 jpg/png/webp' });
    }
    if (e.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: '头像文件过大（最大 2MB）' });
    }
    next(e);
  }
});

module.exports = router;
