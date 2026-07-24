#!/usr/bin/env python3
"""
签到功能部署脚本
执行: python3 /tmp/deploy_checkin.py
功能:
  1. 备份所有受影响文件
  2. 追加 Checkin model 到 Prisma Schema
  3. 执行 prisma migrate
  4. 部署 controller + route 文件
  5. 注册 checkin 路由到主路由文件
  6. 扩展 Dashboard 返回 checkInStreak + todayCheckedIn
  7. 验证部署
"""
import os, sys, shutil, subprocess, re
from datetime import datetime

BACKEND = '/www/xuewaiyu-backend'
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
BACKUP_DIR = f'/www/backups/checkin_deploy_{TS}'
os.makedirs(BACKUP_DIR, exist_ok=True)

errors = []

def backup(path):
    """备份单个文件"""
    if os.path.exists(path):
        dest = os.path.join(BACKUP_DIR, os.path.basename(path))
        shutil.copy2(path, dest)
        print(f"  BACKUP: {path} -> {dest}")
        return True
    return False

def step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")

# ====== Step 1: Backup ======
step("Step 1: 备份所有文件")

SCHEMA = f'{BACKEND}/prisma/schema.prisma'
ROUTES_INDEX = f'{BACKEND}/src/server/routes/index.js'
CTRL_DIR = f'{BACKEND}/src/server/controllers'
ROUTES_DIR = f'{BACKEND}/src/server/routes'

for f in [SCHEMA, ROUTES_INDEX]:
    if not backup(f):
        print(f"  WARNING: {f} not found, skipping backup")

# Backup dashboard controller (try multiple possible paths)
for dash_path in [
    f'{CTRL_DIR}/dashboardController.js',
    f'{CTRL_DIR}/dashboard.js',
    f'{CTRL_DIR}/homeController.js',
]:
    if backup(dash_path):
        DASHBOARD_CTRL = dash_path
        break
else:
    print("  WARNING: Dashboard controller not found! Will skip dashboard extension")
    DASHBOARD_CTRL = None

# ====== Step 2: Add Checkin model to Prisma Schema ======
step("Step 2: 追加 Checkin Model 到 Prisma Schema")

with open(SCHEMA, 'r') as f:
    schema = f.read()

if 'model Checkin' in schema:
    print("  Checkin model already exists in schema, skipping")
else:
    checkin_model = '''
model Checkin {
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
'''
    with open(SCHEMA, 'w') as f:
        f.write(schema + '\n' + checkin_model)
    print("  Checkin model appended to schema.prisma")

# ====== Step 3: Prisma Migrate ======
step("Step 3: 执行 Prisma Migrate")

os.environ['DATABASE_URL'] = 'postgresql://postgres@localhost:5432/xuewaiyu'
os.chdir(BACKEND)

result = subprocess.run(
    ['npx', 'prisma', 'migrate', 'dev', '--name', 'add_checkin'],
    capture_output=True, text=True, cwd=BACKEND, timeout=120
)
print("  STDOUT:", result.stdout[-500:] if result.stdout else '(empty)')
if result.returncode != 0:
    print("  STDERR:", result.stderr[-500:] if result.stderr else '(empty)')
    errors.append(f"Prisma migrate failed: {result.stderr[-200:]}")
else:
    print("  Prisma migrate SUCCESS")
    # Regenerate client
    subprocess.run(['npx', 'prisma', 'generate'], capture_output=True, cwd=BACKEND)
    print("  Prisma client regenerated")

# ====== Step 4: Deploy Controller + Route ======
step("Step 4: 部署 Controller + Route 文件")

# Controller
checkin_ctrl_src = '/tmp/checkinController.js'
checkin_ctrl_dst = f'{CTRL_DIR}/checkinController.js'
if os.path.exists(checkin_ctrl_src):
    shutil.copy2(checkin_ctrl_src, checkin_ctrl_dst)
    print(f"  Deployed: {checkin_ctrl_dst}")
else:
    errors.append("checkinController.js not found at /tmp/")

# Route
checkin_route_src = '/tmp/checkinRoute.js'
checkin_route_dst = f'{ROUTES_DIR}/checkin.js'
if os.path.exists(checkin_route_src):
    shutil.copy2(checkin_route_src, checkin_route_dst)
    print(f"  Deployed: {checkin_route_dst}")
else:
    errors.append("checkinRoute.js not found at /tmp/")

# ====== Step 5: Register route in index.js ======
step("Step 5: 注册 checkin 路由")

with open(ROUTES_INDEX, 'r') as f:
    routes_content = f.read()

if "require('./checkin')" in routes_content:
    print("  checkin route already registered, skipping")
else:
    # Find the last require statement and route registration
    # Pattern: find "app.use('/api/" and add before it
    # Or find the last route registration line
    
    # Find the last route registration
    last_route_match = re.search(r"(app\.use\('/api/[^']+',\s*[^)]+\)\s*)", routes_content)
    if last_route_match:
        insert_pos = last_route_match.end()
        
        # Add require at top (find last require)
        last_require = [m for m in re.finditer(r"const\s+\w+\s*=\s*require\('[^']+routes[^']*'\)", routes_content)]
        if last_require:
            require_pos = last_require[-1].end()
            new_routes = routes_content[:require_pos] + "\nconst checkinRoutes = require('./checkin');" + routes_content[require_pos:insert_pos] + "\napp.use('/api/checkin', checkinRoutes);" + routes_content[insert_pos:]
        else:
            # Fallback: add at end of file before module.exports
            module_match = re.search(r'module\.exports', routes_content)
            if module_match:
                insert_pos = module_match.start()
                new_routes = routes_content[:insert_pos] + "\nconst checkinRoutes = require('./checkin');\napp.use('/api/checkin', checkinRoutes);\n\n" + routes_content[insert_pos:]
            else:
                new_routes = routes_content + "\nconst checkinRoutes = require('./checkin');\napp.use('/api/checkin', checkinRoutes);\n"
        
        with open(ROUTES_INDEX, 'w') as f:
            f.write(new_routes)
        print("  checkin route registered in index.js")
    else:
        # Fallback: append to end
        with open(ROUTES_INDEX, 'a') as f:
            f.write("\nconst checkinRoutes = require('./checkin');\napp.use('/api/checkin', checkinRoutes);\n")
        print("  checkin route appended to index.js (fallback)")

# ====== Step 6: Extend Dashboard ======
step("Step 6: 扩展 Dashboard 返回 checkInStreak + todayCheckedIn")

if DASHBOARD_CTRL and os.path.exists(DASHBOARD_CTRL):
    with open(DASHBOARD_CTRL, 'r') as f:
        dash_content = f.read()
    
    if 'checkInStreak' in dash_content and 'todayCheckedIn' in dash_content:
        print("  Dashboard already returns checkInStreak/todayCheckedIn, skipping")
    else:
        # Find the res.json or res.send that returns dashboard data
        # Strategy: find the last res.json({...}) or res.send(...) in the main handler
        # and add the checkin fields before it
        
        # Look for the dashboard response pattern
        # Common patterns: res.json({ success: true, data: {...} })
        # We need to add checkInStreak and todayCheckedIn to the data object
        
        # Since we can't reliably parse all JS, use a simpler approach:
        # Find the main GET handler function, add checkin query BEFORE the res.json
        
        # Find the function that handles GET / or GET /dashboard
        get_handler_pattern = r'(async\s+(?:getDashboard|getHome|get)\s*\([^)]*\)\s*\{)'
        match = re.search(get_handler_pattern, dash_content)
        
        if match:
            # Insert checkin query code before the res.json in that function
            checkin_code = '''
    // P0-2: Checkin status for dashboard
    let checkInStreak = 0;
    let todayCheckedIn = false;
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayCheckin = await prisma.checkin.findUnique({
        where: { userId_checkinDate: { userId: req.userId, checkinDate: today } }
      });
      if (todayCheckin) {
        checkInStreak = todayCheckin.streak;
        todayCheckedIn = true;
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayCheckin = await prisma.checkin.findUnique({
          where: { userId_checkinDate: { userId: req.userId, checkinDate: yesterday } }
        });
        checkInStreak = yesterdayCheckin ? yesterdayCheckin.streak : 0;
      }
    } catch (e) {
      console.error('Checkin query failed:', e.message);
    }
'''
            # Find the first res.json or res.send after the handler function
            handler_start = match.start()
            res_json_match = re.search(r'res\.(?:json|send)\s*\(', dash_content[handler_start:])
            
            if res_json_match:
                insert_at = handler_start + res_json_match.start()
                new_dash = dash_content[:insert_at] + checkin_code + '\n  ' + dash_content[insert_at:]
                
                # Now add checkInStreak and todayCheckedIn to the data object
                # Find data: { or data = { pattern
                data_match = re.search(r'(data\s*[=:]\s*\{)', new_dash[insert_at:])
                if data_match:
                    data_pos = insert_at + data_match.start() + len(data_match.group(1))
                    new_dash = new_dash[:data_pos] + '\n      checkInStreak,\n      todayCheckedIn,' + new_dash[data_pos:]
                    
                    with open(DASHBOARD_CTRL, 'w') as f:
                        f.write(new_dash)
                    print("  Dashboard extended with checkInStreak + todayCheckedIn")
                else:
                    errors.append("Could not find data object in dashboard response")
            else:
                errors.append("Could not find res.json in dashboard controller")
        else:
            errors.append("Could not find dashboard handler function")
else:
    errors.append(f"Dashboard controller not found: {DASHBOARD_CTRL}")

# ====== Step 7: Restart PM2 ======
step("Step 7: 重启 PM2")

result = subprocess.run(
    ['pm2', 'restart', 'xuewaiyu-backend'],
    capture_output=True, text=True, timeout=30
)
print("  PM2 restart:", result.stdout.strip() or result.stderr.strip())

# Wait for startup
import time
time.sleep(3)

# Check logs
result = subprocess.run(
    ['pm2', 'logs', 'xuewaiyu-backend', '--lines', '15', '--nostream'],
    capture_output=True, text=True, timeout=10
)
print("\n  PM2 Logs:")
print("  " + "\n  ".join(result.stdout.split('\n')[-15:]))

# ====== Step 8: Verify ======
step("Step 8: 验证部署")

# Check database table
result = subprocess.run(
    ['npx', 'prisma', 'db', 'execute', '--stdin'],
    input='SELECT name FROM sqlite_master WHERE type="table" AND name="checkins";',
    capture_output=True, text=True, cwd=BACKEND, timeout=10
)
print("  DB check:", result.stdout.strip() or result.stderr.strip())

# ====== Summary ======
step("部署完成")
if errors:
    print(f"\n  ⚠ WARNINGS ({len(errors)}):")
    for e in errors:
        print(f"    - {e}")
else:
    print("\n  ✅ All steps completed successfully!")

print(f"\n  Backup: {BACKUP_DIR}")
print(f"  Rollback: cp {BACKUP_DIR}/* {BACKEND}/  && pm2 restart xuewaiyu-backend")