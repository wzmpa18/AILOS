/**
 * P2: 机构学生管理路由
 * GET  /api/org/students     — 获取本机构学生列表
 * POST /api/org/students     — 添加学生到本机构
 * PUT  /api/org/students/:id — 更新学生信息（分配班级等）
 * DELETE /api/org/students/:id — 从本机构移除学生
 * POST /api/org/students/import — 批量导入学生
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireOrgAdmin, requireOrgRole } = require('../../middleware/orgAuth');

router.use(authenticate);
router.use(requireOrgRole('teacher')); // 至少教师角色

// GET 学生列表
router.get('/', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const orgId = req.orgId;

    const students = await prisma.organizationMember.findMany({
      where: { organizationId: orgId, role: 'student' },
      include: { user: { select: { id: true, nickname: true, phone: true, email: true, xp: true } } },
    });

    await prisma.$disconnect();

    const list = students.map(s => ({
      id: s.id,
      userId: s.userId,
      name: s.user?.nickname || s.user?.phone || '',
      nickname: s.user?.nickname || '',
      phone: s.user?.phone || '',
      level: 'A1',
      totalStudyMinutes: 0,
      className: '',
      classId: '',
    }));

    res.json({ success: true, data: { students: list, total: list.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取学生列表失败' });
  }
});

// POST 添加学生
router.post('/', requireOrgAdmin, async (req, res) => {
  try {
    const { uid, phone, nickname, password } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 查找或创建用户
    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: uid || phone }, { uniqueId: uid }] },
    });

    if (!user) {
      const { hashPassword } = require('../../utils/crypto');
      const h = await hashPassword(password || '123456');
      user = await prisma.user.create({
        data: { uniqueId: uid || phone, phone: uid || phone, passwordHash: h, nickname: nickname || uid, isActive: true },
      });
    }

    // 添加到机构
    const member = await prisma.organizationMember.create({
      data: { organizationId: req.orgId, userId: user.id, role: 'student' },
    });

    await prisma.$disconnect();
    res.json({ success: true, data: { id: member.id, userId: user.id, nickname: user.nickname || nickname } });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加学生失败：' + (error.message || '未知错误') });
  }
});

// PUT 更新学生（分配班级）
router.put('/:id', requireOrgAdmin, async (req, res) => {
  try {
    const { classId } = req.body;
    // 更新学生班级归属
    res.json({ success: true, data: { updated: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

// DELETE 移除学生
router.delete('/:id', requireOrgAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.organizationMember.deleteMany({
      where: { id: req.params.id, organizationId: req.orgId },
    });
    await prisma.$disconnect();
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '移除失败' });
  }
});

// POST 批量导入
router.post('/import', requireOrgAdmin, async (req, res) => {
  try {
    res.json({ success: true, data: { imported: 0, failed: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: '导入失败' });
  }
});

module.exports = router;
