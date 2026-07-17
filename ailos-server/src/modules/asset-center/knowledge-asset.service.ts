import { Injectable, Logger } from '@nestjs/common';
import { AssetNode, AssetQuery, AssetSubmission, AuditAction, PromotionCheck } from './dto/asset.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * 公共知识资产服务
 *
 * 核心规则：
 * 1. 多维度检索（领域、难度、标签、语义向量）
 * 2. AI Gateway 优先调用该接口匹配资产
 * 3. 未审核内容禁止进入公共资产库
 * 4. 复用次数+质量评分双达标自动晋级
 */
@Injectable()
export class KnowledgeAssetService {
  private readonly logger = new Logger(KnowledgeAssetService.name);

  // 内存模拟存储（生产环境写入 knowledge_db）
  private knowledgeAssets: Map<string, AssetNode> = new Map();
  private pendingSubmissions: AssetSubmission[] = [];
  private promotionQueue: PromotionCheck[] = [];

  // 晋级阈值
  private readonly PROMOTION_THRESHOLDS = {
    basic_to_standard: { reuseCount: 10, qualityScore: 0.7 },
    standard_to_premium: { reuseCount: 50, qualityScore: 0.85 },
    premium_to_elite: { reuseCount: 200, qualityScore: 0.95 },
  };

  /**
   * 多维检索公共知识资产
   */
  async search(query: AssetQuery): Promise<{ assets: AssetNode[]; total: number }> {
    let results = Array.from(this.knowledgeAssets.values()).filter((a) => a.copyrightAuditStatus === 'passed');

    // 按领域筛选
    if (query.domain) {
      results = results.filter((a) => a.domain === query.domain);
    }

    // 按难度筛选
    if (query.difficulty !== undefined) {
      results = results.filter((a) => a.difficulty === query.difficulty);
    }

    // 按标签筛选
    if (query.tags && query.tags.length > 0) {
      results = results.filter((a) => query.tags!.some((t: string) => a.tags.includes(t)));
    }

    // 按关键词搜索
    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      results = results.filter((a) => a.title.toLowerCase().includes(kw) || a.content.toLowerCase().includes(kw));
    }

    // 语义向量搜索（预留）
    if (query.semanticVector) {
      results = this.semanticSearch(results, query.semanticVector);
    }

    // 按节点ID精确查找
    if (query.nodeId) {
      const node = this.knowledgeAssets.get(query.nodeId);
      return { assets: node ? [node] : [], total: node ? 1 : 0 };
    }

    // 排序
    const sortBy = query.sortBy || 'relevance';
    const sortOrder = query.sortOrder || 'desc';
    results.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'quality') cmp = a.qualityScore - b.qualityScore;
      else if (sortBy === 'reuse_count') cmp = a.reuseCount - b.reuseCount;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    const total = results.length;
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const paged = results.slice((page - 1) * pageSize, page * pageSize);

    this.logger.log(`[Knowledge] Search: domain=${query.domain}, results=${total}`);
    return { assets: paged, total };
  }

  /**
   * 语义搜索（简化实现）
   */
  private semanticSearch(assets: AssetNode[], vector: number[]): AssetNode[] {
    return assets.sort((a, b) => {
      const scoreA = this.cosineSimilarity(vector, this.getAssetVector(a));
      const scoreB = this.cosineSimilarity(vector, this.getAssetVector(b));
      return scoreB - scoreA;
    });
  }

  private getAssetVector(asset: AssetNode): number[] {
    const hash = this.simpleHash(asset.content);
    return Array.from({ length: 8 }, (_, i) => ((hash >> (i * 4)) & 0xf) / 16);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 提交资产审核
   */
  async submitAsset(submission: AssetSubmission): Promise<{ submissionId: string; status: string }> {
    const submissionId = uuidv4();
    this.pendingSubmissions.push(submission);

    this.logger.log(`[Knowledge] Submission received: ${submission.title}, domain=${submission.domain}`);
    return { submissionId, status: 'pending_review' };
  }

  /**
   * 审核资产
   */
  async auditAsset(action: AuditAction): Promise<{ success: boolean; nodeId?: string }> {
    if (action.action === 'approve') {
      const nodeId = uuidv4();
      const submission = this.pendingSubmissions.find((s) => s.title === action.assetId);

      const asset: AssetNode = {
        nodeId,
        domain: submission?.domain || 'general',
        title: submission?.title || action.assetId,
        difficulty: submission?.difficulty || 1,
        content: submission?.content || '',
        tags: submission?.tags || [],
        hierarchyLevel: 0,
        copyrightAuditStatus: 'passed',
        qualityScore: action.qualityScore || 0.7,
        reuseCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.knowledgeAssets.set(nodeId, asset);
      this.logger.log(`[Knowledge] Asset approved: ${nodeId}`);
      return { success: true, nodeId };
    }

    this.logger.log(`[Knowledge] Asset rejected: ${action.assetId}`);
    return { success: true };
  }

  /**
   * 检查资产晋级
   */
  async checkPromotion(assetId: string): Promise<PromotionCheck> {
    const asset = this.knowledgeAssets.get(assetId);
    if (!asset) {
      return {
        assetId,
        currentGrade: 'unknown',
        reuseCount: 0,
        qualityScore: 0,
        eligible: false,
        targetGrade: 'unknown',
      };
    }

    const currentGrade = this.getAssetGrade(asset.qualityScore, asset.reuseCount);
    let targetGrade = currentGrade;
    let eligible = false;

    // 检查晋级条件
    if (
      currentGrade === 'basic' &&
      asset.reuseCount >= this.PROMOTION_THRESHOLDS.basic_to_standard.reuseCount &&
      asset.qualityScore >= this.PROMOTION_THRESHOLDS.basic_to_standard.qualityScore
    ) {
      targetGrade = 'standard';
      eligible = true;
    } else if (
      currentGrade === 'standard' &&
      asset.reuseCount >= this.PROMOTION_THRESHOLDS.standard_to_premium.reuseCount &&
      asset.qualityScore >= this.PROMOTION_THRESHOLDS.standard_to_premium.qualityScore
    ) {
      targetGrade = 'premium';
      eligible = true;
    } else if (
      currentGrade === 'premium' &&
      asset.reuseCount >= this.PROMOTION_THRESHOLDS.premium_to_elite.reuseCount &&
      asset.qualityScore >= this.PROMOTION_THRESHOLDS.premium_to_elite.qualityScore
    ) {
      targetGrade = 'elite';
      eligible = true;
    }

    if (eligible) {
      this.promotionQueue.push({
        assetId,
        currentGrade,
        reuseCount: asset.reuseCount,
        qualityScore: asset.qualityScore,
        eligible,
        targetGrade,
      });
    }

    return {
      assetId,
      currentGrade,
      reuseCount: asset.reuseCount,
      qualityScore: asset.qualityScore,
      eligible,
      targetGrade,
    };
  }

  /**
   * 获取资产等级
   */
  private getAssetGrade(qualityScore: number, reuseCount: number): string {
    if (reuseCount >= 200 && qualityScore >= 0.95) return 'elite';
    if (reuseCount >= 50 && qualityScore >= 0.85) return 'premium';
    if (reuseCount >= 10 && qualityScore >= 0.7) return 'standard';
    return 'basic';
  }

  /**
   * 增加资产复用计数
   */
  async incrementReuse(assetId: string): Promise<void> {
    const asset = this.knowledgeAssets.get(assetId);
    if (asset) {
      asset.reuseCount++;
      this.knowledgeAssets.set(assetId, asset);

      // 自动检查晋级
      await this.checkPromotion(assetId);
    }
  }

  /**
   * 获取待审核资产列表
   */
  async getPendingSubmissions(): Promise<AssetSubmission[]> {
    return this.pendingSubmissions;
  }

  /**
   * 获取晋级队列
   */
  async getPromotionQueue(): Promise<PromotionCheck[]> {
    return this.promotionQueue;
  }
}
