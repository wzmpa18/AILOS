# P2 任务二 部署与验收 Runbook（按修正后 10 步强制指令）

> 适用环境：可触达生产服务器的终端（本工作区无法稳定连接生产，故部署动作在此环境外执行）。
> 生产服务器：项目根 `/www/xuewaiyu-backend`；Prisma 环境变量在 `.env.production`（pm2 注入 `DATABASE_URL`）。
> 铁律（问题1/问题4）：**禁止 `prisma db push`**；迁移走 `migrate deploy`；变更前必须全量备份。

---

## Step 2 预发布/Staging 迁移验证
无独立 staging 时，用 `--create-only` 生成并核对迁移，确认 SQL 与目标库一致：
```bash
cd /www/xuewaiyu-backend
bash -c 'set -a; source .env.production; set +a; npx prisma migrate deploy --create-only'  # 仅校验，不落库
# 或本地开发库：npx prisma migrate dev --name add_language_consistency_tables （仅开发库）
```
预期：两张表 `LanguageConsistencyLog` / `LanguageConsistencyAlert` 的 CREATE TABLE + 索引 SQL 正确，无冲突报错。

## Step 3 生产数据库全量备份（强制前置）
```bash
cd /www/xuewaiyu-backend
mkdir -p /www/backups
bash -c 'set -a; source .env.production; set +a; pg_dump "$DATABASE_URL"' > /www/backups/pre_p2t2_$(date +%s).sql
ls -lh /www/backups/pre_p2t2_*.sql   # 确认备份文件生成，记录路径=回滚恢复点
```
记录：备份时间、操作人、文件路径。异常时 `psql "$DATABASE_URL" < /www/backups/pre_p2t2_*.sql` 回滚。

## Step 4 生产 Schema 迁移（migrate deploy，禁止 db push）
```bash
cd /www/xuewaiyu-backend
bash -c 'set -a; source .env.production; set +a; npx prisma migrate deploy'
bash -c 'set -a; source .env.production; set +a; npx prisma generate'   # 确保 client 含新表
```
预期：输出 `2 migrations found / ... applied`，两张新表创建成功。

## Step 5 服务重启与基础校验
```bash
pm2 list                      # 确认进程名（如 xuewaiyu-backend）
pm2 restart <app>             # 或 pm2 restart all
pm2 logs <app> --lines 50     # 确认启动日志含 "[语言一致性巡检] cron 已注册" 且无 500
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health   # 基础健康检查 200
```

## Step 6 外网预览地址
nginx 已指向 3000（按历史部署），外网地址为：
- `http://<公网IP或域名>:3000/`（前端静态页）
- 管理后台：`http://<公网IP或域名>:3000/xuewaiyu/admin/...`（任务二新增接口）
- 纯 API 验收见 Step 7。

---

## Step 7 线上回归（5 项硬性用例 R-01~R-05）
先取得普通用户 token 与管理员 token（管理员须将某 user_id 写入 env `ADMIN_USER_IDS` 或 SystemConfig `admin.user_ids`）。
```bash
# 环境变量（服务器端）
export ADMIN_USER_IDS="<管理员user_id>"   # 或写入 SystemConfig admin.user_ids
```

### R-01 普通用户访问管理员接口 → 期望 403 ADMIN_REQUIRED
```bash
curl -s -w "\nHTTP=%{http_code}\n" -H "Authorization: Bearer <普通用户TOKEN>" \
  http://127.0.0.1:3000/api/admin/language-consistency
# 预期：HTTP=403，body 含 "ADMIN_REQUIRED"
```

### R-02 管理员调用一致性校验接口 → 期望 200 字段完整
```bash
curl -s -w "\nHTTP=%{http_code}\n" -H "Authorization: Bearer <管理员TOKEN>" \
  "http://127.0.0.1:3000/api/admin/language-consistency?dryRun=1" | head -c 2000
# 预期：HTTP=200，返回 summary + results，含 userId/anomalyType/handleResult 等字段
```

### R-03 校验日志持久化 → 期望日志表/文件有完整记录
```bash
curl -s -H "Authorization: Bearer <管理员TOKEN>" \
  "http://127.0.0.1:3000/api/admin/language-consistency" > /tmp/r03_out.json
# 同时查库确认落盘：
bash -c 'set -a; source .env.production; set +a; psql "$DATABASE_URL" -c "SELECT count(*) FROM \"LanguageConsistencyLog\";"'
# 预期：count>0；文件兜底在 ./data/language_consistency_log.jsonl（无 DB 时）
```

### R-04 定时任务正常注册 → 期望启动日志可见 cron 装配
```bash
pm2 logs <app> --lines 100 | grep -i "语言一致性巡检"
# 预期：输出 "[语言一致性巡检] cron 已注册 每日 03:00"
```

### R-05 轻度漂移自动修复逻辑 → 期望识别+归一化+留痕
构造测试用户：在 `user_language_preference` 写入 `native_lang='chinese'`（非规范 `zh-CN`），
`user_learning_language` 写入 `learning_lang='Japanese'`（非规范 `ja`），`updated_at` 置为 2 小时前（避开窗口期）：
```bash
bash -c 'set -a; source .env.production; set +a; psql "$DATABASE_URL" -c "UPDATE \"userLanguagePreference\" SET \"nativeLang\"='\''chinese'\'' ,\"updatedAt\"=now()-interval '\''2 hours'\'' WHERE \"userId\"='\''<TEST_USER_ID>'\'';"'
bash -c 'set -a; source .env.production; set +a; psql "$DATABASE_URL" -c "UPDATE \"userLearningLanguage\" SET \"learningLang\"='\''Japanese'\'' WHERE \"userId\"='\''<TEST_USER_ID>'\'' AND \"isPrimary\"=true;"'
curl -s -H "Authorization: Bearer <管理员TOKEN>" \
  "http://127.0.0.1:3000/api/admin/language-consistency?userId=<TEST_USER_ID>"
# 预期：anomalyType=轻度漂移，handleResult=已修复；复查库该用户字段已归一化为 zh-CN / ja
```

---

## Step 8 问题闭环
- P0 级阻断：立即修复并复测，未闭环不得解锁 Stage 11。
- P1 级：记入总账账簿待迭代，不阻断。

## Step 9 全量账簿归档
将以下同步至总账账簿「六·附 待处理告警清单」与 6.2 节：
- 部署操作日志（migrate deploy 输出、pm2 重启日志）
- 迁移文件编号：`20260726000000_add_language_consistency_tables`
- 外网预览地址
- 完整回归测试报告（R-01~R-05 表格，每项附证据）
- 告警功能验证截图（重度冲突触发 → P2_ALERT 入账）

## Step 10 解锁 Stage 11
P2 任务一/二/三 全部标记 FROZEN 后启动（任务三轻量全链路回归另见执行）。
