# -*- coding: utf-8 -*-
import io
P = "/www/xuewaiyu-backend"

# 1) schema.prisma: 给 User 增加反向关系 + 追加 3 个计费模型
schema_path = P + "/prisma/schema.prisma"
with open(schema_path) as f:
    s = f.read()

rel_anchor = "  ocrUsageLogs            OcrUsageLog[]\n"
add_rels = rel_anchor + "  translationBalance     TranslationBillingBalance?\n  packageOrders          TranslationPackageOrder[]\n  billingLogs            TranslationBillingLog[]\n"
assert rel_anchor in s, "schema anchor not found"
s = s.replace(rel_anchor, add_rels, 1)

models = '''

// Stage11 子模块2 — 翻译时长计费（附件 L v1.0.3）
model TranslationBillingBalance {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  trialTotalSec Int      @default(300)
  trialUsedSec  Int      @default(0)
  subType       String?  // 'daily' | 'weekly' | 'monthly'
  subExpiresAt  DateTime?
  subUsedSec    Int      @default(0)
  updatedAt     DateTime @updatedAt
  createdAt     DateTime @default(now())
  @@index([userId])
}

model TranslationPackageOrder {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  orderNo      String   @unique
  packageType  String   // pay_1h|pay_10h|pay_30h|pay_100h|daily|weekly|monthly
  minutesTotal Int
  minutesUsed  Int      @default(0)
  priceCny     Float
  expiresAt    DateTime
  status       String   @default("paid") // paid|refunded|expired
  createdAt    DateTime @default(now())
  @@index([userId])
}

model TranslationBillingLog {
  id              String   @id @default(uuid())
  userId          String
  scene           String   // photo(免费)|scan|conversation|trial
  consumedSec     Int
  source          String   // trial|subscription|paid_package
  orderId         String?
  balanceAfterSec Int
  createdAt       DateTime @default(now())
  @@index([userId])
  @@index([createdAt])
}
'''
s = s.rstrip() + "\n" + models
with open(schema_path, "w") as f:
    f.write(s)

# 2) routes/index.js: 注册 /billing
idx_path = P + "/src/server/routes/index.js"
with open(idx_path) as f:
    ri = f.read()
anchor = "// Translate (Stage11 子模块1"
add = "// Billing (Stage11 子模块2 — 翻译时长计费)\nrouter.use('/billing', require('./billing'));\n\n" + anchor
assert anchor in ri, "routes/index anchor not found"
ri = ri.replace(anchor, add, 1)
with open(idx_path, "w") as f:
    f.write(ri)

# 3) translate.js: 子模块2 计费链路命名对齐（附件 L 2.3）
tr_path = P + "/src/server/routes/translate.js"
with open(tr_path) as f:
    tr = f.read()
tr = tr.replace(
    "const translateController = require('../controllers/translateController');",
    "const translateController = require('../controllers/translateController');\nconst billingController = require('../controllers/billingController');",
    1,
)
tr = tr.replace(
    "router.post('/notebook', translateController.addToNotebook);",
    "router.post('/notebook', translateController.addToNotebook);\n\n// 子模块2 计费链路（附件 L 2.3 命名对齐）：套餐购买 / 试用状态查询\nrouter.post('/package/buy', billingController.buyPackage);\nrouter.get('/trial/status', billingController.getStatus);",
    1,
)
with open(tr_path, "w") as f:
    f.write(tr)

print("EDITS_OK")
