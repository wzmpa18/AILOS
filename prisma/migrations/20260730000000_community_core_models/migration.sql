-- ============================================================
-- Stage 9 Community Core Models Migration
-- Baseline migration for 5 community tables + User.privacySettings
-- Created: 2026-07-30 (replaces the void db push from 20260729120000)
-- Strategy: idempotent (IF NOT EXISTS) — safe to apply on top of existing db push tables
-- ============================================================

-- 1. Add privacySettings column to User (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'privacySettings'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "privacySettings" JSONB;
  END IF;
END $$;

-- 2. Friend Settings table (friending, blocking, muting, tagging)
CREATE TABLE IF NOT EXISTS friend_settings (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId"    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "friendId"  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "remarkName" TEXT,
    tags        TEXT[] DEFAULT '{}',
    "isMuted"   BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT friend_settings_userId_friendId_key UNIQUE ("userId", "friendId")
);

CREATE INDEX IF NOT EXISTS friend_settings_userId_idx ON friend_settings("userId");
CREATE INDEX IF NOT EXISTS friend_settings_friendId_idx ON friend_settings("friendId");
CREATE INDEX IF NOT EXISTS friend_settings_isBlocked_idx ON friend_settings("isBlocked");

-- 3. Groups table
CREATE TABLE IF NOT EXISTS groups (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name          TEXT NOT NULL,
    description   TEXT,
    "avatarUrl"   TEXT,
    "ownerId"     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "maxMembers"  INTEGER NOT NULL DEFAULT 50,
    "createdVia"  TEXT NOT NULL DEFAULT 'manual',
    announcement  TEXT,
    "muteAll"     BOOLEAN NOT NULL DEFAULT false,
    status        TEXT NOT NULL DEFAULT 'active',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS groups_ownerId_idx ON groups("ownerId");
CREATE INDEX IF NOT EXISTS groups_createdAt_idx ON groups("createdAt");

-- 4. Group Members table
CREATE TABLE IF NOT EXISTS group_members (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "groupId"       TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    "userId"        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member',
    "groupNickname" TEXT,
    mute            BOOLEAN NOT NULL DEFAULT false,
    "joinTime"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT group_members_groupId_userId_key UNIQUE ("groupId", "userId")
);

CREATE INDEX IF NOT EXISTS group_members_groupId_idx ON group_members("groupId");
CREATE INDEX IF NOT EXISTS group_members_userId_idx ON group_members("userId");
CREATE INDEX IF NOT EXISTS group_members_role_idx ON group_members(role);

-- 5. Conversations table (single/group chat sessions)
CREATE TABLE IF NOT EXISTS conversations (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type             TEXT NOT NULL DEFAULT 'single',
    "targetId"       TEXT,
    participants     TEXT[] NOT NULL DEFAULT '{}',
    "lastMsgId"      TEXT,
    "lastMsgPreview" TEXT,
    "lastMsgTime"    TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conversations_type_idx ON conversations(type);
CREATE INDEX IF NOT EXISTS conversations_lastMsgTime_idx ON conversations("lastMsgTime");

-- 6. Messages table
CREATE TABLE IF NOT EXISTS messages (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL,
    "senderId"       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "msgType"        TEXT NOT NULL DEFAULT 'text',
    content          TEXT NOT NULL,
    "isRead"         BOOLEAN NOT NULL DEFAULT false,
    "isRevoked"      BOOLEAN NOT NULL DEFAULT false,
    "revokedAt"      TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS messages_conversationId_createdAt_idx ON messages("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS messages_senderId_idx ON messages("senderId");
