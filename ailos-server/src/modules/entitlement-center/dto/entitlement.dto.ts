export enum MembershipLevel {
  FREE = 'free',
  MEMBER = 'member',
  PREMIUM = 'premium',
}

export interface MemberRights {
  level: MembershipLevel;
  aiDailyQuota: number;
  modelPermissions: string[];
  features: string[];
  expiresAt?: string;
}

export interface UserQuota {
  userId: string;
  remainingAmount: number;
  totalConsumed: number;
  level: MembershipLevel;
}

export interface QuotaConsumeRequest {
  userId: string;
  scene: string;
  amount: number;
  callId: string;
}

export interface MembershipUpdate {
  userId: string;
  newLevel: MembershipLevel;
  effectiveFrom: string;
  expiresAt?: string;
  reason: string;
}
