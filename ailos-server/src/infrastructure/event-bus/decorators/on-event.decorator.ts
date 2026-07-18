import { EVENT_HANDLER_METADATA, OnEventMetadata } from '../event-bus.types';

/**
 * 声明式事件订阅装饰器
 *
 * 使用方式:
 *   @OnEvent('permission.*')
 *   async onPermissionEvent(envelope: EventEnvelope) { ... }
 *
 * 支持精确匹配与前缀通配:
 *   @OnEvent('permission.role.assigned')  — 精确匹配
 *   @OnEvent('permission.*')              — 匹配所有 permission 域事件
 */
export function OnEvent(eventPattern: string): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existing: OnEventMetadata[] =
      Reflect.getMetadata(EVENT_HANDLER_METADATA, target.constructor) || [];

    existing.push({
      eventPattern,
      propertyKey: propertyKey as string,
    });

    Reflect.defineMetadata(EVENT_HANDLER_METADATA, existing, target.constructor);
    return descriptor;
  };
}