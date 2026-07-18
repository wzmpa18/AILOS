import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  UserRoleInfo,
  AssignRoleResult,
  ListUserRolesParams,
} from './permission.types';
import { EventPublisherStub } from './event-publisher.stub';
import { RoleAssignedPayload, RoleUnassignedPayload } from './permission.types';

/**
 * UserRole Service — 用户角色分配管理
 * RBAC 核心组件
 */
@Injectable()
export class UserRoleService {
  private readonly logger = new Logger(UserRoleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherStub,
  ) {}

  async assignRole(
    userId: string,
    roleId: string,
    operator: string,
    orgId?: string,
  ): Promise<AssignRoleResult> {
    // 校验角色存在
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
    });
    if (!role) {
      return { success: false, error: 'ROLE_NOT_FOUND' };
    }

    // 检查是否已分配
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId: BigInt(userId),
        roleId,
        orgId: orgId ? BigInt(orgId) : null,
      },
    });
    if (existing) {
      return { success: false, error: 'ALREADY_ASSIGNED' };
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        id: randomUUID(),
        userId: BigInt(userId),
        roleId,
        orgId: orgId ? BigInt(orgId) : null,
        assignedBy: operator,
      },
    });

    this.logger.log(
      `Role assigned: ${role.name} → user ${userId} (${userRole.id})`,
    );

    // 发布事件
    const payload: RoleAssignedPayload = {
      userId,
      roleId,
      orgId,
      assignedBy: operator,
    };
    await this.eventPublisher.publish('role.assigned', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission',
      trace_id: `perm-${randomUUID().substring(0, 8)}`,
      payload,
    });

    return { success: true, userRoleId: userRole.id };
  }

  async unassignRole(
    userId: string,
    roleId: string,
    operator: string,
    orgId?: string,
  ): Promise<AssignRoleResult> {
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId: BigInt(userId),
        roleId,
        orgId: orgId ? BigInt(orgId) : null,
      },
    });
    if (!existing) {
      return { success: false, error: 'ROLE_NOT_FOUND' };
    }

    await this.prisma.userRole.delete({
      where: { id: existing.id },
    });

    this.logger.log(
      `Role unassigned: ${roleId} ← user ${userId} (${existing.id})`,
    );

    const payload: RoleUnassignedPayload = {
      userId,
      roleId,
      orgId,
      unassignedBy: operator,
    };
    await this.eventPublisher.publish('role.unassigned', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission',
      trace_id: `perm-${randomUUID().substring(0, 8)}`,
      payload,
    });

    return { success: true };
  }

  async getUserRoles(
    userId: string,
    orgId?: string,
  ): Promise<UserRoleInfo[]> {
    const where: Record<string, unknown> = {
      userId: BigInt(userId),
    };
    if (orgId) {
      where.orgId = BigInt(orgId);
    }

    const userRoles = await this.prisma.userRole.findMany({
      where,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return userRoles
      .filter((ur: any) => ur.role && !ur.role.deletedAt)
      .map((ur: any) => ({
        roleId: ur.role.roleId,
        roleName: ur.role.name,
        displayName: ur.role.displayName,
        orgScope: ur.role.orgScope,
        assignedAt: ur.createdAt,
      }));
  }

  async getUserPermissions(
    userId: string,
    orgId?: string,
  ): Promise<{ code: string; resource: string; action: string }[]> {
    const where: Record<string, unknown> = {
      userId: BigInt(userId),
    };
    if (orgId) {
      where.orgId = BigInt(orgId);
    }

    const userRoles = await this.prisma.userRole.findMany({
      where,
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissionSet = new Map<string, { code: string; resource: string; action: string }>();

    for (const ur of userRoles) {
      if (!ur.role || ur.role.deletedAt) continue;
      for (const rp of ur.role.rolePermissions) {
        if (!rp.permission || rp.permission.deletedAt) continue;
        permissionSet.set(rp.permission.code, {
          code: rp.permission.code,
          resource: rp.permission.resource,
          action: rp.permission.action,
        });
      }
    }

    return Array.from(permissionSet.values());
  }

  async list(params?: ListUserRolesParams): Promise<{
    total: number;
    items: Array<{ id: string; userId: string; roleId: string; roleName: string; orgId?: string; assignedAt: Date }>;
  }> {
    const where: Record<string, unknown> = {};
    if (params?.userId) where.userId = BigInt(params.userId);
    if (params?.roleId) where.roleId = params.roleId;
    if (params?.orgId) where.orgId = BigInt(params.orgId);

    const [total, userRoles] = await Promise.all([
      this.prisma.userRole.count({ where }),
      this.prisma.userRole.findMany({
        where,
        include: { role: true },
        skip: params?.offset || 0,
        take: params?.limit || 100,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items = userRoles.map((ur: any) => ({
      id: ur.id,
      userId: ur.userId.toString(),
      roleId: ur.roleId,
      roleName: ur.role?.name || 'unknown',
      orgId: ur.orgId?.toString(),
      assignedAt: ur.createdAt,
    }));

    return { total, items };
  }
}