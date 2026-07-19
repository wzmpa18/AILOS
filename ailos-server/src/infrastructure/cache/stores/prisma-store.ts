/**
 * L3 PrismaStore — 持久化缓存适配器
 * Phase 1 Task 6: Step 4 IMPLEMENT
 *
 * 双类治理:
 * - Immutable Asset Cache: TTL=None, 跟随资产生命周期
 * - Generated Result Cache: TTL 可配置, 默认 30 天
 *
 * 特性:
 * - 容量管控（租户/用户配额）
 * - 复用率检测（低复用自动降级归档）
 * - 生命周期状态机（Created→Active→Expired→Invalidated→Archived→Deleted）
 *
 * 契约: 实现 ICacheStore v1.0 接口
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ICacheStore,
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheType,
  CacheSecurityLevel,
  CacheLifecycleState,
  DEFAULT_L3_TTL_SECONDS,
  L3_REUSE_THRESHOLD,
  DEFAULT_TENANT_QUOTA,
  DEFAULT_USER_QUOTA,
  CacheStorageUnavailableError,
} from '../cache.types';

@Injectable()
export class PrismaStore implements ICacheStore, OnModuleDestroy {
  private readonly logger = new Logger(PrismaStore.name);
  private available = false;
  private degraded = false;
  private recoveryTimer: NodeJS.Timeout | null = null;

  // Stats
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private invalidatedCount = 0;
  private totalLatencyMs = 0;
  private requestCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy(): Promise<void> {
    if (this.recoveryTimer) clearInterval(this.recoveryTimer);
  }

  /** 初始化连接检查 */
  async connect(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.available = true;
      this.degraded = false;
      this.logger.log('PrismaStore connected successfully');
    } catch (error) {
      this.logger.warn(`PrismaStore connection failed, operating in degraded mode: ${error}`);
      this.markDegraded();
    }
  }

  private markDegraded(): void {
    this.degraded = true;
    this.available = false;
    this.recoveryTimer = setInterval(async () => {
      await this.tryRecover();
    }, 60 * 1000);
  }

  private async tryRecover(): Promise<void> {
    try {
      await this.connect();
      if (this.available && this.recoveryTimer) {
        clearInterval(this.recoveryTimer);
        this.recoveryTimer = null;
        this.logger.log('PrismaStore recovered from degraded mode');
      }
    } catch {
      // 继续等待
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  isDegraded(): boolean {
    return this.degraded;
  }

  // ============================================================================
  // ICacheStore v1.0 — get
  // ============================================================================

  async get(key: string): Promise<CacheEntry | null> {
    if (!this.isAvailable()) {
      throw new CacheStorageUnavailableError(CacheTier.L3, 'Prisma not connected');
    }

    const startTime = Date.now();
    try {
      const row = await (this.prisma as any).cacheEntry.findUnique({
        where: { cacheKey: key },
      });

      if (!row) {
        this.missCount++;
        return null;
      }

      // 检查状态
      if (row.state === 'EXPIRED' || row.state === 'INVALIDATED' || row.state === 'DELETED') {
        this.missCount++;
        return null;
      }

      const entry = this.mapRowToEntry(row);
      this.hitCount++;
      return entry;
    } catch (error) {
      this.logger.error(`Prisma get error: ${error}`);
      this.missCount++;
      throw new CacheStorageUnavailableError(CacheTier.L3, String(error));
    } finally {
      this.requestCount++;
      this.totalLatencyMs += Date.now() - startTime;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — set
  // ============================================================================

  async set(key: string, entry: CacheEntry): Promise<void> {
    if (!this.isAvailable()) {
      throw new CacheStorageUnavailableError(CacheTier.L3, 'Prisma not connected');
    }

    try {
      // 容量管控
      await this.enforceCapacity(entry);

      const data = this.mapEntryToRow(entry);
      await (this.prisma as any).cacheEntry.upsert({
        where: { cacheKey: key },
        create: data,
        update: {
          value: data.value,
          schemaVersion: data.schemaVersion,
          securityLevel: data.securityLevel,
          expiresAt: data.expiresAt,
          accessCount: data.accessCount,
          lastAccessedAt: data.lastAccessedAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Prisma set error: ${error}`);
      throw new CacheStorageUnavailableError(CacheTier.L3, String(error));
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidate
  // ============================================================================

  async invalidate(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await (this.prisma as any).cacheEntry.update({
        where: { cacheKey: key },
        data: {
          state: 'INVALIDATED',
          updatedAt: new Date(),
        },
      });
      this.invalidatedCount++;
    } catch (error) {
      // 条目不存在时静默忽略
      this.logger.debug(`Prisma invalidate: entry not found for key ${key}`);
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — invalidatePattern
  // ============================================================================

  async invalidatePattern(namespace: string, pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const result = await (this.prisma as any).cacheEntry.updateMany({
        where: {
          namespace,
          cacheKey: { contains: pattern },
        },
        data: {
          state: 'INVALIDATED',
          updatedAt: new Date(),
        },
      });
      this.invalidatedCount += result.count;
      return result.count;
    } catch (error) {
      this.logger.error(`Prisma invalidatePattern error: ${error}`);
      return 0;
    }
  }

  // ============================================================================
  // ICacheStore v1.0 — getStats
  // ============================================================================

  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    const avgLatency = this.requestCount > 0 ? this.totalLatencyMs / this.requestCount : 0;

    return {
      byTier: {
        L1: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 },
        L2: { hitCount: 0, missCount: 0, hitRate: 0, evictionCount: 0, invalidatedCount: 0, avgLatencyMs: 0 },
        L3: {
          hitCount: this.hitCount,
          missCount: this.missCount,
          hitRate,
          evictionCount: this.evictionCount,
          invalidatedCount: this.invalidatedCount,
          avgLatencyMs: avgLatency,
        },
      },
      byNamespace: {},
      cumulative: {
        totalHits: this.hitCount,
        totalMisses: this.missCount,
        totalTokensSaved: 0,
        totalEstimatedCostSaved: 0,
        totalEvictions: this.evictionCount,
        totalInvalidated: this.invalidatedCount,
      },
    };
  }

  // ============================================================================
  // 容量管控
  // ============================================================================

  private async enforceCapacity(entry: CacheEntry): Promise<void> {
    // 租户配额
    if (entry.tenantId) {
      const count = await (this.prisma as any).cacheEntry.count({
        where: { tenantId: entry.tenantId, state: 'ACTIVE' },
      });
      if (count >= DEFAULT_TENANT_QUOTA) {
        await this.evictOldestByTenant(entry.tenantId);
      }
    }

    // 用户配额
    if (entry.userId) {
      const count = await (this.prisma as any).cacheEntry.count({
        where: { userId: entry.userId, state: 'ACTIVE' },
      });
      if (count >= DEFAULT_USER_QUOTA) {
        await this.evictOldestByUser(entry.userId);
      }
    }
  }

  private async evictOldestByTenant(tenantId: string): Promise<void> {
    const oldest = await (this.prisma as any).cacheEntry.findFirst({
      where: { tenantId, state: 'ACTIVE' },
      orderBy: { lastAccessedAt: 'asc' },
    });
    if (oldest) {
      await (this.prisma as any).cacheEntry.update({
        where: { id: oldest.id },
        data: { state: 'ARCHIVED', archivedAt: new Date(), updatedAt: new Date() },
      });
      this.evictionCount++;
    }
  }

  private async evictOldestByUser(userId: string): Promise<void> {
    const oldest = await (this.prisma as any).cacheEntry.findFirst({
      where: { userId, state: 'ACTIVE' },
      orderBy: { lastAccessedAt: 'asc' },
    });
    if (oldest) {
      await (this.prisma as any).cacheEntry.update({
        where: { id: oldest.id },
        data: { state: 'ARCHIVED', archivedAt: new Date(), updatedAt: new Date() },
      });
      this.evictionCount++;
    }
  }

  // ============================================================================
  // 复用率检测
  // ============================================================================

  /** 检测低复用率条目并归档 */
  async archiveLowReuse(): Promise<number> {
    if (!this.isAvailable()) return 0;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 30);

    try {
      const result = await (this.prisma as any).cacheEntry.updateMany({
        where: {
          state: 'ACTIVE',
          accessCount: { lt: L3_REUSE_THRESHOLD },
          lastAccessedAt: { lt: threshold },
        },
        data: {
          state: 'ARCHIVED',
          archivedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      this.evictionCount += result.count;
      this.logger.debug(`[ArchiveLowReuse] Archived ${result.count} entries`);
      return result.count;
    } catch (error) {
      this.logger.error(`ArchiveLowReuse error: ${error}`);
      return 0;
    }
  }

  /** 清理过期归档条目 */
  async purgeArchived(): Promise<number> {
    if (!this.isAvailable()) return 0;

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 90);

    try {
      const result = await (this.prisma as any).cacheEntry.deleteMany({
        where: {
          state: 'ARCHIVED',
          archivedAt: { lt: threshold },
        },
      });
      this.logger.debug(`[PurgeArchived] Deleted ${result.count} archived entries`);
      return result.count;
    } catch (error) {
      this.logger.error(`PurgeArchived error: ${error}`);
      return 0;
    }
  }

  // ============================================================================
  // 映射
  // ============================================================================

  private mapRowToEntry(row: any): CacheEntry {
    return {
      id: row.id,
      cacheKey: row.cacheKey,
      namespace: row.namespace,
      schemaVersion: row.schemaVersion,
      cacheType: row.cacheType as CacheType,
      securityLevel: row.securityLevel as CacheSecurityLevel,
      sourceModule: row.sourceModule,
      tenantId: row.tenantId,
      userId: row.userId,
      dataScope: row.dataScope,
      assetId: row.assetId,
      accessCount: row.accessCount,
      lastAccessedAt: row.lastAccessedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
      archivedAt: row.archivedAt?.toISOString(),
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      languageIdentityHash: row.languageIdentityHash,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
    };
  }

  private mapEntryToRow(entry: CacheEntry): any {
    return {
      id: entry.id,
      cacheKey: entry.cacheKey,
      namespace: entry.namespace,
      value: JSON.stringify(entry.value),
      schemaVersion: entry.schemaVersion,
      cacheType: entry.cacheType,
      state: 'ACTIVE',
      scene: entry.metadata.scene || '',
      domain: entry.metadata.domain || '',
      sourceModule: entry.sourceModule,
      languageIdentityHash: entry.languageIdentityHash,
      securityLevel: entry.securityLevel,
      tenantId: entry.tenantId,
      userId: entry.userId,
      dataScope: entry.dataScope,
      assetId: entry.assetId,
      accessCount: entry.accessCount,
      lastAccessedAt: entry.lastAccessedAt ? new Date(entry.lastAccessedAt) : new Date(),
      createdAt: new Date(entry.createdAt),
      expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
    };
  }
}