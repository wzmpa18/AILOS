import { Module } from '@nestjs/common';
import { CompanionEngineService } from './companion-engine.service';
import { CompanionEngineController } from './companion-engine.controller';

@Module({
  controllers: [CompanionEngineController],
  providers: [CompanionEngineService],
  exports: [CompanionEngineService],
})
export class CompanionEngineModule {}
