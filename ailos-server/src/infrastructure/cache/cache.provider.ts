/**
 * Cache L2/L3 — Symbol DI Token
 * Phase 1 Task 6: IMPLEMENT
 */

/** ICacheStore 依赖注入 Token */
export const ICACHE_STORE = Symbol('ICACHE_STORE');

/** 缓存写入来源模块 Token（用于写入权限校验） */
export const CACHE_SOURCE_MODULE = Symbol('CACHE_SOURCE_MODULE');