export interface CompanionProfile {
  companionId: string;
  userId: string;
  companionName: string;
  voiceId?: string;
  personalityTraits: PersonalityTraits;
  catchphrases: string[];
  growthLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityTraits {
  warmth: number; // 温暖度 0-1
  humor: number; // 幽默度 0-1
  patience: number; // 耐心度 0-1
  encouragement: number; // 鼓励度 0-1
  formality: number; // 正式度 0-1
}

export interface CompanionMemory {
  memoryId: string;
  userId: string;
  memoryType: 'fact' | 'emotion' | 'learning' | 'preference';
  content: string;
  vectorIndex?: number[];
  importanceWeight: number;
  createdAt: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  scene: 'chat' | 'practice' | 'encouragement' | 'error_correction' | 'storytelling';
  context?: string;
}

export interface ChatResponse {
  response: string;
  emotion: string;
  action: string;
  memoryCreated: boolean;
}

export interface EmotionEvent {
  userId: string;
  trigger: string;
  userEmotion: string;
  aiStrategy: string;
  effectRating?: number;
}

export interface GrowthEvent {
  userId: string;
  eventType: string;
  expChange: number;
  levelChange: number;
  unlockedAbility?: string;
}
