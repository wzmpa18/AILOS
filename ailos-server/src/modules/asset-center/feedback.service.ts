import { Injectable, Logger } from '@nestjs/common';
import { AssetFeedback } from './dto/asset.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户反馈 - 资产修正闭环
 *
 * 流程：
 * 1. 用户提交报错
 * 2. 自动分类（内容错误/难度不匹配/版权问题/其他）
 * 3. AI生成优化建议
 * 4. 审核通过后修正/下架资产
 * 5. 更新缓存
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  private feedbacks: Map<string, any> = new Map();
  private corrections: Map<string, any> = new Map();

  /**
   * 提交反馈
   */
  async submitFeedback(feedback: AssetFeedback): Promise<{ feedbackId: string; status: string }> {
    const feedbackId = uuidv4();

    // 自动分类
    const category = this.autoCategorize(feedback.feedbackContent);

    const record = {
      feedbackId,
      userId: feedback.userId,
      assetId: feedback.assetId,
      feedbackType: feedback.feedbackType,
      feedbackContent: feedback.feedbackContent,
      category,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.feedbacks.set(feedbackId, record);

    this.logger.log(`[Feedback] Submitted: ${feedbackId}, type=${feedback.feedbackType}, category=${category}`);

    return { feedbackId, status: 'pending' };
  }

  /**
   * 自动分类
   */
  private autoCategorize(content: string): string {
    if (/错误|不对|不正确|有误|错误答案/.test(content)) return 'content_error';
    if (/太难|太简单|难度|不合适/.test(content)) return 'difficulty_mismatch';
    if (/抄袭|侵权|版权|原创/.test(content)) return 'copyright_concern';
    if (/建议|优化|改进|增加/.test(content)) return 'improvement';
    return 'other';
  }

  /**
   * 处理反馈
   */
  async processFeedback(
    feedbackId: string,
    action: 'accept' | 'reject',
    resolution?: string,
  ): Promise<{ success: boolean }> {
    const feedback = this.feedbacks.get(feedbackId);
    if (!feedback) {
      return { success: false };
    }

    feedback.status = action === 'accept' ? 'resolved' : 'rejected';
    feedback.resolution = resolution || '';
    feedback.updatedAt = new Date().toISOString();
    this.feedbacks.set(feedbackId, feedback);

    if (action === 'accept') {
      // 生成修正建议
      const correction = {
        correctionId: uuidv4(),
        feedbackId,
        assetId: feedback.assetId,
        action: feedback.category === 'copyright_concern' ? 'deprecate' : 'correct',
        suggestion: this.generateCorrectionSuggestion(feedback),
        status: 'pending_audit',
        createdAt: new Date().toISOString(),
      };
      this.corrections.set(correction.correctionId, correction);
    }

    this.logger.log(`[Feedback] Processed: ${feedbackId}, action=${action}`);
    return { success: true };
  }

  /**
   * 生成修正建议（AI生成，此处为简化版）
   */
  private generateCorrectionSuggestion(feedback: any): string {
    if (feedback.category === 'content_error') {
      return `检测到内容错误报告：${feedback.feedbackContent}。建议人工核实并修正相关内容。`;
    }
    if (feedback.category === 'difficulty_mismatch') {
      return `难度评级不匹配：${feedback.feedbackContent}。建议重新评估并调整难度标签。`;
    }
    if (feedback.category === 'copyright_concern') {
      return `版权风险报告：${feedback.feedbackContent}。建议立即下架并启动版权审查。`;
    }
    return `用户反馈：${feedback.feedbackContent}。建议人工审核。`;
  }

  /**
   * 获取反馈列表
   */
  async getFeedbacks(status?: string, limit: number = 100): Promise<any[]> {
    let list = Array.from(this.feedbacks.values());
    if (status) {
      list = list.filter((f) => f.status === status);
    }
    return list.slice(-limit);
  }

  /**
   * 获取修正列表
   */
  async getCorrections(): Promise<any[]> {
    return Array.from(this.corrections.values());
  }
}
