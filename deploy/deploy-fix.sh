#!/bin/bash
# ============================================================
# 部署修复脚本 — P0-04 (TD-012) Nginx 8787 端口修复
# 在服务器上执行: bash deploy-fix.sh
# ============================================================
set -e

echo "=========================================="
echo "  开始部署修复 — P0-04 Nginx 8787端口"
echo "=========================================="

# 1. 备份当前 Nginx 配置
echo "[1/5] 备份 Nginx 配置..."
cp /www/server/panel/vhost/nginx/yandao.vip.conf /www/server/panel/vhost/nginx/yandao.vip.conf.bak.$(date +%Y%m%d_%H%M%S)
echo "  备份完成"

# 2. 删除指向 8787 端口的 location 块
echo "[2/5] 修复指向8787的location块..."
# 使用 sed 删除所有指向 127.0.0.1:8787 的 location 块
sed -i '/proxy_pass http:\/\/127.0.0.1:8787/d' /www/server/panel/vhost/nginx/yandao.vip.conf
echo "  已删除8787引用"

# 3. 确保通用 /api/ 块指向 3000
echo "[3/5] 检查 /api/ 通用路由..."
if grep -q "proxy_pass.*:3000" /www/server/panel/vhost/nginx/yandao.vip.conf; then
    echo "  /api/ 已指向 3000"
else
    echo "  WARNING: 未找到指向3000的/api/块，请手动添加"
fi

# 4. 更新代码
echo "[4/5] 拉取最新代码..."
cd /www/xuewaiyu-backend
git pull origin master
npm install
npx prisma db push
pm2 restart xuewaiyu-backend

# 5. 重载 Nginx
echo "[5/5] 重载 Nginx..."
nginx -t && nginx -s reload
echo "  Nginx 重载成功"

echo "=========================================="
echo "  部署修复完成"
echo "  验证：curl https://yandao.vip/api/ai/health"
echo "=========================================="