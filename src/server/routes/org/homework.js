/**
 * P2: 机构作业管理路由 v2.0
 * 支持四种作业类型：text/image/audio/video
 * 存储生命周期：24h自动清理 + 归档机制 + 操作日志
 *
 * GET    /api/org/homework           — 作业列表
 * POST   /api/org/homework           — 布置作业（支持多媒体类型）
 * GET    /api/org/homework/:id       — 作业详情+提交统计
 * PUT    /api/org/homework/:id       — 批改作业（评分+评语）
 * DELETE /api/org/homework/:id       — 删除作业（含媒体清理）
 * POST   /api/org/homework/:id/submit — 学生提交作业
 * GET    /api/org/homework/:id/submissions — 查看提交列表
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireOrgRole } = require('../../middleware/orgAuth');

router.use(authenticate);
router.use(requireOrgRole('teacher'));

// ============ 存储生命周期配置 ============
const STORAGE_RETENTION_HOURS = 24;       // 默认留存24小时
const ARCHIVE_ENABLED = true;             // 默认开启归档

// ============ 作业列表 ============
router.get('/', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const orgId = req.orgId;
    const role = req.orgRole;

    let query, params;
    if (role === 'admin') {
      query = `SELECT * FROM org_homework WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`;
      params = [orgId];
    } else {
      query = `SELECT * FROM org_homework WHERE org_id = $1 AND teacher_id = $2 ORDER BY created_at DESC LIMIT 50`;
      params = [orgId, req.userId];
    }

    const homework = await prisma.$queryRawUnsafe(query, ...params);
    await prisma.$disconnect();

    const list = (homework || []).map(h => ({
      id: h.id, title: h.title, type: h.type || 'vocabulary',
      classId: h.class_id, className: h.class_name || '',
      deadline: h.deadline, createdAt: h.created_at,
      submittedCount: h.submitted_count || 0, totalCount: h.total_count || 0,
      completionRate: h.total_count > 0 ? Math.round(h.submitted_count / h.total_count * 100) : 0,
      archived: h.archived || false,
    }));

    res.json({ success: true, data: { homework: list, total: list.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取作业列表失败' });
  }
});

// ============ 布置作业 ============
router.post('/', async (req, res) => {
  try {
    const { title, type, classId, content, deadline, homeworkTypes, allowLate } = req.body;
    if (!title || !classId) return res.status(400).json({ success: false, error: '缺少作业标题或班级' });

    const { PrismaClient } = require('@prisma/client');
    const crypto = require('crypto');
    const prisma = new PrismaClient();

    const classInfo = await prisma.$queryRawUnsafe(
      `SELECT name, id FROM org_class WHERE id = $1 AND organization_id = $2`,
      classId, req.orgId
    );
    if (!classInfo || !classInfo.length) return res.status(404).json({ success: false, error: '班级不存在' });

    const studentCount = await prisma.orgClassStudent.count({ where: { classId } });
    const hwTypes = homeworkTypes || ['text'];

    const hwId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO org_homework (id, org_id, teacher_id, title, type, class_id, class_name, content, deadline, total_count, created_at, homework_types, allow_late)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12)`,
      hwId, req.orgId, req.userId, title, type || 'vocabulary', classId, classInfo[0].name,
      JSON.stringify(content || {}), deadline ? new Date(deadline) : null, studentCount,
      JSON.stringify(hwTypes), allowLate !== false
    );

    await prisma.$disconnect();
    res.json({ success: true, data: { id: hwId, created: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '布置作业失败：' + (error.message || '') });
  }
});

// ============ 作业详情 ============
router.get('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM org_homework WHERE id = $1 AND org_id = $2`,
      req.params.id, req.orgId
    );
    if (!rows || !rows.length) return res.status(404).json({ success: false, error: '作业不存在' });

    const hw = rows[0];
    // 获取提交列表
    const submissions = await prisma.$queryRawUnsafe(
      `SELECT * FROM org_homework_submission WHERE homework_id = $1 ORDER BY submitted_at DESC`,
      req.params.id
    );

    await prisma.$disconnect();

    res.json({ success: true, data: {
      homework: {
        id: hw.id, title: hw.title, type: hw.type, classId: hw.class_id,
        className: hw.class_name, deadline: hw.deadline, createdAt: hw.created_at,
        submittedCount: hw.submitted_count || 0, totalCount: hw.total_count || 0,
        homeworkTypes: JSON.parse(hw.homework_types || '["text"]'),
        allowLate: hw.allow_late !== false, archived: hw.archived || false,
      },
      submissions: (submissions || []).map(s => ({
        id: s.id, userId: s.user_id, userName: s.user_name,
        type: s.submission_type, content: s.content,
        score: s.score, feedback: s.feedback,
        submittedAt: s.submitted_at, mediaUrl: s.media_url,
        mediaExpiresAt: s.media_expires_at,
      })),
    }});
  } catch (error) {
    res.status(500).json({ success: false, error: '获取详情失败' });
  }
});

// ============ 批改作业 ============
router.put('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { score, feedback } = req.body;
    await prisma.$executeRawUnsafe(
      `UPDATE org_homework_submission SET score = $1, feedback = $2, graded_at = NOW() WHERE homework_id = $3 AND id = $4`,
      score || 0, feedback || '', req.params.id, req.body.submissionId
    );

    await prisma.$disconnect();
    res.json({ success: true, data: { graded: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '批改失败' });
  }
});

// ============ 删除作业 ============
router.delete('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 清理关联的媒体文件
    const submissions = await prisma.$queryRawUnsafe(
      `SELECT media_url FROM org_homework_submission WHERE homework_id = $1 AND media_url IS NOT NULL`,
      req.params.id
    );
    const fs = require('fs');
    (submissions || []).forEach(s => {
      if (s.media_url) {
        try { fs.unlinkSync(s.media_url); } catch(e) {}
      }
    });

    await prisma.$executeRawUnsafe(`DELETE FROM org_homework_submission WHERE homework_id = $1`, req.params.id);
    await prisma.$executeRawUnsafe(`DELETE FROM org_homework WHERE id = $1 AND org_id = $2`, req.params.id, req.orgId);

    await prisma.$disconnect();
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

// ============ 学生提交作业 ============
router.post('/:id/submit', async (req, res) => {
  try {
    const { type, content, mediaBase64, fileName } = req.body;
    if (!type) return res.status(400).json({ success: false, error: '缺少提交类型' });

    const { PrismaClient } = require('@prisma/client');
    const crypto = require('crypto');
    const prisma = new PrismaClient();

    let mediaUrl = null;
    let mediaExpiresAt = null;

    // 处理媒体文件（图片/录音/视频）
    if ((type === 'image' || type === 'audio' || type === 'video') && mediaBase64) {
      const uploadDir = '/www/xuewaiyu/uploads/homework/' + req.params.id;
      const fs = require('fs');
      fs.mkdirSync(uploadDir, { recursive: true });

      const ext = type === 'image' ? 'jpg' : type === 'audio' ? 'webm' : 'mp4';
      const mediaFileName = crypto.randomUUID() + '.' + ext;
      const mediaPath = uploadDir + '/' + mediaFileName;

      const buffer = Buffer.from(mediaBase64.replace(/^data:.*?;base64,/, ''), 'base64');
      fs.writeFileSync(mediaPath, buffer);

      mediaUrl = '/uploads/homework/' + req.params.id + '/' + mediaFileName;
      mediaExpiresAt = new Date(Date.now() + STORAGE_RETENTION_HOURS * 3600000).toISOString();
    }

    const subId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO org_homework_submission (id, homework_id, user_id, user_name, submission_type, content, media_url, media_expires_at, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      subId, req.params.id, req.userId, req.userName || '学生', type, content || '', mediaUrl, mediaExpiresAt
    );

    await prisma.$executeRawUnsafe(
      `UPDATE org_homework SET submitted_count = submitted_count + 1 WHERE id = $1`,
      req.params.id
    );

    // 归档逻辑（异步，不阻塞响应）
    if (ARCHIVE_ENABLED && mediaUrl) {
      scheduleArchive(req.params.id, mediaUrl, mediaFileName);
    }

    await prisma.$disconnect();
    res.json({ success: true, data: { submitted: true, id: subId, mediaUrl, mediaExpiresAt } });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交失败：' + (error.message || '') });
  }
});

// ============ 存储生命周期管理 ============
function scheduleArchive(homeworkId, mediaUrl, fileName) {
  const fs = require('fs');
  const path = require('path');
  const archiveDir = '/www/xuewaiyu/archive/homework/' + homeworkId;

  setTimeout(() => {
    try {
      fs.mkdirSync(archiveDir, { recursive: true });
      const srcPath = '/www/xuewaiyu' + mediaUrl;
      const destPath = archiveDir + '/' + fileName;
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        // 归档日志
        fs.appendFileSync('/var/log/ailos_hw_archive.log',
          `[${new Date().toISOString()}] ARCHIVED ${homeworkId}/${fileName} -> ${destPath}\n`);
      }
    } catch(e) {}
  }, 3600000); // 1小时后归档
}

// 定时清理过期媒体（每小时执行）
setInterval(() => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const fs = require('fs');

  prisma.$queryRawUnsafe(
    `SELECT id, media_url FROM org_homework_submission WHERE media_expires_at < NOW() AND media_url IS NOT NULL`
  ).then(expired => {
    (expired || []).forEach(s => {
      if (s.media_url) {
        const fullPath = '/www/xuewaiyu' + s.media_url;
        try { fs.unlinkSync(fullPath); } catch(e) {}
        try {
          prisma.$executeRawUnsafe(
            `UPDATE org_homework_submission SET media_url = NULL, media_expires_at = NULL WHERE id = $1`,
            s.id
          );
        } catch(e) {}
      }
    });
    prisma.$disconnect();
  }).catch(() => prisma.$disconnect());
}, 3600000);

module.exports = router;
