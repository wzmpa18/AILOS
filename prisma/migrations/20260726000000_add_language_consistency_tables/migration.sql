-- P2 任务二：双语言一致性校验（GAP / 双宪法第十章）
-- 纯 additive 变更：新增两张表，不改动任何既有表结构与 User 模型，零回滚风险。
-- 本地无 DB 环境，手写 SQL 与 `prisma migrate dev --name add_language_consistency_tables`
-- 生成格式一致；服务器统一用 `prisma migrate deploy` 落地，禁止 db push。

-- CreateTable: 每次校验的完整审计日志（对齐审计字段规范）
CREATE TABLE "LanguageConsistencyLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "checkTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nativeLangCurrent" TEXT,
    "nativeLangExpected" TEXT,
    "targetLangCurrent" TEXT,
    "targetLangExpected" TEXT,
    "anomalyType" TEXT NOT NULL,
    "handleResult" TEXT NOT NULL,
    "protectWindowFlag" BOOLEAN NOT NULL DEFAULT false,
    "operator" TEXT NOT NULL DEFAULT 'system',
    "detail" JSONB,
    "runId" TEXT,

    CONSTRAINT "LanguageConsistencyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: 重度冲突告警（同步账簿「待处理告警清单」P2_ALERT）
CREATE TABLE "LanguageConsistencyAlert" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "conflictFields" JSONB NOT NULL,
    "tableValues" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'P2_ALERT',
    "operator" TEXT NOT NULL DEFAULT 'system',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolveNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguageConsistencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: LanguageConsistencyLog
CREATE INDEX "LanguageConsistencyLog_userId_idx" ON "LanguageConsistencyLog"("userId");
CREATE INDEX "LanguageConsistencyLog_checkTime_idx" ON "LanguageConsistencyLog"("checkTime");
CREATE INDEX "LanguageConsistencyLog_anomalyType_idx" ON "LanguageConsistencyLog"("anomalyType");
CREATE INDEX "LanguageConsistencyLog_runId_idx" ON "LanguageConsistencyLog"("runId");

-- CreateIndex: LanguageConsistencyAlert
CREATE INDEX "LanguageConsistencyAlert_userId_idx" ON "LanguageConsistencyAlert"("userId");
CREATE INDEX "LanguageConsistencyAlert_status_idx" ON "LanguageConsistencyAlert"("status");
CREATE INDEX "LanguageConsistencyAlert_createdAt_idx" ON "LanguageConsistencyAlert"("createdAt");
