#!/bin/bash
# ============================================================
# 紧急修复部署脚本 v3.2.0-p3
# 修复内容：CSS孤儿属性 + 缓存版本号 + 链接修复 + 前端强制刷新
# 服务器：82.156.228.87 (腾讯云轻量)
# 部署路径：/www/xuewaiyu-backend (后端) / /www/xuewaiyu (前端)
# ============================================================

set -e

echo "=========================================="
echo "  言道外语 v3.2.0 紧急修复部署"
echo "=========================================="
echo ""

# 1. 进入后端目录
cd /www/xuewaiyu-backend
echo "[1/8] 当前目录: $(pwd)"
echo "      当前Git版本: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# 2. 备份当前代码
echo ""
echo "[2/8] 备份当前代码..."
BACKUP_DIR="/www/backups/pre_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/src_bak" 2>/dev/null || true
cp -r public/ "$BACKUP_DIR/public_bak" 2>/dev/null || true
cp .env.production "$BACKUP_DIR/.env.production.bak" 2>/dev/null || true
echo "      备份完成: $BACKUP_DIR"

# 3. 强制拉取最新代码
echo ""
echo "[3/8] 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "      最新Git版本: $(git rev-parse --short HEAD)"
echo "      最新提交: $(git log --oneline -1)"

# 4. 恢复.env.production（防止被git覆盖）
echo ""
echo "[4/8] 检查.env.production..."
if [ -f "$BACKUP_DIR/.env.production.bak" ]; then
    cp "$BACKUP_DIR/.env.production.bak" .env.production
    echo "      .env.production 已从备份恢复"
fi
# 验证关键配置
if grep -q "请填入" .env.production; then
    echo "      ⚠️ 警告: .env.production 中仍有占位符，请检查TENCENT_SECRET_KEY和SMTP_PASS"
else
    echo "      ✅ .env.production 配置正常"
fi

# 5. 安装依赖
echo ""
echo "[5/8] 安装依赖..."
npm install --production 2>&1 | tail -5
echo "      依赖安装完成"

# 6. 生成Prisma客户端
echo ""
echo "[6/8] 生成Prisma客户端..."
npx prisma generate 2>&1 | tail -3
echo "      Prisma客户端生成完成"

# 7. 同步前端文件到 /www/xuewaiyu
echo ""
echo "[7/8] 同步前端文件..."
if [ -d "/www/xuewaiyu" ]; then
    # 备份当前前端文件
    cp -r /www/xuewaiyu/ "$BACKUP_DIR/xuewaiyu_bak" 2>/dev/null || true
    # 同步最新前端文件
    rsync -av --delete --exclude='.git' public/xuewaiyu/ /www/xuewaiyu/
    rsync -av --delete public/assets/ /www/xuewaiyu/../assets/ 2>/dev/null || true
    echo "      前端文件同步完成"
else
    mkdir -p /www/xuewaiyu
    cp -r public/xuewaiyu/* /www/xuewaiyu/
    echo "      前端文件创建完成"
fi

# 验证关键前端文件
echo "      验证关键文件:"
for f in login.html guest.html home.html translate.html community-friends.html; do
    if [ -f "/www/xuewaiyu/$f" ]; then
        SIZE=$(stat -c%s "/www/xuewaiyu/$f" 2>/dev/null || echo "?")
        echo "        ✅ $f ($SIZE bytes)"
    else
        echo "        ❌ $f 不存在!"
    fi
done

# 8. 重启PM2 + 健康检查
echo ""
echo "[8/8] 重启服务..."
pm2 restart xuewaiyu-backend --update-env
sleep 3

echo ""
echo "=== 健康检查 ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 后端健康检查通过 (HTTP 200)"
else
    echo "❌ 后端健康检查失败 (HTTP $HTTP_CODE)"
    echo "   查看日志: pm2 logs xuewaiyu-backend --lines 50"
fi

# 验证前端页面可访问
echo ""
echo "=== 前端验证 ==="
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://yandao.vip/xuewaiyu/login.html)
echo "登录页: HTTP $LOGIN_CODE"

GUEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://yandao.vip/xuewaiyu/guest.html)
echo "游客页: HTTP $GUEST_CODE"

HOME_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://yandao.vip/xuewaiyu/home.html)
echo "首页:   HTTP $HOME_CODE"

# 验证API端点
echo ""
echo "=== API验证 ==="
SEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://yandao.vip/api/auth/send-code -H "Content-Type: application/json" -d '{"phone":"test"}')
echo "发送验证码API: HTTP $SEND_CODE"

GUEST_API=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://yandao.vip/api/auth/guest -H "Content-Type: application/json" -d '{"deviceId":"test"}')
echo "游客模式API:   HTTP $GUEST_API"

echo ""
echo "=========================================="
echo "  部署完成!"
echo "  Git版本: $(git rev-parse --short HEAD)"
echo "  提交信息: $(git log --oneline -1)"
echo "=========================================="
echo ""
echo "验证步骤:"
echo "  1. 浏览器打开 https://yandao.vip/xuewaiyu/login.html"
echo "  2. 检查鹦鹉头像是否显示"
echo "  3. 切换到注册Tab，填写手机号，点击发送验证码"
echo "  4. 切换到找回密码Tab，测试邮箱找回"
echo "  5. 点击游客模式进入"
echo "  6. APP中关闭重新打开，验证内容更新"
echo ""
echo "如需查看日志: pm2 logs xuewaiyu-backend --lines 100"
echo "如需回滚: 恢复 $BACKUP_DIR 目录"
