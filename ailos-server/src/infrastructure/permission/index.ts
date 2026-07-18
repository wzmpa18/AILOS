/**
 * Permission Manager — AILOS Runtime 统一权限管理模块
 * Phase 1 Task 3: Permission Manager IMPLEMENT
 *
 * 设计基线: Permission Manager Architecture Design v1.0 (Frozen)
 * 权限模型: RBAC (User → Role → Permission)
 * 术语标准: Dual-Track Evolution (Personal + Platform)
 * 架构合规: arch-check: layer=identity, boundary=compliant, risk=low, asset-impact=none, dependency=state-manager
 */

// 核心服务
export { RoleService } from './role.service';
export { PermissionService } from './permission.service';
export { UserRoleService } from './user-role.service';

// 权限校验
export { PermissionGuard } from './permission.guard';
export { RequirePermission, PERMISSION_KEY } from './require-permission.decorator';

// 事件发布
export { IEventPublisher } from './event-publisher.interface';
export { EventPublisherStub } from './event-publisher.stub';

// Seed
export { PermissionSeedService } from './permission-seed.service';

// Module
export { PermissionModule } from './permission.module';

// 类型
export {
  PermissionCheckResult,
  RoleInfo,
  UserRoleInfo,
  PermissionInfo,
  AssignRoleResult,
  RemovePermissionResult,
  PaginatedRoles,
  ListRolesParams,
  ListPermissionsParams,
  ListUserRolesParams,
  EventEnvelope,
  PermissionEventType,
  PermissionGrantedPayload,
  PermissionRevokedPayload,
  RoleAssignedPayload,
  RoleUnassignedPayload,
  PermissionDeniedPayload,
  PermissionErrorCode,
  PermissionErrorCodeType,
} from './permission.types';