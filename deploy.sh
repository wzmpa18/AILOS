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
# DEF-P3-04 修复: prisma CLI 必须显式注入 .env.production（服务器无 .env，
# 运行时 DATABASE_URL 由 pm2 注入，但 CLI 不经过 pm2 → 此前 migrate deploy 一直静默失败）
bash -c 'set -a; . ./.env.production; set +a; npx prisma generate' 2>&1 | tail -2
bash -c 'set -a; . ./.env.production; set +a; npx prisma migrate deploy' 2>&1 | tail -5

# === 迁移自检闸门（防 schema 未跟上代码被 GATE 放行）===
MIG_STAT=$(bash -c 'set -a; . ./.env.production; set +a; npx prisma migrate status 2>&1' | tail -8)
echo "$MIG_STAT"
schema_ok=1
if echo "$MIG_STAT" | grep -qi "not yet been applied"; then
  echo "!! MIGRATION PENDING: schema not up to date"
  schema_ok=0
fi

# === 账簿版本校验闸门（落实 3.1/3.2，防代码上线、文档未更）===
HEAD_COMMIT=$(git rev-parse HEAD)
echo "DEPLOY HEAD: $HEAD_COMMIT"
ledger_ok=1
if ! git diff-tree --no-commit-id --name-only -r "$HEAD_COMMIT" | grep -q 'AILOS_MASTER_LEDGER.md'; then
  echo "!! LEDGER NOT SYNCED: HEAD commit $HEAD_COMMIT did not update AILOS_MASTER_LEDGER.md"
  ledger_ok=0
fi

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

# === 副本 MD5 校验闸门（落实 3.6，服务器副本同步强制校验）===
REPO_MD5=$(md5sum AILOS_MASTER_LEDGER.md | awk '{print $1}')
WWW_MD5=$(md5sum /www/AILOS_MASTER_LEDGER.md 2>/dev/null | awk '{print $1}')
md5_ok=1
if [ "$REPO_MD5" != "$WWW_MD5" ]; then
  echo "!! MD5 MISMATCH repo=$REPO_MD5 www=$WWW_MD5 -> syncing"
  cp AILOS_MASTER_LEDGER.md /www/AILOS_MASTER_LEDGER.md
  WWW_MD5=$(md5sum /www/AILOS_MASTER_LEDGER.md | awk '{print $1}')
fi
if [ "$REPO_MD5" != "$WWW_MD5" ]; then
  echo "!! MD5 SYNC FAILED"
  md5_ok=0
fi

if [ "$health_ok" != "1" ] || [ "$gate2" != "1" ] || [ "$schema_ok" != "1" ] || [ "$ledger_ok" != "1" ] || [ "$md5_ok" != "1" ]; then
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
echo "=== DEPLOY END ==="
