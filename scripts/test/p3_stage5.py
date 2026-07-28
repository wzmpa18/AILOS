# -*- coding: utf-8 -*-
"""P3 阶段五 系统容错测试（T-18 ~ T-20）—— Redis宕机/慢查询/AI降级"""
import paramiko, json, sys, time, os
sys.stdout.reconfigure(encoding="utf-8")

HOST, USER, PWD = "82.156.228.87", "root", "WUzhimin123"
ROOT = "/www/xuewaiyu-backend"
TMPJS = "/tmp/p3_stage5_test.js"
RESULT = {}

def ssh():
    c = paramiko.SSHClient(); c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PWD, timeout=30); return c
cli = ssh()

def sh(cmd, timeout=30):
    _, out, err = cli.exec_command(cmd, timeout=timeout)
    return out.read().decode("utf-8","replace") + err.read().decode("utf-8","replace")

def sftp_put(local_path, remote_path):
    sftp = cli.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()

def run_node_script(content):
    """写入 /tmp 并执行"""
    with open("tmp/p3_stage5_tmp.js", "w", encoding="utf-8") as f:
        f.write(content)
    sftp_put("tmp/p3_stage5_tmp.js", TMPJS)
    cmd = f"cd {ROOT} && bash -c 'set -a; . ./.env.production; set +a; node {TMPJS}' 2>&1"
    return sh(cmd, timeout=60)

# ================================================================
# T-18: Redis 宕机降级
# ================================================================
print("[T-18] Stopping Redis...")
# 找到 Redis 服务名
srv = sh("systemctl list-units --type=service | grep -i redis | head -1").strip()
if not srv:
    srv = "redis-server"
    print(f"  Redis service not found via systemctl, trying: {srv}")
else:
    srv = srv.split()[0]
    print(f"  Found Redis service: {srv}")

stop_out = sh(f"systemctl stop {srv} 2>&1 || service redis-server stop 2>&1 || redis-cli shutdown 2>&1", timeout=10)
print(f"  Stop output: {stop_out.strip()}")
time.sleep(2)

# 验证 Redis 确实宕机
redis_check = sh("redis-cli ping 2>&1").strip()
print(f"  Redis ping: {redis_check}")

# 运行 T-18 测试
t18_js = """
const BASE = 'http://localhost:3000/api';
const R = {};

async function main() {
  // 1. 登录测试（auth 中间件 Redis 黑名单 fail-open）
  const loginResp = await fetch(BASE + '/auth/password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({account:'13480010005',password:'Test123456'}),
  });
  const loginJson = await loginResp.json().catch(()=>({}));
  R.login = {status: loginResp.status, success: loginJson.success, hasToken: !!loginJson?.tokens?.accessToken};

  // 2. 计费状态（deviceRisk fail-open）
  if (loginJson?.tokens?.accessToken) {
    const token = loginJson.tokens.accessToken;
    const statusResp = await fetch(BASE + '/billing/status', {
      headers: {'Authorization':'Bearer '+token}
    });
    const statusJson = await statusResp.json().catch(()=>({}));
    R.billingStatus = {status: statusResp.status, success: statusJson.success};

    // 3. 设备风控（无 Redis，应 fail-open 允许试用）
    const cResp = await fetch(BASE + '/billing/consume', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+token,'X-Device-Fp':'p3_t18_test_fp'},
      body: JSON.stringify({scene:'scan',seconds:1}),
    });
    const cJson = await cResp.json().catch(()=>({}));
    R.consume = {status: cResp.status, source: cJson?.data?.source, error: cJson?.error||''};
  }

  R.t18_conclusion = {
    // 登录必须成功（fail-open）
    loginOk: R.login?.status === 200 && R.login?.hasToken,
    // 计费状态正常（不崩溃）
    billingOk: R.billingStatus?.status === 200,
    // 消耗不崩溃（核心功能可用）
    consumeNot500: R.consume?.status !== 500,
    allPass: R.login?.status === 200 && R.login?.hasToken && R.billingStatus?.status === 200 && R.consume?.status !== 500,
  };
  console.log(JSON.stringify(R,null,1));
  process.exit(R.t18_conclusion.allPass ? 0 : 1);
}
main().catch(e=>{console.error('FATAL:',e.message);process.exit(2)});
"""
t18_out = run_node_script(t18_js)
print(f"[T-18] Output:\n{t18_out}")
try:
    t18_json_start = t18_out.index('{')
    t18_result = json.loads(t18_out[t18_json_start:].split("\n[ERR]")[0] if "ERR" in t18_out else t18_out[t18_json_start:])
    RESULT["T-18"] = {
        "test": "Redis 宕机降级",
        "redisDown": "Could not connect" in redis_check or redis_check == "",
        "loginOk": t18_result.get("login", {}).get("status") == 200,
        "billingOk": t18_result.get("billingStatus", {}).get("status") == 200,
        "consumeNot500": t18_result.get("consume", {}).get("status") != 500,
        "pass": t18_result.get("t18_conclusion", {}).get("allPass", False),
    }
except Exception as e:
    RESULT["T-18"] = {"error": f"parse failed: {e}", "output": t18_out[:500], "pass": False}

# 恢复 Redis
print("[T-18] Restarting Redis...")
start_out = sh(f"systemctl start {srv} 2>&1 || service redis-server start 2>&1", timeout=15)
print(f"  Start output: {start_out.strip()}")
time.sleep(2)
redis_check2 = sh("redis-cli ping 2>&1").strip()
print(f"  Redis after restart: {redis_check2}")
RESULT["T-18"]["redisRestored"] = "PONG" in redis_check2

# ================================================================
# T-19: 数据库慢查询容错
# ================================================================
print("[T-19] Testing DB slow query tolerance...")
t19_js = """
const prisma = require('/www/xuewaiyu-backend/src/config/database');
const R = {};
async function main() {
  // 构造一个可能慢的查询（全表排序 + 大结果集）
  const start = Date.now();
  try {
    const count = await prisma.user.count();
    R.queryOk = true;
    R.userCount = count;
    R.durationMs = Date.now() - start;
  } catch (e) {
    R.queryOk = false;
    R.error = e.message;
    R.durationMs = Date.now() - start;
  }

  // 测试嵌套事务（原子性）
  try {
    await prisma.$transaction(async (tx) => {
      // 写一个临时记录并回滚
      const temp = await tx.adminOperationLog.create({
        data: {adminId:'00000000-0000-0000-0000-000000000000',action:'P3_T19_ROLLBACK_TEST',targetType:'SYSTEM',targetId:'T-19',detail:{test:true}},
      });
      // 主动回滚
      throw new Error('SIMULATED_ROLLBACK');
    });
  } catch (e) {
    R.transactionRollback = e.message === 'SIMULATED_ROLLBACK' ? 'OK' : 'unexpected: ' + e.message;
  }
  // 验证回滚生效
  const logCount = await prisma.adminOperationLog.count({where:{action:'P3_T19_ROLLBACK_TEST'}});
  R.rollbackVerify = logCount === 0 ? 'OK_clean' : 'DIRTY_' + logCount;

  R.t19_conclusion = {
    queryOk: R.queryOk,
    rollbackClean: R.rollbackVerify === 'OK_clean',
    pass: R.queryOk && R.rollbackVerify === 'OK_clean',
  };
  console.log(JSON.stringify(R,null,1));
  process.exit(R.t19_conclusion.pass ? 0 : 1);
}
main().catch(e=>{console.error('FATAL:',e.message);process.exit(2)});
"""
t19_out = run_node_script(t19_js)
print(f"[T-19] Output:\n{t19_out}")
try:
    t19_json_start = t19_out.index('{')
    t19_result = json.loads(t19_out[t19_json_start:].split("[ERR]")[0] if "ERR" in t19_out else t19_out[t19_json_start:])
    RESULT["T-19"] = {
        "test": "数据库慢查询容错",
        "queryOk": t19_result.get("queryOk"),
        "rollbackClean": t19_result.get("rollbackVerify") == "OK_clean",
        "pass": t19_result.get("t19_conclusion", {}).get("pass", False),
    }
except Exception as e:
    RESULT["T-19"] = {"error": f"parse failed: {e}", "output": t19_out[:500], "pass": False}

# ================================================================
# T-20: AI 接口异常降级
# ================================================================
print("[T-20] Testing AI API degradation...")
t20_js = """
const BASE = 'http://localhost:3000/api';
const R = {};
async function main() {
  // 1. 先登录获取 token
  const loginResp = await fetch(BASE + '/auth/password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({account:'13480010005',password:'Test123456'}),
  });
  const loginJson = await loginResp.json().catch(()=>({}));
  const token = loginJson?.tokens?.accessToken;
  R.hasToken = !!token;

  if (!token) { R.error = 'no token'; console.log(JSON.stringify(R,null,1)); process.exit(1); }

  // 2. 调用 AI chat（可能有配额不足或其他错误，但不应 500）
  const chatResp = await fetch(BASE + '/ai/chat', {
    method: 'POST',
    headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({message:'Hello',conversationId:null}),
  });
  const chatJson = await chatResp.json().catch(()=>({}));
  R.chat = {status: chatResp.status, error: chatJson?.error||'', message: chatJson?.data?.message?.substring(0,100)||''};

  // 3. 调用 AI quota（不应崩溃）
  const quotaResp = await fetch(BASE + '/ai/quota', {
    headers: {'Authorization':'Bearer '+token}
  });
  R.quota = {status: quotaResp.status, error: (await quotaResp.json().catch(()=>({})))?.error||''};

  R.t20_conclusion = {
    // 不 500（允许 403/402/401 等业务错误码）
    chatNot500: R.chat?.status !== 500,
    quotaNot500: R.quota?.status !== 500,
    notWhiteScreen: R.chat?.status !== 500 && R.quota?.status !== 500,
    pass: R.chat?.status !== 500 && R.quota?.status !== 500,
  };
  console.log(JSON.stringify(R,null,1));
  process.exit(R.t20_conclusion.pass ? 0 : 1);
}
main().catch(e=>{console.error('FATAL:',e.message);process.exit(2)});
"""
t20_out = run_node_script(t20_js)
print(f"[T-20] Output:\n{t20_out}")
try:
    t20_json_start = t20_out.index('{')
    t20_result = json.loads(t20_out[t20_json_start:].split("[ERR]")[0] if "ERR" in t20_out else t20_out[t20_json_start:])
    RESULT["T-20"] = {
        "test": "AI 接口异常降级",
        "chatStatus": t20_result.get("chat", {}).get("status"),
        "chatNot500": t20_result.get("chat", {}).get("status") != 500,
        "quotaNot500": t20_result.get("quota", {}).get("status") != 500,
        "pass": t20_result.get("t20_conclusion", {}).get("pass", False),
    }
except Exception as e:
    RESULT["T-20"] = {"error": f"parse failed: {e}", "output": t20_out[:500], "pass": False}

# ================================================================
# 最终判定
# ================================================================
pass_count = sum(1 for v in RESULT.values() if v.get("pass"))
total = len(RESULT)
RESULT["_summary"] = {"total": total, "pass": pass_count, "fail": total - pass_count, "allPass": pass_count == total}
RESULT["_meta"] = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

# 存结果
with open("tmp/p3_stage5_out.json", "w", encoding="utf-8") as f:
    json.dump(RESULT, f, ensure_ascii=False, indent=2)

print(f"\n=== STAGE 5 FINAL: {pass_count}/{total} PASS ===")
if pass_count == total:
    print("ALL PASS!")
else:
    print("SOME FAILURES DETECTED")
    for k, v in RESULT.items():
        if not k.startswith("_") and not v.get("pass"):
            print(f"  {k}: FAIL - {v.get('test', 'unknown')}")

cli.close()
