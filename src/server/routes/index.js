const express = require('express');
const path = require('path');
const router = express.Router();

// 安全加载路由模块：单个模块加载失败不阻塞全局
function safeUse(routePath, modulePath) {
  try {
    const mod = require(path.join(__dirname, modulePath));
    router.use(routePath, mod);
    return true;
  } catch (err) {
    console.error(`[ROUTE FAIL] ${routePath} (${modulePath}): ${err.message}`);
    return false;
  }
}

// 路由挂载统计
let routeCount = 0;

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Dashboard
safeUse('/dashboard', './dashboard') && routeCount++;

// Checkin
safeUse('/checkin', './checkin') && routeCount++;

// Auth
safeUse('/auth', './auth') && routeCount++;

// Language Billing (v1.1.0) — MUST be before /language to avoid Express prefix match
safeUse('/language/custom', './languageBilling') && routeCount++;

// Language
safeUse('/language', './language') && routeCount++;
// Alias for legacy /api/user/languages
safeUse('/user/languages', './language');

// Content (Module 02 Step 1)
safeUse('/content', './content') && routeCount++;

// Reviews (Module 02 Step 3)
safeUse('/reviews', './reviews') && routeCount++;

// AI Tutor (Module 02 Step 4)
safeUse('/ai/tutor', './aiTutor') && routeCount++;

// Reports (Module 02 Step 5)
safeUse('/reports', './reports') && routeCount++;

// User
safeUse('/user', './user') && routeCount++;

// Avatar upload (v1.1.0 宪法 3.1) — 实际路径 /api/user/avatar（本 router 已挂载于 /api）
safeUse('/user', './avatar') && routeCount++;

// Membership
safeUse('/membership', './membership') && routeCount++;

// AI (Module 03)
safeUse('/ai', './ai') && routeCount++;

// Daily Plan (Phase 2)
safeUse('/plan', './dailyPlan') && routeCount++;

// Speech Evaluate (Phase 2)
safeUse('/speech', './speechEvaluate') && routeCount++;

// Blueprint (Phase 3)
safeUse('/blueprint', './blueprint') && routeCount++;

// Learn (Phase 3)
safeUse('/learn', './learn') && routeCount++;

// Practice (v1.1.0)
safeUse('/practice', './practice') && routeCount++;

// Vocabulary Practice v1 (词汇学习全链路) — /api/v1/practice/*
safeUse('/v1/practice', './vocabularyPractice') && routeCount++;

// Vocabulary Reviews v1 (错题本闭环) — /api/v1/reviews/*
safeUse('/v1/reviews', './vocabularyReviews') && routeCount++;

// Onboarding
safeUse('/onboarding', './onboarding') && routeCount++;

// Admin
safeUse('/admin', './admin') && routeCount++;

// Translate (Stage11)
safeUse('/translate', './translate') && routeCount++;

// Organization (Phase 4 P2)
safeUse('/org', './org') && routeCount++;

// Social (Stage 9 M5)
safeUse('/v1/social', './social') && routeCount++;

// Social Dynamics (Stage 9 M5)
safeUse('/v1/social/timeline', './socialTimeline') && routeCount++;

// v3.2.0: News Aggregation — 站外资讯聚合模块
safeUse('/v1/news', './news') && routeCount++;

// v3.2.0: Admin News Management — 后台资讯管理
safeUse('/admin/news', './adminNews') && routeCount++;

// Feedback 意见反馈 (v1.1.0 查漏补缺)
safeUse('/feedback', './feedback') && routeCount++;

// 语音模块 (P1-M) — TTS/ASR 兜底，原生不可用时前端调用
safeUse('/v1/voice', './voice') && routeCount++;

// 二维码 — 后端生成base64 PNG，彻底绕开前端库兼容坑
safeUse('/user/share-qrcode', './qrcode') && routeCount++;

// 自定义强化学习（模块九）— 关键词检索+AI生成+自动入库
safeUse('/content/custom', './customContent') && routeCount++;

// 伴读计划（模块十一）— 个性化学习计划+每日任务+进度跟进
safeUse('/companion', './companion') && routeCount++;

// 两级分销系统 — 分销统计/团队/佣金/提现/排行榜/邀请海报
safeUse('/distribution', './distribution') && routeCount++;

console.log(`[ROUTES] ${routeCount} route modules loaded successfully`);

module.exports = router;
