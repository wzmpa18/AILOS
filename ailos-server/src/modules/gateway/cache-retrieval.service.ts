import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, CacheResult, SceneType } from './dto/gateway-request.dto';
import { CacheService } from '../../infrastructure/cache/cache.service';

/**
 * 三级缓存检索模块
 * Step 4: L1本地缓存 → L2服务端缓存 → L3持久化缓存
 * 语义向量匹配，相似度 ≥ 0.92 强制命中
 *
 * 缓存规则：
 * 1. 所有AI生成内容必须先查三级缓存
 * 2. 语义级匹配：向量相似度≥0.92强制命中
 * 3. 同一语义请求24h内重复调用且未命中缓存为二级违规
 */
@Injectable()
export class CacheRetrievalService {
  private readonly logger = new Logger(CacheRetrievalService.name);
  private readonly SEMANTIC_THRESHOLD = 0.92;

  // L1 本地内存缓存 (TTL: 15min)
  private l1Cache: Map<string, { data: string; expiresAt: number }> = new Map();

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Step 4: 三级缓存逐级检索
   */
  async retrieve(request: GatewayRequest): Promise<CacheResult> {
    const cacheKey = this.buildCacheKey(request);

    // Level 1: 本地内存缓存
    const l1Result = await this.checkL1Cache(cacheKey);
    if (l1Result.hit) {
      this.logger.debug(`[Cache] L1 hit: ${cacheKey}`);
      return { hit: true, content: l1Result.content, cacheLevel: 1 };
    }

    // Level 2: Redis 服务端缓存
    const l2Result = await this.checkL2Cache(cacheKey, request);
    if (l2Result.hit) {
      this.logger.debug(`[Cache] L2 hit: ${cacheKey}, semanticScore=${l2Result.semanticScore}`);
      // 回写L1
      await this.writeL1Cache(cacheKey, l2Result.content!);
      return { hit: true, content: l2Result.content, semanticScore: l2Result.semanticScore, cacheLevel: 2 };
    }

    // Level 3: 数据库持久化缓存
    const l3Result = await this.checkL3Cache(cacheKey, request);
    if (l3Result.hit) {
      this.logger.debug(`[Cache] L3 hit: ${cacheKey}`);
      // 回写L1+L2
      await this.writeL1Cache(cacheKey, l3Result.content!);
      await this.writeL2Cache(cacheKey, l3Result.content!, request);
      return { hit: true, content: l3Result.content, cacheLevel: 3 };
    }

    this.logger.debug(`[Cache] Miss: ${cacheKey}`);
    return { hit: false };
  }

  /**
   * L1 本地内存缓存
   */
  private async checkL1Cache(key: string): Promise<{ hit: boolean; content?: string }> {
    const entry = this.l1Cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return { hit: true, content: entry.data };
    }
    if (entry) {
      this.l1Cache.delete(key); // 过期清理
    }
    return { hit: false };
  }

  /**
   * L2 Redis 服务端缓存 + 语义匹配
   */
  private async checkL2Cache(
    key: string,
    request: GatewayRequest,
  ): Promise<{ hit: boolean; content?: string; semanticScore?: number }> {
    // 精确匹配
    const exactMatch = await this.cacheService.get(`cache:l2:exact:${key}`);
    if (exactMatch) {
      const data = JSON.parse(exactMatch);
      if (data.expiresAt > Date.now()) {
        return { hit: true, content: data.content, semanticScore: 1.0 };
      }
    }

    // 语义匹配
    const vectorKey = this.buildVectorKey(request);
    const semanticResult = await this.cacheService.semanticMatch(vectorKey, this.SEMANTIC_THRESHOLD);
    if (semanticResult) {
      return {
        hit: true,
        content: semanticResult.content,
        semanticScore: semanticResult.score,
      };
    }

    return { hit: false };
  }

  /**
   * L3 数据库持久化缓存
   */
  private async checkL3Cache(key: string, request: GatewayRequest): Promise<{ hit: boolean; content?: string }> {
    const result = await this.cacheService.get(`cache:l3:${key}`);
    if (result) {
      const data = JSON.parse(result);
      return { hit: true, content: data.content };
    }
    return { hit: false };
  }

  /**
   * 回写L1缓存
   */
  private async writeL1Cache(key: string, content: string): Promise<void> {
    this.l1Cache.set(key, {
      data: content,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15min
    });

    // LRU 淘汰（超过1000条清理最旧的一半）
    if (this.l1Cache.size > 1000) {
      const entries = Array.from(this.l1Cache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (let i = 0; i < 500; i++) {
        this.l1Cache.delete(entries[i][0]);
      }
      this.logger.debug('[Cache] L1 LRU eviction: removed 500 entries');
    }
  }

  /**
   * 回写L2缓存
   */
  private async writeL2Cache(key: string, content: string, request: GatewayRequest): Promise<void> {
    const ttl = this.getL2TTL(request.scene);
    const data = JSON.stringify({
      content,
      expiresAt: Date.now() + ttl * 1000,
      createdAt: Date.now(),
    });
    await this.cacheService.set(`cache:l2:exact:${key}`, data, ttl);
  }

  /**
   * 写入L3持久化缓存
   */
  async writeL3Cache(key: string, content: string, metadata: any): Promise<void> {
    const data = JSON.stringify({
      content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await this.cacheService.set(`cache:l3:${key}`, data, 0); // 0 = 永久
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
   * 构建语义向量键
   */
  private buildVectorKey(request: GatewayRequest): string {
    return `${request.scene}:${request.domain}:${JSON.stringify(request.structuredParams)}`;
  }

  /**
   * 获取L2缓存TTL（按场景）
   */
  private getL2TTL(scene: SceneType): number {
    const ttls: Partial<Record<SceneType, number>> = {
      [SceneType.TRANSLATION]: 86400, // 24h
      [SceneType.EXPLANATION]: 86400, // 24h
      [SceneType.ENCOURAGEMENT]: 3600, // 1h
      [SceneType.EXERCISE_GENERATION]: 43200, // 12h
      [SceneType.ERROR_CORRECTION]: 3600, // 1h
      [SceneType.COURSE_GENERATION]: 86400, // 24h
      [SceneType.ASSESSMENT]: 3600, // 1h
      [SceneType.CHAT]: 3600, // 1h
      [SceneType.STORYTELLING]: 86400, // 24h
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
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 主动失效缓存
   */
  async invalidateCache(key: string): Promise<void> {
    this.l1Cache.delete(key);
    await this.cacheService.invalidate(`cache:l2:exact:${key}`);
    await this.cacheService.invalidate(`cache:l3:${key}`);
    this.logger.log(`[Cache] Invalidated: ${key}`);
  }
}
