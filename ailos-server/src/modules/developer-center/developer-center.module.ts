import { Module } from '@nestjs/common';
import { DeveloperCenterService } from './developer-center.service';
import { DeveloperCenterController } from './developer-center.controller';

@Module({
  controllers: [DeveloperCenterController],
  providers: [DeveloperCenterService],
  exports: [DeveloperCenterService],
})
export class DeveloperCenterModule {}
