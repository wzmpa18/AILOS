import { Injectable, Logger } from '@nestjs/common';

/**
 * 资产版本兼容服务
 *
 * 核心规则：
 * 1. 核心资产表结构变更必须向下兼容所有历史数据
 * 2. 支持平滑迁移，无破坏性升级
 * 3. 新字段必须有默认值
 * 4. 旧字段不可删除，只能标记废弃
 */
@Injectable()
export class VersionCompatService {
  private readonly logger = new Logger(VersionCompatService.name);

  // 当前资产表结构版本
  private readonly CURRENT_SCHEMA_VERSION = '1.0.0';

  // 字段废弃标记
  private deprecatedFields: Map<string, { deprecatedAt: string; replacement?: string }> = new Map();

  /**
   * 迁移资产到新版本
   */
  migrateAsset(asset: any, fromVersion: string, toVersion: string): any {
    this.logger.log(`[VersionCompat] Migrating from v${fromVersion} to v${toVersion}`);

    let migrated = { ...asset };

    // 1.0.0 → 1.1.0 迁移示例
    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      migrated = {
        ...migrated,
        // 新增字段（带默认值）
        aiGeneratedFlag: migrated.aiGeneratedFlag ?? false,
        contentHash: migrated.contentHash ?? '',
        lastAccessedAt: migrated.lastAccessedAt ?? migrated.updatedAt,
      };
    }

    // 通用迁移：确保所有当前版本字段存在
    migrated = this.ensureCurrentFields(migrated);

    migrated._schemaVersion = toVersion;
    migrated._migratedAt = new Date().toISOString();

    return migrated;
  }

  /**
   * 确保当前版本字段存在
   */
  private ensureCurrentFields(asset: any): any {
    // 定义当前版本所有必需字段
    const requiredFields: Record<string, any> = {
      qualityScore: 0,
      reuseCount: 0,
      copyrightAuditStatus: 'pending',
      tags: [],
      _schemaVersion: this.CURRENT_SCHEMA_VERSION,
    };

    for (const [field, defaultValue] of Object.entries(requiredFields)) {
      if (!(field in asset)) {
        asset[field] = defaultValue;
      }
    }

    return asset;
  }

  /**
   * 标记字段废弃
   */
  deprecateField(fieldName: string, replacement?: string): void {
    this.deprecatedFields.set(fieldName, {
      deprecatedAt: new Date().toISOString(),
      replacement,
    });
    this.logger.warn(`[VersionCompat] Field deprecated: ${fieldName}${replacement ? ` -> ${replacement}` : ''}`);
  }

  /**
   * 验证资产兼容性
   */
  validateCompatibility(asset: any): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查废弃字段
    for (const [field, info] of this.deprecatedFields) {
      if (field in asset) {
        issues.push(`Field '${field}' is deprecated${info.replacement ? `. Use '${info.replacement}' instead` : ''}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * 获取当前Schema版本
   */
  getCurrentSchemaVersion(): string {
    return this.CURRENT_SCHEMA_VERSION;
  }
}
