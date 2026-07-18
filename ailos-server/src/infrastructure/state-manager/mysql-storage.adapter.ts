import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import {
  IStorageAdapter,
  StateEntry,
} from './state-manager.types';
import { randomUUID } from 'crypto';

/**
 * MySQL 存储适配器 — State Manager 持久化真值源
 * 使用 Prisma 操作 runtime_state 表
 * 注意：此适配器依赖 PrismaService 提供的数据库连接
 */
@Injectable()
export class MysqlStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(MysqlStorageAdapter.name);
  private prismaClient: any;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<void> {
    const { PrismaClient } = require('@prisma/client');
    this.prismaClient = new PrismaClient();
    await this.prismaClient.$connect();
    this.logger.log('MySQL storage adapter connected');
  }

  async disconnect(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.logger.log('MySQL storage adapter disconnected');
    }
  }

  async read(entry: {
    state_key: string;
    namespace: string;
  }): Promise<StateEntry | null> {
    const row = await this.prismaClient.runtime_state.findUnique({
      where: { state_key: entry.state_key },
    });
    if (!row || row.deleted_at) return null;
    return this.mapRow(row);
  }

  async write(
    entry: Omit<StateEntry, 'created_at' | 'updated_at'>,
  ): Promise<void> {
    const now = new Date();
    await this.prismaClient.runtime_state.create({
      data: {
        state_id: entry.state_id,
        namespace: entry.namespace,
        state_key: entry.state_key,
        state_value: JSON.stringify(entry.state_value),
        provider_name: entry.provider_name,
        owner_type: entry.owner_type,
        owner_id: entry.owner_id,
        version: entry.version,
        ttl: entry.ttl ? BigInt(entry.ttl) : null,
        deleted_at: null,
      },
    });
  }

  async update(
    key: string,
    value: Record<string, unknown>,
    expectedVersion: number,
  ): Promise<{ success: boolean; newVersion: number }> {
    const now = new Date();
    const newVersion = expectedVersion + 1;

    const result = await this.prismaClient.runtime_state.updateMany({
      where: {
        state_key: key,
        version: expectedVersion,
        deleted_at: null,
      },
      data: {
        state_value: JSON.stringify(value),
        version: newVersion,
        updated_at: now,
      },
    });

    if (result.count === 0) {
      return { success: false, newVersion: expectedVersion };
    }
    return { success: true, newVersion };
  }

  async softDelete(key: string): Promise<void> {
    const now = new Date();
    await this.prismaClient.runtime_state.updateMany({
      where: { state_key: key, deleted_at: null },
      data: { deleted_at: now, updated_at: now },
    });
  }

  async batchRead(
    keys: string[],
  ): Promise<Map<string, StateEntry | null>> {
    const result = new Map<string, StateEntry | null>();
    const rows = await this.prismaClient.runtime_state.findMany({
      where: {
        state_key: { in: keys },
        deleted_at: null,
      },
    });
    const rowMap = new Map<string, any>();
    for (const row of rows) {
      rowMap.set(row.state_key, row);
    }
    for (const key of keys) {
      const row = rowMap.get(key);
      result.set(key, row ? this.mapRow(row) : null);
    }
    return result;
  }

  async batchWrite(
    entries: Omit<StateEntry, 'created_at' | 'updated_at'>[],
  ): Promise<void> {
    const now = new Date();
    await this.prismaClient.runtime_state.createMany({
      data: entries.map((e) => ({
        state_id: e.state_id,
        namespace: e.namespace,
        state_key: e.state_key,
        state_value: JSON.stringify(e.state_value),
        provider_name: e.provider_name,
        owner_type: e.owner_type,
        owner_id: e.owner_id,
        version: e.version,
        ttl: e.ttl ? BigInt(e.ttl) : null,
        deleted_at: null,
      })),
      skipDuplicates: true,
    });
  }

  async batchDelete(keys: string[]): Promise<void> {
    const now = new Date();
    await this.prismaClient.runtime_state.updateMany({
      where: { state_key: { in: keys }, deleted_at: null },
      data: { deleted_at: now, updated_at: now },
    });
  }

  async snapshot(
    namespace: string,
  ): Promise<Map<string, StateEntry>> {
    const result = new Map<string, StateEntry>();
    const rows = await this.prismaClient.runtime_state.findMany({
      where: { namespace, deleted_at: null },
    });
    for (const row of rows) {
      result.set(row.state_key, this.mapRow(row));
    }
    return result;
  }

  async restore(
    namespace: string,
    entries: Map<string, StateEntry>,
  ): Promise<void> {
    const now = new Date();
    // 先软删除现有命名空间下的所有状态
    await this.prismaClient.runtime_state.updateMany({
      where: { namespace, deleted_at: null },
      data: { deleted_at: now, updated_at: now },
    });
    // 再写入快照数据
    const data = Array.from(entries.values()).map((e) => ({
      state_id: randomUUID(),
      namespace: e.namespace,
      state_key: e.state_key,
      state_value: JSON.stringify(e.state_value),
      provider_name: e.provider_name,
      owner_type: e.owner_type,
      owner_id: e.owner_id,
      version: e.version + 1,
      ttl: e.ttl ? BigInt(e.ttl) : null,
      deleted_at: null,
    }));
    await this.prismaClient.runtime_state.createMany({ data });
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const result = await this.prismaClient.runtime_state.updateMany({
      where: {
        ttl: { not: null, lt: BigInt(now) },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
    this.logger.log(`Cleaned up ${result.count} expired states`);
    return result.count;
  }

  private mapRow(row: any): StateEntry {
    return {
      state_id: row.state_id,
      namespace: row.namespace,
      state_key: row.state_key,
      state_value:
        typeof row.state_value === 'string'
          ? JSON.parse(row.state_value)
          : row.state_value,
      provider_name: row.provider_name,
      owner_type: row.owner_type,
      owner_id: row.owner_id,
      version: row.version,
      ttl: row.ttl ? Number(row.ttl) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    };
  }
}