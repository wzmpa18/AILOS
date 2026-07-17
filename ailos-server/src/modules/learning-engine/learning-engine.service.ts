import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  LearnerProfile,
  DomainLearnerProfile,
  LearningPath,
  PathNode,
  ExerciseRequest,
  AssessmentRequest,
  LearningActivity,
  KnowledgeTrace,
} from './dto/learning.dto';

/**
 * 通用学习引擎 - 产品心脏
 *
 * 核心职责：
 * 1. 用户学情画像建模（跨领域）
 * 2. 动态学习路径生成
 * 3. 内容生成调度（通过AI Gateway）
 * 4. 自适应难度调节
 * 5. 测评系统
 * 6. 学习进度追踪
 *
 * 绝对禁区：
 * - 禁止内置任何特定领域（日语、英语等）的硬编码规则
 * - 禁止直连大模型API
 * - 禁止处理社交/营销业务
 * - 所有AI调用必须走AI Gateway
 */
@Injectable()
export class LearningEngineService {
  private readonly logger = new Logger(LearningEngineService.name);

  // 内存模拟存储
  private learnerProfiles: Map<string, LearnerProfile> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();
  private knowledgeTraces: Map<string, KnowledgeTrace[]> = new Map();
  private activities: LearningActivity[] = [];

  /**
   * 获取用户学情画像
   */
  async getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
    return this.learnerProfiles.get(userId) || null;
  }

  /**
   * 初始化学习者画像
   */
  async initLearnerProfile(userId: string): Promise<LearnerProfile> {
    const profile: LearnerProfile = {
      userId,
      globalLevel: 1,
      totalStudySeconds: 0,
      totalKnowledgeNodes: 0,
      domainProfiles: [],
    };
    this.learnerProfiles.set(userId, profile);
    this.logger.log(`[Learning] Profile initialized: ${userId}`);
    return profile;
  }

  /**
   * 更新领域画像
   */
  async updateDomainProfile(userId: string, domainProfile: DomainLearnerProfile): Promise<void> {
    const profile = this.learnerProfiles.get(userId);
    if (!profile) return;

    const idx = profile.domainProfiles.findIndex((d) => d.domain === domainProfile.domain);
    if (idx >= 0) {
      profile.domainProfiles[idx] = domainProfile;
    } else {
      profile.domainProfiles.push(domainProfile);
    }
    this.learnerProfiles.set(userId, profile);
  }

  /**
   * 生成学习路径
   * 通过AI Gateway调用模型生成个性化路径
   */
  async generateLearningPath(userId: string, domain: string): Promise<LearningPath> {
    const profile = await this.getLearnerProfile(userId);
    const domainProfile = profile?.domainProfiles.find((d) => d.domain === domain);

    // 构建路径节点（实际通过AI Gateway生成）
    const pathNodes: PathNode[] = this.generateDefaultPathNodes(domain, domainProfile?.currentLevel || 1);

    const path: LearningPath = {
      pathId: uuidv4(),
      userId,
      domain,
      pathNodes,
      currentNodeIndex: 0,
      progressPct: 0,
    };

    this.learningPaths.set(path.pathId, path);
    this.logger.log(`[Learning] Path generated: ${path.pathId}, domain=${domain}, nodes=${pathNodes.length}`);
    return path;
  }

  /**
   * 生成默认路径节点（非领域特定）
   */
  private generateDefaultPathNodes(domain: string, level: number): PathNode[] {
    return [
      {
        nodeId: `${domain}_intro`,
        title: '入门导学',
        type: 'lesson',
        difficulty: level,
        estimatedDuration: 300,
        completed: false,
      },
      {
        nodeId: `${domain}_core_1`,
        title: '核心知识点1',
        type: 'lesson',
        difficulty: level,
        estimatedDuration: 600,
        completed: false,
      },
      {
        nodeId: `${domain}_ex_1`,
        title: '练习1',
        type: 'exercise',
        difficulty: level,
        estimatedDuration: 300,
        completed: false,
      },
      {
        nodeId: `${domain}_core_2`,
        title: '核心知识点2',
        type: 'lesson',
        difficulty: level + 1,
        estimatedDuration: 600,
        completed: false,
      },
      {
        nodeId: `${domain}_ex_2`,
        title: '练习2',
        type: 'exercise',
        difficulty: level + 1,
        estimatedDuration: 300,
        completed: false,
      },
      {
        nodeId: `${domain}_review`,
        title: '阶段复习',
        type: 'review',
        difficulty: level + 1,
        estimatedDuration: 900,
        completed: false,
      },
      {
        nodeId: `${domain}_assessment`,
        title: '阶段性测评',
        type: 'assessment',
        difficulty: level + 1,
        estimatedDuration: 1200,
        completed: false,
      },
    ];
  }

  /**
   * 获取下一个学习内容
   */
  async getNextContent(userId: string, domain: string): Promise<PathNode | null> {
    const paths = Array.from(this.learningPaths.values()).filter((p) => p.userId === userId && p.domain === domain);

    const activePath = paths.find((p) => p.currentNodeIndex < p.pathNodes.length);
    if (!activePath) return null;

    return activePath.pathNodes[activePath.currentNodeIndex];
  }

  /**
   * 提交学习活动
   */
  async submitActivity(activity: LearningActivity): Promise<void> {
    this.activities.push(activity);

    // 更新学情
    const profile = this.learnerProfiles.get(activity.userId);
    if (profile) {
      profile.totalStudySeconds += activity.durationSeconds;
      if (activity.score && activity.score >= 0.8) {
        profile.totalKnowledgeNodes++;
      }
      this.learnerProfiles.set(activity.userId, profile);
    }

    this.logger.log(`[Learning] Activity submitted: userId=${activity.userId}, type=${activity.activityType}`);
  }

  /**
   * 自适应难度调节
   */
  async adjustDifficulty(userId: string, domain: string): Promise<number> {
    const profile = this.learnerProfiles.get(userId);
    if (!profile) return 1;

    const domainProfile = profile.domainProfiles.find((d) => d.domain === domain);
    if (!domainProfile) return 1;

    const recentActivities = this.activities.filter((a) => a.userId === userId && a.domain === domain).slice(-10);

    if (recentActivities.length === 0) return domainProfile.currentLevel;

    const avgScore = recentActivities.reduce((sum, a) => sum + (a.score || 0), 0) / recentActivities.length;

    if (avgScore >= 0.9) return Math.min(domainProfile.currentLevel + 1, 5);
    if (avgScore >= 0.7) return domainProfile.currentLevel;
    return Math.max(domainProfile.currentLevel - 1, 1);
  }

  /**
   * 启动测评
   */
  async startAssessment(userId: string, domain: string): Promise<{ assessmentId: string; type: string }> {
    const assessmentId = uuidv4();
    this.logger.log(`[Learning] Assessment started: ${assessmentId}, userId=${userId}, domain=${domain}`);

    return {
      assessmentId,
      type: 'entry',
    };
  }

  /**
   * 提交测评结果
   */
  async submitAssessment(
    userId: string,
    domain: string,
    assessmentId: string,
    score: number,
  ): Promise<{ level: number }> {
    const profile = this.learnerProfiles.get(userId);
    if (!profile) return { level: 1 };

    const newLevel = Math.max(1, Math.min(5, Math.ceil(score * 5)));
    const domainProfile = profile.domainProfiles.find((d) => d.domain === domain);

    if (domainProfile) {
      domainProfile.currentLevel = newLevel;
    } else {
      profile.domainProfiles.push({
        domain,
        currentLevel: newLevel,
        masteredNodes: [],
        weakPoints: [],
        updatedAt: new Date().toISOString(),
      });
    }

    this.learnerProfiles.set(userId, profile);
    this.logger.log(`[Learning] Assessment submitted: userId=${userId}, domain=${domain}, level=${newLevel}`);

    return { level: newLevel };
  }

  /**
   * 获取学习进度
   */
  async getProgress(userId: string, domain: string): Promise<{ completed: number; total: number; pct: number }> {
    const paths = Array.from(this.learningPaths.values()).filter((p) => p.userId === userId && p.domain === domain);

    let completed = 0;
    let total = 0;
    for (const path of paths) {
      completed += path.pathNodes.filter((n) => n.completed).length;
      total += path.pathNodes.length;
    }

    return {
      completed,
      total,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * 更新知识追踪
   */
  async updateKnowledgeTrace(trace: KnowledgeTrace): Promise<void> {
    const key = `${trace.userId}:${trace.domain}`;
    const traces = this.knowledgeTraces.get(key) || [];
    const idx = traces.findIndex((t) => t.nodeId === trace.nodeId);

    if (idx >= 0) {
      traces[idx] = trace;
    } else {
      traces.push(trace);
    }

    this.knowledgeTraces.set(key, traces);
  }

  /**
   * 获取知识追踪
   */
  async getKnowledgeTraces(userId: string, domain: string): Promise<KnowledgeTrace[]> {
    const key = `${userId}:${domain}`;
    return this.knowledgeTraces.get(key) || [];
  }
}
