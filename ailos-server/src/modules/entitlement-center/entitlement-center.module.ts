import { Module } from '@nestjs/common';
import { EntitlementCenterService } from './entitlement-center.service';
import { EntitlementCenterController } from './entitlement-center.controller';

@Module({
  controllers: [EntitlementCenterController],
  providers: [EntitlementCenterService],
  exports: [EntitlementCenterService],
})
export class EntitlementCenterModule {}
