/**
 * src/server/utils/userState.js
 * v1.1.0 深度穿透审计 · 漏洞7 修复：软删除判定标准全局统一
 *
 * 背景：User 表同时存在 isActive(Boolean) 与 status(String?) 两个状态字段，
 *       若各处代码各判各的，会出现「一个说 false 一个说 active」的逻辑冲突，
 *       更严重的是：存量数据的 status 为 NULL，若有代码按 status = 'active'
 *       过滤，存量用户会被全量判定为不可用 → 全员登录失败。
 *
 * 唯一标准（不许再有第二套）：
 *   1. 可用性判定一律以 isActive === true 为准；
 *   2. status 仅作辅助标记（'deleted' 表示已注销），且必须兼容 NULL；
 *   3. 数据库层过滤统一使用 USABLE_USER_WHERE，语义为
 *      isActive = true AND (status IS NULL OR status <> 'deleted')。
 */

/** 已注销标记值 */
const STATUS_DELETED = 'deleted';

/**
 * 判断用户是否可用（可登录、数据可被接口返回）
 * @param {{isActive?: boolean, status?: string|null}} user
 * @returns {boolean}
 */
function isUserUsable(user) {
  if (!user) return false;
  // 主判据：isActive
  if (user.isActive !== true) return false;
  // 辅助判据：status 为 NULL/undefined 视为正常（兼容存量数据）
  if (user.status && user.status === STATUS_DELETED) return false;
  return true;
}

/**
 * Prisma where 片段：只返回未注销的可用用户。
 * status IS NULL 的存量用户必须被视为正常，因此使用 OR 兼容写法。
 */
const USABLE_USER_WHERE = {
  isActive: true,
  OR: [{ status: null }, { status: { not: STATUS_DELETED } }],
};

module.exports = {
  STATUS_DELETED,
  isUserUsable,
  USABLE_USER_WHERE,
};
