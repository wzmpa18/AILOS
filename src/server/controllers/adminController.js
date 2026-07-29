// ============================================================
// src/server/controllers/adminController.js
// P2 基础运营管理后台：订单查询/导出、用户时长管理、异常订单标记、操作日志
// 复用现有管理员 allowlist 鉴权（requireAdmin）；不侵入 User 认证 / membership 逻辑
// ============================================================
const prisma = require('../../config/database');
const logger = require('../../utils/logger');
const { getBillingService } = require('../../services/billingService');
const { getSystemConfigService } = require('../../services/systemConfigService');
const { hashPassword } = require('../../utils/crypto');

// ---------- 工具 ----------
function toSec(v) {
  return (v === null || v === undefined) ? 0 : Number(v);
}

function fmtTime(d) {
  return d ? new Date(d).toISOString() : '';
}

// 分页解析：默认 20 条/页（P1-1）
function parsePage(q) {
  let page = parseInt((q && q.page) || '1', 10); if (!(page >= 1)) page = 1;
  let pageSize = parseInt((q && q.pageSize) || '20', 10); if (!(pageSize >= 1)) pageSize = 20; if (pageSize > 100) pageSize = 100;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// 敏感操作密码校验（P1-4）：默认 Admin@2026，首次使用写入 SystemConfig
const DEFAULT_OP_PASSWORD = 'Admin@2026';
async function verifyOpPassword(opPassword) {
  if (!opPassword) return false;
  const cfg = getSystemConfigService();
  let stored = await cfg.get('admin.op_password', null);
  if (!stored) { await cfg.set('admin.op_password', DEFAULT_OP_PASSWORD); stored = DEFAULT_OP_PASSWORD; }
  return String(opPassword) === String(stored);
}

function randPwd(len = 12) {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

async function buildAccountMap(userIds) {
  if (!userIds.length) return {};
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, uniqueId: true, phone: true },
  });
  const m = {};
  for (const u of users) m[u.id] = u.uniqueId || u.phone || u.id;
  return m;
}

function fmtPackage(o, account) {
  return {
    id: o.id,
    orderNo: o.orderNo,
    userId: o.userId,
    account,
    type: 'package',
    packageType: o.packageType,
    amount: o.priceCny == null ? '0' : String(o.priceCny),
    status: o.status,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    abnormal: !!o.abnormal,
    abnormalNote: o.abnormalNote || '',
  };
}

function fmtMembership(o, account) {
  return {
    id: o.id,
    orderNo: o.orderNo,
    userId: o.userId,
    account,
    type: 'membership',
    packageType: o.plan,
    amount: o.amount == null ? '0' : o.amount.toString(),
    status: o.status,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    abnormal: !!o.abnormal,
    abnormalNote: o.abnormalNote || '',
  };
}

function buildOrderWhere({ startDate, endDate, abnormal }) {
  const where = {};
  if (startDate) {
    where.createdAt = where.createdAt || {};
    where.createdAt.gte = new Date(startDate);
  }
  if (endDate) {
    where.createdAt = where.createdAt || {};
    where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  }
  if (abnormal === '1' || abnormal === 1) where.abnormal = true;
  else if (abnormal === '0') where.abnormal = false;
  return where;
}

async function fetchOrders({ account, startDate, endDate, abnormal, type }) {
  const pkgWhere = buildOrderWhere({ startDate, endDate, abnormal });
  const memWhere = buildOrderWhere({ startDate, endDate, abnormal });
  let targetUserId = null;
  if (account) {
    const u = await prisma.user.findFirst({
      where: { OR: [{ uniqueId: account }, { phone: account }, { email: account }] },
      select: { id: true },
    });
    if (!u) return [];
    targetUserId = u.id;
    pkgWhere.userId = u.id;
    memWhere.userId = u.id;
  }
  const out = [];
  if (type !== 'membership') {
    const rows = await prisma.translationPackageOrder.findMany({
      where: pkgWhere, orderBy: { createdAt: 'desc' }, take: 1000,
    });
    out.push(...rows.map((r) => fmtPackage(r, targetUserId ? account : '')));
  }
  if (type !== 'package') {
    const rows = await prisma.membershipOrder.findMany({
      where: memWhere, orderBy: { createdAt: 'desc' }, take: 1000,
    });
    out.push(...rows.map((r) => fmtMembership(r, targetUserId ? account : '')));
  }
  if (!targetUserId) {
    const ids = [...new Set(out.map((o) => o.userId))];
    const m = await buildAccountMap(ids);
    for (const o of out) o.account = m[o.userId] || o.userId;
  }
  out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return out;
}

// ---------- 1. 订单查询 ----------
async function listOrders(req, res) {
  try {
    const { account, startDate, endDate, abnormal, type } = req.query;
    const data = await fetchOrders({ account, startDate, endDate, abnormal, type });
    const { page, pageSize, skip } = parsePage(req.query);
    const total = data.length;
    const paged = data.slice(skip, skip + pageSize);
    return res.json({ success: true, count: total, total, page, pageSize, data: paged });
  } catch (e) {
    logger.error('[admin] listOrders 失败:', e.message);
    return res.status(500).json({ success: false, error: '订单查询失败' });
  }
}

// ---------- 1b. 订单导出 CSV（带 BOM） ----------
async function exportOrders(req, res) {
  try {
    const { account, startDate, endDate, abnormal, type } = req.query;
    const data = await fetchOrders({ account, startDate, endDate, abnormal, type });
    const header = ['订单号', '用户账号', '套餐类型', '金额', '支付状态', '创建时间', '支付时间'];
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [header.join(',')];
    for (const o of data) {
      lines.push([
        o.orderNo, o.account, o.packageType, o.amount, o.status,
        fmtTime(o.createdAt), fmtTime(o.paidAt),
      ].map(esc).join(','));
    }
    const csv = '﻿' + lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders_' + Date.now() + '.csv"');
    return res.send(csv);
  } catch (e) {
    logger.error('[admin] exportOrders 失败:', e.message);
    return res.status(500).json({ success: false, error: '订单导出失败' });
  }
}

// ---------- 2. 用户时长管理：查询 ----------
async function searchUserBilling(req, res) {
  try {
    const { account } = req.query;
    if (!account) return res.status(400).json({ success: false, error: '缺少 account 参数' });
    const u = await prisma.user.findFirst({
      where: { OR: [{ uniqueId: account }, { phone: account }, { email: account }] },
      select: {
        id: true, uniqueId: true, phone: true,
        membershipLevel: true, membershipExpiry: true,
      },
    });
    if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
    const b = await prisma.translationBillingBalance.findUnique({ where: { userId: u.id } });
    const status = await getBillingService().getStatus(u.id);
    const trialUsed = b ? toSec(b.trialUsedSec) : 0;
    const subUsed = b ? toSec(b.subUsedSec) : 0;
    const paidAgg = await prisma.translationPackageOrder.aggregate({
      _sum: { minutesUsed: true },
      where: { userId: u.id, packageType: { startsWith: 'pay_' }, status: 'paid' },
    });
    const paidUsed = toSec(paidAgg._sum.minutesUsed);
    const consumedSec = trialUsed + subUsed + paidUsed;
    const remainingSec =
      status.trial.remainingSec +
      (status.subscription ? status.subscription.remainingSec : 0) +
      status.paidPackage.remainingSec;
    return res.json({
      success: true,
      user: {
        account: u.uniqueId || u.phone,
        userId: u.id,
        membership: {
          level: u.membershipLevel || 'free',
          expiryAt: u.membershipExpiry,
        },
        trialClaimed: !!b && toSec(b.trialUsedSec) > 0,
        adminTimeSec: b ? toSec(b.adminTimeSec) : 0,
        remainingSec,
        trialRemainingSec: status.trial.remainingSec,
        subscriptionRemainingSec: status.subscription ? status.subscription.remainingSec : 0,
        paidRemainingSec: status.paidPackage.remainingSec,
        consumedSec,
        trialConsumedSec: trialUsed,
        subConsumedSec: subUsed,
        paidConsumedSec: paidUsed,
      },
    });
  } catch (e) {
    logger.error('[admin] searchUserBilling 失败:', e.message);
    return res.status(500).json({ success: false, error: '查询失败' });
  }
}

// ---------- 2b. 用户时长管理：手动调整 ----------
async function adjustUserTime(req, res) {
  try {
    const { account, op, deltaSec, reason, opPassword } = req.body || {};
    if (!await verifyOpPassword(opPassword)) return res.status(403).json({ success: false, error: '操作密码错误' });
    if (!account || !op || !reason) {
      return res.status(400).json({ success: false, error: 'account / op / reason 均为必填' });
    }
    const d = Number(deltaSec);
    if (!Number.isFinite(d) || d <= 0) {
      return res.status(400).json({ success: false, error: 'deltaSec 必须为正数' });
    }
    const u = await prisma.user.findFirst({
      where: { OR: [{ uniqueId: account }, { phone: account }, { email: account }] },
      select: { id: true, uniqueId: true, phone: true },
    });
    if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
    const before = await prisma.translationBillingBalance.findUnique({ where: { userId: u.id } });
    const beforeSec = before ? toSec(before.adminTimeSec) : 0;
    const delta = Math.floor(d);
    let afterSec = beforeSec;
    if (op === 'add') afterSec = beforeSec + delta;
    else if (op === 'deduct') afterSec = Math.max(0, beforeSec - delta);
    else return res.status(400).json({ success: false, error: 'op 必须为 add 或 deduct' });
    await prisma.$transaction([
      prisma.translationBillingBalance.upsert({
        where: { userId: u.id },
        create: {
          userId: u.id,
          trialTotalSec: 300,
          trialUsedSec: before ? before.trialUsedSec : 0,
          subUsedSec: before ? before.subUsedSec : 0,
          adminTimeSec: afterSec,
        },
        update: { adminTimeSec: afterSec },
      }),
      prisma.adminOperationLog.create({
        data: {
          adminId: req.userId, action: 'ADJUST_TIME', targetType: 'USER', targetId: u.id,
          reason, detail: { op, deltaSec: delta, beforeSec, afterSec },
        },
      }),
    ]);
    logger.info(`[admin] 调整时长 userId=${u.id} op=${op} delta=${delta} by=${req.userId}`);
    return res.json({ success: true, beforeSec, afterSec, delta });
  } catch (e) {
    logger.error('[admin] adjustUserTime 失败:', e.message);
    return res.status(500).json({ success: false, error: '调整失败' });
  }
}

// ---------- 3. 异常订单标记 ----------
async function markOrderAbnormal(req, res) {
  try {
    const id = req.params.id;
    const { type, abnormal, note, opPassword } = req.body || {};
    if (!await verifyOpPassword(opPassword)) return res.status(403).json({ success: false, error: '操作密码错误' });
    const model = type === 'membership' ? prisma.membershipOrder : prisma.translationPackageOrder;
    const existing = await model.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: '订单不存在' });
    const setAbnormal = abnormal !== false;
    await prisma.$transaction([
      model.update({
        where: { id },
        data: {
          abnormal: setAbnormal, abnormalNote: note || null,
          abnormalMarkedAt: new Date(), abnormalMarkedBy: req.userId,
        },
      }),
      prisma.adminOperationLog.create({
        data: {
          adminId: req.userId, action: 'MARK_ABNORMAL', targetType: 'ORDER', targetId: id,
          reason: note || null, detail: { type, abnormal: setAbnormal },
        },
      }),
    ]);
    return res.json({ success: true, abnormal: setAbnormal });
  } catch (e) {
    logger.error('[admin] markOrderAbnormal 失败:', e.message);
    return res.status(500).json({ success: false, error: '标记失败' });
  }
}

// ---------- 4. 操作日志 ----------
async function listOperationLogs(req, res) {
  try {
    const { page, pageSize, skip } = parsePage(req.query);
    const [total, logs] = await Promise.all([
      prisma.adminOperationLog.count(),
      prisma.adminOperationLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    ]);
    return res.json({ success: true, count: total, total, page, pageSize, data: logs });
  } catch (e) {
    logger.error('[admin] listOperationLogs 失败:', e.message);
    return res.status(500).json({ success: false, error: '查询失败' });
  }
}

// ---------- 当前管理员身份 ----------
async function getMe(req, res) {
  try {
    return res.json({ success: true, isAdmin: !!req.isAdmin, userId: req.userId });
  } catch (e) {
    return res.status(500).json({ success: false, error: '查询失败' });
  }
}

// ---------- 5. 登录审计（P1-5） ----------
async function listLoginLogs(req, res) {
  try {
    const { account, startDate, endDate } = req.query;
    const where = {};
    if (account) where.account = account;
    if (startDate) { where.createdAt = where.createdAt || {}; where.createdAt.gte = new Date(startDate); }
    if (endDate) { where.createdAt = where.createdAt || {}; where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z'); }
    const { page, pageSize, skip } = parsePage(req.query);
    const [total, logs] = await Promise.all([
      prisma.loginLog.count({ where }),
      prisma.loginLog.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: pageSize,
        select: { id: true, adminId: true, account: true, ip: true, userAgent: true, createdAt: true },
      }),
    ]);
    return res.json({ success: true, count: total, total, page, pageSize, data: logs });
  } catch (e) {
    logger.error('[admin] listLoginLogs 失败:', e.message);
    return res.status(500).json({ success: false, error: '查询失败' });
  }
}

// ---------- 6. 用户账号管控（P1-6） ----------
async function listUsers(req, res) {
  try {
    const { account } = req.query;
    const where = {};
    if (account) {
      where.OR = [
        { uniqueId: { contains: account } },
        { phone: { contains: account } },
        { email: { contains: account } },
      ];
    }
    const { page, pageSize, skip } = parsePage(req.query);
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: pageSize,
        select: {
          id: true, uniqueId: true, phone: true, email: true, nickname: true,
          membershipLevel: true, disabled: true, createdAt: true,
        },
      }),
    ]);
    return res.json({ success: true, count: total, total, page, pageSize, data: users });
  } catch (e) {
    logger.error('[admin] listUsers 失败:', e.message);
    return res.status(500).json({ success: false, error: '查询失败' });
  }
}

async function setUserStatus(req, res) {
  try {
    const { userId, account, disabled, opPassword, reason } = req.body || {};
    if (!await verifyOpPassword(opPassword)) return res.status(403).json({ success: false, error: '操作密码错误' });
    let u;
    if (userId) u = await prisma.user.findUnique({ where: { id: userId } });
    else if (account) u = await prisma.user.findFirst({ where: { OR: [{ uniqueId: account }, { phone: account }, { email: account }] } });
    if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
    const beforeDisabled = !!u.disabled;
    const afterDisabled = !!disabled;
    if (beforeDisabled === afterDisabled) return res.json({ success: true, changed: false, disabled: afterDisabled, message: '状态未变化' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: u.id }, data: { disabled: afterDisabled } }),
      prisma.adminOperationLog.create({
        data: {
          adminId: req.userId, action: 'SET_USER_STATUS', targetType: 'USER', targetId: u.id,
          reason: reason || null, detail: { beforeDisabled, afterDisabled },
        },
      }),
    ]);
    return res.json({ success: true, changed: true, disabled: afterDisabled, beforeDisabled, afterDisabled });
  } catch (e) {
    logger.error('[admin] setUserStatus 失败:', e.message);
    return res.status(500).json({ success: false, error: '操作失败' });
  }
}

async function resetPassword(req, res) {
  try {
    const { userId, account, opPassword, newPassword } = req.body || {};
    if (!await verifyOpPassword(opPassword)) return res.status(403).json({ success: false, error: '操作密码错误' });
    let u;
    if (userId) u = await prisma.user.findUnique({ where: { id: userId } });
    else if (account) u = await prisma.user.findFirst({ where: { OR: [{ uniqueId: account }, { phone: account }, { email: account }] } });
    if (!u) return res.status(404).json({ success: false, error: '用户不存在' });
    const gen = (newPassword && newPassword.length >= 6) ? newPassword : randPwd();
    const hash = await hashPassword(gen);
    await prisma.$transaction([
      prisma.user.update({ where: { id: u.id }, data: { passwordHash: hash, failedLoginAttempts: 0, lockedUntil: null } }),
      prisma.session.deleteMany({ where: { userId: u.id } }),
      prisma.adminOperationLog.create({
        data: {
          adminId: req.userId, action: 'RESET_PASSWORD', targetType: 'USER', targetId: u.id,
          reason: null, detail: { reset: true },
        },
      }),
    ]);
    return res.json({ success: true, newPassword: gen, message: '密码已重置，请妥善交付用户' });
  } catch (e) {
    logger.error('[admin] resetPassword 失败:', e.message);
    return res.status(500).json({ success: false, error: '操作失败' });
  }
}

// ---------- P3 DEF-P3-02: 订单退款时长回退（操作密码二次校验 + 审计留痕） ----------
// POST /api/admin/orders/:id/refund  body: { opPassword, reason? }
async function refundOrder(req, res) {
  try {
    const { id } = req.params;
    const { opPassword, reason } = req.body || {};
    if (!await verifyOpPassword(opPassword)) return res.status(403).json({ success: false, error: '操作密码错误' });
    const data = await getBillingService().refundOrder(id, { adminId: req.userId, reason: reason || null });
    logger.info(`[admin] 订单退款 orderId=${id} by=${req.userId} revokedSec=${data.revokedSec}`);
    return res.json({ success: true, data, message: '退款完成，未使用时长已回收' });
  } catch (e) {
    const status = e.status || 500;
    logger.error('[admin] refundOrder 失败:', e.message);
    return res.status(status).json({ success: false, error: e.code || 'REFUND_FAILED', message: e.message });
  }
}

async function changeOpPassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body || {};
    const cfg = getSystemConfigService();
    const stored = (await cfg.get('admin.op_password', null)) || DEFAULT_OP_PASSWORD;
    if (String(oldPassword) !== String(stored)) return res.status(403).json({ success: false, error: '原操作密码错误' });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, error: '新操作密码至少 6 位' });
    await cfg.set('admin.op_password', newPassword);
    return res.json({ success: true, message: '操作密码已更新' });
  } catch (e) {
    logger.error('[admin] changeOpPassword 失败:', e.message);
    return res.status(500).json({ success: false, error: '操作失败' });
  }
}

module.exports = {
  listOrders,
  exportOrders,
  searchUserBilling,
  adjustUserTime,
  markOrderAbnormal,
  listOperationLogs,
  refundOrder,
  getMe,
  listLoginLogs,
  listUsers,
  setUserStatus,
  resetPassword,
  changeOpPassword,
};
