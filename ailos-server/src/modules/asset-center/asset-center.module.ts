import { Module } from '@nestjs/common';
import { AssetCenterService } from './asset-center.service';
import { AssetCenterController } from './asset-center.controller';
import { UserAssetService } from './user-asset.service';
import { KnowledgeAssetService } from './knowledge-asset.service';
import { FeedbackService } from './feedback.service';
import { VersionCompatService } from './version-compat.service';
import { SyncService } from './sync.service';
import { BackupService } from './backup.service';

@Module({
  controllers: [AssetCenterController],
  providers: [
    AssetCenterService,
    UserAssetService,
    KnowledgeAssetService,
    FeedbackService,
    VersionCompatService,
    SyncService,
    BackupService,
  ],
  exports: [AssetCenterService],
})
export class AssetCenterModule {}
