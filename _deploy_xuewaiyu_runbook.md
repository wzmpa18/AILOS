# 部署 Runbook —— 唯一正式线上路径 `https://yandao.vip/xuewaiyu/`

> 本 runbook 严格对齐「补充强制指令：部署路径红线与线上效果核验」。
> 执行环境：可 ssh 到生产服务器（项目根 `/www/xuewaiyu-backend`，Express+Prisma+PostgreSQL uuid）的终端。
> 本工作区（CodeBuddy）无 SSH 客户端、部署 webhook 未注册，**无法直接写服务器**，故部署动作须在可达服务器的环境执行本 runbook。

---

## 0. 红线速记（违反即回滚）
- 唯一地址：`https://yandao.vip/xuewaiyu/xxx.html`，**禁止**部署到根目录或其他子路径。
- 所有页面、静态资源、API 调用必须适配 `/xuewaiyu/` 前缀；禁止根路径引用导致 404。
- **禁止**用 localhost / 内网 IP 替代 `yandao.vip` 作为验收依据。
- 变更前**必须**全量备份数据库；**禁止** `prisma db push`，统一 `migrate deploy`。

---

## 1. 生产数据库全量备份（红线·前置，严禁省略）
```bash
# 在服务器上，载入生产 env 后备份
cd /www/xuewaiyu-backend
bash -c 'set -a; source .env.production; set +a; \
  pg_dump "$DATABASE_URL" > /backup/xuewaiyu_$(date +%Y%m%d_%H%M%S).sql'
# 记录：备份文件绝对路径 + 时间 + 操作人，写入总账账簿
```
回滚路径：若迁移/部署异常 → `psql "$DATABASE_URL" < /backup/<对应备份>.sql` 恢复。

---

## 2. 拉取代码 + 安装依赖
```bash
cd /www/xuewaiyu-backend
git fetch origin && git reset --hard origin/main   # 或 git pull，确保 = origin/main 最新（含 P0/P1/P2）
npm install --omit=dev                             # 若有 lock 用 ci
```

## 3. Schema 迁移（问题1 修正：禁止 db push）
```bash
bash -c 'set -a; source .env.production; set +a; \
  npx prisma migrate deploy'          # 落地 LanguageConsistencyLog / LanguageConsistencyAlert 两表
bash -c 'set -a; source .env.production; set +a; \
  npx prisma generate'
```

## 4. nginx 子路径配置（红线核心）
确保 `/xuewaiyu` 子目录下**既服务静态页、又把 API 代理到后端（剥离前缀）**。示例：
```nginx
server {
    listen 443 ssl;
    server_name yandao.vip;

    # 静态资源/页面：直接由 nginx 从项目根目录提供
    location /xuewaiyu/ {
        alias /www/xuewaiyu-backend/;          # 项目根即含 home.html/chat.html/assets/...
        index  home.html;
        try_files $uri $uri/ =404;
    }

    # API：剥离 /xuewaiyu 前缀转发到 Express(:3000)
    # 前端 common.js 垫片会把 /api/... 改写为 /xuewaiyu/api/...，此处再剥回 /api/...
    location /xuewaiyu/api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
> 若 Express 自身已用 `express.static` 托管 `/xuewaiyu`，则可简化为 `location /xuewaiyu/ { proxy_pass http://127.0.0.1:3000/; }`（后端同时托管静态与 API）。
> 关键点：**前端永远发 `/xuewaiyu/api/...`**（由 common.js 垫片保证），nginx 负责剥离前缀 → 后端收到 `/api/...`。

## 5. 重启服务 + 定时任务装配校验
```bash
pm2 restart xuewaiyu-backend        # 或对应 pm2 名
pm2 logs xuewaiyu-backend --lines 50
# 启动日志须可见：每日 03:00 languageConsistencyJob 注册成功（node-cron）
```

## 6. 线上效果核验（基于 `https://yandao.vip/xuewaiyu/`，禁止 localhost）
### 6.1 P1 清理核验（Language Context 残留检查）
```bash
curl -s https://yandao.vip/xuewaiyu/chat.html | grep -E "nativeLang|targetLang|Language Context"
# 期望：无任何输出（区块已移除）；若有输出 → 红线异常，立即回滚重同步
```
对 `home.html`/`login.html`/`learn.html`/`profile.html`/`language.html` 等同法核查语言切换控件残留。

### 6.2 双语言规则核验（AI 输出跟随个人中心）
- 登录后于个人中心设目标语 = 日语；
- 篡改前端请求 `lang=en` 参数调用 `/xuewaiyu/api/ai/chat` → 期望 AI 仍按**日语**回复（前端篡改无效，输出与个人中心一致）。

### 6.3 管理员接口核验（R-01 线上，普通用户 → 403）
```bash
TOKEN=$(curl -s -X POST https://yandao.vip/xuewaiyu/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"<普通用户账号>","password":"<密码>"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  https://yandao.vip/xuewaiyu/api/admin/language-consistency
# 期望：403（ADMIN_REQUIRED）。非管理员绝不返回 200/数据。
```
- 未带 token 访问同接口 → 期望 401（未认证）。
- 管理员 token 访问 → 期望 200，返回全量/单用户校验结果（R-02）。

### 6.4 校验日志持久化（R-03）
- 触发一次管理员全量校验后，查 `LanguageConsistencyLog` 表 / 兜底日志文件，应有完整记录（字段符合 `_p2_t2_test.js` 规范）。

### 6.5 定时任务注册（R-04）
- 见 5 步 pm2 日志中 `languageConsistencyJob` 装配成功行。

### 6.6 轻度漂移自动修复（R-05 线上）
- 构造语义一致仅格式差异的数据（如 `chinese` vs `Chinese`）→ 触发校验 → 期望自动归一化修复且留痕，无告警产生。

## 7. 错误处置（红线第四节）
若核验发现：部署路径错误 / 线上页面仍含旧代码（如 Language Context 残留）/ API 404 →
1. 立即回滚到上一次稳定版本（`git reset --hard <稳定commit>` + 必要时 DB 备份恢复）；
2. 重新按本 runbook 同步至 `/xuewaiyu/` 正确目录；
3. 全量复验 6.1~6.6 通过后方可继续；
4. 操作记录（含回滚原因、恢复路径）同步总账账簿。

## 8. 验收证据归档（问题5）
将以下逐项记入总账账簿（标准表格：编号/场景/预期/实际/证据路径/状态）：
- 备份文件清单与时间
- 迁移文件编号（`20260726000000_add_language_consistency_tables`）
- 线上预览地址 `https://yandao.vip/xuewaiyu/`
- R-01~R-05 线上 curl 报文截图/文本
- P1 清理核验 grep 空结果截图
- 双语规则核验对话截图
