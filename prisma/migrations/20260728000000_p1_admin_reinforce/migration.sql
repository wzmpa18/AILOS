-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "account" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add columns
ALTER TABLE "User" ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "LoginLog_adminId_idx" ON "LoginLog"("adminId");
CREATE INDEX "LoginLog_account_idx" ON "LoginLog"("account");
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");
