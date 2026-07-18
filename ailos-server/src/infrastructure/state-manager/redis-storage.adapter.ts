import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import {
  IStorageAdapter,
  StateEntry,
} from './state-manager.types';

/**
 * Redis 存储适配器 — State Manager 运行时缓存层
 * 使用 ioredis 操作 Redis
 * 不具备最终数据效力，数据恢复以 MySQL 为准
 */
@Injectable()
export class RedisStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(RedisStorageAdapter.name);
  private redis: any;
  private connected = false;
  private readonly KEY_PREFIX = 'ailos:state:';
  private readonly DEFAULT_TTL = 3600;

  constructor(private readonly configService: ConfigService) {}

  async connect(): Promise<void> {
    const { host, port } = this.configService.redisConfig;
    const Redis = require('ioredis');
    this.redis = new Redis({
      host,
      port,
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    this.redis.on('error', (err: Error) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
      this.connected = false;
    });

    this.redis.on('connect', () => {
      this.connected = true;
      this.logger.log('Redis storage adapter connected');
    });

    try {
      await this.redis.connect();
    } catch (error: any) {
      this.logger.warn(`Redis connection failed, continuing without cache: ${error.message}`);
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.connected = false;
      this.logger.log('Redis storage adapter disconnected');
    }
  }

  private buildKey(stateKey: string): string {
    return `${this.KEY_PREFIX}${stateKey}`;
  }

  async read(entry: {
    state_key: string;
    namespace: string;
  }): Promise<StateEntry | null> {
    if (!this.connected) return null;
    try {
      const raw = await this.redis.get(this.buildKey(entry.state_key));
      if (!raw) return null;
      return JSON.parse(raw) as StateEntry;
    } catch {
      return null;
    }
  }

  async write(
    entry: Omit<StateEntry, 'created_at' | 'updated_at'>,
  ): Promise<void> {
    if (!this.connected) return;
    const ttl = entry.ttl
      ? Math.ceil((entry.ttl - Date.now()) / 1000)
      : this.DEFAULT_TTL;
    if (ttl <= 0) return;

    const data: StateEntry = {
      ...entry,
      created_at: new Date(),
      updated_at: new Date(),
    };
    try {
      await this.redis.set(
        this.buildKey(entry.state_key),
        JSON.stringify(data),
        'EX',
        ttl,
      );
    } catch (err: any) {
      this.logger.warn(`Redis write failed for "${entry.state_key}": ${err.message}`);
    }
  }

  async update(
    key: string,
    value: Record<string, unknown>,
    version: number,
  ): Promise<{ success: boolean; newVersion: number }> {
    if (!this.connected) {
      return { success: false, newVersion: version };
    }
    try {
      const redisKey = this.buildKey(key);
      const raw = await this.redis.get(redisKey);
      if (!raw) {
        return { success: false, newVersion: version };
      }
      const current = JSON.parse(raw) as StateEntry;
      if (current.version !== version) {
        return { success: false, newVersion: current.version };
      }
      const newVersion = version + 1;
      current.state_value = value;
      current.version = newVersion;
      current.updated_at = new Date();
      const ttl = current.ttl
        ? Math.ceil((current.ttl - Date.now()) / 1000)
        : this.DEFAULT_TTL;
      await this.redis.set(redisKey, JSON.stringify(current), 'EX', ttl);
      return { success: true, newVersion };
    } catch {
      return { success: false, newVersion: version };
    }
  }

  async softDelete(key: string): Promise<void> {
    if (!this.connected) return;
    try {
      await this.redis.del(this.buildKey(key));
    } catch {
      // 缓存删除失败不影响主流程
    }
  }

  async batchRead(
    keys: string[],
  ): Promise<Map<string, StateEntry | null>> {
    const result = new Map<string, StateEntry | null>();
    if (!this.connected) {
      for (const key of keys) result.set(key, null);
      return result;
    }
    try {
      const redisKeys = keys.map((k) => this.buildKey(k));
      const values = await this.redis.mget(...redisKeys);
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          result.set(keys[i], JSON.parse(values[i] as string));
        } else {
          result.set(keys[i], null);
        }
      }
    } catch {
      for (const key of keys) result.set(key, null);
    }
    return result;
  }

  async batchWrite(
    entries: Omit<StateEntry, 'created_at' | 'updated_at'>[],
  ): Promise<void> {
    if (!this.connected) return;
    try {
      const pipeline = this.redis.pipeline();
      for (const entry of entries) {
        const ttl = entry.ttl
          ? Math.ceil((entry.ttl - Date.now()) / 1000)
          : this.DEFAULT_TTL;
        if (ttl <= 0) continue;
        const data: StateEntry = {
          ...entry,
          created_at: new Date(),
          updated_at: new Date(),
        };
        pipeline.set(
          this.buildKey(entry.state_key),
          JSON.stringify(data),
          'EX',
          ttl,
        );
      }
      await pipeline.exec();
    } catch (err: any) {
      this.logger.warn(`Redis batch write failed: ${err.message}`);
    }
  }

  async batchDelete(keys: string[]): Promise<void> {
    if (!this.connected) return;
    try {
      const redisKeys = keys.map((k) => this.buildKey(k));
      await this.redis.del(...redisKeys);
    } catch {
      // 缓存删除失败不影响主流程
    }
  }

  async snapshot(
    namespace: string,
  ): Promise<Map<string, StateEntry>> {
    const result = new Map<string, StateEntry>();
    if (!this.connected) return result;
    try {
      const pattern = `${this.KEY_PREFIX}${namespace}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return result;
      const values = await this.redis.mget(...keys);
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          const entry = JSON.parse(values[i] as string) as StateEntry;
          result.set(entry.state_key, entry);
        }
      }
    } catch {
      // 快照失败返回空
    }
    return result;
  }

  async restore(
    namespace: string,
    entries: Map<string, StateEntry>,
  ): Promise<void> {
    if (!this.connected) return;
    try {
      // 清除现有缓存
      const pattern = `${this.KEY_PREFIX}${namespace}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      // 写入快照数据
      const pipeline = this.redis.pipeline();
      for (const [key, entry] of entries) {
        const ttl = entry.ttl
          ? Math.ceil((entry.ttl - Date.now()) / 1000)
          : this.DEFAULT_TTL;
        pipeline.set(
          this.buildKey(key),
          JSON.stringify(entry),
          'EX',
          ttl,
        );
      }
      await pipeline.exec();
    } catch {
      // 恢复失败不影响主流程
    }
  }

  async cleanupExpired(): Promise<number> {
    // Redis 原生 TTL 自动过期，无需手动清理
    return 0;
  }
}