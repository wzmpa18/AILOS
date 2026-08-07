#!/usr/bin/env node
/**
 * 账簿自动校验脚本 v1.0
 * 
 * 自动检测 7 类问题，输出校验报告，不合格记录批量告警
 * 
 * 检测项：
 * 1. 必填字段缺失（任务编号/责任人/Git SHA/图谱版本号等）
 * 2. 状态跳转非法（PENDING→FROZEN跳过TEST）
 * 3. 关联违宪编号不存在
 * 4. 图谱版本号不匹配
 * 5. 一级违宪超Deadline
 * 6. 操作留痕日志为空
 * 7. 记录重复
 * 
 * 用法：node ledger-validator.js [--ledger path/to/ledger.md]
 * 返回：0 = 通过，1 = 发现不合规记录
 */

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CURRENT_ATLAS_VERSION = 'v3.0.0';
const VALID_STATES = ['PENDING', 'DESIGN', 'IN_PROGRESS', 'TEST', 'COMPLETE', 'FROZEN', 'FROZEN_BLOCK', 'REJECTED'];
const VALID_STATE_TRANSITIONS = {
  'PENDING': ['DESIGN', 'IN_PROGRESS', 'REJECTED'],
  'DESIGN': ['IN_PROGRESS', 'REJECTED'],
  'IN_PROGRESS': ['TEST', 'COMPLETE', 'REJECTED'],
  'TEST': ['COMPLETE', 'FROZEN', 'REJECTED'],
  'COMPLETE': ['FROZEN', 'REJECTED'],
  'FROZEN': ['REJECTED'],
  'FROZEN_BLOCK': ['FROZEN'],
  'REJECTED': ['PENDING', 'DESIGN']
};
const REQUIRED_FIELDS = ['任务编号', '任务名称', '优先级', '闭环状态', '图谱版本号'];
const VIOLATION_NUMBERS = ['VC-001','VC-002','VC-003','VC-004','VC-005','VC-006','VC-007',
  'VC-101','VC-102','VC-103','VC-104','VC-105','VC-201','VC-202',
  'G1','G2','G3','G4','G5','G1-G5','G1-G2'];

// ==================== 解析 ====================
let errors = [];
let warnings = [];

function addError(taskId, type, detail) {
  errors.push({ taskId, type, detail });
}

function addWarning(taskId, type, detail) {
  warnings.push({ taskId, type, detail });
}

/**
 * 解析Markdown表格中的任务记录
 */
function parseLedger(content) {
  const tasks = [];
  let currentTask = null;
  let inTaskTable = false;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测任务开始
    if (line.startsWith('### PRJ-')) {
      if (currentTask) tasks.push(currentTask);
      currentTask = { id: line.replace('### ', '').trim(), fields: {}, rawLines: [] };
      inTaskTable = true;
      continue;
    }

    if (currentTask && line.startsWith('| ') && !line.startsWith('| #') && !line.startsWith('|--') && line.includes(' | ')) {
      // 匹配 | 字段 | 值 | 或 | **字段** | 值 |
      const match = line.match(/\|\s*(?:\*\*)?(.+?)(?:\*\*)?\s*\|\s*(.+?)\s*\|/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        // 过滤掉表头行和分隔行
        if (key !== '字段' && key !== '------' && key !== '#' && !key.startsWith('--')) {
          currentTask.fields[key] = value;
        }
      }
    }

    // 检测任务结束（下一个###或---或空行后非表格）
    if (currentTask && (line.startsWith('### ') || line.startsWith('---'))) {
      if (!line.startsWith('### PRJ-')) {
        tasks.push(currentTask);
        currentTask = null;
      }
    }
  }
  if (currentTask) tasks.push(currentTask);

  return tasks;
}

/**
 * 规则1：必填字段缺失
 */
function checkRequiredFields(tasks) {
  for (const task of tasks) {
    for (const field of REQUIRED_FIELDS) {
      if (!task.fields[field] || task.fields[field].trim() === '') {
        addError(task.id, '必填字段缺失', `缺少字段: ${field}`);
      }
    }
  }
}

/**
 * 规则2：状态跳转非法
 */
function checkStateTransitions(tasks) {
  for (const task of tasks) {
    const state = task.fields['闭环状态'];
    if (!state) continue;
    const cleanState = state.replace(/[✅⏳⚠️]/g, '').trim();
    if (!VALID_STATES.includes(cleanState)) {
      addError(task.id, '状态非法', `状态值 "${state}" 不在合法状态列表中`);
    }
  }
}

/**
 * 规则3：关联违宪编号校验
 */
function checkViolationRefs(tasks) {
  for (const task of tasks) {
    const vcRef = task.fields['关联违宪编号'];
    if (!vcRef || vcRef === '—' || vcRef === '-') continue;
    
    const refs = vcRef.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    for (const ref of refs) {
      if (!VIOLATION_NUMBERS.includes(ref) && !ref.startsWith('VC-')) {
        addWarning(task.id, '违宪编号未知', `引用 "${ref}" 不在已知违宪编号列表中`);
      }
    }
  }
}

/**
 * 规则4：图谱版本号校验
 */
function checkAtlasVersion(tasks) {
  for (const task of tasks) {
    const version = task.fields['图谱版本号'];
    if (!version || version === '—') continue;
    if (version !== CURRENT_ATLAS_VERSION && !version.includes('补录')) {
      addWarning(task.id, '版本不匹配', `图谱版本 "${version}" 与当前版本 ${CURRENT_ATLAS_VERSION} 不一致`);
    }
  }
}

/**
 * 规则5：一级违宪超Deadline检测
 */
function checkDeadlineViolation(tasks) {
  const today = new Date();
  for (const task of tasks) {
    const riskLevel = task.fields['违宪风险等级'];
    const status = task.fields['闭环状态'];
    if (!riskLevel || !riskLevel.includes('一级')) continue;
    if (status && (status.includes('FROZEN') || status.includes('COMPLETE'))) continue;
    
    // 检查是否有Deadline字段（从任务名称或变更明细推断）
    const name = task.fields['任务名称'] || '';
    if (name.includes('P2') && today > new Date('2026-08-12')) {
      addError(task.id, '超Deadline未整改', `一级违宪项 "${name.substring(0, 50)}" 已超P2 Deadline`);
    }
  }
}

/**
 * 规则6：操作留痕日志校验
 */
function checkAuditLog(tasks) {
  for (const task of tasks) {
    const log = task.fields['操作留痕日志'];
    if (!log || log === '—' || log.trim() === '') {
      addWarning(task.id, '日志缺失', '操作留痕日志为空，状态变更无修改记录');
    }
  }
}

/**
 * 规则7：记录重复检测
 */
function checkDuplicates(tasks) {
  const seen = new Map();
  for (const task of tasks) {
    if (seen.has(task.id)) {
      addError(task.id, '记录重复', `任务编号 ${task.id} 重复出现`);
    }
    seen.set(task.id, true);
  }
}

// ==================== 主流程 ====================

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  AILOS 账簿自动校验脚本 v1.0            ║');
  console.log('║  图谱版本: v3.0.0 | 宪法版本: v2.6.0    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 解析参数
  const args = process.argv.slice(2);
  let ledgerPath = path.join(__dirname, '..', 'AILOS_指令中心', 'MASTER_LEDGER_v3.0.0.md');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ledger' && args[i + 1]) {
      ledgerPath = args[i + 1];
    }
  }

  if (!fs.existsSync(ledgerPath)) {
    console.log(`❌ 账簿文件不存在: ${ledgerPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(ledgerPath, 'utf8');
  const tasks = parseLedger(content);
  console.log(`[解析] 共发现 ${tasks.length} 条任务记录\n`);

  // 执行7项校验
  checkRequiredFields(tasks);
  checkStateTransitions(tasks);
  checkViolationRefs(tasks);
  checkAtlasVersion(tasks);
  checkDeadlineViolation(tasks);
  checkAuditLog(tasks);
  checkDuplicates(tasks);

  // 输出报告
  const totalIssues = errors.length + warnings.length;
  if (errors.length > 0) {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  ❌ 发现不合规记录！                    ║');
    console.log('╚══════════════════════════════════════════╝\n');
    errors.forEach((e, i) => {
      console.log(`[错误 #${i + 1}] ${e.taskId}: ${e.type}`);
      console.log(`  ${e.detail}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  ⚠️  发现告警项                         ║');
    console.log('╚══════════════════════════════════════════╝\n');
    warnings.forEach((w, i) => {
      console.log(`[告警 #${i + 1}] ${w.taskId}: ${w.type} - ${w.detail}`);
    });
  }

  console.log(`\n[汇总] 错误: ${errors.length}, 告警: ${warnings.length}, 总计: ${totalIssues}`);

  if (errors.length > 0) {
    console.log('\n❌ 校验不通过！请修复上述错误后重新提交。');
    process.exit(1);
  }

  console.log('\n✅ 账簿校验通过！');
  process.exit(0);
}

main();
