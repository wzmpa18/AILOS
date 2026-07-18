/**
 * Permission Manager 核心类型定义
 * AILOS Runtime — Phase 1 Task 3
 * 设计基线: Permission Manager Architecture Design v1.0 (Frozen)
 * 权限模型: RBAC (User → Role → Permission)
 * 术语标准: Dual-Track Evolution (Personal + Platform)
 */

/** 权限校验结果 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedRole?: string;
  matchedPermission?: string;
}

/** 角色信息 */
export interface RoleInfo {
  roleId: string;
  name: string;
  displayName: string;
  description?: string;
  orgScope: string;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
}

/** 用户角色信息 */
export interface UserRoleInfo {
  roleId: string;
  roleName: string;
  displayName: string;
  orgScope: string;
  assignedAt: Date;
}

/** 权限项信息 */
export interface PermissionInfo {
  permissionId: string;
  code: string;
  name: string;
  resource: string;
  action: string;
}

/** 角色分配结果 */
export interface AssignRoleResult {
  success: boolean;
  userRoleId?: string;
  error?: string;
}

/** 移除权限结果 */
export interface RemovePermissionResult {
  success: boolean;
  error?: string;
}

/** 分页角色列表 */
export interface PaginatedRoles {
  total: number;
  items: RoleInfo[];
}

/** 角色查询参数 */
export interface ListRolesParams {
  orgScope?: string;
  isSystem?: boolean;
  offset?: number;
  limit?: number;
}

/** 权限查询参数 */
export interface ListPermissionsParams {
  resource?: string;
  action?: string;
  offset?: number;
  limit?: number;
}

/** 用户角色查询参数 */
export interface ListUserRolesParams {
  userId?: string;
  roleId?: string;
  orgId?: string;
  offset?: number;
  limit?: number;
}

/** 标准事件 Envelope */
export interface EventEnvelope<T = Record<string, unknown>> {
  event_id: string;
  timestamp: string;
  source: string;
  trace_id: string;
  payload: T;
}

/** 权限变更事件类型 */
export type PermissionEventType =
  | 'permission.granted'
  | 'permission.revoked'
  | 'role.assigned'
  | 'role.unassigned'
  | 'permission.denied';

/** 权限授予事件 payload */
export interface PermissionGrantedPayload {
  roleId: string;
  permissionId: string;
  grantedBy: string;
}

/** 权限撤销事件 payload */
export interface PermissionRevokedPayload {
  roleId: string;
  permissionId: string;
  revokedBy: string;
}

/** 角色分配事件 payload */
export interface RoleAssignedPayload {
  userId: string;
  roleId: string;
  orgId?: string;
  assignedBy: string;
}

/** 角色撤销事件 payload */
export interface RoleUnassignedPayload {
  userId: string;
  roleId: string;
  orgId?: string;
  unassignedBy: string;
}

/** 权限拒绝事件 payload */
export interface PermissionDeniedPayload {
  userId: string;
  resource: string;
  action: string;
  reason: string;
}

/** 错误码定义 */
export const PermissionErrorCode = {
  NO_ROLE: 'NO_ROLE',
  NO_PERMISSION: 'NO_PERMISSION',
  ORG_SCOPE_VIOLATION: 'ORG_SCOPE_VIOLATION',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_RESOURCE: 'INVALID_RESOURCE',
  INVALID_ACTION: 'INVALID_ACTION',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',
  ALREADY_ASSIGNED: 'ALREADY_ASSIGNED',
  OPERATOR_NO_PERMISSION: 'OPERATOR_NO_PERMISSION',
  SYSTEM_ROLE_IMMUTABLE: 'SYSTEM_ROLE_IMMUTABLE',
} as const;

export type PermissionErrorCodeType =
  (typeof PermissionErrorCode)[keyof typeof PermissionErrorCode];