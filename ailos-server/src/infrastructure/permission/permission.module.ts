import { Module, Global } from '@nestjs/common';
import { RoleService } from './role.service';
import { PermissionService } from './permission.service';
import { UserRoleService } from './user-role.service';
import { PermissionGuard } from './permission.guard';
import { EventPublisherStub } from './event-publisher.stub';
import { PermissionSeedService } from './permission-seed.service';

/**
 * Permission Manager Module — Runtime Core 基础设施
 * @Global() 全局模块，整个应用共享同一个 PermissionManager 实例
 *
 * 权限模型: RBAC (User → Role → Permission)
 * 术语标准: Dual-Track Evolution (Personal + Platform)
 * 认证分离: Auth Layer 负责 Authentication，本模块负责 Authorization
 */
@Global()
@Module({
  providers: [
    RoleService,
    PermissionService,
    UserRoleService,
    PermissionGuard,
    EventPublisherStub,
    PermissionSeedService,
  ],
  exports: [
    RoleService,
    PermissionService,
    UserRoleService,
    PermissionGuard,
    EventPublisherStub,
  ],
})
export class PermissionModule {}