import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Community 社区模块
 *
 * 绝对禁区：
 * - 禁止读写学习核心数据
 * - 禁止调用AI生成教学内容
 * - 禁止修改用户权限
 * - 所有跨模块交互通过事件总线
 */
@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  private posts: any[] = [];
  private comments: any[] = [];
  private likes: Map<string, Set<string>> = new Map();
  private follows: Map<string, Set<string>> = new Map();
  private checkins: any[] = [];

  // 好友关系
  async follow(followerId: string, followeeId: string) {
    if (!this.follows.has(followerId)) this.follows.set(followerId, new Set());
    this.follows.get(followerId)!.add(followeeId);
    return { success: true };
  }

  async unfollow(followerId: string, followeeId: string) {
    this.follows.get(followerId)?.delete(followeeId);
    return { success: true };
  }

  async getFollowers(userId: string): Promise<string[]> {
    return Array.from(this.follows.get(userId) || []);
  }

  async getFollowing(userId: string): Promise<string[]> {
    const result: string[] = [];
    for (const [follower, followees] of this.follows) {
      if (followees.has(userId)) result.push(follower);
    }
    return result;
  }

  // 打卡
  async checkin(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.checkins.find((c) => c.userId === userId && c.date === today);
    if (existing) return { success: false, message: 'already_checked_in' };

    let streak = 1;
    const yesterday = this.checkins.filter((c) => c.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
    if (yesterday.length > 0) {
      const lastDate = new Date(yesterday[0].date);
      const todayDate = new Date(today);
      const diff = (todayDate.getTime() - lastDate.getTime()) / 86400000;
      if (diff === 1) streak = yesterday[0].streak + 1;
    }

    this.checkins.push({ userId, date: today, streak, createdAt: new Date().toISOString() });
    return { success: true, streak };
  }

  async getCheckinStreak(userId: string): Promise<number> {
    const userCheckins = this.checkins.filter((c) => c.userId === userId).sort((a, b) => b.date.localeCompare(a.date));
    return userCheckins.length > 0 ? userCheckins[0].streak : 0;
  }

  // 动态
  async createPost(userId: string, content: string, postType: string = 'dynamic') {
    const post = { postId: uuidv4(), userId, content, postType, createdAt: new Date().toISOString() };
    this.posts.push(post);
    return post;
  }

  async getPosts(userId?: string, limit: number = 20) {
    let result = this.posts;
    if (userId) result = result.filter((p) => p.userId === userId);
    return result.slice(-limit);
  }

  // 评论
  async addComment(postId: string, userId: string, content: string) {
    const comment = { commentId: uuidv4(), postId, userId, content, createdAt: new Date().toISOString() };
    this.comments.push(comment);
    return comment;
  }

  async getComments(postId: string): Promise<any[]> {
    return this.comments.filter((c) => c.postId === postId);
  }

  // 点赞
  async likePost(postId: string, userId: string) {
    if (!this.likes.has(postId)) this.likes.set(postId, new Set());
    this.likes.get(postId)!.add(userId);
    return { liked: true, count: this.likes.get(postId)!.size };
  }

  async unlikePost(postId: string, userId: string) {
    this.likes.get(postId)?.delete(userId);
    return { liked: false, count: this.likes.get(postId)?.size || 0 };
  }

  // 排行榜
  async getLeaderboard(type: 'global' | 'friends', userId?: string, limit: number = 20) {
    const stats = new Map<string, number>();
    for (const c of this.checkins) {
      stats.set(c.userId, (stats.get(c.userId) || 0) + c.streak);
    }
    const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit).map(([userId, score]) => ({ userId, score }));
  }

  // 分享
  async shareContent(userId: string, shareType: string, shareTarget: string) {
    return { shareId: uuidv4(), userId, shareType, shareTarget, createdAt: new Date().toISOString() };
  }
}
