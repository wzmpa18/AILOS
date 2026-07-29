-- AlterTable
ALTER TABLE "MembershipOrder" ADD COLUMN     "abnormal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "abnormalMarkedAt" TIMESTAMP(3),
ADD COLUMN     "abnormalMarkedBy" TEXT,
ADD COLUMN     "abnormalNote" TEXT;

-- AlterTable
ALTER TABLE "TranslationBillingBalance" ADD COLUMN     "adminTimeSec" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TranslationPackageOrder" ADD COLUMN     "abnormal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "abnormalMarkedAt" TIMESTAMP(3),
ADD COLUMN     "abnormalMarkedBy" TEXT,
ADD COLUMN     "abnormalNote" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminOperationLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminOperationLog_adminId_idx" ON "AdminOperationLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminOperationLog_targetType_targetId_idx" ON "AdminOperationLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminOperationLog_createdAt_idx" ON "AdminOperationLog"("createdAt");

