import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DeveloperCenterService } from './developer-center.service';

@Controller('developer')
export class DeveloperCenterController {
  constructor(private readonly developerCenterService: DeveloperCenterService) {}

  @Post('apikey/generate')
  async generateApiKey(@Body() body: { developerId: string; name: string }) {
    return this.developerCenterService.generateApiKey(body.developerId, body.name);
  }

  @Get('apikey/:developerId')
  async listApiKeys(@Param('developerId') developerId: string) {
    return this.developerCenterService.listApiKeys(developerId);
  }

  @Post('plugin/register')
  async registerPlugin(@Body() body: any) {
    return this.developerCenterService.registerPlugin(body);
  }
}
