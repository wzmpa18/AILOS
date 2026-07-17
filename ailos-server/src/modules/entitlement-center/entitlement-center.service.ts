import { Injectable, Logger } from '@nestjs/common';
import { MembershipLevel, MemberRights, UserQuota, QuotaConsumeRequest, MembershipUpdate } from './dto/entitlement.dto';

/**
 * 权益中心 - 商业化与核心业务的解耦中间层
 *
 * 核心职责：
 * 1. 管理用户会员等级、权益有效期、功能权限
 * 2. 向AI Gateway、学习引擎同步用户配额
 * 3. 对接营销模块的权益变更接口
 * 4. 屏蔽底层业务细节
 *
 * 绝对禁区：
 * - 不处理订单、支付、分销等营销业务逻辑
 * - 不直接操作学习数据
 * - 不直接调用AI模型
 */
@Injectable()
export class EntitlementCenterService {
  private readonly logger = new Logger(EntitlementCenterService.name);

  // 会员权益配置
  private readonly RIGHTS_CONFIG: Record<MembershipLevel, MemberRights> = {
    [MembershipLevel.FREE]: {
      level: MembershipLevel.FREE,
      aiDailyQuota: 50,
      modelPermissions: ['hunyuan-lite'],
      features: ['basic_learning', 'basic_companion', 'limited_stories'],
    },
    [MembershipLevel.MEMBER]: {
      level: MembershipLevel.MEMBER,
      aiDailyQuota: 200,
      modelPermissions: ['hunyuan-lite', 'hunyuan-standard'],
      features: ['full_learning', 'full_companion', 'unlimited_stories', 'community'],
    },
    [MembershipLevel.PREMIUM]: {
      level: MembershipLevel.PREMIUM,
      aiDailyQuota: 500,
      modelPermissions: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
      features: ['all_features', 'priority_support', 'early_access', 'custom_voice'],
    },
  };

  // 用户数据（内存模拟，生产环境写入 user_db + marketing_db）
  private userMemberships: Map<string, { level: MembershipLevel; effectiveFrom: string; expiresAt?: string }> =
    new Map();
  private userQuotas: Map<string, { remaining: number; consumed: number }> = new Map();

  /**
   * 获取用户会员信息
   */
  async getUserMembership(userId: string): Promise<MemberRights> {
    const membership = this.userMemberships.get(userId);
    const level = membership?.level || MembershipLevel.FREE;

    const rights = this.RIGHTS_CONFIG[level];

    // 检查是否过期
    if (membership?.expiresAt && new Date(membership.expiresAt) < new Date()) {
      return this.RIGHTS_CONFIG[MembershipLevel.FREE];
    }

    return rights;
  }

  /**
   * 获取用户配额
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    const membership = await this.getUserMembership(userId);
    const quota = this.userQuotas.get(userId) || { remaining: membership.aiDailyQuota, consumed: 0 };

    return {
      userId,
      remainingAmount: quota.remaining,
      totalConsumed: quota.consumed,
      level: membership.level,
    };
  }

  /**
   * 消费配额
   */
  async consumeQuota(request: QuotaConsumeRequest): Promise<{ allowed: boolean; remaining: number }> {
    const quota = this.userQuotas.get(request.userId) || {
      remaining: this.RIGHTS_CONFIG[MembershipLevel.FREE].aiDailyQuota,
      consumed: 0,
    };

    if (quota.remaining < request.amount) {
      return { allowed: false, remaining: quota.remaining };
    }

    quota.remaining -= request.amount;
    quota.consumed += request.amount;
    this.userQuotas.set(request.userId, quota);

    this.logger.log(
      `[Entitlement] Quota consumed: userId=${request.userId}, scene=${request.scene}, remaining=${quota.remaining}`,
    );
    return { allowed: true, remaining: quota.remaining };
  }

  /**
   * 更新会员等级（由营销模块调用）
   */
  async updateMembership(update: MembershipUpdate): Promise<{ success: boolean }> {
    this.userMemberships.set(update.userId, {
      level: update.newLevel,
      effectiveFrom: update.effectiveFrom,
      expiresAt: update.expiresAt,
    });

    // 重置配额
    const newRights = this.RIGHTS_CONFIG[update.newLevel];
    this.userQuotas.set(update.userId, { remaining: newRights.aiDailyQuota, consumed: 0 });

    this.logger.log(
      `[Entitlement] Membership updated: userId=${update.userId}, level=${update.newLevel}, reason=${update.reason}`,
    );

    return { success: true };
  }

  /**
   * 检查功能权限
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const membership = await this.getUserMembership(userId);
    return membership.features.includes(feature) || membership.features.includes('all_features');
  }

  /**
   * 检查模型权限
   */
  async checkModelAccess(userId: string, modelName: string): Promise<boolean> {
    const membership = await this.getUserMembership(userId);
    return membership.modelPermissions.includes(modelName);
  }

  /**
   * 每日重置配额（定时任务）
   */
  async resetDailyQuotas(): Promise<void> {
    let count = 0;
    for (const [userId] of this.userMemberships) {
      const membership = await this.getUserMembership(userId);
      this.userQuotas.set(userId, { remaining: membership.aiDailyQuota, consumed: 0 });
      count++;
    }
    this.logger.log(`[Entitlement] Daily quotas reset for ${count} users`);
  }

  /**
   * 获取会员配置
   */
  getRightsConfig(): Record<MembershipLevel, MemberRights> {
    return this.RIGHTS_CONFIG;
  }
}
