-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiLanguageViolationLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "workspaceId" TEXT,
    "expectedExplainLang" TEXT NOT NULL,
    "detectOutputLang" TEXT,
    "violationType" TEXT NOT NULL,
    "violationDetail" JSONB,
    "retryTimes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLanguageViolationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptTemplate" (
    "id" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "languageCode" TEXT NOT NULL DEFAULT 'zh-CN',
    "templateContent" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "scene" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'hunyuan',
    "promptTemplateId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "languageContext" JSONB,
    "assetHit" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTutorRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTutorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageDailyStatistic" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "workspaceId" TEXT,
    "requestType" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assetHitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageDailyStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "personality" TEXT,
    "voiceStyle" TEXT,
    "catchphrase" TEXT,
    "greeting" TEXT,
    "systemPrompt" TEXT,
    "avatarEmoji" TEXT DEFAULT '🤖',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentLanguageVersion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "translatedContent" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentLanguageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseBlueprint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "languageCode" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "category" TEXT NOT NULL DEFAULT 'general',
    "duration" INTEGER NOT NULL DEFAULT 30,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLearningPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "contentSnapshot" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "localProgress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedUserId" TEXT,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageConsistencyAlert" (
    "id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "LanguageConsistencyLog" (
    "id" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "LanguageIdentity" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LanguageIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningAbilityModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "lastEventId" TEXT,
    "dimension" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAbilityModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningContent" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'AI_GENERATED',
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "explanationLanguage" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'beginner',
    "contentVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "contentData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "planId" TEXT,
    "eventType" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "goalType" TEXT NOT NULL DEFAULT 'language_proficiency',
    "targetLanguage" TEXT NOT NULL,
    "targetLevel" TEXT NOT NULL DEFAULT 'beginner',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deadlineAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "memoryType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "visibility" TEXT NOT NULL DEFAULT 'USER_VISIBLE_MEMORY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPlan" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planType" TEXT NOT NULL DEFAULT 'daily',
    "schedule" JSONB NOT NULL,
    "content" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastEventId" TEXT,
    "overallLevel" TEXT NOT NULL DEFAULT 'beginner',
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "learningStyle" TEXT,
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "totalWords" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "totalTime" INTEGER NOT NULL DEFAULT 0,
    "currentLessonId" TEXT,
    "currentWordIndex" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncVersion" INTEGER NOT NULL DEFAULT 0,
    "isDirty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "membershipLevel" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "paymentMethod" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionBlueprint" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "options" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmsVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeechEvaluationRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "audioUrl" TEXT,
    "transcript" TEXT NOT NULL,
    "referenceText" TEXT,
    "pronunciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fluency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completeness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback" JSONB,
    "weakWords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeechEvaluationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerminologyEntry" (
    "id" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "domain" TEXT,
    "examples" JSONB,
    "synonyms" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TerminologyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationBillingBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trialTotalSec" INTEGER NOT NULL DEFAULT 300,
    "trialUsedSec" INTEGER NOT NULL DEFAULT 0,
    "subType" TEXT,
    "subExpiresAt" TIMESTAMP(3),
    "subUsedSec" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationBillingBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationBillingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "consumedSec" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "orderId" TEXT,
    "balanceAfterSec" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationBillingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationMemoryEntry" (
    "id" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetText" TEXT NOT NULL,
    "context" TEXT,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationMemoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationPackageOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "minutesTotal" INTEGER NOT NULL,
    "minutesUsed" INTEGER NOT NULL DEFAULT 0,
    "priceCny" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationPackageOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "wechatOpenId" TEXT,
    "wechatUnionId" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "membershipLevel" TEXT NOT NULL DEFAULT 'free',
    "membershipExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "syncVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "ownerType" TEXT NOT NULL DEFAULT 'PLATFORM',
    "ownerId" TEXT,
    "directReferrer" TEXT,
    "originChannel" TEXT NOT NULL DEFAULT 'organic',
    "inviteCode" TEXT,
    "referrer" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncVersion" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identityType" TEXT NOT NULL DEFAULT 'personal',
    "defaultWorkspaceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLanguagePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "nativeLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "defaultExplanationLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "fallbackLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLanguagePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLearningLanguage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'beginner',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLearningLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'personal',
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "checkinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streak" INTEGER NOT NULL DEFAULT 1,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_status_idx" ON "AccountDeletionRequest"("status" ASC);

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId" ASC);

-- CreateIndex
CREATE INDEX "AiLanguageViolationLog_createdAt_idx" ON "AiLanguageViolationLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiLanguageViolationLog_requestId_idx" ON "AiLanguageViolationLog"("requestId" ASC);

-- CreateIndex
CREATE INDEX "AiLanguageViolationLog_userId_idx" ON "AiLanguageViolationLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "AiLanguageViolationLog_violationType_idx" ON "AiLanguageViolationLog"("violationType" ASC);

-- CreateIndex
CREATE INDEX "AiPromptTemplate_scene_idx" ON "AiPromptTemplate"("scene" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptTemplate_scene_version_languageCode_key" ON "AiPromptTemplate"("scene" ASC, "version" ASC, "languageCode" ASC);

-- CreateIndex
CREATE INDEX "AiPromptTemplate_status_idx" ON "AiPromptTemplate"("status" ASC);

-- CreateIndex
CREATE INDEX "AiRequestLog_assetHit_idx" ON "AiRequestLog"("assetHit" ASC);

-- CreateIndex
CREATE INDEX "AiRequestLog_createdAt_idx" ON "AiRequestLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiRequestLog_scene_idx" ON "AiRequestLog"("scene" ASC);

-- CreateIndex
CREATE INDEX "AiRequestLog_success_idx" ON "AiRequestLog"("success" ASC);

-- CreateIndex
CREATE INDEX "AiRequestLog_userId_idx" ON "AiRequestLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "AiTutorRecord_userId_createdAt_idx" ON "AiTutorRecord"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "AiUsageDailyStatistic_date_idx" ON "AiUsageDailyStatistic"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageDailyStatistic_date_userId_requestType_key" ON "AiUsageDailyStatistic"("date" ASC, "userId" ASC, "requestType" ASC);

-- CreateIndex
CREATE INDEX "AiUsageDailyStatistic_requestType_idx" ON "AiUsageDailyStatistic"("requestType" ASC);

-- CreateIndex
CREATE INDEX "AiUsageDailyStatistic_userId_idx" ON "AiUsageDailyStatistic"("userId" ASC);

-- CreateIndex
CREATE INDEX "CompanionProfile_userId_idx" ON "CompanionProfile"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CompanionProfile_userId_key" ON "CompanionProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "ContentLanguageVersion_contentId_idx" ON "ContentLanguageVersion"("contentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentLanguageVersion_contentId_languageCode_version_key" ON "ContentLanguageVersion"("contentId" ASC, "languageCode" ASC, "version" ASC);

-- CreateIndex
CREATE INDEX "ContentLanguageVersion_languageCode_idx" ON "ContentLanguageVersion"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "ContentLanguageVersion_status_idx" ON "ContentLanguageVersion"("status" ASC);

-- CreateIndex
CREATE INDEX "CourseBlueprint_languageCode_idx" ON "CourseBlueprint"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "CourseBlueprint_level_idx" ON "CourseBlueprint"("level" ASC);

-- CreateIndex
CREATE INDEX "CourseBlueprint_status_idx" ON "CourseBlueprint"("status" ASC);

-- CreateIndex
CREATE INDEX "DailyLearningPlan_status_idx" ON "DailyLearningPlan"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLearningPlan_userId_dayNumber_key" ON "DailyLearningPlan"("userId" ASC, "dayNumber" ASC);

-- CreateIndex
CREATE INDEX "DailyLearningPlan_userId_planDate_idx" ON "DailyLearningPlan"("userId" ASC, "planDate" ASC);

-- CreateIndex
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status" ASC);

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId" ASC);

-- CreateIndex
CREATE INDEX "GuestSession_convertedUserId_idx" ON "GuestSession"("convertedUserId" ASC);

-- CreateIndex
CREATE INDEX "GuestSession_deviceId_idx" ON "GuestSession"("deviceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GuestSession_deviceId_key" ON "GuestSession"("deviceId" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyAlert_createdAt_idx" ON "LanguageConsistencyAlert"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyAlert_status_idx" ON "LanguageConsistencyAlert"("status" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyAlert_userId_idx" ON "LanguageConsistencyAlert"("userId" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyLog_anomalyType_idx" ON "LanguageConsistencyLog"("anomalyType" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyLog_checkTime_idx" ON "LanguageConsistencyLog"("checkTime" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyLog_runId_idx" ON "LanguageConsistencyLog"("runId" ASC);

-- CreateIndex
CREATE INDEX "LanguageConsistencyLog_userId_idx" ON "LanguageConsistencyLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "LanguageIdentity_isCustom_idx" ON "LanguageIdentity"("isCustom" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LanguageIdentity_languageCode_key" ON "LanguageIdentity"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "LanguageIdentity_script_idx" ON "LanguageIdentity"("script" ASC);

-- CreateIndex
CREATE INDEX "LearningAbilityModel_dimension_idx" ON "LearningAbilityModel"("dimension" ASC);

-- CreateIndex
CREATE INDEX "LearningAbilityModel_languageCode_idx" ON "LearningAbilityModel"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "LearningAbilityModel_userId_idx" ON "LearningAbilityModel"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LearningAbilityModel_userId_languageCode_dimension_key" ON "LearningAbilityModel"("userId" ASC, "languageCode" ASC, "dimension" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_contentType_idx" ON "LearningContent"("contentType" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_difficultyLevel_idx" ON "LearningContent"("difficultyLevel" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_sourceLanguage_idx" ON "LearningContent"("sourceLanguage" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_sourceType_idx" ON "LearningContent"("sourceType" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_status_idx" ON "LearningContent"("status" ASC);

-- CreateIndex
CREATE INDEX "LearningContent_targetLanguage_idx" ON "LearningContent"("targetLanguage" ASC);

-- CreateIndex
CREATE INDEX "LearningEvent_createdAt_idx" ON "LearningEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "LearningEvent_eventType_idx" ON "LearningEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "LearningEvent_languageCode_idx" ON "LearningEvent"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "LearningEvent_planId_idx" ON "LearningEvent"("planId" ASC);

-- CreateIndex
CREATE INDEX "LearningEvent_userId_idx" ON "LearningEvent"("userId" ASC);

-- CreateIndex
CREATE INDEX "LearningGoal_status_idx" ON "LearningGoal"("status" ASC);

-- CreateIndex
CREATE INDEX "LearningGoal_targetLanguage_idx" ON "LearningGoal"("targetLanguage" ASC);

-- CreateIndex
CREATE INDEX "LearningGoal_userId_idx" ON "LearningGoal"("userId" ASC);

-- CreateIndex
CREATE INDEX "LearningMemory_createdAt_idx" ON "LearningMemory"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "LearningMemory_memoryType_idx" ON "LearningMemory"("memoryType" ASC);

-- CreateIndex
CREATE INDEX "LearningMemory_userId_idx" ON "LearningMemory"("userId" ASC);

-- CreateIndex
CREATE INDEX "LearningMemory_visibility_idx" ON "LearningMemory"("visibility" ASC);

-- CreateIndex
CREATE INDEX "LearningPlan_goalId_idx" ON "LearningPlan"("goalId" ASC);

-- CreateIndex
CREATE INDEX "LearningPlan_status_idx" ON "LearningPlan"("status" ASC);

-- CreateIndex
CREATE INDEX "LearningPlan_userId_idx" ON "LearningPlan"("userId" ASC);

-- CreateIndex
CREATE INDEX "LearningProfile_userId_idx" ON "LearningProfile"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LearningProfile_userId_key" ON "LearningProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "LearningProgress_language_idx" ON "LearningProgress"("language" ASC);

-- CreateIndex
CREATE INDEX "LearningProgress_userId_idx" ON "LearningProgress"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_language_key" ON "LearningProgress"("userId" ASC, "language" ASC);

-- CreateIndex
CREATE INDEX "MembershipOrder_orderNo_idx" ON "MembershipOrder"("orderNo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipOrder_orderNo_key" ON "MembershipOrder"("orderNo" ASC);

-- CreateIndex
CREATE INDEX "MembershipOrder_status_idx" ON "MembershipOrder"("status" ASC);

-- CreateIndex
CREATE INDEX "MembershipOrder_userId_idx" ON "MembershipOrder"("userId" ASC);

-- CreateIndex
CREATE INDEX "OcrUsageLog_status_createdAt_idx" ON "OcrUsageLog"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "OcrUsageLog_userId_createdAt_idx" ON "OcrUsageLog"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status" ASC);

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "OrganizationMember_role_idx" ON "OrganizationMember"("role" ASC);

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId" ASC);

-- CreateIndex
CREATE INDEX "RateLimitLog_action_idx" ON "RateLimitLog"("action" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitLog_identifier_action_windowStart_key" ON "RateLimitLog"("identifier" ASC, "action" ASC, "windowStart" ASC);

-- CreateIndex
CREATE INDEX "RateLimitLog_identifier_idx" ON "RateLimitLog"("identifier" ASC);

-- CreateIndex
CREATE INDEX "RateLimitLog_windowStart_idx" ON "RateLimitLog"("windowStart" ASC);

-- CreateIndex
CREATE INDEX "ReviewQueue_userId_dueDate_idx" ON "ReviewQueue"("userId" ASC, "dueDate" ASC);

-- CreateIndex
CREATE INDEX "RewardLedger_userId_createdAt_idx" ON "RewardLedger"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken" ASC);

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token" ASC);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId" ASC);

-- CreateIndex
CREATE INDEX "SmsVerification_expiresAt_idx" ON "SmsVerification"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "SmsVerification_phone_idx" ON "SmsVerification"("phone" ASC);

-- CreateIndex
CREATE INDEX "SpeechEvaluationRecord_planId_idx" ON "SpeechEvaluationRecord"("planId" ASC);

-- CreateIndex
CREATE INDEX "SpeechEvaluationRecord_userId_createdAt_idx" ON "SpeechEvaluationRecord"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key" ASC);

-- CreateIndex
CREATE INDEX "TerminologyEntry_domain_idx" ON "TerminologyEntry"("domain" ASC);

-- CreateIndex
CREATE INDEX "TerminologyEntry_languageCode_idx" ON "TerminologyEntry"("languageCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TerminologyEntry_languageCode_term_key" ON "TerminologyEntry"("languageCode" ASC, "term" ASC);

-- CreateIndex
CREATE INDEX "TranslationBillingBalance_userId_idx" ON "TranslationBillingBalance"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TranslationBillingBalance_userId_key" ON "TranslationBillingBalance"("userId" ASC);

-- CreateIndex
CREATE INDEX "TranslationBillingLog_createdAt_idx" ON "TranslationBillingLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TranslationBillingLog_userId_idx" ON "TranslationBillingLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "TranslationMemoryEntry_reuseCount_idx" ON "TranslationMemoryEntry"("reuseCount" ASC);

-- CreateIndex
CREATE INDEX "TranslationMemoryEntry_sourceLanguage_targetLanguage_idx" ON "TranslationMemoryEntry"("sourceLanguage" ASC, "targetLanguage" ASC);

-- CreateIndex
CREATE INDEX "TranslationMemoryEntry_sourceText_idx" ON "TranslationMemoryEntry"("sourceText" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TranslationPackageOrder_orderNo_key" ON "TranslationPackageOrder"("orderNo" ASC);

-- CreateIndex
CREATE INDEX "TranslationPackageOrder_userId_idx" ON "TranslationPackageOrder"("userId" ASC);

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode" ASC);

-- CreateIndex
CREATE INDEX "User_membershipLevel_idx" ON "User"("membershipLevel" ASC);

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone" ASC);

-- CreateIndex
CREATE INDEX "User_uniqueId_idx" ON "User"("uniqueId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_uniqueId_key" ON "User"("uniqueId" ASC);

-- CreateIndex
CREATE INDEX "User_wechatOpenId_idx" ON "User"("wechatOpenId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "User"("wechatOpenId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatUnionId_key" ON "User"("wechatUnionId" ASC);

-- CreateIndex
CREATE INDEX "UserDevice_deviceToken_idx" ON "UserDevice"("deviceToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceToken_key" ON "UserDevice"("userId" ASC, "deviceToken" ASC);

-- CreateIndex
CREATE INDEX "UserDevice_userId_idx" ON "UserDevice"("userId" ASC);

-- CreateIndex
CREATE INDEX "UserIdentity_identityType_idx" ON "UserIdentity"("identityType" ASC);

-- CreateIndex
CREATE INDEX "UserIdentity_userId_idx" ON "UserIdentity"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentity_userId_key" ON "UserIdentity"("userId" ASC);

-- CreateIndex
CREATE INDEX "UserLanguagePreference_interfaceLanguage_idx" ON "UserLanguagePreference"("interfaceLanguage" ASC);

-- CreateIndex
CREATE INDEX "UserLanguagePreference_userId_idx" ON "UserLanguagePreference"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserLanguagePreference_userId_key" ON "UserLanguagePreference"("userId" ASC);

-- CreateIndex
CREATE INDEX "UserLearningLanguage_languageCode_idx" ON "UserLearningLanguage"("languageCode" ASC);

-- CreateIndex
CREATE INDEX "UserLearningLanguage_status_idx" ON "UserLearningLanguage"("status" ASC);

-- CreateIndex
CREATE INDEX "UserLearningLanguage_userId_idx" ON "UserLearningLanguage"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningLanguage_userId_languageCode_key" ON "UserLearningLanguage"("userId" ASC, "languageCode" ASC);

-- CreateIndex
CREATE INDEX "Workspace_organizationId_idx" ON "Workspace"("organizationId" ASC);

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "Workspace_type_idx" ON "Workspace"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "checkins_userId_checkinDate_key" ON "checkins"("userId" ASC, "checkinDate" ASC);

-- CreateIndex
CREATE INDEX "checkins_userId_idx" ON "checkins"("userId" ASC);

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTutorRecord" ADD CONSTRAINT "AiTutorRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionProfile" ADD CONSTRAINT "CompanionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLearningPlan" ADD CONSTRAINT "DailyLearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningAbilityModel" ADD CONSTRAINT "LearningAbilityModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGoal" ADD CONSTRAINT "LearningGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMemory" ADD CONSTRAINT "LearningMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "LearningGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipOrder" ADD CONSTRAINT "MembershipOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrUsageLog" ADD CONSTRAINT "OcrUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedger" ADD CONSTRAINT "RewardLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeechEvaluationRecord" ADD CONSTRAINT "SpeechEvaluationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationBillingBalance" ADD CONSTRAINT "TranslationBillingBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationBillingLog" ADD CONSTRAINT "TranslationBillingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationPackageOrder" ADD CONSTRAINT "TranslationPackageOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLanguagePreference" ADD CONSTRAINT "UserLanguagePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLearningLanguage" ADD CONSTRAINT "UserLearningLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

