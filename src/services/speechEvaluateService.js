/**
 * src/services/speechEvaluateService.js
 * 口语评测服务 — Phase 2
 *
 * 功能：
 *   - evaluate(userId, transcript, referenceText, targetLanguage) - AI评测口语
 *   - getHistory(userId, limit) - 获取评测历史
 *
 * 所有AI调用走 aiGateway
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');
const { getAIGateway } = require('./aiGateway');

const aiGateway = getAIGateway();

class SpeechEvaluateService {
  /**
   * AI评测口语发音
   * @param {string} userId - 用户ID
   * @param {string} transcript - 语音识别转录文本
   * @param {string} referenceText - 参考/标准文本
   * @param {string} targetLanguage - 目标语言
   * @returns {Promise<Object>} 评测结果
   */
  async evaluate(userId, transcript, referenceText, targetLanguage) {
    try {
      if (!userId || !transcript || !referenceText || !targetLanguage) {
        throw new Error('userId, transcript, referenceText, and targetLanguage are required');
      }

      const languageContext = {
        primaryTargetLanguage: targetLanguage,
        explanationLanguage: 'zh-CN',
      };

      // 通过 aiGateway 进行口语评测
      const aiResponse = await aiGateway.call({
        scene: 'review',
        userId,
        languageContext,
        params: {
          input: transcript,
          text: referenceText,
          language: targetLanguage,
          type: 'speech_evaluation',
        },
      });

      // 解析评测结果
      const evaluation = this._parseEvaluation(aiResponse.result, transcript, referenceText, targetLanguage);

      // 保存评测记录（SUP-06：对齐真实模型 SpeechEvaluationRecord 及其字段）
      const record = await prisma.speechEvaluationRecord.create({
        data: {
          userId,
          transcript,
          referenceText,
          pronunciation: evaluation.pronunciationScore,
          fluency: evaluation.fluencyScore,
          accuracy: evaluation.accuracyScore,
          completeness: evaluation.accuracyScore,
          overallScore: evaluation.overallScore,
          feedback: {
            text: evaluation.feedback,
            corrections: evaluation.corrections,
            targetLanguage,
            aiSource: aiResponse.source,
            evaluatedAt: new Date().toISOString(),
          },
        },
      });

      logger.info('Speech evaluation completed', {
        userId,
        evaluationId: record.id,
        overallScore: evaluation.overallScore,
        targetLanguage,
      });

      return {
        evaluationId: record.id,
        transcript,
        referenceText,
        targetLanguage,
        pronunciationScore: evaluation.pronunciationScore,
        fluencyScore: evaluation.fluencyScore,
        accuracyScore: evaluation.accuracyScore,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        corrections: evaluation.corrections,
        createdAt: record.createdAt,
      };
    } catch (error) {
      logger.error('Speech evaluate failed:', error);
      throw error;
    }
  }

  /**
   * 获取用户评测历史
   * @param {string} userId - 用户ID
   * @param {number} limit - 返回记录数限制 (默认20)
   * @returns {Promise<Array>} 评测历史列表
   */
  async getHistory(userId, limit = 20) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const rawRecords = await prisma.speechEvaluationRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
      });

      // 映射为对外稳定的字段名（保持旧响应结构不变）
      const records = rawRecords.map(r => ({
        id: r.id,
        targetLanguage: r.feedback?.targetLanguage || 'unknown',
        transcript: r.transcript,
        referenceText: r.referenceText,
        pronunciationScore: r.pronunciation,
        fluencyScore: r.fluency,
        accuracyScore: r.accuracy,
        overallScore: r.overallScore,
        feedback: r.feedback?.text || '',
        corrections: r.feedback?.corrections || [],
        createdAt: r.createdAt,
      }));

      // 计算统计信息
      const totalEvaluations = records.length;
      const averageScore = totalEvaluations > 0
        ? Math.round(records.reduce((sum, r) => sum + r.overallScore, 0) / totalEvaluations)
        : 0;

      const latest = records[0] || null;

      // 按语言分组统计
      const languageStats = {};
      records.forEach(r => {
        if (!languageStats[r.targetLanguage]) {
          languageStats[r.targetLanguage] = { count: 0, totalScore: 0 };
        }
        languageStats[r.targetLanguage].count++;
        languageStats[r.targetLanguage].totalScore += r.overallScore;
      });

      const byLanguage = Object.entries(languageStats).map(([lang, stats]) => ({
        language: lang,
        count: stats.count,
        averageScore: Math.round(stats.totalScore / stats.count),
      }));

      return {
        totalEvaluations,
        averageScore,
        latest,
        records,
        byLanguage,
      };
    } catch (error) {
      logger.error('Get speech evaluation history failed:', error);
      throw error;
    }
  }

  // ==================== 内部方法 ====================

  /**
   * 解析AI返回的评测结果
   * @param {any} aiResult - AI返回结果
   * @param {string} transcript - 转录文本
   * @param {string} referenceText - 参考文本
   * @param {string} targetLanguage - 目标语言
   * @returns {Object} 结构化的评测结果
   */
  _parseEvaluation(aiResult, transcript, referenceText, targetLanguage) {
    try {
      const content = aiResult.choices?.[0]?.message?.content || aiResult.content || aiResult;

      // 尝试从AI响应中提取JSON
      if (typeof content === 'string') {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            return {
              pronunciationScore: parsed.pronunciationScore || parsed.pronunciation_score || 0,
              fluencyScore: parsed.fluencyScore || parsed.fluency_score || 0,
              accuracyScore: parsed.accuracyScore || parsed.accuracy_score || 0,
              overallScore: parsed.overallScore || parsed.overall_score || 0,
              feedback: parsed.feedback || '',
              corrections: parsed.corrections || [],
            };
          } catch (e) {
            logger.debug('Failed to parse AI evaluation as JSON, using fallback');
          }
        }
      }

      // 如果AI返回的是结构化对象
      if (typeof content === 'object' && content.overallScore !== undefined) {
        return {
          pronunciationScore: content.pronunciationScore || 0,
          fluencyScore: content.fluencyScore || 0,
          accuracyScore: content.accuracyScore || 0,
          overallScore: content.overallScore || 0,
          feedback: content.feedback || '',
          corrections: content.corrections || [],
        };
      }

      return this._generateFallbackEvaluation(transcript, referenceText);
    } catch (error) {
      logger.error('Parse evaluation failed:', error);
      return this._generateFallbackEvaluation(transcript, referenceText);
    }
  }

  /**
   * 生成回退评测（AI不可用时的基础对比评测）
   */
  _generateFallbackEvaluation(transcript, referenceText) {
    // 基础文本相似度计算
    const similarity = this._calculateTextSimilarity(transcript, referenceText);
    const score = Math.round(similarity * 100);

    return {
      pronunciationScore: score,
      fluencyScore: Math.min(score + 5, 100),
      accuracyScore: score,
      overallScore: score,
      feedback: score >= 80
        ? 'Great job! Your pronunciation is very accurate.'
        : score >= 60
          ? 'Good effort! Keep practicing to improve your pronunciation.'
          : 'Keep practicing! Focus on matching the reference text more closely.',
      corrections: [],
    };
  }

  /**
   * 计算文本相似度（简单Levenshtein距离）
   */
  _calculateTextSimilarity(str1, str2) {
    const s1 = (str1 || '').toLowerCase().trim();
    const s2 = (str2 || '').toLowerCase().trim();

    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1;

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;

    // 简化版Levenshtein距离
    const matrix = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    const distance = matrix[s1.length][s2.length];
    return 1 - distance / maxLen;
  }
}

// ==================== 单例 ====================

let _instance = null;

function getSpeechEvaluateService() {
  if (!_instance) {
    _instance = new SpeechEvaluateService();
  }
  return _instance;
}

module.exports = {
  SpeechEvaluateService,
  getSpeechEvaluateService,
};