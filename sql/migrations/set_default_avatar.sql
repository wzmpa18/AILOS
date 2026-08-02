-- ============================================
-- AILOS Migration: Set Default Parrot Avatar
-- Bug: 默认头像不符合要求 (P1)
-- Date: 2026-08-02
-- Description: Set default avatar URL for all existing users
--              who have NULL or empty avatar.
-- Database: PostgreSQL (managed by Prisma)
-- Run: psql $DATABASE_URL -f sql/migrations/set_default_avatar.sql
-- ============================================

-- The User model in Prisma maps to the "User" table in PostgreSQL.
-- Set the default parrot avatar for users with NULL or empty avatar.
UPDATE "User"
SET avatar = '/assets/images/default_avatar.png',
    "updatedAt" = NOW()
WHERE avatar IS NULL
   OR avatar = ''
   OR avatar = 'null';

-- Verification query (run separately to check results):
-- SELECT COUNT(*) AS users_with_default_avatar
-- FROM "User"
-- WHERE avatar = '/assets/images/default_avatar.png';
--
-- SELECT COUNT(*) AS users_without_avatar
-- FROM "User"
-- WHERE avatar IS NULL OR avatar = '';