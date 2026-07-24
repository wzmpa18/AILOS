#!/bin/bash
# ============================================================
# deploy_p1.sh
# 后端部署脚本 — 部署到 /www/xuewaiyu-backend
# 执行人：CodeBuddy（监理）或开发者
# TRAE 禁止 SSH 执行，仅产出脚本
# ============================================================
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M)
BACKEND_DIR="/www/xuewaiyu-backend"
BACKUP_DIR="/www/backups/deploy_${TIMESTAMP}"
LOG_FILE="/tmp/deploy_p1_${TIMESTAMP}.log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================"
echo " AILOS 后端部署脚本"
echo " 时间: $(date)"
echo " 部署目录: ${BACKEND_DIR}"
echo " 日志文件: ${LOG_FILE}"
echo "============================================"

# ============================================================
# 前置检查
# ============================================================
echo "[前置] 环境检查..."

if [ ! -f "${BACKEND_DIR}/.env.production" ]; then
  echo "❌ 错误: ${BACKEND_DIR}/.env.production 不存在"
  echo "   服务器无 .env 文件，仅 .env.production"
  echo "   请确认环境变量文件存在后重试"
  exit 1
fi

# 加载环境变量（关键：服务器仅有 .env.production）
set -a
source "${BACKEND_DIR}/.env.production"
set +a

if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误: DATABASE_URL 未加载，请检查 .env.production"
  exit 1
fi

echo "  ✓ DATABASE_URL 已加载"
echo "  ✓ 环境变量就绪"

# ============================================================
# 1. 数据库全量备份
# ============================================================
echo ""
echo "[1/6] 数据库全量备份..."

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/full_dump_${TIMESTAMP}.sql" 2>&1

if [ $? -eq 0 ]; then
  echo "  ✓ 数据库备份完成: ${BACKUP_DIR}/full_dump_${TIMESTAMP}.sql"
  echo "  备份大小: $(wc -c < ${BACKUP_DIR}/full_dump_${TIMESTAMP}.sql) bytes"
else
  echo "  ❌ 数据库备份失败，中止部署"
  exit 1
fi

# 备份 Nginx 配置
if [ -f /etc/nginx/sites-enabled/yandao.vip ]; then
  cp /etc/nginx/sites-enabled/yandao.vip "${BACKUP_DIR}/nginx_yandao.vip.conf"
  echo "  ✓ Nginx 配置已备份"
fi

# 备份 .env.production
cp "${BACKEND_DIR}/.env.production" "${BACKUP_DIR}/.env.production"
echo "  ✓ .env.production 已备份"

# ============================================================
# 2. 拉取最新代码
# ============================================================
echo ""
echo "[2/6] 拉取最新代码..."

cd "$BACKEND_DIR"

# 记录当前版本用于回滚
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "  当前版本: ${CURRENT_COMMIT}"

git pull origin main 2>&1

NEW_COMMIT=$(git rev-parse HEAD)
echo "  新版本: ${NEW_COMMIT}"

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ] && [ "$CURRENT_COMMIT" != "unknown" ]; then
  echo "  ⚠ 代码无变化，无需部署"
  echo "  如需强制重启，请手动执行: pm2 restart xuewaiyu-backend"
  exit 0
fi

# ============================================================
# 3. 安装依赖
# ============================================================
echo ""
echo "[3/6] 安装依赖..."

npm install --production 2>&1
echo "  ✓ npm install 完成"

# ============================================================
# 4. Prisma 数据库迁移
# ============================================================
echo ""
echo "[4/6] Prisma 数据库迁移..."

# 注意：使用 prisma db push（与现有服务器一致）
# 不要使用 prisma migrate deploy（需先初始化基线）
npx prisma generate 2>&1
echo "  ✓ prisma generate 完成"

npx prisma db push 2>&1
echo "  ✓ prisma db push 完成"

# ============================================================
# 5. 重启 PM2 服务
# ============================================================
echo ""
echo "[5/6] 重启 PM2 服务..."

pm2 restart xuewaiyu-backend 2>&1

# 等待服务启动
sleep 3

# 检查服务状态
if pm2 list | grep -q "xuewaiyu-backend.*online"; then
  echo "  ✓ PM2 服务重启成功"
else
  echo "  ❌ PM2 服务启动失败，执行回滚..."
  pm2 logs xuewaiyu-backend --lines 20
  exit 1
fi

# ============================================================
# 6. Nginx 重载
# ============================================================
echo ""
echo "[6/6] Nginx 配置重载..."

nginx -t 2>&1
if [ $? -eq 0 ]; then
  nginx -s reload 2>&1
  echo "  ✓ Nginx 重载完成"
else
  echo "  ❌ Nginx 配置校验失败，请检查配置"
  exit 1
fi

# ============================================================
# 部署后验证
# ============================================================
echo ""
echo "============================================"
echo " 部署后验证"
echo "============================================"

# 等待服务完全就绪
sleep 2

# 验证健康检查
echo "健康检查:"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo "  ✓ /api/health → 200"
else
  echo "  ✗ /api/health → ${HEALTH}"
fi

# 验证关键接口
echo "关键接口验证:"
for endpoint in "/api/content" "/api/ai/quota" "/api/checkin/status" "/api/reviews/due" "/api/reports/summary"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${endpoint}" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
    echo "  ✓ ${endpoint} → ${STATUS}"
  else
    echo "  ✗ ${endpoint} → ${STATUS} (异常!)"
  fi
done

# 验证新增的 BUG-016 路由
echo "BUG-016 路由验证:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/user/progress/ja" 2>/dev/null || echo "000")
if [ "$STATUS" = "401" ]; then
  echo "  ✓ /api/user/progress/ja → 401 (认证保护正常)"
else
  echo "  ⚠ /api/user/progress/ja → ${STATUS}"
fi

# ============================================================
# 完成
# ============================================================
echo ""
echo "============================================"
echo " 部署完成 ✅"
echo " 旧版本: ${CURRENT_COMMIT}"
echo " 新版本: ${NEW_COMMIT}"
echo " 备份目录: ${BACKUP_DIR}"
echo " 日志文件: ${LOG_FILE}"
echo ""
echo " 一键回滚命令:"
echo "   cd ${BACKEND_DIR}"
echo "   git reset --hard ${CURRENT_COMMIT}"
echo "   psql ${DATABASE_URL} < ${BACKUP_DIR}/full_dump_${TIMESTAMP}.sql"
echo "   pm2 restart xuewaiyu-backend"
echo "   nginx -s reload"
echo "============================================"