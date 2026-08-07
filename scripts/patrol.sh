#!/bin/bash
# ============================================================
# AILOS 代码防篡改定时巡检脚本 v1.0
# crontab: 0 * * * * /www/xuewaiyu-backend/scripts/patrol.sh >> /var/log/ailos_patrol.log
# 每小时检查一次核心文件是否被非预期修改
# ============================================================
PROJECT_DIR="/www/xuewaiyu-backend"
LOG_FILE="/var/log/ailos_patrol.log"
ALERT_FILE="/var/log/ailos_patrol_alert.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 巡检开始"

cd "$PROJECT_DIR" || exit 1

# 核心文件清单
FILES=(
  "src/services/authService.js"
  "src/services/dailyPlanService.js"
  "src/server/middleware/rateLimit.js"
  "src/server/middleware/dependencyGuard.js"
  "src/server/middleware/auth.js"
  "public/xuewaiyu/assets/common.js"
  "public/xuewaiyu/placement.html"
)

ALERT_COUNT=0

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "  [MISSING] $f" | tee -a "$ALERT_FILE"
    ALERT_COUNT=$((ALERT_COUNT + 1))
    continue
  fi

  CURRENT_HASH=$(md5sum "$f" | awk '{print $1}')
  GIT_HASH=$(git show "HEAD:$f" 2>/dev/null | md5sum | awk '{print $1}')

  if [ "$CURRENT_HASH" != "$GIT_HASH" ]; then
    echo "  [MODIFIED] $f (current:$CURRENT_HASH git:$GIT_HASH)" | tee -a "$ALERT_FILE"
    ALERT_COUNT=$((ALERT_COUNT + 1))
  fi
done

# 检查 .githash 一致性
GITHASH_FILE="$PROJECT_DIR/.githash"
if [ -f "$GITHASH_FILE" ]; then
  STORED_SHA=$(cat "$GITHASH_FILE")
  CURRENT_SHA=$(git rev-parse HEAD)
  if [ "$STORED_SHA" != "$CURRENT_SHA" ]; then
    echo "  [VERSION_MISMATCH] .githash:$STORED_SHA git:$CURRENT_SHA" | tee -a "$ALERT_FILE"
    ALERT_COUNT=$((ALERT_COUNT + 1))
  fi
fi

if [ $ALERT_COUNT -eq 0 ]; then
  echo "  ✅ 所有文件正常"
else
  echo "  ⚠️ 发现 $ALERT_COUNT 处异常，详情见 $ALERT_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 巡检结束"
echo "---"
