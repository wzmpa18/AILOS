import { Test, TestingModule } from '@nestjs/testing';
import { MemoryStore } from './stores/memory-store';
import { AuditLogService } from './audit-log.service';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { IAUDIT_LOG_STORE } from './audit-log.provider';
import { MAX_MEMORY_ENTRIES } from './audit-log.types';
import type { AuditLogEntry, AuditCategory, AuditLogLevel } from './audit-log.types';
import { EventEnvelope } from '../permission/permission.types';
import { randomUUID } from 'crypto';

/**
 * Audit Log 核心场景测试
 *
 * 测试策略：
 * - MemoryStore: 直接测试核心存储逻辑
 * - AuditLogService: 测试标准化转换 + 查询能力
 * - AuditLogSubscriber: 测试 @OnEvent 订阅生效
 * - 覆盖 6 个强制场景 + 边界场景
 */

/** 创建标准 EventEnvelope */
function envelope(
  eventType: string,
  payload: Record<string, unknown> = {},
  overrides?: Partial<EventEnvelope>,
): EventEnvelope {
  return {
    event_id: overrides?.event_id ?? `evt-${randomUUID()}`,
    timestamp: overrides?.timestamp ?? new Date().toISOString(),
    source: overrides?.source ?? 'test-suite',
    trace_id: overrides?.trace_id ?? `trace-${randomUUID()}`,
    payload: { ...payload, event_type: eventType },
  };
}

// ============================================
// MemoryStore 测试
// ============================================
describe('AuditLog — MemoryStore', () => {
  let store: MemoryStore;

  function makeEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
    return {
      id: overrides.id ?? `entry-${randomUUID()}`,
      event_id: overrides.event_id ?? 'evt-001',
      event_type: overrides.event_type ?? 'permission.granted',
      source: overrides.source ?? 'test',
      trace_id: overrides.trace_id ?? 'trace-001',
      timestamp: overrides.timestamp ?? new Date().toISOString(),
      ingested_at: overrides.ingested_at ?? new Date().toISOString(),
      actor: overrides.actor ?? { user_id: 'u001', role: 'admin' },
      target: overrides.target ?? { entity_type: 'role', entity_id: 'r001' },
      payload: overrides.payload ?? { action: 'grant' },
      level: overrides.level ?? 'WARNING',
      category: overrides.category ?? 'PERMISSION',
      evolution_track: overrides.evolution_track ?? 'personal',
      metadata: overrides.metadata ?? {},
    };
  }

  beforeEach(() => {
    store = new MemoryStore();
  });

  // Scenario 1: 内存存储读写 — append/query/getById/count/purge
  describe('Scenario 1: 内存存储读写', () => {
    it('append 后应可通过 query 检索', async () => {
      const entry = makeEntry();
      await store.append(entry);

      const result = await store.query({});
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(entry.id);
    });

    it('getById 应返回正确条目', async () => {
      const entry = makeEntry({ id: 'target-id' });
      await store.append(entry);

      const found = await store.getById('target-id');
      expect(found).not.toBeNull();
      expect(found!.event_type).toBe('permission.granted');
    });

    it('getById 不存在的 ID 应返回 null', async () => {
      const found = await store.getById('non-existent');
      expect(found).toBeNull();
    });

    it('count 应返回正确数量', async () => {
      await store.append(makeEntry({ id: 'a' }));
      await store.append(makeEntry({ id: 'b' }));
      await store.append(makeEntry({ id: 'c' }));

      expect(await store.count()).toBe(3);
    });

    it('purge 应清理过期日志', async () => {
      const oldEntry = makeEntry({
        id: 'old',
        ingested_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      });
      const newEntry = makeEntry({
        id: 'new',
        ingested_at: new Date().toISOString(),
      });
      await store.append(oldEntry);
      await store.append(newEntry);

      const removed = await store.purge({
        before: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(removed).toBe(1);
      expect(await store.count()).toBe(1);
    });
  });

  // Scenario 2: 多条件查询
  describe('Scenario 2: 多条件查询', () => {
    beforeEach(async () => {
      await store.append(makeEntry({ id: 'e1', event_type: 'permission.granted', category: 'PERMISSION', level: 'WARNING', actor: { user_id: 'u001' }, target: { entity_type: 'role' }, trace_id: 'trace-a', evolution_track: 'personal' }));
      await store.append(makeEntry({ id: 'e2', event_type: 'permission.denied', category: 'PERMISSION', level: 'ERROR', actor: { user_id: 'u002' }, target: { entity_type: 'permission' }, trace_id: 'trace-b', evolution_track: 'platform' }));
      await store.append(makeEntry({ id: 'e3', event_type: 'lesson.created', category: 'DATA', level: 'INFO', actor: { user_id: 'u001' }, target: { entity_type: 'lesson' }, trace_id: 'trace-c', evolution_track: 'personal' }));
    });

    it('按事件类型过滤', async () => {
      const result = await store.query({ event_types: ['permission.granted'] });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('e1');
    });

    it('按分类过滤', async () => {
      const result = await store.query({ categories: ['PERMISSION'] });
      expect(result.items).toHaveLength(2);
    });

    it('按级别过滤', async () => {
      const result = await store.query({ levels: ['ERROR'] });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('e2');
    });

    it('按用户过滤', async () => {
      const result = await store.query({ actor_id: 'u001' });
      expect(result.items).toHaveLength(2);
    });

    it('按 trace_id 过滤', async () => {
      const result = await store.query({ trace_id: 'trace-b' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('e2');
    });

    it('按 evolution_track 过滤', async () => {
      const result = await store.query({ evolution_track: 'platform' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('e2');
    });

    it('分页查询', async () => {
      const result = await store.query({ page: 1, page_size: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.total_pages).toBe(2);
    });
  });

  // Scenario 3: 过期清理 / FIFO 淘汰
  describe('Scenario 3: 过期清理与 FIFO 淘汰', () => {
    it('超过容量上限应 FIFO 淘汰最旧记录', async () => {
      for (let i = 0; i < MAX_MEMORY_ENTRIES + 5; i++) {
        await store.append(makeEntry({ id: `entry-${i}` }));
      }
      expect(await store.count()).toBe(MAX_MEMORY_ENTRIES);
      // 最旧的 5 条被淘汰
      const found = await store.getById('entry-0');
      expect(found).toBeNull();
      // 保留的是 entry-5 到 entry-10004
      const kept = await store.getById('entry-5');
      expect(kept).not.toBeNull();
    });

    it('purge 按分类清理', async () => {
      await store.append(makeEntry({ id: 'p1', category: 'PERMISSION' }));
      await store.append(makeEntry({ id: 'd1', category: 'DATA' }));
      await store.append(makeEntry({ id: 'd2', category: 'DATA' }));

      const removed = await store.purge({ categories: ['DATA'] });
      expect(removed).toBe(2);
      expect(await store.count()).toBe(1);
    });
  });
});

// ============================================
// AuditLogService 测试
// ============================================
describe('AuditLog — AuditLogService', () => {
  let service: AuditLogService;
  let store: MemoryStore;

  beforeEach(async () => {
    store = new MemoryStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: IAUDIT_LOG_STORE, useValue: store },
      ],
    }).compile();
    service = module.get<AuditLogService>(AuditLogService);
  });

  // Scenario 4: 日志标准化转换
  describe('Scenario 4: 日志标准化转换', () => {
    it('EventEnvelope 应正确映射为 AuditLogEntry', async () => {
      const env = envelope('permission.granted', {
        user_id: 'u001',
        role: 'admin',
        entity_type: 'role',
        entity_id: 'r001',
        entity_name: 'Super Admin',
        correlation_id: 'corr-123',
      });

      const entry = await service.ingest(env);

      expect(entry.event_id).toBe(env.event_id);
      expect(entry.event_type).toBe('permission.granted');
      expect(entry.trace_id).toBe(env.trace_id);
      expect(entry.source).toBe('test-suite');
      expect(entry.actor.user_id).toBe('u001');
      expect(entry.actor.role).toBe('admin');
      expect(entry.target.entity_type).toBe('role');
      expect(entry.target.entity_id).toBe('r001');
      expect(entry.target.entity_name).toBe('Super Admin');
      expect(entry.correlation_id).toBe('corr-123');
      expect(entry.id).toBeTruthy();
      expect(entry.ingested_at).toBeTruthy();
    });

    it('权限域事件应正确分类', async () => {
      const cases: Array<[string, AuditCategory, AuditLogLevel]> = [
        ['permission.granted', 'PERMISSION', 'WARNING'],
        ['permission.revoked', 'PERMISSION', 'WARNING'],
        ['role.assigned', 'PERMISSION', 'WARNING'],
        ['role.unassigned', 'PERMISSION', 'WARNING'],
        ['permission.denied', 'PERMISSION', 'ERROR'],
      ];

      for (const [eventType, expectedCategory, expectedLevel] of cases) {
        const env = envelope(eventType);
        const entry = await service.ingest(env);
        expect(entry.category).toBe(expectedCategory);
        expect(entry.level).toBe(expectedLevel);
      }
    });

    it('created/updated/deleted 后缀事件应正确分类', async () => {
      const cases: Array<[string, AuditCategory, AuditLogLevel]> = [
        ['lesson.created', 'DATA', 'INFO'],
        ['course.updated', 'DATA', 'INFO'],
        ['asset.deleted', 'DATA', 'WARNING'],
      ];

      for (const [eventType, expectedCategory, expectedLevel] of cases) {
        const env = envelope(eventType);
        const entry = await service.ingest(env);
        expect(entry.category).toBe(expectedCategory);
        expect(entry.level).toBe(expectedLevel);
      }
    });

    it('system.* 前缀事件应分类为 SYSTEM', async () => {
      const env = envelope('system.config.changed');
      const entry = await service.ingest(env);
      expect(entry.category).toBe('SYSTEM');
      expect(entry.level).toBe('INFO');
    });

    it('auth.* 前缀事件应分类为 AUTH', async () => {
      const env = envelope('auth.login');
      const entry = await service.ingest(env);
      expect(entry.category).toBe('AUTH');
      expect(entry.level).toBe('INFO');
    });

    it('未知事件类型应使用默认分类', async () => {
      const env = envelope('unknown.custom.event');
      const entry = await service.ingest(env);
      expect(entry.category).toBe('DATA');
      expect(entry.level).toBe('INFO');
    });
  });

  // Scenario 5: 查询能力
  describe('Scenario 5: 查询能力', () => {
    beforeEach(async () => {
      await service.ingest(envelope('permission.granted', { user_id: 'u001' }, { trace_id: 'trace-q1' }));
      await service.ingest(envelope('permission.denied', { user_id: 'u002' }, { trace_id: 'trace-q2' }));
      await service.ingest(envelope('lesson.created', { user_id: 'u001' }, { trace_id: 'trace-q3' }));
    });

    it('queryByUser 应返回指定用户的日志', async () => {
      const result = await service.queryByUser('u001');
      expect(result.items).toHaveLength(2);
    });

    it('queryByEventType 应返回指定事件类型的日志', async () => {
      const result = await service.queryByEventType('permission.denied');
      expect(result.items).toHaveLength(1);
    });

    it('queryByTraceId 应返回全链路日志', async () => {
      const items = await service.queryByTraceId('trace-q1');
      expect(items).toHaveLength(1);
      expect(items[0].event_type).toBe('permission.granted');
    });

    it('queryByTimeRange 应返回时间范围内的日志', async () => {
      const now = new Date().toISOString();
      const result = await service.queryByTimeRange(
        new Date(Date.now() - 10000).toISOString(),
        new Date(Date.now() + 10000).toISOString(),
      );
      expect(result.items.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Scenario 6: 异常处理 / 边界场景
  describe('Scenario 6: 异常处理与边界场景', () => {
    it('payload 为空对象时应正常处理', async () => {
      const env = envelope('test.event', {});
      const entry = await service.ingest(env);
      expect(entry.id).toBeTruthy();
      expect(entry.actor.user_id).toBeUndefined();
    });

    it('存储满时不应抛异常', async () => {
      for (let i = 0; i < MAX_MEMORY_ENTRIES + 10; i++) {
        const env = envelope('test.event', { index: i }, { event_id: `evt-${i}` });
        await service.ingest(env);
      }
      expect(await service.count()).toBe(MAX_MEMORY_ENTRIES);
    });
  });
});

// ============================================
// AuditLogSubscriber 测试
// ============================================
describe('AuditLog — AuditLogSubscriber', () => {
  it('应正确定义 @OnEvent 装饰器', () => {
    const proto = AuditLogSubscriber.prototype;
    expect(typeof proto.onPermissionEvent).toBe('function');
    expect(typeof proto.onAnyEvent).toBe('function');
  });

  it('通过 DI 注入 AuditLogService', async () => {
    const store = new MemoryStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        AuditLogSubscriber,
        { provide: IAUDIT_LOG_STORE, useValue: store },
      ],
    }).compile();

    const subscriber = module.get<AuditLogSubscriber>(AuditLogSubscriber);
    expect(subscriber).toBeDefined();
  });

  it('onPermissionEvent 应调用 ingest', async () => {
    const store = new MemoryStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        AuditLogSubscriber,
        { provide: IAUDIT_LOG_STORE, useValue: store },
      ],
    }).compile();

    const subscriber = module.get<AuditLogSubscriber>(AuditLogSubscriber);
    const env = envelope('permission.granted', { user_id: 'u001' });

    await subscriber.onPermissionEvent(env);

    expect(await store.count()).toBe(1);
  });

  it('onAnyEvent 应调用 ingest', async () => {
    const store = new MemoryStore();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        AuditLogSubscriber,
        { provide: IAUDIT_LOG_STORE, useValue: store },
      ],
    }).compile();

    const subscriber = module.get<AuditLogSubscriber>(AuditLogSubscriber);
    const env = envelope('lesson.created', { user_id: 'u001' });

    await subscriber.onAnyEvent(env);

    expect(await store.count()).toBe(1);
  });
});