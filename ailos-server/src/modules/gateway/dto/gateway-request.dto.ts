export enum DegradationLevel {
  CACHE_HIT = 1,
  TEMPLATE = 2,
  LIGHTWEIGHT_MODEL = 3,
  HIGH_PERFORMANCE_MODEL = 4,
  FALLBACK = 5,
}

export enum SceneType {
  EXERCISE_GENERATION = 'exercise_generation',
  COURSE_GENERATION = 'course_generation',
  ASSESSMENT = 'assessment',
  CHAT = 'chat',
  TRANSLATION = 'translation',
  EXPLANATION = 'explanation',
  ENCOURAGEMENT = 'encouragement',
  ERROR_CORRECTION = 'error_correction',
  STORYTELLING = 'storytelling',
}

export interface GatewayRequest {
  callId?: string; // 调用唯一标识（网关自动生成）
  module: string; // 调用方模块标识
  scene: SceneType; // 业务场景
  userId?: string; // 用户ID
  domain?: string; // 领域标识
  structuredParams: Record<string, any>; // 结构化参数（禁止传完整Prompt）
  options?: {
    skipCache?: boolean; // 是否跳过缓存（仅Admin可用）
    priority?: number; // 请求优先级 1-5
    maxTokens?: number; // 最大Token数
  };
}

export interface GatewayResponse {
  callId: string;
  content: string;
  aiGenerated: boolean;
  degradationLevel: DegradationLevel;
  modelUsed?: string;
  cost: number;
  durationMs: number;
  cacheHit: boolean;
  auditPassed: boolean;
  metadata: {
    inputTokens: number;
    outputTokens: number;
    promptVersion: string;
    scene: SceneType;
    timestamp: number;
  };
}

export interface CostCheckResult {
  allowed: boolean;
  reason?: string;
  remainingQuota?: number;
  degradationLevel?: DegradationLevel;
}

export interface CacheResult {
  hit: boolean;
  content?: string;
  semanticScore?: number;
  cacheLevel?: number;
}

export interface AuditResult {
  passed: boolean;
  safetyScore: number;
  qualityScore: number;
  copyrightRisk: 'low' | 'medium' | 'high';
  rejectionReason?: string;
}
