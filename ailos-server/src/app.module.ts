import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiGatewayModule } from './modules/gateway/ai-gateway.module';
import { AssetCenterModule } from './modules/asset-center/asset-center.module';
import { LearningEngineModule } from './modules/learning-engine/learning-engine.module';
import { CompanionEngineModule } from './modules/companion-engine/companion-engine.module';
import { EntitlementCenterModule } from './modules/entitlement-center/entitlement-center.module';
import { CommunityModule } from './modules/community/community.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { DeveloperCenterModule } from './modules/developer-center/developer-center.module';
import { AdminModule } from './modules/admin/admin.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { StateManagerModule } from './infrastructure/state-manager/state-manager.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    CacheModule,
    EventBusModule,
    AuthModule,
    LoggingModule,
    StateManagerModule,
    AiGatewayModule,
    AssetCenterModule,
    LearningEngineModule,
    CompanionEngineModule,
    EntitlementCenterModule,
    CommunityModule,
    MarketingModule,
    DeveloperCenterModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}