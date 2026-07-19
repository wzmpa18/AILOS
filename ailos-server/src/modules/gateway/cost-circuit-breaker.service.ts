import { Injectable, Logger } from '@nestjs/common';
import { GatewayRequest, CostCheckResult, DegradationLevel } from './dto/gateway-request.dto';
import { CacheManager } from '../../infrastructure/cache/cache.service';
import { CacheEntry, CacheType, CacheSecurityLevel, CacheTier } from '../../infrastructure/cache/cache.types';

/**
 * 成本熔断模块
 * Step 3: 成本判断前置 — 用户级/模块级/全局级三级熔断
 *
 * 阈值规则：
 * - 用户级：单日调用配额（来自权益中心）
 * - 模块级：单模块日成本预算
 * - 全局级：系统日成本上限
 *
 * 超额直接降级或拒绝，成本最优为第一原则
 */
@Injectable()
export class CostCircuitBreakerService {
  private readonly logger = new Logger(CostCircuitBreakerService.name);

  // 默认配置（可通过 Admin 后台动态调整）
  private config: {
    global: { dailyBudget: number; warningThreshold: number; circuitBreakThreshold: number };
    modules: Record<string, { dailyBudget: number }>;
    userLevels: Record<string, { dailyQuota: number }>;
  } = {
    global: {
      dailyBudget: 100.0,
      warningThreshold: 0.8,
      circuitBreakThreshold: 0.95,
    },
    modules: {
      default: { dailyBudget: 30.0 },
      learning_engine: { dailyBudget: 50.0 },
      companion_engine: { dailyBudget: 30.0 },
      community: { dailyBudget: 5.0 },
      marketing: { dailyBudget: 10.0 },
      admin: { dailyBudget: 20.0 },
    },
    userLevels: {
      free: { dailyQuota: 50 },
      member: { dailyQuota: 200 },
      premium: { dailyQuota: 500 },
    },
  };

  constructor(private readonly cacheManager: CacheManager) {}

  /**
   * Step 3: 成本判断
   * 返回是否允许调用 + 建议降级层级
   */
  async check(request: GatewayRequest, userLevel: string = 'free'): Promise<CostCheckResult> {
    // 1. 全局级检查
    const globalCheck = await this.checkGlobalBudget();
    if (!globalCheck.allowed) {
      this.logger.warn(`[Cost] Global budget exceeded, rejecting request`);
      return {
        allowed: false,
        reason: 'Global daily budget exceeded',
        degradationLevel: DegradationLevel.FALLBACK,
      };
    }

    // 2. 模块级检查
    const moduleCheck = await this.checkModuleBudget(request.module);
    if (!moduleCheck.allowed) {
      this.logger.warn(`[Cost] Module budget exceeded for ${request.module}, degrading`);
      return {
        allowed: false,
        reason: `Module ${request.module} daily budget exceeded`,
        degradationLevel: DegradationLevel.FALLBACK,
      };
    }

    // 3. 用户级检查
    if (request.userId) {
      const userCheck = await this.checkUserQuota(request.userId, userLevel);
      if (!userCheck.allowed) {
        this.logger.warn(`[Cost] User quota exceeded for ${request.userId}, degrading`);
        return {
          allowed: false,
          reason: 'User daily quota exceeded',
          remainingQuota: 0,
          degradationLevel: DegradationLevel.FALLBACK,
        };
      }
      return {
        allowed: true,
        remainingQuota: userCheck.remainingQuota,
      };
    }

    return { allowed: true };
  }

  /**
   * 检查全局日预算
   */
  private async checkGlobalBudget(): Promise<{ allowed: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `cost:global:daily:${today}`;
    const result = await this.cacheManager.get(key);
    const currentCost = parseFloat((result?.value?.cost as string) || '0');

    if (currentCost >= this.config.global.dailyBudget * this.config.global.circuitBreakThreshold) {
      return { allowed: false };
    }

    if (currentCost >= this.config.global.dailyBudget * this.config.global.warningThreshold) {
      this.logger.warn(
        `[Cost] Global daily cost at ${((currentCost / this.config.global.dailyBudget) * 100).toFixed(1)}% of budget`,
      );
    }

    return { allowed: true };
  }

  /**
   * 检查模块日预算
   */
  private async checkModuleBudget(module: string): Promise<{ allowed: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `cost:module:${module}:daily:${today}`;
    const result = await this.cacheManager.get(key);
    const currentCost = parseFloat((result?.value?.cost as string) || '0');

    const moduleConfig = this.config.modules[module] || this.config.modules.default;
    const budget = moduleConfig.dailyBudget;

    return { allowed: currentCost < budget * 0.95 };
  }

  /**
   * 检查用户日配额
   */
  async checkUserQuota(userId: string, userLevel: string): Promise<{ allowed: boolean; remainingQuota: number }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `quota:user:${userId}:daily:${today}`;
    const result = await this.cacheManager.get(key);
    const used = parseInt((result?.value?.count as string) || '0', 10);

    const levelConfig = this.config.userLevels[userLevel] || this.config.userLevels.free;
    const quota = levelConfig.dailyQuota;

    return {
      allowed: used < quota,
      remainingQuota: Math.max(0, quota - used),
    };
  }

  /**
   * 记录成本消耗
   */
  async recordCost(callId: string, module: string, userId: string | undefined, cost: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // 全局
    const globalKey = `cost:global:daily:${today}`;
    const globalResult = await this.cacheManager.get(globalKey);
    const currentGlobal = parseFloat((globalResult?.value?.cost as string) || '0');
    const globalEntry: CacheEntry = {
      id: `cost:global:${today}:${Date.now()}`,
      cacheKey: globalKey,
      namespace: 'system.cost.tracking',
      schemaVersion: 1,
      cacheType: CacheType.GENERATED_RESULT,
      securityLevel: CacheSecurityLevel.PUBLIC,
      sourceModule: 'cost-circuit-breaker',
      dataScope: 'platform',
      accessCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      value: { cost: (currentGlobal + cost).toString() },
      metadata: { scene: 'cost', domain: 'system' },
    };
    await this.cacheManager.set(globalKey, globalEntry, { tiers: [CacheTier.L1, CacheTier.L2] });

    // 模块
    const moduleKey = `cost:module:${module}:daily:${today}`;
    const moduleResult = await this.cacheManager.get(moduleKey);
    const currentModule = parseFloat((moduleResult?.value?.cost as string) || '0');
    const moduleEntry: CacheEntry = {
      id: `cost:module:${module}:${today}:${Date.now()}`,
      cacheKey: moduleKey,
      namespace: 'system.cost.tracking',
      schemaVersion: 1,
      cacheType: CacheType.GENERATED_RESULT,
      securityLevel: CacheSecurityLevel.PUBLIC,
      sourceModule: 'cost-circuit-breaker',
      dataScope: 'platform',
      accessCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      value: { cost: (currentModule + cost).toString() },
      metadata: { scene: 'cost', domain: 'system' },
    };
    await this.cacheManager.set(moduleKey, moduleEntry, { tiers: [CacheTier.L1, CacheTier.L2] });

    // 用户
    if (userId) {
      const userKey = `quota:user:${userId}:daily:${today}`;
      const userResult = await this.cacheManager.get(userKey);
      const currentUser = parseInt((userResult?.value?.count as string) || '0', 10);
      const userEntry: CacheEntry = {
        id: `quota:user:${userId}:${today}:${Date.now()}`,
        cacheKey: userKey,
        namespace: 'system.cost.tracking',
        schemaVersion: 1,
        cacheType: CacheType.GENERATED_RESULT,
        securityLevel: CacheSecurityLevel.RESTRICTED,
        sourceModule: 'cost-circuit-breaker',
        dataScope: 'personal',
        userId,
        accessCount: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
        value: { count: (currentUser + 1).toString() },
        metadata: { scene: 'cost', domain: 'system' },
      };
      await this.cacheManager.set(userKey, userEntry, { tiers: [CacheTier.L1, CacheTier.L2] });
    }

    this.logger.debug(`[Cost] Recorded: callId=${callId}, cost=$${cost.toFixed(6)}`);
  }

  /**
   * 更新配置（供 Admin 调用）
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('[Cost] Configuration updated');
  }

  getConfig(): typeof this.config {
    return this.config;
  }
}