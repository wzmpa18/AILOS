import { Injectable, Logger } from '@nestjs/common';
import { UserAssetService } from './user-asset.service';
import { KnowledgeAssetService } from './knowledge-asset.service';
import { FeedbackService } from './feedback.service';
import { VersionCompatService } from './version-compat.service';
import { SyncService } from './sync.service';
import { BackupService } from './backup.service';
import { AssetQuery, AssetNode, AssetSubmission, AssetFeedback, AuditAction, UserAsset } from './dto/asset.dto';

/**
 * 数据资产中心主服务
 *
 * 全系统唯一的核心资产托管方
 * 绝对禁区：不参与业务流程，不直接调用AI，不允许业务模块直连资产库
 */
@Injectable()
export class AssetCenterService {
  private readonly logger = new Logger(AssetCenterService.name);

  constructor(
    private readonly userAssetService: UserAssetService,
    private readonly knowledgeAssetService: KnowledgeAssetService,
    private readonly feedbackService: FeedbackService,
    private readonly versionCompatService: VersionCompatService,
    private readonly syncService: SyncService,
    private readonly backupService: BackupService,
  ) {}

  // ===== 用户私有资产 =====
  async getUserProfile(userId: string) {
    return this.userAssetService.getUserAsset(userId, 'profile');
  }

  async getUserAssets(userId: string, assetType?: string) {
    return this.userAssetService.getUserAssets(userId, assetType);
  }

  async appendUserAsset(userId: string, assetType: string, data: Record<string, any>): Promise<UserAsset> {
    const asset = await this.userAssetService.appendAsset(userId, assetType, data);

    // 推送多端同步
    await this.syncService.pushSyncEvent({
      eventType: 'asset_updated',
      assetId: `${userId}:${assetType}`,
      userId,
      change: data,
    });

    return asset;
  }

  async getAssetHistory(userId: string, assetType: string) {
    return this.userAssetService.getAssetHistory(userId, assetType);
  }

  async getAuditLogs(userId?: string, limit?: number) {
    return this.userAssetService.getAuditLogs(userId, limit);
  }

  // ===== 公共知识资产 =====
  async searchKnowledge(query: AssetQuery): Promise<{ assets: AssetNode[]; total: number }> {
    return this.knowledgeAssetService.search(query);
  }

  async getKnowledgeNode(nodeId: string): Promise<AssetNode | null> {
    const result = await this.knowledgeAssetService.search({ nodeId });
    return result.assets[0] || null;
  }

  async submitKnowledge(submission: AssetSubmission) {
    return this.knowledgeAssetService.submitAsset(submission);
  }

  async auditKnowledge(action: AuditAction) {
    return this.knowledgeAssetService.auditAsset(action);
  }

  async checkPromotion(nodeId: string) {
    return this.knowledgeAssetService.checkPromotion(nodeId);
  }

  async incrementReuse(nodeId: string) {
    return this.knowledgeAssetService.incrementReuse(nodeId);
  }

  async getPendingSubmissions() {
    return this.knowledgeAssetService.getPendingSubmissions();
  }

  async getPromotionQueue() {
    return this.knowledgeAssetService.getPromotionQueue();
  }

  // ===== 用户反馈 =====
  async submitFeedback(feedback: AssetFeedback) {
    return this.feedbackService.submitFeedback(feedback);
  }

  async processFeedback(feedbackId: string, action: 'accept' | 'reject', resolution?: string) {
    return this.feedbackService.processFeedback(feedbackId, action, resolution);
  }

  async getFeedbacks(status?: string, limit?: number) {
    return this.feedbackService.getFeedbacks(status, limit);
  }

  async getCorrections() {
    return this.feedbackService.getCorrections();
  }

  // ===== 版本兼容 =====
  async migrateAsset(asset: any, fromVersion: string, toVersion: string) {
    return this.versionCompatService.migrateAsset(asset, fromVersion, toVersion);
  }

  async validateCompatibility(asset: any) {
    return this.versionCompatService.validateCompatibility(asset);
  }

  getCurrentSchemaVersion() {
    return this.versionCompatService.getCurrentSchemaVersion();
  }

  // ===== 同步 =====
  async getSyncQueue(userId?: string, limit?: number) {
    return this.syncService.getSyncQueue(userId, limit);
  }

  async getDeadLetterQueue() {
    return this.syncService.getDeadLetterQueue();
  }

  async retryDeadLetterQueue() {
    return this.syncService.retryDeadLetterQueue();
  }

  // ===== 备份与对账 =====
  async performBackup() {
    return this.backupService.performFullBackup();
  }

  async performReconciliation() {
    return this.backupService.performReconciliation();
  }

  async getBackupHistory(limit?: number) {
    return this.backupService.getBackupHistory(limit);
  }

  async getReconciliationHistory(limit?: number) {
    return this.backupService.getReconciliationHistory(limit);
  }
}
