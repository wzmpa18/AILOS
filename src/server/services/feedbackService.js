/**
 * src/server/services/feedbackService.js
 * v1.1.0 意见反馈服务
 *
 * 宪法依据：第二章 4「意见反馈功能补齐」
 *   ① 字段：问题类型、问题描述、联系方式、上传截图（可选）
 *   ② 提交后自动发邮件至 wuzhimin666@163.com，后端同步留存记录
 *   ③ 提交成功有友好提示
 *
 * 设计说明（增量补全，零存量删除）：
 *   - 记录留存：写入 data/feedback/ 目录 JSONL + 独立 JSON，不新增 Prisma 模型，
 *     避免对生产库做 schema 迁移（宪法：只补全不重构）。
 *   - 邮件发送：内置零依赖 SMTP 客户端（net/tls），未配置 SMTP 时降级为
 *     "仅留存 + 记录待发队列"，绝不因邮件失败导致用户提交失败。
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

const FEEDBACK_EMAIL = process.env.FEEDBACK_EMAIL || 'wuzhimin666@163.com';
const DATA_DIR = process.env.FEEDBACK_DIR || path.join(process.cwd(), 'data', 'feedback');

const TYPE_LABELS = {
  bug: '功能异常/Bug',
  content: '内容错误',
  experience: '体验建议',
  payment: '支付/会员问题',
  account: '账号问题',
  other: '其他',
};

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (e) {
    return false;
  }
}

/** 生成反馈单号 */
function genTicketId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `FB${ymd}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

/** 落盘留存：JSONL 汇总 + 单条 JSON */
function persist(record) {
  if (!ensureDir(DATA_DIR)) return false;
  try {
    fs.appendFileSync(path.join(DATA_DIR, 'feedback.jsonl'), JSON.stringify(record) + '\n', 'utf8');
    fs.writeFileSync(
      path.join(DATA_DIR, `${record.ticketId}.json`),
      JSON.stringify(record, null, 2),
      'utf8'
    );
    return true;
  } catch (e) {
    return false;
  }
}

// ==================== 轻量 SMTP 客户端（零依赖） ====================

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: String(process.env.SMTP_SECURE || 'true') !== 'false',
    user,
    pass,
    from: process.env.SMTP_FROM || user,
  };
}

function encodeHeader(text) {
  return `=?UTF-8?B?${Buffer.from(String(text), 'utf8').toString('base64')}?=`;
}

/**
 * 极简 SMTP 发信：AUTH LOGIN + MAIL/RCPT/DATA
 * 仅用于内部反馈通知，失败不抛给调用方（由上层 catch）
 */
function sendMailViaSmtp(cfg, { to, subject, text }) {
  return new Promise((resolve, reject) => {
    const connector = cfg.secure ? tls : net;
    const socket = connector.connect(
      cfg.secure ? { host: cfg.host, port: cfg.port, servername: cfg.host } : { host: cfg.host, port: cfg.port }
    );

    let stage = 0;
    let buffer = '';
    let settled = false;

    const body = [
      `From: ${encodeHeader('言道AILOS反馈')} <${cfg.from}>`,
      `To: <${to}>`,
      `Subject: ${encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(text, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
    ].join('\r\n');

    // 按 SMTP 会话顺序推进
    const steps = [
      `EHLO ailos\r\n`,
      `AUTH LOGIN\r\n`,
      `${Buffer.from(cfg.user, 'utf8').toString('base64')}\r\n`,
      `${Buffer.from(cfg.pass, 'utf8').toString('base64')}\r\n`,
      `MAIL FROM:<${cfg.from}>\r\n`,
      `RCPT TO:<${to}>\r\n`,
      `DATA\r\n`,
      `${body}\r\n.\r\n`,
      `QUIT\r\n`,
    ];

    const finish = (err) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (e) { /* ignore */ }
      if (err) reject(err); else resolve(true);
    };

    socket.setTimeout(15000, () => finish(new Error('SMTP_TIMEOUT')));
    socket.on('error', (e) => finish(e));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (!/\r\n$/.test(buffer)) return;
      const lines = buffer.trim().split('\r\n');
      const last = lines[lines.length - 1];
      buffer = '';

      const code = parseInt(last.slice(0, 3), 10);
      if (code >= 400) return finish(new Error(`SMTP_${code}: ${last}`));

      if (stage >= steps.length) return finish(null);
      const cmd = steps[stage++];
      socket.write(cmd);
      if (cmd === 'QUIT\r\n') finish(null);
    });
  });
}

/** 组装邮件正文 */
function buildMailText(record) {
  return [
    '【言道 AILOS】用户意见反馈',
    '--------------------------------',
    `反馈单号：${record.ticketId}`,
    `提交时间：${record.createdAt}`,
    `问题类型：${record.typeLabel}`,
    `联系方式：${record.contact || '（未填写）'}`,
    `用户ID：${record.userId || '游客'}`,
    `页面来源：${record.page || '-'}`,
    `设备信息：${record.userAgent || '-'}`,
    `截图数量：${(record.screenshots || []).length}`,
    '--------------------------------',
    '问题描述：',
    record.description,
    '',
    (record.screenshots || []).length
      ? `截图文件：\n${record.screenshots.map((s) => `  - ${s}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n');
}

/**
 * 提交反馈主流程
 * @returns {{ticketId:string, persisted:boolean, mailed:boolean, mailError?:string}}
 */
async function submitFeedback(input) {
  const type = String(input.type || 'other').trim();
  const record = {
    ticketId: genTicketId(),
    createdAt: new Date().toISOString(),
    type,
    typeLabel: TYPE_LABELS[type] || TYPE_LABELS.other,
    description: String(input.description || '').trim(),
    contact: String(input.contact || '').trim(),
    screenshots: input.screenshots || [],
    userId: input.userId || null,
    page: input.page || null,
    userAgent: input.userAgent || null,
    mailStatus: 'pending',
  };

  const persisted = persist(record);

  let mailed = false;
  let mailError;
  const cfg = smtpConfig();
  if (cfg) {
    try {
      await sendMailViaSmtp(cfg, {
        to: FEEDBACK_EMAIL,
        subject: `[AILOS反馈][${record.typeLabel}] ${record.ticketId}`,
        text: buildMailText(record),
      });
      mailed = true;
      record.mailStatus = 'sent';
    } catch (e) {
      mailError = e.message;
      record.mailStatus = 'failed';
      record.mailError = e.message;
    }
  } else {
    record.mailStatus = 'no_smtp_config';
    mailError = 'SMTP 未配置，已留存待发';
  }

  // 邮件状态回写（不影响用户提交结果）
  if (persisted) persist(record);

  return { ticketId: record.ticketId, persisted, mailed, mailError };
}

/** 管理端查看反馈列表 */
function listFeedback(limit = 50) {
  try {
    const file = path.join(DATA_DIR, 'feedback.jsonl');
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(Boolean)
      .slice(-limit)
      .reverse();
  } catch (e) {
    return [];
  }
}

module.exports = {
  submitFeedback,
  listFeedback,
  TYPE_LABELS,
  FEEDBACK_EMAIL,
  DATA_DIR,
};
