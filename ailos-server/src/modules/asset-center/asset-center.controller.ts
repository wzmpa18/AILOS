import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AssetCenterService } from './asset-center.service';

@Controller('asset')
export class AssetCenterController {
  constructor(private readonly assetCenterService: AssetCenterService) {}

  // 用户资产
  @Get('user/:userId/profile')
  async getUserProfile(@Param('userId') userId: string) {
    return this.assetCenterService.getUserProfile(userId);
  }

  @Get('user/:userId/assets')
  async getUserAssets(@Param('userId') userId: string, @Query('type') type?: string) {
    return this.assetCenterService.getUserAssets(userId, type);
  }

  @Post('user/append')
  async appendUserAsset(@Body() body: { userId: string; assetType: string; data: Record<string, any> }) {
    return this.assetCenterService.appendUserAsset(body.userId, body.assetType, body.data);
  }

  @Get('user/:userId/history/:assetType')
  async getAssetHistory(@Param('userId') userId: string, @Param('assetType') assetType: string) {
    return this.assetCenterService.getAssetHistory(userId, assetType);
  }

  // 知识资产
  @Get('knowledge/search')
  async searchKnowledge(@Query() query: any) {
    return this.assetCenterService.searchKnowledge(query);
  }

  @Get('knowledge/:nodeId')
  async getKnowledgeNode(@Param('nodeId') nodeId: string) {
    return this.assetCenterService.getKnowledgeNode(nodeId);
  }

  @Post('knowledge/submit')
  async submitKnowledge(@Body() body: any) {
    return this.assetCenterService.submitKnowledge(body);
  }

  @Post('knowledge/audit')
  async auditKnowledge(@Body() body: any) {
    return this.assetCenterService.auditKnowledge(body);
  }

  @Get('knowledge/promotion/:nodeId')
  async checkPromotion(@Param('nodeId') nodeId: string) {
    return this.assetCenterService.checkPromotion(nodeId);
  }

  // 反馈
  @Post('feedback')
  async submitFeedback(@Body() body: any) {
    return this.assetCenterService.submitFeedback(body);
  }

  @Post('feedback/process')
  async processFeedback(@Body() body: { feedbackId: string; action: 'accept' | 'reject'; resolution?: string }) {
    return this.assetCenterService.processFeedback(body.feedbackId, body.action, body.resolution);
  }

  // 备份
  @Post('backup/trigger')
  async triggerBackup() {
    return this.assetCenterService.performBackup();
  }

  @Post('reconciliation/trigger')
  async triggerReconciliation() {
    return this.assetCenterService.performReconciliation();
  }

  // 审计
  @Get('audit/logs')
  async getAuditLogs(@Query('userId') userId?: string, @Query('limit') limit?: string) {
    return this.assetCenterService.getAuditLogs(userId, limit ? parseInt(limit) : undefined);
  }
}
