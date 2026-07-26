// ============================================================
// src/server/middleware/adminAuth.js
// P2 任务二：管理员鉴权（allowlist，不侵入 User 认证 / membership 逻辑）
// 判定来源（任一命中即为管理员）：
//   1. 环境变量 ADMIN_USER_IDS（逗号分隔的 userId 列表）
//   2. SystemConfig 键 admin.user_ids（JSON 数组）
// 必须置于 authenticate 之后使用（依赖 req.userId）。
// ============================================================
const logger = require('../../utils/logger');
const { getSystemConfigService } = require('../../services/systemConfigService');

function parseList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  return String(raw)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

async function isAdmin(userId) {
  if (!userId) return false;
  const envAdmins = parseList(process.env.ADMIN_USER_IDS);
  if (envAdmins.includes(userId)) return true;
  try {
    const cfg = getSystemConfigService();
    const cfgAdmins = parseList(await cfg.getJson('admin.user_ids', []));
    if (cfgAdmins.includes(userId)) return true;
  } catch (e) {
    logger.debug('[adminAuth] 读取 admin.user_ids 失败:', e.message);
  }
  return false;
}

const requireAdmin = async (req, res, next) => {
  try {
    if (req.isGuest || !req.userId) {
      return res.status(403).json({ success: false, error: 'Admin privilege required', code: 'ADMIN_REQUIRED' });
    }
    const ok = await isAdmin(req.userId);
    if (!ok) {
      return res.status(403).json({ success: false, error: 'Admin privilege required', code: 'ADMIN_REQUIRED' });
    }
    req.isAdmin = true;
    next();
  } catch (error) {
    logger.error('[adminAuth] 校验失败:', error.message);
    return res.status(403).json({ success: false, error: 'Admin privilege required', code: 'ADMIN_REQUIRED' });
  }
};

module.exports = { requireAdmin, isAdmin };
