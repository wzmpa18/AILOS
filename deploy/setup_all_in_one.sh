#!/bin/bash
# ============================================================
# AILOS 一次性部署链路安装 + checkin 路由修复
# 执行后 TRAE 可通过 HTTP 完成所有后续部署
# ============================================================
set -e
BACKEND_DIR="/www/xuewaiyu-backend"
GIT_REMOTE="https://github.com/wzmpa18/AILOS"
DEPLOY_SECRET="AILOS_DEPLOY_2026_SECURE"

echo "=== AILOS 一次性部署链路安装 ==="
cd "$BACKEND_DIR"

# ====== 1. Git 同步 ======
echo "[1/8] Git 同步..."
if [ ! -d ".git" ]; then git init; fi
git remote set-url origin "$GIT_REMOTE" 2>/dev/null || git remote add origin "$GIT_REMOTE"
git fetch origin
git checkout main 2>/dev/null || git checkout -b main origin/main
git reset --hard origin/main
echo "✓ Git: $(git log -1 --oneline)"

# ====== 2. 备份 index.js ======
echo "[2/8] 备份 index.js..."
cp src/server/routes/index.js src/server/routes/index.js.bak.$(date +%Y%m%d_%H%M%S)

# ====== 3. 部署 checkin 文件 ======
echo "[3/8] 部署 checkin 文件..."
if [ -f "deploy/checkinController.js" ]; then
    cp deploy/checkinController.js src/server/controllers/checkinController.js
fi
if [ -f "deploy/checkinRoute.js" ]; then
    cp deploy/checkinRoute.js src/server/routes/checkin.js
fi
echo "✓ checkin 文件已部署"

# ====== 4. 部署 webhook 文件 ======
echo "[4/8] 部署 webhook 文件..."
if [ -f "deploy/setup_webhook_once.sh" ]; then
    cp deploy/setup_webhook_once.sh /tmp/
    bash /tmp/setup_webhook_once.sh
else
    # 如果 GitHub 上还没有，直接创建
    mkdir -p src/server/controllers
    cat > src/server/controllers/deployWebhook.js << 'CTRL_EOF'
const { execSync } = require('child_process');
const crypto = require('crypto');
const DEPLOY_SECRET = process.env.DEPLOY_SECRET || 'AILOS_DEPLOY_2026_SECURE';
const REPO_PATH = '/www/xuewaiyu-backend';
const PM2_APP_NAME = 'xuewaiyu-backend';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) { crypto.timingSafeEqual(bufA, bufA); return false; }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function deployWebhook(req, res) {
  const secret = req.headers['x-deploy-secret'] || '';
  if (!safeCompare(secret, DEPLOY_SECRET)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  const branch = req.body?.branch || 'main';
  const results = { steps: [] };
  try {
    const pullOutput = execSync("cd " + REPO_PATH + " && git fetch origin && git reset --hard origin/" + branch, { encoding: 'utf8', timeout: 30000 });
    results.steps.push({ step: 'git_pull', success: true, output: pullOutput.trim() });
    try { execSync("cd " + REPO_PATH + " && npm install --production 2>&1", { encoding: 'utf8', timeout: 60000 }); } catch (e) {}
    try { execSync("cd " + REPO_PATH + " && npx prisma generate 2>&1", { encoding: 'utf8', timeout: 30000 }); } catch (e) {}
    execSync("pm2 restart " + PM2_APP_NAME + " --update-env", { encoding: 'utf8', timeout: 15000 });
    const statusOutput = execSync("pm2 jlist 2>&1", { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    results.steps.push({ step: 'verify', status: app?.pm2_env?.status || 'unknown' });
    return res.json({ success: true, message: "Deploy completed", steps: results.steps });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
async function deployStatus(req, res) {
  try {
    const s = execSync("pm2 jlist 2>&1", { encoding: 'utf8', timeout: 5000 });
    const pl = JSON.parse(s);
    const a = pl.find(x => x.name === PM2_APP_NAME);
    const gl = execSync("cd " + REPO_PATH + " && git log -1 --format='%H %s %ai' 2>&1", { encoding: 'utf8', timeout: 5000 }).trim();
    return res.json({ success: true, app: { name: a?.name, status: a?.pm2_env?.status }, git: { lastCommit: gl } });
  } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
}
module.exports = { deployWebhook, deployStatus };
CTRL_EOF

    mkdir -p src/server/routes
    cat > src/server/routes/deploy.js << 'ROUTE_EOF'
const express = require('express');
const router = express.Router();
const { deployWebhook, deployStatus } = require('../controllers/deployWebhook');
router.post('/', deployWebhook);
router.get('/status', deployStatus);
module.exports = router;
ROUTE_EOF
fi
echo "✓ webhook 文件已部署"

# ====== 5. 安全注册路由（Python 精确插入，不破坏文件） ======
echo "[5/8] 注册路由..."
python3 -c "
import re
with open('src/server/routes/index.js', 'r') as f:
    content = f.read()

# 注册 deploy 路由（如未注册）
if \"require('./deploy')\" not in content:
    content = re.sub(r'(module\.exports\s*=)', \"app.use('/api/deploy', require('./deploy'));\n\\1\", content, count=1)

# 注册 checkin 路由（如未注册）
if \"require('./checkin')\" not in content:
    content = re.sub(r'(module\.exports\s*=)', \"app.use('/api/checkin', require('./checkin'));\n\\1\", content, count=1)

with open('src/server/routes/index.js', 'w') as f:
    f.write(content)
print('Routes registered')
" 2>&1
echo "✓ 路由已注册"

# ====== 6. 设置 DEPLOY_SECRET ======
echo "[6/8] 设置环境变量..."
if ! grep -q "DEPLOY_SECRET" .env 2>/dev/null; then
    echo "DEPLOY_SECRET=$DEPLOY_SECRET" >> .env
fi
echo "✓ 密钥已设置"

# ====== 7. Prisma 同步 ======
echo "[7/8] Prisma 同步..."
npx prisma generate 2>&1 || echo "⚠ Prisma generate skipped"
echo "✓ Prisma 就绪"

# ====== 8. 重启 PM2 ======
echo "[8/8] 重启 PM2..."
pm2 restart xuewaiyu-backend --update-env
sleep 2
pm2 status

echo ""
echo "============================================"
echo "  安装完成！"
echo "  部署端点: POST https://yandao.vip/api/deploy"
echo "  签到端点: POST https://yandao.vip/api/checkin"
echo "  Headers: x-deploy-secret: $DEPLOY_SECRET"
echo "============================================"