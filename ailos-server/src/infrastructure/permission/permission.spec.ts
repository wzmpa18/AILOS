/**
 * Permission Manager 单元测试
 * AILOS Phase 1 Task 3 — RBAC (User → Role → Permission)
 * 设计基线: Permission Manager Architecture Design v1.0 (Frozen)
 * 术语标准: Dual-Track Evolution (Personal + Platform)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';
import { UserRoleService } from './user-role.service';
import { PermissionGuard } from './permission.guard';
import { EventPublisherStub } from './event-publisher.stub';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';

// ============================================================
// 测试数据工厂
// ============================================================
const mockRole = (overrides = {}) => ({
  roleId: 'role-001',
  name: 'admin',
  displayName: '管理员',
  description: '系统管理员',
  orgScope: 'global',
  isSystem: true,
  evolutionTrack: 'platform',
  shardKey: null,
  policyEngineHook: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  _count: { rolePermissions: 3, userRoles: 1 },
  rolePermissions: [],
  userRoles: [],
  ...overrides,
});

const mockPermission = (overrides = {}) => ({
  permissionId: 'perm-001',
  code: 'learning:read',
  name: '查看学习内容',
  resource: 'learning',
  action: 'read',
  description: '允许查看学习内容',
  evolutionTrack: 'platform',
  shardKey: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  rolePermissions: [],
  ...overrides,
});

const mockUserRole = (overrides = {}) => ({
  id: 'ur-001',
  userId: BigInt(1),
  roleId: 'role-001',
  orgId: null,
  assignedBy: 'system',
  expiresAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  role: mockRole(),
  ...overrides,
});

// ============================================================
// RoleService 测试
// ============================================================
describe('RoleService', () => {
  let service: RoleService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      role: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  describe('create', () => {
    it('should create a new role', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue(mockRole());

      const result = await service.create({
        name: 'admin',
        displayName: '管理员',
      });

      expect(result.name).toBe('admin');
      expect(result.displayName).toBe('管理员');
      expect(result.permissionCount).toBe(0);
      expect(result.userCount).toBe(0);
    });

    it('should throw ConflictException for duplicate role name', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole());

      await expect(
        service.create({ name: 'admin', displayName: '管理员' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return role by id', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());

      const result = await service.findById('role-001');

      expect(result).not.toBeNull();
      expect(result!.roleId).toBe('role-001');
      expect(result!.permissionCount).toBe(3);
      expect(result!.userCount).toBe(1);
    });

    it('should return null for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return role by name', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());

      const result = await service.findByName('admin');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('admin');
    });

    it('should return null for unknown name', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await service.findByName('unknown');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return paginated roles', async () => {
      prisma.role.count.mockResolvedValue(2);
      prisma.role.findMany.mockResolvedValue([
        mockRole(),
        mockRole({ roleId: 'role-002', name: 'user', displayName: '用户' }),
      ]);

      const result = await service.list({ limit: 10 });

      expect(result.total).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it('should filter by orgScope', async () => {
      prisma.role.count.mockResolvedValue(1);
      prisma.role.findMany.mockResolvedValue([mockRole()]);

      const result = await service.list({ orgScope: 'global' });

      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update role displayName', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.role.update.mockResolvedValue(
        mockRole({ displayName: '超级管理员' }),
      );

      const result = await service.update('role-001', {
        displayName: '超级管理员',
      });

      expect(result.displayName).toBe('超级管理员');
    });

    it('should throw NotFoundException for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { displayName: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft-delete a non-system role', async () => {
      prisma.role.findFirst.mockResolvedValue(
        mockRole({ isSystem: false }),
      );
      prisma.role.update.mockResolvedValue(mockRole({ deletedAt: new Date() }));

      await expect(
        service.softDelete('role-001'),
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException for system role', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole({ isSystem: true }));

      await expect(
        service.softDelete('role-001'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.softDelete('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

// ============================================================
// PermissionService 测试
// ============================================================
describe('PermissionService', () => {
  let service: PermissionService;
  let prisma: any;
  let eventPublisher: any;

  beforeEach(async () => {
    prisma = {
      permission: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
      rolePermission: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };
    eventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherStub, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  describe('create', () => {
    it('should create a new permission', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue(mockPermission());

      const result = await service.create({
        code: 'learning:read',
        name: '查看学习内容',
        resource: 'learning',
        action: 'read',
      });

      expect(result.code).toBe('learning:read');
      expect(result.resource).toBe('learning');
      expect(result.action).toBe('read');
    });

    it('should throw ConflictException for duplicate code', async () => {
      prisma.permission.findUnique.mockResolvedValue(mockPermission());

      await expect(
        service.create({
          code: 'learning:read',
          name: '查看学习内容',
          resource: 'learning',
          action: 'read',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return permission by id', async () => {
      prisma.permission.findFirst.mockResolvedValue(mockPermission());

      const result = await service.findById('perm-001');

      expect(result).not.toBeNull();
      expect(result!.permissionId).toBe('perm-001');
    });

    it('should return null for non-existent permission', async () => {
      prisma.permission.findFirst.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return permission by code', async () => {
      prisma.permission.findFirst.mockResolvedValue(mockPermission());

      const result = await service.findByCode('learning:read');

      expect(result).not.toBeNull();
      expect(result!.code).toBe('learning:read');
    });
  });

  describe('findByResourceAndAction', () => {
    it('should return permission by resource and action', async () => {
      prisma.permission.findFirst.mockResolvedValue(mockPermission());

      const result = await service.findByResourceAndAction('learning', 'read');

      expect(result).not.toBeNull();
      expect(result!.resource).toBe('learning');
      expect(result!.action).toBe('read');
    });
  });

  describe('softDelete', () => {
    it('should soft-delete a permission', async () => {
      prisma.permission.findFirst.mockResolvedValue(mockPermission());
      prisma.permission.update.mockResolvedValue(
        mockPermission({ deletedAt: new Date() }),
      );

      await expect(service.softDelete('perm-001')).resolves.not.toThrow();
    });

    it('should throw NotFoundException for non-existent permission', async () => {
      prisma.permission.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('grantToRole', () => {
    it('should grant permission to role and publish event', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.permission.findFirst.mockResolvedValue(mockPermission());
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue({ id: 'rp-001' });

      await service.grantToRole('role-001', 'perm-001', 'operator-1');

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'permission.granted',
        expect.objectContaining({
          source: 'permission',
          payload: expect.objectContaining({
            roleId: 'role-001',
            permissionId: 'perm-001',
            grantedBy: 'operator-1',
          }),
        }),
      );
    });

    it('should throw ConflictException for duplicate grant', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.permission.findFirst.mockResolvedValue(mockPermission());
      prisma.rolePermission.findUnique.mockResolvedValue({ id: 'rp-001' });

      await expect(
        service.grantToRole('role-001', 'perm-001', 'operator-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.grantToRole('bad-role', 'perm-001', 'operator-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeFromRole', () => {
    it('should revoke permission from role and publish event', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({ id: 'rp-001' });
      prisma.rolePermission.delete.mockResolvedValue({});

      const result = await service.revokeFromRole(
        'role-001',
        'perm-001',
        'operator-1',
      );

      expect(result.success).toBe(true);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'permission.revoked',
        expect.objectContaining({
          payload: expect.objectContaining({
            roleId: 'role-001',
            permissionId: 'perm-001',
            revokedBy: 'operator-1',
          }),
        }),
      );
    });

    it('should return success=false for non-existent association', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue(null);

      const result = await service.revokeFromRole(
        'role-001',
        'perm-001',
        'operator-1',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('RolePermission association not found');
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for a role', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.rolePermission.findMany.mockResolvedValue([
        {
          permission: mockPermission(),
        },
        {
          permission: mockPermission({
            permissionId: 'perm-002',
            code: 'learning:write',
            action: 'write',
          }),
        },
      ]);

      const result = await service.getRolePermissions('role-001');

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('learning:read');
      expect(result[1].code).toBe('learning:write');
    });

    it('should throw NotFoundException for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      await expect(
        service.getRolePermissions('bad-role'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

// ============================================================
// UserRoleService 测试
// ============================================================
describe('UserRoleService', () => {
  let service: UserRoleService;
  let prisma: any;
  let eventPublisher: any;

  beforeEach(async () => {
    prisma = {
      role: {
        findFirst: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };
    eventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherStub, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<UserRoleService>(UserRoleService);
  });

  describe('assignRole', () => {
    it('should assign role to user and publish event', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.userRole.findFirst.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue(mockUserRole());

      const result = await service.assignRole('1', 'role-001', 'operator-1');

      expect(result.success).toBe(true);
      expect(result.userRoleId).toBe('ur-001');
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'role.assigned',
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: '1',
            roleId: 'role-001',
            assignedBy: 'operator-1',
          }),
        }),
      );
    });

    it('should return error for non-existent role', async () => {
      prisma.role.findFirst.mockResolvedValue(null);

      const result = await service.assignRole('1', 'bad-role', 'operator-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('ROLE_NOT_FOUND');
    });

    it('should return error for already assigned role', async () => {
      prisma.role.findFirst.mockResolvedValue(mockRole());
      prisma.userRole.findFirst.mockResolvedValue(mockUserRole());

      const result = await service.assignRole('1', 'role-001', 'operator-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_ASSIGNED');
    });
  });

  describe('unassignRole', () => {
    it('should unassign role from user and publish event', async () => {
      prisma.userRole.findFirst.mockResolvedValue(mockUserRole());
      prisma.userRole.delete.mockResolvedValue({});

      const result = await service.unassignRole('1', 'role-001', 'operator-1');

      expect(result.success).toBe(true);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'role.unassigned',
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: '1',
            roleId: 'role-001',
            unassignedBy: 'operator-1',
          }),
        }),
      );
    });

    it('should return error for non-existent assignment', async () => {
      prisma.userRole.findFirst.mockResolvedValue(null);

      const result = await service.unassignRole('1', 'bad-role', 'operator-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('ROLE_NOT_FOUND');
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      prisma.userRole.findMany.mockResolvedValue([mockUserRole()]);

      const result = await service.getUserRoles('1');

      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe('role-001');
      expect(result[0].roleName).toBe('admin');
    });

    it('should filter out deleted roles', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        mockUserRole({
          role: mockRole({ deletedAt: new Date() }),
        }),
        mockUserRole({
          id: 'ur-002',
          role: mockRole({ roleId: 'role-002', name: 'user' }),
        }),
      ]);

      const result = await service.getUserRoles('1');

      expect(result).toHaveLength(1);
      expect(result[0].roleId).toBe('role-002');
    });
  });

  describe('getUserPermissions', () => {
    it('should aggregate permissions from all user roles', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          id: 'ur-001',
          userId: BigInt(1),
          roleId: 'role-001',
          role: {
            roleId: 'role-001',
            name: 'admin',
            deletedAt: null,
            rolePermissions: [
              {
                permission: mockPermission(),
              },
              {
                permission: mockPermission({
                  permissionId: 'perm-002',
                  code: 'learning:write',
                  action: 'write',
                }),
              },
            ],
          },
        },
      ]);

      const result = await service.getUserPermissions('1');

      expect(result).toHaveLength(2);
      const codes = result.map((p: { code: string }) => p.code);
      expect(codes).toContain('learning:read');
      expect(codes).toContain('learning:write');
    });

    it('should deduplicate permissions across roles', async () => {
      prisma.userRole.findMany.mockResolvedValue([
        {
          id: 'ur-001',
          userId: BigInt(1),
          roleId: 'role-001',
          role: {
            roleId: 'role-001',
            name: 'admin',
            deletedAt: null,
            rolePermissions: [
              {
                permission: mockPermission(),
              },
            ],
          },
        },
        {
          id: 'ur-002',
          userId: BigInt(1),
          roleId: 'role-002',
          role: {
            roleId: 'role-002',
            name: 'editor',
            deletedAt: null,
            rolePermissions: [
              {
                permission: mockPermission(),
              },
            ],
          },
        },
      ]);

      const result = await service.getUserPermissions('1');

      // Deduplicated by code
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('learning:read');
    });
  });

  describe('list', () => {
    it('should return paginated user roles', async () => {
      prisma.userRole.count.mockResolvedValue(1);
      prisma.userRole.findMany.mockResolvedValue([mockUserRole()]);

      const result = await service.list({ limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });
});

// ============================================================
// PermissionGuard 测试
// ============================================================
describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: any;
  let userRoleService: any;
  let eventPublisher: any;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    userRoleService = {
      getUserRoles: jest.fn(),
      getUserPermissions: jest.fn(),
    };
    eventPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: reflector },
        { provide: UserRoleService, useValue: userRoleService },
        { provide: EventPublisherStub, useValue: eventPublisher },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
  });

  function createMockContext(
    userId: string | null,
    resource?: string,
    action?: string,
  ): ExecutionContext {
    const request: any = {
      headers: {},
      query: {},
      user: {},
    };
    if (userId) {
      request.user.userId = userId;
    }

    reflector.getAllAndOverride.mockReturnValue(
      resource && action ? { resource, action } : undefined,
    );

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  describe('canActivate', () => {
    it('should pass without @RequirePermission decorator', async () => {
      const ctx = createMockContext(null);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when userId not found', async () => {
      const ctx = createMockContext(null, 'learning', 'read');

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no roles (NO_ROLE)', async () => {
      const ctx = createMockContext('1', 'learning', 'read');
      userRoleService.getUserRoles.mockResolvedValue([]);

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'permission.denied',
        expect.objectContaining({
          payload: expect.objectContaining({
            userId: '1',
            resource: 'learning',
            action: 'read',
            reason: 'NO_ROLE',
          }),
        }),
      );
    });

    it('should throw ForbiddenException when permission not matched (NO_PERMISSION)', async () => {
      const ctx = createMockContext('1', 'admin', 'manage');
      userRoleService.getUserRoles.mockResolvedValue([
        { roleId: 'role-001', roleName: 'user' },
      ]);
      userRoleService.getUserPermissions.mockResolvedValue([
        { code: 'learning:read', resource: 'learning', action: 'read' },
      ]);

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        'permission.denied',
        expect.objectContaining({
          payload: expect.objectContaining({
            reason: 'NO_PERMISSION',
          }),
        }),
      );
    });

    it('should pass when permission matches exactly', async () => {
      const ctx = createMockContext('1', 'learning', 'read');
      userRoleService.getUserRoles.mockResolvedValue([
        { roleId: 'role-001', roleName: 'user' },
      ]);
      userRoleService.getUserPermissions.mockResolvedValue([
        { code: 'learning:read', resource: 'learning', action: 'read' },
      ]);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('should support wildcard resource (*)', async () => {
      const ctx = createMockContext('1', 'learning', 'read');
      userRoleService.getUserRoles.mockResolvedValue([
        { roleId: 'role-001', roleName: 'admin' },
      ]);
      userRoleService.getUserPermissions.mockResolvedValue([
        { code: 'admin:*', resource: '*', action: 'manage' },
      ]);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('should support wildcard action (manage)', async () => {
      const ctx = createMockContext('1', 'learning', 'delete');
      userRoleService.getUserRoles.mockResolvedValue([
        { roleId: 'role-001', roleName: 'admin' },
      ]);
      userRoleService.getUserPermissions.mockResolvedValue([
        { code: 'learning:manage', resource: 'learning', action: 'manage' },
      ]);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
    });
  });
});

// ============================================================
// EventPublisherStub 测试
// ============================================================
describe('EventPublisherStub', () => {
  let stub: EventPublisherStub;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventPublisherStub],
    }).compile();

    stub = module.get<EventPublisherStub>(EventPublisherStub);
  });

  it('should publish event without error', async () => {
    await expect(
      stub.publish('permission.granted', {
        event_id: 'evt-001',
        timestamp: new Date().toISOString(),
        source: 'permission',
        trace_id: 'trace-001',
        payload: { roleId: 'role-001', permissionId: 'perm-001', grantedBy: 'system' },
      }),
    ).resolves.not.toThrow();
  });
});