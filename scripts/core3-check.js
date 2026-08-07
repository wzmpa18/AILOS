/**
 * core3-check.js — P0 地基三核心场景轻量验证
 *
 * 定位：本地只做「逻辑正确性」轻量验证，集成/全链路验证全部放服务器执行。
 * 场景：
 *   1) 权限 403 —— 非管理员访问 /api/feedback/list 必须 403
 *   2) 黑名单   —— 注销后签发时间早于吊销时刻的 token 必须 401
 *   3) 限流     —— 同 IP 1 分钟内第 4 次反馈提交必须 429
 *
 * 依赖策略：只 mock redis / prisma 底层，中间件与路由为真实代码。
 */

const path = require('path');
const Module = require('module');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'core3-test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://u:p@127.0.0.1:5432/t';
process.env.HUNYUAN_API_KEY = process.env.HUNYUAN_API_KEY || 'test';
process.env.ADMIN_USER_IDS = 'admin-uid-1';
delete process.env.AUTH_FAIL_OPEN;

const ROOT = path.join(__dirname, '..');

// ---------- mock 基础设施 ----------
const redisStore = new Map();
const redisMock = {
  async exists(k) { return redisStore.has(k) ? 1 : 0; },
  async get(k) { return redisStore.has(k) ? redisStore.get(k) : null; },
  async set(k, v) { redisStore.set(k, String(v)); return 'OK'; },
  async setex(k, _ttl, v) { redisStore.set(k, String(v)); return 'OK'; },
  async del(k) { return redisStore.delete(k) ? 1 : 0; },
  async incr(k) { const n = Number(redisStore.get(k) || 0) + 1; redisStore.set(k, String(n)); return n; },
  async expire() { return 1; },
  async pexpire() { return 1; },
  async ttl() { return 60; },
  async zadd() { return 1; },
  async zremrangebyscore() { return 0; },
  async zcard() { return 0; },
  multi() {
    const ops = [];
    const chain = {
      incr(k) { ops.push(['incr', k]); return chain; },
      expire() { ops.push(['expire']); return chain; },
      pexpire() { ops.push(['pexpire']); return chain; },
      async exec() {
        const out = [];
        for (const [op, k] of ops) {
          if (op === 'incr') { const n = Number(redisStore.get(k) || 0) + 1; redisStore.set(k, String(n)); out.push([null, n]); }
          else out.push([null, 1]);
        }
        return out;
      },
    };
    return chain;
  },
  status: 'ready',
  on() {},
};

const users = new Map();
const prismaMock = new Proxy({
  async $transaction(arg) {
    if (typeof arg === 'function') return arg(prismaMock);
    return Promise.all(arg);
  },
  $connect: async () => {},
  $disconnect: async () => {},
  user: {
    async findUnique({ where }) { return users.get(where.id) || null; },
    async update({ where, data }) { const u = users.get(where.id) || { id: where.id }; Object.assign(u, data); users.set(where.id, u); return u; },
    async findFirst() { return null; },
  },
}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    // 任意未定义模型 → 返回空实现，避免 mock 缺表导致 500
    return new Proxy({}, {
      get() {
        return async (args) => {
          if (args && args.where && !args.data) return null;
          return [];
        };
      },
    });
  },
});

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const resolvedish = request.replace(/\\/g, '/');
  if (/config\/redis$/.test(resolvedish)) return redisMock;
  if (/config\/database$/.test(resolvedish)) return prismaMock;
  if (request === 'ioredis') {
    return function Redis() { return redisMock; };
  }
  if (request === '@prisma/client') {
    return { PrismaClient: function () { return prismaMock; } };
  }
  return originalLoad.apply(this, arguments);
};

// ---------- 构建真实 Express 应用 ----------
const express = require(path.join(ROOT, 'node_modules', 'express'));
const jwt = require(path.join(ROOT, 'node_modules', 'jsonwebtoken'));

const routes = require(path.join(ROOT, 'src/server/routes'));

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api', routes);
app.use((err, req, res, _next) => {
  res.status(500).json({ success: false, error: err.message });
});

const http = require('http');
const server = http.createServer(app);

function request(method, urlPath, { token, body, ip } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};
    if (token) headers.authorization = `Bearer ${token}`;
    if (payload) { headers['content-type'] = 'application/json'; headers['content-length'] = Buffer.byteLength(payload); }
    if (ip) headers['x-forwarded-for'] = ip;
    const req = http.request({ host: '127.0.0.1', port: server.address().port, method, path: urlPath, headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sign(userId, iatSec) {
  const iat = iatSec || Math.floor(Date.now() / 1000);
  return jwt.sign({ userId, iat }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  // 场景 1：权限 403 —— 普通用户访问管理员接口
  {
    const uid = 'normal-uid-1';
    users.set(uid, { id: uid, isActive: true, status: 'active', role: 'user' });
    const res = await request('GET', '/api/feedback/list', { token: sign(uid) });
    check('S1 权限403 非管理员访问 /api/feedback/list', res.status === 403, `status=${res.status} body=${res.body.slice(0, 160)}`);
  }

  // 场景 2：黑名单 —— 注销后旧 token 必须 401
  {
    const uid = 'revoked-uid-1';
    users.set(uid, { id: uid, isActive: true, status: 'active' });
    const oldIat = Math.floor(Date.now() / 1000) - 600;
    const oldToken = sign(uid, oldIat);
    // 模拟注销：写用户级吊销标记（吊销时刻 = 现在）
    redisStore.set(`blacklist:uid:${uid}`, String(Math.floor(Date.now() / 1000)));
    const res = await request('GET', '/api/feedback/list', { token: oldToken });
    check('S2 黑名单 注销后旧token失效', res.status === 401, `status=${res.status} body=${res.body.slice(0, 160)}`);
  }

  // 场景 3：限流 —— 同 IP 1 分钟内第 4 次反馈提交 429
  {
    const uid = 'rl-uid-1';
    users.set(uid, { id: uid, isActive: true, status: 'active' });
    const token = sign(uid);
    const ip = '203.0.113.77';
    let last = null;
    const codes = [];
    for (let i = 0; i < 4; i++) {
      last = await request('POST', '/api/feedback/', { token, ip, body: { type: 'bug', content: `压力测试内容 ${i} ${'x'.repeat(20)}` } });
      codes.push(last.status);
    }
    check('S3 限流 同IP 1分钟第4次反馈429', last.status === 429, `codes=${codes.join(',')} body=${String(last.body).slice(0, 160)}`);
  }

  server.close();

  const lines = [];
  lines.push('===== P0 三核心场景轻量验证 =====');
  let passCount = 0;
  for (const r of results) {
    if (r.pass) passCount++;
    lines.push(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}\n      ${r.detail}`);
  }
  lines.push(`\n结果: ${passCount}/${results.length} PASS`);
  lines.push('说明: 集成/全链路验证在服务器执行，本地仅做逻辑轻量校验。');
  const out = lines.join('\n');
  require('fs').writeFileSync(path.join(ROOT, '..', '_core3_out.txt'), out, 'utf8');
  process.exit(passCount === results.length ? 0 : 1);
})().catch((e) => {
  require('fs').writeFileSync(path.join(ROOT, '..', '_core3_out.txt'), 'FATAL: ' + (e && e.stack || e), 'utf8');
  process.exit(1);
});
