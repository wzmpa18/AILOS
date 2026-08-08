#!/bin/bash
# ============================================================
# 部署脚本：修复登录页导航遮挡+好友页空白+默认头像+APP下载入口
# 版本：v20260808p5
# 服务器：82.156.228.87
# 后端路径：/www/xuewaiyu-backend
# 前端路径：/www/xuewaiyu
# ============================================================

set -e

echo "=========================================="
echo "  言道学外语 v20260808p5 部署脚本"
echo "=========================================="
echo ""

# 1. 进入后端目录
cd /www/xuewaiyu-backend
echo "[1/9] 当前目录: $(pwd)"
echo "      当前Git版本: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# 2. 备份当前代码
echo ""
echo "[2/9] 备份当前代码..."
BACKUP_DIR="/www/backups/pre_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/ "$BACKUP_DIR/src_bak" 2>/dev/null || true
cp -r public/ "$BACKUP_DIR/public_bak" 2>/dev/null || true
cp .env.production "$BACKUP_DIR/.env.production.bak" 2>/dev/null || true
echo "      备份完成: $BACKUP_DIR"

# 3. 强制拉取最新代码
echo ""
echo "[3/9] 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "      最新Git版本: $(git rev-parse --short HEAD)"
echo "      最新提交: $(git log --oneline -1)"

# 4. 安装依赖（如有变更）
echo ""
echo "[4/9] 检查依赖..."
npm install --production 2>&1 | tail -3

# 5. 生成Prisma客户端
echo ""
echo "[5/9] 生成Prisma客户端..."
npx prisma generate 2>&1 | tail -3

# 6. 复制前端静态资源到Nginx目录
echo ""
echo "[6/9] 同步前端静态资源到 /www/xuewaiyu/ ..."
# 复制所有前端文件
cp -rf public/xuewaiyu/* /www/xuewaiyu/
# 复制assets目录（含parrot_logo.png）
mkdir -p /www/xuewaiyu/assets/images/
cp -f public/assets/images/parrot_logo.png /www/xuewaiyu/assets/images/ 2>/dev/null || true
cp -f public/assets/images/default_avatar.png /www/xuewaiyu/assets/images/ 2>/dev/null || true
# 确保download目录存在且APK已复制
mkdir -p /www/xuewaiyu/download/
cp -f public/xuewaiyu/download/yandao_learn_v3.2.0_release.apk /www/xuewaiyu/download/ 2>/dev/null || true
# 确保images目录存在
mkdir -p /www/xuewaiyu/assets/images/
cp -f public/xuewaiyu/assets/images/parrot_logo.png /www/xuewaiyu/assets/images/ 2>/dev/null || true
echo "      前端资源同步完成"
echo "      验证关键文件:"
ls -la /www/xuewaiyu/login.html 2>/dev/null && echo "      ✓ login.html" || echo "      ✗ login.html 缺失"
ls -la /www/xuewaiyu/community-friends.html 2>/dev/null && echo "      ✓ community-friends.html" || echo "      ✗ community-friends.html 缺失"
ls -la /www/xuewaiyu/profile.html 2>/dev/null && echo "      ✓ profile.html" || echo "      ✗ profile.html 缺失"
ls -la /www/xuewaiyu/landing.html 2>/dev/null && echo "      ✓ landing.html" || echo "      ✗ landing.html 缺失"
ls -la /www/xuewaiyu/assets/images/parrot_logo.png 2>/dev/null && echo "      ✓ parrot_logo.png" || echo "      ✗ parrot_logo.png 缺失"
ls -la /www/xuewaiyu/download/yandao_learn_v3.2.0_release.apk 2>/dev/null && echo "      ✓ APK下载文件" || echo "      ✗ APK下载文件缺失"
ls -la /www/xuewaiyu/assets/common.js 2>/dev/null && echo "      ✓ common.js" || echo "      ✗ common.js 缺失"

# 7. 重启后端服务
echo ""
echo "[7/9] 重启后端服务..."
pm2 restart xuewaiyu-backend --update-env
sleep 2

# 8. 健康检查
echo ""
echo "[8/9] 健康检查..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH" = "200" ]; then
  echo "      ✓ 后端健康检查通过 (HTTP 200)"
else
  echo "      ✗ 后端健康检查失败 (HTTP $HEALTH)"
  echo "      查看日志: pm2 logs xuewaiyu-backend --lines 20"
fi

# 9. 前端页面验证
echo ""
echo "[9/9] 前端页面验证..."
for page in login.html community-friends.html profile.html landing.html guest.html home.html; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/xuewaiyu/$page")
  if [ "$CODE" = "200" ]; then
    echo "      ✓ $page (HTTP 200)"
  else
    echo "      ✗ $page (HTTP $CODE)"
  fi
done

# APK下载验证
APK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/xuewaiyu/download/yandao_learn_v3.2.0_release.apk")
if [ "$APK_CODE" = "200" ]; then
  echo "      ✓ APK下载 (HTTP 200)"
else
  echo "      ✗ APK下载 (HTTP $APK_CODE)"
fi

# 鹦鹉头像验证
AVATAR_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/xuewaiyu/assets/images/parrot_logo.png")
if [ "$AVATAR_CODE" = "200" ]; then
  echo "      ✓ 鹦鹉头像图片 (HTTP 200)"
else
  echo "      ✗ 鹦鹉头像图片 (HTTP $AVATAR_CODE)"
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "验证地址："
echo "  公司首页:  https://yandao.vip/xuewaiyu/landing.html"
echo "  登录页:    https://yandao.vip/xuewaiyu/login.html"
echo "  好友页:    https://yandao.vip/xuewaiyu/community-friends.html"
echo "  个人中心:  https://yandao.vip/xuewaiyu/profile.html"
echo "  APP下载:   https://yandao.vip/xuewaiyu/download/yandao_learn_v3.2.0_release.apk"
echo "  网页版:    https://yandao.vip/xuewaiyu/home"
echo ""
echo "本次修复内容："
echo "  1. 登录/注册页底部导航遮挡提交按钮 → 已修复"
echo "  2. 好友页面空白 → 已修复(API路径+空状态)"
echo "  3. 默认头像未显示鹦鹉logo → 已修复"
echo "  4. APP下载入口 → 已添加到landing页面"
echo "  5. 网页版入口 → 已添加到landing页面"
echo "  6. common.js缓存版本 → 已更新到v20260808p5"
echo ""
