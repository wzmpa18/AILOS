/**
 * Cache L2/L3 — Core Types, Interfaces, Enums, Constants
 * Phase 1 Task 6: IMPLEMENT
 *
 * 设计基线: Cache L2/L3 DESIGN PROPOSAL v2.1 (a2212e6)
 * 冻结基线: Event Bus v1.0 (4891c66) / Permission Manager v1.0 (c74bbfc)
 *           Audit Log v1.0 (a51edc5) / State Manager v1.0 (d374853)
 *
 * 契约冻结声明:
 * - ICacheStore v1.0: 5 方法签名 + 参数类型 + 返回结构 — 已冻结
 * - CacheEntry Schema v1.0: A 类 7 字段 + B 类 4 字段 — 已冻结
 * - 修改须走 ACR 审批
 */

// ============================================================================
// 缓存类型枚举
// ============================================================================

/** 缓存类型 */
export enum CacheType {
  IMMUTABLE_ASSET = 'IMMUTABLE_ASSET',
  GENERATED_RESULT = 'GENERATED_RESULT',
}

/** 缓存安全等级 */
export enum CacheSecurityLevel {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
  PROHIBITED = 'PROHIBITED',
}

/** 缓存条目生命周期状态 */
export enum CacheLifecycleState {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  INVALIDATED = 'INVALIDATED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

/** 缓存层级 */
export enum CacheTier {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
}

/** 缓存写入拒绝原因 */
export enum CacheRejectionReason {
  PROHIBITED_DATA = 'PROHIBITED_DATA',
  INVALID_NAMESPACE = 'INVALID_NAMESPACE',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  SIZE_LIMIT = 'SIZE_LIMIT',
}

/** 缓存治理审计事件类型 */
export enum CacheAuditEventType {
  INVALIDATED = 'cache.invalidated',
  EVICTED = 'cache.evicted',
  SCHEMA_MIGRATED = 'cache.schema_migrated',
  WRITE_REJECTED = 'cache.write_rejected',
}

// ============================================================================
// 数据模型
// ============================================================================

export interface CacheIsolationMarkers {
  tenantId?: string;
  userId?: string;
  dataScope: 'personal' | 'platform';
}

export interface CacheMetadata {
  modelId?: string;
  promptVersion?: string;
  userContextHash?: string;
  scene: string;
  domain: string;
  assetId?: string;
  tokenEstimate?: number;
  [key: string]: unknown;
}

/**
 * CacheEntry Schema v1.0
 * A 类 (Identity) 🔒: id, cacheKey, namespace, schemaVersion, cacheType, securityLevel, sourceModule
 * B 类 (Ownership) 🔒: tenantId, userId, dataScope, assetId
 * C 类 (Runtime) 🟡: accessCount, lastAccessedAt, createdAt, expiresAt, archivedAt
 */
export interface CacheEntry {
  id: string;
  cacheKey: string;
  namespace: string;
  schemaVersion: number;
  cacheType: CacheType;
  securityLevel: CacheSecurityLevel;
  sourceModule: string;
  tenantId?: string;
  userId?: string;
  dataScope: 'personal' | 'platform';
  assetId?: string;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  archivedAt?: string;
  value: Record<string, unknown>;
  languageIdentityHash?: string;
  metadata: CacheMetadata;
}

// ============================================================================
// 统计模型
// ============================================================================

export interface TierStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  invalidatedCount: number;
  avgLatencyMs: number;
}

export interface CacheStats {
  byTier: { L1: TierStats; L2: TierStats; L3: TierStats };
  byNamespace: Record<string, TierStats>;
  cumulative: {
    totalHits: number;
    totalMisses: number;
    totalTokensSaved: number;
    totalEstimatedCostSaved: number;
    totalEvictions: number;
    totalInvalidated: number;
  };
}

// ============================================================================
// ICacheStore v1.0 🔒
// ============================================================================

export interface ICacheStore {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(namespace: string, pattern: string): Promise<number>;
  getStats(): CacheStats;
}

// ============================================================================
// Phase 2 扩展接口
// ============================================================================

export interface ISemanticCacheExtension {
  semanticMatch(embedding: number[], threshold: number): Promise<CacheEntry | null>;
}

export interface ICacheWarmupExtension {
  warmup(assetIds: string[]): Promise<number>;
  getWarmupCandidates(limit: number): Promise<string[]>;
}

// ============================================================================
// 校验 + 事件 Payload
// ============================================================================

export interface CacheWriteValidation {
  allowed: boolean;
  reason?: CacheRejectionReason;
}

export interface CacheInvalidatedPayload {
  cacheKey: string;
  namespace: string;
  reason: string;
  invalidatedCount: number;
  operator?: string;
}

export interface CacheEvictedPayload {
  cacheKey: string;
  namespace: string;
  reason: 'TTL_EXPIRED' | 'CAPACITY_LIMIT' | 'LOW_REUSE';
  tier: CacheTier;
  evictedCount: number;
}

export interface CacheWriteRejectedPayload {
  cacheKey: string;
  namespace: string;
  reason: CacheRejectionReason;
  securityLevel: CacheSecurityLevel;
  sourceModule: string;
}

export interface CacheSchemaMigratedPayload {
  fromVersion: number;
  toVersion: number;
  migratedCount: number;
  namespace: string;
}

export interface CacheSetOptions {
  tiers?: CacheTier[];
  ttlSeconds?: number;
  skipSecurityCheck?: boolean;
}

export interface NamespaceConfig {
  securityLevel: CacheSecurityLevel;
  ttlSeconds: number;
  owner?: string;
}

// ============================================================================
// 常量
// ============================================================================

export const MAX_MEMORY_ENTRIES = 1000;
export const DEFAULT_L1_TTL_SECONDS = 900;
export const DEFAULT_L2_TTL_SECONDS = 3600;
export const DEFAULT_L3_TTL_SECONDS = 2592000;
export const NEGATIVE_CACHE_TTL_SECONDS = 60;
export const TTL_JITTER_RATIO = 0.2;
export const SINGLE_FLIGHT_LOCK_TIMEOUT_SECONDS = 10;
export const SINGLE_FLIGHT_WAIT_TIMEOUT_SECONDS = 5;
export const MAX_PAYLOAD_SIZE = 64 * 1024;
export const SUPPORTED_SCHEMA_VERSION = 1;
export const DEGRADATION_RETRY_INTERVAL_SECONDS = 60;
export const INVALIDATION_MAX_RETRIES = 3;
export const L3_REUSE_THRESHOLD = 2;
export const ARCHIVE_RETENTION_DAYS = 90;
export const DEFAULT_TENANT_QUOTA = 10000;
export const DEFAULT_USER_QUOTA = 1000;
export const REDIS_CACHE_PREFIX = 'ailos:cache:l2';

export const CACHE_WRITE_WHITELIST = [
  'ai-gateway',
  'resource-generator',
  'asset-pipeline',
] as const;

export const REGISTERED_NAMESPACES = new Map<string, NamespaceConfig>([
  ['learning.lesson.generate', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 86400 }],
  ['learning.exercise.generate', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 43200 }],
  ['learning.assessment.evaluate', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 3600 }],
  ['ai.translation.text', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 86400 }],
  ['ai.partner.response', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 3600 }],
  ['ai.explanation.concept', { securityLevel: CacheSecurityLevel.PUBLIC, ttlSeconds: 86400 }],
  ['system.prompt.template', { securityLevel: CacheSecurityLevel.PUBLIC, ttlSeconds: Infinity }],
  ['system.knowledge.asset', { securityLevel: CacheSecurityLevel.PUBLIC, ttlSeconds: Infinity }],
  ['content.course.structure', { securityLevel: CacheSecurityLevel.PUBLIC, ttlSeconds: 86400 }],
  ['content.story.generate', { securityLevel: CacheSecurityLevel.RESTRICTED, ttlSeconds: 86400 }],
  ['system.cost.tracking', { securityLevel: CacheSecurityLevel.PUBLIC, ttlSeconds: 86400 }],
]);

// ============================================================================
// 统一异常类型
// ============================================================================

export class CacheNotFoundError extends Error {
  constructor(key: string) {
    super(`Cache entry not found: ${key}`);
    this.name = 'CacheNotFoundError';
  }
}

export class CacheExpiredError extends Error {
  constructor(key: string, expiresAt: string) {
    super(`Cache entry expired: ${key} (expired at ${expiresAt})`);
    this.name = 'CacheExpiredError';
  }
}

export class CacheStorageUnavailableError extends Error {
  constructor(tier: CacheTier, cause?: string) {
    super(`Cache storage ${tier} unavailable${cause ? `: ${cause}` : ''}`);
    this.name = 'CacheStorageUnavailableError';
  }
}

export class CachePermissionDeniedError extends Error {
  constructor(reason: CacheRejectionReason, detail?: string) {
    super(`Cache write denied: ${reason}${detail ? ` (${detail})` : ''}`);
    this.name = 'CachePermissionDeniedError';
  }
}