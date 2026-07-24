// ============================================================
// src/services/courseService.js
// 学习内容服务 — 课程体系 CRUD + 用户进度追踪
// ============================================================
const prisma = require('../config/database');
const logger = require('../utils/logger');

class CourseService {
  // ============================================================
  // 语言
  // ============================================================

  async getLanguages() {
    return prisma.language.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async getLanguageByCode(code) {
    return prisma.language.findUnique({ where: { code } });
  }

  // ============================================================
  // 课程
  // ============================================================

  async getCoursesByLanguage(languageCode) {
    const language = await prisma.language.findUnique({ where: { code: languageCode } });
    if (!language) throw new Error(`Language not found: ${languageCode}`);

    return prisma.course.findMany({
      where: { languageId: language.id, isPublished: true },
      include: {
        units: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                itemType: true,
                title: true,
                sortOrder: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCourseById(courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        language: true,
        units: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    if (!course) throw new Error('Course not found');
    return course;
  }

  // ============================================================
  // 单元
  // ============================================================

  async getUnitById(unitId) {
    const unit = await prisma.courseUnit.findUnique({
      where: { id: unitId },
      include: {
        course: {
          include: { language: true },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!unit) throw new Error('Unit not found');
    return unit;
  }

  // ============================================================
  // 学习项
  // ============================================================

  async getItemById(itemId) {
    const item = await prisma.courseItem.findUnique({
      where: { id: itemId },
      include: {
        unit: {
          include: {
            course: {
              include: { language: true },
            },
          },
        },
      },
    });
    if (!item) throw new Error('Item not found');
    return item;
  }

  async getItemsByUnit(unitId) {
    return prisma.courseItem.findMany({
      where: { unitId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ============================================================
  // 用户进度
  // ============================================================

  async getUserProgress(userId, courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        units: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, itemType: true, title: true },
            },
          },
        },
      },
    });
    if (!course) throw new Error('Course not found');

    const allItemIds = course.units.flatMap(u => u.items.map(i => i.id));

    const progress = await prisma.userCourseProgress.findMany({
      where: {
        userId,
        itemId: { in: allItemIds },
      },
    });

    const progressMap = {};
    for (const p of progress) {
      progressMap[p.itemId] = p;
    }

    const totalItems = allItemIds.length;
    const completedItems = progress.filter(p => p.status === 'completed').length;
    const inProgressItems = progress.filter(p => p.status === 'in_progress').length;

    return {
      courseId,
      totalItems,
      completedItems,
      inProgressItems,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      units: course.units.map(unit => ({
        id: unit.id,
        title: unit.title,
        items: unit.items.map(item => ({
          id: item.id,
          itemType: item.itemType,
          title: item.title,
          status: progressMap[item.id]?.status || 'not_started',
          score: progressMap[item.id]?.score || null,
          attempts: progressMap[item.id]?.attempts || 0,
        })),
      })),
    };
  }

  async updateItemProgress(userId, itemId, data) {
    const { status, score } = data;

    const existing = await prisma.userCourseProgress.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    if (existing) {
      return prisma.userCourseProgress.update({
        where: { id: existing.id },
        data: {
          status: status || existing.status,
          score: score !== undefined ? score : existing.score,
          attempts: existing.attempts + 1,
          lastAttemptAt: new Date(),
          completedAt: status === 'completed' ? new Date() : existing.completedAt,
        },
      });
    }

    return prisma.userCourseProgress.create({
      data: {
        userId,
        itemId,
        status: status || 'in_progress',
        score: score || null,
        attempts: 1,
        lastAttemptAt: new Date(),
        completedAt: status === 'completed' ? new Date() : null,
      },
    });
  }

  // ============================================================
  // 学习概览
  // ============================================================

  async getLearningOverview(userId) {
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      include: {
        courses: {
          where: { isPublished: true },
          select: { id: true, title: true, level: true },
        },
      },
    });

    // 获取用户所有进度
    const allProgress = await prisma.userCourseProgress.findMany({
      where: { userId },
    });

    const completedCount = allProgress.filter(p => p.status === 'completed').length;
    const inProgressCount = allProgress.filter(p => p.status === 'in_progress').length;

    return {
      languages: languages.map(lang => ({
        code: lang.code,
        name: lang.name,
        nameLocal: lang.nameLocal,
        courseCount: lang.courses.length,
      })),
      stats: {
        totalCompleted: completedCount,
        totalInProgress: inProgressCount,
        totalItems: allProgress.length,
      },
    };
  }
}

module.exports = new CourseService();