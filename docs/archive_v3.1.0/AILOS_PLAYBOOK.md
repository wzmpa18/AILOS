# AILOS Project Playbook v1.0

> **通用工程实现模板，纯技术规范，不含业务逻辑。** 被 20_PROJECT_DASHBOARD.md 引用匹配。
> **层级关系：** Constitution（规则定义） > Dashboard（状态记录） > Playbook（工程模板）

---

## 1. Express 路由模板

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRequest, bodyValidation } = require('../../utils/validator');
const controller = require('../../controllers/xxxController');

// 公开路由
router.post('/public-action', rateLimiter, validateRequest, controller.publicAction);

// 认证路由
router.get('/private-action', authenticate, controller.privateAction);
router.post('/private-action', authenticate, bodyValidation, validateRequest, controller.privateAction);

module.exports = router;
```

---

## 2. Controller 模板

```javascript
const xxxService = require('../../services/xxxService');
const logger = require('../../utils/logger');

const xxxController = {
  async action(req, res, next) {
    try {
      const { param1, param2 } = req.body;
      const userId = req.userId;
      const languageContext = req.language_context;
      
      const result = await xxxService.process(param1, param2, { userId, languageContext });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = xxxController;
```

---

## 3. Service 模板

```javascript
const prisma = require('../config/database');
const logger = require('../utils/logger');

class XxxService {
  async process(param1, param2, context) {
    try {
      const { userId, languageContext } = context;
      
      // 1. 参数校验
      if (!param1) throw new Error('param1 is required');
      
      // 2. 数据库操作
      const record = await prisma.xxx.create({
        data: { userId, param1, param2, languageCode: languageContext?.primaryTargetLanguage }
      });
      
      // 3. 返回结果
      return { record };
    } catch (error) {
      logger.error('XxxService.process failed:', error);
      throw error;
    }
  }
}

module.exports = new XxxService();
```

---

## 4. Validator 模板

```javascript
const { body, param, query } = require('express-validator');

const createValidation = [
  body('field1').notEmpty().withMessage('field1 is required'),
  body('field2').isString().isLength({ min: 1, max: 100 }).withMessage('field2 must be 1-100 chars'),
];

const updateValidation = [
  param('id').isUUID().withMessage('Invalid ID format'),
  body('field1').optional().notEmpty(),
];

module.exports = { createValidation, updateValidation };
```

---

## 5. 单元测试模板

```javascript
const xxxService = require('../../src/services/xxxService');

describe('XxxService', () => {
  describe('process', () => {
    it('should process valid input', async () => {
      const result = await xxxService.process('param1', 'param2', {
        userId: 'test-user-id',
        languageContext: { primaryTargetLanguage: 'ja' }
      });
      expect(result).toBeDefined();
      expect(result.record).toBeDefined();
    });

    it('should throw error for missing param', async () => {
      await expect(xxxService.process(null, 'param2', {})).rejects.toThrow('param1 is required');
    });
  });
});
```

---

## 6. 前端页面模板

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AILOS - Page Title</title>
  <style>
    /* CSS Reset & Variables */
    :root {
      --primary: #4F46E5;
      --bg: #F9FAFB;
      --text: #111827;
      --text-secondary: #6B7280;
      --border: #E5E7EB;
      --radius: 12px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    // i18n initialization
    const i18n = {};
    
    async function init() {
      const lang = detectLanguage();
      await loadTranslations(lang);
      render();
    }
    
    function detectLanguage() {
      const params = new URLSearchParams(window.location.search);
      return params.get('lang') || navigator.language || 'en';
    }
    
    init();
  </script>
</body>
</html>
```

---

## 7. 部署检查清单

| # | 检查项 | 命令/方法 |
|---|--------|----------|
| 1 | 代码语法检查 | `node -c src/server/index.js` |
| 2 | 单元测试 | `npm test` |
| 3 | PM2 状态 | `pm2 list` |
| 4 | 健康检查 | `curl http://127.0.0.1:3000/api/health` |
| 5 | Nginx 语法 | `nginx -t` |
| 6 | Nginx 重载 | `nginx -s reload` |
| 7 | 网页验证 | `curl -sk https://yandao.vip/xuewaiyu/home` |
| 8 | 备份 | 代码+数据库双时间戳备份 |

---

## 8. Git 提交规范

```
feat(phase):【编号】简短描述

详细说明（可选，多行）

- 变更点1
- 变更点2
```

示例：
```
feat(phase1-p0):【M1】登录注册页面 Feature 完整交付

Milestone 1 Login/Register Feature:
- Task1: login.html (7语种GLOI i18n)
- Task2: 后端API联调
- Task3: 新用户自动创建UserIdentity+Workspace+UserLanguagePreference
```

---

## 9. 错误处理模板

```javascript
// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    userId: req.userId,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
```

---

## 10. 环境变量模板

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI Provider
AI_PROVIDER=hunyuan
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1

# SMS
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY=your-access-key
SMS_SECRET_KEY=your-secret-key
```

---

*Playbook 最后更新：2026-07-20 | Project OS v1.0 Permanent Edition | 纯通用工程模板*