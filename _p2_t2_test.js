// ============================================================
// _p2_t2_test.js — P2 任务二：双语言一致性校验 决策逻辑验收测试（可复跑，无需 DB）
// 覆盖：轻度漂移识别+修复决策 / 保护窗口期 / 重度冲突告警 / 正常 / 日志字段完整性
// 运行：node _p2_t2_test.js
// ============================================================
const svc = require('./src/services/languageConsistencyService');
const { evaluate, ANOMALY, HANDLE, PROTECT_WINDOW_MS } = svc;

let pass = 0;
let fail = 0;
const results = [];

function assert(name, cond, extra) {
  if (cond) {
    pass += 1;
    results.push(`  [PASS] ${name}`);
  } else {
    fail += 1;
    results.push(`  [FAIL] ${name}${extra ? ' -> ' + JSON.stringify(extra) : ''}`);
  }
}

const NOW = new Date('2026-07-26T12:00:00Z');
const OLD = new Date('2026-07-26T09:00:00Z'); // 3h 前（窗口外）
const RECENT = new Date('2026-07-26T11:30:00Z'); // 30min 前（窗口内）

// ---- 用例 1：正常（zh-CN 母语 + ja 目标，全一致，窗口外）----
(() => {
  const d = evaluate({
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'zh-CN', updatedAt: OLD },
    primaryLearning: { languageCode: 'ja', updatedAt: OLD },
    now: NOW,
  });
  assert('用例1 正常-anomalyType', d.anomalyType === ANOMALY.NORMAL, d);
  assert('用例1 正常-handle=无操作', d.handleResult === HANDLE.NOOP, d);
  assert('用例1 正常-无修复', d.repairs.length === 0, d);
  assert('用例1 正常-无告警', d.alert === null, d);
  assert('用例1 字段-native当前=zh-CN', d.fields.nativeLangCurrent === 'zh-CN', d.fields);
  assert('用例1 字段-target期望=ja', d.fields.targetLangExpected === 'ja', d.fields);
})();

// ---- 用例 2：轻度漂移（格式/命名差异，语义一致，窗口外）→ 自动归一化修复 ----
(() => {
  const d = evaluate({
    // defaultExplanationLanguage='chinese' 与 nativeLanguage='zh-CN' 语义都是 zh，仅格式不同
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'chinese', updatedAt: OLD },
    // languageCode='Japanese' 语义=ja，规范码=ja
    primaryLearning: { languageCode: 'Japanese', updatedAt: OLD },
    now: NOW,
  });
  assert('用例2 轻度漂移-anomalyType', d.anomalyType === ANOMALY.LIGHT, d);
  assert('用例2 轻度漂移-handle=已修复', d.handleResult === HANDLE.REPAIRED, d);
  assert('用例2 轻度漂移-有修复项', d.repairs.length >= 2, d.repairs);
  assert('用例2 轻度漂移-修复explanation→zh-CN', d.repairs.some((r) => r.field === 'defaultExplanationLanguage' && r.to === 'zh-CN'), d.repairs);
  assert('用例2 轻度漂移-修复learning→ja', d.repairs.some((r) => r.field === 'learning.languageCode' && r.to === 'ja'), d.repairs);
  assert('用例2 轻度漂移-无告警', d.alert === null, d);
})();

// ---- 用例 3：轻度漂移 + 保护窗口期内 → 不修复、仅记录 ----
(() => {
  const d = evaluate({
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'chinese', updatedAt: RECENT },
    primaryLearning: { languageCode: 'Japanese', updatedAt: RECENT },
    now: NOW,
  });
  assert('用例3 窗口期-anomalyType仍为轻度漂移', d.anomalyType === ANOMALY.LIGHT, d);
  assert('用例3 窗口期-handle=窗口期保护', d.handleResult === HANDLE.WINDOW, d);
  assert('用例3 窗口期-protectWindowFlag=true', d.protectWindowFlag === true, d);
  assert('用例3 窗口期-零回写(repairs=0)', d.repairs.length === 0, d.repairs);
})();

// ---- 用例 4：重度冲突（多字段语义矛盾，窗口外）→ 不修复 + 生成告警 ----
(() => {
  const d = evaluate({
    // nativeLanguage=zh 但 defaultExplanationLanguage=ja，语义矛盾
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'ja', updatedAt: OLD },
    primaryLearning: { languageCode: 'ja', updatedAt: OLD },
    now: NOW,
  });
  assert('用例4 重度冲突-anomalyType', d.anomalyType === ANOMALY.SEVERE, d);
  assert('用例4 重度冲突-handle=待人工介入', d.handleResult === HANDLE.MANUAL, d);
  assert('用例4 重度冲突-零自动修复', d.repairs.length === 0, d.repairs);
  assert('用例4 重度冲突-生成告警', d.alert !== null, d);
  assert('用例4 重度冲突-告警含冲突字段', d.alert && d.alert.conflictFields.length > 0, d.alert);
})();

// ---- 用例 5：重度冲突 + 保护窗口期内 → 不修复、不告警、仅记录 ----
(() => {
  const d = evaluate({
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'ja', updatedAt: RECENT },
    primaryLearning: { languageCode: 'ja', updatedAt: RECENT },
    now: NOW,
  });
  assert('用例5 冲突+窗口-anomalyType=重度冲突', d.anomalyType === ANOMALY.SEVERE, d);
  assert('用例5 冲突+窗口-handle=窗口期保护', d.handleResult === HANDLE.WINDOW, d);
  assert('用例5 冲突+窗口-窗口内不生成告警', d.alert === null, d);
  assert('用例5 冲突+窗口-零回写', d.repairs.length === 0, d.repairs);
})();

// ---- 用例 6：窗口边界（恰好 1 小时前 = 窗口外）----
(() => {
  const edge = new Date(NOW.getTime() - PROTECT_WINDOW_MS); // 恰好 1h
  const d = evaluate({
    pref: { nativeLanguage: 'zh-CN', defaultExplanationLanguage: 'chinese', updatedAt: edge },
    primaryLearning: { languageCode: 'ja', updatedAt: edge },
    now: NOW,
  });
  assert('用例6 边界-恰好1h视为窗口外(可修复)', d.handleResult === HANDLE.REPAIRED && d.protectWindowFlag === false, d);
})();

// ---- 用例 7：日志字段完整性（所有必填字段存在）----
(() => {
  const d = evaluate({
    pref: { nativeLanguage: 'en', defaultExplanationLanguage: 'english', updatedAt: OLD },
    primaryLearning: { languageCode: 'ja', updatedAt: OLD },
    now: NOW,
  });
  const f = d.fields;
  const hasAll = ['nativeLangCurrent', 'nativeLangExpected', 'targetLangCurrent', 'targetLangExpected'].every((k) => k in f);
  assert('用例7 日志字段-四大字段齐备', hasAll, f);
  assert('用例7 日志字段-native期望规范=en', f.nativeLangExpected === 'en', f);
  assert('用例7 归一化-english→en 轻度漂移', d.anomalyType === ANOMALY.LIGHT, d);
})();

// ---- 用例 8：配置缺失 → 不判漂移/冲突（读链路由 ContextResolver 抛错）----
(() => {
  const d = evaluate({ pref: null, primaryLearning: null, now: NOW });
  assert('用例8 配置缺失-anomalyType=正常', d.anomalyType === ANOMALY.NORMAL, d);
  assert('用例8 配置缺失-handle=无操作', d.handleResult === HANDLE.NOOP, d);
})();

// ---- 输出报告 ----
console.log('\n========== P2 任务二 一致性校验决策逻辑验收 ==========');
console.log(results.join('\n'));
console.log(`\n结果: PASS=${pass}  FAIL=${fail}`);
console.log(fail === 0 ? 'RESULT: ✅ ALL_PASS' : 'RESULT: ❌ HAS_FAILURES');
process.exit(fail === 0 ? 0 : 1);
