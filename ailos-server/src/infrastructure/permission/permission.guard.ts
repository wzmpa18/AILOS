import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleService } from './user-role.service';
import { EventPublisherStub } from './event-publisher.stub';
import { PermissionDeniedPayload } from './permission.types';
import { randomUUID } from 'crypto';
import { PERMISSION_KEY } from './require-permission.decorator';

/**
 * Permission Guard — 统一鉴权入口
 *
 * 认证分离原则：
 * - Authentication（身份认证）：由 Auth Layer 在上游完成
 * - Authorization（权限校验）：由本 Guard 完成
 * 本 Guard 默认上游已完成 JWT 解析，userId 已注入 Request Context。
 *
 * 校验流程：
 * Request → 角色解析 → 权限匹配 → Allow/Deny → 审计事件发布
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly userRoleService: UserRoleService,
    private readonly eventPublisher: EventPublisherStub,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      { resource: string; action: string } | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    // 无 @RequirePermission 装饰器 → 放行
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Phase 1: 从 Request Context 提取 userId
    // Auth Layer 完善后，userId 由 JWT 解析注入
    const userId = this.extractUserId(request);
    if (!userId) {
      this.logger.warn('PermissionGuard: userId not found in request context');
      throw new ForbiddenException('USER_NOT_FOUND');
    }

    const { resource, action } = requiredPermission;

    // 1. 获取用户角色
    const userRoles = await this.userRoleService.getUserRoles(userId);
    if (userRoles.length === 0) {
      this.logger.warn(
        `Permission denied: user ${userId} has no roles (${resource}:${action})`,
      );
      await this.publishDeniedEvent(userId, resource, action, 'NO_ROLE');
      throw new ForbiddenException('NO_ROLE');
    }

    // 2. 获取用户所有权限
    const permissions = await this.userRoleService.getUserPermissions(userId);

    // 3. 匹配权限
    const matched = permissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === 'manage'),
    );

    if (!matched) {
      this.logger.warn(
        `Permission denied: user ${userId} lacks ${resource}:${action}`,
      );
      await this.publishDeniedEvent(userId, resource, action, 'NO_PERMISSION');
      throw new ForbiddenException('NO_PERMISSION');
    }

    this.logger.debug(
      `Permission granted: user ${userId} → ${resource}:${action}`,
    );
    return true;
  }

  /**
   * 从 Request 提取 userId
   * Phase 1: 从 headers 或 query 中提取（Auth Layer 完善后替换为 JWT 解析）
   */
  private extractUserId(request: any): string | null {
    // 优先从 request.user 获取（Auth Layer 注入）
    if (request.user?.userId) return request.user.userId;
    if (request.user?.id) return String(request.user.id);

    // 兼容：从 header 获取
    const headerUserId = request.headers?.['x-user-id'];
    if (headerUserId) return headerUserId;

    // 兼容：从 query 获取
    const queryUserId = request.query?.userId;
    if (queryUserId) return queryUserId;

    return null;
  }

  /**
   * 发布权限拒绝事件
   */
  private async publishDeniedEvent(
    userId: string,
    resource: string,
    action: string,
    reason: string,
  ): Promise<void> {
    const payload: PermissionDeniedPayload = {
      userId,
      resource,
      action,
      reason,
    };
    await this.eventPublisher.publish('permission.denied', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission',
      trace_id: `perm-${randomUUID().substring(0, 8)}`,
      payload,
    });
  }
}