const prisma = require('../config/database');
const logger = require('../utils/logger');

class LearningContentService {
  /**
   * Get published learning content with filtering and pagination
   */
  async getContent({ contentType, targetLanguage, difficultyLevel, page = 1, pageSize = 20 }) {
    try {
      const where = {
        status: 'published',
        ...(contentType && { contentType }),
        ...(targetLanguage && { targetLanguage }),
        ...(difficultyLevel && { difficultyLevel }),
      };

      const [items, total] = await Promise.all([
        prisma.learningContent.findMany({
          where,
          orderBy: { qualityScore: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            contentType: true,
            sourceType: true,
            sourceLanguage: true,
            targetLanguage: true,
            explanationLanguage: true,
            difficultyLevel: true,
            contentVersion: true,
            qualityScore: true,
            reuseCount: true,
            contentData: true,
            createdAt: true,
          },
        }),
        prisma.learningContent.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('LearningContentService.getContent failed:', error);
      throw error;
    }
  }

  /**
   * Get content types summary (counts per type for the user's language)
   */
  async getContentSummary(targetLanguage) {
    try {
      const types = ['vocabulary', 'grammar', 'listening', 'dialogue', 'pronunciation'];
      const counts = await Promise.all(
        types.map(async (type) => {
          const count = await prisma.learningContent.count({
            where: {
              contentType: type,
              targetLanguage,
              status: 'published',
            },
          });
          return { type, count };
        })
      );

      return counts.filter((c) => c.count > 0);
    } catch (error) {
      logger.error('LearningContentService.getContentSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get single content item by ID
   */
  async getContentById(id) {
    try {
      const item = await prisma.learningContent.findUnique({
        where: { id },
        select: {
          id: true,
          contentType: true,
          sourceType: true,
          sourceLanguage: true,
          targetLanguage: true,
          explanationLanguage: true,
          difficultyLevel: true,
          contentVersion: true,
          qualityScore: true,
          reuseCount: true,
          contentData: true,
          createdAt: true,
        },
      });

      if (!item) {
        throw new Error('Content not found');
      }

      // Increment reuse count
      await prisma.learningContent.update({
        where: { id },
        data: { reuseCount: { increment: 1 } },
      });

      return item;
    } catch (error) {
      logger.error('LearningContentService.getContentById failed:', error);
      throw error;
    }
  }
}

module.exports = new LearningContentService();