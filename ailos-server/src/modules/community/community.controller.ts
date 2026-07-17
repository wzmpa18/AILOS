import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('follow')
  async follow(@Body() body: { followerId: string; followeeId: string }) {
    return this.communityService.follow(body.followerId, body.followeeId);
  }

  @Post('checkin')
  async checkin(@Body() body: { userId: string }) {
    return this.communityService.checkin(body.userId);
  }

  @Get('streak/:userId')
  async getStreak(@Param('userId') userId: string) {
    return { streak: await this.communityService.getCheckinStreak(userId) };
  }

  @Post('post')
  async createPost(@Body() body: { userId: string; content: string; postType?: string }) {
    return this.communityService.createPost(body.userId, body.content, body.postType);
  }

  @Get('posts')
  async getPosts(@Query('userId') userId?: string, @Query('limit') limit?: string) {
    return this.communityService.getPosts(userId, limit ? parseInt(limit) : 20);
  }

  @Post('comment')
  async addComment(@Body() body: { postId: string; userId: string; content: string }) {
    return this.communityService.addComment(body.postId, body.userId, body.content);
  }

  @Post('like')
  async likePost(@Body() body: { postId: string; userId: string }) {
    return this.communityService.likePost(body.postId, body.userId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('type') type: string, @Query('userId') userId?: string) {
    return this.communityService.getLeaderboard(type as any, userId);
  }
}
