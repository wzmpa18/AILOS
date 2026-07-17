import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, SceneType, DegradationLevel } from './dto/gateway-request.dto';
import { ConfigService } from '../../config/config.service';

/**
 * 模型路由模块
 * Step 6: 按场景+用户权益匹配成本最优模型
 * 当前生产：腾讯混元 hunyuan-turbo（OpenAI兼容协议）
 * 架构预留多Provider扩展位
 *
 * 绝对禁区：禁止硬编码API密钥，禁止业务模块私自指定模型
 */
@Injectable()
export class ModelRouterService {
  private readonly logger = new Logger(ModelRouterService.name);

  // 场景 → 模型型号映射
  private readonly SCENE_MODEL_MAP: Record<SceneType, string> = {
    [SceneType.TRANSLATION]: 'hunyuan-turbo',
    [SceneType.EXPLANATION]: 'hunyuan-turbo',
    [SceneType.ENCOURAGEMENT]: 'hunyuan-turbo',
    [SceneType.EXERCISE_GENERATION]: 'hunyuan-turbo',
    [SceneType.ERROR_CORRECTION]: 'hunyuan-turbo',
    [SceneType.COURSE_GENERATION]: 'hunyuan-turbo',
    [SceneType.ASSESSMENT]: 'hunyuan-turbo',
    [SceneType.CHAT]: 'hunyuan-turbo',
    [SceneType.STORYTELLING]: 'hunyuan-turbo',
  };

  // Provider 扩展位
  private providers: Map<string, ModelProvider> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.registerDefaultProviders();
  }

  /**
   * 注册默认 Provider（腾讯混元）
   * 密钥仅通过 ConfigService 从 .env.local 读取
   */
  private registerDefaultProviders(): void {
    const hunyuan = this.configService.getHunyuanConfig();

    this.providers.set('hunyuan', {
      name: 'tencent-hunyuan',
      models: {
        'hunyuan-turbo': {
          modelId: hunyuan.activeModel,
          costPer1kInput: 0.0003,
          costPer1kOutput: 0.0006,
          maxTokens: 32768,
        },
      },
      apiEndpoint: hunyuan.apiEndpoint,
      apiKey: hunyuan.apiKey,
    });
  }

  /**
   * Step 6: 选择模型
   */
  selectModel(
    request: GatewayRequest,
    degradationLevel: DegradationLevel,
  ): {
    provider: string;
    modelId: string;
    costPer1kInput: number;
    costPer1kOutput: number;
    endpoint: string;
    apiKey: string;
  } | null {
    let modelName: string;

    if (degradationLevel === DegradationLevel.LIGHTWEIGHT_MODEL) {
      modelName = 'hunyuan-turbo';
    } else if (degradationLevel === DegradationLevel.HIGH_PERFORMANCE_MODEL) {
      modelName = this.SCENE_MODEL_MAP[request.scene] || 'hunyuan-turbo';
    } else {
      return null; // 缓存或模板命中，不需要模型
    }

    const provider = this.providers.get('hunyuan');
    if (!provider || !provider.models[modelName]) {
      this.logger.error(`[ModelRouter] Model not found: ${modelName}`);
      return null;
    }

    const model = provider.models[modelName];
    const maskedKey = this.configService.maskApiKey(provider.apiKey);

    this.logger.log(
      `[ModelRouter] Selected: ${provider.name}/${modelName} | endpoint=${provider.apiEndpoint} | key=${maskedKey}`,
    );

    return {
      provider: provider.name,
      modelId: model.modelId,
      costPer1kInput: model.costPer1kInput,
      costPer1kOutput: model.costPer1kOutput,
      endpoint: provider.apiEndpoint,
      apiKey: provider.apiKey,
    };
  }

  /**
   * 注册新 Provider（扩展位）
   */
  registerProvider(key: string, provider: ModelProvider): void {
    this.providers.set(key, provider);
    this.logger.log(`[ModelRouter] Registered new provider: ${provider.name}`);
  }

  /**
   * 获取所有 Provider 列表
   */
  getProviders(): { key: string; name: string; models: string[] }[] {
    return Array.from(this.providers.entries()).map(([key, p]) => ({
      key,
      name: p.name,
      models: Object.keys(p.models),
    }));
  }
}

interface ModelProvider {
  name: string;
  models: Record<string, ModelConfig>;
  apiEndpoint: string;
  apiKey: string;
}

interface ModelConfig {
  modelId: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  maxTokens: number;
}
