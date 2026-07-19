import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  GatewayRequest,
  GatewayResponse,
  DegradationLevel,
  CostCheckResult,
  CacheResult,
  AuditResult,
} from './dto/gateway-request.dto';
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
import { ConfigService } from '../../config/config.service';

/**
 * AI Gateway 主服务 — 12步标准流程编排
 * 软件架构蓝图 v2.0.0 强制执行
 *
 * 12步流程：
 * 1. Admission (请求接入)    2. Auth (鉴权)
 * 3. Cost Check (成本判断)   4. Cache Retrieval (缓存检索)
 * 5. Template (模板化)       6. Model Route (模型路由)
 * 7. Prompt Injection + Model Call
 * 8. Content Audit (内容审核) 9. Cache Writeback (缓存回写)
 * 10. Cost Sync (成本同步)   11. Logging (日志归档)
 * 12. Response (标准化返回)
 *
 * 绝对禁区：任何模块不得绕过Gateway直接调用模型
 */
@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly admissionService: RequestAdmissionService,
    private readonly costBreaker: CostCircuitBreakerService,
    private readonly cacheRetrieval: CacheRetrievalService,
    private readonly templateEngine: TemplateEngineService,
    private readonly modelRouter: ModelRouterService,
    private readonly promptInjection: PromptInjectionService,
    private readonly contentAudit: ContentAuditService,
    private readonly fallback: FallbackService,
    private readonly gatewayLogger: GatewayLoggerService,
    private readonly hunyuanAdapter: HunyuanAdapterService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 通用AI生成请求（唯一入口）
   * Controller 调用此方法
   */
  async handleGenerateRequest(request: GatewayRequest): Promise<GatewayResponse> {
    return this.processRequest(request);
  }

  /**
   * 12步标准流程
   */
  private async processRequest(request: GatewayRequest): Promise<GatewayResponse> {
    const callId = request.callId || uuidv4();
    const startTime = Date.now();
    let degradationLevel = DegradationLevel.CACHE_HIT;
    let cacheHit = false;
    let auditPassed = true;
    let modelUsed: string | undefined;
    let inputTokens = 0;
    let outputTokens = 0;
    let cost = 0;
    let content = '';

    try {
      // ===== Step 1-2: 请求接入 + 鉴权 =====
      const admissionResult = await this.admissionService.admit(request);
      if (!admissionResult.valid || !admissionResult.normalizedRequest) {
        degradationLevel = DegradationLevel.FALLBACK;
        content = this.fallback.getFallback(request.scene, admissionResult.error || 'Admission failed').content;
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, false, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          false,
          undefined,
          0,
          0,
          0,
        );
      }
      const normalizedRequest = admissionResult.normalizedRequest;
      this.logger.log(
        `[Gateway] Step 1-2: Admitted | callId=${callId} | scene=${normalizedRequest.scene} | module=${normalizedRequest.module}`,
      );

      // ===== Step 3: 成本判断（三级熔断） =====
      const userLevel = (request as any).userLevel || 'free';
      const costCheck: CostCheckResult = await this.costBreaker.check(normalizedRequest, userLevel);
      if (!costCheck.allowed) {
        degradationLevel = costCheck.degradationLevel || DegradationLevel.FALLBACK;
        this.logger.warn(`[Gateway] Step 3: Cost blocked | callId=${callId} | reason=${costCheck.reason}`);
        content = this.fallback.getFallback(request.scene, costCheck.reason || 'Budget exceeded').content;
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, false, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          false,
          undefined,
          0,
          0,
          0,
        );
      }

      // ===== Step 4: 三级缓存检索 =====
      const cacheResult: CacheResult = await this.cacheRetrieval.retrieve(normalizedRequest);
      if (cacheResult.hit) {
        cacheHit = true;
        degradationLevel = DegradationLevel.CACHE_HIT;
        content = cacheResult.content || '';
        this.logger.log(
          `[Gateway] Step 4: Cache HIT | callId=${callId} | level=${cacheResult.cacheLevel} | score=${cacheResult.semanticScore}`,
        );
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, true, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          true,
          undefined,
          0,
          0,
          0,
        );
      }

      // ===== Step 5: 模板化判断 =====
      const templateContent = this.templateEngine.tryGenerate(normalizedRequest);
      if (templateContent !== null) {
        degradationLevel = DegradationLevel.TEMPLATE;
        content = templateContent;
        this.logger.log(`[Gateway] Step 5: Template matched | callId=${callId}`);
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, true, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          true,
          undefined,
          0,
          0,
          0,
        );
      }

      // ===== Step 6: 模型路由 =====
      degradationLevel = DegradationLevel.HIGH_PERFORMANCE_MODEL;
      const modelSelection = this.modelRouter.selectModel(normalizedRequest, degradationLevel);
      if (!modelSelection) {
        degradationLevel = DegradationLevel.FALLBACK;
        content = this.fallback.getFallback(request.scene, 'No model available').content;
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, false, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          false,
          undefined,
          0,
          0,
          0,
        );
      }
      modelUsed = modelSelection.modelId;

      // ===== Step 7: Prompt注入 + 调用模型（真实混元API） =====
      const assembledPrompt = this.promptInjection.assemble(normalizedRequest);
      if (!assembledPrompt) {
        degradationLevel = DegradationLevel.FALLBACK;
        content = this.fallback.getFallback(request.scene, 'Prompt assembly failed').content;
        await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, false, undefined, 0, 0, 0);
        return this.buildResponse(
          callId,
          request,
          content,
          degradationLevel,
          startTime,
          cacheHit,
          false,
          undefined,
          0,
          0,
          0,
        );
      }

      const modelResult = await this.callModel(
        modelSelection.endpoint,
        modelSelection.apiKey,
        modelSelection.modelId,
        assembledPrompt,
        normalizedRequest.options?.maxTokens || 2048,
      );

      if (!modelResult.success) {
        // 重试一次
        const retryResult = await this.callModel(
          modelSelection.endpoint,
          modelSelection.apiKey,
          modelSelection.modelId,
          assembledPrompt,
          normalizedRequest.options?.maxTokens || 2048,
        );
        if (!retryResult.success) {
          degradationLevel = DegradationLevel.FALLBACK;
          content = this.fallback.getFallback(request.scene, `Model call failed: ${modelResult.error}`).content;
          await this.logCall(
            callId,
            request,
            content,
            degradationLevel,
            startTime,
            cacheHit,
            false,
            modelUsed,
            inputTokens,
            outputTokens,
            cost,
          );
          return this.buildResponse(
            callId,
            request,
            content,
            degradationLevel,
            startTime,
            cacheHit,
            false,
            modelUsed,
            inputTokens,
            outputTokens,
            cost,
          );
        }
        content = retryResult.content!;
        inputTokens = retryResult.inputTokens || 0;
        outputTokens = retryResult.outputTokens || 0;
      } else {
        content = modelResult.content!;
        inputTokens = modelResult.inputTokens || 0;
        outputTokens = modelResult.outputTokens || 0;
      }

      // 计算成本
      cost =
        (inputTokens / 1000) * modelSelection.costPer1kInput + (outputTokens / 1000) * modelSelection.costPer1kOutput;

      // ===== Step 8: 三层内容审核 =====
      const auditResult: AuditResult = await this.contentAudit.audit(content, {
        scene: normalizedRequest.scene,
        domain: normalizedRequest.domain,
      });
      if (!auditResult.passed) {
        auditPassed = false;
        this.logger.warn(`[Gateway] Step 8: Audit FAILED | callId=${callId} | reason=${auditResult.rejectionReason}`);
        // 重试审核
        const retryAudit = await this.contentAudit.audit(content, {
          scene: normalizedRequest.scene,
          domain: normalizedRequest.domain,
        });
        if (!retryAudit.passed) {
          degradationLevel = DegradationLevel.FALLBACK;
          content = this.fallback.getFallback(request.scene, 'Content audit failed').content;
          await this.logCall(
            callId,
            request,
            content,
            degradationLevel,
            startTime,
            cacheHit,
            false,
            modelUsed,
            inputTokens,
            outputTokens,
            cost,
          );
          return this.buildResponse(
            callId,
            request,
            content,
            degradationLevel,
            startTime,
            cacheHit,
            false,
            modelUsed,
            inputTokens,
            outputTokens,
            cost,
          );
        }
      }

      // ===== Step 9: 回写L3缓存 =====
      const cacheKey = `${normalizedRequest.scene}:${normalizedRequest.domain || 'default'}:${this.hashParams(normalizedRequest.structuredParams)}`;
      await this.cacheRetrieval.writeL3Cache(cacheKey, content, {
        scene: normalizedRequest.scene,
        domain: normalizedRequest.domain,
      }, normalizedRequest);

      // ===== Step 10: 成本同步 =====
      await this.costBreaker.recordCost(callId, request.module, request.userId, cost);

      // ===== Step 11: 日志归档 =====
      await this.logCall(
        callId,
        request,
        content,
        degradationLevel,
        startTime,
        cacheHit,
        auditPassed,
        modelUsed,
        inputTokens,
        outputTokens,
        cost,
      );

      // ===== Step 12: 标准化返回 =====
      return this.buildResponse(
        callId,
        request,
        content,
        degradationLevel,
        startTime,
        cacheHit,
        auditPassed,
        modelUsed,
        inputTokens,
        outputTokens,
        cost,
      );
    } catch (error: any) {
      this.logger.error(`[Gateway] Exception | callId=${callId} | error=${error.message} | stack=${error.stack}`);
      degradationLevel = DegradationLevel.FALLBACK;
      content = this.fallback.getFallback(request.scene, error.message).content;
      await this.logCall(callId, request, content, degradationLevel, startTime, cacheHit, false, undefined, 0, 0, 0);
      return this.buildResponse(
        callId,
        request,
        content,
        degradationLevel,
        startTime,
        cacheHit,
        false,
        undefined,
        0,
        0,
        0,
      );
    }
  }

  /**
   * 调用混元模型（真实API接入）
   * 通过 HunyuanAdapterService 统一调用腾讯混元
   * 支持 OpenAI 兼容 Chat Completions 协议
   * 密钥仅通过适配器从环境变量读取
   */
  private async callModel(
    endpoint: string,
    apiKey: string,
    modelId: string,
    prompt: string,
    maxTokens: number,
  ): Promise<{ success: boolean; content?: string; inputTokens?: number; outputTokens?: number; error?: string }> {
    const maskedKey = this.configService.maskApiKey(apiKey);
    this.logger.log(`[Gateway] Calling model: ${modelId} | endpoint=${endpoint} | key=${maskedKey}`);

    const messages = [{ role: 'user', content: prompt }];

    const result = await this.hunyuanAdapter.chatCompletions(messages, {
      temperature: 0.7,
      maxTokens,
    });

    if (!result.success) {
      this.logger.error(`[Gateway] Model call failed: ${result.error}`);
      return { success: false, error: result.error };
    }

    this.logger.log(
      `[Gateway] Model response received | tokens_in=${result.usage?.promptTokens || 0} | tokens_out=${result.usage?.completionTokens || 0} | latency=${result.latencyMs}ms`,
    );

    return {
      success: true,
      content: result.content || '',
      inputTokens: result.usage?.promptTokens || 0,
      outputTokens: result.usage?.completionTokens || 0,
    };
  }

  /**
   * 构建标准响应
   */
  private buildResponse(
    callId: string,
    request: GatewayRequest,
    content: string,
    degradationLevel: DegradationLevel,
    startTime: number,
    cacheHit: boolean,
    auditPassed: boolean,
    modelUsed?: string,
    inputTokens = 0,
    outputTokens = 0,
    cost = 0,
  ): GatewayResponse {
    return {
      callId,
      content,
      aiGenerated: degradationLevel >= DegradationLevel.LIGHTWEIGHT_MODEL,
      degradationLevel,
      modelUsed,
      cost,
      durationMs: Date.now() - startTime,
      cacheHit,
      auditPassed,
      metadata: {
        inputTokens,
        outputTokens,
        promptVersion: '2.0.0',
        scene: request.scene,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * 日志归档
   */
  private async logCall(
    callId: string,
    request: GatewayRequest,
    content: string,
    degradationLevel: DegradationLevel,
    startTime: number,
    cacheHit: boolean,
    auditPassed: boolean,
    modelUsed?: string,
    inputTokens = 0,
    outputTokens = 0,
    cost = 0,
  ): Promise<void> {
    await this.gatewayLogger.logCall({
      callId,
      module: request.module,
      scene: request.scene,
      userId: request.userId,
      modelName: modelUsed,
      inputTokens,
      outputTokens,
      cost,
      durationMs: Date.now() - startTime,
      cacheHit,
      degradationLevel,
      auditPassed,
      timestamp: Date.now(),
    });
  }

  /**
   * 参数哈希（用于缓存键）
   */
  private hashParams(params: Record<string, any>): string {
    const str = JSON.stringify(params, Object.keys(params).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 获取成本状态
   */
  async getCostStatus() {
    const config = this.costBreaker.getConfig();
    const stats = this.gatewayLogger.getCostStats();
    return { config, stats };
  }
}
