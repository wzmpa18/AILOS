/**
 * Cache L2/L3 — Barrel Export
 * Phase 1 Task 6: IMPLEMENT
 *
 * 设计基线: Cache L2/L3 DESIGN PROPOSAL v2.1 (a2212e6)
 * 冻结基线: Event Bus v1.0 / Permission Manager v1.0 / Audit Log v1.0 / State Manager v1.0
 *
 * API Surface 管控:
 * - MemoryStore 不对外暴露，仅通过 DI 注入
 * - RedisStore 不对外暴露，仅通过 DI 注入
 * - PrismaStore 不对外暴露，仅通过 DI 注入
 */

// DI Token
export { ICACHE_STORE, CACHE_SOURCE_MODULE } from './cache.provider';

// 核心服务
export { CacheManager } from './cache.service';

// 模块
export { CacheModule } from './cache.module';

// 类型（type-only re-export）
export type {
  CacheEntry,
  CacheMetadata,
  CacheStats,
  TierStats,
  CacheIsolationMarkers,
  CacheSetOptions,
  CacheWriteValidation,
  CacheInvalidatedPayload,
  CacheEvictedPayload,
  CacheWriteRejectedPayload,
  CacheSchemaMigratedPayload,
  NamespaceConfig,
  ICacheStore,
  ISemanticCacheExtension,
  ICacheWarmupExtension,
} from './cache.types';

// 枚举
export {
  CacheType,
  CacheSecurityLevel,
  CacheLifecycleState,
  CacheTier,
  CacheRejectionReason,
  CacheAuditEventType,
} from './cache.types';

// 异常
export {
  CacheNotFoundError,
  CacheExpiredError,
  CacheStorageUnavailableError,
  CachePermissionDeniedError,
} from './cache.types';

// 常量
export {
  MAX_MEMORY_ENTRIES,
  DEFAULT_L1_TTL_SECONDS,
  DEFAULT_L2_TTL_SECONDS,
  DEFAULT_L3_TTL_SECONDS,
  NEGATIVE_CACHE_TTL_SECONDS,
  TTL_JITTER_RATIO,
  SINGLE_FLIGHT_LOCK_TIMEOUT_SECONDS,
  SINGLE_FLIGHT_WAIT_TIMEOUT_SECONDS,
  MAX_PAYLOAD_SIZE,
  SUPPORTED_SCHEMA_VERSION,
  DEGRADATION_RETRY_INTERVAL_SECONDS,
  INVALIDATION_MAX_RETRIES,
  L3_REUSE_THRESHOLD,
  ARCHIVE_RETENTION_DAYS,
  DEFAULT_TENANT_QUOTA,
  DEFAULT_USER_QUOTA,
  REDIS_CACHE_PREFIX,
  CACHE_WRITE_WHITELIST,
  REGISTERED_NAMESPACES,
} from './cache.types';

// 内部实现不对外暴露:
// MemoryStore — 仅通过 Module DI 注入
// RedisStore — 仅通过 Module DI 注入
// PrismaStore — 仅通过 Module DI 注入