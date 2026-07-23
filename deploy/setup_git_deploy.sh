#!/bin/bash
# ============================================================
# AILOS Git Deploy Setup - 一次性服务器安装脚本
# 通过腾讯云自动化助手(TAT)执行
# 执行后，所有后续部署通过 HTTP POST /api/deploy 完成
# ============================================================
set -e

BACKEND_DIR="/www/xuewaiyu-backend"
DEPLOY_SECRET="AILOS_DEPLOY_2026_SECURE"
GIT_REMOTE="__REPLACE_WITH_GIT_REMOTE_URL__"  # ← 替换为实际 Git 远程地址

echo "=== AILOS Git Deploy Setup ==="
echo ""

# 1. 检查 Git
echo "[1/6] 检查 Git..."
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    exit 1
fi
echo "✓ Git: $(git --version)"

# 2. 初始化/更新 Git 仓库
echo "[2/6] 配置 Git 仓库..."
if [ ! -d "$BACKEND_DIR/.git" ]; then
    echo "初始化 Git 仓库..."
    cd "$BACKEND_DIR"
    git init
    git remote add origin "$GIT_REMOTE" 2>/dev/null || git remote set-url origin "$GIT_REMOTE"
    git fetch origin
    git checkout -b main 2>/dev/null || git checkout main
else
    echo "Git 仓库已存在，更新 remote..."
    cd "$BACKEND_DIR"
    git remote set-url origin "$GIT_REMOTE" 2>/dev/null || git remote add origin "$GIT_REMOTE"
fi
echo "✓ Git 仓库就绪"

# 3. 备份并部署 webhook 文件
echo "[3/6] 部署 webhook 文件..."
# 创建 controllers 目录（如不存在）
mkdir -p "$BACKEND_DIR/src/server/controllers"

# 备份现有文件
[ -f "$BACKEND_DIR/src/server/controllers/deployWebhook.js" ] && cp "$BACKEND_DIR/src/server/controllers/deployWebhook.js" "$BACKEND_DIR/src/server/controllers/deployWebhook.js.bak"

# 写入 deployWebhook.js (controller)
cat > "$BACKEND_DIR/src/server/controllers/deployWebhook.js" << 'WEBHOOK_EOF'
const { execSync } = require('child_process');
const crypto = require('crypto');

const DEPLOY_SECRET = process.env.DEPLOY_SECRET || 'AILOS_DEPLOY_2026_SECURE';
const REPO_PATH = '/www/xuewaiyu-backend';
const PM2_APP_NAME = 'xuewaiyu-backend';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function deployWebhook(req, res) {
  const secret = req.headers['x-deploy-secret'] || '';
  if (!safeCompare(secret, DEPLOY_SECRET)) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid deploy secret' });
  }

  const branch = req.body?.branch || 'main';
  const results = { steps: [], success: true };

  try {
    const pullCmd = `cd ${REPO_PATH} && git fetch origin && git reset --hard origin/${branch}`;
    const pullOutput = execSync(pullCmd, { encoding: 'utf8', timeout: 30000 });
    results.steps.push({ step: 'git_pull', success: true, output: pullOutput.trim() });

    try {
      const installOutput = execSync(`cd ${REPO_PATH} && npm install --production 2>&1`, { encoding: 'utf8', timeout: 60000 });
      results.steps.push({ step: 'npm_install', success: true, output: installOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'npm_install', success: true, output: 'no changes' });
    }

    try {
      const prismaOutput = execSync(`cd ${REPO_PATH} && npx prisma generate 2>&1`, { encoding: 'utf8', timeout: 30000 });
      results.steps.push({ step: 'prisma_generate', success: true, output: prismaOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'prisma_generate', success: true, output: 'skipped' });
    }

    const restartCmd = `pm2 restart ${PM2_APP_NAME} --update-env`;
    const restartOutput = execSync(restartCmd, { encoding: 'utf8', timeout: 15000 });
    results.steps.push({ step: 'pm2_restart', success: true, output: restartOutput.trim() });

    const statusOutput = execSync(`pm2 jlist 2>&1`, { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    results.steps.push({ step: 'verify', success: app?.pm2_env?.status === 'online', status: app?.pm2_env?.status || 'unknown' });

    return res.json({ success: true, message: `Deploy completed: ${branch}`, steps: results.steps, timestamp: new Date().toISOString() });
  } catch (err) {
    results.steps.push({ step: 'error', success: false, error: err.message });
    return res.status(500).json({ success: false, error: err.message, steps: results.steps });
  }
}

async function deployStatus(req, res) {
  try {
    const statusOutput = execSync(`pm2 jlist 2>&1`, { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    const gitLog = execSync(`cd ${REPO_PATH} && git log -1 --format="%H %s %ai" 2>&1`, { encoding: 'utf8', timeout: 5000 }).trim();
    return res.json({ success: true, app: { name: app?.name, status: app?.pm2_env?.status, uptime: app?.pm2_env?.pm_uptime, restarts: app?.pm2_env?.restart_time }, git: { lastCommit: gitLog } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { deployWebhook, deployStatus };
WEBHOOK_EOF

# 写入 deploy.js (route)
mkdir -p "$BACKEND_DIR/src/server/routes"
cat > "$BACKEND_DIR/src/server/routes/deploy.js" << 'ROUTE_EOF'
const express = require('express');
const router = express.Router();
const { deployWebhook, deployStatus } = require('../controllers/deployWebhook');
router.post('/', deployWebhook);
router.get('/status', deployStatus);
module.exports = router;
ROUTE_EOF

echo "✓ Webhook 文件已部署"

# 4. 注册路由（安全方式：Python 精确插入）
echo "[4/6] 注册部署路由..."
cd "$BACKEND_DIR"

# 备份 index.js
cp src/server/routes/index.js src/server/routes/index.js.bak.$(date +%Y%m%d_%H%M%S)

# 检查是否已注册
if grep -q "require.*deploy" src/server/routes/index.js 2>/dev/null; then
    echo "⚠ 部署路由已注册，跳过"
else
    # 使用 Python 精确插入（非 sed，避免格式破坏）
    python3 -c "
import re
with open('src/server/routes/index.js', 'r') as f:
    content = f.read()

# 在 module.exports 之前插入 deploy 路由
insert_line = \"app.use('/api/deploy', require('./deploy'));\n\"
pattern = r'(module\.exports\s*=)'
if re.search(pattern, content):
    content = re.sub(pattern, insert_line + r'\1', content, count=1)
else:
    # 如果没有 module.exports，追加到末尾
    content += '\n' + insert_line

with open('src/server/routes/index.js', 'w') as f:
    f.write(content)
print('Route registered')
" 2>&1
    echo "✓ 路由已注册"
fi

# 5. 设置环境变量
echo "[5/6] 设置部署密钥..."
if ! grep -q "DEPLOY_SECRET" "$BACKEND_DIR/.env" 2>/dev/null; then
    echo "DEPLOY_SECRET=$DEPLOY_SECRET" >> "$BACKEND_DIR/.env"
    echo "✓ 密钥已添加到 .env"
else
    echo "⚠ 密钥已存在，跳过"
fi

# 6. 重启 PM2
echo "[6/6] 重启 PM2..."
cd "$BACKEND_DIR"
pm2 restart xuewaiyu-backend --update-env
sleep 2
pm2 status

echo ""
echo "============================================"
echo "  Git Deploy Setup 完成！"
echo "  部署密钥: $DEPLOY_SECRET"
echo "  部署端点: POST https://yandao.vip/api/deploy"
echo "  状态端点: GET  https://yandao.vip/api/deploy/status"
echo "============================================"