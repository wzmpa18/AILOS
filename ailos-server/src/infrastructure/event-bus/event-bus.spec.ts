import { Test, TestingModule } from '@nestjs/testing';
import { MemoryAdapter } from './adapters/memory-adapter';
import { EventBusService } from './event-bus.service';
import { IEventBus } from './event-bus.provider';
import { EventEnvelope } from '../permission/permission.types';
import {
  MAX_RETRY_COUNT,
  RETRY_DELAY_MS,
  MAX_PAYLOAD_SIZE,
} from './event-bus.types';

/**
 * Event Bus 核心场景测试
 *
 * 测试策略：
 * - 直接测试 MemoryAdapter 核心逻辑（旁路 module 扫描）
 * - EventBusService 作为薄封装层，核心逻辑委托给 MemoryAdapter
 * - 覆盖 6 个强制测试场景 + 边界场景
 */
describe('EventBus — MemoryAdapter', () => {
  let adapter: MemoryAdapter;

  /** 创建标准 Envelope */
  function envelope<T = Record<string, unknown>>(
    payload: T,
    overrides?: Partial<EventEnvelope<T>>,
  ): EventEnvelope<T> {
    return {
      event_id: overrides?.event_id ?? 'evt-001',
      timestamp: overrides?.timestamp ?? new Date().toISOString(),
      source: overrides?.source ?? 'test-suite',
      trace_id: overrides?.trace_id ?? 'trace-001',
      payload: overrides?.payload ?? payload,
    };
  }

  beforeEach(async () => {
    adapter = new MemoryAdapter();
    adapter.onModuleInit();
  });

  afterEach(() => {
    adapter.onModuleDestroy();
  });

  // ============================================
  // Scenario 1: publish() 正常发布流程
  // ============================================
  describe('Scenario 1: publish() — 正常发布流程', () => {
    it('应成功发布事件并调用匹配的订阅者', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await adapter.subscribe('test.event', handler);

      const evt = envelope({ data: 'hello' });
      await adapter.publish('test.event', evt);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(evt);
    });

    it('无匹配订阅者时应静默返回，不抛异常', async () => {
      const evt = envelope({ data: 'orphan' });
      await expect(adapter.publish('no.subscriber', evt)).resolves.toBeUndefined();
    });

    it('多个订阅者应全部收到事件', async () => {
      const h1 = jest.fn().mockResolvedValue(undefined);
      const h2 = jest.fn().mockResolvedValue(undefined);
      await adapter.subscribe('test.event', h1);
      await adapter.subscribe('test.event', h2);

      const evt = envelope({ data: 'multi' });
      await adapter.publish('test.event', evt);

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it('payload 超过 64KB 应抛出异常', async () => {
      const largePayload = { data: 'x'.repeat(MAX_PAYLOAD_SIZE) };
      const evt = envelope(largePayload);

      await expect(adapter.publish('test.event', evt)).rejects.toThrow(
        /payload exceeds/,
      );
    });
  });

  // ============================================
  // Scenario 2: subscribe() / unsubscribe()
  // ============================================
  describe('Scenario 2: subscribe() / unsubscribe()', () => {
    it('subscribe 应返回唯一 subscriptionId', async () => {
      const h = jest.fn().mockResolvedValue(undefined);
      const id1 = await adapter.subscribe('test.event', h);
      const id2 = await adapter.subscribe('test.event', h);

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('unsubscribe 后订阅者不再收到事件', async () => {
      const h = jest.fn().mockResolvedValue(undefined);
      const id = await adapter.subscribe('test.event', h);
      await adapter.unsubscribe(id);

      await adapter.publish('test.event', envelope({ data: 'after-unsub' }));

      expect(h).not.toHaveBeenCalled();
    });

    it('unsubscribe 不存在的 subscriptionId 应静默处理', async () => {
      await expect(adapter.unsubscribe('non-existent')).resolves.toBeUndefined();
    });

    it('取消最后一个订阅者后 eventType 条目应被清理', async () => {
      const h = jest.fn().mockResolvedValue(undefined);
      const id = await adapter.subscribe('test.event', h);
      await adapter.unsubscribe(id);

      await adapter.publish('test.event', envelope({ data: 'gone' }));
      expect(h).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Scenario 3: 路由匹配 — 精确 + 前缀通配
  // ============================================
  describe('Scenario 3: 路由匹配 — 精确匹配 + 前缀通配', () => {
    it('精确匹配：仅匹配完全相同的 eventType', async () => {
      const exact = jest.fn().mockResolvedValue(undefined);
      const other = jest.fn().mockResolvedValue(undefined);

      await adapter.subscribe('permission.role.assigned', exact);
      await adapter.subscribe('permission.role.revoked', other);

      await adapter.publish('permission.role.assigned', envelope({}));

      expect(exact).toHaveBeenCalledTimes(1);
      expect(other).not.toHaveBeenCalled();
    });

    it('前缀通配：permission.* 应匹配所有 permission 域事件', async () => {
      const wildcard = jest.fn().mockResolvedValue(undefined);

      await adapter.subscribe('permission.*', wildcard);

      await adapter.publish('permission.role.assigned', envelope({ role: 'admin' }, { event_id: 'evt-wc-001' }));
      await adapter.publish('permission.permission.granted', envelope({ perm: 'read' }, { event_id: 'evt-wc-002' }));

      expect(wildcard).toHaveBeenCalledTimes(2);
    });

    it('精确匹配 + 通配：按优先级排序，两者都触发', async () => {
      const exact = jest.fn().mockResolvedValue(undefined);
      const wildcard = jest.fn().mockResolvedValue(undefined);

      await adapter.subscribe('permission.role.assigned', exact, 50);
      await adapter.subscribe('permission.*', wildcard, 100);

      await adapter.publish('permission.role.assigned', envelope({ role: 'user' }));

      expect(exact).toHaveBeenCalledTimes(1);
      expect(wildcard).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // Scenario 4: 重试机制 — 3 次重试生效
  // ============================================
  describe('Scenario 4: 重试机制 — 异常场景下 3 次重试', () => {
    it('处理函数抛出异常时应重试 3 次', async () => {
      const handler = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail-1'))
        .mockRejectedValueOnce(new Error('fail-2'))
        .mockRejectedValueOnce(new Error('fail-3'))
        .mockResolvedValueOnce(undefined); // 第 4 次成功

      await adapter.subscribe('test.event', handler);
      await adapter.publish('test.event', envelope({ data: 'retry-me' }));

      // 1 次初始 + 3 次重试 = 4 次调用（第 4 次成功）
      expect(handler).toHaveBeenCalledTimes(4);
    });

    it('3 次重试全部失败后应记录到失败缓冲', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('always-fail'));

      await adapter.subscribe('test.event', handler);
      const evt = envelope({ data: 'doomed' });
      await adapter.publish('test.event', evt);

      // 1 初始 + 3 重试 = 4 次
      expect(handler).toHaveBeenCalledTimes(4);

      const failed = adapter.getFailedEvents();
      expect(failed).toHaveLength(1);
      expect(failed[0].event_id).toBe('evt-001');
      expect(failed[0].retry_count).toBe(MAX_RETRY_COUNT);
      expect(failed[0].error_type).toBe('Error');
    });
  });

  // ============================================
  // Scenario 5: 幂等去重 — 重复 event_id 不重复执行
  // ============================================
  describe('Scenario 5: 幂等去重 — 重复 event_id', () => {
    it('相同 event_id 应只被执行一次', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await adapter.subscribe('test.event', handler);

      const evt = envelope({ data: 'idem' }, { event_id: 'evt-idem-001' });

      await adapter.publish('test.event', evt);
      await adapter.publish('test.event', evt); // 重复

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('不同 event_id 应分别执行', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      await adapter.subscribe('test.event', handler);

      await adapter.publish('test.event', envelope({}, { event_id: 'evt-a' }));
      await adapter.publish('test.event', envelope({}, { event_id: 'evt-b' }));

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================
  // Scenario 6: 多订阅者优先级排序
  // ============================================
  describe('Scenario 6: 多订阅者优先级排序', () => {
    it('低优先级数字（更优先）的处理函数应先执行', async () => {
      const order: string[] = [];

      const h1 = jest.fn().mockImplementation(() => {
        order.push('high-priority');
        return Promise.resolve();
      });
      const h2 = jest.fn().mockImplementation(() => {
        order.push('low-priority');
        return Promise.resolve();
      });

      await adapter.subscribe('test.event', h1, 10); // 高优先级
      await adapter.subscribe('test.event', h2, 100); // 低优先级

      await adapter.publish('test.event', envelope({}));

      expect(order).toEqual(['high-priority', 'low-priority']);
    });

    it('相同优先级按注册顺序执行', async () => {
      const order: string[] = [];

      const h1 = jest.fn().mockImplementation(() => {
        order.push('first');
        return Promise.resolve();
      });
      const h2 = jest.fn().mockImplementation(() => {
        order.push('second');
        return Promise.resolve();
      });

      await adapter.subscribe('test.event', h1, 50);
      await adapter.subscribe('test.event', h2, 50);

      await adapter.publish('test.event', envelope({}));

      expect(order).toEqual(['first', 'second']);
    });
  });

  // ============================================
  // 边界场景
  // ============================================
  describe('边界场景', () => {
    it('单个订阅者异常不应阻塞其他订阅者', async () => {
      const failing = jest.fn().mockRejectedValue(new Error('boom'));
      const working = jest.fn().mockResolvedValue(undefined);

      await adapter.subscribe('test.event', failing);
      await adapter.subscribe('test.event', working);

      await adapter.publish('test.event', envelope({}));

      // failing 被调用 4 次（1 初始 + 3 重试）
      expect(failing).toHaveBeenCalledTimes(4);
      // working 正常执行
      expect(working).toHaveBeenCalledTimes(1);
    });

    it('过滤器应正确过滤事件', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const filter = (e: EventEnvelope) => (e.payload as any).role === 'admin';

      await adapter.subscribe('test.event', handler, 100, filter);

      await adapter.publish('test.event', envelope({ role: 'user' }, { event_id: 'evt-filter-001' }));
      await adapter.publish('test.event', envelope({ role: 'admin' }, { event_id: 'evt-filter-002' }));

      // 仅 admin 通过过滤器
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('getSubscriptionCount 应返回正确的订阅数', async () => {
      expect(adapter.getSubscriptionCount()).toBe(0);

      const h = jest.fn().mockResolvedValue(undefined);
      await adapter.subscribe('a.test', h);
      await adapter.subscribe('b.test', h);

      expect(adapter.getSubscriptionCount()).toBe(2);
    });

    it('失败缓冲应正确记录失败事件', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('fail'));

      await adapter.subscribe('test.event', handler);

      for (let i = 0; i < 5; i++) {
        await adapter.publish('test.event', envelope({}, { event_id: `evt-buf-${i}` }));
      }

      const failed = adapter.getFailedEvents();
      expect(failed.length).toBe(5);
      expect(failed[0].event_id).toBe('evt-buf-0');
      expect(failed[0].error_type).toBe('Error');
      expect(failed[0].retry_count).toBe(3);
    });
  });
});

describe('EventBus — EventBusService', () => {
  let service: EventBusService;
  let adapter: MemoryAdapter;

  beforeEach(async () => {
    adapter = new MemoryAdapter();
    adapter.onModuleInit();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: MemoryAdapter, useValue: adapter },
        EventBusService,
        { provide: IEventBus, useExisting: EventBusService },
      ],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
  });

  afterEach(() => {
    adapter.onModuleDestroy();
  });

  it('应通过 DI 正确注入 MemoryAdapter', () => {
    expect(service).toBeDefined();
  });

  it('publish 应委托给 MemoryAdapter', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    await service.subscribe('svc.test', handler);

    const evt = {
      event_id: 'svc-001',
      timestamp: new Date().toISOString(),
      source: 'svc-test',
      trace_id: 'trace-svc',
      payload: { data: 'svc' },
    };
    await service.publish('svc.test', evt);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('getFailedEvents 应透传 MemoryAdapter 的失败缓冲', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('fail'));
    await service.subscribe('svc.fail', failing);

    const evt = {
      event_id: 'svc-fail-001',
      timestamp: new Date().toISOString(),
      source: 'svc-test',
      trace_id: 'trace-fail',
      payload: { data: 'fail' },
    };
    await service.publish('svc.fail', evt);

    expect(service.getFailedEvents()).toHaveLength(1);
  });
});