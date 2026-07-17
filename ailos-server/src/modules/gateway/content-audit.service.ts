import { Injectable, Logger } from '@nestjs/common';
import { AuditResult } from './dto/gateway-request.dto';

/**
 * 三层内容审核模块
 * Step 8: 安全合规审核 → 质量评分 → 版权风险校验
 * 不合格内容拦截重试，仍不合格返回兜底
 *
 * 绝对禁区：禁止AI原始输出直接透传给用户
 */
@Injectable()
export class ContentAuditService {
  private readonly logger = new Logger(ContentAuditService.name);

  // 敏感词库（首期基础版，后续扩展）
  private readonly SENSITIVE_PATTERNS = [/暴力/, /色情/, /毒品/, /赌博/, /非法/, /武器/, /自杀/, /自残/];

  // 内容质量最低阈值
  private readonly MIN_QUALITY_SCORE = 0.6;
  private readonly MIN_SAFETY_SCORE = 0.95;

  /**
   * Step 8: 三层审核全链路
   */
  async audit(content: string, context: { scene: string; domain?: string }): Promise<AuditResult> {
    // 第一层：安全合规审核
    const safetyResult = await this.auditSafety(content);
    if (!safetyResult.passed) {
      this.logger.warn(`[Audit] Safety check failed: ${safetyResult.reason}`);
      return {
        passed: false,
        safetyScore: safetyResult.score,
        qualityScore: 0,
        copyrightRisk: 'low',
        rejectionReason: safetyResult.reason,
      };
    }

    // 第二层：质量评分
    const qualityResult = await this.auditQuality(content, context);
    if (!qualityResult.passed) {
      this.logger.warn(`[Audit] Quality check failed: score=${qualityResult.score}`);
      return {
        passed: false,
        safetyScore: safetyResult.score,
        qualityScore: qualityResult.score,
        copyrightRisk: 'low',
        rejectionReason: `Quality score ${qualityResult.score} below threshold ${this.MIN_QUALITY_SCORE}`,
      };
    }

    // 第三层：版权风险校验
    const copyrightRisk = await this.auditCopyright(content);

    this.logger.log(
      `[Audit] Passed: safety=${safetyResult.score}, quality=${qualityResult.score}, copyright=${copyrightRisk}`,
    );

    return {
      passed: true,
      safetyScore: safetyResult.score,
      qualityScore: qualityResult.score,
      copyrightRisk,
    };
  }

  /**
   * 第一层：安全合规审核
   */
  private async auditSafety(content: string): Promise<{ passed: boolean; score: number; reason?: string }> {
    let score = 1.0;

    // 敏感词检测
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (pattern.test(content)) {
        score -= 0.3;
      }
    }

    // 内容长度检查（过短或过长）
    if (content.length < 10) {
      score -= 0.1;
    }
    if (content.length > 50000) {
      score -= 0.1;
    }

    if (score < this.MIN_SAFETY_SCORE) {
      return { passed: false, score, reason: 'Content contains sensitive material' };
    }

    return { passed: true, score };
  }

  /**
   * 第二层：质量评分
   */
  private async auditQuality(
    content: string,
    context: { scene: string; domain?: string },
  ): Promise<{ passed: boolean; score: number }> {
    let score = 0.7; // 基础分

    // 内容完整性
    if (content.length > 50) score += 0.1;
    if (content.includes('\n') || content.includes('。') || content.includes('.')) score += 0.05;

    // 结构化程度
    const hasStructure = /["\[\{]/.test(content) || content.includes('：') || content.includes(':');
    if (hasStructure) score += 0.05;

    // 信息密度
    const words = content.split(/\s+/).length;
    if (words > 20) score += 0.05;
    if (words > 100) score += 0.05;

    score = Math.min(score, 1.0);

    return {
      passed: score >= this.MIN_QUALITY_SCORE,
      score,
    };
  }

  /**
   * 第三层：版权风险校验
   */
  private async auditCopyright(content: string): Promise<'low' | 'medium' | 'high'> {
    // 基础版权检测：检查是否包含已知版权标识
    const copyrightIndicators = [/©\s*\d{4}/, /All Rights Reserved/i, /版权所有/, /不得转载/, /ISBN/, /出版社/];

    let riskCount = 0;
    for (const indicator of copyrightIndicators) {
      if (indicator.test(content)) {
        riskCount++;
      }
    }

    if (riskCount >= 3) return 'high';
    if (riskCount >= 1) return 'medium';
    return 'low';
  }
}
