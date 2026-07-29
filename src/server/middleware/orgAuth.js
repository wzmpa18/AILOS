// ============================================================
// src/server/middleware/orgAuth.js
// Phase 4 P2: 机构端鉴权中间件（零侵入 C 端，纯增量）
// ============================================================
// 使用前提：必须置于 authenticate 之后（依赖 req.userId）。
// 判定逻辑：
//   1. 查 OrganizationMember 表，获取用户所属机构、角色、状态
//   2. 验证角色匹配（admin / teacher）
//   3. 验证机构状态（active）
//   4. 若指定 orgId，验证用户属于该机构
// ============================================================
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * requireOrgRole — 机构角色鉴权
 * @param  {...string} roles - 允许的角色列表，如 'admin', 'teacher'
 * @returns Express middleware
 * 
 * 成功后设置：
 *   req.orgId     - 机构 ID
 *   req.orgRole   - 用户在该机构的角色
 *   req.orgMember - OrganizationMember 记录
 */
function requireOrgRole(...roles) {
  return async (req, res, next) => {
    try {
      if (req.isGuest || !req.userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const orgId = req.params.orgId || req.query.orgId || req.body.orgId || req.headers['x-org-id'];

      const where = {
        userId: req.userId,
        status: 'active',
      };
      if (orgId) where.organizationId = orgId;

      // 查找用户的机构成员身份
      const membership = await prisma.organizationMember.findFirst({
        where,
        include: {
          organization: true,
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          error: 'No active organization membership found',
          code: 'ORG_NOT_FOUND',
        });
      }

      if (membership.organization.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Organization is not active',
          code: 'ORG_INACTIVE',
        });
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: `Insufficient role. Required: ${roles.join('/')}`,
          code: 'ORG_ROLE_INSUFFICIENT',
        });
      }

      req.orgId = membership.organizationId;
      req.orgRole = membership.role;
      req.orgMember = membership;
      req.org = membership.organization;
      next();
    } catch (error) {
      logger.error('[orgAuth] 鉴权失败:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Organization authentication failed',
        code: 'ORG_AUTH_ERROR',
      });
    }
  };
}

/**
 * requireOrgAdmin — 必须机构管理员
 */
const requireOrgAdmin = requireOrgRole('admin');

/**
 * requireOrgTeacher — 必须机构老师（或管理员）
 */
const requireOrgTeacher = requireOrgRole('admin', 'teacher');

/**
 * getOrgContext — 获取用户所有机构身份（用于登录后选择机构）
 */
async function getOrgContext(userId) {
  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId,
      status: 'active',
      organization: { status: 'active' },
    },
    include: {
      organization: true,
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    orgId: m.organizationId,
    orgName: m.organization.name,
    orgLogo: m.organization.logoUrl,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

module.exports = { requireOrgRole, requireOrgAdmin, requireOrgTeacher, getOrgContext };
