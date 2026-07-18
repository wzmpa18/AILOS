import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

/**
 * Permission Seed Service — 内置角色与权限初始化
 *
 * 系统启动时自动创建内置角色和权限项。
 * 幂等操作：已存在的数据不会重复创建。
 */
@Injectable()
export class PermissionSeedService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedRolePermissions();
    this.logger.log('Permission seed data initialized');
  }

  /** 内置角色 */
  private readonly BUILT_IN_ROLES = [
    { name: 'admin', displayName: '管理员', orgScope: 'global', isSystem: true },
    { name: 'member', displayName: '会员', orgScope: 'global', isSystem: true },
    { name: 'free', displayName: '免费用户', orgScope: 'global', isSystem: true },
    { name: 'teacher', displayName: '教师', orgScope: 'global', isSystem: true },
    { name: 'school_admin', displayName: '学校管理员', orgScope: 'global', isSystem: true },
  ];

  /** 内置权限项 */
  private readonly BUILT_IN_PERMISSIONS = [
    { code: 'learning:read', name: '查看学习内容', resource: 'learning', action: 'read' },
    { code: 'learning:write', name: '创建学习内容', resource: 'learning', action: 'write' },
    { code: 'admin:user:manage', name: '管理用户', resource: 'admin', action: 'manage' },
    { code: 'admin:role:manage', name: '管理角色', resource: 'admin', action: 'manage' },
    { code: 'admin:permission:manage', name: '管理权限项', resource: 'admin', action: 'manage' },
    { code: 'asset:read', name: '查看资产', resource: 'asset', action: 'read' },
    { code: 'asset:write', name: '创建/编辑资产', resource: 'asset', action: 'write' },
    { code: 'community:read', name: '查看社区内容', resource: 'community', action: 'read' },
    { code: 'community:write', name: '发布社区内容', resource: 'community', action: 'write' },
    { code: 'teacher:manage', name: '教学管理', resource: 'teacher', action: 'manage' },
    { code: 'org:manage', name: '组织管理', resource: 'org', action: 'manage' },
  ];

  /** 角色-权限映射（默认分配） */
  private readonly ROLE_PERMISSION_MAP: Record<string, string[]> = {
    admin: ['learning:read', 'learning:write', 'admin:user:manage', 'admin:role:manage', 'admin:permission:manage', 'asset:read', 'asset:write', 'community:read', 'community:write', 'teacher:manage', 'org:manage'],
    member: ['learning:read', 'learning:write', 'asset:read', 'community:read', 'community:write'],
    free: ['learning:read', 'asset:read', 'community:read'],
    teacher: ['learning:read', 'learning:write', 'asset:read', 'community:read', 'teacher:manage'],
    school_admin: ['learning:read', 'learning:write', 'asset:read', 'community:read', 'teacher:manage', 'org:manage'],
  };

  private async seedPermissions(): Promise<void> {
    for (const perm of this.BUILT_IN_PERMISSIONS) {
      const existing = await this.prisma.permission.findUnique({
        where: { code: perm.code },
      });
      if (!existing) {
        await this.prisma.permission.create({
          data: {
            permissionId: randomUUID(),
            code: perm.code,
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            evolutionTrack: 'platform',
          },
        });
        this.logger.debug(`Seeded permission: ${perm.code}`);
      }
    }
  }

  private async seedRoles(): Promise<void> {
    for (const role of this.BUILT_IN_ROLES) {
      const existing = await this.prisma.role.findUnique({
        where: { name: role.name },
      });
      if (!existing) {
        await this.prisma.role.create({
          data: {
            roleId: randomUUID(),
            name: role.name,
            displayName: role.displayName,
            orgScope: role.orgScope,
            isSystem: role.isSystem,
            evolutionTrack: 'platform',
          },
        });
        this.logger.debug(`Seeded role: ${role.name}`);
      }
    }
  }

  private async seedRolePermissions(): Promise<void> {
    for (const [roleName, permCodes] of Object.entries(this.ROLE_PERMISSION_MAP)) {
      const role = await this.prisma.role.findUnique({
        where: { name: roleName },
      });
      if (!role) continue;

      for (const permCode of permCodes) {
        const perm = await this.prisma.permission.findUnique({
          where: { code: permCode },
        });
        if (!perm) continue;

        const existing = await this.prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: role.roleId,
              permissionId: perm.permissionId,
            },
          },
        });
        if (!existing) {
          await this.prisma.rolePermission.create({
            data: {
              id: randomUUID(),
              roleId: role.roleId,
              permissionId: perm.permissionId,
              grantedBy: 'system',
            },
          });
        }
      }
    }
    this.logger.debug('Role-permission mappings seeded');
  }
}