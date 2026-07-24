#!/usr/bin/env python3
"""
签到功能部署脚本 V2 (精简版)
只做无风险操作：追加Schema → 迁移 → 部署文件 → 注册路由 → 重启
Dashboard修改提供代码片段供人工确认
"""
import os, sys, shutil, subprocess, time
from datetime import datetime

BACKEND = '/www/xuewaiyu-backend'
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
BACKUP_DIR = f'/www/backups/checkin_{TS}'
os.makedirs(BACKUP_DIR, exist_ok=True)

def step(msg):
    print(f"\n>>> {msg}")

# ====== Step 1: Backup ======
step("Step 1: 备份文件")
for f in [
    f'{BACKEND}/prisma/schema.prisma',
    f'{BACKEND}/src/server/routes/index.js',
]:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join(BACKUP_DIR, os.path.basename(f)))
        print(f"  OK: {f}")

# ====== Step 2: Add Checkin model to Prisma ======
step("Step 2: 追加 Checkin Model")

SCHEMA = f'{BACKEND}/prisma/schema.prisma'
with open(SCHEMA, 'r') as f:
    schema = f.read()

if 'model Checkin' in schema:
    print("  SKIP: already exists")
else:
    with open(SCHEMA, 'w') as f:
        f.write(schema + '\n' + '''model Checkin {
  id          Int      @id @default(autoincrement())
  userId      Int
  checkinDate DateTime @default(now())
  streak      Int      @default(1)
  xpAwarded   Int      @default(0)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, checkinDate])
  @@index([userId])
  @@map("checkins")
}
''')
    print("  OK: Checkin model appended")

# ====== Step 3: Prisma Migrate ======
step("Step 3: Prisma Migrate")
os.environ['DATABASE_URL'] = 'postgresql://postgres@localhost:5432/xuewaiyu'
os.chdir(BACKEND)

r = subprocess.run(['npx', 'prisma', 'migrate', 'dev', '--name', 'add_checkin'],
    capture_output=True, text=True, cwd=BACKEND, timeout=120)
if r.returncode != 0:
    print(f"  ERROR: {r.stderr[-300:]}")
    sys.exit(1)
print("  OK: " + r.stdout.split('\n')[-3] if r.stdout else 'done')

r = subprocess.run(['npx', 'prisma', 'generate'], capture_output=True, text=True, cwd=BACKEND)
print("  Prisma client regenerated" if r.returncode == 0 else f"  WARN: {r.stderr[-100:]}")

# ====== Step 4: Deploy files ======
step("Step 4: 部署 Controller + Route")

for src, dst in [
    ('/tmp/checkinController.js', f'{BACKEND}/src/server/controllers/checkinController.js'),
    ('/tmp/checkinRoute.js', f'{BACKEND}/src/server/routes/checkin.js'),
]:
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"  OK: {dst}")
    else:
        print(f"  ERROR: {src} not found!")
        sys.exit(1)

# ====== Step 5: Register route ======
step("Step 5: 注册路由")

ROUTES = f'{BACKEND}/src/server/routes/index.js'
with open(ROUTES, 'r') as f:
    content = f.read()

if "require('./checkin')" in content:
    print("  SKIP: already registered")
else:
    # Find last require('./...') line, insert after it
    lines = content.split('\n')
    last_require_idx = -1
    for i, line in enumerate(lines):
        if "require('./" in line and '.js' not in line:
            last_require_idx = i
        elif "require('./" in line and 'routes' in line:
            last_require_idx = i
    
    if last_require_idx >= 0:
        lines.insert(last_require_idx + 1, "const checkinRoutes = require('./checkin');")
    
    # Find last app.use('/api/...') line, insert after it
    last_use_idx = -1
    for i, line in enumerate(lines):
        if "app.use('/api/" in line:
            last_use_idx = i
    
    if last_use_idx >= 0:
        lines.insert(last_use_idx + 1, "app.use('/api/checkin', checkinRoutes);")
    
    with open(ROUTES, 'w') as f:
        f.write('\n'.join(lines))
    print("  OK: checkin route registered")

# ====== Step 6: Restart ======
step("Step 6: 重启 PM2")
subprocess.run(['pm2', 'restart', 'xuewaiyu-backend'], capture_output=True, timeout=30)
time.sleep(3)
r = subprocess.run(['pm2', 'logs', 'xuewaiyu-backend', '--lines', '10', '--nostream'],
    capture_output=True, text=True, timeout=10)
print(r.stdout[-500:] if r.stdout else '(no logs)')

# ====== Step 7: Verify ======
step("Step 7: 验证")
# Check if checkins table exists via Prisma
r = subprocess.run(['npx', 'prisma', 'db', 'execute', '--stdin'],
    input="SELECT COUNT(*) FROM checkins;",
    capture_output=True, text=True, cwd=BACKEND, timeout=10)
print(f"  checkins table: {'OK' if r.returncode == 0 else 'FAIL'}")

print(f"\n{'='*60}")
print("  部署完成!")
print(f"  Backup: {BACKUP_DIR}")
print(f"{'='*60}")
print("""
  ⚠ Dashboard 扩展需要手动操作:
  在 Dashboard 控制器中, 找到返回 JSON 数据的位置,
  在 data 对象中添加 checkInStreak 和 todayCheckedIn 字段.
  详见下方代码片段.
""")