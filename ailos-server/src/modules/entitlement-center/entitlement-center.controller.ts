import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EntitlementCenterService } from './entitlement-center.service';

@Controller('entitlement')
export class EntitlementCenterController {
  constructor(private readonly entitlementCenterService: EntitlementCenterService) {}

  @Get('membership/:userId')
  async getMembership(@Param('userId') userId: string) {
    return this.entitlementCenterService.getUserMembership(userId);
  }

  @Get('quota/:userId')
  async getQuota(@Param('userId') userId: string) {
    return this.entitlementCenterService.getUserQuota(userId);
  }

  @Post('quota/consume')
  async consumeQuota(@Body() body: any) {
    return this.entitlementCenterService.consumeQuota(body);
  }

  @Post('membership/update')
  async updateMembership(@Body() body: any) {
    return this.entitlementCenterService.updateMembership(body);
  }

  @Get('feature/:userId/:feature')
  async checkFeature(@Param('userId') userId: string, @Param('feature') feature: string) {
    return { hasAccess: await this.entitlementCenterService.checkFeatureAccess(userId, feature) };
  }

  @Post('reset-daily')
  async resetDaily() {
    await this.entitlementCenterService.resetDailyQuotas();
    return { success: true };
  }
}
