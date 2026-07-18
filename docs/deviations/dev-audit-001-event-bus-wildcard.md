# Deviation Record DEV-AUDIT-001 — Event Bus 全局通配符缺口

## 基本信息
- **偏差编号**: DEV-AUDIT-001
- **关联模块**: Audit Log Manager v1.0
- **根源模块**: Event Bus v1.0（已冻结基线）
- **Severity**: Medium
- **Freeze Blocking**: No
- **责任归属**: Event Bus 模块
- **影响范围**: 全局事件兜底订阅能力
- **登记日期**: 2026-07-19

## 关联证据
- **VERIFY Report**: Phase 1 Task 5 Audit Log Manager VERIFY Report
- **Verification Baseline**: Commit c8532db
- **Design Baseline**: Commit 07a6f29
- **Finding Reference**: F1 — Event Bus isPatternMatch 未实现 * 全局通配符

## 问题描述
Event Bus v1.0 的 `isPatternMatch` 方法实现了 `xxx.*` 前缀通配匹配，但未实现纯 `*` 全局通配符匹配逻辑。导致 Audit Log Manager 声明的 `@OnEvent('*')` 兜底订阅当前不生效。

## 复现证据
- **输入**: `EventBus.publish("system.startup")` / `EventBus.publish("role.assigned")`
- **预期**: `AuditLogSubscriber.onAnyEvent` 触发
- **实际**: 未触发
- **根因定位**: `memory-adapter.ts` 匹配逻辑未覆盖 `WILDCARD = '*'` 常量场景

## 影响说明
1. `permission.*` 前缀订阅完全正常，核心权限审计能力不受影响
2. 非 permission 域事件暂无法通过全局通配自动兜底捕获
3. 不影响 Audit Log 核心功能、不阻塞冻结、不引入架构风险
4. 影响未来新增事件域的自动审计覆盖能力

## 处理决定
1. **本次仅建立 Deviation Record，不启动修复流程，不产生代码变更授权**
2. Audit Log v1.0 不做代码修改，保持当前实现基线
3. Event Bus v1.0 冻结期间不做修复，保持冻结基线纯净
4. 未来若需修复，必须另行提交 Event Bus 专项 ACR，经审批后方可执行
5. Event Bus 修复后，Audit Log 零代码变更即可自动生效