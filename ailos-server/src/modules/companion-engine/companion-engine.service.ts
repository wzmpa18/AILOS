import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  CompanionProfile,
  PersonalityTraits,
  CompanionMemory,
  ChatRequest,
  ChatResponse,
  EmotionEvent,
  GrowthEvent,
} from './dto/companion.dto';

/**
 * AI陪伴引擎 - 产品灵魂
 *
 * 核心职责：
 * 1. AI人设管理（姓名、声音、性格、口头禅）
 * 2. 长期记忆向量存储与召回
 * 3. 性格演化逻辑
 * 4. 互动陪伴（口语陪练、情绪鼓励、错题复盘）
 * 5. 伙伴成长系统
 *
 * 绝对禁区：
 * - 禁止生成正式教学内容
 * - 禁止修改学习进度
 * - 禁止直连大模型
 * - 所有AI调用必须走AI Gateway
 */
@Injectable()
export class CompanionEngineService {
  private readonly logger = new Logger(CompanionEngineService.name);

  // 默认人设
  private readonly DEFAULT_PERSONA: PersonalityTraits = {
    warmth: 0.9,
    humor: 0.6,
    patience: 0.95,
    encouragement: 0.9,
    formality: 0.3,
  };

  private readonly DEFAULT_CATCHPHRASES = [
    '嗨，我是小言，一起加油吧！',
    '学习路上有我陪你~',
    '别担心，慢慢来！',
    '你今天进步很大哦！',
    '有什么不懂的尽管问我！',
  ];

  // 内存存储
  private companionProfiles: Map<string, CompanionProfile> = new Map();
  private memories: Map<string, CompanionMemory[]> = new Map();
  private emotionLogs: EmotionEvent[] = [];
  private growthLogs: GrowthEvent[] = [];

  // 成长经验值
  private readonly GROWTH_EXP = {
    chat: 5,
    practice: 15,
    encouragement: 3,
    daily_login: 10,
    streak: 20,
    level_up: 50,
  };

  private readonly LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 5000, 10000];

  /**
   * 初始化AI伙伴
   */
  async initCompanion(userId: string, customName?: string): Promise<CompanionProfile> {
    const profile: CompanionProfile = {
      companionId: uuidv4(),
      userId,
      companionName: customName || '小言',
      personalityTraits: { ...this.DEFAULT_PERSONA },
      catchphrases: [...this.DEFAULT_CATCHPHRASES],
      growthLevel: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.companionProfiles.set(userId, profile);
    this.logger.log(`[Companion] Initialized: userId=${userId}, name=${profile.companionName}`);
    return profile;
  }

  /**
   * 获取伙伴信息
   */
  async getCompanionProfile(userId: string): Promise<CompanionProfile | null> {
    return this.companionProfiles.get(userId) || null;
  }

  /**
   * 更新伙伴人设
   */
  async updatePersona(userId: string, traits: Partial<PersonalityTraits>): Promise<CompanionProfile | null> {
    const profile = this.companionProfiles.get(userId);
    if (!profile) return null;

    profile.personalityTraits = { ...profile.personalityTraits, ...traits };
    profile.updatedAt = new Date().toISOString();
    this.companionProfiles.set(userId, profile);

    this.logger.log(`[Companion] Persona updated: userId=${userId}`);
    return profile;
  }

  /**
   * 聊天互动
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const profile = this.companionProfiles.get(request.userId);

    // 检索相关记忆
    const relevantMemories = await this.getMemories(request.userId, request.message);

    // 构建响应（实际通过AI Gateway生成）
    const response = this.generateChatResponse(request, profile, relevantMemories);

    // 创建新记忆
    if (response.length > 20) {
      await this.createMemory(request.userId, {
        memoryType: 'fact',
        content: `用户说: ${request.message}`,
        importanceWeight: 0.5,
      });
    }

    // 记录情绪事件
    await this.logEmotion({
      userId: request.userId,
      trigger: request.message,
      userEmotion: 'neutral',
      aiStrategy: response.slice(0, 50),
    });

    // 增加成长经验
    await this.addGrowthExp(request.userId, request.scene);

    return {
      response,
      emotion: 'warm',
      action: 'chat',
      memoryCreated: true,
    };
  }

  /**
   * 生成聊天响应（简化版，实际通过AI Gateway）
   */
  private generateChatResponse(
    request: ChatRequest,
    profile: CompanionProfile | undefined,
    memories: CompanionMemory[],
  ): string {
    const name = profile?.companionName || '小言';
    const catchphrase = profile?.catchphrases[Math.floor(Math.random() * profile.catchphrases.length)] || '一起加油！';

    if (request.scene === 'encouragement') {
      return `${name}说：${catchphrase}`;
    }

    return `${name}说：我听到了你说的「${request.message.substring(0, 30)}」，让我想一想... ${catchphrase}`;
  }

  /**
   * 创建记忆
   */
  async createMemory(
    userId: string,
    memory: { memoryType: string; content: string; importanceWeight: number },
  ): Promise<CompanionMemory> {
    const newMemory: CompanionMemory = {
      memoryId: uuidv4(),
      userId,
      memoryType: memory.memoryType as any,
      content: memory.content,
      importanceWeight: memory.importanceWeight,
      createdAt: new Date().toISOString(),
    };

    const userMemories = this.memories.get(userId) || [];
    userMemories.push(newMemory);

    // 限制记忆数量（保留最近+最重要的1000条）
    if (userMemories.length > 1000) {
      userMemories.sort((a, b) => b.importanceWeight - a.importanceWeight);
      userMemories.splice(1000);
    }

    this.memories.set(userId, userMemories);
    return newMemory;
  }

  /**
   * 检索记忆
   */
  async getMemories(userId: string, query: string): Promise<CompanionMemory[]> {
    const userMemories = this.memories.get(userId) || [];

    // 简单关键词匹配（实际使用向量检索）
    const keywords = query.split(/[\s,，。！？]+/);
    const scored = userMemories.map((m) => ({
      memory: m,
      score: keywords.reduce((sum, kw) => sum + (m.content.includes(kw) ? 1 : 0), 0),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((s) => s.memory);
  }

  /**
   * 记录情绪事件
   */
  async logEmotion(event: EmotionEvent): Promise<void> {
    this.emotionLogs.push(event);
  }

  /**
   * 性格演化
   */
  async evolvePersonality(userId: string): Promise<PersonalityTraits | null> {
    const profile = this.companionProfiles.get(userId);
    if (!profile) return null;

    // 根据近期情绪日志调整性格
    const recentEmotions = this.emotionLogs.filter((e) => e.userId === userId).slice(-50);

    if (recentEmotions.length > 0) {
      const positiveRatio =
        recentEmotions.filter((e) => e.effectRating && e.effectRating >= 4).length / recentEmotions.length;

      // 正向互动多 → 更温暖、更幽默
      profile.personalityTraits.warmth = Math.min(1, profile.personalityTraits.warmth + positiveRatio * 0.01);
      profile.personalityTraits.humor = Math.min(1, profile.personalityTraits.humor + positiveRatio * 0.005);
      profile.personalityTraits.encouragement = Math.min(
        1,
        profile.personalityTraits.encouragement + positiveRatio * 0.01,
      );
    }

    profile.updatedAt = new Date().toISOString();
    this.companionProfiles.set(userId, profile);

    this.logger.log(`[Companion] Personality evolved: userId=${userId}`);
    return profile.personalityTraits;
  }

  /**
   * 增加成长经验
   */
  private async addGrowthExp(userId: string, scene: string): Promise<void> {
    const exp = this.GROWTH_EXP[scene as keyof typeof this.GROWTH_EXP] || 5;
    const profile = this.companionProfiles.get(userId);
    if (!profile) return;

    let totalExp = profile.growthLevel > 0 ? this.LEVEL_THRESHOLDS[profile.growthLevel - 1] || 0 : 0;

    totalExp += exp;

    let newLevel = profile.growthLevel;
    for (let i = profile.growthLevel; i < this.LEVEL_THRESHOLDS.length; i++) {
      if (totalExp >= this.LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
      }
    }

    const levelChange = newLevel - profile.growthLevel;
    profile.growthLevel = newLevel;
    this.companionProfiles.set(userId, profile);

    if (levelChange > 0) {
      this.growthLogs.push({
        userId,
        eventType: 'level_up',
        expChange: exp,
        levelChange,
      });
      this.logger.log(`[Companion] Level up! userId=${userId}, level=${newLevel}`);
    }
  }

  /**
   * 获取成长日志
   */
  async getGrowthLogs(userId: string): Promise<GrowthEvent[]> {
    return this.growthLogs.filter((g) => g.userId === userId);
  }

  /**
   * 获取情绪历史
   */
  async getEmotionHistory(userId: string, limit: number = 50): Promise<EmotionEvent[]> {
    return this.emotionLogs.filter((e) => e.userId === userId).slice(-limit);
  }
}
