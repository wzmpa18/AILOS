import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { EventBusService } from './event-bus.service';
import { MemoryAdapter } from './adapters/memory-adapter';
import { IEventBus } from './event-bus.provider';
import { EVENT_HANDLER_METADATA, OnEventMetadata } from './event-bus.types';
import { EventHandler } from './event-bus.types';

/**
 * Event Bus Module — AILOS Runtime 全局事件通信总线模块
 *
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 *
 * 职责:
 * - @Global() 全局模块，全应用可用
 * - 提供 IEventBus (Symbol) → EventBusService 的 DI 绑定
 * - 扫描所有 @OnEvent() 装饰器并自动注册订阅
 * - 管理 MemoryAdapter 生命周期
 */
@Global()
@Module({
  providers: [
    MemoryAdapter,
    EventBusService,
    {
      provide: IEventBus,
      useExisting: EventBusService,
    },
  ],
  exports: [IEventBus, EventBusService],
})
export class EventBusModule implements OnModuleInit {
  private readonly logger = new Logger(EventBusModule.name);

  constructor(
    private readonly eventBusService: EventBusService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('EventBusModule initializing — scanning @OnEvent() handlers...');

    const providers = this.discoveryService.getProviders();
    let registeredCount = 0;

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !instance.constructor) continue;

      const metadata: OnEventMetadata[] | undefined = Reflect.getMetadata(
        EVENT_HANDLER_METADATA,
        instance.constructor,
      );

      if (!metadata || metadata.length === 0) continue;

      for (const item of metadata) {
        const handler = (instance as Record<string, EventHandler>)[item.propertyKey];
        if (typeof handler !== 'function') {
          this.logger.warn(
            `@OnEvent target "${instance.constructor.name}.${item.propertyKey}" is not a function, skipping`,
          );
          continue;
        }

        await this.eventBusService.subscribe(item.eventPattern, handler.bind(instance));
        registeredCount++;

        this.logger.log(
          `@OnEvent registered: ${instance.constructor.name}.${item.propertyKey} → ${item.eventPattern}`,
        );
      }
    }

    this.logger.log(`EventBusModule initialized — ${registeredCount} @OnEvent handler(s) registered`);
  }
}