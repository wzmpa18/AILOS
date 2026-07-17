import { Injectable, Logger } from '@nestjs/common';
import { UserAsset } from './dto/asset.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户私有资产服务
 *
 * 核心规则：
 * 1. 仅支持查询和追加，不支持物理删除与核心字段修改
 * 2. 所有写入操作全程留痕，可审计追溯
 * 3. 用户资产终身归属，不可转让或删除
 * 4. 禁止业务模块直连底层资产表
 */
@Injectable()
export class UserAssetService {
  private readonly logger = new Logger(UserAssetService.name);

  // 内存模拟存储（生产环境写入 user_db）
  private userAssets: Map<string, UserAsset[]> = new Map();
  private auditLog: any[] = [];

  /**
   * 查询用户资产（仅支持读取）
   */
  async getUserAssets(userId: string, assetType?: string): Promise<UserAsset[]> {
    const assets = this.userAssets.get(userId) || [];
    if (assetType) {
      return assets.filter((a) => a.assetType === assetType);
    }
    return assets;
  }

  /**
   * 查询单个用户资产
   */
  async getUserAsset(userId: string, assetType: string): Promise<UserAsset | null> {
    const assets = this.userAssets.get(userId) || [];
    return assets.find((a) => a.assetType === assetType) || null;
  }

  /**
   * 追加用户资产（仅追加，不修改已有数据）
   * 新数据追加到历史记录中，保留完整演变轨迹
   */
  async appendAsset(userId: string, assetType: string, data: Record<string, any>): Promise<UserAsset> {
    if (!this.userAssets.has(userId)) {
      this.userAssets.set(userId, []);
    }

    const existing = await this.getUserAsset(userId, assetType);
    const version = existing ? existing.version + 1 : 1;

    const asset: UserAsset = {
      userId,
      assetType,
      data: {
        // 保留历史数据
        ...(existing?.data || {}),
        // 追加新数据
        ...data,
        // 记录变更历史
        _history: [
          ...((existing?.data as any)?._history || []),
          {
            version,
            data: { ...data },
            timestamp: new Date().toISOString(),
          },
        ],
      },
      version,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const assets = this.userAssets.get(userId)!;
    if (existing) {
      const idx = assets.findIndex((a) => a.assetType === assetType);
      assets[idx] = asset;
    } else {
      assets.push(asset);
    }

    // 审计日志
    this.recordAudit(userId, 'APPEND', assetType, { version, dataKeys: Object.keys(data) });

    this.logger.log(`[UserAsset] Appended: userId=${userId}, type=${assetType}, version=${version}`);
    return asset;
  }

  /**
   * 获取资产变更历史
   */
  async getAssetHistory(userId: string, assetType: string): Promise<any[]> {
    const asset = await this.getUserAsset(userId, assetType);
    if (!asset) return [];
    return (asset.data as any)?._history || [];
  }

  /**
   * 审计日志记录
   */
  private recordAudit(userId: string, operation: string, assetType: string, detail: any): void {
    this.auditLog.push({
      id: uuidv4(),
      userId,
      operation,
      assetType,
      detail,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1',
    });
  }

  /**
   * 获取审计日志
   */
  async getAuditLogs(userId?: string, limit: number = 100): Promise<any[]> {
    let logs = this.auditLog;
    if (userId) {
      logs = logs.filter((l) => l.userId === userId);
    }
    return logs.slice(-limit);
  }
}
