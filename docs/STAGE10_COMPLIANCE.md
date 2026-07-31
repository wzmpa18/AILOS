# Stage 10 合规承诺清单

## 读取时间
2026-07-31 18:00 CST

## 宪法基线
- 宪法文件：docs/AILOS_CONSTITUTION.md（325行）
- 代码基线：9ec9466（Stage 9 永久冻结基线）
- C.2.1四条铁律：已读取并确认

## 合规承诺

### 铁律1「双读双入」
- [x] 已读取最新版宪法全文（325行）
- [x] 已输出本合规承诺清单
- [x] 承诺：每轮交付完成后更新总账账簿第61章，包含6项必填字段

### 铁律2「验收标准零降格」
- [x] 承诺：所有验证场景100%按原路径实机执行
- [x] 承诺：支付全链路用真实API调用验证（非mock）
- [x] 承诺：代付机制用真实HTTP请求验证（非逻辑等效）
- [x] 承诺：前端页面用Playwright真实浏览器验证（非接口代替）
- [x] 承诺：事务回滚用真实失败场景验证（非代码审查）

### 铁律3「Git唯一真值」
- [x] 承诺：所有代码变更先提交仓库，再通过deploy.sh部署
- [x] 承诺：前端文件先入public/目录，再deploy.sh同步
- [x] 承诺：永久禁止直接修改/www/xuewaiyu/生产目录
- [x] 承诺：首次违宪扣减50%，二次清零，三次冻结权限

### 铁律4「证据链可追溯」
- [x] 承诺：所有验证留存三级证据（接口日志+页面截图+控制台快照）
- [x] 承诺：脚本自输出"PASS"不算有效证据
- [x] 承诺：P0场景附完整操作链路截图

### Schema变更铁律
- [x] 承诺：所有模型变更纯增量追加
- [x] 承诺：永不使用--accept-data-loss参数
- [x] 承诺：永不修改/删除已有字段
- [x] 已确认：User.membershipLevel/membershipExpiry已存在（不修改）
- [x] 已确认：MembershipOrder已存在（仅增量添加字段）

## 现有模型基线（不修改）
| 模型 | 位置 | 状态 |
|------|------|------|
| User | line 11 | 已有membershipLevel/membershipExpiry，不修改 |
| MembershipOrder | line 212 | 已有基础字段，仅增量添加代付字段 |
| TranslationBillingBalance | line 1039 | 翻译计费，不涉及 |
| TranslationPackageOrder | line 1054 | 翻译套餐，不涉及 |

## 新增模型计划（纯追加）
| 模型 | 用途 |
|------|------|
| MembershipPlan | 套餐配置表 |
| UserMembership | 用户会员表（独立于User字段，记录开通历史） |
| PaymentLog | 支付流水表 |
| MembershipRights | 权益配置表 |

## 签署
AI开发助手承诺严格遵守上述全部条款，违反任一条款自愿接受对应处罚。
