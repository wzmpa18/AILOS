#!/bin/bash
# --- CRLF 自愈（必须紧贴文件头；实测依据见下）-------------------
# bash 是「边解析边执行」的：前面的简单语句会先跑，后面的语法错误才报。
# 但多行复合结构（if/函数）会被当作一个整体解析，一旦文件含 CRLF，
# 复合结构内部就会先崩。所以守卫只能用「单行语句」，不能用 if/fi 包裹。
# 实测：CRLF 文件里第一行 echo 能正常输出，而 if 块会直接 syntax error。
grep -q $'\r' "$0" && sed -i 's/\r$//' "$0" && echo "  ⚠ 已自动修正 CRLF 行尾，重新执行..." && exec bash "$0" "$@"
# --------------------------------------------------------------
# ============================================================
# AILOS 标准化一键部署脚本 v1.2（深度穿透审计加固版）
# 用法：bash deploy.sh
# 运维通道：腾讯云轻量云「执行命令」控制台
#
# v1.2 相对 v1.1 的加固（对应深度穿透审计漏洞 1/2/6/7）：
#   漏洞2 - 不再依赖 trap ERR 的侥幸兜底，关键步骤逐个显式判断退出码，
#           失败即显式调用 rollback；回滚含「前端+后端+pm2+二次健康校验」四步。
#   漏洞2 - 备份三件套：数据库全量快照 + 前端目录 + 后端代码 commit。
#   漏洞7 - db push 后强制补全存量数据 status IS NULL -> 'active'。
#   漏洞1 - 冒烟前先做基础设施连通性校验（PostgreSQL / Redis）。
#   漏洞1 - 核心接口冒烟扩容，非 200 直接判定部署失败并回滚。
#   漏洞6 - 部署前后记录并核验 commit SHA，确认生产版本真的等于远端最新版；
#           静态资源统一追加 ?v=<SHA> 版本号，强制浏览器刷新缓存。
# ============================================================

PROJECT_DIR="/www/xuewaiyu-backend"
WWW_DIR="/www/xuewaiyu"
BACKUP_DIR="/www/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BASE_URL="http://127.0.0.1:3000"
DEPLOY_OK=0   # 部署是否成功标志

# ------------------------------------------------------------
# 2026-08-03 双端发布强化（APP 403 事故整改）
#   事故根因：冒烟只测网页端（443），APP 站点（8080）nginx 漏配 /api 反代
#             与 index.html 缺失导致全站 403，长期未被发现。
#   整改：① nginx 配置纳入 git 真值源并由脚本下发 + 语法校验
#         ② 冒烟必须双端（WEB 443 + APP 8080）全绿才允许上线
#         ③ 新增 shell/JS 语法全量检查
# ------------------------------------------------------------
WEB_URL="https://127.0.0.1"        # 网页端（需带 Host 头）
WEB_HOST="yandao.vip"
APP_URL="http://127.0.0.1:8080"    # APP 端网关
NGINX_VHOST_DIR="/www/server/panel/vhost/nginx"
NGINX_CONF_SRC="$PROJECT_DIR/deploy/nginx"   # git 真值源
NGINX_BAK_DIR="$BACKUP_DIR/nginx_$TIMESTAMP"

# 记录部署前状态，供回滚使用
PRE_DEPLOY_WWW="$BACKUP_DIR/www_pre_$TIMESTAMP.tar.gz"
PRE_DEPLOY_CODE="$BACKUP_DIR/code_pre_$TIMESTAMP.tar.gz"
PRE_DEPLOY_DB="$BACKUP_DIR/xuewaiyu_$TIMESTAMP.dump"
PRE_DEPLOY_HEAD=""

# 双端探测：curl_web <path> / curl_app <path>，回显 HTTP 状态码
curl_web() { curl -sk -o /dev/null -w "%{http_code}" --max-time 10 -H "Host: $WEB_HOST" "$WEB_URL$1" 2>/dev/null || echo 000; }
curl_app() { curl -s  -o /dev/null -w "%{http_code}" --max-time 10 "$APP_URL$1" 2>/dev/null || echo 000; }

# ------------------------------------------------------------
# 统一失败处理：打印原因 -> 回滚 -> 退出
# 漏洞2 修复：不再指望 trap ERR 捕获管道/条件/函数内错误，
#            所有关键步骤显式调用 fail()，行为完全确定。
# ------------------------------------------------------------
fail() {
  echo ""
  echo "  ✗ 部署失败：$1"
  DEPLOY_OK=0
  rollback
  exit 1
}

# ------------------------------------------------------------
# 回滚：四步走（前端恢复 -> 后端回退 -> pm2 重启 -> 二次健康校验）
# 漏洞2 修复：回滚后必须再跑一次健康检查，确认服务真的恢复，
#            而不是「回滚完就当没事」。
# ------------------------------------------------------------
rollback() {
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║  ⚠ 部署未通过校验，触发自动回滚          ║"
  echo "╚══════════════════════════════════════════╝"

  # 0) 恢复 nginx 配置（若本次发布下发过配置）
  #    注意：备份目录中可能混入历史误下发的主配置，恢复前必须先剔除，
  #    否则「回滚」反而会把 nginx 再次弄坏（历史事故已发生过一次）。
  if [ -d "$NGINX_BAK_DIR" ]; then
    for bf in "$NGINX_BAK_DIR"/*.conf; do
      [ -e "$bf" ] || continue
      if grep -qE '^[[:space:]]*(worker_processes|events[[:space:]]*\{)' "$bf"; then
        mv -f "$bf" "$bf.disabled" 2>/dev/null \
          && echo "  ⚠ 备份中剔除主配置，避免回滚污染: $(basename "$bf")"
      fi
    done
  fi
  if [ -d "$NGINX_BAK_DIR" ] && [ -n "$(ls -A "$NGINX_BAK_DIR" 2>/dev/null)" ]; then
    cp -a "$NGINX_BAK_DIR"/*.conf "$NGINX_VHOST_DIR"/ 2>/dev/null || true
    if nginx -t >/dev/null 2>&1; then
      nginx -s reload >/dev/null 2>&1
      echo "  ✓ [0/4] nginx 配置已回滚至部署前版本并平滑重载"
    else
      echo "  ⚠ [0/4] nginx 配置回滚后语法校验未通过，请人工检查 $NGINX_BAK_DIR"
    fi
  fi

  # 1) 恢复前端静态资源
  if [ -f "$PRE_DEPLOY_WWW" ]; then
    rm -rf "$WWW_DIR"
    mkdir -p "$WWW_DIR"
    tar -xzf "$PRE_DEPLOY_WWW" -C / 2>/dev/null && echo "  ✓ [1/4] 前端已回滚至部署前快照" \
      || echo "  ⚠ [1/4] 前端快照解压失败，请人工检查 $PRE_DEPLOY_WWW"
  else
    echo "  ⚠ [1/4] 无前端快照可用（首次部署），跳过"
  fi

  # 2) 回退后端代码到部署前 commit
  if [ -n "$PRE_DEPLOY_HEAD" ]; then
    cd "$PROJECT_DIR" || echo "  ⚠ 无法进入 $PROJECT_DIR"
    git stash 2>/dev/null || true
    if git checkout "$PRE_DEPLOY_HEAD" 2>/dev/null; then
      [ -f .env.production ] && { set -a; source .env.production; set +a; }
      npx prisma generate 2>&1 | tail -2
      echo "  ✓ [2/4] 后端代码已回退至 $PRE_DEPLOY_HEAD"
    else
      echo "  ⚠ [2/4] 后端代码回退失败，请人工执行: git checkout $PRE_DEPLOY_HEAD"
    fi
  else
    echo "  ⚠ [2/4] 无部署前 commit 记录，跳过后端回退"
  fi

  # 3) 重启服务
  pm2 reload xuewaiyu-backend --update-env 2>/dev/null || pm2 restart xuewaiyu-backend 2>/dev/null || true
  echo "  ✓ [3/4] 服务已重启"

  # 4) 二次健康校验：确认回滚后服务真的活了
  local rb_hc=000
  for i in $(seq 1 20); do
    rb_hc=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$BASE_URL/api/health" 2>/dev/null || echo 000)
    [ "$rb_hc" = "200" ] && break
    sleep 1
  done
  if [ "$rb_hc" = "200" ]; then
    echo "  ✓ [4/4] 回滚后健康检查通过（HTTP 200），服务已恢复"
  else
    echo "  ✗ [4/4] 回滚后健康检查仍未通过（当前 $rb_hc）！服务处于异常状态，必须立即人工介入！"
    echo "      数据库备份: $PRE_DEPLOY_DB"
    echo "      前端快照:   $PRE_DEPLOY_WWW"
    echo "      后端快照:   $PRE_DEPLOY_CODE"
  fi
  echo "  ⚠ 回滚流程结束，备份位置: $BACKUP_DIR"
}

cd "$PROJECT_DIR" || { echo "✗ 项目目录不存在: $PROJECT_DIR"; exit 1; }
PRE_DEPLOY_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")

echo "╔══════════════════════════════════════════╗"
echo "║   AILOS 标准化部署 v1.2                 ║"
echo "║   时间: $(date '+%Y-%m-%d %H:%M:%S')         ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "[基线] 部署前生产代码版本: ${PRE_DEPLOY_HEAD:-<未知>}"

# ==================== 1. 三件套备份 ====================
echo ""
echo "[1/8] 备份数据库 + 前端 + 后端代码..."
mkdir -p "$BACKUP_DIR"
if [ -f .env.production ]; then
  set -a; source .env.production; set +a
fi

pg_dump -U postgres -F c -b -f "$PRE_DEPLOY_DB" xuewaiyu 2>&1 | tail -3
if [ -f "$PRE_DEPLOY_DB" ]; then
  echo "  ✓ 数据库备份: $PRE_DEPLOY_DB"
else
  echo "  ⚠ 数据库备份未生成，请确认 pg_dump 可用（继续部署但回滚将无 DB 快照）"
fi

tar -czf "$PRE_DEPLOY_WWW" -C / "www/xuewaiyu" 2>/dev/null \
  && echo "  ✓ 前端快照: $PRE_DEPLOY_WWW" \
  || echo "  ⚠ 前端快照创建失败（首次部署或目录异常），仅告警"

# 漏洞2 修复：后端代码目录也要备份（原脚本只备份前端）
tar -czf "$PRE_DEPLOY_CODE" -C "$PROJECT_DIR" --exclude=node_modules --exclude=.git . 2>/dev/null \
  && echo "  ✓ 后端代码快照: $PRE_DEPLOY_CODE" \
  || echo "  ⚠ 后端代码快照创建失败，仅告警"

# ==================== 2. 拉取最新代码 ====================
echo ""
echo "[2/8] 同步最新代码..."
git stash 2>/dev/null || true
git pull origin main 2>&1 | tail -3
if [ "${PIPESTATUS[0]}" != "0" ]; then
  # git pull 在管道里，用 PIPESTATUS 显式取退出码（trap ERR 抓不到管道失败）
  fail "git pull 失败，代码未更新"
fi
NEW_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
echo "  ✓ 代码已更新到: $(git log --oneline -1)"

# 漏洞6 修复：核验本地 HEAD 与远端 origin/main 完全一致，杜绝拉取失败静默降级
REMOTE_HEAD=$(git ls-remote origin main 2>/dev/null | awk '{print $1}')
if [ -n "$REMOTE_HEAD" ] && [ "$NEW_HEAD" != "$REMOTE_HEAD" ]; then
  fail "版本不一致：本地 $NEW_HEAD != 远端 $REMOTE_HEAD（疑似拉取失败）"
fi
echo "  ✓ 版本一致性校验通过: $NEW_HEAD"

# ==================== 2.5 语法全量检查（shell + JS）====================
# 双端发布强化③：部署操作前先做静态语法检查，提前暴露语法错误，
# 避免「拉取成功但代码有语法错 → pm2 启动即崩 → 全站 500」的哑弹部署。
echo ""
echo "[2.5/8] 语法全量检查（shell + JS）..."

# shell 语法检查：本脚本自身 + 仓库内其他 .sh
echo "  -- shell 语法检查 --"
SH_OK=1
for shf in deploy.sh $(find . -maxdepth 2 -name "*.sh" -not -path "./node_modules/*" 2>/dev/null); do
  [ -f "$shf" ] || continue
  if bash -n "$shf" >/dev/null 2>&1; then
    echo "  ✓ $shf"
  else
    echo "  ✗ $shf 存在语法错误："
    bash -n "$shf" 2>&1 | head -5
    SH_OK=0
  fi
done
[ "$SH_OK" -eq 0 ] && fail "shell 脚本存在语法错误，部署中止"

# JS 语法检查：仅检查新增/修改的路由与控制器（全量 node --check 过慢且会触发依赖加载）
echo "  -- JS 语法检查（路由/控制器）--"
JS_OK=1
for jsf in $(find . -maxdepth 3 \( -name "*.route.js" -o -name "*Controller.js" -o -name "*.service.js" \) -not -path "./node_modules/*" 2>/dev/null); do
  [ -f "$jsf" ] || continue
  if node --check "$jsf" >/dev/null 2>&1; then
    : # 通过不打印，避免刷屏
  else
    echo "  ✗ $jsf 存在语法错误："
    node --check "$jsf" 2>&1 | head -5
    JS_OK=0
  fi
done
if [ "$JS_OK" -eq 1 ]; then
  echo "  ✓ 路由/控制器 JS 语法检查通过"
else
  fail "JS 文件存在语法错误，部署中止"
fi

# ==================== 3. 依赖安装 ====================
echo ""
echo "[3/8] 安装依赖..."
npm install --omit=dev 2>&1 | tail -3
echo "  ✓ 依赖已安装"

# ==================== 4. 同步数据库结构 + 存量数据兼容 ====================
echo ""
echo "[4/8] 同步数据库结构..."
set -a; source .env.production; set +a
npx prisma db push --accept-data-loss 2>&1 | tail -5
if [ "${PIPESTATUS[0]}" != "0" ]; then
  fail "prisma db push 失败，数据库结构未同步"
fi
npx prisma generate 2>&1 | tail -3
if [ "${PIPESTATUS[0]}" != "0" ]; then
  fail "prisma generate 失败，Prisma Client 未更新"
fi

# ==================== 4a. VOCAB_SEED_STAGE: vocabulary seed (idempotent) ====================
# Vocabulary module needs real rows in vocabulary_words, otherwise
# /api/v1/practice/questions returns 404. Seed upserts by (language, word),
# so it is safe to run on every deploy.
echo ""
echo "[4a/8] Importing vocabulary seed data (idempotent)..."
if [ -f "prisma/seeds/vocabulary.seed.js" ]; then
  node prisma/seeds/vocabulary.seed.js 2>&1 | tail -3
  if [ "${PIPESTATUS[0]}" != "0" ]; then
    fail "vocabulary seed import failed; vocabulary module would be unusable"
  fi
  VOCAB_CNT=$(node prisma/seeds/vocabulary.count.js 2>/dev/null | tail -1)
  echo "  active vocabulary words: ${VOCAB_CNT:-0}"
  if [ "${VOCAB_CNT:-0}" -lt 200 ]; then
    fail "vocabulary size < 200 (got ${VOCAB_CNT:-0}); practice cannot serve questions"
  fi
  echo "  OK vocabulary seed ready"
else
  echo "  WARN prisma/seeds/vocabulary.seed.js missing, skip vocabulary seed"
fi
echo "  ✓ 数据库结构已同步"

# 漏洞7 修复：存量数据补全。
#   db push 新增带默认值的列时，存量行的取值依数据库/驱动实现而异，
#   不能假设一定回填。此处显式把 status IS NULL 的用户补为 'active'，
#   确保「存量用户不因 status 为 NULL 被误判为不可用」。
#   注：代码层已用 isUserUsable() 兼容 NULL，这里是数据层双保险。
echo ""
echo "[4b/8] 存量数据兼容性补全（status IS NULL -> 'active'）..."
BACKFILL=$(psql "$DATABASE_URL" -t -A -c \
  "UPDATE \"User\" SET status='active' WHERE status IS NULL; SELECT count(*) FROM \"User\" WHERE status IS NULL;" 2>&1)
if [ $? -eq 0 ]; then
  echo "  ✓ 存量补全完成，剩余 status IS NULL 的用户数: $(echo "$BACKFILL" | tail -1)"
else
  echo "  ⚠ 存量补全未执行成功（psql 不可用或列不存在）: $(echo "$BACKFILL" | tail -1)"
  echo "    代码层 isUserUsable() 已兼容 status 为 NULL，不阻断部署"
fi

# [4c/8] 冒烟专用「非管理员」账号（幂等）
#   权限门禁必须用真正的非管理员账号验证 403，否则断言无意义。
#   该账号仅用于部署冒烟，密码复用主冒烟账号哈希，不新增明文口令。
echo ""
echo "[4c/8] 确保冒烟非管理员账号存在（幂等）..."
node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const PHONE = process.env.SMOKE_NONADMIN_PHONE || "13900001234";
const SRC   = process.env.SMOKE_ADMIN_PHONE   || "13480010005";
(async () => {
  const exist = await p.user.findFirst({ where: { phone: PHONE } });
  if (exist) { console.log("  ✓ 冒烟非管理员账号已存在: " + exist.id); return; }
  const src = await p.user.findFirst({ where: { phone: SRC } });
  if (!src) { console.log("  ⚠ 源账号不存在，跳过创建"); return; }
  const u = await p.user.create({ data: {
    phone: PHONE,
    passwordHash: src.passwordHash,
    nickname: "smoke_nonadmin",
    isActive: true, isVerified: true, status: "active",
    uniqueId: "smokena" + Date.now()
  }});
  console.log("  ✓ 冒烟非管理员账号已创建: " + u.id);
})().catch(e => { console.log("  ⚠ 创建失败(不阻断建库): " + e.message); })
   .finally(() => p.$disconnect());
' 2>&1 | tail -3

# ==================== 4d. nginx 配置下发 + 语法校验（双端发布强化）====================
# 事故根因：APP 站点（8080）nginx 配置曾漏配 /api 反代与 index.html，导致全站 403，
#         且该配置游离在 git 真值源之外（手工改服务器），长期无人发现。
# 整改：nginx 配置纳入 git 真值源（deploy/nginx/），由本脚本统一下发 + 语法校验，
#       任一配置下发前先备份旧版（供回滚 0/4 使用）。
echo ""
echo "[4d/8] nginx 配置下发 + 语法校验..."

# 备份现有 nginx vhost 配置（供回滚使用）
mkdir -p "$NGINX_BAK_DIR"
if [ -d "$NGINX_VHOST_DIR" ]; then
  cp -a "$NGINX_VHOST_DIR"/*.conf "$NGINX_BAK_DIR"/ 2>/dev/null || true
  echo "  ✓ 已备份现有 nginx 配置到: $NGINX_BAK_DIR"
else
  echo "  ⚠ nginx vhost 目录不存在: $NGINX_VHOST_DIR（跳过备份与下发）"
fi

# 下发 git 真值源中的 nginx 配置
#
# 【事故防线】vhost 目录会被主配置以 include vhost/nginx/*.conf 全量包含，
# 因此只能存放 server{} 级别的站点配置。若把含 worker_processes / events{} / http{}
# 的「主配置」误下发进来，nginx -t 会直接 emerg 失败，整机 nginx 无法 reload。
# 历史事故：deploy/nginx/nginx.conf（主配置）被下发到 vhost，导致
#   nginx: [emerg] "worker_processes" directive is not allowed here
# 故此处按内容识别并跳过主配置，只下发真正的 vhost 站点配置。
if [ -d "$NGINX_CONF_SRC" ]; then
  for cf in "$NGINX_CONF_SRC"/*.conf; do
    [ -e "$cf" ] || continue
    fname=$(basename "$cf")

    # 主配置特征：顶层出现 worker_processes / events { / http {
    if grep -qE '^[[:space:]]*(worker_processes|events[[:space:]]*\{|http[[:space:]]*\{)' "$cf"; then
      echo "  ⏭ 跳过主配置（不可下发到 vhost）: $fname"
      continue
    fi

    # 必须包含 server{} 才算合法 vhost 配置
    if ! grep -qE '^[[:space:]]*server[[:space:]]*\{' "$cf"; then
      echo "  ⏭ 跳过非 vhost 配置（无 server 块）: $fname"
      continue
    fi

    cp -f "$cf" "$NGINX_VHOST_DIR/$fname" 2>/dev/null \
      && echo "  ✓ 已下发 nginx 配置: $fname" \
      || echo "  ⚠ 下发失败: $fname（检查 $NGINX_VHOST_DIR 写权限）"
  done

  # 清理：vhost 目录中若残留历史误下发的主配置，一并隔离，避免 nginx -t 永久失败
  for vf in "$NGINX_VHOST_DIR"/*.conf; do
    [ -e "$vf" ] || continue
    if grep -qE '^[[:space:]]*(worker_processes|events[[:space:]]*\{)' "$vf"; then
      mkdir -p "$NGINX_BAK_DIR/quarantine"
      mv -f "$vf" "$NGINX_BAK_DIR/quarantine/$(basename "$vf")" 2>/dev/null \
        && echo "  ✓ 已隔离 vhost 中残留的主配置: $(basename "$vf")"
    fi
  done
  # conf.d 子目录（如有）
  if [ -d "$NGINX_CONF_SRC/conf.d" ]; then
    mkdir -p "$NGINX_VHOST_DIR/conf.d"
    cp -af "$NGINX_CONF_SRC/conf.d"/* "$NGINX_VHOST_DIR/conf.d"/ 2>/dev/null || true
    echo "  ✓ 已下发 nginx conf.d 子目录配置"
  fi
else
  echo "  ⚠ nginx 配置真值源目录不存在: $NGINX_CONF_SRC（跳过下发）"
fi

# 语法校验：nginx -t 不通过则直接回滚（下发错误的配置比不下发还糟）
if command -v nginx >/dev/null 2>&1; then
  if nginx -t >/dev/null 2>&1; then
    echo "  ✓ nginx 语法校验通过"
  else
    echo "  ✗ nginx 语法校验失败，配置有误，触发回滚"
    nginx -t 2>&1 | tail -5
    fail "nginx 配置语法错误，已回滚至部署前版本"
  fi
else
  echo "  ⚠ nginx 命令不存在，跳过语法校验（由后续冒烟间接覆盖）"
fi

# ==================== 5. 全量覆盖静态资源（方案 A：public/xuewaiyu 为唯一真值源）====================
echo ""
echo "[5/8] 同步前端静态资源（方案 A 强制规则）..."
# 方案 A 刚性规则（违反任意一条直接判定部署作废）：
#   ① 唯一真值源 = public/xuewaiyu/，禁止再把 public/ 根级旧 HTML 同步到线上；
#   ② 公共资源 = public/assets/ 同步到 $WWW_DIR/assets/；
#   ③ 同步前先清空 $WWW_DIR 下残留的 public/ 子目录与旧根目录零散 HTML，
#      避免旧文件污染（保留运行时 uploads 目录）；
#   ④ 禁止制造多余 public/ 层级（如 $WWW_DIR/public/js）。
# 仓库根旧 HTML / 旧 assets 已标记为废弃遗留文件，本脚本绝不引用。

# ③ 清空残留：删除 $WWW_DIR/public 子目录（历史 rsync 遗留）与根级零散 HTML，
#    但不动运行时上传目录 $WWW_DIR/uploads（如有）。
if [ -d "$WWW_DIR/public" ]; then
  rm -rf "$WWW_DIR/public" && echo "  ✓ 已清理残留子目录 $WWW_DIR/public"
fi
# 删除根级零散 .html（这些本应由 public/xuewaiyu 提供，残留旧文件会污染线上）
for f in "$WWW_DIR"/*.html; do
  [ -e "$f" ] && rm -f "$f"
done
echo "  ✓ 已清理 $WWW_DIR 根级残留零散 HTML"

# ② 公共资源：public/assets/* -> $WWW_DIR/assets/
mkdir -p "$WWW_DIR/assets"
cp -rf public/assets/* "$WWW_DIR/assets/" 2>&1
if [ $? -ne 0 ]; then fail "公共资源同步失败（public/assets -> $WWW_DIR/assets）"; fi
echo "  ✓ 公共资源已同步: $WWW_DIR/assets/"

# ① 业务页面：public/xuewaiyu/* -> $WWW_DIR/（唯一真值源，直接覆盖）
cp -rf public/xuewaiyu/* "$WWW_DIR/" 2>&1
if [ $? -ne 0 ]; then fail "业务页面同步失败（public/xuewaiyu -> $WWW_DIR）"; fi
echo "  ✓ 业务页面已同步: $WWW_DIR/（来源 public/xuewaiyu，唯一真值源）"

# 漏洞6 修复：静态资源加版本号，强制浏览器刷新缓存。
#   只对本目录下 .html 注入 ?v=<短SHA>（public/xuewaiyu 已铺到根，无多余层级）。
SHORT_SHA=$(echo "$NEW_HEAD" | cut -c1-8)
if [ -n "$SHORT_SHA" ]; then
  find "$WWW_DIR" -maxdepth 1 -name "*.html" -type f -exec \
    sed -i -E "s|(assets/common\.js)(\?v=[A-Za-z0-9]+)?|\1?v=$SHORT_SHA|g" {} \; 2>/dev/null
  echo "  ✓ 静态资源版本号已更新: common.js?v=$SHORT_SHA（强制刷新缓存）"
fi

# 方案 A 部署门禁：核心资源 /www/xuewaiyu/assets/common.js 存在且大小正常（>20KB）
if [ ! -f "$WWW_DIR/assets/common.js" ]; then
  fail "部署门禁：assets/common.js 缺失，前端核心脚本未部署"
else
  SIZE=$(stat -c%s "$WWW_DIR/assets/common.js" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt 20480 ]; then
    fail "部署门禁：assets/common.js 大小异常（${SIZE} 字节 < 20KB），同步不完整"
  else
    echo "  ✓ 部署门禁：assets/common.js 存在且大小正常（${SIZE} 字节）"
  fi
fi
# 方案 A 部署门禁：默认头像文件必须存在（避免头像 404）
if [ ! -f "$WWW_DIR/assets/images/default_avatar.png" ]; then
  fail "部署门禁：默认头像 assets/images/default_avatar.png 缺失"
else
  echo "  ✓ 部署门禁：默认头像 assets/images/default_avatar.png 存在"
fi

# ==================== 6. 基础设施连通性校验 ====================
# 漏洞1 修复：不能只测 /api/health 就当基础设施没问题。
#   Redis 挂了 → 黑名单校验失效；PostgreSQL 挂了 → 所有业务接口崩。
#   这两项必须在重载前真实探活。
echo ""
echo "[6/8] 基础设施连通性校验..."

if command -v psql >/dev/null 2>&1; then
  if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "  ✓ PostgreSQL 连通（SELECT 1 成功）"
  else
    fail "PostgreSQL 不可连通，部署中止"
  fi
else
  echo "  ⚠ psql 不存在，跳过数据库直连校验（将由接口冒烟间接覆盖）"
fi

if command -v redis-cli >/dev/null 2>&1; then
  REDIS_PONG=$(redis-cli ping 2>/dev/null || echo "")
  if [ "$REDIS_PONG" = "PONG" ]; then
    echo "  ✓ Redis 连通（PING -> PONG）"
  else
    echo "  ⚠ Redis 未响应 PONG。注意：鉴权黑名单将 fail-open（已注销账号仍由 isActive 兜底拦截），但全设备下线会失效，请尽快修复 Redis"
  fi
else
  echo "  ⚠ redis-cli 不存在，跳过 Redis 探活"
fi

# 文件写入权限（反馈落盘依赖）
FEEDBACK_DIR="$PROJECT_DIR/data/feedback"
mkdir -p "$FEEDBACK_DIR" 2>/dev/null
if [ -w "$FEEDBACK_DIR" ]; then
  echo "  ✓ 反馈落盘目录可写: $FEEDBACK_DIR"
else
  echo "  ⚠ 反馈落盘目录不可写: $FEEDBACK_DIR（反馈提交会失败，请检查权限）"
fi

# ==================== 7. 平滑重载服务 ====================
echo ""
echo "[7/8] 重载后端服务..."
pm2 reload xuewaiyu-backend --update-env || fail "pm2 reload 失败"
sleep 3
pm2 list 2>/dev/null | grep xuewaiyu
echo "  ✓ 服务已重载"

# ==================== 8. 健康检查 + 冒烟验证 ====================
echo ""
echo "[8/8] 生产健康检查（最多等待 30 秒）..."

HC=000
for i in $(seq 1 30); do
  HC=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$BASE_URL/api/health" 2>/dev/null || echo 000)
  if [ "$HC" = "200" ]; then
    echo "  健康检查: HTTP 200（第 ${i}s 通过）"
    break
  fi
  echo "  健康检查未就绪（${i}s，当前 $HC），重试..."
  sleep 1
done
[ "$HC" != "200" ] && fail "30 秒内 /api/health 未返回 200"

# 核心页面（方案 A 刚性冒烟：任意一项失败立即回滚）
echo ""
echo "  -- 核心页面（方案 A 强制门禁）--"
# 宪法 1.5 + 方案 A 要求：game/practice/feedback/home 必须 200，
# 任一非 200 直接触发 rollback（原脚本只 echo 不 fail，会掩盖 404 故障）。
for page in home.html learn.html review.html profile.html membership.html \
            practice.html game.html feedback.html chat.html discover.html \
            translate.html vocabulary.html \
            community-friends.html community-messages.html community-trend.html; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/xuewaiyu/$page")
  echo "  /xuewaiyu/$page: HTTP $code"
  [ "$code" != "200" ] && fail "核心页面 /xuewaiyu/$page 返回 $code（期望 200）—— 前端部署不完整"
done

# 核心静态资源硬校验（四类门禁补全：页面HTML + 核心JS + 核心图片 + 关键接口）
# 任一不达标直接触发回滚，禁止「页面200但核心JS/图片全挂」的假通过。
echo ""
echo "  -- 核心静态资源（方案 A 强制门禁）--"
for asset in "xuewaiyu/assets/common.js" "xuewaiyu/assets/images/default_avatar.png"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/$asset")
  echo "  /$asset: HTTP $code"
  [ "$code" != "200" ] && fail "核心静态资源 /$asset 返回 $code（期望 200）—— 前端核心脚本/图片不可用"
done
echo "  ✓ 核心静态资源（common.js / default_avatar.png）通过"

# 方案 A 头像路径合规扫描：所有线上 HTML 中头像 src 必须统一为
# /xuewaiyu/assets/images/default_avatar.png，禁止 /assets/ 开头的错误路径。
echo ""
echo "  -- 头像路径合规扫描 --"
BAD_AVATAR=$(grep -rnoE '(src|background-image[^;]*url\()\s*["'"'"']?/assets/' "$WWW_DIR" --include="*.html" 2>/dev/null | grep -iE 'avatar|images/' || true)
if [ -n "$BAD_AVATAR" ]; then
  echo "  ✗ 发现错误的 /assets/ 开头头像路径："
  echo "$BAD_AVATAR" | head -20
  fail "头像路径存在 /assets/ 开头的错误前缀，违反方案 A 统一路径规则"
else
  echo "  ✓ 未发现 /assets/ 开头的错误头像路径"
fi

# 方案 A common.js 版本匹配：线上 common.js 必须带 ?v=<SHORT_SHA>
echo ""
echo "  -- common.js 版本匹配 --"
if grep -rq "assets/common.js?v=$SHORT_SHA" "$WWW_DIR" --include="*.html" 2>/dev/null; then
  echo "  ✓ 页面内 common.js 版本号与提交 SHA 匹配（?v=$SHORT_SHA）"
else
  fail "页面内 common.js 版本号与提交 SHA 不匹配（期望 ?v=$SHORT_SHA）"
fi

# 核心接口冒烟（漏洞1 修复：非 200 直接失败回滚，不再只打印了事）
echo ""
echo "  -- 核心接口冒烟 --"
LOGIN_RESP=$(curl -s --max-time 10 -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"account":"13480010005","password":"Test123456"}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('tokens',{}).get('accessToken',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  fail "登录接口未返回 token，核心链路异常。响应: $(echo "$LOGIN_RESP" | head -c 200)"
fi
echo "  /api/auth/login: HTTP 200（token 已获取）✓"

# 必须全部 200 的核心接口，任一失败即回滚
CRITICAL_EPS="user/me dashboard practice/config ai/quota membership/status"
for ep in $CRITICAL_EPS; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/$ep")
  echo "  /api/$ep: HTTP $code"
  [ "$code" != "200" ] && fail "核心接口 /api/$ep 返回 $code（期望 200）"
done

# 词汇学习全链路接口（本次新增模块，强制门禁）
echo "  -- 词汇学习接口冒烟 --"
for ep in "v1/practice/progress?lang=ja" \
          "v1/practice/questions?lang=ja&level=beginner&type=choice&limit=5" \
          "v1/reviews/wrong-questions?lang=ja&page=1&pageSize=10"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/$ep")
  echo "  /api/${ep%%\?*}: HTTP $code"
  [ "$code" != "200" ] && fail "词汇接口 /api/$ep 返回 $code（期望 200）"
done

# 抽题接口必须返回真实题目（防止词库为空导致「空转」）
VQ_BODY=$(curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v1/practice/questions?lang=ja&level=beginner&type=choice&limit=5")
VQ_CNT=$(echo "$VQ_BODY" | grep -o '"word"' | wc -l)
echo "  抽题返回题目数: $VQ_CNT"
[ "$VQ_CNT" -lt 1 ] && fail "词汇抽题接口未返回真实题目（词库可能为空）"

# 非阻断的抽样接口
for ep in checkin reports "content?language=ja&type=vocab" "practice/sentences?language=ja" "language/custom/quota"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/$ep")
  echo "  /api/$ep: HTTP $code（抽样，不阻断）"
done

# 安全校验 1：反馈列表接口权限（必须用「非管理员」账号验证，否则断言无意义）
#
# 【2026-08-03 修正】原实现用冒烟主账号 13480010005 断言 403，但该账号的 userId
# 恰好就配置在 .env.production 的 ADMIN_USER_IDS 中，它本来就应该拿到 200。
# 旧断言等于「要求管理员被拒绝」，属于测试用例本身写错，会把正常的权限系统误判为
# 数据泄露并触发回滚。此处改为：管理员期望 200 + 非管理员期望 403，双向验证才有意义。
echo ""
echo "  -- 安全校验 --"

# 1a. 无 token：必须 401（未认证不得访问）
FB_ANON=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/feedback/list")
echo "  /api/feedback/list（匿名期望 401）: HTTP $FB_ANON"
[ "$FB_ANON" != "401" ] && fail "反馈列表接口未拦截匿名访问，返回 $FB_ANON（期望 401）—— 存在数据泄露风险"

# 1b. 非管理员：必须 403。使用专用冒烟账号，若不存在则跳过并显式告警（绝不静默放行）
NONADMIN_PHONE="${SMOKE_NONADMIN_PHONE:-13900001234}"
NONADMIN_PASS="${SMOKE_NONADMIN_PASS:-Test123456}"
NA_RESP=$(curl -s --max-time 10 -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"$NONADMIN_PHONE\",\"password\":\"$NONADMIN_PASS\"}")
NA_TOKEN=$(echo "$NA_RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('tokens',{}).get('accessToken',''))" 2>/dev/null)

if [ -z "$NA_TOKEN" ]; then
  fail "非管理员冒烟账号 $NONADMIN_PHONE 登录失败，无法验证 403 权限门禁。请先创建该账号（或设置 SMOKE_NONADMIN_PHONE/SMOKE_NONADMIN_PASS）。响应: $(echo "$NA_RESP" | head -c 200)"
fi

# 防御：确保这个账号确实不是管理员，否则断言同样无意义
NA_ID=$(curl -s --max-time 10 -H "Authorization: Bearer $NA_TOKEN" "$BASE_URL/api/user/me" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print((d.get('user') or d.get('data') or {}).get('id',''))" 2>/dev/null)
case ",${ADMIN_USER_IDS}," in
  *",${NA_ID},"*)
    fail "冒烟非管理员账号 $NONADMIN_PHONE (id=$NA_ID) 竟在 ADMIN_USER_IDS 白名单中，403 断言失效，请更换账号"
    ;;
esac

FB_NA=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $NA_TOKEN" "$BASE_URL/api/feedback/list")
echo "  /api/feedback/list（非管理员期望 403）: HTTP $FB_NA"
[ "$FB_NA" != "403" ] && fail "反馈列表接口权限失效，非管理员返回 $FB_NA（期望 403）—— 存在数据泄露风险"

# 1c. 管理员：必须 200（确保没有把权限收得过死导致管理端不可用）
FB_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/feedback/list")
echo "  /api/feedback/list（管理员期望 200）: HTTP $FB_ADMIN"
[ "$FB_ADMIN" != "200" ] && fail "管理员访问反馈列表返回 $FB_ADMIN（期望 200）—— 管理端功能不可用"

# 安全校验 2：反馈提交限流（第 4 次必须 429，验证漏洞3 限流真实生效）
# 【2026-08-03 修正】原实现限流未生效时只打印警告就放行，等于门禁形同虚设，
# 与「任一不达标自动回滚」的要求冲突。现改为硬失败。
RL_LAST=""
for i in 1 2 3 4; do
  RL_LAST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$BASE_URL/api/feedback" \
    -H "Content-Type: application/json" \
    -d '{"type":"other","description":"deploy smoke test rate limit"}')
done
echo "  /api/feedback 连续第 4 次提交（期望 429）: HTTP $RL_LAST"
[ "$RL_LAST" != "429" ] && fail "反馈提交限流未生效，第 4 次返回 $RL_LAST（期望 429）—— 存在刷接口风险"

# 安全校验 3：注销后 token 必须失效（全设备下线，验证 blacklist:uid 真实生效）
LO_RESP=$(curl -s --max-time 10 -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"account\":\"$NONADMIN_PHONE\",\"password\":\"$NONADMIN_PASS\"}")
LO_TOKEN=$(echo "$LO_RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('tokens',{}).get('accessToken',''))" 2>/dev/null)
if [ -n "$LO_TOKEN" ]; then
  PRE_LO=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $LO_TOKEN" "$BASE_URL/api/user/me")
  curl -s -o /dev/null --max-time 10 -X POST -H "Authorization: Bearer $LO_TOKEN" "$BASE_URL/api/auth/logout"
  POST_LO=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -H "Authorization: Bearer $LO_TOKEN" "$BASE_URL/api/user/me")
  echo "  注销前 /api/user/me: HTTP $PRE_LO → 注销后: HTTP $POST_LO（期望 401）"
  [ "$POST_LO" != "401" ] && fail "注销后 token 仍可用（返回 $POST_LO，期望 401）—— 全设备下线失效"
else
  echo "  ⚠ 注销验证跳过：未取得 token"
fi

# 漏洞6 修复：部署后再次核验生产版本 == 远端最新版
echo ""
echo "  -- 版本一致性终检 --"
FINAL_HEAD=$(cd "$PROJECT_DIR" && git rev-parse HEAD 2>/dev/null || echo "")
echo "  部署前版本: ${PRE_DEPLOY_HEAD:-<未知>}"
echo "  部署后版本: $FINAL_HEAD"
echo "  远端最新版: ${REMOTE_HEAD:-<未获取>}"
if [ -n "$REMOTE_HEAD" ] && [ "$FINAL_HEAD" != "$REMOTE_HEAD" ]; then
  fail "部署后版本与远端不一致，部署未真正生效"
fi
echo "  ✓ 生产版本已确认等于远端最新版"

# ==================== 双端冒烟：APP 端（8080）必须全绿 ====================
# 漏洞2/双端发布强化：原脚本只测网页端（443），APP 站点（8080）长期漏测，
# 导致 APP 全站 403 事故潜伏数月。现要求双端均通过才允许上线。
echo ""
echo "  -- 双端冒烟：APP 端（8080）--"
# APP 端核心页面（走 new-app.conf，根路径 302 到 landing.html，业务页在 /xuewaiyu/）
APP_PAGES="landing.html home.html learn.html profile.html practice.html game.html chat.html"
for p in $APP_PAGES; do
  code=$(curl_app "/xuewaiyu/$p")
  echo "  APP /xuewaiyu/$p: HTTP $code"
  [ "$code" != "200" ] && fail "APP 端页面 /xuewaiyu/$p 返回 $code（期望 200）—— APP 站点部署不完整"
done

# APP 端核心接口（经 8080 网关反代到 3000）
# 注意：user/me、dashboard、ai/quota 均为鉴权接口，必须带 APP 端登录拿到的 token，
#       否则必然 401（历史 bug：此处漏带 Authorization 头，该门禁从未真正通过过）。
APP_LOGIN_RESP=$(curl -s --max-time 10 -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"account":"13480010005","password":"Test123456"}')
APP_LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST "$APP_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"account":"13480010005","password":"Test123456"}')
echo "  APP /api/auth/login: HTTP $APP_LOGIN_CODE"
[ "$APP_LOGIN_CODE" != "200" ] && fail "APP 端登录返回 $APP_LOGIN_CODE（期望 200）—— APP 网关反代异常"

# 取 accessToken（后端返回结构：{ tokens: { accessToken } }）
APP_TOKEN=$(echo "$APP_LOGIN_RESP" | sed -n 's/.*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
if [ -z "$APP_TOKEN" ]; then
  echo "$APP_LOGIN_RESP" | head -c 300
  fail "APP 端登录未取到 accessToken —— 登录响应结构异常"
fi
echo "  APP 登录 token: 已获取 ✓"

APP_EPS="user/me dashboard ai/quota"
for ep in $APP_EPS; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Authorization: Bearer $APP_TOKEN" "$APP_URL/api/$ep")
  echo "  APP /api/$ep: HTTP $code"
  [ "$code" != "200" ] && fail "APP 端接口 /api/$ep 返回 $code（期望 200）—— APP 网关反代异常"
done

# APP 端词汇学习接口（本次新增模块，双端一致性门禁）
for ep in "v1/practice/progress?lang=ja" "v1/practice/questions?lang=ja&level=beginner&type=choice&limit=5"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Authorization: Bearer $APP_TOKEN" "$APP_URL/api/$ep")
  echo "  APP /api/${ep%%\?*}: HTTP $code"
  [ "$code" != "200" ] && fail "APP 端词汇接口 /api/$ep 返回 $code（期望 200）"
done
echo "  ✓ APP 端（8080）冒烟全部通过"

# 全部通过，标记部署成功
DEPLOY_OK=1
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ 部署完成（所有门禁校验通过）         ║"
echo "╚══════════════════════════════════════════╝"
echo "  版本:         $FINAL_HEAD"
echo "  静态资源版本: common.js?v=$SHORT_SHA"
echo "  数据库备份:   $PRE_DEPLOY_DB"
echo "  前端快照:     $PRE_DEPLOY_WWW"
echo "  后端快照:     $PRE_DEPLOY_CODE"
echo "  手动回滚:     cd $PROJECT_DIR && git checkout $PRE_DEPLOY_HEAD && pm2 reload xuewaiyu-backend --update-env"
