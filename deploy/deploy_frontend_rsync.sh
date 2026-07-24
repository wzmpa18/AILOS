#!/bin/bash
# ============================================================
# deploy_frontend_rsync.sh
# 前端静态文件同步脚本 — 部署到 /www/xuewaiyu
# 执行人：CodeBuddy（监理）或开发者
# TRAE 禁止 SSH 执行，仅产出脚本
# ============================================================
set -e

TARGET="/www/xuewaiyu"
TIMESTAMP=$(date +%Y%m%d_%H%M)
BAK_DIR="${TARGET}.bak.${TIMESTAMP}"
SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo " AILOS 前端部署脚本"
echo " 时间: $(date)"
echo " 源目录: ${SOURCE_DIR}"
echo " 目标目录: ${TARGET}"
echo "============================================"

# 1. 备份线上旧静态文件
echo "[1/5] 备份线上旧静态文件..."
if [ -d "$TARGET" ]; then
  cp -r "$TARGET" "$BAK_DIR"
  echo "  备份完成: ${BAK_DIR}"
else
  echo "  目标目录不存在，跳过备份"
  mkdir -p "$TARGET"
fi

# 2. 同步 HTML 文件（不含 backend 目录）
echo "[2/5] 同步前端 HTML 文件..."
HTML_FILES=(
  "home.html"
  "learn.html"
  "chat.html"
  "profile.html"
  "review.html"
  "login.html"
  "register.html"
  "guest.html"
  "landing.html"
  "language.html"
  "ai-companion-builder.html"
  "discover.html"
  "growth-center.html"
  "partner.html"
  "ecosystem.html"
  "rewards.html"
  "terms.html"
  "404.html"
)

for f in "${HTML_FILES[@]}"; do
  if [ -f "${SOURCE_DIR}/${f}" ]; then
    cp "${SOURCE_DIR}/${f}" "${TARGET}/${f}"
    echo "  ✓ ${f}"
  else
    echo "  ⚠ ${f} 不存在，跳过"
  fi
done

# 3. 同步 public 目录
echo "[3/5] 同步 public/ 目录..."
if [ -d "${SOURCE_DIR}/public" ]; then
  rsync -av --delete "${SOURCE_DIR}/public/" "${TARGET}/public/"
  echo "  ✓ public/ 同步完成"
fi

# 4. 同步 assets 目录（如有）
echo "[4/5] 同步 assets/ 目录..."
if [ -d "${SOURCE_DIR}/assets" ]; then
  rsync -av --delete "${SOURCE_DIR}/assets/" "${TARGET}/assets/"
  echo "  ✓ assets/ 同步完成"
fi

# 5. 验证关键文件
echo "[5/5] 验证部署完整性..."
REQUIRED_FILES=(
  "${TARGET}/home.html"
  "${TARGET}/learn.html"
  "${TARGET}/chat.html"
  "${TARGET}/profile.html"
  "${TARGET}/login.html"
)

ALL_OK=true
for f in "${REQUIRED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "  ✓ $(basename $f) — $(wc -c < $f) bytes"
  else
    echo "  ✗ $(basename $f) — 缺失!"
    ALL_OK=false
  fi
done

echo ""
echo "============================================"
if [ "$ALL_OK" = true ]; then
  echo " 部署完成 ✅"
  echo " 备份位置: ${BAK_DIR}"
  echo ""
  echo " 回滚命令:"
  echo "   rm -rf ${TARGET} && mv ${BAK_DIR} ${TARGET}"
else
  echo " 部署异常 ❌ — 部分文件缺失，请检查"
  echo " 回滚命令:"
  echo "   rm -rf ${TARGET} && mv ${BAK_DIR} ${TARGET}"
fi
echo "============================================"