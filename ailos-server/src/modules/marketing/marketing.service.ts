import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Marketing 营销模块
 *
 * 绝对禁区：
 * - 禁止触碰学习数据
 * - 禁止干预学习逻辑
 * - 禁止操作用户核心资产
 * - 仅通过权益中心操作会员等级
 */
@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  private inviteCodes: Map<string, any> = new Map();
  private inviteRelations: any[] = [];
  private commissionRecords: any[] = [];
  private settlementRecords: any[] = [];
  private userPoints: Map<string, number> = new Map();
  private checkins: any[] = [];

  // 邀请码
  async generateInviteCode(userId: string): Promise<string> {
    const code = `AILOS${userId.substring(0, 4)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.inviteCodes.set(code, { userId, code, createdAt: new Date().toISOString(), usageCount: 0 });
    return code;
  }

  async getInviteCode(userId: string): Promise<string | null> {
    for (const [code, data] of this.inviteCodes) {
      if (data.userId === userId) return code;
    }
    return null;
  }

  // 二级分销
  async bindInviteRelation(userId: string, inviteCode: string) {
    const inviter = this.inviteCodes.get(inviteCode);
    if (!inviter) return { success: false, error: 'invalid_code' };
    if (inviter.userId === userId) return { success: false, error: 'self_invite' };

    // 检查是否已被绑定
    const existing = this.inviteRelations.find((r) => r.userId === userId);
    if (existing) return { success: false, error: 'already_bound' };

    const relation = {
      relationId: uuidv4(),
      userId,
      inviterOne: inviter.userId,
      inviterTwo: null as string | null,
      boundAt: new Date().toISOString(),
    };

    // 查找二级邀请人
    const inviterOneRelation = this.inviteRelations.find((r) => r.userId === inviter.userId);
    if (inviterOneRelation?.inviterOne) {
      relation.inviterTwo = inviterOneRelation.inviterOne;
    }

    this.inviteRelations.push(relation);
    inviter.usageCount++;
    this.logger.log(`[Marketing] Invite bound: ${userId} <- ${inviter.userId}`);
    return { success: true, relation };
  }

  // 佣金结算
  async calculateCommission(orderId: string, userId: string, amount: number) {
    const relation = this.inviteRelations.find((r) => r.userId === userId);
    if (!relation) return { success: false };

    const commission = {
      recordId: uuidv4(),
      userId,
      triggerOrderId: orderId,
      commissionOne: relation.inviterOne ? amount * 0.1 : 0,
      commissionTwo: relation.inviterTwo ? amount * 0.05 : 0,
      status: 'frozen' as const,
      createdAt: new Date().toISOString(),
    };

    this.commissionRecords.push(commission);
    this.logger.log(
      `[Marketing] Commission calculated: order=${orderId}, total=${commission.commissionOne + commission.commissionTwo}`,
    );
    return { success: true, commission };
  }

  async getCommissionRecords(userId: string): Promise<any[]> {
    return this.commissionRecords.filter((c) => c.userId === userId || c.inviterOne === userId);
  }

  // 提现
  async requestWithdrawal(userId: string, amount: number) {
    const settlement = {
      settlementId: uuidv4(),
      userId,
      amount,
      withdrawStatus: 'pending',
      auditStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.settlementRecords.push(settlement);
    return settlement;
  }

  async auditWithdrawal(settlementId: string, action: 'approved' | 'rejected') {
    const record = this.settlementRecords.find((s) => s.settlementId === settlementId);
    if (record) {
      record.auditStatus = action;
      record.settledAt = new Date().toISOString();
    }
    return { success: true };
  }

  // 签到积分
  async dailyCheckin(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.checkins.find((c) => c.userId === userId && c.date === today);
    if (existing) return { success: false, message: 'already_checked_in' };

    const userCheckins = this.checkins.filter((c) => c.userId === userId);
    const streak = userCheckins.length > 0 ? userCheckins[userCheckins.length - 1].streak + 1 : 1;
    const points = Math.min(streak * 5, 50);

    this.checkins.push({ userId, date: today, streak, points });

    const current = this.userPoints.get(userId) || 0;
    this.userPoints.set(userId, current + points);

    return { success: true, points, streak, total: current + points };
  }

  async getUserPoints(userId: string): Promise<number> {
    return this.userPoints.get(userId) || 0;
  }

  // 会员购买
  async purchaseMembership(userId: string, level: string, duration: number) {
    // 购买逻辑仅记录，实际会员变更通过权益中心
    return {
      orderId: uuidv4(),
      userId,
      level,
      duration,
      amount: level === 'premium' ? 99 : 29,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    };
  }
}
