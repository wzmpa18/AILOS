-- Stage11 子模块1：OCR 计量/计费日志表（加性变更，宪法附录 C-2：单迁移文件即可，非破坏性）
CREATE TABLE "OcrUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scene" TEXT NOT NULL DEFAULT 'photo_translate',
    "imageCount" INTEGER NOT NULL DEFAULT 1,
    "ocrTextLen" INTEGER NOT NULL DEFAULT 0,
    "estCostCny" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorCode" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OcrUsageLog_userId_createdAt_idx" ON "OcrUsageLog"("userId", "createdAt");
CREATE INDEX "OcrUsageLog_status_createdAt_idx" ON "OcrUsageLog"("status", "createdAt");

ALTER TABLE "OcrUsageLog" ADD CONSTRAINT "OcrUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
