# Phase 1 Task 6 Cache L2/L3 DESIGN PROPOSAL

**Document Version**: v1.0 — DESIGN PROPOSAL
**Status**: Pending REVIEW
**Author**: TRAE / AI Programming Agent
**Date**: 2026-07-19
**Governance**: AILOS v3.2.1 九阶段生命周期治理 — DESIGN Stage
**Source of Truth**: AILOS Software Architecture Blueprint v3.2.1 (唯一架构基线)

---

## 目录

1. [Module Positioning](#1-module-positioning)
2. [Architecture Design](#2-architecture-design)
3. [GLOI v3.2.1 Compliance Checklist](#3-gloi-v321-compliance-checklist)
4. [Frozen Module Compatibility Analysis](#4-frozen-module-compatibility-analysis)
5. [Implementation Plan](#5-implementation-plan)

---

## 1. Module Positioning

### 1.1 层级定位

Cache L2/L3 位于 AILOS **Runtime Infrastructure Layer**，是实现「缓存优先 (Cache-First)」原则的**核心成本控制组件**。根据 v3.2.1 蓝图（第 348-352 行），所有 AI 生成内容必须先查三级缓存，缓存未命中再调用模型，支持语义级缓存匹配（向量相似度 >= 0.92 强制命中）。

```
┌────────────────────────────────────────────────────────────────┐
│                      AI LAYER (AI Gateway)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  五级降级决策矩阵                                          │  │
│  │  Priority 1: 缓存命中 → Priority 2: 模板 → ... → Priority 5: 兜底│
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │ 调用                                │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│              RUNTIME INFRASTRUCTURE LAYER                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Cache Manager (P1-T6)                    │      │
│  │  ┌─────────┐  ┌──────────────┐  ┌─────────────────┐  │      │
│  │  │ L1 Mem  │  │ L2 Redis     │  │ L3 Prisma/File  │  │      │
│  │  │ 15min   │  │ 1-24h        │  │ Permanent       │  │      │
│  │  │ LRU     │  │ Per-Scene    │  │ Manual/Policy   │  │      │
│  │  └─────────┘  └──────────────┘  └─────────────────┘  │      │
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
| 上游消费者 | AI Gateway（决策层调用 Cache 执行层） |
| 下游依赖 | Redis（L2）、Prisma/File System（L3） |
| 事件依赖 | Event Bus v1.0 🔒 — 发布缓存失效事件 |
| 权限依赖 | Permission Manager v1.0 🔒 — L3 内容权限校验 |
| 审计依赖 | Audit Log v1.0 🔒 — 缓存操作审计记录 |
| 不承载 | 业务逻辑、内容生成、模型调用 |

### 1.3 现有代码差距分析

| 维度 | 当前状态 | 设计要求 |
|------|----------|----------|
| 文件数 | 2 个（module + service） | 8+ 个（类型/接口/适配器/测试） |
| L1 实现 | 内存 Map（简陋但可用） | 保留并增强（LRU + 统计） |
| L2 实现 | **无** | Redis 适配器，支持 TTL 按场景配置 |
| L3 实现 | **无** | Prisma 持久化 + 文件存储 |
| 分层 Fallback | **无** | L1→L2→L3 逐级查询 + 回写 |
| 语义匹配 | Jaccard 相似度（玩具） | Embedding 向量相似度 >= 0.92 |
| 缓存 Key | 简单 hash | 7 维度语言感知 Key |
| 测试 | **无** | 完整单元测试 |
| 设计文档 | **无** | 本文档 |

---

## 2. Architecture Design

### 2.1 核心接口：ICacheStore

```typescript
/**
 * 缓存存储抽象接口
 * Phase 1: L1 MemoryStore + L2 RedisStore + L3 PrismaStore
 * 遵循依赖倒置原则，业务层仅依赖此接口
 */
interface ICacheStore {
  /** 查询缓存 */
  get(key: string): Promise<CacheEntry | null>;

  /** 写入缓存 */
  set(key: string, entry: CacheEntry): Promise<void>;

  /** 失效缓存 */
  invalidate(key: string): Promise<void>;

  /** 批量失效（按模式匹配） */
  invalidatePattern(pattern: string): Promise<number>;

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
  /** 关联的语义向量（L2/L3） */
  embedding?: number[];
  /** 语言身份哈希（GLOI 强制） */
  languageIdentityHash?: string;
  /** 资产版本号（GLOI 强制） */
  assetVersion?: string;
  /** 元数据 */
  metadata: CacheMetadata;
}

interface CacheMetadata {
  modelId?: string;
  promptVersion?: string;
  translationMemoryVersion?: string;
  terminologySetVersion?: string;
  cultureProfileVersion?: string;
  userContextHash?: string;
  scene: string;
  domain: string;
}
```

### 2.2 缓存 Key 设计（GLOI 合规）

根据 v3.2.1 蓝图 5.6.5 节缓存层红线，缓存 Key 必须包含完整语言维度与资产版本：

```
CACHE_KEY = hash(
  model_id
  + prompt_version
  + language_identity_hash
  + translation_memory_version
  + terminology_set_version
  + culture_profile_version
  + user_context_hash
  + scene
  + domain
  + structured_params
)
```

### 2.3 分层查询流程

```
CacheManager.get(key, context)
    │
    ▼
┌─────────────────────┐
│ L1: MemoryStore     │  命中 → 返回 + 更新访问统计
│ TTL: 15min         │
│ 淘汰: LRU          │
└──────┬──────────────┘
       │ 未命中
       ▼
┌─────────────────────┐
│ L2: RedisStore      │  命中 → 回写 L1 → 返回
│ TTL: 1-24h (场景)  │
│ 淘汰: TTL 到期      │
└──────┬──────────────┘
       │ 未命中
       ▼
┌─────────────────────┐
│ L3: PrismaStore     │  命中 → 回写 L2 → 回写 L1 → 返回
│ TTL: 永久           │
│ 淘汰: 人工/策略     │
└──────┬──────────────┘
       │ 未命中
       ▼
  返回 null → AI Gateway 调用模型 → 结果写入 L1/L2/L3
```

### 2.4 文件结构

```
src/infrastructure/cache/
├── cache.types.ts              # 所有类型、接口、常量
├── cache.provider.ts           # Symbol DI Token
├── cache.service.ts            # CacheManager 门面服务（分层编排）
├── cache.module.ts             # Module 注册 + DI 绑定
├── stores/
│   ├── memory-store.ts         # L1 内存存储（改造现有实现）
│   ├── redis-store.ts          # L2 Redis 存储
│   └── prisma-store.ts         # L3 持久化存储
├── index.ts                    # Barrel Export
└── cache.spec.ts               # 单元测试
```

### 2.5 L1 MemoryStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | 进程内存 Map（保留现有实现） |
| TTL | 默认 900 秒（15 分钟） |
| 淘汰策略 | LRU（最大 1000 条） |
| 新增能力 | 命中率统计、访问计数 |

### 2.6 L2 RedisStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | Redis（`ioredis` 已安装） |
| TTL | 按场景配置：translation=24h, question=6h, content=1h, default=1h |
| 淘汰策略 | Redis TTL 自动过期 |
| Key 命名空间 | `ailos:cache:l2:{hash}`（与 State Manager `ailos:state:` 隔离） |
| 新增能力 | 语义匹配（Redis Sorted Set 按相似度排序） |

### 2.7 L3 PrismaStore 设计

| 属性 | 值 |
|------|-----|
| 存储介质 | MySQL via Prisma（`cache_entries` 表） |
| TTL | 永久（人工/策略触发淘汰） |
| 淘汰策略 | 管理员操作 + 定时策略扫描 |
| 新增能力 | 权限控制（接入 Permission Manager） |

**Prisma Schema 扩展**（仅新增 1 表）：
```prisma
model CacheEntry {
  id                    String   @id @default(uuid())
  cacheKey              String   @unique
  value                 Json
  scene                 String
  domain                String
  languageIdentityHash  String?
  assetVersion          String?
  embedding             Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  expiresAt             DateTime?
  accessCount           Int      @default(0)
  lastAccessedAt        DateTime?

  @@index([scene, domain])
  @@index([languageIdentityHash])
  @@index([cacheKey])
}
```

### 2.8 语义匹配设计

区别于当前实现的 Jaccard 相似度，Phase 1 语义匹配采用以下方案：

- **向量存储**：L2 Redis 中存储 embedding 向量（Sorted Set）
- **相似度计算**：余弦相似度，阈值 >= 0.92
- **向量获取**：Phase 1 使用外部 Embedding API（通过 AI Gateway 调用），Phase 2 可本地化
- **降级策略**：Embedding API 不可用时，回退到精确 Key 匹配

### 2.9 与 AI Gateway 的集成契约

```
AI Gateway (决策层)                    Cache Manager (执行层)
     │                                       │
     │  queryCache(key, context)             │
     │──────────────────────────────────────>│
     │                                       │ L1→L2→L3 逐级查询
     │  CacheEntry | null                    │
     │<──────────────────────────────────────│
     │                                       │
     │  writeCache(key, entry, tiers)        │
     │──────────────────────────────────────>│
     │                                       │ 按 tiers 决定写入哪些层
     │  void                                 │
     │<──────────────────────────────────────│
     │                                       │
     │  semanticMatch(vector, threshold)     │
     │──────────────────────────────────────>│
     │                                       │ 余弦相似度计算
     │  CacheEntry | null                    │
     │<──────────────────────────────────────│
```

---

## 3. GLOI v3.2.1 Compliance Checklist

### 3.1 合规自查结论

**Cache L2/L3 模块涉及语言数据模型**，理由：AI 生成内容的缓存 Key 必须包含语言身份维度，否则不同语言版本的相同语义请求会错误命中同一缓存。因此必须通过 GLOI 合规审查。

### 3.2 逐项自查

| # | 红线条款 | 合规状态 | 说明 |
|---|----------|----------|------|
| 1 | 禁止将语言硬编码进类名、模块名、服务名、事件类型 | ✅ 合规 | 所有类名/方法名/变量名无语言标识（CacheManager、ICacheStore、RedisStore、PrismaStore） |
| 2 | 禁止按语言拆分服务（如 `JapaneseCourseService`） | ✅ 合规 | 统一 CacheManager，语言身份通过 `languageIdentityHash` 参数驱动 |
| 3 | 禁止按语言拆分数据表 | ✅ 合规 | 单一 `cache_entries` 表，通过 `languageIdentityHash` 字段区分 |
| 4 | 禁止在业务表内新增独立 `language_code` 字段 | ✅ 合规 | 使用 `languageIdentityHash`（哈希），而非 `language_code` |
| 5 | 禁止创建 `xxx_translations`、`language_mapping` 碎片化中间表 | ✅ 合规 | 无翻译表、无映射表 |
| 6 | 缓存 Key 必须包含完整语言维度与资产版本 | ✅ 合规 | 缓存 Key 包含 7 项维度：`model_id + prompt_version + language_identity_hash + translation_memory_version + terminology_set_version + culture_profile_version + user_context_hash` |
| 7 | 禁止业务模块在 Prompt 中硬编码语言角色 | ✅ 合规 | Cache 不生成 Prompt，仅存储和检索，语言角色由 AI Gateway 的 Language Resolver 负责 |
| 8 | 语言版本是独立资产，接入权限体系 | ✅ 合规 | L3 持久化缓存接入 Permission Manager，按 `evolution_track` 隔离 |
| 9 | 语言主键单一原则 | ✅ 合规 | 通过 `languageIdentityHash` 关联 |
| 10 | 禁止按语言拆分表 | ✅ 合规 | 单表设计 |
| 11 | 内容版本统一管理 | ✅ 合规 | `assetVersion` 字段 + `updatedAt` 时间戳 |
| 12 | 术语库全局统一 | N/A | Cache 不管理术语库 |
| 13 | 翻译记忆全局统一 | N/A | Cache 不管理翻译记忆 |
| 14 | 禁止语言映射表 | ✅ 合规 | 无映射表 |

### 3.3 合规结论

**14 项自查，12 项适用，12 项合规，2 项不适用。GLOI 合规性：PASS。**

---

## 4. Frozen Module Compatibility Analysis

### 4.1 Permission Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | L3 持久化缓存按 `evolution_track` 隔离，查询时通过 Permission Manager 校验读取权限 |
| 调用接口 | 使用 Permission Manager 已冻结的 `checkPermission` 等公开接口 |
| 是否修改 | **否** — 仅作为消费者调用公开 API |
| 是否突破契约 | **否** — 不修改 4 核心表、3 核心服务、RBAC 链路 |
| 兼容性 | **完全兼容** |

### 4.2 Event Bus v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | Cache 发布 `cache.invalidated` 事件，订阅 `permission.*` 以失效相关缓存 |
| 调用接口 | 使用 `@OnEvent()` 装饰器订阅，使用 `IEventBus.publish()` 发布 |
| EventEnvelope | 从 `../permission/permission.types` 导入，单一来源 |
| 已知偏差 | DEV-AUDIT-001：`*` 全局通配符不生效，Cache 订阅时使用显式前缀模式（如 `permission.*`） |
| 是否修改 | **否** — 标准订阅方，不修改 Event Bus 核心代码 |
| 兼容性 | **完全兼容**（已知偏差不阻塞） |

### 4.3 Audit Log Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | L3 缓存操作（写入/淘汰）通过 Event Bus 发布事件，自动被 Audit Log 捕获 |
| 调用接口 | 不直接调用 Audit Log API，通过标准 Event Bus 事件机制 |
| 是否修改 | **否** — Audit Log 零侵入 |
| 兼容性 | **完全兼容** |

### 4.4 State Manager v1.0 🔒

| 维度 | 分析 |
|------|------|
| 依赖方式 | 无直接依赖，但共享 Redis 基础设施 |
| 命名空间隔离 | Cache L2 使用 `ailos:cache:l2:*`，State Manager 使用 `ailos:state:*`，完全隔离 |
| 是否修改 | **否** — 不修改 State Manager 任何代码 |
| 兼容性 | **完全兼容** |

### 4.5 兼容性总结

| 冻结模块 | 依赖方式 | 是否修改 | 兼容性 |
|----------|----------|----------|--------|
| Permission Manager v1.0 🔒 | 消费者（权限校验） | 否 | ✅ |
| Event Bus v1.0 🔒 | 订阅方 + 发布方 | 否 | ✅ |
| Audit Log v1.0 🔒 | 间接（事件触发） | 否 | ✅ |
| State Manager v1.0 🔒 | 无直接依赖 | 否 | ✅ |

**结论：Cache L2/L3 与所有已冻结模块完全兼容，零侵入。**

---

## 5. Implementation Plan

### 5.1 实现范围（Phase 1）

| 文件 | 职责 |
|------|------|
| `cache.types.ts` | ICacheStore、CacheEntry、CacheMetadata、CacheStats 等类型 |
| `cache.provider.ts` | ICACHE_STORE Symbol DI Token |
| `cache.service.ts` | CacheManager 门面：分层查询编排 + 分层写入 + 语义匹配 |
| `cache.module.ts` | @Global() 模块，注入 L1/L2/L3 存储适配器 |
| `stores/memory-store.ts` | L1 内存存储（改造现有实现） |
| `stores/redis-store.ts` | L2 Redis 存储 |
| `stores/prisma-store.ts` | L3 持久化存储 |
| `index.ts` | Barrel Export |
| `cache.spec.ts` | 单元测试 |

### 5.2 实现约束

- ❌ 不修改任何已冻结模块代码
- ❌ L3 `cache_entries` 表为唯一新增数据库表
- ❌ L2 Redis key 命名空间与 State Manager 隔离
- ✅ 所有实现遵循 Language Neutral Principle
- ✅ 缓存 Key 包含完整 GLOI 7 维度
- ✅ 所有 Commit 携带 `[cache][arch-check]` 双标签

### 5.3 单元测试覆盖场景

| 场景 | 测试内容 |
|------|----------|
| 1. L1 MemoryStore | get/set/invalidate/expire/LRU 淘汰 |
| 2. L2 RedisStore | get/set/invalidate/invalidatePattern |
| 3. L3 PrismaStore | get/set/invalidate |
| 4. 分层 Fallback | L1→L2→L3 逐级查询 + 回写 |
| 5. 分层写入 | 按场景路由到不同层级 |
| 6. 语义匹配 | 向量相似度 >= 0.92 命中 |
| 7. 缓存 Key | GLOI 7 维度 + 语言身份哈希 |
| 8. 异常处理 | Redis 不可用→跳过 L2、Prisma 不可用→跳过 L3 |

---

## 6. Next Step

**申请进入 REVIEW 阶段**: Yes

本 DESIGN PROPOSAL 已完整覆盖架构定位、接口设计、GLOI 合规自查、冻结模块兼容性分析，待总工程师 / 架构委员会评审通过后进入 APPROVAL → IMPLEMENT 流程。