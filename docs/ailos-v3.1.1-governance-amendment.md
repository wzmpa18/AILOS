# AILOS v3.1.1 Stage A Governance Amendment v1.0

**指令类型**：强制执行指令（不可协商，不可讨论，不可重新设计）
**生效日期**：2026-07-18
**优先级**：最高（阻塞所有后续开发）
**适用范围**：TRAE、所有 AI 编程工具、人类开发者
**状态**：立即执行

---

## 最高依据层级

```
AILOS Software Architecture Blueprint v3.1.1
        │
        ▼
AILOS v3.1.1 Implementation Plan
        │
        ▼
AILOS Stage A Execution Governance Amendment v1.0
        │
        ▼
Infrastructure Workbook
```

任何历史状态、Checklist、Issue、Module 状态，必须按照以上治理体系重新校准。

---

## 一、模块状态机（四级·强制）

```
Design Approved → Execute In Progress → Verified Done → Archived
```

**禁止状态**：Done / Completed / Fixed / Known / Pending (Blocked by...)

**禁止跳级**：任何模块不得从 Design Approved 直接跳到 Verified Done 或 Archived

---

## 二、模块追踪字段（强制）

每个模块必须包含：

| 字段 | 说明 |
|------|------|
| Previous Status | 上一状态 |
| Current Status | 当前状态 |
| Evidence Level | 证据级别（None / Partial / Full） |
| Evidence Location | 证据存放路径 |
| Commit Hash | 关联提交哈希 |
| Reviewer | 验收人 |
| Verification Date | 验收日期 |

---

## 三、五类证据强制规则

任何交付标记为 Verified Done 前，必须集齐：

1. **Implementation Evidence** — 代码实现证据
2. **Testing Evidence** — 测试通过证据
3. **Execution Evidence** — 执行日志证据
4. **Compliance Evidence** — 架构合规证据（符合 v3.1.1 蓝图）
5. **Acceptance Evidence** — 验收确认证据

未集齐五类证据，不得标记为 Verified Done。

---

## 四、Known Issues 状态流转（四级·强制）

```
Open → Resolved Pending Verify → Verified Done → Closed
```

禁止 Open → Fixed 直接跳转。

---

## 五、AI 前置架构闸门（Pre-Development Gate）

所有 AI 工具生成代码前，必须输出：

```
Architecture Check:
1. Layer: Architecture / Runtime / Capability / Domain
2. Existing Capability: 是否已有能力可以复用？
3. Runtime Path: 是否遵循 Intent → Goal → Mission → Planner → Workflow → Capability → AI
4. AI Gateway: 是否经过统一 AI Gateway？
5. State Impact: 是否影响 State Manager / Twin / Memory？
6. Database Impact: 是否新增数据模型？
7. Architecture Risk: Low / Medium / High
```

强制要求：架构自检结果必须写入 Commit Message，格式为 `arch-check: layer=xxx, gateway=true, risk=xxx`。

---

## 六、禁止 AI 自行扩大范围

| 禁止项 | 原因 |
|--------|------|
| 新增业务功能 | 需等待 Runtime 底座形成 |
| 新增 Agent | 需等待 Runtime 底座形成 |
| 新增 Domain | 需等待 Runtime 底座形成 |
| 新增 Runtime Manager | 统一在 Phase 2 阶段完成 |
| 新增数据库表 | 需经过 Data Model Review |
| 重新设计 Runtime | 架构已冻结 |
| 修改 Blueprint 核心抽象 | 架构已冻结 |

仅允许：状态修正、文档治理、执行准备、证据体系完善。

---

## 七、Module 2 Checkpoint 执行顺序（冻结）

```
Checkpoint 1: Inventory Execute
       │
       ▼
Checkpoint 2: Confirm
       │
       ▼
Checkpoint 3: Backup
       │
       ▼
Checkpoint 4: Cleanup
       │
       ▼
Checkpoint 5: Initialize
       │
       ▼
Checkpoint 6: Verify
       │
       ▼
Module 2: Verified Done
```

禁止跳级。每完成一个 Checkpoint，必须同步更新：Workbook、Execution Log、Evidence Record、Module Status。

---

## 审批确认

| 角色 | 签字 | 日期 |
|------|------|------|
| 总工程师 | ✅ | 2026-07-18 |
| TRAE | ✅ | 2026-07-18 |
| AI Development Governance | ✅ | 2026-07-18 |

**本指令即日生效。TRAE 必须立即执行，不得讨论、不得重新设计、不得自行扩大范围。**
