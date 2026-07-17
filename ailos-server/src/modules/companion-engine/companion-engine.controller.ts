import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CompanionEngineService } from './companion-engine.service';

@Controller('companion')
export class CompanionEngineController {
  constructor(private readonly companionEngineService: CompanionEngineService) {}

  @Post('init')
  async initCompanion(@Body() body: { userId: string; customName?: string }) {
    return this.companionEngineService.initCompanion(body.userId, body.customName);
  }

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.companionEngineService.getCompanionProfile(userId);
  }

  @Post('chat')
  async chat(@Body() body: any) {
    return this.companionEngineService.chat(body);
  }

  @Post('persona/update')
  async updatePersona(@Body() body: { userId: string; traits: any }) {
    return this.companionEngineService.updatePersona(body.userId, body.traits);
  }

  @Get('memories/:userId')
  async getMemories(@Param('userId') userId: string, @Body() body: { query: string }) {
    return this.companionEngineService.getMemories(userId, body.query);
  }

  @Post('personality/evolve')
  async evolvePersonality(@Body() body: { userId: string }) {
    return this.companionEngineService.evolvePersonality(body.userId);
  }

  @Get('growth/:userId')
  async getGrowthLogs(@Param('userId') userId: string) {
    return this.companionEngineService.getGrowthLogs(userId);
  }

  @Get('emotion/:userId')
  async getEmotionHistory(@Param('userId') userId: string) {
    return this.companionEngineService.getEmotionHistory(userId);
  }
}
