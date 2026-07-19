import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, CacheResult, SceneType } from './dto/gateway-request.dto';
import { CacheManager } from '../../infrastructure/cache/cache.service';
import { CacheEntry, CacheType, CacheSecurityLevel, CacheTier } from '../../infrastructure/cache/cache.types';

/**
 * 三级缓存检索模块
 * Step 4: L1本地缓存 → L2服务端缓存 → L3持久化缓存
 * Phase 1: 仅精确 Key 匹配（语义匹配为 Phase 2 能力）
 *
 * 缓存规则：
 * 1. 所有AI生成内容必须先查三级缓存
 * 2. 缓存命中为五级降级决策矩阵 Priority 1（¥0 成本）
 * 3. Phase 2: 语义级匹配，向量相似度≥0.92强制命中
 */
@Injectable()
export class CacheRetrievalService {
  private readonly logger = new Logger(CacheRetrievalService.name);
  private readonly SEMANTIC_THRESHOLD = 0.92;

  constructor(private readonly cacheManager: CacheManager) {}

  /**
   * Step 4: 三级缓存逐级检索
   * L1/L2/L3 统一通过 CacheManager 查询，不再维护独立 L1 缓存
   */
  async retrieve(request: GatewayRequest): Promise<CacheResult> {
    const cacheKey = this.buildCacheKey(request);

    // 统一通过 CacheManager 查询（L1→L2→L3 自动 fallback）
    const result = await this.cacheManager.get(cacheKey);
    if (result) {
      this.logger.debug(`[Cache] Hit: ${cacheKey}, tier=${result.metadata.scene}`);
      return {
        hit: true,
        content: result.value.content as string,
        cacheLevel: result.metadata.scene === 'L1' ? 1 : result.metadata.scene === 'L2' ? 2 : 3,
      };
    }

    // Phase 2: 语义匹配（当前返回 null）
    const semanticResult = await this.cacheManager.get(`semantic:${cacheKey}`);
    if (semanticResult) {
      this.logger.debug(`[Cache] Semantic hit: ${cacheKey}`);
      return {
        hit: true,
        content: semanticResult.value.content as string,
        semanticScore: this.SEMANTIC_THRESHOLD,
        cacheLevel: 2,
      };
    }

    this.logger.debug(`[Cache] Miss: ${cacheKey}`);
    return { hit: false };
  }

  /**
   * 回写L2缓存
   */
  async writeL2Cache(
    key: string,
    content: string,
    request: GatewayRequest,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const ttl = this.getL2TTL(request.scene);
    const cacheKey = this.buildCacheKey(request);
    const entry: CacheEntry = {
      id: `l2:${cacheKey}:${Date.now()}`,
      cacheKey: `cache:l2:${cacheKey}`,
      namespace: this.mapSceneToNamespace(request.scene),
      schemaVersion: 1,
      cacheType: CacheType.GENERATED_RESULT,
      securityLevel: CacheSecurityLevel.RESTRICTED,
      sourceModule: 'ai-gateway',
      dataScope: request.userId ? 'personal' : 'platform',
      userId: request.userId,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      value: { content, ...metadata },
      metadata: {
        scene: request.scene,
        domain: request.domain || 'default',
        assetId: metadata?.assetId as string,
        tokenEstimate: metadata?.tokenEstimate as number,
      },
    };

    await this.cacheManager.set(`cache:l2:${cacheKey}`, entry, { tiers: [CacheTier.L1, CacheTier.L2] });
  }

  /**
   * 写入L3持久化缓存
   */
  async writeL3Cache(
    key: string,
    content: string,
    metadata: Record<string, unknown>,
    request: GatewayRequest,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(request);
    const entry: CacheEntry = {
      id: `l3:${cacheKey}:${Date.now()}`,
      cacheKey: `cache:l3:${cacheKey}`,
      namespace: this.mapSceneToNamespace(request.scene),
      schemaVersion: 1,
      cacheType: metadata.cacheType === 'immutable' ? CacheType.IMMUTABLE_ASSET : CacheType.GENERATED_RESULT,
      securityLevel: CacheSecurityLevel.PUBLIC,
      sourceModule: 'ai-gateway',
      dataScope: request.userId ? 'personal' : 'platform',
      userId: request.userId,
      accessCount: 0,
      createdAt: new Date().toISOString(),
      value: { content, ...metadata },
      metadata: {
        scene: request.scene,
        domain: request.domain || 'default',
        assetId: metadata.assetId as string,
        tokenEstimate: metadata.tokenEstimate as number,
      },
    };

    await this.cacheManager.set(`cache:l3:${cacheKey}`, entry, { tiers: [CacheTier.L3] });
  }

  /**
   * 构建缓存键
   */
  private buildCacheKey(request: GatewayRequest): string {
    const params = JSON.stringify(request.structuredParams);
    const hash = this.simpleHash(`${request.scene}:${request.domain}:${params}`);
    return `${request.scene}:${request.domain}:${hash}`;
  }

  /**
   * 场景到命名空间映射
   */
  private mapSceneToNamespace(scene: SceneType): string {
    const mapping: Partial<Record<SceneType, string>> = {
      [SceneType.TRANSLATION]: 'ai.translation.text',
      [SceneType.EXPLANATION]: 'ai.explanation.concept',
      [SceneType.ENCOURAGEMENT]: 'ai.partner.response',
      [SceneType.EXERCISE_GENERATION]: 'learning.exercise.generate',
      [SceneType.ERROR_CORRECTION]: 'ai.partner.response',
      [SceneType.COURSE_GENERATION]: 'learning.lesson.generate',
      [SceneType.ASSESSMENT]: 'learning.assessment.evaluate',
      [SceneType.CHAT]: 'ai.partner.response',
      [SceneType.STORYTELLING]: 'content.story.generate',
    };
    return mapping[scene] || 'ai.partner.response';
  }

  /**
   * 获取L2缓存TTL（按场景）
   */
  private getL2TTL(scene: SceneType): number {
    const ttls: Partial<Record<SceneType, number>> = {
      [SceneType.TRANSLATION]: 86400,
      [SceneType.EXPLANATION]: 86400,
      [SceneType.ENCOURAGEMENT]: 3600,
      [SceneType.EXERCISE_GENERATION]: 43200,
      [SceneType.ERROR_CORRECTION]: 3600,
      [SceneType.COURSE_GENERATION]: 86400,
      [SceneType.ASSESSMENT]: 3600,
      [SceneType.CHAT]: 3600,
      [SceneType.STORYTELLING]: 86400,
    };
    return ttls[scene] || 3600;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 主动失效缓存
   */
  async invalidateCache(key: string): Promise<void> {
    await this.cacheManager.invalidate(`cache:l2:${key}`);
    await this.cacheManager.invalidate(`cache:l3:${key}`);
    this.logger.log(`[Cache] Invalidated: ${key}`);
  }
}