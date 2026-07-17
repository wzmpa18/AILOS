import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('module/switch')
  async setModuleSwitch(@Body() body: { moduleName: string; enabled: boolean; operator: string }) {
    return this.adminService.setModuleSwitch(body.moduleName, body.enabled, body.operator);
  }

  @Get('module/switches')
  async getModuleSwitches() {
    return this.adminService.getModuleSwitches();
  }

  @Post('config')
  async setConfig(@Body() body: { key: string; value: string; operator: string }) {
    return this.adminService.setSystemConfig(body.key, body.value, body.operator);
  }

  @Get('config')
  async getConfig(@Query('key') key?: string) {
    return this.adminService.getSystemConfig(key);
  }

  @Get('audit/logs')
  async getAuditLogs(@Query('operator') operator?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs(operator, limit ? parseInt(limit) : 100);
  }

  @Post('user/freeze')
  async freezeUser(@Body() body: { userId: string; operator: string; reason: string }) {
    return this.adminService.freezeUser(body.userId, body.operator, body.reason);
  }

  @Get('cost/dashboard')
  async getCostDashboard() {
    return this.adminService.getCostDashboard();
  }

  @Post('grayscale')
  async setGrayscale(@Body() body: { moduleName: string; rate: number; operator: string }) {
    return this.adminService.setGrayscale(body.moduleName, body.rate, body.operator);
  }

  @Post('content/approve')
  async approveContent(@Body() body: { contentId: string; operator: string }) {
    return this.adminService.approveContent(body.contentId, body.operator);
  }
}
