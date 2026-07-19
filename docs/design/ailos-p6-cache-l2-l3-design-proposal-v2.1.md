# Phase 1 Task 6 Cache L2/L3 DESIGN PROPOSAL v2.1

**Document Version**: v2.1 — DESIGN PROPOSAL (IMPLEMENTATION READINESS GATE)
**Status**: IMPLEMENTATION GATE PENDING
**Author**: TRAE / AI Programming Agent
**Date**: 2026-07-19
**Previous Version**: v2.0 (Commit `e1a80f1`, DESIGN REVIEW PASSED)
**Governance**: AILOS v3.2.1 九阶段生命周期治理 — IMPLEMENTATION GATE Stage
**Source of Truth**: AILOS Software Architecture Blueprint v3.2.1 (唯一架构基线)

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-07-19 | 初始 DESIGN PROPOSAL 提交 |
| v2.0 | 2026-07-19 | 响应 DESIGN REVIEW RESULT (CONDITIONAL PASS)，完成全部 10 项强制修正 |
| v2.1 | 2026-07-19 | 响应 IMPLEMENTATION READINESS GATE，完成全部 7 项准入补充 + 契约冻结声明 |

**v2.1 准入闸门完成清单**：

| 闸门项 | 优先级 | 新增章节 | 状态 |
|--------|--------|----------|------|
| #1 ICacheStore v1.0 接口契约冻结声明 | 🔴 高 | §15 | ✅ 已完成 |
| #2 CacheEntry v1.0 数据 Schema 分级冻结 | 🔴 高 | §16 | ✅ 已完成 |
| #3 缓存治理审计事件统一定义 | 🔴 高 | §17 | ✅ 已完成 |
| #4 Redis 资源隔离与越权禁止规则 | 🔴 高 | §18 | ✅ 已完成 |
| #5 缓存失效防护与故障降级策略 | 🟡 中 | §19 | ✅ 已完成 |
| #6 缓存刷新策略与权限定义 | 🟡 中 | §20 | ✅ 已完成 |
| #7 禁止缓存清单（Forbidden List） | 🟡 中 | §21 | ✅ 已完成 |

---

## 目录

1. [Module Positioning](#1-module-positioning)
2. [Architecture Design](#2-architecture-design)
3. [Phase 1 / Phase 2 Capability Boundary Declaration](#3-phase-1--phase-2-capability-boundary-declaration)
4. [Cache Storage Governance Strategy](#4-cache-storage-governance-strategy)
5. [Cache Layer Boundary and Security Specification](#5-cache-layer-boundary-and-security-specification)
6. [Cache Namespace Specification](#6-cache-namespace-specification)
7. [Cache Invalidation Contract](#7-cache-invalidation-contract)
8. [Cache Version Migration Plan](#8-cache-version-migration-plan)
9. [Cache Observability Metrics](#9-cache-observability-metrics)
10. [AI Gateway Integration Boundary](#10-ai-gateway-integration-boundary)
11. [GLOI v3.2.1 Compliance Checklist](#11-gloi-v321-compliance-checklist)
12. [Frozen Module Compatibility Analysis](#12-frozen-module-compatibility-analysis)
13. [Implementation Plan](#13-implementation-plan)
14. [Implementation Readiness Gate Summary](#14-implementation-readiness-gate-summary)
15. [ICacheStore v1.0 Interface Contract Freeze](#15-icachestore-v10-interface-contract-freeze)
16. [CacheEntry v1.0 Data Schema Tiered Freeze](#16-cacheentry-v10-data-schema-tiered-freeze)
17. [Cache Governance Audit Events](#17-cache-governance-audit-events)
18. [Redis Resource Isolation and Cross-Domain Prohibition](#18-redis-resource-isolation-and-cross-domain-prohibition)
19. [Cache Failure Protection and Degradation Strategy](#19-cache-failure-protection-and-degradation-strategy)
20. [Cache Refresh Strategy and Permission Definition](#20-cache-refresh-strategy-and-permission-definition)
21. [Forbidden Cache List](#21-forbidden-cache-list)
22. [Next Step](#22-next-step)

---

## 1. Module Positioning

### 1.1 层级定位

Cache L2/L3 位于 AILOS **Runtime Infrastructure Layer**，是实现「缓存优先 (Cache-First)」原则的**核心成本控制组件**。根据 v3.2.1 蓝图（L348-352），所有 AI 生成内容必须先查三级缓存，缓存未命中再调用模型。缓存命中为五级降级决策矩阵的 Priority 1（¥0 成本）。

```
┌────────────────────────────────────────────────────────────────┐
│                      AI LAYER (AI Gateway)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CacheRetrievalService — 缓存命中决策 + 降级流转          │  │
│  │  (唯一缓存调用方，集成在 AI Gateway 12 步流程 Step 4/9)    │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │ 调用 ICacheStore                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│              RUNTIME INFRASTRUCTURE LAYER                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Cache Manager (P1-T6)                    │      │
│  │  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐  │      │
│  │  │ L1 Mem   │ │ L2 Redis     │ │ L3 Prisma        │  │      │
│  │  │ 15min    │ │ 1-24h        │ │ Immutable/Gen    │  │      │
│  │  │ LRU      │ │ Per-Scene    │ │ Result           │  │      │
│  │  └──────────┘ └──────────────┘ └──────────────────┘  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ Event Bus    │ │ Permission   │ │ Audit Log    │           │
│  │ v1.0 🔒      │ │ Manager v1.0 │ │ v1.0 🔒      │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 模块边界

| 边界维度 | 定义 |
|----------|------|
| 上游消费者 | **AI Gateway 是唯一调用方** — 所有缓存查询由 AI Gateway 统一发起（§10 详述） |
| 下游依赖 | Redis（L2）、Prisma/MySQL（L3） |
| 事件依赖 | Event Bus v1.0 🔒 — 发布 `cache.invalidated` / `cache.evicted` / `cache.schema_migrated` / `cache.write_rejected` 事件；订阅 `asset.*` 失效事件 |
| 权限依赖 | Permission Manager v1.0 🔒 — L3 缓存内容权限校验 + 强制刷新操作鉴权 |
| 审计依赖 | Audit Log v1.0 🔒 — 缓存治理操作通过 Event Bus 自动审计 |
| 不承载 | 业务逻辑、内容生成、模型调用、命中决策、降级流转 |

### 1.3 现有代码差距分析

| 维度 | 当前状态 | 设计要求 |
|------|----------|----------|
| 文件数 | 2 个（module + service） | 9 个（类型/接口/适配器/测试） |
| L1 实现 | 内存 Map（简陋但可用） | 保留并增强（LRU + 统计 + 负缓存） |
| L2 实现 | **无** | Redis 适配器，支持 TTL 按场景配置 + 独立连接池 |
| L3 实现 | **无** | Prisma 持久化（Immutable Asset + Generated Result 双类） |
| 分层 Fallback | **无** | L1→L2→L3 逐级查询 + 回写 + 故障降级 |
| 语义匹配 | Jaccard 相似度（玩具） | **Phase 1 仅精确 Key 匹配**；Phase 2 引入 Embedding 语义匹配 |
| 缓存 Key | 简单 hash（无语言维度） | 4 维度 GLOI 感知 Key + schema_version |
| 命名空间 | 无 | 三级结构 `namespace.scene.action` |
| 安全分级 | 无 | 三级安全分级 + L3 专项限制 + 禁止缓存清单 |
| 失效防护 | 无 | 负缓存 + Single Flight + TTL 抖动 |
| 可观测性 | 无 | 5 项核心指标 + 4 项审计事件 |
| 测试 | **无** | 完整单元测试 |
| 设计文档 | 无 | 本文档 |

---

## 2. Architecture Design

### 2.1 核心接口：ICacheStore v1.0

```typescript
/**
 * 缓存存储抽象接口 v1.0
 * Phase 1: L1 MemoryStore + L2 RedisStore + L3 PrismaStore
 * 遵循依赖倒置原则，AI Gateway 仅依赖此接口
 *
 * 契约冻结声明：ICacheStore v1.0 为 Runtime Infrastructure Layer 标准契约，
 * 后续所有模块调用缓存必须依赖此接口。接口版本升级须走正式 ACR 流程。
 */
interface ICacheStore {
  /** 查询缓存 */
  get(key: string): Promise<CacheEntry | null>;

  /** 写入缓存 */
  set(key: string, entry: CacheEntry): Promise<void>;

  /** 失效缓存 */
  invalidate(key: string): Promise<void>;

  /** 批量失效（按 namespace 模式匹配） */
  invalidatePattern(namespace: string, pattern: string): Promise<number>;

  /** 获取统计信息 */
  getStats(): CacheStats;
}
```

### 2.2 CacheEntry v1.0 数据模型

```typescript
interface CacheEntry {
  // ===== A. Identity Fields（身份核心字段）🔒 强制冻结 =====
  id: string;
  cacheKey: string;
  namespace: string;
  schemaVersion: number;
  cacheType: CacheType;
  securityLevel: CacheSecurityLevel;
  /** 来源模块标识，用于追溯缓存生成方，纳入审计与治理维度 */
  sourceModule: string;

  // ===== B. Ownership Fields（所有权隔离字段）🔒 强制冻结 =====
  tenantId?: string;
  userId?: string;
  dataScope: 'personal' | 'platform';
  assetId?: string;

  // ===== C. Runtime Metadata（运行时元数据）🟡 可演进 =====
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  expiresAt?: string;
  archivedAt?: string;

  // ===== 数据内容 =====
  value: Record<string, unknown>;
  languageIdentityHash?: string;
  metadata: CacheMetadata;
}
```

### 2.3 Phase 1 缓存 Key 设计（GLOI 合规）

```
CACHE_KEY_v1 = schema_version + ":" + namespace + ":" + hash(
  model_id
  + prompt_version
  + language_identity_hash
  + user_context_hash
)
```

**Phase 1 维度说明**：

| 维度 | 来源 | Phase 1 可用性 |
|------|------|----------------|
| `schema_version` | Cache 模块内部维护 | ✅ 已落地 |
| `namespace` | Cache 命名空间规范（§6） | ✅ 已落地 |
| `model_id` | AI Gateway 模型路由 | ✅ 已落地 |
| `prompt_version` | AI Gateway Prompt 版本管理 | ✅ 已落地 |
| `language_identity_hash` | GLOI Language Identity（Layer 0） | ✅ 已落地 |
| `user_context_hash` | 用户画像上下文 | ✅ 已落地 |

**Phase 2 扩展维度**（当前仅预留，不参与 Key 计算）：

| 维度 | 所属 GLOI 子服务 | 落地阶段 |
|------|-----------------|----------|
| `translation_memory_version` | Translation Memory Service | Phase 2-3 |
| `terminology_set_version` | Terminology Service | Phase 2-3 |
| `culture_profile_version` | Language Intelligence Service | Phase 2-3 |

### 2.4 分层查询流程

```
CacheManager.get(key, context)
    │
    ▼
┌─────────────────────────────────────────────────┐
│ L1: MemoryStore                                  │
│ TTL: 15min (+ 20% jitter) | 淘汰: LRU (max 1000)│
│ 命中 → 返回 + 更新统计                           │
└──────┬──────────────────────────────────────────┘
       │ 未命中
       ▼
│ [L2 故障? → 降级跳过 L2，直接查 L3]              │
┌─────────────────────────────────────────────────┐
│ L2: RedisStore                                   │
│ TTL: 1-24h (+ 20% jitter) | 淘汰: volatile-lru  │
│ 命中 → 回写 L1 → 返回 + 更新统计                 │
└──────┬──────────────────────────────────────────┘
       │ 未命中
       ▼
│ [L3 故障? → 降级跳过 L3，返回 null]              │
┌─────────────────────────────────────────────────┐
│ L3: PrismaStore                                  │
│ ├─ ImmutableAssetCache: TTL=None, 跟随资产        │
│ └─ GeneratedResultCache: TTL 默认 30 天           │
│ 命中 → 回写 L2 → 回写 L1 → 返回 + 更新统计       │
└──────┬──────────────────────────────────────────┘
       │ 未命中
       ▼
  return null → AI Gateway 调用模型
  → 结果写入 L1/L2/L3（按安全分级决定写入层级）
```

### 2.5 文件结构

```
src/infrastructure/cache/
├── cache.types.ts              # 所有类型、接口、常量、枚举
├── cache.provider.ts           # Symbol DI Token (ICACHE_STORE)
├── cache.service.ts            # CacheManager 门面服务（分层编排 + 指标收集 + 防护策略）
├── cache.module.ts             # @Global() Module 注册 + DI 绑定
├── stores/
│   ├── memory-store.ts         # L1 内存存储（含负缓存 + Single Flight 锁）
│   ├── redis-store.ts          # L2 Redis 存储（独立连接池）
│   └── prisma-store.ts         # L3 持久化存储（双类治理）
├── index.ts                    # Barrel Export（MemoryStore 不对外暴露）
└── cache.spec.ts               # 单元测试
```

### 2.6 L1 MemoryStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | 进程内存 Map |
| 最大容量 | 1000 条 |
| TTL | 默认 900 秒（15 分钟），叠加 ±20% 随机抖动 |
| 淘汰策略 | LRU（容量超限时淘汰最早过期 50%） |
| 负缓存 | 不存在的结果写入短 TTL 负缓存（默认 60s），避免缓存穿透 |
| Single Flight | 同一 Key 同一时间仅允许一个请求回源，其余等待结果 |
| 新增能力 | 命中率统计、访问计数、namespace 维度统计 |
| 职责边界 | 仅临时存储 AI 生成结果、资源计算产物、可重算中间数据（§5 详述） |

### 2.7 L2 RedisStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | Redis（`ioredis` 已安装） |
| 连接池 | 独立连接，不与 StateManager 共享 |
| TTL | 按场景配置，叠加 ±20% 随机抖动 |
| 淘汰策略 | `volatile-lru`（仅对设置 TTL 的键按 LRU 淘汰） |
| Key 命名空间 | `ailos:cache:l2:{namespace}:{hash}`（与 State Manager `ailos:state:*` 硬隔离） |
| Phase 1 匹配方式 | **精确 Key 匹配**（语义匹配为 Phase 2 能力） |
| 语义匹配扩展点 | 预留 `semanticMatch()` 接口签名，Phase 1 返回 null |

### 2.8 L3 PrismaStore 设计

#### 2.8.1 Immutable Asset Cache（不可变资产缓存）

| 属性 | 值 |
|------|------|
| 存储内容 | 审核通过的公共知识资产、标准化模板、系统级 Prompt 模板 |
| TTL | `None`（永久），生命周期跟随资产生命周期同步管控 |
| 淘汰触发 | 资产状态变更（`asset.updated` / `asset.deleted` / `asset.archived`）→ 主动失效 |
| 安全等级 | `PUBLIC` — 全层级允许 |
| 隔离 | 无用户隔离，全局共享 |

#### 2.8.2 Generated Result Cache（生成结果缓存）

| 属性 | 值 |
|------|------|
| 存储内容 | AI 生成的个性化习题、对话回复、翻译结果、学习内容 |
| TTL | 可配置，默认 30 天 |
| 淘汰触发 | TTL 到期 + 容量管控（复用率低于阈值自动降级归档） |
| 安全等级 | `RESTRICTED` — 须绑定用户维度隔离 |
| 隔离 | 强制携带 `tenant_id + user_id + data_scope` 三级隔离标识 |

#### 2.8.3 L3 容量治理规则

| 规则 | 阈值 | 动作 |
|------|------|------|
| 复用率低于阈值 | 30 天内访问次数 < 2 | 自动降级归档（标记 `archived`，不删除） |
| 单租户存储配额 | 可配置，默认 10,000 条 | 超配额时淘汰最旧未访问条目 |
| 单用户存储配额 | 可配置，默认 1,000 条 | 超配额时淘汰最旧未访问条目 |

### 2.9 Prisma Schema 扩展

**仅新增 1 表**，不修改任何现有表：

```prisma
model CacheEntry {
  id                    String   @id @default(uuid())
  cacheKey              String   @unique
  namespace             String
  value                 Json
  schemaVersion         Int      @default(1)
  cacheType             CacheType
  scene                 String
  domain                String
  sourceModule          String
  languageIdentityHash  String?
  securityLevel         CacheSecurityLevel
  tenantId              String?
  userId                String?
  dataScope             String   @default("personal")
  assetId               String?
  accessCount           Int      @default(0)
  lastAccessedAt        DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  expiresAt             DateTime?
  archivedAt            DateTime?

  @@index([namespace])
  @@index([cacheKey])
  @@index([cacheType, expiresAt])
  @@index([tenantId, userId])
  @@index([assetId])
  @@index([languageIdentityHash])
  @@index([sourceModule])
  @@map("cache_entries")
}

enum CacheType {
  IMMUTABLE_ASSET
  GENERATED_RESULT
}

enum CacheSecurityLevel {
  PUBLIC
  RESTRICTED
  PROHIBITED
}
```

### 2.10 缓存失效契约

| 事件类型 | 触发条件 | 失效范围 | 策略 |
|----------|----------|----------|------|
| `asset.updated` | 公共资产内容更新 | 该 `assetId` 关联的所有 L2/L3 缓存条目 | 立即失效 + 发布 `cache.invalidated` |
| `asset.deleted` | 公共资产删除 | 该 `assetId` 关联的所有 L1/L2/L3 缓存条目 | 立即失效 + 发布 `cache.invalidated` |
| `asset.archived` | 公共资产归档 | 该 `assetId` 关联的所有 L2/L3 缓存条目 | 标记为过期 + 7 天宽限期后清理 |

**失效流程**：
```
Event Bus publish(asset.updated, { assetId, ... })
    │
    ▼
CacheManager @OnEvent('asset.updated')
    │
    ├── 1. 查询所有关联缓存条目（按 assetId）
    ├── 2. L1: 立即删除
    ├── 3. L2: 立即删除
    ├── 4. L3: 标记为过期 + 记录失效日志
    └── 5. 发布 cache.invalidated 事件（通知 Audit Log）
```

### 2.11 与 AI Gateway 的集成契约

```
AI Gateway (决策层)                    Cache Manager (执行层)
     │                                       │
     │  cacheManager.get(key)                │
     │──────────────────────────────────────>│
     │                                       │ L1→L2→L3 逐级查询（含故障降级）
     │  CacheEntry | null                    │
     │<──────────────────────────────────────│
     │                                       │
     │  cacheManager.set(key, entry)         │
     │──────────────────────────────────────>│
     │                                       │ 按安全分级决定写入层级
     │                                       │ PROHIBITED → 拦截 + cache.write_rejected
     │  void                                 │
     │<──────────────────────────────────────│
```

---

## 3. Phase 1 / Phase 2 Capability Boundary Declaration

### 3.1 Phase 1 落地能力

| 能力 | 说明 | 实现方式 |
|------|------|----------|
| ICacheStore v1.0 接口 | 统一缓存存储抽象，契约冻结 | 接口 + 3 个适配器 |
| L1 MemoryStore | 内存 LRU 缓存 + 负缓存 + Single Flight | 改造现有 `CacheService` |
| L2 RedisStore | Redis 精确 Key 匹配 + 独立连接池 | `ioredis` 适配器 |
| L3 PrismaStore | 双类持久化缓存 | Prisma `cache_entries` 表 |
| 分层 Fallback | L1→L2→L3 逐级查询 + 回写 + 故障降级 | `CacheManager.get()` |
| 缓存 Key v1 | 4 维度 + schema_version | `buildCacheKey()` |
| 命名空间隔离 | 三级结构 `namespace.scene.action` | Key 前缀 |
| 安全分级 | PUBLIC / RESTRICTED / PROHIBITED | `CacheSecurityLevel` |
| 禁止缓存清单 | 8 类数据强制拦截 | `ForbiddenCacheGuard` |
| 用户隔离 | tenant_id + user_id + data_scope | `CacheIsolationMarkers` |
| 事件驱动失效 | 订阅 `asset.*` 事件 | `@OnEvent` 装饰器 |
| 审计事件 | 4 类治理事件通过 Event Bus 发布 | `cache.invalidated` / `cache.evicted` / `cache.schema_migrated` / `cache.write_rejected` |
| 失效防护 | 负缓存 + Single Flight + TTL 抖动 | `CacheManager` 内置 |
| 可观测性 | 5 项核心指标 | `CacheStats` 收集 |
| 刷新策略 | 懒加载（默认）+ 强制刷新（需鉴权） | `CacheManager` 内置 |

### 3.2 Phase 2 架构预留

| 能力 | 预留方式 | 落地路径 |
|------|----------|----------|
| 语义匹配（Embedding 向量相似度） | `ISemanticCacheExtension` 接口签名预留 | 向量数据库选型 + Embedding API 接入 |
| 后台预热刷新 | `backgroundRefresh()` 接口预留 | Top N 热门资产定时预热 |
| `translation_memory_version` 维度 | Key 公式预留字段 | GLOI Translation Memory Service 落地 |
| `terminology_set_version` 维度 | Key 公式预留字段 | GLOI Terminology Service 落地 |
| `culture_profile_version` 维度 | Key 公式预留字段 | GLOI Language Intelligence Service 落地 |
| 缓存 Key 版本升级 | `schema_version` 字段 | Phase 2 新增维度时升级至 v2 |
| L3 策略引擎 | 淘汰策略配置化接口预留 | 策略引擎模块落地后接入 |

### 3.3 语义匹配扩展点定义

```typescript
/**
 * Semantic Cache Extension Point（语义缓存扩展点）
 * Phase 1: 接口定义 + 返回 null
 * Phase 2: Embedding API 接入 + 向量相似度计算
 */
interface ISemanticCacheExtension {
  semanticMatch(embedding: number[], threshold: number): Promise<CacheEntry | null>;
}
```

---

## 4. Cache Storage Governance Strategy

(内容与 v2.0 一致，保持不变)

### 4.1 三级存储分层规则

| 层级 | 存储内容 | TTL | 淘汰策略 | 负责人 |
|------|----------|-----|----------|--------|
| L1 Memory | 热点内容、高频翻译、热门模板 | 15 分钟 | LRU（容量 1000） | CacheManager |
| L2 Redis | AI 生成结果、会话缓存、用户上下文 | 1-24 小时（按场景） | volatile-lru | CacheManager |
| L3 Immutable Asset | 公共知识资产、标准化模板、系统 Prompt | 永久（跟随资产） | 资产状态变更触发 | CacheManager + Asset Center |
| L3 Generated Result | 个性化习题、对话回复、翻译结果 | 默认 30 天 | TTL 到期 + 容量管控 | CacheManager |

### 4.2 L2 TTL 按场景配置

| 场景 | TTL | 理由 |
|------|-----|------|
| `translation` | 24 小时 | 翻译结果稳定，高频复用 |
| `explanation` | 24 小时 | 知识点解释不常变化 |
| `exercise_generation` | 12 小时 | 习题中等复用频率 |
| `course_generation` | 24 小时 | 课程内容稳定 |
| `chat` | 1 小时 | 对话上下文时效性强 |
| `encouragement` | 1 小时 | 鼓励语个性化 |
| `error_correction` | 1 小时 | 纠错时效性强 |
| `assessment` | 1 小时 | 评估结果时效性强 |
| `storytelling` | 24 小时 | 故事内容稳定 |
| `default` | 1 小时 | 默认保守策略 |

### 4.3 L3 容量管控

| 管控维度 | 阈值 | 动作 |
|----------|------|------|
| 单条复用率 | 30 天内访问次数 < 2 | 自动降级归档 |
| 单租户配额 | 可配置，默认 10,000 条 | 超配额淘汰最旧条目 |
| 单用户配额 | 可配置，默认 1,000 条 | 超配额淘汰最旧条目 |
| 归档条目保留 | 90 天 | 过期后物理删除 |

### 4.4 缓存一致性规则

- 资产状态变更（`asset.updated` / `asset.deleted` / `asset.archived`）→ 主动失效对应缓存
- 权限变更（`permission.revoked` / `role.unassigned`）→ 失效对应用户的个性化缓存
- 缓存失效操作异步执行，不阻塞主流程
- 失效失败进入重试队列，3 次后告警

---

## 5. Cache Layer Boundary and Security Specification

### 5.1 缓存层职责边界

**Cache MemoryStore 唯一职责**：
- 临时存储 AI 生成结果
- 临时存储资源计算产物
- 临时存储可重算的中间数据

**严格禁止**：
- 存储用户业务状态（User State）→ 归属 StateManager
- 存储系统运行状态（System State）→ 归属 StateManager
- 存储持久化业务实体（Business Entity）→ 归属各业务模块数据库
- 存储会话状态（Session State）→ 归属 StateManager SessionStateProvider

### 5.2 与相邻模块的调用边界

| 模块 | 关系 | 边界规则 |
|------|------|----------|
| StateManager | 平级基础设施 | 互不替代：Cache 不存储状态，StateManager 不缓存 AI 结果 |
| RedisStorageAdapter (State) | 共享 Redis | 命名空间隔离：`ailos:cache:*` vs `ailos:state:*` |
| MemoryStore (AuditLog) | 不同职责 | AuditLog MemoryStore 存储审计日志，Cache MemoryStore 存储 AI 结果 |
| PrismaService | 下游依赖 | Cache 仅操作 `cache_entries` 表，不跨表操作 |

### 5.3 可缓存数据安全分级

| 等级 | 标识 | 定义 | 允许的存储层级 |
|------|------|------|---------------|
| **PUBLIC** | 🟢 | 公共知识资产、标准化模板、通用习题、系统 Prompt | L1 + L2 + L3 全层级 |
| **RESTRICTED** | 🟡 | 个性化学习内容、AI 生成对话、翻译结果 | L1 + L2 + L3（须绑定用户隔离） |
| **PROHIBITED** | 🔴 | 身份认证凭证、权限密钥、原始敏感隐私数据 | **全层级禁止** |

### 5.4 L3 存储专项限制

| 允许存储 | 禁止存储 |
|----------|----------|
| 公共知识资产 | 身份认证数据（JWT、Session Token） |
| 脱敏后的生成资产 | 权限数据（角色、权限码） |
| 用户隔离后的长期学习资源快照 | 原始用户隐私数据（密码、手机号、邮箱） |
| 标准化模板 | 审计日志原始数据 |
| 系统 Prompt 模板 | 任何 PROHIBITED 等级数据 |

### 5.5 用户域数据隔离标识

所有 `RESTRICTED` 等级缓存数据必须携带三级隔离标识：

```typescript
{
  tenantId: string;
  userId: string;
  dataScope: 'personal' | 'platform';
}
```

---

## 6. Cache Namespace Specification

(内容与 v2.0 一致，保持不变)

### 6.1 命名空间结构

所有缓存 Key 必须携带 `namespace` 前缀，采用三级结构：

```
{domain}.{scene}.{action}
```

### 6.2 已定义命名空间

| 命名空间 | 域 | 场景 | 动作 | TTL 策略 | 安全等级 |
|----------|-----|------|------|----------|----------|
| `learning.lesson.generate` | learning | lesson | generate | L2=24h | RESTRICTED |
| `learning.exercise.generate` | learning | exercise | generate | L2=12h | RESTRICTED |
| `learning.assessment.evaluate` | learning | assessment | evaluate | L2=1h | RESTRICTED |
| `ai.translation.text` | ai | translation | text | L2=24h | RESTRICTED |
| `ai.partner.response` | ai | partner | response | L2=1h | RESTRICTED |
| `ai.explanation.concept` | ai | explanation | concept | L2=24h | PUBLIC |
| `system.prompt.template` | system | prompt | template | L3=永久 | PUBLIC |
| `system.knowledge.asset` | system | knowledge | asset | L3=永久 | PUBLIC |
| `content.course.structure` | content | course | structure | L2=24h | PUBLIC |
| `content.story.generate` | content | story | generate | L2=24h | RESTRICTED |

### 6.3 命名空间治理规则

- 每个命名空间支持独立的 TTL、淘汰策略、安全等级配置
- 不同命名空间之间的缓存互不干扰（Key 前缀隔离）
- 新增命名空间须在本文档注册，未经注册的命名空间默认拒绝写入（触发 `cache.write_rejected` 审计事件，reason=INVALID_NAMESPACE）
- 命名空间变更不影响已有缓存数据（通过 `schema_version` 管理）

---

## 7. Cache Invalidation Contract

(内容与 v2.0 一致，保持不变)

### 7.1 事件订阅

| 事件类型 | 订阅方式 | 失效范围 | 延迟 |
|----------|----------|----------|------|
| `asset.updated` | `@OnEvent('asset.updated')` | 该 `assetId` 关联的所有 L2/L3 条目 | 即时 |
| `asset.deleted` | `@OnEvent('asset.deleted')` | 该 `assetId` 关联的所有 L1/L2/L3 条目 | 即时 |
| `asset.archived` | `@OnEvent('asset.archived')` | 该 `assetId` 关联的所有 L2/L3 条目 | 7 天宽限期 |

### 7.2 失效事件发布

| 事件类型 | Payload | 用途 |
|----------|---------|------|
| `cache.invalidated` | `{ cacheKey, namespace, reason, invalidatedCount }` | 通知 Audit Log 记录缓存失效操作 |

### 7.3 失效范围定义

| 触发条件 | L1 动作 | L2 动作 | L3 动作 |
|----------|---------|---------|---------|
| `asset.updated` | 不处理（L1 短 TTL 自动过期） | 立即删除该 assetId 关联条目 | 标记过期 + 记录失效日志 |
| `asset.deleted` | 立即删除该 assetId 关联条目 | 立即删除该 assetId 关联条目 | 立即删除该 assetId 关联条目 |
| `asset.archived` | 不处理 | 标记过期（7 天宽限期） | 标记过期（7 天宽限期） |

### 7.4 兜底逻辑

```
失效操作失败
    ├── 第 1 次重试（立即）
    ├── 第 2 次重试（5 秒后）
    ├── 第 3 次重试（30 秒后）
    └── 3 次均失败 → 记录 Error 日志 + 人工介入
```

### 7.5 定期巡检

- 每 6 小时执行一次全量巡检
- 清理已过期但未被事件驱动的残留缓存条目
- 巡检结果记录至 Audit Log

---

## 8. Cache Version Migration Plan

(内容与 v2.0 一致，保持不变)

### 8.1 Schema 版本规则

| 版本 | 缓存 Key 维度 | 新增维度 | 生效时间 |
|------|--------------|----------|----------|
| `v1` | `model_id + prompt_version + language_identity_hash + user_context_hash` | — | Phase 1 |
| `v2` | v1 + `translation_memory_version` | 翻译记忆版本 | Phase 2 (TBD) |
| `v3` | v2 + `terminology_set_version` | 术语集版本 | Phase 2 (TBD) |
| `v4` | v3 + `culture_profile_version` | 文化配置版本 | Phase 2 (TBD) |

### 8.2 版本升级策略

```
新版本上线
    ├── 1. 部署新版本代码（schema_version = N+1）
    ├── 2. 旧版本缓存（schema_version = N）继续可读
    ├── 3. 新请求统一写入新版本（schema_version = N+1）
    ├── 4. 后台渐进式淘汰旧版本缓存
    │      ├── 按 TTL 自然过期（L1 15min, L2 1-24h）
    │      └── L3 旧版本标记为「待迁移」，30 天后清理
    └── 5. 旧版本缓存全部清空后，升级完成
```

### 8.3 禁止操作

- ❌ 禁止一次性全量失效旧版本缓存（防止缓存雪崩）
- ❌ 禁止在新版本代码中删除旧版本 Key 读取逻辑
- ❌ 禁止在未完成旧版本清理前再次升级 schema_version

### 8.4 版本降级回退

```
新版本异常
    ├── 1. 回滚代码至旧版本（schema_version = N）
    ├── 2. 新版本缓存（schema_version = N+1）继续可读
    │      └── 旧版本代码通过 try/catch 兼容读取新版本 Key
    ├── 3. 新请求写入旧版本
    └── 4. 新版本缓存按 TTL 自然过期
```

---

## 9. Cache Observability Metrics

(内容与 v2.0 一致，保持不变)

### 9.1 核心指标体系

| 指标 | 字段 | 计算方式 | 用途 |
|------|------|----------|------|
| 缓存命中率 | `cache_hit_rate` | `hit_count / (hit_count + miss_count)` | 评估缓存有效性 |
| 缓存未命中率 | `cache_miss_rate` | `miss_count / (hit_count + miss_count)` | 识别缓存优化空间 |
| 累计节省 Token | `token_saved` | `sum(hit_entry.token_estimate)` | 量化成本节省 |
| 预估成本节省 | `estimated_cost_saved` | `token_saved * model_price_per_token` | 成本治理 KPI |
| 淘汰条目数 | `eviction_count` | 按层级统计淘汰数 | 评估容量压力 |
| 失效条目数 | `invalidated_count` | 事件驱动失效数 | 评估资产变更频率 |

### 9.2 指标拆分维度

所有指标按以下维度拆分：

| 维度 | 说明 |
|------|------|
| 层级 | L1 / L2 / L3 |
| 命名空间 | `learning.lesson.generate` 等 |
| 缓存类型 | Immutable Asset / Generated Result |
| 时间窗口 | 1h / 24h / 7d / 30d |

### 9.3 指标数据结构

```typescript
interface CacheStats {
  byTier: { L1: TierStats; L2: TierStats; L3: TierStats; };
  byNamespace: Record<string, TierStats>;
  cumulative: {
    totalHits: number; totalMisses: number;
    totalTokensSaved: number; totalEstimatedCostSaved: number;
    totalEvictions: number; totalInvalidated: number;
  };
}

interface TierStats {
  hitCount: number; missCount: number; hitRate: number;
  evictionCount: number; invalidatedCount: number;
  avgLatencyMs: number;
}
```

### 9.4 指标暴露方式

- 通过 `CacheManager.getStats()` 获取实时指标
- 指标数据通过 Event Bus 定期发布 `cache.stats.report` 事件（每小时）
- Phase 2 接入 AI Operation Center 看板展示

---

## 10. AI Gateway Integration Boundary

(内容与 v2.0 一致，保持不变)

### 10.1 集成链路

```
Business Module
    │
    ▼
AI Gateway (AiGatewayService)              ← 唯一入口
    │
    ├── Step 4: CacheRetrievalService      ← 命中决策 + 降级流转
    │       │
    │       └── CacheManager.get()         ← 调用基础设施层
    │
    ├── Step 5-8: Template / Model / Audit
    │
    └── Step 9: CacheRetrievalService      ← 缓存回写
            │
            └── CacheManager.set()         ← 调用基础设施层
```

### 10.2 职责分工

| 组件 | 层级 | 职责 |
|------|------|------|
| **AiGatewayService** | AI Layer | 12 步流程编排，缓存命中/未命中后的决策与降级 |
| **CacheRetrievalService** | AI Layer | 命中决策：调用 CacheManager，判断是否命中，选择降级路径 |
| **CacheManager** | Infrastructure | 存储执行：分层查询、分层写入、Key 管理、失效处理、防护策略 |
| **ICacheStore 适配器** | Infrastructure | 具体存储介质读写 |

### 10.3 调用时序

```
CacheRetrievalService                    CacheManager
        │                                     │
        │  1. get(key)                        │
        │────────────────────────────────────>│
        │                                     │ 2. L1 MemoryStore.get()
        │                                     │    ├─ 命中 → return
        │                                     │    └─ 未命中 ↓
        │                                     │ 3. L2 RedisStore.get() [故障?→降级跳过]
        │                                     │    ├─ 命中 → writeback L1 → return
        │                                     │    └─ 未命中 ↓
        │                                     │ 4. L3 PrismaStore.get() [故障?→降级跳过]
        │                                     │    ├─ 命中 → writeback L2 → writeback L1 → return
        │                                     │    └─ 未命中 → return null
        │  5. CacheEntry | null               │
        │<────────────────────────────────────│
        │                                     │
        │  [未命中 → AI Gateway 调用模型]      │
        │                                     │
        │  6. set(key, entry, tiers)          │
        │────────────────────────────────────>│
        │                                     │ 7. 安全分级校验
        │                                     │    ├─ PUBLIC → L1+L2+L3
        │                                     │    ├─ RESTRICTED → L1+L2+L3 (带隔离)
        │                                     │    └─ PROHIBITED → 拦截 + cache.write_rejected
        │  8. void                            │
        │<────────────────────────────────────│
```

### 10.4 禁止重复建设

- ❌ CacheRetrievalService 不得维护独立 L1 缓存（现有 `l1Cache` Map 须移除，统一使用 CacheManager）
- ❌ AI Gateway 不得绕过 CacheManager 直接操作 Redis/Prisma
- ❌ 业务模块不得直接调用 CacheManager（必须通过 AI Gateway）

---

## 11. GLOI v3.2.1 Compliance Checklist

### 11.1 合规自查结论

**Cache L2/L3 模块涉及语言数据模型** — 缓存 Key 包含 `language_identity_hash` 维度。须通过 GLOI 合规审查。

### 11.2 逐项自查

| # | 红线条款 | 合规状态 | 说明 |
|---|----------|----------|------|
| 1 | 禁止将语言硬编码进类名、模块名、服务名、事件类型 | ✅ 合规 | 所有类名/方法名/变量名无语言标识 |
| 2 | 禁止按语言拆分服务 | ✅ 合规 | 统一 CacheManager，语言身份通过 `languageIdentityHash` 参数驱动 |
| 3 | 禁止按语言拆分数据表 | ✅ 合规 | 单一 `cache_entries` 表 |
| 4 | 禁止在业务表内新增独立 `language_code` 字段 | ✅ 合规 | 使用 `languageIdentityHash` |
| 5 | 禁止创建 `xxx_translations`、`language_mapping` 碎片化中间表 | ✅ 合规 | 无翻译表、无映射表 |
| 6 | 缓存 Key 必须包含完整语言维度与资产版本 | ✅ 合规 | Phase 1 Key 含 4 维度；Phase 2 维度已预留 |
| 7 | 禁止业务模块在 Prompt 中硬编码语言角色 | ✅ 合规 | Cache 不生成 Prompt |
| 8 | 语言版本是独立资产，接入权限体系 | ✅ 合规 | L3 按 `dataScope` 隔离 |
| 9 | 语言主键单一原则 | ✅ 合规 | `languageIdentityHash` 关联 |
| 10 | 禁止按语言拆分表 | ✅ 合规 | 单表设计 |
| 11 | 内容版本统一管理 | ✅ 合规 | `schemaVersion` + `updatedAt` |
| 12 | 术语库全局统一 | N/A | Cache 不管理术语库 |
| 13 | 翻译记忆全局统一 | N/A | Cache 不管理翻译记忆 |
| 14 | 禁止语言映射表 | ✅ 合规 | 无映射表 |

### 11.3 合规结论

**14 项自查，12 项适用，12 项合规，2 项不适用。GLOI 合规性：PASS。**

---

## 12. Frozen Module Compatibility Analysis

### 12.1 Permission Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | L3 缓存按 `dataScope` 隔离 + 强制刷新操作鉴权 |
| 调用接口 | `PermissionGuard` + `@RequirePermission` 装饰器 |
| 是否修改 | **否** |
| 兼容性 | **完全兼容** |

### 12.2 Event Bus v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 发布 4 类审计事件；订阅 `asset.*` 事件 |
| 调用接口 | `@OnEvent()` 装饰器 + `IEventBus.publish()` |
| EventEnvelope | 从 `../permission/permission.types` 导入，单一来源 |
| 已知偏差 | DEV-AUDIT-001：`*` 通配符不生效，订阅使用显式前缀 |
| 是否修改 | **否** |
| 兼容性 | **完全兼容** |

### 12.3 Audit Log Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 缓存治理事件通过 Event Bus 自动被 Audit Log 捕获 |
| 调用接口 | 不直接调用 Audit Log API |
| 是否修改 | **否** |
| 兼容性 | **完全兼容** |

### 12.4 State Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 无直接依赖，共享 Redis 基础设施 |
| 命名空间隔离 | Cache L2: `ailos:cache:*` vs State: `ailos:state:*` |
| 连接池隔离 | 独立 Redis 连接 |
| 淘汰策略隔离 | Cache: `volatile-lru` vs State: `noeviction` |
| 是否修改 | **否** |
| 兼容性 | **完全兼容** |

### 12.5 兼容性总结

| 冻结模块 | 依赖方式 | 是否修改 | 兼容性 |
|----------|----------|----------|--------|
| Permission Manager v1.0 🔒 | 消费者（权限校验） + 事件订阅 | 否 | ✅ |
| Event Bus v1.0 🔒 | 订阅方 + 发布方 | 否 | ✅ |
| Audit Log v1.0 🔒 | 间接（事件触发） | 否 | ✅ |
| State Manager v1.0 🔒 | 无直接依赖 | 否 | ✅ |

**结论：Cache L2/L3 与所有已冻结模块完全兼容，零侵入。**

---

## 13. Implementation Plan

### 13.1 实现范围

| 文件 | 职责 |
|------|------|
| `cache.types.ts` | ICacheStore v1.0、CacheEntry v1.0、CacheMetadata、CacheStats、CacheSecurityLevel、CacheIsolationMarkers、ForbiddenCacheGuard、ISemanticCacheExtension 等 |
| `cache.provider.ts` | ICACHE_STORE Symbol DI Token |
| `cache.service.ts` | CacheManager 门面：分层查询编排 + 分层写入 + 指标收集 + 事件订阅/发布 + 防护策略（负缓存、Single Flight、TTL 抖动、故障降级） |
| `cache.module.ts` | @Global() 模块，注入 L1/L2/L3 存储适配器 |
| `stores/memory-store.ts` | L1 内存存储（含负缓存 + Single Flight 锁，改造现有实现） |
| `stores/redis-store.ts` | L2 Redis 存储（独立连接池 + volatile-lru 淘汰 + 精确 Key 匹配） |
| `stores/prisma-store.ts` | L3 持久化存储（双类治理：Immutable Asset + Generated Result） |
| `index.ts` | Barrel Export（MemoryStore 不对外暴露，仅通过 DI 注入） |
| `cache.spec.ts` | 单元测试 |

### 13.2 实现约束

- ❌ 不修改任何已冻结模块代码
- ❌ L3 `cache_entries` 为唯一新增数据库表
- ❌ L2 Redis key 命名空间与 State Manager `ailos:state:*` 硬隔离
- ❌ L2 Redis 连接池不与 StateManager 共享
- ❌ L2 Redis 淘汰策略为 `volatile-lru`，不修改全局 `maxmemory-policy`
- ❌ Phase 1 不实现语义匹配（仅保留接口签名）
- ❌ 不实现后台预热刷新（Phase 2 预留）
- ✅ 所有实现遵循 Language Neutral Principle
- ✅ 缓存 Key 包含 Phase 1 GLOI 4 维度 + schema_version
- ✅ 所有 Commit 携带 `[cache][arch-check]` 双标签
- ✅ 缓存故障仅降级性能，绝不中断业务可用性

### 13.3 单元测试覆盖场景

| # | 场景 | 测试内容 |
|----|------|----------|
| 1 | L1 MemoryStore | get/set/invalidate/expire/LRU 淘汰 |
| 2 | L2 RedisStore | get/set/invalidate/invalidatePattern |
| 3 | L3 PrismaStore | Immutable Asset get/set、Generated Result get/set/invalidate/expire |
| 4 | 分层 Fallback | L1→L2→L3 逐级查询 + 回写 |
| 5 | 分层写入 | 按安全分级决定写入层级 |
| 6 | 缓存 Key | GLOI 4 维度 + schema_version + namespace |
| 7 | 安全分级 | PUBLIC 全层级 / RESTRICTED 带隔离 / PROHIBITED 拒绝 |
| 8 | 异常处理 | Redis 不可用→跳过 L2、Prisma 不可用→跳过 L3 |
| 9 | 事件驱动失效 | 订阅 `asset.updated` / `asset.deleted` / `asset.archived` |
| 10 | 指标收集 | CacheStats 准确性验证 |
| 11 | 命名空间隔离 | 不同 namespace 互不干扰 |
| 12 | 容量管控 | L3 配额超限淘汰 |
| 13 | 负缓存 | 不存在 Key 写入短 TTL + 自动过期 |
| 14 | Single Flight | 同一 Key 并发请求仅一次回源 |
| 15 | TTL 抖动 | 所有 TTL 叠加 ±20% 随机偏移 |
| 16 | 审计事件 | cache.invalidated / cache.evicted / cache.write_rejected 正确发布 |
| 17 | 禁止缓存清单 | PROHIBITED 数据写入拦截 + 审计事件 |
| 18 | 强制刷新鉴权 | 未授权强制刷新被拒绝 |

---

## 14. Implementation Readiness Gate Summary

### 14.1 闸门总体状态

| 闸门项 | 优先级 | 类型 | 状态 |
|--------|--------|------|------|
| #1 ICacheStore v1.0 接口契约冻结 | 🔴 高 | 契约冻结 | ✅ 已完成 |
| #2 CacheEntry v1.0 Schema 分级冻结 | 🔴 高 | 契约冻结 | ✅ 已完成 |
| #3 缓存治理审计事件统一定义 | 🔴 高 | 治理规则 | ✅ 已完成 |
| #4 Redis 资源隔离与越权禁止 | 🔴 高 | 安全规则 | ✅ 已完成 |
| #5 缓存失效防护与故障降级 | 🟡 中 | 防护策略 | ✅ 已完成 |
| #6 缓存刷新策略与权限定义 | 🟡 中 | 治理规则 | ✅ 已完成 |
| #7 禁止缓存清单 | 🟡 中 | 安全规则 | ✅ 已完成 |

### 14.2 契约冻结总览

| 冻结资产 | 版本 | 冻结范围 | ACR 要求 |
|----------|------|----------|----------|
| ICacheStore 接口 | v1.0 | 5 个方法签名 + 参数类型 + 返回值结构 | 须 ACR |
| CacheEntry Schema | v1.0 | A 类 (7 字段) + B 类 (4 字段) 强制冻结 | 须 ACR |
| 审计事件定义 | v1.0 | 4 事件类型 + 4 拒绝原因枚举 | 须 ACR |
| Redis 隔离规则 | v1.0 | 命名空间前缀 + 淘汰策略 + 连接池隔离 | 须 ACR |
| 禁止缓存清单 | v1.0 | 8 类数据 + 强制校验规则 | 须 ACR |

### 14.3 风险防护覆盖

| 风险类型 | 防护措施 | 章节 |
|----------|----------|------|
| 缓存穿透 | 负缓存（60s TTL） | §19.1 |
| 缓存击穿 | Single Flight 锁 | §19.2 |
| 缓存雪崩 | TTL ±20% 随机抖动 | §19.3 |
| L2 故障 | 自动跳过 L2，降级 L1→L3 | §19.4 |
| L3 故障 | 自动跳过 L3，降级仅 L1 | §19.4 |
| 全层级故障 | 透传至 AI Gateway 调用模型 | §19.4 |
| 禁止数据写入 | 安全分级校验 + 拦截 + 审计 | §21 |
| 跨域污染 | 命名空间前缀硬隔离 | §18 |

---

## 15. ICacheStore v1.0 Interface Contract Freeze

### 15.1 契约声明

**接口版本**: ICacheStore v1.0
**冻结日期**: 2026-07-19
**冻结范围**: 所有方法签名、参数类型、返回值结构、异常处理模型
**所属层级**: Runtime Infrastructure Layer 标准契约
**消费者**: AI Gateway（唯一调用方）、所有后续模块

### 15.2 允许的操作

| 类别 | 允许内容 | 说明 |
|------|----------|------|
| 新增存储实现类 | 新增 Adapter 实现 ICacheStore 接口 | 如：`RedisClusterStore`、`MemcachedStore` |
| 新增独立扩展接口 | 新增与 ICacheStore 解耦的 Extension Interface | 如：`ISemanticCacheExtension`、`ICacheWarmupExtension` |
| 运行时元数据扩展 | 通过 `CacheEntry.metadata` 字段扩展 | 不修改核心 Schema |

### 15.3 禁止的操作

| 类别 | 禁止内容 | 后果 |
|------|----------|------|
| 修改方法签名 | `get` / `set` / `invalidate` / `invalidatePattern` / `getStats` 的参数与返回值 | 破坏所有实现类兼容性 |
| 修改返回值结构 | `CacheEntry` / `CacheStats` 的字段类型与语义 | 破坏上游消费者 |
| 修改异常处理模型 | 同步/异步语义变更、异常类型变更 | 破坏调用方错误处理 |
| 追加方法 | 直接向 ICacheStore v1.0 主接口追加新方法 | 破坏接口版本语义 |
| 移除方法 | 删除已有方法 | 破坏契约完整性 |

### 15.4 版本演进路径

```
ICacheStore v1.0 (Phase 1)
    │
    ├── 新增实现类: MemoryStore / RedisStore / PrismaStore ✅
    ├── 新增扩展接口: ISemanticCacheExtension (Phase 2) ✅
    │
    └── 接口升级 → ICacheStore v2.0
        └── 须提交 ACR
        └── 须保留 v1.0 实现类兼容
        └── 须提供迁移方案
```

---

## 16. CacheEntry v1.0 Data Schema Tiered Freeze

### 16.1 分级冻结声明

**Schema 版本**: CacheEntry Schema v1.0
**冻结日期**: 2026-07-19
**按字段性质分三级治理**：

### 16.2 A 类 — Identity Fields（身份核心字段）🔒 强制冻结

| 字段 | 类型 | 说明 | 变更影响 |
|------|------|------|----------|
| `id` | string (UUID) | 缓存条目唯一标识 | 变更破坏所有引用 |
| `cacheKey` | string | 缓存 Key | 变更破坏查询逻辑 |
| `namespace` | string | 命名空间（§6） | 变更破坏隔离规则 |
| `schemaVersion` | number | Schema 版本号 | 变更破坏版本管理 |
| `cacheType` | CacheType | 缓存类型（Immutable Asset / Generated Result） | 变更破坏治理策略 |
| `securityLevel` | CacheSecurityLevel | 安全等级（PUBLIC / RESTRICTED / PROHIBITED） | 变更破坏安全规则 |
| `sourceModule` | string | 来源模块标识 | 变更破坏审计追溯 |

**冻结规则**: 不得修改、删除、重命名以上任何字段。新增 A 类字段须走 ACR。

### 16.3 B 类 — Ownership Fields（所有权隔离字段）🔒 强制冻结

| 字段 | 类型 | 说明 | 变更影响 |
|------|------|------|----------|
| `tenantId` | string? | 租户隔离标识 | 变更破坏多租户隔离 |
| `userId` | string? | 用户隔离标识 | 变更破坏用户数据隔离 |
| `dataScope` | 'personal' \| 'platform' | 数据域 | 变更破坏 Dual-Track 隔离 |
| `assetId` | string? | 关联资产 ID | 变更破坏失效联动 |

**冻结规则**: 不得修改、删除、重命名以上任何字段。新增 B 类字段须走 ACR。

### 16.4 C 类 — Runtime Metadata（运行时元数据）🟡 可演进

| 字段 | 类型 | 说明 | 演进规则 |
|------|------|------|----------|
| `accessCount` | number | 访问次数 | 可扩展统计维度 |
| `lastAccessedAt` | string? | 最后访问时间 | 可调整精度 |
| `createdAt` | string | 创建时间 | 不建议修改 |
| `expiresAt` | string? | 过期时间 | 可调整默认值 |
| `archivedAt` | string? | 归档时间 | 可调整策略 |

**演进规则**: 允许通过 `metadata` 扩展新增字段，不得修改核心语义。新增 C 类字段可通过 ACR 扩展。

### 16.5 新增字段规则

- 后续新增非核心字段可通过 ACR 扩展，不得修改、删除、重命名 A/B 两类冻结字段
- `sourceModule` 为本次闸门强制补充字段，用于追溯缓存生成方，纳入审计与治理维度
- 新增字段建议放入 `metadata` JSON 对象，避免频繁修改 Schema

---

## 17. Cache Governance Audit Events

### 17.1 审计事件定义

所有审计事件遵循 Standard Envelope 标准格式，复用 Event Bus v1.0 已冻结合约。事件通过 Event Bus 发布，自动进入审计链路。

### 17.2 必须审计的治理事件

| 事件类型 | 触发条件 | Payload | 审计级别 |
|----------|----------|---------|----------|
| `cache.invalidated` | 主动失效缓存（事件驱动、手动触发） | `{ cacheKey, namespace, reason, invalidatedCount, operator }` | WARNING |
| `cache.evicted` | 容量 / TTL 触发的淘汰事件 | `{ cacheKey, namespace, reason, tier, evictedCount }` | INFO |
| `cache.schema_migrated` | 缓存 Schema 版本迁移事件 | `{ fromVersion, toVersion, migratedCount, namespace }` | WARNING |
| `cache.write_rejected` | 写入被拦截统一事件 | `{ cacheKey, namespace, reason, securityLevel, sourceModule }` | ERROR |

### 17.3 cache.write_rejected 拒绝原因枚举

| 原因代码 | 说明 | 触发条件 |
|----------|------|----------|
| `PROHIBITED_DATA` | 命中禁止缓存清单 | 写入内容安全等级为 PROHIBITED |
| `INVALID_NAMESPACE` | 命名空间未注册 | 使用的 namespace 未在本文档 §6.2 注册 |
| `SCHEMA_MISMATCH` | Schema 版本不兼容 | schemaVersion 不在支持的版本范围内 |
| `SIZE_LIMIT` | Payload 超大小限制 | 缓存条目 value 超过 64KB 上限 |

### 17.4 不进入审计的高频事件

以下事件仅做指标统计，不写入审计日志，避免日志量级爆炸：

| 事件 | 处理方式 |
|------|----------|
| 普通缓存命中 | 仅更新 `CacheStats.hitCount` |
| 普通缓存写入成功 | 仅更新 `CacheStats` |
| 普通缓存未命中 | 仅更新 `CacheStats.missCount` |

### 17.5 审计事件 Envelope 示例

```typescript
// cache.write_rejected 事件
{
  event_id: "uuid-v7",
  timestamp: "2026-07-19T12:00:00.000Z",
  source: "cache-manager",
  trace_id: "trace-xxx",
  payload: {
    cacheKey: "learning.lesson.generate:hash123",
    namespace: "learning.lesson.generate",
    reason: "PROHIBITED_DATA",
    securityLevel: "PROHIBITED",
    sourceModule: "ai-gateway"
  }
}
```

---

## 18. Redis Resource Isolation and Cross-Domain Prohibition

### 18.1 命名空间硬隔离

| 域 | Key 前缀 | 用途 | 负责人 |
|-----|----------|------|--------|
| 缓存域 | `ailos:cache:*` | L2 缓存存储 | CacheManager |
| 状态域 | `ailos:state:*` | 运行时状态存储 | StateManager |

**硬隔离规则**: 两个前缀互不交叉，任何 Key 不得同时匹配两个前缀。

### 18.2 淘汰策略隔离

| 域 | 淘汰策略 | 原因 |
|-----|----------|------|
| 缓存 L2 | `volatile-lru` | 仅对设置 TTL 的键按 LRU 淘汰，未设 TTL 的键永久保留 |
| 状态存储 | `noeviction` | 禁止自动淘汰，保障状态数据不丢失，写满时返回错误 |

**实施方式**: 缓存 L2 所有 Key 写入时均设置 TTL（通过 Redis `EXPIRE`），依赖 `volatile-lru` 自动淘汰。不修改 Redis 全局 `maxmemory-policy` 配置。

### 18.3 跨域操作严格禁止

| 禁止操作 | 说明 | 风险 |
|----------|------|------|
| 操作 `ailos:state:*` Key | Cache Layer 不得读取/写入/删除任何 State 域 Key | 状态数据损坏 |
| 复用 StateManager 连接池 | Cache 必须使用独立 Redis 连接 | 连接池耗尽互相影响 |
| 修改 State 域 Key TTL | 不得修改状态数据的过期时间 | 状态数据意外丢失 |
| 跨 namespace Lua Script | 不得执行跨 `ailos:cache:*` 和 `ailos:state:*` 的 Lua 脚本 | 原子性破坏 |

### 18.4 连接池规范

```typescript
// 缓存专用 Redis 连接配置
const cacheRedisOptions = {
  host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST,
  port: process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT,
  db: 1,  // 缓存专用 DB 编号，与 State (db:0) 隔离
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  // 独立连接池，不与 StateManager 共享
};
```

### 18.5 资源配额保护

| 保护措施 | 说明 |
|----------|------|
| Key 前缀配额 | 预留 `ailos:cache:*` 前缀最大内存使用量 |
| 用量告警 | 缓存用量超过阈值（如 70%）触发告警 |
| 禁止挤占 | 缓存用量不得挤占 `ailos:state:*` 状态存储资源 |

---

## 19. Cache Failure Protection and Degradation Strategy

### 19.1 缓存穿透防护 — 负缓存

**问题**: 不存在的 Key 持续请求，每次都穿透到模型调用。

**方案**: 不存在的结果写入短 TTL 负缓存（默认 60s），标记为 `cacheType = null`。

```typescript
// 负缓存条目
{
  cacheKey: "negative:learning.lesson.generate:hash123",
  cacheType: null,  // 标记为负缓存
  value: { _negative: true },
  expiresAt: Date.now() + 60_000,  // 60s
}
```

**规则**:
- 负缓存仅写入 L1 MemoryStore，不写入 L2/L3
- 实际结果写入时自动覆盖负缓存条目
- 负缓存 TTL 可配置，默认 60 秒

### 19.2 缓存击穿防护 — Single Flight 锁

**问题**: 热点 Key 同时失效，大量并发请求同时回源。

**方案**: 同一 Key 同一时间仅允许一个请求回源，其余请求等待结果。

```typescript
// Single Flight 锁实现
class CacheManager {
  private inFlightRequests: Map<string, Promise<CacheEntry | null>> = new Map();

  async get(key: string): Promise<CacheEntry | null> {
    // ... L1/L2/L3 查询 ...
    if (miss) {
      // 检查是否已有进行中的请求
      if (this.inFlightRequests.has(key)) {
        return this.inFlightRequests.get(key)!;  // 等待已有请求
      }
      // 创建新请求
      const promise = this.fetchFromSource(key);
      this.inFlightRequests.set(key, promise);
      try {
        return await promise;
      } finally {
        this.inFlightRequests.delete(key);
      }
    }
  }
}
```

**规则**:
- 锁粒度：按 cacheKey 级别
- 等待超时：30 秒（超时后放行新请求）
- 锁仅应用于 L1 未命中后的回源请求

### 19.3 缓存雪崩防护 — TTL 随机抖动

**问题**: 大量 Key 同时过期，集中回源导致数据库 / 模型压力。

**方案**: 所有 TTL 配置默认叠加 ±20% 随机偏移。

```typescript
function applyJitter(ttlSeconds: number): number {
  const jitter = ttlSeconds * 0.2;  // ±20%
  const offset = (Math.random() - 0.5) * 2 * jitter;
  return Math.max(1, Math.round(ttlSeconds + offset));
}
```

**示例**:
| 原始 TTL | 抖动范围 | 实际 TTL |
|----------|----------|----------|
| 900s (15min) | 720s - 1080s | 12-18min |
| 3600s (1h) | 2880s - 4320s | 48-72min |
| 86400s (24h) | 69120s - 103680s | 19.2-28.8h |

### 19.4 存储故障降级

**核心原则**: 缓存故障仅降级性能，绝不中断业务可用性。

| 故障场景 | 降级策略 | 影响 |
|----------|----------|------|
| L2 Redis 不可用 | 自动跳过 L2，降级为 L1 → L3 查询链路 | 性能下降，L3 压力增加 |
| L3 数据库不可用 | 自动跳过 L3，降级为仅 L1 查询 | 缓存命中率下降 |
| L2 + L3 同时不可用 | 仅 L1 查询 | 命中率显著下降 |
| 全层级故障 | 直接返回 null，透传至 AI Gateway 调用模型 | 性能正常，成本增加 |

**降级检测**:
- Redis 连接失败 / 超时（3 次重试后）→ 标记 L2 不可用，60 秒后自动重试
- Prisma 连接失败 / 查询超时 → 标记 L3 不可用，60 秒后自动重试
- 降级状态通过 `CacheStats` 暴露

**故障恢复**:
- 每 60 秒自动探测不可用层级
- 探测成功 → 自动恢复该层级
- 不可用期间不阻塞请求

---

## 20. Cache Refresh Strategy and Permission Definition

### 20.1 三类刷新模式

| 模式 | 触发方式 | 适用场景 | Phase 1 状态 |
|------|----------|----------|-------------|
| **懒加载刷新（Lazy Refresh）** | 缓存失效后由下一次用户请求触发重新生成 | 默认模式，所有场景 | ✅ 已落地 |
| **后台预热刷新（Background Refresh）** | 低峰期后台主动刷新预热 | Top N 热门资产、系统级模板 | 🔮 Phase 2 预留 |
| **强制刷新（Forced Refresh）** | 资产更新事件 / 管理员操作 | 资产变更后的缓存一致性保障 | ✅ 已落地 |

### 20.2 懒加载刷新（Lazy Refresh）

- **默认模式**: 所有缓存失效后，由下一次用户请求触发重新生成
- **权限要求**: 无特殊权限要求（用户正常请求即为触发条件）
- **流程**: 用户请求 → 缓存未命中 → 调用模型 → 结果写入缓存

### 20.3 强制刷新（Forced Refresh）

**合法触发来源**:
| 来源 | 触发方式 | 权限校验 |
|------|----------|----------|
| Asset Engine 资产更新事件 | `asset.updated` 事件 → 自动失效 → 懒加载刷新 | 无需额外鉴权（事件驱动） |
| System Admin Service 管理员操作 | 调用 `CacheManager.forceRefresh()` | 必须通过 Permission Manager 鉴权 |

**权限校验**:
```typescript
@RequirePermission('cache', 'force_refresh')
async forceRefresh(namespace: string, cacheKey?: string): Promise<number> {
  // 鉴权通过后执行强制刷新
}
```

**禁止行为**:
- ❌ 普通用户直接触发全局刷新
- ❌ 未鉴权的刷新接口调用
- ❌ 业务模块绕过 Permission Manager 调用强制刷新

### 20.4 后台预热刷新（Background Refresh）

**Phase 1 状态**: 架构预留，不实现代码。

**预留接口**:
```typescript
interface ICacheWarmupExtension {
  /** 预热指定资产列表 */
  warmup(assetIds: string[]): Promise<number>;
  /** 获取预热候选列表 */
  getWarmupCandidates(limit: number): Promise<string[]>;
}
```

**Phase 2 落地路径**:
1. 统计 Top N 热门资产（按访问频率）
2. 低峰期（如凌晨 2-4 点）后台主动调用模型生成并缓存
3. 预热结果标记 `sourceModule = 'cache-warmup'`

---

## 21. Forbidden Cache List

### 21.1 禁止缓存清单

**全层级绝对禁止缓存**的数据类型：

| # | 数据类型 | 说明 | 校验方式 |
|---|----------|------|----------|
| 1 | 用户密码 | 明文 / 哈希密码 | `securityLevel = PROHIBITED` |
| 2 | 身份凭证 | JWT Token、Session Token、Refresh Token | `securityLevel = PROHIBITED` |
| 3 | 权限决策结果 | 角色、权限码、鉴权结果 | `securityLevel = PROHIBITED` |
| 4 | 系统密钥与敏感配置 | API Key、加密密钥、数据库连接串 | `securityLevel = PROHIBITED` |
| 5 | 原始 Prompt 源码 | 未经脱敏的 Prompt 模板内容 | `securityLevel = PROHIBITED` |
| 6 | 支付数据 | 订单信息、支付凭证、交易记录 | `securityLevel = PROHIBITED` |
| 7 | 个人身份敏感信息 | 真实姓名、身份证号、手机号、邮箱 | `securityLevel = PROHIBITED` |
| 8 | 审计日志原始数据 | 未经脱敏的审计日志内容 | `securityLevel = PROHIBITED` |

### 21.2 强制校验规则

**写入前校验流程**:
```
CacheManager.set(key, entry)
    │
    ├── 1. 安全等级校验
    │      └── entry.securityLevel === PROHIBITED?
    │          ├── 是 → 拦截 + 发布 cache.write_rejected (reason=PROHIBITED_DATA)
    │          └── 否 → 继续
    ├── 2. 命名空间校验
    │      └── entry.namespace 是否已注册?
    │          ├── 否 → 拦截 + 发布 cache.write_rejected (reason=INVALID_NAMESPACE)
    │          └── 是 → 继续
    ├── 3. Schema 版本校验
    │      └── entry.schemaVersion 是否在支持范围内?
    │          ├── 否 → 拦截 + 发布 cache.write_rejected (reason=SCHEMA_MISMATCH)
    │          └── 是 → 继续
    ├── 4. Payload 大小校验
    │      └── JSON.stringify(entry.value).length > 64KB?
    │          ├── 是 → 拦截 + 发布 cache.write_rejected (reason=SIZE_LIMIT)
    │          └── 否 → 继续
    └── 5. 写入对应层级
```

### 21.3 校验实现

```typescript
class ForbiddenCacheGuard {
  /**
   * 校验缓存条目是否允许写入
   * @returns 校验结果，拒绝时返回原因
   */
  validate(entry: CacheEntry): { allowed: boolean; reason?: string } {
    // 1. 安全等级校验
    if (entry.securityLevel === CacheSecurityLevel.PROHIBITED) {
      return { allowed: false, reason: 'PROHIBITED_DATA' };
    }

    // 2. 命名空间校验
    if (!REGISTERED_NAMESPACES.has(entry.namespace)) {
      return { allowed: false, reason: 'INVALID_NAMESPACE' };
    }

    // 3. Schema 版本校验
    if (entry.schemaVersion < 1 || entry.schemaVersion > SUPPORTED_SCHEMA_VERSION) {
      return { allowed: false, reason: 'SCHEMA_MISMATCH' };
    }

    // 4. Payload 大小校验
    const payloadSize = JSON.stringify(entry.value).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return { allowed: false, reason: 'SIZE_LIMIT' };
    }

    return { allowed: true };
  }
}
```

---

## 22. Next Step

**申请进入 APPROVAL SIGN-OFF 阶段**: Yes

本 DESIGN PROPOSAL v2.1 已完整响应 DESIGN REVIEW 10 项修正 + IMPLEMENTATION READINESS GATE 7 项准入补充要求，覆盖：

- **契约冻结**: ICacheStore v1.0 接口 + CacheEntry v1.0 Schema 三级冻结
- **治理规则**: 审计事件定义、刷新策略、命名空间注册
- **安全防护**: 禁止缓存清单、安全分级、Redis 资源硬隔离
- **风险防护**: 缓存穿透/击穿/雪崩全覆盖 + 存储故障降级
- **GLOI 合规**: 14 项自查全部通过
- **冻结兼容**: 4/4 模块零侵入

待架构委员会核验通过后，正式签发 APPROVAL SIGN-OFF 与 IMPLEMENT 授权令。