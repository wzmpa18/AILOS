# AILOS 移交说明书 v3.2.0

> **文档性质**: v3.2.0 正式封版移交说明书
> **版本**: v3.2.0-release
> **封版日期**: 2026-08-07
> **最终Git哈希**: e342f9f
> **适用对象**: 运维团队、后续开发者、项目管理人员

---

## 一、版本概述

v3.2.0 为「社交板块升级」版本，在 v3.1.0 基线上新增「站内优质动态 + 站外外语资讯聚合」双模块。核心交付：

1. **站内动态升级** — SocialTimeline 模型新增5字段（tag/isQuality/qualityMarkedBy/qualityMarkedAt/favoriteCount），优质推荐排序（isQuality→likeCount→favoriteCount→commentCount→createdAt），标签筛选体系（experience/study_abroad/exam_prep/find_partner），加精标识机制
2. **站外资讯聚合** — 4个独立数据表（NewsSource/NewsArticle/NewsReport/NewsAuditLog），三层去广告过滤（关键词规则+AI辅助+白名单），定时增量抓取（cron 06:00/18:00），审核闭环（pending→approved/rejected），举报处理，审计日志全量记录
3. **后台资讯管理** — 来源管理（新增/删除/拉黑/恢复），内容审核（approve/reject），一键下架，举报处理，全局AI开关（默认关闭），手动抓取，审计日志查看

---

## 二、Git 基线信息

| 项 | 值 |
|----|-----|
| 仓库 | TRAE 平台本地仓库 |
| 分支 | main |
| 最终封版哈希 | e342f9f |
| 版本标签 | v3.2.0-release |
| 初始功能提交 | 8a88357 — v3.2.0社交板块升级 |
| 整改提交 | 91c18ba — v3.2.0终局审计6项整改 |
| 部署同步提交 | e342f9f — 前端文件同步至xuewaiyu部署目录 |

### 提交历史

```
e342f9f fix(deploy): 同步v3.2.0前端文件至xuewaiyu部署目录
91c18ba fix(audit): v3.2.0终局审计6项整改
6f17d8b docs: 回填v3.2.0 Git哈希至终验报告+MASTER_LEDGER追加PRJ-V32-001
8a88357 v3.2.0: 社交板块升级 — 站内优质动态+站外外语资讯双模块落地
90bc37a v3.1.0-release: 环境搭建+依赖初始化+冗余清理
```

---

## 三、文件清单

### 3.1 后端新增文件

| # | 文件路径 | 说明 |
|---|---------|------|
| 1 | `src/services/newsFilterService.js` | 三层去广告过滤+敏感词过滤+全局AI开关 |
| 2 | `src/services/newsAggregatorService.js` | 抓取聚合+去重+入库+退避重试 |
| 3 | `src/services/newsService.js` | 前台查询展示（仅approved） |
| 4 | `src/server/routes/news.js` | 公开路由：列表/详情/举报 |
| 5 | `src/server/routes/adminNews.js` | 管理路由：来源/审核/下架/拉黑/AI开关/抓取/日志 |
| 6 | `src/jobs/newsCrawlJob.js` | 定时抓取任务（cron 06:00/18:00） |

### 3.2 后端增量文件

| # | 文件路径 | 变更 |
|---|---------|------|
| 7 | `prisma/schema.prisma` | 新增4模型+SocialTimeline新增5字段+NewsAuditLog.operatorId允许null |
| 8 | `src/server/routes/socialTimeline.js` | 优质推荐排序+标签筛选 |
| 9 | `src/server/routes/index.js` | 挂载news与adminNews路由 |
| 10 | `src/server/index.js` | 启动时注册newsCrawlJob |

### 3.3 前端文件

| # | 文件路径 | 说明 |
|---|---------|------|
| 11 | `public/xuewaiyu/community-trend.html` | 双Tab页面（站内动态+站外资讯） |
| 12 | `public/xuewaiyu/admin-news.html` | 后台资讯管理页面（5Tab+AI开关） |
| 13 | `public/xuewaiyu/terms.html` | 用户协议（新增资讯聚合免责条款） |

### 3.4 配置文件

| # | 文件路径 | 变更 |
|---|---------|------|
| 14 | `.env.example` | 新增NEWS_CRAWL_CRON/NEWS_AI_ENABLED/NEWS_CRAWL_JOB_DISABLED |

### 3.5 文档文件

| # | 文件路径 | 说明 |
|---|---------|------|
| 15 | `docs/AILOS_双宪法_v3.2.0_终版.md` | 双宪法合并终版（v2.3.0+v3.2.0增量） |
| 16 | `docs/AILOS_架构蓝图_v3.2.0_终版.md` | 架构蓝图合并终版（v3.0.0+v3.2.0增量） |
| 17 | `docs/终验审计报告v3.2.0.md` | 终验审计报告（含13项红线+6项整改） |
| 18 | `docs/AILOS_移交说明书_v3.2.0.md` | 本文档 |

---

## 四、数据表清单

| # | 表名 | 类型 | 说明 |
|---|------|------|------|
| 1 | NewsSource | 新增 | 资讯来源（受控白名单管理） |
| 2 | NewsArticle | 新增 | 资讯文章（聚合卡片） |
| 3 | NewsReport | 新增 | 用户举报 |
| 4 | NewsAuditLog | 新增 | 审计日志（全量操作记录） |
| 5 | SocialTimeline | 增量 | 新增tag/isQuality/qualityMarkedBy/qualityMarkedAt/favoriteCount字段 |

### 关键字段说明

**NewsArticle.status 状态机**:
```
pending → approved（人工审核通过，前台可见）
pending → rejected（人工审核驳回）
approved → taken_down（管理员下架/举报命中）
```

**NewsSource.status 状态机**:
```
active → blocked（拉黑，停止抓取+批量下架）
blocked → active（超级管理员恢复，需二次确认）
```

---

## 五、API 路由清单

### 5.1 公开路由（/api/v1/news）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/v1/news/list | 公开 | 资讯列表（仅approved，分页） |
| GET | /api/v1/news/detail/:id | 公开 | 资讯详情 |
| POST | /api/v1/news/report | 用户 | 提交举报 |

### 5.2 管理路由（/api/admin/news）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/admin/news/stats | 管理员 | 概览统计 |
| GET | /api/admin/news/sources | 管理员 | 来源列表 |
| POST | /api/admin/news/sources | 管理员 | 新增来源 |
| PUT | /api/admin/news/sources/:id | 管理员 | 更新来源 |
| POST | /api/admin/news/sources/:id/block | 管理员 | 拉黑来源 |
| POST | /api/admin/news/sources/:id/unblock | 管理员 | 解除拉黑 |
| GET | /api/admin/news/articles | 管理员 | 文章列表（含pending） |
| POST | /api/admin/news/articles/:id/audit | 管理员 | 审核（approve/reject） |
| POST | /api/admin/news/articles/:id/takedown | 管理员 | 一键下架 |
| GET | /api/admin/news/reports | 管理员 | 举报列表 |
| POST | /api/admin/news/reports/:id/handle | 管理员 | 处理举报 |
| GET | /api/admin/news/ai-status | 管理员 | AI开关状态 |
| POST | /api/admin/news/ai-toggle | 管理员 | 切换AI开关 |
| POST | /api/admin/news/crawl-now | 管理员 | 手动抓取 |
| GET | /api/admin/news/logs | 管理员 | 审计日志 |

### 5.3 社交动态路由（/api/v1/social-timeline）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | /api/v1/social-timeline | 公开 | 动态列表（优质推荐排序+标签筛选） |

---

## 六、部署指南

### 6.1 线上部署步骤

在腾讯云轻量云控制台执行：

```bash
cd /www/xuewaiyu-backend
bash deploy.sh
```

部署脚本自动完成：
1. 三件套备份（数据库+前端+后端代码）
2. git pull 同步最新代码（含版本一致性校验）
3. 语法全量检查（shell + JS）
4. npm install 依赖安装
5. prisma db push 数据库结构同步
6. vocabulary seed 数据导入
7. 存量数据兼容性补全（status IS NULL → active）
8. nginx 配置下发+语法校验
9. rsync 前端同步至 /www/xuewaiyu
10. PM2 服务重启
11. 双端冒烟测试（WEB 443 + APP 8080）

### 6.2 环境变量配置

在 `.env.production` 中配置：

```env
# 资讯聚合模块
NEWS_CRAWL_CRON=0 6,18 * * *
NEWS_AI_ENABLED=false
NEWS_CRAWL_JOB_DISABLED=0
```

### 6.3 部署后验证

| 验证项 | URL | 预期 |
|--------|-----|------|
| 首页 | https://yandao.vip/xuewaiyu/home | HTTP 200 |
| 社交动态页 | https://yandao.vip/xuewaiyu/community-trend | HTTP 200，双Tab可见 |
| 后台管理 | https://yandao.vip/xuewaiyu/admin-news | HTTP 200，需管理员登录 |
| 资讯列表API | https://yandao.vip/api/v1/news/list | JSON 200 |
| 健康检查 | https://yandao.vip/api/health | JSON 200 |

---

## 七、冻结层说明

以下为一级冻结层，禁止任何形式的修改：

| 冻结项 | 路径 | 说明 |
|--------|------|------|
| ContentBrain调度核心 | `src/brain/` | AI调度统一收口层 |
| 既有数据表字段 | `prisma/schema.prisma` 既有字段 | 仅允许新增字段，禁止删除/修改 |
| 部署脚本核心逻辑 | `deploy.sh` | 五步部署+四端校验+回滚机制 |
| AI调用链 | BrainFacade→aiService→adapters | 禁止业务代码直连大模型 |

---

## 八、下一版本迭代建议

### v3.3.0 规划项

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P1 | 站内动态评论功能 | SocialTimeline评论链路完整实现 |
| P1 | 站内动态关注功能 | 用户关注/粉丝体系 |
| P2 | AI摘要增强 | 开启AI后自动生成内容摘要 |
| P2 | 资讯分类打标自动化 | AI辅助分类标签 |
| P3 | 来源健康度监控 | 来源产出质量评分 |
| P3 | 资讯推送通知 | 用户订阅来源后新内容通知 |

---

## 九、风险提示

1. **数据库迁移**：首次部署需执行 `npx prisma db push`，新增4张表，不影响存量数据
2. **AI开关**：默认关闭（NEWS_AI_ENABLED=false），开启后会产生AI调用费用
3. **抓取频次**：默认每日06:00/18:00各执行一次，可通过 NEWS_CRAWL_CRON 调整
4. **版权合规**：站外资讯仅展示标题+摘要+来源+跳转链接，禁止全文转载
5. **审计日志**：NewsAuditLog 保留期≥180天，禁止物理删除

---

## 十、联系人

| 角色 | 职责 |
|------|------|
| 总工程师 | 架构决策、冻结层解冻审批 |
| 运维团队 | 线上部署、监控、故障响应 |
| 开发团队 | 功能迭代、Bug修复 |
| 监理端 | 合规审计、版本验收 |

---

> **v3.2.0 正式封版移交。请运维团队按部署指南执行线上部署，部署完成后进行全量功能验证。**
