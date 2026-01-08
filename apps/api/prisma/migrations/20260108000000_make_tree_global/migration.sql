-- Make tree_semantic support global tree (userId optional)
-- This allows the tree to work without a specific user (global tree)

-- Step 1: Drop foreign key constraint
ALTER TABLE "tree_semantic" DROP CONSTRAINT IF EXISTS "tree_semantic_userId_fkey";

-- Step 2: Drop unique constraint (we'll recreate it to allow NULL)
DROP INDEX IF EXISTS "tree_semantic_userId_key";

-- Step 3: Make userId nullable
ALTER TABLE "tree_semantic" ALTER COLUMN "userId" DROP NOT NULL;

-- Step 4: Recreate unique constraint (PostgreSQL allows multiple NULLs in unique constraints)
CREATE UNIQUE INDEX "tree_semantic_userId_key" ON "tree_semantic"("userId") WHERE "userId" IS NOT NULL;

-- Step 5: Recreate foreign key constraint (allows NULL)
ALTER TABLE "tree_semantic" 
  ADD CONSTRAINT "tree_semantic_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Step 6: Update id default to "tree_main" if not already set
-- Note: This won't change existing rows, but new rows will use "tree_main" as default
-- For existing rows with UUID, we leave them as is




