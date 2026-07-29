-- Stage 9 Community Baseline Migration
-- Migration: 20260729120000_community_stage9_baseline
-- Scope: Privacy fields + Friend + Group + Conversation + Message (ZERO modification to existing tables)
-- Pure additive: No ALTER on existing columns, no DROP, no data loss risk

-- ============================================================
-- 1. User: Add privacy settings (JSONB, extensible per C.5)
-- ============================================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacySettings" JSONB DEFAULT '{"allowUidSearch":true,"allowGroupInvite":true,"allowDiscover":true}'::jsonb;

-- ============================================================
-- 2. FriendSetting: Friendship settings table (C.5 friend_settings)
-- ============================================================
CREATE TABLE "FriendSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "remarkName" TEXT,
    "tags" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "isMuted" BOOLEAN DEFAULT false NOT NULL,
    "isBlocked" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FriendSetting_userId_friendId_key" ON "FriendSetting"("userId", "friendId");
CREATE INDEX "FriendSetting_userId_idx" ON "FriendSetting"("userId");
CREATE INDEX "FriendSetting_friendId_idx" ON "FriendSetting"("friendId");

-- ============================================================
-- 3. Group: Community group table (Constitution §11.2)
-- ============================================================
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdVia" TEXT NOT NULL DEFAULT 'manual',
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "muteAll" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "announcement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Group_ownerId_idx" ON "Group"("ownerId");
CREATE INDEX "Group_status_idx" ON "Group"("status");
CREATE INDEX "Group_createdAt_idx" ON "Group"("createdAt");

-- ============================================================
-- 4. GroupMember: Group membership (role: owner/admin/member)
-- ============================================================
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "mute" BOOLEAN NOT NULL DEFAULT false,
    "joinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupNickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- ============================================================
-- 5. Conversation: Unified chat session (single/group)
-- ============================================================
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'single',
    "targetId" TEXT NOT NULL,
    "participants" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "lastMsgId" TEXT,
    "lastMsgPreview" TEXT,
    "lastMsgTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Conversation_type_targetId_idx" ON "Conversation"("type", "targetId");
CREATE INDEX "Conversation_type_idx" ON "Conversation"("type");
CREATE INDEX "Conversation_lastMsgTime_idx" ON "Conversation"("lastMsgTime");

-- ============================================================
-- 6. Message: Chat messages within conversations
-- ============================================================
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "msgType" TEXT NOT NULL DEFAULT 'text',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- ============================================================
-- 7. Foreign key constraints (add after all tables created)
-- ============================================================
ALTER TABLE "FriendSetting" ADD CONSTRAINT "FriendSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FriendSetting" ADD CONSTRAINT "FriendSetting_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
