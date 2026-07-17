import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, SceneType } from './dto/gateway-request.dto';
import { AuthService } from '../../infrastructure/auth/auth.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 请求接入模块
 * Step 1-2: 统一接收 → 身份鉴权 → 权限校验 → 参数标准化
 */
@Injectable()
export class RequestAdmissionService {
  private readonly logger = new Logger(RequestAdmissionService.name);

  // 场景复杂度映射（用于后续模型路由）
  private readonly SCENE_COMPLEXITY: Record<SceneType, 'low' | 'medium' | 'high'> = {
    [SceneType.TRANSLATION]: 'low',
    [SceneType.EXPLANATION]: 'low',
    [SceneType.ENCOURAGEMENT]: 'low',
    [SceneType.EXERCISE_GENERATION]: 'medium',
    [SceneType.ERROR_CORRECTION]: 'medium',
    [SceneType.COURSE_GENERATION]: 'high',
    [SceneType.ASSESSMENT]: 'high',
    [SceneType.CHAT]: 'high',
    [SceneType.STORYTELLING]: 'high',
  };

  // 场景成本等级（决定后续降级策略）
  private readonly SCENE_COST_LEVEL: Record<SceneType, number> = {
    [SceneType.TRANSLATION]: 1,
    [SceneType.EXPLANATION]: 1,
    [SceneType.ENCOURAGEMENT]: 1,
    [SceneType.EXERCISE_GENERATION]: 2,
    [SceneType.ERROR_CORRECTION]: 2,
    [SceneType.COURSE_GENERATION]: 3,
    [SceneType.ASSESSMENT]: 3,
    [SceneType.CHAT]: 3,
    [SceneType.STORYTELLING]: 3,
  };

  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1-2: 接收请求并完成准入校验
   */
  async admit(
    request: GatewayRequest,
  ): Promise<{ valid: boolean; error?: string; normalizedRequest?: GatewayRequest }> {
    const callId = uuidv4();

    // 1. 参数校验
    if (!request.module || !request.scene || !request.structuredParams) {
      return { valid: false, error: 'Missing required fields: module, scene, structuredParams' };
    }

    if (!Object.values(SceneType).includes(request.scene)) {
      return { valid: false, error: `Invalid scene: ${request.scene}` };
    }

    // 2. 身份鉴权
    if (request.userId) {
      const authResult = await this.authService.validateUser(request.userId);
      if (!authResult.valid) {
        return { valid: false, error: `Authentication failed: ${authResult.reason}` };
      }
    }

    // 3. 参数标准化
    const normalized: GatewayRequest = {
      module: request.module,
      scene: request.scene,
      userId: request.userId,
      domain: request.domain || 'general',
      structuredParams: {
        language: 'zh-CN',
        ...request.structuredParams,
      },
      options: {
        skipCache: false,
        priority: 3,
        maxTokens: this.getDefaultMaxTokens(request.scene),
        ...request.options,
      },
    };

    this.logger.log(`[Admission] Request admitted: callId=${callId}, module=${request.module}, scene=${request.scene}`);

    return { valid: true, normalizedRequest: { ...normalized, callId: callId } };
  }

  getSceneComplexity(scene: SceneType): 'low' | 'medium' | 'high' {
    return this.SCENE_COMPLEXITY[scene] || 'medium';
  }

  getSceneCostLevel(scene: SceneType): number {
    return this.SCENE_COST_LEVEL[scene] || 1;
  }

  private getDefaultMaxTokens(scene: SceneType): number {
    const defaults: Partial<Record<SceneType, number>> = {
      [SceneType.TRANSLATION]: 512,
      [SceneType.ENCOURAGEMENT]: 256,
      [SceneType.EXPLANATION]: 1024,
      [SceneType.EXERCISE_GENERATION]: 2048,
      [SceneType.ERROR_CORRECTION]: 1024,
      [SceneType.COURSE_GENERATION]: 4096,
      [SceneType.ASSESSMENT]: 4096,
      [SceneType.CHAT]: 2048,
      [SceneType.STORYTELLING]: 4096,
    };
    return defaults[scene] || 2048;
  }
}
