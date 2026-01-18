-- Migration: Add experience system fields
-- Adds internal_progress, stored_experience, last_activity_date to UserAbilityState
-- Adds prerequisites to AbilityNode
-- Adds Achievement and UserAchievement tables

-- AlterTable: Add new fields to UserAbilityState
ALTER TABLE "user_ability_state" 
ADD COLUMN IF NOT EXISTS "internal_progress" DECIMAL(10,4) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "stored_experience" DECIMAL(10,4) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "last_activity_date" TIMESTAMP(3);

-- Migrate existing progress to internal_progress
UPDATE "user_ability_state" 
SET "internal_progress" = "progress" 
WHERE "internal_progress" = 0.0 AND "progress" > 0.0;

-- CreateIndex: Add index for internal_progress
CREATE INDEX IF NOT EXISTS "user_ability_state_user_id_internal_progress_idx" 
ON "user_ability_state"("user_id", "internal_progress" DESC);

-- CreateIndex: Add index for last_activity_date
CREATE INDEX IF NOT EXISTS "user_ability_state_last_activity_date_idx" 
ON "user_ability_state"("last_activity_date");

-- AlterTable: Add prerequisites to AbilityNode
ALTER TABLE "ability_nodes" 
ADD COLUMN IF NOT EXISTS "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: Achievements
CREATE TABLE IF NOT EXISTS "achievements" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "node_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "threshold" DECIMAL(10,4) NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Add indexes for achievements
CREATE INDEX IF NOT EXISTS "achievements_type_threshold_idx" 
ON "achievements"("type", "threshold");

CREATE INDEX IF NOT EXISTS "achievements_node_id_idx" 
ON "achievements"("node_id");

-- CreateTable: UserAchievements
CREATE TABLE IF NOT EXISTS "user_achievements" (
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "node_id" TEXT,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id", "achievement_id")
);

-- CreateIndex: Add indexes for user_achievements
CREATE INDEX IF NOT EXISTS "user_achievements_user_id_unlocked_at_idx" 
ON "user_achievements"("user_id", "unlocked_at" DESC);

CREATE INDEX IF NOT EXISTS "user_achievements_node_id_unlocked_at_idx" 
ON "user_achievements"("node_id", "unlocked_at" DESC);

-- AddForeignKey: UserAchievements -> User
ALTER TABLE "user_achievements" 
ADD CONSTRAINT "user_achievements_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: UserAchievements -> Achievement
ALTER TABLE "user_achievements" 
ADD CONSTRAINT "user_achievements_achievement_id_fkey" 
FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
