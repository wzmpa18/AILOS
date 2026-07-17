import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { LearningEngineService } from './learning-engine.service';

@Controller('learning')
export class LearningEngineController {
  constructor(private readonly learningEngineService: LearningEngineService) {}

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.learningEngineService.getLearnerProfile(userId);
  }

  @Post('profile/init')
  async initProfile(@Body() body: { userId: string }) {
    return this.learningEngineService.initLearnerProfile(body.userId);
  }

  @Post('path/generate')
  async generatePath(@Body() body: { userId: string; domain: string }) {
    return this.learningEngineService.generateLearningPath(body.userId, body.domain);
  }

  @Get('content/next')
  async getNextContent(@Body() body: { userId: string; domain: string }) {
    return this.learningEngineService.getNextContent(body.userId, body.domain);
  }

  @Post('activity/submit')
  async submitActivity(@Body() body: any) {
    return this.learningEngineService.submitActivity(body);
  }

  @Post('assessment/start')
  async startAssessment(@Body() body: { userId: string; domain: string }) {
    return this.learningEngineService.startAssessment(body.userId, body.domain);
  }

  @Post('assessment/submit')
  async submitAssessment(@Body() body: { userId: string; domain: string; assessmentId: string; score: number }) {
    return this.learningEngineService.submitAssessment(body.userId, body.domain, body.assessmentId, body.score);
  }

  @Get('progress/:userId/:domain')
  async getProgress(@Param('userId') userId: string, @Param('domain') domain: string) {
    return this.learningEngineService.getProgress(userId, domain);
  }
}
