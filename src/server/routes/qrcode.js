/**
 * 二维码路由 v4 — 使用 npm qrcode 库（真实可扫描）
 * GET /api/user/share-qrcode — 返回 base64 PNG 二维码
 */
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { authenticate } = require('../middleware/auth');
const logger = require('../../utils/logger');
const prisma = require('../../config/database');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true },
    });

    const shareCode = user?.inviteCode || userId.slice(0, 8);
    const shareUrl = `https://yandao.vip/xuewaiyu/profile.html?share=${shareCode}`;

    // 用真实 QR 库生成 base64 PNG
    const pngBuffer = await QRCode.toBuffer(shareUrl, {
      type: 'png',
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    return res.json({
      success: true,
      qrcode: pngBuffer.toString('base64'),
      url: shareUrl,
      format: 'png',
      size: 240,
    });
  } catch (error) {
    logger.error('[qrcode] 生成失败:', error.message);
    return res.status(500).json({
      success: false,
      code: 'QR_GENERATE_FAILED',
      error: '二维码生成失败: ' + error.message,
    });
  }
});

module.exports = router;
