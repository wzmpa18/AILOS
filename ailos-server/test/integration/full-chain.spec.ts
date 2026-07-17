/**
 * AILOS 全链路集成测试套件 v2.0.0
 * 覆盖所有模块端到端流程
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AILOS 全链路集成测试', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================
  // 链路1: 用户注册 → 登录 → 权益查询
  // ============================================
  describe('链路1: 用户注册与权益', () => {
    it('POST /api/users/register — 用户注册', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users/register')
        .send({ username: 'testuser', password: 'Test123456', email: 'test@ailos.com' })
        .expect(201);
      expect(res.body.userId).toBeDefined();
      expect(res.body.username).toBe('testuser');
    });

    it('POST /api/auth/login — 用户登录', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'Test123456' })
        .expect(200);
      expect(res.body.token).toBeDefined();
      authToken = res.body.token;
    });

    it('GET /api/entitlement/membership — 查询会员等级', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/entitlement/membership')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.level).toBe('free');
    });

    it('GET /api/entitlement/quota — 查询今日配额', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/entitlement/quota')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.dailyLimit).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 链路2: AI 网关全流程
  // ============================================
  describe('链路2: AI 网关调用', () => {
    it('POST /api/gateway/call — 标准AI调用', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gateway/call')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scene: 'grammar_explanation',
          module: 'learning_engine',
          content: { grammar_point: 'past tense' },
          domain: 'english',
        })
        .expect(201);
      expect(res.body.callId).toBeDefined();
      expect(res.body.result).toBeDefined();
      expect(res.body.degradationLevel).toBeDefined();
    });

    it('POST /api/gateway/call — 缓存命中', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gateway/call')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scene: 'grammar_explanation',
          module: 'learning_engine',
          content: { grammar_point: 'past tense' },
          domain: 'english',
        })
        .expect(201);
      expect(res.body.cacheHit).toBe(true);
    });
  });

  // ============================================
  // 链路3: 学习引擎流程
  // ============================================
  describe('链路3: 学习引擎', () => {
    it('GET /api/learning/profile — 获取学情画像', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/learning/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.currentLevel).toBeDefined();
    });

    it('POST /api/learning/path — 生成学习路径', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/learning/path')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ domain: 'english', targetLevel: 'intermediate' })
        .expect(201);
      expect(res.body.nodes).toBeDefined();
      expect(res.body.nodes.length).toBeGreaterThan(0);
    });

    it('POST /api/learning/exercise — 提交练习', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/learning/exercise')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          domain: 'english',
          skillId: 'grammar.past_tense',
          userAnswer: 'I went to school yesterday.',
          correctAnswer: 'I went to school yesterday.',
        })
        .expect(201);
      expect(res.body.correct).toBe(true);
      expect(res.body.score).toBeGreaterThan(0);
    });
  });

  // ============================================
  // 链路4: 陪伴引擎流程
  // ============================================
  describe('链路4: 陪伴引擎', () => {
    it('GET /api/companion/profile — 获取陪伴形象', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/companion/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.personaName).toBe('小言');
      expect(res.body.growthLevel).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/companion/chat — 陪伴对话', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/companion/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '你好，小言！', context: 'greeting' })
        .expect(201);
      expect(res.body.reply).toBeDefined();
      expect(res.body.emotion).toBeDefined();
    });
  });

  // ============================================
  // 链路5: 社区模块
  // ============================================
  describe('链路5: 社区交互', () => {
    let postId: number;

    it('POST /api/community/posts — 发布动态', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/community/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '今天学习英语2小时！' })
        .expect(201);
      expect(res.body.postId).toBeDefined();
      postId = res.body.postId;
    });

    it('POST /api/community/posts/:id/like — 点赞', async () => {
      await request(app.getHttpServer())
        .post(`/api/community/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('POST /api/community/posts/:id/comments — 评论', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/community/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '加油！' })
        .expect(201);
      expect(res.body.commentId).toBeDefined();
    });

    it('POST /api/community/checkin — 每日签到', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/community/checkin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
      expect(res.body.points).toBeGreaterThanOrEqual(0);
      expect(res.body.streakDays).toBeDefined();
    });
  });

  // ============================================
  // 链路6: 营销模块
  // ============================================
  describe('链路6: 营销推广', () => {
    it('POST /api/marketing/invite-code — 生成邀请码', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/marketing/invite-code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
      expect(res.body.code).toBeDefined();
      expect(res.body.code.length).toBe(8);
    });

    it('GET /api/marketing/commissions — 查询佣金', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/marketing/commissions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ============================================
  // 链路7: 开发者中心
  // ============================================
  describe('链路7: 开发者中心', () => {
    it('POST /api/developer/keys — 生成API密钥', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/developer/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Key', permissions: ['read'] })
        .expect(201);
      expect(res.body.apiKey).toBeDefined();
      expect(res.body.keyId).toBeDefined();
    });

    it('GET /api/developer/keys — 列出API密钥', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/developer/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ============================================
  // 链路8: 管理后台
  // ============================================
  describe('链路8: 管理后台', () => {
    it('GET /api/admin/config — 获取系统配置', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.moduleSwitches).toBeDefined();
    });

    it('GET /api/admin/cost-dashboard — 成本仪表盘', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/cost-dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.globalDailyCost).toBeDefined();
      expect(res.body.moduleBreakdown).toBeDefined();
    });
  });

  // ============================================
  // 链路9: 知识资产中心
  // ============================================
  describe('链路9: 知识资产', () => {
    it('POST /api/asset-center/knowledge — 提交知识资产', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/asset-center/knowledge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          domain: 'english',
          assetType: 'vocabulary',
          title: 'Common English Verbs',
          content: 'A list of 100 common English verbs...',
          tags: ['verbs', 'beginner'],
          difficulty: 1,
        })
        .expect(201);
      expect(res.body.assetId).toBeDefined();
    });

    it('POST /api/asset-center/feedback — 提交反馈', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/asset-center/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          category: 'content_error',
          content: 'The verb "go" is missing past participle form.',
        })
        .expect(201);
      expect(res.body.feedbackId).toBeDefined();
    });
  });

  // ============================================
  // 链路10: 降级与容错
  // ============================================
  describe('链路10: 降级与容错', () => {
    it('POST /api/gateway/call — 超配额降级', async () => {
      // 连续发送超出配额的请求，验证降级机制
      const results = [];
      for (let i = 0; i < 60; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/gateway/call')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            scene: 'grammar_explanation',
            module: 'learning_engine',
            content: { grammar_point: 'test' },
            domain: 'english',
          });
        results.push(res.body.degradationLevel);
      }
      // 应有降级发生
      const hasDegradation = results.some((r) => r !== 'NONE');
      expect(hasDegradation).toBe(true);
    });
  });
});
