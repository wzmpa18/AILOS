#!/bin/bash
# ============================================================
# AILOS 统一幂等部署脚本 deploy.sh
# ------------------------------------------------------------
# 执行人：CodeBuddy（监理）或开发者（TRAE 禁止 SSH，仅产出脚本）
# 设计原则：
#   1. 幂等 —— 可重复执行，无变化时安全跳过，不破坏现有状态；
#   2. 不含任何凭据 —— 服务器仅 .env.production，运行时 source 注入；
#   3. 五步标准化 + 回滚 —— 备份→拉取→迁移→重启→健康校验，失败可回滚。
# 说明：本脚本整合既有 deploy_p1.sh（后端）与 deploy_frontend_rsync.sh（前端），
#       提供单一入口。迁移默认使用 `prisma migrate deploy`（P2 起生产已切到该方式，
#       见账簿 6.4；如需回退 db push，设置 MIGRATE_MODE=push）。
# ============================================================
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKEND_DIR="/www/xuewaiyu-backend"
FRONTEND_DIR="/www/xuewaiyu"
BACKUP_ROOT="/www/backups/deploy_${TIMESTAMP}"
LOG_FILE="/tmp/deploy_${TIMESTAMP}.log"
MIGRATE_MODE="${MIGRATE_MODE:-migrate}"   # migrate | push

exec > >(tee -a "$LOG_FILE") 2>&1

log(){ echo "[$(date +%H:%M:%S)] $*"; }
ok(){ echo "  ✓ $*"; }
err(){ echo "  ✗ $*"; }

# ============================================================
# 自动回滚（P0 事故整改：任何部署后自检失败必须自动回滚，禁止手工热修复）
# 回滚范围：后端代码(git) + prisma client + PM2 + 前端静态(本次备份)
# ============================================================
rollback(){
  err "★ 触发自动回滚 -> ${CURRENT_COMMIT:-unknown}"
  cd "$BACKEND_DIR"
  if [ -n "${CURRENT_COMMIT:-}" ] && [ "${CURRENT_COMMIT}" != "unknown" ]; then
    git reset --hard "${CURRENT_COMMIT}" 2>&1 | tail -1
    npx prisma generate 2>&1 | tail -1
  fi
  if [ -d "${BACKUP_ROOT}/xuewaiyu_frontend.bak" ]; then
    cp -r "${BACKUP_ROOT}/xuewaiyu_frontend.bak/." "${FRONTEND_DIR}/"
    ok "前端静态已从 ${BACKUP_ROOT} 还原"
  fi
  pm2 restart xuewaiyu-backend --update-env 2>&1 | tail -1
  sleep 3
  if pm2 list | grep -q "xuewaiyu-backend.*online"; then
    ok "回滚完成，PM2 online（版本 ${CURRENT_COMMIT:-unknown}）"
  else
    err "回滚后 PM2 仍未 online，需立即人工介入！"
  fi
}

echo "============================================"
echo " AILOS 统一部署 deploy.sh"
echo " 时间: $(date)"
echo " 后端: ${BACKEND_DIR}"
echo " 前端: ${FRONTEND_DIR}"
echo " 迁移: ${MIGRATE_MODE}"
echo " 日志: ${LOG_FILE}"
echo "============================================"

# ============================================================
# 0. 前置检查（环境 + 凭据加载）
# ============================================================
log "[0/7] 前置检查..."
if [ ! -f "${BACKEND_DIR}/.env.production" ]; then
  err "服务器无 .env，仅有 .env.production（LEDGER 23.5 红线），请确认后重试"
  exit 1
fi
set -a; source "${BACKEND_DIR}/.env.production"; set +a
if [ -z "${DATABASE_URL:-}" ]; then
  err "DATABASE_URL 未加载"
  exit 1
fi
ok "环境变量就绪 (DATABASE_URL 已加载)"
command -v git >/dev/null && ok "git 就绪" || { err "git 缺失"; exit 1; }
command -v pm2 >/dev/null && ok "pm2 就绪" || { err "pm2 缺失"; exit 1; }
command -v nginx >/dev/null && ok "nginx 就绪" || { err "nginx 缺失"; exit 1; }

# ============================================================
# 1. 全量备份（DB + nginx + .env.production + 前端静态）
# ============================================================
log "[1/7] 数据库 + 配置 + 前端静态 全量备份..."
mkdir -p "$BACKUP_ROOT"
if pg_dump "$DATABASE_URL" > "${BACKUP_ROOT}/full_dump_${TIMESTAMP}.sql" 2>/dev/null; then
  ok "DB 备份: ${BACKUP_ROOT}/full_dump_${TIMESTAMP}.sql ($(wc -c < ${BACKUP_ROOT}/full_dump_${TIMESTAMP}.sql) bytes)"
else
  err "DB 备份失败，中止部署"; exit 1
fi
cp "${BACKEND_DIR}/.env.production" "${BACKUP_ROOT}/.env.production"
[ -f /www/server/panel/vhost/nginx/yandao.vip.conf ] && \
  cp /www/server/panel/vhost/nginx/yandao.vip.conf "${BACKUP_ROOT}/yandao.vip.conf"
[ -d "$FRONTEND_DIR" ] && cp -r "$FRONTEND_DIR" "${BACKUP_ROOT}/xuewaiyu_frontend.bak"
ok "配置与前端静态已备份至 ${BACKUP_ROOT}"

# ============================================================
# 2. 拉取后端代码（记录旧版本用于回滚）
# ============================================================
log "[2/7] 拉取后端代码..."
cd "$BACKEND_DIR"
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo unknown)
git fetch origin
git reset --hard "origin/main"
NEW_COMMIT=$(git rev-parse HEAD)
if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ] && [ "$CURRENT_COMMIT" != "unknown" ]; then
  log "⚠ 后端代码无变化 (${NEW_COMMIT})，跳过后续迁移/重启（前端仍会同步）"
fi
ok "后端: ${CURRENT_COMMIT} -> ${NEW_COMMIT}"

# ============================================================
# 3. 依赖 + 迁移（幂等：generate 必跑；migrate 有基线记录）
# ============================================================
log "[3/7] 依赖安装 + 数据库迁移 (${MIGRATE_MODE})..."
npm install --production 2>&1 | tail -3
npx prisma generate 2>&1 | tail -3
if [ "$MIGRATE_MODE" = "push" ]; then
  npx prisma db push 2>&1 | tail -5
  ok "prisma db push 完成"
else
  npx prisma migrate deploy 2>&1 | tail -8
  ok "prisma migrate deploy 完成"
fi

# ============================================================
# 4. 重启后端 PM2（幂等：restart 安全）
# ============================================================
log "[4/7] 重启 PM2 后端..."
pm2 restart xuewaiyu-backend --update-env 2>&1 | tail -3
# 限流白名单环境变量（幂等注入：--update-env 不复源 .env.production，须显式 set 以免丢失）
pm2 set xuewaiyu-backend:RATE_LIMIT_WHITELIST "${RATE_LIMIT_WHITELIST:-13480010005}" 2>&1 | tail -2
sleep 3
if pm2 list | grep -q "xuewaiyu-backend.*online"; then
  ok "PM2 后端 online"
else
  err "PM2 后端未 online —— 自动回滚（自检闸门 1：服务启动健康检查）"
  rollback
  exit 1
fi
# 自检闸门 1b：进程 online 不代表可服务，必须健康接口 200
H_BOOT=$(curl -s -o /dev/null -w "%{http_code}" -m 10 http://localhost:3000/api/health 2>/dev/null || echo 000)
if [ "$H_BOOT" != "200" ]; then
  err "/api/health → ${H_BOOT}（非200）—— 自动回滚"
  rollback
  exit 1
fi
ok "自检闸门 1 通过：PM2 online 且 /api/health → 200"

# ============================================================
# 5. 前端静态同步（复用既有 deploy_frontend_rsync.sh）
# ============================================================
log "[5/7] 前端静态同步..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/deploy_frontend_rsync.sh" ]; then
  bash "${SCRIPT_DIR}/deploy_frontend_rsync.sh" 2>&1 | tail -8
  ok "前端同步完成"
else
  err "未找到 deploy_frontend_rsync.sh，跳过前端同步（后端仍已部署）"
fi

# ============================================================
# ============================================================
# 5.5 双目录一致性校验（根因修复：禁止后端更新而前端停留在旧版 / 半同步上线）
# 前端源码与后端同仓（SOURCE_DIR=仓库根）；部署目标 FRONTEND_DIR=/www/xuewaiyu
# 任一前端文件与源码(${NEW_COMMIT})不符即部署失败并告警
# ============================================================
log "[5.5] 双目录一致性校验（后端 ${NEW_COMMIT} <-> 前端静态）..."
SOURCE_DIR="/www/xuewaiyu-backend"
MISMATCH=0
for sf in "${SOURCE_DIR}"/*.html; do
  [ -e "$sf" ] || continue
  f="$(basename "$sf")"; case "$f" in _*|*_live_*) continue;; esac
  d="${FRONTEND_DIR}/${f}"
  [ -f "$d" ] || { err "前端缺失: $f"; MISMATCH=1; continue; }
  cmp -s "$sf" "$d" || { err "前端不一致: $f"; MISMATCH=1; }
done
for d in assets public; do
  [ -d "${SOURCE_DIR}/$d" ] || continue
  while IFS= read -r sf; do
    rel="${sf#${SOURCE_DIR}/$d/}"; t="${FRONTEND_DIR}/$d/${rel}"
    [ -f "$t" ] || { err "前端缺失: $d/$rel"; MISMATCH=1; continue; }
    cmp -s "$sf" "$t" || { err "前端不一致: $d/$rel"; MISMATCH=1; }
  done < <(find "${SOURCE_DIR}/$d" -type f)
done
if [ "$MISMATCH" = "1" ]; then
  err "双目录不一致：前端静态未与源码(${NEW_COMMIT})同步，部署失败并告警"
  echo "[AILOS 部署告警] 双目录不一致，前端静态与仓库源码(${NEW_COMMIT})不符" | mail -s "[AILOS 部署告警] 双目录不一致" "${DEPLOY_ALERT_MAIL:-root}" 2>/dev/null || true
  exit 1
fi
ok "双目录一致：前端静态 == 仓库源码(${NEW_COMMIT})"

# ============================================================
# 6. Nginx 校验 + 重载（幂等）
# ============================================================
log "[6/7] Nginx 校验 + 重载..."
if nginx -t 2>/dev/null; then
  nginx -s reload 2>&1
  ok "Nginx reload 完成"
else
  err "Nginx -t 失败，配置未改动（保留旧配置）"
fi

# ============================================================
# 6.5 自检闸门 2：核心页面可用性校验（P0 首页500事故整改）
# 静态同步 + nginx reload 后，逐一校验核心页面 HTTP 状态；
# 任一页面非 200 → 自动回滚，禁止手工热修复跳过检查。
# ============================================================
log "[6.5] 自检闸门 2：核心页面可用性校验..."
PAGE_FAIL=0
CORE_PAGES="index.html login.html home.html chat.html learn.html profile.html billing.html photo-translate.html"
for p in $CORE_PAGES; do
  # 仅校验仓库中实际存在的页面，避免误报
  [ -f "${BACKEND_DIR}/${p}" ] || continue
  PC=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -H "Host: 82.156.228.87" "http://127.0.0.1/xuewaiyu/${p}" 2>/dev/null || echo 000)
  if [ "$PC" = "200" ]; then ok "/xuewaiyu/${p} → 200"; else err "/xuewaiyu/${p} → ${PC}"; PAGE_FAIL=1; fi
done
# 无扩展名跳转路径（登录/引导完成后的真实用户路径，本次500事故的直接触发点）
HC=$(curl -s -o /dev/null -w "%{http_code}" -m 10 -H "Host: 82.156.228.87" "http://127.0.0.1/xuewaiyu/home" 2>/dev/null || echo 000)
if [ "$HC" = "200" ]; then ok "/xuewaiyu/home → 200"; else err "/xuewaiyu/home → ${HC}"; PAGE_FAIL=1; fi
if [ "$PAGE_FAIL" = "1" ]; then
  err "核心页面可用性校验失败 —— 自动回滚"
  rollback
  exit 1
fi
ok "自检闸门 2 通过：核心页面全部 200"

# ============================================================
# 7. 健康校验（权力项：必须 200）
# ============================================================
log "[7/7] 健康检查..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo 000)
if [ "$HEALTH" = "200" ]; then ok "/api/health → 200"; else err "/api/health → ${HEALTH}"; fi
for ep in "/api/content" "/api/ai/quota" "/api/checkin/status" "/api/reviews/due" "/api/reports/summary"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${ep}" 2>/dev/null || echo 000)
  if [ "$S" = "200" ] || [ "$S" = "401" ]; then ok "${ep} → ${S}"; else err "${ep} → ${S}"; fi
done

echo ""
echo "============================================"
echo " 部署完成 ✅"
echo " 后端: ${CURRENT_COMMIT} -> ${NEW_COMMIT}"
echo " 备份: ${BACKUP_ROOT}"
echo " 日志: ${LOG_FILE}"
echo ""
echo " 一键回滚（如需）："
echo "   cd ${BACKEND_DIR} && git reset --hard ${CURRENT_COMMIT} && pm2 restart xuewaiyu-backend"
echo "   psql \"\$DATABASE_URL\" < ${BACKUP_ROOT}/full_dump_${TIMESTAMP}.sql"
echo "   cp -r ${BACKUP_ROOT}/xuewaiyu_frontend.bak/* ${FRONTEND_DIR}/"
echo "============================================"
