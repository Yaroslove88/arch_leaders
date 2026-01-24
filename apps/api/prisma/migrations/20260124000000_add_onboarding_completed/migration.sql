-- Add onboarding completion fields to users table
-- These fields track onboarding completion status and timestamp

-- Add onboarding_completed field with default false
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- Add onboarding_completed_at field (nullable)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3);

