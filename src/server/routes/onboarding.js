/**
 * src/server/routes/onboarding.js
 * 首次引导流程路由 — 蓝图 Stage 2/3/4
 *
 * 路由（挂载于 /api/onboarding）：
 *   GET  /status            - 引导状态（断点续走）
 *   POST /identity          - 身份选择（个人/机构）
 *   POST /language          - 选语言 + 自评级别
 *   POST /placement/start   - 生成10题定级测试（6选择+2听力+2发音）
 *   POST /placement/submit  - 提交答案 → 权威评分评级
 *   POST /goal              - 学习目标（考级/商务/生活…）
 *   POST /companion         - 用户描述 → AI构建伴读角色
 *   GET  /companion         - 获取伴读角色
 *   POST /plan/generate     - AI生成个性化30天学习计划
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireUser } = require('../middleware/auth');
const { getOnboardingService } = require('../../services/onboardingService');

const svc = getOnboardingService();

router.get('/status', authenticate, requireUser, async (req, res, next) => {
  try {
    const data = await svc.getStatus(req.userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/identity', authenticate, requireUser, async (req, res, next) => {
  try {
    const { identityType, orgName } = req.body || {};
    if (!identityType) return res.status(400).json({ success: false, error: 'identityType is required' });
    const data = await svc.setIdentity(req.userId, identityType, orgName);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.post('/language', authenticate, requireUser, async (req, res, next) => {
  try {
    const { languageCode, selfLevel } = req.body || {};
    if (!languageCode) return res.status(400).json({ success: false, error: 'languageCode is required' });
    const data = await svc.setLanguage(req.userId, languageCode, selfLevel);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.post('/placement/start', authenticate, requireUser, async (req, res, next) => {
  try {
    const { languageCode, selfLevel } = req.body || {};
    const data = await svc.startPlacement(req.userId, languageCode, selfLevel);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.post('/placement/submit', authenticate, requireUser, async (req, res, next) => {
  try {
    const { answers } = req.body || {};
    if (!Array.isArray(answers)) return res.status(400).json({ success: false, error: 'answers array is required' });
    const data = await svc.submitPlacement(req.userId, answers);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.post('/goal', authenticate, requireUser, async (req, res, next) => {
  try {
    const { goalType, description } = req.body || {};
    if (!goalType) return res.status(400).json({ success: false, error: 'goalType is required' });
    const data = await svc.setGoal(req.userId, goalType, description);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.post('/companion', authenticate, requireUser, async (req, res, next) => {
  try {
    const { description, name } = req.body || {};
    if (!description) return res.status(400).json({ success: false, error: 'description is required' });
    const data = await svc.buildCompanion(req.userId, description, name);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

router.get('/companion', authenticate, requireUser, async (req, res, next) => {
  try {
    const data = await svc.getCompanion(req.userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/plan/generate', authenticate, requireUser, async (req, res, next) => {
  try {
    const { focusDescription } = req.body || {};
    const data = await svc.generatePlan(req.userId, focusDescription);
    res.json({ success: true, data });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ success: false, error: e.message });
    next(e);
  }
});

module.exports = router;
