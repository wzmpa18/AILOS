import { SetMetadata } from '@nestjs/common';

/**
 * Permission 装饰器 Key
 */
export const PERMISSION_KEY = 'ailos:permission';

/**
 * @RequirePermission 装饰器 — Controller 层声明式权限
 *
 * 用法：
 *   @RequirePermission('learning', 'read')
 *   @Get('/courses/:id')
 *   async getCourse() { ... }
 *
 * 认证分离原则：上游 Auth Layer 已完成 JWT 解析，本装饰器仅负责权限校验。
 */
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(PERMISSION_KEY, { resource, action });