export interface LearnerProfile {
  userId: string;
  globalLevel: number;
  totalStudySeconds: number;
  totalKnowledgeNodes: number;
  domainProfiles: DomainLearnerProfile[];
}

export interface DomainLearnerProfile {
  domain: string;
  currentLevel: number;
  masteredNodes: string[];
  weakPoints: string[];
  updatedAt: string;
}

export interface LearningPath {
  pathId: string;
  userId: string;
  domain: string;
  pathNodes: PathNode[];
  currentNodeIndex: number;
  progressPct: number;
}

export interface PathNode {
  nodeId: string;
  title: string;
  type: 'lesson' | 'exercise' | 'assessment' | 'review';
  difficulty: number;
  estimatedDuration: number;
  completed: boolean;
  score?: number;
}

export interface ExerciseRequest {
  userId: string;
  domain: string;
  exerciseType: string;
  difficulty: number;
  knowledgePoints: string[];
  count: number;
}

export interface AssessmentRequest {
  userId: string;
  domain: string;
  assessmentType: 'entry' | 'progress' | 'level_up';
}

export interface LearningActivity {
  userId: string;
  domain: string;
  activityType: string;
  durationSeconds: number;
  score?: number;
  completedAt: string;
}

export interface KnowledgeTrace {
  userId: string;
  domain: string;
  nodeId: string;
  masteryLevel: number;
  lastReviewAt?: string;
}
