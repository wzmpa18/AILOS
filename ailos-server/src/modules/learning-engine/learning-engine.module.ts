import { Module } from '@nestjs/common';
import { LearningEngineService } from './learning-engine.service';
import { LearningEngineController } from './learning-engine.controller';

@Module({
  controllers: [LearningEngineController],
  providers: [LearningEngineService],
  exports: [LearningEngineService],
})
export class LearningEngineModule {}
