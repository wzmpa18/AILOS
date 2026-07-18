import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import { RoleInfo, ListRolesParams, PaginatedRoles } from './permission.types';

/**
 * Role Service — 角色管理 CRUD
 * RBAC 核心组件
 */
@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    name: string;
    displayName: string;
    description?: string;
    orgScope?: string;
    isSystem?: boolean;
  }): Promise<RoleInfo> {
    const existing = await this.prisma.role.findUnique({
      where: { name: params.name },
    });
    if (existing) {
      throw new ConflictException(`Role "${params.name}" already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        roleId: randomUUID(),
        name: params.name,
        displayName: params.displayName,
        description: params.description || null,
        orgScope: params.orgScope || 'global',
        isSystem: params.isSystem || false,
        evolutionTrack: 'platform',
      },
    });

    this.logger.log(`Role created: ${role.name} (${role.roleId})`);

    return {
      roleId: role.roleId,
      name: role.name,
      displayName: role.displayName,
      description: role.description || undefined,
      orgScope: role.orgScope,
      isSystem: role.isSystem,
      permissionCount: 0,
      userCount: 0,
    };
  }

  async findById(roleId: string): Promise<RoleInfo | null> {
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
    });

    if (!role) return null;

    return {
      roleId: role.roleId,
      name: role.name,
      displayName: role.displayName,
      description: role.description || undefined,
      orgScope: role.orgScope,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
      userCount: role._count.userRoles,
    };
  }

  async findByName(name: string): Promise<RoleInfo | null> {
    const role = await this.prisma.role.findFirst({
      where: { name, deletedAt: null },
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
    });

    if (!role) return null;

    return {
      roleId: role.roleId,
      name: role.name,
      displayName: role.displayName,
      description: role.description || undefined,
      orgScope: role.orgScope,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
      userCount: role._count.userRoles,
    };
  }

  async list(params?: ListRolesParams): Promise<PaginatedRoles> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.orgScope) where.orgScope = params.orgScope;
    if (params?.isSystem !== undefined) where.isSystem = params.isSystem;

    const [total, roles] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        include: {
          _count: {
            select: { rolePermissions: true, userRoles: true },
          },
        },
        skip: params?.offset || 0,
        take: params?.limit || 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items = roles.map((role) => ({
      roleId: role.roleId,
      name: role.name,
      displayName: role.displayName,
      description: role.description || undefined,
      orgScope: role.orgScope,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
      userCount: role._count.userRoles,
    }));

    return { total, items };
  }

  async update(
    roleId: string,
    params: { displayName?: string; description?: string },
  ): Promise<RoleInfo> {
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
    });
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }

    const updated = await this.prisma.role.update({
      where: { roleId },
      data: {
        ...(params.displayName && { displayName: params.displayName }),
        ...(params.description !== undefined && {
          description: params.description,
        }),
      },
      include: {
        _count: {
          select: { rolePermissions: true, userRoles: true },
        },
      },
    });

    return {
      roleId: updated.roleId,
      name: updated.name,
      displayName: updated.displayName,
      description: updated.description || undefined,
      orgScope: updated.orgScope,
      isSystem: updated.isSystem,
      permissionCount: updated._count.rolePermissions,
      userCount: updated._count.userRoles,
    };
  }

  async softDelete(roleId: string): Promise<void> {
    const role = await this.prisma.role.findFirst({
      where: { roleId, deletedAt: null },
    });
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }
    if (role.isSystem) {
      throw new ConflictException(
        `Cannot delete system role "${role.name}"`,
      );
    }

    await this.prisma.role.update({
      where: { roleId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Role soft-deleted: ${role.name} (${roleId})`);
  }
}