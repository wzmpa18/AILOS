-- P3 阶段一计费一致性缺陷修复（AILOS-P3-TEST-20260728-001 / 总账第38.1章）
-- DEF-P3-01: TranslationBillingLog 增加幂等键 requestId + (userId, requestId) 唯一索引
ALTER TABLE "TranslationBillingLog" ADD COLUMN "requestId" TEXT;
CREATE UNIQUE INDEX "TranslationBillingLog_userId_requestId_key" ON "TranslationBillingLog"("userId", "requestId");

-- DEF-P3-03: 按量包/会员赠时长单位统一为秒
-- 存量 minutesTotal 语义为分钟（购买链路落库 cat.minutes / grantUnits），consume 消耗按秒 → 统一 ×60
-- minutesUsed 由 consume 写入、语义本就是秒，不变更
UPDATE "TranslationPackageOrder" SET "minutesTotal" = "minutesTotal" * 60 WHERE "packageType" LIKE 'pay\_%' ESCAPE '\';
