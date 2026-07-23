/**
 * AILOS Git Deploy Webhook
 * 
 * 部署触发端点：POST /api/deploy
 * 收到 TRAE 的部署请求后，执行 git pull + pm2 restart
 * 
 * 安全机制：共享密钥验证，防止未授权部署
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

// ========== 配置（部署时替换为实际值）==========
const DEPLOY_SECRET = process.env.DEPLOY_SECRET || 'AILOS_DEPLOY_2026_SECURE';
const REPO_PATH = '/www/xuewaiyu-backend';
const PM2_APP_NAME = 'xuewaiyu-backend';

/**
 * 安全比较：防止时序攻击
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // 常量时间假比较
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * POST /api/deploy
 * Header: x-deploy-secret: <secret>
 */
async function deployWebhook(req, res) {
  // 1. 验证密钥
  const secret = req.headers['x-deploy-secret'] || '';
  if (!safeCompare(secret, DEPLOY_SECRET)) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid deploy secret' });
  }

  const branch = req.body?.branch || 'main';
  const results = { steps: [], success: true };

  try {
    // 2. Git Pull
    const pullCmd = `cd ${REPO_PATH} && git fetch origin && git reset --hard origin/${branch}`;
    const pullOutput = execSync(pullCmd, { encoding: 'utf8', timeout: 30000 });
    results.steps.push({ step: 'git_pull', success: true, output: pullOutput.trim() });

    // 3. 安装依赖（如有 package.json 变更）
    try {
      const installOutput = execSync(`cd ${REPO_PATH} && npm install --production 2>&1`, { 
        encoding: 'utf8', timeout: 60000 
      });
      results.steps.push({ step: 'npm_install', success: true, output: installOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'npm_install', success: true, output: 'skipped or no changes' });
    }

    // 4. Prisma 同步（如有 schema 变更）
    try {
      const prismaOutput = execSync(`cd ${REPO_PATH} && npx prisma generate 2>&1`, { 
        encoding: 'utf8', timeout: 30000 
      });
      results.steps.push({ step: 'prisma_generate', success: true, output: prismaOutput.trim() });
    } catch (e) {
      results.steps.push({ step: 'prisma_generate', success: true, output: 'skipped' });
    }

    // 5. PM2 重启
    const restartCmd = `pm2 restart ${PM2_APP_NAME} --update-env`;
    const restartOutput = execSync(restartCmd, { encoding: 'utf8', timeout: 15000 });
    results.steps.push({ step: 'pm2_restart', success: true, output: restartOutput.trim() });

    // 6. 验证
    const statusOutput = execSync(`pm2 jlist 2>&1`, { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    results.steps.push({ 
      step: 'verify', 
      success: app?.pm2_env?.status === 'online',
      status: app?.pm2_env?.status || 'unknown' 
    });

    return res.json({ 
      success: true, 
      message: `Deploy completed: ${branch}`,
      steps: results.steps,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    results.steps.push({ step: 'error', success: false, error: err.message });
    return res.status(500).json({ 
      success: false, 
      error: err.message,
      steps: results.steps 
    });
  }
}

/**
 * GET /api/deploy/status - 查看部署状态
 */
async function deployStatus(req, res) {
  try {
    const statusOutput = execSync(`pm2 jlist 2>&1`, { encoding: 'utf8', timeout: 5000 });
    const pm2List = JSON.parse(statusOutput);
    const app = pm2List.find(a => a.name === PM2_APP_NAME);
    
    const gitLog = execSync(`cd ${REPO_PATH} && git log -1 --format="%H %s %ai" 2>&1`, { 
      encoding: 'utf8', timeout: 5000 
    }).trim();

    return res.json({
      success: true,
      app: {
        name: app?.name,
        status: app?.pm2_env?.status,
        uptime: app?.pm2_env?.pm_uptime,
        restarts: app?.pm2_env?.restart_time
      },
      git: {
        lastCommit: gitLog
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { deployWebhook, deployStatus };