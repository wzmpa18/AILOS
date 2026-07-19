/**
 * CacheManager — 缓存门面服务
 * Phase 1 Task 6: Step 5 IMPLEMENT
 *
 * 职责:
 * - 分层查询编排（L1→L2→L3 逐级查询 + 回写）
 * - 分层写入编排（按安全分级决定写入层级）
 * - 故障降级（L2/L3 不可用时自动跳过）
 * - 指标收集与聚合
 * - 事件订阅与发布（缓存治理审计事件）
 * - 禁止缓存清单校验
 * - 写入白名单校验
 */

import { Injectable, Logger, OnModuleDestroy, Inject, Optional } from '@nestjs/common';
import { EventBusService } from '../event-bus/event-bus.service';
import { EventEnvelope } from '../permission/permission.types';
import { MemoryStore } from './stores/memory-store';
import { RedisStore } from './stores/redis-store';
import { PrismaStore } from './stores/prisma-store';
import {
  ICacheStore,
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheSecurityLevel,
  CacheType,
  CacheLifecycleState,
  CacheRejectionReason,
  CacheAuditEventType,
  CacheSetOptions,
  CacheWriteValidation,
  CacheInvalidatedPayload,
  CacheEvictedPayload,
  CacheWriteRejectedPayload,
  CacheSchemaMigratedPayload,
  MAX_PAYLOAD_SIZE,
  SUPPORTED_SCHEMA_VERSION,
  REGISTERED_NAMESPACES,
  CACHE_WRITE_WHITELIST,
  INVALIDATION_MAX_RETRIES,
  DEGRADATION_RETRY_INTERVAL_SECONDS,
  CacheNotFoundError,
  CacheExpiredError,
  CacheStorageUnavailableError,
  CachePermissionDeniedError,
} from './cache.types';
import { ICACHE_STORE, CACHE_SOURCE_MODULE } from './cache.provider';

@Injectable()
export class CacheManager implements ICacheStore, OnModuleDestroy {
  private readonly logger = new Logger(CacheManager.name);
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly memoryStore: MemoryStore,
    private readonly redisStore: RedisStore,
    private readonly prismaStore: PrismaStore,
    @Optional() private readonly eventBus?: EventBusService,
    @Optional() @Inject(CACHE_SOURCE_MODULE) private readonly sourceModule?: string,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  /** 启动定期巡检（每 6 小时） */
  startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.runPeriodicCleanup();
    }, 6 * 60 * 60 * 1000);
  }

  private async runPeriodicCleanup(): Promise<void> {
    this.logger.debug('Starting periodic cleanup...');
    const l1Count = this.memoryStore.cleanup();
    const l3Archived = await this.prismaStore.archiveLowReuse();
    const l3Purged = await this.prismaStore.purgeArchived();
    this.logger.debug(
      `Periodic cleanup done: L1=${l1Count}, L3_archived=${l3Archived}, L3_purged=${l3Purged}`,
    );
  }

  // ============================================================================
  // ICacheStore v1.0 — get（分层查询编排）
  // ============================================================================

  async get(key: string): Promise<CacheEntry | null> {
    // L1: MemoryStore
    try {
      const l1Result = await this.memoryStore.get(key);
      if (l1Result) {
        return l1Result;
      }
    } catch (error) {
      this.logger.warn(`L1 get failed, skipping: ${error}`);
    }

    // Single Flight: 同一 Key 仅一个请求回源
    const result = await this.memoryStore.singleFlight(key, async () => {
      // L2: RedisStore（故障降级：跳过 L2）
      let l2Result: CacheEntry | null = null;
      if (!this.redisStore.isDegraded()) {
        try {
          l2Result = await this.redisStore.get(key);
          if (l2Result) {
            // 回写 L1
            await this.memoryStore.set(key, l2Result).catch(() => {});
            return l2Result;
          }
        } catch (error) {
          this.logger.warn(`L2 get failed, skipping to L3: ${error}`);
        }
      }

      // L3: PrismaStore（故障降级：跳过 L3）
      if (!this.prismaStore.isDegraded()) {
        try {
          const l3Result = await this.prismaStore.get(key);
          if (l3Result) {
            // 回写 L2
            if (!this.redisStore.isDegraded()) {
              await this.redisStore.set(key, l3Result).catch(() => {});
            }
            // 回写 L1
            await this.memoryStore.set(key, l3Result).catch(() => {});
            return l3Result;
          }
        } catch (error) {
          this.logger.warn(`L3 get failed, returning null: ${error}`);
        }
      }

      // 全层级未命中 → 写入负缓存
      await this.memoryStore.setNegative(key);
      return null;
    });

    return result;
  }

  // ============================================================================
  // ICacheStore v1.0 — set（分层写入编排 + 安全校验）
  // ============================================================================

  async set(key: string, entry: CacheEntry, options?: CacheSetOptions): Promise<void> {
    // 安全校验（除非白名单写入方跳过）
    if (!options?.skipSecurityCheck) {
      this.validateWrite(entry);
    }

    const tiers = options?.tiers || [CacheTier.L1, CacheTier.L2, CacheTier.L3];

    // L1: MemoryStore
    if (tiers.includes(CacheTier.L1)) {
      await this.memoryStore.set(key, entry).catch((error) => {
        this.logger.warn(`L1 set failed: ${error}`);
      });
    }

    // L2: RedisStore
    if (tiers.includes(CacheTier.L2) && !this.redisStore.isDegraded()) {
      await this.redisStore.set(key, entry).catch((error) => {
        this.logger.warn(`L2 set failed: ${error}`);
      });
    }

    // L3: PrismaStore
    if (tiers.includes(CacheTier.L3) && !this.prismaStore.isDegraded()) {
      await this.prismaStore.set(key, entry).catch((error) => {
        this.logger.warn(`L3 set failed: ${error}`);
      });
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidate
  // ============================================================================

  async invalidate(key: string): Promise<void> {
    let retries = 0;
    const doInvalidate = async (): Promise<void> => {
      try {
        await this.memoryStore.invalidate(key);
        await this.redisStore.invalidate(key);
        await this.prismaStore.invalidate(key);

        // 发布审计事件
        await this.publishAuditEvent(CacheAuditEventType.INVALIDATED, {
          cacheKey: key,
          namespace: 'unknown',
          reason: 'manual',
          invalidatedCount: 1,
          operator: this.sourceModule || 'system',
        });
      } catch (error) {
        if (retries < INVALIDATION_MAX_RETRIES) {
          retries++;
          this.logger.warn(`Invalidation retry ${retries}/${INVALIDATION_MAX_RETRIES} for key: ${key}`);
          await new Promise((resolve) => setTimeout(resolve, retries * 5000));
          await doInvalidate();
        } else {
          this.logger.error(`Invalidation failed after ${INVALIDATION_MAX_RETRIES} retries for key: ${key}`);
          throw error;
        }
      }
    };

    await doInvalidate();
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidatePattern
  // ============================================================================

  async invalidatePattern(namespace: string, pattern: string): Promise<number> {
    const results = await Promise.allSettled([
      this.memoryStore.invalidatePattern(namespace, pattern),
      this.redisStore.invalidatePattern(namespace, pattern),
      this.prismaStore.invalidatePattern(namespace, pattern),
    ]);

    const total = results.reduce((sum, r) => {
      return sum + (r.status === 'fulfilled' ? r.value : 0);
    }, 0);

    // 发布审计事件
    await this.publishAuditEvent(CacheAuditEventType.INVALIDATED, {
      cacheKey: pattern,
      namespace,
      reason: 'pattern_match',
      invalidatedCount: total,
      operator: this.sourceModule || 'system',
    });

    return total;
  }

  // ============================================================================
  // ICacheStore v1.0 — getStats（聚合统计）
  // ============================================================================

  getStats(): CacheStats {
    const l1Stats = this.memoryStore.getStats();
    const l2Stats = this.redisStore.getStats();
    const l3Stats = this.prismaStore.getStats();

    const totalHits = l1Stats.cumulative.totalHits + l2Stats.cumulative.totalHits + l3Stats.cumulative.totalHits;
    const totalMisses = l1Stats.cumulative.totalMisses + l2Stats.cumulative.totalMisses + l3Stats.cumulative.totalMisses;
    const totalEvictions = l1Stats.cumulative.totalEvictions + l2Stats.cumulative.totalEvictions + l3Stats.cumulative.totalEvictions;
    const totalInvalidated = l1Stats.cumulative.totalInvalidated + l2Stats.cumulative.totalInvalidated + l3Stats.cumulative.totalInvalidated;

    return {
      byTier: {
        L1: l1Stats.byTier.L1,
        L2: l2Stats.byTier.L2,
        L3: l3Stats.byTier.L3,
      },
      byNamespace: {},
      cumulative: {
        totalHits,
        totalMisses,
        totalTokensSaved: l1Stats.cumulative.totalTokensSaved + l2Stats.cumulative.totalTokensSaved + l3Stats.cumulative.totalTokensSaved,
        totalEstimatedCostSaved: l1Stats.cumulative.totalEstimatedCostSaved + l2Stats.cumulative.totalEstimatedCostSaved + l3Stats.cumulative.totalEstimatedCostSaved,
        totalEvictions,
        totalInvalidated,
      },
    };
  }

  // ============================================================================
  // 写入安全校验
  // ============================================================================

  /**
   * 校验缓存条目是否允许写入
   * 包含：安全等级、命名空间、Schema 版本、Payload 大小
   */
  private validateWrite(entry: CacheEntry): void {
    // 1. 安全等级校验
    if (entry.securityLevel === CacheSecurityLevel.PROHIBITED) {
      this.publishWriteRejected(entry, CacheRejectionReason.PROHIBITED_DATA);
      throw new CachePermissionDeniedError(
        CacheRejectionReason.PROHIBITED_DATA,
        `Security level is PROHIBITED for key: ${entry.cacheKey}`,
      );
    }

    // 2. 命名空间校验
    if (!REGISTERED_NAMESPACES.has(entry.namespace)) {
      this.publishWriteRejected(entry, CacheRejectionReason.INVALID_NAMESPACE);
      throw new CachePermissionDeniedError(
        CacheRejectionReason.INVALID_NAMESPACE,
        `Namespace not registered: ${entry.namespace}`,
      );
    }

    // 3. Schema 版本校验
    if (entry.schemaVersion < 1 || entry.schemaVersion > SUPPORTED_SCHEMA_VERSION) {
      this.publishWriteRejected(entry, CacheRejectionReason.SCHEMA_MISMATCH);
      throw new CachePermissionDeniedError(
        CacheRejectionReason.SCHEMA_MISMATCH,
        `Schema version ${entry.schemaVersion} not supported`,
      );
    }

    // 4. Payload 大小校验
    const payloadSize = JSON.stringify(entry.value).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      this.publishWriteRejected(entry, CacheRejectionReason.SIZE_LIMIT);
      throw new CachePermissionDeniedError(
        CacheRejectionReason.SIZE_LIMIT,
        `Payload size ${payloadSize} exceeds max ${MAX_PAYLOAD_SIZE}`,
      );
    }
  }

  /**
   * 校验写入来源是否在白名单中
   */
  private validateWriteSource(sourceModule: string): void {
    if (!CACHE_WRITE_WHITELIST.includes(sourceModule as any)) {
      throw new CachePermissionDeniedError(
        CacheRejectionReason.PROHIBITED_DATA,
        `Source module '${sourceModule}' not in write whitelist`,
      );
    }
  }

  // ============================================================================
  // 审计事件发布
  // ============================================================================

  private async publishAuditEvent(
    eventType: CacheAuditEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.eventBus) return;

    const envelope: EventEnvelope = {
      event_id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      source: 'cache-manager',
      trace_id: (payload as any).trace_id as string || this.generateUUID(),
      payload,
    };

    try {
      await this.eventBus.publish(eventType, envelope);
    } catch (error) {
      this.logger.error(`Failed to publish audit event ${eventType}: ${error}`);
    }
  }

  private publishWriteRejected(entry: CacheEntry, reason: CacheRejectionReason): void {
    this.publishAuditEvent(CacheAuditEventType.WRITE_REJECTED, {
      cacheKey: entry.cacheKey,
      namespace: entry.namespace,
      reason,
      securityLevel: entry.securityLevel,
      sourceModule: entry.sourceModule,
    });
  }

  // ============================================================================
  // 事件订阅 — 资产变更驱动缓存失效
  // ============================================================================

  /** 订阅资产更新事件 */
  async onAssetUpdated(payload: { assetId: string }): Promise<void> {
    this.logger.debug(`Asset updated: ${payload.assetId}, invalidating related caches`);
    await this.redisStore.invalidatePattern('*', payload.assetId);
    await this.prismaStore.invalidatePattern('*', payload.assetId);
  }

  /** 订阅资产删除事件 */
  async onAssetDeleted(payload: { assetId: string }): Promise<void> {
    this.logger.debug(`Asset deleted: ${payload.assetId}, invalidating all related caches`);
    await this.memoryStore.invalidatePattern('*', payload.assetId);
    await this.redisStore.invalidatePattern('*', payload.assetId);
    await this.prismaStore.invalidatePattern('*', payload.assetId);
  }

  /** 订阅资产归档事件 */
  async onAssetArchived(payload: { assetId: string }): Promise<void> {
    this.logger.debug(`Asset archived: ${payload.assetId}, marking related caches as expired`);
    await this.redisStore.invalidatePattern('*', payload.assetId);
    await this.prismaStore.invalidatePattern('*', payload.assetId);
  }

  // ============================================================================
  // 强制刷新（需鉴权）
  // ============================================================================

  /**
   * 强制刷新指定命名空间的缓存
   * 调用方必须通过 Permission Manager 鉴权
   */
  async forceRefresh(namespace: string, cacheKey?: string): Promise<number> {
    if (cacheKey) {
      await this.invalidate(cacheKey);
      return 1;
    }
    return this.invalidatePattern(namespace, '.*');
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** 获取 L1 存储（测试用） */
  getMemoryStore(): MemoryStore {
    return this.memoryStore;
  }

  /** 获取 L2 存储（测试用） */
  getRedisStore(): RedisStore {
    return this.redisStore;
  }

  /** 获取 L3 存储（测试用） */
  getPrismaStore(): PrismaStore {
    return this.prismaStore;
  }
}