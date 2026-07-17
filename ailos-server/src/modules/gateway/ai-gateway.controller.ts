import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { GatewayRequest } from './dto/gateway-request.dto';

@Controller('gateway')
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  /**
   * 通用AI生成请求（唯一入口）
   */
  @Post('generate')
  async generate(@Body() body: GatewayRequest) {
    return this.aiGatewayService.handleGenerateRequest(body);
  }

  /**
   * 查询成本状态
   */
  @Get('cost/status')
  async getCostStatus() {
    return this.aiGatewayService.getCostStatus();
  }
}
