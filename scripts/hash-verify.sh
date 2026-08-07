#!/bin/bash
# ============================================================
# AILOS 三端哈希校验脚本 v1.0
# 部署完成后执行，确保「本地Git → GitHub → 服务器」三端文件一致
# 不一致直接报错，输出差异文件列表
# ============================================================
set -e

GITHUB_SHA=${1:-}
WWW_DIR="/www/xuewaiyu"
PROJECT_DIR="/www/xuewaiyu-backend"
CORE_FILES=(
  "public/xuewaiyu/assets/common.js"
  "public/xuewaiyu/placement.html"
  "public/xuewaiyu/learn.html"
  "public/xuewaiyu/home.html"
  "public/xuewaiyu/translate.html"
  "public/xuewaiyu/practice.html"
  "public/xuewaiyu/vocabulary.html"
  "public/xuewaiyu/scan-translate.html"
  "src/services/authService.js"
  "src/services/dailyPlanService.js"
  "src/server/middleware/rateLimit.js"
  "src/server/middleware/dependencyGuard.js"
)

echo "=== AILOS 三端哈希校验 ==="
echo ""

# 1. 获取GitHub最新SHA
echo "[1/3] 获取GitHub基准SHA..."
cd "$PROJECT_DIR"
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git ls-remote origin main | awk '{print $1}')

if [ -z "$GITHUB_SHA" ]; then
  GITHUB_SHA="$REMOTE_SHA"
fi

echo "  本地: $LOCAL_SHA"
echo "  GitHub: $GITHUB_SHA"

if [ "$LOCAL_SHA" != "$GITHUB_SHA" ]; then
  echo "  ✗ 服务器SHA与GitHub不一致！请先执行 git pull origin main"
  exit 1
fi
echo "  ✓ 服务器与GitHub SHA一致"

# 2. 核心文件哈希校验
echo ""
echo "[2/3] 核心文件哈希校验..."
MISMATCH=0
for f in "${CORE_FILES[@]}"; do
  if [ ! -f "$PROJECT_DIR/$f" ]; then
    echo "  ⚠ $f: 文件不存在"
    continue
  fi
  LOCAL_HASH=$(md5sum "$PROJECT_DIR/$f" 2>/dev/null | awk '{print $1}' || echo "N/A")
  # 从Git获取该文件的基准哈希
  GIT_HASH=$(cd "$PROJECT_DIR" && git show "HEAD:$f" 2>/dev/null | md5sum | awk '{print $1}' || echo "N/A")
  
  if [ "$LOCAL_HASH" = "$GIT_HASH" ]; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f (MD5: $LOCAL_HASH vs git:$GIT_HASH)"
    MISMATCH=$((MISMATCH + 1))
  fi
done

# 3. 前端部署文件校验
echo ""
echo "[3/3] 前端部署文件校验..."
for f in common.js placement.html learn.html home.html translate.html practice.html vocabulary.html scan-translate.html; do
  DEPLOYED="$WWW_DIR/$f"
  SOURCE="$PROJECT_DIR/public/xuewaiyu/$f"
  if [ -f "$DEPLOYED" ] && [ -f "$SOURCE" ]; then
    D_HASH=$(md5sum "$DEPLOYED" | awk '{print $1}')
    S_HASH=$(md5sum "$SOURCE" | awk '{print $1}')
    if [ "$D_HASH" = "$S_HASH" ]; then
      echo "  ✓ $f"
    else
      echo "  ✗ $f (线上MD5: $D_HASH vs 源MD5: $S_HASH)"
      MISMATCH=$((MISMATCH + 1))
    fi
  else
    echo "  ⚠ $f: 文件缺失"
    MISMATCH=$((MISMATCH + 1))
  fi
done

echo ""
if [ $MISMATCH -eq 0 ]; then
  echo "✅ 三端哈希校验全部通过"
  exit 0
else
  echo "❌ 发现 $MISMATCH 处文件不一致，部署异常！"
  exit 1
fi
