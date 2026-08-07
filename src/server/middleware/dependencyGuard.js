/**
 * DependencyGuard v2.0 — 全局运行时依赖拦截中间件
 * 
 * HARD-03 改造：废弃 Header 自报身份，基于路由归属 + 调用栈自动识别
 * 
 * 红线 1：全局硬拦截，禁止软告警、禁止全局开关、禁止白名单例外
 * 红线 4：前端 SSOT 双层防护
 * 
 * 拦截层级：在所有 /api/* 路由之前全局注入
 * 校验维度：
 *   1. 前端直连 AI 网关端点（/api/ai/*）→ 基于 Referer 自动判定
 *   2. 跨领域 Service 直接调用 → 基于调用栈（Error.stack）自动判定
 *   3. Redis 直写操作 → 底层 SDK 拦截（redis.js 层面注入）
 *   4. 前端越权 API 调用（增补2权限矩阵）
 * 
 * 命中 Forbidden → 返回 9001 DEPEND_VIOLATION + 日志永久留存
 */

const path = require('path');
const logger = require('../../utils/logger');

// ==================== 配置（从 architecture-blueprint-v3.0.0.json 同步） ====================

// 页面→允许调用的API前缀映射（增补2权限矩阵）
const PAGE_API_MAP = {
  'home.html': ['/api/dashboard', '/api/checkin', '/api/blueprint', '/api/user/profile'],
  'learn.html': ['/api/learn', '/api/content', '/api/blueprint'],
  'vocabulary.html': ['/api/vocabulary', '/api/content', '/api/v1/voice', '/api/user/profile'],
  'sentences.html': ['/api/content', '/api/user/profile'],
  'practice.html': ['/api/practice', '/api/speaking', '/api/v1/voice', '/api/user/profile'],
  'placement.html': ['/api/placement', '/api/blueprint', '/api/onboarding', '/api/user/profile'],
  'chat.html': ['/api/ai/chat', '/api/ai/quota', '/api/user/profile'],
  'translate.html': ['/api/translate', '/api/user/profile'],
  'profile.html': ['/api/user', '/api/language', '/api/user/share-qrcode'],
  'companion.html': ['/api/companion', '/api/user/profile'],
  'review.html': ['/api/reviews', '/api/vocabulary', '/api/user/profile'],
  'discover.html': ['/api/v1/social', '/api/user/profile'],
  'community-trend.html': ['/api/v1/social', '/api/user/profile'],
  'community-friends.html': ['/api/v1/social', '/api/user/profile'],
  'community-messages.html': ['/api/v1/social', '/api/user/profile'],
  'login.html': ['/api/auth'],
  'register.html': ['/api/auth'],
  'onboarding.html': ['/api/onboarding', '/api/placement', '/api/language', '/api/user/profile'],
  'growth-center.html': ['/api/user/share-qrcode', '/api/user/profile'],
  'membership.html': ['/api/membership', '/api/billing', '/api/user/profile'],
  'settings.html': ['/api/user', '/api/language', '/api/user/profile'],
  'notebook.html': ['/api/vocabulary', '/api/reviews', '/api/user/profile'],
  'game.html': ['/api/user/profile'],
  'scan-translate.html': ['/api/translate', '/api/user/profile'],
  'conversation-translate.html': ['/api/translate', '/api/user/profile'],
  'block-list.html': ['/api/user/profile'],
  'ai-companion-builder.html': ['/api/companion', '/api/user/profile'],
  'terms.html': ['/api/user/profile'],
  'privacy.html': ['/api/user/profile'],
  'about.html': ['/api/user/profile'],
  'account-security.html': ['/api/user', '/api/user/profile'],
  'feedback.html': ['/api/feedback', '/api/user/profile'],
  'feedback-admin.html': ['/api/feedback', '/api/admin', '/api/user/profile'],
  'proxy-payment.html': ['/api/membership', '/api/billing', '/api/user/profile'],
  'org-dashboard.html': ['/api/org', '/api/org/auth', '/api/user/profile'],
  'org-teachers.html': ['/api/org', '/api/org/teachers', '/api/user/profile'],
  'org-classes.html': ['/api/org', '/api/org/classes', '/api/user/profile'],
  'org-students.html': ['/api/org', '/api/org/classes', '/api/user/profile'],
  'org-reports.html': ['/api/org', '/api/org/reports', '/api/user/profile'],
  'exam.html': ['/api/exam', '/api/user/profile'],
  'org/dashboard.html': ['/api/org', '/api/org/auth', '/api/org/teachers', '/api/org/students', '/api/org/classes', '/api/org/homework', '/api/org/reports', '/api/user/profile'],
};

// 全局禁止访问的管理接口
const ADMIN_FORBIDDEN = ['/api/admin'];

// AI 网关端点 —— 仅对后端服务内部开放，前端直连即违宪
const AI_GATEWAY_ROUTES = ['/api/ai/'];

// 跨领域禁止调用矩阵
const FORBIDDEN_PAIRS = {
  'vocabulary': ['reading', 'grammar', 'speaking', 'social', 'billing'],
  'grammar': ['vocabulary', 'reading', 'speaking', 'social', 'billing'],
  'reading': ['vocabulary', 'grammar', 'speaking', 'social', 'billing'],
  'speaking': ['vocabulary', 'grammar', 'reading', 'social', 'billing'],
  'social': ['vocabulary', 'grammar', 'reading', 'speaking', 'billing'],
  'billing': ['vocabulary', 'grammar', 'reading', 'speaking', 'social'],
};

// ==================== 核心检测逻辑 ====================

/**
 * 从 Referer 提取页面名
 */
function getPageFromReferer(referer) {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const parts = url.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last && last.endsWith('.html')) return last;
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * 判断请求是否来自前端页面（基于 Referer）
 * HARD-03 核心：不信任任何 Header，基于客观事实（Referer）判定
 */
function isFrontendRequest(req) {
  const referer = req.headers.referer || req.headers.referrer || '';
  if (!referer) {
    // 无 Referer → 可能是 curl/Postman/脚本调用 → 判定为外部请求，同样拦截
    return true;
  }
  const page = getPageFromReferer(referer);
  return page !== null; // 有合法的 .html 页面来源 → 前端请求
}

/**
 * HARD-03 核心：从调用栈获取真实调用方文件路径
 * 不信任任何 Header，直接从 V8 Error.stack 解析
 */
function getCallerFromStack() {
  const stack = new Error().stack || '';
  const lines = stack.split('\n');
  // 跳过 Error 行 + getCallerFromStack 自身 + dependencyGuard 自身
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    // 匹配格式: "    at functionName (/path/to/file.js:line:col)"
    const match = line.match(/\((.+?\.js):\d+:\d+\)/) || line.match(/at\s+(.+?\.js):\d+:\d+/);
    if (match && match[1]) {
      const filePath = match[1].replace(/\\/g, '/');
      // 跳过 node_modules 和 middleware 自身
      if (!filePath.includes('node_modules') && !filePath.includes('middleware/dependencyGuard')) {
        return filePath;
      }
    }
  }
  return null;
}

/**
 * 从文件路径推断所属领域
 */
function getDomainFromFilePath(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  // 直接匹配 Service 文件
  const serviceMap = {
    'vocabularyService': 'vocabulary',
    'grammarService': 'grammar',
    'readingService': 'reading',
    'speakingService': 'speaking',
    'socialService': 'social',
    'billingService': 'billing',
  };
  for (const [key, domain] of Object.entries(serviceMap)) {
    if (normalized.includes(key)) return domain;
  }
  // 匹配领域目录
  if (normalized.includes('/vocabulary/')) return 'vocabulary';
  if (normalized.includes('/grammar/')) return 'grammar';
  if (normalized.includes('/reading/')) return 'reading';
  if (normalized.includes('/speaking/') || normalized.includes('/practice/')) return 'speaking';
  if (normalized.includes('/social/')) return 'social';
  if (normalized.includes('/billing/') || normalized.includes('/membership/')) return 'billing';
  return null;
}

/**
 * 从 API 路径推断目标模块
 */
function getModuleFromPath(reqPath) {
  if (reqPath.includes('/vocabulary')) return 'vocabulary';
  if (reqPath.includes('/grammar')) return 'grammar';
  if (reqPath.includes('/reading')) return 'reading';
  if (reqPath.includes('/speaking') || reqPath.includes('/practice')) return 'speaking';
  if (reqPath.includes('/social') || reqPath.includes('/v1/social')) return 'social';
  if (reqPath.includes('/billing') || reqPath.includes('/membership')) return 'billing';
  return null;
}

/**
 * 判断路径是否命中 AI 网关端点
 */
function isAiGatewayRoute(reqPath) {
  for (const route of AI_GATEWAY_ROUTES) {
    if (reqPath.startsWith(route)) return true;
  }
  return false;
}

// ==================== 中间件 ====================

function dependencyGuard(req, res, next) {
  const reqPath = req.path;
  const method = req.method;

  // 跳过非 API 请求
  if (!reqPath.startsWith('/api/')) {
    return next();
  }

  // 跳过 OPTIONS 预检
  if (method === 'OPTIONS') {
    return next();
  }

  // ==================== 检测 1：管理接口保护 ====================
  for (const forbidden of ADMIN_FORBIDDEN) {
    if (reqPath.startsWith(forbidden)) {
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isAdmin) {
        logger.warn('[DependencyGuard] ADMIN_ACCESS_DENIED', {
          path: reqPath, method, userId: req.userId,
          violation: 'ADMIN_FORBIDDEN',
        });
        return res.status(403).json({
          success: false,
          code: 9001,
          error: 'DEPEND_VIOLATION: 管理接口仅限管理员访问',
          violation: 'ADMIN_FORBIDDEN',
          path: reqPath,
        });
      }
    }
  }

  // ==================== 检测 2：前端页面权限校验 ====================
  const referer = req.headers.referer || req.headers.referrer || '';
  if (referer) {
    const pageName = getPageFromReferer(referer);
    if (pageName && pageName.endsWith('.html')) {
      const allowedPaths = PAGE_API_MAP[pageName];
      if (allowedPaths) {
        let isAllowed = false;
        for (const allowed of allowedPaths) {
          if (reqPath.startsWith(allowed)) {
            isAllowed = true;
            break;
          }
        }
        if (!isAllowed) {
          logger.warn('[DependencyGuard] PAGE_API_VIOLATION', {
            path: reqPath, method, referer, pageName, userId: req.userId,
            violation: 'PAGE_API_FORBIDDEN',
          });
          return res.status(403).json({
            success: false,
            code: 9001,
            error: `DEPEND_VIOLATION: 页面 ${pageName} 无权调用 ${reqPath}`,
            violation: 'PAGE_API_FORBIDDEN',
            page: pageName,
            path: reqPath,
          });
        }
      }
    }
  }

  // ==================== 检测 3：前端直连 AI 网关（HARD-02 + HARD-03 核心） ====================
  // 基于 Referer 判定是否为前端请求，不再信任 X-Caller-Module Header
  if (isFrontendRequest(req) && isAiGatewayRoute(reqPath)) {
    logger.error('[DependencyGuard] FRONTEND_DIRECT_AI_GATEWAY', {
      path: reqPath, method, referer,
      userId: req.userId,
      violation: 'FRONTEND_DIRECT_AI_GATEWAY',
      detail: '前端直连 AI 网关端点，必须经由业务 Controller → BrainFacade',
    });
    return res.status(403).json({
      success: false,
      code: 9001,
      error: 'DEPEND_VIOLATION: 前端禁止直连 AI 网关端点，请通过业务 Controller 调用',
      violation: 'FRONTEND_DIRECT_AI_GATEWAY',
      path: reqPath,
      hint: '合法路径: 前端 → fetch("/api/learn/generate") → Controller → BrainFacade → AI',
    });
  }

  // ==================== 检测 4：跨领域调用（基于调用栈，HARD-03 核心） ====================
  const callerFile = getCallerFromStack();
  const callerDomain = getDomainFromFilePath(callerFile);
  const targetDomain = getModuleFromPath(reqPath);

  if (callerDomain && targetDomain && callerDomain !== targetDomain) {
    const forbidden = FORBIDDEN_PAIRS[callerDomain];
    if (forbidden && forbidden.includes(targetDomain)) {
      logger.error('[DependencyGuard] CROSS_DOMAIN_CALL', {
        path: reqPath, method,
        callerDomain, targetDomain, callerFile,
        userId: req.userId,
        violation: 'CROSS_DOMAIN_CALL',
      });
      return res.status(403).json({
        success: false,
        code: 9001,
        error: `DEPEND_VIOLATION: ${callerDomain} 禁止直接调用 ${targetDomain} 模块`,
        violation: 'CROSS_DOMAIN_CALL',
        caller: callerDomain,
        target: targetDomain,
      });
    }
  }

  // ==================== 废弃项：以下所有基于 Header 的检测已不再执行 ====================
  // X-Caller-Module / X-Caller-Service / X-Redis-Write / X-Caller-File 全部废弃
  // Redis 直写检测已下沉到 src/config/redis.js 底层 SDK 层面（见 redisGuard.js）

  next();
}

module.exports = dependencyGuard;
