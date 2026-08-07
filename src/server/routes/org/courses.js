/**
 * P2 v3.1: 教材AI课程生成路由
 * 上传教材→OCR提取→AI生成→发布班级
 *
 * POST /api/org/courses/extract   — 上传教材，OCR提取知识点
 * POST /api/org/courses/generate  — 基于知识点AI生成课程
 * GET  /api/org/courses           — 课程列表
 * GET  /api/org/courses/:id       — 课程详情
 * PUT  /api/org/courses/:id       — 编辑课程（教师校准）
 * POST /api/org/courses/:id/publish — 发布到班级
 * DELETE /api/org/courses/:id     — 删除课程
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireOrgRole } = require('../../middleware/orgAuth');

router.use(authenticate);
router.use(requireOrgRole('teacher'));

// ============ 上传教材提取知识点 ============
router.post('/extract', async (req, res) => {
  try {
    const { imageBase64, mimeType, images } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const crypto = require('crypto');
    const prisma = new PrismaClient();

    // 版权合规：不存储完整原文，仅提取知识点
    const brain = require('../../../core/brain/facade');

    let ocrText = '';
    if (images && images.length) {
      // 多页教材：逐页OCR
      for (const img of images) {
        try {
          const result = await brain.recognizeImage(img.base64 || img, { mimeType: img.mimeType || 'image/jpeg' });
          if (result && result.text) ocrText += result.text + '\n';
        } catch(e) { /* 单页失败继续 */ }
      }
    } else if (imageBase64) {
      const result = await brain.recognizeImage(imageBase64, { mimeType: mimeType || 'image/jpeg' });
      if (result && result.text) ocrText = result.text;
    }

    if (!ocrText || ocrText.trim().length < 10) {
      return res.json({ success: false, error: '未识别到有效文字内容，请检查图片清晰度后重试' });
    }

    // 结构化提取：仅保留生词/句型/语法点/章节主题
    const knowledge = extractKnowledgePoints(ocrText);

    // 版权校验：大段原文截断
    const validated = validateCopyright(knowledge, ocrText);

    // 记录审计日志
    const extractId = crypto.randomUUID();
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO org_course_log (id, org_id, user_id, action, detail, created_at) VALUES ($1, $2, $3, 'extract', $4, NOW())`,
        extractId, req.orgId, req.userId, JSON.stringify({ wordCount: validated.words.length, grammarCount: validated.grammar.length, topicCount: validated.topics.length })
      );
    } catch(e) {}

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        extractId,
        knowledge: validated,
        originalTextLength: ocrText.length,
        extractedCount: validated.words.length + validated.grammar.length + validated.topics.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '教材识别失败，请重试' });
  }
});

// ============ AI生成课程 ============
router.post('/generate', async (req, res) => {
  try {
    const { knowledge, targetLanguage, level, scene, duration, topic } = req.body;
    if (!knowledge || !targetLanguage || !level) {
      return res.status(400).json({ success: false, error: '缺少必要参数（知识点/目标语言/等级）' });
    }

    const brain = require('../../../core/brain/facade');
    const crypto = require('crypto');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // 缓存检查：相同知识点不重复生成
    const cacheKey = crypto.createHash('sha256').update(JSON.stringify({ knowledge, targetLanguage, level })).digest('hex');
    const cached = await prisma.$queryRawUnsafe(
      `SELECT content FROM org_course_cache WHERE cache_key = $1 AND org_id = $2`,
      cacheKey, req.orgId
    );

    if (cached && cached.length > 0) {
      await prisma.$disconnect();
      return res.json({ success: true, data: { course: JSON.parse(cached[0].content), cached: true } });
    }

    // 构建Prompt
    const prompt = buildCoursePrompt(knowledge, targetLanguage, level, scene, duration, topic);
    const result = await brain.generateText([
      { role: 'system', content: '你是专业的语言教育课程设计师，根据教材知识点生成结构化课时内容。' },
      { role: 'user', content: prompt }
    ], { userId: req.userId, targetLang: targetLanguage });

    let course;
    try {
      course = JSON.parse(result.content || result.text || '{}');
    } catch(e) {
      course = { rawContent: result.content || result.text || '' };
    }

    // 存入缓存
    const courseId = crypto.randomUUID();
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO org_course_cache (id, org_id, cache_key, content, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        courseId, req.orgId, cacheKey, JSON.stringify(course)
      );
      // 审计日志
      await prisma.$executeRawUnsafe(
        `INSERT INTO org_course_log (id, org_id, user_id, action, detail, created_at) VALUES ($1, $2, $3, 'generate', $4, NOW())`,
        crypto.randomUUID(), req.orgId, req.userId, JSON.stringify({ courseId, cached: false })
      );
    } catch(e) {}

    await prisma.$disconnect();

    res.json({ success: true, data: { courseId, course, cached: false } });
  } catch (error) {
    res.status(500).json({ success: false, error: '课程生成失败，请重试' });
  }
});

// ============ 课程列表 ============
router.get('/', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const role = req.orgRole;

    let query, params;
    if (role === 'admin') {
      query = `SELECT * FROM org_course_cache WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`;
      params = [req.orgId];
    } else {
      query = `SELECT * FROM org_course_cache WHERE org_id = $1 AND teacher_id = $2 ORDER BY created_at DESC LIMIT 50`;
      params = [req.orgId, req.userId];
    }

    const courses = await prisma.$queryRawUnsafe(query, ...params);
    await prisma.$disconnect();

    const list = (courses || []).map(c => ({
      id: c.id, title: c.title || '未命名课程', targetLanguage: c.target_language,
      level: c.level, createdAt: c.created_at, published: c.published || false,
    }));

    res.json({ success: true, data: { courses: list, total: list.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取课程列表失败' });
  }
});

// ============ 课程详情 ============
router.get('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM org_course_cache WHERE id = $1 AND org_id = $2`,
      req.params.id, req.orgId
    );
    await prisma.$disconnect();

    if (!rows || !rows.length) return res.status(404).json({ success: false, error: '课程不存在' });

    const c = rows[0];
    res.json({ success: true, data: { id: c.id, content: JSON.parse(c.content || '{}'), cached: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取课程详情失败' });
  }
});

// ============ 编辑课程（教师校准） ============
router.put('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { content, title } = req.body;

    await prisma.$executeRawUnsafe(
      `UPDATE org_course_cache SET content = $1, title = $2, updated_at = NOW() WHERE id = $3 AND org_id = $4`,
      JSON.stringify(content || {}), title || '', req.params.id, req.orgId
    );

    await prisma.$disconnect();
    res.json({ success: true, data: { updated: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

// ============ 发布到班级 ============
router.post('/:id/publish', async (req, res) => {
  try {
    const { classIds } = req.body;
    if (!classIds || !classIds.length) return res.status(400).json({ success: false, error: '请选择目标班级' });

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$executeRawUnsafe(
      `UPDATE org_course_cache SET published = true, published_at = NOW(), class_ids = $1 WHERE id = $2 AND org_id = $3`,
      JSON.stringify(classIds), req.params.id, req.orgId
    );

    // 审计日志
    const crypto = require('crypto');
    await prisma.$executeRawUnsafe(
      `INSERT INTO org_course_log (id, org_id, user_id, action, detail, created_at) VALUES ($1, $2, $3, 'publish', $4, NOW())`,
      crypto.randomUUID(), req.orgId, req.userId, JSON.stringify({ courseId: req.params.id, classIds })
    );

    await prisma.$disconnect();
    res.json({ success: true, data: { published: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '发布失败' });
  }
});

// ============ 删除课程 ============
router.delete('/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$executeRawUnsafe(`DELETE FROM org_course_cache WHERE id = $1 AND org_id = $2`, req.params.id, req.orgId);
    await prisma.$disconnect();
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

// ============ 工具函数 ============
function extractKnowledgePoints(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const words = [];
  const grammar = [];
  const topics = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;

    // 生词识别：含假名/汉字短词
    if (/[一-龥ぁ-んァ-ン]/.test(trimmed) && trimmed.length < 20) words.push(trimmed);
    // 语法点：含助词/接续
    else if (/[はがをにでとへ]/.test(trimmed) && trimmed.length < 30) grammar.push(trimmed);
    // 章节标题：含数字或标题关键词
    else if (/^\d+[\.\、\s]|第.*[課课章節节]/.test(trimmed)) topics.push(trimmed);
  }

  return {
    words: words.slice(0, 20),
    grammar: grammar.slice(0, 10),
    topics: topics.slice(0, 5),
  };
}

function validateCopyright(knowledge, originalText) {
  // 版权校验：确保提取量不超过原文30%
  const extractedLen = knowledge.words.join('').length + knowledge.grammar.join('').length;
  const ratio = originalText.length > 0 ? extractedLen / originalText.length : 0;

  if (ratio > 0.3) {
    // 截断：只保留前60%
    knowledge.words = knowledge.words.slice(0, Math.floor(knowledge.words.length * 0.6));
    knowledge.grammar = knowledge.grammar.slice(0, Math.floor(knowledge.grammar.length * 0.6));
  }

  return knowledge;
}

function buildCoursePrompt(knowledge, targetLanguage, level, scene, duration, topic) {
  const wordList = (knowledge.words || []).join('、');
  const grammarList = (knowledge.grammar || []).join('、');
  const topicList = (knowledge.topics || []).join('、');

  return `基于以下教材知识点，为${targetLanguage}${level}水平的学生设计一堂${duration || 45}分钟的${scene || '新课'}课程。

教材知识点：
- 生词：${wordList}
- 语法：${grammarList}
- 主题：${topicList || topic || '未分类'}

请返回严格JSON格式的课程结构：
{
  "title": "课时标题",
  "objectives": ["学习目标1", "学习目标2"],
  "vocabulary": [{"word": "生词", "meaning": "释义", "example": "例句"}],
  "grammar": [{"point": "语法点", "explanation": "讲解", "examples": ["例句"]}],
  "sentences": ["场景例句"],
  "exercises": [{"question": "题目", "answer": "答案", "type": "choice|fill"}],
  "preview": "下节课预习内容",
  "tips": "教学建议"
}`;
}

// 创建缓存表和日志表（首次启动时）
const initTables = () => {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS org_course_cache (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, teacher_id UUID, cache_key VARCHAR(100), content JSONB DEFAULT '{}', title VARCHAR(200), target_language VARCHAR(10), level VARCHAR(10), published BOOLEAN DEFAULT false, published_at TIMESTAMP, class_ids JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`).catch(() => {});
  p.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS org_course_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), org_id UUID NOT NULL, user_id UUID NOT NULL, action VARCHAR(50), detail JSONB DEFAULT '{}', created_at TIMESTAMP DEFAULT NOW())`).catch(() => {});
  p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_course_org ON org_course_cache(org_id)`).catch(() => {});
  p.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_course_log_org ON org_course_log(org_id)`).catch(() => {});
  setTimeout(() => p.$disconnect(), 2000);
};
initTables();

module.exports = router;
