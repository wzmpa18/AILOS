#!/bin/bash
# ============================================================
# AILOS 标准化部署脚本
# 宪法要求: 禁止直接 SFTP/SSH 修改生产文件
# 所有部署必须通过此脚本从 Git 拉取
# ============================================================
set -e

PROJECT_DIR="/www/xuewaiyu-backend"
BRANCH="main"

echo "[AILOS Deploy] Starting deployment at $(date)"

cd "$PROJECT_DIR"

# 1. Fetch latest from GitHub
echo "[AILOS Deploy] git fetch origin $BRANCH ..."
git fetch origin "$BRANCH"

# 2. Hard reset to origin (production = Git HEAD, 宪法铁律)
CURRENT=$(git rev-parse --short HEAD)
echo "[AILOS Deploy] Current: $CURRENT"

git reset --hard "origin/$BRANCH"

NEW=$(git rev-parse --short HEAD)
echo "[AILOS Deploy] Updated: $CURRENT -> $NEW"

# 3. Prisma generate (if schema changed)
SCHEMA_CHANGED=$(git diff "$CURRENT" "$NEW" -- prisma/schema.prisma | wc -l)
if [ "$SCHEMA_CHANGED" -gt 0 ]; then
    echo "[AILOS Deploy] Schema changed, running prisma generate..."
    bash -c 'set -a; source .env.production; set +a; npx prisma generate'
fi

# 4. PM2 restart
echo "[AILOS Deploy] PM2 restart xuewaiyu-backend ..."
pm2 restart xuewaiyu-backend

# 5. Health check
sleep 2
HEALTH=$(curl -s http://localhost:3000/api/health)
echo "[AILOS Deploy] Health: $HEALTH"

echo "[AILOS Deploy] Deployment complete at $(date)"
echo "[AILOS Deploy] New HEAD: $NEW"
