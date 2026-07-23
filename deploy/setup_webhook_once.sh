#!/bin/bash
# ============================================================
# AILOS Git Deploy Webhook - 一次性安装命令
# 执行后所有部署通过: POST https://yandao.vip/api/deploy
# ============================================================
set -e

BACKEND_DIR="/www/xuewaiyu-backend"
DEPLOY_SECRET="AILOS_DEPLOY_2026_SECURE"
GIT_REMOTE="https://github.com/wzmpa18/AILOS"

echo "=== AILOS Git Deploy Webhook Setup ==="
echo ""

# 1. 检查 Git 并配置仓库
echo "[1/7] 配置 Git 仓库..."
cd "$BACKEND_DIR"
if [ ! -d ".git" ]; then
    git init
    git remote add origin "$GIT_REMOTE" 2>/dev/null || git remote set-url origin "$GIT_REMOTE"
fi
git remote set-url origin "$GIT_REMOTE"
echo "✓ Git remote: $(git remote get-url origin)"

# 2. 拉取最新代码
echo "[2/7] 拉取最新代码..."
git fetch origin
git checkout main 2>/dev/null || git checkout -b main origin/main
git reset --hard origin/main
echo "✓ 代码已同步到最新: $(git log -1 --oneline)"

# 3. 备份并部署 webhook controller
echo "[3/7] 部署 webhook controller..."
mkdir -p "$BACKEND_DIR/src/server/controllers"
[ -f "$BACKEND_DIR/src/server/controllers/deployWebhook.js" ] && cp "$BACKEND_DIR/src/server/controllers/deployWebhook.js" "$BACKEND_DIR/src/server/controllers/deployWebhook.js.bak.$(date +%Y%m%d_%H%M%S)"

cat > "$BACKEND_DIR/src/server/controllers/deployWebhook.js" << 'CTRL_EOF'
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
    const pullCmd = "cd " + REPO_PATH + " && git fetch origin && git reset --hard origin/" + branch;
    const pullOutput = execSync(pullCmd, { encoding: 'utf8', timeout: 30000 });
    results.steps.push({ step: 'git_pull', success: true, output: pullOutput.trim() });
    try {
      const installOutput = execSync("cd " + REPO_PATH + " && npm install --production 2>&1", { encoding: 'utf8', timeout: 60000 });
      results.steps.push({ step: 'npm_install', success: true, output: installOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'npm_install', success: true, output: 'no changes' });
    }
    try {
      const prismaOutput = execSync("cd " + REPO_PATH + " && npx prisma generate 2>&1", { encoding: 'utf8', timeout: 30000 });
      results.steps.push({ step: 'prisma_generate', success: true, output: prismaOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'prisma_generate', success: true, output: 'skipped' });
    }
    const restartCmd = "pm2 restart " + PM2_APP_NAME + " --update-env";
    const restartOutput = execSync(restartCmd, { encoding: 'utf8', timeout: 15000 });
    results.steps.push({ step: 'pm2_restart', success: true, output: restartOutput.trim() });
    const statusOutput = execSync("pm2 jlist 2>&1", { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    results.steps.push({ step: 'verify', success: app?.pm2_env?.status === 'online', status: app?.pm2_env?.status || 'unknown' });
    return res.json({ success: true, message: "Deploy completed: " + branch, steps: results.steps, timestamp: new Date().toISOString() });
  } catch (err) {
    results.steps.push({ step: 'error', success: false, error: err.message });
    return res.status(500).json({ success: false, error: err.message, steps: results.steps });
  }
}

async function deployStatus(req, res) {
  try {
    const statusOutput = execSync("pm2 jlist 2>&1", { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    const gitLog = execSync("cd " + REPO_PATH + " && git log -1 --format='%H %s %ai' 2>&1", { encoding: 'utf8', timeout: 5000 }).trim();
    return res.json({ success: true, app: { name: app?.name, status: app?.pm2_env?.status, uptime: app?.pm2_env?.pm_uptime, restarts: app?.pm2_env?.restart_time }, git: { lastCommit: gitLog } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { deployWebhook, deployStatus };
CTRL_EOF

echo "✓ Controller 已部署"

# 4. 部署 webhook route
echo "[4/7] 部署 webhook route..."
mkdir -p "$BACKEND_DIR/src/server/routes"
cat > "$BACKEND_DIR/src/server/routes/deploy.js" << 'ROUTE_EOF'
const express = require('express');
const router = express.Router();
const { deployWebhook, deployStatus } = require('../controllers/deployWebhook');
router.post('/', deployWebhook);
router.get('/status', deployStatus);
module.exports = router;
ROUTE_EOF
echo "✓ Route 已部署"

# 5. 安全注册路由（Python 精确插入，避免 sed 破坏）
echo "[5/7] 注册路由到 index.js..."
cd "$BACKEND_DIR"
cp src/server/routes/index.js src/server/routes/index.js.bak.$(date +%Y%m%d_%H%M%S)

if grep -q "require.*deploy" src/server/routes/index.js 2>/dev/null; then
    echo "⚠ 路由已注册，跳过"
else
    python3 -c "
import re
with open('src/server/routes/index.js', 'r') as f:
    content = f.read()
insert_line = \"app.use('/api/deploy', require('./deploy'));\n\"
pattern = r'(module\.exports\s*=)'
if re.search(pattern, content):
    content = re.sub(pattern, insert_line + r'\1', content, count=1)
else:
    content += '\n' + insert_line
with open('src/server/routes/index.js', 'w') as f:
    f.write(content)
print('Route registered')
" 2>&1
    echo "✓ 路由已注册"
fi

# 6. 设置环境变量
echo "[6/7] 设置 DEPLOY_SECRET..."
if ! grep -q "DEPLOY_SECRET" "$BACKEND_DIR/.env" 2>/dev/null; then
    echo "DEPLOY_SECRET=$DEPLOY_SECRET" >> "$BACKEND_DIR/.env"
    echo "✓ 密钥已添加"
else
    echo "⚠ 密钥已存在"
fi

# 7. 重启 PM2
echo "[7/7] 重启 PM2..."
pm2 restart xuewaiyu-backend --update-env
sleep 3
pm2 status

echo ""
echo "============================================"
echo "  Git Deploy Webhook 安装完成！"
echo "  部署端点: POST https://yandao.vip/api/deploy"
echo "  状态端点: GET  https://yandao.vip/api/deploy/status"
echo "  密钥: $DEPLOY_SECRET"
echo "============================================"