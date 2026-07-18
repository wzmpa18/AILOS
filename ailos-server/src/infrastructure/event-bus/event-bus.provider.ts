/**
 * Event Bus Symbol Token
 * AILOS Runtime — Phase 1 Task 4
 *
 * 设计基线: Event Bus Architecture Design v1.0 (f2698b8)
 * 使用 Symbol 确保 DI 容器中唯一标识，与 Permission Manager 的 IEventPublisher 模式一致
 */
export const IEventBus = Symbol('IEventBus');