/**
 * Cache L2/L3 Module
 * Phase 1 Task 6: IMPLEMENT
 *
 * @Global() 模块，全平台可用
 * 注册 L1 MemoryStore + L2 RedisStore + L3 PrismaStore
 * 对外暴露: ICACHE_STORE (CacheManager)
 */

import { Module, Global, OnModuleInit } from '@nestjs/common';
import { CacheManager } from './cache.service';
import { MemoryStore } from './stores/memory-store';
import { RedisStore } from './stores/redis-store';
import { PrismaStore } from './stores/prisma-store';
import { ICACHE_STORE } from './cache.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    MemoryStore,
    RedisStore,
    PrismaStore,
    CacheManager,
    {
      provide: ICACHE_STORE,
      useExisting: CacheManager,
    },
  ],
  exports: [ICACHE_STORE, CacheManager, MemoryStore, RedisStore, PrismaStore],
})
export class CacheModule implements OnModuleInit {
  constructor(
    private readonly redisStore: RedisStore,
    private readonly prismaStore: PrismaStore,
    private readonly cacheManager: CacheManager,
  ) {}

  async onModuleInit(): Promise<void> {
    // 初始化 L2 Redis 连接
    await this.redisStore.connect();
    // 初始化 L3 Prisma 连接检查
    await this.prismaStore.connect();
    // 启动定期巡检
    this.cacheManager.startPeriodicCleanup();
  }
}