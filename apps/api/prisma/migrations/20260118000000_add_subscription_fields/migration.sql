-- Add subscription and monetization fields to users table
-- These fields support user verification and paid plans

-- Add subscription_plan field with default 'free'
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_plan" TEXT NOT NULL DEFAULT 'free';

-- Add subscription_expires_at field (nullable)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP(3);

-- Add is_verified field with default false
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster subscription queries
CREATE INDEX IF NOT EXISTS "users_subscription_plan_idx" ON "users"("subscription_plan");
