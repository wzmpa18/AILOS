# Phase 1 Task 6 Cache L2/L3 DESIGN PROPOSAL v2.0

**Document Version**: v2.0 — DESIGN PROPOSAL (AMENDED)
**Status**: Pending RE-REVIEW
**Author**: TRAE / AI Programming Agent
**Date**: 2026-07-19
**Previous Version**: v1.0 (Commit `a885f8f`, CONDITIONAL PASS with 10 amendments)
**Governance**: AILOS v3.2.1 九阶段生命周期治理 — DESIGN Stage
**Source of Truth**: AILOS Software Architecture Blueprint v3.2.1 (唯一架构基线)

---

## 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-07-19 | 初始 DESIGN PROPOSAL 提交 |
| v2.0 | 2026-07-19 | 响应 DESIGN REVIEW RESULT (CONDITIONAL PASS)，完成全部 10 项强制修正 |

**v2.0 修正清单对照**：

| 修正项 | 优先级 | 章节 | 状态 |
|--------|--------|------|------|
| #1 GLOI 缓存 Key 维度裁剪 | 🔴 高 | §2.2, §4 | ✅ 已修正 |
| #2 L3 永久缓存分层治理 | 🔴 高 | §2.8, §5 | ✅ 已修正 |
| #3 资产更新→缓存失效事件闭环 | 🔴 高 | §2.9, §8 | ✅ 已修正 |
| #4 缓存层与状态存储边界 | 🔴 高 | §6 | ✅ 已修正 |
| #5 缓存命名空间规范 | 🔴 高 | §7 | ✅ 已修正 |
| #6 缓存数据安全分级 | 🔴 高 | §6.3 | ✅ 已修正 |
| #7 Cache Schema Version 迁移 | 🔴 高 | §2.2, §9 | ✅ 已修正 |
| #8 语义匹配阶段拆分 | 🟡 中 | §4.2 | ✅ 已修正 |
| #9 AI Gateway 集成边界标准化 | 🟡 中 | §11 | ✅ 已修正 |
| #10 缓存可观测性指标 | 🟡 中 | §10 | ✅ 已修正 |

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
14. [Next Step](#14-next-step)

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
| 上游消费者 | **AI Gateway 是唯一调用方** — 所有缓存查询由 AI Gateway 统一发起（§11 详述） |
| 下游依赖 | Redis（L2）、Prisma/MySQL（L3） |
| 事件依赖 | Event Bus v1.0 🔒 — 发布 `cache.invalidated` 事件，订阅 `asset.*` 失效事件 |
| 权限依赖 | Permission Manager v1.0 🔒 — L3 缓存内容权限校验 |
| 审计依赖 | Audit Log v1.0 🔒 — 缓存操作通过 Event Bus 自动审计 |
| 不承载 | 业务逻辑、内容生成、模型调用、命中决策、降级流转 |

### 1.3 现有代码差距分析

| 维度 | 当前状态 | 设计要求 |
|------|----------|----------|
| 文件数 | 2 个（module + service） | 9 个（类型/接口/适配器/测试） |
| L1 实现 | 内存 Map（简陋但可用） | 保留并增强（LRU + 统计） |
| L2 实现 | **无** | Redis 适配器，支持 TTL 按场景配置 |
| L3 实现 | **无** | Prisma 持久化（Immutable Asset + Generated Result 双类） |
| 分层 Fallback | **无** | L1→L2→L3 逐级查询 + 回写 |
| 语义匹配 | Jaccard 相似度（玩具） | **Phase 1 仅精确 Key 匹配**；Phase 2 引入 Embedding 语义匹配 |
| 缓存 Key | 简单 hash（无语言维度） | 4 维度 GLOI 感知 Key + schema_version |
| 命名空间 | 无 | 三级结构 `namespace.scene.action` |
| 安全分级 | 无 | 三级安全分级 + L3 专项限制 |
| 可观测性 | 无 | 5 项核心指标 |
| 测试 | **无** | 完整单元测试 |
| 设计文档 | 无 | 本文档 |

---

## 2. Architecture Design

### 2.1 核心接口：ICacheStore

```typescript
/**
 * 缓存存储抽象接口
 * Phase 1: L1 MemoryStore + L2 RedisStore + L3 PrismaStore
 * 遵循依赖倒置原则，AI Gateway 仅依赖此接口
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

interface CacheEntry {
  key: string;
  value: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
  /** 缓存层级来源 */
  tier: 'L1' | 'L2' | 'L3';
  /** 缓存 Schema 版本号（§9 详述） */
  schemaVersion: number;
  /** 语言身份哈希（GLOI 强制） */
  languageIdentityHash?: string;
  /** 命名空间（§7 详述） */
  namespace: string;
  /** 数据安全等级（§6.3 详述） */
  securityLevel: CacheSecurityLevel;
  /** 用户隔离标识（L3 用户域数据强制） */
  isolationMarkers?: CacheIsolationMarkers;
  /** 元数据 */
  metadata: CacheMetadata;
}

interface CacheMetadata {
  modelId?: string;
  promptVersion?: string;
  userContextHash?: string;
  scene: string;
  domain: string;
  /** 关联资产 ID（用于失效联动） */
  assetId?: string;
  /** 复用次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: string;
}

interface CacheIsolationMarkers {
  tenantId?: string;
  userId?: string;
  dataScope: 'personal' | 'platform';
}

enum CacheSecurityLevel {
  /** 全层级允许：公共知识资产、标准化模板 */
  PUBLIC = 'public',
  /** 受限缓存：个性化内容，须绑定用户维度隔离 */
  RESTRICTED = 'restricted',
  /** 全层级禁止：身份凭证、权限密钥、原始敏感隐私数据 */
  PROHIBITED = 'prohibited',
}
```

### 2.2 Phase 1 缓存 Key 设计（GLOI 合规）

根据 v3.2.1 蓝图 5.6.5 节缓存层红线，**Phase 1 仅纳入已落地的有效维度**：

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
| `namespace` | Cache 命名空间规范（§7） | ✅ 已落地 |
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

**版本升级路径**（§9 详述）：
- `schema_version` 从 `1` 起始
- Phase 2 新增维度时 `schema_version` 升级为 `2`，新 Key 公式纳入新维度
- 旧版本 `schema_version=1` 缓存继续可读，渐进式淘汰

### 2.3 分层查询流程

```
CacheManager.get(key, context)
    │
    ▼
┌─────────────────────────────────────────────────┐
│ L1: MemoryStore                                  │
│ TTL: 15min | 淘汰: LRU (max 1000)                │
│ 命中 → 返回 + 更新统计                           │
└──────┬──────────────────────────────────────────┘
       │ 未命中
       ▼
┌─────────────────────────────────────────────────┐
│ L2: RedisStore                                   │
│ TTL: 1-24h (按场景) | 淘汰: Redis TTL 到期       │
│ 命中 → 回写 L1 → 返回 + 更新统计                 │
└──────┬──────────────────────────────────────────┘
       │ 未命中
       ▼
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

### 2.4 文件结构

```
src/infrastructure/cache/
├── cache.types.ts              # 所有类型、接口、常量、枚举
├── cache.provider.ts           # Symbol DI Token (ICACHE_STORE)
├── cache.service.ts            # CacheManager 门面服务（分层编排 + 指标收集）
├── cache.module.ts             # @Global() Module 注册 + DI 绑定
├── stores/
│   ├── memory-store.ts         # L1 内存存储（改造现有实现）
│   ├── redis-store.ts          # L2 Redis 存储
│   └── prisma-store.ts         # L3 持久化存储（双类治理）
├── index.ts                    # Barrel Export（MemoryStore 不对外暴露）
└── cache.spec.ts               # 单元测试
```

### 2.5 L1 MemoryStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | 进程内存 Map |
| 最大容量 | 1000 条 |
| TTL | 默认 900 秒（15 分钟） |
| 淘汰策略 | LRU（容量超限时淘汰最早过期 50%） |
| 新增能力 | 命中率统计、访问计数、namespace 维度统计 |
| 职责边界 | 仅临时存储 AI 生成结果、资源计算产物、可重算中间数据（§6 详述） |

### 2.6 L2 RedisStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | Redis（`ioredis` 已安装） |
| TTL | 按场景配置：translation=24h, question=12h, content=1h, default=1h |
| 淘汰策略 | Redis TTL 自动过期 |
| Key 命名空间 | `ailos:cache:l2:{namespace}:{hash}`（与 State Manager `ailos:state:*` 隔离） |
| Phase 1 匹配方式 | **精确 Key 匹配**（语义匹配为 Phase 2 能力） |
| 语义匹配扩展点 | 预留 `semanticMatch()` 接口签名，Phase 1 返回 null |

### 2.7 L3 PrismaStore 设计

L3 拆分为两类独立缓存，分别执行独立生命周期策略：

#### 2.7.1 Immutable Asset Cache（不可变资产缓存）

| 属性 | 值 |
|------|------|
| 存储内容 | 审核通过的公共知识资产、标准化模板、系统级 Prompt 模板 |
| TTL | `None`（永久），生命周期跟随资产生命周期同步管控 |
| 淘汰触发 | 资产状态变更（`asset.updated` / `asset.deleted` / `asset.archived`）→ 主动失效 |
| 安全等级 | `PUBLIC` — 全层级允许 |
| 隔离 | 无用户隔离，全局共享 |

#### 2.7.2 Generated Result Cache（生成结果缓存）

| 属性 | 值 |
|------|------|
| 存储内容 | AI 生成的个性化习题、对话回复、翻译结果、学习内容 |
| TTL | 可配置，默认 30 天 |
| 淘汰触发 | TTL 到期 + 容量管控（复用率低于阈值自动降级归档） |
| 安全等级 | `RESTRICTED` — 须绑定用户维度隔离 |
| 隔离 | 强制携带 `tenant_id + user_id + data_scope` 三级隔离标识 |

#### 2.7.3 L3 容量治理规则

| 规则 | 阈值 | 动作 |
|------|------|------|
| 复用率低于阈值 | 30 天内访问次数 < 2 | 自动降级归档（标记 `archived`，不删除） |
| 单租户存储配额 | 可配置，默认 10,000 条 | 超配额时淘汰最旧未访问条目 |
| 单用户存储配额 | 可配置，默认 1,000 条 | 超配额时淘汰最旧未访问条目 |

### 2.8 Prisma Schema 扩展

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

### 2.9 缓存失效契约

缓存失效遵循 **Event Bus 标准事件体系**，定义以下失效契约：

| 事件类型 | 触发条件 | 失效范围 | 策略 |
|----------|----------|----------|------|
| `asset.updated` | 公共资产内容更新 | 该 `assetId` 关联的所有 L2/L3 缓存条目 | 立即失效 + 通知 |
| `asset.deleted` | 公共资产删除 | 该 `assetId` 关联的所有 L1/L2/L3 缓存条目 | 立即失效 + 日志 |
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

**兜底逻辑**：
- 失效操作失败时，缓存条目进入「待清理」队列，后台重试 3 次
- 3 次重试均失败，记录 Error 级别日志，人工介入
- 失效操作不阻塞资产更新主流程（异步执行）

### 2.10 与 AI Gateway 的集成契约（精简版，§11 详述）

```
AI Gateway (决策层)                    Cache Manager (执行层)
     │                                       │
     │  cacheManager.get(key)                │
     │──────────────────────────────────────>│
     │                                       │ L1→L2→L3 逐级查询
     │  CacheEntry | null                    │
     │<──────────────────────────────────────│
     │                                       │
     │  cacheManager.set(key, entry)         │
     │──────────────────────────────────────>│
     │                                       │ 按安全分级决定写入层级
     │  void                                 │
     │<──────────────────────────────────────│
```

---

## 3. Phase 1 / Phase 2 Capability Boundary Declaration

### 3.1 Phase 1 落地能力

| 能力 | 说明 | 实现方式 |
|------|------|----------|
| ICacheStore 接口抽象 | 统一缓存存储抽象 | 接口 + 3 个适配器 |
| L1 MemoryStore | 内存 LRU 缓存 | 改造现有 `CacheService` |
| L2 RedisStore | Redis 精确 Key 匹配 | `ioredis` 适配器 |
| L3 PrismaStore | 双类持久化缓存 | Prisma `cache_entries` 表 |
| 分层 Fallback | L1→L2→L3 逐级查询 + 回写 | `CacheManager.get()` |
| 缓存 Key v1 | 4 维度 + schema_version | `buildCacheKey()` |
| 命名空间隔离 | 三级结构 `namespace.scene.action` | Key 前缀 |
| 安全分级 | PUBLIC / RESTRICTED / PROHIBITED | `CacheSecurityLevel` |
| 用户隔离 | tenant_id + user_id + data_scope | `CacheIsolationMarkers` |
| 事件驱动失效 | 订阅 `asset.*` 事件 | `@OnEvent` 装饰器 |
| 可观测性 | 5 项核心指标 | `CacheStats` 收集 |
| 失效契约 | 3 类资产事件 + 兜底逻辑 | `CacheManager` 内置 |

### 3.2 Phase 2 架构预留

| 能力 | 预留方式 | 落地路径 |
|------|----------|----------|
| 语义匹配（Embedding 向量相似度） | `ICacheStore.semanticMatch()` 接口签名预留，Phase 1 返回 null | 向量数据库选型 + Embedding API 接入 |
| `translation_memory_version` 维度 | Key 公式预留字段，Phase 1 不参与计算 | GLOI Translation Memory Service 落地后启用 |
| `terminology_set_version` 维度 | Key 公式预留字段，Phase 1 不参与计算 | GLOI Terminology Service 落地后启用 |
| `culture_profile_version` 维度 | Key 公式预留字段，Phase 1 不参与计算 | GLOI Language Intelligence Service 落地后启用 |
| 缓存 Key 版本升级 | `schema_version` 字段，升级路径 §9 定义 | Phase 2 新增维度时升级至 v2 |
| L3 策略引擎 | 淘汰策略配置化接口预留 | 策略引擎模块落地后接入 |
| 缓存预热 | 接口预留，Phase 1 不做实现 | 高频资产预加载 |

### 3.3 语义匹配扩展点定义

```typescript
/**
 * Semantic Cache Extension Point（语义缓存扩展点）
 * Phase 1: 接口定义 + 返回 null
 * Phase 2: Embedding API 接入 + 向量相似度计算
 */
interface ISemanticCacheExtension {
  /**
   * 语义匹配查询
   * @param embedding 查询向量
   * @param threshold 相似度阈值（蓝图规定 ≥ 0.92）
   * @returns Phase 1 始终返回 null；Phase 2 返回匹配结果
   */
  semanticMatch(embedding: number[], threshold: number): Promise<CacheEntry | null>;
}
```

Phase 1 实现：
```typescript
// Phase 1: 仅保留接口签名，不做实现
async semanticMatch(embedding: number[], threshold: number): Promise<CacheEntry | null> {
  this.logger.debug('[SemanticCache] Extension point not yet implemented (Phase 2)');
  return null;
}
```

---

## 4. Cache Storage Governance Strategy

### 4.1 三级存储分层规则

| 层级 | 存储内容 | TTL | 淘汰策略 | 负责人 |
|------|----------|-----|----------|--------|
| L1 Memory | 热点内容、高频翻译、热门模板 | 15 分钟 | LRU（容量 1000） | CacheManager |
| L2 Redis | AI 生成结果、会话缓存、用户上下文 | 1-24 小时（按场景） | Redis TTL 到期 | CacheManager |
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
| RedisStorageAdapter (State) | 共享 Redis | 命名空间隔离：`ailos:cache:l2:*` vs `ailos:state:*` |
| MemoryStore (AuditLog) | 不同职责 | AuditLog MemoryStore 存储审计日志，Cache MemoryStore 存储 AI 结果 |
| PrismaService | 下游依赖 | Cache 仅操作 `cache_entries` 表，不跨表操作 |

### 5.3 可缓存数据安全分级

#### 三级安全等级

| 等级 | 标识 | 定义 | 允许的存储层级 |
|------|------|------|---------------|
| **PUBLIC** | 🟢 | 公共知识资产、标准化模板、通用习题、系统 Prompt | L1 + L2 + L3 全层级 |
| **RESTRICTED** | 🟡 | 个性化学习内容、AI 生成对话、翻译结果 | L1 + L2 + L3（须绑定用户隔离） |
| **PROHIBITED** | 🔴 | 身份认证凭证、权限密钥、原始敏感隐私数据 | **全层级禁止** |

#### L3 存储专项限制

| 允许存储 | 禁止存储 |
|----------|----------|
| 公共知识资产 | 身份认证数据（JWT、Session Token） |
| 脱敏后的生成资产 | 权限数据（角色、权限码） |
| 用户隔离后的长期学习资源快照 | 原始用户隐私数据（密码、手机号、邮箱） |
| 标准化模板 | 审计日志原始数据 |
| 系统 Prompt 模板 | 任何 PROHIBITED 等级数据 |

#### 用户域数据隔离标识

所有 `RESTRICTED` 等级缓存数据必须携带三级隔离标识：

```typescript
{
  tenantId: string;     // 租户隔离
  userId: string;       // 用户隔离
  dataScope: 'personal' | 'platform';  // 数据域隔离
}
```

---

## 6. Cache Namespace Specification

### 6.1 命名空间结构

所有缓存 Key 必须携带 `namespace` 前缀，采用 **「域。场景。动作」** 三级结构：

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
- 新增命名空间须在本文档注册，未经注册的命名空间默认使用 `default` 策略
- 命名空间变更不影响已有缓存数据（通过 `schema_version` 管理）

---

## 7. Cache Invalidation Contract

### 7.1 事件订阅

Cache Manager 通过 Event Bus 订阅以下事件，实现资产变更驱动的缓存失效：

| 事件类型 | 订阅方式 | 失效范围 | 延迟 |
|----------|----------|----------|------|
| `asset.updated` | `@OnEvent('asset.updated')` | 该 `assetId` 关联的所有 L2/L3 条目 | 即时 |
| `asset.deleted` | `@OnEvent('asset.deleted')` | 该 `assetId` 关联的所有 L1/L2/L3 条目 | 即时 |
| `asset.archived` | `@OnEvent('asset.archived')` | 该 `assetId` 关联的所有 L2/L3 条目 | 7 天宽限期 |

### 7.2 失效事件发布

Cache Manager 在主动失效操作完成后发布事件：

| 事件类型 | Payload | 用途 |
|----------|---------|------|
| `cache.invalidated` | `{ cacheKey, namespace, reason, invalidatedCount }` | 通知 Audit Log 记录缓存失效操作 |

### 7.3 失效范围定义

| 触发条件 | L1 动作 | L2 动作 | L3 动作 |
|----------|---------|---------|---------|
| `asset.updated` | 不处理（L1 短 TTL 自动过期） | 立即删除该 assetId 关联条目 | 标记过期 + 记录失效日志 |
| `asset.deleted` | 立即删除该 assetId 关联条目 | 立即删除该 assetId 关联条目 | 立即删除该 assetId 关联条目 |
| `asset.archived` | 不处理 | 标记过期（7 天宽限期） | 标记过期（7 天宽限期） |

### 7.4 兜底校验逻辑

```
失效操作失败
    │
    ├── 第 1 次重试（立即）
    ├── 第 2 次重试（5 秒后）
    ├── 第 3 次重试（30 秒后）
    │
    └── 3 次均失败 → 记录 Error 日志 + 人工介入
        {
          event_id: "...",
          cacheKey: "...",
          reason: "INVALIDATION_FAILED",
          retryCount: 3,
          timestamp: "..."
        }
```

### 7.5 定期巡检

- 每 6 小时执行一次全量巡检
- 清理已过期但未被事件驱动的残留缓存条目
- 巡检结果记录至 Audit Log

---

## 8. Cache Version Migration Plan

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
    │
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
    │
    ├── 1. 回滚代码至旧版本（schema_version = N）
    ├── 2. 新版本缓存（schema_version = N+1）继续可读
    │      └── 旧版本代码通过 try/catch 兼容读取新版本 Key
    ├── 3. 新请求写入旧版本
    └── 4. 新版本缓存按 TTL 自然过期
```

---

## 9. Cache Observability Metrics

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

所有指标按以下维度拆分，支持看板化展示：

| 维度 | 说明 |
|------|------|
| 层级 | L1 / L2 / L3 |
| 命名空间 | `learning.lesson.generate` 等 |
| 缓存类型 | Immutable Asset / Generated Result |
| 时间窗口 | 1h / 24h / 7d / 30d |

### 9.3 指标数据结构

```typescript
interface CacheStats {
  /** 按层级统计 */
  byTier: {
    L1: TierStats;
    L2: TierStats;
    L3: TierStats;
  };
  /** 按命名空间统计 */
  byNamespace: Record<string, TierStats>;
  /** 累计指标 */
  cumulative: {
    totalHits: number;
    totalMisses: number;
    totalTokensSaved: number;
    totalEstimatedCostSaved: number;
    totalEvictions: number;
    totalInvalidated: number;
  };
}

interface TierStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  invalidatedCount: number;
  avgLatencyMs: number;
}
```

### 9.4 指标暴露方式

- 通过 `CacheManager.getStats()` 获取实时指标
- 指标数据通过 Event Bus 定期发布 `cache.stats.report` 事件（每小时）
- Phase 2 接入 AI Operation Center 看板展示

---

## 10. AI Gateway Integration Boundary

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
| **CacheManager** | Infrastructure | 存储执行：分层查询、分层写入、Key 管理、失效处理 |
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
        │                                     │ 3. L2 RedisStore.get()
        │                                     │    ├─ 命中 → writeback L1 → return
        │                                     │    └─ 未命中 ↓
        │                                     │ 4. L3 PrismaStore.get()
        │                                     │    ├─ 命中 → writeback L2 → writeback L1 → return
        │                                     │    └─ 未命中 → return null
        │  5. CacheEntry | null               │
        │<────────────────────────────────────│
        │                                     │
        │  [未命中 → AI Gateway 调用模型]      │
        │                                     │
        │  6. set(key, entry, tiers)          │
        │────────────────────────────────────>│
        │                                     │ 7. 按安全分级 + tiers 决定写入层级
        │                                     │    ├─ PUBLIC → L1 + L2 + L3
        │                                     │    └─ RESTRICTED → L1 + L2 + L3 (带隔离)
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
| 1 | 禁止将语言硬编码进类名、模块名、服务名、事件类型 | ✅ 合规 | `CacheManager`、`ICacheStore`、`MemoryStore`、`RedisStore`、`PrismaStore` 均无语言标识 |
| 2 | 禁止按语言拆分服务 | ✅ 合规 | 统一 CacheManager，语言身份通过 `languageIdentityHash` 参数驱动 |
| 3 | 禁止按语言拆分数据表 | ✅ 合规 | 单一 `cache_entries` 表，通过 `languageIdentityHash` 字段区分 |
| 4 | 禁止在业务表内新增独立 `language_code` 字段 | ✅ 合规 | 使用 `languageIdentityHash`（哈希），非 `language_code` |
| 5 | 禁止创建 `xxx_translations`、`language_mapping` 碎片化中间表 | ✅ 合规 | 无翻译表、无映射表 |
| 6 | 缓存 Key 必须包含完整语言维度与资产版本 | ✅ 合规 | Phase 1 Key 包含 `language_identity_hash + user_context_hash`；`translation_memory_version` 等 Phase 2 维度已预留 |
| 7 | 禁止业务模块在 Prompt 中硬编码语言角色 | ✅ 合规 | Cache 不生成 Prompt，语言角色由 AI Gateway Language Resolver 负责 |
| 8 | 语言版本是独立资产，接入权限体系 | ✅ 合规 | L3 缓存按 `dataScope` 隔离，接入 Permission Manager |
| 9 | 语言主键单一原则 | ✅ 合规 | 通过 `languageIdentityHash` 关联 |
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
| 依赖方式 | L3 缓存按 `dataScope` 隔离，查询时通过 Permission Manager 校验读取权限 |
| 调用接口 | `PermissionGuard` + `@RequirePermission` 装饰器 |
| 是否修改 | **否** — 仅作为消费者调用公开 API |
| 事件依赖 | 订阅 `permission.revoked` / `role.unassigned` → 失效对应用户个性化缓存 |
| 兼容性 | **完全兼容** |

### 12.2 Event Bus v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 发布 `cache.invalidated` 事件；订阅 `asset.*` 事件 |
| 调用接口 | `@OnEvent()` 装饰器 + `IEventBus.publish()` |
| EventEnvelope | 从 `../permission/permission.types` 导入，单一来源 |
| 已知偏差 | DEV-AUDIT-001：`*` 通配符不生效，订阅使用显式前缀 `asset.*` |
| 是否修改 | **否** |
| 兼容性 | **完全兼容**（已知偏差不阻塞） |

### 12.3 Audit Log Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 缓存操作通过 Event Bus 发布 `cache.invalidated` 事件，自动被 Audit Log 捕获 |
| 调用接口 | 不直接调用 Audit Log API |
| 是否修改 | **否** |
| 兼容性 | **完全兼容** |

### 12.4 State Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 无直接依赖，共享 Redis 基础设施 |
| 命名空间隔离 | Cache L2: `ailos:cache:l2:*` vs State: `ailos:state:*` |
| 职责边界 | Cache 不存储状态，StateManager 不缓存 AI 结果（§6 详述） |
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
| `cache.types.ts` | ICacheStore、CacheEntry、CacheMetadata、CacheStats、CacheSecurityLevel、CacheIsolationMarkers 等 |
| `cache.provider.ts` | ICACHE_STORE Symbol DI Token |
| `cache.service.ts` | CacheManager 门面：分层查询编排 + 分层写入 + 指标收集 + 事件订阅/发布 |
| `cache.module.ts` | @Global() 模块，注入 L1/L2/L3 存储适配器 |
| `stores/memory-store.ts` | L1 内存存储（改造现有实现，移除 CacheRetrievalService 重复 L1） |
| `stores/redis-store.ts` | L2 Redis 存储（精确 Key 匹配） |
| `stores/prisma-store.ts` | L3 持久化存储（双类治理：Immutable Asset + Generated Result） |
| `index.ts` | Barrel Export（MemoryStore 不对外暴露，仅通过 DI 注入） |
| `cache.spec.ts` | 单元测试 |

### 13.2 实现约束

- ❌ 不修改任何已冻结模块代码
- ❌ L3 `cache_entries` 为唯一新增数据库表
- ❌ L2 Redis key 命名空间与 State Manager `ailos:state:*` 隔离
- ❌ Phase 1 不实现语义匹配（仅保留接口签名）
- ✅ 所有实现遵循 Language Neutral Principle
- ✅ 缓存 Key 包含 Phase 1 GLOI 4 维度 + schema_version
- ✅ 所有 Commit 携带 `[cache][arch-check]` 双标签

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

---

## 14. Next Step

**申请进入 REVIEW 阶段**: Yes

本 DESIGN PROPOSAL v2.0 已完整响应 10 项强制修正项，覆盖架构定位、接口设计、Phase 1/2 边界、存储治理、安全分级、命名空间、失效契约、版本迁移、可观测性、AI Gateway 集成边界、GLOI 合规自查、冻结模块兼容性分析。待总工程师 / 架构委员会复审通过后进入 APPROVAL → IMPLEMENT 流程。