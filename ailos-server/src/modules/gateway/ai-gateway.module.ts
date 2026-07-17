import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { RequestAdmissionService } from './request-admission.service';
import { CostCircuitBreakerService } from './cost-circuit-breaker.service';
import { CacheRetrievalService } from './cache-retrieval.service';
import { TemplateEngineService } from './template-engine.service';
import { ModelRouterService } from './model-router.service';
import { PromptInjectionService } from './prompt-injection.service';
import { ContentAuditService } from './content-audit.service';
import { FallbackService } from './fallback.service';
import { GatewayLoggerService } from './gateway-logger.service';
import { HunyuanAdapterService } from './hunyuan-adapter.service';

@Module({
  controllers: [AiGatewayController],
  providers: [
    HunyuanAdapterService,
    AiGatewayService,
    RequestAdmissionService,
    CostCircuitBreakerService,
    CacheRetrievalService,
    TemplateEngineService,
    ModelRouterService,
    PromptInjectionService,
    ContentAuditService,
    FallbackService,
    GatewayLoggerService,
  ],
  exports: [AiGatewayService, HunyuanAdapterService],
})
export class AiGatewayModule {}
