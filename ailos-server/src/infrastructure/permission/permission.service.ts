import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { PermissionInfo, ListPermissionsParams, RemovePermissionResult } from './permission.types';
import { EventPublisherStub } from './event-publisher.stub';
import { PermissionGrantedPayload, PermissionRevokedPayload } from './permission.types';

/**
 * Permission Service — 权限项管理 CRUD
 * RBAC 核心组件
 */
@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherStub,
  ) {}

  async create(params: {
    code: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
  }): Promise<PermissionInfo> {
    const existing = await this.prisma.permission.findUnique({
      where: { code: params.code },
    });
    if (existing) {
      throw new ConflictException(`Permission "${params.code}" already exists`);
    }

    const permission = await this.prisma.permission.create({
      data: {
        permissionId: randomUUID(),
        code: params.code,
        name: params.name,
        resource: params.resource,
        action: params.action,
        description: params.description || null,
        evolutionTrack: 'platform',
      },
    });

    this.logger.log(`Permission created: ${permission.code} (${permission.permissionId})`);

    return {
      permissionId: permission.permissionId,
      code: permission.code,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
    };
  }

  async findById(permissionId: string): Promise<PermissionInfo | null> {
    const perm = await this.prisma.permission.findFirst({
      where: { permissionId, deletedAt: null },
    });
    if (!perm) return null;

    return {
      permissionId: perm.permissionId,
      code: perm.code,
      name: perm.name,
      resource: perm.resource,
      action: perm.action,
    };
  }

  async findByCode(code: string): Promise<PermissionInfo | null> {
    const perm = await this.prisma.permission.findFirst({
      where: { code, deletedAt: null },
    });
    if (!perm) return null;

    return {
      permissionId: perm.permissionId,
      code: perm.code,
      name: perm.name,
      resource: perm.resource,
      action: perm.action,
    };
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<PermissionInfo | null> {
    const perm = await this.prisma.permission.findFirst({
      where: { resource, action, deletedAt: null },
    });
    if (!perm) return null;

    return {
      permissionId: perm.permissionId,
      code: perm.code,
      name: perm.name,
      resource: perm.resource,
      action: perm.action,
    };
  }

  async list(params?: ListPermissionsParams): Promise<{
    total: number;
    items: PermissionInfo[];
  }> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.resource) where.resource = params.resource;
    if (params?.action) where.action = params.action;

    const [total, permissions] = await Promise.all([
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where,
        skip: params?.offset || 0,
        take: params?.limit || 100,
        orderBy: { code: 'asc' },
      }),
    ]);

    const items = permissions.map((p: any) => ({
      permissionId: p.permissionId,
      code: p.code,
      name: p.name,
      resource: p.resource,
      action: p.action,
    }));

    return { total, items };
  }

  async softDelete(permissionId: string): Promise<void> {
    const perm = await this.prisma.permission.findFirst({
      where: { permissionId, deletedAt: null },
    });
    if (!perm) {
      throw new NotFoundException(`Permission "${permissionId}" not found`);
    }

    await this.prisma.permission.update({
      where: { permissionId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Permission soft-deleted: ${perm.code} (${permissionId})`);
  }

  async grantToRole(
    roleId: string,
    permissionId: string,
    operator: string,
  ): Promise<void> {
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
    });
    if (!role) throw new NotFoundException(`Role "${roleId}" not found`);

    const perm = await this.prisma.permission.findFirst({
      where: { permissionId, deletedAt: null },
    });
    if (!perm) throw new NotFoundException(`Permission "${permissionId}" not found`);

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (existing) {
      throw new ConflictException(
        `Permission "${perm.code}" already granted to role "${role.name}"`,
      );
    }

    await this.prisma.rolePermission.create({
      data: {
        id: randomUUID(),
        roleId,
        permissionId,
        grantedBy: operator,
      },
    });

    this.logger.log(`Permission granted: ${perm.code} → ${role.name}`);

    // 发布事件
    const payload: PermissionGrantedPayload = {
      roleId,
      permissionId,
      grantedBy: operator,
    };
    await this.eventPublisher.publish('permission.granted', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission',
      trace_id: `perm-${randomUUID().substring(0, 8)}`,
      payload,
    });
  }

  async revokeFromRole(
    roleId: string,
    permissionId: string,
    operator: string,
  ): Promise<RemovePermissionResult> {
    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!existing) {
      return { success: false, error: 'RolePermission association not found' };
    }

    await this.prisma.rolePermission.delete({
      where: { id: existing.id },
    });

    this.logger.log(`Permission revoked: ${permissionId} ← ${roleId}`);

    const payload: PermissionRevokedPayload = {
      roleId,
      permissionId,
      revokedBy: operator,
    };
    await this.eventPublisher.publish('permission.revoked', {
      event_id: randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'permission',
      trace_id: `perm-${randomUUID().substring(0, 8)}`,
      payload,
    });

    return { success: true };
  }

  async getRolePermissions(roleId: string): Promise<PermissionInfo[]> {
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
    });
    if (!role) throw new NotFoundException(`Role "${roleId}" not found`);

    const associations = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return associations
      .filter((a: any) => a.permission && !a.permission.deletedAt)
      .map((a: any) => ({
        permissionId: a.permission.permissionId,
        code: a.permission.code,
        name: a.permission.name,
        resource: a.permission.resource,
        action: a.permission.action,
      }));
  }
}