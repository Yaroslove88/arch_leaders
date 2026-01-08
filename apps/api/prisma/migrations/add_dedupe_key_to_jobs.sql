-- Migration: Add dedupe_key to jobs table
-- Created: 2025-01-27

-- Add dedupe_key column
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "dedupe_key" TEXT;

-- Create unique index on dedupe_key
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_dedupe_key_key" ON "jobs"("dedupe_key");

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "jobs_dedupe_key_idx" ON "jobs"("dedupe_key");

