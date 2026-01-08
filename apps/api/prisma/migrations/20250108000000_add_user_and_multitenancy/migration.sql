-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramUsername_key" ON "users"("telegramUsername");
CREATE INDEX "users_telegramUsername_idx" ON "users"("telegramUsername");
CREATE INDEX "users_role_idx" ON "users"("role");

-- Create default admin user (password: admin123)
-- User can change password later using create-admin script
INSERT INTO "users" ("id", "telegramUsername", "password", "role", "created_at", "updated_at")
VALUES (
    gen_random_uuid()::text,
    'admin',
    '$2b$10$hnfr0egabA4eBe0JCZZzD.U.900SzkoYV9i9sAA15000IoR0.Bnt2',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 1: Add userId columns as nullable
ALTER TABLE "Entry" ADD COLUMN "userId" TEXT;
ALTER TABLE "Session" ADD COLUMN "userId" TEXT;
ALTER TABLE "Quest" ADD COLUMN "userId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "userId" TEXT;
ALTER TABLE "tree_semantic" ADD COLUMN "userId" TEXT;
ALTER TABLE "tree_layout" ADD COLUMN "userId" TEXT;
ALTER TABLE "changelog" ADD COLUMN "userId" TEXT;

-- Step 2: Get the default admin user ID
DO $$
DECLARE
    default_user_id TEXT;
BEGIN
    SELECT id INTO default_user_id FROM "users" WHERE "telegramUsername" = 'admin' LIMIT 1;
    
    -- Step 3: Update existing records with default user ID
    UPDATE "Entry" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "Session" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "Quest" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "Evidence" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "tree_semantic" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "tree_layout" SET "userId" = default_user_id WHERE "userId" IS NULL;
    UPDATE "changelog" SET "userId" = default_user_id WHERE "userId" IS NULL;
END $$;

-- Step 4: Make userId columns NOT NULL
ALTER TABLE "Entry" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Session" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Quest" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Evidence" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "tree_semantic" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "tree_layout" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "changelog" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Add indexes
CREATE INDEX "Entry_userId_idx" ON "Entry"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Quest_userId_idx" ON "Quest"("userId");
CREATE INDEX "Evidence_userId_idx" ON "Evidence"("userId");
CREATE INDEX "tree_semantic_userId_idx" ON "tree_semantic"("userId");
CREATE INDEX "tree_layout_userId_tree_id_computed_from_tree_revision_idx" ON "tree_layout"("userId", "tree_id", "computed_from_tree_revision");
CREATE INDEX "changelog_userId_idx" ON "changelog"("userId");

-- Step 6: Add unique constraint for tree_semantic (one tree per user)
CREATE UNIQUE INDEX "tree_semantic_userId_key" ON "tree_semantic"("userId");

-- Step 7: Add foreign keys
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tree_semantic" ADD CONSTRAINT "tree_semantic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tree_layout" ADD CONSTRAINT "tree_layout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "changelog" ADD CONSTRAINT "changelog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

