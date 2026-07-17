import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('growth')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post('invite/generate')
  async generateInviteCode(@Body() body: { userId: string }) {
    return { code: await this.marketingService.generateInviteCode(body.userId) };
  }

  @Post('invite/bind')
  async bindInvite(@Body() body: { userId: string; inviteCode: string }) {
    return this.marketingService.bindInviteRelation(body.userId, body.inviteCode);
  }

  @Post('commission/calculate')
  async calculateCommission(@Body() body: { orderId: string; userId: string; amount: number }) {
    return this.marketingService.calculateCommission(body.orderId, body.userId, body.amount);
  }

  @Get('commission/:userId')
  async getCommission(@Param('userId') userId: string) {
    return this.marketingService.getCommissionRecords(userId);
  }

  @Post('checkin')
  async checkin(@Body() body: { userId: string }) {
    return this.marketingService.dailyCheckin(body.userId);
  }

  @Get('points/:userId')
  async getPoints(@Param('userId') userId: string) {
    return { points: await this.marketingService.getUserPoints(userId) };
  }

  @Post('withdrawal/request')
  async requestWithdrawal(@Body() body: { userId: string; amount: number }) {
    return this.marketingService.requestWithdrawal(body.userId, body.amount);
  }
}
