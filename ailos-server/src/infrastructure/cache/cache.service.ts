import { Injectable, Logger } from '@nestjs/common';

/**
 * 三级缓存服务
 * L1: 本地内存缓存 (15min TTL)
 * L2: Redis 服务端缓存 (1-24h TTL)
 * L3: 数据库/文件持久化缓存 (永久)
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // 内存缓存（L1 本地模拟）
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) {
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, value: string, ttlSeconds: number = 0): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  /**
   * 语义匹配检索
   * 通过向量相似度匹配缓存
   */
  async semanticMatch(vectorKey: string, threshold: number): Promise<{ content: string; score: number } | null> {
    // 简化实现：遍历缓存进行模糊匹配
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < Date.now()) {
        this.memoryCache.delete(key);
        continue;
      }
      if (key.includes('cache:l2:')) {
        try {
          const data = JSON.parse(entry.value);
          const score = this.calculateSimilarity(vectorKey, key);
          if (score >= threshold) {
            return { content: data.content, score };
          }
        } catch {
          // Skip invalid entries
        }
      }
    }
    return null;
  }

  /**
   * 简单相似度计算
   */
  private calculateSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(/[:{},"\s]+/));
    const setB = new Set(b.split(/[:{},"\s]+/));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }
}
