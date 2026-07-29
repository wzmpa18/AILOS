// ============================================================
// src/services/languageConsistencyService.js
// P2 任务二：双语言一致性校验机制（双宪法第十章）
// 设计铁律：
//   1. 校验基准 = ContextResolver 的归一化规则（normalizeLang）为唯一标准。
//   2. 轻度漂移（语义一致、仅格式/命名差异）→ 自动归一化修复 + 记录日志。
//   3. 重度冲突（多字段语义矛盾、无法自动判定真值）→ 不自动修复，生成 P2_ALERT 告警 + 同步账簿待处理清单。
//   4. 保护窗口期：个人中心 / 注册引导修改后（以 updatedAt 为基准）1 小时内，禁止任何自动回写，仅记录日志。
//   5. 人工处置：仅管理员经管理后台确认真值后修复，严禁开发/AI 绕过流程直改字段。
// 纯决策逻辑（evaluate）与 DB / 持久化解耦，便于单测。
// ============================================================
const fs = require('fs');
const path = require('path');
// 归一化规则唯一真源（与 contextResolver 共用同一 util）
const { normalizeLang } = require('../utils/langNormalize');

// logger 容错加载（生产用 winston；无依赖单测环境回落 console，不影响纯逻辑）
let logger;
try {
  logger = require('../utils/logger');
} catch (_e) {
  logger = { info() {}, warn() {}, error() {}, debug() {} };
}

// prisma 惰性加载：纯决策逻辑（evaluate）不触达 DB，便于无依赖单测
function db() {
  return require('../config/database');
}

// 保护窗口期：1 小时（毫秒）
const PROTECT_WINDOW_MS = 60 * 60 * 1000;

// 语义 → 规范存储码（对齐 languageService.SUPPORTED_LANGUAGES 的 code）
const SEMANTIC_TO_CODE = {
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  es: 'es',
  de: 'de',
};

const ANOMALY = { NORMAL: '正常', LIGHT: '轻度漂移', SEVERE: '重度冲突' };
const HANDLE = {
  REPAIRED: '已修复',
  MANUAL: '待人工介入',
  NOOP: '无操作',
  WINDOW: '窗口期保护',
};

// 文件兜底持久化目录（当 Prisma 新表尚未 migrate 时仍可运行/留证）
const DATA_DIR = path.join(__dirname, '..', '..', 'logs', 'language-consistency');
const LOG_FILE = path.join(DATA_DIR, 'consistency-log.jsonl');
const ALERT_FILE = path.join(DATA_DIR, 'alerts.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    logger.warn('[langConsistency] 无法创建数据目录:', e.message);
  }
}

// 语义键（2 字母），用于「语义是否一致」判定
function semantic(raw) {
  return normalizeLang(raw); // null / 2字母
}

// 规范存储码（归一化修复的目标值）
function canonicalCode(raw) {
  const s = semantic(raw);
  if (!s) return null;
  return SEMANTIC_TO_CODE[s] || s;
}

/**
 * 纯决策函数：给定用户当前语言数据快照，输出异常分级、处理结论、日志字段、修复项、告警。
 * 不做任何 IO，便于单测。
 *
 * @param {object} snapshot
 *   pref: { nativeLanguage, defaultExplanationLanguage, interfaceLanguage, fallbackLanguage, updatedAt } | null
 *   primaryLearning: { languageCode, updatedAt } | null   // active + 最高优先级
 *   now: Date
 * @returns {object} 决策结果
 */
function evaluate(snapshot) {
  const { pref, primaryLearning, now = new Date() } = snapshot || {};

  // 配置缺失：不属于漂移/冲突范畴，标记无操作（由 ContextResolver 在读链路抛错兜底）
  if (!pref || !primaryLearning || !primaryLearning.languageCode) {
    return {
      anomalyType: ANOMALY.NORMAL,
      handleResult: HANDLE.NOOP,
      protectWindowFlag: false,
      fields: {
        nativeLangCurrent: pref?.nativeLanguage ?? null,
        nativeLangExpected: canonicalCode(pref?.nativeLanguage) ?? null,
        targetLangCurrent: primaryLearning?.languageCode ?? null,
        targetLangExpected: canonicalCode(primaryLearning?.languageCode) ?? null,
      },
      repairs: [],
      alert: null,
      detail: { note: '语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）' },
    };
  }

  // ---- 母语语义源：nativeLanguage / defaultExplanationLanguage（均应与母语语义一致）----
  const nativeSources = {
    nativeLanguage: pref.nativeLanguage,
    defaultExplanationLanguage: pref.defaultExplanationLanguage,
  };
  // ---- 目标语言语义源：primaryLearning.languageCode ----
  const targetSources = {
    'learning.languageCode': primaryLearning.languageCode,
  };

  // 权威值：母语以 nativeLanguage 为准；目标以 primaryLearning.languageCode 为准
  const nativeExpectedCode = canonicalCode(pref.nativeLanguage);
  const targetExpectedCode = canonicalCode(primaryLearning.languageCode);
  const nativeExpectedSem = semantic(pref.nativeLanguage);
  const targetExpectedSem = semantic(primaryLearning.languageCode);

  // 保护窗口期：任一相关表最近修改在 1 小时内
  const ts = [pref.updatedAt, primaryLearning.updatedAt]
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  const lastModified = ts.length ? Math.max(...ts) : 0;
  const inWindow = lastModified > 0 && now.getTime() - lastModified < PROTECT_WINDOW_MS;

  // 逐字段比对，收集：语义冲突项（severe）、格式漂移项（light）
  const conflictFields = [];
  const driftFields = [];
  const tableValues = { ...nativeSources, ...targetSources };

  // 母语字段组内一致性（语义对齐 nativeExpectedSem）
  for (const [field, raw] of Object.entries(nativeSources)) {
    const sem = semantic(raw);
    if (sem == null) continue; // 空值不计（由配置缺失分支/写入接口保证）
    if (sem !== nativeExpectedSem) {
      // 语义矛盾 → 重度冲突
      conflictFields.push({ field, current: raw, expectedSemantic: nativeExpectedSem, group: 'native' });
    } else if (String(raw) !== nativeExpectedCode) {
      // 语义一致但原始存储值非规范形式（格式/命名差异）→ 轻度漂移
      driftFields.push({ field, current: raw, canonical: nativeExpectedCode, group: 'native' });
    }
  }
  // 目标字段组内一致性
  for (const [field, raw] of Object.entries(targetSources)) {
    const sem = semantic(raw);
    if (sem == null) continue;
    if (sem !== targetExpectedSem) {
      conflictFields.push({ field, current: raw, expectedSemantic: targetExpectedSem, group: 'target' });
    } else if (String(raw) !== targetExpectedCode) {
      driftFields.push({ field, current: raw, canonical: targetExpectedCode, group: 'target' });
    }
  }

  const baseFields = {
    nativeLangCurrent: pref.nativeLanguage ?? null,
    nativeLangExpected: nativeExpectedCode ?? null,
    targetLangCurrent: primaryLearning.languageCode ?? null,
    targetLangExpected: targetExpectedCode ?? null,
  };

  // === 分级判定 ===
  // 重度冲突优先（语义矛盾无法自动判真值）
  if (conflictFields.length > 0) {
    return {
      anomalyType: ANOMALY.SEVERE,
      handleResult: inWindow ? HANDLE.WINDOW : HANDLE.MANUAL,
      protectWindowFlag: inWindow,
      fields: baseFields,
      repairs: [], // 重度冲突：任何情况都不自动修复
      alert: inWindow
        ? null // 窗口期内仅记录日志，不生成告警（等窗口后复测）
        : {
            conflictFields,
            tableValues,
            reason: '多字段语言语义矛盾，无法自动判定真值，需人工确认',
          },
      detail: { conflictFields, driftFields, tableValues, inWindow },
    };
  }

  // 轻度漂移（语义一致、仅格式/命名差异）
  if (driftFields.length > 0) {
    if (inWindow) {
      return {
        anomalyType: ANOMALY.LIGHT,
        handleResult: HANDLE.WINDOW,
        protectWindowFlag: true,
        fields: baseFields,
        repairs: [], // 窗口期内禁止任何回写（含轻度归一化）
        alert: null,
        detail: { driftFields, tableValues, inWindow: true, note: '窗口期保护，仅记录差异日志，不回写' },
      };
    }
    // 窗口期外：自动归一化修复
    const repairs = driftFields.map((d) => ({
      group: d.group,
      field: d.field,
      from: d.current,
      to: d.canonical,
    }));
    return {
      anomalyType: ANOMALY.LIGHT,
      handleResult: HANDLE.REPAIRED,
      protectWindowFlag: false,
      fields: baseFields,
      repairs,
      alert: null,
      detail: { driftFields, tableValues, inWindow: false },
    };
  }

  // 正常
  return {
    anomalyType: ANOMALY.NORMAL,
    handleResult: HANDLE.NOOP,
    protectWindowFlag: inWindow,
    fields: baseFields,
    repairs: [],
    alert: null,
    detail: { tableValues, inWindow },
  };
}

// ---------------- 持久化：Prisma 优先，文件兜底 ----------------

async function persistLog(record) {
  // 1) Prisma
  try {
    const prisma = db();
    if (prisma.languageConsistencyLog) {
      await prisma.languageConsistencyLog.create({ data: record });
      return { store: 'db' };
    }
  } catch (e) {
    logger.warn('[langConsistency] DB 写日志失败，转文件兜底:', e.message);
  }
  // 2) 文件兜底
  try {
    ensureDataDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ...record, checkTime: record.checkTime || new Date() }) + '\n', 'utf8');
    return { store: 'file' };
  } catch (e) {
    logger.error('[langConsistency] 文件写日志失败:', e.message);
    return { store: 'none', error: e.message };
  }
}

function readFileAlerts() {
  try {
    if (!fs.existsSync(ALERT_FILE)) return [];
    return JSON.parse(fs.readFileSync(ALERT_FILE, 'utf8') || '[]');
  } catch {
    return [];
  }
}

function writeFileAlerts(list) {
  ensureDataDir();
  fs.writeFileSync(ALERT_FILE, JSON.stringify(list, null, 2), 'utf8');
}

async function createAlert(userId, alertPayload) {
  const now = new Date();
  const data = {
    userId,
    conflictFields: alertPayload.conflictFields,
    tableValues: alertPayload.tableValues,
    reason: alertPayload.reason,
    status: 'P2_ALERT',
    operator: 'system',
    createdAt: now,
    updatedAt: now,
  };
  // Prisma 优先
  try {
    const prisma = db();
    if (prisma.languageConsistencyAlert) {
      const created = await prisma.languageConsistencyAlert.create({ data });
      await appendAlertToLedger(created);
      return created;
    }
  } catch (e) {
    logger.warn('[langConsistency] DB 写告警失败，转文件兜底:', e.message);
  }
  // 文件兜底
  const { randomUUID } = require('crypto');
  const created = { id: randomUUID(), ...data };
  const list = readFileAlerts();
  list.push(created);
  writeFileAlerts(list);
  await appendAlertToLedger(created);
  return created;
}

// 账簿联动：将 P2_ALERT 追加至总账账簿「待处理告警清单」
async function appendAlertToLedger(alert) {
  try {
    const ledgerPath = process.env.AILOS_LEDGER_PATH
      || path.join(__dirname, '..', '..', 'AILOS_指令中心', 'AILOS_总账账簿.md');
    if (!fs.existsSync(ledgerPath)) {
      logger.info('[langConsistency] 账簿文件不存在，跳过账簿联动（告警已入持久化存储）');
      return false;
    }
    let md = fs.readFileSync(ledgerPath, 'utf8');
    const anchor = '<!-- P2_ALERT_ROWS -->';
    const row = `| ${alert.id} | ${alert.userId} | ${escapeCell(alert.reason)} | \`P2_ALERT\` | ${new Date(alert.createdAt).toISOString()} | — |`;
    if (md.includes(anchor)) {
      md = md.replace(anchor, `${row}\n${anchor}`);
      fs.writeFileSync(ledgerPath, md, 'utf8');
      return true;
    }
    logger.warn('[langConsistency] 账簿未找到 P2_ALERT 锚点，跳过联动');
    return false;
  } catch (e) {
    logger.warn('[langConsistency] 账簿联动失败（不阻断校验）:', e.message);
    return false;
  }
}

function escapeCell(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// ---------------- 修复执行（仅窗口期外的轻度漂移；重度冲突永不走这里）----------------
async function applyRepairs(userId, repairs) {
  if (!repairs || repairs.length === 0) return { applied: 0 };
  const prefUpdate = {};
  let learningTargetCode = null;
  for (const r of repairs) {
    if (r.group === 'native') {
      if (r.field === 'nativeLanguage') prefUpdate.nativeLanguage = r.to;
      if (r.field === 'defaultExplanationLanguage') prefUpdate.defaultExplanationLanguage = r.to;
    } else if (r.group === 'target' && r.field === 'learning.languageCode') {
      learningTargetCode = r.to;
    }
  }
  let applied = 0;
  const prisma = db();
  try {
    if (Object.keys(prefUpdate).length > 0) {
      await prisma.userLanguagePreference.update({ where: { userId }, data: prefUpdate });
      applied += Object.keys(prefUpdate).length;
    }
    if (learningTargetCode) {
      // 归一化 languageCode：更新 active 最高优先级记录
      const primary = await prisma.userLearningLanguage.findFirst({
        where: { userId, status: 'active' },
        orderBy: { priority: 'asc' },
      });
      if (primary && primary.languageCode !== learningTargetCode) {
        await prisma.userLearningLanguage.update({
          where: { id: primary.id },
          data: { languageCode: learningTargetCode },
        });
        applied += 1;
      }
    }
  } catch (e) {
    logger.error('[langConsistency] 归一化修复失败:', e.message);
    throw e;
  }
  return { applied };
}

// ---------------- 单用户校验（拉数据 → evaluate → 修复/告警 → 记日志）----------------
async function checkUser(userId, opts = {}) {
  const { operator = 'system', runId = null, dryRun = false, now = new Date() } = opts;

  const prisma = db();
  const pref = await prisma.userLanguagePreference.findUnique({ where: { userId } });
  const primaryLearning = await prisma.userLearningLanguage.findFirst({
    where: { userId, status: 'active' },
    orderBy: { priority: 'asc' },
  });

  const decision = evaluate({ pref, primaryLearning, now });

  let handleResult = decision.handleResult;
  let alertId = null;

  // 执行修复（仅 dryRun=false 且有 repairs）
  if (!dryRun && decision.repairs.length > 0) {
    try {
      await applyRepairs(userId, decision.repairs);
    } catch (e) {
      handleResult = '修复失败';
    }
  }

  // 生成告警（重度冲突且非窗口期）
  if (!dryRun && decision.alert) {
    const alert = await createAlert(userId, decision.alert);
    alertId = alert.id;
  }

  // 记日志
  const logRecord = {
    userId,
    checkTime: now,
    nativeLangCurrent: decision.fields.nativeLangCurrent,
    nativeLangExpected: decision.fields.nativeLangExpected,
    targetLangCurrent: decision.fields.targetLangCurrent,
    targetLangExpected: decision.fields.targetLangExpected,
    anomalyType: decision.anomalyType,
    handleResult,
    protectWindowFlag: decision.protectWindowFlag,
    operator,
    detail: { ...decision.detail, repairs: decision.repairs, alertId },
    runId,
  };
  if (!dryRun) await persistLog(logRecord);

  return { ...decision, handleResult, alertId, log: logRecord };
}

// ---------------- 全量校验 ----------------
async function checkAll(opts = {}) {
  const { operator = 'system', dryRun = false } = opts;
  const { randomUUID } = require('crypto');
  const runId = opts.runId || randomUUID();
  const now = new Date();

  const prisma = db();
  const users = await prisma.userLanguagePreference.findMany({ select: { userId: true } });
  const stats = { total: 0, normal: 0, light: 0, severe: 0, repaired: 0, alerts: 0, windowProtected: 0, errors: 0 };
  const anomalies = [];

  for (const { userId } of users) {
    stats.total += 1;
    try {
      const r = await checkUser(userId, { operator, runId, dryRun, now });
      if (r.anomalyType === ANOMALY.NORMAL) stats.normal += 1;
      if (r.anomalyType === ANOMALY.LIGHT) stats.light += 1;
      if (r.anomalyType === ANOMALY.SEVERE) stats.severe += 1;
      if (r.handleResult === HANDLE.REPAIRED) stats.repaired += 1;
      if (r.protectWindowFlag) stats.windowProtected += 1;
      if (r.alertId) stats.alerts += 1;
      if (r.anomalyType !== ANOMALY.NORMAL) {
        anomalies.push({
          userId,
          anomalyType: r.anomalyType,
          handleResult: r.handleResult,
          protectWindowFlag: r.protectWindowFlag,
          fields: r.fields,
          alertId: r.alertId,
          driftOrConflict: r.detail?.conflictFields || r.detail?.driftFields || [],
        });
      }
    } catch (e) {
      stats.errors += 1;
      logger.error(`[langConsistency] 用户 ${userId} 校验异常:`, e.message);
    }
  }

  logger.info(`[langConsistency] 全量校验完成 runId=${runId}`, stats);
  return { runId, checkedAt: now.toISOString(), stats, anomalies };
}

// ---------------- 告警查询 / 人工处置 ----------------
async function listAlerts(status) {
  try {
    const prisma = db();
    if (prisma.languageConsistencyAlert) {
      const where = status ? { status } : {};
      return await prisma.languageConsistencyAlert.findMany({ where, orderBy: { createdAt: 'desc' } });
    }
  } catch (e) {
    logger.warn('[langConsistency] DB 查询告警失败，转文件兜底:', e.message);
  }
  const list = readFileAlerts();
  return status ? list.filter((a) => a.status === status) : list;
}

async function resolveAlert(alertId, adminUserId, note) {
  const now = new Date();
  try {
    const prisma = db();
    if (prisma.languageConsistencyAlert) {
      return await prisma.languageConsistencyAlert.update({
        where: { id: alertId },
        data: { status: 'RESOLVED', resolvedBy: adminUserId, resolvedAt: now, resolveNote: note || null, updatedAt: now },
      });
    }
  } catch (e) {
    logger.warn('[langConsistency] DB 处置告警失败，转文件兜底:', e.message);
  }
  const list = readFileAlerts();
  const idx = list.findIndex((a) => a.id === alertId);
  if (idx === -1) throw new Error('告警不存在');
  list[idx] = { ...list[idx], status: 'RESOLVED', resolvedBy: adminUserId, resolvedAt: now, resolveNote: note || null, updatedAt: now };
  writeFileAlerts(list);
  return list[idx];
}


// ---------------- 存量治理：多 active 学习语言去重（Chapter 10 存量数据治理）----------------
// 规则：同一用户存在多条 status=active 的 UserLearningLanguage 时，
//   仅保留主语言（priority 最小；并列时 updatedAt 最新）为 active，其余置 inactive。
//   与 ContextResolver 读取规则（active + priority asc）保持一致，治理后读取无歧义。
// 保护窗口期：任一 active 记录 1 小时内被修改 → 跳过该用户，仅记录日志（防止与用户操作竞态）。
// 全程留痕 LanguageConsistencyLog；支持 dryRun 预演。
async function dedupeActiveLanguages(opts = {}) {
  const { operator = 'system', dryRun = false } = opts;
  const { randomUUID } = require('crypto');
  const runId = opts.runId || randomUUID();
  const now = new Date();
  const prisma = db();

  const all = await prisma.userLearningLanguage.findMany({ where: { status: 'active' } });
  const byUser = new Map();
  for (const r of all) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId).push(r);
  }

  const stats = { scannedActiveRows: all.length, users: byUser.size, multiActiveUsers: 0, governed: 0, windowSkipped: 0, deactivatedRows: 0, errors: 0 };
  const details = [];

  for (const [userId, rows] of byUser) {
    if (rows.length <= 1) continue;
    stats.multiActiveUsers += 1;

    // 保护窗口期判定
    const latest = Math.max(...rows.map((r) => new Date(r.updatedAt).getTime()));
    const inWindow = now.getTime() - latest < PROTECT_WINDOW_MS;

    // 保留项：priority 最小；并列时 updatedAt 最新
    const sorted = [...rows].sort((a, b) =>
      a.priority - b.priority || new Date(b.updatedAt) - new Date(a.updatedAt));
    const keep = sorted[0];
    const drop = sorted.slice(1);

    const record = {
      userId,
      checkTime: now,
      nativeLangCurrent: null,
      nativeLangExpected: null,
      targetLangCurrent: rows.map((r) => `${r.languageCode}#p${r.priority}`).join(','),
      targetLangExpected: keep.languageCode,
      anomalyType: '结构异常-多active',
      handleResult: dryRun ? '预演-无操作' : (inWindow ? HANDLE.WINDOW : HANDLE.REPAIRED),
      protectWindowFlag: inWindow,
      operator,
      detail: {
        keep: { id: keep.id, code: keep.languageCode, priority: keep.priority, updatedAt: keep.updatedAt },
        deactivate: drop.map((d) => ({ id: d.id, code: d.languageCode, priority: d.priority, updatedAt: d.updatedAt })),
        rule: 'keep priority asc first (tie: updatedAt desc), others -> inactive',
        dryRun,
      },
      runId,
    };

    if (inWindow) {
      stats.windowSkipped += 1;
      if (!dryRun) await persistLog(record);
      details.push({ userId, action: 'WINDOW_SKIP', keep: keep.languageCode, drop: drop.map((d) => d.languageCode) });
      continue;
    }

    if (!dryRun) {
      try {
        await prisma.userLearningLanguage.updateMany({
          where: { id: { in: drop.map((d) => d.id) } },
          data: { status: 'inactive' },
        });
        stats.deactivatedRows += drop.length;
        stats.governed += 1;
        await persistLog(record);
      } catch (e) {
        stats.errors += 1;
        logger.error(`[langConsistency] 多active治理失败 user=${userId}:`, e.message);
        continue;
      }
    } else {
      stats.governed += 1;
      stats.deactivatedRows += drop.length;
    }
    details.push({ userId, action: dryRun ? 'DRYRUN' : 'DEACTIVATED', keep: keep.languageCode, drop: drop.map((d) => d.languageCode) });
  }

  logger.info(`[langConsistency] 多active存量治理完成 runId=${runId} dryRun=${dryRun}`, stats);
  return { runId, checkedAt: now.toISOString(), dryRun, stats, details };
}

module.exports = {
  // 常量
  PROTECT_WINDOW_MS,
  ANOMALY,
  HANDLE,
  SEMANTIC_TO_CODE,
  // 纯逻辑
  evaluate,
  semantic,
  canonicalCode,
  // DB 绑定
  checkUser,
  checkAll,
  dedupeActiveLanguages,
  applyRepairs,
  // 告警
  createAlert,
  listAlerts,
  resolveAlert,
};
