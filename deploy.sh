#!/bin/bash
# =============================================================================
# AILOS 生产部署脚本 (硬化版: 双自检闸门 + 自动回滚 + 前端同步)
# 纪律: 禁止 db push; 仅 prisma migrate deploy; 部署失败自动回滚至持久锚点
# =============================================================================
set -uo pipefail

BACKEND_DIR="/www/xuewaiyu-backend"
FRONTEND_SRC="${BACKEND_DIR}"
FRONTEND_DST="/www/xuewaiyu"
APP_NAME="xuewaiyu-backend"
BACKUP_DIR="/www/backups"
ANCHOR="${BACKUP_DIR}/last_good_commit"
TS=$(date +%Y%m%d_%H%M%S)_$$
LOG="${BACKEND_DIR}/logs/deploy_${TS}.log"
mkdir -p "${BACKEND_DIR}/logs" "${BACKUP_DIR}"

exec > >(tee -a "$LOG") 2>&1
echo "=== DEPLOY START $(date -u +%Y-%m-%dT%H:%M:%SZ) log=$LOG ==="

cd "$BACKEND_DIR" || { echo "cd failed"; exit 1; }

git fetch origin
git reset --hard origin/main

if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='*.bak.*' "${FRONTEND_SRC}/"*.html "${FRONTEND_DST}/" 2>/dev/null
  for d in assets admin frontend public; do
    [ -d "${FRONTEND_SRC}/$d" ] && rsync -a "${FRONTEND_SRC}/$d" "${FRONTEND_DST}/" 2>/dev/null
  done
  echo "FRONTEND_SYNC done"
else
  echo "WARN: rsync missing, skip frontend sync"
fi

npm install --omit=dev 2>&1 | tail -2
npx prisma generate 2>&1 | tail -2
npx prisma migrate deploy 2>&1 | tail -5

pm2 restart "$APP_NAME" || pm2 start src/server/index.js --name "$APP_NAME" --instances 1
sleep 8

health_ok=0; health_code=""
for i in $(seq 1 12); do
  health_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  if [ "$health_code" = "200" ]; then health_ok=1; break; fi
  sleep 3
done
echo "GATE1 health_ok=$health_ok (code=$health_code)"

PAGES=("home" "login" "chat" "learn" "profile" "billing" "vocabulary")
gate2=1
for p in "${PAGES[@]}"; do
  c=$(curl -sk -o /dev/null -w "%{http_code}" "https://yandao.vip/xuewaiyu/$p")
  if [ "$c" != "200" ]; then echo "PAGE_FAIL /xuewaiyu/$p=$c"; gate2=0; fi
done
echo "GATE2 pages_ok=$gate2"

if [ "$health_ok" != "1" ] || [ "$gate2" != "1" ]; then
  echo "!! GATES FAILED -> ROLLBACK to anchor"
  if [ ! -f "$ANCHOR" ]; then echo "!! NO ANCHOR, abort"; exit 2; fi
  TARGET=$(cat "$ANCHOR")
  git reset --hard "$TARGET"
  pm2 restart "$APP_NAME" || pm2 start src/server/index.js --name "$APP_NAME" --instances 1
  sleep 8
  rc=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  echo "ROLLBACK health=$rc target=$TARGET"
  if [ "$rc" != "200" ]; then echo "!! ROLLBACK FAILED - MANUAL INTERVENTION REQUIRED"; exit 3; fi
  echo "ROLLBACK OK -> $TARGET"
  exit 1
fi

NEW_COMMIT=$(git rev-parse HEAD)
echo "$NEW_COMMIT" > "$ANCHOR"
/etc/init.d/nginx reload 2>/dev/null || true
echo "DEPLOY OK new_commit=$NEW_COMMIT anchor_registered"
echo "=== DEPLOY END ===
