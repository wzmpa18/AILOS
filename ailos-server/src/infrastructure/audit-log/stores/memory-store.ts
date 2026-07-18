import { Injectable, Logger } from '@nestjs/common';
import {
  AuditLogEntry,
  AuditLogQueryParams,
  AuditLogQueryResult,
  AuditLogCountParams,
  PurgeOptions,
  IAuditLogStore,
  MAX_MEMORY_ENTRIES,
} from '../audit-log.types';

/**
 * Memory Store — Phase 1 内存审计日志存储
 *
 * 特性:
 * - 进程内存存储 (Map)，容量上限 10,000 条
 * - 超过上限 FIFO 淘汰最旧记录
 * - 全量内存扫描 + 条件过滤
 * - 不持久化，进程重启丢失
 *
 * 设计基线: Audit Log Architecture Design v1.0 (07a6f29)
 * 内部实现: 仅通过 Module DI 注入，不对外暴露
 */
@Injectable()
export class MemoryStore implements IAuditLogStore {
  private readonly logger = new Logger(MemoryStore.name);
  private readonly entries: AuditLogEntry[] = [];

  /** 追加日志 */
  async append(entry: AuditLogEntry): Promise<void> {
    // FIFO 淘汰
    if (this.entries.length >= MAX_MEMORY_ENTRIES) {
      const removed = this.entries.shift();
      this.logger.warn(
        `MemoryStore full (${MAX_MEMORY_ENTRIES}), FIFO evicted: ${removed?.id}`,
      );
    }
    this.entries.push(entry);
  }

  /** 查询日志 */
  async query(params: AuditLogQueryParams): Promise<AuditLogQueryResult> {
    let filtered = this.applyFilters(this.entries, params);

    // 排序
    const orderBy = params.order_by ?? 'ingested_at';
    const orderDir = params.order_dir ?? 'desc';
    filtered.sort((a, b) => {
      const va = a[orderBy];
      const vb = b[orderBy];
      if (va === vb) return 0;
      if (orderDir === 'asc') return va! < vb! ? -1 : 1;
      return va! > vb! ? -1 : 1;
    });

    const total = filtered.length;
    const page = params.page ?? 1;
    const pageSize = params.page_size ?? 20;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, page_size: pageSize, total_pages: totalPages };
  }

  /** 按 ID 获取日志 */
  async getById(id: string): Promise<AuditLogEntry | null> {
    return this.entries.find((e) => e.id === id) ?? null;
  }

  /** 获取日志总数 */
  async count(params?: AuditLogCountParams): Promise<number> {
    if (!params) return this.entries.length;
    return this.applyFilters(this.entries, params).length;
  }

  /** 清理过期日志 */
  async purge(options: PurgeOptions): Promise<number> {
    const before = this.entries.length;
    let remaining = this.entries;

    if (options.before) {
      const cutoff = new Date(options.before).getTime();
      remaining = remaining.filter((e) => new Date(e.ingested_at).getTime() >= cutoff);
    }

    if (options.categories && options.categories.length > 0) {
      remaining = remaining.filter((e) => !options.categories!.includes(e.category));
    }

    if (options.max_count !== undefined && remaining.length > options.max_count) {
      remaining = remaining.slice(remaining.length - options.max_count);
    }

    this.entries.length = 0;
    this.entries.push(...remaining);

    const removed = before - this.entries.length;
    this.logger.log(`Purged ${removed} entries, ${this.entries.length} remaining`);
    return removed;
  }

  // ============================================
  // 内部过滤逻辑
  // ============================================

  private applyFilters(
    list: AuditLogEntry[],
    params: AuditLogQueryParams | AuditLogCountParams,
  ): AuditLogEntry[] {
    let result = list;

    if ('from' in params && params.from) {
      const fromMs = new Date(params.from).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= fromMs);
    }
    if ('to' in params && params.to) {
      const toMs = new Date(params.to).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() <= toMs);
    }
    if ('event_types' in params && params.event_types?.length) {
      result = result.filter((e) => params.event_types!.includes(e.event_type));
    }
    if ('categories' in params && params.categories?.length) {
      result = result.filter((e) => params.categories!.includes(e.category));
    }
    if ('levels' in params && params.levels?.length) {
      result = result.filter((e) => params.levels!.includes(e.level));
    }
    if ('actor_id' in params && params.actor_id) {
      result = result.filter((e) => e.actor.user_id === params.actor_id);
    }
    if ('entity_type' in params && params.entity_type) {
      result = result.filter((e) => e.target.entity_type === params.entity_type);
    }
    if ('entity_id' in params && params.entity_id) {
      result = result.filter((e) => e.target.entity_id === params.entity_id);
    }
    if ('trace_id' in params && params.trace_id) {
      result = result.filter((e) => e.trace_id === params.trace_id);
    }
    if ('evolution_track' in params && params.evolution_track) {
      result = result.filter((e) => e.evolution_track === params.evolution_track);
    }

    return result;
  }
}