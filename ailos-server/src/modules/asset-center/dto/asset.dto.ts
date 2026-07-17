export interface AssetQuery {
  domain?: string;
  difficulty?: number;
  tags?: string[];
  semanticVector?: number[];
  nodeId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'quality' | 'reuse_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface AssetNode {
  nodeId: string;
  domain: string;
  title: string;
  parentNodeId?: string;
  hierarchyLevel: number;
  difficulty: number;
  content: string;
  tags: string[];
  copyrightAuditStatus: 'pending' | 'passed' | 'rejected';
  qualityScore: number;
  reuseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSubmission {
  submitter: string;
  domain: string;
  title: string;
  content: string;
  tags: string[];
  difficulty: number;
  copyrightDeclaration: boolean;
}

export interface AssetFeedback {
  userId: string;
  assetId: string;
  feedbackType: 'content_error' | 'difficulty_mismatch' | 'copyright_concern' | 'other';
  feedbackContent: string;
}

export interface AuditAction {
  assetId: string;
  action: 'approve' | 'reject';
  auditor: string;
  comment?: string;
  qualityScore?: number;
}

export interface PromotionCheck {
  assetId: string;
  currentGrade: string;
  reuseCount: number;
  qualityScore: number;
  eligible: boolean;
  targetGrade: string;
}

export interface UserAsset {
  userId: string;
  assetType: string;
  data: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEvent {
  eventType: 'asset_created' | 'asset_updated' | 'asset_promoted' | 'asset_deprecated';
  assetId: string;
  userId: string;
  change: Record<string, any>;
  timestamp: string;
}
