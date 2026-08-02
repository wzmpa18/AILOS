// ============================================================
// src/services/orgClassService.js
// Phase 4 P2: 机构班级管理服务（纯增量）
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

class OrgClassService {
  /**
   * 列出机构所有班级
   */
  async listClasses(orgId, { teacherId, status } = {}) {
    const where = { organizationId: orgId };
    if (teacherId) where.teacherId = teacherId;
    if (status) where.status = status;
    else where.status = 'active';

    const classes = await prisma.orgClass.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, nickname: true, phone: true, avatar: true },
        },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      studentCount: c._count.students,
      teacher: c.teacher ? { ...c.teacher, avatar: c.teacher.avatar || '/assets/images/default_avatar.png' } : null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * 创建班级
   */
  async createClass(orgId, { name, description, teacherId }) {
    if (!name || !name.trim()) {
      throw { status: 400, message: 'Class name is required', code: 'NAME_REQUIRED' };
    }

    // 验证 teacher 属于该机构
    if (teacherId) {
      const teacherMembership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: orgId,
          userId: teacherId,
          role: { in: ['teacher', 'admin'] },
          status: 'active',
        },
      });
      if (!teacherMembership) {
        throw { status: 400, message: 'Teacher not found in this organization', code: 'TEACHER_NOT_FOUND' };
      }
    }

    const cls = await prisma.orgClass.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        description: description || null,
        teacherId: teacherId || null,
        status: 'active',
        studentCount: 0,
      },
    });

    logger.info(`[orgClass] 创建班级: id=${cls.id}, name=${cls.name}, orgId=${orgId}`);

    return {
      id: cls.id,
      name: cls.name,
      description: cls.description,
      teacherId: cls.teacherId,
      status: cls.status,
      studentCount: 0,
    };
  }

  /**
   * 更新班级信息
   */
  async updateClass(orgId, classId, { name, description, teacherId, status }) {
    const cls = await prisma.orgClass.findFirst({
      where: { id: classId, organizationId: orgId },
    });

    if (!cls) {
      throw { status: 404, message: 'Class not found', code: 'CLASS_NOT_FOUND' };
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description;
    if (teacherId !== undefined) {
      if (teacherId) {
        const teacherMembership = await prisma.organizationMember.findFirst({
          where: {
            organizationId: orgId,
            userId: teacherId,
            role: { in: ['teacher', 'admin'] },
            status: 'active',
          },
        });
        if (!teacherMembership) {
          throw { status: 400, message: 'Teacher not found', code: 'TEACHER_NOT_FOUND' };
        }
        data.teacherId = teacherId;
      } else {
        data.teacherId = null;
      }
    }
    if (status) data.status = status;

    const updated = await prisma.orgClass.update({
      where: { id: classId },
      data,
    });

    logger.info(`[orgClass] 更新班级: id=${classId}, data=${JSON.stringify(data)}`);

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      teacherId: updated.teacherId,
      status: updated.status,
      studentCount: updated.studentCount,
    };
  }

  /**
   * 归档/删除班级
   */
  async deleteClass(orgId, classId) {
    const cls = await prisma.orgClass.findFirst({
      where: { id: classId, organizationId: orgId },
    });

    if (!cls) {
      throw { status: 404, message: 'Class not found', code: 'CLASS_NOT_FOUND' };
    }

    await prisma.orgClass.update({
      where: { id: classId },
      data: { status: 'archived' },
    });

    logger.info(`[orgClass] 归档班级: id=${classId}, orgId=${orgId}`);

    return { success: true };
  }

  /**
   * 获取班级学生列表
   */
  async listClassStudents(orgId, classId) {
    const cls = await prisma.orgClass.findFirst({
      where: { id: classId, organizationId: orgId },
    });

    if (!cls) {
      throw { status: 404, message: 'Class not found', code: 'CLASS_NOT_FOUND' };
    }

    const enrollments = await prisma.orgClassStudent.findMany({
      where: { classId, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            nickname: true,
            avatar: true,
            xp: true,
            membershipLevel: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      user: e.user,
      joinedAt: e.joinedAt,
    }));
  }
}

module.exports = new OrgClassService();
