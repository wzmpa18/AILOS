--
-- PostgreSQL database dump
--

\restrict 9qHpncu85xPIOPQvXl3ghC8rPJPBS5grxOfWqDLgz1w8FfO2cNsc125Y34piRN5

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AccountDeletionRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AccountDeletionRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text NOT NULL,
    reason text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."AccountDeletionRequest" OWNER TO postgres;

--
-- Name: AdminOperationLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminOperationLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    reason text,
    detail jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdminOperationLog" OWNER TO postgres;

--
-- Name: AiLanguageViolationLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AiLanguageViolationLog" (
    id text NOT NULL,
    "requestId" text,
    "userId" text,
    "workspaceId" text,
    "expectedExplainLang" text NOT NULL,
    "detectOutputLang" text,
    "violationType" text NOT NULL,
    "violationDetail" jsonb,
    "retryTimes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiLanguageViolationLog" OWNER TO postgres;

--
-- Name: AiPromptTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AiPromptTemplate" (
    id text NOT NULL,
    scene text NOT NULL,
    version text DEFAULT '1.0.0'::text NOT NULL,
    "languageCode" text DEFAULT 'zh-CN'::text NOT NULL,
    "templateContent" text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AiPromptTemplate" OWNER TO postgres;

--
-- Name: AiRequestLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AiRequestLog" (
    id text NOT NULL,
    "userId" text,
    "workspaceId" text,
    scene text NOT NULL,
    "requestType" text NOT NULL,
    model text DEFAULT 'hunyuan'::text NOT NULL,
    "promptTemplateId" text,
    "inputTokens" integer DEFAULT 0 NOT NULL,
    "outputTokens" integer DEFAULT 0 NOT NULL,
    "latencyMs" integer DEFAULT 0 NOT NULL,
    "languageContext" jsonb,
    "assetHit" boolean DEFAULT false NOT NULL,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiRequestLog" OWNER TO postgres;

--
-- Name: AiTutorRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AiTutorRecord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "goalId" text,
    role text NOT NULL,
    content text NOT NULL,
    "tokensUsed" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiTutorRecord" OWNER TO postgres;

--
-- Name: AiUsageDailyStatistic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AiUsageDailyStatistic" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "userId" text,
    "workspaceId" text,
    "requestType" text NOT NULL,
    "totalRequests" integer DEFAULT 0 NOT NULL,
    "inputTokens" integer DEFAULT 0 NOT NULL,
    "outputTokens" integer DEFAULT 0 NOT NULL,
    "estimatedCost" double precision DEFAULT 0 NOT NULL,
    "assetHitRate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AiUsageDailyStatistic" OWNER TO postgres;

--
-- Name: CompanionProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CompanionProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    personality text,
    "voiceStyle" text,
    catchphrase text,
    greeting text,
    "systemPrompt" text,
    "avatarEmoji" text DEFAULT '🤖'::text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CompanionProfile" OWNER TO postgres;

--
-- Name: ContentLanguageVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContentLanguageVersion" (
    id text NOT NULL,
    "contentId" text NOT NULL,
    "languageCode" text NOT NULL,
    version text DEFAULT '1.0.0'::text NOT NULL,
    "translatedContent" jsonb NOT NULL,
    "qualityScore" double precision DEFAULT 0 NOT NULL,
    "reviewedBy" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ContentLanguageVersion" OWNER TO postgres;

--
-- Name: CourseBlueprint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CourseBlueprint" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "languageCode" text NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    duration integer DEFAULT 30 NOT NULL,
    modules jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CourseBlueprint" OWNER TO postgres;

--
-- Name: DailyLearningPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DailyLearningPlan" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "dayNumber" integer NOT NULL,
    "planDate" timestamp(3) without time zone NOT NULL,
    "targetLanguage" text NOT NULL,
    "focusArea" text NOT NULL,
    scene text NOT NULL,
    duration integer DEFAULT 30 NOT NULL,
    tasks jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contentSnapshot" jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    score integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DailyLearningPlan" OWNER TO postgres;

--
-- Name: DataExportRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataExportRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status text NOT NULL,
    "fileUrl" text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."DataExportRequest" OWNER TO postgres;

--
-- Name: GuestSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GuestSession" (
    id text NOT NULL,
    "deviceId" text NOT NULL,
    "localProgress" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActiveAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "convertedUserId" text,
    "convertedAt" timestamp(3) without time zone
);


ALTER TABLE public."GuestSession" OWNER TO postgres;

--
-- Name: LanguageConsistencyAlert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LanguageConsistencyAlert" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "conflictFields" jsonb NOT NULL,
    "tableValues" jsonb NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'P2_ALERT'::text NOT NULL,
    operator text DEFAULT 'system'::text NOT NULL,
    "resolvedBy" text,
    "resolvedAt" timestamp(3) without time zone,
    "resolveNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LanguageConsistencyAlert" OWNER TO postgres;

--
-- Name: LanguageConsistencyLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LanguageConsistencyLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "checkTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "nativeLangCurrent" text,
    "nativeLangExpected" text,
    "targetLangCurrent" text,
    "targetLangExpected" text,
    "anomalyType" text NOT NULL,
    "handleResult" text NOT NULL,
    "protectWindowFlag" boolean DEFAULT false NOT NULL,
    operator text DEFAULT 'system'::text NOT NULL,
    detail jsonb,
    "runId" text
);


ALTER TABLE public."LanguageConsistencyLog" OWNER TO postgres;

--
-- Name: LanguageIdentity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LanguageIdentity" (
    id text NOT NULL,
    "languageCode" text NOT NULL,
    "displayName" text NOT NULL,
    "nativeName" text NOT NULL,
    script text NOT NULL,
    direction text DEFAULT 'ltr'::text NOT NULL,
    "isCustom" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LanguageIdentity" OWNER TO postgres;

--
-- Name: LearningAbilityModel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningAbilityModel" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "languageCode" text NOT NULL,
    "lastEventId" text,
    dimension text NOT NULL,
    score double precision DEFAULT 0 NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    data jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LearningAbilityModel" OWNER TO postgres;

--
-- Name: LearningContent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningContent" (
    id text NOT NULL,
    "contentType" text NOT NULL,
    "sourceType" text DEFAULT 'AI_GENERATED'::text NOT NULL,
    "sourceLanguage" text NOT NULL,
    "targetLanguage" text NOT NULL,
    "explanationLanguage" text NOT NULL,
    "difficultyLevel" text DEFAULT 'beginner'::text NOT NULL,
    "contentVersion" text DEFAULT '1.0.0'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "qualityScore" double precision DEFAULT 0 NOT NULL,
    "reuseCount" integer DEFAULT 0 NOT NULL,
    "contentData" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LearningContent" OWNER TO postgres;

--
-- Name: LearningEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningEvent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "workspaceId" text,
    "planId" text,
    "eventType" text NOT NULL,
    "languageCode" text NOT NULL,
    data jsonb NOT NULL,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LearningEvent" OWNER TO postgres;

--
-- Name: LearningGoal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningGoal" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "workspaceId" text,
    "goalType" text DEFAULT 'language_proficiency'::text NOT NULL,
    "targetLanguage" text NOT NULL,
    "targetLevel" text DEFAULT 'beginner'::text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "deadlineAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LearningGoal" OWNER TO postgres;

--
-- Name: LearningMemory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningMemory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sourceEventId" text,
    "memoryType" text NOT NULL,
    content jsonb NOT NULL,
    importance double precision DEFAULT 0.5 NOT NULL,
    visibility text DEFAULT 'USER_VISIBLE_MEMORY'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LearningMemory" OWNER TO postgres;

--
-- Name: LearningPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningPlan" (
    id text NOT NULL,
    "goalId" text NOT NULL,
    "userId" text NOT NULL,
    "planType" text DEFAULT 'daily'::text NOT NULL,
    schedule jsonb NOT NULL,
    content jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LearningPlan" OWNER TO postgres;

--
-- Name: LearningProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "lastEventId" text,
    "overallLevel" text DEFAULT 'beginner'::text NOT NULL,
    strengths jsonb DEFAULT '[]'::jsonb NOT NULL,
    weaknesses jsonb DEFAULT '[]'::jsonb NOT NULL,
    "learningStyle" text,
    data jsonb,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LearningProfile" OWNER TO postgres;

--
-- Name: LearningProgress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LearningProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    language text NOT NULL,
    level text NOT NULL,
    "totalWords" integer DEFAULT 0 NOT NULL,
    "totalLessons" integer DEFAULT 0 NOT NULL,
    "totalTime" integer DEFAULT 0 NOT NULL,
    "currentLessonId" text,
    "currentWordIndex" integer DEFAULT 0 NOT NULL,
    "currentStreak" integer DEFAULT 0 NOT NULL,
    "longestStreak" integer DEFAULT 0 NOT NULL,
    "lastStudyDate" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "syncVersion" integer DEFAULT 0 NOT NULL,
    "isDirty" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."LearningProgress" OWNER TO postgres;

--
-- Name: LoginLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LoginLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    account text,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LoginLog" OWNER TO postgres;

--
-- Name: MembershipOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipOrder" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orderNo" text NOT NULL,
    "membershipLevel" text NOT NULL,
    duration integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'CNY'::text NOT NULL,
    "paymentMethod" text NOT NULL,
    "paymentId" text,
    status text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    abnormal boolean DEFAULT false NOT NULL,
    "abnormalMarkedAt" timestamp(3) without time zone,
    "abnormalMarkedBy" text,
    "abnormalNote" text
);


ALTER TABLE public."MembershipOrder" OWNER TO postgres;

--
-- Name: OcrUsageLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OcrUsageLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    scene text DEFAULT 'photo_translate'::text NOT NULL,
    "imageCount" integer DEFAULT 1 NOT NULL,
    "ocrTextLen" integer DEFAULT 0 NOT NULL,
    "estCostCny" numeric(10,4) DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "errorCode" text,
    "latencyMs" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OcrUsageLog" OWNER TO postgres;

--
-- Name: OrgClass; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrgClass" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    name text NOT NULL,
    description text,
    "teacherId" text,
    status text DEFAULT 'active'::text NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrgClass" OWNER TO postgres;

--
-- Name: OrgClassStudent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrgClassStudent" (
    id text NOT NULL,
    "classId" text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrgClassStudent" OWNER TO postgres;

--
-- Name: Organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "logoUrl" text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Organization" OWNER TO postgres;

--
-- Name: OrganizationMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrganizationMember" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'student'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OrganizationMember" OWNER TO postgres;

--
-- Name: QuestionBlueprint; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QuestionBlueprint" (
    id text NOT NULL,
    "contentId" text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    options text,
    difficulty integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."QuestionBlueprint" OWNER TO postgres;

--
-- Name: RateLimitLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RateLimitLog" (
    id text NOT NULL,
    identifier text NOT NULL,
    action text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    "windowStart" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RateLimitLog" OWNER TO postgres;

--
-- Name: ReviewQueue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReviewQueue" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "contentId" text NOT NULL,
    "contentType" text NOT NULL,
    "interval" integer DEFAULT 0 NOT NULL,
    "easeFactor" double precision DEFAULT 2.5 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    "dueDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastReview" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReviewQueue" OWNER TO postgres;

--
-- Name: RewardLedger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RewardLedger" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    amount integer NOT NULL,
    balance integer NOT NULL,
    "refId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RewardLedger" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "refreshToken" text,
    "deviceInfo" text,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: SmsVerification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SmsVerification" (
    id text NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    type text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SmsVerification" OWNER TO postgres;

--
-- Name: SocialTimeline; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SocialTimeline" (
    id text NOT NULL,
    "actorId" text NOT NULL,
    type text DEFAULT 'post'::text NOT NULL,
    content text NOT NULL,
    metadata text,
    "likeCount" integer DEFAULT 0 NOT NULL,
    "commentCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SocialTimeline" OWNER TO postgres;

--
-- Name: SocialTimelineLike; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SocialTimelineLike" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SocialTimelineLike" OWNER TO postgres;

--
-- Name: SpeechEvaluationRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SpeechEvaluationRecord" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text,
    "audioUrl" text,
    transcript text NOT NULL,
    "referenceText" text,
    pronunciation double precision DEFAULT 0 NOT NULL,
    fluency double precision DEFAULT 0 NOT NULL,
    accuracy double precision DEFAULT 0 NOT NULL,
    completeness double precision DEFAULT 0 NOT NULL,
    "overallScore" double precision DEFAULT 0 NOT NULL,
    feedback jsonb,
    "weakWords" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SpeechEvaluationRecord" OWNER TO postgres;

--
-- Name: SystemConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemConfig" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemConfig" OWNER TO postgres;

--
-- Name: TerminologyEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TerminologyEntry" (
    id text NOT NULL,
    "languageCode" text NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    "partOfSpeech" text,
    domain text,
    examples jsonb,
    synonyms jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TerminologyEntry" OWNER TO postgres;

--
-- Name: TranslationBillingBalance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TranslationBillingBalance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "trialTotalSec" integer DEFAULT 300 NOT NULL,
    "trialUsedSec" integer DEFAULT 0 NOT NULL,
    "subType" text,
    "subExpiresAt" timestamp(3) without time zone,
    "subUsedSec" integer DEFAULT 0 NOT NULL,
    "adminTimeSec" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TranslationBillingBalance" OWNER TO postgres;

--
-- Name: TranslationBillingLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TranslationBillingLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    scene text NOT NULL,
    "consumedSec" integer NOT NULL,
    source text NOT NULL,
    "orderId" text,
    "requestId" text,
    "balanceAfterSec" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TranslationBillingLog" OWNER TO postgres;

--
-- Name: TranslationMemoryEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TranslationMemoryEntry" (
    id text NOT NULL,
    "sourceLanguage" text NOT NULL,
    "targetLanguage" text NOT NULL,
    "sourceText" text NOT NULL,
    "targetText" text NOT NULL,
    context text,
    "qualityScore" double precision DEFAULT 0 NOT NULL,
    "reuseCount" integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'AI'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TranslationMemoryEntry" OWNER TO postgres;

--
-- Name: TranslationPackageOrder; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TranslationPackageOrder" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "orderNo" text NOT NULL,
    "packageType" text NOT NULL,
    "minutesTotal" integer NOT NULL,
    "minutesUsed" integer DEFAULT 0 NOT NULL,
    "priceCny" double precision NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    "paidAt" timestamp(3) without time zone,
    abnormal boolean DEFAULT false NOT NULL,
    "abnormalNote" text,
    "abnormalMarkedAt" timestamp(3) without time zone,
    "abnormalMarkedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TranslationPackageOrder" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "uniqueId" text NOT NULL,
    phone text,
    email text,
    "passwordHash" text,
    "wechatOpenId" text,
    "wechatUnionId" text,
    nickname text,
    avatar text,
    "birthDate" timestamp(3) without time zone,
    gender text,
    "membershipLevel" text DEFAULT 'free'::text NOT NULL,
    "membershipExpiry" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isGuest" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "lastLoginIp" text,
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lockedUntil" timestamp(3) without time zone,
    "lastSyncAt" timestamp(3) without time zone,
    "syncVersion" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "ownerType" text DEFAULT 'PLATFORM'::text NOT NULL,
    "ownerId" text,
    "directReferrer" text,
    "originChannel" text DEFAULT 'organic'::text NOT NULL,
    "inviteCode" text,
    referrer text,
    xp integer DEFAULT 0 NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    "privacySettings" jsonb
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserDevice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserDevice" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceName" text NOT NULL,
    "deviceType" text NOT NULL,
    "deviceToken" text,
    "lastSyncAt" timestamp(3) without time zone,
    "syncVersion" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserDevice" OWNER TO postgres;

--
-- Name: UserIdentity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserIdentity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "identityType" text DEFAULT 'personal'::text NOT NULL,
    "defaultWorkspaceId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserIdentity" OWNER TO postgres;

--
-- Name: UserLanguagePreference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserLanguagePreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "interfaceLanguage" text DEFAULT 'zh-CN'::text NOT NULL,
    "nativeLanguage" text DEFAULT 'zh-CN'::text NOT NULL,
    "defaultExplanationLanguage" text DEFAULT 'zh-CN'::text NOT NULL,
    "fallbackLanguage" text DEFAULT 'zh-CN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserLanguagePreference" OWNER TO postgres;

--
-- Name: UserLearningLanguage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserLearningLanguage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "languageCode" text NOT NULL,
    level text DEFAULT 'beginner'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserLearningLanguage" OWNER TO postgres;

--
-- Name: Workspace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Workspace" (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'personal'::text NOT NULL,
    "ownerId" text NOT NULL,
    "organizationId" text,
    "isDefault" boolean DEFAULT false NOT NULL,
    config jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Workspace" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: checkins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.checkins (
    id text NOT NULL,
    "userId" text NOT NULL,
    "checkinDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    streak integer DEFAULT 1 NOT NULL,
    "xpAwarded" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.checkins OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id text NOT NULL,
    type text DEFAULT 'single'::text NOT NULL,
    "targetId" text,
    participants text[],
    "lastMsgId" text,
    "lastMsgPreview" text,
    "lastMsgTime" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: friend_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_settings (
    id text NOT NULL,
    "userId" text NOT NULL,
    "friendId" text NOT NULL,
    "remarkName" text,
    tags text[],
    "isMuted" boolean DEFAULT false NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.friend_settings OWNER TO postgres;

--
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "groupNickname" text,
    mute boolean DEFAULT false NOT NULL,
    "joinTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "avatarUrl" text,
    "ownerId" text NOT NULL,
    "maxMembers" integer DEFAULT 50 NOT NULL,
    "createdVia" text DEFAULT 'manual'::text NOT NULL,
    announcement text,
    "muteAll" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    "msgType" text DEFAULT 'text'::text NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "isRevoked" boolean DEFAULT false NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Data for Name: AccountDeletionRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AccountDeletionRequest" (id, "userId", status, reason, "requestedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: AdminOperationLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminOperationLog" (id, "adminId", action, "targetType", "targetId", reason, detail, "createdAt") FROM stdin;
\.


--
-- Data for Name: AiLanguageViolationLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AiLanguageViolationLog" (id, "requestId", "userId", "workspaceId", "expectedExplainLang", "detectOutputLang", "violationType", "violationDetail", "retryTimes", "createdAt") FROM stdin;
\.


--
-- Data for Name: AiPromptTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AiPromptTemplate" (id, scene, version, "languageCode", "templateContent", variables, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AiRequestLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AiRequestLog" (id, "userId", "workspaceId", scene, "requestType", model, "promptTemplateId", "inputTokens", "outputTokens", "latencyMs", "languageContext", "assetHit", success, "errorMessage", "createdAt") FROM stdin;
ff8c4b95-b13f-4d76-a8e3-3a8436aab349	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	UPSTREAM_ERROR: Request failed with status code 404	2026-07-24 03:50:01.225
5a77036c-3808-4142-905c-5daacf46c4e2	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	conversation	conversation	hy3	\N	132	88	2692	{"userLevel": "beginner", "nativeLang": "中文", "targetLang": "英语"}	f	t	\N	2026-07-24 03:57:01.039
893ecf81-e1fb-4613-9851-ed4027214f13	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	135	104	3328	{"userLevel": "beginner", "nativeLang": "中文", "targetLang": "英语"}	f	t	\N	2026-07-24 09:29:11.553
dadf5ca8-f47f-4f33-b865-7bdd50cb3162	a5703492-28d1-4602-a7ec-08922b68bbd3	\N	conversation	conversation	hy3	\N	134	70	2320	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-24 09:58:50.331
e3dd82d3-339b-4eb5-861d-4cbf909e8253	4acc4546-b008-4536-9577-f9a8e87356a3	\N	conversation	conversation	hy3	\N	134	61	2237	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-24 09:59:49.277
19b60b9d-acb3-41b9-b40a-372be275ac76	478c5039-1567-4117-afc6-2fc27396731f	\N	conversation	conversation	hy3	\N	137	123	3097	{"userLevel": "beginner", "nativeLang": "中文", "targetLang": "英语"}	f	t	\N	2026-07-24 10:14:59.891
fd184e36-ba5b-4b3c-8498-66ecf29f9ebe	478c5039-1567-4117-afc6-2fc27396731f	\N	conversation	conversation	hy3	\N	137	130	3129	{"userLevel": "beginner", "nativeLang": "中文", "targetLang": "英语"}	f	t	\N	2026-07-24 10:15:07.165
2d8f4829-a31e-4e12-9e09-bbd2da9f27bc	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	134	117	2689	{"userLevel": "beginner", "nativeLang": "中文", "targetLang": "英语"}	f	t	\N	2026-07-24 12:14:23.905
6d000c6d-ec32-4816-bcf6-aa93416a932e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	99	{"nativeLang": "中文", "targetLang": "英语", "explanationLanguage": "中文", "primaryTargetLanguage": "英语"}	f	f	AI-CONNECTION-PENDING: Upstream 404	2026-07-25 07:42:38.869
62d68dac-52a2-43fc-813f-21182f18a623	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	35	{"nativeLang": "中文", "targetLang": "英语", "explanationLanguage": "中文", "primaryTargetLanguage": "英语"}	f	f	AI-CONNECTION-PENDING: Upstream 404	2026-07-25 07:44:47.384
a3d44a31-e500-4304-941e-a3ce844d6f62	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	487	78	2682	{"nativeLang": "中文", "targetLang": "英语", "explanationLanguage": "中文", "primaryTargetLanguage": "英语"}	f	t	\N	2026-07-25 07:52:02.063
710cc2e3-c85a-470d-af6f-762d90248712	test	\N	course_generation	course_generation	hunyuan	\N	17	10	1197	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja-JP"}	f	t	\N	2026-07-25 07:56:14.739
02fbe499-0b5b-4030-b693-f0105c9ec706	test	\N	course_generation	course_generation	hunyuan	\N	0	0	60	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja-JP"}	f	t	\N	2026-07-25 08:28:39.37
19c09546-5310-404f-908f-6bdbad02dd24	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	course_generation	course_generation	hunyuan	\N	0	0	30020	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja-JP"}	f	f	AI-CONNECTION-PENDING: Request timeout	2026-07-25 08:34:25.582
4e75cab3-5530-48e9-b05a-89186e660440	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	163	651	10382	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja-JP"}	f	t	\N	2026-07-25 08:34:31.108
0246f274-348b-47f6-b3d9-fc9b3302f445	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	572	4248	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:31.515
4f622a76-5af7-4837-b82e-b82111719a26	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	861	5747	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:33.014
c39e6b01-8b90-4f90-a3f8-e63c335759cb	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	567	3938	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:33.339
05215eec-5a5c-43a5-bfe7-c21a3450652b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	1	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:33.575
b2236959-9022-4afa-8b66-6d6c3e471a2a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	1080	6556	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:33.828
c729e5a9-1a7c-49a3-9fc9-e63e33e4e6bd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	898	5694	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:35.102
b978a012-ac75-4c69-bd9c-7bfece3d5d6a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	1015	6314	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:35.721
a3a681bc-67a7-42d5-a143-31d1ba2536e8	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	705	10062	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:37.329
1cb69729-daa7-4d18-8124-192e1a5b6b23	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	681	9509	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 09:48:38.917
ecda546a-1b5e-4d13-ac10-bcc12e6e603e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	147	471	6970	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 16:25:26.525
2c483f6c-7e31-449c-920b-09c4515687b5	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	156	74	2156	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-25 16:25:29.983
0426962e-470a-4454-8509-e9b9bc8d866d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	0	0	30005	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	f	AI-CONNECTION-PENDING: Request timeout	2026-07-25 16:26:00.574
f5e80907-0cae-483c-a1f2-0577cd570f51	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	147	484	7655	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 00:39:16.141
c85ec6b1-08d2-4e98-858d-8f1ad2e29d0c	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	156	74	2170	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 00:39:19.556
6eb53d73-9dae-4a15-96f1-e3b1bcb45394	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	chat	chat	hunyuan	\N	0	0	30005	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	f	AI-CONNECTION-PENDING: Request timeout	2026-07-26 00:39:49.97
1de5eeb9-8624-4208-b4a8-47d442ccc317	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	555	4251	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 04:55:58.397
1236753f-396f-4f15-bbd4-7ded63fe4094	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	888	7060	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 04:56:01.209
d0b5a3be-3772-42c8-9481-dc7e6fb85201	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	979	7099	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 04:56:01.245
84c2cf47-4a86-4792-b66f-a14eb49edb74	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	690	9327	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 04:56:03.473
bef0c37b-74f3-4dc8-be95-c737d5540831	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	580	7859	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 04:58:40.146
96a8d127-7f4a-4dea-b2fd-6654c3321493	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	891	13502	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 04:58:45.955
fc9e463c-67d2-4252-918e-b4dca926da0e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	593	4412	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 04:58:36.863
4a5845b1-6012-43db-8309-0db720eadc11	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	1175	16488	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 04:58:48.94
974b15b0-59e5-480c-99f0-0dd38f62eb63	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	592	3609	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 08:16:28.059
5c7ffdd7-52e1-47a6-809f-47d94026bbbb	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	586	10638	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 08:16:35.088
cac02e04-9a65-48b0-b5b5-1d9d3a25bc48	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	872	12263	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 08:16:37.156
839c3e09-ab1e-4d68-8823-ff4dd65ca241	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	952	13477	{"explanationLanguage": "zh-CN", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 08:16:38.369
818ca8e8-dd39-471e-ac45-918b57e106a9	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	137	73	2210	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 09:21:42.162
99e2f1bf-fb82-4842-a813-63ee43dd0f3b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	137	73	2213	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 09:21:42.168
d992933e-7b3e-4f08-b00c-8a54859eb2b7	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 09:21:42.992
9d4d9942-3ca8-43e8-a08c-42fcca67bc60	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	4	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 09:21:42.995
756fe81d-7bb1-4507-8005-066a83cf18ae	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_CONFIG_INCOMPLETE: 用户目标语言配置缺失（无 active UserLearningLanguage），请先完成语言设置	2026-07-26 09:49:21.752
9c064e8d-fe2b-4de6-9d25-2934676de8fa	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	\N	conversation	conversation	hunyuan	\N	137	68	2011	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 09:49:23.799
c86a676d-cb1c-4dff-b2f0-30202492dd51	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	\N	conversation	conversation	hy3	\N	137	68	2014	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 09:49:23.803
5fccf30f-a79b-4a66-9439-78d773558067	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	553	4011	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:18:59.638
812ee180-d02d-4a5f-9ec3-2d50c3389ca1	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	857	5587	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:01.225
c6ccdc6f-9e69-4226-929e-6ae8b85f4bf2	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	988	5720	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:01.36
df4e4a4a-1f54-4940-8e9c-e0ddfbf54b76	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	709	9920	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:05.553
27458ed9-3983-4dce-87ba-435108eb20b6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	4	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:26.256
bb6f66ad-fa3c-4cf0-a94e-9aa54b7852ad	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	4	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:26.256
4ff738e0-c8fa-4243-92da-e1ee52f9c29e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	8	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:26.264
10421b69-a6a4-499d-8ae9-fa61cea787c2	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	10	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:26.264
6b4de382-798b-4969-bec8-29295a7a6bee	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	1	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:54.178
a2d98b76-19a5-4ed4-9c93-f7866f9974d4	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	5	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:54.197
f8d85cc9-63ff-4b4c-a2c5-26a11fc7f6ac	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:54.208
5659f1dd-6117-4102-9136-d8ddd5ecb856	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:19:54.21
9df4f162-c178-4b88-918e-e5730492c03f	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	147	102	3106	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:52:45.132
172fbb20-4b9b-4c8b-bce0-eefde5468e84	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	147	102	3109	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 10:52:45.138
a165b28b-f4b7-4954-9e15-cd0d6bbba736	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	9	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:52:53.517
1c50e605-14b3-4d79-8dd2-fdbb7de15943	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	7	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:52:53.526
2091fd27-142c-4b93-a3e4-0e74edc8f3bd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	7	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:52:53.526
5e05a184-c29a-44a8-83fe-e48a8d67ca5b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:52:53.722
7515f65e-48d4-4073-98d4-d65f0f4fe8aa	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	4	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:53:09.601
92ebceea-3f9c-4014-b428-81487140fadd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	6	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:53:09.604
7ba7b456-bf71-413a-9ab2-69e56b53c4c3	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	6	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:53:09.599
61a39a1b-61be-4995-8613-53a54b605b50	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	5	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 10:53:09.601
029da8c8-33cf-4e57-874a-a700b9e364d5	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	photo_translate	photo_translate	hunyuan	\N	161	261	2802	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 11:21:56.585
930fa9ec-6763-4e0b-b138-d500f3f394fd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	photo_translate	photo_translate	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 11:22:38.714
55321daf-1f9a-44b1-a29b-92a3dbd585e5	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	535	3794	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:08:41.224
8a543fda-aaf8-4952-a1d6-dc26bb697838	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	963	5876	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:08:43.307
71f03853-f8d9-4cb5-9502-4e4b32fb7f07	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	859	5956	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:08:43.387
e8e232e9-b131-40d7-ad56-3b4743ba4d1f	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	704	9966	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:08:47.396
31df7c7e-79e3-4114-af66-6d4d7fd5f8db	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	138	87	3137	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:09:42.869
7a406449-9502-4fdc-bc9e-989760d3b1e6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	138	87	3140	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 12:09:42.874
6860e512-1748-419c-b022-5db79b0ec006	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 12:15:14.518
d0b6e5f9-36fd-4674-b7c5-3dc6ce44161e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	5	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 12:15:14.522
0eb99b84-ba99-4117-8c48-a7a800a8ffa0	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	1636	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	f	输出语种不匹配：期望 en，实际 zh	2026-07-26 12:17:39.702
2d9cc543-2fcb-4a94-a006-f77031efc034	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 en，实际 zh	2026-07-26 12:17:39.705
bc521213-5ff4-4e48-82a5-a5a66d2aece6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	1474	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	f	输出语种不匹配：期望 en，实际 zh	2026-07-26 12:18:42.615
08ef1000-0954-4192-9bab-eebb0e68fce0	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 en，实际 zh	2026-07-26 12:18:42.617
f1df9082-a2b6-42f2-8c02-a45471286b83	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2349	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	f	输出语种不匹配：期望 en，实际 zh	2026-07-26 12:35:15.132
e26b2a91-f8c0-4460-8bc2-35765ec73cac	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 en，实际 zh	2026-07-26 12:35:15.134
3ff1d26a-ebcf-44a0-9b39-43d29a127796	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	151	101	2677	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 12:39:14.515
37144521-e767-401a-9cd7-a7e3536ce128	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	151	101	2680	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 12:39:14.52
356c9a16-c4e7-4f68-a4c5-2c84ae50ef37	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	145	77	2248	{"nativeLanguage": "zh", "targetLanguage": "fr", "explanationLanguage": "zh", "primaryTargetLanguage": "fr"}	f	t	\N	2026-07-26 13:59:16.95
7cdacb09-a284-4a43-b46f-604c72780b23	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	145	77	2257	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "fr"}	f	t	\N	2026-07-26 13:59:16.965
11ab85d4-11ba-4275-830b-0571856914cf	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	142	91	1916	{"nativeLanguage": "zh", "targetLanguage": "es", "explanationLanguage": "zh", "primaryTargetLanguage": "es"}	f	t	\N	2026-07-26 13:59:18.947
983a0ae3-80d8-46af-97f7-718dc7f49647	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	142	91	1919	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "es"}	f	t	\N	2026-07-26 13:59:18.951
dfe4eb60-4f79-4b94-87d2-c6be8fc0f262	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	144	94	2455	{"nativeLanguage": "zh", "targetLanguage": "de", "explanationLanguage": "zh", "primaryTargetLanguage": "de"}	f	t	\N	2026-07-26 13:59:21.466
08b39ee8-6ddc-46b0-889c-cd7eefc95f2e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	144	94	2456	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "de"}	f	t	\N	2026-07-26 13:59:21.47
6d475a7f-c254-4978-8a7a-68db3be9bd2f	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	1849	{"nativeLanguage": "zh", "targetLanguage": "ko", "explanationLanguage": "zh", "primaryTargetLanguage": "ko"}	f	f	输出语种不匹配：期望 ko，目标语字符占比 24%（阈值 60%）	2026-07-26 13:59:23.377
ea8508a7-88a7-4dde-9e27-0781e9c93bd6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 ko，目标语字符占比 24%（阈值 60%）	2026-07-26 13:59:23.379
fcae5b2f-c8eb-432c-890a-8baac6bfb3a7	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	1679	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	f	输出语种不匹配：期望 ja，目标语字符占比 59%（阈值 60%）	2026-07-26 13:59:25.121
b7f6293f-93b4-4c61-a938-c001e58281a1	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 ja，目标语字符占比 59%（阈值 60%）	2026-07-26 13:59:25.125
e5dd9e68-05e2-4fbd-a84d-3fa26edd8680	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	138	98	2503	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 13:59:27.723
c1f0b0a1-76ac-425b-9ff6-8697bf401c27	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	138	98	2505	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 13:59:27.726
699721ce-c0e4-4cbe-b90a-fb8d1f85c19c	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	136	76	2166	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:03:11.317
dddeb213-2dd3-4ba0-adf4-9bfa387cb366	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	136	76	2169	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:03:11.325
542b8171-6937-4ee4-9149-7ea840820780	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2571	{"nativeLanguage": "zh", "targetLanguage": "ko", "explanationLanguage": "zh", "primaryTargetLanguage": "ko"}	f	f	输出语种不匹配：期望 ko，目标语字符占比 28%（阈值 60%）	2026-07-26 14:03:13.927
24ccfae7-b4cf-4775-95a1-ddbb3531c61c	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 ko，目标语字符占比 28%（阈值 60%）	2026-07-26 14:03:13.93
2fca13eb-88b8-4663-a400-5c0554b2cb79	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "fr", "explanationLanguage": "zh", "primaryTargetLanguage": "fr"}	f	t	\N	2026-07-26 14:05:29.814
4b82f9ca-8685-4ab2-8fc8-426c5193550a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	5	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "fr"}	f	t	\N	2026-07-26 14:05:29.818
9f84bc32-b737-4d0c-a575-4d9422dc36cb	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "es", "explanationLanguage": "zh", "primaryTargetLanguage": "es"}	f	t	\N	2026-07-26 14:05:29.889
53c21736-ed59-452f-a00e-251f2f15353c	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	4	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "es"}	f	t	\N	2026-07-26 14:05:29.892
835d1740-9d68-47bc-8f41-3b153ca27a87	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "de", "explanationLanguage": "zh", "primaryTargetLanguage": "de"}	f	t	\N	2026-07-26 14:05:29.959
071bc0e3-fc01-4805-93ea-0bff867ea6e1	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	3	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "de"}	f	t	\N	2026-07-26 14:05:29.961
c3189340-2b68-4df4-ba1c-b88709e94440	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	145	76	1578	{"nativeLanguage": "zh", "targetLanguage": "ko", "explanationLanguage": "zh", "primaryTargetLanguage": "ko"}	f	t	\N	2026-07-26 14:05:31.602
5d50cb91-62b9-4212-a161-fe807e4b8809	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	145	76	1581	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ko"}	f	t	\N	2026-07-26 14:05:31.61
40ba7a1a-c19c-4ec1-a39b-4a05216a901a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	143	84	1597	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:05:33.271
c5f5326b-a661-497f-9384-957e030ba2bd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	143	84	1599	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:05:33.275
a56053d0-9771-4694-bd0b-355d998e3b76	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:05:33.336
fa54f154-7e29-4aa7-84a1-a291521c5434	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	3	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:05:33.338
e1563d7d-789c-4833-b2dd-3bcace60cfd7	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	138	122	2837	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:16:18.615
b8a34586-7196-449a-bb1e-b7794efd2a7b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	138	122	2840	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:16:18.623
673e52fb-e3f1-4f50-b30a-8524ad25d14f	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	134	90	2628	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:17:46.716
17ab4146-ce4b-436a-bbbd-cb50ba9ad4ce	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	134	90	2630	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:17:46.72
735f6156-327a-4e3a-b90d-2b5d86985823	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	135	95	2480	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:17:49.248
c9007283-6956-4531-b69e-6c82776c8da0	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	135	95	2482	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:17:49.251
e212f0e9-b51f-46a7-9a99-5e4c720e0832	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	133	53	1346	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:17:50.645
e8727ce2-b3c5-4d38-8645-72a4078ee170	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	133	53	1348	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:17:50.649
5fd93139-4b9b-416c-b4b8-214a09caddec	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	135	105	1708	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:19:21.621
23dc6ad9-39d2-4cb1-8fed-dbe509fd94a9	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	135	105	1710	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:19:21.625
c7ceb89b-7be4-4eff-80d2-d433a9089221	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	4	{"nativeLanguage": "zh", "targetLanguage": "en", "explanationLanguage": "zh", "primaryTargetLanguage": "en"}	f	t	\N	2026-07-26 14:19:21.677
4c4f260b-752e-4f8e-bf45-4ead7fd577b7	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	5	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "en"}	f	t	\N	2026-07-26 14:19:21.68
d101b1eb-f49a-4aab-af17-fc81a8eaccf1	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:19:21.746
a91ac44c-1d0d-40ea-baad-073bbd5cedef	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	cache	\N	0	0	15	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:19:21.76
3eaec840-fcfe-4bc9-835f-38f63380dd9e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	135	86	1514	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:21:45.249
cdff404d-bd5c-4135-902f-1becfeda32f1	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	135	86	1519	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:21:45.258
e8c74681-40b8-4838-bb4d-c5b903e0244d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	136	121	2947	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:21:48.243
d8687039-1ec2-4d37-bddd-ff84fc932d6a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	136	121	2949	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:21:48.249
bf2afd04-b24a-495c-a35e-4f6873e43ad0	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	136	110	2774	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-26 14:21:51.06
2ad51e97-7858-4ed8-9800-2456c5c12e1d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	136	110	2776	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-26 14:21:51.063
d4c66f8a-24b0-46df-8f03-f6c288d1996d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	photo_translate	photo_translate	hunyuan	\N	143	171	3312	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-27 02:23:16.818
15561b18-35f4-48d1-be5b-bc7dfe781f05	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	136	64	2018	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-27 03:52:09.029
368591a4-d76c-4b86-929c-653a5437ada4	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	136	64	2020	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-27 03:52:09.036
eb59b703-6034-4ff2-8302-fd6f58780ec3	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	1865	{"nativeLanguage": "zh", "targetLanguage": "ko", "explanationLanguage": "zh", "primaryTargetLanguage": "ko"}	f	f	输出语种不匹配：期望 ko，目标语字符占比 53%（阈值 60%）	2026-07-27 03:52:10.951
834f7458-75c8-4d41-86e9-b4d894933302	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	0	0	0	\N	f	f	LANG_OUTPUT_MISMATCH: 输出语种不匹配：期望 ko，目标语字符占比 53%（阈值 60%）	2026-07-27 03:52:10.953
35fe5212-9a93-4555-a868-20f7655d82d6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	132	90	1734	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-27 03:56:48.79
299265ed-3e9f-4bbb-b283-05fd1f629e3d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	132	90	1736	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-27 03:56:48.794
5f1877b8-f44a-4d0c-b559-912a26d329f6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	132	95	2456	{"nativeLanguage": "zh", "targetLanguage": "ko", "explanationLanguage": "zh", "primaryTargetLanguage": "ko"}	f	t	\N	2026-07-27 03:56:53.295
73719cc0-dbcd-44ea-992e-07f89c490e52	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	132	95	2459	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ko"}	f	t	\N	2026-07-27 03:56:53.299
34e6f15d-6609-4d50-b435-98c99e195622	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	537	4037	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 02:49:15.01
554ba0e1-1c3a-4e18-ab0f-6d4f8b498972	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	2	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 02:49:15.146
e3227855-d502-4d0f-b88e-82618cc8a715	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	1019	6746	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 02:49:17.718
35e640b9-5df5-4545-ba2a-61f1fff59935	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	1014	8145	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 02:49:19.119
690b96e8-cbf7-410a-9806-890211b9b7af	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	681	10245	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 02:49:21.219
1a51b33e-c3f6-4780-9bbb-863d234a1a08	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	translate	translate	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	t	t	\N	2026-07-28 03:01:13.095
7b45448d-7748-4181-9678-387540453594	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	translate	translate	hunyuan	\N	0	0	4	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	t	t	\N	2026-07-28 03:02:12.629
d4edf562-c4f1-43de-a357-24f904ad9761	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	translate	translate	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	t	t	\N	2026-07-28 03:02:13.529
2d1ff248-6681-49fc-938f-bf7a21b161ee	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	translate	translate	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	t	t	\N	2026-07-28 03:03:05.098
d4e0e761-1255-41aa-a151-1db5bcf5e655	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hunyuan	\N	136	102	3430	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 03:03:08.921
43159a48-00aa-49ce-88f9-e9f818f2b197	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	conversation	hy3	\N	136	102	3432	{"userLevel": "beginner", "nativeLang": "zh", "targetLang": "ja"}	f	t	\N	2026-07-28 03:03:08.926
a1a308b8-8658-4db7-86c3-fb0dbdc425d3	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	5	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 03:14:15.99
50e73875-6ac8-44d8-8af7-b28fb555ba40	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	5	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 03:14:15.991
c3118623-6d9e-4066-8d3a-85ad8cb0aa0f	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	5	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 03:14:15.992
458dfbde-6b50-4a85-9ea7-aeed83963058	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	6	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 03:14:15.995
cfcfbb7f-001c-48b0-92eb-6fb5569aab09	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	579	5039	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 09:05:24.497
dab88e89-bf35-4e34-9fda-0f1cc4e7bb5c	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	665	11441	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 09:05:30.913
eb989ed0-ca76-449a-a645-089a61a97c38	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	862	14310	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 09:05:33.783
0c13d641-adfb-4ef9-b9a6-52581c4e94e2	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	983	19027	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 09:05:38.5
18734a4c-5ad8-42f4-921d-3ea8dc6462e2	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	0	0	3	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 09:05:38.635
66dacfdb-964c-40b5-9456-7fa0074c743b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	156	535	3851	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 11:44:18.583
cc74cf8e-120d-4ff6-84ea-5602846168a4	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	155	667	11070	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 11:44:26.279
b8bfce51-008d-4f88-9767-25493f264816	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	195	849	11469	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 11:44:26.677
ceeee167-2f34-4a88-a2b7-2851a23619c3	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	lesson_generate	lesson_generate	hunyuan	\N	180	967	18381	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-28 11:44:33.589
98b06976-e678-47d0-902b-3d05d77aff00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	1148	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 03:01:56.507
9c107a49-ffc8-4c21-92ea-43869bd0835d	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	986	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 03:40:33.31
d639322b-e44a-4848-94e1-a9cefd4cb552	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	1143	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 03:40:47.187
fefd77e4-9ea7-4801-bbc1-916d50625c6a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	1185	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 03:41:01.403
d23071d4-e5fe-4c93-b366-c08be4bada5e	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	1045	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 09:37:55.076
1a044fd9-ef51-43b8-98c4-cef5d5cd803b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation_translate	conversation_translate	hy3	\N	0	0	1007	{"nativeLanguage": "zh", "targetLanguage": "ja", "explanationLanguage": "zh", "primaryTargetLanguage": "ja"}	f	t	\N	2026-07-29 09:38:06.159
\.


--
-- Data for Name: AiTutorRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AiTutorRecord" (id, "userId", "goalId", role, content, "tokensUsed", "createdAt") FROM stdin;
f6c03f04-6682-4885-8e7a-8d3aec186d65	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	user	Hello, teach me English!	0	2026-07-24 03:57:02.378
eb8ce598-acd7-47ef-a51d-a4b485e1f0cb	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	assistant	你好呀！我是AILOS，很高兴当你的英语小老师😊 你是初学者，我们从简单实用的开始。\n\n今天学个基础词：**hello**（你好），用于见面打招呼。\n例句：Hello, I am Tom.（你好，我是汤姆。）\n\n你想先练打招呼，还是学点别的？随时问我就行，慢慢来，不着急～	165	2026-07-24 03:57:04.847
8c999f6c-e101-436b-8e3a-a338830b0eec	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	???????????????	0	2026-07-24 09:28:12.461
40b31025-75ef-4e45-a5f4-7c72a5fe75b5	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	assistant	哈哈，看到一串问号，是不是对英语有什么疑惑呀？😊 作为你的英语导师，我来帮你！\n\n比如，初学者常问：怎么用 "be" 动词？\n中文解释：be 动词有 am/is/are，I 用 am，单数用 is，复数用 are。\n英语例句：I am a student. He is happy. They are friends.\n\n你想学哪个词或句子？随便问，朋友般聊就好！	186	2026-07-24 09:28:15.59
9171fc18-9482-4bdb-b643-0039172757c7	478c5039-1567-4117-afc6-2fc27396731f	\N	user	教我一个日语单词	0	2026-07-24 09:55:16.092
5d004af5-9258-4d9e-96fa-082a9c758648	478c5039-1567-4117-afc6-2fc27396731f	\N	assistant	嗨！我是AILOS，你的英语导师哦～咱们主要学英语，不过我先教你一个超简单的英语词代替吧😊\n\n今天学：**apple**（苹果）\n它是很基础的名词， Beginner 级别一定要会！\n例句：I eat a red apple every day.（我每天吃一个红苹果。）\n\n下次想学哪类词，随时告诉我呀～	166	2026-07-24 09:55:18.669
d4a66a66-80c6-468b-82f1-bcecd6718903	478c5039-1567-4117-afc6-2fc27396731f	\N	user	你好，我想练习中文口语。	0	2026-07-24 10:14:59.897
2968f9b1-f1fb-45b1-a58b-0b619c54f576	478c5039-1567-4117-afc6-2fc27396731f	\N	assistant	嗨，朋友！我是AILOS，主要负责帮你学英语的导师哦😊 不过用中文聊天交流完全没问题，就当轻松练习啦～\n\n你平时说中文机会多吗？咱们可以从简单的自我介绍开始：比如“我叫XX，今天天气真好”。你先说说你叫什么、最近在忙啥？慢慢说，我陪你练，别紧张～	256	2026-07-24 10:15:02.359
8a888a6e-b0b9-48f4-ac92-fd2e46e6b71f	478c5039-1567-4117-afc6-2fc27396731f	\N	user	你好，我想练习中文口语。	0	2026-07-24 10:15:07.179
aa5ed4ca-cb92-40dc-8dc4-349515354c33	478c5039-1567-4117-afc6-2fc27396731f	\N	assistant	哈哈，朋友，你刚才发过一模一样的话啦😄 不过没关系，咱们接着练！\n\n我是AILOS，虽然本职是英语导师，但陪你聊中文完全没问题～你叫什么名字？今天心情怎么样？像“我叫小明，今天很开心”这样简单说就行。慢慢来，说错也没事，勇敢开口最棒！	344	2026-07-24 10:15:09.437
191197d4-17d8-4837-a06a-784e53f322c6	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	こんにちは、日本語を勉強したいです	0	2026-07-25 06:50:09.59
3b1369a1-50b8-4a10-8652-375caa29dab7	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	assistant	嗨！虽然你写了日语“こんにちは、日本語を勉強したいです”（你好，我想学日语），但我是你的英语导师AILOS哦～咱们主要一起学英语吧！😊\n\n作为初学者，先学个简单问候：\n中文解释：英语“Hello”是你好，“I want to learn English”是我想要学英语。\n英语例句：Hello! I want to learn English.\n\n你想练哪方面？随时说，像朋友聊天就行！	305	2026-07-25 06:50:12.521
7ba23133-84bc-41f7-b33b-6bf617e7bba4	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	こんにちは	0	2026-07-25 06:51:35.943
f12b3e8d-8f04-43a1-a40b-cb634771cddd	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	assistant	哈哈，你又用日语说“こんにちは”（你好）啦！😊 不过我是英语导师，咱们用英语打招呼试试？\n\n中文解释：英语里“Hello”或“Hi”都是“你好”，很适合初学者。\n英语例句：Hi! How are you?\n\n想继续聊英语吗？随便说，朋友一样轻松！	388	2026-07-25 06:51:38.233
98ff233c-d3e5-483f-8aa5-39968341647b	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	konnichiwa	0	2026-07-25 06:51:52.54
075531c6-2cdb-4794-9bcc-ccb81318796a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	assistant	哈哈，你用罗马音写了“konnichiwa”（日语“你好”）！😊 我们是英语时间哦～\n\n中文解释：英语打招呼最简单用“Hi”或“Hello”，回答“I'm fine”是我很好。\n英语例句：Hello! I'm fine.\n\n下次试试用英语说你好？慢慢来，朋友般轻松学！	470	2026-07-25 06:51:54.979
f2b039a6-d84b-4a2a-a4cf-6105329a11ab	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	konnichiwa	0	2026-07-25 07:42:38.767
033cdddb-02ff-421f-80cc-7acc645c65ab	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	konnichiwa	0	2026-07-25 07:44:47.347
9f30f743-da4c-4351-8879-f9f4873af108	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	user	konnichiwa	0	2026-07-25 07:51:59.377
adc9bbed-7996-4960-94f8-ecc4516c1c40	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	assistant	哈哈，你连发三遍“konnichiwa”！看来很喜欢日语问候～😊 但我是英语导师，咱们练英语吧！\n\n中文解释：英语重复打招呼可用“Hi there”或简单“Hello”，很亲切。\n英语例句：Hello! Hello! Hello!\n\n试试用英语说三次你好？慢慢来，像朋友聊天就好！	565	2026-07-25 07:52:02.066
\.


--
-- Data for Name: AiUsageDailyStatistic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AiUsageDailyStatistic" (id, date, "userId", "workspaceId", "requestType", "totalRequests", "inputTokens", "outputTokens", "estimatedCost", "assetHitRate", "createdAt") FROM stdin;
b1daf45b-2638-486b-a05a-8fc1c45b030a	2026-07-23 16:00:00	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	conversation	4	371	276	0	0	2026-07-24 03:57:01.034
c7df7f1e-75ee-4c24-847f-2fb32d53894c	2026-07-23 16:00:00	a5703492-28d1-4602-a7ec-08922b68bbd3	\N	conversation	2	236	172	0	0	2026-07-24 09:58:50.328
5dfb7a75-a78d-4406-8bea-8a9dc95f72a5	2026-07-23 16:00:00	4acc4546-b008-4536-9577-f9a8e87356a3	\N	conversation	3	319	239	0	0	2026-07-24 09:59:49.273
cb7ac096-176f-4700-85a4-bcdeb446f2d6	2026-07-25 16:00:00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	27	2191	2191	0	0	2026-07-26 09:21:42.165
3827891e-a9ee-4294-b6d2-86661ad30b59	2026-07-23 16:00:00	478c5039-1567-4117-afc6-2fc27396731f	\N	conversation	9	1162	787	0	0	2026-07-24 09:55:18.666
1b8b125d-c435-4f07-918b-be2b821b8bbe	2026-07-23 16:00:00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	5	600	564	0	0	2026-07-24 09:28:15.588
d6290812-5866-4ae7-9f06-c7fac940ae67	2026-07-26 16:00:00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	3	324	324	0	0	2026-07-27 03:52:09.032
8adcf319-fb40-4c45-9dd3-ac0de2316f00	2026-07-24 16:00:00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	4	990	515	0	0	2026-07-25 06:50:12.519
96ee52d8-fc4c-4413-9471-c3bf1ea4c3fa	2026-07-27 16:00:00	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	conversation	1	119	119	0	0	2026-07-28 03:03:08.923
5c22b553-a63f-45f7-9a84-92c144224fa2	2026-07-25 16:00:00	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	\N	conversation	1	102	102	0	0	2026-07-26 09:49:23.801
\.


--
-- Data for Name: CompanionProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CompanionProfile" (id, "userId", name, description, personality, "voiceStyle", catchphrase, greeting, "systemPrompt", "avatarEmoji", metadata, "createdAt", "updatedAt") FROM stdin;
d374143f-ce2d-4297-85b0-b00b374aa3c1	df440e3c-56cc-4455-8426-9a279bc58f6c	小樱	一个温柔的邻家姐姐，声音软软的，很会鼓励人，口头禅是慢慢来我陪着你	温柔体贴的邻家姐姐，软糯耐心，善于鼓励陪伴	温柔女声	慢慢来我陪着你	嗨，我是小樱～以后咱们一起学习吧，慢慢来我陪着你，不用着急哦。	你是用户的AI学习搭子「小樱」。性格：温柔体贴的邻家姐姐，软糯耐心，善于鼓励陪伴。声音风格：温柔女声。口头禅：「慢慢来我陪着你」。你陪伴用户学习日语，始终保持角色人设，用鼓励和陪伴感帮助用户坚持学习。回复口语化、亲切，偶尔自然地使用口头禅。	🌸	\N	2026-07-25 16:25:29.986	2026-07-26 00:39:19.559
\.


--
-- Data for Name: ContentLanguageVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContentLanguageVersion" (id, "contentId", "languageCode", version, "translatedContent", "qualityScore", "reviewedBy", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CourseBlueprint; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CourseBlueprint" (id, title, description, "languageCode", level, category, duration, modules, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DailyLearningPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DailyLearningPlan" (id, "userId", "dayNumber", "planDate", "targetLanguage", "focusArea", scene, duration, tasks, "contentSnapshot", status, "completedAt", score, "createdAt", "updatedAt") FROM stdin;
6d81bd06-9b92-4326-8353-829c7145b596	df440e3c-56cc-4455-8426-9a279bc58f6c	1	2026-07-25 16:00:00	ja	vocabulary	social	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "打牢基础·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "social场景对话练习"}]	{"phase": "打牢基础", "title": "第1天 · 打牢基础 · 生活会话", "method": "艾宾浩斯遗忘曲线间隔复习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
42d40406-b5ca-4f2b-b403-203563c36334	df440e3c-56cc-4455-8426-9a279bc58f6c	2	2026-07-26 16:00:00	ja	grammar	dining	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "打牢基础·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "dining场景对话练习"}]	{"phase": "打牢基础", "title": "第2天 · 打牢基础 · 生活会话", "method": "可理解性输入(Krashen i+1)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
05c9bc91-3480-448a-b355-5692a3f131a9	df440e3c-56cc-4455-8426-9a279bc58f6c	3	2026-07-27 16:00:00	ja	listening	shopping	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "打牢基础·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "shopping场景对话练习"}]	{"phase": "打牢基础", "title": "第3天 · 打牢基础 · 生活会话", "method": "影子跟读法(Shadowing)", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
5296ab7d-2c6a-431f-bfb7-ea7e7a41e7ba	df440e3c-56cc-4455-8426-9a279bc58f6c	4	2026-07-28 16:00:00	ja	speaking	travel	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "打牢基础·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "travel场景对话练习"}]	{"phase": "打牢基础", "title": "第4天 · 打牢基础 · 生活会话", "method": "费曼输出法", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
88860893-33aa-4037-85ef-0e8d0933be8f	df440e3c-56cc-4455-8426-9a279bc58f6c	5	2026-07-29 16:00:00	ja	vocabulary	housing	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "打牢基础·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "housing场景对话练习"}]	{"phase": "打牢基础", "title": "第5天 · 打牢基础 · 生活会话", "method": "沉浸式情景学习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
c9a661e2-a1c3-4756-b757-bc075c03acd4	df440e3c-56cc-4455-8426-9a279bc58f6c	6	2026-07-30 16:00:00	ja	grammar	medical	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "打牢基础·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "medical场景对话练习"}]	{"phase": "打牢基础", "title": "第6天 · 打牢基础 · 生活会话", "method": "语块记忆法(Chunking)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
6d1b2918-cf13-4a96-ba16-9fc083f4f216	df440e3c-56cc-4455-8426-9a279bc58f6c	7	2026-07-31 16:00:00	ja	listening	social	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "打牢基础·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "social场景对话练习"}]	{"phase": "打牢基础", "title": "第7天 · 打牢基础 · 生活会话", "method": "艾宾浩斯遗忘曲线间隔复习", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
cffafb7d-7353-4ce3-a754-126b21a811a0	df440e3c-56cc-4455-8426-9a279bc58f6c	8	2026-08-01 16:00:00	ja	speaking	dining	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "打牢基础·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "dining场景对话练习"}]	{"phase": "打牢基础", "title": "第8天 · 打牢基础 · 生活会话", "method": "可理解性输入(Krashen i+1)", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
a4c936a6-d47d-41c1-884b-75d84bf2fd7a	df440e3c-56cc-4455-8426-9a279bc58f6c	9	2026-08-02 16:00:00	ja	vocabulary	shopping	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "打牢基础·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "shopping场景对话练习"}]	{"phase": "打牢基础", "title": "第9天 · 打牢基础 · 生活会话", "method": "影子跟读法(Shadowing)", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
847ce379-1342-4995-b9bb-1fcc0f7c9ab4	df440e3c-56cc-4455-8426-9a279bc58f6c	10	2026-08-03 16:00:00	ja	grammar	travel	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "打牢基础·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "travel场景对话练习"}]	{"phase": "打牢基础", "title": "第10天 · 打牢基础 · 生活会话", "method": "费曼输出法", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
7a31b74c-7dc0-4358-b405-2e35b2d9fefe	df440e3c-56cc-4455-8426-9a279bc58f6c	11	2026-08-04 16:00:00	ja	listening	housing	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "场景应用·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "housing场景对话练习"}]	{"phase": "场景应用", "title": "第11天 · 场景应用 · 生活会话", "method": "沉浸式情景学习", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
4dc4404c-f42b-4fbf-bb1d-16fe14056049	df440e3c-56cc-4455-8426-9a279bc58f6c	12	2026-08-05 16:00:00	ja	speaking	medical	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "场景应用·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "medical场景对话练习"}]	{"phase": "场景应用", "title": "第12天 · 场景应用 · 生活会话", "method": "语块记忆法(Chunking)", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
a8b6e9f1-3a6b-43cb-b806-1fea0a485600	df440e3c-56cc-4455-8426-9a279bc58f6c	13	2026-08-06 16:00:00	ja	vocabulary	social	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "场景应用·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "social场景对话练习"}]	{"phase": "场景应用", "title": "第13天 · 场景应用 · 生活会话", "method": "艾宾浩斯遗忘曲线间隔复习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
d6b6aa8b-4b1f-47fa-b1ae-0ba385426fe7	df440e3c-56cc-4455-8426-9a279bc58f6c	14	2026-08-07 16:00:00	ja	grammar	dining	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "场景应用·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "dining场景对话练习"}]	{"phase": "场景应用", "title": "第14天 · 场景应用 · 生活会话", "method": "可理解性输入(Krashen i+1)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
45e0d029-4f03-4ff6-bd29-586701740c0f	df440e3c-56cc-4455-8426-9a279bc58f6c	15	2026-08-08 16:00:00	ja	listening	shopping	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "场景应用·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "shopping场景对话练习"}]	{"phase": "场景应用", "title": "第15天 · 场景应用 · 生活会话", "method": "影子跟读法(Shadowing)", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
e783d089-c29a-4d7a-915f-78ccd3895e3c	df440e3c-56cc-4455-8426-9a279bc58f6c	16	2026-08-09 16:00:00	ja	speaking	travel	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "场景应用·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "travel场景对话练习"}]	{"phase": "场景应用", "title": "第16天 · 场景应用 · 生活会话", "method": "费曼输出法", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
2002fff8-de67-44b7-b72f-80386693756f	df440e3c-56cc-4455-8426-9a279bc58f6c	17	2026-08-10 16:00:00	ja	vocabulary	housing	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "场景应用·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "housing场景对话练习"}]	{"phase": "场景应用", "title": "第17天 · 场景应用 · 生活会话", "method": "沉浸式情景学习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
f869122a-0b48-49e0-8e0e-041240de15af	df440e3c-56cc-4455-8426-9a279bc58f6c	18	2026-08-11 16:00:00	ja	grammar	medical	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "场景应用·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "medical场景对话练习"}]	{"phase": "场景应用", "title": "第18天 · 场景应用 · 生活会话", "method": "语块记忆法(Chunking)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
9e9fcf7f-d0bd-40e2-899f-835c498df61b	df440e3c-56cc-4455-8426-9a279bc58f6c	19	2026-08-12 16:00:00	ja	listening	social	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "场景应用·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "social场景对话练习"}]	{"phase": "场景应用", "title": "第19天 · 场景应用 · 生活会话", "method": "艾宾浩斯遗忘曲线间隔复习", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
8deed061-73b8-4230-8735-d155b63768c7	df440e3c-56cc-4455-8426-9a279bc58f6c	20	2026-08-13 16:00:00	ja	speaking	dining	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "场景应用·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "dining场景对话练习"}]	{"phase": "场景应用", "title": "第20天 · 场景应用 · 生活会话", "method": "可理解性输入(Krashen i+1)", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
03c3e3f1-43f2-487d-b06a-0a18046390a6	df440e3c-56cc-4455-8426-9a279bc58f6c	21	2026-08-14 16:00:00	ja	vocabulary	shopping	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "综合实战·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "shopping场景对话练习"}]	{"phase": "综合实战", "title": "第21天 · 综合实战 · 生活会话", "method": "影子跟读法(Shadowing)", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
a3cc7eb5-c888-49d7-9131-42f79d828559	df440e3c-56cc-4455-8426-9a279bc58f6c	22	2026-08-15 16:00:00	ja	grammar	travel	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "综合实战·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "travel场景对话练习"}]	{"phase": "综合实战", "title": "第22天 · 综合实战 · 生活会话", "method": "费曼输出法", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
6b1d6c91-e188-47d6-9c19-2d810f74a7a9	df440e3c-56cc-4455-8426-9a279bc58f6c	23	2026-08-16 16:00:00	ja	listening	housing	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "综合实战·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "housing场景对话练习"}]	{"phase": "综合实战", "title": "第23天 · 综合实战 · 生活会话", "method": "沉浸式情景学习", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
6d8d520b-2d90-4090-aff7-86767167f2cc	df440e3c-56cc-4455-8426-9a279bc58f6c	24	2026-08-17 16:00:00	ja	speaking	medical	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "综合实战·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "medical场景对话练习"}]	{"phase": "综合实战", "title": "第24天 · 综合实战 · 生活会话", "method": "语块记忆法(Chunking)", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
dc20db6f-0cd4-43cb-80fd-8a675983bb88	df440e3c-56cc-4455-8426-9a279bc58f6c	25	2026-08-18 16:00:00	ja	vocabulary	social	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "综合实战·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "social场景对话练习"}]	{"phase": "综合实战", "title": "第25天 · 综合实战 · 生活会话", "method": "艾宾浩斯遗忘曲线间隔复习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
0bb33b92-5718-4f5c-b2b6-79b928058854	df440e3c-56cc-4455-8426-9a279bc58f6c	26	2026-08-19 16:00:00	ja	grammar	dining	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "综合实战·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "dining场景对话练习"}]	{"phase": "综合实战", "title": "第26天 · 综合实战 · 生活会话", "method": "可理解性输入(Krashen i+1)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
bef45e77-f231-4102-977e-6a7af20b23ea	df440e3c-56cc-4455-8426-9a279bc58f6c	27	2026-08-20 16:00:00	ja	listening	shopping	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "listening", "count": 5, "description": "综合实战·listening专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "shopping场景对话练习"}]	{"phase": "综合实战", "title": "第27天 · 综合实战 · 生活会话", "method": "影子跟读法(Shadowing)", "textbookRef": "《GENKI》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
d7ec6960-ca58-4f8e-b5f6-92f966903999	df440e3c-56cc-4455-8426-9a279bc58f6c	28	2026-08-21 16:00:00	ja	speaking	travel	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "speaking", "count": 5, "description": "综合实战·speaking专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "travel场景对话练习"}]	{"phase": "综合实战", "title": "第28天 · 综合实战 · 生活会话", "method": "费曼输出法", "textbookRef": "JLPT官方真题 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
a761ce25-c152-47a3-992c-163cb19825df	df440e3c-56cc-4455-8426-9a279bc58f6c	29	2026-08-22 16:00:00	ja	vocabulary	housing	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "vocabulary", "count": 5, "description": "综合实战·vocabulary专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "housing场景对话练习"}]	{"phase": "综合实战", "title": "第29天 · 综合实战 · 生活会话", "method": "沉浸式情景学习", "textbookRef": "《新标准日本语》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
3adab47f-7d5e-4eb2-a2a6-78ab83450d82	df440e3c-56cc-4455-8426-9a279bc58f6c	30	2026-08-23 16:00:00	ja	grammar	medical	30	[{"type": "vocabulary", "count": 10, "description": "N5核心词汇学习"}, {"type": "grammar", "count": 5, "description": "综合实战·grammar专项训练（侧重：重点提升听力和口语，希望能无字幕看日剧）"}, {"type": "dialogue", "count": 1, "description": "medical场景对话练习"}]	{"phase": "综合实战", "title": "第30天 · 综合实战 · 生活会话", "method": "语块记忆法(Chunking)", "textbookRef": "《大家的日语(みんなの日本語)》 对应N5章节"}	pending	\N	\N	2026-07-26 00:39:49.977	2026-07-26 00:39:49.977
\.


--
-- Data for Name: DataExportRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DataExportRequest" (id, "userId", status, "fileUrl", "requestedAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: GuestSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GuestSession" (id, "deviceId", "localProgress", "createdAt", "lastActiveAt", "convertedUserId", "convertedAt") FROM stdin;
57a4ac28-0594-40dd-94df-8aca6d8a4c97	web_1784551654341_3wxegx951	\N	2026-07-20 12:47:34.646	2026-07-20 12:47:34.646	\N	\N
df0b3e0a-fa4c-495d-9ea2-f494ed5328e1	web_1784551791180_6j9jxokzo	\N	2026-07-20 12:49:51.452	2026-07-20 12:49:51.452	\N	\N
e08bf9dd-eb21-400e-8b80-79cb90e6329b	web_1784551795101_ngp0bftv6	\N	2026-07-20 12:49:55.372	2026-07-20 12:49:55.372	\N	\N
f901e5cf-f266-4cde-8dc6-8bd821ded104	web_1784552014907_yzhbdctbf	\N	2026-07-20 12:53:35.181	2026-07-20 12:53:35.181	\N	\N
624beb80-c862-435a-b52f-4dd0a11b5a20	web_1784552020164_m9qaspbrw	\N	2026-07-20 12:53:40.437	2026-07-20 12:53:40.437	\N	\N
4c40a1fb-3f5b-4bd6-9d32-1993fd5122f7	web_1784552048540_dctgh8p1p	\N	2026-07-20 12:54:08.813	2026-07-20 12:54:08.813	\N	\N
cc32f9d9-162a-4980-8845-af4ab361c234	web_1784552121837_y3wy4yfnc	\N	2026-07-20 12:55:22.688	2026-07-20 12:55:22.688	\N	\N
4f2830a3-dee0-438b-9d45-bced5a6ff20a	web_1784552125713_94yarx498	\N	2026-07-20 12:55:25.988	2026-07-20 12:55:25.988	\N	\N
6e0388fa-4280-4a46-a451-e35c7dc749bc	web_1784552736421_0r0ife0di	\N	2026-07-20 13:05:37.212	2026-07-20 13:05:37.212	\N	\N
aa9797c3-35df-4c2a-97ca-829611f72960	web_1784552810586_tfvlmi0ed	\N	2026-07-20 13:06:50.86	2026-07-20 13:06:50.86	\N	\N
6aea11d7-0ceb-409e-8334-13709fa690df	guest_1784553065928_0e6afw8c	\N	2026-07-20 13:11:07.085	2026-07-20 13:11:07.085	\N	\N
99ef6148-eaaf-41e2-8b95-12d821cb1a29	web_1784553075323_6kedg1cqf	\N	2026-07-20 13:11:15.595	2026-07-20 13:11:15.595	\N	\N
4a260cae-accc-43f9-8e93-6c9da76952b1	test_1784553124970	\N	2026-07-20 13:12:05.243	2026-07-20 13:12:05.243	\N	\N
ea3869f2-a344-4c8a-9140-e508d238778f	guest_1784553187369_kihoku8a5	\N	2026-07-20 13:13:08.072	2026-07-20 13:13:08.072	\N	\N
d9d64866-cd71-4fe0-8ea5-eff9aef29bda	guest_1784553956228_8z3ikmopr	\N	2026-07-20 13:25:57.233	2026-07-20 13:25:57.233	\N	\N
c5c80c59-b66f-4d84-9b47-f2a5338705a4	guest_1784553965730_qybictgjj	\N	2026-07-20 13:26:06.003	2026-07-20 13:26:06.003	\N	\N
94a1c19f-89f8-4c32-9104-056358278b20	guest_1784553967199_1cng9qh8p	\N	2026-07-20 13:26:08.198	2026-07-20 13:26:08.198	\N	\N
1a2703e6-ac14-44e9-9c65-cbd784d41549	guest_1784553968173_clm7bgnjn	\N	2026-07-20 13:26:08.448	2026-07-20 13:26:08.448	\N	\N
e713d1ae-bc5f-4cd3-bd48-63998670af6b	test123	\N	2026-07-20 13:27:36.361	2026-07-20 13:27:36.361	\N	\N
cb67dcfc-b609-4900-b0bb-d2e1bbd830aa	diag_1784554116012_cbsdyx	\N	2026-07-20 13:28:36.587	2026-07-20 13:28:36.587	\N	\N
2ffbade5-3836-4030-87d9-67c949db69cd	browser_1784554167849_jdwjps	\N	2026-07-20 13:29:28.751	2026-07-20 13:29:28.751	\N	\N
ff9f26e9-6dea-406a-9b50-efb09712cf93	guest_1784555258813_bkg42oym4	\N	2026-07-20 13:47:39.093	2026-07-20 13:47:39.093	\N	\N
fd3126ae-39b6-4cdc-a3e7-cfdd7f7d9df8	guest_1784556836213_2754yatse	\N	2026-07-20 14:13:56.497	2026-07-20 14:13:56.497	\N	\N
a4246302-f31b-40a2-a930-70ff3463f0aa	guest_1784556917094_a57qs04om	\N	2026-07-20 14:15:17.38	2026-07-20 14:15:17.38	\N	\N
d543d38d-d8e0-4f89-8e9b-31942466ce46	guest_1784556933936_ypa8al07j	\N	2026-07-20 14:15:34.907	2026-07-20 14:15:34.907	\N	\N
f11e6df6-c435-42c6-874c-9f0c6c192777	guest_1784556935905_a5bmoztvy	\N	2026-07-20 14:15:36.641	2026-07-20 14:15:36.641	\N	\N
719efc81-db37-4f9d-a71e-e2afcfaebd17	guest_1784556939479_433bocohm	\N	2026-07-20 14:15:39.763	2026-07-20 14:15:39.763	\N	\N
89e60ad2-e72c-4a40-971c-97ce75a93f0e	guest_1784557788218_98efkcyt6	\N	2026-07-20 14:29:48.502	2026-07-20 14:29:48.502	\N	\N
8e50299f-7485-4d44-a586-5ffba0a6f326	guest_1784558112590_lzhpdwcyp	\N	2026-07-20 14:35:13.243	2026-07-20 14:35:13.243	\N	\N
cad52740-93f6-424c-8459-b72f9c72bcaf	guest_1784558810125_3f5mi5o0d	\N	2026-07-20 14:46:51.165	2026-07-20 14:46:51.165	\N	\N
e454f03c-ec29-436a-9056-acb354397e6c	guest_1784559008326_q45cipu12	\N	2026-07-20 14:50:08.766	2026-07-20 14:50:08.766	\N	\N
11c16721-6b45-46da-acf0-86e44cf221ea	audit_guest_test_20260721	\N	2026-07-20 20:16:54.963	2026-07-20 20:16:54.963	\N	\N
ee2af305-582e-458b-959b-d0a536954786	test	\N	2026-07-20 20:19:37.324	2026-07-20 20:19:37.324	\N	\N
4e127724-edf6-4bd2-a6b3-2c26a505a608	scan_test_20260721	\N	2026-07-20 23:30:08.82	2026-07-20 23:30:08.82	\N	\N
119e7e0c-bce8-4390-8bec-20c75f89b6cb	audit_scan_20260721	\N	2026-07-20 23:30:21.357	2026-07-20 23:30:21.357	\N	\N
62bf5d90-9cd4-4c52-acef-d5a5cead09ba	audit_scan_verify_20260721	\N	2026-07-20 23:31:08.763	2026-07-20 23:31:08.763	\N	\N
f5c1104d-892c-4ace-96e8-7df7e6f7ac95	guest_1784592613344_mvdqpvx41	\N	2026-07-21 00:10:13.435	2026-07-21 00:10:13.435	\N	\N
b5b9729a-1ff8-4bba-bd1a-6025ba498268	p1_002_test	\N	2026-07-21 00:10:43.837	2026-07-21 00:10:43.837	\N	\N
a883e560-ed2c-4920-a26c-e68a5c367eea	guest_1784602407767_q32iotsnm	\N	2026-07-21 02:53:27.887	2026-07-21 02:53:27.887	\N	\N
4660cdfa-8ad7-4b35-a70b-6e1870f1ecee	guest_1784602421782_cjpm4y5fb	\N	2026-07-21 02:53:41.895	2026-07-21 02:53:41.895	\N	\N
f4b68599-7e86-4c94-878b-12dc4a05927b	guest_1784607739809_8ry3ejb3y	\N	2026-07-21 04:22:19.902	2026-07-21 04:22:19.902	\N	\N
1c4f4f01-89e8-40ea-98e4-6b04c783bccb	guest_1784607972108_iy5sdxsap	\N	2026-07-21 04:26:12.52	2026-07-21 04:26:12.52	\N	\N
56a41124-db9b-49bb-900b-764dabdfe4dd	guest_1784624414324_e2t6x05m6	\N	2026-07-21 09:00:14.418	2026-07-21 09:00:14.418	\N	\N
c4123a96-add1-4ef6-9aeb-2e5399055316	guest_1784624476676_kllkzyqd8	\N	2026-07-21 09:01:16.772	2026-07-21 09:01:16.772	\N	\N
879c2955-dea8-4345-9109-f5e65827c51c	guest_1784624538943_g0mvqm56z	\N	2026-07-21 09:02:19.801	2026-07-21 09:02:19.801	\N	\N
16d05cee-0f2c-4815-8735-e92380789a31	test_guest_check	\N	2026-07-21 09:06:26.498	2026-07-21 09:06:26.498	\N	\N
14701aee-46e4-4755-be75-68fbf3440981	guest_1784625175910_6kbjmy61f	\N	2026-07-21 09:12:56.016	2026-07-21 09:12:56.016	\N	\N
0358ff24-824f-4031-bc73-c5c5500b58f4	guest_1784625410351_2hq3wjlsy	\N	2026-07-21 09:16:50.462	2026-07-21 09:16:50.462	\N	\N
c52057c4-d883-438d-a54c-3112134d99fc	guest_1784625417274_1avv0sy06	\N	2026-07-21 09:16:57.391	2026-07-21 09:16:57.391	\N	\N
81ffa3bf-32b7-4593-93b0-9166f727952c	guest_1784625438132_713qczxsj	\N	2026-07-21 09:17:18.225	2026-07-21 09:17:18.225	\N	\N
625bf5e4-dda7-4e58-835a-7a62020b5b99	guest_1784625774725_zvf5yhg90	\N	2026-07-21 09:22:55.315	2026-07-21 09:22:55.315	\N	\N
3c13cea6-5e94-4823-8769-ed5785f151f7	test_device_1784629166704	\N	2026-07-21 10:19:26.752	2026-07-21 10:19:26.763	\N	\N
bd719f0a-604c-44ea-9b18-cb39aeeb9b14	test-001	\N	2026-07-21 11:59:09.851	2026-07-21 11:59:09.851	\N	\N
b0737cfe-4433-46bb-8809-531d87e8bef6	web_1785207665905	\N	2026-07-28 03:01:05.906	2026-07-28 03:01:05.906	\N	\N
e42247f7-87fe-44b2-a346-bd32d9f6f383	final-test-002	\N	2026-07-21 12:06:37.767	2026-07-21 12:06:58.036	\N	\N
1641293f-3569-454c-912e-f8133ea2d147	final-check-001	\N	2026-07-21 12:18:31.814	2026-07-21 12:18:31.814	\N	\N
9ac4feed-a4f4-48ca-a190-aaad2ab97502	final-999	\N	2026-07-21 12:25:21.803	2026-07-21 12:25:21.803	\N	\N
46971531-55e2-4839-b566-8a2767e30615	guest_1784694544423_9flxak72q	\N	2026-07-22 04:29:04.713	2026-07-22 04:29:04.713	\N	\N
7c773d6a-adaf-4f41-83b1-903fd96bb686	audit_test	\N	2026-07-22 13:57:21.804	2026-07-22 13:57:21.804	\N	\N
0edfe221-43a5-4b79-8972-e0d51382501b	web_1785027871682	\N	2026-07-26 01:04:31.684	2026-07-26 01:04:31.683	\N	\N
b89e4ea5-f5c8-4d3b-90d0-5d32f1e2d3b9	guest_1785029635464_ckr0ebdeq	\N	2026-07-26 01:33:55.668	2026-07-26 01:33:55.668	\N	\N
571fcb7b-e1ea-4f06-a860-777f00c01384	guest_1785122935919_04xu7l840	\N	2026-07-27 03:28:56.022	2026-07-27 03:28:56.021	\N	\N
faad61be-af59-4be9-92e6-49676f95986e	web_1785207734919	\N	2026-07-28 03:02:14.92	2026-07-28 03:02:14.919	\N	\N
280200eb-90e1-490c-9e1e-e597d79b8481	web_1785207783712	\N	2026-07-28 03:03:03.713	2026-07-28 03:03:03.712	\N	\N
964de634-1880-4a42-b7d0-045cdb5c59a1	web_1785207792027	\N	2026-07-28 03:03:12.028	2026-07-28 03:03:12.027	\N	\N
\.


--
-- Data for Name: LanguageConsistencyAlert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LanguageConsistencyAlert" (id, "userId", "conflictFields", "tableValues", reason, status, operator, "resolvedBy", "resolvedAt", "resolveNote", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LanguageConsistencyLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LanguageConsistencyLog" (id, "userId", "checkTime", "nativeLangCurrent", "nativeLangExpected", "targetLangCurrent", "targetLangExpected", "anomalyType", "handleResult", "protectWindowFlag", operator, detail, "runId") FROM stdin;
c5cfa8c0-e4c8-4f52-8b61-222b90701ddc	4496260c-9f53-46a2-b249-539e5fe4c7db	2026-07-26 09:26:48.492	ja	ja	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
37faad3f-cedf-46eb-a822-223ceec019be	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	2026-07-26 09:26:48.492	en	en	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
dbda0cdf-b64f-4714-81e9-a59faca319eb	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-26 09:26:48.492	ja	ja	en	en	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "ja", "learning.languageCode": "en", "defaultExplanationLanguage": "ja"}}	afd50c2d-28c8-4909-8460-f6d1798bf444
2143e32b-aadb-4d26-808d-17416295f435	f617404b-819e-4c7d-b4a5-8032b0b899cd	2026-07-26 09:26:48.492	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
0cfdadfc-1c8d-47c0-a5e6-6f2e4301d2fc	936fc045-7b74-4e58-b9f0-dea7ef2776aa	2026-07-26 09:26:48.492	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
debba53f-a2e6-4c2e-9b1f-b74c0cee349e	7b8e0888-8843-4971-b6ef-a84794f2e797	2026-07-26 09:26:48.492	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
43e2a8d3-ed68-436b-8af1-83dc4cb027d8	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-26 09:26:48.492	zh-CN	zh-CN	ja	ja	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	afd50c2d-28c8-4909-8460-f6d1798bf444
a4edfa1d-def1-41e0-baef-2689544d6403	5b952aaa-610a-4ad2-a7a8-408772bbdc19	2026-07-26 09:26:48.492	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:df440e3c-56cc-4455-8426-9a279bc58f6c	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	afd50c2d-28c8-4909-8460-f6d1798bf444
95ed3aa2-25ea-4805-b2e1-f52af2603833	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-26 14:13:49.231	\N	\N	en#p1,zh-CN#p2	en	结构异常-多active	已修复	f	admin:supervisor-dedupe	{"keep": {"id": "871bbbb0-08ad-47ad-99b7-5fc22890943b", "code": "en", "priority": 1, "updatedAt": "2026-07-20T02:12:52.120Z"}, "rule": "keep priority asc first (tie: updatedAt desc), others -> inactive", "dryRun": false, "deactivate": [{"id": "9e019722-5bfc-46d8-909d-5b860d20c7e0", "code": "zh-CN", "priority": 2, "updatedAt": "2026-07-20T02:12:52.123Z"}]}	24d193ed-6242-40df-a815-9b59c43d9271
302142e2-b4ab-4365-95d7-d42828c70b18	4496260c-9f53-46a2-b249-539e5fe4c7db	2026-07-26 14:14:29.451	ja	ja	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
dcbc91a3-1e87-4a8b-9e19-72d8cf3638a6	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	2026-07-26 14:14:29.451	en	en	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
2592960a-39cb-4d5d-9be0-b4fde2c14b82	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-26 14:14:29.451	ja	ja	en	en	正常	无操作	f	admin:supervisor-inspection	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "ja", "learning.languageCode": "en", "defaultExplanationLanguage": "ja"}}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
1f40674a-37da-4ce3-b7a4-f7da7270a456	f617404b-819e-4c7d-b4a5-8032b0b899cd	2026-07-26 14:14:29.451	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
56b7e102-bcb3-430a-aabf-0991768ca553	936fc045-7b74-4e58-b9f0-dea7ef2776aa	2026-07-26 14:14:29.451	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
ab1db342-96b1-433f-b7c3-65a9b123964c	7b8e0888-8843-4971-b6ef-a84794f2e797	2026-07-26 14:14:29.451	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
a3f09b70-06f3-4206-bf7c-0636c237f9ab	5b952aaa-610a-4ad2-a7a8-408772bbdc19	2026-07-26 14:14:29.451	zh-CN	zh-CN	\N	\N	正常	无操作	f	admin:supervisor-inspection	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
0da244ac-dc37-4188-932b-173e45eef2cd	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	2026-07-26 14:14:29.451	zh-CN	zh-CN	ja	ja	正常	无操作	f	admin:supervisor-inspection	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
64fba2ef-15dc-4985-ac80-c480720deca7	bee326da-b724-4e53-a833-97b113038280	2026-07-26 14:14:29.451	zh	zh-CN	ja	ja	轻度漂移	已修复	f	admin:supervisor-inspection	{"alertId": null, "repairs": [{"to": "zh-CN", "from": "zh", "field": "nativeLanguage", "group": "native"}, {"to": "zh-CN", "from": "zh", "field": "defaultExplanationLanguage", "group": "native"}], "inWindow": false, "driftFields": [{"field": "nativeLanguage", "group": "native", "current": "zh", "canonical": "zh-CN"}, {"field": "defaultExplanationLanguage", "group": "native", "current": "zh", "canonical": "zh-CN"}], "tableValues": {"nativeLanguage": "zh", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh"}}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
7f1091ef-b451-4b11-9e35-7c43941529d0	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-27 19:00:00.753	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
d6136158-93b9-4b56-aba3-1929c54a0245	d6cdc807-a203-4af0-953d-16ded2c5d9d6	2026-07-26 14:14:29.451	zh	zh-CN	ja	ja	轻度漂移	已修复	f	admin:supervisor-inspection	{"alertId": null, "repairs": [{"to": "zh-CN", "from": "zh", "field": "nativeLanguage", "group": "native"}, {"to": "zh-CN", "from": "zh", "field": "defaultExplanationLanguage", "group": "native"}], "inWindow": false, "driftFields": [{"field": "nativeLanguage", "group": "native", "current": "zh", "canonical": "zh-CN"}, {"field": "defaultExplanationLanguage", "group": "native", "current": "zh", "canonical": "zh-CN"}], "tableValues": {"nativeLanguage": "zh", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh"}}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
3b5d3fda-e049-4c74-a8e2-3a5995b4e01e	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-26 14:14:29.451	zh-CN	zh-CN	en	en	正常	无操作	t	admin:supervisor-inspection	{"alertId": null, "repairs": [], "inWindow": true, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "en", "defaultExplanationLanguage": "zh-CN"}}	1d1817d3-3f66-4fbd-b30a-42b0cd4e70f8
a0de6a57-0802-4ce5-8613-11804f499b2a	4496260c-9f53-46a2-b249-539e5fe4c7db	2026-07-26 19:00:00.437	ja	ja	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
f684ee8e-5493-4b6e-b217-c72396e8c189	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	2026-07-26 19:00:00.437	en	en	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
bb1218f0-d280-4a0e-8e62-6bb81636c63d	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-26 19:00:00.437	ja	ja	en	en	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "ja", "learning.languageCode": "en", "defaultExplanationLanguage": "ja"}}	9ab98b77-3e11-417e-b123-730a4b89ff6b
d3ca8647-723e-4ebe-a609-71c0d367de95	f617404b-819e-4c7d-b4a5-8032b0b899cd	2026-07-26 19:00:00.437	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
26a48485-5103-437f-8c79-037f17d8e9b0	936fc045-7b74-4e58-b9f0-dea7ef2776aa	2026-07-26 19:00:00.437	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
bdd4635c-b1eb-4a7e-ad0c-a3ddeee6871c	7b8e0888-8843-4971-b6ef-a84794f2e797	2026-07-26 19:00:00.437	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
93aca1dc-1d4e-4bfc-8a88-fbb3bb0d5f51	5b952aaa-610a-4ad2-a7a8-408772bbdc19	2026-07-26 19:00:00.437	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	9ab98b77-3e11-417e-b123-730a4b89ff6b
f69b8c43-8b8a-449a-b2b6-9723e6169d29	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	2026-07-26 19:00:00.437	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	9ab98b77-3e11-417e-b123-730a4b89ff6b
d06e5b34-e62f-4d0d-8df1-cec2c61d19ae	bee326da-b724-4e53-a833-97b113038280	2026-07-26 19:00:00.437	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	9ab98b77-3e11-417e-b123-730a4b89ff6b
344900f9-0e1c-4d02-b635-67ccfd697d01	d6cdc807-a203-4af0-953d-16ded2c5d9d6	2026-07-26 19:00:00.437	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	9ab98b77-3e11-417e-b123-730a4b89ff6b
3f736d00-03c3-47d5-b872-2e257384dd56	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-26 19:00:00.437	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	9ab98b77-3e11-417e-b123-730a4b89ff6b
7efbc71b-45cd-45c6-bddb-f0a3ca44b88d	4496260c-9f53-46a2-b249-539e5fe4c7db	2026-07-27 19:00:00.753	ja	ja	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
7b3bc9cb-ccbd-4a51-9c46-4b4505b40fa9	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	2026-07-27 19:00:00.753	en	en	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
18d99456-5280-473d-81f2-618d8e578de5	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-27 19:00:00.753	ja	ja	en	en	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "ja", "learning.languageCode": "en", "defaultExplanationLanguage": "ja"}}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
62a5e3f6-d789-43a1-942f-5af6d9f8a6a4	f617404b-819e-4c7d-b4a5-8032b0b899cd	2026-07-27 19:00:00.753	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
70d4950d-f969-43c6-ad4b-9cac33f31309	936fc045-7b74-4e58-b9f0-dea7ef2776aa	2026-07-27 19:00:00.753	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
c5336f16-b896-4397-8c52-03705386931e	7b8e0888-8843-4971-b6ef-a84794f2e797	2026-07-27 19:00:00.753	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
4b1e4839-ad17-4fb9-8691-c36450cd9c33	5b952aaa-610a-4ad2-a7a8-408772bbdc19	2026-07-27 19:00:00.753	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
87b3a4d7-29fa-49ff-9cc9-b46a713c14de	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	2026-07-27 19:00:00.753	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
5d066470-2205-4a70-a802-a5b2a6afb7ea	bee326da-b724-4e53-a833-97b113038280	2026-07-27 19:00:00.753	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
c67f94db-6446-4971-8f83-5c78d3f29f10	d6cdc807-a203-4af0-953d-16ded2c5d9d6	2026-07-27 19:00:00.753	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	16b206f0-29e8-4cf5-aa1d-c7951e9d7555
49748f55-d229-496a-9d4a-a5f06f66d3ca	4496260c-9f53-46a2-b249-539e5fe4c7db	2026-07-28 19:00:00.139	ja	ja	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
48b52653-9dc2-4b6d-9d1e-ebedf86c1feb	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	2026-07-28 19:00:00.139	en	en	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
80144a62-b0a8-42d1-b161-22f52784890f	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2026-07-28 19:00:00.139	ja	ja	en	en	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "ja", "learning.languageCode": "en", "defaultExplanationLanguage": "ja"}}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
872b8ce1-78c4-4b52-a1bf-2e56a70d4d05	f617404b-819e-4c7d-b4a5-8032b0b899cd	2026-07-28 19:00:00.139	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
f8b9793c-1e66-476c-b8b6-15bbb8becfea	936fc045-7b74-4e58-b9f0-dea7ef2776aa	2026-07-28 19:00:00.139	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
b1b47583-b8e7-4817-af58-c905c22f2cc5	7b8e0888-8843-4971-b6ef-a84794f2e797	2026-07-28 19:00:00.139	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
839e19f6-2025-4c52-a228-bd26d189093b	5b952aaa-610a-4ad2-a7a8-408772bbdc19	2026-07-28 19:00:00.139	zh-CN	zh-CN	\N	\N	正常	无操作	f	system	{"note": "语言配置不完整，跳过一致性判定（读链路由 ContextResolver 抛错处理）", "alertId": null, "repairs": []}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
9e0c1f94-0557-4b6a-9b59-384d5bd447da	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	2026-07-28 19:00:00.139	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
03bf5152-db47-426d-ac7e-cf2d68bba37f	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-28 19:00:00.139	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
143ed575-e844-4c9d-8fc7-d9ffc2c02d24	bee326da-b724-4e53-a833-97b113038280	2026-07-28 19:00:00.139	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
89e3f556-3c98-4e32-9dba-eaea43d7a7c6	d6cdc807-a203-4af0-953d-16ded2c5d9d6	2026-07-28 19:00:00.139	zh-CN	zh-CN	ja	ja	正常	无操作	f	system	{"alertId": null, "repairs": [], "inWindow": false, "tableValues": {"nativeLanguage": "zh-CN", "learning.languageCode": "ja", "defaultExplanationLanguage": "zh-CN"}}	c6dbc25a-e084-4a34-8fc4-c92875958d6d
\.


--
-- Data for Name: LanguageIdentity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LanguageIdentity" (id, "languageCode", "displayName", "nativeName", script, direction, "isCustom", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LearningAbilityModel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningAbilityModel" (id, "userId", "languageCode", "lastEventId", dimension, score, level, data, "updatedAt", "createdAt") FROM stdin;
8be7813a-6225-42a8-96e9-0485b43340e9	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	\N	vocabulary	50	N5	{"source": "placement"}	2026-07-26 00:39:16.561	2026-07-25 16:25:26.966
e1e007ab-a8d0-4196-903b-1f59a8209833	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	\N	grammar	50	N5	{"source": "placement"}	2026-07-26 00:39:16.561	2026-07-25 16:25:26.966
83e4a22c-59b4-41dc-9dbd-966e6637724a	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	\N	listening	50	N5	{"source": "placement"}	2026-07-26 00:39:16.561	2026-07-25 16:25:26.966
637db244-6824-4c80-b8c0-bc6d667eef99	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	\N	speaking	30	N5	{"source": "placement"}	2026-07-26 00:39:16.561	2026-07-25 16:25:26.966
\.


--
-- Data for Name: LearningContent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningContent" (id, "contentType", "sourceType", "sourceLanguage", "targetLanguage", "explanationLanguage", "difficultyLevel", "contentVersion", status, "qualityScore", "reuseCount", "contentData", "createdAt", "updatedAt") FROM stdin;
ddf9a15a-2754-484a-9e9d-7d9944b6c249	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "私", "example": "私は学生です。", "meaning": "I / me", "reading": "わたし", "exampleTranslation": "I am a student."}	2026-07-20 03:38:34.266	2026-07-20 03:38:34.266
5426369d-88d2-4d90-90d2-b3e61f5dbb3b	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "学生", "example": "彼は学生です。", "meaning": "Student", "reading": "がくせい", "exampleTranslation": "He is a student."}	2026-07-20 03:38:34.269	2026-07-20 03:38:34.269
fe5a6adf-9746-406d-875e-15799576bb00	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "先生", "example": "先生は親切です。", "meaning": "Teacher", "reading": "せんせい", "exampleTranslation": "The teacher is kind."}	2026-07-20 03:38:34.271	2026-07-20 03:38:34.271
20a75098-9cad-47cc-9112-0744459ebaa5	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "学校", "example": "学校に行きます。", "meaning": "School", "reading": "がっこう", "exampleTranslation": "I go to school."}	2026-07-20 03:38:34.272	2026-07-20 03:38:34.272
bd2c25d7-599a-4354-8ebf-e077503b3a55	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "本", "example": "本を読みます。", "meaning": "Book", "reading": "ほん", "exampleTranslation": "I read a book."}	2026-07-20 03:38:34.273	2026-07-20 03:38:34.273
bc22385b-2dd7-480c-b629-cbd78f0fb10a	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "水", "example": "水を飲みます。", "meaning": "Water", "reading": "みず", "exampleTranslation": "I drink water."}	2026-07-20 03:38:34.274	2026-07-20 03:38:34.274
89259d8d-f3e9-4af7-8475-1b81864d0e6d	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "食べる", "example": "ご飯を食べます。", "meaning": "To eat", "reading": "たべる", "exampleTranslation": "I eat rice."}	2026-07-20 03:38:34.276	2026-07-20 03:38:34.276
eb69ff76-65c1-435d-b1d5-3c73efbaf1f9	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "飲む", "example": "コーヒーを飲みます。", "meaning": "To drink", "reading": "のむ", "exampleTranslation": "I drink coffee."}	2026-07-20 03:38:34.277	2026-07-20 03:38:34.277
9a175923-a986-44f2-b0e1-23602ef3e79b	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "行く", "example": "公園に行きます。", "meaning": "To go", "reading": "いく", "exampleTranslation": "I go to the park."}	2026-07-20 03:38:34.278	2026-07-20 03:38:34.278
0e5f5eb7-ca49-43c9-860e-2eb61edda0d1	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "見る", "example": "テレビを見ます。", "meaning": "To see / watch", "reading": "みる", "exampleTranslation": "I watch TV."}	2026-07-20 03:38:34.28	2026-07-20 03:38:34.28
469f3668-5a8b-4d58-9b1b-1822b7bf8607	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "聞く", "example": "音楽を聞きます。", "meaning": "To listen / hear", "reading": "きく", "exampleTranslation": "I listen to music."}	2026-07-20 03:38:34.281	2026-07-20 03:38:34.281
df51632a-610c-4b8a-904c-65ebebfbada7	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "話す", "example": "日本語を話します。", "meaning": "To speak", "reading": "はなす", "exampleTranslation": "I speak Japanese."}	2026-07-20 03:38:34.282	2026-07-20 03:38:34.282
687ba19c-8bc6-4963-b280-031497ffd816	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "大きい", "example": "大きい家です。", "meaning": "Big", "reading": "おおきい", "exampleTranslation": "It is a big house."}	2026-07-20 03:38:34.284	2026-07-20 03:38:34.284
83943017-8dda-443b-8433-c00c31d9e4fc	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "小さい", "example": "小さい猫です。", "meaning": "Small", "reading": "ちいさい", "exampleTranslation": "It is a small cat."}	2026-07-20 03:38:34.285	2026-07-20 03:38:34.285
440012b8-4a97-4bb6-8920-fc42b0c4d69d	vocabulary	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"word": "新しい", "example": "新しい車です。", "meaning": "New", "reading": "あたらしい", "exampleTranslation": "It is a new car."}	2026-07-20 03:38:34.286	2026-07-20 03:38:34.286
a1481d9c-6a8e-46bd-95e1-79fa3e62b5ba	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Hello", "example": "Hello, how are you?", "meaning": "A greeting", "reading": "he·lo", "exampleTranslation": "你好，你好吗？"}	2026-07-20 03:38:34.287	2026-07-20 03:38:34.287
bbbf0c38-c888-4d1b-a196-372584a44581	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Goodbye", "example": "Goodbye, see you tomorrow!", "meaning": "A farewell", "reading": "good·bye", "exampleTranslation": "再见，明天见！"}	2026-07-20 03:38:34.288	2026-07-20 03:38:34.288
8cb29562-7c15-4c0b-9d98-75ada56d7b61	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Thank you", "example": "Thank you for your help.", "meaning": "Expression of gratitude", "reading": "thank·yoo", "exampleTranslation": "谢谢你的帮助。"}	2026-07-20 03:38:34.289	2026-07-20 03:38:34.289
11b2b6d9-ea2e-4ad3-82d1-25329ab6ea9e	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Please", "example": "Please sit down.", "meaning": "Polite request word", "reading": "pleez", "exampleTranslation": "请坐。"}	2026-07-20 03:38:34.29	2026-07-20 03:38:34.29
7456deea-4be5-4a08-98a5-419d86da6979	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Sorry", "example": "I am sorry for being late.", "meaning": "Expression of apology", "reading": "sor·ee", "exampleTranslation": "对不起我迟到了。"}	2026-07-20 03:38:34.292	2026-07-20 03:38:34.292
b0e82897-fd98-4bc6-abfe-67d2e2a5fdad	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Yes", "example": "Yes, I understand.", "meaning": "Affirmative response", "reading": "yes", "exampleTranslation": "是的，我明白。"}	2026-07-20 03:38:34.293	2026-07-20 03:38:34.293
196d98d4-c691-45c1-ad14-8f3f47f39a32	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "No", "example": "No, thank you.", "meaning": "Negative response", "reading": "no", "exampleTranslation": "不，谢谢。"}	2026-07-20 03:38:34.294	2026-07-20 03:38:34.294
4a2edea8-363d-4241-8a1b-75cdac6a5eb6	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Water", "example": "Can I have some water?", "meaning": "H2O liquid", "reading": "waw·ter", "exampleTranslation": "我可以喝点水吗？"}	2026-07-20 03:38:34.295	2026-07-20 03:38:34.295
0e421962-2267-4e68-b315-e890cc051ada	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Eat", "example": "I eat breakfast at 7am.", "meaning": "To consume food", "reading": "eet", "exampleTranslation": "我早上7点吃早餐。"}	2026-07-20 03:38:34.296	2026-07-20 03:38:34.296
b84f6b2c-c014-4311-a45e-10f645f4c8b6	vocabulary	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	0	{"word": "Go", "example": "I go to work by bus.", "meaning": "To move or travel", "reading": "go", "exampleTranslation": "我坐公交车去上班。"}	2026-07-20 03:38:34.298	2026-07-20 03:38:34.298
608f7cdc-3443-44de-953e-265a1c6cae91	grammar	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"notes": "The particle は is written as \\"ha\\" but pronounced \\"wa\\" when used as a topic marker.", "pattern": "～は～です", "examples": [{"english": "I am a student.", "japanese": "私は学生です。"}, {"english": "This is a book.", "japanese": "これは本です。"}], "explanation": "Basic sentence pattern: A is B. The particle は (wa) marks the topic, and です (desu) is the polite copula."}	2026-07-20 03:38:34.299	2026-07-20 03:38:34.299
2cd5c2cc-2379-4d81-b79c-e13fb1687f2a	grammar	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"notes": "The particle を is pronounced \\"o\\" (same as お).", "pattern": "～を～ます", "examples": [{"english": "I read a book.", "japanese": "本を読みます。"}, {"english": "I drink water.", "japanese": "水を飲みます。"}], "explanation": "Object marker pattern: Subject does something to the object. を (wo) marks the direct object of an action."}	2026-07-20 03:38:34.3	2026-07-20 03:38:34.3
c33e4278-674e-4e2b-96f7-c287d54f7e2b	grammar	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"notes": "に (ni) can indicate time, location, direction, or indirect object depending on context.", "pattern": "～に～ます", "examples": [{"english": "I go to school.", "japanese": "学校に行きます。"}, {"english": "There is a book on the desk.", "japanese": "机の上に本があります。"}], "explanation": "Direction/Location marker: Indicates where an action is directed or where something exists."}	2026-07-20 03:38:34.302	2026-07-20 03:38:34.302
ce3b0fd6-fe72-4774-9974-1e815a2968fe	grammar	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"notes": "で (de) marks the location of an action (not existence) or the means/tool used.", "pattern": "～で～ます", "examples": [{"english": "I study at the library.", "japanese": "図書館で勉強します。"}, {"english": "I go by bus.", "japanese": "バスで行きます。"}], "explanation": "Location/Means marker: Indicates where an action takes place or the means by which it is done."}	2026-07-20 03:38:34.303	2026-07-20 03:38:34.303
26d3db34-8fcb-4677-8000-36d582679e49	grammar	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	0	{"notes": "The たい form conjugates like an い-adjective for past tense and negative forms.", "pattern": "～たいです", "examples": [{"english": "I want to go to Japan.", "japanese": "日本に行きたいです。"}, {"english": "I want to eat sushi.", "japanese": "寿司を食べたいです。"}], "explanation": "Want to do pattern: Expresses desire to do something. Add たい to the verb stem (masu-form minus ます)."}	2026-07-20 03:38:34.304	2026-07-20 03:38:34.304
c855809a-a613-47e5-bf24-066ded5d7854	dialogue	AI_GENERATED	中文	英语	中文	beginner	1.0.0	draft	0	0	{"input": "???????????????\\nこんにちは、日本語を勉強したいです\\nこんにちは\\nkonnichiwa\\nkonnichiwa\\nkonnichiwa\\nkonnichiwa", "scene": "conversation", "output": "哈哈，你连发三遍“konnichiwa”！看来很喜欢日语问候～😊 但我是英语导师，咱们练英语吧！\\n\\n中文解释：英语重复打招呼可用“Hi there”或简单“Hello”，很亲切。\\n英语例句：Hello! Hello! Hello!\\n\\n试试用英语说三次你好？慢慢来，像朋友聊天就好！", "generatedAt": "2026-07-25T07:52:02.065Z"}	2026-07-25 07:52:02.066	2026-07-25 07:52:02.066
c29d0e86-f7bd-4a75-9697-25c4f4ece21d	lesson	AI_GENERATED	zh-CN	ja-JP	zh-CN	beginner	1.0.0	draft	0	0	{"input": "hi", "scene": "course_generation", "output": "Hello! How can I help you today?", "generatedAt": "2026-07-25T07:56:14.740Z"}	2026-07-25 07:56:14.741	2026-07-25 07:56:14.741
99a426bc-1b11-4b2d-b9f7-f3e79655c60d	lesson	AI_GENERATED	zh-CN	ja-JP	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja-JP语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"です\\",\\n    \\"phonetic\\": \\"名詞 + です\\",\\n    \\"meaning\\": \\"表示断定，相当于中文的“是”。用于句尾，礼貌地说明主语的性质或身份。\\",\\n    \\"example\\": \\"これは本です。/ 这是书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"ではありません\\",\\n    \\"phonetic\\": \\"名詞 + ではありません\\",\\n    \\"meaning\\": \\"表示否定断定，相当于中文的“不是”。是“です”的否定形式。\\",\\n    \\"example\\": \\"それはペンではありません。/ 那不是笔。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"の\\",\\n    \\"phonetic\\": \\"名詞 + の + 名詞\\",\\n    \\"meaning\\": \\"格助词，表示所属、属性或修饰关系，相当于中文的“的”。\\",\\n    \\"example\\": \\"私の猫は可愛いです。/ 我的猫很可爱。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"を\\",\\n    \\"phonetic\\": \\"名詞 + を + 動詞ます\\",\\n    \\"meaning\\": \\"宾格助词，表示动作的对象，接在宾语后面。动词用ます形表示礼貌体。\\",\\n    \\"example\\": \\"私はりんごを食べます。/ 我吃苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"に\\",\\n    \\"phonetic\\": \\"場所 + に + 動詞ます\\",\\n    \\"meaning\\": \\"格助词，表示动作发生的地点或时间，相当于“在……”或“于……”。\\",\\n    \\"example\\": \\"学校に行きます。/ 去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"ています\\",\\n    \\"phonetic\\": \\"動詞て形 + います\\",\\n    \\"meaning\\": \\"表示动作正在进行或状态持续，相当于中文的“正在……”或“着”。\\",\\n    \\"example\\": \\"弟はテレビを見ています。/ 弟弟正在看电视。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"ことができます\\",\\n    \\"phonetic\\": \\"動詞辞書形 + ことができます\\",\\n    \\"meaning\\": \\"表示能力或可能性，相当于中文的“会……”“能……”。\\",\\n    \\"example\\": \\"私は日本語を話すことができます。/ 我会说日语。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"た形\\",\\n    \\"phonetic\\": \\"動詞た形 + です\\",\\n    \\"meaning\\": \\"动词た形加です表示过去时态的礼貌叙述，相当于中文的“做了……（过去）”。\\",\\n    \\"example\\": \\"昨日、公園へ行きました。/ 昨天去了公园。\\"\\n  }\\n]", "generatedAt": "2026-07-25T08:34:31.109Z"}	2026-07-25 08:34:31.112	2026-07-25 08:34:31.112
b722f4d4-7357-4257-be1f-9479fad441c2	listening	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	1	{"title": "At the Restaurant", "questions": [{"answer": "Two", "question": "How many people are dining?"}, {"answer": "Ramen", "question": "What did the customer order?"}], "transcript": "いらっしゃいませ。何名様ですか？二人です。こちらへどうぞ。メニューをどうぞ。ラーメンをください。かしこまりました。", "vocabulary": ["いらっしゃいませ", "何名様", "二人", "メニュー", "ラーメン", "かしこまりました"], "translation": "Welcome. How many people? Two people. This way please. Here is the menu. I would like ramen. Certainly."}	2026-07-20 03:38:34.309	2026-07-26 08:16:24.884
1b664e70-4c02-4ace-ae87-305c33e55642	listening	MANUAL	ja	ja	zh-CN	beginner	1.0.0	published	90	1	{"title": "Self Introduction", "questions": [{"answer": "Tanaka", "question": "What is the speaker's name?"}, {"answer": "Tokyo", "question": "Where does the speaker live?"}], "transcript": "はじめまして。私は田中です。日本人です。東京に住んでいます。会社員です。よろしくお願いします。", "vocabulary": ["はじめまして", "日本人", "住んでいます", "会社員", "よろしくお願いします"], "translation": "Nice to meet you. I am Tanaka. I am Japanese. I live in Tokyo. I am an office worker. Pleased to meet you."}	2026-07-20 03:38:34.308	2026-07-26 08:16:24.884
ab995deb-8e02-40b5-85de-8e79f1b2e195	grammar	AI_GENERATED	ja-JP	ja-JP	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "です", "example": "これは本です。/ 这是书。", "meaning": "表示断定，相当于中文的“是”。用于句尾，礼貌地说明主语的性质或身份。", "phonetic": "名詞 + です"}, {"id": "g2", "word": "ではありません", "example": "それはペンではありません。/ 那不是笔。", "meaning": "表示否定断定，相当于中文的“不是”。是“です”的否定形式。", "phonetic": "名詞 + ではありません"}, {"id": "g3", "word": "の", "example": "私の猫は可愛いです。/ 我的猫很可爱。", "meaning": "格助词，表示所属、属性或修饰关系，相当于中文的“的”。", "phonetic": "名詞 + の + 名詞"}, {"id": "g4", "word": "を", "example": "私はりんごを食べます。/ 我吃苹果。", "meaning": "宾格助词，表示动作的对象，接在宾语后面。动词用ます形表示礼貌体。", "phonetic": "名詞 + を + 動詞ます"}, {"id": "g5", "word": "に", "example": "学校に行きます。/ 去学校。", "meaning": "格助词，表示动作发生的地点或时间，相当于“在……”或“于……”。", "phonetic": "場所 + に + 動詞ます"}, {"id": "g6", "word": "ています", "example": "弟はテレビを見ています。/ 弟弟正在看电视。", "meaning": "表示动作正在进行或状态持续，相当于中文的“正在……”或“着”。", "phonetic": "動詞て形 + います"}, {"id": "g7", "word": "ことができます", "example": "私は日本語を話すことができます。/ 我会说日语。", "meaning": "表示能力或可能性，相当于中文的“会……”“能……”。", "phonetic": "動詞辞書形 + ことができます"}, {"id": "g8", "word": "た形", "example": "昨日、公園へ行きました。/ 昨天去了公园。", "meaning": "动词た形加です表示过去时态的礼貌叙述，相当于中文的“做了……（过去）”。", "phonetic": "動詞た形 + です"}], "level": "beginner", "language": "ja-JP", "generatedAt": "2026-07-25T08:34:31.110Z"}	2026-07-25 08:34:31.113	2026-07-25 08:34:31.113
7f1d50fe-70f3-4ba5-8dfe-8b5a00b3f2e0	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"hello\\",\\n    \\"phonetic\\": \\"/həˈloʊ/\\",\\n    \\"meaning\\": \\"你好\\",\\n    \\"example\\": \\"Hello, my name is Tom. (你好，我的名字是汤姆。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"I read a book every day. (我每天读一本书。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water in the morning. (我早上喝水。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. (这只猫很小。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy today. (她今天很快乐。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"We eat rice for lunch. (我们午餐吃米饭。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"I have a red apple. (我有一个红苹果。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"They go to school. (他们去上学。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"He is my friend. (他是我的朋友。)\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"sun\\",\\n    \\"phonetic\\": \\"/sʌn/\\",\\n    \\"meaning\\": \\"太阳\\",\\n    \\"example\\": \\"The sun is bright. (太阳很明亮。)\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:31.517Z"}	2026-07-25 09:48:31.519	2026-07-25 09:48:31.519
3591c9e3-d06f-41be-8f80-270f3c035bc0	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. (你好，我的名字是汤姆。)", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I read a book every day. (我每天读一本书。)", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "water", "example": "I drink water in the morning. (我早上喝水。)", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v4", "word": "cat", "example": "The cat is small. (这只猫很小。)", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v5", "word": "happy", "example": "She is happy today. (她今天很快乐。)", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v6", "word": "eat", "example": "We eat rice for lunch. (我们午餐吃米饭。)", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v7", "word": "red", "example": "I have a red apple. (我有一个红苹果。)", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "They go to school. (他们去上学。)", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. (他是我的朋友。)", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "sun", "example": "The sun is bright. (太阳很明亮。)", "meaning": "太阳", "phonetic": "/sʌn/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:31.517Z"}	2026-07-25 09:48:31.52	2026-07-25 09:48:31.52
50805d5f-0a3a-4f62-8c45-9fb340b0e88b	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Morning Greeting\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"早晨问候\\",\\n    \\"example\\": \\"[Audio] Hello, good morning! How are you today? I am fine, thank you. I go to school by bus. See you later! / 你好，早上好！你今天好吗？我很好，谢谢。我坐公交去学校。回头见！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"At the Shop\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"在商店\\",\\n    \\"example\\": \\"[Audio] Excuse me, how much is this apple? It is two yuan. OK, I want three apples. Here you are. Thank you, bye. / 打扰一下，这个苹果多少钱？两元。好的，我要三个苹果。给你。谢谢，再见。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"[Audio] I have a small family. This is my father. He is tall. This is my mother. She is kind. I love my family very much. / 我有一个小家庭。这是我的爸爸。他很高。这是我的妈妈。她很亲切。我非常爱我的家人。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let us go to the park and play. / 看外面。今天晴天。天空是蓝色的。很暖和。我们去公园玩吧。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Library Rules\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"图书馆规则\\",\\n    \\"example\\": \\"[Audio] Welcome to the library. Please be quiet. Do not eat here. You can read books. Please return books on time. / 欢迎来到图书馆。请保持安静。不要在这里吃东西。你可以看书。请按时还书。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Ordering Food\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"点餐\\",\\n    \\"example\\": \\"[Audio] Hi, I want a hamburger and a cup of juice. Sure. That is fifteen yuan. Here is your food. Thank you, it looks good. / 嗨，我要一个汉堡和一杯果汁。好的。一共十五元。这是你的食物。谢谢，看起来不错。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Daily Routine\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"日常作息\\",\\n    \\"example\\": \\"[Audio] I wake up at seven. I eat breakfast at seven thirty. I go to work at eight. I come home at six. I sleep at ten. / 我七点起床。我七点半吃早餐。我八点去上班。我六点回家。我十点睡觉。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Lost and Found\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"失物招领\\",\\n    \\"example\\": \\"[Audio] I lost my red bag. Did you see it? No, but ask the office. They have a lost and found box. OK, I will go there now. / 我丢了我的红书包。你看到了吗？没有，但去办公室问问。他们有失物招领箱。好的，我现在就去那里。\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:33.015Z"}	2026-07-25 09:48:33.017	2026-07-25 09:48:33.017
a5954ecd-4108-4c7d-8ec3-fcf542b36c53	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"hello\\",\\n    \\"phonetic\\": \\"/həˈloʊ/\\",\\n    \\"meaning\\": \\"你好\\",\\n    \\"example\\": \\"Hello, my name is Tom. 你好，我的名字是汤姆。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"I read a book every day. 我每天读一本书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water in the morning. 我早上喝水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy today. 她今天很快乐。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"We eat rice for lunch. 我们午餐吃米饭。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"This apple is red. 这个苹果是红色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"I go to school by bus. 我乘公交去上学。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"He is my friend. 他是我的朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"house\\",\\n    \\"phonetic\\": \\"/haʊs/\\",\\n    \\"meaning\\": \\"房子\\",\\n    \\"example\\": \\"They live in a big house. 他们住在一所大房子里。\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:33.340Z"}	2026-07-25 09:48:33.341	2026-07-25 09:48:33.341
7b8426f3-92b1-40a7-a1d9-087fbd7d24f9	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Meeting a Friend\\",\\n    \\"phonetic\\": \\"Beginner - 20 seconds\\",\\n    \\"meaning\\": \\"遇见朋友\\",\\n    \\"example\\": \\"[Audio] Hi, Tom! How are you today? I am fine, thank you. I go to the park. Do you want to come? Sure, let's go! / 嗨，汤姆！你今天好吗？我很好，谢谢。我去公园。你想来吗？当然，走吧！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"At the Cafe\\",\\n    \\"phonetic\\": \\"Beginner - 25 seconds\\",\\n    \\"meaning\\": \\"在咖啡馆\\",\\n    \\"example\\": \\"[Audio] Welcome to our cafe. What do you want? I want a coffee, please. Here you are. How much is it? It is three dollars. Thank you. / 欢迎来到我们的咖啡馆。你想要什么？我要一杯咖啡，谢谢。给你。多少钱？三美元。谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"My Daily Routine\\",\\n    \\"phonetic\\": \\"Beginner - 30 seconds\\",\\n    \\"meaning\\": \\"我的日常作息\\",\\n    \\"example\\": \\"[Audio] I get up at seven. I eat breakfast at eight. I go to work at nine. I eat lunch at twelve. I come home at six. I watch TV at night. / 我七点起床。我八点吃早餐。我九点去上班。我十二点吃午餐。我六点回家。我晚上看电视。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Shopping for Fruit\\",\\n    \\"phonetic\\": \\"Beginner - 20 seconds\\",\\n    \\"meaning\\": \\"买水果\\",\\n    \\"example\\": \\"[Audio] Mom, can we buy apples? Yes. How many do we need? Five, please. OK. These apples are red and sweet. Great! / 妈妈，我们可以买苹果吗？可以。我们需要多少个？请给五个。好的。这些苹果又红又甜。太棒了！\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Library Notice\\",\\n    \\"phonetic\\": \\"Beginner - 15 seconds\\",\\n    \\"meaning\\": \\"图书馆通知\\",\\n    \\"example\\": \\"[Audio] Hello. This is the library. Please be quiet. The library closes at eight p.m. Return books on time. Thank you. / 你好。这里是图书馆。请保持安静。图书馆晚上八点关门。请按时还书。谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Asking for Directions\\",\\n    \\"phonetic\\": \\"Beginner - 25 seconds\\",\\n    \\"meaning\\": \\"问路\\",\\n    \\"example\\": \\"[Audio] Excuse me, where is the station? Go straight and turn left. It is next to the bank. Thank you very much. You are welcome. / 打扰一下，车站在哪里？直走然后左转。它在银行旁边。非常感谢。不客气。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20 seconds\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go out and play. Yes, good idea! / 看外面。今天晴朗。天空是蓝色的。很暖和。我们出去玩吧。好，好主意！\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Phone Call\\",\\n    \\"phonetic\\": \\"Beginner - 25 seconds\\",\\n    \\"meaning\\": \\"电话通话\\",\\n    \\"example\\": \\"[Audio] Hello, this is Anna. Hi Anna, it is Ben. Do you want to see a movie? Yes, what time? At seven. OK, see you then. / 你好，我是安娜。嗨安娜，我是本。你想看电影吗？想，几点？七点。好的，到时见。\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:35.103Z"}	2026-07-25 09:48:35.104	2026-07-25 09:48:35.104
6cc5b3b8-629a-4878-b762-803e3b2052dd	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	11	{"type": "listening", "items": [{"id": "l1", "word": "Morning Greeting", "example": "[Audio] Hello, good morning! How are you today? I am fine, thank you. I go to school by bus. See you later! / 你好，早上好！你今天好吗？我很好，谢谢。我坐公交去学校。回头见！", "meaning": "早晨问候", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "At the Shop", "example": "[Audio] Excuse me, how much is this apple? It is two yuan. OK, I want three apples. Here you are. Thank you, bye. / 打扰一下，这个苹果多少钱？两元。好的，我要三个苹果。给你。谢谢，再见。", "meaning": "在商店", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "My Family", "example": "[Audio] I have a small family. This is my father. He is tall. This is my mother. She is kind. I love my family very much. / 我有一个小家庭。这是我的爸爸。他很高。这是我的妈妈。她很亲切。我非常爱我的家人。", "meaning": "我的家庭", "phonetic": "Beginner - 25s"}, {"id": "l4", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let us go to the park and play. / 看外面。今天晴天。天空是蓝色的。很暖和。我们去公园玩吧。", "meaning": "今日天气", "phonetic": "Beginner - 20s"}, {"id": "l5", "word": "Library Rules", "example": "[Audio] Welcome to the library. Please be quiet. Do not eat here. You can read books. Please return books on time. / 欢迎来到图书馆。请保持安静。不要在这里吃东西。你可以看书。请按时还书。", "meaning": "图书馆规则", "phonetic": "Beginner - 25s"}, {"id": "l6", "word": "Ordering Food", "example": "[Audio] Hi, I want a hamburger and a cup of juice. Sure. That is fifteen yuan. Here is your food. Thank you, it looks good. / 嗨，我要一个汉堡和一杯果汁。好的。一共十五元。这是你的食物。谢谢，看起来不错。", "meaning": "点餐", "phonetic": "Beginner - 30s"}, {"id": "l7", "word": "Daily Routine", "example": "[Audio] I wake up at seven. I eat breakfast at seven thirty. I go to work at eight. I come home at six. I sleep at ten. / 我七点起床。我七点半吃早餐。我八点去上班。我六点回家。我十点睡觉。", "meaning": "日常作息", "phonetic": "Beginner - 30s"}, {"id": "l8", "word": "Lost and Found", "example": "[Audio] I lost my red bag. Did you see it? No, but ask the office. They have a lost and found box. OK, I will go there now. / 我丢了我的红书包。你看到了吗？没有，但去办公室问问。他们有失物招领箱。好的，我现在就去那里。", "meaning": "失物招领", "phonetic": "Beginner - 30s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:33.016Z"}	2026-07-25 09:48:33.019	2026-07-28 11:44:15.2
fd4eb4eb-8e81-424a-9eb6-f80590281726	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	12	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much.\\n我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。我的爸爸是一名老师。他喜欢读书。我的妈妈是一名医生。她帮助生病的人。我的姐姐十岁。她每天去上学。我们住在一所小房子里。我们非常爱彼此。", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We read, write, and play together. At noon, we eat lunch in the cafeteria. After lunch, we have art class. I like to draw pictures. School ends at three in the afternoon. Then I go home and do my homework.\\n我周一到周五去上学。我的学校八点开始上课。我在班里有好多朋友。我们一起读书、写字和玩耍。中午，我们在食堂吃午饭。午饭后，我们上美术课。我喜欢画画。学校下午三点放学。然后我回家做作业。", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very delicious. Pizza has cheese, tomato, and meat on top. My mother sometimes makes pizza at home. I help her put the ingredients on the dough. We bake it in the oven. When it is hot, we eat it together. I also like apples and bananas, but pizza is the best.\\n我最喜欢的食物是披萨。它很好吃而且方便食用。披萨上面有奶酪、番茄和肉。我妈妈有时在家做披萨。我帮她把食材放在面团上。我们用烤箱烤。烤热了我们就一起吃。我也喜欢苹果和香蕉，但披萨最棒。", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "Visiting the Park", "example": "On Sunday, my family goes to the park. The park is big and green. There are many trees and flowers. Children play on the swings and slides. My sister and I fly a kite. My parents sit on a bench and talk. We see ducks in the pond. They are very cute. We stay there for two hours and then go home happy.\\n星期天，我的家人去公园。公园很大很绿。那里有很多树和花。孩子们在秋千和滑梯上玩。我和姐姐放风筝。我的父母坐在长椅上聊天。我们看到池塘里的鸭子。它们很可爱。我们在那里待了两个小时，然后开心地回家。", "meaning": "逛公园", "phonetic": "beginner"}, {"id": "r5", "word": "My Pet Dog", "example": "I have a pet dog. His name is Bob. He is brown and white. Bob is very friendly. Every morning, I give him food and water. He likes to walk with me in the evening. He can catch a ball. When I come home, he wags his tail. I love my dog very much. He is my good friend.\\n我有一只宠物狗。他的名字叫鲍勃。他是棕色和白色的。鲍勃很友好。每天早晨，我给他食物和水。他喜欢晚上和我散步。他会接球。我回家时，他摇尾巴。我非常爱我的狗。他是我的好朋友。", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r6", "word": "Shopping for Clothes", "example": "Today my mother takes me to the shop. We want to buy new clothes. I see red shirts and blue pants. I try on a yellow T-shirt. It fits me well. My mother buys it for me. She also buys a pair of shoes. The shop assistant is very nice. We say thank you and go home. I am happy with my new clothes.\\n今天妈妈带我去商店。我们想买新衣服。我看到红色的衬衫和蓝色的裤子。我试了一件黄色的T恤。它很合身。妈妈给我买了。她也买了一双鞋。店员很友好。我们说谢谢然后回家。我对新衣服很开心。", "meaning": "买衣服", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:33.829Z"}	2026-07-25 09:48:33.832	2026-07-28 11:44:15.198
4214af53-32dc-4638-a78e-fac5e88ace47	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I read a book every day. 我每天读一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "water", "example": "I drink water in the morning. 我早上喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v4", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v5", "word": "happy", "example": "She is happy today. 她今天很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v6", "word": "eat", "example": "We eat rice for lunch. 我们午餐吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v7", "word": "red", "example": "This apple is red. 这个苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "I go to school by bus. 我乘公交去上学。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "They live in a big house. 他们住在一所大房子里。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:33.340Z"}	2026-07-25 09:48:33.342	2026-07-25 09:48:33.342
4e17bb48-6d68-458f-a38c-ca9c814a61ec	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I read a book every day. 我每天读一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "water", "example": "I drink water in the morning. 我早上喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v4", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v5", "word": "happy", "example": "She is happy today. 她今天很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v6", "word": "eat", "example": "We eat rice for lunch. 我们午餐吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v7", "word": "red", "example": "This apple is red. 这个苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "I go to school by bus. 我乘公交去上学。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "They live in a big house. 他们住在一所大房子里。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:33.576Z"}	2026-07-25 09:48:33.577	2026-07-25 09:48:33.577
6f24cc1f-debe-4f54-867f-5ebbc0765c7b	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much.\\\\n我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。我的爸爸是一名老师。他喜欢读书。我的妈妈是一名医生。她帮助生病的人。我的姐姐十岁。她每天去上学。我们住在一所小房子里。我们非常爱彼此。\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We read, write, and play together. At noon, we eat lunch in the cafeteria. After lunch, we have art class. I like to draw pictures. School ends at three in the afternoon. Then I go home and do my homework.\\\\n我周一到周五去上学。我的学校八点开始上课。我在班里有好多朋友。我们一起读书、写字和玩耍。中午，我们在食堂吃午饭。午饭后，我们上美术课。我喜欢画画。学校下午三点放学。然后我回家做作业。\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very delicious. Pizza has cheese, tomato, and meat on top. My mother sometimes makes pizza at home. I help her put the ingredients on the dough. We bake it in the oven. When it is hot, we eat it together. I also like apples and bananas, but pizza is the best.\\\\n我最喜欢的食物是披萨。它很好吃而且方便食用。披萨上面有奶酪、番茄和肉。我妈妈有时在家做披萨。我帮她把食材放在面团上。我们用烤箱烤。烤热了我们就一起吃。我也喜欢苹果和香蕉，但披萨最棒。\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"Visiting the Park\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"逛公园\\",\\n    \\"example\\": \\"On Sunday, my family goes to the park. The park is big and green. There are many trees and flowers. Children play on the swings and slides. My sister and I fly a kite. My parents sit on a bench and talk. We see ducks in the pond. They are very cute. We stay there for two hours and then go home happy.\\\\n星期天，我的家人去公园。公园很大很绿。那里有很多树和花。孩子们在秋千和滑梯上玩。我和姐姐放风筝。我的父母坐在长椅上聊天。我们看到池塘里的鸭子。它们很可爱。我们在那里待了两个小时，然后开心地回家。\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Bob. He is brown and white. Bob is very friendly. Every morning, I give him food and water. He likes to walk with me in the evening. He can catch a ball. When I come home, he wags his tail. I love my dog very much. He is my good friend.\\\\n我有一只宠物狗。他的名字叫鲍勃。他是棕色和白色的。鲍勃很友好。每天早晨，我给他食物和水。他喜欢晚上和我散步。他会接球。我回家时，他摇尾巴。我非常爱我的狗。他是我的好朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"Shopping for Clothes\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"买衣服\\",\\n    \\"example\\": \\"Today my mother takes me to the shop. We want to buy new clothes. I see red shirts and blue pants. I try on a yellow T-shirt. It fits me well. My mother buys it for me. She also buys a pair of shoes. The shop assistant is very nice. We say thank you and go home. I am happy with my new clothes.\\\\n今天妈妈带我去商店。我们想买新衣服。我看到红色的衬衫和蓝色的裤子。我试了一件黄色的T恤。它很合身。妈妈给我买了。她也买了一双鞋。店员很友好。我们说谢谢然后回家。我对新衣服很开心。\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:33.828Z"}	2026-07-25 09:48:33.831	2026-07-25 09:48:33.831
e67669c2-4213-45a2-85ad-2c5a6d4d38f1	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家人\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、妹妹和我。爸爸是老师，他喜欢看书。妈妈是医生，她帮助生病的人。妹妹十岁，她每天上学。我们住在一所小房子里，在一起很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. After lunch, we play outside. School ends at three in the afternoon. I walk home with my best friend. I like school because I learn new things. (我周一到周五上学。学校早上八点开始。我有数学、英语和科学课。我十二点和朋友吃午饭。午饭后我们在外面玩。下午三点放学。我和最好的朋友走路回家。我喜欢学校，因为我学新东西。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very tasty. Pizza has bread, cheese, and tomatoes. Sometimes we add chicken or vegetables. My mother makes pizza at home on Sundays. We eat it together. I also like apples and bananas. Fruit is good for our health. What is your favorite food? (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我们加鸡肉或蔬菜。妈妈周日在家做披萨，我们一起吃。我也喜欢苹果和香蕉。水果对健康好。你最喜欢的食物是什么？)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. Max is friendly to everyone. He is my good friend. I love my dog very much. (我有一只宠物狗，他的名字是Max。他是棕色和白色的。Max两岁了。他喜欢在公园跑。每天早晨我带他散步。他吃狗粮、喝水。Max对每个人都很友好，他是我的好朋友。我很爱我的狗。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Shopping at the Market\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在市场购物\\",\\n    \\"example\\": \\"On Saturday, my mother and I go to the market. We buy fruit, vegetables, and eggs. The market is busy and noisy. I see red apples and yellow bananas. My mother buys some bread. We pay the seller and go home. Cooking with fresh food is fun. I help my mother in the kitchen. (周六，我和妈妈去市场。我们买水果、蔬菜和鸡蛋。市场又忙又吵。我看到红苹果和黄香蕉。妈妈买了一些面包。我们付钱给卖家然后回家。用新鲜食材做饭很有趣，我在厨房帮妈妈。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"A Rainy Day\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"下雨天\\",\\n    \\"example\\": \\"Today it is raining. The sky is gray. I cannot go outside to play. I sit by the window and watch the rain. The trees look clean and green. My cat sleeps on the sofa. I read a book and drink hot milk. Rainy days are quiet and cozy. I like listening to the sound of rain. (今天下雨了。天空灰灰的。我不能出去玩。我坐在窗边看雨。树看起来干净又绿。我的猫在沙发上睡觉。我看书、喝热牛奶。雨天安静又舒适。我喜欢听雨声。)\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:35.723Z"}	2026-07-25 09:48:35.725	2026-07-25 09:48:35.725
27135a62-50bd-4c15-b4ad-1e062afa01d6	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	2	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "I am a student. (我是一名学生。)", "meaning": "使用be动词表示主语的身份或状态，第一人称单数用am，第三人称单数用is，其他用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "She reads books every day. (她每天读书。)", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "He does not like apples. (他不喜欢苹果。)", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Do you play tennis? (你打网球吗？)", "meaning": "一般现在时疑问句，句首用Do或Does，第三人称单数用Does，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. (我看到一个橘子，这个橘子是甜的。)", "meaning": "不定冠词a/an表示泛指，定冠词the表示特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. (有两只猫和三个盒子。)", "meaning": "名词复数一般在词尾加s，以s/x/ch/sh结尾加es。", "phonetic": "Noun + s/es"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The small dog is happy. (这只小狗很开心。)", "meaning": "形容词用来描述主语的特征，放在be动词后。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Imperatives", "example": "Open the window. (打开窗户。)", "meaning": "祈使句以动词原形开头，表示命令、请求或建议，主语通常省略。", "phonetic": "Verb(base form) + Object"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:38.918Z"}	2026-07-25 09:48:38.922	2026-07-26 10:19:26.241
3ae60887-127b-4757-a814-71df625a8501	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	11	{"type": "listening", "items": [{"id": "l1", "word": "Meeting a Friend", "example": "[Audio] Hi, Tom! How are you today? I am fine, thank you. I go to the park. Do you want to come? Sure, let's go! / 嗨，汤姆！你今天好吗？我很好，谢谢。我去公园。你想来吗？当然，走吧！", "meaning": "遇见朋友", "phonetic": "Beginner - 20 seconds"}, {"id": "l2", "word": "At the Cafe", "example": "[Audio] Welcome to our cafe. What do you want? I want a coffee, please. Here you are. How much is it? It is three dollars. Thank you. / 欢迎来到我们的咖啡馆。你想要什么？我要一杯咖啡，谢谢。给你。多少钱？三美元。谢谢。", "meaning": "在咖啡馆", "phonetic": "Beginner - 25 seconds"}, {"id": "l3", "word": "My Daily Routine", "example": "[Audio] I get up at seven. I eat breakfast at eight. I go to work at nine. I eat lunch at twelve. I come home at six. I watch TV at night. / 我七点起床。我八点吃早餐。我九点去上班。我十二点吃午餐。我六点回家。我晚上看电视。", "meaning": "我的日常作息", "phonetic": "Beginner - 30 seconds"}, {"id": "l4", "word": "Shopping for Fruit", "example": "[Audio] Mom, can we buy apples? Yes. How many do we need? Five, please. OK. These apples are red and sweet. Great! / 妈妈，我们可以买苹果吗？可以。我们需要多少个？请给五个。好的。这些苹果又红又甜。太棒了！", "meaning": "买水果", "phonetic": "Beginner - 20 seconds"}, {"id": "l5", "word": "Library Notice", "example": "[Audio] Hello. This is the library. Please be quiet. The library closes at eight p.m. Return books on time. Thank you. / 你好。这里是图书馆。请保持安静。图书馆晚上八点关门。请按时还书。谢谢。", "meaning": "图书馆通知", "phonetic": "Beginner - 15 seconds"}, {"id": "l6", "word": "Asking for Directions", "example": "[Audio] Excuse me, where is the station? Go straight and turn left. It is next to the bank. Thank you very much. You are welcome. / 打扰一下，车站在哪里？直走然后左转。它在银行旁边。非常感谢。不客气。", "meaning": "问路", "phonetic": "Beginner - 25 seconds"}, {"id": "l7", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go out and play. Yes, good idea! / 看外面。今天晴朗。天空是蓝色的。很暖和。我们出去玩吧。好，好主意！", "meaning": "今日天气", "phonetic": "Beginner - 20 seconds"}, {"id": "l8", "word": "Phone Call", "example": "[Audio] Hello, this is Anna. Hi Anna, it is Ben. Do you want to see a movie? Yes, what time? At seven. OK, see you then. / 你好，我是安娜。嗨安娜，我是本。你想看电影吗？想，几点？七点。好的，到时见。", "meaning": "电话通话", "phonetic": "Beginner - 25 seconds"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:35.103Z"}	2026-07-25 09:48:35.106	2026-07-28 11:44:15.2
4cddd310-a9cd-4efc-b817-ba822f88abf3	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be Verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"be动词用于连接主语和名词或形容词，表示状态或身份。I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"I am a student. 我是一名学生。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句表示习惯或事实。第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"She eats an apple every day. 她每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句用do not或does not加动词原形，第三人称单数用does not。\\",\\n    \\"example\\": \\"He does not like coffee. 他不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句将do或does置于句首，动词用原形。\\",\\n    \\"example\\": \\"Do you play tennis? 你打网球吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific\\",\\n    \\"meaning\\": \\"a和an是不定冠词，表示泛指，a用于辅音音素前，an用于元音音素前；the是定冠词，表示特指。\\",\\n    \\"example\\": \\"I see an orange and a cat. 我看到一个橙子和一只猫。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es (or irregular)\\",\\n    \\"meaning\\": \\"名词复数通常在词尾加s或es，部分名词为不规则变化。\\",\\n    \\"example\\": \\"There are two books on the desk. 桌上有两本书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Adjectives (Order/Basic)\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词用于描述名词或主语的状态，放在be动词后或名词前。\\",\\n    \\"example\\": \\"The small dog is happy. 这只小狗很开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Possessive Adjectives\\",\\n    \\"phonetic\\": \\"Possessive Adj. + Noun\\",\\n    \\"meaning\\": \\"物主形容词表示所属关系，如my, your, his, her, our, their，后接名词。\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:37.329Z"}	2026-07-25 09:48:37.331	2026-07-25 09:48:37.331
17111bb9-52c2-4167-9546-bfb2aa802a33	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be Verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"使用be动词表示主语的身份或状态，第一人称单数用am，第三人称单数用is，其他用are。\\",\\n    \\"example\\": \\"I am a student. (我是一名学生。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"She reads books every day. (她每天读书。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"He does not like apples. (他不喜欢苹果。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句，句首用Do或Does，第三人称单数用Does，动词用原形。\\",\\n    \\"example\\": \\"Do you play tennis? (你打网球吗？)\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific\\",\\n    \\"meaning\\": \\"不定冠词a/an表示泛指，定冠词the表示特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. (我看到一个橘子，这个橘子是甜的。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es\\",\\n    \\"meaning\\": \\"名词复数一般在词尾加s，以s/x/ch/sh结尾加es。\\",\\n    \\"example\\": \\"There are two cats and three boxes. (有两只猫和三个盒子。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Adjectives (Order/Basic)\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词用来描述主语的特征，放在be动词后。\\",\\n    \\"example\\": \\"The small dog is happy. (这只小狗很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Imperatives\\",\\n    \\"phonetic\\": \\"Verb(base form) + Object\\",\\n    \\"meaning\\": \\"祈使句以动词原形开头，表示命令、请求或建议，主语通常省略。\\",\\n    \\"example\\": \\"Open the window. (打开窗户。)\\"\\n  }\\n]", "generatedAt": "2026-07-25T09:48:38.918Z"}	2026-07-25 09:48:38.92	2026-07-25 09:48:38.92
bd7cb6d5-fa77-431d-8cea-c0d4832f3e78	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为初级的日语学习者出10道定级测试题，返回严格JSON（不要任何多余文字）：\\n{\\"choice\\":[{\\"q\\":\\"题干(中文)\\",\\"opts\\":[\\"4个选项\\"],\\"a\\":正确下标0-3}](6道选择题，考察词汇和语法),\\n\\"listening\\":[{\\"audio\\":\\"一句日语原文(将被朗读)\\",\\"q\\":\\"关于这句话的中文问题\\",\\"opts\\":[\\"4个中文选项\\"],\\"a\\":正确下标}](2道),\\n\\"speaking\\":[{\\"ref\\":\\"一句日语朗读句\\",\\"meaning\\":\\"中文意思\\"}](2道)}", "scene": "chat", "output": "{\\n  \\"choice\\": [\\n    {\\n      \\"q\\": \\"“こんにちは”是什么意思？\\",\\n      \\"opts\\": [\\"早上好\\", \\"你好\\", \\"晚上好\\", \\"再见\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"q\\": \\"“りんご”对应的中文是？\\",\\n      \\"opts\\": [\\"香蕉\\", \\"苹果\\", \\"橘子\\", \\"葡萄\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"q\\": \\"私は学生___。\\",\\n      \\"opts\\": [\\"が\\", \\"を\\", \\"です\\", \\"に\\"],\\n      \\"a\\": 2\\n    },\\n    {\\n      \\"q\\": \\"“ありがとう”的意思是？\\",\\n      \\"opts\\": [\\"对不起\\", \\"谢谢\\", \\"请\\", \\"不客气\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"q\\": \\"田中さん___日本人です。\\",\\n      \\"opts\\": [\\"は\\", \\"も\\", \\"と\\", \\"へ\\"],\\n      \\"a\\": 0\\n    },\\n    {\\n      \\"q\\": \\"“ねこ”是指什么动物？\\",\\n      \\"opts\\": [\\"狗\\", \\"猫\\", \\"鸟\\", \\"鱼\\"],\\n      \\"a\\": 1\\n    }\\n  ],\\n  \\"listening\\": [\\n    {\\n      \\"audio\\": \\"これは本です。\\",\\n      \\"q\\": \\"这句话说的是什么？\\",\\n      \\"opts\\": [\\"这是书\\", \\"那是笔\\", \\"这是桌子\\", \\"那是苹果\\"],\\n      \\"a\\": 0\\n    },\\n    {\\n      \\"audio\\": \\"お名前は何ですか。\\",\\n      \\"q\\": \\"这句话在问什么？\\",\\n      \\"opts\\": [\\"你几岁了\\", \\"你叫什么名字\\", \\"你是哪国人\\", \\"你现在在哪\\"],\\n      \\"a\\": 1\\n    }\\n  ],\\n  \\"speaking\\": [\\n    {\\n      \\"ref\\": \\"はじめまして、よろしくお願いします。\\",\\n      \\"meaning\\": \\"初次见面，请多多关照。\\"\\n    },\\n    {\\n      \\"ref\\": \\"私の名前はリリーです。\\",\\n      \\"meaning\\": \\"我的名字是莉莉。\\"\\n    }\\n  ]\\n}", "generatedAt": "2026-07-25T16:25:26.527Z"}	2026-07-25 16:25:26.529	2026-07-25 16:25:26.529
64c1d475-15b2-43e6-9a26-0ea96f7811ba	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "用户想要一个AI学习搭子，描述如下：「一个温柔的邻家姐姐，声音软软的，很会鼓励人，口头禅是慢慢来我陪着你」，希望名字叫「小樱」。\\n请根据描述提炼角色设定，返回严格JSON（不要任何多余文字）：\\n{\\"name\\":\\"名字\\",\\"personality\\":\\"性格特征(30字内)\\",\\"voiceStyle\\":\\"声音风格(如温柔女声/元气少年音)\\",\\"catchphrase\\":\\"口头禅(一句)\\",\\"greeting\\":\\"角色第一次见面对用户说的话(带人设感,50字内)\\",\\"avatarEmoji\\":\\"一个最符合角色的emoji\\"}", "scene": "chat", "output": "{\\"name\\":\\"小樱\\",\\"personality\\":\\"温柔体贴的邻家姐姐，善于鼓励，让人安心\\",\\"voiceStyle\\":\\"温柔软糯女声\\",\\"catchphrase\\":\\"慢慢来我陪着你\\",\\"greeting\\":\\"嗨，我是小樱，以后咱们一起学习吧，慢慢来我陪着你，别担心哦。\\",\\"avatarEmoji\\":\\"🌸\\"}", "generatedAt": "2026-07-25T16:25:29.985Z"}	2026-07-25 16:25:29.986	2026-07-25 16:25:29.986
1e89f8dc-4d79-4b22-aa5c-e18acfc37713	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为初级的日语学习者出10道定级测试题，返回严格JSON（不要任何多余文字）：\\n{\\"choice\\":[{\\"q\\":\\"题干(中文)\\",\\"opts\\":[\\"4个选项\\"],\\"a\\":正确下标0-3}](6道选择题，考察词汇和语法),\\n\\"listening\\":[{\\"audio\\":\\"一句日语原文(将被朗读)\\",\\"q\\":\\"关于这句话的中文问题\\",\\"opts\\":[\\"4个中文选项\\"],\\"a\\":正确下标}](2道),\\n\\"speaking\\":[{\\"ref\\":\\"一句日语朗读句\\",\\"meaning\\":\\"中文意思\\"}](2道)}", "scene": "chat", "output": "{\\n  \\"choice\\": [\\n    {\\n      \\"q\\": \\"“ありがとう”是什么意思？\\",\\n      \\"opts\\": [\\"对不起\\", \\"谢谢\\", \\"再见\\", \\"你好\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"q\\": \\"“猫”用日语怎么说？\\",\\n      \\"opts\\": [\\"いぬ\\", \\"ねこ\\", \\"とり\\", \\"うさぎ\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"q\\": \\"私は学生___です。\\",\\n      \\"opts\\": [\\"は\\", \\"を\\", \\"に\\", \\"で\\"],\\n      \\"a\\": 0\\n    },\\n    {\\n      \\"q\\": \\"“水”的日语读音是？\\",\\n      \\"opts\\": [\\"みず\\", \\"ひ\\", \\"くち\\", \\"て\\"],\\n      \\"a\\": 0\\n    },\\n    {\\n      \\"q\\": \\"これ___本です。\\",\\n      \\"opts\\": [\\"は\\", \\"が\\", \\"の\\", \\"も\\"],\\n      \\"a\\": 0\\n    },\\n    {\\n      \\"q\\": \\"“早上好”用日语怎么说？\\",\\n      \\"opts\\": [\\"こんばんは\\", \\"おはよう\\", \\"おやすみ\\", \\"こんにちは\\"],\\n      \\"a\\": 1\\n    }\\n  ],\\n  \\"listening\\": [\\n    {\\n      \\"audio\\": \\"こんにちは、元気ですか。\\",\\n      \\"q\\": \\"这句话在问候什么？\\",\\n      \\"opts\\": [\\"晚安\\", \\"你好吗\\", \\"谢谢\\", \\"再见\\"],\\n      \\"a\\": 1\\n    },\\n    {\\n      \\"audio\\": \\"これはりんごです。\\",\\n      \\"q\\": \\"说话人说的是什么？\\",\\n      \\"opts\\": [\\"这是橘子\\", \\"这是苹果\\", \\"那是香蕉\\", \\"这是西瓜\\"],\\n      \\"a\\": 1\\n    }\\n  ],\\n  \\"speaking\\": [\\n    {\\n      \\"ref\\": \\"はじめまして、よろしくおねがいします。\\",\\n      \\"meaning\\": \\"初次见面，请多关照。\\"\\n    },\\n    {\\n      \\"ref\\": \\"わたしのなまえはりーです。\\",\\n      \\"meaning\\": \\"我的名字是李。\\"\\n    }\\n  ]\\n}", "generatedAt": "2026-07-26T00:39:16.143Z"}	2026-07-26 00:39:16.144	2026-07-26 00:39:16.144
de8bcaed-e870-42a1-9913-a05cb1b0bb29	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "用户想要一个AI学习搭子，描述如下：「一个温柔的邻家姐姐，声音软软的，很会鼓励人，口头禅是慢慢来我陪着你」，希望名字叫「小樱」。\\n请根据描述提炼角色设定，返回严格JSON（不要任何多余文字）：\\n{\\"name\\":\\"名字\\",\\"personality\\":\\"性格特征(30字内)\\",\\"voiceStyle\\":\\"声音风格(如温柔女声/元气少年音)\\",\\"catchphrase\\":\\"口头禅(一句)\\",\\"greeting\\":\\"角色第一次见面对用户说的话(带人设感,50字内)\\",\\"avatarEmoji\\":\\"一个最符合角色的emoji\\"}", "scene": "chat", "output": "{\\"name\\":\\"小樱\\",\\"personality\\":\\"温柔体贴的邻家姐姐，软糯耐心，善于鼓励陪伴\\",\\"voiceStyle\\":\\"温柔女声\\",\\"catchphrase\\":\\"慢慢来我陪着你\\",\\"greeting\\":\\"嗨，我是小樱～以后咱们一起学习吧，慢慢来我陪着你，不用着急哦。\\",\\"avatarEmoji\\":\\"🌸\\"}", "generatedAt": "2026-07-26T00:39:19.558Z"}	2026-07-26 00:39:19.559	2026-07-26 00:39:19.559
5a456acc-3850-4b8a-a657-802347f44ee4	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	1	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "I am a student. 我是一名学生。", "meaning": "be动词用于连接主语和名词或形容词，表示状态或身份。I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "She eats an apple every day. 她每天吃一个苹果。", "meaning": "一般现在时肯定句表示习惯或事实。第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "He does not like coffee. 他不喜欢咖啡。", "meaning": "一般现在时否定句用do not或does not加动词原形，第三人称单数用does not。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Do you play tennis? 你打网球吗？", "meaning": "一般现在时疑问句将do或does置于句首，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and a cat. 我看到一个橙子和一只猫。", "meaning": "a和an是不定冠词，表示泛指，a用于辅音音素前，an用于元音音素前；the是定冠词，表示特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two books on the desk. 桌上有两本书。", "meaning": "名词复数通常在词尾加s或es，部分名词为不规则变化。", "phonetic": "Noun + s/es (or irregular)"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The small dog is happy. 这只小狗很开心。", "meaning": "形容词用于描述名词或主语的状态，放在be动词后或名词前。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Possessive Adjectives", "example": "This is my book. 这是我的书。", "meaning": "物主形容词表示所属关系，如my, your, his, her, our, their，后接名词。", "phonetic": "Possessive Adj. + Noun"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:37.330Z"}	2026-07-25 09:48:37.332	2026-07-26 04:55:54.138
0ee47739-1ccc-4765-90d4-d48334225ba7	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"apple\\",\\n    \\"phonetic\\": \\"/ˈæp.əl/\\",\\n    \\"meaning\\": \\"苹果\\",\\n    \\"example\\": \\"I eat an apple every day. 我每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"dog\\",\\n    \\"phonetic\\": \\"/dɒɡ/\\",\\n    \\"meaning\\": \\"狗\\",\\n    \\"example\\": \\"A dog runs fast. 狗跑得快。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"egg\\",\\n    \\"phonetic\\": \\"/eɡ/\\",\\n    \\"meaning\\": \\"蛋\\",\\n    \\"example\\": \\"She has an egg. 她有一个蛋。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"fish\\",\\n    \\"phonetic\\": \\"/fɪʃ/\\",\\n    \\"meaning\\": \\"鱼\\",\\n    \\"example\\": \\"I see a fish. 我看见一条鱼。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"We go home. 我们回家。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"house\\",\\n    \\"phonetic\\": \\"/haʊs/\\",\\n    \\"meaning\\": \\"房子\\",\\n    \\"example\\": \\"This is our house. 这是我们的房子。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"ice\\",\\n    \\"phonetic\\": \\"/aɪs/\\",\\n    \\"meaning\\": \\"冰\\",\\n    \\"example\\": \\"The ice is cold. 冰是冷的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"jump\\",\\n    \\"phonetic\\": \\"/dʒʌmp/\\",\\n    \\"meaning\\": \\"跳\\",\\n    \\"example\\": \\"He can jump high. 他能跳得高。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:55:58.399Z"}	2026-07-26 04:55:58.4	2026-07-26 04:55:58.4
474b8f52-bb15-4c1c-9aa6-0ac418b1d220	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "apple", "example": "I eat an apple every day. 我每天吃一个苹果。", "meaning": "苹果", "phonetic": "/ˈæp.əl/"}, {"id": "v2", "word": "book", "example": "This is my book. 这是我的书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "dog", "example": "A dog runs fast. 狗跑得快。", "meaning": "狗", "phonetic": "/dɒɡ/"}, {"id": "v5", "word": "egg", "example": "She has an egg. 她有一个蛋。", "meaning": "蛋", "phonetic": "/eɡ/"}, {"id": "v6", "word": "fish", "example": "I see a fish. 我看见一条鱼。", "meaning": "鱼", "phonetic": "/fɪʃ/"}, {"id": "v7", "word": "go", "example": "We go home. 我们回家。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v8", "word": "house", "example": "This is our house. 这是我们的房子。", "meaning": "房子", "phonetic": "/haʊs/"}, {"id": "v9", "word": "ice", "example": "The ice is cold. 冰是冷的。", "meaning": "冰", "phonetic": "/aɪs/"}, {"id": "v10", "word": "jump", "example": "He can jump high. 他能跳得高。", "meaning": "跳", "phonetic": "/dʒʌmp/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T04:55:58.399Z"}	2026-07-26 04:55:58.401	2026-07-26 04:55:58.401
1d690ceb-ca2b-46cd-98b7-75284646dba0	vocabulary	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "こんにちは", "example": "こんにちは、元気ですか。/你好，还好吗？", "meaning": "你好（白天用语）", "phonetic": "konnichiwa"}, {"id": "v2", "word": "ありがとう", "example": "プレゼント、ありがとう。/礼物，谢谢你了。", "meaning": "谢谢", "phonetic": "arigatou"}, {"id": "v3", "word": "水", "example": "冷たい水を飲みます。/喝冷水。", "meaning": "水", "phonetic": "mizu"}, {"id": "v4", "word": "食べる", "example": "りんごを食べる。/吃苹果。", "meaning": "吃", "phonetic": "taberu"}, {"id": "v5", "word": "本", "example": "これは私の本です。/这是我的书。", "meaning": "书", "phonetic": "hon"}, {"id": "v6", "word": "行く", "example": "学校へ行く。/去学校。", "meaning": "去", "phonetic": "iku"}, {"id": "v7", "word": "友達", "example": "彼は私の友達だ。/他是我的朋友。", "meaning": "朋友", "phonetic": "tomodachi"}, {"id": "v8", "word": "大きい", "example": "大きい犬がいる。/有一只大狗。", "meaning": "大的", "phonetic": "ookii"}, {"id": "v9", "word": "今日", "example": "今日は日曜日です。/今天是星期日。", "meaning": "今天", "phonetic": "kyou"}, {"id": "v10", "word": "好き", "example": "私は猫が好きです。/我喜欢猫。", "meaning": "喜欢", "phonetic": "suki"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T08:16:35.089Z"}	2026-07-26 08:16:35.091	2026-07-26 08:16:35.091
bbfe4b59-81ae-4784-b573-94ffcbf310d1	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Morning Greeting\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"早晨问候\\",\\n    \\"example\\": \\"[Audio] Hello, Tom. Good morning! How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好！你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"At the Cafe\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"在咖啡馆\\",\\n    \\"example\\": \\"[Audio] Hi, I want a coffee, please. Sure. Small or large? Large, please. Here you are. How much is it? Three dollars. Thank you. You're welcome. / 嗨，我要一杯咖啡，谢谢。好的。小杯还是大杯？大杯。给你。多少钱？三美元。谢谢。不客气。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"[Audio] I have a small family. There are three people. My dad, my mom, and me. My dad is tall. My mom is kind. I love my family. / 我有一个小家庭。有三个人。我的爸爸、我的妈妈和我。我爸爸很高。我妈妈很和蔼。我爱我的家庭。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Library Notice\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"图书馆通知\\",\\n    \\"example\\": \\"[Audio] Attention, please. The library closes at six p.m. Please return your books. Thank you for coming. Have a nice evening. / 请注意。图书馆下午六点关门。请归还您的书。感谢光临。祝晚上愉快。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Asking for Time\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"询问时间\\",\\n    \\"example\\": \\"[Audio] Excuse me, what time is it? It is three o'clock. Thank you. You're welcome. I must go now. Bye! / 打扰一下，现在几点了？三点了。谢谢。不客气。我现在得走了。拜拜！\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go for a walk. Good idea! / 看外面。今天晴天。天空是蓝色的。很暖和。我们去散步吧。好主意！\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Buying Fruit\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"买水果\\",\\n    \\"example\\": \\"[Audio] Can I help you? Yes, I want apples. How many? Four, please. OK. That is two dollars. Here you are. Thanks. / 需要帮忙吗？是的，我要苹果。几个？请给四个。好的。两美元。给你。谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Evening Call\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"晚间电话\\",\\n    \\"example\\": \\"[Audio] Hello, Mary. Hi, John. Are you at home? Yes. Dinner is ready. Come soon. OK, I am coming. / 你好，玛丽。嗨，约翰。你在家吗？在。晚饭好了。快来。好的，我来了。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:56:01.210Z"}	2026-07-26 04:56:01.212	2026-07-26 04:56:01.212
aba4bcbb-5a29-4606-a939-ed034f7c93c3	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be Verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"使用be动词表示状态或身份，I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"She is a teacher. 她是一名老师。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句，表示习惯或事实，第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"He eats an apple every day. 他每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"They do not like coffee. 他们不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句，句首用Do或Does，第三人称单数用Does，动词用原形。\\",\\n    \\"example\\": \\"Does she play tennis? 她打网球吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific noun\\",\\n    \\"meaning\\": \\"不定冠词a/an表泛指，定冠词the表特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es (or irregular forms)\\",\\n    \\"meaning\\": \\"名词复数一般在词尾加s或es，部分名词为不规则变化。\\",\\n    \\"example\\": \\"There are two books on the desk. 桌上有两本书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Possessive Adjectives\\",\\n    \\"phonetic\\": \\"my/your/his/her/its/our/their + Noun\\",\\n    \\"meaning\\": \\"形容词性物主代词，放在名词前表示所属关系。\\",\\n    \\"example\\": \\"This is my cat. 这是我的猫。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Imperatives\\",\\n    \\"phonetic\\": \\"Verb(base form) + (Object)\\",\\n    \\"meaning\\": \\"祈使句以动词原形开头，表示命令、请求或建议，通常省略主语you。\\",\\n    \\"example\\": \\"Close the door, please. 请关上门。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:56:03.474Z"}	2026-07-26 04:56:03.475	2026-07-26 04:56:03.475
771b4124-8f60-451b-97f8-d26d3e50bfa1	grammar	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "です", "example": "これは本です。/这是书。", "meaning": "表示断定，相当于中文的“是”。用于句尾，礼貌体。", "phonetic": "名詞 + です"}, {"id": "g2", "word": "ではありません", "example": "彼は学生ではありません。/他不是学生。", "meaning": "表示否定断定，相当于中文的“不是”。礼貌体否定。", "phonetic": "名詞 + ではありません"}, {"id": "g3", "word": "の", "example": "私の猫は可愛いです。/我的猫很可爱。", "meaning": "表示所属、属性或修饰关系，相当于中文的“的”。", "phonetic": "名詞 + の + 名詞"}, {"id": "g4", "word": "を", "example": "りんごを食べます。/吃苹果。", "meaning": "提示动作的对象（宾语），接在宾语后。", "phonetic": "名詞 + を + 動詞ます"}, {"id": "g5", "word": "に", "example": "公園に行きます。/去公园。", "meaning": "表示动作发生的地点或时间接点，相当于“在/于”。", "phonetic": "場所 + に + 動詞ます"}, {"id": "g6", "word": "ます形", "example": "毎日手紙を書きます。/每天写信。", "meaning": "动词礼貌体，用于现在/将来肯定，句尾加ます。", "phonetic": "動詞ます形（例：書く→書きます）"}, {"id": "g7", "word": "ました", "example": "昨日映画を見ました。/昨天看了电影。", "meaning": "表示过去礼貌肯定，相当于“做了……”。", "phonetic": "動詞ます形去ます + ました"}, {"id": "g8", "word": "ています", "example": "弟は寝ています。/弟弟正在睡觉。", "meaning": "表示动作正在进行或状态持续，相当于“正在/着”。", "phonetic": "動詞て形 + います"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T04:58:36.864Z"}	2026-07-26 04:58:36.867	2026-07-26 04:58:36.867
3cd9d912-e269-47a8-9b45-4d2187b2dc5a	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"こんにちは\\",\\n    \\"phonetic\\": \\"konnichiwa\\",\\n    \\"meaning\\": \\"你好（白天）\\",\\n    \\"example\\": \\"こんにちは、元気ですか。／你好，还好吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"ありがとう\\",\\n    \\"phonetic\\": \\"arigatou\\",\\n    \\"meaning\\": \\"谢谢\\",\\n    \\"example\\": \\"プレゼント、ありがとう。／礼物，谢谢你了。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"水\\",\\n    \\"phonetic\\": \\"mizu\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"冷たい水が飲みたい。／想喝冷水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"犬\\",\\n    \\"phonetic\\": \\"inu\\",\\n    \\"meaning\\": \\"狗\\",\\n    \\"example\\": \\"あの犬は小さい。／那只狗很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"本\\",\\n    \\"phonetic\\": \\"hon\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"これは面白い本です。／这是一本有趣的书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"食べる\\",\\n    \\"phonetic\\": \\"taberu\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"りんごを食べる。／吃苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"行く\\",\\n    \\"phonetic\\": \\"iku\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"学校へ行く。／去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"先生\\",\\n    \\"phonetic\\": \\"sensei\\",\\n    \\"meaning\\": \\"老师\\",\\n    \\"example\\": \\"先生は親切です。／老师很亲切。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"友達\\",\\n    \\"phonetic\\": \\"tomodachi\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"彼は私の友達だ。／他是我的朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"朝\\",\\n    \\"phonetic\\": \\"asa\\",\\n    \\"meaning\\": \\"早上\\",\\n    \\"example\\": \\"朝に散歩する。／早上散步。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:58:40.147Z"}	2026-07-26 04:58:40.149	2026-07-26 04:58:40.149
3143faf3-a050-4c9e-ae76-030c8dfec327	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"わたしの家族\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家人\\",\\n    \\"example\\": \\"わたしの家族は四人です。父と母と妹とわたしです。父は会社員で、母は先生です。妹は学生です。わたしたちは東京に住んでいます。休みの日は、いっしょに公園へ行きます。とても楽しいです。\\\\n（我的家人有四口人。爸爸、妈妈、妹妹和我。爸爸是公司职员，妈妈是老师。妹妹是学生。我们住在东京。休息日会一起去公园。非常开心。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"朝のルーティン\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"早晨的日常\\",\\n    \\"example\\": \\"わたしは毎朝七時に起きます。歯を磨いて、顔を洗います。それから、朝ごはんを食べます。パンと卵を食べます。八時に学校へ行きます。電車で十分かかります。朝はいつも忙しいです。\\\\n（我每天早上七点起床。刷牙、洗脸。然后吃早饭。吃面包和鸡蛋。八点去学校。坐电车要十分钟。早上总是很忙。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"好きな食べ物\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"喜欢的食物\\",\\n    \\"example\\": \\"わたしの好きな食べ物は寿司です。魚とごはんが好きです。週末に、友だちと寿司屋へ行きます。母の作る味噌汁も好きです。日本の食べ物はおいしいです。\\\\n（我喜欢的食物是寿司。喜欢鱼和米饭。周末和朋友去寿司店。也喜欢妈妈做的味噌汤。日本的食物很好吃。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"日曜日の予定\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"周日的计划\\",\\n    \\"example\\": \\"明日は日曜日です。わたしは図書館へ行きます。本を読みたいです。午後は買い物をします。スーパーで野菜を買います。夜はテレビを見ます。ゆっくり休みます。\\\\n（明天是周日。我要去图书馆。想看书。下午去购物。在超市买蔬菜。晚上看电视。好好休息。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"わたしの町\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的城镇\\",\\n    \\"example\\": \\"わたしの町は静かです。小さい公園があります。近くにコンビニがあります。便利です。人たちは親切です。毎日散歩します。わたしはこの町が好きです。\\\\n（我的城镇很安静。有一个小公园。附近有便利店。很方便。人们很亲切。每天散步。我喜欢这个城镇。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"ペットの猫\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"宠物猫\\",\\n    \\"example\\": \\"うちには猫がいます。名前はミミです。白い猫です。とてもかわいいです。ミミは一日中寝ます。ときどき遊びます。わたしはミミを撫でます。猫が好きです。\\\\n（我家有只猫。名字叫咪咪。是只白猫。非常可爱。咪咪一整天都在睡觉。偶尔玩一玩。我摸咪咪。喜欢猫。）\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:58:45.957Z"}	2026-07-26 04:58:45.959	2026-07-26 04:58:45.959
44a5b209-b7a3-4619-8a7f-c16e9c9e7672	listening	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	1	{"type": "listening", "items": [{"id": "l1", "word": "あいさつ", "example": "[Audio] 田中：おはようございます。山田：おはようございます。今日はいい天気ですね。田中：そうですね。山田：行ってらっしゃい。田中：いってきます。/ 田中：早上好。山田：早上好。今天天气真好啊。田中：是啊。山田：路上小心。田中：我出门了。", "meaning": "打招呼", "phonetic": "Beginner - 短"}, {"id": "l2", "word": "コンビニで", "example": "[Audio] 店員：いらっしゃいませ。客：お水をください。店員：はい、百円です。客：これでお願いします。店員：ありがとうございます。/ 店员：欢迎光临。客人：请给我水。店员：好的，一百日元。客人：用这个付。店员：谢谢。", "meaning": "在便利店", "phonetic": "Beginner - 短"}, {"id": "l3", "word": "自己紹介", "example": "[Audio] 皆さん、こんにちは。私はリィです。中国から来ました。二十歳です。日本語を勉強しています。よろしくお願いします。/ 大家好。我是小李。我来自中国。二十岁。我在学习日语。请多关照。", "meaning": "自我介绍", "phonetic": "Beginner - 短"}, {"id": "l4", "word": "電車のアナウンス", "example": "[Audio] 次は東京駅です。東京駅で降りる方は、ドアの近くへお集まりください。東京駅です。お忘れ物にご注意ください。/ 下一站是东京站。在东京站下车的乘客请往车门附近集中。到达东京站。请注意不要遗忘物品。", "meaning": "电车广播", "phonetic": "Beginner - 短"}, {"id": "l5", "word": "カフェでの注文", "example": "[Audio] 店員：いらっしゃいませ。何にしますか。客：コーヒーをお願いします。店員：ホットですか、アイスですか。客：ホットでお願いします。店員：かしこまりました。少々お待ちください。/ 店员：欢迎光临。您要什么？客人：我要咖啡。店员：热的还是冰的？客人：请给我热的。店员：明白了。请稍等。", "meaning": "在咖啡店点单", "phonetic": "Beginner - 中"}, {"id": "l6", "word": "友達との約束", "example": "[Audio] さくら：明日、一緒に映画を見ませんか。たけし：いいですね。何時ですか。さくら：三時でどうですか。たけし：わかりました。駅で会いましょう。さくら：はい、楽しみです。/ 樱花：明天一起看电影好吗？武：好啊。几点？樱花：三点怎么样？武：知道了。在车站见吧。樱花：好的，很期待。", "meaning": "和朋友的约定", "phonetic": "Beginner - 中"}, {"id": "l7", "word": "朝のルーティン", "example": "[Audio] 私は毎朝七時に起きます。顔を洗って、歯を磨きます。それから、朝ご飯を食べます。パンと牛乳です。八時に家を出てます。学校へ行きます。/ 我每天早上七点起床。洗脸、刷牙。然后吃早饭。是面包和牛奶。八点出门。去学校。", "meaning": "早晨的日常", "phonetic": "Beginner - 中"}, {"id": "l8", "word": "荷物の説明", "example": "[Audio] すみません、この荷物はどこに置きますか。駅員：あちらのロッカーを使ってください。百円で一日借りられます。客：ありがとうございます。大きいかばんですが、大丈夫ですか。駅員：はい、大丈夫です。/ 不好意思，这个行李放哪里？站务员：请使用那边的储物柜。一百日元可以用一天。客人：谢谢。是个大包，没关系吗？站务员：是的，没关系。", "meaning": "行李说明", "phonetic": "Beginner - 中"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T04:58:48.943Z"}	2026-07-26 04:58:48.948	2026-07-26 08:16:24.884
2423119f-d4b5-49d2-8d30-7dae3ccbe6d5	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	11	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (中文翻译：我有一个小家庭。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里。我们在一起很开心。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight in the morning. I have many friends in my class. We learn English, math, and science. At noon, we eat lunch in the cafeteria. After lunch, we play outside. School ends at three in the afternoon. I walk home with my friend. (中文翻译：我周一到周五上学。学校早上八点开始。班里有好多朋友。我们学英语、数学和科学。中午我们在食堂吃午饭。饭后去外面玩。下午三点放学。我和朋友走路回家。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and tastes good. Pizza has bread, cheese, and tomato. Sometimes we add chicken or vegetables. My mother makes pizza at home on Sunday. We eat it together. I also like apples and bananas. Fruit is sweet and healthy. (中文翻译：我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时加鸡肉或蔬菜。妈妈周日在家做披萨，我们一起吃。我也喜欢苹果和香蕉。水果甜又健康。)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. Max is friendly. He wags his tail when he sees me. I love my dog. (中文翻译：我有一只宠物狗，叫Max。他是棕白相间的。Max两岁了。他喜欢在公园跑。每天早上我带他散步。他吃狗粮喝水。Max很友好，见到我就摇尾巴。我爱我的狗。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Weekend Fun", "example": "On Saturday, I do not go to school. I help my mother clean the house. In the afternoon, I ride my bike. On Sunday, my family goes to the park. We have a picnic. I fly a kite with my sister. In the evening, we watch a movie at home. Weekends are fun. (中文翻译：周六不用上学。我帮妈妈打扫房子。下午骑自行车。周日全家去公园野餐。我和姐姐放风筝。晚上在家看电影。周末真有趣。)", "meaning": "周末乐趣", "phonetic": "beginner"}, {"id": "r6", "word": "The Weather Today", "example": "Today the weather is sunny. The sky is blue. It is warm but not too hot. I wear a T-shirt and shorts. The birds are singing in the trees. My friend and I play soccer in the garden. We drink cold water. I like sunny days because I can play outside. (中文翻译：今天天气晴朗。天空蓝蓝的。温暖但不热。我穿T恤和短裤。鸟儿在树上唱歌。我和朋友在花园踢足球。我们喝冷水。我喜欢晴天，因为能出去玩。)", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T04:56:01.246Z"}	2026-07-26 04:56:01.248	2026-07-28 11:44:15.198
955b5984-f96d-425f-b61b-2e2814da8ee7	lesson	AI_GENERATED	zh-CN	en	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (中文翻译：我有一个小家庭。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里。我们在一起很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight in the morning. I have many friends in my class. We learn English, math, and science. At noon, we eat lunch in the cafeteria. After lunch, we play outside. School ends at three in the afternoon. I walk home with my friend. (中文翻译：我周一到周五上学。学校早上八点开始。班里有好多朋友。我们学英语、数学和科学。中午我们在食堂吃午饭。饭后去外面玩。下午三点放学。我和朋友走路回家。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and tastes good. Pizza has bread, cheese, and tomato. Sometimes we add chicken or vegetables. My mother makes pizza at home on Sunday. We eat it together. I also like apples and bananas. Fruit is sweet and healthy. (中文翻译：我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时加鸡肉或蔬菜。妈妈周日在家做披萨，我们一起吃。我也喜欢苹果和香蕉。水果甜又健康。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. Max is friendly. He wags his tail when he sees me. I love my dog. (中文翻译：我有一只宠物狗，叫Max。他是棕白相间的。Max两岁了。他喜欢在公园跑。每天早上我带他散步。他吃狗粮喝水。Max很友好，见到我就摇尾巴。我爱我的狗。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Weekend Fun\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"周末乐趣\\",\\n    \\"example\\": \\"On Saturday, I do not go to school. I help my mother clean the house. In the afternoon, I ride my bike. On Sunday, my family goes to the park. We have a picnic. I fly a kite with my sister. In the evening, we watch a movie at home. Weekends are fun. (中文翻译：周六不用上学。我帮妈妈打扫房子。下午骑自行车。周日全家去公园野餐。我和姐姐放风筝。晚上在家看电影。周末真有趣。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"The Weather Today\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"今天的天气\\",\\n    \\"example\\": \\"Today the weather is sunny. The sky is blue. It is warm but not too hot. I wear a T-shirt and shorts. The birds are singing in the trees. My friend and I play soccer in the garden. We drink cold water. I like sunny days because I can play outside. (中文翻译：今天天气晴朗。天空蓝蓝的。温暖但不热。我穿T恤和短裤。鸟儿在树上唱歌。我和朋友在花园踢足球。我们喝冷水。我喜欢晴天，因为能出去玩。)\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:56:01.245Z"}	2026-07-26 04:56:01.247	2026-07-26 04:56:01.247
90bef896-082b-43ba-a8f1-8b97000c8508	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"です\\",\\n    \\"phonetic\\": \\"名詞 + です\\",\\n    \\"meaning\\": \\"表示断定，相当于中文的“是”。用于句尾，礼貌体。\\",\\n    \\"example\\": \\"これは本です。/这是书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"ではありません\\",\\n    \\"phonetic\\": \\"名詞 + ではありません\\",\\n    \\"meaning\\": \\"表示否定断定，相当于中文的“不是”。礼貌体否定。\\",\\n    \\"example\\": \\"彼は学生ではありません。/他不是学生。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"の\\",\\n    \\"phonetic\\": \\"名詞 + の + 名詞\\",\\n    \\"meaning\\": \\"表示所属、属性或修饰关系，相当于中文的“的”。\\",\\n    \\"example\\": \\"私の猫は可愛いです。/我的猫很可爱。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"を\\",\\n    \\"phonetic\\": \\"名詞 + を + 動詞ます\\",\\n    \\"meaning\\": \\"提示动作的对象（宾语），接在宾语后。\\",\\n    \\"example\\": \\"りんごを食べます。/吃苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"に\\",\\n    \\"phonetic\\": \\"場所 + に + 動詞ます\\",\\n    \\"meaning\\": \\"表示动作发生的地点或时间接点，相当于“在/于”。\\",\\n    \\"example\\": \\"公園に行きます。/去公园。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"ます形\\",\\n    \\"phonetic\\": \\"動詞ます形（例：書く→書きます）\\",\\n    \\"meaning\\": \\"动词礼貌体，用于现在/将来肯定，句尾加ます。\\",\\n    \\"example\\": \\"毎日手紙を書きます。/每天写信。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"ました\\",\\n    \\"phonetic\\": \\"動詞ます形去ます + ました\\",\\n    \\"meaning\\": \\"表示过去礼貌肯定，相当于“做了……”。\\",\\n    \\"example\\": \\"昨日映画を見ました。/昨天看了电影。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"ています\\",\\n    \\"phonetic\\": \\"動詞て形 + います\\",\\n    \\"meaning\\": \\"表示动作正在进行或状态持续，相当于“正在/着”。\\",\\n    \\"example\\": \\"弟は寝ています。/弟弟正在睡觉。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:58:36.864Z"}	2026-07-26 04:58:36.866	2026-07-26 04:58:36.866
d7d3ad7f-a34d-41ef-b816-6138593d7bf8	vocabulary	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "こんにちは", "example": "こんにちは、元気ですか。／你好，还好吗？", "meaning": "你好（白天）", "phonetic": "konnichiwa"}, {"id": "v2", "word": "ありがとう", "example": "プレゼント、ありがとう。／礼物，谢谢你了。", "meaning": "谢谢", "phonetic": "arigatou"}, {"id": "v3", "word": "水", "example": "冷たい水が飲みたい。／想喝冷水。", "meaning": "水", "phonetic": "mizu"}, {"id": "v4", "word": "犬", "example": "あの犬は小さい。／那只狗很小。", "meaning": "狗", "phonetic": "inu"}, {"id": "v5", "word": "本", "example": "これは面白い本です。／这是一本有趣的书。", "meaning": "书", "phonetic": "hon"}, {"id": "v6", "word": "食べる", "example": "りんごを食べる。／吃苹果。", "meaning": "吃", "phonetic": "taberu"}, {"id": "v7", "word": "行く", "example": "学校へ行く。／去学校。", "meaning": "去", "phonetic": "iku"}, {"id": "v8", "word": "先生", "example": "先生は親切です。／老师很亲切。", "meaning": "老师", "phonetic": "sensei"}, {"id": "v9", "word": "友達", "example": "彼は私の友達だ。／他是我的朋友。", "meaning": "朋友", "phonetic": "tomodachi"}, {"id": "v10", "word": "朝", "example": "朝に散歩する。／早上散步。", "meaning": "早上", "phonetic": "asa"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T04:58:40.148Z"}	2026-07-26 04:58:40.15	2026-07-26 04:58:40.15
74be0698-bd94-40b0-bbbf-993ab9d4f7d8	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"あいさつ\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"打招呼\\",\\n    \\"example\\": \\"[Audio] 田中：おはようございます。山田：おはようございます。今日はいい天気ですね。田中：そうですね。山田：行ってらっしゃい。田中：いってきます。/ 田中：早上好。山田：早上好。今天天气真好啊。田中：是啊。山田：路上小心。田中：我出门了。\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"コンビニで\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"在便利店\\",\\n    \\"example\\": \\"[Audio] 店員：いらっしゃいませ。客：お水をください。店員：はい、百円です。客：これでお願いします。店員：ありがとうございます。/ 店员：欢迎光临。客人：请给我水。店员：好的，一百日元。客人：用这个付。店员：谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"自己紹介\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"自我介绍\\",\\n    \\"example\\": \\"[Audio] 皆さん、こんにちは。私はリィです。中国から来ました。二十歳です。日本語を勉強しています。よろしくお願いします。/ 大家好。我是小李。我来自中国。二十岁。我在学习日语。请多关照。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"電車のアナウンス\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"电车广播\\",\\n    \\"example\\": \\"[Audio] 次は東京駅です。東京駅で降りる方は、ドアの近くへお集まりください。東京駅です。お忘れ物にご注意ください。/ 下一站是东京站。在东京站下车的乘客请往车门附近集中。到达东京站。请注意不要遗忘物品。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"カフェでの注文\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"在咖啡店点单\\",\\n    \\"example\\": \\"[Audio] 店員：いらっしゃいませ。何にしますか。客：コーヒーをお願いします。店員：ホットですか、アイスですか。客：ホットでお願いします。店員：かしこまりました。少々お待ちください。/ 店员：欢迎光临。您要什么？客人：我要咖啡。店员：热的还是冰的？客人：请给我热的。店员：明白了。请稍等。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"友達との約束\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"和朋友的约定\\",\\n    \\"example\\": \\"[Audio] さくら：明日、一緒に映画を見ませんか。たけし：いいですね。何時ですか。さくら：三時でどうですか。たけし：わかりました。駅で会いましょう。さくら：はい、楽しみです。/ 樱花：明天一起看电影好吗？武：好啊。几点？樱花：三点怎么样？武：知道了。在车站见吧。樱花：好的，很期待。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"朝のルーティン\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"早晨的日常\\",\\n    \\"example\\": \\"[Audio] 私は毎朝七時に起きます。顔を洗って、歯を磨きます。それから、朝ご飯を食べます。パンと牛乳です。八時に家を出てます。学校へ行きます。/ 我每天早上七点起床。洗脸、刷牙。然后吃早饭。是面包和牛奶。八点出门。去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"荷物の説明\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"行李说明\\",\\n    \\"example\\": \\"[Audio] すみません、この荷物はどこに置きますか。駅員：あちらのロッカーを使ってください。百円で一日借りられます。客：ありがとうございます。大きいかばんですが、大丈夫ですか。駅員：はい、大丈夫です。/ 不好意思，这个行李放哪里？站务员：请使用那边的储物柜。一百日元可以用一天。客人：谢谢。是个大包，没关系吗？站务员：是的，没关系。\\"\\n  }\\n]", "generatedAt": "2026-07-26T04:58:48.943Z"}	2026-07-26 04:58:48.946	2026-07-26 04:58:48.946
d5c46677-b47d-43bc-b767-764b0888a81d	reading	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	1	{"type": "reading", "items": [{"id": "r1", "word": "わたしの家族", "example": "わたしの家族は四人です。父と母と妹とわたしです。父は会社員で、母は先生です。妹は学生です。わたしたちは東京に住んでいます。休みの日は、いっしょに公園へ行きます。とても楽しいです。\\n（我的家人有四口人。爸爸、妈妈、妹妹和我。爸爸是公司职员，妈妈是老师。妹妹是学生。我们住在东京。休息日会一起去公园。非常开心。）", "meaning": "我的家人", "phonetic": "beginner"}, {"id": "r2", "word": "朝のルーティン", "example": "わたしは毎朝七時に起きます。歯を磨いて、顔を洗います。それから、朝ごはんを食べます。パンと卵を食べます。八時に学校へ行きます。電車で十分かかります。朝はいつも忙しいです。\\n（我每天早上七点起床。刷牙、洗脸。然后吃早饭。吃面包和鸡蛋。八点去学校。坐电车要十分钟。早上总是很忙。）", "meaning": "早晨的日常", "phonetic": "beginner"}, {"id": "r3", "word": "好きな食べ物", "example": "わたしの好きな食べ物は寿司です。魚とごはんが好きです。週末に、友だちと寿司屋へ行きます。母の作る味噌汁も好きです。日本の食べ物はおいしいです。\\n（我喜欢的食物是寿司。喜欢鱼和米饭。周末和朋友去寿司店。也喜欢妈妈做的味噌汤。日本的食物很好吃。）", "meaning": "喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "日曜日の予定", "example": "明日は日曜日です。わたしは図書館へ行きます。本を読みたいです。午後は買い物をします。スーパーで野菜を買います。夜はテレビを見ます。ゆっくり休みます。\\n（明天是周日。我要去图书馆。想看书。下午去购物。在超市买蔬菜。晚上看电视。好好休息。）", "meaning": "周日的计划", "phonetic": "beginner"}, {"id": "r5", "word": "わたしの町", "example": "わたしの町は静かです。小さい公園があります。近くにコンビニがあります。便利です。人たちは親切です。毎日散歩します。わたしはこの町が好きです。\\n（我的城镇很安静。有一个小公园。附近有便利店。很方便。人们很亲切。每天散步。我喜欢这个城镇。）", "meaning": "我的城镇", "phonetic": "beginner"}, {"id": "r6", "word": "ペットの猫", "example": "うちには猫がいます。名前はミミです。白い猫です。とてもかわいいです。ミミは一日中寝ます。ときどき遊びます。わたしはミミを撫でます。猫が好きです。\\n（我家有只猫。名字叫咪咪。是只白猫。非常可爱。咪咪一整天都在睡觉。偶尔玩一玩。我摸咪咪。喜欢猫。）", "meaning": "宠物猫", "phonetic": "beginner"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T04:58:45.957Z"}	2026-07-26 04:58:45.96	2026-07-26 08:16:24.883
d486b900-4801-49bc-a920-313edf144062	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"です\\",\\n    \\"phonetic\\": \\"名詞 + です\\",\\n    \\"meaning\\": \\"表示断定，相当于中文的“是”。用于句尾，礼貌体。\\",\\n    \\"example\\": \\"これは本です。/ 这是书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"ではありません\\",\\n    \\"phonetic\\": \\"名詞 + ではありません\\",\\n    \\"meaning\\": \\"表示否定断定，相当于“不是”。礼貌体否定形式。\\",\\n    \\"example\\": \\"彼は学生ではありません。/ 他不是学生。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"の\\",\\n    \\"phonetic\\": \\"名詞 + の + 名詞\\",\\n    \\"meaning\\": \\"格助词，表示所属、属性或修饰关系，相当于“的”。\\",\\n    \\"example\\": \\"私の鉛筆です。/ 是我的铅笔。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"を\\",\\n    \\"phonetic\\": \\"名詞 + を + 動詞\\",\\n    \\"meaning\\": \\"宾格助词，标示动作的对象，相当于“把……”或省略不译。\\",\\n    \\"example\\": \\"りんごを食べます。/ 吃苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"に\\",\\n    \\"phonetic\\": \\"場所 + に + 動詞\\",\\n    \\"meaning\\": \\"格助词，表示动作发生的地点或时间，相当于“在……”或“于……”。\\",\\n    \\"example\\": \\"学校に行きます。/ 去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"ます\\",\\n    \\"phonetic\\": \\"動詞ます形 + ます\\",\\n    \\"meaning\\": \\"礼貌体动词结尾，表示肯定、现在的动作或习惯。\\",\\n    \\"example\\": \\"毎日日本語を勉強します。/ 每天学日语。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"ません\\",\\n    \\"phonetic\\": \\"動詞ます形 + ません\\",\\n    \\"meaning\\": \\"礼貌体否定，表示不做某动作。\\",\\n    \\"example\\": \\"今日は行きません。/ 今天不去。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"たい\\",\\n    \\"phonetic\\": \\"動詞ます形 + たい\\",\\n    \\"meaning\\": \\"表示第一、二人称的愿望，“想做……”。\\",\\n    \\"example\\": \\"水が飲みたいです。/ 想喝水。\\"\\n  }\\n]", "generatedAt": "2026-07-26T08:16:28.061Z"}	2026-07-26 08:16:28.064	2026-07-26 08:16:28.064
09da8ed8-9df0-4d26-a9b0-b4d4a714393a	grammar	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "です", "example": "これは本です。/ 这是书。", "meaning": "表示断定，相当于中文的“是”。用于句尾，礼貌体。", "phonetic": "名詞 + です"}, {"id": "g2", "word": "ではありません", "example": "彼は学生ではありません。/ 他不是学生。", "meaning": "表示否定断定，相当于“不是”。礼貌体否定形式。", "phonetic": "名詞 + ではありません"}, {"id": "g3", "word": "の", "example": "私の鉛筆です。/ 是我的铅笔。", "meaning": "格助词，表示所属、属性或修饰关系，相当于“的”。", "phonetic": "名詞 + の + 名詞"}, {"id": "g4", "word": "を", "example": "りんごを食べます。/ 吃苹果。", "meaning": "宾格助词，标示动作的对象，相当于“把……”或省略不译。", "phonetic": "名詞 + を + 動詞"}, {"id": "g5", "word": "に", "example": "学校に行きます。/ 去学校。", "meaning": "格助词，表示动作发生的地点或时间，相当于“在……”或“于……”。", "phonetic": "場所 + に + 動詞"}, {"id": "g6", "word": "ます", "example": "毎日日本語を勉強します。/ 每天学日语。", "meaning": "礼貌体动词结尾，表示肯定、现在的动作或习惯。", "phonetic": "動詞ます形 + ます"}, {"id": "g7", "word": "ません", "example": "今日は行きません。/ 今天不去。", "meaning": "礼貌体否定，表示不做某动作。", "phonetic": "動詞ます形 + ません"}, {"id": "g8", "word": "たい", "example": "水が飲みたいです。/ 想喝水。", "meaning": "表示第一、二人称的愿望，“想做……”。", "phonetic": "動詞ます形 + たい"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T08:16:28.062Z"}	2026-07-26 08:16:28.065	2026-07-26 08:16:28.065
a73c42d9-3359-40b4-97f4-ec7a3357cc03	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"こんにちは\\",\\n    \\"phonetic\\": \\"konnichiwa\\",\\n    \\"meaning\\": \\"你好（白天用语）\\",\\n    \\"example\\": \\"こんにちは、元気ですか。/你好，还好吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"ありがとう\\",\\n    \\"phonetic\\": \\"arigatou\\",\\n    \\"meaning\\": \\"谢谢\\",\\n    \\"example\\": \\"プレゼント、ありがとう。/礼物，谢谢你了。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"水\\",\\n    \\"phonetic\\": \\"mizu\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"冷たい水を飲みます。/喝冷水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"食べる\\",\\n    \\"phonetic\\": \\"taberu\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"りんごを食べる。/吃苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"本\\",\\n    \\"phonetic\\": \\"hon\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"これは私の本です。/这是我的书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"行く\\",\\n    \\"phonetic\\": \\"iku\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"学校へ行く。/去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"友達\\",\\n    \\"phonetic\\": \\"tomodachi\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"彼は私の友達だ。/他是我的朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"大きい\\",\\n    \\"phonetic\\": \\"ookii\\",\\n    \\"meaning\\": \\"大的\\",\\n    \\"example\\": \\"大きい犬がいる。/有一只大狗。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"今日\\",\\n    \\"phonetic\\": \\"kyou\\",\\n    \\"meaning\\": \\"今天\\",\\n    \\"example\\": \\"今日は日曜日です。/今天是星期日。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"好き\\",\\n    \\"phonetic\\": \\"suki\\",\\n    \\"meaning\\": \\"喜欢\\",\\n    \\"example\\": \\"私は猫が好きです。/我喜欢猫。\\"\\n  }\\n]", "generatedAt": "2026-07-26T08:16:35.089Z"}	2026-07-26 08:16:35.09	2026-07-26 08:16:35.09
a872ffd8-f18e-4244-b206-2b8e8c76f9d9	listening	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "あいさつ", "example": "[Audio] おはようございます。私の名前はたなかです。はじめまして。どうぞよろしくおねがいします。（中文：早上好。我的名字是田中。初次见面。请多多关照。）", "meaning": "打招呼", "phonetic": "Beginner - 短"}, {"id": "l2", "word": "カフェで", "example": "[Audio] すみません、コーヒーをおねがいします。はい、ありがとうございます。いくらですか。三百円です。（中文：不好意思，我要一杯咖啡。好的，谢谢。多少钱？三百日元。）", "meaning": "在咖啡店", "phonetic": "Beginner - 短"}, {"id": "l3", "word": "バスのみち", "example": "[Audio] すみません、えきはどこですか。あそこです。ありがとうございます。どういたしまして。（中文：请问，车站在哪里？在那里。谢谢。不客气。）", "meaning": "公交车站", "phonetic": "Beginner - 短"}, {"id": "l4", "word": "しゅうまつ", "example": "[Audio] 土曜日はひまですか。はい、ひまです。一緒にえいがを見ませんか。いいですね。じゃ、二時に会いましょう。（中文：星期六有空吗？有空。一起去看电影好吗？好啊。那两点见吧。）", "meaning": "周末", "phonetic": "Beginner - 中"}, {"id": "l5", "word": "ねこ", "example": "[Audio] これは私のねこです。名前はミミです。とてもかわいいですね。ありがとうございます。（中文：这是我的猫。名字叫咪咪。很可爱呢。谢谢。）", "meaning": "猫", "phonetic": "Beginner - 短"}, {"id": "l6", "word": "がっこうへのみち", "example": "[Audio] 毎日七時に起きます。八時に家を出ます。そして、あるいてがっこうへ行きます。がっこうは近いです。（中文：每天七点起床。八点出门。然后走路去学校。学校很近。）", "meaning": "去学校的路", "phonetic": "Beginner - 中"}, {"id": "l7", "word": "てんき", "example": "[Audio] きょうはいいてんきですね。はい、あたたかいです。あしたもいいてんきですか。いいえ、雨です。（中文：今天天气真好啊。是的，很暖和。明天也是好天气吗？不，下雨。）", "meaning": "天气", "phonetic": "Beginner - 短"}, {"id": "l8", "word": "スーパーで", "example": "[Audio] りんごを五つください。はい、五百円です。ほかに何かありますか。いいえ、これだけです。（中文：请给我五个苹果。好的，五百日元。还有其他东西吗？不，只要这些。）", "meaning": "在超市", "phonetic": "Beginner - 中"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T08:16:37.157Z"}	2026-07-26 08:16:37.16	2026-07-26 08:16:37.16
78c49921-38ff-4ac6-8190-08d701ff98f8	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"私の朝\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的早晨\\",\\n    \\"example\\": \\"私は毎日七時に起きます。朝ごはんはパンと卵を食べます。それから、コーヒーを飲みます。八時に家を出て、学校へ行きます。学校は近いですから、歩いて行きます。朝の散歩は気持ちがいいです。\\\\n（我每天七点起床。早饭吃面包和鸡蛋。然后喝咖啡。八点出门去学校。学校很近，所以走路去。早晨散步感觉很舒服。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"好きな食べ物\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"喜欢的食物\\",\\n    \\"example\\": \\"私の好きな食べ物は寿司です。寿司は魚とご飯で作ります。週末に、家族と寿司屋へ行きます。父は天ぷらが好きです。母は野菜の寿司を食べます。私たちは楽しい時間を過ごします。\\\\n（我喜欢的食物是寿司。寿司是用鱼和米饭做的。周末，我和家人去寿司店。爸爸喜欢天妇罗。妈妈吃蔬菜寿司。我们度过快乐的时光。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"休日の過ごし方\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"休息日的度过方式\\",\\n    \\"example\\": \\"日曜日は私の休日です。朝はゆっくり起きます。本を読んだり、音楽を聞いたりします。午後には公園へ行きます。公園で犬と遊びます。夕方に家へ帰って、テレビを見ます。\\\\n（星期天是我的休息日。早上慢慢起床。看看书、听听音乐。下午去公园。在公园和狗玩。傍晚回家看电视。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"私のペット\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物\\",\\n    \\"example\\": \\"私は猫を飼っています。名前はミミです。ミミは白くて小さいです。よく寝ますが、元気な時は部屋で走ります。毎日餌をあげます。ミミは魚が好きです。私のいい友達です。\\\\n（我养了一只猫。名字叫咪咪。咪咪是白色的小猫。经常睡觉，但精神好的时候在房间里跑。每天喂它食物。咪咪喜欢鱼。它是我的好朋友。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"買い物\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"购物\\",\\n    \\"example\\": \\"土曜日の午前中にスーパーへ行きます。野菜や果物を買います。りんごは一つ百円です。牛乳も買います。店は人が多いですが、安いです。買い物の後で、アイスクリームを食べます。\\\\n（星期六上午去超市。买蔬菜和水果。苹果一个一百日元。也买牛奶。店里人很多，但很便宜。买完东西后吃冰淇淋。）\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"日本語の勉強\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"日语学习\\",\\n    \\"example\\": \\"私は日本語を勉強しています。平日は学校で勉強します。ひらがなとカタカナを覚えました。今は簡単な会話を練習しています。日本語の歌を聞くのが好きです。もっと上手になりたいです。\\\\n（我在学习日语。平时在学校学习。已经记住了平假名和片假名。现在练习简单的对话。喜欢听日语歌。想变得更擅长。）\\"\\n  }\\n]", "generatedAt": "2026-07-26T08:16:38.369Z"}	2026-07-26 08:16:38.372	2026-07-26 08:16:38.372
921effdb-2cfb-409b-83ce-466337085ab5	lesson	AI_GENERATED	zh-CN	ja	zh-CN	beginner	1.0.0	draft	0	0	{"input": "请为ja语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"あいさつ\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"打招呼\\",\\n    \\"example\\": \\"[Audio] おはようございます。私の名前はたなかです。はじめまして。どうぞよろしくおねがいします。（中文：早上好。我的名字是田中。初次见面。请多多关照。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"カフェで\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"在咖啡店\\",\\n    \\"example\\": \\"[Audio] すみません、コーヒーをおねがいします。はい、ありがとうございます。いくらですか。三百円です。（中文：不好意思，我要一杯咖啡。好的，谢谢。多少钱？三百日元。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"バスのみち\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"公交车站\\",\\n    \\"example\\": \\"[Audio] すみません、えきはどこですか。あそこです。ありがとうございます。どういたしまして。（中文：请问，车站在哪里？在那里。谢谢。不客气。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"しゅうまつ\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"周末\\",\\n    \\"example\\": \\"[Audio] 土曜日はひまですか。はい、ひまです。一緒にえいがを見ませんか。いいですね。じゃ、二時に会いましょう。（中文：星期六有空吗？有空。一起去看电影好吗？好啊。那两点见吧。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"ねこ\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"[Audio] これは私のねこです。名前はミミです。とてもかわいいですね。ありがとうございます。（中文：这是我的猫。名字叫咪咪。很可爱呢。谢谢。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"がっこうへのみち\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"去学校的路\\",\\n    \\"example\\": \\"[Audio] 毎日七時に起きます。八時に家を出ます。そして、あるいてがっこうへ行きます。がっこうは近いです。（中文：每天七点起床。八点出门。然后走路去学校。学校很近。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"てんき\\",\\n    \\"phonetic\\": \\"Beginner - 短\\",\\n    \\"meaning\\": \\"天气\\",\\n    \\"example\\": \\"[Audio] きょうはいいてんきですね。はい、あたたかいです。あしたもいいてんきですか。いいえ、雨です。（中文：今天天气真好啊。是的，很暖和。明天也是好天气吗？不，下雨。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"スーパーで\\",\\n    \\"phonetic\\": \\"Beginner - 中\\",\\n    \\"meaning\\": \\"在超市\\",\\n    \\"example\\": \\"[Audio] りんごを五つください。はい、五百円です。ほかに何かありますか。いいえ、これだけです。（中文：请给我五个苹果。好的，五百日元。还有其他东西吗？不，只要这些。）\\"\\n  }\\n]", "generatedAt": "2026-07-26T08:16:37.157Z"}	2026-07-26 08:16:37.159	2026-07-26 08:16:37.159
02c0ee9c-c66f-47e2-ad13-6664f070e5d6	reading	AI_GENERATED	ja	ja	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "私の朝", "example": "私は毎日七時に起きます。朝ごはんはパンと卵を食べます。それから、コーヒーを飲みます。八時に家を出て、学校へ行きます。学校は近いですから、歩いて行きます。朝の散歩は気持ちがいいです。\\n（我每天七点起床。早饭吃面包和鸡蛋。然后喝咖啡。八点出门去学校。学校很近，所以走路去。早晨散步感觉很舒服。）", "meaning": "我的早晨", "phonetic": "beginner"}, {"id": "r2", "word": "好きな食べ物", "example": "私の好きな食べ物は寿司です。寿司は魚とご飯で作ります。週末に、家族と寿司屋へ行きます。父は天ぷらが好きです。母は野菜の寿司を食べます。私たちは楽しい時間を過ごします。\\n（我喜欢的食物是寿司。寿司是用鱼和米饭做的。周末，我和家人去寿司店。爸爸喜欢天妇罗。妈妈吃蔬菜寿司。我们度过快乐的时光。）", "meaning": "喜欢的食物", "phonetic": "beginner"}, {"id": "r3", "word": "休日の過ごし方", "example": "日曜日は私の休日です。朝はゆっくり起きます。本を読んだり、音楽を聞いたりします。午後には公園へ行きます。公園で犬と遊びます。夕方に家へ帰って、テレビを見ます。\\n（星期天是我的休息日。早上慢慢起床。看看书、听听音乐。下午去公园。在公园和狗玩。傍晚回家看电视。）", "meaning": "休息日的度过方式", "phonetic": "beginner"}, {"id": "r4", "word": "私のペット", "example": "私は猫を飼っています。名前はミミです。ミミは白くて小さいです。よく寝ますが、元気な時は部屋で走ります。毎日餌をあげます。ミミは魚が好きです。私のいい友達です。\\n（我养了一只猫。名字叫咪咪。咪咪是白色的小猫。经常睡觉，但精神好的时候在房间里跑。每天喂它食物。咪咪喜欢鱼。它是我的好朋友。）", "meaning": "我的宠物", "phonetic": "beginner"}, {"id": "r5", "word": "買い物", "example": "土曜日の午前中にスーパーへ行きます。野菜や果物を買います。りんごは一つ百円です。牛乳も買います。店は人が多いですが、安いです。買い物の後で、アイスクリームを食べます。\\n（星期六上午去超市。买蔬菜和水果。苹果一个一百日元。也买牛奶。店里人很多，但很便宜。买完东西后吃冰淇淋。）", "meaning": "购物", "phonetic": "beginner"}, {"id": "r6", "word": "日本語の勉強", "example": "私は日本語を勉強しています。平日は学校で勉強します。ひらがなとカタカナを覚えました。今は簡単な会話を練習しています。日本語の歌を聞くのが好きです。もっと上手になりたいです。\\n（我在学习日语。平时在学校学习。已经记住了平假名和片假名。现在练习简单的对话。喜欢听日语歌。想变得更擅长。）", "meaning": "日语学习", "phonetic": "beginner"}], "level": "beginner", "language": "ja", "generatedAt": "2026-07-26T08:16:38.369Z"}	2026-07-26 08:16:38.374	2026-07-26 08:16:38.374
3fdfe3da-90c0-4b8e-a61f-f1ecfa0220be	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "你好，请用一句话介绍你自己。", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS，一名专业的语言教师，我的母语是中文，专门教初学者学习日语。\\",\\n  \\"example\\": \\"こんにちは、私はAILOSです。日本語を教える先生です。\\",\\n  \\"translation\\": \\"你好，我是AILOS。我是教日语的老师。\\"\\n}", "generatedAt": "2026-07-26T09:21:42.164Z"}	2026-07-26 09:21:42.165	2026-07-26 09:21:42.165
744bcfce-70b7-4e1c-818d-0856fb684aeb	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "你好，请做个简短的自我介绍", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS，你的日语老师。我的母语是中文，现在我来教你日语。我们从最基础的内容开始，慢慢学习。\\",\\n  \\"example\\": \\"はじめまして、AILOSです。\\",\\n  \\"translation\\": \\"初次见面，我是AILOS。\\"\\n}", "generatedAt": "2026-07-26T09:49:23.800Z"}	2026-07-26 09:49:23.802	2026-07-26 09:49:23.802
8455b014-80e6-4262-bf3d-1bb187077093	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. （你好，我的名字是汤姆。）", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I read a book every day. （我每天读一本书。）", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. （这只猫很小。）", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "water", "example": "I drink water. （我喝水。）", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v5", "word": "happy", "example": "She is happy today. （她今天很快乐。）", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v6", "word": "eat", "example": "We eat rice. （我们吃米饭。）", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v7", "word": "red", "example": "The apple is red. （苹果是红色的。）", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "I go to school. （我去上学。）", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. （他是我的朋友。）", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "sun", "example": "The sun is bright. （太阳很明亮。）", "meaning": "太阳", "phonetic": "/sʌn/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:18:59.640Z"}	2026-07-26 10:18:59.643	2026-07-26 10:18:59.643
5a73cf00-bae6-4ff5-ba4c-4ad5ea847afd	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	12	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、妹妹和我。爸爸是老师，他喜欢看书。妈妈是医生，她帮助生病的人。妹妹十岁，她每天上学。我们住在一所小房子里，在一起很开心。)", "meaning": "我的家人", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. After lunch, we play outside. School ends at three in the afternoon. I walk home with my best friend. I like school because I learn new things. (我周一到周五上学。学校早上八点开始。我有数学、英语和科学课。我十二点和朋友吃午饭。午饭后我们在外面玩。下午三点放学。我和最好的朋友走路回家。我喜欢学校，因为我学新东西。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very tasty. Pizza has bread, cheese, and tomatoes. Sometimes we add chicken or vegetables. My mother makes pizza at home on Sundays. We eat it together. I also like apples and bananas. Fruit is good for our health. What is your favorite food? (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我们加鸡肉或蔬菜。妈妈周日在家做披萨，我们一起吃。我也喜欢苹果和香蕉。水果对健康好。你最喜欢的食物是什么？)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. Max is friendly to everyone. He is my good friend. I love my dog very much. (我有一只宠物狗，他的名字是Max。他是棕色和白色的。Max两岁了。他喜欢在公园跑。每天早晨我带他散步。他吃狗粮、喝水。Max对每个人都很友好，他是我的好朋友。我很爱我的狗。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Shopping at the Market", "example": "On Saturday, my mother and I go to the market. We buy fruit, vegetables, and eggs. The market is busy and noisy. I see red apples and yellow bananas. My mother buys some bread. We pay the seller and go home. Cooking with fresh food is fun. I help my mother in the kitchen. (周六，我和妈妈去市场。我们买水果、蔬菜和鸡蛋。市场又忙又吵。我看到红苹果和黄香蕉。妈妈买了一些面包。我们付钱给卖家然后回家。用新鲜食材做饭很有趣，我在厨房帮妈妈。)", "meaning": "在市场购物", "phonetic": "beginner"}, {"id": "r6", "word": "A Rainy Day", "example": "Today it is raining. The sky is gray. I cannot go outside to play. I sit by the window and watch the rain. The trees look clean and green. My cat sleeps on the sofa. I read a book and drink hot milk. Rainy days are quiet and cozy. I like listening to the sound of rain. (今天下雨了。天空灰灰的。我不能出去玩。我坐在窗边看雨。树看起来干净又绿。我的猫在沙发上睡觉。我看书、喝热牛奶。雨天安静又舒适。我喜欢听雨声。)", "meaning": "下雨天", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-25T09:48:35.723Z"}	2026-07-25 09:48:35.727	2026-07-28 11:44:15.198
8db86ec7-b813-4d4d-bc14-8b1d6aee6bf0	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"hello\\",\\n    \\"phonetic\\": \\"/həˈloʊ/\\",\\n    \\"meaning\\": \\"你好\\",\\n    \\"example\\": \\"Hello, my name is Tom. （你好，我的名字是汤姆。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"I read a book every day. （我每天读一本书。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. （这只猫很小。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water. （我喝水。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy today. （她今天很快乐。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"We eat rice. （我们吃米饭。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"The apple is red. （苹果是红色的。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"I go to school. （我去上学。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"He is my friend. （他是我的朋友。）\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"sun\\",\\n    \\"phonetic\\": \\"/sʌn/\\",\\n    \\"meaning\\": \\"太阳\\",\\n    \\"example\\": \\"The sun is bright. （太阳很明亮。）\\"\\n  }\\n]", "generatedAt": "2026-07-26T10:18:59.640Z"}	2026-07-26 10:18:59.642	2026-07-26 10:18:59.642
30d84109-434f-45b7-b39a-5522c4242f20	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Morning Greeting\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"早晨问候\\",\\n    \\"example\\": \\"[Audio] Hello, Tom. Good morning. How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好。你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"At the Shop\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"在商店\\",\\n    \\"example\\": \\"[Audio] Excuse me. I want an apple. How much is it? It is one dollar. Here you are. Thank you. You are welcome. / 打扰一下。我想要一个苹果。多少钱？一美元。给你。谢谢。不客气。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"[Audio] This is my family. This is my father. This is my mother. I have a brother. His name is Sam. We are happy. / 这是我的家庭。这是我的爸爸。这是我的妈妈。我有一个哥哥。他的名字是萨姆。我们很开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今天天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny. The sky is blue. It is warm. I like the weather. Let's play outside. / 看外面。天气晴朗。天空是蓝色的。很暖和。我喜欢这天气。我们出去玩吧。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Order Food\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"点餐\\",\\n    \\"example\\": \\"[Audio] Hello. I want a burger and juice. OK. Here is your food. Thank you. How much? Five dollars. Here you are. / 你好。我想要一个汉堡和果汁。好的。这是您的食物。谢谢。多少钱？五美元。给您。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Library Rules\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"图书馆规则\\",\\n    \\"example\\": \\"[Audio] Welcome to the library. Please be quiet. Do not eat here. You can read books. Please return books on time. / 欢迎来到图书馆。请安静。不要在这里吃东西。你可以看书。请按时还书。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Going to Park\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"去公园\\",\\n    \\"example\\": \\"[Audio] Mom, can we go to the park? Yes, we can. Let's walk there. I see a dog. It is small and cute. I am happy. / 妈妈，我们能去公园吗？是的，可以。我们走路去吧。我看见一只狗。它小且可爱。我很开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Bedtime Talk\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"睡前对话\\",\\n    \\"example\\": \\"[Audio] Dad, I am tired. OK, go to bed. Good night, Dad. Good night, my dear. Sleep well. / 爸爸，我累了。好的，去睡觉吧。晚安，爸爸。晚安，我的宝贝。睡得好。\\"\\n  }\\n]", "generatedAt": "2026-07-26T10:19:01.226Z"}	2026-07-26 10:19:01.228	2026-07-26 10:19:01.228
a4f94e1d-6b2d-4870-ad44-bc63054f904e	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much. (我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。我爸爸是老师，他喜欢读书。我妈妈是医生，她帮助生病的人。我姐姐十岁，她每天去上学。我们住在一所小房子里。我们非常爱彼此。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. In the afternoon, we play sports. I like playing soccer. School ends at three. My mother picks me up. I am happy at school. (我周一到周五上学。我的学校早上八点开始上课。我有数学、英语和科学课。我十二点和朋友吃午餐。下午我们做运动。我喜欢踢足球。学校三点放学。妈妈来接我。我在学校很开心。)", "meaning": "学校里的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very tasty. Pizza has cheese, tomato, and bread. Sometimes I eat pizza with my family on Friday night. We watch a movie and eat pizza. I also like apples and bananas. They are healthy fruits. I drink water with my meals. (我最喜欢的食物是披萨。它很好吃也容易吃。披萨有奶酪、番茄和面包。有时我周五晚上和家人吃披萨。我们边看电影边吃披萨。我也喜欢苹果和香蕉，它们是健康的水果。我吃饭时喝水。)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He is very friendly. He likes to play with a red ball. I love my dog very much. He is my best friend. (我有一只宠物狗。他的名字叫马克斯。他是棕色和白色的。马克斯两岁了。他喜欢在公园里跑。每天早上我带他散步。他很友好，喜欢玩红色的球。我非常爱我的狗，他是我最好的朋友。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Shopping at the Market", "example": "On Saturday, my mother and I go to the market. We buy fruit and vegetables. The apples are red and sweet. The tomatoes are fresh. My mother buys some chicken for dinner. I help her carry the bags. We walk home together. I like going to the market with my mother. (星期六，我和妈妈去市场。我们买水果和蔬菜。苹果又红又甜。番茄很新鲜。妈妈买了一些鸡肉做晚餐。我帮她提袋子。我们一起走回家。我喜欢和妈妈去市场。)", "meaning": "在市场购物", "phonetic": "beginner"}, {"id": "r6", "word": "My Weekend", "example": "I do not go to school on weekends. On Saturday, I clean my room and read books. On Sunday, my family goes to the park. We have a picnic. I fly a kite with my sister. In the evening, we eat dinner together. I sleep early because Monday is a school day. (周末我不上学。星期六我打扫房间和读书。星期日我们全家去公园，我们野餐。我和姐姐放风筝。晚上我们一起吃晚餐。我早睡，因为星期一是上学日。)", "meaning": "我的周末", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:01.361Z"}	2026-07-26 10:19:01.364	2026-07-26 10:19:01.364
ce4b9968-9232-4b26-af18-68544ddf4987	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be Verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"She is a teacher. 她是一名老师。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"He eats an apple every day. 他每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"They do not like coffee. 他们不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。\\",\\n    \\"example\\": \\"Does she play tennis? 她打网球吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific noun\\",\\n    \\"meaning\\": \\"不定冠词a/an表泛指，定冠词the表特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es (or irregular forms)\\",\\n    \\"meaning\\": \\"名词复数一般在词尾加s或es，部分名词不规则变化。\\",\\n    \\"example\\": \\"There are two cats and three boxes. 有两只猫和三个盒子。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Possessive Adjectives\\",\\n    \\"phonetic\\": \\"my/your/his/her/its/our/their + Noun\\",\\n    \\"meaning\\": \\"形容词性物主代词，表示所属关系，后须接名词。\\",\\n    \\"example\\": \\"This is my book and their pens. 这是我的书和他们们的笔。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Prepositions of Place\\",\\n    \\"phonetic\\": \\"Subject + be + prep (in/on/under) + Place\\",\\n    \\"meaning\\": \\"表示位置的介词，in在…里，on在…上，under在…下。\\",\\n    \\"example\\": \\"The cup is on the table. 杯子在桌子上。\\"\\n  }\\n]", "generatedAt": "2026-07-26T10:19:05.554Z"}	2026-07-26 10:19:05.556	2026-07-26 10:19:05.556
2876ecb8-05e5-465c-a270-5cb2cf36e6a2	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much. (我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。我爸爸是老师，他喜欢读书。我妈妈是医生，她帮助生病的人。我姐姐十岁，她每天去上学。我们住在一所小房子里。我们非常爱彼此。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"学校里的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. In the afternoon, we play sports. I like playing soccer. School ends at three. My mother picks me up. I am happy at school. (我周一到周五上学。我的学校早上八点开始上课。我有数学、英语和科学课。我十二点和朋友吃午餐。下午我们做运动。我喜欢踢足球。学校三点放学。妈妈来接我。我在学校很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very tasty. Pizza has cheese, tomato, and bread. Sometimes I eat pizza with my family on Friday night. We watch a movie and eat pizza. I also like apples and bananas. They are healthy fruits. I drink water with my meals. (我最喜欢的食物是披萨。它很好吃也容易吃。披萨有奶酪、番茄和面包。有时我周五晚上和家人吃披萨。我们边看电影边吃披萨。我也喜欢苹果和香蕉，它们是健康的水果。我吃饭时喝水。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He is very friendly. He likes to play with a red ball. I love my dog very much. He is my best friend. (我有一只宠物狗。他的名字叫马克斯。他是棕色和白色的。马克斯两岁了。他喜欢在公园里跑。每天早上我带他散步。他很友好，喜欢玩红色的球。我非常爱我的狗，他是我最好的朋友。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Shopping at the Market\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在市场购物\\",\\n    \\"example\\": \\"On Saturday, my mother and I go to the market. We buy fruit and vegetables. The apples are red and sweet. The tomatoes are fresh. My mother buys some chicken for dinner. I help her carry the bags. We walk home together. I like going to the market with my mother. (星期六，我和妈妈去市场。我们买水果和蔬菜。苹果又红又甜。番茄很新鲜。妈妈买了一些鸡肉做晚餐。我帮她提袋子。我们一起走回家。我喜欢和妈妈去市场。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"My Weekend\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的周末\\",\\n    \\"example\\": \\"I do not go to school on weekends. On Saturday, I clean my room and read books. On Sunday, my family goes to the park. We have a picnic. I fly a kite with my sister. In the evening, we eat dinner together. I sleep early because Monday is a school day. (周末我不上学。星期六我打扫房间和读书。星期日我们全家去公园，我们野餐。我和姐姐放风筝。晚上我们一起吃晚餐。我早睡，因为星期一是上学日。)\\"\\n  }\\n]", "generatedAt": "2026-07-26T10:19:01.361Z"}	2026-07-26 10:19:01.363	2026-07-26 10:19:01.363
7de7b3d2-a07c-41a8-a1e3-d87efda2539d	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:26.257Z"}	2026-07-26 10:19:26.259	2026-07-26 10:19:26.259
8ef6c762-e381-4e17-b8bf-175e95021bdb	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:26.266Z"}	2026-07-26 10:19:26.268	2026-07-26 10:19:26.268
8efc1080-fbb2-46ec-870e-230726692f7f	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	6	{"type": "listening", "items": [{"id": "l1", "word": "Morning Greeting", "example": "[Audio] Hello, Tom. Good morning. How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好。你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！", "meaning": "早晨问候", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "At the Shop", "example": "[Audio] Excuse me. I want an apple. How much is it? It is one dollar. Here you are. Thank you. You are welcome. / 打扰一下。我想要一个苹果。多少钱？一美元。给你。谢谢。不客气。", "meaning": "在商店", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "My Family", "example": "[Audio] This is my family. This is my father. This is my mother. I have a brother. His name is Sam. We are happy. / 这是我的家庭。这是我的爸爸。这是我的妈妈。我有一个哥哥。他的名字是萨姆。我们很开心。", "meaning": "我的家庭", "phonetic": "Beginner - 25s"}, {"id": "l4", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny. The sky is blue. It is warm. I like the weather. Let's play outside. / 看外面。天气晴朗。天空是蓝色的。很暖和。我喜欢这天气。我们出去玩吧。", "meaning": "今天天气", "phonetic": "Beginner - 20s"}, {"id": "l5", "word": "Order Food", "example": "[Audio] Hello. I want a burger and juice. OK. Here is your food. Thank you. How much? Five dollars. Here you are. / 你好。我想要一个汉堡和果汁。好的。这是您的食物。谢谢。多少钱？五美元。给您。", "meaning": "点餐", "phonetic": "Beginner - 30s"}, {"id": "l6", "word": "Library Rules", "example": "[Audio] Welcome to the library. Please be quiet. Do not eat here. You can read books. Please return books on time. / 欢迎来到图书馆。请安静。不要在这里吃东西。你可以看书。请按时还书。", "meaning": "图书馆规则", "phonetic": "Beginner - 25s"}, {"id": "l7", "word": "Going to Park", "example": "[Audio] Mom, can we go to the park? Yes, we can. Let's walk there. I see a dog. It is small and cute. I am happy. / 妈妈，我们能去公园吗？是的，可以。我们走路去吧。我看见一只狗。它小且可爱。我很开心。", "meaning": "去公园", "phonetic": "Beginner - 25s"}, {"id": "l8", "word": "Bedtime Talk", "example": "[Audio] Dad, I am tired. OK, go to bed. Good night, Dad. Good night, my dear. Sleep well. / 爸爸，我累了。好的，去睡觉吧。晚安，爸爸。晚安，我的宝贝。睡得好。", "meaning": "睡前对话", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:01.226Z"}	2026-07-26 10:19:01.228	2026-07-28 11:44:15.2
6769017f-4631-4ea5-93c0-69dcb4a28591	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:26.265Z"}	2026-07-26 10:19:26.267	2026-07-26 10:19:26.267
459bc846-694d-4323-a1b9-364b2d39f934	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:54.179Z"}	2026-07-26 10:19:54.181	2026-07-26 10:19:54.181
ac14e09e-351d-4804-9a59-bf07802fb496	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:54.212Z"}	2026-07-26 10:19:54.213	2026-07-26 10:19:54.213
700d212f-d0e5-4fa2-9359-37957a9034a1	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:54.210Z"}	2026-07-26 10:19:54.212	2026-07-26 10:19:54.212
3d723f89-c6ff-455b-a3b8-924d0eafb3bb	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "こんにちは、今日の天気について一言お願いします", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！你是初学者，所以我们用简单的日语来聊天气。在日语里，说“天气”是「天気（てんき）」，说“好”是「いい」，说“今天”是「今日（きょう）」。把她们连起来就可以说今天的天气不错。下面给你一个简单的例句。\\",\\n  \\"example\\": \\"今日は天気がいいです。\\",\\n  \\"translation\\": \\"今天天气很好。\\"\\n}", "generatedAt": "2026-07-26T10:52:45.134Z"}	2026-07-26 10:52:45.135	2026-07-26 10:52:45.135
15736f50-014f-40fd-af36-8d334ed80654	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	1	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:26.259Z"}	2026-07-26 10:19:26.261	2026-07-26 10:52:53.505
2025fbcc-fd1c-4b94-8e5d-d1538821f33f	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:52:53.519Z"}	2026-07-26 10:52:53.523	2026-07-26 10:52:53.523
e1ab54c9-a505-4120-b0ce-6ef9cbe88355	grammar	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	11	{"notes": "Do not use present simple for actions happening right now - use present continuous instead.", "pattern": "Present Simple Tense", "examples": [{"chinese": "我每天走路去学校。", "english": "I walk to school every day."}, {"chinese": "他每天走路去学校。", "english": "He walks to school every day."}], "explanation": "Used for habits, facts, and general truths. Add -s/-es for third person singular (he/she/it)."}	2026-07-20 03:38:34.306	2026-07-28 11:44:15.183
b7c6494e-2ad7-49fa-b21e-92a69759c779	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:52:53.527Z"}	2026-07-26 10:52:53.53	2026-07-26 10:52:53.53
6c8a9e75-8b3d-4f54-b47b-27cee870e038	grammar	MANUAL	en	en	zh-CN	beginner	1.0.0	published	90	11	{"notes": "English word order is more rigid than many other languages. Changing the order often changes the meaning.", "pattern": "Subject + Verb + Object", "examples": [{"chinese": "我读书。", "english": "I read books."}, {"chinese": "她喝水。", "english": "She drinks water."}], "explanation": "Basic English sentence structure follows SVO order: the subject comes first, then the verb, then the object."}	2026-07-20 03:38:34.305	2026-07-28 11:44:15.183
30727656-4f69-43eb-a105-8601becd5e2f	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	4	{"type": "listening", "items": [{"id": "l1", "word": "Morning Greeting", "example": "[Audio] Hello, Tom. Good morning! How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好！你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！", "meaning": "早晨问候", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "At the Cafe", "example": "[Audio] Hi, I want a coffee, please. Sure. Small or large? Large, please. Here you are. How much is it? Three dollars. Thank you. You're welcome. / 嗨，我要一杯咖啡，谢谢。好的。小杯还是大杯？大杯。给你。多少钱？三美元。谢谢。不客气。", "meaning": "在咖啡馆", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "My Family", "example": "[Audio] I have a small family. There are three people. My dad, my mom, and me. My dad is tall. My mom is kind. I love my family. / 我有一个小家庭。有三个人。我的爸爸、我的妈妈和我。我爸爸很高。我妈妈很和蔼。我爱我的家庭。", "meaning": "我的家庭", "phonetic": "Beginner - 25s"}, {"id": "l4", "word": "Library Notice", "example": "[Audio] Attention, please. The library closes at six p.m. Please return your books. Thank you for coming. Have a nice evening. / 请注意。图书馆下午六点关门。请归还您的书。感谢光临。祝晚上愉快。", "meaning": "图书馆通知", "phonetic": "Beginner - 20s"}, {"id": "l5", "word": "Asking for Time", "example": "[Audio] Excuse me, what time is it? It is three o'clock. Thank you. You're welcome. I must go now. Bye! / 打扰一下，现在几点了？三点了。谢谢。不客气。我现在得走了。拜拜！", "meaning": "询问时间", "phonetic": "Beginner - 20s"}, {"id": "l6", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go for a walk. Good idea! / 看外面。今天晴天。天空是蓝色的。很暖和。我们去散步吧。好主意！", "meaning": "今日天气", "phonetic": "Beginner - 20s"}, {"id": "l7", "word": "Buying Fruit", "example": "[Audio] Can I help you? Yes, I want apples. How many? Four, please. OK. That is two dollars. Here you are. Thanks. / 需要帮忙吗？是的，我要苹果。几个？请给四个。好的。两美元。给你。谢谢。", "meaning": "买水果", "phonetic": "Beginner - 25s"}, {"id": "l8", "word": "Evening Call", "example": "[Audio] Hello, Mary. Hi, John. Are you at home? Yes. Dinner is ready. Come soon. OK, I am coming. / 你好，玛丽。嗨，约翰。你在家吗？在。晚饭好了。快来。好的，我来了。", "meaning": "晚间电话", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T04:56:01.210Z"}	2026-07-26 04:56:01.213	2026-07-26 10:52:53.716
473ffd15-d996-411c-b0f6-37b9e380e753	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	1	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:05.554Z"}	2026-07-26 10:19:05.557	2026-07-26 10:53:09.586
77e7a139-9c6d-402b-9234-79368e2eff50	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:53:09.601Z"}	2026-07-26 10:53:09.603	2026-07-26 10:53:09.603
3f968f63-414a-4259-86a7-10d20d9be633	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:53:09.605Z"}	2026-07-26 10:53:09.607	2026-07-26 10:53:09.607
4ca56148-ccaa-49ff-8eaf-4780f5baf254	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:53:09.608Z"}	2026-07-26 10:53:09.609	2026-07-26 10:53:09.609
95ff252e-6ac5-4f86-875b-572d2813131b	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"hello\\",\\n    \\"phonetic\\": \\"/həˈloʊ/\\",\\n    \\"meaning\\": \\"你好\\",\\n    \\"example\\": \\"Hello, my name is Tom. 你好，我的名字是汤姆。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"I have a book. 我有一本书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"We eat rice. 我们吃米饭。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"The apple is red. 苹果是红色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water. 我喝水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy. 她很快乐。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"We go to school. 我们去学校。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"He is my friend. 他是我的朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"house\\",\\n    \\"phonetic\\": \\"/haʊs/\\",\\n    \\"meaning\\": \\"房子\\",\\n    \\"example\\": \\"This is my house. 这是我的房子。\\"\\n  }\\n]", "generatedAt": "2026-07-28T02:49:15.015Z"}	2026-07-28 02:49:15.017	2026-07-28 02:49:15.017
d660ba22-566a-451b-b1a9-c921d9a43ad7	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much. (我有一个小家庭。我家有四口人：爸爸、妈妈、妹妹和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。妹妹十岁，她每天去上学。我们住在一栋小房子里。我们非常爱彼此。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We study English, math, and science. At twelve, we eat lunch in the cafeteria. After lunch, we play outside. School ends at three in the afternoon. I walk home with my friend. I like school because I learn new things. (我周一到周五上学。学校八点开始上课。班里我有很多朋友。我们学英语、数学和科学。十二点我们在食堂吃午饭。午饭后我们在外面玩。下午三点放学。我和朋友走路回家。我喜欢学校，因为我学新东西。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very tasty. Pizza has cheese, tomato, and bread. Sometimes I eat pizza with vegetables. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for health. What is your favorite food? (我最喜欢的食物是披萨。它好吃又方便。披萨有奶酪、番茄和面包。有时我吃加蔬菜的披萨。妈妈周日在家做披萨。我们坐在一起吃。我也喜欢苹果和香蕉。水果对健康好。你最喜欢的食物是什么？)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He is very friendly and smart. When I come home, he wags his tail. I give him food and water. I love my dog very much. (我有一只宠物狗。他的名字是Max。他是棕色和白色的。Max两岁了。他喜欢在公园跑。每天早晨我带他散步。他很友好又聪明。我回家时他摇尾巴。我给他食物和水。我非常爱我的狗。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Weekend Fun", "example": "On Saturday, I do not go to school. I help my mother clean the house. In the afternoon, I ride my bike. On Sunday, my family goes to the park. We have a picnic and fly a kite. My sister plays with her ball. We come home in the evening. Weekends are happy days for me. (周六我不上学。我帮妈妈打扫房子。下午我骑自行车。周日我们全家去公园。我们野餐并放风筝。妹妹玩球。晚上我们回家。周末对我来说是快乐的日子。)", "meaning": "周末乐趣", "phonetic": "beginner"}, {"id": "r6", "word": "The Weather Today", "example": "Today the weather is sunny. The sky is blue and the sun is warm. I wear a T-shirt and shorts. I go outside to play. Some birds sing in the tree. In the evening, it is cool. My father says it may rain tomorrow. I hope the sun comes again. I like good weather. (今天天气晴朗。天空蓝，太阳暖。我穿T恤和短裤。我去外面玩。一些鸟在树上唱歌。晚上变凉。爸爸说明天可能下雨。我希望太阳再来。我喜欢好天气。)", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T02:49:17.719Z"}	2026-07-28 02:49:17.722	2026-07-28 02:49:17.722
28c8ef2f-9e23-4a22-8999-91fb12cde1f6	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Greeting a Friend\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"问候朋友\\",\\n    \\"example\\": \\"[Audio] Hi, Tom! How are you today? I am fine, thank you. And you? I am good. Would you like to play basketball? Sure, let me get my ball. See you later! \\\\n（你好，汤姆！你今天好吗？我很好，谢谢。你呢？我挺好的。你想打篮球吗？当然，我去拿我的球。一会儿见！）\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"Ordering Coffee\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"点咖啡\\",\\n    \\"example\\": \\"[Audio] Good morning. What would you like? A small coffee, please. With milk? Yes, with a little milk. That is three dollars. Here you are. Thank you. Have a nice day! \\\\n（早上好。您想要点什么？一小杯咖啡，谢谢。加奶吗？是的，加一点奶。三美元。给您。谢谢。祝您一天愉快！）\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"At the Library\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"在图书馆\\",\\n    \\"example\\": \\"[Audio] Excuse me, where are the books about animals? They are on the second floor. Thank you. Can I borrow this book? Yes, for two weeks. Great! \\\\n（打扰一下，关于动物的书在哪里？它们在二楼。谢谢。我可以借这本书吗？可以，借两周。太好了！）\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 15s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny and warm. Let us go for a walk. Good idea. We can go to the park. Yes, bring some water. \\\\n（看外面。天气晴朗又暖和。我们去散步吧。好主意。我们可以去公园。对，带点水。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Bus Announcement\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"公交广播\\",\\n    \\"example\\": \\"[Audio] Attention, passengers. The bus to the airport leaves from Gate 3. Please have your ticket ready. The next bus is in ten minutes. Thank you. \\\\n（乘客请注意。前往机场的巴士从3号门出发。请准备好您的车票。下一班巴士十分钟后出发。谢谢。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Shopping for Fruit\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"买水果\\",\\n    \\"example\\": \\"[Audio] How much are the apples? They are two dollars a kilo. I want one kilo, please. And some bananas too. Sure, that is four dollars total. Here you go. \\\\n（苹果多少钱？两美元一公斤。我要一公斤。还要些香蕉。好的，一共四美元。给您。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"My Daily Routine\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"我的日常\\",\\n    \\"example\\": \\"[Audio] I wake up at seven. I eat breakfast at seven thirty. Then I go to school by bus. I have classes from nine to three. After school, I do my homework. I eat dinner at six. Then I watch TV and go to bed at nine. \\\\n（我七点起床。七点半吃早餐。然后坐公交去学校。我九点到三点上课。放学后，我做作业。六点吃晚饭。然后看电视，九点睡觉。）\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Lost Key\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"丢钥匙\\",\\n    \\"example\\": \\"[Audio] Mom, I cannot find my key. Did you check your bag? Yes, it is not there. Look on the table. Oh, here it is! Thank you, Mom. Let us go now. \\\\n（妈妈，我找不到我的钥匙了。你检查书包了吗？检查了，不在那里。看看桌上。哦，在这里！谢谢妈妈。我们走吧。）\\"\\n  }\\n]", "generatedAt": "2026-07-28T02:49:19.119Z"}	2026-07-28 02:49:19.121	2026-07-28 02:49:19.121
2ec83923-1669-4c26-bb4b-5a4ec06df3dd	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be verb (am/is/are)", "example": "I am a student. 我是一名学生。", "meaning": "be动词用于连接主语和名词或形容词，表示状态或身份。I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "She eats an apple every day. 她每天吃一个苹果。", "meaning": "一般现在时肯定句表示习惯或事实。第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "He does not like coffee. 他不喜欢咖啡。", "meaning": "一般现在时否定句用do not或does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Do you play tennis? 你打网球吗？", "meaning": "一般现在时疑问句将do或does置于句首，第三人称单数用does，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表示泛指，定冠词the表示特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats on the desk. 桌上有两只猫。", "meaning": "名词复数通常在词尾加s，以s/x/ch/sh结尾加es。", "phonetic": "Noun + s/es"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The small dog is happy. 小狗很开心。", "meaning": "形容词用于描述名词或主语的状态，放在be动词后或名词前。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Possessive Adjectives", "example": "This is my book. 这是我的书。", "meaning": "物主形容词表示所属关系，如my, your, his, her, our, their。", "phonetic": "Possessive Adj. + Noun"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T02:49:21.220Z"}	2026-07-28 02:49:21.222	2026-07-28 02:49:21.222
9560e22d-22b2-4ad1-87f1-01301a8add03	vocabulary	AI_GENERATED	ja	ja	zh	beginner	1.0.0	published	80	0	{"word": "天気", "origin": "photo_translate", "meaning": "天气", "reading": "てんき"}	2026-07-26 11:22:39.136	2026-07-26 11:22:39.136
443d96b8-3152-4540-a2fd-1bb58fc9c5ba	vocabulary	AI_GENERATED	ja	ja	zh	beginner	1.0.0	published	80	4	{"word": "天気", "origin": "photo_translate", "meaning": "天气", "reading": "てんき"}	2026-07-26 11:21:58.457	2026-07-28 03:03:05.097
3d909640-944a-471b-9072-43c15ea54cec	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "Hello, how are you?", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是你的日语老师AILOS。作为初学者，我们先来学习如何用日语打招呼和询问对方状态。日语中“こんにちは”是白天的问候语，意思是“你好”；“お元気ですか”是礼貌地询问“你还好吗/你怎么样？”的常用表达。\\",\\n  \\"example\\": \\"こんにちは。お元気ですか。\\",\\n  \\"translation\\": \\"你好。你还好吗？\\"\\n}", "generatedAt": "2026-07-28T03:03:08.922Z"}	2026-07-28 03:03:08.923	2026-07-28 03:03:08.923
697ae3cd-9d48-482f-a7e7-5454bfdc4902	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	2	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "使用be动词表示状态或身份，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实，第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does，第三人称单数用Does，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two books on the desk. 桌上有两本书。", "meaning": "名词复数一般在词尾加s或es，部分名词为不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my cat. 这是我的猫。", "meaning": "形容词性物主代词，放在名词前表示所属关系。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Imperatives", "example": "Close the door, please. 请关上门。", "meaning": "祈使句以动词原形开头，表示命令、请求或建议，通常省略主语you。", "phonetic": "Verb(base form) + (Object)"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T04:56:03.474Z"}	2026-07-26 04:56:03.476	2026-07-26 12:08:37.404
ca2caef1-0dc3-4938-8d06-15a85a501d19	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"apple\\",\\n    \\"phonetic\\": \\"/ˈæpəl/\\",\\n    \\"meaning\\": \\"苹果\\",\\n    \\"example\\": \\"I eat an apple. 我吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"dog\\",\\n    \\"phonetic\\": \\"/dɒɡ/\\",\\n    \\"meaning\\": \\"狗\\",\\n    \\"example\\": \\"I have a dog. 我有一只狗。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water. 我喝水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy. 她很快乐。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"The ball is red. 这个球是红色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"We go home. 我们回家。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"He eats rice. 他吃米饭。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"school\\",\\n    \\"phonetic\\": \\"/skuːl/\\",\\n    \\"meaning\\": \\"学校\\",\\n    \\"example\\": \\"I go to school. 我去学校。\\"\\n  }\\n]", "generatedAt": "2026-07-26T12:08:41.226Z"}	2026-07-26 12:08:41.228	2026-07-26 12:08:41.228
669c1a6a-06a0-419c-b4eb-ca61bf58f057	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a nurse. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是护士，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里。我们在一起很开心。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. In the afternoon, we play sports. I like basketball. School ends at three. My mother picks me up. I do my homework after dinner. (我周一到周五上学。学校早上八点开始。我有数学、英语和科学课。十二点和朋友吃午饭。下午我们做运动，我喜欢篮球。三点放学，妈妈接我。晚饭后我做作业。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very tasty. Pizza has bread, cheese, and tomatoes. Sometimes I eat pizza with chicken. My mother makes pizza at home on Sunday. We sit together and eat. I drink orange juice with it. I am happy when I eat pizza. (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我吃加鸡肉的披萨。妈妈周日在家做披萨，我们一起坐着吃，我喝橙汁。吃披萨时我很开心。)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is white and small. Max likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. At night, he sleeps near my bed. Max is my good friend. I love him very much. (我有一只宠物狗，叫Max。他白色小小的。Max喜欢在公园跑。每天早上我带他散步。他吃狗粮喝水。晚上他在我床边睡。Max是我的好朋友，我很爱他。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Shopping with Mom", "example": "On Saturday, I go shopping with my mom. We go to the supermarket. We buy apples, milk, and bread. Mom also buys rice and eggs. I help her carry the bags. We see my teacher there. We say hello. After shopping, we eat ice cream. It is a nice day. (周六我和妈妈去购物。我们去超市，买苹果、牛奶和面包。妈妈也买米和蛋。我帮她拿袋子。我们在那里看到老师，打了招呼。购物后我们吃冰淇淋，真是美好的一天。)", "meaning": "和妈妈购物", "phonetic": "beginner"}, {"id": "r6", "word": "My Weekend", "example": "I like the weekend. On Saturday, I clean my room and watch TV. On Sunday, my family goes to the park. We fly a kite and eat snacks. My dad takes photos. In the evening, we eat dinner together. Then I read a storybook. I go to bed early because Monday is school day. (我喜欢周末。周六我打扫房间看电视。周日全家去公园，我们放风筝吃零食。爸爸拍照。晚上一起吃晚饭，然后我读故事书。我早睡因为周一是上学日。)", "meaning": "我的周末", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T12:08:43.309Z"}	2026-07-26 12:08:43.312	2026-07-26 12:08:43.312
8096ea57-0ab9-4729-a099-6e94df67655c	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Morning Greeting\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"早晨问候\\",\\n    \\"example\\": \\"[Audio] Hello, Tom. Good morning! How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好！你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"At the Shop\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"在商店\\",\\n    \\"example\\": \\"[Audio] Excuse me, how much is this apple? It is two dollars. OK, I want three apples. Here you are. Thank you. You are welcome. / 打扰一下，这个苹果多少钱？两美元。好的，我要三个苹果。给你。谢谢。不客气。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"[Audio] I have a small family. This is my father. This is my mother. And this is me. We are happy. I love my family. / 我有一个小家庭。这是我的爸爸。这是我的妈妈。这是我。我们很开心。我爱我的家庭。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Ordering Food\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"点餐\\",\\n    \\"example\\": \\"[Audio] Hello, I want a hamburger and a cup of juice. Sure. Anything else? No, thank you. That is five dollars. Here you are. / 你好，我要一个汉堡和一杯果汁。好的。还要别的吗？不用了，谢谢。那是五美元。给你。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go to the park. Good idea! / 看外面。今天天气晴朗。天空是蓝色的。很暖和。我们去公园吧。好主意！\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Lost Key\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"丢失的钥匙\\",\\n    \\"example\\": \\"[Audio] Oh no, I can't find my key. Where is it? Is it on the table? No. Is it in your bag? Yes! Here it is. / 哦不，我找不到我的钥匙了。它在哪里？在桌子上吗？不在。在你包里吗？在！在这里。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Bus Announcement\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"公交通知\\",\\n    \\"example\\": \\"[Audio] Attention, please. The bus to the library is coming. Please stand back. The door is open. Thank you. / 请注意。开往图书馆的公交车来了。请退后。车门打开了。谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Bedtime\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"睡觉时间\\",\\n    \\"example\\": \\"[Audio] It is late. Time to sleep. Brush your teeth. Wash your face. Good night, Mom. Good night, dear. / 很晚了。该睡觉了。刷牙。洗脸。晚安，妈妈。晚安，亲爱的。\\"\\n  }\\n]", "generatedAt": "2026-07-26T12:08:43.388Z"}	2026-07-26 12:08:43.39	2026-07-26 12:08:43.39
983a56f1-fb2d-4088-a351-c2178f54f5c7	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "使用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb (base form / -s for he/she/it) + Object"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb base form + Object"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she read books? 她读书吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb base form + Object?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看见一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表示泛指，定冠词the表示特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two boxes on the desk. 桌上有两个盒子。", "meaning": "名词复数一般在词尾加s，以s/x/ch/sh结尾加es，部分不规则变化。", "phonetic": "Noun + -s / -es (for s, x, ch, sh); irregular forms"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The small cat is cute. 那只小猫很可爱。", "meaning": "形容词用于描述名词或主语的状态，放在be动词后或名词前。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Possessive Adjectives", "example": "This is my book. 这是我的书。", "meaning": "物主形容词表示所属关系，放在名词前说明东西是谁的。", "phonetic": "Possessive adjective (my/your/his/her/our/their) + Noun"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T12:08:47.398Z"}	2026-07-26 12:08:47.401	2026-07-26 12:08:47.401
78564311-8fd7-428d-af25-cc033c4223ea	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "Please teach me one simple daily sentence.", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS，今天我们来学一句简单的日语日常用语。这句话用于早上见面时打招呼，意思是“早上好”。在日语里，早上问候别人可以说“おはよう”，发音大致是“ohayou”。这是很基础的礼貌用语，适合初学者每天使用。\\",\\n  \\"example\\": \\"おはよう。\\",\\n  \\"translation\\": \\"早上好。\\"\\n}", "generatedAt": "2026-07-26T12:09:42.870Z"}	2026-07-26 12:09:42.872	2026-07-26 12:09:42.872
1701befa-86f4-4e70-9c6f-340a0e6fdaf9	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "apple", "example": "I eat an apple. 我吃一个苹果。", "meaning": "苹果", "phonetic": "/ˈæpəl/"}, {"id": "v2", "word": "book", "example": "This is my book. 这是我的书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "dog", "example": "I have a dog. 我有一只狗。", "meaning": "狗", "phonetic": "/dɒɡ/"}, {"id": "v5", "word": "water", "example": "I drink water. 我喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v6", "word": "happy", "example": "She is happy. 她很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v7", "word": "red", "example": "The ball is red. 这个球是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "We go home. 我们回家。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "eat", "example": "He eats rice. 他吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v10", "word": "school", "example": "I go to school. 我去学校。", "meaning": "学校", "phonetic": "/skuːl/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T12:08:41.226Z"}	2026-07-26 12:08:41.228	2026-07-26 12:08:41.228
5eadc4a2-bd8d-4724-a1ef-bc6fc0ae26e3	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a nurse. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是护士，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里。我们在一起很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight in the morning. I have math, English, and science classes. I eat lunch with my friends at twelve. In the afternoon, we play sports. I like basketball. School ends at three. My mother picks me up. I do my homework after dinner. (我周一到周五上学。学校早上八点开始。我有数学、英语和科学课。十二点和朋友吃午饭。下午我们做运动，我喜欢篮球。三点放学，妈妈接我。晚饭后我做作业。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very tasty. Pizza has bread, cheese, and tomatoes. Sometimes I eat pizza with chicken. My mother makes pizza at home on Sunday. We sit together and eat. I drink orange juice with it. I am happy when I eat pizza. (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我吃加鸡肉的披萨。妈妈周日在家做披萨，我们一起坐着吃，我喝橙汁。吃披萨时我很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is white and small. Max likes to run in the park. Every morning, I take him for a walk. He eats dog food and drinks water. At night, he sleeps near my bed. Max is my good friend. I love him very much. (我有一只宠物狗，叫Max。他白色小小的。Max喜欢在公园跑。每天早上我带他散步。他吃狗粮喝水。晚上他在我床边睡。Max是我的好朋友，我很爱他。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Shopping with Mom\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"和妈妈购物\\",\\n    \\"example\\": \\"On Saturday, I go shopping with my mom. We go to the supermarket. We buy apples, milk, and bread. Mom also buys rice and eggs. I help her carry the bags. We see my teacher there. We say hello. After shopping, we eat ice cream. It is a nice day. (周六我和妈妈去购物。我们去超市，买苹果、牛奶和面包。妈妈也买米和蛋。我帮她拿袋子。我们在那里看到老师，打了招呼。购物后我们吃冰淇淋，真是美好的一天。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"My Weekend\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的周末\\",\\n    \\"example\\": \\"I like the weekend. On Saturday, I clean my room and watch TV. On Sunday, my family goes to the park. We fly a kite and eat snacks. My dad takes photos. In the evening, we eat dinner together. Then I read a storybook. I go to bed early because Monday is school day. (我喜欢周末。周六我打扫房间看电视。周日全家去公园，我们放风筝吃零食。爸爸拍照。晚上一起吃晚饭，然后我读故事书。我早睡因为周一是上学日。)\\"\\n  }\\n]", "generatedAt": "2026-07-26T12:08:43.308Z"}	2026-07-26 12:08:43.311	2026-07-26 12:08:43.311
2a5c0b4b-8dee-4dce-afbc-f9d8ae8d50e8	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "Morning Greeting", "example": "[Audio] Hello, Tom. Good morning! How are you today? I am fine, thank you. And you? I am good. Let's go to school. OK! / 你好，汤姆。早上好！你今天好吗？我很好，谢谢。你呢？我很好。我们去上学吧。好的！", "meaning": "早晨问候", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "At the Shop", "example": "[Audio] Excuse me, how much is this apple? It is two dollars. OK, I want three apples. Here you are. Thank you. You are welcome. / 打扰一下，这个苹果多少钱？两美元。好的，我要三个苹果。给你。谢谢。不客气。", "meaning": "在商店", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "My Family", "example": "[Audio] I have a small family. This is my father. This is my mother. And this is me. We are happy. I love my family. / 我有一个小家庭。这是我的爸爸。这是我的妈妈。这是我。我们很开心。我爱我的家庭。", "meaning": "我的家庭", "phonetic": "Beginner - 20s"}, {"id": "l4", "word": "Ordering Food", "example": "[Audio] Hello, I want a hamburger and a cup of juice. Sure. Anything else? No, thank you. That is five dollars. Here you are. / 你好，我要一个汉堡和一杯果汁。好的。还要别的吗？不用了，谢谢。那是五美元。给你。", "meaning": "点餐", "phonetic": "Beginner - 25s"}, {"id": "l5", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny today. The sky is blue. It is warm. Let's go to the park. Good idea! / 看外面。今天天气晴朗。天空是蓝色的。很暖和。我们去公园吧。好主意！", "meaning": "今日天气", "phonetic": "Beginner - 20s"}, {"id": "l6", "word": "Lost Key", "example": "[Audio] Oh no, I can't find my key. Where is it? Is it on the table? No. Is it in your bag? Yes! Here it is. / 哦不，我找不到我的钥匙了。它在哪里？在桌子上吗？不在。在你包里吗？在！在这里。", "meaning": "丢失的钥匙", "phonetic": "Beginner - 25s"}, {"id": "l7", "word": "Bus Announcement", "example": "[Audio] Attention, please. The bus to the library is coming. Please stand back. The door is open. Thank you. / 请注意。开往图书馆的公交车来了。请退后。车门打开了。谢谢。", "meaning": "公交通知", "phonetic": "Beginner - 20s"}, {"id": "l8", "word": "Bedtime", "example": "[Audio] It is late. Time to sleep. Brush your teeth. Wash your face. Good night, Mom. Good night, dear. / 很晚了。该睡觉了。刷牙。洗脸。晚安，妈妈。晚安，亲爱的。", "meaning": "睡觉时间", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T12:08:43.388Z"}	2026-07-26 12:08:43.391	2026-07-26 12:08:43.391
8f73a347-8cd1-44f8-b0bf-5b0d899d33b4	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"使用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"She is a teacher. 她是一名老师。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb (base form / -s for he/she/it) + Object\\",\\n    \\"meaning\\": \\"一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"He eats an apple every day. 他每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb base form + Object\\",\\n    \\"meaning\\": \\"一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"They do not like coffee. 他们不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb base form + Object?\\",\\n    \\"meaning\\": \\"一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。\\",\\n    \\"example\\": \\"Does she read books? 她读书吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific noun\\",\\n    \\"meaning\\": \\"不定冠词a/an表示泛指，定冠词the表示特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. 我看见一个橘子，这个橘子是甜的。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + -s / -es (for s, x, ch, sh); irregular forms\\",\\n    \\"meaning\\": \\"名词复数一般在词尾加s，以s/x/ch/sh结尾加es，部分不规则变化。\\",\\n    \\"example\\": \\"There are two boxes on the desk. 桌上有两个盒子。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Adjectives (Order/Basic)\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词用于描述名词或主语的状态，放在be动词后或名词前。\\",\\n    \\"example\\": \\"The small cat is cute. 那只小猫很可爱。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Possessive Adjectives\\",\\n    \\"phonetic\\": \\"Possessive adjective (my/your/his/her/our/their) + Noun\\",\\n    \\"meaning\\": \\"物主形容词表示所属关系，放在名词前说明东西是谁的。\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  }\\n]", "generatedAt": "2026-07-26T12:08:47.398Z"}	2026-07-26 12:08:47.4	2026-07-26 12:08:47.4
783ae4aa-08cf-414d-b6ef-3453a55b09b2	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I have a book. 我有一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "eat", "example": "We eat rice. 我们吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v5", "word": "red", "example": "The apple is red. 苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v6", "word": "water", "example": "I drink water. 我喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v7", "word": "happy", "example": "She is happy. 她很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v8", "word": "go", "example": "We go to school. 我们去学校。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "This is my house. 这是我的房子。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T03:14:15.993Z"}	2026-07-28 03:14:15.994	2026-07-28 03:14:15.994
e3fd17ad-886a-4810-85f2-87a23db32b10	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much. (我有一个小家庭。我家有四口人：爸爸、妈妈、妹妹和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。妹妹十岁，她每天去上学。我们住在一栋小房子里。我们非常爱彼此。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We study English, math, and science. At twelve, we eat lunch in the cafeteria. After lunch, we play outside. School ends at three in the afternoon. I walk home with my friend. I like school because I learn new things. (我周一到周五上学。学校八点开始上课。班里我有很多朋友。我们学英语、数学和科学。十二点我们在食堂吃午饭。午饭后我们在外面玩。下午三点放学。我和朋友走路回家。我喜欢学校，因为我学新东西。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very tasty. Pizza has cheese, tomato, and bread. Sometimes I eat pizza with vegetables. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for health. What is your favorite food? (我最喜欢的食物是披萨。它好吃又方便。披萨有奶酪、番茄和面包。有时我吃加蔬菜的披萨。妈妈周日在家做披萨。我们坐在一起吃。我也喜欢苹果和香蕉。水果对健康好。你最喜欢的食物是什么？)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He is very friendly and smart. When I come home, he wags his tail. I give him food and water. I love my dog very much. (我有一只宠物狗。他的名字是Max。他是棕色和白色的。Max两岁了。他喜欢在公园跑。每天早晨我带他散步。他很友好又聪明。我回家时他摇尾巴。我给他食物和水。我非常爱我的狗。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r5", "word": "Weekend Fun", "example": "On Saturday, I do not go to school. I help my mother clean the house. In the afternoon, I ride my bike. On Sunday, my family goes to the park. We have a picnic and fly a kite. My sister plays with her ball. We come home in the evening. Weekends are happy days for me. (周六我不上学。我帮妈妈打扫房子。下午我骑自行车。周日我们全家去公园。我们野餐并放风筝。妹妹玩球。晚上我们回家。周末对我来说是快乐的日子。)", "meaning": "周末乐趣", "phonetic": "beginner"}, {"id": "r6", "word": "The Weather Today", "example": "Today the weather is sunny. The sky is blue and the sun is warm. I wear a T-shirt and shorts. I go outside to play. Some birds sing in the tree. In the evening, it is cool. My father says it may rain tomorrow. I hope the sun comes again. I like good weather. (今天天气晴朗。天空蓝，太阳暖。我穿T恤和短裤。我去外面玩。一些鸟在树上唱歌。晚上变凉。爸爸说明天可能下雨。我希望太阳再来。我喜欢好天气。)", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T03:14:15.996Z"}	2026-07-28 03:14:15.999	2026-07-28 03:14:15.999
1c7d9895-53f2-41e6-85a6-51dab846d62e	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "Define serendipity and give one simple English example sentence. (unique-1785069550)", "scene": "conversation", "output": "{\\n  \\"response\\": \\"同学你好，我是AILOS老师。今天我们来学一个英文词：serendipity。它是名词，意思是“机缘巧合”或“意外发现美好事物的好运”，指本来没打算，却碰巧遇到好事情。作为初学者，你只要记住它表示一种幸运的偶然就好。\\",\\n  \\"example\\": \\"Finding this book was pure serendipity.\\",\\n  \\"translation\\": \\"找到这本书纯粹是机缘巧合。\\"\\n}", "generatedAt": "2026-07-26T12:39:14.517Z"}	2026-07-26 12:39:14.518	2026-07-26 12:39:14.518
fa3c57cd-a182-433f-851f-10082a404d4d	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be verb (am/is/are)", "example": "I am a student. 我是一名学生。", "meaning": "be动词用于连接主语和名词或形容词，表示状态或身份。I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "She eats an apple every day. 她每天吃一个苹果。", "meaning": "一般现在时肯定句表示习惯或事实。第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "He does not like coffee. 他不喜欢咖啡。", "meaning": "一般现在时否定句用do not或does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Do you play tennis? 你打网球吗？", "meaning": "一般现在时疑问句将do或does置于句首，第三人称单数用does，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表示泛指，定冠词the表示特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats on the desk. 桌上有两只猫。", "meaning": "名词复数通常在词尾加s，以s/x/ch/sh结尾加es。", "phonetic": "Noun + s/es"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The small dog is happy. 小狗很开心。", "meaning": "形容词用于描述名词或主语的状态，放在be动词后或名词前。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Possessive Adjectives", "example": "This is my book. 这是我的书。", "meaning": "物主形容词表示所属关系，如my, your, his, her, our, their。", "phonetic": "Possessive Adj. + Noun"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T03:14:15.995Z"}	2026-07-28 03:14:15.997	2026-07-28 03:14:15.997
e592ddb3-7482-43bd-ad8b-87611a2282da	dialogue	AI_GENERATED	zh	fr	zh	beginner	1.0.0	draft	0	0	{"input": "Bonjour, peux-tu me saluer en francais?", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！作为初学者，你可以用最简单的法语打招呼。最基础的问候语是“Bonjour”，意思是“你好”或“早上好/白天好”，用于对陌生人或熟悉的人表示礼貌的日间问候。发音近似“崩茹赫”。\\",\\n  \\"example\\": \\"Bonjour !\\",\\n  \\"translation\\": \\"你好！\\"\\n}", "generatedAt": "2026-07-26T13:59:16.958Z"}	2026-07-26 13:59:16.96	2026-07-26 13:59:16.96
3388d123-555e-4e4b-a500-d91bd5bce35a	dialogue	AI_GENERATED	zh	es	zh	beginner	1.0.0	draft	0	0	{"input": "Hola, salúdame en español por favor.", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是你的西班牙语老师AILOS。作为初学者，我们先学一个简单的打招呼用语。'Hola' 是西班牙语里最基础的问候词，意思是“你好”，适用于任何时间和场合，发音类似中文的“奥拉”。\\",\\n  \\"example\\": \\"Hola, soy AILOS, tu profesor de español.\\",\\n  \\"translation\\": \\"你好，我是AILOS，你的西班牙语老师。\\"\\n}", "generatedAt": "2026-07-26T13:59:18.948Z"}	2026-07-26 13:59:18.949	2026-07-26 13:59:18.949
3ee966d5-a874-4e5d-87fe-42ae153f76c4	dialogue	AI_GENERATED	zh	de	zh	beginner	1.0.0	draft	0	0	{"input": "Hallo, kannst du mich auf Deutsch begrüßen?", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS，你的德语老师。你是初学者，所以我用简单的德语向你打招呼。在德语中，'Hallo'是常用的问候语，意思是“你好”。'Ich heiße'意思是“我叫”，后面跟名字。我们用一句简单的话来练习。\\",\\n  \\"example\\": \\"Hallo, ich heiße AILOS.\\",\\n  \\"translation\\": \\"你好，我叫AILOS。\\"\\n}", "generatedAt": "2026-07-26T13:59:21.467Z"}	2026-07-26 13:59:21.468	2026-07-26 13:59:21.468
9c0af74c-88f6-42eb-8fda-d1fb5fbbd79b	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "Greeting a Friend", "example": "[Audio] Hi, Tom! How are you today? I am fine, thank you. And you? I am good. Would you like to play basketball? Sure, let me get my ball. See you later! \\n（你好，汤姆！你今天好吗？我很好，谢谢。你呢？我挺好的。你想打篮球吗？当然，我去拿我的球。一会儿见！）", "meaning": "问候朋友", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "Ordering Coffee", "example": "[Audio] Good morning. What would you like? A small coffee, please. With milk? Yes, with a little milk. That is three dollars. Here you are. Thank you. Have a nice day! \\n（早上好。您想要点什么？一小杯咖啡，谢谢。加奶吗？是的，加一点奶。三美元。给您。谢谢。祝您一天愉快！）", "meaning": "点咖啡", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "At the Library", "example": "[Audio] Excuse me, where are the books about animals? They are on the second floor. Thank you. Can I borrow this book? Yes, for two weeks. Great! \\n（打扰一下，关于动物的书在哪里？它们在二楼。谢谢。我可以借这本书吗？可以，借两周。太好了！）", "meaning": "在图书馆", "phonetic": "Beginner - 20s"}, {"id": "l4", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny and warm. Let us go for a walk. Good idea. We can go to the park. Yes, bring some water. \\n（看外面。天气晴朗又暖和。我们去散步吧。好主意。我们可以去公园。对，带点水。）", "meaning": "今日天气", "phonetic": "Beginner - 15s"}, {"id": "l5", "word": "Bus Announcement", "example": "[Audio] Attention, passengers. The bus to the airport leaves from Gate 3. Please have your ticket ready. The next bus is in ten minutes. Thank you. \\n（乘客请注意。前往机场的巴士从3号门出发。请准备好您的车票。下一班巴士十分钟后出发。谢谢。）", "meaning": "公交广播", "phonetic": "Beginner - 20s"}, {"id": "l6", "word": "Shopping for Fruit", "example": "[Audio] How much are the apples? They are two dollars a kilo. I want one kilo, please. And some bananas too. Sure, that is four dollars total. Here you go. \\n（苹果多少钱？两美元一公斤。我要一公斤。还要些香蕉。好的，一共四美元。给您。）", "meaning": "买水果", "phonetic": "Beginner - 25s"}, {"id": "l7", "word": "My Daily Routine", "example": "[Audio] I wake up at seven. I eat breakfast at seven thirty. Then I go to school by bus. I have classes from nine to three. After school, I do my homework. I eat dinner at six. Then I watch TV and go to bed at nine. \\n（我七点起床。七点半吃早餐。然后坐公交去学校。我九点到三点上课。放学后，我做作业。六点吃晚饭。然后看电视，九点睡觉。）", "meaning": "我的日常", "phonetic": "Beginner - 30s"}, {"id": "l8", "word": "Lost Key", "example": "[Audio] Mom, I cannot find my key. Did you check your bag? Yes, it is not there. Look on the table. Oh, here it is! Thank you, Mom. Let us go now. \\n（妈妈，我找不到我的钥匙了。你检查书包了吗？检查了，不在那里。看看桌上。哦，在这里！谢谢妈妈。我们走吧。）", "meaning": "丢钥匙", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T03:14:16.000Z"}	2026-07-28 03:14:16.002	2026-07-28 03:14:16.002
e694f0d7-32c9-4558-b5a0-04b48d26601d	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "Hello, please greet me in English.", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！作为初学者，你可以用简单的句子来打招呼。最常用的问候语是'Hello'，意思是“你好”。如果想更礼貌一点，可以说'Good morning'（早上好）、'Good afternoon'（下午好）或'Good evening'（晚上好）。下面我给你一个适合初学者的问候例句。\\",\\n  \\"example\\": \\"Hello, nice to meet you.\\",\\n  \\"translation\\": \\"你好，很高兴认识你。\\"\\n}", "generatedAt": "2026-07-26T13:59:27.724Z"}	2026-07-26 13:59:27.724	2026-07-26 13:59:27.724
885d27e0-ee0e-439b-9da8-302cb32af735	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"hello\\",\\n    \\"phonetic\\": \\"/həˈloʊ/\\",\\n    \\"meaning\\": \\"你好\\",\\n    \\"example\\": \\"Hello, my name is Tom. / 你好，我的名字是汤姆。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"I read a book every day. / 我每天读一本书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water in the morning. / 我早上喝水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. / 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy today. / 她今天很快乐。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"We eat rice for lunch. / 我们午餐吃米饭。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"This apple is red. / 这个苹果是红色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"I go to school by bus. / 我坐公交去上学。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"He is my friend. / 他是我的朋友。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"house\\",\\n    \\"phonetic\\": \\"/haʊs/\\",\\n    \\"meaning\\": \\"房子\\",\\n    \\"example\\": \\"They live in a big house. / 他们住在一所大房子里。\\"\\n  }\\n]", "generatedAt": "2026-07-28T09:05:24.499Z"}	2026-07-28 09:05:24.501	2026-07-28 09:05:24.501
280ca685-4c16-4898-a0b6-9ea8318c90c4	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be verb (am/is/are)", "example": "I am a student. 我是一名学生。", "meaning": "使用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "She reads books every day. 她每天读书。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "He does not like apples. 他不喜欢苹果。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Do you play soccer? 你踢足球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats on the desk. 书桌上有两只猫。", "meaning": "名词复数一般在词尾加s或es，部分不规则变化。", "phonetic": "Noun + s/es (or irregular)"}, {"id": "g7", "word": "Adjectives (Order/Basic)", "example": "The weather is cold. 天气很冷。", "meaning": "形容词作表语放在be动词后，说明主语特征。", "phonetic": "Subject + be + Adjective"}, {"id": "g8", "word": "Imperatives", "example": "Close the door, please. 请关上门。", "meaning": "祈使句以动词原形开头，表示命令、请求或建议。", "phonetic": "Verb(base form) + Object"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T09:05:30.915Z"}	2026-07-28 09:05:30.917	2026-07-28 09:05:30.917
539d376a-2269-47fc-a9c7-d6c69ac8b202	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Meeting a Friend\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"遇见朋友\\",\\n    \\"example\\": \\"[Audio] Hi, Tom! How are you today? I am fine, thank you. Are you going to the library? Yes, I need to study. See you later! / 嗨，汤姆！你今天好吗？我很好，谢谢。你要去图书馆吗？是的，我需要学习。回头见！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"Ordering Coffee\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"点咖啡\\",\\n    \\"example\\": \\"[Audio] Good morning. What would you like? A small black coffee, please. Here you are. That is two dollars. Thank you. Have a nice day. / 早上好。您想要什么？请给我一小杯黑咖啡。给您。两美元。谢谢。祝你有美好的一天。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny and warm. We can walk in the park. Yes, but bring water. Good idea. Let us go now. / 看外面。天气晴朗又暖和。我们可以去公园散步。是的，但带上水。好主意。我们现在走吧。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Bus Announcement\\",\\n    \\"phonetic\\": \\"Beginner - 15s\\",\\n    \\"meaning\\": \\"公交广播\\",\\n    \\"example\\": \\"[Audio] Attention, passengers. Bus number 5 is arriving. Please stand back. The door will open now. / 注意，乘客们。5路公交车即将到达。请退后。车门现在将打开。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"At the Market\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"在市场\\",\\n    \\"example\\": \\"[Audio] These apples are red and sweet. How much? Three for one dollar. I will take six. OK, two dollars. Here you are. / 这些苹果又红又甜。多少钱？一美元三个。我要六个。好的，两美元。给你。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"My Daily Routine\\",\\n    \\"phonetic\\": \\"Beginner - 30s\\",\\n    \\"meaning\\": \\"我的日常\\",\\n    \\"example\\": \\"[Audio] I wake up at seven. I eat breakfast and go to school. I read books in the afternoon. I watch TV at night. Then I sleep. / 我七点起床。我吃早餐然后去上学。下午我看书。晚上我看电视。然后我睡觉。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Lost Key\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"丢失钥匙\\",\\n    \\"example\\": \\"[Audio] Where is my key? I cannot find it. Check your bag. Oh, here it is! Good. Now we can leave. / 我的钥匙在哪？我找不到它。看看你的包。哦，在这！太好了。现在我们可以走了。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Phone Call\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"电话通话\\",\\n    \\"example\\": \\"[Audio] Hello, this is Anna. Hi Anna, it is Ben. Do you want to eat pizza? Sure, at six? Yes, see you then. Bye. / 你好，我是安娜。嗨安娜，我是本。你想吃披萨吗？当然，六点？是的，到时候见。拜拜。\\"\\n  }\\n]", "generatedAt": "2026-07-28T09:05:33.784Z"}	2026-07-28 09:05:33.786	2026-07-28 09:05:33.786
de7c150f-c194-4f20-90b4-cfcbd522a305	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢看书。妈妈是医生，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里，在一起很开心。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We learn English, math, and science. My favorite subject is art. At lunch time, I eat rice and vegetables. After school, I play soccer with my friends. I go home at four in the afternoon. (我周一到周五上学。学校八点开始上课。班里有好多朋友。我们学英语、数学和科学。我最喜欢的课是美术。午饭时，我吃米饭和蔬菜。放学后，我和朋友踢足球。下午四点回家。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very delicious. Pizza has bread, cheese, and tomatoes. Sometimes I eat pizza with chicken. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for our health. (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我吃加鸡肉的披萨。妈妈周日在家做披萨，我们坐在一起吃。我也喜欢苹果和香蕉，水果对健康好。)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "Visiting the Park", "example": "On Saturday morning, I go to the park with my parents. The park is big and green. There are many trees and flowers. I see birds in the sky. Some children ride bikes. I play on the slide. My father sits on the bench and reads a newspaper. We eat ice cream. It is a fun day. (周六早上，我和父母去公园。公园又大又绿，有很多树和花。我看见鸟在天上飞，一些小孩骑自行车。我玩滑梯。爸爸坐在长椅上看报纸。我们吃冰淇淋，真是开心的一天。)", "meaning": "去公园玩", "phonetic": "beginner"}, {"id": "r5", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run and play with a ball. Every morning, I give him food and water. In the evening, we walk in the garden. Max is friendly to everyone. He is my best friend. (我有一只宠物狗，名叫马克斯。他是棕白相间的，两岁了。他喜欢跑和玩球。每天早上我给他食物和水。晚上我们在花园散步。马克斯对每个人都很友好，他是我最好的朋友。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r6", "word": "Weather Today", "example": "Today the weather is sunny. The sky is blue. It is warm but not hot. I wear a T-shirt and shorts. My brother wears a hat. We go outside to fly a kite. The wind is light. In the afternoon, it becomes cloudy. We go home before the rain. (今天天气晴朗，天空蓝蓝的。温暖但不热。我穿T恤和短裤，弟弟戴帽子。我们出去放风筝，风轻轻的。下午变阴天，我们在下雨前回家了。)", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T09:05:38.501Z"}	2026-07-28 09:05:38.504	2026-07-28 09:05:38.504
4aa185c7-18b3-444b-8afe-591d74f3ac6b	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "日本語で挨拶して", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！作为初学者，我们先学习日语中最基础的问候语。日语的“こんにちは”是白天使用的“你好”，发音为“konnichiwa”。它用于日常见面打招呼，是比较礼貌的说法。\\",\\n  \\"example\\": \\"こんにちは。\\",\\n  \\"translation\\": \\"你好。\\"\\n}", "generatedAt": "2026-07-26T14:03:11.318Z"}	2026-07-26 14:03:11.319	2026-07-26 14:03:11.319
157fee16-0bdb-4383-8eb4-a9fae1134557	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. / 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I read a book every day. / 我每天读一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "water", "example": "I drink water in the morning. / 我早上喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v4", "word": "cat", "example": "The cat is small. / 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v5", "word": "happy", "example": "She is happy today. / 她今天很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v6", "word": "eat", "example": "We eat rice for lunch. / 我们午餐吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v7", "word": "red", "example": "This apple is red. / 这个苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "I go to school by bus. / 我坐公交去上学。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. / 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "They live in a big house. / 他们住在一所大房子里。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T09:05:24.499Z"}	2026-07-28 09:05:24.501	2026-07-28 09:05:24.501
b81cebb1-4a9f-41dc-b6d5-8075c7ef6dec	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"使用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"I am a student. 我是一名学生。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"She reads books every day. 她每天读书。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"He does not like apples. 他不喜欢苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。\\",\\n    \\"example\\": \\"Do you play soccer? 你踢足球吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific\\",\\n    \\"meaning\\": \\"不定冠词a/an表泛指，定冠词the表特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es (or irregular)\\",\\n    \\"meaning\\": \\"名词复数一般在词尾加s或es，部分不规则变化。\\",\\n    \\"example\\": \\"There are two cats on the desk. 书桌上有两只猫。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Adjectives (Order/Basic)\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词作表语放在be动词后，说明主语特征。\\",\\n    \\"example\\": \\"The weather is cold. 天气很冷。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Imperatives\\",\\n    \\"phonetic\\": \\"Verb(base form) + Object\\",\\n    \\"meaning\\": \\"祈使句以动词原形开头，表示命令、请求或建议。\\",\\n    \\"example\\": \\"Close the door, please. 请关上门。\\"\\n  }\\n]", "generatedAt": "2026-07-28T09:05:30.915Z"}	2026-07-28 09:05:30.916	2026-07-28 09:05:30.916
5d566660-c08f-42dc-a902-014fd19bfec5	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "Meeting a Friend", "example": "[Audio] Hi, Tom! How are you today? I am fine, thank you. Are you going to the library? Yes, I need to study. See you later! / 嗨，汤姆！你今天好吗？我很好，谢谢。你要去图书馆吗？是的，我需要学习。回头见！", "meaning": "遇见朋友", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "Ordering Coffee", "example": "[Audio] Good morning. What would you like? A small black coffee, please. Here you are. That is two dollars. Thank you. Have a nice day. / 早上好。您想要什么？请给我一小杯黑咖啡。给您。两美元。谢谢。祝你有美好的一天。", "meaning": "点咖啡", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny and warm. We can walk in the park. Yes, but bring water. Good idea. Let us go now. / 看外面。天气晴朗又暖和。我们可以去公园散步。是的，但带上水。好主意。我们现在走吧。", "meaning": "今日天气", "phonetic": "Beginner - 20s"}, {"id": "l4", "word": "Bus Announcement", "example": "[Audio] Attention, passengers. Bus number 5 is arriving. Please stand back. The door will open now. / 注意，乘客们。5路公交车即将到达。请退后。车门现在将打开。", "meaning": "公交广播", "phonetic": "Beginner - 15s"}, {"id": "l5", "word": "At the Market", "example": "[Audio] These apples are red and sweet. How much? Three for one dollar. I will take six. OK, two dollars. Here you are. / 这些苹果又红又甜。多少钱？一美元三个。我要六个。好的，两美元。给你。", "meaning": "在市场", "phonetic": "Beginner - 25s"}, {"id": "l6", "word": "My Daily Routine", "example": "[Audio] I wake up at seven. I eat breakfast and go to school. I read books in the afternoon. I watch TV at night. Then I sleep. / 我七点起床。我吃早餐然后去上学。下午我看书。晚上我看电视。然后我睡觉。", "meaning": "我的日常", "phonetic": "Beginner - 30s"}, {"id": "l7", "word": "Lost Key", "example": "[Audio] Where is my key? I cannot find it. Check your bag. Oh, here it is! Good. Now we can leave. / 我的钥匙在哪？我找不到它。看看你的包。哦，在这！太好了。现在我们可以走了。", "meaning": "丢失钥匙", "phonetic": "Beginner - 20s"}, {"id": "l8", "word": "Phone Call", "example": "[Audio] Hello, this is Anna. Hi Anna, it is Ben. Do you want to eat pizza? Sure, at six? Yes, see you then. Bye. / 你好，我是安娜。嗨安娜，我是本。你想吃披萨吗？当然，六点？是的，到时候见。拜拜。", "meaning": "电话通话", "phonetic": "Beginner - 25s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T09:05:33.784Z"}	2026-07-28 09:05:33.787	2026-07-28 09:05:33.787
d431890c-abc1-4f08-9195-659c2c76153b	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢看书。妈妈是医生，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里，在一起很开心。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We learn English, math, and science. My favorite subject is art. At lunch time, I eat rice and vegetables. After school, I play soccer with my friends. I go home at four in the afternoon. (我周一到周五上学。学校八点开始上课。班里有好多朋友。我们学英语、数学和科学。我最喜欢的课是美术。午饭时，我吃米饭和蔬菜。放学后，我和朋友踢足球。下午四点回家。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very delicious. Pizza has bread, cheese, and tomatoes. Sometimes I eat pizza with chicken. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for our health. (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我吃加鸡肉的披萨。妈妈周日在家做披萨，我们坐在一起吃。我也喜欢苹果和香蕉，水果对健康好。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"Visiting the Park\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"去公园玩\\",\\n    \\"example\\": \\"On Saturday morning, I go to the park with my parents. The park is big and green. There are many trees and flowers. I see birds in the sky. Some children ride bikes. I play on the slide. My father sits on the bench and reads a newspaper. We eat ice cream. It is a fun day. (周六早上，我和父母去公园。公园又大又绿，有很多树和花。我看见鸟在天上飞，一些小孩骑自行车。我玩滑梯。爸爸坐在长椅上看报纸。我们吃冰淇淋，真是开心的一天。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run and play with a ball. Every morning, I give him food and water. In the evening, we walk in the garden. Max is friendly to everyone. He is my best friend. (我有一只宠物狗，名叫马克斯。他是棕白相间的，两岁了。他喜欢跑和玩球。每天早上我给他食物和水。晚上我们在花园散步。马克斯对每个人都很友好，他是我最好的朋友。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"今天的天气\\",\\n    \\"example\\": \\"Today the weather is sunny. The sky is blue. It is warm but not hot. I wear a T-shirt and shorts. My brother wears a hat. We go outside to fly a kite. The wind is light. In the afternoon, it becomes cloudy. We go home before the rain. (今天天气晴朗，天空蓝蓝的。温暖但不热。我穿T恤和短裤，弟弟戴帽子。我们出去放风筝，风轻轻的。下午变阴天，我们在下雨前回家了。)\\"\\n  }\\n]", "generatedAt": "2026-07-28T09:05:38.501Z"}	2026-07-28 09:05:38.503	2026-07-28 09:05:38.503
e2597cd3-11f1-49f5-9a21-bb369611aa23	dialogue	AI_GENERATED	zh	ko	zh	beginner	1.0.0	draft	0	0	{"input": "안녕하세요, 한국어로 인사해 주세요.", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！你是初学者，我们先学最简单的韩语问候语。韩语里‘안녕하세요’是最常用的礼貌问候，意思是‘您好’或‘你好’，用于对不熟悉的人或长辈。发音近似‘安宁哈塞哟’。\\",\\n  \\"example\\": \\"안녕하세요.\\",\\n  \\"translation\\": \\"你好。\\"\\n}", "generatedAt": "2026-07-26T14:05:31.604Z"}	2026-07-26 14:05:31.604	2026-07-26 14:05:31.604
677f10f4-5b7a-4f9c-93f3-0b9c9a446d76	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "こんにちは、日本語で挨拶してください。", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS，你的日语老师。作为初学者，我们先学习最简单的日语问候语。日语中“こんにちは”意思是“你好”，用于白天见面时打招呼。发音是“konnichiwa”。你可以用它来向日本人问好。\\",\\n  \\"example\\": \\"こんにちは。\\",\\n  \\"translation\\": \\"你好。\\"\\n}", "generatedAt": "2026-07-26T14:05:33.272Z"}	2026-07-26 14:05:33.273	2026-07-26 14:05:33.273
8a5c9bdc-f6c1-414f-b78e-11d21360026f	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We are happy together. (我的家庭很小。我家有四口人：爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢看书。妈妈是医生，她帮助生病的人。姐姐十岁，她每天上学。我们住在一栋小房子里，在一起很开心。)", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We learn English, math, and science. My favorite subject is art. At lunch time, I eat rice and vegetables. After school, I play soccer with my friends. I go home at four in the afternoon. (我周一到周五上学。学校八点开始上课。班里有好多朋友。我们学英语、数学和科学。我最喜欢的课是美术。午饭时，我吃米饭和蔬菜。放学后，我和朋友踢足球。下午四点回家。)", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is easy to eat and very delicious. Pizza has bread, cheese, and tomatoes. Sometimes I eat pizza with chicken. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for our health. (我最喜欢的食物是披萨。它好吃又方便。披萨有面包、奶酪和番茄。有时我吃加鸡肉的披萨。妈妈周日在家做披萨，我们坐在一起吃。我也喜欢苹果和香蕉，水果对健康好。)", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "Visiting the Park", "example": "On Saturday morning, I go to the park with my parents. The park is big and green. There are many trees and flowers. I see birds in the sky. Some children ride bikes. I play on the slide. My father sits on the bench and reads a newspaper. We eat ice cream. It is a fun day. (周六早上，我和父母去公园。公园又大又绿，有很多树和花。我看见鸟在天上飞，一些小孩骑自行车。我玩滑梯。爸爸坐在长椅上看报纸。我们吃冰淇淋，真是开心的一天。)", "meaning": "去公园玩", "phonetic": "beginner"}, {"id": "r5", "word": "My Pet Dog", "example": "I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run and play with a ball. Every morning, I give him food and water. In the evening, we walk in the garden. Max is friendly to everyone. He is my best friend. (我有一只宠物狗，名叫马克斯。他是棕白相间的，两岁了。他喜欢跑和玩球。每天早上我给他食物和水。晚上我们在花园散步。马克斯对每个人都很友好，他是我最好的朋友。)", "meaning": "我的宠物狗", "phonetic": "beginner"}, {"id": "r6", "word": "Weather Today", "example": "Today the weather is sunny. The sky is blue. It is warm but not hot. I wear a T-shirt and shorts. My brother wears a hat. We go outside to fly a kite. The wind is light. In the afternoon, it becomes cloudy. We go home before the rain. (今天天气晴朗，天空蓝蓝的。温暖但不热。我穿T恤和短裤，弟弟戴帽子。我们出去放风筝，风轻轻的。下午变阴天，我们在下雨前回家了。)", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T09:05:38.636Z"}	2026-07-28 09:05:38.639	2026-07-28 09:05:38.639
090063e3-ae89-4fb5-aa4e-75fecc620984	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "How do I greet someone politely?", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS老师。作为初学者，你可以用简单的英语句子礼貌地问候别人。最常见的方式是说'Hello'（你好），后面加上先生的称呼'Mr.'加姓氏，或女士的称呼'Ms.'加姓氏。如果想更礼貌，可以说'Good morning'（早上好）、'Good afternoon'（下午好）或'Good evening'（晚上好），再带上称呼。这样会显得很有礼貌。\\",\\n  \\"example\\": \\"Good morning, Ms. Smith.\\",\\n  \\"translation\\": \\"早上好，史密斯女士。\\"\\n}", "generatedAt": "2026-07-26T14:16:18.617Z"}	2026-07-26 14:16:18.618	2026-07-26 14:16:18.618
068d36cc-a872-473c-8f0a-708cec80a0f0	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	4	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:19:54.199Z"}	2026-07-26 10:19:54.201	2026-07-28 11:44:15.183
72bbdfd3-f083-4d90-9250-6691e4a109e3	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "英语的谢谢怎么说", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在英语中，“谢谢”最基础、常用的表达是“thank you”。这是对别人提供帮助、礼物或好意时表示感谢的简单说法。发音类似“桑克 优”。如果是更口语、轻松一点，也可以说“thanks”，意思一样，但“thanks”更简短随意。\\",\\n  \\"example\\": \\"Thank you for your help.\\",\\n  \\"translation\\": \\"谢谢你的帮助。\\"\\n}", "generatedAt": "2026-07-26T14:17:46.717Z"}	2026-07-26 14:17:46.718	2026-07-26 14:17:46.718
b5c2594e-38f2-4b4d-8a0b-0a2d12c6d737	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "How to say thank you", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！我是AILOS老师。在英语中，'谢谢'最基础、最常用的表达是 'thank you'。这是一个动词短语，用于表达对别人的感谢。如果你是初学者，也可以简单说 'thanks'，更口语化、更随意。记住，说谢谢时通常可以配合微笑，会显得更有礼貌哦。\\",\\n  \\"example\\": \\"Thank you for your help.\\",\\n  \\"translation\\": \\"谢谢你的帮助。\\"\\n}", "generatedAt": "2026-07-26T14:17:49.249Z"}	2026-07-26 14:17:49.25	2026-07-26 14:17:49.25
5b2032be-5db0-4e2c-bd06-d58b704d899b	dialogue	AI_GENERATED	zh	en	zh	beginner	1.0.0	draft	0	0	{"input": "早上好怎么说", "scene": "conversation", "output": "{\\n  \\"response\\": \\"早上好用英语说是 'Good morning'。这是很基础的问候语，用于在早晨见面时向别人问好。\\",\\n  \\"example\\": \\"Good morning!\\",\\n  \\"translation\\": \\"早上好！\\"\\n}", "generatedAt": "2026-07-26T14:17:50.646Z"}	2026-07-26 14:17:50.647	2026-07-26 14:17:50.647
8582f5c8-f636-49cb-a9d7-17e505a72190	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "怎么用日语说谢谢", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在日语中，'谢谢'最基础、最常用的说法是'ありがとう'。它是比较轻松、日常的感谢用语，适合对朋友、家人或平辈说。如果是更礼貌一点（比如对不太熟的人或长辈），可以说'ありがとうございます'，不过作为初学者，先掌握'ありがとう'就可以啦。\\",\\n  \\"example\\": \\"ありがとう。\\",\\n  \\"translation\\": \\"谢谢。\\"\\n}", "generatedAt": "2026-07-26T14:19:21.622Z"}	2026-07-26 14:19:21.623	2026-07-26 14:19:21.623
c822f35c-c4c9-457b-b1f7-959883dd2df9	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "apple", "example": "I eat an apple. 我吃一个苹果。", "meaning": "苹果", "phonetic": "/ˈæpəl/"}, {"id": "v2", "word": "book", "example": "This is my book. 这是我的书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "dog", "example": "I have a dog. 我有一只狗。", "meaning": "狗", "phonetic": "/dɒɡ/"}, {"id": "v5", "word": "water", "example": "I drink water. 我喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v6", "word": "happy", "example": "She is happy. 她很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v7", "word": "red", "example": "The ball is red. 这个球是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v8", "word": "go", "example": "We go home. 我们回家。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "eat", "example": "He eats rice. 他吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v10", "word": "friend", "example": "You are my friend. 你是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T11:44:18.586Z"}	2026-07-28 11:44:18.589	2026-07-28 11:44:18.589
d0b18228-9361-4513-bd9b-da0b786d5b71	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Simple Present Tense", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时表示习惯性动作或事实，第三人称单数动词加-s/-es。", "phonetic": "Subject + Verb(base form) + Object"}, {"id": "g3", "word": "Articles (a/an/the)", "example": "I see a cat and an orange on the table. 我看见桌上有一只猫和一个橘子。", "meaning": "a/an表示泛指单数可数名词，an用于元音音素前；the表示特指。", "phonetic": "a/an + Singular Noun; the + Noun"}, {"id": "g4", "word": "Plural Nouns", "example": "There are two books and three boxes. 有两本书和三个盒子。", "meaning": "可数名词复数一般在词尾加-s，以s/x/ch/sh结尾加-es。", "phonetic": "Noun + -s / -es"}, {"id": "g5", "word": "Personal Pronouns", "example": "We help them. 我们帮助他们。", "meaning": "人称代词主格作主语，宾格作宾语，如I/me, he/him, they/them。", "phonetic": "Subject Pronoun + Verb + Object Pronoun"}, {"id": "g6", "word": "Adjectives for Description", "example": "The dog is small and cute. 这只狗很小且可爱。", "meaning": "形容词放在be动词后描述主语的特征。", "phonetic": "Subject + be + Adjective"}, {"id": "g7", "word": "Simple Present Negative", "example": "She does not like coffee. 她不喜欢咖啡。", "meaning": "一般现在时否定用don't/doesn't，第三人称单数用doesn't，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g8", "word": "Yes/No Questions", "example": "Do you play soccer? 你踢足球吗？", "meaning": "一般疑问句用Do/Does开头，第三人称单数用Does，动词用原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T11:44:26.280Z"}	2026-07-28 11:44:26.283	2026-07-28 11:44:26.283
dd10a2c3-bb38-4215-9d4b-2a9d7b7d2d0d	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条listening学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"l1\\",\\n    \\"word\\": \\"Morning Greeting\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"早晨问候\\",\\n    \\"example\\": \\"[Audio] Hello! Good morning. How are you today? I am fine, thank you. I will go to school. See you later! / 你好！早上好。你今天好吗？我很好，谢谢。我要去上学了。回头见！\\"\\n  },\\n  {\\n    \\"id\\": \\"l2\\",\\n    \\"word\\": \\"Ordering Coffee\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"点咖啡\\",\\n    \\"example\\": \\"[Audio] Excuse me. I want a cup of coffee. Small, please. How much is it? It is three dollars. Thank you. Here you are. / 打扰一下。我要一杯咖啡。请给我小杯。多少钱？三美元。谢谢。给你。\\"\\n  },\\n  {\\n    \\"id\\": \\"l3\\",\\n    \\"word\\": \\"At the Library\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"在图书馆\\",\\n    \\"example\\": \\"[Audio] I am at the library. I need a book. The book is red. It is on the table. I like reading here. It is quiet. / 我在图书馆。我需要一本书。这本书是红色的。它在桌子上。我喜欢在这里看书。这里很安静。\\"\\n  },\\n  {\\n    \\"id\\": \\"l4\\",\\n    \\"word\\": \\"Weather Today\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"今日天气\\",\\n    \\"example\\": \\"[Audio] Look outside. It is sunny today. The sky is blue. It is warm. We can walk in the park. I am happy. / 看外面。今天晴天。天空是蓝色的。很暖和。我们可以去公园散步。我很开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"l5\\",\\n    \\"word\\": \\"Bus Announcement\\",\\n    \\"phonetic\\": \\"Beginner - 15s\\",\\n    \\"meaning\\": \\"公交播报\\",\\n    \\"example\\": \\"[Audio] Attention, please. The bus is coming. Please stand back. The door is open. Get on the bus. Thank you. / 请注意。公交车来了。请退后。车门开了。请上车。谢谢。\\"\\n  },\\n  {\\n    \\"id\\": \\"l6\\",\\n    \\"word\\": \\"Talking About Family\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"谈论家庭\\",\\n    \\"example\\": \\"[Audio] This is my family. This is my mother. She is kind. This is my father. He is tall. I love my family. We are happy. / 这是我的家人。这是我的妈妈。她很善良。这是我的爸爸。他很高。我爱我的家人。我们很幸福。\\"\\n  },\\n  {\\n    \\"id\\": \\"l7\\",\\n    \\"word\\": \\"Shopping for Fruit\\",\\n    \\"phonetic\\": \\"Beginner - 25s\\",\\n    \\"meaning\\": \\"买水果\\",\\n    \\"example\\": \\"[Audio] I go to the market. I see apples. They are red and sweet. I buy three apples. I also buy bananas. They are yellow. / 我去市场。我看见苹果。它们又红又甜。我买了三个苹果。我还买了香蕉。它们是黄色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"l8\\",\\n    \\"word\\": \\"Bedtime Routine\\",\\n    \\"phonetic\\": \\"Beginner - 20s\\",\\n    \\"meaning\\": \\"睡前 routine\\",\\n    \\"example\\": \\"[Audio] It is night. I brush my teeth. I wash my face. Then I read a book. I go to bed. Good night, everyone. / 晚上了。我刷牙。我洗脸。然后我读一本书。我上床睡觉。大家晚安。\\"\\n  }\\n]", "generatedAt": "2026-07-28T11:44:26.678Z"}	2026-07-28 11:44:26.68	2026-07-28 11:44:26.68
8f0add01-099b-42c1-9ea6-e15ab5000eb6	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is a student. She likes to play with our dog. We eat dinner together every night. I love my family very much.\\\\n我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。姐姐是学生，她喜欢和我们的狗玩。我们每天晚上一起吃晚饭。我很爱我的家人。\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We learn English, math, and science. At lunch time, I eat rice and vegetables. After school, I play soccer with my friends. I go home at four in the afternoon. School days are busy but fun.\\\\n我周一到周五去上学。学校八点开始上课。班里有好多朋友。我们学英语、数学和科学。午饭时，我吃米饭和蔬菜。放学后，我和朋友踢足球。下午四点回家。上学的日子忙碌但有趣。\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is round and delicious. Pizza has cheese, tomato, and meat on top. My mother makes pizza at home on weekends. I also like to eat pizza with my friends at a restaurant. We drink orange juice with it. Pizza makes me happy.\\\\n我最喜欢的食物是披萨。它是圆的，很好吃。披萨上面有奶酪、番茄和肉。妈妈周末在家做披萨。我也喜欢和朋友在餐厅吃披萨。我们配着喝橙汁。披萨让我开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"Our Pet Cat\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我们的宠物猫\\",\\n    \\"example\\": \\"We have a pet cat. Her name is Mimi. She is white and soft. Mimi likes to sleep on the sofa. She eats fish and drinks milk. Every evening, I play with her. She runs after a red ball. Mimi is a good friend to me. I take care of her every day.\\\\n我们有一只宠物猫。她叫咪咪。她白白软软的。咪咪喜欢在沙发上睡觉。她吃鱼、喝牛奶。每天晚上我和她玩。她追一个红色的球。咪咪是我的好朋友。我每天照顾她。\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Weekend Fun\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"周末乐趣\\",\\n    \\"example\\": \\"On Saturday, I do not go to school. I help my mother clean the house. Then we go to the park. I ride my blue bicycle there. On Sunday, my family goes to see my grandparents. We eat good food and talk. I like the weekend because I can relax.\\\\n星期六不用上学。我帮妈妈打扫房子。然后我们去公园。我在那里骑我的蓝色自行车。星期天，全家去看爷爷奶奶。我们吃好吃的并聊天。我喜欢周末，因为可以放松。\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"The Weather Today\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"今天的天气\\",\\n    \\"example\\": \\"Today the weather is sunny. The sky is blue and the sun is warm. I wear a T-shirt and shorts. I go outside to play. Some birds sing in the tree. My friend and I walk to the shop and buy ice cream. We are happy in the nice weather.\\\\n今天天气晴朗。天空蓝蓝的，太阳暖暖的。我穿T恤和短裤。我去外面玩。一些鸟在树上唱歌。我和朋友走到商店买冰淇淋。好天气里我们很开心。\\"\\n  }\\n]", "generatedAt": "2026-07-28T11:44:33.590Z"}	2026-07-28 11:44:33.592	2026-07-28 11:44:33.592
abd0aeb3-aefa-4e3f-b10d-e7aa84c26d1d	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "怎么用日语说谢谢", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在日语中，表示“谢谢”最常用、最基础的表达是“ありがとう”。这是比较轻松、口语化的说法，适合对朋友或熟悉的人使用。如果是更礼貌一点，可以对长辈或陌生人说“ありがとうございます”。\\",\\n  \\"example\\": \\"ありがとう。\\",\\n  \\"translation\\": \\"谢谢。\\"\\n}", "generatedAt": "2026-07-26T14:21:45.251Z"}	2026-07-26 14:21:45.253	2026-07-26 14:21:45.253
b11b0d9e-1f3c-47bb-ad2b-ac4a8592fdf9	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成10条vocab学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"v1\\",\\n    \\"word\\": \\"apple\\",\\n    \\"phonetic\\": \\"/ˈæpəl/\\",\\n    \\"meaning\\": \\"苹果\\",\\n    \\"example\\": \\"I eat an apple. 我吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"v2\\",\\n    \\"word\\": \\"book\\",\\n    \\"phonetic\\": \\"/bʊk/\\",\\n    \\"meaning\\": \\"书\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  },\\n  {\\n    \\"id\\": \\"v3\\",\\n    \\"word\\": \\"cat\\",\\n    \\"phonetic\\": \\"/kæt/\\",\\n    \\"meaning\\": \\"猫\\",\\n    \\"example\\": \\"The cat is small. 这只猫很小。\\"\\n  },\\n  {\\n    \\"id\\": \\"v4\\",\\n    \\"word\\": \\"dog\\",\\n    \\"phonetic\\": \\"/dɒɡ/\\",\\n    \\"meaning\\": \\"狗\\",\\n    \\"example\\": \\"I have a dog. 我有一只狗。\\"\\n  },\\n  {\\n    \\"id\\": \\"v5\\",\\n    \\"word\\": \\"water\\",\\n    \\"phonetic\\": \\"/ˈwɔːtər/\\",\\n    \\"meaning\\": \\"水\\",\\n    \\"example\\": \\"I drink water. 我喝水。\\"\\n  },\\n  {\\n    \\"id\\": \\"v6\\",\\n    \\"word\\": \\"happy\\",\\n    \\"phonetic\\": \\"/ˈhæpi/\\",\\n    \\"meaning\\": \\"快乐的\\",\\n    \\"example\\": \\"She is happy. 她很快乐。\\"\\n  },\\n  {\\n    \\"id\\": \\"v7\\",\\n    \\"word\\": \\"red\\",\\n    \\"phonetic\\": \\"/red/\\",\\n    \\"meaning\\": \\"红色的\\",\\n    \\"example\\": \\"The ball is red. 这个球是红色的。\\"\\n  },\\n  {\\n    \\"id\\": \\"v8\\",\\n    \\"word\\": \\"go\\",\\n    \\"phonetic\\": \\"/ɡoʊ/\\",\\n    \\"meaning\\": \\"去\\",\\n    \\"example\\": \\"We go home. 我们回家。\\"\\n  },\\n  {\\n    \\"id\\": \\"v9\\",\\n    \\"word\\": \\"eat\\",\\n    \\"phonetic\\": \\"/iːt/\\",\\n    \\"meaning\\": \\"吃\\",\\n    \\"example\\": \\"He eats rice. 他吃米饭。\\"\\n  },\\n  {\\n    \\"id\\": \\"v10\\",\\n    \\"word\\": \\"friend\\",\\n    \\"phonetic\\": \\"/frend/\\",\\n    \\"meaning\\": \\"朋友\\",\\n    \\"example\\": \\"You are my friend. 你是我的朋友。\\"\\n  }\\n]", "generatedAt": "2026-07-28T11:44:18.585Z"}	2026-07-28 11:44:18.588	2026-07-28 11:44:18.588
889c11bf-cfd4-4f4e-8b24-3eb385098d63	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be Verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"She is a teacher. 她是一名老师。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Simple Present Tense\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + Object\\",\\n    \\"meaning\\": \\"一般现在时表示习惯性动作或事实，第三人称单数动词加-s/-es。\\",\\n    \\"example\\": \\"He eats an apple every day. 他每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a/an + Singular Noun; the + Noun\\",\\n    \\"meaning\\": \\"a/an表示泛指单数可数名词，an用于元音音素前；the表示特指。\\",\\n    \\"example\\": \\"I see a cat and an orange on the table. 我看见桌上有一只猫和一个橘子。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + -s / -es\\",\\n    \\"meaning\\": \\"可数名词复数一般在词尾加-s，以s/x/ch/sh结尾加-es。\\",\\n    \\"example\\": \\"There are two books and three boxes. 有两本书和三个盒子。\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Personal Pronouns\\",\\n    \\"phonetic\\": \\"Subject Pronoun + Verb + Object Pronoun\\",\\n    \\"meaning\\": \\"人称代词主格作主语，宾格作宾语，如I/me, he/him, they/them。\\",\\n    \\"example\\": \\"We help them. 我们帮助他们。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Adjectives for Description\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词放在be动词后描述主语的特征。\\",\\n    \\"example\\": \\"The dog is small and cute. 这只狗很小且可爱。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Simple Present Negative\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定用don't/doesn't，第三人称单数用doesn't，动词还原。\\",\\n    \\"example\\": \\"She does not like coffee. 她不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Yes/No Questions\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般疑问句用Do/Does开头，第三人称单数用Does，动词用原形。\\",\\n    \\"example\\": \\"Do you play soccer? 你踢足球吗？\\"\\n  }\\n]", "generatedAt": "2026-07-28T11:44:26.280Z"}	2026-07-28 11:44:26.282	2026-07-28 11:44:26.282
4c5ac41f-14f2-4adf-821e-58a15287af4c	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "Morning Greeting", "example": "[Audio] Hello! Good morning. How are you today? I am fine, thank you. I will go to school. See you later! / 你好！早上好。你今天好吗？我很好，谢谢。我要去上学了。回头见！", "meaning": "早晨问候", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "Ordering Coffee", "example": "[Audio] Excuse me. I want a cup of coffee. Small, please. How much is it? It is three dollars. Thank you. Here you are. / 打扰一下。我要一杯咖啡。请给我小杯。多少钱？三美元。谢谢。给你。", "meaning": "点咖啡", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "At the Library", "example": "[Audio] I am at the library. I need a book. The book is red. It is on the table. I like reading here. It is quiet. / 我在图书馆。我需要一本书。这本书是红色的。它在桌子上。我喜欢在这里看书。这里很安静。", "meaning": "在图书馆", "phonetic": "Beginner - 20s"}, {"id": "l4", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny today. The sky is blue. It is warm. We can walk in the park. I am happy. / 看外面。今天晴天。天空是蓝色的。很暖和。我们可以去公园散步。我很开心。", "meaning": "今日天气", "phonetic": "Beginner - 20s"}, {"id": "l5", "word": "Bus Announcement", "example": "[Audio] Attention, please. The bus is coming. Please stand back. The door is open. Get on the bus. Thank you. / 请注意。公交车来了。请退后。车门开了。请上车。谢谢。", "meaning": "公交播报", "phonetic": "Beginner - 15s"}, {"id": "l6", "word": "Talking About Family", "example": "[Audio] This is my family. This is my mother. She is kind. This is my father. He is tall. I love my family. We are happy. / 这是我的家人。这是我的妈妈。她很善良。这是我的爸爸。他很高。我爱我的家人。我们很幸福。", "meaning": "谈论家庭", "phonetic": "Beginner - 25s"}, {"id": "l7", "word": "Shopping for Fruit", "example": "[Audio] I go to the market. I see apples. They are red and sweet. I buy three apples. I also buy bananas. They are yellow. / 我去市场。我看见苹果。它们又红又甜。我买了三个苹果。我还买了香蕉。它们是黄色的。", "meaning": "买水果", "phonetic": "Beginner - 25s"}, {"id": "l8", "word": "Bedtime Routine", "example": "[Audio] It is night. I brush my teeth. I wash my face. Then I read a book. I go to bed. Good night, everyone. / 晚上了。我刷牙。我洗脸。然后我读一本书。我上床睡觉。大家晚安。", "meaning": "睡前 routine", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T11:44:26.678Z"}	2026-07-28 11:44:26.68	2026-07-28 11:44:26.68
580f4b12-c9da-44c1-8d95-12109ece235b	reading	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "reading", "items": [{"id": "r1", "word": "My Family", "example": "I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is a student. She likes to play with our dog. We eat dinner together every night. I love my family very much.\\n我有一个小家庭。我家有四口人：我的爸爸、妈妈、姐姐和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。姐姐是学生，她喜欢和我们的狗玩。我们每天晚上一起吃晚饭。我很爱我的家人。", "meaning": "我的家庭", "phonetic": "beginner"}, {"id": "r2", "word": "A Day at School", "example": "I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We learn English, math, and science. At lunch time, I eat rice and vegetables. After school, I play soccer with my friends. I go home at four in the afternoon. School days are busy but fun.\\n我周一到周五去上学。学校八点开始上课。班里有好多朋友。我们学英语、数学和科学。午饭时，我吃米饭和蔬菜。放学后，我和朋友踢足球。下午四点回家。上学的日子忙碌但有趣。", "meaning": "在学校的一天", "phonetic": "beginner"}, {"id": "r3", "word": "My Favorite Food", "example": "My favorite food is pizza. It is round and delicious. Pizza has cheese, tomato, and meat on top. My mother makes pizza at home on weekends. I also like to eat pizza with my friends at a restaurant. We drink orange juice with it. Pizza makes me happy.\\n我最喜欢的食物是披萨。它是圆的，很好吃。披萨上面有奶酪、番茄和肉。妈妈周末在家做披萨。我也喜欢和朋友在餐厅吃披萨。我们配着喝橙汁。披萨让我开心。", "meaning": "我最喜欢的食物", "phonetic": "beginner"}, {"id": "r4", "word": "Our Pet Cat", "example": "We have a pet cat. Her name is Mimi. She is white and soft. Mimi likes to sleep on the sofa. She eats fish and drinks milk. Every evening, I play with her. She runs after a red ball. Mimi is a good friend to me. I take care of her every day.\\n我们有一只宠物猫。她叫咪咪。她白白软软的。咪咪喜欢在沙发上睡觉。她吃鱼、喝牛奶。每天晚上我和她玩。她追一个红色的球。咪咪是我的好朋友。我每天照顾她。", "meaning": "我们的宠物猫", "phonetic": "beginner"}, {"id": "r5", "word": "Weekend Fun", "example": "On Saturday, I do not go to school. I help my mother clean the house. Then we go to the park. I ride my blue bicycle there. On Sunday, my family goes to see my grandparents. We eat good food and talk. I like the weekend because I can relax.\\n星期六不用上学。我帮妈妈打扫房子。然后我们去公园。我在那里骑我的蓝色自行车。星期天，全家去看爷爷奶奶。我们吃好吃的并聊天。我喜欢周末，因为可以放松。", "meaning": "周末乐趣", "phonetic": "beginner"}, {"id": "r6", "word": "The Weather Today", "example": "Today the weather is sunny. The sky is blue and the sun is warm. I wear a T-shirt and shorts. I go outside to play. Some birds sing in the tree. My friend and I walk to the shop and buy ice cream. We are happy in the nice weather.\\n今天天气晴朗。天空蓝蓝的，太阳暖暖的。我穿T恤和短裤。我去外面玩。一些鸟在树上唱歌。我和朋友走到商店买冰淇淋。好天气里我们很开心。", "meaning": "今天的天气", "phonetic": "beginner"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T11:44:33.590Z"}	2026-07-28 11:44:33.594	2026-07-28 11:44:33.594
6dfa04ef-4fcc-4889-9df6-cf749e612078	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "怎么用日语说早上好", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在日语中，'早上好'最常用、最基础的说法是'おはようございます'（ohayou gozaimasu），这是比较礼貌的表达，适合对大多数人使用。如果是非常亲密的朋友或家人，初学者也可以先记住简化的'おはよう'（ohayou），但作为beginner，建议先学会礼貌形式。发音时注意'ございます'读得轻一些。\\",\\n  \\"example\\": \\"おはようございます。\\",\\n  \\"translation\\": \\"早上好。\\"\\n}", "generatedAt": "2026-07-26T14:21:48.244Z"}	2026-07-26 14:21:48.245	2026-07-26 14:21:48.245
bb4ebf58-b4f4-4927-bec1-dd33f9cf90d8	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "怎么用日语说晚安", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在日语中，'晚安'最常用、最基础的说法是'おやすみなさい'，它是比较礼貌的表达，用于对家人、朋友或不太亲密的人道晚安。如果是很亲密的人（比如父母对孩子、情侣之间），可以说更简单的'おやすみ'，意思是'睡吧、晚安'。这两个都是初学者最先接触的晚安说法。\\",\\n  \\"example\\": \\"おやすみなさい。\\",\\n  \\"translation\\": \\"晚安。\\"\\n}", "generatedAt": "2026-07-26T14:21:51.061Z"}	2026-07-26 14:21:51.062	2026-07-26 14:21:51.062
120c56f7-f834-4f41-99ca-504cd51a99f4	vocabulary	MANUAL	ja	ja	ja	beginner	1.0.0	published	80	0	{"word": "勉強", "origin": "manual", "meaning": "学习", "reading": "べんきょう"}	2026-07-27 02:49:33.647	2026-07-27 02:49:33.647
538f43d3-bba7-447f-9622-9464edb92ca5	vocabulary	MANUAL	ja	ja	ja	beginner	1.0.0	published	80	0	{"word": "旅行", "origin": "manual", "meaning": "旅行", "reading": ""}	2026-07-27 02:49:33.704	2026-07-27 02:49:33.704
e1fe663d-14a8-4e1f-99ee-17b9f3b95103	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "你好，请用一句话问候我", "scene": "conversation", "output": "{\\n  \\"response\\": \\"作为初学者，我们先学一句简单的日语问候语。日语中‘こんにちは’是白天通用的‘你好’，发音近似‘空你七哇’。\\",\\n  \\"example\\": \\"こんにちは。\\",\\n  \\"translation\\": \\"你好。\\"\\n}", "generatedAt": "2026-07-27T03:52:09.030Z"}	2026-07-27 03:52:09.031	2026-07-27 03:52:09.031
e4f16b9c-7ba2-4471-a88d-c0ca72183ae7	dialogue	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "早上好", "scene": "conversation", "output": "{\\n  \\"response\\": \\"你好！在日语中，'早上好'的意思是'おはよう'（平假名写法）。这是初学者最早会学到的日常问候语，用于上午见面时打招呼。更礼貌的说法是'おはようございます'，但对朋友或家人说'おはよう'就可以。\\",\\n  \\"example\\": \\"おはよう。\\",\\n  \\"translation\\": \\"早上好。\\"\\n}", "generatedAt": "2026-07-27T03:56:48.791Z"}	2026-07-27 03:56:48.792	2026-07-27 03:56:48.792
08a3b654-e7b0-4cc1-bdc2-075d843fd1e5	dialogue	AI_GENERATED	zh	ko	zh	beginner	1.0.0	draft	0	0	{"input": "早上好", "scene": "conversation", "output": "{\\n  \\"response\\": \\"在韩语中，'早上好'可以说'좋은 아침'。这是比较口语、轻松的说法，适合对朋友或家人说。更正式、礼貌的说法是'안녕하세요'，它其实意思是'您好'，在早上也可以使用。我们先学最简单的'좋은 아침'吧。\\",\\n  \\"example\\": \\"좋은 아침!\\",\\n  \\"translation\\": \\"早上好！\\"\\n}", "generatedAt": "2026-07-27T03:56:53.297Z"}	2026-07-27 03:56:53.298	2026-07-27 03:56:53.298
8831697c-8911-4570-b823-5424ed57e627	vocabulary	AI_GENERATED	ja	ja	ja	beginner	1.0.0	published	80	0	{"word": "隔離テスト", "origin": "photo_translate", "meaning": "隔离测试", "reading": "かくり"}	2026-07-27 04:26:38.223	2026-07-27 04:26:38.223
d42814f4-5994-44b4-a420-2624c712d3cd	vocabulary	MANUAL	ko	ko	ko	beginner	1.0.0	published	80	0	{"word": "격리", "origin": "manual", "meaning": "隔离", "reading": "gyeongni"}	2026-07-27 04:26:38.237	2026-07-27 04:26:38.237
caafead7-1794-4580-9df4-dd79280a09a3	vocabulary	MANUAL	ja	ja	ja	beginner	1.0.0	published	80	0	{"word": "域名検収", "origin": "manual", "meaning": "域名验收", "reading": "どめいけんしゅう"}	2026-07-27 04:29:49.066	2026-07-27 04:29:49.066
6840b159-a486-42c3-a106-e28136a8ea0a	vocabulary	MANUAL	ja	ja	ja	beginner	1.0.0	published	80	0	{"word": "猫", "origin": "manual", "meaning": "cat", "reading": "ねこ"}	2026-07-27 11:23:23.693	2026-07-27 11:23:23.693
fc9b3b30-bb40-4b23-aa3c-92869b9c4cf6	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I have a book. 我有一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "eat", "example": "We eat rice. 我们吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v5", "word": "red", "example": "The apple is red. 苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v6", "word": "water", "example": "I drink water. 我喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v7", "word": "happy", "example": "She is happy. 她很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v8", "word": "go", "example": "We go to school. 我们去学校。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "This is my house. 这是我的房子。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T02:49:15.015Z"}	2026-07-28 02:49:15.018	2026-07-28 02:49:15.018
4ed22aa0-e300-4fba-b819-72cca1f4c93b	vocabulary	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "vocab", "items": [{"id": "v1", "word": "hello", "example": "Hello, my name is Tom. 你好，我的名字是汤姆。", "meaning": "你好", "phonetic": "/həˈloʊ/"}, {"id": "v2", "word": "book", "example": "I have a book. 我有一本书。", "meaning": "书", "phonetic": "/bʊk/"}, {"id": "v3", "word": "cat", "example": "The cat is small. 这只猫很小。", "meaning": "猫", "phonetic": "/kæt/"}, {"id": "v4", "word": "eat", "example": "We eat rice. 我们吃米饭。", "meaning": "吃", "phonetic": "/iːt/"}, {"id": "v5", "word": "red", "example": "The apple is red. 苹果是红色的。", "meaning": "红色的", "phonetic": "/red/"}, {"id": "v6", "word": "water", "example": "I drink water. 我喝水。", "meaning": "水", "phonetic": "/ˈwɔːtər/"}, {"id": "v7", "word": "happy", "example": "She is happy. 她很快乐。", "meaning": "快乐的", "phonetic": "/ˈhæpi/"}, {"id": "v8", "word": "go", "example": "We go to school. 我们去学校。", "meaning": "去", "phonetic": "/ɡoʊ/"}, {"id": "v9", "word": "friend", "example": "He is my friend. 他是我的朋友。", "meaning": "朋友", "phonetic": "/frend/"}, {"id": "v10", "word": "house", "example": "This is my house. 这是我的房子。", "meaning": "房子", "phonetic": "/haʊs/"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T02:49:15.147Z"}	2026-07-28 02:49:15.148	2026-07-28 02:49:15.148
e26525d9-1581-4c37-bc07-38570556e1d7	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成6条reading学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"r1\\",\\n    \\"word\\": \\"My Family\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的家庭\\",\\n    \\"example\\": \\"I have a small family. There are four people in my family: my father, my mother, my sister, and me. My father is a teacher. He likes to read books. My mother is a doctor. She helps sick people. My sister is ten years old. She goes to school every day. We live in a small house. We love each other very much. (我有一个小家庭。我家有四口人：爸爸、妈妈、妹妹和我。爸爸是老师，他喜欢读书。妈妈是医生，她帮助生病的人。妹妹十岁，她每天去上学。我们住在一栋小房子里。我们非常爱彼此。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r2\\",\\n    \\"word\\": \\"A Day at School\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"在学校的一天\\",\\n    \\"example\\": \\"I go to school from Monday to Friday. My school starts at eight o'clock. I have many friends in my class. We study English, math, and science. At twelve, we eat lunch in the cafeteria. After lunch, we play outside. School ends at three in the afternoon. I walk home with my friend. I like school because I learn new things. (我周一到周五上学。学校八点开始上课。班里我有很多朋友。我们学英语、数学和科学。十二点我们在食堂吃午饭。午饭后我们在外面玩。下午三点放学。我和朋友走路回家。我喜欢学校，因为我学新东西。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r3\\",\\n    \\"word\\": \\"My Favorite Food\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我最喜欢的食物\\",\\n    \\"example\\": \\"My favorite food is pizza. It is easy to eat and very tasty. Pizza has cheese, tomato, and bread. Sometimes I eat pizza with vegetables. My mother makes pizza at home on Sunday. We sit together and eat. I also like apples and bananas. Fruit is good for health. What is your favorite food? (我最喜欢的食物是披萨。它好吃又方便。披萨有奶酪、番茄和面包。有时我吃加蔬菜的披萨。妈妈周日在家做披萨。我们坐在一起吃。我也喜欢苹果和香蕉。水果对健康好。你最喜欢的食物是什么？)\\"\\n  },\\n  {\\n    \\"id\\": \\"r4\\",\\n    \\"word\\": \\"My Pet Dog\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"我的宠物狗\\",\\n    \\"example\\": \\"I have a pet dog. His name is Max. He is brown and white. Max is two years old. He likes to run in the park. Every morning, I take him for a walk. He is very friendly and smart. When I come home, he wags his tail. I give him food and water. I love my dog very much. (我有一只宠物狗。他的名字是Max。他是棕色和白色的。Max两岁了。他喜欢在公园跑。每天早晨我带他散步。他很友好又聪明。我回家时他摇尾巴。我给他食物和水。我非常爱我的狗。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r5\\",\\n    \\"word\\": \\"Weekend Fun\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"周末乐趣\\",\\n    \\"example\\": \\"On Saturday, I do not go to school. I help my mother clean the house. In the afternoon, I ride my bike. On Sunday, my family goes to the park. We have a picnic and fly a kite. My sister plays with her ball. We come home in the evening. Weekends are happy days for me. (周六我不上学。我帮妈妈打扫房子。下午我骑自行车。周日我们全家去公园。我们野餐并放风筝。妹妹玩球。晚上我们回家。周末对我来说是快乐的日子。)\\"\\n  },\\n  {\\n    \\"id\\": \\"r6\\",\\n    \\"word\\": \\"The Weather Today\\",\\n    \\"phonetic\\": \\"beginner\\",\\n    \\"meaning\\": \\"今天的天气\\",\\n    \\"example\\": \\"Today the weather is sunny. The sky is blue and the sun is warm. I wear a T-shirt and shorts. I go outside to play. Some birds sing in the tree. In the evening, it is cool. My father says it may rain tomorrow. I hope the sun comes again. I like good weather. (今天天气晴朗。天空蓝，太阳暖。我穿T恤和短裤。我去外面玩。一些鸟在树上唱歌。晚上变凉。爸爸说明天可能下雨。我希望太阳再来。我喜欢好天气。)\\"\\n  }\\n]", "generatedAt": "2026-07-28T02:49:17.718Z"}	2026-07-28 02:49:17.721	2026-07-28 02:49:17.721
248ecaf3-51dc-4815-87c9-81ca954c30d2	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "l1", "word": "Greeting a Friend", "example": "[Audio] Hi, Tom! How are you today? I am fine, thank you. And you? I am good. Would you like to play basketball? Sure, let me get my ball. See you later! \\n（你好，汤姆！你今天好吗？我很好，谢谢。你呢？我挺好的。你想打篮球吗？当然，我去拿我的球。一会儿见！）", "meaning": "问候朋友", "phonetic": "Beginner - 20s"}, {"id": "l2", "word": "Ordering Coffee", "example": "[Audio] Good morning. What would you like? A small coffee, please. With milk? Yes, with a little milk. That is three dollars. Here you are. Thank you. Have a nice day! \\n（早上好。您想要点什么？一小杯咖啡，谢谢。加奶吗？是的，加一点奶。三美元。给您。谢谢。祝您一天愉快！）", "meaning": "点咖啡", "phonetic": "Beginner - 25s"}, {"id": "l3", "word": "At the Library", "example": "[Audio] Excuse me, where are the books about animals? They are on the second floor. Thank you. Can I borrow this book? Yes, for two weeks. Great! \\n（打扰一下，关于动物的书在哪里？它们在二楼。谢谢。我可以借这本书吗？可以，借两周。太好了！）", "meaning": "在图书馆", "phonetic": "Beginner - 20s"}, {"id": "l4", "word": "Weather Today", "example": "[Audio] Look outside. It is sunny and warm. Let us go for a walk. Good idea. We can go to the park. Yes, bring some water. \\n（看外面。天气晴朗又暖和。我们去散步吧。好主意。我们可以去公园。对，带点水。）", "meaning": "今日天气", "phonetic": "Beginner - 15s"}, {"id": "l5", "word": "Bus Announcement", "example": "[Audio] Attention, passengers. The bus to the airport leaves from Gate 3. Please have your ticket ready. The next bus is in ten minutes. Thank you. \\n（乘客请注意。前往机场的巴士从3号门出发。请准备好您的车票。下一班巴士十分钟后出发。谢谢。）", "meaning": "公交广播", "phonetic": "Beginner - 20s"}, {"id": "l6", "word": "Shopping for Fruit", "example": "[Audio] How much are the apples? They are two dollars a kilo. I want one kilo, please. And some bananas too. Sure, that is four dollars total. Here you go. \\n（苹果多少钱？两美元一公斤。我要一公斤。还要些香蕉。好的，一共四美元。给您。）", "meaning": "买水果", "phonetic": "Beginner - 25s"}, {"id": "l7", "word": "My Daily Routine", "example": "[Audio] I wake up at seven. I eat breakfast at seven thirty. Then I go to school by bus. I have classes from nine to three. After school, I do my homework. I eat dinner at six. Then I watch TV and go to bed at nine. \\n（我七点起床。七点半吃早餐。然后坐公交去学校。我九点到三点上课。放学后，我做作业。六点吃晚饭。然后看电视，九点睡觉。）", "meaning": "我的日常", "phonetic": "Beginner - 30s"}, {"id": "l8", "word": "Lost Key", "example": "[Audio] Mom, I cannot find my key. Did you check your bag? Yes, it is not there. Look on the table. Oh, here it is! Thank you, Mom. Let us go now. \\n（妈妈，我找不到我的钥匙了。你检查书包了吗？检查了，不在那里。看看桌上。哦，在这里！谢谢妈妈。我们走吧。）", "meaning": "丢钥匙", "phonetic": "Beginner - 20s"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-28T02:49:19.120Z"}	2026-07-28 02:49:19.123	2026-07-28 02:49:19.123
56e3d64b-a50e-46d7-8117-f8c24e65c2be	lesson	AI_GENERATED	zh	ja	zh	beginner	1.0.0	draft	0	0	{"input": "请为en语言生成8条grammar学习内容，难度为beginner。", "scene": "lesson_generate", "output": "[\\n  {\\n    \\"id\\": \\"g1\\",\\n    \\"word\\": \\"Be verb (am/is/are)\\",\\n    \\"phonetic\\": \\"Subject + am/is/are + Noun/Adjective\\",\\n    \\"meaning\\": \\"be动词用于连接主语和名词或形容词，表示状态或身份。I用am，单数用is，复数和you用are。\\",\\n    \\"example\\": \\"I am a student. 我是一名学生。\\"\\n  },\\n  {\\n    \\"id\\": \\"g2\\",\\n    \\"word\\": \\"Present Simple (Positive)\\",\\n    \\"phonetic\\": \\"Subject + Verb(base form) + (s/es for he/she/it)\\",\\n    \\"meaning\\": \\"一般现在时肯定句表示习惯或事实。第三人称单数动词加s或es。\\",\\n    \\"example\\": \\"She eats an apple every day. 她每天吃一个苹果。\\"\\n  },\\n  {\\n    \\"id\\": \\"g3\\",\\n    \\"word\\": \\"Present Simple (Negative)\\",\\n    \\"phonetic\\": \\"Subject + do/does not + Verb(base form)\\",\\n    \\"meaning\\": \\"一般现在时否定句用do not或does not，第三人称单数用does not，动词还原。\\",\\n    \\"example\\": \\"He does not like coffee. 他不喜欢咖啡。\\"\\n  },\\n  {\\n    \\"id\\": \\"g4\\",\\n    \\"word\\": \\"Present Simple (Question)\\",\\n    \\"phonetic\\": \\"Do/Does + Subject + Verb(base form)?\\",\\n    \\"meaning\\": \\"一般现在时疑问句将do或does置于句首，第三人称单数用does，动词用原形。\\",\\n    \\"example\\": \\"Do you play tennis? 你打网球吗？\\"\\n  },\\n  {\\n    \\"id\\": \\"g5\\",\\n    \\"word\\": \\"Articles (a/an/the)\\",\\n    \\"phonetic\\": \\"a + consonant sound; an + vowel sound; the + specific\\",\\n    \\"meaning\\": \\"不定冠词a/an表示泛指，定冠词the表示特指。\\",\\n    \\"example\\": \\"I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。\\"\\n  },\\n  {\\n    \\"id\\": \\"g6\\",\\n    \\"word\\": \\"Plural Nouns\\",\\n    \\"phonetic\\": \\"Noun + s/es\\",\\n    \\"meaning\\": \\"名词复数通常在词尾加s，以s/x/ch/sh结尾加es。\\",\\n    \\"example\\": \\"There are two cats on the desk. 桌上有两只猫。\\"\\n  },\\n  {\\n    \\"id\\": \\"g7\\",\\n    \\"word\\": \\"Adjectives (Order/Basic)\\",\\n    \\"phonetic\\": \\"Subject + be + Adjective\\",\\n    \\"meaning\\": \\"形容词用于描述名词或主语的状态，放在be动词后或名词前。\\",\\n    \\"example\\": \\"The small dog is happy. 小狗很开心。\\"\\n  },\\n  {\\n    \\"id\\": \\"g8\\",\\n    \\"word\\": \\"Possessive Adjectives\\",\\n    \\"phonetic\\": \\"Possessive Adj. + Noun\\",\\n    \\"meaning\\": \\"物主形容词表示所属关系，如my, your, his, her, our, their。\\",\\n    \\"example\\": \\"This is my book. 这是我的书。\\"\\n  }\\n]", "generatedAt": "2026-07-28T02:49:21.220Z"}	2026-07-28 02:49:21.222	2026-07-28 02:49:21.222
a79fcf0f-07ac-4ae2-913e-cea4fe4adfb5	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:52:53.526Z"}	2026-07-26 10:52:53.529	2026-07-26 10:52:53.529
48c4337c-45b2-4b97-8672-f800adfe996f	listening	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "listening", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:52:53.722Z"}	2026-07-26 10:52:53.724	2026-07-26 10:52:53.724
db7248ed-5d0c-44a2-a0de-a9506c8c73a5	grammar	AI_GENERATED	en	en	zh-CN	beginner	1.0.0	published	70	0	{"type": "grammar", "items": [{"id": "g1", "word": "Be Verb (am/is/are)", "example": "She is a teacher. 她是一名老师。", "meaning": "用be动词表示主语的身份或状态，I用am，单数用is，复数和you用are。", "phonetic": "Subject + am/is/are + Noun/Adjective"}, {"id": "g2", "word": "Present Simple (Positive)", "example": "He eats an apple every day. 他每天吃一个苹果。", "meaning": "一般现在时肯定句，表示习惯或事实；第三人称单数动词加s或es。", "phonetic": "Subject + Verb(base form) + (s/es for he/she/it)"}, {"id": "g3", "word": "Present Simple (Negative)", "example": "They do not like coffee. 他们不喜欢咖啡。", "meaning": "一般现在时否定句，借助do/does not，第三人称单数用does not，动词还原。", "phonetic": "Subject + do/does not + Verb(base form)"}, {"id": "g4", "word": "Present Simple (Question)", "example": "Does she play tennis? 她打网球吗？", "meaning": "一般现在时疑问句，句首用Do或Does（第三人称单数），后接主语和动词原形。", "phonetic": "Do/Does + Subject + Verb(base form)?"}, {"id": "g5", "word": "Articles (a/an/the)", "example": "I see an orange and the orange is sweet. 我看到一个橘子，这个橘子是甜的。", "meaning": "不定冠词a/an表泛指，定冠词the表特指。", "phonetic": "a + consonant sound; an + vowel sound; the + specific noun"}, {"id": "g6", "word": "Plural Nouns", "example": "There are two cats and three boxes. 有两只猫和三个盒子。", "meaning": "名词复数一般在词尾加s或es，部分名词不规则变化。", "phonetic": "Noun + s/es (or irregular forms)"}, {"id": "g7", "word": "Possessive Adjectives", "example": "This is my book and their pens. 这是我的书和他们们的笔。", "meaning": "形容词性物主代词，表示所属关系，后须接名词。", "phonetic": "my/your/his/her/its/our/their + Noun"}, {"id": "g8", "word": "Prepositions of Place", "example": "The cup is on the table. 杯子在桌子上。", "meaning": "表示位置的介词，in在…里，on在…上，under在…下。", "phonetic": "Subject + be + prep (in/on/under) + Place"}], "level": "beginner", "language": "en", "generatedAt": "2026-07-26T10:53:09.604Z"}	2026-07-26 10:53:09.608	2026-07-26 10:53:09.608
\.


--
-- Data for Name: LearningEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningEvent" (id, "userId", "workspaceId", "planId", "eventType", "languageCode", data, duration, "createdAt") FROM stdin;
\.


--
-- Data for Name: LearningGoal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningGoal" (id, "userId", "workspaceId", "goalType", "targetLanguage", "targetLevel", description, status, "deadlineAt", "completedAt", "createdAt", "updatedAt") FROM stdin;
fe6fa760-c65a-49c9-a0b4-dbff18db5469	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	daily_life	ja	N4	能看懂日剧日常对话	archived	\N	\N	2026-07-25 16:25:27.401	2026-07-26 00:39:16.974
c00f049d-ac20-403c-adf3-6836439df90a	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	daily_life	ja	N4	能看懂日剧日常对话	active	\N	\N	2026-07-26 00:39:16.976	2026-07-26 00:39:16.976
\.


--
-- Data for Name: LearningMemory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningMemory" (id, "userId", "sourceEventId", "memoryType", content, importance, visibility, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LearningPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningPlan" (id, "goalId", "userId", "planType", schedule, content, status, "createdAt", "updatedAt") FROM stdin;
6aad41b3-4d8d-460f-a145-4e309ac3b3ab	fe6fa760-c65a-49c9-a0b4-dbff18db5469	df440e3c-56cc-4455-8426-9a279bc58f6c	daily	{"days": 30, "startDate": "2026-07-25"}	{"generatedDays": 30, "focusDescription": "重点提升听力和口语，希望能无字幕看日剧"}	active	2026-07-25 16:26:00.589	2026-07-25 16:26:00.589
deb72364-1649-4071-a06f-1e78db74ccbf	c00f049d-ac20-403c-adf3-6836439df90a	df440e3c-56cc-4455-8426-9a279bc58f6c	daily	{"days": 30, "startDate": "2026-07-25"}	{"generatedDays": 30, "focusDescription": "重点提升听力和口语，希望能无字幕看日剧"}	active	2026-07-26 00:39:49.986	2026-07-26 00:39:49.986
\.


--
-- Data for Name: LearningProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningProfile" (id, "userId", "lastEventId", "overallLevel", strengths, weaknesses, "learningStyle", data, "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: LearningProgress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LearningProgress" (id, "userId", language, level, "totalWords", "totalLessons", "totalTime", "currentLessonId", "currentWordIndex", "currentStreak", "longestStreak", "lastStudyDate", "updatedAt", "syncVersion", "isDirty") FROM stdin;
d43c95af-3553-48da-a7af-8b47e3562968	df440e3c-56cc-4455-8426-9a279bc58f6c	ja-JP	A1	0	0	0	\N	0	0	0	\N	2026-07-25 07:51:59.135	0	f
4e30736f-bae3-4699-99b2-2c8375863114	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	N5	0	0	0	\N	0	0	0	\N	2026-07-26 00:39:16.561	0	f
\.


--
-- Data for Name: LoginLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LoginLog" (id, "adminId", account, ip, "userAgent", "createdAt") FROM stdin;
b572d84c-c02b-4031-b725-8c01f524ef88	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-28 14:59:46.233
4dfdf0a4-8dd1-4c1b-bf9c-6929685b1d31	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 01:03:38.868
923ad300-f866-4dd8-8f43-d8d822ba439e	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 01:04:38.423
88f380d7-dba1-484e-9cba-74b0662d74ea	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-29 02:03:42.249
b3ece6ab-64a3-4d9c-82c6-297154716e5f	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 02:15:50.345
8562a5aa-eac1-4359-8104-6a0901bd162c	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 02:16:21.142
0ef98ef6-bb18-435e-9d71-f6620b311223	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 02:25:13.258
6d7a36da-8463-4468-bf06-15ee441c14f7	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 02:55:44.022
6c4f46f6-155d-465e-97bd-68c05051c503	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 02:59:11.179
84d05637-8cc6-4996-8527-97ffd0eb65ae	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:01:50.975
e9af8bf6-c9f2-4969-96a0-70d71def86d6	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:34:59.433
291597e6-3876-41ed-a380-4ecc26aa30c3	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:35:09.96
d59d1862-bf7b-4e66-9851-c95fccdfb9c6	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:35:57.501
e973ddce-831f-4a6b-a3ad-3f34e6e09a69	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:37:22.405
97dba4be-a037-4cc5-93db-d8c0313d30b8	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 03:40:31.865
0f677d8c-a1a2-46de-b411-47abe41d583a	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 09:37:53.598
46cf1b17-7a15-4b3d-ac71-0675032395b9	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 09:38:04.728
67b3faeb-62f5-45f9-9728-2cf6d310fa2b	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:00:59.384
a41cec34-f81d-4ff6-9ce8-abed9a729e9e	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:05:41.19
68351c84-e4c6-4e91-87b1-f26a9da3c998	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:06:46.334
69b4ef14-44c4-4d55-8c97-cf8a1378138a	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:07:27.173
9f56c3da-e081-4ad8-9923-3e44bd8e0bc7	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:08:11.698
7c159576-587f-4398-893c-9a47e9b60e52	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:08:39.184
802158d2-1a22-4cad-b2a1-c6a5255655b6	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:09:18.311
73ed4f03-3882-4eb5-b084-393160388ad3	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:10:05.475
9c7bf0a9-9ba7-4808-a736-232ff80d01ce	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:11:42.515
b6b94541-e674-429f-b9f2-c155c9e91c22	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 10:12:39.934
d8d08fe8-8fda-4ff7-b4ca-9402875baac8	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::ffff:127.0.0.1	curl/8.4.0	2026-07-29 10:46:26.295
33404829-37ad-4067-8d1b-64987189e6cb	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::ffff:127.0.0.1	curl/8.4.0	2026-07-29 10:46:35.671
76845158-4efd-4dc3-8cb1-447b012d01d9	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::ffff:127.0.0.1	curl/8.4.0	2026-07-29 10:47:06.09
33037a11-249a-4136-ac88-f5d4550afe7d	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::ffff:127.0.0.1	curl/8.4.0	2026-07-29 10:47:22.566
444b0713-f182-4515-8d4f-72b2f7469401	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:03:51.563
81ed5997-95d2-4258-9d2b-843f2f02a2f0	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:04:15.437
d9877910-468b-4cb8-8bbc-145a07d2e333	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:04:58.968
170d5124-65f4-4574-9073-b73e815621fd	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:05:28.512
073ef4ad-6f29-48ba-b9dc-1acfc810760c	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:06:03.741
78f24ca7-d7d4-4a4a-b511-b3ac1c3949f2	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:06:29.497
e5d8d29e-3261-4a00-815e-547ae95a5735	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:06:51.22
5e37b20e-915c-4813-95fb-9412fcf97f0a	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:07:28.108
b1b28862-83bb-4682-92a7-ccccf0963bea	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:09:09.142
746b1ded-6b22-46ce-93fb-03fe150b28dc	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:09:46.55
92828f61-882d-4489-b647-f3ab5ceb7ab2	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 11:10:20.123
35d12fae-b3de-4285-bb01-309ce81108d5	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 13:52:40.4
0bf91b31-1f6f-4549-91bd-1ec61ce75f6e	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 13:52:41.05
3bd6def6-35fc-4ef3-9794-f65ba7cf6e56	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 13:53:41.919
7e1e0583-c44c-4b5a-aed8-ea24f17a17f2	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 13:53:42.428
e21a9345-c1ba-4eb7-97a8-d2c412381a27	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 13:54:16.594
f6ac3d97-c53a-401b-916e-4fa38c5005ff	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:05:00.575
129c53b8-02dc-45c5-8f23-146dfaacf130	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:06:02.086
0f9571c4-ffbe-4690-8c93-11b98c2c9341	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:12:42.416
a7afca1f-f38f-4cae-afba-d97213c8d34f	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:14:38.958
e8a8b397-e82a-442d-9009-27f7300939f8	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:15:51.852
f67dc0f1-7cc5-4080-b82a-5b25b9d9badb	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:16:44.153
0d0fd41a-260d-44f5-b30b-a9285a143601	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:17:22.527
0ae42ed2-5352-49c2-bd4a-09e916410644	df440e3c-56cc-4455-8426-9a279bc58f6c	13480010005	::1	curl/8.4.0	2026-07-29 14:17:57.143
\.


--
-- Data for Name: MembershipOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipOrder" (id, "userId", "orderNo", "membershipLevel", duration, amount, currency, "paymentMethod", "paymentId", status, "paidAt", "createdAt", "updatedAt", abnormal, "abnormalMarkedAt", "abnormalMarkedBy", "abnormalNote") FROM stdin;
\.


--
-- Data for Name: OcrUsageLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OcrUsageLog" (id, "userId", provider, scene, "imageCount", "ocrTextLen", "estCostCny", status, "errorCode", "latencyMs", "createdAt", "updatedAt") FROM stdin;
ab2c5d28-4d60-45a8-b5b2-453aad466c41	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	ERR_BAD_REQUEST	237	2026-07-26 11:14:09.184	2026-07-26 11:14:09.426
5c925584-31cb-4fb9-bcc0-946c54127eae	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	OCR_PROVIDER_ERROR	3146	2026-07-26 11:18:03.377	2026-07-26 11:18:06.526
6078ac60-4b29-43b6-bcc3-dbf067c54f2c	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	23	0.0100	success	\N	5039	2026-07-26 11:21:51.543	2026-07-26 11:21:56.588
f35db908-76c9-4c96-9475-8e915bc4baf3	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	23	0.0100	success	\N	1963	2026-07-26 11:22:36.751	2026-07-26 11:22:38.715
feb54a04-c03e-4e07-96da-16ca284e5eeb	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	NO_TEXT	1655	2026-07-27 02:20:58.372	2026-07-27 02:21:00.029
3d53131e-42e1-453f-9b69-73a2fa50915b	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	6	0.0100	success	\N	5052	2026-07-27 02:23:11.767	2026-07-27 02:23:16.821
594abafc-6d5d-4196-9fd5-08c16bcade88	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	NO_TEXT	1672	2026-07-27 02:25:28.591	2026-07-27 02:25:30.264
8e612741-a12b-4349-8702-054a3bd41a41	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	NO_TEXT	2304	2026-07-27 04:29:43.441	2026-07-27 04:29:45.747
6fd27853-0ace-4dc0-b503-2abef5e222af	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	OCR_PROVIDER_ERROR	837	2026-07-27 10:52:59.735	2026-07-27 10:53:00.574
5248d948-304e-45a0-bda5-9adc3dd480f1	df440e3c-56cc-4455-8426-9a279bc58f6c	hunyuan-vision	photo_translate	1	0	0.0000	failed	OCR_PROVIDER_ERROR	764	2026-07-27 10:54:27.666	2026-07-27 10:54:28.432
\.


--
-- Data for Name: OrgClass; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrgClass" (id, "organizationId", name, description, "teacherId", status, "studentCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrgClassStudent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrgClassStudent" (id, "classId", "userId", status, "joinedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Organization" (id, name, description, "logoUrl", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OrganizationMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrganizationMember" (id, "organizationId", "userId", role, status, "joinedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: QuestionBlueprint; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QuestionBlueprint" (id, "contentId", question, answer, options, difficulty, "createdAt") FROM stdin;
c1001adb-5d1f-4257-b875-6dc1f955d234	1b664e70-4c02-4ace-ae87-305c33e55642	关于 "Self Introduction" 的主要内容是？	{"title":"Self Introduction","questions":[{"answer":"Tanaka","question":"What is the speaker's name?"},{"answer":"Tokyo","question":"Where does the speaker live?"}],"transcript":"はじめまして。私は田中です。日本人です。東	\N	1	2026-07-24 03:56:51.977
49c68b34-1dbb-4a80-8755-eaff3ff1d50a	b722f4d4-7357-4257-be1f-9479fad441c2	关于 "At the Restaurant" 的主要内容是？	{"title":"At the Restaurant","questions":[{"answer":"Two","question":"How many people are dining?"},{"answer":"Ramen","question":"What did the customer order?"}],"transcript":"いらっしゃいませ。何名様ですか？二人です。こちら	\N	1	2026-07-24 03:56:51.979
\.


--
-- Data for Name: RateLimitLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RateLimitLog" (id, identifier, action, count, "windowStart") FROM stdin;
8cb6f39e-90a2-4907-a4e1-4be2a51cf4fd	13800138004	password_login	1	2026-07-20 04:45:00
d9b2946e-07b3-49c6-a023-ad96aa8ee0f8	+8613480010005	password_login	5	2026-07-21 14:00:00
112b74c6-83b1-41bd-88a4-7cc8703d1db1	13800138004	sms_send	6	2026-07-20 05:00:00
d98a68c8-8170-41a3-a337-0a4465601de4	13480010005	password_login	1	2026-07-21 14:30:00
32fdabac-2477-49f9-9abc-9b0cd744f3c0	wuzhimin666@163.com	password_login	1	2026-07-21 14:30:00
96f6293f-0a2a-4373-8c85-81827e72ec3c	+8613480010005	password_login	2	2026-07-21 14:30:00
0c272451-0a5b-4ea8-9132-50e7d957c7b4	test@example.com	email_send	3	2026-07-20 05:00:00
ceb623e0-2db5-4c53-8ed7-4b87cc7f9e98	13800138004	password_login	4	2026-07-20 05:00:00
639086ea-366a-4251-9f5b-c41048eae589	+8613900139001	sms_send	1	2026-07-21 14:30:00
9f9a4af0-b2eb-4a82-9726-99478c947593	13800138005	sms_send	4	2026-07-20 05:00:00
13b69492-5997-42ac-ad55-e94fb4e776b9	13800138005	sms_send	1	2026-07-20 05:15:00
7ef2fd30-239f-49db-a306-4cbdcad524cb	wuzhimin666@163.com	email_send	1	2026-07-21 14:30:00
07bb51e0-2c55-4748-bf59-33d21741b1f8	13800138000	sms_send	3	2026-07-20 06:00:00
db6bd6d2-a0ec-4ddb-9035-5afdc017a9a9	test@yandao.vip	email_send	2	2026-07-20 06:00:00
65c1af5f-d6f8-4ed2-bca3-689b30358caf	+8613800138000	sms_send	1	2026-07-20 07:15:00
4447acc4-ea34-415c-a5f3-0ec5e962e09a	test@yandao.vip	email_send	2	2026-07-20 07:15:00
753ae2cb-e5c4-4c05-bad5-199101a830f5	+8613800138001	password_login	1	2026-07-20 14:30:00
00f08e7c-8f23-494b-9b51-829c66cab97b	audit_test@ailos.internal	password_login	1	2026-07-20 14:30:00
c8acc11d-e455-43e2-a313-e31e6fe4ce38	13800138001	password_login	1	2026-07-20 14:30:00
be6cfd1e-426c-435e-90e4-ab8cf1d4ab17	+8613800138001	password_login	1	2026-07-20 15:30:00
19a1c702-6a52-41f2-b91f-40c6907f3f37	+8613800138001	password_login	2	2026-07-20 15:45:00
fcb7da41-0079-48d3-ae67-208be7d7b5a1	+8613480010005	password_login	1	2026-07-21 15:30:00
83d1386a-8f46-490e-9ea4-63b161c0d488	+8613800138001	sms_login	3	2026-07-20 23:30:00
baea78b2-3b21-4c58-b7e7-582e898e0db9	+8613800138001	password_login	1	2026-07-21 00:00:00
cd47b7ad-0929-4191-bf2e-65c239266bc7	test@test.com	password_login	1	2026-07-21 00:00:00
ec5e9c03-8f88-4e76-9855-850d45cf1d5f	wuzhimin666@163.com	email_send	1	2026-07-21 04:15:00
c5fcb277-a3c8-445b-8eb2-21227bc9577e	wuzhimin666@163.com	email_send	1	2026-07-21 09:15:00
47794de9-b102-45a4-ab1a-1f78ffbb640d	13800138001	sms_send	1	2026-07-21 10:00:00
465d83c1-50fd-4ba7-992e-d64b89e280b5	test@example.com	email_send	1	2026-07-21 10:00:00
3dcb6158-6c4f-4b9c-a7cc-5e6a75252212	13800138001	sms_send	1	2026-07-21 10:15:00
8bed5258-1db4-451e-94a3-c0ec4c9a3d81	test_1784629166704@example.com	email_send	1	2026-07-21 10:15:00
cb0d0b70-b94f-44eb-b6ca-da6cd2153f3f	13800138001	password_login	1	2026-07-21 10:15:00
7efb4cab-c24b-477c-b742-3e42062c8447	+8613800138001	sms_send	1	2026-07-21 11:45:00
326019fb-80fb-4e30-a53b-cd53215a09f7	wuzhimin666@163.com	email_send	1	2026-07-21 12:00:00
5fbb049c-7f58-499e-a742-35164d133ce8	13900139001	sms_send	1	2026-07-21 12:00:00
932e864c-1175-4510-9da7-588c7d07be36	test@yandao.vip	email_send	1	2026-07-21 12:00:00
2a46c4da-6035-43f1-9497-05158f47f12a	13480010005	sms_send	2	2026-07-21 12:15:00
5d8fc24e-31ec-4a3e-9610-83e32c058048	wuzhimin666@163.com	email_send	2	2026-07-21 12:15:00
7be8ca09-4728-48d4-b6e4-db2b1baf70f0	13480010005	sms_send	1	2026-07-21 12:45:00
efd8f710-6f60-4be0-be9e-4d61c9f00531	wuzhimin666@163.com	email_send	1	2026-07-21 12:45:00
b42ef298-ab6e-4b2a-958b-680e79f218ab	13900139001	sms_send	1	2026-07-21 13:00:00
71717f3a-ca4a-4b47-b2c8-c170edf51c35	+8613480010005	password_login	1	2026-07-21 22:45:00
c5096a75-0899-48ad-ab0b-a9d82f8afe46	wuzhimin666@163.com	password_login	1	2026-07-21 22:45:00
de52a0c3-1b01-4184-9232-5c753e67f9ad	13480010005	sms_send	4	2026-07-21 13:00:00
d62037cd-a191-4f7c-ae70-43010ca95a27	wuzhimin666@163.com	email_send	2	2026-07-21 13:00:00
8895af3b-6201-4307-8f2f-71ff9af0526d	wuzhimin666@163.com	email_send	1	2026-07-21 13:15:00
0d39da68-f06a-41db-8eeb-57f3097bdb27	13480010005	sms_send	1	2026-07-21 13:15:00
b8f7ba5f-9e71-41d9-b690-c9ecba3a475a	13480010005	password_login	2	2026-07-21 13:15:00
68f2cffa-9696-4f03-bd42-b8d8226c135d	+8613900139001	sms_send	1	2026-07-21 13:45:00
79f71b09-111b-4db4-a29a-b66eb8980e29	+8613480010005	password_login	2	2026-07-21 13:45:00
ef2edc61-c0db-4a1c-b29e-7583cdde2318	+8613480010005	password_login	2	2026-07-21 23:00:00
eaad14ea-c395-467c-bea8-4ec26b463c12	13480010005	password_login	1	2026-07-21 23:00:00
05ef046a-47c6-4b81-8916-a6beef364fd0	wuzhimin666@163.com	password_login	2	2026-07-21 23:00:00
d142b61e-6df8-471d-9381-e3213d98321c	13900000001	password_login	1	2026-07-22 00:00:00
64327269-06ce-4f46-9651-c1778ae31a0c	13900000009	password_login	1	2026-07-22 00:00:00
fc1bef4f-15e3-4360-ae1e-0cd6bd902836	+8613480010005	password_login	1	2026-07-22 02:30:00
78d39d3c-acab-434c-a5a4-9ed0da0d412e	13480010005	password_login	2	2026-07-22 02:45:00
f226e351-54f5-4184-8fe5-0334a8d6b157	+8613480010005	password_login	1	2026-07-22 03:15:00
69eb7bec-c4d3-42a5-b3c3-55c9382b91dd	13480010005	password_login	2	2026-07-22 04:15:00
aa7e8711-355d-4ef2-a21a-55ba579ee18f	+8613480010005	password_login	1	2026-07-22 10:00:00
187511fe-64a0-4ebe-88b7-9ef48380a62c	13480010005	password_login	1	2026-07-22 10:00:00
a8c37aaa-a5f5-433e-8437-60c893b18c8a	+8613480010005	password_login	1	2026-07-22 10:45:00
9d546671-02b7-460f-82eb-93ddd05c949a	13480010005	password_login	1	2026-07-22 10:45:00
31dd657f-5b78-4854-952c-5cc0bbec1c49	13480010005	password_login	1	2026-07-22 11:30:00
a8663149-66e9-440d-a26c-c7cde2171f38	+8613480010005	password_login	1	2026-07-22 12:15:00
1e528a4d-05c9-4d21-840f-dcc5b85b0435	13480010005	password_login	1	2026-07-22 12:15:00
27e5869b-944e-443d-a825-24439b4d26f9	13480010005	password_login	1	2026-07-22 13:15:00
fda31e5d-dc6b-4445-850c-3da294457b48	+8613480010005	password_login	3	2026-07-22 13:45:00
eacf9703-8d41-495a-a205-6dd806d5373e	13800138000	sms_send	1	2026-07-23 09:30:00
f16e2538-003b-4e77-8583-6e1f59faa166	test	password_login	1	2026-07-23 09:30:00
dc43d90b-8311-4b92-a07e-052eee67d9db	13800138000	sms_send	1	2026-07-23 09:45:00
8c19b7a8-c2d8-4b84-8876-d00f6753b757	test	password_login	1	2026-07-23 09:45:00
6bfb0b1a-ea87-43f7-ac18-f6dde87571de	13800138000	sms_send	1	2026-07-24 01:30:00
\.


--
-- Data for Name: ReviewQueue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReviewQueue" (id, "userId", "contentId", "contentType", "interval", "easeFactor", repetitions, "dueDate", "lastReview", "createdAt", "updatedAt") FROM stdin;
3064865a-1d3d-41d7-b0ae-da0f47d63996	df440e3c-56cc-4455-8426-9a279bc58f6c	443d96b8-3152-4540-a2fd-1bb58fc9c5ba	word	0	2.5	0	2026-07-26 11:21:58.459	\N	2026-07-26 11:21:58.459	2026-07-26 11:21:58.459
8804322a-477f-4d68-a670-a46d3a318962	df440e3c-56cc-4455-8426-9a279bc58f6c	9560e22d-22b2-4ad1-87f1-01301a8add03	word	0	2.5	0	2026-07-26 11:22:39.137	\N	2026-07-26 11:22:39.137	2026-07-26 11:22:39.137
c27d0327-f1cf-4890-b57b-fdeaafc36b44	df440e3c-56cc-4455-8426-9a279bc58f6c	538f43d3-bba7-447f-9622-9464edb92ca5	word	0	2.5	0	2026-07-27 02:49:33.707	\N	2026-07-27 02:49:33.707	2026-07-27 02:49:33.707
efdb25bc-ea18-4b01-a415-b2d1094fd771	df440e3c-56cc-4455-8426-9a279bc58f6c	8831697c-8911-4570-b823-5424ed57e627	word	0	2.5	0	2026-07-27 04:26:38.226	\N	2026-07-27 04:26:38.226	2026-07-27 04:26:38.226
fe4b597f-02ce-4bf5-8549-914093af6857	df440e3c-56cc-4455-8426-9a279bc58f6c	d42814f4-5994-44b4-a420-2624c712d3cd	word	0	2.5	0	2026-07-27 04:26:38.238	\N	2026-07-27 04:26:38.238	2026-07-27 04:26:38.238
fb6b8441-1d2a-4dd0-9260-7577552bad4d	df440e3c-56cc-4455-8426-9a279bc58f6c	6840b159-a486-42c3-a106-e28136a8ea0a	word	0	2.5	0	2026-07-27 11:23:23.695	\N	2026-07-27 11:23:23.695	2026-07-27 11:23:23.695
\.


--
-- Data for Name: RewardLedger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RewardLedger" (id, "userId", type, amount, balance, "refId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", token, "refreshToken", "deviceInfo", "ipAddress", "userAgent", "expiresAt", "lastUsedAt", "createdAt") FROM stdin;
00edf402-9f01-4f64-8f47-d1fed442f001	478c5039-1567-4117-afc6-2fc27396731f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwiaWF0IjoxNzg0NTA3MjI4LCJleHAiOjE3ODUxMTIwMjh9.G_wiYPSwf1WWOAOEMDH0XUcsn3wVLN-hacu2wmzMeNs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDcyMjgsImV4cCI6MTc4NzA5OTIyOH0.uw601_ItaNGLuc5WX401LcO4sfnUsE5RI-11OqeVzxo	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-27 00:27:08.435	2026-07-20 00:27:08.436	2026-07-20 00:27:08.436
2b6ff8aa-5b6a-4c77-a4c6-3bed9713f78b	26fbb7c1-cf41-4dc4-851d-c84895b07002	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNmZiYjdjMS1jZjQxLTRkYzQtODUxZC1jODQ4OTViMDcwMDIiLCJ1bmlxdWVJZCI6ImJkOTgyMDJhNDMyMjM0YWU1YjYyYzUxMDZmZTcwMWJiIiwiaWF0IjoxNzg0NTA3Mjg2LCJleHAiOjE3ODUxMTIwODZ9.0p697hWF5TwguGCKcumOHZ3Ry1suuqEJ2BvG4zs0S14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNmZiYjdjMS1jZjQxLTRkYzQtODUxZC1jODQ4OTViMDcwMDIiLCJ1bmlxdWVJZCI6ImJkOTgyMDJhNDMyMjM0YWU1YjYyYzUxMDZmZTcwMWJiIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDcyODYsImV4cCI6MTc4NzA5OTI4Nn0.3jSnaYLiB7MBIQFBg3HjIJija4Htyi15a5X1ogkCvCw	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-27 00:28:06.601	2026-07-20 00:28:06.602	2026-07-20 00:28:06.602
9f2bedb5-cd3b-456b-adf1-dffdc0003052	4496260c-9f53-46a2-b249-539e5fe4c7db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwiaWF0IjoxNzg0NTA5MTA3LCJleHAiOjE3ODUxMTM5MDd9.WdDGNJeSPvPa4AWbDnqgd7cF01zoTGDIQ0QQx6S31Bo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkxMDcsImV4cCI6MTc4NzEwMTEwN30.1Te3exclkyeuydc0_wm_lkS2Tnhh1ENqur_4qGg4E-Q	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 00:58:27.8	2026-07-20 00:58:27.802	2026-07-20 00:58:27.802
eade03e6-be8e-4dd2-a2ea-c9c132e6e0e5	4496260c-9f53-46a2-b249-539e5fe4c7db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwiaWF0IjoxNzg0NTA5MTA5LCJleHAiOjE3ODUxMTM5MDl9.pLmH5xMjFydIIefsIURdtIsn4no7auA0Fu1P792uGqk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkxMDksImV4cCI6MTc4NzEwMTEwOX0.gqpedDFq4NmZ7P1SU9Wiu1wDQT8N6zTRDa8tqN4DxMI	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 00:58:29.157	2026-07-20 00:58:29.158	2026-07-20 00:58:29.158
0804642c-6b58-4043-af18-1c7b8ae55bc3	4496260c-9f53-46a2-b249-539e5fe4c7db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwiaWF0IjoxNzg0NTA5MjcyLCJleHAiOjE3ODUxMTQwNzJ9.KG2ZCNxR1CMoy5GEQPPuw0HqctEG9lbj3kHzsieTviY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NDk2MjYwYy05ZjUzLTQ2YTItYjI0OS01MzllNWZlNGM3ZGIiLCJ1bmlxdWVJZCI6IjczYmRjNzBhMTI2YzY5OTkyMmY3ZDhkZjUxNGNjOGY2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkyNzIsImV4cCI6MTc4NzEwMTI3Mn0.BCdXVMkArSDd3_EH3pB5oY0luPmvLvnVoVSPRmr_FNA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:12.25	2026-07-20 01:01:12.251	2026-07-20 01:01:12.251
8344a0b6-935e-4cfd-bbf3-4d070b388dd5	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDFiOWNhMC1hMGU1LTRmMWYtOTI5MS04YmRiYmQ5YzIzY2QiLCJ1bmlxdWVJZCI6ImEzODkwZjYzN2Y3MDNiOTcxNTJkYmYwYjZjMWUzNTVhIiwiaWF0IjoxNzg0NTA5Mjc0LCJleHAiOjE3ODUxMTQwNzR9.7w_VzgEXN3e4n6A7R2dgXWl3fyNBQpUz3xk8vkN6GAA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDFiOWNhMC1hMGU1LTRmMWYtOTI5MS04YmRiYmQ5YzIzY2QiLCJ1bmlxdWVJZCI6ImEzODkwZjYzN2Y3MDNiOTcxNTJkYmYwYjZjMWUzNTVhIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkyNzQsImV4cCI6MTc4NzEwMTI3NH0.sjkCo0fghwmSeMQh0atjJVSIIExA9UIhGDjbtzaYEwY	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:14.463	2026-07-20 01:01:14.464	2026-07-20 01:01:14.464
7495ab6b-d9fc-4196-bb11-b9c2972e3418	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDFiOWNhMC1hMGU1LTRmMWYtOTI5MS04YmRiYmQ5YzIzY2QiLCJ1bmlxdWVJZCI6ImEzODkwZjYzN2Y3MDNiOTcxNTJkYmYwYjZjMWUzNTVhIiwiaWF0IjoxNzg0NTA5Mjc2LCJleHAiOjE3ODUxMTQwNzZ9.BfM3GTk_UPoLuEYk2UvDLDElbNL5GwjLXQc_wFydbt0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDFiOWNhMC1hMGU1LTRmMWYtOTI5MS04YmRiYmQ5YzIzY2QiLCJ1bmlxdWVJZCI6ImEzODkwZjYzN2Y3MDNiOTcxNTJkYmYwYjZjMWUzNTVhIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkyNzYsImV4cCI6MTc4NzEwMTI3Nn0.mAgRap3ISu8j7alRh6CnEZuMNLCoaPwA7FJJWhMLawc	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:16.247	2026-07-20 01:01:16.248	2026-07-20 01:01:16.248
8aae0b88-6dea-48b4-80ec-75ef0bf6acfa	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTA5Mjc5LCJleHAiOjE3ODUxMTQwNzl9.rhhJIoxAaf-4ANOt40TPBVT7iN0Vg-r7z88i1D__PNE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkyNzksImV4cCI6MTc4NzEwMTI3OX0.HkjqNR5cgpKEDRfz73vh4VPjji0gGUVlFhdR-UnLNjE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:19.751	2026-07-20 01:01:19.751	2026-07-20 01:01:19.751
01ccda4a-3c39-49c2-90ef-ca1fa1b558ce	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTA5MjgxLCJleHAiOjE3ODUxMTQwODF9.wk_1DfSLc926Ncs23M1n4v_4oP175l8FHF_7uqi6PfU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkyODEsImV4cCI6MTc4NzEwMTI4MX0.sS4JjsbXGfFZoqTWRV-zacBpLd-HOMrdUWv4kNrMumk	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:21.527	2026-07-20 01:01:21.528	2026-07-20 01:01:21.528
49661ba2-d400-4d41-b6da-d907b5520489	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTA5MzE5LCJleHAiOjE3ODUxMTQxMTl9.Mta0p4vlZ6uHKi8QLjlSYwEkrIKQdjYYSVdz-Uxxzac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDkzMTksImV4cCI6MTc4NzEwMTMxOX0.rs1s1GB3jPpKRlib2PvfDFysOyQWDJ_SnALb1lS7SU4	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:01:59.401	2026-07-20 01:01:59.402	2026-07-20 01:01:59.402
a4397907-e1ab-4031-a7f8-4df18bf7ba0f	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTA5NDYyLCJleHAiOjE3ODUxMTQyNjJ9.wS4ejFm9euV_2kZwWinY02FsGCX_Jb8cVJWsSnn11CE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDk0NjIsImV4cCI6MTc4NzEwMTQ2Mn0.G1JRim2BQTskCuSCHKsUnwa3b1YRF4TDQj_3rXwt7ZE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:04:22.747	2026-07-20 01:04:22.749	2026-07-20 01:04:22.749
691b33e7-9d64-4275-bf0a-aa81fa98a086	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTA5ODAxLCJleHAiOjE3ODUxMTQ2MDF9.hbbDTjbzbnlJuwVESXt4mME00YfixEPCadq7_IxRhvY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MDk4MDEsImV4cCI6MTc4NzEwMTgwMX0.vveXHxH9jf4uZWfR0dB3H4pl3Dd5YI4XgVW7Eh74If8	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 01:10:01.145	2026-07-20 01:10:01.146	2026-07-20 01:10:01.146
439acb14-0015-46ca-9d2b-40118315399d	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTEzNTcxLCJleHAiOjE3ODUxMTgzNzF9.u6oryQ9RHu7Wwou6NmAvYMKmJ-mYM1ud4sptG-QzC4M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTM1NzEsImV4cCI6MTc4NzEwNTU3MX0.cUMj7cFIYzFJd2m_K_5RH3KD_Y7wGmr8fCbTwTOhcZ4	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 02:12:51.27	2026-07-20 02:12:51.271	2026-07-20 02:12:51.271
9b6b6039-134b-4975-bc9d-799350ad35a6	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE2Mzg1LCJleHAiOjE3ODUxMjExODV9.8N65I0776EbCl9vfwTFgjsbHS3OP3vzaBnSjCKe3Ip0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTYzODUsImV4cCI6MTc4NzEwODM4NX0.VM33Ks3Qr5PcQ7MUaDG-h4w8ikHjhwKx5IIidunUKmk	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 02:59:45.93	2026-07-20 02:59:45.931	2026-07-20 02:59:45.931
bd8b3504-c9a9-4bf9-af7c-4b5663743d73	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE3MDQ4LCJleHAiOjE3ODUxMjE4NDh9.lZG83iUfjAFli_42MdJ-lQQlY_LZtNsXm2MMCzyfSFY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTcwNDgsImV4cCI6MTc4NzEwOTA0OH0.SASaxULH5JiCtI2oUk14KE8tnCSaHbWNnQm0jUQj334	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:10:48.107	2026-07-20 03:10:48.108	2026-07-20 03:10:48.108
59bd2ae6-9458-4bda-af22-6302ac2263c4	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE3MTU1LCJleHAiOjE3ODUxMjE5NTV9.X9r83LyfZs9ACmBd1lwk1N7JC5meEu1c1swHZ-eiGp4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTcxNTUsImV4cCI6MTc4NzEwOTE1NX0.IPu3pSiA7QcdCD2UP1uZM6k8ujwZJXbiNAVij7bu-ms	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:12:35.844	2026-07-20 03:12:35.845	2026-07-20 03:12:35.845
a7853566-aa65-4dcc-8077-b0d1fd569561	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE3MzI1LCJleHAiOjE3ODUxMjIxMjV9.P4C5WLukEE-SOYiwzS7udV3lBZNp-cmytc0f49qN8jY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTczMjUsImV4cCI6MTc4NzEwOTMyNX0.BepXHWCnr9B2wNCO_TX3az1SqOgdPS1cHiiSzAj6shE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:15:25.831	2026-07-20 03:15:25.832	2026-07-20 03:15:25.832
5c9cf3f6-3808-4711-8c19-682d60625b49	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE4MDQ2LCJleHAiOjE3ODUxMjI4NDZ9.7eQy-TOsaU2JjToDsG5HBa7uhqRLZScBeWcaAzQXGFk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTgwNDYsImV4cCI6MTc4NzExMDA0Nn0.d6cJCcW6mRZZztQIHxJsR3uwJpBNnQSjEN9LcZApvxY	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:27:26.718	2026-07-20 03:27:26.719	2026-07-20 03:27:26.719
b2d595f2-c6eb-48ea-96d2-208cc7eb7b1c	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE4NTk4LCJleHAiOjE3ODUxMjMzOTh9.J6wwKC4dqaHpo7FmtqRKtBGY4IdQhba49IOUr1-qUbU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTg1OTgsImV4cCI6MTc4NzExMDU5OH0.DA-O9SrwoDSOX0MkVwRREEZ_Y5MovKvBa9F0suRDuxA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:36:38.351	2026-07-20 03:36:38.352	2026-07-20 03:36:38.352
e33c1e18-04d5-4113-8fad-44fb0ac4f57a	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE4NzE2LCJleHAiOjE3ODUxMjM1MTZ9.dF8o3yQHGyfYTBEmW5v5YoSgw3I6rR9SbmH-5RXMwS0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTg3MTYsImV4cCI6MTc4NzExMDcxNn0.T4LlYWinvEmkzL5XtFpuQe5H83bFhFQi5BcutdLz9vM	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:38:36.778	2026-07-20 03:38:36.779	2026-07-20 03:38:36.779
fa8466cd-b92d-4ae7-8602-813898bc86a4	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE5MTUwLCJleHAiOjE3ODUxMjM5NTB9.ii7w8KydsLPFEWzjTXvcyyr8kMa-CZ3HBxPr7Mbw8nA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTkxNTAsImV4cCI6MTc4NzExMTE1MH0.S2-nPcvIwI5jSR1j6u0z_d4xqlxLpx8Z6XG2zmjB9Do	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 03:45:50.625	2026-07-20 03:45:50.626	2026-07-20 03:45:50.626
4a64be54-68a2-48fc-a624-998b0ecc3048	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTE5NTcxLCJleHAiOjE3ODUxMjQzNzF9.CO0IXUKiS5rEQ9TupD2q28MXmmai0GN3dM5gY9QkSjM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MTk1NzEsImV4cCI6MTc4NzExMTU3MX0.C41Unv_QbWJPEpdH-zrI6v8H6ls0G19aGrSb0a4QnSo	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-27 03:52:51.193	2026-07-20 03:52:51.194	2026-07-20 03:52:51.194
eb85184d-50c9-44fe-b880-f5efb3170c39	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTIwMjYwLCJleHAiOjE3ODUxMjUwNjB9.OUjuORs6buUQC1ZEvmOZINR-3Mb9BdOItYAp2FtY-Hk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjAyNjAsImV4cCI6MTc4NzExMjI2MH0.Y6GRMQRWcf21gFpVZLynB9u6dZkOZP7DP2g1zIXciLU	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-27 04:04:20.448	2026-07-20 04:04:20.449	2026-07-20 04:04:20.449
67888289-136f-4e7e-ab74-655378ed92b3	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTIyOTU5LCJleHAiOjE3ODUxMjc3NTl9.tPbvxKLTl46nLqdVmiWMpjLgJ2N4R3PajFFCd4UbhCA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjI5NTksImV4cCI6MTc4NzExNDk1OX0.wi9k9WdAJ5mIfOJrpGosmnSRZ_cPC6ms7sCOdocx5Ig	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 04:49:19.006	2026-07-20 04:49:19.007	2026-07-20 04:49:19.007
8e47a6df-b7af-409d-a61e-89602423aeb3	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTIzOTQzLCJleHAiOjE3ODUxMjg3NDN9.wSDWmfJ0CJ2-aH35z43uySP-cRPK8-AaVaWsuqk8ZA4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjM5NDMsImV4cCI6MTc4NzExNTk0M30.5QCpR9YAhMr7Ew_0dRwI2fMPRYSjiZ0EFzGl7AHDe6Q	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 05:05:43.818	2026-07-20 05:05:43.819	2026-07-20 05:05:43.819
68891443-fad3-47f6-8dc1-6cc3a381499e	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTI0MTg3LCJleHAiOjE3ODUxMjg5ODd9.xE75DvHN3sxds3ZYDtjUq6yWoiKcjNevxvh7Tx5L930	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjQxODcsImV4cCI6MTc4NzExNjE4N30.k5fWEkNaNbKxn7o-hHrZua5GH-QdBGCL8EZqtuAoWeQ	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 05:09:47.682	2026-07-20 05:09:47.683	2026-07-20 05:09:47.683
977ec323-dd1c-4e9e-b5a8-e958f14482da	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTI0MjU1LCJleHAiOjE3ODUxMjkwNTV9.G8ZNvVMRTU7NYl5RG_qjT_5pBYUwV4nh8CwLRG9yz6w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjQyNTUsImV4cCI6MTc4NzExNjI1NX0.MPMb3DMfO0apsrIGPga5Naj3w5RkB6iAGcPyjsTq3w8	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 05:10:55.702	2026-07-20 05:10:55.703	2026-07-20 05:10:55.703
095fca9b-e5e5-4503-9c96-fb27a3e43d49	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwiaWF0IjoxNzg0NTI0MzU2LCJleHAiOjE3ODUxMjkxNTZ9.HorvOT2T0MOJlUoMzd4P5y4iBSmiGcXF9d5h_q3qn6A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NGZkZjgxYS01MzEyLTRiM2ItYjIwNy01Y2MwNDRmN2JjNWEiLCJ1bmlxdWVJZCI6IjI0NjhiMmJjMTI5NDE0YTFmOWY1YTY2MGY2NmU5OTM2IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1MjQzNTYsImV4cCI6MTc4NzExNjM1Nn0.Tn_-dkJQLJSgKnLv5o3vdQ8Ej-q7ONsZRnmF_a2FU-E	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 05:12:36.253	2026-07-20 05:12:36.254	2026-07-20 05:12:36.254
812859ac-a943-4798-a71d-b2d1a9f45b4b	f617404b-819e-4c7d-b4a5-8032b0b899cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwiaWF0IjoxNzg0NTU4NTc3LCJleHAiOjE3ODUxNjMzNzd9.sAU2j_eeBl6Pc1tNKxJ1ggIMHTV6_IMWMr2dcuz8J9w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1NTg1NzcsImV4cCI6MTc4NzE1MDU3N30.ujk0ITzQPGA0SpHP3cdDF2KM7cTHwfQAD5BFdQZMPM0	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 14:42:57.382	2026-07-20 14:42:57.382	2026-07-20 14:42:57.382
f5167832-26cb-4c95-840c-faa788417db2	f617404b-819e-4c7d-b4a5-8032b0b899cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwiaWF0IjoxNzg0NTU4NTc4LCJleHAiOjE3ODUxNjMzNzh9.O2foh0qhmMIFX74bNWKPZO1bFBOa8AlJ3XZCFKD9XNk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1NTg1NzgsImV4cCI6MTc4NzE1MDU3OH0.RYRXBR2yCVbKDv6tFJkUX3e6bnutwApg0sEYYwJ1nIg	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 14:42:58.474	2026-07-20 14:42:58.475	2026-07-20 14:42:58.475
d4bd373d-c8a8-4785-9356-294a41fa4eb8	f617404b-819e-4c7d-b4a5-8032b0b899cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwiaWF0IjoxNzg0NTYyMjkwLCJleHAiOjE3ODUxNjcwOTB9.SyuZVmYB_hN6rzXXd0mt00FH0KMupFjbsDhQ1wD9P1E	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1NjIyOTAsImV4cCI6MTc4NzE1NDI5MH0.thygsNWmM96CtNKOKuOkMfezgktlEGdiTknVfplnH-I	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 15:44:50.965	2026-07-20 15:44:50.966	2026-07-20 15:44:50.966
f2e66937-1fe5-44e3-8cab-3e9da4458ee5	f617404b-819e-4c7d-b4a5-8032b0b899cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwiaWF0IjoxNzg0NTYyMzQzLCJleHAiOjE3ODUxNjcxNDN9.gJK70xkDYwSr5cuulYpGFH7mmt4GgpTCKl3yUqJkb9o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1NjIzNDMsImV4cCI6MTc4NzE1NDM0M30.Umm0c62GlRUUfeT4ghmtkyjmcArEsIbsWcOWw-3fI5Y	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 15:45:43.432	2026-07-20 15:45:43.436	2026-07-20 15:45:43.436
f9480e80-c80d-48b5-bd02-d9d97c51cd0e	f617404b-819e-4c7d-b4a5-8032b0b899cd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwiaWF0IjoxNzg0NTYyNDE3LCJleHAiOjE3ODUxNjcyMTd9.8yUzLJt2Sg_u5pHxsJPZemoRSNMyz61L59pIy7ev5Ug	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjE3NDA0Yi04MTllLTRjN2QtYjRhNS04MDMyYjBiODk5Y2QiLCJ1bmlxdWVJZCI6IjZjNDdmZGI0NmFhZGVjNWYwMTRhZjJhNGM3NWU4N2UzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1NjI0MTcsImV4cCI6MTc4NzE1NDQxN30.kZXMMKpStuOa5OA_aapN8xoBpObKJd9cqh9R9jODvZY	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-27 15:46:57.842	2026-07-20 15:46:57.843	2026-07-20 15:46:57.843
69e95294-bfc6-4a5c-a3cb-ad9ec776647c	936fc045-7b74-4e58-b9f0-dea7ef2776aa	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MzZmYzA0NS03Yjc0LTRlNTgtYjlmMC1kZWE3ZWYyNzc2YWEiLCJ1bmlxdWVJZCI6Ijg0Y2I5ZWMzNDQ4ZWI1Mjg2ODM5ZDNlODYwOWFjZTFiIiwiaWF0IjoxNzg0NTkwMjc5LCJleHAiOjE3ODUxOTUwNzl9.98DIQEIr_F2YckutcSXJpWpKVae5DZESFOwTsgbz3Go	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MzZmYzA0NS03Yjc0LTRlNTgtYjlmMC1kZWE3ZWYyNzc2YWEiLCJ1bmlxdWVJZCI6Ijg0Y2I5ZWMzNDQ4ZWI1Mjg2ODM5ZDNlODYwOWFjZTFiIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1OTAyNzksImV4cCI6MTc4NzE4MjI3OX0.LcwpH_CjIrJEI6GxhS8o0aF9g5H8xNZd5xGkEBnrXrM	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.21.0"}	::ffff:127.0.0.1	curl/8.21.0	2026-07-27 23:31:19.621	2026-07-20 23:31:19.622	2026-07-20 23:31:19.622
2823787c-4376-4e56-9631-7ef2ba99007b	7b8e0888-8843-4971-b6ef-a84794f2e797	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YjhlMDg4OC04ODQzLTQ5NzEtYjZlZi1hODQ3OTRmMmU3OTciLCJ1bmlxdWVJZCI6IjU3NTExNGJiYTdkOGExNTEwYmUyNDU1OWJkYzNjNjg3IiwiaWF0IjoxNzg0NTkyODkxLCJleHAiOjE3ODUxOTc2OTF9.7J_kCK6M78M8JioJChPCmiW69EjJVhMNYHw97Ntxoa0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3YjhlMDg4OC04ODQzLTQ5NzEtYjZlZi1hODQ3OTRmMmU3OTciLCJ1bmlxdWVJZCI6IjU3NTExNGJiYTdkOGExNTEwYmUyNDU1OWJkYzNjNjg3IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ1OTI4OTEsImV4cCI6MTc4NzE4NDg5MX0.hl5mT1kP06LtZX6WZ9eM4VQEdVDx8RbPfPlCdyxXV0w	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-28 00:14:51.128	2026-07-21 00:14:51.129	2026-07-21 00:14:51.129
b20343ff-44ff-49a3-b59f-b316673e0b70	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjM3MDY1LCJleHAiOjE3ODUyNDE4NjV9.CCpYDsoj66LXd3lR-3mKqhloPhTvXSGPy_PMXW7Acik	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2MzcwNjUsImV4cCI6MTc4NzIyOTA2NX0.zvjTM3NSQYnx3s_1oQsstPux0oGQmN_0NbweN84vcy4	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 12:31:05.334	2026-07-21 12:31:05.335	2026-07-21 12:31:05.335
e1959bff-4261-4e9d-bcaa-1d5f9802c1d1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQwMjQ3LCJleHAiOjE3ODUyNDUwNDd9.CrGBckioMKlCNUiylVMf45A58Jdq_nXkbtVukU78b8Q	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDAyNDcsImV4cCI6MTc4NzIzMjI0N30.kVOvr_SFjvcKnffPni70z5TH5N4SiCRVhoF58UgOR90	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 13:24:07.669	2026-07-21 13:24:07.67	2026-07-21 13:24:07.67
587dbcc0-e010-4f55-bb01-24d19ebf31c3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQwNDY0LCJleHAiOjE3ODUyNDUyNjR9.MBeMK0CuDWqVP153N7nFjx0z-0MQX8mlyGacpjwAiZI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDA0NjQsImV4cCI6MTc4NzIzMjQ2NH0.a6f6FekTWiCiHv7iaqEGBtbKOKNV18NaRlbYGz5RgoQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 13:27:44.758	2026-07-21 13:27:44.758	2026-07-21 13:27:44.758
aa55cbf3-93af-4f65-b989-fc0949af56e7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQyMTUwLCJleHAiOjE3ODUyNDY5NTB9.VMrNLg9CsBMxE1sw9gRHoofXa8oZCFDkKm1XX5IHNkQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDIxNTAsImV4cCI6MTc4NzIzNDE1MH0.-OOAxx1bSCoyQ_3Hz09PEReAuw1iNRN2SDLOM1wtkDw	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 13:55:50.052	2026-07-21 13:55:50.054	2026-07-21 13:55:50.054
955f060d-1dc4-4212-a07f-77dae7b25a25	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQyODcwLCJleHAiOjE3ODUyNDc2NzB9.3SEpzYfZhD4PysyqfnaeyTgEY_-ZAgkT5Tq-0PMU7bs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDI4NzAsImV4cCI6MTc4NzIzNDg3MH0.1QO3vvOr5GT1WCEaKEABfnks0eYkNHnHo2RLFQZ9pO8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:07:50.527	2026-07-21 14:07:50.528	2026-07-21 14:07:50.528
d0eacd4c-9950-41fd-8282-21e39bd194d6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQyOTExLCJleHAiOjE3ODUyNDc3MTF9.VNApLj-yGa97qmlOsxRKPYFDawdbelNyOt97FTODhog	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDI5MTEsImV4cCI6MTc4NzIzNDkxMX0.KFpZq71rzqNT6OanlzMM9-pgdI-R1CyosjPpeFM7YGI	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:08:31.23	2026-07-21 14:08:31.231	2026-07-21 14:08:31.231
eb0551f5-5cf3-4a76-89ef-cbf585d8c2f8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQyOTEzLCJleHAiOjE3ODUyNDc3MTN9.QPCI4AWLHdNteKRTgF4fZJ2iQfjc8dFfzf0S2sF1qD0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDI5MTMsImV4cCI6MTc4NzIzNDkxM30.aVclCDi4bd75R7dPy8rxEQFbq9jtriR_0lzT_d548jM	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:08:33.123	2026-07-21 14:08:33.124	2026-07-21 14:08:33.124
0dba0278-e14e-4981-ac0c-12c7b0e83b3d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQzMDU5LCJleHAiOjE3ODUyNDc4NTl9.1zD8Y3vt1699fyZ99wImI5XL9Ylc5VnhKQ96bra2HQo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDMwNTksImV4cCI6MTc4NzIzNTA1OX0.Riw0S-y-ooTuAtnP-8sI4H5vrALpQ1e5FK-h04Ie0XE	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:10:59.274	2026-07-21 14:10:59.275	2026-07-21 14:10:59.275
d1aa9f6f-c56f-4695-9f49-039d359076c0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQzMDYwLCJleHAiOjE3ODUyNDc4NjB9.mWYx1l1owsVM0Zpbh3u0a3LkIlixsy1B0zsLZ0gtNoI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDMwNjAsImV4cCI6MTc4NzIzNTA2MH0.FojKbdV9Mz750FFB1cY-t3UKfXq2jBYzWc3TwRBqj_g	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:11:00.724	2026-07-21 14:11:00.725	2026-07-21 14:11:00.725
ebc413a9-ddc0-4856-8f79-c59f4bcd0938	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQ0MjkzLCJleHAiOjE3ODUyNDkwOTN9.xI3SiYK6UQ1T-xQeKEVZpT0WcU414F5q-NF_q60esK4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDQyOTMsImV4cCI6MTc4NzIzNjI5M30.bSkUE6Irtc1BiOtZPvBn4t82k9FEejcFI5sHCjAhELo	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:31:33.117	2026-07-21 14:31:33.117	2026-07-21 14:31:33.117
628f3f8b-7a89-4e6a-88a7-e9ac19fd430a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQ0Mzc2LCJleHAiOjE3ODUyNDkxNzZ9.tPqgCLUC1tlY8oNhdkS0xhko78qnsVnBuxYQJz1b20g	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDQzNzYsImV4cCI6MTc4NzIzNjM3Nn0.4hEw_ja3NcyhjlX4cfxYzof9VNAGVX7RSOcPspE74eA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 14:32:56.849	2026-07-21 14:32:56.85	2026-07-21 14:32:56.85
448a4d2f-aca9-49f9-ad01-ea0c8429fbdc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjQ3ODI1LCJleHAiOjE3ODUyNTI2MjV9.HSensMAtSHJkX273YH6Hswj8rVcedCK8WtjZNAegBDI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NDc4MjUsImV4cCI6MTc4NzIzOTgyNX0.Av6lmb67JENOFou8nCbJcq_hXIUVpvs-Fg8mDShffaQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 15:30:25.146	2026-07-21 15:30:25.146	2026-07-21 15:30:25.146
cbf71cd1-c22a-4c80-90a5-f5b9f06b038b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njc0NDcyLCJleHAiOjE3ODUyNzkyNzJ9.OPq7Gwfw9w7DWVDoa4nmbwSWo4JcF1zc9yHdHIpkiPw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NzQ0NzIsImV4cCI6MTc4NzI2NjQ3Mn0.UgFgUoJMqP9fXk58HPBOpfFAZA_wEzBecLlgJPmM7bA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 22:54:32.635	2026-07-21 22:54:32.635	2026-07-21 22:54:32.635
73844420-ee0f-4085-84de-048424631967	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njc0ODUzLCJleHAiOjE3ODUyNzk2NTN9.2zUrjqMyaxzvlBb-m76jYcI4X-39VAJAO3Ar8L_Hcew	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NzQ4NTMsImV4cCI6MTc4NzI2Njg1M30.fgXZanr1v00RVRgd7NHx9eP7q1W4TmN4d7MbuXUOvTw	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 23:00:53.594	2026-07-21 23:00:53.595	2026-07-21 23:00:53.595
e16af736-e0e7-4fac-99f6-8cbf7f66b9bb	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njc0ODU1LCJleHAiOjE3ODUyNzk2NTV9.iMDkCvpN9eG1MPiRC3jP5wFezxoG2jlOnWa2_z6RqJo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NzQ4NTUsImV4cCI6MTc4NzI2Njg1NX0.FcOoTUqgpyTsXJktqRIR2FLU6PzIMTRBhCAzbC4pSd4	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 23:00:55.823	2026-07-21 23:00:55.824	2026-07-21 23:00:55.824
62552de6-85b3-41ad-b36f-63ecbfece7e1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njc0ODU2LCJleHAiOjE3ODUyNzk2NTZ9.AvgKElUwlkiM3tCzU6qLbPFrpn8-me2AnpeKTJZ2sw4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2NzQ4NTYsImV4cCI6MTc4NzI2Njg1Nn0.okfmn5_vjJgewJX8gI_Z2ta20ruaS3K9_BRScGY4FcQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-07-28 23:00:56.313	2026-07-21 23:00:56.314	2026-07-21 23:00:56.314
c6627ffa-5460-41c4-9f11-6ee4f073c8c3	21bcf01d-73f6-4778-8116-f1607abcfa41	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWJjZjAxZC03M2Y2LTQ3NzgtODExNi1mMTYwN2FiY2ZhNDEiLCJ1bmlxdWVJZCI6InRlc3RfdmVyaWZ5XzE3ODQ2NzkwMTExMTkiLCJpYXQiOjE3ODQ2NzkwNzgsImV4cCI6MTc4NTI4Mzg3OH0.k-Nbr8dh9CzjFmXu4djMszSrUqQfIW4RPntaVnXOXpc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMWJjZjAxZC03M2Y2LTQ3NzgtODExNi1mMTYwN2FiY2ZhNDEiLCJ1bmlxdWVJZCI6InRlc3RfdmVyaWZ5XzE3ODQ2NzkwMTExMTkiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NDY3OTA3OCwiZXhwIjoxNzg3MjcxMDc4fQ.AgMefFYN76t3WSB-akFGVfg1ntm5FHVBDf77i3uhNYw	{"ipAddress":"::1","userAgent":"Python-urllib/3.11"}	::1	Python-urllib/3.11	2026-07-29 00:11:18.888	2026-07-22 00:11:18.889	2026-07-22 00:11:18.889
35ffd26d-74d2-47c6-879c-c763d86c4341	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njg4MjYyLCJleHAiOjE3ODUyOTMwNjJ9.IYIiPT6_KVZMWL9UOKV751_9OOL3E-rV3JUNgncFSJs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2ODgyNjIsImV4cCI6MTc4NzI4MDI2Mn0.2jMDh2Tt6Hh6dg_rDVHC-ApJKR4ImeKiAc_IVKWrxHo	{"ipAddress":"120.232.77.16","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	120.232.77.16	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 02:44:22.884	2026-07-22 02:44:22.885	2026-07-22 02:44:22.885
b423ba0f-1618-42d5-8628-06b5aedca343	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njg4MzQyLCJleHAiOjE3ODUyOTMxNDJ9.hpEy1rGsNUJuvyHl6DWJvovYiXh2gLlfzxU1_Icy2_8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2ODgzNDIsImV4cCI6MTc4NzI4MDM0Mn0._On5KDPTcwma4q_s1SwyEHP4gqk_aCpu-7biEhnUhHc	{"ipAddress":"120.232.77.16","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	120.232.77.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 02:45:42.871	2026-07-22 02:45:42.872	2026-07-22 02:45:42.872
4ea08100-88e5-4a15-af78-c870d34fbd80	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njg4NDU2LCJleHAiOjE3ODUyOTMyNTZ9.0nY2YumEuYCGgR8IHViCUiJdklNeDVmSD0bEXAALT5g	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2ODg0NTYsImV4cCI6MTc4NzI4MDQ1Nn0.FNtwkf3dQBZtmb0WZN7lPx2mUNAb8qga2fniBxCIn1A	{"ipAddress":"120.232.77.16","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	120.232.77.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 02:47:36.99	2026-07-22 02:47:36.991	2026-07-22 02:47:36.991
8a40490f-561e-450f-a4b0-4f0fa347bf4c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NjkwODEwLCJleHAiOjE3ODUyOTU2MTB9.FLdlaqhE_ZeEfcp8q-IOZR_5fn2bRuNX3QEBLIFiCsE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2OTA4MTAsImV4cCI6MTc4NzI4MjgxMH0.IlMkoQnJ7lScfCinMlcS6x-PPKZgKeg_LS_1XLo3NaA	{"ipAddress":"120.232.77.16","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	120.232.77.16	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 03:26:50.618	2026-07-22 03:26:50.619	2026-07-22 03:26:50.619
7a380d34-ea42-4e83-ada3-f03d95a714bf	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njk0NTAyLCJleHAiOjE3ODUyOTkzMDJ9.y8TqW1GThEBQk4ikxkhGH_FjV_bHhYGCuHM1M4L2Tkk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2OTQ1MDIsImV4cCI6MTc4NzI4NjUwMn0.D27tRDol_icG69uQI8G9XwR9jYnyUu63dPQsGsKlHoY	{"ipAddress":"126.233.95.25","userAgent":"Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.20.610 V1_IPH_SQ_9.3.20_1_APP_A Pixel/1170 MiniAppEnable SimpleUISwitch/0 StudyMode/0 CurrentMode/0 CurrentFontScale/1.000000 QQTheme/1000 AppId/537371169 Core/WKWebView Device/Apple(iPhone 13) NetType/5G QQExt/0 QBWebViewType/1 WKType/1"}	126.233.95.25	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.20.610 V1_IPH_SQ_9.3.20_1_APP_A Pixel/1170 MiniAppEnable SimpleUISwitch/0 StudyMode/0 CurrentMode/0 CurrentFontScale/1.000000 QQTheme/1000 AppId/537371169 Core/WKWebView Device/Apple(iPhone 13) NetType/5G QQExt/0 QBWebViewType/1 WKType/1	2026-07-29 04:28:22.839	2026-07-22 04:28:22.84	2026-07-22 04:28:22.84
8f5c0835-e01a-4335-a392-4440098f3fc5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0Njk0NTMwLCJleHAiOjE3ODUyOTkzMzB9.0a9YTYYaH8181Z8_77QO19cP9z3gHuMPEKo5e2nEJO0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ2OTQ1MzAsImV4cCI6MTc4NzI4NjUzMH0.bLkYQdZf5D-tSayG_F4bKGHthXQDc_XMggKlA7Y6N2w	{"ipAddress":"126.233.95.25","userAgent":"Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.20.610 V1_IPH_SQ_9.3.20_1_APP_A Pixel/1170 MiniAppEnable SimpleUISwitch/0 StudyMode/0 CurrentMode/0 CurrentFontScale/1.000000 QQTheme/1000 AppId/537371169 Core/WKWebView Device/Apple(iPhone 13) NetType/5G QQExt/0 QBWebViewType/1 WKType/1"}	126.233.95.25	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.20.610 V1_IPH_SQ_9.3.20_1_APP_A Pixel/1170 MiniAppEnable SimpleUISwitch/0 StudyMode/0 CurrentMode/0 CurrentFontScale/1.000000 QQTheme/1000 AppId/537371169 Core/WKWebView Device/Apple(iPhone 13) NetType/5G QQExt/0 QBWebViewType/1 WKType/1	2026-07-29 04:28:50.745	2026-07-22 04:28:50.746	2026-07-22 04:28:50.746
93714cda-56c3-4e81-952b-59ba418abeea	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzE1MDkyLCJleHAiOjE3ODUzMTk4OTJ9.PEcfAmHCeAg4zg0AoapCGWG5CstVmh6_OfjQ3OWpC38	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MTUwOTIsImV4cCI6MTc4NzMwNzA5Mn0.0TaASgETNViy0QKfJrmUhBEiFmCwsENgh4g2gpyMNDg	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	49.251.47.154	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 10:11:32.894	2026-07-22 10:11:32.895	2026-07-22 10:11:32.895
563c57b8-de74-4cbe-9286-e9d9302071b3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzE1MTE1LCJleHAiOjE3ODUzMTk5MTV9.7C2lf9RNdTelBJtYVXLAUi9FrLC82nGK5_-LTcYcc9U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MTUxMTUsImV4cCI6MTc4NzMwNzExNX0.TNQ_yGnrcroonYfqE3uFVs_Hw0pheiNqjPQBrXg7fcY	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 10:11:55.651	2026-07-22 10:11:55.651	2026-07-22 10:11:55.651
61490338-75b0-4791-8354-7515592df3cb	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzE3NDQzLCJleHAiOjE3ODUzMjIyNDN9.nXs86m-4d7Ru3VZBJziNDyRKOQza4STDQ3eGLAjbdP8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MTc0NDMsImV4cCI6MTc4NzMwOTQ0M30.KO6MfSXyfDwddSHSDcPCBj9y7GXQZDai2Hke47emYNE	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	49.251.47.154	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 10:50:43.252	2026-07-22 10:50:43.253	2026-07-22 10:50:43.253
78660a5c-c304-43c8-ab9d-d71b2f427ac8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzE3NDc2LCJleHAiOjE3ODUzMjIyNzZ9.IO8-Ah1oQpDXZeAMCsXvJGHTkRFnzVl_A7C_d5H0PGg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MTc0NzYsImV4cCI6MTc4NzMwOTQ3Nn0.JmB-MV6wpUkTUUremJLY87w1ZLxtW3fSo2q7Tz-olIU	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 10:51:16.598	2026-07-22 10:51:16.599	2026-07-22 10:51:16.599
eb03f278-b40b-42a4-9ff5-823a46627497	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzE5OTEwLCJleHAiOjE3ODUzMjQ3MTB9.CXw-5F8e48wkrNs7BSQicU1uHeA8jw7sStRt_VbW4lE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MTk5MTAsImV4cCI6MTc4NzMxMTkxMH0.SqFDej0mFy44mLMkxHhAip4GLPEoP_wYsR55pLO-vA4	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-29 11:31:50.58	2026-07-22 11:31:50.581	2026-07-22 11:31:50.581
1e105059-0697-40c4-bc0f-6f2cd781473b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzIyOTU0LCJleHAiOjE3ODUzMjc3NTR9.0zE4YeA9_ILbGT9o3xnuhk1iv_X-edd2xXTxRsd0Oak	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjI5NTQsImV4cCI6MTc4NzMxNDk1NH0.ALXd4HV5E44-45BneUvIQbKarpKipLWwmPpJBNywvmU	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	49.251.47.154	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 12:22:34.053	2026-07-22 12:22:34.054	2026-07-22 12:22:34.054
60eddc87-e9d6-4b9b-b92b-a6f5cc06c2c3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzIzMDU3LCJleHAiOjE3ODUzMjc4NTd9.ZJjJoLrG4bAqr65G7rw5xYkIEq46mM_kQaDFkn9Ux5A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjMwNTcsImV4cCI6MTc4NzMxNTA1N30.SYY8cRlZeOe0jKpmmKRHkQmFPWDjZ254twRZSOD8sqo	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 12:24:17.254	2026-07-22 12:24:17.255	2026-07-22 12:24:17.255
66a5f996-2184-4d51-828c-17d1d0686899	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzI2NTk0LCJleHAiOjE3ODUzMzEzOTR9.Yt_e_ZvjdOh3llfUNRXxn4Yp3PEXHZSE1Iyfa3RTAE0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjY1OTQsImV4cCI6MTc4NzMxODU5NH0.AqMjZQt-Ru8DXcDfFlsHCjW4kZKlPE0i4CrqmbFHuuU	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-29 13:23:14.06	2026-07-22 13:23:14.06	2026-07-22 13:23:14.06
ca21d217-a93c-40a7-bc70-776c1c9c3fc1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzI4MDY3LCJleHAiOjE3ODUzMzI4Njd9.3MW1iln7VlSSL-Ac3tIpsbjWTM5FkCkqMLomuaQ-rNI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjgwNjcsImV4cCI6MTc4NzMyMDA2N30.XGAgQDGujuzjpCq5vUPf0_ecYe60uRnROmCzXfBn-JA	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	49.251.47.154	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 13:47:47.842	2026-07-22 13:47:47.844	2026-07-22 13:47:47.844
32c26f35-c6c9-47ad-b07f-0c281fe8b2c2	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzI4MDc1LCJleHAiOjE3ODUzMzI4NzV9.J54-Xq_CoGXmDS3Lj5hSHIzW6xgX3jT4BFqZYjzaKJU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjgwNzUsImV4cCI6MTc4NzMyMDA3NX0.zo3KSWCy3r91ziYCbt13HLusG1rYSjsYH2GCSWgA4Z0	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875"}	49.251.47.154	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8875	2026-07-29 13:47:55.445	2026-07-22 13:47:55.445	2026-07-22 13:47:55.445
8dac4bcf-482c-4bb5-9f29-3b900e110611	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0NzI4MTgxLCJleHAiOjE3ODUzMzI5ODF9.9zriroOnXtd2NTJ-1op6ToAG3KVPXxgcDmkYqeqRGcM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3MjgxODEsImV4cCI6MTc4NzMyMDE4MX0.XAYpae-jo9IE81G2uVrKk2sGznWMSxcqKn41Dvk7DQg	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.10"}	49.251.47.154	Python-urllib/3.10	2026-07-29 13:49:41.341	2026-07-22 13:49:41.342	2026-07-22 13:49:41.342
bc9f1640-8510-4faa-827c-2bb007044d94	5b952aaa-610a-4ad2-a7a8-408772bbdc19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Yjk1MmFhYS02MTBhLTRhZDItYTdhOC00MDg3NzJiYmRjMTkiLCJ1bmlxdWVJZCI6IjI1YzhjYjVjY2YwMWNhNmM3Yzg3MTA0MjQyNWJjNTNhIiwiaWF0IjoxNzg0Nzk5MzkxLCJleHAiOjE3ODU0MDQxOTF9.H91vqtA5eXp-J6Pdwhot0r9XNU3PAe5dno7Zbz2ZxtM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1Yjk1MmFhYS02MTBhLTRhZDItYTdhOC00MDg3NzJiYmRjMTkiLCJ1bmlxdWVJZCI6IjI1YzhjYjVjY2YwMWNhNmM3Yzg3MTA0MjQyNWJjNTNhIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ3OTkzOTEsImV4cCI6MTc4NzM5MTM5MX0.lKa3hb9Mcf8wwt0GYAwUJyoW4O5h8KVDevM8JeUNY5g	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-07-30 09:36:31.402	2026-07-23 09:36:31.402	2026-07-23 09:36:31.402
b83bfdbe-98be-4968-80ef-c9e350a14495	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODg1MTA3LCJleHAiOjE3ODU0ODk5MDd9.xQmKceiLQIwVhOLMloN7ItAXjagVEOaDFip29DStAiU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4ODUxMDcsImV4cCI6MTc4NzQ3NzEwN30.SGU7KwrMRZsd9ieHmP-NXpYnBXfE9sIcTiVnQWWS1xw	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) TRAESOLOCN/1.107.1 Chrome/142.0.7444.235 Electron/39.2.7 Safari/537.36	2026-07-31 09:25:07.153	2026-07-24 09:25:07.154	2026-07-24 09:25:07.154
e88bce02-eccb-4a9d-be80-5320c72747ee	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODg3OTc1LCJleHAiOjE3ODU0OTI3NzV9.Ppa0qSW7x6wRUzn-gTLJP2ZQg4n5sE6Td6YszZo9w7g	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4ODc5NzUsImV4cCI6MTc4NzQ3OTk3NX0.ntvZF0TQYx-BQ1Vxyu_vvGFQ4TjnMmZPX5KI9IKPyHg	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-31 10:12:55.848	2026-07-24 10:12:55.849	2026-07-24 10:12:55.849
0af46927-2b28-4da9-b701-44dbd66afc6f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODg4MDkyLCJleHAiOjE3ODU0OTI4OTJ9.g9kncEgCNnuiAAnJ3I9N8kX4fiuOuQWDw9heFtRQ2ew	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4ODgwOTIsImV4cCI6MTc4NzQ4MDA5Mn0.xY_srzjSgMSqRaByyjkLGEW2zwpx28l63yMAU2GewWA	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 10:14:52.494	2026-07-24 10:14:52.495	2026-07-24 10:14:52.495
c082ceec-2060-4cc5-81e4-5c824c14ba6a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODg4MDkzLCJleHAiOjE3ODU0OTI4OTN9.XyTN9lWHVBJ4SUr0lUchlS_6ARg2OhDeGv0z3ARgdXM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4ODgwOTMsImV4cCI6MTc4NzQ4MDA5M30.7_uABRhLsCGUf3CfF22EiwEF4FsjFZqDIcXTWKBgjks	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 10:14:53.019	2026-07-24 10:14:53.019	2026-07-24 10:14:53.019
7e29d71e-6a4a-4415-a58d-f20a7c935180	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODg4MTk0LCJleHAiOjE3ODU0OTI5OTR9.GdtxCxuMNPxv9cOlzSZH4YDjTC8KuEEM8_hPSjETyrM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4ODgxOTQsImV4cCI6MTc4NzQ4MDE5NH0.znUH81obsw_ls7HF08bHolNUnHhYyeV_y3GKh2Auo5Q	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 10:16:34.849	2026-07-24 10:16:34.85	2026-07-24 10:16:34.85
cae0b525-6d21-4934-a38a-04226d2c672b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODkwMzc1LCJleHAiOjE3ODU0OTUxNzV9.DkEAVlws4v-HLA5UvmHlUl6An7D5iblgLtiBAIFIosA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTAzNzUsImV4cCI6MTc4NzQ4MjM3NX0.HqcMiQxI0AI75dJGDSitrF40ZYP_X1BX7KZeUGC3Rqo	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-07-31 10:52:55.345	2026-07-24 10:52:55.346	2026-07-24 10:52:55.346
69c3cf1b-4534-4633-945f-3309b7a4697a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk0MzU4LCJleHAiOjE3ODU0OTkxNTh9.y9LuvV1_YLtCvtjBuWzSnfDCBCL1kNvTkv6Y-XEaB8s	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTQzNTgsImV4cCI6MTc4NzQ4NjM1OH0.5VtqIbtjdjGzpBp30FsUlolM4cR-YsBJC24cECtg0yc	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 11:59:18.585	2026-07-24 11:59:18.586	2026-07-24 11:59:18.586
d7d4bf30-59ae-42f2-9468-72833d4257a0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk0Mzc3LCJleHAiOjE3ODU0OTkxNzd9.L0iK2aoVOMCxk1ZMDknQfnSaDB_Xkw46tvOoLR6yWbs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTQzNzcsImV4cCI6MTc4NzQ4NjM3N30.zQfJ34JvpuY3kqYmVAWYBZo9dmyufZYCJdRXNBHPa2g	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 11:59:37.921	2026-07-24 11:59:37.921	2026-07-24 11:59:37.921
e2eb6f95-b96d-4bcc-9c4a-7532d456ccc8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk0MzkxLCJleHAiOjE3ODU0OTkxOTF9.BXOCsdbRCL24EsXnKZoOW_J8Qudc2faxwk0BGRPrzfA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTQzOTEsImV4cCI6MTc4NzQ4NjM5MX0.i_fzPTYnQKavDNIPL76ZmhpujeYKDs4SA2c_qy4huO0	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 11:59:51.091	2026-07-24 11:59:51.091	2026-07-24 11:59:51.091
1b6add19-ace7-4473-9614-8a980efb1cbc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk0NDcxLCJleHAiOjE3ODU0OTkyNzF9.rbtZtuZSnDaewuecYSdZEwGvfwzvG8zkYLGQC5f2swc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTQ0NzEsImV4cCI6MTc4NzQ4NjQ3MX0.YuC-4RpdlD4d6lq_ZM8H2MX_-SlnY_mK04N8T-crJ-Y	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 12:01:11.107	2026-07-24 12:01:11.108	2026-07-24 12:01:11.108
40b23ff9-814b-4a67-83b1-3be8ef89595f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk0NTIyLCJleHAiOjE3ODU0OTkzMjJ9.xHoHFfkH1hbY8K-ECkgPFqFmAk90uav4xdgBRrpKqhA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTQ1MjIsImV4cCI6MTc4NzQ4NjUyMn0.47PfM-Wc7FSMj-zvSnV_Rl4n02xa7pfyGyDEMzEM6U4	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-07-31 12:02:02.576	2026-07-24 12:02:02.576	2026-07-24 12:02:02.576
4ece6399-af1a-4842-8163-e6e972646d3f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0ODk1MDgwLCJleHAiOjE3ODU0OTk4ODB9.pwmtnwFP19tZDA26u4a8SMIjLktougklhURkBuYcb6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ4OTUwODAsImV4cCI6MTc4NzQ4NzA4MH0.G3dsj8y0xqaLHl6AuBNmuCas6SPKWRvnGi3Sj5oTN6Q	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/150.0.0.0 Safari/537.36	2026-07-31 12:11:20.079	2026-07-24 12:11:20.079	2026-07-24 12:11:20.079
0223c817-a9f5-427a-8b09-ceae13c3af6d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTAxNTk1LCJleHAiOjE3ODU1MDYzOTV9.iF8sXPPmTqtdAIJALJW0qb8r9Pmul7Frw7AWV8UlXnQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5MDE1OTUsImV4cCI6MTc4NzQ5MzU5NX0.tkTTYT925OwhuRJoGQ0Ht7bKZX6LqZYweFhDrbz_I4s	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 13:59:55.796	2026-07-24 13:59:55.797	2026-07-24 13:59:55.797
c7cae143-9d76-4c0b-92ed-8e0d4cbe517a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTAzMjkwLCJleHAiOjE3ODU1MDgwOTB9.zxzs9A7kKSMnU7_LqbV9Bw195Ex1Pg4mqQ0-5me6BNw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5MDMyOTAsImV4cCI6MTc4NzQ5NTI5MH0.qBOQEePId1AxRNTNF4Yw5gds7UHdG32lr7CCOh97v8c	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-07-31 14:28:10.058	2026-07-24 14:28:10.059	2026-07-24 14:28:10.059
e2307e9f-4f97-461d-8809-69504585fa5b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTYyMTk0LCJleHAiOjE3ODU1NjY5OTR9.LS1XXWqrSfLSfAm-fnYmEZneGRpNlqcjrIS2_frOQ10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjIxOTQsImV4cCI6MTc4NzU1NDE5NH0.-Ldec81M0hzzTTjdxfVQ2Ku8208RhWbN0BXS-ipjgQM	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 06:49:54.937	2026-07-25 06:49:54.937	2026-07-25 06:49:54.937
85fe4487-3640-4c92-bd56-b7613dd62fe6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTYyMjA3LCJleHAiOjE3ODU1NjcwMDd9.adP1OF8JgyfhYBJpVZnZGBWyoAQTqUm0aHp6JmPjuUc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjIyMDcsImV4cCI6MTc4NzU1NDIwN30.75Ww7wCMlCrg8i6XCvznYGhqEU4rB7zFcBaNxgjpwtw	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 06:50:07.021	2026-07-25 06:50:07.022	2026-07-25 06:50:07.022
044f880a-01f7-4b9b-acd5-83c77d58f858	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTYyMjk1LCJleHAiOjE3ODU1NjcwOTV9.DBAExQpAQcWoAToXqF4DCIcxY_WQXe9Eu137Pxr7IwU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjIyOTUsImV4cCI6MTc4NzU1NDI5NX0.ReoP0lvf4bIjLNlWZGfgv2E8tBxa6N8nSS2Zdo5bPGY	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 06:51:35.203	2026-07-25 06:51:35.204	2026-07-25 06:51:35.204
86b58ae7-92df-43fe-b3b7-b019f3f131db	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTYyMzExLCJleHAiOjE3ODU1NjcxMTF9.IF56dLvFrwiVNelXhkBpdMkt7UzqgyiOBeSn-RMbtP8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjIzMTEsImV4cCI6MTc4NzU1NDMxMX0.3OreIfEtRnMxgw19cjVmBg_SV8wen5KEh17FpiemMBA	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 06:51:51.8	2026-07-25 06:51:51.801	2026-07-25 06:51:51.801
88ab4363-8096-400a-b1d2-737bffcd96b4	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTY1MzU0LCJleHAiOjE3ODU1NzAxNTR9.o37qSzSTkX2f4QR_Mx-hxoZg-4Ocug-k6JUnD33m7Wg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjUzNTQsImV4cCI6MTc4NzU1NzM1NH0.E8mI5I5jqK84jIQ3_E9HND9_Ztao3W0suRHiD-xV9U4	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 07:42:34.287	2026-07-25 07:42:34.288	2026-07-25 07:42:34.288
3f4e6155-debb-4562-b129-22e51682d4f3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTY1NDg2LCJleHAiOjE3ODU1NzAyODZ9.ze4j3aMYJ9v8YboP2OAn0M5HHpW1LrMtBYcF6PtqDjI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjU0ODYsImV4cCI6MTc4NzU1NzQ4Nn0.884kel2u1K0Dg3dbjGKNl2HNr5OdVahj9Y7SQxXhdMQ	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 07:44:46.916	2026-07-25 07:44:46.917	2026-07-25 07:44:46.917
3e1596c1-b854-4655-a727-e7d56b7a61ea	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTY1OTE2LCJleHAiOjE3ODU1NzA3MTZ9.mB9tjxelAhFPqpA357Qe0-1A4NFIRbppzQNjpfC0bzM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjU5MTYsImV4cCI6MTc4NzU1NzkxNn0.GsHX5hmUXmshGqXXUhK_X8bvBR4HOtIvNrXFH5SnSTI	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 07:51:56.864	2026-07-25 07:51:56.864	2026-07-25 07:51:56.864
85014f98-8c9a-4339-b3a3-0b9eadcc683e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTY2MDA4LCJleHAiOjE3ODU1NzA4MDh9.k1F9tFk7QP7KihxEy6l8kYHMQ2lPdMVOLsqp3NtTxdk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NjYwMDgsImV4cCI6MTc4NzU1ODAwOH0.8soox5CIsNpOBe5KTJYsIgJFhiGQEdznv-n9k6teBYY	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 07:53:28.534	2026-07-25 07:53:28.535	2026-07-25 07:53:28.535
b158c29c-28d5-4ded-bb01-ff16ad89aba8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTY4NDM1LCJleHAiOjE3ODU1NzMyMzV9.lKIDJMRZCVW4uvSSEBie4dBQHyZsiPBJFTxiihgEGyk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5Njg0MzUsImV4cCI6MTc4NzU2MDQzNX0.Q-UzVoajK7YSb5GjNzLF2WSFq4sjpnxwcFuzAfgv7Ls	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-01 08:33:55.288	2026-07-25 08:33:55.289	2026-07-25 08:33:55.289
05030615-9cad-4d37-88d7-55aea18a73dd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTcyNDc4LCJleHAiOjE3ODU1NzcyNzh9.adiR4H2YwsrMG5Y_1n67vlYIHkhA_Z7H-S7gP__bw1M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NzI0NzgsImV4cCI6MTc4NzU2NDQ3OH0.x2VdMincoGUbgBiM759Nei_nMidyu9QR5z32kPzqtSA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-01 09:41:18.204	2026-07-25 09:41:18.205	2026-07-25 09:41:18.205
8bb5fb5f-ba3d-4c8a-93ab-42b6a41c2436	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTcyNTk2LCJleHAiOjE3ODU1NzczOTZ9.XVW0E06eHI0uJegUskDtqsK0nsbVZd5in1XVLzYWyVE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NzI1OTYsImV4cCI6MTc4NzU2NDU5Nn0.H0RNvXvkaOHZjbFT3H5UpXl82UGr-ehM3VauAG4lRrE	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-01 09:43:16.631	2026-07-25 09:43:16.632	2026-07-25 09:43:16.632
a425427e-70cc-4a32-b3b7-896c7b013aa0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTcyNjUwLCJleHAiOjE3ODU1Nzc0NTB9.VdOflRbkYHC0p6gTICnT5bIwGONM0eYaKvgXo0bhvn0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NzI2NTAsImV4cCI6MTc4NzU2NDY1MH0.Sg9JyvUa6XFlChhv42hQfeKebCGnrXS8YWBOyvmpReM	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-01 09:44:10.73	2026-07-25 09:44:10.731	2026-07-25 09:44:10.731
4b948f44-b0bd-4470-bd3e-0f23a195fcdc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTcyOTU0LCJleHAiOjE3ODU1Nzc3NTR9.r0gI4H-RITJS_x8l5mtYZAtKNDLkve89QVG_6iaWXUk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5NzI5NTQsImV4cCI6MTc4NzU2NDk1NH0.-SjYo4gdbixdgRBRRoL0zTqk4JManJ1IgvzhsdZgQws	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-01 09:49:14.46	2026-07-25 09:49:14.462	2026-07-25 09:49:14.462
89b5d519-9b83-4f15-9f79-8c8b6dfee240	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTk2NjM0LCJleHAiOjE3ODU2MDE0MzR9.dCIKIQeuaW1hrCqIzAXrsrqn9vcuUM7zhYouNsJ1TD0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5OTY2MzQsImV4cCI6MTc4NzU4ODYzNH0.szvnpXHGDFY9nfycS_FAQ4C4wM7xYqahvVrOHoHucKs	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-01 16:23:54.411	2026-07-25 16:23:54.412	2026-07-25 16:23:54.412
6769d979-4c5d-446c-b1e7-a051e62f9868	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTk2NjY3LCJleHAiOjE3ODU2MDE0Njd9.zO1kstS4YNpCHwQw4RNU58sPPheOdMUBKuxqlsLkfKY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5OTY2NjcsImV4cCI6MTc4NzU4ODY2N30.yKpmnaIKeIuYo5Z4zrXpmRny6F0oLGjjGqaC0FCxJS4	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-01 16:24:27.178	2026-07-25 16:24:27.179	2026-07-25 16:24:27.179
cc7ff88e-ef4c-4fd6-bf6d-9530c11f91e1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTk2Njk2LCJleHAiOjE3ODU2MDE0OTZ9.KgcVIcFlhh4dSXOHnZ7pptAEUyAjAaBrhzJ1xolvefU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5OTY2OTYsImV4cCI6MTc4NzU4ODY5Nn0.wjwLKdV6Z-4kWMCGeWoVvrr5hMLaRz0xwI8h8woGFDM	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-01 16:24:56.411	2026-07-25 16:24:56.412	2026-07-25 16:24:56.412
9014b8c9-d3e9-4e80-b333-bc46705f1ef3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg0OTk2NzE3LCJleHAiOjE3ODU2MDE1MTd9.vApKTlmgRofpEwaJlGU3_FM7U5lkyAkBz-YZ4QJRfZU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODQ5OTY3MTcsImV4cCI6MTc4NzU4ODcxN30.4b3xzj_GC2vgbRivEt_3wyUfv2j4gYIc2TjOdJLsYkE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-01 16:25:17.533	2026-07-25 16:25:17.534	2026-07-25 16:25:17.534
4784e8f5-533d-4152-b413-f33f94ee176a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDI2MzQ2LCJleHAiOjE3ODU2MzExNDZ9.lOhc-15rPvLHvtcfJR7FpAMyglYd2bdp0yOPOrFMcVI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMjYzNDYsImV4cCI6MTc4NzYxODM0Nn0.N63BnKHPEViJ8U_wuBPy3D8ZAE-5q0p1mqd9_KhJw9o	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 00:39:06.842	2026-07-26 00:39:06.843	2026-07-26 00:39:06.843
a7f46527-66c7-4958-8077-d9e6a1a8cf95	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDMwNTU0LCJleHAiOjE3ODU2MzUzNTR9.oI0Q0W9wIkiD0cqfWSTfrA9kJR9I4iTaiDTN1vj4jBs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzA1NTQsImV4cCI6MTc4NzYyMjU1NH0.2vN2l-o8ihiq62N9HUOAodYF_zaG6yVaXctwUBhz5K4	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 01:49:14.085	2026-07-26 01:49:14.086	2026-07-26 01:49:14.086
77b08ee6-c65d-4e5c-badc-e7e25169962a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDMwNzc2LCJleHAiOjE3ODU2MzU1NzZ9._tRDAMcuaNbQHjGGj_ZRxEl9mDpt63ntFM2OMjuVmwc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzA3NzYsImV4cCI6MTc4NzYyMjc3Nn0.bd8db_ysklbqi9VqkHbUWf2u_bcUFg3VdZUWglZAg0A	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 01:52:56.323	2026-07-26 01:52:56.324	2026-07-26 01:52:56.324
15c8cb90-3466-4327-a3db-71f9e04440b3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDMxMTIxLCJleHAiOjE3ODU2MzU5MjF9.6O8BUQ7A3_nVNTGLE36_nV8ObJOIPrjlmRhf_1gU5XQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzExMjEsImV4cCI6MTc4NzYyMzEyMX0.J0I16jXHxNYYbafEIRowc_jDplNn_7k-kIIvJEIKFyY	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 01:58:41.423	2026-07-26 01:58:41.424	2026-07-26 01:58:41.424
681a200e-cb4c-469f-93f6-2851569b8b46	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDMzMTc2LCJleHAiOjE3ODU2Mzc5NzZ9.KetUFiWSq-PeFLrstMavEG7z_b1SwV7_iZGMkks-pjc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzMxNzYsImV4cCI6MTc4NzYyNTE3Nn0.A61gWm48XUx0ANitdleAWlP_kumdWIeoI2opROOfQt8	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 02:32:56.836	2026-07-26 02:32:56.837	2026-07-26 02:32:56.837
50422ca1-e60f-4cb1-b936-4adaba345ad6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDM0MzkxLCJleHAiOjE3ODU2MzkxOTF9.plVlFMLB9wxCPD7T79BdFZBuONoBQKwtQravPQd_LGg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzQzOTEsImV4cCI6MTc4NzYyNjM5MX0.hdQiiAWUdg0i8w3FV8ywxzZqg4321uUD7Cz87Tu35j0	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 02:53:11.388	2026-07-26 02:53:11.388	2026-07-26 02:53:11.388
a0558ef2-f0cd-4c06-aff3-03335fe9e9ed	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDM0NDU4LCJleHAiOjE3ODU2MzkyNTh9.w_J27cSYRkmcckQdcj_qbHVTNLM-D9-mppsEuT5d1L4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwMzQ0NTgsImV4cCI6MTc4NzYyNjQ1OH0.WpYWgTO0iKTCw3ZA3WxhMpdOq2abDSZMGuIg7vHKIi8	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 02:54:18.282	2026-07-26 02:54:18.283	2026-07-26 02:54:18.283
75b7a06d-14e0-4573-9104-341bc13729e6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDQxNzA0LCJleHAiOjE3ODU2NDY1MDR9.X5e6YTLllLLpTtIgApE-VRz0mEfBOxIRmX9csoRAcO0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNDE3MDQsImV4cCI6MTc4NzYzMzcwNH0.yDYtqEc9LS1PK97o4hDA-i8yQ_4xFVh2uyswIMiHs8c	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-02 04:55:04.912	2026-07-26 04:55:04.913	2026-07-26 04:55:04.913
560a207e-4b21-4835-8769-468beb97e172	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1NjYxLCJleHAiOjE3ODU2NjA0NjF9.c6HMpNm0Vq0ZX0xAtAzOf84if5ueZgHsmKAu2oCkWhU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU2NjEsImV4cCI6MTc4NzY0NzY2MX0.57LYFjXV5k3AHcefGIDdlfiLKkbzh5FA9sPwChPJbKg	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 08:47:41.429	2026-07-26 08:47:41.43	2026-07-26 08:47:41.43
c7a39752-4814-4859-b9f5-f8c500b471ec	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1NjYyLCJleHAiOjE3ODU2NjA0NjJ9.v7WNlu9J29UD7twN570ateq4L0Ho-3uppcjAjIYL0A0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU2NjIsImV4cCI6MTc4NzY0NzY2Mn0.YkWFxTvW3EvC_KFvxcuta-sbK51XXmvhopqVAdfcalE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 08:47:42.115	2026-07-26 08:47:42.116	2026-07-26 08:47:42.116
a4476f0c-0cec-4289-bae0-18a514102814	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1NjYzLCJleHAiOjE3ODU2NjA0NjN9.vuGo4RR4l8UAmjUO0C5lpEFJRmD5Zf8M3K4As2Iu3wU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU2NjMsImV4cCI6MTc4NzY0NzY2M30.bpAsHS8cgJfDsgGCqEUxVC4WzQPUxi7F2_upL_LytAA	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 08:47:43.559	2026-07-26 08:47:43.56	2026-07-26 08:47:43.56
3413a366-098f-4620-8c03-11c8010f8730	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1NjY2LCJleHAiOjE3ODU2NjA0NjZ9.tTOHSwjaXhOmQNA94f0su42QPXOTnbZVLQd7roKm-L4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU2NjYsImV4cCI6MTc4NzY0NzY2Nn0.LVi0y1geNoEeAt2OmbwwaAWI6yR28Aa4cABv4FpnACA	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 08:47:46.828	2026-07-26 08:47:46.829	2026-07-26 08:47:46.829
0ba5e6ae-89c6-41a2-b7cb-86860d1500f6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1NzA0LCJleHAiOjE3ODU2NjA1MDR9.se3WRRtqc5xEkWS-4dCTm4B4CSHtKCLa1kh_nyipzw0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU3MDQsImV4cCI6MTc4NzY0NzcwNH0.aMnnpU4vyARwXaa91x4nIqqXQHFK9eJMOQBuvFUlaIQ	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 08:48:24.3	2026-07-26 08:48:24.301	2026-07-26 08:48:24.301
e5d74291-4d01-4656-9c7d-24b6d86ad217	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1Nzk2LCJleHAiOjE3ODU2NjA1OTZ9.-8ST4gnKCyf65gEAH0SPzpPeeHEEsu7KmYQwrzxZ8Jg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU3OTYsImV4cCI6MTc4NzY0Nzc5Nn0.mUC8dZJRvvA9UqiXFEwcHOUHSUFv6P8t-RjkafLqxq0	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 08:49:56.849	2026-07-26 08:49:56.849	2026-07-26 08:49:56.849
0bb1673e-215e-4f79-b8f6-058ff8068225	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1Nzk3LCJleHAiOjE3ODU2NjA1OTd9.lWF-Gy8Al6PahH2PyxgYOT55-v2TzqbwsqpUeuIUYQE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU3OTcsImV4cCI6MTc4NzY0Nzc5N30.f0mQiJ_szMA75RMo7qY8kUFsgGFP3osxbexaf_XkpSU	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 08:49:57.035	2026-07-26 08:49:57.036	2026-07-26 08:49:57.036
d44ad274-7f46-4cbc-be66-33f7055ba03f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1ODg4LCJleHAiOjE3ODU2NjA2ODh9.oHwAA17XkT4QJxUG6mKbCHDlldnTnFo8T-rSfnDhWy4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU4ODgsImV4cCI6MTc4NzY0Nzg4OH0.DyPLdMgPe7zEz9s43DpyWllRm2JFmpf0bFdi8JuXx_M	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-02 08:51:28.763	2026-07-26 08:51:28.763	2026-07-26 08:51:28.763
d7de901a-c308-4cad-abe4-ac6235e1b22c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU1ODkyLCJleHAiOjE3ODU2NjA2OTJ9.uZLdVki-DCVvZ80AvHsSxryENaD1HJ9dDYCSlwmQtyI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTU4OTIsImV4cCI6MTc4NzY0Nzg5Mn0.Yzrh6U1Qa2GNRjHHMyRt4foxBYPeFl5f2TONxxOCALk	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 08:51:32.51	2026-07-26 08:51:32.51	2026-07-26 08:51:32.51
3475af84-c155-479b-990a-e6bb943f8d0b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3MTA1LCJleHAiOjE3ODU2NjE5MDV9.nv_hZ5YguPMT8SX69qv6uN8Ei4eTl_FQGuUb9uH0uIY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTcxMDUsImV4cCI6MTc4NzY0OTEwNX0.Jy-hjGfqwMnnt5HrYbaH4AhqdSEKgsPsK29mhg8JAQw	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:11:45.625	2026-07-26 09:11:45.626	2026-07-26 09:11:45.626
46a07418-8c04-40a6-b319-f726f0cb0760	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3MTA2LCJleHAiOjE3ODU2NjE5MDZ9.Edo36lksDwU1uo6irYFGmKcLZxMcaQaA0rf-gOOuwTg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTcxMDYsImV4cCI6MTc4NzY0OTEwNn0.mVKK9Rj2BM5Ky2WQny89aYxJC4E6xUobpCAg5-0prvw	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:11:46.527	2026-07-26 09:11:46.528	2026-07-26 09:11:46.528
fb1be57a-82bb-44e1-92dc-aae8d3826e81	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3MTA4LCJleHAiOjE3ODU2NjE5MDh9.9vSpR9bY-_n_i5rNrf-qw7Tg8xMalPHcyFDdSfa-qhc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTcxMDgsImV4cCI6MTc4NzY0OTEwOH0.7ougOqXqlJGxwT6yfyImnBDYcr78Tq0nodf1Ir0Xe4E	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:11:48.63	2026-07-26 09:11:48.63	2026-07-26 09:11:48.63
db97e8b5-3588-4200-9faf-1340d1276942	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3MTA5LCJleHAiOjE3ODU2NjE5MDl9.U6JZH7LkRupCmULp5B0kXGsWTUjeIivb8luWzH0AuN0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTcxMDksImV4cCI6MTc4NzY0OTEwOX0.sqEJnS45Zc9ch2sI59b6H76UH2QfpYf1HUxYQwIGO24	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:11:49.53	2026-07-26 09:11:49.531	2026-07-26 09:11:49.531
7d7f37a9-0f5a-4569-ae33-f47ad983a623	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3MTEwLCJleHAiOjE3ODU2NjE5MTB9.375xNaYlrdIWtFYWWCtJoM9nW3FAB94aIiD4nDTSvpA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTcxMTAsImV4cCI6MTc4NzY0OTExMH0.Y50rt5wuYBhIlQQ3FBP7awyh8wQsAysxSzCoVFyFFtQ	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:11:50.429	2026-07-26 09:11:50.43	2026-07-26 09:11:50.43
babcb073-0929-4666-a258-0b300747a5b3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3NTkwLCJleHAiOjE3ODU2NjIzOTB9.sVmZ79utNHRiawJHsqR2oAI5Tbiy6ud4VTIp9nJkHnM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc1OTAsImV4cCI6MTc4NzY0OTU5MH0.RNO7M1hyvdh8rmGzSNf1gw5dZ9qjL2LxVBzp7QPAkRE	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:19:50.723	2026-07-26 09:19:50.724	2026-07-26 09:19:50.724
8937d272-79c3-4465-9811-515aee6b4c45	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3Njc4LCJleHAiOjE3ODU2NjI0Nzh9.PNRzQLxO20EL_QYfUAgOgF12oZS-b7PZ3BmHQrMdRgM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc2NzgsImV4cCI6MTc4NzY0OTY3OH0.Vvsrnvq5KTbNUWP9orgp947SdpILq9EM-R-wT-oaFIc	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:21:18.028	2026-07-26 09:21:18.029	2026-07-26 09:21:18.029
e70ac60d-8153-4ed7-9950-7515a17a7605	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3ODU4LCJleHAiOjE3ODU2NjI2NTh9.wcMrfTOOkEcTcJ-UyPh3Vllfrsz97sklshg97oz3mOs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc4NTgsImV4cCI6MTc4NzY0OTg1OH0.ZzLpCFd0waB6nXSXdE1SUKbdHEu7OzEChTJVtc1n8d8	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:24:18.169	2026-07-26 09:24:18.17	2026-07-26 09:24:18.17
16155989-b183-472b-a986-466b8ea87eca	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3OTA1LCJleHAiOjE3ODU2NjI3MDV9.Sf1n98RzU044dJnNA22mwln4z-ecnPwVtQD7qk7glqI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc5MDUsImV4cCI6MTc4NzY0OTkwNX0.Afx8oYive_jERm06I-EZHoNlGyIkrqA3mrBPJ8kk0TA	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:25:05.206	2026-07-26 09:25:05.207	2026-07-26 09:25:05.207
383c2b2a-bac5-4c06-b49a-5bcbb9a833fa	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3OTMwLCJleHAiOjE3ODU2NjI3MzB9.VuqI5uuNOPfPp74xlNxqmDaKBbZB1VqXK2443IeUcQQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc5MzAsImV4cCI6MTc4NzY0OTkzMH0.G4ITv464_lrGo_Gc5ImefFcXp3ciMa9EplkeltCno_I	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:25:30.53	2026-07-26 09:25:30.531	2026-07-26 09:25:30.531
753d6a74-b2f6-475d-9ead-a7cb3c001b84	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3OTU1LCJleHAiOjE3ODU2NjI3NTV9.qlaM672CVEI96myKAxTidkhzYyUwGCOPpKkEPFG7wCM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc5NTUsImV4cCI6MTc4NzY0OTk1NX0.7gJngSZHoLoiF6BgSkAmNa3ihxHaNffRneBF-BdT97w	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:25:55.541	2026-07-26 09:25:55.541	2026-07-26 09:25:55.541
8e8463b0-7bf0-4510-b9a8-41ffb6af7b81	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU3OTgxLCJleHAiOjE3ODU2NjI3ODF9.zvXI-dYbXHeDZ81VDVqUFY0lRn3quMFiG7Zwsf0LZbM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTc5ODEsImV4cCI6MTc4NzY0OTk4MX0.66-Q9dAkM8f1xvxJK2mZIHl6dDRdkXNUW4I7dyTey5k	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:26:21.225	2026-07-26 09:26:21.225	2026-07-26 09:26:21.225
b31e6ad6-da76-4aeb-911e-b3dc4d3aa367	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDU4MDA3LCJleHAiOjE3ODU2NjI4MDd9.bd3dY2sYqPe39iaQbBPrdg1rod8vI6NENmaW4ndngtQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNTgwMDcsImV4cCI6MTc4NzY1MDAwN30.RAlV7QPSy-l7i8YdI1HrzRIXs2Qd3bg_U847RHfm7EM	{"ipAddress":"127.0.0.1","userAgent":"curl/8.4.0"}	127.0.0.1	curl/8.4.0	2026-08-02 09:26:47.692	2026-07-26 09:26:47.692	2026-07-26 09:26:47.692
44952905-057f-492c-bbe3-08e8ad0b3741	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YWE0MDk3ZC0zZmIzLTQ1N2QtYjliMy1iMmY3NzJmMWNkOWEiLCJ1bmlxdWVJZCI6IjVkMjgzOTg0MWZkMDg2YjIiLCJpYXQiOjE3ODUwNTkzNjEsImV4cCI6MTc4NTY2NDE2MX0.wOGnNe5TobZ8ZnV52ClWj4mYpd_NF_Y9WpNTlTEGPSw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YWE0MDk3ZC0zZmIzLTQ1N2QtYjliMy1iMmY3NzJmMWNkOWEiLCJ1bmlxdWVJZCI6IjVkMjgzOTg0MWZkMDg2YjIiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NTA1OTM2MSwiZXhwIjoxNzg3NjUxMzYxfQ.15pMe1weqnDy73bAGQcdAxUT632MBzIK14_IJOysIL0	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-02 09:49:21.729	2026-07-26 09:49:21.73	2026-07-26 09:49:21.73
2d520c98-c018-406b-91e4-61e1c7e2de3f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDYxMTI2LCJleHAiOjE3ODU2NjU5MjZ9.47hBSx31s9fBaV_CVe-nIXu_eE-wdqJloBmHboD3nBc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjExMjYsImV4cCI6MTc4NzY1MzEyNn0.FGyMfafJ5x4HxF4G0p1SCICQuwVcetvPMSRBua9iAxM	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 10:18:46.554	2026-07-26 10:18:46.554	2026-07-26 10:18:46.554
29742d91-0c87-4a12-be0b-37317c6f01b4	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDYzMTYxLCJleHAiOjE3ODU2Njc5NjF9.wdm8TvOgFWkX5NFaSvF1uCmGqRoJsENsvLlWQ2cNmSo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjMxNjEsImV4cCI6MTc4NzY1NTE2MX0.gIN0JjkyQAHWyEXquclpREuSNrsyq8QxqU2Pb554Vpk	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 10:52:41.592	2026-07-26 10:52:41.593	2026-07-26 10:52:41.593
117ed60f-5306-43b4-a8f7-6e039ea6cad8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY0NDM4LCJleHAiOjE3ODU2NjkyMzh9.Uriyi6j3-N13JXvCSCpVlgV-CpHXQl9Haa-6NaPwEUw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjQ0MzgsImV4cCI6MTc4NzY1NjQzOH0.4z7Gl3dCCu2UMn0jrnYlU0Ioc8PnlEJu351ViV7fR2U	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 11:13:58.354	2026-07-26 11:13:58.355	2026-07-26 11:13:58.355
705e7832-3fc2-4a9e-a2fe-72bb66f6dd17	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY0NjY2LCJleHAiOjE3ODU2Njk0NjZ9.ntA_Xu5gkYvL3XYwzPP9UgKzTmOkPJ6Pi73u9yfliZs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjQ2NjYsImV4cCI6MTc4NzY1NjY2Nn0.xHjhxuUFo8z-pvW8wyfoq-aYvt3NzFfzXUdtD1RLi80	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 11:17:46.944	2026-07-26 11:17:46.945	2026-07-26 11:17:46.945
7b0efdca-4d9b-4d6b-aea9-f74cb008ed42	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY0OTA0LCJleHAiOjE3ODU2Njk3MDR9.3LswwkASz1YlptDLUNoVfZ--PQcY_9HvzGZPlgOFxkc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjQ5MDQsImV4cCI6MTc4NzY1NjkwNH0.KuJ4_L3E-wzWbNT2zZmIGn38ztk44-nQEGXjvDD9A-s	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 11:21:44.799	2026-07-26 11:21:44.799	2026-07-26 11:21:44.799
ff2b8657-49e7-432e-8f89-b48b7b032973	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY0OTUxLCJleHAiOjE3ODU2Njk3NTF9.8dXmM2URSqPosAG0WWY6KNax-D7ZDkJDiZK4EsSJSoM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjQ5NTEsImV4cCI6MTc4NzY1Njk1MX0.m26cLnQN-gqzWVKGpm-XPxa5uJqkyz9ukCY24gnTxAo	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 11:22:31.409	2026-07-26 11:22:31.41	2026-07-26 11:22:31.41
00ca445c-7007-43eb-8842-6a39f0ba47a8	bee326da-b724-4e53-a833-97b113038280	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZWUzMjZkYS1iNzI0LTRlNTMtYTgzMy05N2IxMTMwMzgyODAiLCJ1bmlxdWVJZCI6ImI5MjNmNDMzN2VjOTdmMmEiLCJpYXQiOjE3ODUwNjU1MTQsImV4cCI6MTc4NTY3MDMxNH0.OYFLRSq1vjPCZxniGuyrRvy5MRfTI0dZQ7oOig78UD0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiZWUzMjZkYS1iNzI0LTRlNTMtYTgzMy05N2IxMTMwMzgyODAiLCJ1bmlxdWVJZCI6ImI5MjNmNDMzN2VjOTdmMmEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NTA2NTUxNCwiZXhwIjoxNzg3NjU3NTE0fQ.CdAGagnRlFIRjD3xgdX2vjnjScm7ac__1S7x9GkUKG4	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 11:31:54.42	2026-07-26 11:31:54.421	2026-07-26 11:31:54.421
55959c7b-4477-4f6b-a05d-82c5a129f205	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY2NjY2LCJleHAiOjE3ODU2NzE0NjZ9.4_UU9lwhxD5uQRr0OEkLk91OpMQjGHOfQFgVpfGNOQo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjY2NjYsImV4cCI6MTc4NzY1ODY2Nn0.iP3FPDyQHFtFOieccrfLrmC7I8UbaBm2JLtE-MY6WbY	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	2026-08-02 11:51:06.495	2026-07-26 11:51:06.496	2026-07-26 11:51:06.496
5ba5d3dc-f033-4bb3-9cfe-6f89772ce207	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY3MzYwLCJleHAiOjE3ODU2NzIxNjB9.u-coM-U0onhVmmcl1V5Ir62Bst03-Iwq00XwKL43ioM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjczNjAsImV4cCI6MTc4NzY1OTM2MH0.knZWIZIvy8mKWUWyiu_EB16hKllgdqSFoXTQCjiaxvA	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:02:40.254	2026-07-26 12:02:40.254	2026-07-26 12:02:40.254
f9ced4cf-db8e-4a9c-81dd-8d8acbae93f1	d6cdc807-a203-4af0-953d-16ded2c5d9d6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmNkYzgwNy1hMjAzLTRhZjAtOTUzZC0xNmRlZDJjNWQ5ZDYiLCJ1bmlxdWVJZCI6IjJjMGY0ZWQ3MmM0ZTJmMjQiLCJpYXQiOjE3ODUwNjc2OTEsImV4cCI6MTc4NTY3MjQ5MX0.R3i2MAD850bovragp8rrn1DV5s6WlfnDm47q9VQt8zQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmNkYzgwNy1hMjAzLTRhZjAtOTUzZC0xNmRlZDJjNWQ5ZDYiLCJ1bmlxdWVJZCI6IjJjMGY0ZWQ3MmM0ZTJmMjQiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc4NTA2NzY5MSwiZXhwIjoxNzg3NjU5NjkxfQ.7wUMoMMrhV21WTmBfYXRV_1_jw9ESDnaLVTCwg27C2c	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:08:11.424	2026-07-26 12:08:11.425	2026-07-26 12:08:11.425
62bd2fc7-e8b4-41db-a012-abdf2e09debd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY3NjkzLCJleHAiOjE3ODU2NzI0OTN9.G4TRQEcw682hJlg4x-8f5iMaWDq49RLjktKmO3OmBDQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjc2OTMsImV4cCI6MTc4NzY1OTY5M30.7ZPsyYNtyjNleAGyPfQH7x4PN2nCZMdXIx_esWeKOYQ	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:08:13.502	2026-07-26 12:08:13.503	2026-07-26 12:08:13.503
a3be3b72-2e15-457c-bcde-c5d162ea462c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY4MTEyLCJleHAiOjE3ODU2NzI5MTJ9.c-Q0k40BrjEmgSHRnFOwiFakZg3REMWio9dtGZtyHjQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjgxMTIsImV4cCI6MTc4NzY2MDExMn0.LaUuDJKzzLEITEXH2RpYj4w7DbDM9Agy4quI3BOiKK4	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:15:12.565	2026-07-26 12:15:12.566	2026-07-26 12:15:12.566
ee0fe8d8-3461-4e85-8612-9b4dac4e2cd9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY4MjU1LCJleHAiOjE3ODU2NzMwNTV9.LMQkk172-uioXmOyri8GDufYU6Shb5p0HWxGEVYLUNI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjgyNTUsImV4cCI6MTc4NzY2MDI1NX0.QhHv7vIG10eHn92aJ3gfg-8pqegY4j4HTGqNV7kDewY	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:17:35.832	2026-07-26 12:17:35.833	2026-07-26 12:17:35.833
e9f159f0-d930-4272-a66c-94cb30874c11	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY4MzA4LCJleHAiOjE3ODU2NzMxMDh9.1dbQ39q_EACCWaEhWvJdSnboSkXLvThMQbvIjoBDFxU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjgzMDgsImV4cCI6MTc4NzY2MDMwOH0.VE-xmpQK6qQm6WOHsvT7xoV55b1zy8zln-37wApjGJg	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:18:28.655	2026-07-26 12:18:28.656	2026-07-26 12:18:28.656
e25f1043-49ae-4826-976e-5328d0f5891a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY4MzE5LCJleHAiOjE3ODU2NzMxMTl9._eE-6Kqm_OXi4Iyxt1sb4aVIs7RlX7kiRpsdMM8oEos	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjgzMTksImV4cCI6MTc4NzY2MDMxOX0.3bs1Emo-dCixi7WmpWPIca7imzS5OOim-WPBaeKqleI	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:18:39.202	2026-07-26 12:18:39.203	2026-07-26 12:18:39.203
094486ca-9ff2-4d37-8391-40088f9b3259	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY5MzA5LCJleHAiOjE3ODU2NzQxMDl9.43e93CM3beTuDXSEWCqYWiA_YG0u4gwUBxhLTeDxKgc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjkzMDksImV4cCI6MTc4NzY2MTMwOX0.AFWNTSIi-4pfX6c61wb2z3cu7z8o4jvRS-tE1ZmEr_Y	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:35:09.299	2026-07-26 12:35:09.3	2026-07-26 12:35:09.3
2ec821e8-3489-4195-991c-4d253c7293a0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDY5NTQ3LCJleHAiOjE3ODU2NzQzNDd9.WXyFXYY-skL1mv4lUTI5wyWKwyImQobXpPtdOKRu6mk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNjk1NDcsImV4cCI6MTc4NzY2MTU0N30.VJXY7Llja1qN_NIzUafsM8pIYUNFPTrDrGNtCxYLAVA	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-02 12:39:07.387	2026-07-26 12:39:07.388	2026-07-26 12:39:07.388
b94450d2-3f0a-461c-8571-8eccb81b0656	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc0MzI3LCJleHAiOjE3ODU2NzkxMjd9.3DCYCT6N9a1v0NeZEGjj9lPuEXLck1paq3tNt1Ge-c8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzQzMjcsImV4cCI6MTc4NzY2NjMyN30.yRCvRpak8QaYIDeODIk8mRriVzDDS9bEY6FKHIvIB68	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 13:58:47.389	2026-07-26 13:58:47.39	2026-07-26 13:58:47.39
244e6a1f-cc57-440e-a92f-8421574fd0c8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc0MzU0LCJleHAiOjE3ODU2NzkxNTR9.onDb6M8Kht7y7HKMdL3K3CB3thwwbbGtks9O5zcMysg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzQzNTQsImV4cCI6MTc4NzY2NjM1NH0.wos2ELZx2qw1rCjI-MmcXynL8BwR3WhVEgbHpFFhqWk	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 13:59:14.609	2026-07-26 13:59:14.61	2026-07-26 13:59:14.61
800036c5-d088-4ff2-ab59-d42436eafe92	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc0NTg5LCJleHAiOjE3ODU2NzkzODl9.rHQE-_fz-eVU6o4om9PgnMQoK5s-NQ4cuUPc6cOYBs4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzQ1ODksImV4cCI6MTc4NzY2NjU4OX0.DCwnN_JMcL18hI-4dj9TxU0gxHx_ZHYfK-DTmtX69yQ	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:03:09.106	2026-07-26 14:03:09.106	2026-07-26 14:03:09.106
302068d7-d7ad-4ea8-bed2-c984508a354b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc0NzI5LCJleHAiOjE3ODU2Nzk1Mjl9.cxy0Aw_HNYZI-0x8DAR_CjUSlrJ0bMhCSdbUUu5Au80	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzQ3MjksImV4cCI6MTc4NzY2NjcyOX0.O6pchmfFgzQx6Smqw1Uw98jc6SAv151U5SUOR4iywR4	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:05:29.719	2026-07-26 14:05:29.72	2026-07-26 14:05:29.72
3f45e57b-9e1a-4602-a475-1fd71584e866	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1MzEwLCJleHAiOjE3ODU2ODAxMTB9.aoSqZC5BALl_lOzIo4_g3sfc5XNd4URVtMd2NhTmlIo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzUzMTAsImV4cCI6MTc4NzY2NzMxMH0.treuKI8ZaZUt_1qoL6YAkJdbRS-2wu-gMWCwpGEfpVs	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:15:10.94	2026-07-26 14:15:10.941	2026-07-26 14:15:10.941
1b53d016-1096-4180-9026-9120f452659b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1MzU3LCJleHAiOjE3ODU2ODAxNTd9.4EClhTqjNww3fpgKu8R0tD8N8OBf1X6EhhYwuLzj6QY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzUzNTcsImV4cCI6MTc4NzY2NzM1N30.mlqlP_eYtmNvkMkfHWI0kjTjpcaheYU8MjI_AsA1Kcg	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:15:57.279	2026-07-26 14:15:57.28	2026-07-26 14:15:57.28
e6b88819-40b7-46a4-83bb-0a59fbd56e16	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1Mzc1LCJleHAiOjE3ODU2ODAxNzV9.MAQofi_Kq6BoU4Mg2nEQF_E8q9UoS6DhcA_5Iz3SpmU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzUzNzUsImV4cCI6MTc4NzY2NzM3NX0.hfh0Rm7aVq5msLdXa_GTWikkQOD3BtoIb7sJ96_8xcM	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:16:15.743	2026-07-26 14:16:15.744	2026-07-26 14:16:15.744
ace2bc83-3253-4bf9-aea7-2900b7513745	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1NDY0LCJleHAiOjE3ODU2ODAyNjR9.RTShsiae29bM3U8I1z3IO6N42Gp7LgpqGf05hdBafyw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzU0NjQsImV4cCI6MTc4NzY2NzQ2NH0.qaC3_09NdTn7Z2c7I3n9LBSRyMyqes7WFSdVdPsD9G8	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:17:44.035	2026-07-26 14:17:44.036	2026-07-26 14:17:44.036
ea7610f8-4119-4e88-a004-33fdbbfcc14e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1NTEzLCJleHAiOjE3ODU2ODAzMTN9.zzndbs4SotsfXtTxuyO-ksgoz9guI-NHIKpGokkOtLs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzU1MTMsImV4cCI6MTc4NzY2NzUxM30.dPe3EFp_2erohlocvdX2t8-J43uE7NxuB1OB1bs9jQo	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:18:33.296	2026-07-26 14:18:33.296	2026-07-26 14:18:33.296
e600ef4b-5cc6-42dd-bff2-49883c96d918	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1NTU5LCJleHAiOjE3ODU2ODAzNTl9.6G7Uan7KdM3NH03eKH-qiWIwxHnK7AbKvVTH0lp6vpA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzU1NTksImV4cCI6MTc4NzY2NzU1OX0.9tfnT1eZ1XeeSqUVzdlOzrFYHdI8NCC-jbMDn1gNNh8	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:19:19.861	2026-07-26 14:19:19.862	2026-07-26 14:19:19.862
9135827b-98d4-4432-80c6-19bdda601e4b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc1NzAzLCJleHAiOjE3ODU2ODA1MDN9.k5oRgztTnCViQn6aiG1cJhs8VYqPF8cibP8-_BA0Tss	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzU3MDMsImV4cCI6MTc4NzY2NzcwM30.lf0whrm6PRmZFROasWU3D4qzqCPeBb-pMyilRh1DaGM	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-02 14:21:43.681	2026-07-26 14:21:43.681	2026-07-26 14:21:43.681
80f1ad7e-729b-4580-8919-012401d4c4f2	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MDc5NTk5LCJleHAiOjE3ODU2ODQzOTl9.4hKwk84Ch0gigxcmCtq_Pv4GFcUQjWJsnmp__SwvlNQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUwNzk1OTksImV4cCI6MTc4NzY3MTU5OX0.BNt1m1kC_My2NP2X0TXf00C44QgxbN3rX0nacTmLejw	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-02 15:26:39.718	2026-07-26 15:26:39.719	2026-07-26 15:26:39.719
849563b3-b4cc-4076-bf64-502707b60f4d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE0MTQ1LCJleHAiOjE3ODU3MTg5NDV9.5vxEdZ0K7Dv1gTXI_AXAgF4ZpSAyQ8FZhpRiglk3JDY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTQxNDUsImV4cCI6MTc4NzcwNjE0NX0.m_-xhO6qGSzQrbaYB-GAKHTAE7NyfyLAVo4YKwctuGE	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-03 01:02:25.488	2026-07-27 01:02:25.489	2026-07-27 01:02:25.489
3c0b000d-a412-4c3a-9452-f5b4658f1daf	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE0MTY5LCJleHAiOjE3ODU3MTg5Njl9.rhBBIAaVJeesxOn_uNyeVZZG_62tL9iFl6yuMOuROZE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTQxNjksImV4cCI6MTc4NzcwNjE2OX0.VixwI-sdS9KhBNZH1WAlHzXJ_MDeJucdLKqsmv2JPHA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-03 01:02:49.488	2026-07-27 01:02:49.488	2026-07-27 01:02:49.488
064f15b1-3de3-4852-8ce3-bec3872aa71e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE0MTgzLCJleHAiOjE3ODU3MTg5ODN9.VltP2dH12LsIc9dpC_f4-fXVAjDbaWqXFyhse_N1MKU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTQxODMsImV4cCI6MTc4NzcwNjE4M30.PoPAQt0eNuFsml4jNKy_2wZBsb_HHZ9bjffGSrSxH24	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-03 01:03:03.439	2026-07-27 01:03:03.44	2026-07-27 01:03:03.44
e0292cb4-8098-4321-aa04-5e56db1f0e02	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE0MjY0LCJleHAiOjE3ODU3MTkwNjR9.uAUhD6tpv4QQBQQ178UelBtp37rnIoJncxc5aKPTHcQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTQyNjQsImV4cCI6MTc4NzcwNjI2NH0.4DGi96Hz2dGwr1dyrMoYMWhQXyBFDW-Ublf6DRgHdJA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"Python-urllib/3.11"}	::ffff:127.0.0.1	Python-urllib/3.11	2026-08-03 01:04:24.282	2026-07-27 01:04:24.283	2026-07-27 01:04:24.283
98015727-c98b-4548-9425-ea912d4e8170	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE3NTE4LCJleHAiOjE3ODU3MjIzMTh9.xo42Hm3dObBqNrZ7t9KplqnSwQtoPBe0nAjYXQD0Fyg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTc1MTgsImV4cCI6MTc4NzcwOTUxOH0.JKdb1QrFOyCdTOEkDc1CX-URyPZJTq-gbNp4i7bwWQo	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 01:58:38.5	2026-07-27 01:58:38.501	2026-07-27 01:58:38.501
27520c25-8282-418b-912c-be75ab82d068	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE3NTc3LCJleHAiOjE3ODU3MjIzNzd9.Jthsx8Pvb1B4t2oIm55TkX5qeql40MxlY3JfqruJVmA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTc1NzcsImV4cCI6MTc4NzcwOTU3N30.WDzO6jUHi0jrI6n5elhPup0wtu0gu-W7IwmrmrJ7bRk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 01:59:37.91	2026-07-27 01:59:37.911	2026-07-27 01:59:37.911
412be5f6-b45e-45e9-af10-2234c2337b45	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE4ODU4LCJleHAiOjE3ODU3MjM2NTh9.W4oryg5_xpnRzoc9sVsv9T2-UoKPDpG7FJmuD79kBog	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTg4NTgsImV4cCI6MTc4NzcxMDg1OH0.IJ8odu08zRP-lUdbXxXxxC-9spz98gkdqBNNQnUM3dc	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:20:58.109	2026-07-27 02:20:58.11	2026-07-27 02:20:58.11
400001db-a672-4345-8d9e-bdc96ee57392	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE4OTkxLCJleHAiOjE3ODU3MjM3OTF9.zUwPxuTYUhbU-SRPvaVEtt3ic6_NL4mn3Yz_KzAx52Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTg5OTEsImV4cCI6MTc4NzcxMDk5MX0.3imD3LWczkYHf0d1iFF4AliVmpYTgXrq04-aakFJCB0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:23:11.508	2026-07-27 02:23:11.509	2026-07-27 02:23:11.509
31539912-2b70-47d4-be65-7fecb9206610	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTE5MTI4LCJleHAiOjE3ODU3MjM5Mjh9.g95sXFqQjleVhJS7abiueC2Dpl-YQsFuirNbPqqbNTk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMTkxMjgsImV4cCI6MTc4NzcxMTEyOH0.uhLfZthQolT0sTvDgtQDhQDI0Zo7P7Bs6GNOBfHheaY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:25:28.347	2026-07-27 02:25:28.348	2026-07-27 02:25:28.348
5879051f-4c0f-411b-9521-431452767982	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIwMjg1LCJleHAiOjE3ODU3MjUwODV9.Wjz_zQSfls5xqLsuJggCarTlnOrgpfSxJqVcZaqKOWM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjAyODUsImV4cCI6MTc4NzcxMjI4NX0.DBiaJMZE0iAlM4MOeY0sx94Gq3E5A5IzFsVoAzOLMZ8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:44:45.54	2026-07-27 02:44:45.541	2026-07-27 02:44:45.541
4bf25d06-dfdb-454b-8b53-a5ab2695bb4c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIwMzA3LCJleHAiOjE3ODU3MjUxMDd9.7qwnV6Y7mLHGHPIfIBhd7unMlPTnEz1jKL0jPI19J88	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjAzMDcsImV4cCI6MTc4NzcxMjMwN30.U87nSWAVZly4nypshTRu-6KVr74B5ehlN0cQppawSVE	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:45:07.311	2026-07-27 02:45:07.312	2026-07-27 02:45:07.312
9f16bc78-a1ab-41e1-b1f8-e3c32b420143	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIwMzM4LCJleHAiOjE3ODU3MjUxMzh9.IjhlKoc5lPK1NPdww1_HuCYMVCh_O7qFO53BfhRMzhA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjAzMzgsImV4cCI6MTc4NzcxMjMzOH0.Am8SNSBpDGrIfd1CA_xmZvBLxfA8Cpy1DFabXs2w_0Q	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:45:38.472	2026-07-27 02:45:38.473	2026-07-27 02:45:38.473
a2422c14-523a-4b20-80ee-b5ee8393dcec	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIwNDIwLCJleHAiOjE3ODU3MjUyMjB9.TkarZVwiFjrr8EzA-zslSaKDLvqS6d-IvhXjqkVuExU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjA0MjAsImV4cCI6MTc4NzcxMjQyMH0.0ECmnkzGdNS2A_uN1_3TbSO6mUtoTHHELZx7q82SCaA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:47:00.935	2026-07-27 02:47:00.935	2026-07-27 02:47:00.935
1aacc858-9ae7-4708-9b91-63254c581069	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIwNTczLCJleHAiOjE3ODU3MjUzNzN9.hqRyrW8BvutXd_aSLf71Ftvu2HPPKMFqistlmUHO7VM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjA1NzMsImV4cCI6MTc4NzcxMjU3M30.DCf6rQdpvZGbG5pWCo_6M5XtAylQHuA4SkHV3MkZgko	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 02:49:33.622	2026-07-27 02:49:33.623	2026-07-27 02:49:33.623
43093790-f390-4ea6-a526-a89e4a970cfe	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIxMjA4LCJleHAiOjE3ODU3MjYwMDh9.ICP7Y0cIyqTUWRE-zSQ3c0DtJ9CHCGG7qn-2vE2P914	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjEyMDgsImV4cCI6MTc4NzcxMzIwOH0.5ezYXMRwnoFB5Kk1W6T8YZOrD42uEDMVnRxQk_raKyg	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:00:08.756	2026-07-27 03:00:08.757	2026-07-27 03:00:08.757
8d8ca81c-f019-4ddf-aa05-a6c91101486d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIyOTY5LCJleHAiOjE3ODU3Mjc3Njl9._3rdSJHIirnEn866lgekGucdhD6NdNzzOSoyCK83Rgw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjI5NjksImV4cCI6MTc4NzcxNDk2OX0.o10ohSn8l31kAUeeFj7ntSQlIkLCI7guoDPS8B89ud4	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-03 03:29:29.702	2026-07-27 03:29:29.702	2026-07-27 03:29:29.702
4fd5a7da-1c7d-458e-822b-65e80c445cf9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTIzOTE5LCJleHAiOjE3ODU3Mjg3MTl9.9BV0ulda6oLPAdGknW2BP-cW1ld-Un-vfe1Q1VCE_js	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjM5MTksImV4cCI6MTc4NzcxNTkxOX0.KXy1dnxp4d3bPSnPC26uMOHZf8UkSorER4YVhnALlbE	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 03:45:19.814	2026-07-27 03:45:19.815	2026-07-27 03:45:19.815
c279df2e-977c-4d04-8721-59088e847509	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0MTY5LCJleHAiOjE3ODU3Mjg5Njl9.gM0wNUWDsRPnJqs7QNHHUjodhqGb-KuX8PlGwICF4Kk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQxNjksImV4cCI6MTc4NzcxNjE2OX0.QtIGqz75fQR9e22u5-TKC9BiLIAvhUI60JsZsU3b2xk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:49:29.781	2026-07-27 03:49:29.782	2026-07-27 03:49:29.782
e543b474-a5b9-464f-a31e-414152534c5e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0MTcwLCJleHAiOjE3ODU3Mjg5NzB9.C4glf1mgfPOAq3xtRzV_y3G-Z6Uzwj1xVOyvFeRYgrs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQxNzAsImV4cCI6MTc4NzcxNjE3MH0.kARbb_d4yViu7-WTV07O-I-tFwlAiZpx6I5CTOLr4VQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:49:30.072	2026-07-27 03:49:30.073	2026-07-27 03:49:30.073
931161f4-c2d5-42d9-a346-e6076ee778e1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0Mjc2LCJleHAiOjE3ODU3MjkwNzZ9.d8lhdq9CGkOmMHpWcRl1h26m9t93CUOI9ulxdMkWeJo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQyNzYsImV4cCI6MTc4NzcxNjI3Nn0.rULPLsVo6ApgJY4FtZIqAOOF8bgbIVyJ2VylbqDa6I0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:51:16.486	2026-07-27 03:51:16.487	2026-07-27 03:51:16.487
ba87a104-c087-4567-99ff-16821fe4bd8c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0MzI2LCJleHAiOjE3ODU3MjkxMjZ9.1gpUn9ogpK-dY5iUXvEdfhG_Ttfvg4vbA3VXY_-mf4w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQzMjYsImV4cCI6MTc4NzcxNjMyNn0.nqpyNhCj0XuA_dA_naIHQBJ18kWdo3YvmHJHkvWe5tY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:52:06.979	2026-07-27 03:52:06.979	2026-07-27 03:52:06.979
1ee97f3b-17ee-409a-b1ef-702d72b2d95d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0MzMzLCJleHAiOjE3ODU3MjkxMzN9.lplVAMsDlKKJWHa5jLhY-RaCtOpaud9oJ4oO0JWyqVs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQzMzMsImV4cCI6MTc4NzcxNjMzM30.l9A0CxiIU1SLLClsNiiq5awREiQUk0yG7i1GZsmwxT0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:52:13.087	2026-07-27 03:52:13.087	2026-07-27 03:52:13.087
df3fa08c-f553-490c-8a26-a21cec456b2b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0NTQyLCJleHAiOjE3ODU3MjkzNDJ9.1l7vxDsJ1sKKhb_wz_MT02mYlZDFbXiSVOu-_SkIbaQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQ1NDIsImV4cCI6MTc4NzcxNjU0Mn0.H5wY3U5Em0Et0Ixj1RLQ4aQ3aHaKvw0YHZuS-73f_oU	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:55:42.06	2026-07-27 03:55:42.06	2026-07-27 03:55:42.06
ac4ac36b-f6c8-450f-98bc-268f409f3faa	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI0NjA3LCJleHAiOjE3ODU3Mjk0MDd9.ryJyKVl0zqRZ1qZT_KlkyaOYv-frqhJPwq7XUduaNa0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjQ2MDcsImV4cCI6MTc4NzcxNjYwN30.vMcR3U8iqrpdIxoGmzGUQlzPWsBDKxowcP7s9_M9wQQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 03:56:47.035	2026-07-27 03:56:47.036	2026-07-27 03:56:47.036
c9f67105-c8e4-4ebf-ba61-2482d6d1f3bc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI2Mzk3LCJleHAiOjE3ODU3MzExOTd9.roF5CyF5rvgQMm1ICVPgyplEI4SJoqtEahNFD1CnZKw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjYzOTcsImV4cCI6MTc4NzcxODM5N30.6YcerfxzVmc5DxTRl4q1o4wZUV8q-pj9JcjNkQdeSpI	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 04:26:37.896	2026-07-27 04:26:37.897	2026-07-27 04:26:37.897
4a46424a-fa1c-470d-a208-a8b7ed5fd2e2	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI2NDkyLCJleHAiOjE3ODU3MzEyOTJ9.-6Xl2DQxUCv3feHLv8s76UZZB15OXtoXOn7aFF3z0W4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjY0OTIsImV4cCI6MTc4NzcxODQ5Mn0.ik7hTHNhR-NTih37mIsWa1-QJU11XLSOu2onxoJ4kEk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 04:28:12.272	2026-07-27 04:28:12.273	2026-07-27 04:28:12.273
bba8ec7e-50c7-4ba5-ae00-c96a1d7cbadd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI2NTgzLCJleHAiOjE3ODU3MzEzODN9.yFwsQhnGMD2_I2NKKvYc8ZrEEpKKoSFNFOK-rtkR3cY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjY1ODMsImV4cCI6MTc4NzcxODU4M30.09-erYU1VTnHbd1vUW8lh38p29dGywNcYb-GsZqiCCU	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 04:29:43.308	2026-07-27 04:29:43.31	2026-07-27 04:29:43.31
4438d64a-369b-42d8-8ba4-0688f287ee17	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTI2NzQ4LCJleHAiOjE3ODU3MzE1NDh9.U9U6DdF8EEHYMoKiUOB9uPDre06K-54hjUDLBE13rn4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxMjY3NDgsImV4cCI6MTc4NzcxODc0OH0.90sYe7sWVKspVU8D-V1-0-Qz1mhe41PWMpKPc8CmzB4	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 04:32:28.791	2026-07-27 04:32:28.792	2026-07-27 04:32:28.792
72420497-4143-4db4-bc32-7f6ba45f998f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTQ2MjA1LCJleHAiOjE3ODU3NTEwMDV9.8Oyzws901zYpafx8XfoyDXKQTGS0gG6sfAFGzaFTJAU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNDYyMDUsImV4cCI6MTc4NzczODIwNX0.3Q40KE2SqrCfcqywXjh1Gcbc3ZNR_dtrOd96ZHgr60Y	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-03 09:56:45.988	2026-07-27 09:56:45.988	2026-07-27 09:56:45.988
f8007611-37c9-4efc-867d-9413282ca6d7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTQ5NTc5LCJleHAiOjE3ODU3NTQzNzl9.CQo12Q__-0z5B4YhvDCw0ylWKNqRQEebUwKuOUMkOg4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNDk1NzksImV4cCI6MTc4Nzc0MTU3OX0.xrBwZGzdh5eN6IhgbPatX1rsEEu44ihI0mvs8AmEJr8	{"ipAddress":"::1","userAgent":"Python-urllib/3.11"}	::1	Python-urllib/3.11	2026-08-03 10:52:59.584	2026-07-27 10:52:59.585	2026-07-27 10:52:59.585
b87b193c-6dc8-4348-b02d-b2bece67dccd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTQ5NjI3LCJleHAiOjE3ODU3NTQ0Mjd9.wTxiy3MZDMVHmIVnNPoJ77StGQL-RoOdiRJ5V1jEK90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNDk2MjcsImV4cCI6MTc4Nzc0MTYyN30.1T33mrGZ4Ao_RgurqSKQo0dgaBNHi5x75BGY7HXlhxo	{"ipAddress":"::1","userAgent":"Python-urllib/3.11"}	::1	Python-urllib/3.11	2026-08-03 10:53:47.384	2026-07-27 10:53:47.385	2026-07-27 10:53:47.385
694baf67-58a4-42c5-8aeb-bddfdbfa058b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTQ5NjY3LCJleHAiOjE3ODU3NTQ0Njd9.8uqOSWfVOSSawWMLSMNqNZM3PvvDDxl0e4a73lHFX9w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNDk2NjcsImV4cCI6MTc4Nzc0MTY2N30.UowcyyNeim0qfjvuCq8gU8O6uWhA0YI0WB6PL5wctVY	{"ipAddress":"::1","userAgent":"Python-urllib/3.11"}	::1	Python-urllib/3.11	2026-08-03 10:54:27.52	2026-07-27 10:54:27.521	2026-07-27 10:54:27.521
b55eb385-4b34-4032-a4b7-b26853924549	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTUxMzkzLCJleHAiOjE3ODU3NTYxOTN9.A7VOWymhxz9HJS7_sya_A2hylgQ28AqCb1Tk-31-bRI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTEzOTMsImV4cCI6MTc4Nzc0MzM5M30.m-TrREn-3OLtJtUnc1XWkx5Yz8Yvk8XntKmYKaSvRUc	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.7922.34 Safari/537.36	2026-08-03 11:23:13.893	2026-07-27 11:23:13.894	2026-07-27 11:23:13.894
f9250712-268e-484c-8139-b59c4ff7c3a1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwiaWF0IjoxNzg1MTU1MzQ1LCJleHAiOjE3ODU3NjAxNDV9.G8YxxbFnRLSbROFlP97GN6iHRgoYtjBULhMbV_Owjh4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTUzNDUsImV4cCI6MTc4Nzc0NzM0NX0.NL2TkQjDFAy6re904a4tvpRpA-bmoaWWAqWPHZr2CrE	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 12:29:05.968	2026-07-27 12:29:05.969	2026-07-27 12:29:05.969
3e942429-357f-4d06-8ec7-3348fcb84e15	8386f81b-0baa-4e88-aa90-d6e394fb8ebf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4Mzg2ZjgxYi0wYmFhLTRlODgtYWE5MC1kNmUzOTRmYjhlYmYiLCJ1bmlxdWVJZCI6IllEMDIzRkIyRjEzRjZGIiwiaWF0IjoxNzg1MTU3NzI5LCJleHAiOjE3ODU3NjI1Mjl9.QPrIggytWZdq7loaZayVYv77nWTqbGW5a031zPnX4u0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4Mzg2ZjgxYi0wYmFhLTRlODgtYWE5MC1kNmUzOTRmYjhlYmYiLCJ1bmlxdWVJZCI6IllEMDIzRkIyRjEzRjZGIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTc3MjksImV4cCI6MTc4Nzc0OTcyOX0.9OZyYY9JRhXQtWXjv1i_hIP4ndEN7lVHGSny8m-a3ec	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 13:08:49.513	2026-07-27 13:08:49.514	2026-07-27 13:08:49.514
f3ab2e94-caaa-4cbf-9704-30e1239fd858	c07cd9b6-3a93-475e-8f27-3fa34ce4a019	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDdjZDliNi0zYTkzLTQ3NWUtOGYyNy0zZmEzNGNlNGEwMTkiLCJ1bmlxdWVJZCI6IllERjYwRkUyQ0M5RjNEIiwiaWF0IjoxNzg1MTU3NzI5LCJleHAiOjE3ODU3NjI1Mjl9.XQvKicTYaIPWkIGfpwNzA6c72jo3nvsmRZ-_B-n6T3I	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDdjZDliNi0zYTkzLTQ3NWUtOGYyNy0zZmEzNGNlNGEwMTkiLCJ1bmlxdWVJZCI6IllERjYwRkUyQ0M5RjNEIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTc3MjksImV4cCI6MTc4Nzc0OTcyOX0.fcFxYLbBcnltsS0A8QTRDKS5vTF4KEHoVU_bMF6cdIY	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 13:08:49.672	2026-07-27 13:08:49.673	2026-07-27 13:08:49.673
17154012-fdc5-4e60-95f4-d5898bd62293	8386f81b-0baa-4e88-aa90-d6e394fb8ebf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4Mzg2ZjgxYi0wYmFhLTRlODgtYWE5MC1kNmUzOTRmYjhlYmYiLCJ1bmlxdWVJZCI6IllEMDIzRkIyRjEzRjZGIiwiaWF0IjoxNzg1MTU3ODEwLCJleHAiOjE3ODU3NjI2MTB9.VNzyboAOawIzBY0J7NyRyHGUiR6sk5kwC67wXjBSFkA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4Mzg2ZjgxYi0wYmFhLTRlODgtYWE5MC1kNmUzOTRmYjhlYmYiLCJ1bmlxdWVJZCI6IllEMDIzRkIyRjEzRjZGIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTc4MTAsImV4cCI6MTc4Nzc0OTgxMH0.Ga-J6aTDvBxZuOAIWvN0BLP4RRMyv9p9k9fw7ZdbQ0U	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 13:10:10.952	2026-07-27 13:10:10.953	2026-07-27 13:10:10.953
96fec020-4ee1-40e2-8803-1b4f6e5a2b20	c07cd9b6-3a93-475e-8f27-3fa34ce4a019	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDdjZDliNi0zYTkzLTQ3NWUtOGYyNy0zZmEzNGNlNGEwMTkiLCJ1bmlxdWVJZCI6IllERjYwRkUyQ0M5RjNEIiwiaWF0IjoxNzg1MTU3ODExLCJleHAiOjE3ODU3NjI2MTF9.iAs38b5GVKkeJPghXwCSBez30Dqwyq1__PK7_qPWWsc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDdjZDliNi0zYTkzLTQ3NWUtOGYyNy0zZmEzNGNlNGEwMTkiLCJ1bmlxdWVJZCI6IllERjYwRkUyQ0M5RjNEIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3ODUxNTc4MTEsImV4cCI6MTc4Nzc0OTgxMX0.2RK2znDEq8_o5lQLivFoZwelRTHjxFwTFAqoukARO2A	{"ipAddress":"82.156.228.87","userAgent":"curl/8.4.0"}	82.156.228.87	curl/8.4.0	2026-08-03 13:10:11.121	2026-07-27 13:10:11.122	2026-07-27 13:10:11.122
57a238da-5d2c-4cd2-b7bb-a62c0a6aa976	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJiMGY0MmNmMjcwZjY3NGI0NDQ4NTI5OTQiLCJpYXQiOjE3ODUxNjE0NDgsImV4cCI6MTc4NTc2NjI0OH0.ZOYZvKPyxiM0LRgzL6235rGaUf0kKHE3Nxw9JuODmVg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjFmZTM5NTdlZDRhYWFlN2I3Zjc0NjExNiIsImlhdCI6MTc4NTE2MTQ0OCwiZXhwIjoxNzg3NzUzNDQ4fQ.4KjhdIEPe13tM6ZziC61oY1wpuDsPqvHp2_TFd8SnpI	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:10:48.387	2026-07-27 14:10:48.388	2026-07-27 14:10:48.388
115302d5-2754-4078-b08c-a14bc6531703	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJiMWMxZjIxZTdjYWRmY2Q3NTA1OTllMGQiLCJpYXQiOjE3ODUxNjE3NTQsImV4cCI6MTc4NTc2NjU1NH0.9LAoCYsbrC26YF2vvdllhLYxbfR-_QqPe4jKHuEI9xk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjgwOTY0MmU3NWM0ODdlNmY1ODJiNzA2ZSIsImlhdCI6MTc4NTE2MTc1NCwiZXhwIjoxNzg3NzUzNzU0fQ.y2X1PjlhmTiwdwXM5I_taQiD--e15QsAEa_GlS0jZBg	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:54.282	2026-07-27 14:15:54.283	2026-07-27 14:15:54.283
ef817df6-c1a4-4a88-b6da-0e38cb88e887	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGNjMDgwMTdhMDIwOTY1MTQzODY5M2I0IiwiaWF0IjoxNzg1MTYxNzU0LCJleHAiOjE3ODU3NjY1NTR9.aB8iMJsLiex7pwun5rGRZoY6Mj9ozb3YPsrgB7aWOCo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5MTA0MWJlYmMzZTFmYmJmNDExY2JkNTEiLCJpYXQiOjE3ODUxNjE3NTQsImV4cCI6MTc4Nzc1Mzc1NH0.rFimZBR4NGLoVieVHQgG9tOEIkpXva-4wNl3xt9uCsc	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:54.476	2026-07-27 14:15:54.477	2026-07-27 14:15:54.477
f4642600-228d-4e43-8da1-6096c5c521a2	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJlYjk4MjNiNTM4NjJkNTBkYzBmZDA4ZjIiLCJpYXQiOjE3ODUxNjE3NTUsImV4cCI6MTc4NTc2NjU1NX0.jC4gYufJE4jhAKWwOvhD_TZfNnaWe7-CjTNVurs3FwM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjRhYmZlZWU5ZmFiYWU4MDI5OGZlNGVmMSIsImlhdCI6MTc4NTE2MTc1NSwiZXhwIjoxNzg3NzUzNzU1fQ.qZwkcU9m-EnyqCLvpwn7xpHpSoFHKwN2HW7zBCBr9dk	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:55.126	2026-07-27 14:15:55.127	2026-07-27 14:15:55.127
25602328-9a9c-4569-80ec-7548cb7d29c5	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJlNWJlNzk0NTZhZmVlMzBiZTI1ZDUzYTMiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.5SDHLngDI9BZBW9eYqV6xYCJiOMpCYRBDGHqZLmAQQ8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjQxYmViYjdkMWI4ODg5ZDllNzkxOGYxYiIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.Ahfu4WSmfxSDmdEzg8AhrwDQQzh6RC0-NHjYJzdkhSg	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.705	2026-07-27 14:15:56.706	2026-07-27 14:15:56.706
1b2195e8-132b-48eb-8a84-5634b7649dc7	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI5Njg0ZDRlYTc5MzllYjdkNmUxOWI5NjUiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.O9ZXo4DImS7ABnifO7a-kMuQxW0MBojb0TaZee2xT3k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImMyMzdkODA5MDE0Y2RkZjQ3NmY2MjY5YiIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.EjhZQU3MWCywQFb143S4BVRpnQaMvqzZfta5NFsSt1A	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.706	2026-07-27 14:15:56.707	2026-07-27 14:15:56.707
f49f2109-5f76-458c-8540-09cdf6f23a92	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI5N2Y5NmRmNjUyODY2ZmQxMDVjZGE4YWIiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.XgsCTL2EHwDzw2N_Lj5DX5u3v3URCn1v7-A_XJPV3mk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImYzYjRhMmVlMWExYzA3MmIwNTRiYjA2ZCIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.YOx6SX571pra-ghbXeQR_mjrUjQYhkr5uF1YdrRvhm8	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.707	2026-07-27 14:15:56.708	2026-07-27 14:15:56.708
81601bec-8f34-4466-8929-1f17d177341e	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI1NGRmYzEzODhkM2FhZjQ5ZDVhNGMwZmYiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.Gwiehpi2X49NONe-Vc8hhGRamaqR7BuLdNgeOdTC_H8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImM3MjEzMGJjNmJhNmEyNDk3YjRiZWFmNCIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.Pss_m7DEjJ_8cR6tRBmJIpxm-7D3gILQ1YpJLTqLBpI	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.707	2026-07-27 14:15:56.709	2026-07-27 14:15:56.709
4e3980f3-3ad1-44bd-9b36-2b38e6963a02	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIxNTQxOWQ5NjkwOWJjZmIzOGEyNjQ1NGMiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.igDmtgR1rAGSgeTEAf7x42tkjS9a-mWJXp8SJtqVreg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjUyMzIyZGY5MTcwN2FkOGJkZjU1MGU0YiIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.CM0VRLil9hrfKsVzqTQNARqpeSjkjmv5njzqWcnND-0	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.754	2026-07-27 14:15:56.754	2026-07-27 14:15:56.754
98ee0072-bb49-4141-9b90-9826760350cf	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI1NGJhNTFmZGVlZTA3NGVhNmQwZGFhNTIiLCJpYXQiOjE3ODUxNjE3NTYsImV4cCI6MTc4NTc2NjU1Nn0.86TUL8Riub1F7Toce_4frfrQMi53D8zFcvqmCC7V3is	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjkzZjY2ZjYxMjA0ZWI3NmIzYTFiMGRjNSIsImlhdCI6MTc4NTE2MTc1NiwiZXhwIjoxNzg3NzUzNzU2fQ.9T5Sb8YwBXWhVdSFR-w_MQdZhoyBFV6DKFGv_KxDOtE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 14:15:56.755	2026-07-27 14:15:56.758	2026-07-27 14:15:56.758
777bbeb5-5cc7-4ac4-8c41-fad34187c1f9	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyN2YzNDZhODRlMjNiMDE1YTViMDgwNTIiLCJpYXQiOjE3ODUxNjUyNzYsImV4cCI6MTc4NTc3MDA3Nn0.6mjSEWb6Zxjbbe1AWYol83sLo3PJACbcMTpoxx_F1do	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjA0NTA3MjliNjA3NzdlNTcyMGY3MzFhYyIsImlhdCI6MTc4NTE2NTI3NiwiZXhwIjoxNzg3NzU3Mjc2fQ.dCaXcMgTfZo9exjaJPhDylhhkMtjHnSzd5VshDgAob8	\N	\N	\N	2026-08-03 15:14:36.985	2026-07-27 15:14:36.986	2026-07-27 15:14:36.986
25d33574-0b8b-479b-b736-bf449198d2d3	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIxMGYyYWFmYWI3MTUyYmI0MzljZmQyZWEiLCJpYXQiOjE3ODUxNjUyNzcsImV4cCI6MTc4NTc3MDA3N30.-S17SHsQocqODzp-I2x0iiNR550zcYvgr0KQRmj-kBo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImFkMmNjYjA0YjBkOWY3MTQ3NTE5YjM0OSIsImlhdCI6MTc4NTE2NTI3NywiZXhwIjoxNzg3NzU3Mjc3fQ.Smz437AoEYcSkzXPXfHpxV1CHTqBI2D6BHPJjxpoQeI	\N	\N	\N	2026-08-03 15:14:37.312	2026-07-27 15:14:37.313	2026-07-27 15:14:37.313
5c64573a-e44d-4126-8c25-2f78a0de5cc5	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJjN2E4NDJmNTZmYmFiZTE0NWVmYWFiMDciLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.AnlI6DBwSYYnfc2Uuy_w8zE9M9Cd75cGVQfGFEH420M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImRjYjM3NmIwYmY5YTkwNzM5ZWNjNjA1OSIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.Nu8q3NO1OytnN0ae62HHQPLl_zE5Rz158EBr5pFDOM8	\N	\N	\N	2026-08-03 15:14:39.88	2026-07-27 15:14:39.881	2026-07-27 15:14:39.881
909de05e-2d51-44c7-8478-a05fa0ce4528	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyOTRmNWJkZDg1M2ZlMmY1ZGNjMmExNGUiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.dDjkeLUicYfphtWiu6xCSiON5o5RbGVOp9d7BZKsGbk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjFjYWJkZmU3YTBiN2QxMmQyNTY3MWNlYSIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.gMsmsyyTOW-XRaa0aqN-r1C8MJXBBA4oFV7RxxAhVe8	\N	\N	\N	2026-08-03 15:14:39.881	2026-07-27 15:14:39.881	2026-07-27 15:14:39.881
c7f04a26-3e17-4f37-8b1d-06af12394536	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJmOTMxMTc4ZGIwN2ZmMWRkODRkNzU1N2QiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.KufAEaDcUpGzZ_Px23-83px7QuwhZ3jHO-PUVU_WL9c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjEzYmM5NmNjNzdjYjc4ODE4ZjI0ZDA2NyIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.FoII1Au9CvwR7nSHPoS1OP009Kcv0BDeiNNbhdCpDT0	\N	\N	\N	2026-08-03 15:14:39.883	2026-07-27 15:14:39.884	2026-07-27 15:14:39.884
8d9fa835-6688-4cbb-aaed-6615f0da2dd4	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI3OTIzYjU4YTdiZGE3YWI2ZjMxZDQyNTUiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.7HdbFd6dtmYQdEbVMrQncb1PNG8VHKIdA5jMHWUP080	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImVjZTlkNzMwOTJmN2E3ZWFhOTQwMTQ2NCIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.W4t2ELmATn6ol3LBXQBCMrQGJ8zIPsJ_QI3W0owMCs8	\N	\N	\N	2026-08-03 15:14:39.884	2026-07-27 15:14:39.885	2026-07-27 15:14:39.885
c984b286-763f-4da2-8397-f63b4ea555fe	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyNzAxNDhkNzhmYzE2M2M2ODZjMDc1ODQiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.U5B5Igy3wf5FgnsJ701BKyFcUbQuYR0aXE6wpShCLyE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImYwNmQwYzFhZjAwZjAxYTg5ZDEwNThhMyIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.rDx7FGwtwboGtTfgOcXldNaq46sWjturPztQWZ0NMxU	\N	\N	\N	2026-08-03 15:14:39.884	2026-07-27 15:14:39.885	2026-07-27 15:14:39.885
0b1abbf6-927d-45e6-a96c-2da025b8339a	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIzN2NlZGZkYzhlM2ZlZjAyYWQ0OGYxMWUiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.YvhPePWjMUOMV4y0o9smEN_-RP-W9YbSENZD5JxJdIU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjZiYzAzM2NjZjhmYjNmZjk3OTgzZGE1NiIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.HmsNxqojz3m2yny4Do6TxnvXoszzFCFgG2ub65VOaZ4	\N	\N	\N	2026-08-03 15:14:39.886	2026-07-27 15:14:39.887	2026-07-27 15:14:39.887
e4c96e9e-e20c-4da6-b524-ab5fee1cff40	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIxY2JkN2Y1NDRiNjMzYWZlMmU5OGEyMDkiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.GF3SatZ8SNR_kBPeWEVukhqIH-uJece6UTUYGEWSjvY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImZiZDhiODMxNGYyMzhlNjcxYjg5YzM3YyIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.zcyJdtj8j8P8pgioKBaZi_Z5T_7PyZkgEe0juAXPo5E	\N	\N	\N	2026-08-03 15:14:39.886	2026-07-27 15:14:39.887	2026-07-27 15:14:39.887
de722a42-f86e-44d8-ad34-98a01642e24d	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIwNDI0NTYwMjMyNjczN2YzNDJhMDllMWIiLCJpYXQiOjE3ODUxNjUyNzksImV4cCI6MTc4NTc3MDA3OX0.tMwzKtzolEprjR_4SbsdgG4jSm8U3BFqWrN7nO_7gZo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImZkNTRlZDVjYzBmNGQ4ODk2Mzc1OGM0MCIsImlhdCI6MTc4NTE2NTI3OSwiZXhwIjoxNzg3NzU3Mjc5fQ.nAKnNFma9sp_IEczIpjZlTLmZ0iDGSDB2dFW3_0k_Rw	\N	\N	\N	2026-08-03 15:14:39.887	2026-07-27 15:14:39.888	2026-07-27 15:14:39.888
840f85b6-2c8e-4dad-ba25-6e5734be967f	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyN2ViZTU4YTk5MTlhOTNkM2RmNjEyOTAiLCJpYXQiOjE3ODUxNjU0MDksImV4cCI6MTc4NTc3MDIwOX0.26V0d4a8ZNpnm0Frq0ePVuImFqMKOLqyB1apSUvdvVo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6Ijc2MzE0NGM0YTViY2I0ZmEwNjBhODZjMyIsImlhdCI6MTc4NTE2NTQwOSwiZXhwIjoxNzg3NzU3NDA5fQ.tCNHLq4hqc6lpWXst0o1vJYdIrOD1fWvZ-O8m51aaWk	\N	\N	\N	2026-08-03 15:16:49.542	2026-07-27 15:16:49.543	2026-07-27 15:16:49.543
6dbb7115-77c3-4330-a23b-ca50e5bf6b0d	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI2YmI5NWFmNGUzY2M4Zjg4OGM3NDRkYTkiLCJpYXQiOjE3ODUxNjU0MDksImV4cCI6MTc4NTc3MDIwOX0.v0Unnp7BZEMKc_WtpgUEyfLmQlxyloZKqUGeuaapAe0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjM2MGYyOTQwNmViNDM1ODczNTMxZjI5NyIsImlhdCI6MTc4NTE2NTQwOSwiZXhwIjoxNzg3NzU3NDA5fQ.X9BXPEF2jBB6i7nKnddAKTgkLovZ7asDsiFbCd2NiUE	\N	\N	\N	2026-08-03 15:16:49.863	2026-07-27 15:16:49.864	2026-07-27 15:16:49.864
9811e1e9-0ff1-47a1-8360-d7bad107743f	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyOGE2NDA0ZWE0YzY4NTM2YzY3NDdjMzIiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.V0yVXLjXN_JCI9gQe2owgwWjLNnqwhv4thk5OFkBMNo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImU1YTkwMGM3NGM4OGE2NmY4ZmYyOTEyMiIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.92c3jGtv9Slk7Is5De0-43HQxHYf-ETPUyqCwb0RjLg	\N	\N	\N	2026-08-03 15:16:52.408	2026-07-27 15:16:52.409	2026-07-27 15:16:52.409
26631170-cb6d-429c-9c3d-afba00eeb7c6	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI0YTU0NGYxZjNhZjgxN2ExNjA1NzQ0MTUiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.L_hjMACDZ8af81zkaYuBml9fl3GbzQJEwEb3MihA7vY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjAxN2JmYmNjZTIxNjBhNTIzZWE4NTc4NCIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.k7plE4prkDVdwdCb0StpeCWgg-mbCOtl47TX7BtIa5k	\N	\N	\N	2026-08-03 15:16:52.409	2026-07-27 15:16:52.41	2026-07-27 15:16:52.41
a05339e9-9f9b-4026-83b1-fac83d574c50	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIyOGYxMTI3NGQ1YjNmOTZiMzAyNjE0ZWEiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.wQ8uLBS2T3l2Mual-iQCbk1_fzgzyt-g9TBNU0u_AZE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjRlOWZiNmEwMjk0MjIzMDZlMDM1OGIzMCIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.ds8sqy-Pw-KSM8FqZJFcZBMPlAzpTMvfoGbsUBmG6SA	\N	\N	\N	2026-08-03 15:16:52.41	2026-07-27 15:16:52.411	2026-07-27 15:16:52.411
562d9d18-033a-40de-a8ed-e23a61be936d	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJkNTdiMmUxN2I3ZjM3NmM3ZjQ1ZWRjMDgiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.ZJ4dEVuTu_eC8Vs2cDqpqrwoDxr-1JEQbFFPnojiI9A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImMxY2I5NDdjZDM3YzU3ZjUzYmQ5OTY4ZCIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.l_5XGpOHRrrMIa2kAloUpzv81xlzsGo-WHFXdXUamLo	\N	\N	\N	2026-08-03 15:16:52.411	2026-07-27 15:16:52.412	2026-07-27 15:16:52.412
10483a59-6708-473c-a03f-344e80e42a34	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJkNjZjMjYzZDBmOTFjZTJkOGZkMTE2MGEiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.aoruGuSTtk5Svc9Cma_1591jjMwt5nVrU7yYZWBRItk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjRlZDIwNTU3M2I3NmE5MmIwNDhhZmU0NiIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.A8y0vduCfMhCW2v-HBsC60vA6d_AQ-bv31FhrjNGqaY	\N	\N	\N	2026-08-03 15:16:52.411	2026-07-27 15:16:52.412	2026-07-27 15:16:52.412
44b76631-5e30-4bc3-88de-b4faedc6f2f5	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI4ODMyMTk5ZjE2OWNhNWQ1ZTdjZWQyYzMiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.jIvrTBWvI0mryLmT2wjjR-Oz2z4JImmMvyZwBy6RWmA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6Ijk3MjE4ZGU1ZDBmZmU2NDg2YTRhMDZhNCIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.4O_k8AN_Ju_HlXw26KE5aLfwml4GL9N2L5KQ7Xs46cE	\N	\N	\N	2026-08-03 15:16:52.412	2026-07-27 15:16:52.413	2026-07-27 15:16:52.413
fbd7475a-0df5-430a-b0be-ad4b0a6a3a2d	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiIwZDQ5ZGFhNTUzZjRhNmMzMDI1MjJiYmMiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.DVtpyWeNTeAP5ILdoodIKh9Z0klSFLW0pQdCnvtWR7A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6Ijk2MTlhMjAxNDZlYWYxNjNjMTBlMzZhMCIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.I4RFcMwIl8-Z_2zgkCH9GsvwwvWe8uATlpfuD6RHaFk	\N	\N	\N	2026-08-03 15:16:52.416	2026-07-27 15:16:52.416	2026-07-27 15:16:52.416
de751ff4-7197-4a73-a997-446522bc1b7f	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiJlODVmMjllMmU2MDdhYTM5ZjA2ZjgxMGMiLCJpYXQiOjE3ODUxNjU0MTIsImV4cCI6MTc4NTc3MDIxMn0.6ImF3LoaKPrRJAHFpiuNTJRaOtZ2SoGAgt8MVmA4sF4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImQxNTU4NmIxOWE2OWMwNWRmNWIxMzA5NyIsImlhdCI6MTc4NTE2NTQxMiwiZXhwIjoxNzg3NzU3NDEyfQ.bVEQF3vq8BiDYt9LnfJf-QobUP1tB3yC1VKmZRyHbW4	\N	\N	\N	2026-08-03 15:16:52.416	2026-07-27 15:16:52.417	2026-07-27 15:16:52.417
ea946027-4394-44c8-8f4d-d234ed7034f5	5168bf3c-15c6-4d20-9268-0654d2ea5d4f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJqdGkiOiI3NjVkODc0MjdlOWFlOTFmMDczMTgwYzIiLCJpYXQiOjE3ODUxNjU0NzAsImV4cCI6MTc4NTc3MDI3MH0.75rO6HpUmz3tQsI5zaEan7GAaq44S_7IPBM2dRx4EAA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MTY4YmYzYy0xNWM2LTRkMjAtOTI2OC0wNjU0ZDJlYTVkNGYiLCJ1bmlxdWVJZCI6InRlc3RfYWRtaW4iLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjdjNDA0OWRkNDRlYTFkNDBhNzNhNGZiZCIsImlhdCI6MTc4NTE2NTQ3MCwiZXhwIjoxNzg3NzU3NDcwfQ.IyQTzMnn3gXPiBC--bos5lHyP8LLjW-60uHjFPBVrfg	\N	\N	\N	2026-08-03 15:17:50.571	2026-07-27 15:17:50.572	2026-07-27 15:17:50.572
3eb31fcb-a441-427e-9638-c48ab9eb25a8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDcxNjI4ZjQ5ODZhN2ZhY2NkYWZlYzljIiwiaWF0IjoxNzg1MTY5NjczLCJleHAiOjE3ODU3NzQ0NzN9.1CdB77jFEwuzPF4q0FMPMNwgNMUH5TUbT9ki4oV5qaw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxOTBhOWRhYTZkYWUxNzE4ZGE4ZGQyOGIiLCJpYXQiOjE3ODUxNjk2NzMsImV4cCI6MTc4Nzc2MTY3M30.B8_8HhYt-sqJjOmlhA6Sjdu2QkXHQfSLjc60v9V3ugY	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:27:53.788	2026-07-27 16:27:53.789	2026-07-27 16:27:53.789
bbc23532-b006-4c39-8ea6-7a3563e38e62	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMWI3OTYwMDExMWNiMDY3MzIxZDljN2FkIiwiaWF0IjoxNzg1MTY5NzAyLCJleHAiOjE3ODU3NzQ1MDJ9.69L-ZILME8kIEwbqq_Q84crxyR5S5ZS9TjLmkDSZbUg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzNDE2OTI3YWY1NmI5NGM1MDgwNWZkY2YiLCJpYXQiOjE3ODUxNjk3MDIsImV4cCI6MTc4Nzc2MTcwMn0.hPcBZUxuITnustsBMoUxYJV7s9yUtpmAufJwx6LOVjQ	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:28:22.17	2026-07-27 16:28:22.17	2026-07-27 16:28:22.17
e798a4fa-214d-41c5-af1c-96582399b004	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTIxMDMxZDE2NjIxN2RiYTg1ZmU4NWZkIiwiaWF0IjoxNzg1MTY5NzU2LCJleHAiOjE3ODU3NzQ1NTZ9.PW3FIWFEGPTqYEDEjM5p7FkicUuFm7VScPcZFrY_1jo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlN2QxNGIyZTMyMzYwNTFjNDVhNTg5NTkiLCJpYXQiOjE3ODUxNjk3NTYsImV4cCI6MTc4Nzc2MTc1Nn0.ZSqxaOPUWa-jc6d5B8Gfegxb7aNSUnnZyrORRPygWao	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:29:16.547	2026-07-27 16:29:16.547	2026-07-27 16:29:16.547
06ecf164-fe37-4cac-a911-6e1d08e33f2d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYWRiOWM3MzU2NmU3ZTAxNjcwMTU3ZGJkIiwiaWF0IjoxNzg1MTY5ODQzLCJleHAiOjE3ODU3NzQ2NDN9.Lmu9K98aFjoAx_GX7E6miSo0NDmUY4i6VauOykzKbt0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxNzUwZjc5YzdmZDY0MDZiNDVlNjVhOGEiLCJpYXQiOjE3ODUxNjk4NDMsImV4cCI6MTc4Nzc2MTg0M30.1cjJF0ezhSh3htdEAMOuDFBX6CevnmHxpg0p_OeHa1Y	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:30:43.339	2026-07-27 16:30:43.34	2026-07-27 16:30:43.34
68115675-af88-498c-920f-347dfc023629	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiODA4NTgyMzA2MmNhMThiOGQ1Yjg1YWExIiwiaWF0IjoxNzg1MTcwMTEwLCJleHAiOjE3ODU3NzQ5MTB9.FKK7lZCQPRv0Cm5aTip3xzBNH_BFFDkbq8979J5WbGU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlNmJlNTA2YmU3MTNlMGVmMjE2YzcxOGMiLCJpYXQiOjE3ODUxNzAxMTAsImV4cCI6MTc4Nzc2MjExMH0.JN6SBud0ciJDkDrmgimCsXqDIvInppnelI3A73ACApc	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:35:10.848	2026-07-27 16:35:10.849	2026-07-27 16:35:10.849
481ecb3c-4f57-4b9e-b5ad-d9c69c088adc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDY2MmEwYzQ0ZGUzM2NjM2I5YmExMWNlIiwiaWF0IjoxNzg1MTcwMjA2LCJleHAiOjE3ODU3NzUwMDZ9.36MCMfvCVFSiXK62yv-73WBsn1sPB5N3iYbyOVyiy-Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwN2U1YzIwZDkwNzg3MWY1MjJhZjQ5MTMiLCJpYXQiOjE3ODUxNzAyMDYsImV4cCI6MTc4Nzc2MjIwNn0.JFEkXv9PHqiXknzjmYX6EnvFSc6CcV6do8Bw6H7yz8s	\N	\N	\N	2026-08-03 16:36:46.351	2026-07-27 16:36:46.351	2026-07-27 16:36:46.351
ccc6ee22-20de-4897-9174-0e47979ed121	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMTZiM2U4ZTljNWU3MDNkODUwOTM2MDA0IiwiaWF0IjoxNzg1MTcwMjg2LCJleHAiOjE3ODU3NzUwODZ9.o21m_uzFueIfTO3JmLW06dbiT5Vn8etMF2V_meOxpsc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzYzA1NzFiZDdhMTM0ODIwOWY4ZDYxNTYiLCJpYXQiOjE3ODUxNzAyODYsImV4cCI6MTc4Nzc2MjI4Nn0.O8DCCIvkFaZ5ZTZAqSZoQNVv3RDYZU__dO81EKlKuys	\N	\N	\N	2026-08-03 16:38:06.913	2026-07-27 16:38:06.914	2026-07-27 16:38:06.914
c82c14bd-5b25-4b91-8f07-f18263d4fd65	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYWVkZTdiODgwYjc2NzA2YmQ5OWIzN2FmIiwiaWF0IjoxNzg1MTcwMzQxLCJleHAiOjE3ODU3NzUxNDF9.FJrhLSeUMxa4ZucvJjxtsjjXVyCFI3AW8SHYUy5fJSU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3MDJmNTkwNWI4NjYwZWE3NWMzMjYyYzIiLCJpYXQiOjE3ODUxNzAzNDEsImV4cCI6MTc4Nzc2MjM0MX0.9bHwJ0Rumo41ORpVhuf6tG9e6Rc2aHUkM7RBxD63vHw	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.7827.55 Safari/537.36	2026-08-03 16:39:01.059	2026-07-27 16:39:01.06	2026-07-27 16:39:01.06
13d75651-bdb9-47aa-ac5b-09506fd34f0a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDhjNzY3ZjQyYzgxOWRmOTg5NGMyNTMwIiwiaWF0IjoxNzg1MTcwNDI5LCJleHAiOjE3ODU3NzUyMjl9.HxajghB48m8CX5bzZwJNzQwnJVq0hVoRSy4Tnn6i5ec	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4YjYyNDI1YmFiZGE4NDdmMDk5M2I3YzAiLCJpYXQiOjE3ODUxNzA0MjksImV4cCI6MTc4Nzc2MjQyOX0.BTIZ7Wl0CGxiFf22H_ieIzfbFRIt3fO_yffZ3x15dJY	\N	\N	\N	2026-08-03 16:40:29.077	2026-07-27 16:40:29.078	2026-07-27 16:40:29.078
681386ad-a122-44b2-9e60-1e9b2780ed7b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjFjNGI5YzNhMmFhYjJhZGQ1ZGU0N2E1IiwiaWF0IjoxNzg1MTcwNDc0LCJleHAiOjE3ODU3NzUyNzR9.2vJQgSvRrH1OUO5ZcJ-S4KFoVSfU-Eun7zOYJlm_2HA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIyMzBiNzIwN2Q0ZmIwMzdlMTBjMTBhNmIiLCJpYXQiOjE3ODUxNzA0NzQsImV4cCI6MTc4Nzc2MjQ3NH0.aZCHczguB1LUFCN-1ZW0fcktQWMfvb5wVzV5stqorto	\N	\N	\N	2026-08-03 16:41:14.127	2026-07-27 16:41:14.128	2026-07-27 16:41:14.128
83befc62-eaa4-4ee8-a7f2-e5247ec826d0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNjdjZGIwZDE2ZDExYzYwOWExZWQ1NWE2IiwiaWF0IjoxNzg1MTcwNTY1LCJleHAiOjE3ODU3NzUzNjV9.3lYZ3-4AXxraw6otVR1L1rNvooBhTo6UITbfIs-WHro	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNWJlMTRkYWNlZTMyYzNlNjYzYjcyODAiLCJpYXQiOjE3ODUxNzA1NjUsImV4cCI6MTc4Nzc2MjU2NX0.m-LX3i85k3AXaUlY-JOQi9SmHoOSaK-Ya7D_7zMcn54	\N	\N	\N	2026-08-03 16:42:45.439	2026-07-27 16:42:45.44	2026-07-27 16:42:45.44
6ff7a8f0-0b59-4725-ba43-7d426945b7a2	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMGM1MzM3MWE0NGExMTczMThiYTIzZmJiIiwiaWF0IjoxNzg1MTcwNTY1LCJleHAiOjE3ODU3NzUzNjV9.GczNdZvxTlbfs_SV9VYOOqHseLeFFQjiF8Vnilyx3RA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkNWYyZjI5NWM1MzVjODYyZDQyMmFhNzIiLCJpYXQiOjE3ODUxNzA1NjUsImV4cCI6MTc4Nzc2MjU2NX0.aY_9osRp8zo_z5DWCNIqvcRaQf98CHZm_xq8FsZseec	\N	\N	\N	2026-08-03 16:42:45.527	2026-07-27 16:42:45.527	2026-07-27 16:42:45.527
9a861588-28e1-4e36-bce8-98a93a9bd08a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTQ5ZGZmZTA5YTc0NWU5MGFjZDhkOWVkIiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.k-yRfvEHc7f7wbXNlAo5e9zN-X54PLRGBG15JpKdDEU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxMzNlOTVhZTFkYTlmZDliMDEwYjVlMmIiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.5FKeTf5TgFNLG_ivdY4wjwVMhpGRT8mMWtPP1-8hjQQ	\N	\N	\N	2026-08-03 16:42:46.496	2026-07-27 16:42:46.498	2026-07-27 16:42:46.498
a2df4b58-2c63-441c-babb-f54e0025c645	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTBiZTg1YjcwODg3NmE0NTM4NTE5ZjM0IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.vLM8nhHst7-cNadapsl47FDOLMthi83Sl8ygcbRGznA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4MzZkNGMyNzVlODQzMjIzOGI0NWY0OWQiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.i4hbVpp7DMz0achqyW8SAMaSj4_7EzIw4dnJXF4hhbg	\N	\N	\N	2026-08-03 16:42:46.498	2026-07-27 16:42:46.499	2026-07-27 16:42:46.499
d143d370-69ce-436d-be0e-b3d665cedb10	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiN2Y0M2MyNjFjYzFiYmVmOWJiZWIyNjQ5IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.0pQKcIgFBpGnkRgkDrED2gKQa2sGNVwu1XRsHjNVM2Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiNzZmYjI3ZDU5NDRiMTJmNGMzY2Q4OGMiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.Jz8qm6j8z9bXu5CkoGdjXzbmFXMP6aqNQ8yX-7xTz-0	\N	\N	\N	2026-08-03 16:42:46.497	2026-07-27 16:42:46.498	2026-07-27 16:42:46.498
4d2a099c-a532-4363-ab5e-5e7ed3d350d3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZmQ0ZTYwOTRlYTM2ODJjYjc2MDc1Y2M1IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.NfFlL49QJy5RyFprec0JWxEy0CKz3Lfd18naXNXppVA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzNTU4MDg4OWM0MjZlYjhlNWQ2NGU4OTciLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.6wU1Rz3TdmLpx9u9OZNZ1Wq7SDJG0uEtBxPS1CtPxOY	\N	\N	\N	2026-08-03 16:42:46.499	2026-07-27 16:42:46.5	2026-07-27 16:42:46.5
018def54-aa3c-4074-90ab-699ce21feef8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDcyYjYwMmJmNTU2Njg1NDg0OGQ3ZTk5IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.tBPVmiBtA2iQyLdjdO3muoTJu-nYZcqV919uuLva4Mo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlYTIwNmQxOGEyYTc1YmQ5YmJmYWIwMjQiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.uQWthl5_vIfrQoGycfnszZbkrbdmu5Ei8ELNCs8ulsc	\N	\N	\N	2026-08-03 16:42:46.5	2026-07-27 16:42:46.501	2026-07-27 16:42:46.501
7022a4df-d566-44b5-b674-7e6669101b7d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDgyZTc2OTgyODlmNTQ5MDQwN2IzNzU3IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.5Jmjnv7feS-SglNteY4ltvOAdDRMZr_jfVht_O_ubsg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4ZjE4ZDJjNjZmYjFmY2FiNDM0ZTM1OTAiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.Tg9zUXFI8livfVTHpkgSj6JWdYssOvYGDPul-KrUJY4	\N	\N	\N	2026-08-03 16:42:46.501	2026-07-27 16:42:46.502	2026-07-27 16:42:46.502
4b948cf2-1fde-4e8e-a3a7-07508bb4e7fc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDgyODMzMzYyZDllOWYwNTkzMjcwZmRjIiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.oz1O8bhEbTIXMuIC-7yfk4TvG6QQRwsXVrmqLh3cATk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNmUwNWNlZGY1MWVmY2U2ODhkNzMxZDUiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.FNx5KPOOpsf6C1dtkryzTITW-s3y4fX-X8zMszNNjHA	\N	\N	\N	2026-08-03 16:42:46.502	2026-07-27 16:42:46.503	2026-07-27 16:42:46.503
8181a0f2-5451-4e3f-b8fb-309009dda1e7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNmEwODkxNjhjYjUxMWU5OWQ4MTViYTdkIiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.IGs_XhtUfytp_QmD81JWBv2mfaUNIqChs0HBG-Dm3Bs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiNzIxODgyYmU5ZmI2OTc2MTM0MDJlOWIiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.Tw1xVKM6k8QEyjp3LlNEN4ZN97JxrS0lu9f57DFcDhg	\N	\N	\N	2026-08-03 16:42:46.505	2026-07-27 16:42:46.507	2026-07-27 16:42:46.507
7b8e3b82-83f5-4258-8e0e-03fb9314e53b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNjNmYmY1ZjE5MDUwMTgxMTcwMGI0OTRhIiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.CyKjqoGslMuvTXuFtmydyWGynr836rEQXNZUvPO-YHY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlNTNiNzgxOTI2MWY0ODRkNmMwZjI1OTAiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.4cMQPW4sTSxJryRRy2SgWjKEaXsRbXiP9DlfdALkATQ	\N	\N	\N	2026-08-03 16:42:46.501	2026-07-27 16:42:46.502	2026-07-27 16:42:46.502
dc551d7f-07ec-4204-961f-29c7a45bc166	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjMzMDkzYjE3ZTM3OTVjYjNmZTkyZjg1IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.qW9ATw3AvkExBWmLIP9D7TaKXcHR6wVWkU6ussgmWIY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwZTM2ZDMyOWY2NjcxYTBjYWEyMGMxOTQiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.aDzfQZLBNlaVJKJTBcXV3Co3lKGkSkkWwFHTWGUPWM0	\N	\N	\N	2026-08-03 16:42:46.503	2026-07-27 16:42:46.504	2026-07-27 16:42:46.504
ad013313-b566-4798-a681-fdef5771ce7a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOWUzMTVlODRkMWQ0M2NhYjc2OThhMTZlIiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.Rl1CqHYuloQCcTd3-j67smtZWjo1I319ERvSvk1P_Yo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNzk3NjczMTlkY2I2ZTYyZWI1NGI5NWQiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.ocPaPGYNrpg0iumfUSFmA-y0v1fLT5vSYzEbfe3CLh0	\N	\N	\N	2026-08-03 16:42:46.504	2026-07-27 16:42:46.505	2026-07-27 16:42:46.505
65686056-ff9c-4839-8b71-e53bc505f5a0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjA4YTAzM2EzYjI2MDhhNWNlNzkyOTI4IiwiaWF0IjoxNzg1MTcwNTY2LCJleHAiOjE3ODU3NzUzNjZ9.WSFQ_E4nGORq9V_IDkDfV08UEwsf8L_zKwmTdHIbW1o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhNzdkNDFiY2JmMjVjMzYxMThkYmQyNjAiLCJpYXQiOjE3ODUxNzA1NjYsImV4cCI6MTc4Nzc2MjU2Nn0.zSDxGZqseBbxBsr-TAwfXtvW7fBrmd41AeA1NwzsA_U	\N	\N	\N	2026-08-03 16:42:46.507	2026-07-27 16:42:46.507	2026-07-27 16:42:46.507
8e85b32c-ace3-49fc-b252-87de601141e5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMjUzNzQxM2Y1NGFhN2MzZDA3ODY4Yjk5IiwiaWF0IjoxNzg1MTcwNTk2LCJleHAiOjE3ODU3NzUzOTZ9.aVuQlmjfVr_myVxle5MbracnQ_3g1FBJCR-hKW5aqfI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhYWU1N2M1NzdhYWY5N2ZjZTBiY2VlMjUiLCJpYXQiOjE3ODUxNzA1OTYsImV4cCI6MTc4Nzc2MjU5Nn0.6KC8L3Cy2zy6OItcgwLJORGL70jFOXhZvoIEWMDcces	\N	\N	\N	2026-08-03 16:43:16.408	2026-07-27 16:43:16.409	2026-07-27 16:43:16.409
58018dba-071a-4ca2-8b5f-8833bdffa5b0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiODEwMDBiMThkNzc3ZjE3ZmUzZTVhNjE1IiwiaWF0IjoxNzg1MTcwNTk2LCJleHAiOjE3ODU3NzUzOTZ9.Mw6a5_jtLFFZ11ibteE4O4yIluFnfURmRn2Evd4lYME	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiYTc1ZDljNGMxNDk0ZDExNjA1MjhkMjUiLCJpYXQiOjE3ODUxNzA1OTYsImV4cCI6MTc4Nzc2MjU5Nn0.Ba5aCmbClzYc2XGymqjrjS2djueRXyJCx7xgMwGQVFY	\N	\N	\N	2026-08-03 16:43:16.493	2026-07-27 16:43:16.494	2026-07-27 16:43:16.494
4df71c40-6e00-4802-aab4-2763743d8eff	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOGJmMjJmODRhODAzZTM0OGI0OTFmMGUyIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.oNQ9l1fiC7KVqSfBlLzDMIu7b7Y51IEYkVHzrP5TasQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5NjhlYTEzOWFhMmVjZjI5ODMwYjlmODgiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.-7i4-wU17wQa6AKmCoTFhiLDmQRL7IZ0Hf6wl79VxfQ	\N	\N	\N	2026-08-03 16:43:17.475	2026-07-27 16:43:17.475	2026-07-27 16:43:17.475
f31eecad-233f-451b-872d-3d60210ae7f3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiM2ZiOThmMzlmNjEwMzExY2YwM2I4MDZmIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.gcOHjJlT-BGIemr5mYuB4ceV5weleIvCwH-BtgnHKf4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxOWRhMjhiM2JhNDFmZmFjZDFkMDRmMTQiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.Nm4q2Gv0r2AfQ8gMn9Leq_yGAefnnSA62vojpWcxdE8	\N	\N	\N	2026-08-03 16:43:17.476	2026-07-27 16:43:17.476	2026-07-27 16:43:17.476
89281706-c74f-42d6-96ec-b978713f9acb	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYmMzN2E1MTNjOWI3MDNjYmFlYTg4YzEwIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.W1LU4po74R4H9f7dhxL-jdsSKc5vS2Y3-9BGinxZ9zo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxMjgwN2UwYTJhMzhmYTViYTgzZTEzYTMiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.X4IOOrABeMZNjshnTCyaQ0SBE8L6D9LvViIe_YIBopc	\N	\N	\N	2026-08-03 16:43:17.478	2026-07-27 16:43:17.479	2026-07-27 16:43:17.479
bdf3ece4-05ef-41a9-9b96-d03b6b532e82	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZGE5Mjk4MDg3NWY0N2FlODZhZTAyOTNlIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.mDXlBrESW7m-7CJQd6MA7xIzcfBAepARyMpaIF5qLtc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlYzdlM2Y5MDg5YjNlMjQ3YzJkNmFjNzkiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.eCLhSEaDjhmb4AkV_PPYtz5Y0jBaYPmvQyY4yTOT__s	\N	\N	\N	2026-08-03 16:43:17.479	2026-07-27 16:43:17.48	2026-07-27 16:43:17.48
12ed40f3-6e08-4490-9d84-8a658520fbdb	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzE4NWZmZWU4YjVkMThjNzczNzQwMGQ2IiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.DRfYTmh_RWszFSDh6VAPZ9hyPllQWH4XGbvNTn9Zqmw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwNTE4ZTViYjdkOGVkMjQwYTc0NjY0NmYiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.wYbs-BGhxHt64beywcQfppTJqA3wKRyhD5yiLj03bDc	\N	\N	\N	2026-08-03 16:43:17.478	2026-07-27 16:43:17.48	2026-07-27 16:43:17.48
34aef796-0edd-4aac-b999-232c4c719f6b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDY0NGQ5ZWQ4MTQzYzJiYmJjYWJmOTk2IiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.jN7-bi1VYMhW88IrQFGpqYR2pUrbyUr_ivGlNpegi3k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3YmNmM2ZkM2ZlYjc5Mzg1ZmYzNjg2MmUiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.fCR1IxTRFWDgoi5eRtap0Kdm-FAspRd4xGy3aSHEVOs	\N	\N	\N	2026-08-03 16:43:17.48	2026-07-27 16:43:17.481	2026-07-27 16:43:17.481
d4faf3ff-3ee9-4497-8408-29907b805a27	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOTQ0ZmIzNGY0NDMwZmQyNTc1OGMxOWVjIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.tGmyd-_IKUXI6aUe25sc2acF3Hxg2OnuEOsqvr2s13U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkMmJkNzBjYjc4N2UwMGMwNTIzZjM2YjYiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.Ggc7Uo3SHV1cS1voUlSJjjghOuyh0_bxL4-_PsMr5Sk	\N	\N	\N	2026-08-03 16:43:17.48	2026-07-27 16:43:17.482	2026-07-27 16:43:17.482
6b0234fa-b135-4a74-b851-535df9164482	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGYwYjBiZDEyOWYwNWNlYjYyNWMxODhiIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.b-y9FbDXn0cZGQddc2E2z89P5iA8Qy2rgAk4P4G3UzE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4N2FhOGVhYTFlOGVmOTA2ZjFhZWI5ZGYiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30._O64Me2cci5XKsi-znALkXV_xCYXGcMYGBiniUL6QBM	\N	\N	\N	2026-08-03 16:43:17.483	2026-07-27 16:43:17.483	2026-07-27 16:43:17.483
88d82fee-f7c2-406c-bd1e-e8f7bc4a32f9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTA1ZWQxMzY0NmYxMmU4NDc1NzM3MTEzIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.4Wri3oKYx6EXueSUQotpiZsfXzB9LfU0vrKwNT9J7iU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2MWU0ZDg5NmZlZTk3Njg3YjNiZmUzMWUiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.uUlyr8CMK1CLuGLo4XvH4NzInfAolnPyi1SR6kwxhUg	\N	\N	\N	2026-08-03 16:43:17.485	2026-07-27 16:43:17.486	2026-07-27 16:43:17.486
8b598b6f-aafc-4c0e-94dd-b0f95932ce92	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGQzZWZmZTE0MWFiNDJmNzNhYjhmZGYxIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.BYoFLUHFckLvNuWZklS0sZ_m8ibwjpPHx4JYY47Xma0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzZTZkOWRiOWY5OGMyOTIyNGRkNDAyMzUiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.x0rJ6nX5eHdSUHOhkDAdx0XRaP1EspEvjAGhuc8WwVU	\N	\N	\N	2026-08-03 16:43:17.481	2026-07-27 16:43:17.482	2026-07-27 16:43:17.482
b68c6973-74f7-47c4-b957-911ff32f2777	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNjlkOTdkNzhlZDI1ZGM2MGY2OWZmNDU5IiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.p_Anb6fYBbjas72nlYX-PQpYS_SJd61dThaPD1N17Us	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3ZGY0M2VhMjViYWYzMjUxNTg0NDI0NmIiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.lW-Aov9F8P_fpoCY0Orn3rkVPO0pYqZVJ6a1SCZOF20	\N	\N	\N	2026-08-03 16:43:17.484	2026-07-27 16:43:17.484	2026-07-27 16:43:17.484
58720edc-f16d-454b-9230-a1f4c25984f3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMThiNjk1ZDAxYWFiYTBkNjhhMmJjODFhIiwiaWF0IjoxNzg1MTcwNTk3LCJleHAiOjE3ODU3NzUzOTd9.OYGmyUA8WSQKjP2iRkQrNTgA7gKZnjN7QhlNgToS9Fc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1NzFlNDU2MzEyNTU0OGJkNGU5OGI4MDQiLCJpYXQiOjE3ODUxNzA1OTcsImV4cCI6MTc4Nzc2MjU5N30.OYNyUBi8WwEYYKGSJ8EjLpOVQAu0BEmXAkVmtitIAtA	\N	\N	\N	2026-08-03 16:43:17.482	2026-07-27 16:43:17.483	2026-07-27 16:43:17.483
7c508e72-9012-443a-a45a-f903676fee41	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjIzMzAwYjg5OTdhMGI2ZDZiZmUyMzBmIiwiaWF0IjoxNzg1MTcwNjMwLCJleHAiOjE3ODU3NzU0MzB9.ThO8k0d5EDITTu3kh5A_P6e3Gj4Y2owco6Wla1VXk9o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzNTQzYmU0OGI5NDAzYmE1ZmE2OWEyMDIiLCJpYXQiOjE3ODUxNzA2MzAsImV4cCI6MTc4Nzc2MjYzMH0.ty2E_nDTBsOAs3E55nEgim_JNtaTPkJJhLYsPVkug1U	\N	\N	\N	2026-08-03 16:43:50.68	2026-07-27 16:43:50.681	2026-07-27 16:43:50.681
63bd40dc-41e2-4244-8c0a-82b6314a6154	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTRjMzVmNDRmMmJmY2RkOTQ0ZWVkZDY5IiwiaWF0IjoxNzg1MTcwNjMwLCJleHAiOjE3ODU3NzU0MzB9.d7bUhcvo27VuQEZpcI6_kDwBQznO8JeFi6BiQfgzcSQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzY2U2ODRkZmZjMWRkM2Q1ZmNjNDM3ODgiLCJpYXQiOjE3ODUxNzA2MzAsImV4cCI6MTc4Nzc2MjYzMH0.eKR-hQjmsrLQW7KqBJOvRcx2HCRr81s_7fx1X6cRpAQ	\N	\N	\N	2026-08-03 16:43:50.769	2026-07-27 16:43:50.77	2026-07-27 16:43:50.77
93eed42d-8266-4ae0-8138-ab5d19ea8563	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOTcwOGE4ZDIyNWUzMmY0ZDBmN2ViYTEyIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.FlayH19hIkP_XUlav1mrXpZqpnfgPLJF5kKIBtGbdn8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxMDVmMTIyOTA0MTllNTgxMDNjMDk1Y2YiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.BolwVglEbp7w_ib-y81tW9exkIHiH5iBy092G3qNPxw	\N	\N	\N	2026-08-03 16:43:51.413	2026-07-27 16:43:51.414	2026-07-27 16:43:51.414
6b49153a-4a80-4e6b-a977-60db9c3123e9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNWQzOTEyMzJhZTY0ODgzYzcyZDI0NGQyIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.Qlhdwb1llB1cbd40kVx0C5DUYPLMfLf5UEMSH87Xo6g	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiMjIwMzkzZGUxZDRlNmY5OTYyY2E1MjEiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.IwW49S47TrQ9iy_DhVE_SNN8rr_BZdO5UO62l4WaTZ4	\N	\N	\N	2026-08-03 16:43:51.414	2026-07-27 16:43:51.415	2026-07-27 16:43:51.415
3a1f5ce8-a20f-49fb-adc1-b4a147b38c6e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjUxN2JhMzgyMmIyZjcyMjM1Y2VmYTJkIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.VBnC99w9aBM82iwnlfmTGCwj0pOBIinjD5RW9V7nhck	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmOGI1ODc1MWJjZjZhOTA1YzY3NjA3MzUiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.YlIw32ROqQvxAGrup1UkqQZtC0g2kTsSpcUKkSOMSAE	\N	\N	\N	2026-08-03 16:43:51.416	2026-07-27 16:43:51.417	2026-07-27 16:43:51.417
e1f7acc6-169a-41ec-9157-74e59a7b09da	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMzMxMWRjNjdiNmU2NjNiNjRkZDA3NDdlIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.g76O7LE8uRPDy2mo7aWgjfgdh-SdteYLf8If-hCobFc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3MDYwZmY5M2I4NzNjOTU3YzY0MjI5YTgiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.P_HzXyMTKZv8M5N0Zw109lKdNC0LaH3i39OnSLghJI0	\N	\N	\N	2026-08-03 16:43:51.417	2026-07-27 16:43:51.418	2026-07-27 16:43:51.418
187fda3a-682d-42f5-a1d3-3094012c1a80	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMjIyOWZjMDc3ZThiNWNmMWIyN2VhN2U0IiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.k5Gioyt1zHPqaYrifjMfwhazZRs9Hojp0kY6PENhRYY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkMjlmMjI3YzYwNTQwNjQ1M2QzNzIyNWUiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.Y1GpKdoqmmFB2FXhDZ3hZkch9sO2POWlLgc6pjzQSx4	\N	\N	\N	2026-08-03 16:43:51.418	2026-07-27 16:43:51.419	2026-07-27 16:43:51.419
66a2c49d-bf53-4a0d-af34-7bd2a8d10694	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOWRhZmJlOThlYTIyZTFiZDIwMmE3OWM5IiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.eRKGuJhtdliITyY1hUu8AN5TmGmunGVtN-Q-2PfYmPo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlZDg0Y2FjZGJjOGE1Y2VmMjRkZjc1MjMiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.W5BazIUO0iGzDu9aBaDuZJRKop4AcadLa03Q36KUhqc	\N	\N	\N	2026-08-03 16:43:51.42	2026-07-27 16:43:51.421	2026-07-27 16:43:51.421
47a76fa4-465f-4837-993d-4b29191880ea	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTIwYjZmMmYwYTcxMDE2YzI5MTE2NTExIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.aq1Z6dSWzp65FZfE1b2TefzZyLmCZa6SZeRd3NgxqaI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwZjFlNjllZTZmMDU2ZDNhYTg3MWQ0M2IiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.wKI-rRsgz7PIqUvRRISxXuZZ9-lMQn6OuYa1vEC6MeE	\N	\N	\N	2026-08-03 16:43:51.421	2026-07-27 16:43:51.421	2026-07-27 16:43:51.421
304fe434-3cc4-4ccb-9014-bf43a10ad87a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjA5YjMzZWVjOTNiYTY3ZjU5MDkwOTlkIiwiaWF0IjoxNzg1MTcwNjMxLCJleHAiOjE3ODU3NzU0MzF9.i-fsmG4TvMiHwMt5Olg2ObFArda-iB1iEbU-sGuqP14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwMjE5MDcyNzRlYjM0YWVjZmQxZmM1OGEiLCJpYXQiOjE3ODUxNzA2MzEsImV4cCI6MTc4Nzc2MjYzMX0.HQroRnQB5cpNDdkcPONTcIW7Y44vhL5GRfd_zfmYZpw	\N	\N	\N	2026-08-03 16:43:51.422	2026-07-27 16:43:51.423	2026-07-27 16:43:51.423
e293c802-88dd-4981-aa8f-3161d83dfb1d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMzI1ZGQ5ZDFlOThmY2NlZGQyMzQxOWIyIiwiaWF0IjoxNzg1MTcwNjcyLCJleHAiOjE3ODU3NzU0NzJ9.lkjWbKC6g4w7s0ThpWOVN92hLJob3yUq3va-asWiePs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkZWZkYzNiZDk2NTk4YmQ3NmUzNTdhZDMiLCJpYXQiOjE3ODUxNzA2NzIsImV4cCI6MTc4Nzc2MjY3Mn0.kDBiLLlmokcYxVN4xQ-fod71Z28rEWh3Da_W2wGryfs	\N	\N	\N	2026-08-03 16:44:32.62	2026-07-27 16:44:32.62	2026-07-27 16:44:32.62
ff756e72-95c2-4c78-a138-213a55c319a5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjMwOGEzMTNiYmMyY2Y5ZGIyODI2Nzg1IiwiaWF0IjoxNzg1MTcwNjk4LCJleHAiOjE3ODU3NzU0OTh9.F0SLcJEA2DON0UYNsIBcu8wmW85qT9C8vwsq30Z3G8Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhNTZmMTk1YjVhNDk3YzNhNzRiYjcxYWMiLCJpYXQiOjE3ODUxNzA2OTgsImV4cCI6MTc4Nzc2MjY5OH0.GHd5Q37XJC716q3NZrBXofCQUKXdJo77l0keUG5ePBQ	\N	\N	\N	2026-08-03 16:44:58.714	2026-07-27 16:44:58.715	2026-07-27 16:44:58.715
b4d43016-a522-4243-90d6-23a635d6e1f1	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDY5MzY0YmIwMGU5NGQwYWJkNjA1NDIzIiwiaWF0IjoxNzg1MTcwNjk4LCJleHAiOjE3ODU3NzU0OTh9.KzlfS_wLeiiVTU00rN-YOBl4LoDCea7AbeZySxqwnKg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmMjU4MmEyNTYwMjFkYWZiMTM1YzNmMWMiLCJpYXQiOjE3ODUxNzA2OTgsImV4cCI6MTc4Nzc2MjY5OH0.EmFkzGUete9Yw17sS-Ks48p9ImqsZyerdu0KaPEBBy4	\N	\N	\N	2026-08-03 16:44:58.802	2026-07-27 16:44:58.803	2026-07-27 16:44:58.803
76426448-792f-47e4-bed6-2860cb4f0c5b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMzVlZjQ4ZGQxNTE3Y2YxZTgwNTgwNDVjIiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.oWoPauTvRaTRhnXLBV949eoYB0AcjdVYUPJJPBRDvS4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzMTBhZTlhMWQzZTQ5MDcwY2ZjM2E2ZmYiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.S7lwMOGyuMtUAkf3fj2zCK3_T-fv1OomquZXO8QQqdk	\N	\N	\N	2026-08-03 16:44:59.445	2026-07-27 16:44:59.446	2026-07-27 16:44:59.446
d0d378ac-8681-458c-ac0d-e6c4bd37b141	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiODM0NDVlOTc0MGZkMzFjMGNmM2JhZDdjIiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.j68YQ5Lmzz8wV5b1OXyRV0I6UHfy7WffVFimxVqUMgE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkNDFhNGQwNjg4YjE2NzVkZWFjNjYxNzAiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.jBobh3T49PQKrUJO5L5EN357LpAx_ZeSS6wzCRQDaK0	\N	\N	\N	2026-08-03 16:44:59.446	2026-07-27 16:44:59.447	2026-07-27 16:44:59.447
f5862685-7476-44af-a960-d6500d7bbcef	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDZkNDY0NWI1NWQ4YTU3ZDgyMGIwNjg0IiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.JkxBFdIy5HyUaNTzaCVBfq4HfgpQrVOg98BymTSdjpE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkYjBlNjgyMjA1YWU5ZTZmN2EwMjQxNGQiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.mm4ykc9rh5HcQvWm6fx-V5-24DEzV_HQKl_G_x6_hts	\N	\N	\N	2026-08-03 16:44:59.447	2026-07-27 16:44:59.449	2026-07-27 16:44:59.449
2143053f-0b9d-4a99-a2da-33bd5f3b5db8	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMGQ3MTJlMjIwZjAwZGVjMWNhNWYxN2RiIiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.XREgFUtY-9L9UIPHpB9M6spnLkgl1etiPqAh9k6IoH4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlYmU2NWJmNTQyYmIzMTFiNjMwYWMzMTYiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.wS0d-MctO43em7nVCgPW28oEOWzlTbk-PjFe8vNxjX0	\N	\N	\N	2026-08-03 16:44:59.448	2026-07-27 16:44:59.449	2026-07-27 16:44:59.449
a701cbcf-fb2d-4976-90fc-dbad0bc4f3d6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDg2ZjQyYTdjMTlhY2EzMjQ0MDIxNDkyIiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.-cNekfG_w1DKPN0RDuVCGh5T7VOv1ylFSkWJiAUmNyc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxMWNjMjk3YjhhZjE3NTRmMDJiYWRlNTIiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.OXeUmrdfuQ59v68IY667_LGl1Gh-WSiEHvAmj-c1tK4	\N	\N	\N	2026-08-03 16:44:59.449	2026-07-27 16:44:59.45	2026-07-27 16:44:59.45
e53bc1e2-6fab-4091-913a-c75c9c8043b7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiODAzYTgzZDQ4NGI4MTRkNDQxNTBiODY5IiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.PkCOdSOIL3J-oj5ld0oLB4lFDrrt9PhM5w6fBZ0tx88	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5MmM2Y2E5MWJhYmU5ZmYzYmI4ZmU3ZWIiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.TYbgl8S6kGBai8vCI90NrFqjC9RTFBJETaJBPOhxNfw	\N	\N	\N	2026-08-03 16:44:59.45	2026-07-27 16:44:59.45	2026-07-27 16:44:59.45
15c56220-50b8-4bc5-8562-4a05723d8561	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzc1ZjEzMTMyZmIyZjMyMzhhYjNmNDA3IiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.s0CDNgcWFkj_7IGH-owaP-ucj9kQ-9Wxwq-3Se0F4ag	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3YWY1NjFkZmIzNzg4ODFmNGRiMDYyM2QiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.zhKS71zKViC9GvQwlxfXkBcrzkwc5k0Qa5Ny-5Fs6NE	\N	\N	\N	2026-08-03 16:44:59.451	2026-07-27 16:44:59.451	2026-07-27 16:44:59.451
37784681-c32c-434d-8f78-7cb8adab50a5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTIwYzBjNjg1Nzg0MDBkOTYxM2Q1OTRjIiwiaWF0IjoxNzg1MTcwNjk5LCJleHAiOjE3ODU3NzU0OTl9.jJcZrnCS5gAkt70Uc2qDWamZqkSJMWssrBwccdL3oVA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4NDlkMDY2ZTIyMTVlNzRiY2FjN2NlMGYiLCJpYXQiOjE3ODUxNzA2OTksImV4cCI6MTc4Nzc2MjY5OX0.ft3Eb0mXMZgJrTzWfmfVoZe9f_p6eiVw4rBLdZioKiE	\N	\N	\N	2026-08-03 16:44:59.452	2026-07-27 16:44:59.453	2026-07-27 16:44:59.453
9b102a62-3a0d-4ae4-afc0-6f7ab7c4fd77	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzEyNzQyMmY5MmE5YzJhYTUwODI0NmVkIiwiaWF0IjoxNzg1MTg4MTc4LCJleHAiOjE3ODU3OTI5Nzh9.0JWp0-kbRi6foSJ1-YqOulMLdTSJl2dJ5YMU_P4sCQU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1MDJiOWY0YTJlMDc0ZTZmOTc3N2ViMDgiLCJpYXQiOjE3ODUxODgxNzgsImV4cCI6MTc4Nzc4MDE3OH0.wVupawGu_K1-llUudTBmL9iJxkl5cOzfnc3lPaYbv58	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-03 21:36:18.46	2026-07-27 21:36:18.461	2026-07-27 21:36:18.461
b8b4f8b3-c63a-4d3d-b0e9-ade8a62088bc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGFkNjBmZWMwY2RlNDcxNDRmNGQxOWEyIiwiaWF0IjoxNzg1MTg4MjM1LCJleHAiOjE3ODU3OTMwMzV9.vzyxhhz2psfW3_Hw73cyxMOXInvwoU-um_YRm3UoBfs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0YTAzMjVlMTVmN2ViZWI4Zjk4NGRkZmYiLCJpYXQiOjE3ODUxODgyMzUsImV4cCI6MTc4Nzc4MDIzNX0.bzn7rP8awJWFALcj3GsFz2NSAl88PU8XavXHCXzRIGo	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-03 21:37:15.389	2026-07-27 21:37:15.389	2026-07-27 21:37:15.389
dfdaa7a4-6dfd-4c4a-b0f9-3d03f4947f0f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZWNjNmU0M2M4YTkyMGI3ZDc3YzBkYjhiIiwiaWF0IjoxNzg1MTkyMzQ2LCJleHAiOjE3ODU3OTcxNDZ9.aLFhD8iwO7v6kVZZuwkLwDLBwLkZL94Ae8gzufulg6g	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlNjQzZjc2OWU0YzRiMDlhYzViODk2NDQiLCJpYXQiOjE3ODUxOTIzNDYsImV4cCI6MTc4Nzc4NDM0Nn0.-9-gqb6a7LmrGzMKD_r-oyvGTwBv-BMQLRP1EOjiApo	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 22:45:46.353	2026-07-27 22:45:46.354	2026-07-27 22:45:46.354
196ff466-952b-48bd-a95b-92506d04b088	3622505d-d626-4278-8db5-ff002849d3f5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNjIyNTA1ZC1kNjI2LTQyNzgtOGRiNS1mZjAwMjg0OWQzZjUiLCJ1bmlxdWVJZCI6InRlc3Rfbm9ybWFsIiwianRpIjoiOTg5MGJlZTgzZGRmODU4MmI5Mzc1NmNiIiwiaWF0IjoxNzg1MTkyMzQ3LCJleHAiOjE3ODU3OTcxNDd9.duNd1U1fywijKqh_yU0d4ePSlt6Swz6QPfJOwxe6AEs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNjIyNTA1ZC1kNjI2LTQyNzgtOGRiNS1mZjAwMjg0OWQzZjUiLCJ1bmlxdWVJZCI6InRlc3Rfbm9ybWFsIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2MmQ3ODExYzU5ZDliMTFkZTIwNTMwNDkiLCJpYXQiOjE3ODUxOTIzNDcsImV4cCI6MTc4Nzc4NDM0N30.ONVfSCIFzTDx8fTGvTyPXBfk71OfzUDFcQS4_T-w2BE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-03 22:45:47.505	2026-07-27 22:45:47.506	2026-07-27 22:45:47.506
f58a4b41-6499-4d08-bd2c-1a12d25da654	48158c4b-5471-43b4-9eea-84476ece92b7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODE1OGM0Yi01NDcxLTQzYjQtOWVlYS04NDQ3NmVjZTkyYjciLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAxX21zM3cwcWo2IiwianRpIjoiMDkwMDNlMTgyNjZkNDQwOGI2MzcyOWU1IiwiaWF0IjoxNzg1MTk2Njk4LCJleHAiOjE3ODU4MDE0OTh9.gt0eU3JLnL1l5Crys1wVZ2xoyApD8Nl8_Akbn4mDCDo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODE1OGM0Yi01NDcxLTQzYjQtOWVlYS04NDQ3NmVjZTkyYjciLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAxX21zM3cwcWo2IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIyN2RjZGI1OTExMjVhMmIwODViNDlkYjYiLCJpYXQiOjE3ODUxOTY2OTgsImV4cCI6MTc4Nzc4ODY5OH0.CADrUrQ5xT-A04RPIblfqrTIAJDcIA0gx-6Zf9fsp_4	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:18.226	2026-07-27 23:58:18.227	2026-07-27 23:58:18.227
61ce60be-e1b3-4368-bba1-a032c67578a2	67037a38-a1d9-4acf-92ac-0d3f3c81d91a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzAzN2EzOC1hMWQ5LTRhY2YtOTJhYy0wZDNmM2M4MWQ5MWEiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAyX21zM3cwcXM3IiwianRpIjoiODFiZmEzMDNhMWM4Yjk0MzQ5MDJmNGQwIiwiaWF0IjoxNzg1MTk2Njk4LCJleHAiOjE3ODU4MDE0OTh9.HwSIQmgw_xh6h9n6YRaXCejeN0pD7ELAYDmagx4uBJ4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzAzN2EzOC1hMWQ5LTRhY2YtOTJhYy0wZDNmM2M4MWQ5MWEiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAyX21zM3cwcXM3IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwODc5NTUzNDliMmY2ZDkzMWM1MWQ4ZGMiLCJpYXQiOjE3ODUxOTY2OTgsImV4cCI6MTc4Nzc4ODY5OH0.j1qS96ALV05lKg-mQ-qu6u6lEyKsun_0E2nmM8MI7vM	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:18.581	2026-07-27 23:58:18.582	2026-07-27 23:58:18.582
ababa040-edb9-4b8f-ab05-98f51ba65769	4d906740-d3a4-424e-8d0d-8c1860f9a41e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDkwNjc0MC1kM2E0LTQyNGUtOGQwZC04YzE4NjBmOWE0MWUiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAzX21zM3cwcjFhIiwianRpIjoiOTQwNGI4MjgxNGE4NWQzNjc3OTRlOTRhIiwiaWF0IjoxNzg1MTk2Njk4LCJleHAiOjE3ODU4MDE0OTh9.bOiedEJEPhgXvzQed5QvsYuM0m2ESxfoagYRD4OrV1A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDkwNjc0MC1kM2E0LTQyNGUtOGQwZC04YzE4NjBmOWE0MWUiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAzX21zM3cwcjFhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhMDRlMGUzZDM3YjMzOGRmNjZjMWRiMjAiLCJpYXQiOjE3ODUxOTY2OTgsImV4cCI6MTc4Nzc4ODY5OH0.bz-A_EbOHzKOigEPq2zGPRTOOHx5P9E7PUiygmuComE	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:18.915	2026-07-27 23:58:18.915	2026-07-27 23:58:18.915
0a01e1d7-7684-4235-b811-2f2719eb8156	61f37995-186e-46f9-a68e-01bfb3ef96ad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MWYzNzk5NS0xODZlLTQ2ZjktYTY4ZS0wMWJmYjNlZjk2YWQiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA1X21zM3cwcmFkIiwianRpIjoiZDEzYjRkNGU1ZDMwNjRmZDQ5YTVkZGRhIiwiaWF0IjoxNzg1MTk2Njk5LCJleHAiOjE3ODU4MDE0OTl9.hquqggQtCJLVC7ZeDM7OMksLLIHN4b-TWMGzP573sqA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MWYzNzk5NS0xODZlLTQ2ZjktYTY4ZS0wMWJmYjNlZjk2YWQiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA1X21zM3cwcmFkIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiZmE1M2M1MWM5ZTE2MzhhZTU0NjVkYjAiLCJpYXQiOjE3ODUxOTY2OTksImV4cCI6MTc4Nzc4ODY5OX0.XSSzOxzQVoDymmlOgktvUf7dtihSRxPH2GvtnbkI_MM	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:19.251	2026-07-27 23:58:19.252	2026-07-27 23:58:19.252
4d6f9557-16e9-4d60-9375-67dc6961093a	c7dc1be6-9803-4a87-8ef7-23bd7c330e5c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjN2RjMWJlNi05ODAzLTRhODctOGVmNy0yM2JkN2MzMzBlNWMiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA2X21zM3cwcmprIiwianRpIjoiNjQwMWZlODQwZTU3MDZlMzE4NGUzNzZmIiwiaWF0IjoxNzg1MTk2Njk5LCJleHAiOjE3ODU4MDE0OTl9.oieMBIbgzNWM7mkWJVyRI6cBrdnJz0tWJYHzi2NFEbI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjN2RjMWJlNi05ODAzLTRhODctOGVmNy0yM2JkN2MzMzBlNWMiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA2X21zM3cwcmprIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlZTk2YjJhMWUxZGJkYjY3MDhkOGE4NmYiLCJpYXQiOjE3ODUxOTY2OTksImV4cCI6MTc4Nzc4ODY5OX0.-gFfF0agDllRln9f6l102vsDuXKPNf9soA1QWNAs81o	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:19.585	2026-07-27 23:58:19.586	2026-07-27 23:58:19.586
30db9572-7487-439b-9507-749d100a05fa	cc5eb123-4fcd-44a4-8628-63ed9c0c0b68	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzVlYjEyMy00ZmNkLTQ0YTQtODYyOC02M2VkOWMwYzBiNjgiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdW5pdF9tczN3MHJzaiIsImp0aSI6IjI2ZmZiYmRjMGIyMWExMzc4NzBlYTBmZiIsImlhdCI6MTc4NTE5NjY5OSwiZXhwIjoxNzg1ODAxNDk5fQ.V6rKdleA1KqplKlVD4-0rNemaDk3F7_8WCZWeY_eDrM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzVlYjEyMy00ZmNkLTQ0YTQtODYyOC02M2VkOWMwYzBiNjgiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdW5pdF9tczN3MHJzaiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOTFlMDY0MjgzMmI5MzEzOWJiYWM2NmFlIiwiaWF0IjoxNzg1MTk2Njk5LCJleHAiOjE3ODc3ODg2OTl9.iP3PF0klLf-VDZ5tMG_OZjGl9nhPUu7XlOM9ZpNGaG4	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:19.915	2026-07-27 23:58:19.916	2026-07-27 23:58:19.916
e9ef7134-9f5e-4653-bb8f-60ced9389d94	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOTdkZjcwYjRjMTY5MWY0MzYwNWRiYjFkIiwiaWF0IjoxNzg1MTk2NzAwLCJleHAiOjE3ODU4MDE1MDB9.wxMVtsz4L7kAJM4uIL5r0KRoEnhrmc8YHJM6Y0AXIgM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiMGEzNjY4Zjg5ZDZkOGU1NDQyNjg4YzMiLCJpYXQiOjE3ODUxOTY3MDAsImV4cCI6MTc4Nzc4ODcwMH0.ZV0emLtGypabzRitFpu9jZYz_Bwst0485XNyp15KRd8	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-03 23:58:20.159	2026-07-27 23:58:20.16	2026-07-27 23:58:20.16
479b294a-8a72-49e5-9cbb-f257dbab7c46	48158c4b-5471-43b4-9eea-84476ece92b7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODE1OGM0Yi01NDcxLTQzYjQtOWVlYS04NDQ3NmVjZTkyYjciLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAxX21zM3cwcWo2IiwianRpIjoiY2RhMzJhOTdjMDY5N2YwMTU5ZGIxZWY5IiwiaWF0IjoxNzg1MTk3NzU3LCJleHAiOjE3ODU4MDI1NTd9.82QjB3Ip8FhmLlFdl7_AODEyLG4nFdc2JCjS8N5ioOc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ODE1OGM0Yi01NDcxLTQzYjQtOWVlYS04NDQ3NmVjZTkyYjciLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAxX21zM3cwcWo2IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzY2NiMzM0ZTA5ODJkYzA5NDlhNzAwYjciLCJpYXQiOjE3ODUxOTc3NTcsImV4cCI6MTc4Nzc4OTc1N30.llv_YUOAOuHwd6yJOPVm_dgOXOtgWUVEFdqQ2E6F0aI	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:57.754	2026-07-28 00:15:57.755	2026-07-28 00:15:57.755
277549c4-1141-4340-a3fb-48f4f8a78c23	67037a38-a1d9-4acf-92ac-0d3f3c81d91a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzAzN2EzOC1hMWQ5LTRhY2YtOTJhYy0wZDNmM2M4MWQ5MWEiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAyX21zM3cwcXM3IiwianRpIjoiY2I4ZjI4MzQ2NWE0Y2FiYWM1YjJiNmM1IiwiaWF0IjoxNzg1MTk3NzU4LCJleHAiOjE3ODU4MDI1NTh9.QCIco6VYNbJMJKGAC7igRQjWtXVyEDd_5XQDc2k-pK0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzAzN2EzOC1hMWQ5LTRhY2YtOTJhYy0wZDNmM2M4MWQ5MWEiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAyX21zM3cwcXM3IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3ZmMxOWFlYmYxOTM3ZmIxMjJlY2M3YzIiLCJpYXQiOjE3ODUxOTc3NTgsImV4cCI6MTc4Nzc4OTc1OH0.1mHT3_5KS3LLnDOlvbXjTKz3HzDTHjJAOLaZKYyyovk	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:58.117	2026-07-28 00:15:58.118	2026-07-28 00:15:58.118
1f1bcbda-ed06-451c-af5e-34ebb27ce7ef	4d906740-d3a4-424e-8d0d-8c1860f9a41e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDkwNjc0MC1kM2E0LTQyNGUtOGQwZC04YzE4NjBmOWE0MWUiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAzX21zM3cwcjFhIiwianRpIjoiZGU3NzM0NjgyOGJiNmM3MzYyNzE1YWIyIiwiaWF0IjoxNzg1MTk3NzU4LCJleHAiOjE3ODU4MDI1NTh9.kmUNiz6KIEEkvEOHgAWeYABFczQOqY4xGtvyF9_cd-Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDkwNjc0MC1kM2E0LTQyNGUtOGQwZC04YzE4NjBmOWE0MWUiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDAzX21zM3cwcjFhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5OTkzNDMyN2I4MzNlYjQyZDA2ZDkwNzIiLCJpYXQiOjE3ODUxOTc3NTgsImV4cCI6MTc4Nzc4OTc1OH0.EKx6VQA9s62-zc0k0QQAIrI_AhCE5uQgOQIs7gRK7u4	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:58.448	2026-07-28 00:15:58.448	2026-07-28 00:15:58.448
2ba0fb8a-cb53-4a9a-80e0-79990a3ac050	61f37995-186e-46f9-a68e-01bfb3ef96ad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MWYzNzk5NS0xODZlLTQ2ZjktYTY4ZS0wMWJmYjNlZjk2YWQiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA1X21zM3cwcmFkIiwianRpIjoiZTBiNzc0ODZlOGY2ZTEyNDVlMmFiNjEzIiwiaWF0IjoxNzg1MTk3NzU4LCJleHAiOjE3ODU4MDI1NTh9.8TcNstekzPBHJ5hOeMD_YBSjYBCsXmVyFioTnu1D1YM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MWYzNzk5NS0xODZlLTQ2ZjktYTY4ZS0wMWJmYjNlZjk2YWQiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA1X21zM3cwcmFkIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwNzI3M2YzNjJhYzRkZDczNzhiNzEyNDkiLCJpYXQiOjE3ODUxOTc3NTgsImV4cCI6MTc4Nzc4OTc1OH0.0MsziUpnjU77ZqEVRhKxzhYy22UTDg780h26xljZBz0	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:58.783	2026-07-28 00:15:58.784	2026-07-28 00:15:58.784
1d4e9f39-c173-4953-b13a-f2c0e8f80a4f	c7dc1be6-9803-4a87-8ef7-23bd7c330e5c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjN2RjMWJlNi05ODAzLTRhODctOGVmNy0yM2JkN2MzMzBlNWMiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA2X21zM3cwcmprIiwianRpIjoiYTQ1MGRkNDBjNzA2NTA0Y2NiZTdkYTM3IiwiaWF0IjoxNzg1MTk3NzU5LCJleHAiOjE3ODU4MDI1NTl9.2MWGZHqhHjJjeVS9mhtHwZ_u6dN3KOU9jpQg_YSBRIo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjN2RjMWJlNi05ODAzLTRhODctOGVmNy0yM2JkN2MzMzBlNWMiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdDA2X21zM3cwcmprIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2YWE2ZWVmYTY3NDM4YzI3MzViZjEzZjkiLCJpYXQiOjE3ODUxOTc3NTksImV4cCI6MTc4Nzc4OTc1OX0.0Z7Hfx11_Z3iWwTeMyH_jbS9RfMGObEc8PgS_aIcrik	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:59.113	2026-07-28 00:15:59.114	2026-07-28 00:15:59.114
cc03527b-0d3b-432e-8488-b07f0d8fa8ad	cc5eb123-4fcd-44a4-8628-63ed9c0c0b68	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzVlYjEyMy00ZmNkLTQ0YTQtODYyOC02M2VkOWMwYzBiNjgiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdW5pdF9tczN3MHJzaiIsImp0aSI6IjRiM2ZmYzhkMGRmM2JmMjRmYTJhZjY4ZiIsImlhdCI6MTc4NTE5Nzc1OSwiZXhwIjoxNzg1ODAyNTU5fQ.wcf7dx_abX1wpJMgBX566cctvKtHgne3aKCR3tCXOO4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYzVlYjEyMy00ZmNkLTQ0YTQtODYyOC02M2VkOWMwYzBiNjgiLCJ1bmlxdWVJZCI6InAzX3Rlc3RfcDNfdW5pdF9tczN3MHJzaiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNmYwMjI4YWUzZGFjM2YzMjQ5Mzg3ZmM5IiwiaWF0IjoxNzg1MTk3NzU5LCJleHAiOjE3ODc3ODk3NTl9.9l8efRXprbRyEPaRplxSVNwaRk9proNffV-ElRxdcm8	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:59.441	2026-07-28 00:15:59.442	2026-07-28 00:15:59.442
39d1356c-7777-4d46-a195-9f2a5a6c3093	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMmJkYmFmMjMzYTI5ZWMwOTNmZDI3ZjllIiwiaWF0IjoxNzg1MTk3NzU5LCJleHAiOjE3ODU4MDI1NTl9.UiwBWsBrXICNybNrYFQRAiWPKRR5sb10d92VFFnwRgU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwNGM3OGNkYTU0MWUwNzc1ZmMxZmVjOGQiLCJpYXQiOjE3ODUxOTc3NTksImV4cCI6MTc4Nzc4OTc1OX0.dE4FuAw8UmAw5WG6oj6mrtL18E_p0q02fNiM5CJH2kE	{"ipAddress":"82.156.228.87","userAgent":"node"}	82.156.228.87	node	2026-08-04 00:15:59.669	2026-07-28 00:15:59.67	2026-07-28 00:15:59.67
a481c17f-bfae-4169-9f55-b637107b044e	93f9a208-3e8a-4e78-b7cb-b2c06d6e924c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2Y5YTIwOC0zZThhLTRlNzgtYjdjYi1iMmMwNmQ2ZTkyNGMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDdhX21zM3hsNHNzIiwianRpIjoiZmYwMDFkMDhmODM0OWYxMzNiN2M1NDc0IiwiaWF0IjoxNzg1MTk5MzI4LCJleHAiOjE3ODU4MDQxMjh9.C_HtphBrbDdh1FowkGWPFiFw_M3vjuyB3uchNL_O4Uc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2Y5YTIwOC0zZThhLTRlNzgtYjdjYi1iMmMwNmQ2ZTkyNGMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDdhX21zM3hsNHNzIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0ZDJiNDgxNDEyNzZjY2FlOGRkODViMzEiLCJpYXQiOjE3ODUxOTkzMjgsImV4cCI6MTc4Nzc5MTMyOH0.qcVR8X_-NWLm5Ft0c3o_U_ZeoljoFhZ5-I_YTDvO06E	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:08.08	2026-07-28 00:42:08.081	2026-07-28 00:42:08.081
aa8d1e56-a1f7-43a8-b6c9-27676e884c97	0c12cc0e-c529-4b0e-bc43-25fa02054536	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYzEyY2MwZS1jNTI5LTRiMGUtYmM0My0yNWZhMDIwNTQ1MzYiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDdiX21zM3hsNTIzIiwianRpIjoiZjJmY2E5NzdmNzIwODljY2RlNzBjZTM3IiwiaWF0IjoxNzg1MTk5MzI4LCJleHAiOjE3ODU4MDQxMjh9.59n2b3DYzZrCvUzM2YPZZisMoH_WC4cHjWN_vuGmA1U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYzEyY2MwZS1jNTI5LTRiMGUtYmM0My0yNWZhMDIwNTQ1MzYiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDdiX21zM3hsNTIzIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5ODQ0NDNhNTI3YjAzYzQwZGY5NGU5ZjEiLCJpYXQiOjE3ODUxOTkzMjgsImV4cCI6MTc4Nzc5MTMyOH0.CW2uLdlKSQAW5QGR3nMfowg9Ncb3wcWizXNiCo9fNMM	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:08.459	2026-07-28 00:42:08.46	2026-07-28 00:42:08.46
bd5435ef-f24f-48bb-b605-e25546e3a89b	0628c78a-e531-41fb-a637-97bb9bd57d45	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNjI4Yzc4YS1lNTMxLTQxZmItYTYzNy05N2JiOWJkNTdkNDUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfMV9tczN4bDV4diIsImp0aSI6ImUzMWViYWJjZGJlY2M4OGQ2MzI5ZGY5ZSIsImlhdCI6MTc4NTE5OTMyOSwiZXhwIjoxNzg1ODA0MTI5fQ.9wQNJa8wnTdXqEzpaJFJ6oI5OLjaLkzMViC6KOfbb6A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNjI4Yzc4YS1lNTMxLTQxZmItYTYzNy05N2JiOWJkNTdkNDUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfMV9tczN4bDV4diIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMDIxOTVkNjYzYTcwNzhkODk5NDBlMDc3IiwiaWF0IjoxNzg1MTk5MzI5LCJleHAiOjE3ODc3OTEzMjl9.g8rLQScB4m08bFs-ItKt9KZDhWwzl5Cewtu4sQ91hak	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:09.197	2026-07-28 00:42:09.197	2026-07-28 00:42:09.197
f65bc2fa-0402-4373-9bbd-9a5b49f18255	d267cb47-df4d-4f98-a618-47619b13821e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMjY3Y2I0Ny1kZjRkLTRmOTgtYTYxOC00NzYxOWIxMzgyMWUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfMl9tczN4bDZoNCIsImp0aSI6IjhiOTYzNjExZTczMTQyYjcxN2ExYTM1MiIsImlhdCI6MTc4NTE5OTMyOSwiZXhwIjoxNzg1ODA0MTI5fQ.aKKw2Q0asMLurGWiro6hRydYKXGDwKY9_M6t9m1sETw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMjY3Y2I0Ny1kZjRkLTRmOTgtYTYxOC00NzYxOWIxMzgyMWUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfMl9tczN4bDZoNCIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOWY1YjMyY2JhMzVmNDEyNzg2YTkwODY2IiwiaWF0IjoxNzg1MTk5MzI5LCJleHAiOjE3ODc3OTEzMjl9.qxFWtpBZ5ojgoIfc0JBoWRx2oae8hy1ZdYvxGZNjmnA	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:09.889	2026-07-28 00:42:09.89	2026-07-28 00:42:09.89
a99c5735-111e-451e-8104-05ce3fa220af	a34dcc2e-6c75-4fcc-a171-d176cd8a9603	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMzRkY2MyZS02Yzc1LTRmY2MtYTE3MS1kMTc2Y2Q4YTk2MDMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfM19tczN4bDcwciIsImp0aSI6IjA5NWQyN2ZkNzI4ODUwYWMzYjliNjhhNiIsImlhdCI6MTc4NTE5OTMzMCwiZXhwIjoxNzg1ODA0MTMwfQ.4SfvLO4yfAzJGvTK1i5FEWHd7mNPNXgEyrL2khZSWOc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMzRkY2MyZS02Yzc1LTRmY2MtYTE3MS1kMTc2Y2Q4YTk2MDMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfM19tczN4bDcwciIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZTI5YWM4ZWI4YjZlYTYzNzAyOWI5NmZjIiwiaWF0IjoxNzg1MTk5MzMwLCJleHAiOjE3ODc3OTEzMzB9.ED5ZTL-HM0NXYK5O2fw4USpTFppiPqjV85Eucp-I7lY	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:10.604	2026-07-28 00:42:10.605	2026-07-28 00:42:10.605
4f089371-431c-46e3-99af-8589a33b7462	e37a9bcf-6326-4ca8-abdf-ffd34fe00472	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMzdhOWJjZi02MzI2LTRjYTgtYWJkZi1mZmQzNGZlMDA0NzIiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNF9tczN4bDdrMiIsImp0aSI6IjU3NjBiMzAwYTRkYmY2MjczNmFjY2E0NyIsImlhdCI6MTc4NTE5OTMzMSwiZXhwIjoxNzg1ODA0MTMxfQ.jvTRlKHjujGodLRnGniVKbC7SK0zubhLBNJdBX9VCY0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMzdhOWJjZi02MzI2LTRjYTgtYWJkZi1mZmQzNGZlMDA0NzIiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNF9tczN4bDdrMiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOGI0MGZjMTllZjExMTI4NGQ1ZTkxZmE3IiwiaWF0IjoxNzg1MTk5MzMxLCJleHAiOjE3ODc3OTEzMzF9.KaDENtcRpeFsLYua6YzZb5g-jYnBC9GYatWP3N95hWY	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:11.302	2026-07-28 00:42:11.303	2026-07-28 00:42:11.303
9ac2d197-ef14-4cde-a50b-fab72c931af8	502c4e5e-e3ee-4781-852a-29472ca8528e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDJjNGU1ZS1lM2VlLTQ3ODEtODUyYS0yOTQ3MmNhODUyOGUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNV9tczN4bDgzaiIsImp0aSI6IjA2MmRjNWZjYmMwZjIyMmQ2MDUxYmI2MyIsImlhdCI6MTc4NTE5OTMzMiwiZXhwIjoxNzg1ODA0MTMyfQ.gtzDPhAdWPBp4Guvek6sATtIFkb7w_KQqtk85jI2RnY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDJjNGU1ZS1lM2VlLTQ3ODEtODUyYS0yOTQ3MmNhODUyOGUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNV9tczN4bDgzaiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOTg2MDIwYjBlN2JkNzE0YTgzMWZiZDY4IiwiaWF0IjoxNzg1MTk5MzMyLCJleHAiOjE3ODc3OTEzMzJ9.O4H9vZL5-GfiYE5NoZBnUCoBIAIIuiSM4LEoJ_seOXk	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:12.024	2026-07-28 00:42:12.025	2026-07-28 00:42:12.025
ff57e510-af66-495e-9955-ab3d132ffdae	ed0988fa-b200-49d6-857e-e384c6a19689	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZDA5ODhmYS1iMjAwLTQ5ZDYtODU3ZS1lMzg0YzZhMTk2ODkiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNl9tczN4bDhvdCIsImp0aSI6IjQ4NTQ5MTg0YzNkMjIzMDg3ODIzYWU0NiIsImlhdCI6MTc4NTE5OTMzMiwiZXhwIjoxNzg1ODA0MTMyfQ.r8XWxt8r9C7QfuyeAFLfnq3sxOUen-iMcH2jHZIPayc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlZDA5ODhmYS1iMjAwLTQ5ZDYtODU3ZS1lMzg0YzZhMTk2ODkiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDhfNl9tczN4bDhvdCIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZGRkZmM5MjJkOWMxOTg2ZjAzMzU4NTYyIiwiaWF0IjoxNzg1MTk5MzMyLCJleHAiOjE3ODc3OTEzMzJ9.S9H5BrVu2tJMObNJEHTD8vfOkjM0IdLa7F4JjjYlWis	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:12.75	2026-07-28 00:42:12.75	2026-07-28 00:42:12.75
e87b8d21-825e-4773-9ffd-b1185a1251ef	c5d2efb0-2e89-42ab-bfe7-a9a436fa81a4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNWQyZWZiMC0yZTg5LTQyYWItYmZlNy1hOWE0MzZmYTgxYTQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfMV9tczN4bDlhNyIsImp0aSI6ImNlZTVjODk0MTlkMzk3NTk4NWQwYzI2MCIsImlhdCI6MTc4NTE5OTMzMywiZXhwIjoxNzg1ODA0MTMzfQ.F2bo6Jh_0u2I1gZVJw0t8pJcSdMV1fJrEPr8YMQIzQY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNWQyZWZiMC0yZTg5LTQyYWItYmZlNy1hOWE0MzZmYTgxYTQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfMV9tczN4bDlhNyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNmM5OWY3YWRkZDEyYWIxMmRkM2RlMWE2IiwiaWF0IjoxNzg1MTk5MzMzLCJleHAiOjE3ODc3OTEzMzN9.9Zw3Z8D_-3jgqNSiWp5QgCOor-FVaxIYp-1zliJEEoU	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:13.514	2026-07-28 00:42:13.514	2026-07-28 00:42:13.514
236f399c-c5f3-4546-a659-846f58602e8a	b91eb774-1d90-4a86-891b-4ff5954a8be4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOTFlYjc3NC0xZDkwLTRhODYtODkxYi00ZmY1OTU0YThiZTQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfMl9tczN4bDl0YiIsImp0aSI6IjIwYWViYWYxMGEyMzg1NzUxOTZlYTA1YSIsImlhdCI6MTc4NTE5OTMzNCwiZXhwIjoxNzg1ODA0MTM0fQ.2wXnRuUcm0C-MJn0Cx0-I_fNa0icx_qEIGywOaEQB_k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOTFlYjc3NC0xZDkwLTRhODYtODkxYi00ZmY1OTU0YThiZTQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfMl9tczN4bDl0YiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMWUzMmI2MDQ5ZjRhYWQ4MGNhNTMyNzFkIiwiaWF0IjoxNzg1MTk5MzM0LCJleHAiOjE3ODc3OTEzMzR9.OtR93I3PXeNWisqn1yGlnEqR-DB-HzKLgfObmMOvxaY	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:14.206	2026-07-28 00:42:14.207	2026-07-28 00:42:14.207
882c6ec0-2577-49eb-ac86-919f2ce7813e	b38ec829-37bb-4934-bffc-024db683bfb1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiMzhlYzgyOS0zN2JiLTQ5MzQtYmZmYy0wMjRkYjY4M2JmYjEiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfM19tczN4bGFjYSIsImp0aSI6IjAzNDVjOTM2ZmViMjliODRlNGI5ZjBiYyIsImlhdCI6MTc4NTE5OTMzNCwiZXhwIjoxNzg1ODA0MTM0fQ.CEtOqSNTSjeevCkL3aZtzQRUEa0UXE9WlZfPH4JCd6I	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiMzhlYzgyOS0zN2JiLTQ5MzQtYmZmYy0wMjRkYjY4M2JmYjEiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfM19tczN4bGFjYSIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiYWM0YmJkOTA0NmQwNTdhYzkwYjJlNzIxIiwiaWF0IjoxNzg1MTk5MzM0LCJleHAiOjE3ODc3OTEzMzR9.3PB_cddeW5hh52D562mnzZwe85P7veOHL9gwqB4HgJE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:14.905	2026-07-28 00:42:14.906	2026-07-28 00:42:14.906
dda7f547-22ec-430c-8638-fb0e33c7db5b	dfeea17d-0aa3-4f0b-bfed-ae4d71aa3872	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZmVlYTE3ZC0wYWEzLTRmMGItYmZlZC1hZTRkNzFhYTM4NzIiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNF9tczN4bGF2cCIsImp0aSI6ImZiMTk5MTliNDFjNDczNjhhZDZmODVmNiIsImlhdCI6MTc4NTE5OTMzNSwiZXhwIjoxNzg1ODA0MTM1fQ.E_k8NDpvSR6QLNX77ziAU4ey3yPymHJvZUaGtDLinok	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZmVlYTE3ZC0wYWEzLTRmMGItYmZlZC1hZTRkNzFhYTM4NzIiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNF9tczN4bGF2cCIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZGZkY2M3YzBmMTg3MjdiNDU5NWNmMzJmIiwiaWF0IjoxNzg1MTk5MzM1LCJleHAiOjE3ODc3OTEzMzV9.z8xBeAT_5My8dv9M05vY1_9L7Kqk4qXpP2SHAXfb4xM	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:15.597	2026-07-28 00:42:15.598	2026-07-28 00:42:15.598
aed593a3-a8e5-4c50-b623-d3a1e85ccabb	9038dfe3-bd33-4adf-83dd-4e9e6de1f75a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDM4ZGZlMy1iZDMzLTRhZGYtODNkZC00ZTllNmRlMWY3NWEiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNV9tczN4bGJmYyIsImp0aSI6ImRiNTYwMWE3MjM3Zjk5MTc2YjViZDNlZCIsImlhdCI6MTc4NTE5OTMzNiwiZXhwIjoxNzg1ODA0MTM2fQ.QG4iWQ9SP8fyexrFgWnznHfEZLyk1Zgwnd7opUAASrI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDM4ZGZlMy1iZDMzLTRhZGYtODNkZC00ZTllNmRlMWY3NWEiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNV9tczN4bGJmYyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZDA1MGU4ZmE2ZWJlY2Y2NmQwOTBhM2Y2IiwiaWF0IjoxNzg1MTk5MzM2LCJleHAiOjE3ODc3OTEzMzZ9.odaxLA3kIcFHMBCGP9ArcQAuegNq2iHflWeBx3KqoxE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:16.305	2026-07-28 00:42:16.306	2026-07-28 00:42:16.306
665ee616-7e07-4e8d-9592-328568f69cc3	fd7730ac-af78-4a37-b1af-2f9459d9cedc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZDc3MzBhYy1hZjc4LTRhMzctYjFhZi0yZjk0NTlkOWNlZGMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNl9tczN4bGJ5ZyIsImp0aSI6IjY5Mjg0ZjNmMzZmNjJiZTQyNDQxY2FjZSIsImlhdCI6MTc4NTE5OTMzNywiZXhwIjoxNzg1ODA0MTM3fQ.eXTW9IqrdI-le7yGy7DS526qHenoS1gBWTOfH7i094o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZDc3MzBhYy1hZjc4LTRhMzctYjFhZi0yZjk0NTlkOWNlZGMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MDlfNl9tczN4bGJ5ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZjBhOTQxZDBlY2M1NjZlOWFjZjIyMzUyIiwiaWF0IjoxNzg1MTk5MzM3LCJleHAiOjE3ODc3OTEzMzd9.x0zz3nYK2Q5b0-y9gB4bvn68lTJn5xCjPovjZ6-qBTc	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:17.002	2026-07-28 00:42:17.003	2026-07-28 00:42:17.003
be7e192a-135c-48eb-a8f1-6ae745052934	565dc9ec-566b-4bd7-a91c-5c87f738ba33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NjVkYzllYy01NjZiLTRiZDctYTkxYy01Yzg3ZjczOGJhMzMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBhX21zM3hsY2s4IiwianRpIjoiMTgzNDZlMDQ2MjFiNjExNDZiNWQ2MGQ3IiwiaWF0IjoxNzg1MTk5MzM4LCJleHAiOjE3ODU4MDQxMzh9.BLg4wEEV09TeCPb4tcn-2wTHbg6UmZo0sbRI8lDfGmk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NjVkYzllYy01NjZiLTRiZDctYTkxYy01Yzg3ZjczOGJhMzMiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBhX21zM3hsY2s4IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2NjBkODJmNjNiMGQzYmMzY2ViOTY0OTUiLCJpYXQiOjE3ODUxOTkzMzgsImV4cCI6MTc4Nzc5MTMzOH0.ARGz9gqO2ZV-XHWRODcSgvqlLqkV7kW56fcYOnxPIxw	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:18.459	2026-07-28 00:42:18.463	2026-07-28 00:42:18.463
a52055b5-b950-49e2-85f8-631e6937b140	2d986d55-92bd-4830-9c9a-1e13d9720d1e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZDk4NmQ1NS05MmJkLTQ4MzAtOWM5YS0xZTEzZDk3MjBkMWUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBiX21zM3hsY3R4IiwianRpIjoiYTZiNzAwMzc5MjllOWUxNTE1ZTRlNTc4IiwiaWF0IjoxNzg1MTk5MzM4LCJleHAiOjE3ODU4MDQxMzh9.fKj4aFpeIZkUUs9UAjCOStk2kyPp4uuWtECledqVeow	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZDk4NmQ1NS05MmJkLTQ4MzAtOWM5YS0xZTEzZDk3MjBkMWUiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBiX21zM3hsY3R4IiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2YzQ0ODg0ZGQ5YzA5ZWZlODNiZDlkZWYiLCJpYXQiOjE3ODUxOTkzMzgsImV4cCI6MTc4Nzc5MTMzOH0.z1YDTZnObAr0bygTCtfOSzzmXG0UjbYjkC2OWrdQLzw	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:18.801	2026-07-28 00:42:18.802	2026-07-28 00:42:18.802
bdf6b5af-d05d-49ef-bcea-33ea9d2d6bdd	704205d4-21c2-45fa-aea5-bd0c11aee2bd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDQyMDVkNC0yMWMyLTQ1ZmEtYWVhNS1iZDBjMTFhZWUyYmQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBjX21zM3hsZDNlIiwianRpIjoiODZhMTkzMmJjY2NmNzk3MzcwYjI4ZGU3IiwiaWF0IjoxNzg1MTk5MzM5LCJleHAiOjE3ODU4MDQxMzl9.4xwLT90k549qjdg82QyhSFpe9Ym7fevVGikcZqPilJg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MDQyMDVkNC0yMWMyLTQ1ZmEtYWVhNS1iZDBjMTFhZWUyYmQiLCJ1bmlxdWVJZCI6InAzczJfdGVzdF9wM190MTBjX21zM3hsZDNlIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjYmEzMmQwMDk0ZTU3OTBhMTRkZDVmZjIiLCJpYXQiOjE3ODUxOTkzMzksImV4cCI6MTc4Nzc5MTMzOX0.Kl0kjmAzysqTXYZGEIH6OTV09vKjxInZGNIyCLI8LIE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:42:19.134	2026-07-28 00:42:19.134	2026-07-28 00:42:19.134
09862fa2-e733-4320-bfc1-76da1039ba10	d167b983-8d3b-47f9-9fec-29d9ac1448ac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMTY3Yjk4My04ZDNiLTQ3ZjktOWZlYy0yOWQ5YWMxNDQ4YWMiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfMV9tczN4bmZ6dyIsImp0aSI6ImE4NGFlMzBjZTE5MzE1MjcyNzNhZGZiYiIsImlhdCI6MTc4NTE5OTQzNSwiZXhwIjoxNzg1ODA0MjM1fQ.uSkKiJ2TmttK7gg-gdCh813DCDvEHq6-pG6OCKMaaHk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMTY3Yjk4My04ZDNiLTQ3ZjktOWZlYy0yOWQ5YWMxNDQ4YWMiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfMV9tczN4bmZ6dyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNThiYzQwY2MwNTk5YmIzODEwYjMyZGI1IiwiaWF0IjoxNzg1MTk5NDM1LCJleHAiOjE3ODc3OTE0MzV9.dX1vV2huOvhZK8M9Odmv0z35YAcQBxQTOB64znmbHV8	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:55.555	2026-07-28 00:43:55.556	2026-07-28 00:43:55.556
ca55cb75-f3c2-482b-9465-6c71a1bd38ab	e5b77f19-aff1-4a99-8663-3a8599bed6f4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNWI3N2YxOS1hZmYxLTRhOTktODY2My0zYTg1OTliZWQ2ZjQiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfMl9tczN4bmdsNCIsImp0aSI6IjE3OGJkNmZjZDk5MDVlMWViYWZlMGE2MyIsImlhdCI6MTc4NTE5OTQzNiwiZXhwIjoxNzg1ODA0MjM2fQ.HO2LZlngipSMXh_-0FNhPZPet2eVSiqCvuY0LeXIbyI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNWI3N2YxOS1hZmYxLTRhOTktODY2My0zYTg1OTliZWQ2ZjQiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfMl9tczN4bmdsNCIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMzI3MzY2ZDFhMWEwNmFlZjVhODhmMmI3IiwiaWF0IjoxNzg1MTk5NDM2LCJleHAiOjE3ODc3OTE0MzZ9.qemtL6-tY4a6dxMo0KwDS95BRjBzmjPf81u9Eb0ga-8	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:56.299	2026-07-28 00:43:56.3	2026-07-28 00:43:56.3
d883125f-7493-4b33-b0b2-73b20232b41d	425358c6-dfad-4512-a048-71ee8687b61e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MjUzNThjNi1kZmFkLTQ1MTItYTA0OC03MWVlODY4N2I2MWUiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfM19tczN4bmg0MSIsImp0aSI6ImQwNjI4MjE5N2ExYTJmNjRjZWYzYWVkZSIsImlhdCI6MTc4NTE5OTQzNiwiZXhwIjoxNzg1ODA0MjM2fQ.JOpKj6NBOwPBM4Na5X5dyD-SpTaH1WfnJ9EzGCtsULw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MjUzNThjNi1kZmFkLTQ1MTItYTA0OC03MWVlODY4N2I2MWUiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfM19tczN4bmg0MSIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOTk0OWI0NDE1OWU1NTkxODRiMjQ3NTljIiwiaWF0IjoxNzg1MTk5NDM2LCJleHAiOjE3ODc3OTE0MzZ9.qbt0L_kNrET0lfSc9Lnuc1sNRn01wzVUaohXqPMrarw	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:56.974	2026-07-28 00:43:56.975	2026-07-28 00:43:56.975
4d656b8a-2bad-4fe8-b9fe-bf3f995a3909	11c481c6-8463-4371-a2ee-27dd7e353536	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMWM0ODFjNi04NDYzLTQzNzEtYTJlZS0yN2RkN2UzNTM1MzYiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNF9tczN4bmhuNCIsImp0aSI6ImQ0YmZjMGQwZDRjMThhNDA0ZWRjZTNmMyIsImlhdCI6MTc4NTE5OTQzNywiZXhwIjoxNzg1ODA0MjM3fQ.7iLxr1oJFAv_zDYLjxLeodfqALusb0XnzAKUZUBnMjU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMWM0ODFjNi04NDYzLTQzNzEtYTJlZS0yN2RkN2UzNTM1MzYiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNF9tczN4bmhuNCIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMjdhZDA0YWZkODQ5ODViYzQxZWJmZDQ3IiwiaWF0IjoxNzg1MTk5NDM3LCJleHAiOjE3ODc3OTE0Mzd9.KCENTjhScd7z3472_qsVK_26WUPee46uUmZyIDjpPtU	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:57.662	2026-07-28 00:43:57.663	2026-07-28 00:43:57.663
057c332d-295d-451e-83b8-e281a3ee776c	fde479e5-4c4d-48fa-859e-270ee889236a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZGU0NzllNS00YzRkLTQ4ZmEtODU5ZS0yNzBlZTg4OTIzNmEiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNV9tczN4bmk2MSIsImp0aSI6IjU3MGI0ODkwMDA2YWQ3NjQxMzc2MzNmYiIsImlhdCI6MTc4NTE5OTQzOCwiZXhwIjoxNzg1ODA0MjM4fQ.-ZuH5ePT-T0Jwptvq2GOOCNcxqrTvar6vzbk9YbPzyQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZGU0NzllNS00YzRkLTQ4ZmEtODU5ZS0yNzBlZTg4OTIzNmEiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNV9tczN4bmk2MSIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNjhjNzNkMzBiNmI4MGY3MTY1YjAwN2ZlIiwiaWF0IjoxNzg1MTk5NDM4LCJleHAiOjE3ODc3OTE0Mzh9.Qb1GL1XzsJk1QBUTdq4TrAoeIll7diV5MCT0Ai3DDPY	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:58.34	2026-07-28 00:43:58.341	2026-07-28 00:43:58.341
5a76e809-0797-402f-9382-48a14ceef21c	c4d6d5e0-3f89-44d8-9a6f-0b3e53b3fe04	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNGQ2ZDVlMC0zZjg5LTQ0ZDgtOWE2Zi0wYjNlNTNiM2ZlMDQiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNl9tczN4bmlvbiIsImp0aSI6IjFhNmIxZjkxOGFlYjllMTlkMTMyNzJmMSIsImlhdCI6MTc4NTE5OTQzOSwiZXhwIjoxNzg1ODA0MjM5fQ.ygitoWONaHFxa0D1fwI1IOCex3VMNARbMSqsXWrc_ew	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNGQ2ZDVlMC0zZjg5LTQ0ZDgtOWE2Zi0wYjNlNTNiM2ZlMDQiLCJ1bmlxdWVJZCI6InAzczJ0MDhmaXhfdGVzdF9wM190MDhmaXhfNl9tczN4bmlvbiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiN2MyMDBlMmI2Mjk3NGU1ZmYzODY3Mzc0IiwiaWF0IjoxNzg1MTk5NDM5LCJleHAiOjE3ODc3OTE0Mzl9.bxNIe9yiKyICVBXXlp9EFROsbYaq9DZOo1HyjQKZvZA	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:43:59.01	2026-07-28 00:43:59.011	2026-07-28 00:43:59.011
0a9cddb1-a0b3-45af-8b8b-bfaa83ee3bb9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOTUxMDM2ZDg0ZmEyODQzNzUyNTgwN2ZiIiwiaWF0IjoxNzg1MTk5NTU2LCJleHAiOjE3ODU4MDQzNTZ9.aychYa0WuGlkpHuUUaoF3_dzoArrbrtgOhsVHD8JtxE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiNzA2NTY4ZmY2NGRiY2QzYTE5MzQ5YmQiLCJpYXQiOjE3ODUxOTk1NTYsImV4cCI6MTc4Nzc5MTU1Nn0.92ml6KcHeBTqHn2VLkZRh0c7RHE8v67WC1Mc8Xenc2Y	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:45:56.604	2026-07-28 00:45:56.604	2026-07-28 00:45:56.604
a756da0b-0fdc-41f1-984f-4c27a825fd20	a54eb726-f27a-46df-816e-eba16f0937a2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJqdGkiOiI2N2U5MDUwOTJlNzUyZmU1YWFiYjFmYTIiLCJpYXQiOjE3ODUxOTk1NTYsImV4cCI6MTc4NTgwNDM1Nn0.CegB0qO_OCW1nhKBcRMJgMa3qFSDoKbXIsp5FOf-S9M	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImUzZGM1MWVmZDQ0ODNkMjA1NzliNjNhOSIsImlhdCI6MTc4NTE5OTU1NiwiZXhwIjoxNzg3NzkxNTU2fQ.IXv74Qn0sz9pjBbHL74vom4KP7St8PatF1_TmkEwOCM	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:45:56.939	2026-07-28 00:45:56.939	2026-07-28 00:45:56.939
44a59548-0444-4896-93e5-bdbdee5a787b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzBlYWE1MWFmNmE1NzE5ODNhYWJiZjIzIiwiaWF0IjoxNzg1MTk5NjQwLCJleHAiOjE3ODU4MDQ0NDB9.myRDwMvLuL3o76jRt8uTE7WAQjfyZysPi_63F5nexPA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3MGRmZDQ1MDg2ZjdhM2FkYTJjYjJkZDkiLCJpYXQiOjE3ODUxOTk2NDAsImV4cCI6MTc4Nzc5MTY0MH0.dC1ces8k_ur80LuI74nsvykQdwgjV4Wi1iqy8vJE72I	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:47:20.044	2026-07-28 00:47:20.045	2026-07-28 00:47:20.045
b7c60359-bd5d-4417-8a87-7a0e7a51611c	a54eb726-f27a-46df-816e-eba16f0937a2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJqdGkiOiJhYzMzYzUyMmNkNGJkOWU3NTRlODRjODAiLCJpYXQiOjE3ODUxOTk2NDAsImV4cCI6MTc4NTgwNDQ0MH0.YjNRakHJkcVgCNg0lN1cd_7Hxod2OPvkM0JvYIhfLZA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjgxYjlhMjFiN2ZhNDEwZTViNDY0NDJjMSIsImlhdCI6MTc4NTE5OTY0MCwiZXhwIjoxNzg3NzkxNjQwfQ.aBONuJoFNvdpZZxGG2KSf14PXeB_gXUiyiazO75v8Oc	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:47:20.377	2026-07-28 00:47:20.378	2026-07-28 00:47:20.378
ea9c0bcc-60d4-4e3d-9d59-118f452e60ed	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTZjOWQ3OTRkOGU4MGI3OGQ3YTljNTkwIiwiaWF0IjoxNzg1MTk5NjU2LCJleHAiOjE3ODU4MDQ0NTZ9.pET7r1QI-e4vxdf2DIKqGPpkVc9W7HbN8SUlJWxulqM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1MGMyNDYyNmU3Y2M1OWM1YWU1ODVjMWEiLCJpYXQiOjE3ODUxOTk2NTYsImV4cCI6MTc4Nzc5MTY1Nn0.Um_lbWilhFrIVZZEjmiNgAhWJzuyM83hLZHHQb8ZSWQ	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:47:36.939	2026-07-28 00:47:36.94	2026-07-28 00:47:36.94
941a9e8d-67c7-49e5-9351-62e0a579720d	a54eb726-f27a-46df-816e-eba16f0937a2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJqdGkiOiIzNzBiMjI4NjczNDYxNTZlNTFkYjg4NzUiLCJpYXQiOjE3ODUxOTk2NTcsImV4cCI6MTc4NTgwNDQ1N30.90QdOT9gnhSORCM8JX5p8E0VEC8mt2kc2lCovA7UKp8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjI1MjgwMzQ5MDEzOTNlNmM5MGNhN2I3OCIsImlhdCI6MTc4NTE5OTY1NywiZXhwIjoxNzg3NzkxNjU3fQ.tuwNPIGGNrneK9axCsS6sjgjGfQ2VqvRBKLm7m4DlSk	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:47:37.279	2026-07-28 00:47:37.28	2026-07-28 00:47:37.28
ec001916-69a7-47cf-80c1-488e2f4310e3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYmUyMjRiYjkwMDAwOTgwM2U2OTQ1ZjQ0IiwiaWF0IjoxNzg1MTk5NzIwLCJleHAiOjE3ODU4MDQ1MjB9.Y_ddn6XJOgRS8WReuwFdys-83I1bjV2dOWol8Dy6GUs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3YzA4YjNjN2Y2NDRiYWMyZjk1Y2U3MDciLCJpYXQiOjE3ODUxOTk3MjAsImV4cCI6MTc4Nzc5MTcyMH0.S6_sU2thp11_JtIq63YX6OpppWYlLFBJfhrhEkZnIOU	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:48:40.718	2026-07-28 00:48:40.719	2026-07-28 00:48:40.719
7f69ab63-e68c-4390-b1ff-8a544de5c240	a54eb726-f27a-46df-816e-eba16f0937a2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJqdGkiOiJlMTQ3N2JhY2IxOWM4YjI1NjFjMjRlODciLCJpYXQiOjE3ODUxOTk3MjEsImV4cCI6MTc4NTgwNDUyMX0.ikRGpzuoBcyMiuKbvRJDXrdmg9ndp_Qedr4U91oqRzw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNTRlYjcyNi1mMjdhLTQ2ZGYtODE2ZS1lYmExNmYwOTM3YTIiLCJ1bmlxdWVJZCI6InAzczNfdGVzdF9wM190MTJfbXMzeHExbHciLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImY5NTA0ZTAxNTZmZjk5ODZhMmRhOTg4NCIsImlhdCI6MTc4NTE5OTcyMSwiZXhwIjoxNzg3NzkxNzIxfQ.MaKqeOiPf2UQ1kfHyBD5MZ5JJpCMj2KJNF5LREDVaBQ	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:48:41.048	2026-07-28 00:48:41.049	2026-07-28 00:48:41.049
38913985-cafe-4d39-aa2e-0f90e9703b5e	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6ImI5ZmY5ZGYxMTA0ZDM4ZTZjMDY5ZGI0YiIsImlhdCI6MTc4NTE5OTgxMCwiZXhwIjoxNzg1ODA0NjEwfQ.zkQKoqt5K9AmN5afTRcfPui7GU-PsqP_7q_tsnwbgb0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZTMwODliNzQyMDA1M2RlNDFhM2M2ZGE1IiwiaWF0IjoxNzg1MTk5ODEwLCJleHAiOjE3ODc3OTE4MTB9.zHhekL26KFyczoLjfky5TzlS3AAWUXLr8Lky6SGQCN0	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:10.523	2026-07-28 00:50:10.524	2026-07-28 00:50:10.524
e5f2f547-5ab3-41c3-862b-263f80cdbb3e	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6ImMwYWFiZTNkNTZhZmY4ZWQwYTlmY2FkYyIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.LBXYk6RSsDVvMr8HP1_TfRPKEDP1gQtlz9Ma10-xjwc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiODY0OGYzZDBiNDBjODViOTZlYjEzMWM4IiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.rkC37p3hAPgyIMI2w3hmabO4vJLOcQ479ADQjNRZE7c	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.328	2026-07-28 00:50:11.329	2026-07-28 00:50:11.329
9684a2d0-88de-4809-94ce-6b0995d86b15	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6IjI1YmNjZmNlMTJlZGM3ZTRmNzFkN2Y5OCIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.1DzsAsCxfyNZ4DxHwj8GVazPJUKohbYc2yeDu8SzgfA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiYzhiMmEzODkyYjhiMjBmZGI3NGU3NTYxIiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.M3-x3U3MXnUjmGjCex5RLUVcsaOTsM7ZkSdoIsf-dGo	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.329	2026-07-28 00:50:11.33	2026-07-28 00:50:11.33
e23018ce-3ae1-4b6d-b8ff-a18d86f9d5e2	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6IjcwMGY0OTI5MjBkNjlhZjdhNGVkYTU4NiIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.45ssoexk0ieowXrEjsEZryyQoi4MclAqxJCm0CQB5Xs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZjA3MGI5YWM0ODdmZmNkMzIwYTdjZmE1IiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.XwfA7WLMWOKRhJoXccc1G83VQcbhQL8BQV2VrfRQzZg	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.33	2026-07-28 00:50:11.331	2026-07-28 00:50:11.331
77b43828-4693-4a2c-b912-c63942a776ef	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6Ijk3MDdjOWNkZmY1OTM0YzI1NDQ1MjA3ZSIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.5n2ttsb89hVJNA7Jh1Wh6IF8We_c4kwcf85f5_ciwnM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMWQ0NWI3NmY5NDI1MzJhYmRjODgxYzQ2IiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.B61z1yXMolg8-cYWPO66gXrdMiFnfrARg-e7lANXF8M	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.369	2026-07-28 00:50:11.373	2026-07-28 00:50:11.373
2ded75fc-b732-4914-b017-cf9d76306c95	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6ImE2ZDQyM2Q0MjMxMWY5NWYxYzAzYjA5ZiIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.iqgbUV_0c9p2g-xJ5hqwXTBNXG7UCihE6cq_n5JYh9o	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOTAxMmQ5NDU3MTBlZjIyNDdmYzc5YmQzIiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.Ba4-W64cUQcqxOb5wxXhwUUggsbYmcE18Z5kMvAJT4w	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.382	2026-07-28 00:50:11.384	2026-07-28 00:50:11.384
f5eda150-50ac-456d-8abd-15857d7c17f9	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6Ijc1ZmQxYzcyZTNlZmUxZGMxM2I2MDY4OSIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ.cf1agdOfFv_V_mSf1KK4ZqPMW_Uuwte7njbDN6u4fXM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZjZjMmRhZjkyODQyYzFlMmQ3Y2Y2ZjZkIiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.z2xtGzPEtnV0OOLhryiYrvtv95PzgeGwHcC1rGHWKF0	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.382	2026-07-28 00:50:11.384	2026-07-28 00:50:11.384
96c77071-7145-4fab-9f4b-6bc8daebe928	d6d24e48-5435-43f0-9749-09aa1845d3f1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsImp0aSI6IjgyYzdhMDAxMWZiODQ4NjM0ZWE2NThmMCIsImlhdCI6MTc4NTE5OTgxMSwiZXhwIjoxNzg1ODA0NjExfQ._2sUDh8HhJpczwjymJiBKRnT9y3ZdGSUY42UXpx77Tk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNmQyNGU0OC01NDM1LTQzZjAtOTc0OS0wOWFhMTg0NWQzZjEiLCJ1bmlxdWVJZCI6InAzczNfdDExX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiMjJjNDIzYWQxMjJjNjQwMjA2ZGFmZTAwIiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODc3OTE4MTF9.0DeSBUbnNoAZZ4TRNqHOkayEUxNpnQKSGS6gjTGF1Oc	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.387	2026-07-28 00:50:11.388	2026-07-28 00:50:11.388
8db27735-6bf9-44dd-84d6-51de790c8b96	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzMxMzM3YjExYmI0MzFlZWVhOTM0MmUwIiwiaWF0IjoxNzg1MTk5ODExLCJleHAiOjE3ODU4MDQ2MTF9.GhtjULdoIeJVUyqJFAFl3VasZ-MtnXn2_onovqxMdqQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIyNDY2NjIxYjAwNjFlMmI2N2EzMWM1Y2UiLCJpYXQiOjE3ODUxOTk4MTEsImV4cCI6MTc4Nzc5MTgxMX0.K2tIXruyhAF1Vt1P_ini6_SjEanVuWHy8sV47QccnYo	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:11.503	2026-07-28 00:50:11.504	2026-07-28 00:50:11.504
2b6edf85-80ac-476e-98e5-5a091fddade1	c0478eee-ad79-4c3e-960a-994f5aa71e00	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDQ3OGVlZS1hZDc5LTRjM2UtOTYwYS05OTRmNWFhNzFlMDAiLCJ1bmlxdWVJZCI6InAzczNfdDEyX21zM3h2ZnhoNTB3ZyIsImp0aSI6IjAzZTllNjdmYzc0NTZhMmFkNmQ1N2Y5YSIsImlhdCI6MTc4NTE5OTgxMiwiZXhwIjoxNzg1ODA0NjEyfQ.tFJAjJAuz9pJytkGvJB-6qbJ5p0nejf58NYnBdenqJs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMDQ3OGVlZS1hZDc5LTRjM2UtOTYwYS05OTRmNWFhNzFlMDAiLCJ1bmlxdWVJZCI6InAzczNfdDEyX21zM3h2ZnhoNTB3ZyIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZjQzNjE4OTU2OTg0NGRiNTA2Y2QwMjBjIiwiaWF0IjoxNzg1MTk5ODEyLCJleHAiOjE3ODc3OTE4MTJ9.-b-ZlO1xKR--auAv0TayMqOZlC_4lGksaM8OdiK8V-o	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:50:12.25	2026-07-28 00:50:12.251	2026-07-28 00:50:12.251
19ea57a9-d58f-47ed-b2bd-b0fe88a52365	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNjhkMDc0YWZkZWQ5YmZjMTI1NDJiZWIwIiwiaWF0IjoxNzg1MTk5ODgxLCJleHAiOjE3ODU4MDQ2ODF9.3xgpPH4NLjyF9EPEqoWe9yoRPnTW6cLPC0Rj2_IpIkc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlMDY5YTg3NDJjN2IzYzQ4Y2I0YjgxNTAiLCJpYXQiOjE3ODUxOTk4ODEsImV4cCI6MTc4Nzc5MTg4MX0.4eEe1axO30maf5PD12lqQ4Kv-q9JzwmQsp4iYHZzDWQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-04 00:51:21.549	2026-07-28 00:51:21.55	2026-07-28 00:51:21.55
7c13d386-182e-4d0b-8734-6915dc913dca	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDQxNjRlNmFiNGNlOTQxODc0NGUyMzAwIiwiaWF0IjoxNzg1MTk5OTU3LCJleHAiOjE3ODU4MDQ3NTd9.vVouRDzU9gzj5fgqPMka1FWzy4wbr1JtA_oMXbrtEUU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhZTEzYjcyMDYyNWIxOGEzZWZjZjE5NjIiLCJpYXQiOjE3ODUxOTk5NTcsImV4cCI6MTc4Nzc5MTk1N30.FxBLEiBidROa8HA6ENW7nnBCjqVN4dZaoEIS20bq3yw	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:52:37.823	2026-07-28 00:52:37.824	2026-07-28 00:52:37.824
77515b07-3f41-4172-a5a5-7a24e5fe4cc9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTlmMmFlYzczNjA5MjIzNjcwN2NhNDJmIiwiaWF0IjoxNzg1MjAwMDM0LCJleHAiOjE3ODU4MDQ4MzR9.0Tub-OsMmXATnjIeFA3Pa5H7kJAPngNkWJR5vha2ww4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4MTFlYjdjYWUxZDVkMTFiYjg1NDZhY2IiLCJpYXQiOjE3ODUyMDAwMzQsImV4cCI6MTc4Nzc5MjAzNH0.H2sKghptu38nt43xvMvGZ0rit8soUOD6hIgCaPuMYxE	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:53:54.941	2026-07-28 00:53:54.942	2026-07-28 00:53:54.942
c85787d2-94eb-474e-985f-0b913bce3502	ba15ddda-a58c-4cb1-a775-09547112d046	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYTE1ZGRkYS1hNThjLTRjYjEtYTc3NS0wOTU0NzExMmQwNDYiLCJ1bmlxdWVJZCI6InAzczRfdDE1X21zM3kwYW1ieXhzYiIsImp0aSI6IjczNTcyNWY4OWU0ZGI1ZDE1YmNhYzIxYiIsImlhdCI6MTc4NTIwMDAzNSwiZXhwIjoxNzg1ODA0ODM1fQ.amuSYs2dv9YqZ47D_fQjVozuMkeQv4shizC8hzVqR5I	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiYTE1ZGRkYS1hNThjLTRjYjEtYTc3NS0wOTU0NzExMmQwNDYiLCJ1bmlxdWVJZCI6InAzczRfdDE1X21zM3kwYW1ieXhzYiIsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiYjM2M2E4MmYzNDNmMmEzYTY2YzY4NGMyIiwiaWF0IjoxNzg1MjAwMDM1LCJleHAiOjE3ODc3OTIwMzV9.d1qHt10NyicctjFi8lwJIxhc4aYC0iEPX4WtJMsKssM	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:53:55.691	2026-07-28 00:53:55.693	2026-07-28 00:53:55.693
fd3f4361-da21-4832-be11-7390fdaf0d08	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGQ3NGVlOTdmODA5OGRhZmNlNmIyZTEyIiwiaWF0IjoxNzg1MjAwMTE5LCJleHAiOjE3ODU4MDQ5MTl9.pLaOz4gq8aIoQRty2LR8-CVKXy-KFyY1Y5rDi-Lhnc8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjOTliYzIwNzlhYjQ4ZmE1MGUzNTk1YjIiLCJpYXQiOjE3ODUyMDAxMTksImV4cCI6MTc4Nzc5MjExOX0.xcI_PgQx_YHzsAeuotbxloYXDch-SwxrVNIegzgn3pM	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:55:19.565	2026-07-28 00:55:19.566	2026-07-28 00:55:19.566
f94c3655-09e2-4372-871e-2755162b61af	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYmZjNDMzYjJiNTRmNWVmNzc2NjcyNTJmIiwiaWF0IjoxNzg1MjAwMTI1LCJleHAiOjE3ODU4MDQ5MjV9.AkQvTncTwMpnc9VS38HR1yvxPHc9qsXb6qcJcm0Q_ZU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJlMjNmOTVhNjE5OTRhZTU5OTY1MDZhNWMiLCJpYXQiOjE3ODUyMDAxMjUsImV4cCI6MTc4Nzc5MjEyNX0.a-vxPIL1b1ABb-b0Kjo_zaE6fvF_LGUQFzIkE6EkEys	{"ipAddress":"::1","userAgent":"node"}	::1	node	2026-08-04 00:55:25.195	2026-07-28 00:55:25.196	2026-07-28 00:55:25.196
24484617-0bbf-47f0-b3d6-61437ff58a67	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTdkMWQxNjUxZGFmNjBmNjQwNDBiNmUyIiwiaWF0IjoxNzg1MjA1NTE2LCJleHAiOjE3ODU4MTAzMTZ9.cPpKD7FqjCtGxh5SehyXpmEIIay3ziS2TnebwFWnOck	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzNjM3YWIzYTlkZjVhNmQ5NWJkNmY0MTciLCJpYXQiOjE3ODUyMDU1MTYsImV4cCI6MTc4Nzc5NzUxNn0.AKoHKeniOhtYUR2NzEa0U4wp3PO4ANHmzulUYgPCkqE	{"ipAddress":"::1","userAgent":"node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"}	::1	node-fetch/1.0 (+https://github.com/bitinn/node-fetch)	2026-08-04 02:25:16.976	2026-07-28 02:25:16.976	2026-07-28 02:25:16.976
1bb43d14-0903-467f-8a62-76e59eae82fd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjI2ZjZiNDk2YzBmOGEzZjdkMTNmMWYxIiwiaWF0IjoxNzg1MjA1NjA5LCJleHAiOjE3ODU4MTA0MDl9.38EJA8Q9T1zMdfbG0xTiZ-AS1jK5-Khn8JVaAaOccw8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkNjcyYjgwZDhlMzNhMmYwZGE5ODViZWMiLCJpYXQiOjE3ODUyMDU2MDksImV4cCI6MTc4Nzc5NzYwOX0.ba-64ZMF7C3gF6sy9EmLYYu5Ts8eWhOsTd4eV7ZfeMQ	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-04 02:26:49.591	2026-07-28 02:26:49.592	2026-07-28 02:26:49.592
29c541a9-116b-4fe7-8b91-c75a31dd04a6	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMTA4YWJmMTU4ZmEyMTU0OGFmODk4MjJkIiwiaWF0IjoxNzg1MjA1NjM5LCJleHAiOjE3ODU4MTA0Mzl9.qsxEF9sqeaSNGjJmGPbUAavhRuaOXNQ7uFGoRAD4Tl8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4ZDVmMjM2ZGViZWQ4OTMzNTBmOGVlY2YiLCJpYXQiOjE3ODUyMDU2MzksImV4cCI6MTc4Nzc5NzYzOX0.gmdHGfzF1lWQHmZgoYeBOZ44oqQP8qquVQDCrXu0zOA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-04 02:27:19.795	2026-07-28 02:27:19.796	2026-07-28 02:27:19.796
c32fb6fb-b1da-458f-9161-86ee82ba5f16	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMjUzMTc1Mzg4NmUzYTEyNWYyMGQ2M2ViIiwiaWF0IjoxNzg1MjA3NjExLCJleHAiOjE3ODU4MTI0MTF9.UHRHc_YDE7iS35Dep4lrE_gfrEMHcSQDfyfz5Z-O8Ao	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhM2NkZmE4ZGFlNmJmYWY2NDFjZDkwN2EiLCJpYXQiOjE3ODUyMDc2MTEsImV4cCI6MTc4Nzc5OTYxMX0.HRdCTGmeu-k7HrpEUwJg1ByMDfKPYh2teYAd5O61B7k	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-04 03:00:11.227	2026-07-28 03:00:11.228	2026-07-28 03:00:11.228
8582e7f2-8f1e-4fd0-9651-8e11482ce85a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzAyMzlhNjVhZDhjZmIxNWMzMTk3NDYxIiwiaWF0IjoxNzg1MjA3NjYyLCJleHAiOjE3ODU4MTI0NjJ9.lUAu004QHRe998iklELoVT4M1NpnSOv6ufY7vBmr8IM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxN2ExNWQ0OWFmN2IyZTg2YzMwNDhhZTMiLCJpYXQiOjE3ODUyMDc2NjIsImV4cCI6MTc4Nzc5OTY2Mn0.KlEKviz6mQvl4jWxVi1kl-ZdMXKkPbaZ_gCF3KJ0gis	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-04 03:01:02.571	2026-07-28 03:01:02.572	2026-07-28 03:01:02.572
a5056287-a07a-4ed6-9d35-c6696b91a9a4	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzYwM2RmNjQxNjMwYzljNGMwMmRmNjg3IiwiaWF0IjoxNzg1MjA3NzI1LCJleHAiOjE3ODU4MTI1MjV9.pw_BPgEZlgkwxVFVpoiPPthrqlfYeUOCM8NiITOsOXM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhYzVkYjJhOTM3YTQ1NWRkZDBmN2RhNjAiLCJpYXQiOjE3ODUyMDc3MjUsImV4cCI6MTc4Nzc5OTcyNX0.kV5A91fZVTfKSd_H8SEpkncInCcidN1sQJYgEs-lGoA	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-04 03:02:05.53	2026-07-28 03:02:05.531	2026-07-28 03:02:05.531
1a68dc98-bc75-498a-b2bf-225b51f4c26a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOGM3Y2Q0YjU3ZDNmNWRjYTI5ZTBlODIzIiwiaWF0IjoxNzg1MjA3NzgyLCJleHAiOjE3ODU4MTI1ODJ9.Jr2WfVfZQougufhyn6Z3fdoYDApm6oFhyObxdRn5TH8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmZjFkNzExYTM4NmVmMTllNzhhMzEwNTkiLCJpYXQiOjE3ODUyMDc3ODIsImV4cCI6MTc4Nzc5OTc4Mn0._54MqNVFuEiEdkiifvs89AhEsu8V5RdWRUXruyWKe4Y	{"ipAddress":"49.251.47.154","userAgent":"Python-urllib/3.14"}	49.251.47.154	Python-urllib/3.14	2026-08-04 03:03:02.912	2026-07-28 03:03:02.913	2026-07-28 03:03:02.913
87ddb56d-a109-48f4-9dd9-ab191a4f01fc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNjViN2M5MWM2YmRmZDM2N2ViMjliMmJiIiwiaWF0IjoxNzg1MjA4MzMxLCJleHAiOjE3ODU4MTMxMzF9.sv7DVKjRD1rUOZ9zGr_mOnCcCZkhZ9sBS1FnZMEPfUI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4NWVhZjliNzg1ZDk5NDk1NzFmZTg4MjMiLCJpYXQiOjE3ODUyMDgzMzEsImV4cCI6MTc4NzgwMDMzMX0.Gqc2NZ1R9UmJT540GRw3LMC9tIli_HMMBrDeY4fAhi4	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 03:12:11.109	2026-07-28 03:12:11.11	2026-07-28 03:12:11.11
2bc833b2-57ad-4b1f-8571-2cf01f2f457f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMGIxZDZlODFiNzY1M2ViNjExMTQ2MzdhIiwiaWF0IjoxNzg1MjA4NDA2LCJleHAiOjE3ODU4MTMyMDZ9.YJSZ3YrMqlpLMnmTuwkPhlRzNF5OiMSc6Zeb8fekyRY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1ZTgzY2Y1YjMwMTY4NjU4M2QyZjkzOTYiLCJpYXQiOjE3ODUyMDg0MDYsImV4cCI6MTc4NzgwMDQwNn0.go6yjMkW0uoqMlIAbUKah9GaFsTvDPLC65j_aeAtteM	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 03:13:26.227	2026-07-28 03:13:26.228	2026-07-28 03:13:26.228
40e5775f-5695-49e3-ad1a-41b33c94072d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMTQyNDJiYWE0ZGJiMmMxNTllMDg1ZTJkIiwiaWF0IjoxNzg1MjUwNzg2LCJleHAiOjE3ODU4NTU1ODZ9.1FT-ovxwqzeKqMNEUTfQhZQMrq0-TimdzHVTej2jsHY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIyNDNjYmQxNDdjYjI4MDE1MDRiNzg1ZjkiLCJpYXQiOjE3ODUyNTA3ODYsImV4cCI6MTc4Nzg0Mjc4Nn0.0WZKDPUWf4hhCn3_jL1dMr-qJWQe0U9U4khezxDpwck	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-04 14:59:46.23	2026-07-28 14:59:46.231	2026-07-28 14:59:46.231
58928620-6f53-4c37-bc1f-3e9fe17cd427	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDNlNmU5ZGQ3Y2E4ZDgwZmVkZjFlN2MzIiwiaWF0IjoxNzg1MjA4NjA1LCJleHAiOjE3ODU4MTM0MDV9.Yd9czkDrueArRvEfUIubx8q8HHqRvn3h2OmeHa2x_6k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1MGE3NGU0OTU5YjE5NTgxNzIxNGEwYTIiLCJpYXQiOjE3ODUyMDg2MDUsImV4cCI6MTc4NzgwMDYwNX0.XTrMWa133doN-WI69YO5Bw_Xom2S10n7ZRa5Jb5UWKA	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 03:16:45.405	2026-07-28 03:16:45.405	2026-07-28 03:16:45.405
944123d0-0a1c-4d29-9b64-6ae9af24870e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiN2JhZTYyZDIyZDFmZjRmZWE5NTE0MTIzIiwiaWF0IjoxNzg1MjEyNTU4LCJleHAiOjE3ODU4MTczNTh9.niWx9t5FXKjnmyAjXCYy7YornpKSTbrdikwGkNiMDY8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0ZTI5MmY4MDc1OTljZTdmMDM4YTE3NWQiLCJpYXQiOjE3ODUyMTI1NTgsImV4cCI6MTc4NzgwNDU1OH0.oCmvvZfWq5mC9JdHsp3Sx03be-LjEHKTj_Ec62exBsY	{"ipAddress":"49.251.47.154","userAgent":"python-requests/2.34.2"}	49.251.47.154	python-requests/2.34.2	2026-08-04 04:22:38.206	2026-07-28 04:22:38.206	2026-07-28 04:22:38.206
66dbdac6-31b2-4842-b177-b346c6e3e796	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTJmNjliYWRmMDlmNmIzYjUxYWZiYzU3IiwiaWF0IjoxNzg1MjEyNjMwLCJleHAiOjE3ODU4MTc0MzB9.xT5mePrCIiolICxnsDx50Ut3WMdQT67PXy8OhTU08l8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0NzNmM2FhMWVkZDg5NzkwZWI3YWRjMDYiLCJpYXQiOjE3ODUyMTI2MzAsImV4cCI6MTc4NzgwNDYzMH0.e_q7UkhSUV_sptWzvqZ1WZXXUiSRyEXa8O5hrAP5Jqg	{"ipAddress":"49.251.47.154","userAgent":"python-requests/2.34.2"}	49.251.47.154	python-requests/2.34.2	2026-08-04 04:23:50.637	2026-07-28 04:23:50.638	2026-07-28 04:23:50.638
9e90fe50-7e4b-4f9e-aa10-3e522a254f4f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjgyZDdkN2QxMGMyNmFiZTFmYzg4YTA5IiwiaWF0IjoxNzg1MjEzMDk3LCJleHAiOjE3ODU4MTc4OTd9.s_MsymgPHSqITVg_JH-uJWkXGHh8U0dIjeGtNqRm4YM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2YzQwMWIyOTE4ODJmMWQwMDY5M2RjNDEiLCJpYXQiOjE3ODUyMTMwOTcsImV4cCI6MTc4NzgwNTA5N30.Wref5YVMyVwRjxhPKRe7VcgSJowTmUom5ttcYIWbg0U	{"ipAddress":"49.251.47.154","userAgent":"python-requests/2.34.2"}	49.251.47.154	python-requests/2.34.2	2026-08-04 04:31:37.354	2026-07-28 04:31:37.355	2026-07-28 04:31:37.355
b377153b-6850-4c0e-9ae7-d87efaabbece	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjdmZDExMDU5ZDdhYTE0NTIzNDUxYmU1IiwiaWF0IjoxNzg1MjEzMjQ1LCJleHAiOjE3ODU4MTgwNDV9.WgXRJMqyGF8MnLvH-3Tb-7mVXo1SdW9mgUkyqQlRd5Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5NWZiZWNkNjllYTlkNGU1MGRmZjcyNGUiLCJpYXQiOjE3ODUyMTMyNDUsImV4cCI6MTc4NzgwNTI0NX0.OpWakXW7jKp-u-v_6gjJVRbzxfRpiRO10UP-YEbfgPg	{"ipAddress":"49.251.47.154","userAgent":"python-requests/2.34.2"}	49.251.47.154	python-requests/2.34.2	2026-08-04 04:34:05.299	2026-07-28 04:34:05.301	2026-07-28 04:34:05.301
48d8d7b2-be9e-4799-b585-ba88f6438114	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYWIyMWM4YTdmMTczM2M0YTQ0Y2I5NjcyIiwiaWF0IjoxNzg1MjI5NzQwLCJleHAiOjE3ODU4MzQ1NDB9.o1ov8rHiGdG5qIJLIwLvsIwCXxA3xx_tqq1tG7W_xTE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhMmFhNjRlNTQ3MDM3ODNmMTllOGI1MzEiLCJpYXQiOjE3ODUyMjk3NDAsImV4cCI6MTc4NzgyMTc0MH0.yCwtsaxmk-Z-kDyZbgbab5opKzjRvEUedGELf-NG1LM	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 09:09:00.704	2026-07-28 09:09:00.704	2026-07-28 09:09:00.704
48716da9-87dd-4e30-a738-27b64f6b5d49	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNGFjZDJkYjk0Yjg3NjI5ZDJiNzE1MzExIiwiaWF0IjoxNzg1MjQ5Mjk1LCJleHAiOjE3ODU4NTQwOTV9.SQconD0uy2lBrIV_nXx5KlLA4IrA0frBSKABkzfzmDA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhMWRjNjIxNTYwYjhkYTFjMDUxZmVkNTMiLCJpYXQiOjE3ODUyNDkyOTUsImV4cCI6MTc4Nzg0MTI5NX0.hYXdiptpVpZMs9qslt6MwrWMdOCz6LaKr4FGSxKAeOc	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 14:34:55.865	2026-07-28 14:34:55.866	2026-07-28 14:34:55.866
1ed21a6e-b17e-4fc3-9543-a41f51c7de79	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTYyNzY1MDM1ZDA0NmEyNTY3MTEwZGQ2IiwiaWF0IjoxNzg1MjQ5MzI0LCJleHAiOjE3ODU4NTQxMjR9._-EUHQcnTU7r4rNlTeUPTMIO7kTZubCMNi-llTcy8Ww	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1Mjk5ODkzNTdmY2EwMDkwMmUxYzYyNDQiLCJpYXQiOjE3ODUyNDkzMjQsImV4cCI6MTc4Nzg0MTMyNH0.i5J8QSztJqo1N4LkUU_OWsl6yD6AtIjRaNErP5rcr6M	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-04 14:35:24.827	2026-07-28 14:35:24.828	2026-07-28 14:35:24.828
e5490ef8-e04e-4311-9585-0fd34c14bebc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTI1OTk0YzA1N2Y3NzFmYmViMDFlMTkwIiwiaWF0IjoxNzg1Mjg3MDE4LCJleHAiOjE3ODU4OTE4MTh9.8Ny3QvUN3qjVpSG0L6OeZ8rkdnKDRdZpPhXHoGieERo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4MjBmZGM0Mjg1MzUwZjhjZmE0MmQ3NmYiLCJpYXQiOjE3ODUyODcwMTgsImV4cCI6MTc4Nzg3OTAxOH0.DbmkUTxwQJokylkCRGQ2-_ynvAXoiTwWHiZagN0U-iY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 01:03:38.865	2026-07-29 01:03:38.866	2026-07-29 01:03:38.866
f71068a2-b76e-46e0-be58-052c778e6283	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMWJkM2VjMzJjZWVjYTRkZWE4ZDMwYjUxIiwiaWF0IjoxNzg1Mjg3MDc4LCJleHAiOjE3ODU4OTE4Nzh9.G3Sc8baOD5Dr8qivsTvXTZ-N9tVcqttZh5HZctqXwZA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxZWFiMTFjMjgxYTU0YjkxOTk3OTkzMWYiLCJpYXQiOjE3ODUyODcwNzgsImV4cCI6MTc4Nzg3OTA3OH0.wtIztLcHiLJ6ZDc9g6B-Jvv9Qq30PakPOfiSWSZ0NTY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 01:04:38.42	2026-07-29 01:04:38.42	2026-07-29 01:04:38.42
b67815fc-9dcc-41ec-9d26-7049657e910d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNWVkYTI5YjE5NWQ0NTk2ZDlhOTQyMmUzIiwiaWF0IjoxNzg1MjkwNjIyLCJleHAiOjE3ODU4OTU0MjJ9.SMdZadhGXaXOybeEtBgFPY_Pm33sNgeUrpAuS6lQPOc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2ZmYxNzg2Njc0ZTc0NGQ4MmVmMmI0ZDciLCJpYXQiOjE3ODUyOTA2MjIsImV4cCI6MTc4Nzg4MjYyMn0.CgBIzVfHgPTM6CjxEhCC1guzS3Xt61ufnzOh21UWAfA	{"ipAddress":"49.251.47.154","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}	49.251.47.154	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0	2026-08-05 02:03:42.246	2026-07-29 02:03:42.247	2026-07-29 02:03:42.247
f3bc48d5-631d-45a9-a539-a98fe2408edc	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDcyN2Q0OGYzOGI1NGRlM2NkZmM1ZjdlIiwiaWF0IjoxNzg1MjkxMzUwLCJleHAiOjE3ODU4OTYxNTB9.1TdtEJ9sWesGxVFN8HbJbqSKqX9IDT7zUyQXwzAGu-4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNGZhNDNlODg5NDdhMzk2Y2YzYmYyNDIiLCJpYXQiOjE3ODUyOTEzNTAsImV4cCI6MTc4Nzg4MzM1MH0.PTCQ5NV8FF2_EE5EzPUVzMQH2RWZpJSslVbtcESWkhA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 02:15:50.342	2026-07-29 02:15:50.343	2026-07-29 02:15:50.343
f69c9577-f91d-400f-8381-2e51a4bc6ea0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMjM4ZDYwOTNiZmVlMjcyMzY2NmI2ZmVmIiwiaWF0IjoxNzg1MjkxMzgxLCJleHAiOjE3ODU4OTYxODF9.7MNZB-zp3qy5aBXZ99HwjdtmcdpnRED6BIxyXiZmCP4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2ZDc4MGYyZmRjMDhjNWE4Nzg5OWM3MWMiLCJpYXQiOjE3ODUyOTEzODEsImV4cCI6MTc4Nzg4MzM4MX0.Gelxct-HQfKf2QXCbd4PAVPFElAKqWGcvB4de_SGVtk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 02:16:21.139	2026-07-29 02:16:21.14	2026-07-29 02:16:21.14
121284e3-87b1-4f82-a816-638eb89c956d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTFkMzM1MTQ3OWJjZDI1MjAyZTIxOGQ5IiwiaWF0IjoxNzg1MjkxOTEzLCJleHAiOjE3ODU4OTY3MTN9.F6odgZ3vpzV4aaeHiQc0H-IJpj0IN--J8isJ7gcd4os	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiNjY3ZDQxZjgzZDk2ZThmNWNhMGM4Y2IiLCJpYXQiOjE3ODUyOTE5MTMsImV4cCI6MTc4Nzg4MzkxM30.kCGOmTsIbH6yVem7EEA1cNuC-sJgdtJfQCOLbAMS3rA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 02:25:13.254	2026-07-29 02:25:13.255	2026-07-29 02:25:13.255
9b9f854a-6e89-4e4a-8ab0-b4133849d4a7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiN2VmZDYwNTM4ZWE4MWVhZGRhNGQ5MjU5IiwiaWF0IjoxNzg1MjkzNzQ0LCJleHAiOjE3ODU4OTg1NDR9.FHIEwj-WNQPPFvX40HHqx2BxaWjjO3iU553tpnTahh4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1YmRlZWQ5OTFkOTg1NjMxYTVlNjEyNDUiLCJpYXQiOjE3ODUyOTM3NDQsImV4cCI6MTc4Nzg4NTc0NH0.JQe7gW2uKHGWaX7Ru6L_OWNqlFGkwB4SM45g6IGQ4vI	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 02:55:44.019	2026-07-29 02:55:44.019	2026-07-29 02:55:44.019
726226f8-931d-4f81-8293-605370d55dbd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZmJiYjBlMDY5NDVjYzUyOWFiZTE2OWMzIiwiaWF0IjoxNzg1MjkzOTUxLCJleHAiOjE3ODU4OTg3NTF9.aEMO46w6BfnDKJpHj-fo4WCpzmg9ltpfcaNJ0AFJXfg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmNzQxYjZlYjdiYjZlMTkyMjhjNmM2MTQiLCJpYXQiOjE3ODUyOTM5NTEsImV4cCI6MTc4Nzg4NTk1MX0.qQ5Ir8QLF5YI9Y2S8jqm1z81syNgUQNtS9k3kSU6WNk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 02:59:11.175	2026-07-29 02:59:11.176	2026-07-29 02:59:11.176
902421d6-a30c-46b3-b0ce-458e16df7c73	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMGFkMTM3Zjg3MTJhM2M4NDk3YWI0MWQxIiwiaWF0IjoxNzg1Mjk0MTEwLCJleHAiOjE3ODU4OTg5MTB9.iFl7S3fpXHzSXNECv-STGRBtyU__kTzTvJ4GJBpG-KA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjOWNjYmZjZGViYWY1MDQ1YzBjODNkMTIiLCJpYXQiOjE3ODUyOTQxMTAsImV4cCI6MTc4Nzg4NjExMH0.84WFYtHWMM2yUEeePTcX8MvNhZz8yX0XxriIFPTaNV4	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:01:50.971	2026-07-29 03:01:50.972	2026-07-29 03:01:50.972
2a99c62f-742b-4f93-bb58-6729ee783892	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDVmZjIyZDc5OGI2YzVhZjA5YjE5NDNjIiwiaWF0IjoxNzg1Mjk2MDk5LCJleHAiOjE3ODU5MDA4OTl9.XCVATi0ppiM43QqDTI5iSLIUMclJIWhpsm2IO-Hnhk8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0Mzk0YzdiMTQyNmU4NzIxZGM3OGRmOTQiLCJpYXQiOjE3ODUyOTYwOTksImV4cCI6MTc4Nzg4ODA5OX0.df6u1632Fgk6XKurZmbFnUY5lKNRtPdUS34Aurz93Io	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:34:59.428	2026-07-29 03:34:59.429	2026-07-29 03:34:59.429
e1d0a659-bc87-495a-8e6d-ebe6657f0242	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjdhMGM2ZTM0YjFlYjEwMTUwNjVkMjA0IiwiaWF0IjoxNzg1Mjk2MTA5LCJleHAiOjE3ODU5MDA5MDl9.SWmFIkhVmZZdyoqvgnJ2QzbpLublmuM93__c_ZWSQpk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzN2EyNDdjMTY1NGNkMzU1YmFkMjM3YWUiLCJpYXQiOjE3ODUyOTYxMDksImV4cCI6MTc4Nzg4ODEwOX0.iDPzVOw2zBwEM68FQi7mUNffNhh1EhFqMPtJrP_9jdc	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:35:09.957	2026-07-29 03:35:09.958	2026-07-29 03:35:09.958
64301fc1-7d8a-463f-9d2b-0d303b0876e7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNzU4ZGRmMTU0YTJmMWQzYTRlZmVmNDUyIiwiaWF0IjoxNzg1Mjk2MTU3LCJleHAiOjE3ODU5MDA5NTd9.h3Fiz--b1MkoWansIE1fUplErMgMZ1Ec8QYIj74ktSk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2YTcwMmYzYWViMzk5ZTc0OWEzNzNjN2YiLCJpYXQiOjE3ODUyOTYxNTcsImV4cCI6MTc4Nzg4ODE1N30.HNDtvreLHhdbdOGeVefWJeQIu32YYEA8iFdjmD9buyc	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:35:57.498	2026-07-29 03:35:57.499	2026-07-29 03:35:57.499
0281b997-6d37-4ade-bba3-d0e0010bb991	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZjQwZDNjZTJkYjVkZTI0NjUzZjk0NmY2IiwiaWF0IjoxNzg1Mjk2MjQyLCJleHAiOjE3ODU5MDEwNDJ9.uMMahLomfzAke5Zu7by__3VumH6iHjw8qQ9nA5TqYuM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjYTczZGU0MGExODJjYTYwZjc5YzE0M2MiLCJpYXQiOjE3ODUyOTYyNDIsImV4cCI6MTc4Nzg4ODI0Mn0._CP4PgOzS6or27789jA4ZjTE1ldSrgzaB5-NnK6_GMU	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:37:22.403	2026-07-29 03:37:22.404	2026-07-29 03:37:22.404
c72959fa-9035-40bf-acfd-189342298359	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiN2ZhN2Q3NTA0NDdmODRkZDk3ZGM3YjI5IiwiaWF0IjoxNzg1Mjk2NDMxLCJleHAiOjE3ODU5MDEyMzF9.u4sQ1azTYVoO-t_PxKLdR-t8gTatZiIauetG9W7YF3c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3ZjMxNjMxNThhZDU1ZjExZjNkNmUyZTQiLCJpYXQiOjE3ODUyOTY0MzEsImV4cCI6MTc4Nzg4ODQzMX0.uZQ_0fJLNjU-0xbUYUqRnze_k2pObZpz1A2e3ZrEoXI	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 03:40:31.861	2026-07-29 03:40:31.862	2026-07-29 03:40:31.862
e56292a6-63c6-4498-a69d-41a4bb2cf4c4	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNzJkZWE0ZjYwMDY5NjQ1ZDgzZWZlZTI5IiwiaWF0IjoxNzg1MzE3ODczLCJleHAiOjE3ODU5MjI2NzN9.Ph1950YbGoz44zEyEOhWS93yUMW6RN-fWCmoZ2Cbegk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1YzgxODg4NDMyYzU4MmM1MmMzNTRkYmUiLCJpYXQiOjE3ODUzMTc4NzMsImV4cCI6MTc4NzkwOTg3M30.okyOcODTz9IsalRgm4kz8cMMIfh6_RmPQcpLYEwbiTU	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 09:37:53.595	2026-07-29 09:37:53.596	2026-07-29 09:37:53.596
d1a804fe-fd92-4158-b4df-dccbb1a82962	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMjk5NjNiYjNjZDYwN2UyNGJkOWI4MTE0IiwiaWF0IjoxNzg1MzE3ODg0LCJleHAiOjE3ODU5MjI2ODR9.24SsHtMT7eBXA4kZj0K06V057ia6ZVtIvlK0Tz_3fLo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmODRjNDVlN2Y3Njc2YWQyZjViMzBkZjkiLCJpYXQiOjE3ODUzMTc4ODQsImV4cCI6MTc4NzkwOTg4NH0.Zwo6gSOpbEyn7wh3IGynYIhlaTgxDGDXQDOevWd-w_Y	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 09:38:04.725	2026-07-29 09:38:04.726	2026-07-29 09:38:04.726
f11c4e7c-ce16-4078-9315-18fbb7e386dd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiY2ZjNWI0NDJmNzljN2YwMzg5NWU1M2NjIiwiaWF0IjoxNzg1MzE5MjU5LCJleHAiOjE3ODU5MjQwNTl9.PuLNoy71bJAvtaeBL6rTzlEizYb0NC9cWP2d0FYM3jc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkZDdhNDM4YjE0OWViYTViMjA0NDI2ODYiLCJpYXQiOjE3ODUzMTkyNTksImV4cCI6MTc4NzkxMTI1OX0.DT0W2McDcjYJD7JWHBM70tlDehacp_btxEFpCIQuhk4	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:00:59.38	2026-07-29 10:00:59.381	2026-07-29 10:00:59.381
e71f157d-6952-4d05-963a-ccf8748c0f03	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMWViM2FiN2MzNTViYTM3NTYxZTM4Y2I1IiwiaWF0IjoxNzg1MzE5NTQxLCJleHAiOjE3ODU5MjQzNDF9.GrTQn3rDNGoqiWkGNIiGeOvlr3ZWVbl_RKiL5lrPyHo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhYTc2MDllZmQzMTI0YTBiN2Q0ZDYyODQiLCJpYXQiOjE3ODUzMTk1NDEsImV4cCI6MTc4NzkxMTU0MX0.17bQfvW-ViQgSFwTE-OdBVawSZi5ek3veoQMwAMjNsg	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:05:41.185	2026-07-29 10:05:41.186	2026-07-29 10:05:41.186
d65cc4a7-e9f1-4006-94c2-2ea2c646b4a7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjI2YmZkMTJkZWFmYTRjNWM4MDhjODU2IiwiaWF0IjoxNzg1MzE5NjA2LCJleHAiOjE3ODU5MjQ0MDZ9.sLnBwbTksIHsyLTEYPIAjhAh3moYMyhoJgWsQUpm4ao	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3NGRlZWIzM2IxZWNjZmNkNjE5YTY3NmUiLCJpYXQiOjE3ODUzMTk2MDYsImV4cCI6MTc4NzkxMTYwNn0.SPFyL_sSGV53Ph2VEF_vfmzqmKrGf75VrlEHguVj8nk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:06:46.332	2026-07-29 10:06:46.333	2026-07-29 10:06:46.333
8cff10eb-fdeb-4847-a052-684db5214bc5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMWYwMjY4Mzk1YTE4ODQ1ZmYwZDA5NWViIiwiaWF0IjoxNzg1MzE5NjQ3LCJleHAiOjE3ODU5MjQ0NDd9.wY7Zc_7dqde8jpErvpzraGmob1ZZ_14Ei46_fKN_idQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4YTI0MWNjNjNhN2VhMDYxMmJmYjRiMzAiLCJpYXQiOjE3ODUzMTk2NDcsImV4cCI6MTc4NzkxMTY0N30.Eyd8jNr9QBisP8hklOziweT-H6R0ewX7Xkwd9jHeWHY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:07:27.171	2026-07-29 10:07:27.172	2026-07-29 10:07:27.172
e684a137-25ae-4b76-a4f3-4e447d530754	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOWY2NDQzYTlhZDkyZGUxMDE1OWE4MzZmIiwiaWF0IjoxNzg1MzE5NjkxLCJleHAiOjE3ODU5MjQ0OTF9.fvcSjFRcuAgjF74CO_Cj01AOCcCjnIZp8As9RyUqQ_s	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmODVjYzZjOThlY2VkNDczYjEzNjU4ZjUiLCJpYXQiOjE3ODUzMTk2OTEsImV4cCI6MTc4NzkxMTY5MX0.JpjEZj2m1HBFLaUQLTl3YoYXby3sQ2wnyUDhI8R_xC0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:08:11.695	2026-07-29 10:08:11.696	2026-07-29 10:08:11.696
41af1d39-f3a8-4625-a6fc-8d1efab4cffd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTMyMmJhNzBjMWJkYjU2Mzg4NmQ0NjhlIiwiaWF0IjoxNzg1MzE5NzE5LCJleHAiOjE3ODU5MjQ1MTl9.4M3SiTk-cyHrKbhOyQ2j1PU17hB0hJKoj24RJaXZvJE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIyODU1ZDIyNjA5MDYyODJiYzlkNjM0ZDQiLCJpYXQiOjE3ODUzMTk3MTksImV4cCI6MTc4NzkxMTcxOX0.NPMy5ELrD2qYtpEC8S4XBUaqg2h33D_73jN1DMeEWQ8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:08:39.181	2026-07-29 10:08:39.182	2026-07-29 10:08:39.182
f985a253-8653-4d5d-ac84-15ab7aec4469	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOTJiOWE3MGYyNGFhOTQ0OTgwZmE4Y2U4IiwiaWF0IjoxNzg1MzE5NzU4LCJleHAiOjE3ODU5MjQ1NTh9.TOxt2QlOWocXDVJB7jHt3Seh9XVzMp8LzezXriOWFvg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkNzk0ODBiMzkyZjAwMzkyZTc2NGUxNmUiLCJpYXQiOjE3ODUzMTk3NTgsImV4cCI6MTc4NzkxMTc1OH0.YaT_lEbxCz_JkEafnjjYuo3BwgchWGOiu2iv2UXbGIc	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:09:18.308	2026-07-29 10:09:18.309	2026-07-29 10:09:18.309
8af9c22a-40f4-4993-b005-62a32e90b215	478c5039-1567-4117-afc6-2fc27396731f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwianRpIjoiNWUyZWE3ZWM0MGI1ZWI5MmZjZjA5OTNlIiwiaWF0IjoxNzg1MzE5NzU5LCJleHAiOjE3ODU5MjQ1NTl9.qwVdVxMSY-sXE9AFfy3Vi1nQlkuAHC_WzMmbhuvqYz0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxZjIwMmQyYzc0YmZjMDM5M2I0MGQwMzciLCJpYXQiOjE3ODUzMTk3NTksImV4cCI6MTc4NzkxMTc1OX0.bshKH6gsJj_V5FAf7gqOimy9pIJ49TtVMZMk4CKzhy0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:09:19.32	2026-07-29 10:09:19.32	2026-07-29 10:09:19.32
bdbadf37-b3ee-4b48-bc72-02c52c242162	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZmZhNDZmMzc3MDBhOGY4MGJkMDI3M2IzIiwiaWF0IjoxNzg1MzE5ODA1LCJleHAiOjE3ODU5MjQ2MDV9.29bmh0Tz5bIin60ojkMZJA9xPaw1Do8m2eZFOYaAHcA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxNGI5ZjE2ZDBkY2Q1NmJkZDExNjJhZTQiLCJpYXQiOjE3ODUzMTk4MDUsImV4cCI6MTc4NzkxMTgwNX0.7iBLYGnIZn1ipuSnxKz8rpAaaoEf1wuLyRfoiuO8qio	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:10:05.473	2026-07-29 10:10:05.473	2026-07-29 10:10:05.473
2a2abc9a-7d3a-40b8-9164-3e385a52bdde	478c5039-1567-4117-afc6-2fc27396731f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwianRpIjoiNGZmMTYwODhjYmNhZmY5MWVjOTc0YmRkIiwiaWF0IjoxNzg1MzE5ODA2LCJleHAiOjE3ODU5MjQ2MDZ9.n5jwjeng_lVVlVS0S3DOgqVoEuquxPLH-_5_GeMOXeo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0M2Y3MTMzMzczM2EzMjNmY2VmNjNiMTQiLCJpYXQiOjE3ODUzMTk4MDYsImV4cCI6MTc4NzkxMTgwNn0.Gb_nVbOK7itmILH8adrZYaGhBh1a8z99qOf4mq2swCk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:10:06.131	2026-07-29 10:10:06.131	2026-07-29 10:10:06.131
dea80354-e76d-4b4f-b2e6-c1d5e6773544	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTE4ZmE2OTRkOTgxZGU4OTVhMjdhNGZkIiwiaWF0IjoxNzg1MzE5OTAyLCJleHAiOjE3ODU5MjQ3MDJ9.R1WGFqE9tjOO18x5M0Yw-ya1FAzpjZXdDsyz1DKNHOs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI4NjgzNDJlMjQ2OWE4MjJiYjdjMTM3NTgiLCJpYXQiOjE3ODUzMTk5MDIsImV4cCI6MTc4NzkxMTkwMn0.j4Sn6FPuLFpSrbK9PwORhALfuh2aDItUJu1buJteo_E	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:11:42.511	2026-07-29 10:11:42.512	2026-07-29 10:11:42.512
d3518e97-294f-4007-915e-ffd5e472ef05	478c5039-1567-4117-afc6-2fc27396731f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwianRpIjoiMzY0ZmJhMTY2NjgzZjdmODlkNjc5MjJiIiwiaWF0IjoxNzg1MzE5OTAzLCJleHAiOjE3ODU5MjQ3MDN9._RrfYDnIZfKDx6QY5L-qrDtp4AtPKsfIA_WtfWMMdwM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJkYTUyODQ5YTExZDZjZWQ5Y2EyNjBiYTIiLCJpYXQiOjE3ODUzMTk5MDMsImV4cCI6MTc4NzkxMTkwM30.hU6CvCSoWhOQAw6Ce3IVJVnd3rQa1Jn7uqKH4C_JeBA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:11:43.047	2026-07-29 10:11:43.048	2026-07-29 10:11:43.048
558a21c9-8b67-4f2f-b43b-4bd226aa1d2a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTIwMTE2MDdmMTJkYTcxYTRkM2VmYzFhIiwiaWF0IjoxNzg1MzE5OTU5LCJleHAiOjE3ODU5MjQ3NTl9.6Q3o1bv1TRlZrCrZPxVRD-oFKFy-5Atsi0FEoMydZsA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhMTE5MzM2Y2U4M2VlNThlZjkxNzZmNzQiLCJpYXQiOjE3ODUzMTk5NTksImV4cCI6MTc4NzkxMTk1OX0.F4SbK0AAgDSQchBrbqXiJ8L4qzuqEMYyvsxQjSBlvIk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:12:39.931	2026-07-29 10:12:39.932	2026-07-29 10:12:39.932
497c4552-d1f9-41d6-bae0-3386a9b9121e	478c5039-1567-4117-afc6-2fc27396731f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwianRpIjoiNDBkMzk0MGIzZTNhNTEyZjk1MTE2NDg5IiwiaWF0IjoxNzg1MzE5OTYwLCJleHAiOjE3ODU5MjQ3NjB9.37Kmtsm34BEYF3QatV-rfchgxu2rwkpfZO1Hmb4tkdk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzhjNTAzOS0xNTY3LTQxMTctYWZjNi0yZmMyNzM5NjczMWYiLCJ1bmlxdWVJZCI6ImFmZmZlYThjNjhiM2E2ZTQwMDJlZDVkODg2Mzk4NmVhIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5M2ZhY2RiZTEzMGZhMDAwMDQzNTNmMTAiLCJpYXQiOjE3ODUzMTk5NjAsImV4cCI6MTc4NzkxMTk2MH0.UWEa8PDtG4hWjV8LT5ocIY5rMWz20ZwD5fEm4bLuDfA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 10:12:40.443	2026-07-29 10:12:40.444	2026-07-29 10:12:40.444
e6a70530-d397-40dc-886e-4584dad844df	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMzVmNDA2MThkZWFhOTM2ODdiNDA2NDVkIiwiaWF0IjoxNzg1MzIxOTg2LCJleHAiOjE3ODU5MjY3ODZ9.nXTnGHhMGoMdFFpEDxc0SgFmT95Y8TMsZMAs7q_WUwE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0ZDdiMTg1NTJkZmJmMTQ2OWFlMjU5M2MiLCJpYXQiOjE3ODUzMjE5ODYsImV4cCI6MTc4NzkxMzk4Nn0.N-r8c8V3VRMXL-SA9tMGOe3r3-L94D-ggs4iqt_P5zc	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-05 10:46:26.291	2026-07-29 10:46:26.292	2026-07-29 10:46:26.292
e4c53d95-2862-454b-87c3-b45854de91a9	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYzFlNmQxY2E3NzdjMTZjNWFiOWI0YjNlIiwiaWF0IjoxNzg1MzIxOTk1LCJleHAiOjE3ODU5MjY3OTV9.BX6JJ7zxfFswP_HzwwPSOAz3TTT9XaiSa0rp4ysoSTI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwOWIxZGExOGNjMjA3NmMyNjEzNDUzZTAiLCJpYXQiOjE3ODUzMjE5OTUsImV4cCI6MTc4NzkxMzk5NX0.YTx-QtDkAilHYHSJWRPrDh-1vFl0byC2oJrLvmQZgoA	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-05 10:46:35.668	2026-07-29 10:46:35.669	2026-07-29 10:46:35.669
5d687ee0-fdb7-4e50-9a68-12e13f2689bd	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiODk1ZTFhYzUwNzJjODM0OGU5MDEyM2JmIiwiaWF0IjoxNzg1MzIyMDI2LCJleHAiOjE3ODU5MjY4MjZ9.DiTJPVTyT7Ej1AiD6NDlj-MkXkQvT5fDcBTefLrK6ZU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1OWMxZmJlZDIxMjkxYzIxNGM1YTIwZDAiLCJpYXQiOjE3ODUzMjIwMjYsImV4cCI6MTc4NzkxNDAyNn0.8MGBEW3gRBUjDqn7LqAqdIKIkftE2FdoZFA3R0CLu2w	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-05 10:47:06.087	2026-07-29 10:47:06.088	2026-07-29 10:47:06.088
b773c1b3-57e9-4fce-9a19-fa98303d2796	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjk0YWYyYmE3ZTA3MTc3YmY1NzA5ZWU4IiwiaWF0IjoxNzg1MzIyMDQyLCJleHAiOjE3ODU5MjY4NDJ9.p7ho4xi2wXlaIgpMF-up4DqHirMdfAh6wKYzZoa0PfQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiNTQyMDVlYWY5ZTZiMzk1MDFhYTZmYmMiLCJpYXQiOjE3ODUzMjIwNDIsImV4cCI6MTc4NzkxNDA0Mn0.KiP3RTk9SLQY5QXDdcvWAG8hGmBkPh-jQzLJTz9-5rk	{"ipAddress":"::ffff:127.0.0.1","userAgent":"curl/8.4.0"}	::ffff:127.0.0.1	curl/8.4.0	2026-08-05 10:47:22.563	2026-07-29 10:47:22.564	2026-07-29 10:47:22.564
69dc6e53-c475-4ed5-8119-e01f15ede86a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiOGRjZWVkMmQ1ZDAxN2U5ZTQxZmJiOWRkIiwiaWF0IjoxNzg1MzIzMDMxLCJleHAiOjE3ODU5Mjc4MzF9.J3mhrBPRjaWo0nyd26My1mv0-WwuLADU1MQpHHNlqek	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNzkwZmQyZGZmYzViNTRlYTljOWE0YjciLCJpYXQiOjE3ODUzMjMwMzEsImV4cCI6MTc4NzkxNTAzMX0.LNYqyUBkgUsbuKdyHr4wgs3thuFZ0Db2sfvz2p0vMmc	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:03:51.559	2026-07-29 11:03:51.56	2026-07-29 11:03:51.56
62c0efcf-b366-4ecd-8323-4a303909e9a0	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTJlMjY1NTk4ZjY5YzU3NmU0MzQ5ZWQwIiwiaWF0IjoxNzg1MzIzMDU1LCJleHAiOjE3ODU5Mjc4NTV9.4gay8GOsK8voRWbneuXdwaKRjUUWYJgkdzsey-8xdk0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2ZDcxMGUxNDAzNDE1MzZhMTg0ZDJkNDgiLCJpYXQiOjE3ODUzMjMwNTUsImV4cCI6MTc4NzkxNTA1NX0.jsyayGIFm0ltJtU5Rst9M0nNn-pKWKxVJP_rC6Hclh8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:04:15.433	2026-07-29 11:04:15.434	2026-07-29 11:04:15.434
8121b5ca-a3ac-4d8a-960c-114af1599b9a	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMTZhYjNlYzhlM2VhZDcxYmFmMDAzYTQ2IiwiaWF0IjoxNzg1MzIzMDk4LCJleHAiOjE3ODU5Mjc4OTh9.CYkgQm8YuaJNqJ5DFo9XeEA2q0i-7eAmWgx0KMza6jQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwMWU4ZDRjZDFjNGJlYjhmODI0NGVjY2EiLCJpYXQiOjE3ODUzMjMwOTgsImV4cCI6MTc4NzkxNTA5OH0.lGR8nY7WPGvdCyht5MzuKneT81dp9HBxekKDPoKAM3U	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:04:58.964	2026-07-29 11:04:58.965	2026-07-29 11:04:58.965
db5ff69d-ec06-4c8b-8be2-a79fac7d518f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZmM1ZjU1MGEyNjMwNGY5NmNmOGUyMmJjIiwiaWF0IjoxNzg1MzIzMTI4LCJleHAiOjE3ODU5Mjc5Mjh9.5v0D9HlVMla2T7VafMWX6_G7Dxrcp5vn8zVnZ_IQ22E	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxMDQ4YzgyZjI2ZGQ0YWYyMDVmMDBkY2UiLCJpYXQiOjE3ODUzMjMxMjgsImV4cCI6MTc4NzkxNTEyOH0.ne_jJ9Pdg8wPripoyuZO1ognV39k333EJhZzkA_RBTQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:05:28.508	2026-07-29 11:05:28.509	2026-07-29 11:05:28.509
a9261c38-e785-4d76-b413-f1fa0a6dc166	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYjM3ZTk1NTAyMGM1MGI4NTAwMjBlM2Y3IiwiaWF0IjoxNzg1MzIzMTYzLCJleHAiOjE3ODU5Mjc5NjN9.Eq5vS2pYnmer_MV9cmX77osmgSZDD9H5Vhx-l2We-9U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwZDc0M2I2NDQ2N2VhMGI0YzA2N2FhNTYiLCJpYXQiOjE3ODUzMjMxNjMsImV4cCI6MTc4NzkxNTE2M30.0WKG6XdN0ZRVI-KCk_0WUn9TBRCq2LAD5pZZ72YBdhI	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:06:03.739	2026-07-29 11:06:03.739	2026-07-29 11:06:03.739
9609cc5c-fcf3-4c5d-8640-8069a303aeea	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYWY1OWY1NTJhM2Q5YjJiYjZhNWQwNzZjIiwiaWF0IjoxNzg1MzIzMTg5LCJleHAiOjE3ODU5Mjc5ODl9.tHwWSlsZutXatdJcvQ5ZFBDqX8P7u7dLWqgz45R-2FI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmNzg3ZTVmNzRhOTA0OGI1NWUxZGRmZDQiLCJpYXQiOjE3ODUzMjMxODksImV4cCI6MTc4NzkxNTE4OX0.p189t-xl14vCSiBQRon1bHZFZ_-X59rGWBYWI126xg0	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:06:29.494	2026-07-29 11:06:29.495	2026-07-29 11:06:29.495
341ecc32-5f19-449d-b25e-41499cef2858	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZDljNWZlZjgwNDNmYzBkYzFlNzUxNTUxIiwiaWF0IjoxNzg1MzIzMjExLCJleHAiOjE3ODU5MjgwMTF9.-81AXrKrN4vBiDTT6kjBFlu3oFn4Mk0fd585tl62UCY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJiYzVlYzhiOWY5NzdlM2QxZjRkYjZhODAiLCJpYXQiOjE3ODUzMjMyMTEsImV4cCI6MTc4NzkxNTIxMX0._B_WyQ-zokzhjsx54QU2uqqqUfcfk10j_ARAjrpKDAE	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:06:51.216	2026-07-29 11:06:51.217	2026-07-29 11:06:51.217
4b8fbcc5-d9f2-4f74-9544-db5e05f41f0b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTIzYWU5NzIyYjg0MDE4ODliNjAzNWZiIiwiaWF0IjoxNzg1MzIzMjQ4LCJleHAiOjE3ODU5MjgwNDh9.PUfXFNDGtTCeuEEm3Tu-XwHwYSqdoj2cYGQX6WyufHg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjN2U5ZDE2MjAxOWNmYjYyYTk0NGI0NGUiLCJpYXQiOjE3ODUzMjMyNDgsImV4cCI6MTc4NzkxNTI0OH0._ehOpNaJ99HlMD_TwKOg7q6C5KUSDFuuXz1CU9xhIY8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:07:28.104	2026-07-29 11:07:28.105	2026-07-29 11:07:28.105
871000a6-5b0b-4ecf-bbd4-7042506f027f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYTk2ZTcyYTYzOWI0MTZlZDkwNjJmOWQ0IiwiaWF0IjoxNzg1MzIzMzQ5LCJleHAiOjE3ODU5MjgxNDl9.UO-mPFDO5V7QCkim1nzQ_EWZmYVlD_L2cvOwx5UrwKo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjODIyOGQyNzg5MjdkMTUyZDliNGYxMDAiLCJpYXQiOjE3ODUzMjMzNDksImV4cCI6MTc4NzkxNTM0OX0.aOzDLcC8RG4eTuiXW6OqzkwNk6ul3pPb1PogiRIunsk	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:09:09.137	2026-07-29 11:09:09.138	2026-07-29 11:09:09.138
035e51a3-851c-4c56-a02d-06c7df1f7b6c	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMzk5OWQ3OWEyZDUxNmI0NDk3NWUwZDk1IiwiaWF0IjoxNzg1MzIzMzg2LCJleHAiOjE3ODU5MjgxODZ9.BMTr4_vQE_KLwGwfGPhB11NOgccRwO9PeOkAyrMtADs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1MTE2YjNlNmI2NzIwMWE2MmJkN2U5OWQiLCJpYXQiOjE3ODUzMjMzODYsImV4cCI6MTc4NzkxNTM4Nn0.G7FsHRJxPUO45dUzQjcrQU9wI4K2e6UU5T8tw3d7s1k	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:09:46.546	2026-07-29 11:09:46.547	2026-07-29 11:09:46.547
f1d6f5bd-5178-4316-b45f-7e801b9c1f85	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDUwOWJkODk3MTM5MDZjZjI3ZDUwMTg0IiwiaWF0IjoxNzg1MzIzNDIwLCJleHAiOjE3ODU5MjgyMjB9.PE9EiDk0vaBjjSJE16__AK1h6ALKLbF-ocBed5zanNY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxZWQyN2JkNTY4N2NlYjAxYzA2MTJjN2QiLCJpYXQiOjE3ODUzMjM0MjAsImV4cCI6MTc4NzkxNTQyMH0.B5RCTfGVB_Vk5WhFDZONHrbE1WgYSUOXCJcq-UjEi9o	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 11:10:20.12	2026-07-29 11:10:20.121	2026-07-29 11:10:20.121
586714ec-8399-4099-8cce-8aea9ff1dabb	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDNlODU3OTA3YmQzMDNiMmI5YTMxZGNmIiwiaWF0IjoxNzg1MzMzMTYwLCJleHAiOjE3ODU5Mzc5NjB9.wc7OJq1BIRBqlg3ylJ75ShqxYwwFd0VirllhbMjkXa8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0OGE1ZmZiNjU0ODc3YjgxOWVjZTUwOTUiLCJpYXQiOjE3ODUzMzMxNjAsImV4cCI6MTc4NzkyNTE2MH0.6uvM93i8K3xZ_6GUY0-3_M9sF2QdmByP8jwV8oxncQQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 13:52:40.396	2026-07-29 13:52:40.397	2026-07-29 13:52:40.397
11b8a6a9-c435-4916-8f45-9c7735b76b78	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNTljZTVmN2ZjNDBiMzU4Y2YzMzcyMjJjIiwiaWF0IjoxNzg1MzMzMTYxLCJleHAiOjE3ODU5Mzc5NjF9.TABcXF3Aw9xKOX6XXmjsRXe8KSAQtzm19V7BUfdA6_w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjNDAyM2RlYTMwM2ExM2U5OTBjMjVlMDQiLCJpYXQiOjE3ODUzMzMxNjEsImV4cCI6MTc4NzkyNTE2MX0.mTacbJcHjtlBd8FxpX7x9pEnrYbeKzvw7ExnbKM7EqQ	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 13:52:41.047	2026-07-29 13:52:41.048	2026-07-29 13:52:41.048
7b550ebb-504e-401c-968b-dfe98dad1d23	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYmNhZmE0M2M2ZWU1OTRjYjM0ZTA2MDBjIiwiaWF0IjoxNzg1MzMzMjIxLCJleHAiOjE3ODU5MzgwMjF9.MDdK1yFLZd1CjKtoZ2YYACPD7HSPv22da0rHuVQy3so	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxNzc2ODJiODMwN2M1YjFiZWNiYjY0ZTIiLCJpYXQiOjE3ODUzMzMyMjEsImV4cCI6MTc4NzkyNTIyMX0.O_IYAfvgRJXhdlvoTt8p0N3jzV4Qzirp2TN5soY_BYY	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 13:53:41.916	2026-07-29 13:53:41.917	2026-07-29 13:53:41.917
01eef16c-b590-441b-83ae-ec83f57ac9b3	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZGY5MGFiZmQxOGY3NWQyOTc1ZTkyNDBlIiwiaWF0IjoxNzg1MzMzMjIyLCJleHAiOjE3ODU5MzgwMjJ9.EPWjYqXUbdiW3P6DEkYiiMqJUISqsoKoGsGH0PM3Ztg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI5NGQwNzY4YTExNTcwMTY4Y2VkZDNiOTgiLCJpYXQiOjE3ODUzMzMyMjIsImV4cCI6MTc4NzkyNTIyMn0.YdABdezI1pkdGj3C1V1jgFDWKQBn3WLomztIiFe---U	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 13:53:42.425	2026-07-29 13:53:42.426	2026-07-29 13:53:42.426
15f2257b-541f-4d9b-9979-df4a064804c5	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDMzMWRkYzJmOTc0OGYxZjkyN2I3OTZkIiwiaWF0IjoxNzg1MzMzMjU2LCJleHAiOjE3ODU5MzgwNTZ9.P7eUHBKoURP0yKNLE8_KMh07q5Yx_qHOfL_TQ12qAF8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzZWY2Yzk0MmU4NjI4ZDhkOWIxMTkzYjkiLCJpYXQiOjE3ODUzMzMyNTYsImV4cCI6MTc4NzkyNTI1Nn0.i4DZOmGhkX-PylSNYJJXi9lryg9SMH_yEXlOl9pa1Vg	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 13:54:16.591	2026-07-29 13:54:16.592	2026-07-29 13:54:16.592
ba773b5a-c6b6-46f2-852c-75387c9f4d0b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiZTA0ZTdlZDVhNjFmZWM1YjRhMTBjZDdhIiwiaWF0IjoxNzg1MzMzOTAwLCJleHAiOjE3ODU5Mzg3MDB9.__qxR6fHTJ0B-0_RskKV_yG8mQO-tlac34M5LCeBCzg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJmMzcyNGE0NjNkNTc4Y2NmZmQ2OGI2OGUiLCJpYXQiOjE3ODUzMzM5MDAsImV4cCI6MTc4NzkyNTkwMH0.AcEGQKeh8lbL4OIBb7zrXV1pDyckMyHFjUr4965IcL4	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:05:00.572	2026-07-29 14:05:00.573	2026-07-29 14:05:00.573
029bdf1a-f7b8-4530-8665-06ab244fddcf	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiYWYwMTFiYzJiOGYxMDYzNTIxNzk3Mjg5IiwiaWF0IjoxNzg1MzMzOTYyLCJleHAiOjE3ODU5Mzg3NjJ9.5wlLWiXlNoF28i37X0Ek2_g99Ql7R4odyxYRN4qXpDA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI0YTEwZDhiNWU4YmExYjJkYmUyNzA4ZWUiLCJpYXQiOjE3ODUzMzM5NjIsImV4cCI6MTc4NzkyNTk2Mn0.26zlENg4LGSu1N_s3G23A8lXE0shza9X6lKGdIWcUqs	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:06:02.084	2026-07-29 14:06:02.084	2026-07-29 14:06:02.084
d34897a3-e7c0-454e-aed2-ff1284364d7b	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNzVmZjE4MTVkZTZiZDE2MWU2NzY2Mzc2IiwiaWF0IjoxNzg1MzM0MzYyLCJleHAiOjE3ODU5MzkxNjJ9.coNqO9_KmSQzbIcUYLPMpSDgz8UXyepXeA2I2oOuaO0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI3ZTBkYzA1MjI0ZDIyMTJkZDEzNjAxYTAiLCJpYXQiOjE3ODUzMzQzNjIsImV4cCI6MTc4NzkyNjM2Mn0.8jnOfBW4J4su6NhBqKE12b18qcJpwbVxCxbaNqKwJUA	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:12:42.412	2026-07-29 14:12:42.413	2026-07-29 14:12:42.413
68d81c85-bb7f-4b4d-961d-900226fbb16e	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiM2Y1NzVhNzAwYmM2MDBhNjUwMjRhZjE4IiwiaWF0IjoxNzg1MzM0NDc4LCJleHAiOjE3ODU5MzkyNzh9.gede6YjT6lOgkf5aT2sDe79umRUWSPUr3sMSGbvc7Rk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIxZmE2MmE0NGMxMGEwMmI2MDY3MTRkNDMiLCJpYXQiOjE3ODUzMzQ0NzgsImV4cCI6MTc4NzkyNjQ3OH0.5UJOiP8wnkvuSozEW1oa0OvTMJKxvrmtQI5WpEjQyuM	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:14:38.951	2026-07-29 14:14:38.952	2026-07-29 14:14:38.952
b1650db5-af6d-4a6d-af09-9ead88ec51f2	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiN2ZiZmI5YWRiYzBhZTk0YjUyNjhmMzRjIiwiaWF0IjoxNzg1MzM0NTUxLCJleHAiOjE3ODU5MzkzNTF9.CeMTcc-Hgp5iM3VRPl2kJ_B-AuZndlPtsIcWO2VNVyA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIzYTdjYThiN2U3YjAwNDM4N2RjODJiYmUiLCJpYXQiOjE3ODUzMzQ1NTEsImV4cCI6MTc4NzkyNjU1MX0.en7x7Zq4l1PsDtUf-FYJwSFomvxTKrk6nc2rJInxJq8	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:15:51.849	2026-07-29 14:15:51.85	2026-07-29 14:15:51.85
72254a77-1ec4-4327-a76d-f9758d5a7f8d	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDkyNGY5MGYyMmJlZTk3OGMzYzZkM2Y3IiwiaWF0IjoxNzg1MzM0NjA0LCJleHAiOjE3ODU5Mzk0MDR9.SngyXUo7Q-85MVmXyXT0HWW_XZXWjIEAOanl2HzU0hk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwMDVhZmZlMjA1Y2U4ZTYyNmNlYTA2NDciLCJpYXQiOjE3ODUzMzQ2MDQsImV4cCI6MTc4NzkyNjYwNH0.hyAA8FTv50whf2o2XdQkjvPLn8t2ckqTmqHDwbxLA9g	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:16:44.151	2026-07-29 14:16:44.152	2026-07-29 14:16:44.152
6f71cdcb-e7c0-4abe-9fef-fa8c8ec7b48f	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiMDVkMTMxNWE5NDliMWEyMTMyMGM4Yjc4IiwiaWF0IjoxNzg1MzM0NjQyLCJleHAiOjE3ODU5Mzk0NDJ9.v0v6bNCAsbMV782S0rV9rUApBb8QcKj4G38VmDFFAlo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI1ZDQ3ZGZkOTY4M2MwYTU0NjBlNWU2YWYiLCJpYXQiOjE3ODUzMzQ2NDIsImV4cCI6MTc4NzkyNjY0Mn0.ouM9IVMqK-bvEEFB5gXE_mhDNgvZ715oop6ix2Fyx0U	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:17:22.524	2026-07-29 14:17:22.524	2026-07-29 14:17:22.524
982c5ad4-572f-454a-8ca8-2c3d71727ca7	df440e3c-56cc-4455-8426-9a279bc58f6c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwianRpIjoiNDZmMmEzNTQwMWJkMTkzM2MzYjY1ZjU1IiwiaWF0IjoxNzg1MzM0Njc3LCJleHAiOjE3ODU5Mzk0Nzd9.g7mwek0drv0nNIGIx4NnskYYGsNrsk1kgBaC0R5qlf0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjQ0MGUzYy01NmNjLTQ0NTUtODQyNi05YTI3OWJjNThmNmMiLCJ1bmlxdWVJZCI6ImFlYTc1MTZmZWU1NWI1ODkzYjcwMTQ3NzVkMzRmZmIxIiwidHlwZSI6InJlZnJlc2giLCJqdGkiOiIwOGFjZWMzNjBjMDM1ZWE1YzdmMjMxYjUiLCJpYXQiOjE3ODUzMzQ2NzcsImV4cCI6MTc4NzkyNjY3N30.4b92FJxDgcCmQtUn3AhTqa1LXfn-MfWYzJMHEJtrm90	{"ipAddress":"::1","userAgent":"curl/8.4.0"}	::1	curl/8.4.0	2026-08-05 14:17:57.141	2026-07-29 14:17:57.141	2026-07-29 14:17:57.141
\.


--
-- Data for Name: SmsVerification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SmsVerification" (id, phone, code, type, "expiresAt", verified, "createdAt") FROM stdin;
57b655e3-57e9-4ccf-b4f7-f98ad10a48c8	test@example.com	534608	login_email	2026-07-20 00:54:07.641	f	2026-07-20 00:24:07.698
0738af83-cfb2-4102-9892-24bcf6008787	13800138000	984251	login	2026-07-20 00:30:32.107	f	2026-07-20 00:25:32.13
4f30bb3d-f5f1-47d4-b1df-d8569d5c0d11	13900139000	509940	register	2026-07-20 00:30:39.922	f	2026-07-20 00:25:39.923
9d521db5-8e3a-420d-b06f-1272643a0af6	15000000001	757797	register	2026-07-20 00:31:21.162	t	2026-07-20 00:26:21.163
afeeda3d-db5f-41d6-8695-0f87b8793769	15000000002	625246	register	2026-07-20 00:33:05.513	t	2026-07-20 00:28:05.536
af4a2213-76ea-47eb-8e27-bf7d9ebd766c	13800138000	283551	register	2026-07-20 01:01:11.224	f	2026-07-20 00:56:11.248
4f57e215-b35e-42bf-b618-4bd8ca453122	13800138001	489974	register	2026-07-20 01:01:50.006	f	2026-07-20 00:56:50.008
9d99f105-43f9-4d2d-b41f-ea978126be0f	13800138002	658275	register	2026-07-20 01:03:25.709	t	2026-07-20 00:58:25.71
522de12a-ed7a-4a41-b66f-595b15be5480	13800138003	248010	register	2026-07-20 01:06:12.669	t	2026-07-20 01:01:12.67
9e27e303-b8b3-4dc4-b190-25667e2aa642	13800138004	541018	register	2026-07-20 01:06:17.95	t	2026-07-20 01:01:17.951
cc628bd4-6530-4121-ac9d-1d68f14b253d	13800138005	599587	register	2026-07-20 01:15:00.626	f	2026-07-20 01:10:00.628
587627d2-cbdc-45ad-bcc5-4ce24d7cd081	13800138004	835944	login	2026-07-20 05:09:44.952	f	2026-07-20 05:04:44.953
1b708c3d-3a0a-488e-95f2-a2d4262af77a	13800138004	794769	login	2026-07-20 05:10:43.281	f	2026-07-20 05:05:43.282
984b4e0c-a6a3-422f-969a-94433f63d192	13800138004	524446	login	2026-07-20 05:12:46.618	f	2026-07-20 05:07:46.621
e587d0c4-80d3-4aa7-8a32-99c86797cbdd	13800138004	730634	login	2026-07-20 05:13:31.711	f	2026-07-20 05:08:31.713
c31a8ee1-4c4f-4d8c-876b-8c8cc65f8ed5	13800138004	479448	login	2026-07-20 05:13:33.413	f	2026-07-20 05:08:33.414
3b577ff1-0fca-4222-a321-39ce3fedea12	test@example.com	794901	login_email	2026-07-20 05:39:47.108	f	2026-07-20 05:09:47.109
592d4ab5-51fd-4ec2-b4d0-c2f260217452	13800138005	745873	login	2026-07-20 05:15:54.73	f	2026-07-20 05:10:54.731
d091dd2c-fabe-44a1-9411-90220e325742	test@example.com	896735	login_email	2026-07-20 05:40:55.161	f	2026-07-20 05:10:55.162
d4e4e65c-9097-45f9-a3f7-ff0892658e8d	13800138005	203330	login	2026-07-20 05:17:34.113	f	2026-07-20 05:12:34.114
942f26e4-a77d-4b6b-a02a-a1a00358a487	test@example.com	693306	login_email	2026-07-20 05:42:34.542	f	2026-07-20 05:12:34.542
a83dd313-4eb4-410f-bc9f-213a41ed1bcc	13800138005	801144	login	2026-07-20 05:18:16.734	f	2026-07-20 05:13:16.735
79865bab-ad4f-4ccd-a419-a7dc8ad42a3d	13800138005	510030	login	2026-07-20 05:19:48.244	f	2026-07-20 05:14:48.245
d30937f0-77cc-4032-918c-bf3e2a7918af	13800138005	275939	login	2026-07-20 05:20:35.512	f	2026-07-20 05:15:35.513
1e4e5bf6-086a-41a0-b610-cd155ce47e06	13800138000	372620	login	2026-07-20 06:13:42.936	f	2026-07-20 06:08:42.937
fca5fbe2-e7fb-4924-a231-a43b1dd7169c	test@yandao.vip	515223	login_email	2026-07-20 06:38:43.666	f	2026-07-20 06:08:43.666
154a37d0-2e7c-48da-addb-671c91bad98e	13800138000	613183	login	2026-07-20 06:14:26.31	f	2026-07-20 06:09:26.311
97f7afb9-378b-44f0-b58d-052f97c882ce	13800138000	981708	login	2026-07-20 06:19:45.997	f	2026-07-20 06:14:45.998
9e34e597-c764-4f93-a2f9-79edbaefa24b	test@yandao.vip	618412	login_email	2026-07-20 06:44:46.583	f	2026-07-20 06:14:46.584
f6b89458-2b81-4757-aa23-96925bbeca0d	test@yandao.vip	268530	login_email	2026-07-20 07:51:32.123	f	2026-07-20 07:21:32.124
7a2ce272-8446-4615-b981-aa5c5e51faf9	+8613800138000	398277	login	2026-07-20 07:30:28.223	f	2026-07-20 07:25:28.224
becc9c47-4367-4141-92b5-1db865c7c99a	test@yandao.vip	989219	login_email	2026-07-20 07:55:30.217	f	2026-07-20 07:25:30.218
e71205d5-f512-4023-83f1-dc23945fbc5a	wuzhimin666@163.com	632936	login_email	2026-07-21 04:54:37.443	f	2026-07-21 04:24:37.444
f110dc41-0576-42ba-8821-4698974c7484	wuzhimin666@163.com	605503	login_email	2026-07-21 09:53:54.865	f	2026-07-21 09:23:54.866
40db29ec-1477-4284-89f6-0db6f8c3f803	13800138001	838095	register	2026-07-21 10:18:21.168	f	2026-07-21 10:13:21.169
9f127cc8-1f51-4631-bc1e-96b76957afec	test@example.com	445320	register_email	2026-07-21 10:43:21.335	f	2026-07-21 10:13:21.335
f01f01c6-24a5-42fd-a018-c82bfb8128fa	13800138001	272980	register	2026-07-21 10:24:26.774	f	2026-07-21 10:19:26.775
bd59f8d9-d8a6-4828-8154-474c0354e036	test_1784629166704@example.com	177488	register_email	2026-07-21 10:49:26.936	f	2026-07-21 10:19:26.937
8d6de81a-c579-43e6-9985-de28a692741f	+8613800138001	894682	login	2026-07-21 12:04:11.302	f	2026-07-21 11:59:11.303
ef2eb557-d89d-4717-9d1c-2b39de07437b	wuzhimin666@163.com	954191	login_email	2026-07-21 12:40:40.929	f	2026-07-21 12:10:40.93
1d1d03d0-6a85-4d1c-8b44-dc35e8b8077c	13900139001	474541	login	2026-07-21 12:19:27.013	f	2026-07-21 12:14:27.014
13c9c68b-f088-41eb-a1fc-ec44ea9e818f	test@yandao.vip	797149	login_email	2026-07-21 12:44:27.45	f	2026-07-21 12:14:27.451
00141948-bacc-4556-a6e6-ba5f47416210	13480010005	830413	login	2026-07-21 12:30:23.814	f	2026-07-21 12:25:23.815
7ca47e1a-bdc5-4fd0-a1e8-d3ed9ec561e5	wuzhimin666@163.com	233572	login_email	2026-07-21 12:55:26.401	f	2026-07-21 12:25:26.402
798c6a3a-0dba-4e01-8bbe-d7bf36cdcf91	wuzhimin666@163.com	130221	login_email	2026-07-21 12:57:25.316	f	2026-07-21 12:27:25.317
9959c60c-71d3-43e7-9fdf-70ff7e4742e4	13480010005	513951	login	2026-07-21 12:32:22.754	t	2026-07-21 12:27:22.755
7d1f2270-d612-4679-8888-28e34c37fcc0	13480010005	239451	login	2026-07-21 12:56:30.186	f	2026-07-21 12:51:30.187
024c40b0-4751-42f1-bf83-84803bac2087	wuzhimin666@163.com	377167	login_email	2026-07-21 13:21:32.227	f	2026-07-21 12:51:32.228
d1d8eaa3-404a-4685-a32b-3ece0047e12b	13480010005	767196	login	2026-07-21 13:06:04.531	f	2026-07-21 13:01:04.532
4f150c1a-355e-463b-abe6-ff04f6851760	wuzhimin666@163.com	413130	login_email	2026-07-21 13:31:05.839	f	2026-07-21 13:01:05.84
f159108e-a3ce-4e32-a006-6c7c9db53009	13900139001	383918	login	2026-07-21 13:07:13.123	f	2026-07-21 13:02:13.124
8e1368b1-31f0-4e92-a492-db9d9c4147f1	13480010005	350805	login	2026-07-21 13:07:56.065	f	2026-07-21 13:02:56.066
f5018c07-1772-4f67-8a60-4447341a093e	13480010005	481416	login	2026-07-21 13:09:07.561	f	2026-07-21 13:04:07.562
692cdcea-f712-48fe-8911-488d4aff49ff	13480010005	441076	login	2026-07-21 13:14:11.505	f	2026-07-21 13:09:11.506
d4ff0cd5-d579-4f2c-85ce-77269443c176	wuzhimin666@163.com	633803	login_email	2026-07-21 13:39:12.854	f	2026-07-21 13:09:12.854
a45878b8-2b52-4836-b3f3-b5496cc47b91	wuzhimin666@163.com	507974	login_email	2026-07-21 13:46:05.891	f	2026-07-21 13:16:05.892
5cff77d6-ec73-4b75-a1b5-d7b217dacead	13480010005	906987	login	2026-07-21 13:21:09.022	f	2026-07-21 13:16:09.022
2c71562b-6ed1-43ea-b1a1-196ff43b462b	+8613900139001	469063	login	2026-07-21 13:59:10.338	f	2026-07-21 13:54:10.339
49cf7bef-4348-40b2-91d9-cbfd1188a923	+8613900139001	377644	login	2026-07-21 14:37:58.028	f	2026-07-21 14:32:58.029
ef6fd7ff-29cb-492d-be20-3f1e5f7c3c76	wuzhimin666@163.com	974516	login_email	2026-07-21 15:02:59.187	f	2026-07-21 14:32:59.188
dd081828-d853-44a7-8b52-182f3a544c37	13800138000	782752	login	2026-07-23 09:41:26.479	f	2026-07-23 09:36:26.48
7cff6a2e-5155-4a65-a7f0-cd955ba3f7cf	13800138000	104295	login	2026-07-23 10:02:53.855	f	2026-07-23 09:57:53.856
048935ff-3416-409a-b52c-00df0346fa68	13800138000	364118	login	2026-07-24 01:44:45.381	f	2026-07-24 01:39:45.382
ee580b84-6b01-4bd8-b62d-fb4cc9f6b41c	13800138000	337961	login	2026-07-24 02:52:14.82	f	2026-07-24 02:47:14.821
271b5775-87c6-418a-8ffe-f3a2e83c5460	13480010005	301522	login	2026-07-26 01:08:28.584	f	2026-07-26 01:03:28.585
9f039e29-2e4c-424e-ad3c-c1d084e902fa	13480010005	170036	login	2026-07-26 01:08:48.36	f	2026-07-26 01:03:48.361
754dcc4b-0719-4ab9-9c97-4bf8c54baf6a	13480010005	625900	register	2026-07-26 01:43:42.419	f	2026-07-26 01:38:42.419
491f1485-7c95-41fb-a00a-d0f2cfda2a51	13480010005	481408	login	2026-07-26 01:54:14.908	f	2026-07-26 01:49:14.909
d91277a5-654d-4b22-ae3e-0019eba5ee33	13480010099	401206	register	2026-07-26 02:03:41.846	f	2026-07-26 01:58:41.847
4151414c-40d3-4abe-ade3-45ea965f3ece	probe_test@example.com	673714	register_email	2026-07-26 03:02:53.608	f	2026-07-26 02:32:53.626
d2c20be7-b25b-4ba7-b9bd-10f4e2c404c5	probe_test@example.com	423997	register_email	2026-07-26 03:02:54.042	f	2026-07-26 02:32:54.043
8348b150-c245-4895-91d6-6142967da809	probe_test@example.com	903740	register_email	2026-07-26 03:02:57.296	f	2026-07-26 02:32:57.297
8aade6cb-b059-4f54-a2ec-cb82fd2fa0aa	13800138000	767351	register	2026-07-26 02:37:57.736	f	2026-07-26 02:32:57.737
88a843b5-46ac-4532-9411-a70b40a6121e	verify_1785034391421583@test.com	874920	register_email	2026-07-26 03:23:11.779	f	2026-07-26 02:53:11.78
1feb7f19-686e-41b9-a1eb-7a8c06447e9c	13800138099	783105	register	2026-07-26 02:58:12.143	f	2026-07-26 02:53:12.143
62101b94-cf65-4c28-acb1-5539f5cf33ca	verify_17850344583183718@test.com	816613	register_email	2026-07-26 03:24:18.646	f	2026-07-26 02:54:18.647
735cadea-6841-4482-9463-7468b1fb541d	13800138099	405317	register	2026-07-26 02:59:19.021	f	2026-07-26 02:54:19.021
65464622-d875-4ee7-8d13-765bfb4f1361	16712340001	246810	register	2026-07-26 17:59:21.371	t	2026-07-26 17:49:21.371
e935d937-9656-43e6-a35d-309620ea64ca	13900000001	359296	login	2026-07-26 11:29:11.309	f	2026-07-26 11:24:11.31
7be33bb1-f2a5-49e1-898c-7b2f6e3d8da1	13900000001	992804	login	2026-07-26 11:34:46.768	f	2026-07-26 11:29:46.769
2be3af6d-5047-4662-abd1-b5b25a1731cb	13900000001	607079	login	2026-07-26 11:35:08.366	f	2026-07-26 11:30:08.366
cd7c9450-6794-4fa4-b83f-d4c365b3e1c1	13900000001	651746	login	2026-07-26 11:35:47.879	f	2026-07-26 11:30:47.88
15edd760-2e9e-4660-9031-c7d0d6d7ee1a	13900000001	289153	login	2026-07-26 11:36:48.473	t	2026-07-26 11:31:48.474
74fe9d69-e795-4f10-a1ab-fa92a14c4712	13900000002	285783	login	2026-07-26 12:13:05.719	t	2026-07-26 12:08:05.72
\.


--
-- Data for Name: SocialTimeline; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SocialTimeline" (id, "actorId", type, content, metadata, "likeCount", "commentCount", "createdAt") FROM stdin;
5c11e7f0-deaa-4457-b1e9-a0b57cecb39f	df440e3c-56cc-4455-8426-9a279bc58f6c	post	Part 3 测试动态 - 验证写入功能	{"images":[]}	0	0	2026-07-29 14:12:51.896
7593850c-396f-423b-a019-ce505a234b32	df440e3c-56cc-4455-8426-9a279bc58f6c	post	终验测试	{"images":[]}	0	0	2026-07-29 14:15:55.747
\.


--
-- Data for Name: SocialTimelineLike; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SocialTimelineLike" (id, "postId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: SpeechEvaluationRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SpeechEvaluationRecord" (id, "userId", "planId", "audioUrl", transcript, "referenceText", pronunciation, fluency, accuracy, completeness, "overallScore", feedback, "weakWords", "createdAt") FROM stdin;
\.


--
-- Data for Name: SystemConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemConfig" (id, key, value, description, "updatedAt") FROM stdin;
396e3556-03ab-4c05-bd76-2d2c31ae36b5	admin.op_password	Admin@2026	\N	2026-07-27 22:45:46.429
36f64128-0a53-4c44-a27c-0b147e21c14c	admin.user_ids	["df440e3c-56cc-4455-8426-9a279bc58f6c"]	\N	2026-07-28 02:43:33.705
\.


--
-- Data for Name: TerminologyEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TerminologyEntry" (id, "languageCode", term, definition, "partOfSpeech", domain, examples, synonyms, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TranslationBillingBalance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TranslationBillingBalance" (id, "userId", "trialTotalSec", "trialUsedSec", "subType", "subExpiresAt", "subUsedSec", "adminTimeSec", "updatedAt", "createdAt") FROM stdin;
132423dd-b580-41b0-991c-71a5ad1b97c1	df440e3c-56cc-4455-8426-9a279bc58f6c	300	11	\N	\N	0	0	2026-07-29 09:38:06.162	2026-07-29 03:01:55.345
\.


--
-- Data for Name: TranslationBillingLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TranslationBillingLog" (id, "userId", scene, "consumedSec", source, "orderId", "requestId", "balanceAfterSec", "createdAt") FROM stdin;
5fddfc15-448a-43f8-a199-09d54dd1e333	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5i0rnu_df440e3c_izxl	240	2026-07-29 03:01:55.353
14e9d457-bcb8-4763-ba1c-99f9208d245c	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5jefg8_df440e3c_eb9h	238	2026-07-29 03:40:32.319
61978bbc-c670-4056-8f9a-4ac0050a6c9b	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5jeq1e_df440e3c_jvu4	237	2026-07-29 03:40:46.04
96e3da34-d4ee-4454-b02e-a8095d245f82	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5jf0z4_df440e3c_v6k7	235	2026-07-29 03:41:00.214
6d44bec3-ff4d-469b-b774-bfda4ae9fd38	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5w5zz7_df440e3c_154k	233	2026-07-29 09:37:54.025
bda83f98-0a04-47f5-a704-a5c074f1e8f8	df440e3c-56cc-4455-8426-9a279bc58f6c	conversation_translate	60	trial	\N	stream_ms5w68k7_df440e3c_1cjc	231	2026-07-29 09:38:05.148
\.


--
-- Data for Name: TranslationMemoryEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TranslationMemoryEntry" (id, "sourceLanguage", "targetLanguage", "sourceText", "targetText", context, "qualityScore", "reuseCount", source, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TranslationPackageOrder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TranslationPackageOrder" (id, "userId", "orderNo", "packageType", "minutesTotal", "minutesUsed", "priceCny", "expiresAt", status, "paidAt", abnormal, "abnormalNote", "abnormalMarkedAt", "abnormalMarkedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "uniqueId", phone, email, "passwordHash", "wechatOpenId", "wechatUnionId", nickname, avatar, "birthDate", gender, "membershipLevel", "membershipExpiry", "isActive", "isVerified", "isGuest", "lastLoginAt", "lastLoginIp", "failedLoginAttempts", "lockedUntil", "lastSyncAt", "syncVersion", "createdAt", "updatedAt", "deletedAt", "ownerType", "ownerId", "directReferrer", "originChannel", "inviteCode", referrer, xp, disabled, "privacySettings") FROM stdin;
478c5039-1567-4117-afc6-2fc27396731f	afffea8c68b3a6e4002ed5d8863986ea	15000000001	\N	$2a$10$HZxcdeb7JM/nIj.8p6Iplu2oIOycbZPFDC2RvRsU2.DFzmCUcnL2u	\N	\N	测试用户	\N	\N	\N	free	\N	t	t	f	2026-07-29 10:12:40.44	::1	0	\N	\N	0	2026-07-20 00:27:08.388	2026-07-29 10:12:40.441	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YD5068A1	\N	0	f	\N
26fbb7c1-cf41-4dc4-851d-c84895b07002	bd98202a432234ae5b62c5106fe701bb	15000000002	\N	$2a$10$Hvv3jsKi8HiA8YaLdDqbzucrQJoPiJ4IfAD8RgSn54byugaP1GmBa	\N	\N	LangTest	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-20 00:28:06.581	2026-07-20 00:28:06.581	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YD5158F9	\N	0	f	\N
4496260c-9f53-46a2-b249-539e5fe4c7db	73bdc70a126c699922f7d8df514cc8f6	13800138002	\N	$2a$10$zVgOdx4KctpThp3FruC2ZevBzgnkZiwd.mN.RYXlJOjAFjFKkjcz6	\N	\N	TestUser	\N	\N	\N	free	\N	t	t	f	2026-07-20 01:01:12.245	::ffff:127.0.0.1	0	\N	\N	0	2026-07-20 00:58:27.784	2026-07-20 01:01:12.246	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YD22FDFE	\N	0	f	\N
041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	a3890f637f703b97152dbf0b6c1e355a	13800138003	\N	$2a$10$nYwJfZPg86cIPQA0eLsYnuKb909Di0c0ITiA0du91tIU5vPFFQjQ2	\N	\N	NewUser	\N	\N	\N	free	\N	t	t	f	2026-07-20 01:01:16.243	::ffff:127.0.0.1	0	\N	\N	0	2026-07-20 01:01:14.451	2026-07-20 01:01:16.244	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YDB7ECC7	\N	0	f	\N
f617404b-819e-4c7d-b4a5-8032b0b899cd	6c47fdb46aadec5f014af2a4c75e87e3	+8613800138001	audit_test@ailos.internal	$2a$10$teLStocx3bJPbxXBq3EZrOVaJa8t3bJo/QQRS4OFtp4JXKn0hur7O	\N	\N	\N	\N	\N	\N	free	\N	t	t	f	2026-07-20 15:46:57.836	::ffff:127.0.0.1	0	\N	\N	0	2026-07-20 14:42:57.37	2026-07-20 15:46:57.839	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YDA095A2	\N	0	f	\N
936fc045-7b74-4e58-b9f0-dea7ef2776aa	84cb9ec3448eb5286839d3e8609ace1b	\N	\N	$2a$10$9XTri/53yluIVaVu/OKAOOT4jQAxkCRyISmo8jqDqOhRp0AOKeb7a	\N	\N	\N	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-20 23:31:19.606	2026-07-20 23:31:19.606	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YDD0B69F	\N	0	f	\N
7b8e0888-8843-4971-b6ef-a84794f2e797	575114bba7d8a1510be24559bdc3c687	\N	p1test@test.com	$2a$10$anDze9Zw2sQuz/4iq43aYeuNTigQSOObkjkVxuu/65bWrwlCSbbPG	\N	\N	P1Tester	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-21 00:14:51.12	2026-07-21 00:14:51.12	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YDCA3E45	\N	0	f	\N
bee326da-b724-4e53-a833-97b113038280	b923f4337ec97f2a	13900000001	\N	$2a$12$QgfjhJPJFMUpNocENcWS.O/a4FZunToDouk2yYdxwsmiU4t700jLK	\N	\N	SMS测试	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-26 11:31:54.408	2026-07-26 11:31:54.408	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
5b952aaa-610a-4ad2-a7a8-408772bbdc19	25c8cb5ccf01ca6c7c871042425bc53a	\N	\N	\N	\N	\N	\N	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-23 09:36:31.379	2026-07-23 09:36:31.379	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
8386f81b-0baa-4e88-aa90-d6e394fb8ebf	YD023FB2F13F6F	test_fp_a	\N	$2a$10$PXA7vWfhWflI0OcggUXWluszQXYwgdCYGC3aD9nGxUaIO84sDhN9m	\N	\N	设备指纹验证A	\N	\N	\N	free	\N	t	f	f	2026-07-27 13:10:10.946	82.156.228.87	0	\N	\N	0	2026-07-27 13:02:02.466	2026-07-27 13:10:10.947	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c07cd9b6-3a93-475e-8f27-3fa34ce4a019	YDF60FE2CC9F3D	test_fp_b	\N	$2a$10$PXA7vWfhWflI0OcggUXWluszQXYwgdCYGC3aD9nGxUaIO84sDhN9m	\N	\N	设备指纹验证B	\N	\N	\N	free	\N	t	f	f	2026-07-27 13:10:11.118	82.156.228.87	0	\N	\N	0	2026-07-27 13:02:02.47	2026-07-27 13:10:11.119	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
d6cdc807-a203-4af0-953d-16ded2c5d9d6	2c0f4ed72c4e2f24	13900000002	\N	$2a$12$PsRZJBnQa4l3fA2Art5LkevXR7wro.OydYHhFlJz8wr8I7HQbI5jC	\N	\N	\N	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-26 12:08:11.414	2026-07-26 12:08:11.414	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
74fdf81a-5312-4b3b-b207-5cc044f7bc5a	2468b2bc129414a1f9f5a660f66e9936	13800138004	\N	$2a$10$FZ8T3b/0yrKdPC8dUuFjPuzeUiNMPkfjptGyVK/DZsQMe4Foab7U2	\N	\N	FullFlowUser	\N	\N	\N	free	\N	t	t	f	2026-07-20 05:12:36.247	::ffff:127.0.0.1	1	\N	\N	0	2026-07-20 01:01:19.737	2026-07-29 10:09:18.815	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YD359985	\N	0	f	\N
8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	5d2839841fd086b2	16712340001	\N	$2a$12$r82PuexppQM6swwzPqURp.RKjs7ez/l4sD9ozXiHz5GfWQOZzxyZG	\N	\N	P2阶段一验收用户	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-26 09:49:21.719	2026-07-26 09:49:21.719	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
df440e3c-56cc-4455-8426-9a279bc58f6c	aea7516fee55b5893b7014775d34ffb1	13480010005	\N	$2a$10$Pnd3D5VBCoV6rhJGszLuP.GjnCFLdYJP1CXktc3BzSuvtdDvKRacS	\N	\N	test	\N	\N	\N	free	\N	t	t	f	2026-07-29 14:17:57.137	::1	0	\N	\N	0	2026-07-21 12:31:05.287	2026-07-29 14:17:57.138	\N	PLATFORM	df440e3c-56cc-4455-8426-9a279bc58f6c	df440e3c-56cc-4455-8426-9a279bc58f6c	organic	YD21673D	\N	0	f	{"allowDiscover": true, "allowUidSearch": true, "allowGroupInvite": true}
21bcf01d-73f6-4778-8116-f1607abcfa41	test_verify_1784679011119	13900000009	\N	$2a$10$/MYVRTfupnZoJknC5eTgR.f7Fc7MnPcuDrmfpr2hgM86icCICM.VC	\N	\N	VerifyTest	\N	\N	\N	free	\N	t	f	f	2026-07-22 00:11:18.883	::1	0	\N	\N	0	2026-07-22 00:10:11.162	2026-07-22 00:11:18.884	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
3622505d-d626-4278-8db5-ff002849d3f5	test_normal	\N	test_normal@xuewaiyu.local	$2a$12$ReDrJ00Z398.W/H1zAsiP.4Yis9/9Rk.5nymG7wLESNDIUccpSKGy	\N	\N	P2普通测试账号	\N	\N	\N	free	\N	t	f	f	2026-07-27 22:45:47.502	::1	0	\N	\N	0	2026-07-27 14:17:56.894	2026-07-27 22:45:47.503	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c7dc1be6-9803-4a87-8ef7-23bd7c330e5c	p3_test_p3_t06_ms3w0rjk	\N	test_p3_t06@xuewaiyu.local	$2a$12$nCk.SZwYttt45UM91390cuZN7E/L9YuL4ckUIAqCKjZO0b3N.tgsy	\N	\N	P3测试-test_p3_t06	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:59.11	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:17.457	2026-07-28 00:15:59.111	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
5168bf3c-15c6-4d20-9268-0654d2ea5d4f	test_admin	\N	test_admin@xuewaiyu.local	$2a$12$BGEIn9qlkHUEHsuXbitwLOpoR1cbQQ3HhOrVoFX6bjBg35yHatnSK	\N	\N	P2测试管理员	\N	\N	\N	free	\N	t	f	f	2026-07-27 15:17:50.566	::1	0	\N	\N	0	2026-07-27 14:10:47.952	2026-07-27 15:17:50.567	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
cc5eb123-4fcd-44a4-8628-63ed9c0c0b68	p3_test_p3_unit_ms3w0rsj	\N	test_p3_unit@xuewaiyu.local	$2a$12$uiZ0iikrYlRAkflWH9BhUunRFzBNHSlxwb77FgJnEGndbKG4kidGW	\N	\N	P3测试-test_p3_unit	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:59.439	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:17.78	2026-07-28 00:15:59.44	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
93f9a208-3e8a-4e78-b7cb-b2c06d6e924c	p3s2_test_p3_t07a_ms3xl4ss	\N	test_p3_t07a@xuewaiyu.local	$2a$12$ccionNaKdy.0IyNnK.V3keBD0HeqOv3jX1Dy2ino996PlLffjOEoa	\N	\N	P3S2-test_p3_t07a	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:08.076	::1	0	\N	\N	0	2026-07-28 00:42:07.373	2026-07-28 00:42:08.077	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
0c12cc0e-c529-4b0e-bc43-25fa02054536	p3s2_test_p3_t07b_ms3xl523	\N	test_p3_t07b@xuewaiyu.local	$2a$12$/hAB0rIaY1W/M09z8itju.6B7dXdVOCdUy1wZCGPP5u3AEWHUrbMK	\N	\N	P3S2-test_p3_t07b	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:08.454	::1	0	\N	\N	0	2026-07-28 00:42:07.708	2026-07-28 00:42:08.455	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
0628c78a-e531-41fb-a637-97bb9bd57d45	p3s2_test_p3_t08_1_ms3xl5xv	\N	test_p3_t08_1@xuewaiyu.local	$2a$12$ubtrHaReA675kZ4JYJ0Xe.8TKYAMhNlqQjkJNBds.xTu69Bp9WsrK	\N	\N	P3S2-test_p3_t08_1	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:09.194	::1	0	\N	\N	0	2026-07-28 00:42:08.852	2026-07-28 00:42:09.195	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
d267cb47-df4d-4f98-a618-47619b13821e	p3s2_test_p3_t08_2_ms3xl6h4	\N	test_p3_t08_2@xuewaiyu.local	$2a$12$gyRXK7//xGXPKo2KuhAlkOUByfYv7GWDBibmZjxh2OYyHy/hURNrO	\N	\N	P3S2-test_p3_t08_2	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:09.886	::1	0	\N	\N	0	2026-07-28 00:42:09.545	2026-07-28 00:42:09.887	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c5d2efb0-2e89-42ab-bfe7-a9a436fa81a4	p3s2_test_p3_t09_1_ms3xl9a7	\N	test_p3_t09_1@xuewaiyu.local	$2a$12$WQBGaYW6gUoRNqz8Xi/T.eLny8k9/LiC.GsaU2NrMVU/SQ9lGEOlK	\N	\N	P3S2-test_p3_t09_1	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:13.511	::1	0	\N	\N	0	2026-07-28 00:42:13.184	2026-07-28 00:42:13.512	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
48158c4b-5471-43b4-9eea-84476ece92b7	p3_test_p3_t01_ms3w0qj6	\N	test_p3_t01@xuewaiyu.local	$2a$12$nsCqSeMSuBbWJ4TgxtOG8eE0eWfB5vH2MpOL4COR5dfaPJKPlxAUi	\N	\N	P3测试-test_p3_t01	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:57.748	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:16.147	2026-07-28 00:15:57.749	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
67037a38-a1d9-4acf-92ac-0d3f3c81d91a	p3_test_p3_t02_ms3w0qs7	\N	test_p3_t02@xuewaiyu.local	$2a$12$4oBm6hs4uHPDAKtCj5OdqexRxUoQ5g7Ng33bTH50v/08a2PZH3b5O	\N	\N	P3测试-test_p3_t02	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:58.114	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:16.472	2026-07-28 00:15:58.115	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
4d906740-d3a4-424e-8d0d-8c1860f9a41e	p3_test_p3_t03_ms3w0r1a	\N	test_p3_t03@xuewaiyu.local	$2a$12$chqJyrOrzRMDwfK.Fy9m8eK9sVNQRYVivPozm/sOUHsjod1u9ggaW	\N	\N	P3测试-test_p3_t03	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:58.445	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:16.799	2026-07-28 00:15:58.446	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
61f37995-186e-46f9-a68e-01bfb3ef96ad	p3_test_p3_t05_ms3w0rad	\N	test_p3_t05@xuewaiyu.local	$2a$12$TmSBAOWCTRVFe5c8EgXKn.1bdwKzMR1RVR1UEst7W27f3E4v5xND.	\N	\N	P3测试-test_p3_t05	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:15:58.78	82.156.228.87	0	\N	\N	0	2026-07-27 23:58:17.125	2026-07-28 00:15:58.781	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
a34dcc2e-6c75-4fcc-a171-d176cd8a9603	p3s2_test_p3_t08_3_ms3xl70r	\N	test_p3_t08_3@xuewaiyu.local	$2a$12$S.0zP6V0IDSSlRuHfQEwiuA4Vd0WCmfu6TQPFlBcV2orlkKX0Wv/W	\N	\N	P3S2-test_p3_t08_3	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:10.601	::1	0	\N	\N	0	2026-07-28 00:42:10.252	2026-07-28 00:42:10.602	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
e37a9bcf-6326-4ca8-abdf-ffd34fe00472	p3s2_test_p3_t08_4_ms3xl7k2	\N	test_p3_t08_4@xuewaiyu.local	$2a$12$/A9ptQlvs4gK3Cr5GHCckuIEXVl.w4OpBcxasurOJWUQk33paEf/6	\N	\N	P3S2-test_p3_t08_4	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:11.299	::1	0	\N	\N	0	2026-07-28 00:42:10.947	2026-07-28 00:42:11.3	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
502c4e5e-e3ee-4781-852a-29472ca8528e	p3s2_test_p3_t08_5_ms3xl83j	\N	test_p3_t08_5@xuewaiyu.local	$2a$12$vMfR1K3186nmfRLjRJCPEex6vsfYrw41knMAZzxlDOhGmTzY5GQ9K	\N	\N	P3S2-test_p3_t08_5	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:12.021	::1	0	\N	\N	0	2026-07-28 00:42:11.647	2026-07-28 00:42:12.022	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
ed0988fa-b200-49d6-857e-e384c6a19689	p3s2_test_p3_t08_6_ms3xl8ot	\N	test_p3_t08_6@xuewaiyu.local	$2a$12$R.AvlUNUd4Ua9iYMH6rPxuNPCf2kZf4.v9DExM1vkMw2bGEj2/GKC	\N	\N	P3S2-test_p3_t08_6	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:12.747	::1	0	\N	\N	0	2026-07-28 00:42:12.414	2026-07-28 00:42:12.748	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
b91eb774-1d90-4a86-891b-4ff5954a8be4	p3s2_test_p3_t09_2_ms3xl9tb	\N	test_p3_t09_2@xuewaiyu.local	$2a$12$5KzBIQ0dHH4JtfHdSgV/ougTAMIp9tguduINcybuXRC7XSbn8dG2i	\N	\N	P3S2-test_p3_t09_2	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:14.204	::1	0	\N	\N	0	2026-07-28 00:42:13.872	2026-07-28 00:42:14.205	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
b38ec829-37bb-4934-bffc-024db683bfb1	p3s2_test_p3_t09_3_ms3xlaca	\N	test_p3_t09_3@xuewaiyu.local	$2a$12$e5g2ORGPixpeBYPlwjrYauAHC/f.ekziwAr0HJ7QObg7xnYY54g.6	\N	\N	P3S2-test_p3_t09_3	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:14.902	::1	0	\N	\N	0	2026-07-28 00:42:14.556	2026-07-28 00:42:14.903	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
dfeea17d-0aa3-4f0b-bfed-ae4d71aa3872	p3s2_test_p3_t09_4_ms3xlavp	\N	test_p3_t09_4@xuewaiyu.local	$2a$12$iGKrfmwAWs.y6pYoVTKoqeg/HZQVuCn2Y5w9qzvxyd2bKwTJU4T42	\N	\N	P3S2-test_p3_t09_4	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:15.594	::1	0	\N	\N	0	2026-07-28 00:42:15.254	2026-07-28 00:42:15.595	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
9038dfe3-bd33-4adf-83dd-4e9e6de1f75a	p3s2_test_p3_t09_5_ms3xlbfc	\N	test_p3_t09_5@xuewaiyu.local	$2a$12$pjncwMjPw.HvdI.amnchbukGkHioPK54ROCLq2.hjKiTdm.EwlpWi	\N	\N	P3S2-test_p3_t09_5	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:16.302	::1	0	\N	\N	0	2026-07-28 00:42:15.96	2026-07-28 00:42:16.303	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
fd7730ac-af78-4a37-b1af-2f9459d9cedc	p3s2_test_p3_t09_6_ms3xlbyg	\N	test_p3_t09_6@xuewaiyu.local	$2a$12$cZdb6Ne3Y1s.EP.XDwkEq.KGcC2SsfYj4mQ8Yv9XfiEiWt4LLM3za	\N	\N	P3S2-test_p3_t09_6	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:16.999	::1	0	\N	\N	0	2026-07-28 00:42:16.649	2026-07-28 00:42:17	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
565dc9ec-566b-4bd7-a91c-5c87f738ba33	p3s2_test_p3_t10a_ms3xlck8	\N	test_p3_t10a@xuewaiyu.local	$2a$12$NNAq35OUoi490mCmYjDmvOjjvflPYaefeyf3kRv5V.blcn5t9dAUa	\N	\N	P3S2-test_p3_t10a	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:18.449	::1	0	\N	\N	0	2026-07-28 00:42:17.433	2026-07-28 00:42:18.45	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
2d986d55-92bd-4830-9c9a-1e13d9720d1e	p3s2_test_p3_t10b_ms3xlctx	\N	test_p3_t10b@xuewaiyu.local	$2a$12$FWJArbMJXtJHStpr4eJjpejvjzPloOVd65znYnrBBS6PIhM0vrgiG	\N	\N	P3S2-test_p3_t10b	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:18.799	::1	0	\N	\N	0	2026-07-28 00:42:17.782	2026-07-28 00:42:18.8	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
704205d4-21c2-45fa-aea5-bd0c11aee2bd	p3s2_test_p3_t10c_ms3xld3e	\N	test_p3_t10c@xuewaiyu.local	$2a$12$6mUA.QbN.4aVZ01KbM12n.uONfkp6s2lGdkMvKy8nPxp4YxMvTjBe	\N	\N	P3S2-test_p3_t10c	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:42:19.131	::1	0	\N	\N	0	2026-07-28 00:42:18.123	2026-07-28 00:42:19.132	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
d167b983-8d3b-47f9-9fec-29d9ac1448ac	p3s2t08fix_test_p3_t08fix_1_ms3xnfzw	\N	test_p3_t08fix_1@xuewaiyu.local	$2a$12$d55lRv4ORcy7cEJHDsRJrOb3Ayn5QBn.SElSEYy5AIMrYm5UQELlO	\N	\N	P3S2-test_p3_t08fix_1	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:55.553	::1	0	\N	\N	0	2026-07-28 00:43:55.197	2026-07-28 00:43:55.554	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
e5b77f19-aff1-4a99-8663-3a8599bed6f4	p3s2t08fix_test_p3_t08fix_2_ms3xngl4	\N	test_p3_t08fix_2@xuewaiyu.local	$2a$12$Dl6kJChHMNC8iNnF6rO6VOOlhPGGkTeCxwNYq4JcnyVqsDLDxzS3K	\N	\N	P3S2-test_p3_t08fix_2	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:56.297	::1	0	\N	\N	0	2026-07-28 00:43:55.961	2026-07-28 00:43:56.298	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
425358c6-dfad-4512-a048-71ee8687b61e	p3s2t08fix_test_p3_t08fix_3_ms3xnh41	\N	test_p3_t08fix_3@xuewaiyu.local	$2a$12$g7SBM7JtHSHNopyU0cwun.9NjBZSgTTrI.HdhQFmxC5R1tmZkp/Ga	\N	\N	P3S2-test_p3_t08fix_3	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:56.971	::1	0	\N	\N	0	2026-07-28 00:43:56.642	2026-07-28 00:43:56.972	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
11c481c6-8463-4371-a2ee-27dd7e353536	p3s2t08fix_test_p3_t08fix_4_ms3xnhn4	\N	test_p3_t08fix_4@xuewaiyu.local	$2a$12$7CWUcv.OsFqJQIaHdChE0OdT309XtS/9mqmRMSJuq.JmjmCVxzOyK	\N	\N	P3S2-test_p3_t08fix_4	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:57.66	::1	0	\N	\N	0	2026-07-28 00:43:57.329	2026-07-28 00:43:57.661	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
fde479e5-4c4d-48fa-859e-270ee889236a	p3s2t08fix_test_p3_t08fix_5_ms3xni61	\N	test_p3_t08fix_5@xuewaiyu.local	$2a$12$.ZPsEW57BCrLTjZzEClDcODiZVL7bdPk/CzPLMD25r.tnz7jFBbZa	\N	\N	P3S2-test_p3_t08fix_5	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:58.337	::1	0	\N	\N	0	2026-07-28 00:43:58.01	2026-07-28 00:43:58.338	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c4d6d5e0-3f89-44d8-9a6f-0b3e53b3fe04	p3s2t08fix_test_p3_t08fix_6_ms3xnion	\N	test_p3_t08fix_6@xuewaiyu.local	$2a$12$X5CrJr.mBcDC6FyDvzjWCuzLp5QoGwy7KIOQWS6ZYB5w2qtlTp7uO	\N	\N	P3S2-test_p3_t08fix_6	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:43:59.008	::1	0	\N	\N	0	2026-07-28 00:43:58.68	2026-07-28 00:43:59.009	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c4921588-7093-40c7-a2e5-86940be15f87	p3s3_test_p3_t13_ms3xq27u	\N	test_p3_t13@xuewaiyu.local	$2a$12$0iKRt8jEw.EC9m.MeqcSd.QHWuGQ5tNQlDiz9CkXCTMPx4./WEPx.	\N	\N	P3S3-test_p3_t13	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:48:41.743	::1	0	\N	\N	0	2026-07-28 00:45:57.307	2026-07-28 00:48:42.406	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
a0d4e2b9-f1bd-4986-8036-540b50bb1d8c	p3s3_t13_ms3xvfxh50wg	\N	test_p3_s3_t13_ms3xvfxh50wg@xuewaiyu.local	$2a$12$v.GMH7rJ4/xSuR3z9OmohO4kO8u6LeZVN9c97xfAcW0zLRXF4PjZK	\N	\N	P3S3-t13	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:50:13.965	::1	0	\N	\N	0	2026-07-28 00:50:12.616	2026-07-28 00:50:14.299	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
ba15ddda-a58c-4cb1-a775-09547112d046	p3s4_t15_ms3y0ambyxsb	\N	test_p3_s4_t15_ms3y0ambyxsb@xuewaiyu.local	$2a$12$kmT3v7AIun9LJ2AtBAqomuUren4QZ7xalk5hev1HIT/x2igCDnBca	\N	\N	P3S4-t15	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:53:55.686	::1	0	\N	\N	0	2026-07-28 00:53:55.359	2026-07-28 00:53:55.687	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
ea8cb89b-8f78-471d-99c7-46b37889937a	p3s4_t17_ms3y0ambyxsb	\N	test_p3_s4_t17_ms3y0ambyxsb@xuewaiyu.local	$2a$12$qDVG8eBM9lMyQk0uqHhuLugegtQKBSNugifgcTqaorjkyl1ELMogq	\N	\N	P3S4-t17	\N	\N	\N	free	\N	t	t	f	\N	\N	0	\N	\N	0	2026-07-28 00:53:56.092	2026-07-28 00:53:56.092	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
d6d24e48-5435-43f0-9749-09aa1845d3f1	p3s3_t11_ms3xvfxh50wg	\N	test_p3_s3_t11_ms3xvfxh50wg@xuewaiyu.local	$2a$12$rnZi5k8nxO4esFzPzlXuOOuC0LGe3RdxLrmBfOx98XXKflqtFc9HK	\N	\N	P3S3-t11	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:50:11.37	::1	0	\N	\N	0	2026-07-28 00:50:08.73	2026-07-28 00:50:11.373	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
2823f42d-5537-49ec-8015-bae504743059	p3s3_test_p3_t11_ms3xpz8n	\N	test_p3_t11@xuewaiyu.local	$2a$12$HyG897RXqpw529AKS3RF7.EjEnF7WhtLdgre.MgyrKxp62CxBNdbu	\N	\N	P3S3-test_p3_t11	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:47:19.526	::1	0	\N	\N	0	2026-07-28 00:45:53.448	2026-07-28 00:48:40.188	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
c0478eee-ad79-4c3e-960a-994f5aa71e00	p3s3_t12_ms3xvfxh50wg	\N	test_p3_s3_t12_ms3xvfxh50wg@xuewaiyu.local	$2a$12$wHPePib8Lqznyzu124fzueZvtDkLWwe9Y/hoMUWSTFiPULbHe.45y	\N	\N	P3S3-t12	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:50:12.248	::1	0	\N	\N	0	2026-07-28 00:50:11.924	2026-07-28 00:50:12.28	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
66c8acb1-e9b4-4a35-9e70-93ef867a76ba	p3s3_test_p3_t14_ms3xq3qy	\N	test_p3_t14@xuewaiyu.local	$2a$12$4IFcIw7VYFLHfCVV5CXbju35447R5FXLSNEUw08Rb6xvAgC.H3bne	\N	\N	P3S3-test_p3_t14	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:45:59.612	::1	0	\N	\N	0	2026-07-28 00:45:59.291	2026-07-28 00:45:59.613	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
a54eb726-f27a-46df-816e-eba16f0937a2	p3s3_test_p3_t12_ms3xq1lw	\N	test_p3_t12@xuewaiyu.local	$2a$12$ZVdWy4E3OPdpq5Y6xsR6qe20xJ/ZKzrZTvGsTFbunPhOgSah5PHX.	\N	\N	P3S3-test_p3_t12	\N	\N	\N	free	\N	t	t	f	2026-07-28 00:48:41.046	::1	0	\N	\N	0	2026-07-28 00:45:56.516	2026-07-28 00:48:41.073	\N	PLATFORM	\N	\N	organic	\N	\N	0	f	\N
\.


--
-- Data for Name: UserDevice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserDevice" (id, "userId", "deviceName", "deviceType", "deviceToken", "lastSyncAt", "syncVersion", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserIdentity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserIdentity" (id, "userId", "identityType", "defaultWorkspaceId", metadata, "createdAt", "updatedAt") FROM stdin;
9fa45681-d6a3-49a4-a891-83293e93844f	478c5039-1567-4117-afc6-2fc27396731f	personal	e5768dc7-222c-4683-b6da-3a39d36840bf	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-20 00:27:08.392	2026-07-20 00:27:08.397
cbaaafcd-e399-433b-9c5e-2857fd85b3ab	26fbb7c1-cf41-4dc4-851d-c84895b07002	personal	7f83009b-b443-4d9c-8d99-0ac5c4e811cc	{"uiLanguage": "ja", "browserLanguage": "ja-JP", "registrationSource": "web"}	2026-07-20 00:28:06.583	2026-07-20 00:28:06.587
1f4be459-6149-4fee-8bce-b4624d39d8e8	4496260c-9f53-46a2-b249-539e5fe4c7db	personal	f6918b48-bec4-4cb0-9f77-a4be84d6c002	{"uiLanguage": "ja", "browserLanguage": "ja-JP", "registrationSource": "web"}	2026-07-20 00:58:27.787	2026-07-20 00:58:27.791
c9b247b8-f5da-461b-96f2-c5edebeca13f	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	personal	ed185070-eadb-4e6f-82aa-db65c60f81f7	{"uiLanguage": "en", "browserLanguage": "en-US", "registrationSource": "web"}	2026-07-20 01:01:14.454	2026-07-20 01:01:14.458
f441d0c3-3449-4b7d-9fb9-75e318ce5737	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	personal	aa288237-fb1b-4208-9944-1f68b37ee638	{"uiLanguage": "ko", "browserLanguage": "ko-KR", "registrationSource": "web"}	2026-07-20 01:01:19.74	2026-07-20 01:01:19.744
a4668781-9024-4af6-a04e-7742e6cbe927	f617404b-819e-4c7d-b4a5-8032b0b899cd	personal	2a9d05be-ac80-41e7-a9e2-d7bfbe5eb4c5	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-20 14:42:57.373	2026-07-20 14:42:57.376
312ad2ca-cc84-4649-b44d-61eb9e61f376	936fc045-7b74-4e58-b9f0-dea7ef2776aa	personal	e78640fd-75a0-4f96-b644-1d4b67a6062d	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-20 23:31:19.609	2026-07-20 23:31:19.614
eb24fb2b-622f-4046-8fb1-b8558329cb67	7b8e0888-8843-4971-b6ef-a84794f2e797	personal	6c779614-d043-40c5-ad1a-59d7621e4aea	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-21 00:14:51.122	2026-07-21 00:14:51.125
7ab280a8-bd80-4b6d-a4a7-c1553cb2b78e	5b952aaa-610a-4ad2-a7a8-408772bbdc19	personal	7131555d-c9bc-4e99-8e22-702939c8dce9	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-23 09:36:31.387	2026-07-23 09:36:31.394
898cfc3a-cc1f-4ef2-a937-22a410627d42	df440e3c-56cc-4455-8426-9a279bc58f6c	personal	cc4dfb4c-d374-43cf-bed9-43b891030c8f	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "placementResult": {"at": "2026-07-26T00:39:16.567Z", "percent": 46, "totalScore": 46, "assessedLevel": "N5"}, "registrationSource": "web"}	2026-07-21 12:31:05.29	2026-07-26 00:39:16.568
9efb94d5-3ae7-43ef-9b29-49608f70d971	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	personal	69201c45-e03f-4b13-86b7-f23d0f28bc43	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-26 09:49:21.721	2026-07-26 09:49:21.725
ddea4fe3-209b-4509-8dbb-3d632dfba16c	bee326da-b724-4e53-a833-97b113038280	personal	8fc7b5d1-3572-4dbf-9075-7e69e78ddf1f	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-26 11:31:54.411	2026-07-26 11:31:54.415
fff02fca-7b01-49bb-ac7b-94c0a8311c0b	d6cdc807-a203-4af0-953d-16ded2c5d9d6	personal	d06fa312-4c0d-43f6-bfc6-22ba706810d5	{"uiLanguage": "zh", "browserLanguage": "zh-CN", "registrationSource": "web"}	2026-07-26 12:08:11.416	2026-07-26 12:08:11.42
\.


--
-- Data for Name: UserLanguagePreference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserLanguagePreference" (id, "userId", "interfaceLanguage", "nativeLanguage", "defaultExplanationLanguage", "fallbackLanguage", "createdAt", "updatedAt") FROM stdin;
102a08e1-52f0-4834-a54c-2769bcd95da5	4496260c-9f53-46a2-b249-539e5fe4c7db	ja	ja	ja	zh-CN	2026-07-20 00:58:27.793	2026-07-20 00:58:27.793
3351d09c-5657-4287-bbcf-52bed8daebe8	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	en	en	en	zh-CN	2026-07-20 01:01:14.459	2026-07-20 01:01:14.459
e7aac5d7-1532-41cf-9637-d10b059b5646	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	ja	ja	ja	zh-CN	2026-07-20 01:01:19.746	2026-07-20 02:12:52.117
91756c42-dd2d-4658-ab0f-ccd896a01b28	f617404b-819e-4c7d-b4a5-8032b0b899cd	zh	zh-CN	zh-CN	zh-CN	2026-07-20 14:42:57.378	2026-07-20 14:42:57.378
27f11705-0451-4792-b680-3e23adb663dd	936fc045-7b74-4e58-b9f0-dea7ef2776aa	zh	zh-CN	zh-CN	zh-CN	2026-07-20 23:31:19.616	2026-07-20 23:31:19.616
793c4225-7419-4382-becf-00c93abef693	7b8e0888-8843-4971-b6ef-a84794f2e797	zh	zh-CN	zh-CN	zh-CN	2026-07-21 00:14:51.127	2026-07-21 00:14:51.127
4444fa14-154e-46c5-9a35-08bb72638a23	5b952aaa-610a-4ad2-a7a8-408772bbdc19	zh	zh-CN	zh-CN	zh-CN	2026-07-23 09:36:31.396	2026-07-23 09:36:31.396
54889cd4-cf79-40a4-bcd5-76b157cf9571	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	zh	zh-CN	zh-CN	zh-CN	2026-07-26 09:49:21.727	2026-07-26 09:49:21.759
16290c55-03e4-46d4-9330-61e212629fc2	df440e3c-56cc-4455-8426-9a279bc58f6c	zh-CN	zh-CN	zh-CN	zh-CN	2026-07-21 12:31:05.315	2026-07-27 03:56:53.333
2663cb07-4cd2-4c29-96e5-437e728b8393	bee326da-b724-4e53-a833-97b113038280	zh	zh-CN	zh-CN	zh-CN	2026-07-26 11:31:54.416	2026-07-26 14:14:29.521
32fc2b45-25b1-4320-a359-b88492c1f1e9	d6cdc807-a203-4af0-953d-16ded2c5d9d6	zh	zh-CN	zh-CN	zh-CN	2026-07-26 12:08:11.421	2026-07-26 14:14:29.526
\.


--
-- Data for Name: UserLearningLanguage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserLearningLanguage" (id, "userId", "languageCode", level, priority, status, "createdAt", "updatedAt") FROM stdin;
871bbbb0-08ad-47ad-99b7-5fc22890943b	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	en	A1	1	active	2026-07-20 02:12:52.12	2026-07-20 02:12:52.12
b9d6d0b5-a709-4701-915c-56d3e7ab48e3	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	ja	zero	0	active	2026-07-26 09:49:21.757	2026-07-26 09:49:21.757
afc267e9-b438-4b62-b1db-76c4ecdf1a0e	bee326da-b724-4e53-a833-97b113038280	ja	zero	0	active	2026-07-26 11:31:55.223	2026-07-26 11:31:55.223
107fde3f-24ec-4301-8994-164faa563977	d6cdc807-a203-4af0-953d-16ded2c5d9d6	ja	zero	0	active	2026-07-26 12:09:30.725	2026-07-26 12:09:30.725
9e019722-5bfc-46d8-909d-5b860d20c7e0	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	zh-CN	A1	2	inactive	2026-07-20 02:12:52.123	2026-07-26 14:13:49.233
c065b663-fb45-42f7-a458-e16e53295207	df440e3c-56cc-4455-8426-9a279bc58f6c	ko	A1	0	inactive	2026-07-26 13:59:21.491	2026-07-27 03:56:53.333
865254cd-4ecd-4454-aaf3-28997e913407	df440e3c-56cc-4455-8426-9a279bc58f6c	ja	A1	0	active	2026-07-25 16:25:18.822	2026-07-27 03:56:53.335
3c6c6dec-a622-485d-afa8-637964a5f621	df440e3c-56cc-4455-8426-9a279bc58f6c	fr	A1	1	inactive	2026-07-26 13:59:14.651	2026-07-26 14:05:29.838
98d565c8-8c5b-4e41-be30-406de8fa51c7	df440e3c-56cc-4455-8426-9a279bc58f6c	es	A1	1	inactive	2026-07-26 13:59:16.989	2026-07-26 14:05:29.912
8c672697-edd6-4773-a638-5c461d4d0623	df440e3c-56cc-4455-8426-9a279bc58f6c	de	A1	1	inactive	2026-07-26 13:59:18.973	2026-07-26 14:05:29.98
a536361d-a3c0-405d-b2f5-d851f8f58ceb	df440e3c-56cc-4455-8426-9a279bc58f6c	en	A1	0	inactive	2026-07-26 12:09:38.336	2026-07-27 01:59:38
\.


--
-- Data for Name: Workspace; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Workspace" (id, name, type, "ownerId", "organizationId", "isDefault", config, "createdAt", "updatedAt") FROM stdin;
e5768dc7-222c-4683-b6da-3a39d36840bf	测试用户的个人空间	personal	478c5039-1567-4117-afc6-2fc27396731f	\N	t	{"language": "zh"}	2026-07-20 00:27:08.395	2026-07-20 00:27:08.395
7f83009b-b443-4d9c-8d99-0ac5c4e811cc	LangTest的个人空间	personal	26fbb7c1-cf41-4dc4-851d-c84895b07002	\N	t	{"language": "ja"}	2026-07-20 00:28:06.586	2026-07-20 00:28:06.586
f6918b48-bec4-4cb0-9f77-a4be84d6c002	TestUser的个人空间	personal	4496260c-9f53-46a2-b249-539e5fe4c7db	\N	t	{"language": "ja"}	2026-07-20 00:58:27.789	2026-07-20 00:58:27.789
ed185070-eadb-4e6f-82aa-db65c60f81f7	NewUser的个人空间	personal	041b9ca0-a0e5-4f1f-9291-8bdbbd9c23cd	\N	t	{"language": "en"}	2026-07-20 01:01:14.456	2026-07-20 01:01:14.456
aa288237-fb1b-4208-9944-1f68b37ee638	FullFlowUser的个人空间	personal	74fdf81a-5312-4b3b-b207-5cc044f7bc5a	\N	t	{"language": "ko"}	2026-07-20 01:01:19.743	2026-07-20 01:01:19.743
2a9d05be-ac80-41e7-a9e2-d7bfbe5eb4c5	我的学习空间	personal	f617404b-819e-4c7d-b4a5-8032b0b899cd	\N	t	{"language": "zh"}	2026-07-20 14:42:57.375	2026-07-20 14:42:57.375
e78640fd-75a0-4f96-b644-1d4b67a6062d	我的学习空间	personal	936fc045-7b74-4e58-b9f0-dea7ef2776aa	\N	t	{"language": "zh"}	2026-07-20 23:31:19.612	2026-07-20 23:31:19.612
6c779614-d043-40c5-ad1a-59d7621e4aea	P1Tester的个人空间	personal	7b8e0888-8843-4971-b6ef-a84794f2e797	\N	t	{"language": "zh"}	2026-07-21 00:14:51.123	2026-07-21 00:14:51.123
cc4dfb4c-d374-43cf-bed9-43b891030c8f	创世纪的个人空间	personal	df440e3c-56cc-4455-8426-9a279bc58f6c	\N	t	{"language": "zh"}	2026-07-21 12:31:05.307	2026-07-21 12:31:05.307
7131555d-c9bc-4e99-8e22-702939c8dce9	我的学习空间	personal	5b952aaa-610a-4ad2-a7a8-408772bbdc19	\N	t	{"language": "zh"}	2026-07-23 09:36:31.391	2026-07-23 09:36:31.391
69201c45-e03f-4b13-86b7-f23d0f28bc43	P2阶段一验收用户的个人空间	personal	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	\N	t	{"language": "zh"}	2026-07-26 09:49:21.723	2026-07-26 09:49:21.723
8fc7b5d1-3572-4dbf-9075-7e69e78ddf1f	SMS测试的个人空间	personal	bee326da-b724-4e53-a833-97b113038280	\N	t	{"language": "zh"}	2026-07-26 11:31:54.413	2026-07-26 11:31:54.413
d06fa312-4c0d-43f6-bfc6-22ba706810d5	我的学习空间	personal	d6cdc807-a203-4af0-953d-16ded2c5d9d6	\N	t	{"language": "zh"}	2026-07-26 12:08:11.418	2026-07-26 12:08:11.418
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a0e98028-0e3f-49cf-a3e2-0fc1b736969f	2adf80281796c3247c7f9c15e2557bb562469c611b22a732ba4685e4cc203144	2026-07-27 09:53:59.057772+08	20260727000000_baseline_full		\N	2026-07-27 09:53:59.057772+08	0
0666cbf4-d12c-448c-8895-5621f611393f	d5c434d6e13b75a2d6c2e21ee85b8af7691c834cbd7e0346fbea39ffc6651908	2026-07-27 22:14:30.73427+08	20260727120000_p2_admin	\N	\N	2026-07-27 22:14:30.719259+08	1
896a9df1-05d4-4dfd-9c4d-b6bd0bedbbcc	143d44b59e5661301674c6616ab91c1a384f34e83540eee001af67136e8c2ffe	2026-07-28 06:43:37.356536+08	20260728000000_p1_admin_reinforce	\N	\N	2026-07-28 06:43:37.344536+08	1
ce937e70-766d-4421-a577-7560578e4845	0b61f4ff18224aca873d8ef5a016e4c65ce029392c113a48cea595164730ca8b	2026-07-28 08:15:21.469182+08	20260728120000_p3_billing_idempotency_unit_fix	\N	\N	2026-07-28 08:15:21.414608+08	1
\.


--
-- Data for Name: checkins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.checkins (id, "userId", "checkinDate", streak, "xpAwarded", "createdAt") FROM stdin;
899eb48e-402a-4246-bab0-8c14ef7f6710	478c5039-1567-4117-afc6-2fc27396731f	2026-07-23 16:00:00	1	5	2026-07-24 09:55:18.675
ae88002b-8ca7-4b56-9a36-cb1d7e8f57a8	df440e3c-56cc-4455-8426-9a279bc58f6c	2026-07-23 16:00:00	1	5	2026-07-24 10:13:06.986
dbf22edf-3af6-42c4-987f-dacc8b481bef	8aa4097d-3fb3-457d-b9b3-b2f772f1cd9a	2026-07-25 16:00:00	0	0	2026-07-26 09:49:21.728
e9800781-abe9-4fad-8055-6bb17f5ddd7d	bee326da-b724-4e53-a833-97b113038280	2026-07-25 16:00:00	0	0	2026-07-26 11:31:54.418
165becb8-75d6-4106-ba49-b1c7cb086ccd	d6cdc807-a203-4af0-953d-16ded2c5d9d6	2026-07-25 16:00:00	0	0	2026-07-26 12:08:11.423
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, type, "targetId", participants, "lastMsgId", "lastMsgPreview", "lastMsgTime", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: friend_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friend_settings (id, "userId", "friendId", "remarkName", tags, "isMuted", "isBlocked", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_members (id, "groupId", "userId", role, "groupNickname", mute, "joinTime", "createdAt") FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, description, "avatarUrl", "ownerId", "maxMembers", "createdVia", announcement, "muteAll", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, "conversationId", "senderId", "msgType", content, "isRead", "isRevoked", "revokedAt", "createdAt") FROM stdin;
\.


--
-- Name: AccountDeletionRequest AccountDeletionRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountDeletionRequest"
    ADD CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY (id);


--
-- Name: AdminOperationLog AdminOperationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminOperationLog"
    ADD CONSTRAINT "AdminOperationLog_pkey" PRIMARY KEY (id);


--
-- Name: AiLanguageViolationLog AiLanguageViolationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiLanguageViolationLog"
    ADD CONSTRAINT "AiLanguageViolationLog_pkey" PRIMARY KEY (id);


--
-- Name: AiPromptTemplate AiPromptTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiPromptTemplate"
    ADD CONSTRAINT "AiPromptTemplate_pkey" PRIMARY KEY (id);


--
-- Name: AiRequestLog AiRequestLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiRequestLog"
    ADD CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY (id);


--
-- Name: AiTutorRecord AiTutorRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiTutorRecord"
    ADD CONSTRAINT "AiTutorRecord_pkey" PRIMARY KEY (id);


--
-- Name: AiUsageDailyStatistic AiUsageDailyStatistic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiUsageDailyStatistic"
    ADD CONSTRAINT "AiUsageDailyStatistic_pkey" PRIMARY KEY (id);


--
-- Name: CompanionProfile CompanionProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanionProfile"
    ADD CONSTRAINT "CompanionProfile_pkey" PRIMARY KEY (id);


--
-- Name: ContentLanguageVersion ContentLanguageVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContentLanguageVersion"
    ADD CONSTRAINT "ContentLanguageVersion_pkey" PRIMARY KEY (id);


--
-- Name: CourseBlueprint CourseBlueprint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CourseBlueprint"
    ADD CONSTRAINT "CourseBlueprint_pkey" PRIMARY KEY (id);


--
-- Name: DailyLearningPlan DailyLearningPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyLearningPlan"
    ADD CONSTRAINT "DailyLearningPlan_pkey" PRIMARY KEY (id);


--
-- Name: DataExportRequest DataExportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataExportRequest"
    ADD CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY (id);


--
-- Name: GuestSession GuestSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestSession"
    ADD CONSTRAINT "GuestSession_pkey" PRIMARY KEY (id);


--
-- Name: LanguageConsistencyAlert LanguageConsistencyAlert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LanguageConsistencyAlert"
    ADD CONSTRAINT "LanguageConsistencyAlert_pkey" PRIMARY KEY (id);


--
-- Name: LanguageConsistencyLog LanguageConsistencyLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LanguageConsistencyLog"
    ADD CONSTRAINT "LanguageConsistencyLog_pkey" PRIMARY KEY (id);


--
-- Name: LanguageIdentity LanguageIdentity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LanguageIdentity"
    ADD CONSTRAINT "LanguageIdentity_pkey" PRIMARY KEY (id);


--
-- Name: LearningAbilityModel LearningAbilityModel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningAbilityModel"
    ADD CONSTRAINT "LearningAbilityModel_pkey" PRIMARY KEY (id);


--
-- Name: LearningContent LearningContent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningContent"
    ADD CONSTRAINT "LearningContent_pkey" PRIMARY KEY (id);


--
-- Name: LearningEvent LearningEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningEvent"
    ADD CONSTRAINT "LearningEvent_pkey" PRIMARY KEY (id);


--
-- Name: LearningGoal LearningGoal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningGoal"
    ADD CONSTRAINT "LearningGoal_pkey" PRIMARY KEY (id);


--
-- Name: LearningMemory LearningMemory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningMemory"
    ADD CONSTRAINT "LearningMemory_pkey" PRIMARY KEY (id);


--
-- Name: LearningPlan LearningPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningPlan"
    ADD CONSTRAINT "LearningPlan_pkey" PRIMARY KEY (id);


--
-- Name: LearningProfile LearningProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningProfile"
    ADD CONSTRAINT "LearningProfile_pkey" PRIMARY KEY (id);


--
-- Name: LearningProgress LearningProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningProgress"
    ADD CONSTRAINT "LearningProgress_pkey" PRIMARY KEY (id);


--
-- Name: LoginLog LoginLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LoginLog"
    ADD CONSTRAINT "LoginLog_pkey" PRIMARY KEY (id);


--
-- Name: MembershipOrder MembershipOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipOrder"
    ADD CONSTRAINT "MembershipOrder_pkey" PRIMARY KEY (id);


--
-- Name: OcrUsageLog OcrUsageLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OcrUsageLog"
    ADD CONSTRAINT "OcrUsageLog_pkey" PRIMARY KEY (id);


--
-- Name: OrgClassStudent OrgClassStudent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClassStudent"
    ADD CONSTRAINT "OrgClassStudent_pkey" PRIMARY KEY (id);


--
-- Name: OrgClass OrgClass_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClass"
    ADD CONSTRAINT "OrgClass_pkey" PRIMARY KEY (id);


--
-- Name: OrganizationMember OrganizationMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: QuestionBlueprint QuestionBlueprint_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuestionBlueprint"
    ADD CONSTRAINT "QuestionBlueprint_pkey" PRIMARY KEY (id);


--
-- Name: RateLimitLog RateLimitLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RateLimitLog"
    ADD CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY (id);


--
-- Name: ReviewQueue ReviewQueue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewQueue"
    ADD CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY (id);


--
-- Name: RewardLedger RewardLedger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RewardLedger"
    ADD CONSTRAINT "RewardLedger_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: SmsVerification SmsVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SmsVerification"
    ADD CONSTRAINT "SmsVerification_pkey" PRIMARY KEY (id);


--
-- Name: SocialTimelineLike SocialTimelineLike_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SocialTimelineLike"
    ADD CONSTRAINT "SocialTimelineLike_pkey" PRIMARY KEY (id);


--
-- Name: SocialTimeline SocialTimeline_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SocialTimeline"
    ADD CONSTRAINT "SocialTimeline_pkey" PRIMARY KEY (id);


--
-- Name: SpeechEvaluationRecord SpeechEvaluationRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpeechEvaluationRecord"
    ADD CONSTRAINT "SpeechEvaluationRecord_pkey" PRIMARY KEY (id);


--
-- Name: SystemConfig SystemConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemConfig"
    ADD CONSTRAINT "SystemConfig_pkey" PRIMARY KEY (id);


--
-- Name: TerminologyEntry TerminologyEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TerminologyEntry"
    ADD CONSTRAINT "TerminologyEntry_pkey" PRIMARY KEY (id);


--
-- Name: TranslationBillingBalance TranslationBillingBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationBillingBalance"
    ADD CONSTRAINT "TranslationBillingBalance_pkey" PRIMARY KEY (id);


--
-- Name: TranslationBillingLog TranslationBillingLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationBillingLog"
    ADD CONSTRAINT "TranslationBillingLog_pkey" PRIMARY KEY (id);


--
-- Name: TranslationMemoryEntry TranslationMemoryEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationMemoryEntry"
    ADD CONSTRAINT "TranslationMemoryEntry_pkey" PRIMARY KEY (id);


--
-- Name: TranslationPackageOrder TranslationPackageOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationPackageOrder"
    ADD CONSTRAINT "TranslationPackageOrder_pkey" PRIMARY KEY (id);


--
-- Name: UserDevice UserDevice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserDevice"
    ADD CONSTRAINT "UserDevice_pkey" PRIMARY KEY (id);


--
-- Name: UserIdentity UserIdentity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserIdentity"
    ADD CONSTRAINT "UserIdentity_pkey" PRIMARY KEY (id);


--
-- Name: UserLanguagePreference UserLanguagePreference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLanguagePreference"
    ADD CONSTRAINT "UserLanguagePreference_pkey" PRIMARY KEY (id);


--
-- Name: UserLearningLanguage UserLearningLanguage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLearningLanguage"
    ADD CONSTRAINT "UserLearningLanguage_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Workspace Workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: checkins checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT checkins_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: friend_settings friend_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_settings
    ADD CONSTRAINT friend_settings_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: AccountDeletionRequest_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AccountDeletionRequest_status_idx" ON public."AccountDeletionRequest" USING btree (status);


--
-- Name: AccountDeletionRequest_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AccountDeletionRequest_userId_idx" ON public."AccountDeletionRequest" USING btree ("userId");


--
-- Name: AdminOperationLog_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminOperationLog_adminId_idx" ON public."AdminOperationLog" USING btree ("adminId");


--
-- Name: AdminOperationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminOperationLog_createdAt_idx" ON public."AdminOperationLog" USING btree ("createdAt");


--
-- Name: AdminOperationLog_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminOperationLog_targetType_targetId_idx" ON public."AdminOperationLog" USING btree ("targetType", "targetId");


--
-- Name: AiLanguageViolationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiLanguageViolationLog_createdAt_idx" ON public."AiLanguageViolationLog" USING btree ("createdAt");


--
-- Name: AiLanguageViolationLog_requestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiLanguageViolationLog_requestId_idx" ON public."AiLanguageViolationLog" USING btree ("requestId");


--
-- Name: AiLanguageViolationLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiLanguageViolationLog_userId_idx" ON public."AiLanguageViolationLog" USING btree ("userId");


--
-- Name: AiLanguageViolationLog_violationType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiLanguageViolationLog_violationType_idx" ON public."AiLanguageViolationLog" USING btree ("violationType");


--
-- Name: AiPromptTemplate_scene_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiPromptTemplate_scene_idx" ON public."AiPromptTemplate" USING btree (scene);


--
-- Name: AiPromptTemplate_scene_version_languageCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AiPromptTemplate_scene_version_languageCode_key" ON public."AiPromptTemplate" USING btree (scene, version, "languageCode");


--
-- Name: AiPromptTemplate_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiPromptTemplate_status_idx" ON public."AiPromptTemplate" USING btree (status);


--
-- Name: AiRequestLog_assetHit_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiRequestLog_assetHit_idx" ON public."AiRequestLog" USING btree ("assetHit");


--
-- Name: AiRequestLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiRequestLog_createdAt_idx" ON public."AiRequestLog" USING btree ("createdAt");


--
-- Name: AiRequestLog_scene_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiRequestLog_scene_idx" ON public."AiRequestLog" USING btree (scene);


--
-- Name: AiRequestLog_success_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiRequestLog_success_idx" ON public."AiRequestLog" USING btree (success);


--
-- Name: AiRequestLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiRequestLog_userId_idx" ON public."AiRequestLog" USING btree ("userId");


--
-- Name: AiTutorRecord_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiTutorRecord_userId_createdAt_idx" ON public."AiTutorRecord" USING btree ("userId", "createdAt");


--
-- Name: AiUsageDailyStatistic_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiUsageDailyStatistic_date_idx" ON public."AiUsageDailyStatistic" USING btree (date);


--
-- Name: AiUsageDailyStatistic_date_userId_requestType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AiUsageDailyStatistic_date_userId_requestType_key" ON public."AiUsageDailyStatistic" USING btree (date, "userId", "requestType");


--
-- Name: AiUsageDailyStatistic_requestType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiUsageDailyStatistic_requestType_idx" ON public."AiUsageDailyStatistic" USING btree ("requestType");


--
-- Name: AiUsageDailyStatistic_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AiUsageDailyStatistic_userId_idx" ON public."AiUsageDailyStatistic" USING btree ("userId");


--
-- Name: CompanionProfile_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CompanionProfile_userId_idx" ON public."CompanionProfile" USING btree ("userId");


--
-- Name: CompanionProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CompanionProfile_userId_key" ON public."CompanionProfile" USING btree ("userId");


--
-- Name: ContentLanguageVersion_contentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ContentLanguageVersion_contentId_idx" ON public."ContentLanguageVersion" USING btree ("contentId");


--
-- Name: ContentLanguageVersion_contentId_languageCode_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ContentLanguageVersion_contentId_languageCode_version_key" ON public."ContentLanguageVersion" USING btree ("contentId", "languageCode", version);


--
-- Name: ContentLanguageVersion_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ContentLanguageVersion_languageCode_idx" ON public."ContentLanguageVersion" USING btree ("languageCode");


--
-- Name: ContentLanguageVersion_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ContentLanguageVersion_status_idx" ON public."ContentLanguageVersion" USING btree (status);


--
-- Name: CourseBlueprint_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CourseBlueprint_languageCode_idx" ON public."CourseBlueprint" USING btree ("languageCode");


--
-- Name: CourseBlueprint_level_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CourseBlueprint_level_idx" ON public."CourseBlueprint" USING btree (level);


--
-- Name: CourseBlueprint_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CourseBlueprint_status_idx" ON public."CourseBlueprint" USING btree (status);


--
-- Name: DailyLearningPlan_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyLearningPlan_status_idx" ON public."DailyLearningPlan" USING btree (status);


--
-- Name: DailyLearningPlan_userId_dayNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DailyLearningPlan_userId_dayNumber_key" ON public."DailyLearningPlan" USING btree ("userId", "dayNumber");


--
-- Name: DailyLearningPlan_userId_planDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DailyLearningPlan_userId_planDate_idx" ON public."DailyLearningPlan" USING btree ("userId", "planDate");


--
-- Name: DataExportRequest_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataExportRequest_status_idx" ON public."DataExportRequest" USING btree (status);


--
-- Name: DataExportRequest_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DataExportRequest_userId_idx" ON public."DataExportRequest" USING btree ("userId");


--
-- Name: GuestSession_convertedUserId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GuestSession_convertedUserId_idx" ON public."GuestSession" USING btree ("convertedUserId");


--
-- Name: GuestSession_deviceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "GuestSession_deviceId_idx" ON public."GuestSession" USING btree ("deviceId");


--
-- Name: GuestSession_deviceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GuestSession_deviceId_key" ON public."GuestSession" USING btree ("deviceId");


--
-- Name: LanguageConsistencyAlert_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyAlert_createdAt_idx" ON public."LanguageConsistencyAlert" USING btree ("createdAt");


--
-- Name: LanguageConsistencyAlert_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyAlert_status_idx" ON public."LanguageConsistencyAlert" USING btree (status);


--
-- Name: LanguageConsistencyAlert_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyAlert_userId_idx" ON public."LanguageConsistencyAlert" USING btree ("userId");


--
-- Name: LanguageConsistencyLog_anomalyType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyLog_anomalyType_idx" ON public."LanguageConsistencyLog" USING btree ("anomalyType");


--
-- Name: LanguageConsistencyLog_checkTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyLog_checkTime_idx" ON public."LanguageConsistencyLog" USING btree ("checkTime");


--
-- Name: LanguageConsistencyLog_runId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyLog_runId_idx" ON public."LanguageConsistencyLog" USING btree ("runId");


--
-- Name: LanguageConsistencyLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageConsistencyLog_userId_idx" ON public."LanguageConsistencyLog" USING btree ("userId");


--
-- Name: LanguageIdentity_isCustom_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageIdentity_isCustom_idx" ON public."LanguageIdentity" USING btree ("isCustom");


--
-- Name: LanguageIdentity_languageCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LanguageIdentity_languageCode_key" ON public."LanguageIdentity" USING btree ("languageCode");


--
-- Name: LanguageIdentity_script_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LanguageIdentity_script_idx" ON public."LanguageIdentity" USING btree (script);


--
-- Name: LearningAbilityModel_dimension_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningAbilityModel_dimension_idx" ON public."LearningAbilityModel" USING btree (dimension);


--
-- Name: LearningAbilityModel_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningAbilityModel_languageCode_idx" ON public."LearningAbilityModel" USING btree ("languageCode");


--
-- Name: LearningAbilityModel_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningAbilityModel_userId_idx" ON public."LearningAbilityModel" USING btree ("userId");


--
-- Name: LearningAbilityModel_userId_languageCode_dimension_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LearningAbilityModel_userId_languageCode_dimension_key" ON public."LearningAbilityModel" USING btree ("userId", "languageCode", dimension);


--
-- Name: LearningContent_contentType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_contentType_idx" ON public."LearningContent" USING btree ("contentType");


--
-- Name: LearningContent_difficultyLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_difficultyLevel_idx" ON public."LearningContent" USING btree ("difficultyLevel");


--
-- Name: LearningContent_sourceLanguage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_sourceLanguage_idx" ON public."LearningContent" USING btree ("sourceLanguage");


--
-- Name: LearningContent_sourceType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_sourceType_idx" ON public."LearningContent" USING btree ("sourceType");


--
-- Name: LearningContent_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_status_idx" ON public."LearningContent" USING btree (status);


--
-- Name: LearningContent_targetLanguage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningContent_targetLanguage_idx" ON public."LearningContent" USING btree ("targetLanguage");


--
-- Name: LearningEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningEvent_createdAt_idx" ON public."LearningEvent" USING btree ("createdAt");


--
-- Name: LearningEvent_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningEvent_eventType_idx" ON public."LearningEvent" USING btree ("eventType");


--
-- Name: LearningEvent_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningEvent_languageCode_idx" ON public."LearningEvent" USING btree ("languageCode");


--
-- Name: LearningEvent_planId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningEvent_planId_idx" ON public."LearningEvent" USING btree ("planId");


--
-- Name: LearningEvent_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningEvent_userId_idx" ON public."LearningEvent" USING btree ("userId");


--
-- Name: LearningGoal_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningGoal_status_idx" ON public."LearningGoal" USING btree (status);


--
-- Name: LearningGoal_targetLanguage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningGoal_targetLanguage_idx" ON public."LearningGoal" USING btree ("targetLanguage");


--
-- Name: LearningGoal_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningGoal_userId_idx" ON public."LearningGoal" USING btree ("userId");


--
-- Name: LearningMemory_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningMemory_createdAt_idx" ON public."LearningMemory" USING btree ("createdAt");


--
-- Name: LearningMemory_memoryType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningMemory_memoryType_idx" ON public."LearningMemory" USING btree ("memoryType");


--
-- Name: LearningMemory_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningMemory_userId_idx" ON public."LearningMemory" USING btree ("userId");


--
-- Name: LearningMemory_visibility_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningMemory_visibility_idx" ON public."LearningMemory" USING btree (visibility);


--
-- Name: LearningPlan_goalId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningPlan_goalId_idx" ON public."LearningPlan" USING btree ("goalId");


--
-- Name: LearningPlan_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningPlan_status_idx" ON public."LearningPlan" USING btree (status);


--
-- Name: LearningPlan_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningPlan_userId_idx" ON public."LearningPlan" USING btree ("userId");


--
-- Name: LearningProfile_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningProfile_userId_idx" ON public."LearningProfile" USING btree ("userId");


--
-- Name: LearningProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LearningProfile_userId_key" ON public."LearningProfile" USING btree ("userId");


--
-- Name: LearningProgress_language_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningProgress_language_idx" ON public."LearningProgress" USING btree (language);


--
-- Name: LearningProgress_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LearningProgress_userId_idx" ON public."LearningProgress" USING btree ("userId");


--
-- Name: LearningProgress_userId_language_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LearningProgress_userId_language_key" ON public."LearningProgress" USING btree ("userId", language);


--
-- Name: LoginLog_account_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoginLog_account_idx" ON public."LoginLog" USING btree (account);


--
-- Name: LoginLog_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoginLog_adminId_idx" ON public."LoginLog" USING btree ("adminId");


--
-- Name: LoginLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LoginLog_createdAt_idx" ON public."LoginLog" USING btree ("createdAt");


--
-- Name: MembershipOrder_orderNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipOrder_orderNo_idx" ON public."MembershipOrder" USING btree ("orderNo");


--
-- Name: MembershipOrder_orderNo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipOrder_orderNo_key" ON public."MembershipOrder" USING btree ("orderNo");


--
-- Name: MembershipOrder_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipOrder_status_idx" ON public."MembershipOrder" USING btree (status);


--
-- Name: MembershipOrder_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipOrder_userId_idx" ON public."MembershipOrder" USING btree ("userId");


--
-- Name: OcrUsageLog_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OcrUsageLog_status_createdAt_idx" ON public."OcrUsageLog" USING btree (status, "createdAt");


--
-- Name: OcrUsageLog_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OcrUsageLog_userId_createdAt_idx" ON public."OcrUsageLog" USING btree ("userId", "createdAt");


--
-- Name: OrgClassStudent_classId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrgClassStudent_classId_idx" ON public."OrgClassStudent" USING btree ("classId");


--
-- Name: OrgClassStudent_classId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrgClassStudent_classId_userId_key" ON public."OrgClassStudent" USING btree ("classId", "userId");


--
-- Name: OrgClassStudent_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrgClassStudent_userId_idx" ON public."OrgClassStudent" USING btree ("userId");


--
-- Name: OrgClass_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrgClass_organizationId_idx" ON public."OrgClass" USING btree ("organizationId");


--
-- Name: OrgClass_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrgClass_status_idx" ON public."OrgClass" USING btree (status);


--
-- Name: OrgClass_teacherId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrgClass_teacherId_idx" ON public."OrgClass" USING btree ("teacherId");


--
-- Name: OrganizationMember_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrganizationMember_organizationId_idx" ON public."OrganizationMember" USING btree ("organizationId");


--
-- Name: OrganizationMember_organizationId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON public."OrganizationMember" USING btree ("organizationId", "userId");


--
-- Name: OrganizationMember_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrganizationMember_role_idx" ON public."OrganizationMember" USING btree (role);


--
-- Name: OrganizationMember_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OrganizationMember_userId_idx" ON public."OrganizationMember" USING btree ("userId");


--
-- Name: Organization_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_status_idx" ON public."Organization" USING btree (status);


--
-- Name: RateLimitLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RateLimitLog_action_idx" ON public."RateLimitLog" USING btree (action);


--
-- Name: RateLimitLog_identifier_action_windowStart_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RateLimitLog_identifier_action_windowStart_key" ON public."RateLimitLog" USING btree (identifier, action, "windowStart");


--
-- Name: RateLimitLog_identifier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RateLimitLog_identifier_idx" ON public."RateLimitLog" USING btree (identifier);


--
-- Name: RateLimitLog_windowStart_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RateLimitLog_windowStart_idx" ON public."RateLimitLog" USING btree ("windowStart");


--
-- Name: ReviewQueue_userId_dueDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ReviewQueue_userId_dueDate_idx" ON public."ReviewQueue" USING btree ("userId", "dueDate");


--
-- Name: RewardLedger_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RewardLedger_userId_createdAt_idx" ON public."RewardLedger" USING btree ("userId", "createdAt");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_refreshToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_refreshToken_key" ON public."Session" USING btree ("refreshToken");


--
-- Name: Session_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_token_idx" ON public."Session" USING btree (token);


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: SmsVerification_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SmsVerification_expiresAt_idx" ON public."SmsVerification" USING btree ("expiresAt");


--
-- Name: SmsVerification_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SmsVerification_phone_idx" ON public."SmsVerification" USING btree (phone);


--
-- Name: SocialTimelineLike_postId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SocialTimelineLike_postId_idx" ON public."SocialTimelineLike" USING btree ("postId");


--
-- Name: SocialTimelineLike_postId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SocialTimelineLike_postId_userId_key" ON public."SocialTimelineLike" USING btree ("postId", "userId");


--
-- Name: SocialTimelineLike_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SocialTimelineLike_userId_idx" ON public."SocialTimelineLike" USING btree ("userId");


--
-- Name: SocialTimeline_actorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SocialTimeline_actorId_idx" ON public."SocialTimeline" USING btree ("actorId");


--
-- Name: SocialTimeline_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SocialTimeline_createdAt_idx" ON public."SocialTimeline" USING btree ("createdAt");


--
-- Name: SocialTimeline_likeCount_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SocialTimeline_likeCount_idx" ON public."SocialTimeline" USING btree ("likeCount");


--
-- Name: SpeechEvaluationRecord_planId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SpeechEvaluationRecord_planId_idx" ON public."SpeechEvaluationRecord" USING btree ("planId");


--
-- Name: SpeechEvaluationRecord_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SpeechEvaluationRecord_userId_createdAt_idx" ON public."SpeechEvaluationRecord" USING btree ("userId", "createdAt");


--
-- Name: SystemConfig_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SystemConfig_key_idx" ON public."SystemConfig" USING btree (key);


--
-- Name: SystemConfig_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemConfig_key_key" ON public."SystemConfig" USING btree (key);


--
-- Name: TerminologyEntry_domain_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TerminologyEntry_domain_idx" ON public."TerminologyEntry" USING btree (domain);


--
-- Name: TerminologyEntry_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TerminologyEntry_languageCode_idx" ON public."TerminologyEntry" USING btree ("languageCode");


--
-- Name: TerminologyEntry_languageCode_term_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TerminologyEntry_languageCode_term_key" ON public."TerminologyEntry" USING btree ("languageCode", term);


--
-- Name: TranslationBillingBalance_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationBillingBalance_userId_idx" ON public."TranslationBillingBalance" USING btree ("userId");


--
-- Name: TranslationBillingBalance_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TranslationBillingBalance_userId_key" ON public."TranslationBillingBalance" USING btree ("userId");


--
-- Name: TranslationBillingLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationBillingLog_createdAt_idx" ON public."TranslationBillingLog" USING btree ("createdAt");


--
-- Name: TranslationBillingLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationBillingLog_userId_idx" ON public."TranslationBillingLog" USING btree ("userId");


--
-- Name: TranslationBillingLog_userId_requestId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TranslationBillingLog_userId_requestId_key" ON public."TranslationBillingLog" USING btree ("userId", "requestId");


--
-- Name: TranslationMemoryEntry_reuseCount_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationMemoryEntry_reuseCount_idx" ON public."TranslationMemoryEntry" USING btree ("reuseCount");


--
-- Name: TranslationMemoryEntry_sourceLanguage_targetLanguage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationMemoryEntry_sourceLanguage_targetLanguage_idx" ON public."TranslationMemoryEntry" USING btree ("sourceLanguage", "targetLanguage");


--
-- Name: TranslationMemoryEntry_sourceText_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationMemoryEntry_sourceText_idx" ON public."TranslationMemoryEntry" USING btree ("sourceText");


--
-- Name: TranslationPackageOrder_orderNo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TranslationPackageOrder_orderNo_key" ON public."TranslationPackageOrder" USING btree ("orderNo");


--
-- Name: TranslationPackageOrder_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TranslationPackageOrder_userId_idx" ON public."TranslationPackageOrder" USING btree ("userId");


--
-- Name: UserDevice_deviceToken_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserDevice_deviceToken_idx" ON public."UserDevice" USING btree ("deviceToken");


--
-- Name: UserDevice_userId_deviceToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserDevice_userId_deviceToken_key" ON public."UserDevice" USING btree ("userId", "deviceToken");


--
-- Name: UserDevice_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserDevice_userId_idx" ON public."UserDevice" USING btree ("userId");


--
-- Name: UserIdentity_identityType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIdentity_identityType_idx" ON public."UserIdentity" USING btree ("identityType");


--
-- Name: UserIdentity_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserIdentity_userId_idx" ON public."UserIdentity" USING btree ("userId");


--
-- Name: UserIdentity_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserIdentity_userId_key" ON public."UserIdentity" USING btree ("userId");


--
-- Name: UserLanguagePreference_interfaceLanguage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserLanguagePreference_interfaceLanguage_idx" ON public."UserLanguagePreference" USING btree ("interfaceLanguage");


--
-- Name: UserLanguagePreference_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserLanguagePreference_userId_idx" ON public."UserLanguagePreference" USING btree ("userId");


--
-- Name: UserLanguagePreference_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserLanguagePreference_userId_key" ON public."UserLanguagePreference" USING btree ("userId");


--
-- Name: UserLearningLanguage_languageCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserLearningLanguage_languageCode_idx" ON public."UserLearningLanguage" USING btree ("languageCode");


--
-- Name: UserLearningLanguage_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserLearningLanguage_status_idx" ON public."UserLearningLanguage" USING btree (status);


--
-- Name: UserLearningLanguage_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserLearningLanguage_userId_idx" ON public."UserLearningLanguage" USING btree ("userId");


--
-- Name: UserLearningLanguage_userId_languageCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserLearningLanguage_userId_languageCode_key" ON public."UserLearningLanguage" USING btree ("userId", "languageCode");


--
-- Name: User_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_createdAt_idx" ON public."User" USING btree ("createdAt");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_inviteCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_inviteCode_key" ON public."User" USING btree ("inviteCode");


--
-- Name: User_membershipLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_membershipLevel_idx" ON public."User" USING btree ("membershipLevel");


--
-- Name: User_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_phone_idx" ON public."User" USING btree (phone);


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: User_uniqueId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_uniqueId_idx" ON public."User" USING btree ("uniqueId");


--
-- Name: User_uniqueId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_uniqueId_key" ON public."User" USING btree ("uniqueId");


--
-- Name: User_wechatOpenId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_wechatOpenId_idx" ON public."User" USING btree ("wechatOpenId");


--
-- Name: User_wechatOpenId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_wechatOpenId_key" ON public."User" USING btree ("wechatOpenId");


--
-- Name: User_wechatUnionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_wechatUnionId_key" ON public."User" USING btree ("wechatUnionId");


--
-- Name: Workspace_organizationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Workspace_organizationId_idx" ON public."Workspace" USING btree ("organizationId");


--
-- Name: Workspace_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Workspace_ownerId_idx" ON public."Workspace" USING btree ("ownerId");


--
-- Name: Workspace_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Workspace_type_idx" ON public."Workspace" USING btree (type);


--
-- Name: checkins_userId_checkinDate_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "checkins_userId_checkinDate_key" ON public.checkins USING btree ("userId", "checkinDate");


--
-- Name: checkins_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "checkins_userId_idx" ON public.checkins USING btree ("userId");


--
-- Name: conversations_lastMsgTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "conversations_lastMsgTime_idx" ON public.conversations USING btree ("lastMsgTime");


--
-- Name: conversations_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_type_idx ON public.conversations USING btree (type);


--
-- Name: friend_settings_friendId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "friend_settings_friendId_idx" ON public.friend_settings USING btree ("friendId");


--
-- Name: friend_settings_isBlocked_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "friend_settings_isBlocked_idx" ON public.friend_settings USING btree ("isBlocked");


--
-- Name: friend_settings_userId_friendId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "friend_settings_userId_friendId_key" ON public.friend_settings USING btree ("userId", "friendId");


--
-- Name: friend_settings_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "friend_settings_userId_idx" ON public.friend_settings USING btree ("userId");


--
-- Name: group_members_groupId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "group_members_groupId_idx" ON public.group_members USING btree ("groupId");


--
-- Name: group_members_groupId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON public.group_members USING btree ("groupId", "userId");


--
-- Name: group_members_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX group_members_role_idx ON public.group_members USING btree (role);


--
-- Name: group_members_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "group_members_userId_idx" ON public.group_members USING btree ("userId");


--
-- Name: groups_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "groups_createdAt_idx" ON public.groups USING btree ("createdAt");


--
-- Name: groups_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "groups_ownerId_idx" ON public.groups USING btree ("ownerId");


--
-- Name: messages_conversationId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_conversationId_createdAt_idx" ON public.messages USING btree ("conversationId", "createdAt");


--
-- Name: messages_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "messages_senderId_idx" ON public.messages USING btree ("senderId");


--
-- Name: AccountDeletionRequest AccountDeletionRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountDeletionRequest"
    ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AiTutorRecord AiTutorRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AiTutorRecord"
    ADD CONSTRAINT "AiTutorRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CompanionProfile CompanionProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CompanionProfile"
    ADD CONSTRAINT "CompanionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DailyLearningPlan DailyLearningPlan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DailyLearningPlan"
    ADD CONSTRAINT "DailyLearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DataExportRequest DataExportRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataExportRequest"
    ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningAbilityModel LearningAbilityModel_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningAbilityModel"
    ADD CONSTRAINT "LearningAbilityModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningEvent LearningEvent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningEvent"
    ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningGoal LearningGoal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningGoal"
    ADD CONSTRAINT "LearningGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningMemory LearningMemory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningMemory"
    ADD CONSTRAINT "LearningMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningPlan LearningPlan_goalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningPlan"
    ADD CONSTRAINT "LearningPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES public."LearningGoal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningPlan LearningPlan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningPlan"
    ADD CONSTRAINT "LearningPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningProfile LearningProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningProfile"
    ADD CONSTRAINT "LearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LearningProgress LearningProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LearningProgress"
    ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipOrder MembershipOrder_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipOrder"
    ADD CONSTRAINT "MembershipOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OcrUsageLog OcrUsageLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OcrUsageLog"
    ADD CONSTRAINT "OcrUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrgClassStudent OrgClassStudent_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClassStudent"
    ADD CONSTRAINT "OrgClassStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."OrgClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrgClassStudent OrgClassStudent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClassStudent"
    ADD CONSTRAINT "OrgClassStudent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrgClass OrgClass_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClass"
    ADD CONSTRAINT "OrgClass_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrgClass OrgClass_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrgClass"
    ADD CONSTRAINT "OrgClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrganizationMember OrganizationMember_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrganizationMember OrganizationMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewQueue ReviewQueue_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewQueue"
    ADD CONSTRAINT "ReviewQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RewardLedger RewardLedger_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RewardLedger"
    ADD CONSTRAINT "RewardLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SocialTimelineLike SocialTimelineLike_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SocialTimelineLike"
    ADD CONSTRAINT "SocialTimelineLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."SocialTimeline"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SocialTimelineLike SocialTimelineLike_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SocialTimelineLike"
    ADD CONSTRAINT "SocialTimelineLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SocialTimeline SocialTimeline_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SocialTimeline"
    ADD CONSTRAINT "SocialTimeline_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SpeechEvaluationRecord SpeechEvaluationRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpeechEvaluationRecord"
    ADD CONSTRAINT "SpeechEvaluationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TranslationBillingBalance TranslationBillingBalance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationBillingBalance"
    ADD CONSTRAINT "TranslationBillingBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TranslationBillingLog TranslationBillingLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationBillingLog"
    ADD CONSTRAINT "TranslationBillingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TranslationPackageOrder TranslationPackageOrder_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TranslationPackageOrder"
    ADD CONSTRAINT "TranslationPackageOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserDevice UserDevice_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserDevice"
    ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserIdentity UserIdentity_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserIdentity"
    ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserLanguagePreference UserLanguagePreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLanguagePreference"
    ADD CONSTRAINT "UserLanguagePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserLearningLanguage UserLearningLanguage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserLearningLanguage"
    ADD CONSTRAINT "UserLearningLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Workspace Workspace_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: checkins checkins_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkins
    ADD CONSTRAINT "checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friend_settings friend_settings_friendId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_settings
    ADD CONSTRAINT "friend_settings_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friend_settings friend_settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_settings
    ADD CONSTRAINT "friend_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_members group_members_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group_members group_members_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups groups_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9qHpncu85xPIOPQvXl3ghC8rPJPBS5grxOfWqDLgz1w8FfO2cNsc125Y34piRN5

