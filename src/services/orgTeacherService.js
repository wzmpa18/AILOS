// ============================================================
// src/services/orgTeacherService.js
// Phase 4 P2: 机构老师管理服务（纯增量）
// ============================================================
const prisma = require('../config/database');
const { hashPassword } = require('../utils/crypto');
const logger = require('../utils/logger');

class OrgTeacherService {
  /**
   * 获取机构所有老师
   */
  async listTeachers(orgId) {
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        role: 'teacher',
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            nickname: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 获取每个老师负责的班级
    const teacherIds = members.map((m) => m.userId);
    const classes = await prisma.orgClass.findMany({
      where: {
        organizationId: orgId,
        teacherId: { in: teacherIds },
        status: 'active',
      },
      select: { id: true, name: true, teacherId: true, studentCount: true },
    });

    const classMap = {};
    for (const c of classes) {
      if (!classMap[c.teacherId]) classMap[c.teacherId] = [];
      classMap[c.teacherId].push({ id: c.id, name: c.name, studentCount: c.studentCount });
    }

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      status: m.status,
      joinedAt: m.joinedAt,
      user: m.user,
      managedClasses: classMap[m.userId] || [],
      classCount: (classMap[m.userId] || []).length,
    }));
  }

  /**
   * 创建老师账号（机构管理员操作）
   * @param {string} orgId - 机构 ID
   * @param {object} data - { phone, email, nickname, password, classIds }
   */
  async createTeacher(orgId, data) {
    const { phone, email, nickname, password, classIds = [] } = data;

    if (!phone && !email) {
      throw { status: 400, message: 'Phone or email is required', code: 'CONTACT_REQUIRED' };
    }
    if (!password || password.length < 6) {
      throw { status: 400, message: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' };
    }

    // 检查手机号/邮箱是否已存在
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        // 已存在用户，直接添加为机构老师
        return this._addExistingUserAsTeacher(orgId, existingPhone.id, { nickname, classIds });
      }
    }
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return this._addExistingUserAsTeacher(orgId, existingEmail.id, { nickname, classIds });
      }
    }

    // 创建新用户（使用 Prisma 事务）
    const result = await prisma.$transaction(async (tx) => {
      const passwordHash = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          phone: phone || null,
          email: email || null,
          nickname: nickname || '',
          passwordHash,
          originChannel: 'institution',
          ownerType: 'PLATFORM',
          isVerified: true,
        },
      });

      const member = await tx.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          role: 'teacher',
          status: 'active',
        },
      });

      // 分配班级
      for (const classId of classIds) {
        const cls = await tx.orgClass.findFirst({
          where: { id: classId, organizationId: orgId },
        });
        if (cls) {
          await tx.orgClass.update({
            where: { id: classId },
            data: { teacherId: user.id },
          });
        }
      }

      return { user, member };
    });

    logger.info(`[orgTeacher] 创建老师: userId=${result.user.id}, orgId=${orgId}`);

    return {
      userId: result.user.id,
      phone: result.user.phone,
      email: result.user.email,
      nickname: result.user.nickname,
      status: result.member.status,
      role: result.member.role,
    };
  }

  /**
   * 更新老师信息（启用/禁用/分配班级）
   */
  async updateTeacher(orgId, membershipId, data) {
    const { status, nickname, classIds } = data;

    const member = await prisma.organizationMember.findFirst({
      where: { id: membershipId, organizationId: orgId, role: 'teacher' },
    });

    if (!member) {
      throw { status: 404, message: 'Teacher not found', code: 'TEACHER_NOT_FOUND' };
    }

    await prisma.$transaction(async (tx) => {
      // 更新成员状态
      if (status) {
        await tx.organizationMember.update({
          where: { id: membershipId },
          data: { status },
        });
        // 同步用户 isActive
        if (status === 'suspended') {
          await tx.user.update({
            where: { id: member.userId },
            data: { isActive: false },
          });
        } else if (status === 'active') {
          await tx.user.update({
            where: { id: member.userId },
            data: { isActive: true },
          });
        }
      }

      // 更新昵称
      if (nickname) {
        await tx.user.update({
          where: { id: member.userId },
          data: { nickname },
        });
      }

      // 更新班级分配
      if (classIds !== undefined) {
        // 清除旧分配
        await tx.orgClass.updateMany({
          where: { organizationId: orgId, teacherId: member.userId },
          data: { teacherId: null },
        });
        // 设置新分配
        for (const classId of classIds) {
          await tx.orgClass.update({
            where: { id: classId, organizationId: orgId },
            data: { teacherId: member.userId },
          });
        }
      }
    });

    logger.info(`[orgTeacher] 更新老师: membershipId=${membershipId}, data=${JSON.stringify(data)}`);

    return { success: true };
  }

  /**
   * 移除老师（从机构中移除，不删除用户）
   */
  async removeTeacher(orgId, membershipId) {
    const member = await prisma.organizationMember.findFirst({
      where: { id: membershipId, organizationId: orgId, role: 'teacher' },
    });

    if (!member) {
      throw { status: 404, message: 'Teacher not found', code: 'TEACHER_NOT_FOUND' };
    }

    await prisma.$transaction(async (tx) => {
      // 解除班级关联
      await tx.orgClass.updateMany({
        where: { organizationId: orgId, teacherId: member.userId },
        data: { teacherId: null },
      });
      // 标记成员为 left
      await tx.organizationMember.update({
        where: { id: membershipId },
        data: { status: 'left' },
      });
    });

    logger.info(`[orgTeacher] 移除老师: membershipId=${membershipId}, orgId=${orgId}`);

    return { success: true };
  }

  /**
   * 将已有用户添加为机构老师
   */
  async _addExistingUserAsTeacher(orgId, userId, { nickname, classIds = [] }) {
    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });

    if (existingMember) {
      if (existingMember.status === 'left') {
        await prisma.organizationMember.update({
          where: { id: existingMember.id },
          data: { status: 'active', role: 'teacher' },
        });
      } else if (existingMember.role !== 'teacher') {
        await prisma.organizationMember.update({
          where: { id: existingMember.id },
          data: { role: 'teacher' },
        });
      } else {
        throw { status: 409, message: 'User is already a teacher in this organization', code: 'ALREADY_TEACHER' };
      }

      // 分配班级
      for (const classId of classIds) {
        await prisma.orgClass.update({
          where: { id: classId, organizationId: orgId },
          data: { teacherId: userId },
        });
      }

      return { userId, status: 'active', role: 'teacher', reused: true };
    }

    // 新建成员关系
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId,
        role: 'teacher',
        status: 'active',
      },
    });

    if (nickname) {
      await prisma.user.update({ where: { id: userId }, data: { nickname } });
    }

    for (const classId of classIds) {
      await prisma.orgClass.update({
        where: { id: classId, organizationId: orgId },
        data: { teacherId: userId },
      });
    }

    return { userId, status: member.status, role: member.role, reused: false };
  }
}

module.exports = new OrgTeacherService();
