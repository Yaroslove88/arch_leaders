#!/bin/sh
set -e

echo "🚀 Starting Leadership Architect API..."
echo "DIAG entrypoint: ts=$(date -Iseconds) node=$(node -v 2>/dev/null || echo 'unknown')"
echo "DIAG entrypoint: pwd=$(pwd) ls_app=$(ls -la /app 2>/dev/null | wc -l | tr -d ' ')"
if [ -d "/app/data" ]; then
  echo "DIAG entrypoint: /app/data exists"
  ls -la /app/data || true
else
  echo "DIAG entrypoint: /app/data MISSING"
fi
for f in /app/data/builds.json /app/data/interactive-cases.json /app/data/node-descriptions.json /app/data/quest-templates.json; do
  if [ -f "$f" ]; then
    echo "DIAG entrypoint: file exists $f size=$(wc -c < "$f" 2>/dev/null || echo '?')"
  else
    echo "DIAG entrypoint: file MISSING $f"
  fi
done
if [ -n "${DATABASE_URL}" ]; then
  # Не логируем сам DATABASE_URL (секрет), только факт наличия и префикс.
  echo "DIAG entrypoint: DATABASE_URL is set (prefix=$(printf '%s' "$DATABASE_URL" | cut -c1-12))"
else
  echo "DIAG entrypoint: DATABASE_URL is MISSING"
fi

# Apply database migrations
echo "📦 Applying database migrations..."
echo "DIAG entrypoint: migrate deploy START ts=$(date -Iseconds)"
set +e
npx prisma migrate deploy --schema=./prisma/schema.prisma
MIGRATE_EXIT=$?
set -e
if [ "$MIGRATE_EXIT" -ne 0 ]; then
  echo "DIAG entrypoint: migrate deploy FAILED exit=${MIGRATE_EXIT} ts=$(date -Iseconds)"
  echo "DIAG entrypoint: continuing startup despite migration failure (likely needs prisma migrate resolve)"
else
  echo "DIAG entrypoint: migrate deploy DONE ts=$(date -Iseconds)"
fi

# Hotfix: ensure required columns exist even if migrations are blocked (P3009).
# This is idempotent and matches prisma migrations.
echo "DIAG entrypoint: db hotfix START ts=$(date -Iseconds)"
set +e
npx prisma db execute --schema=./prisma/schema.prisma --stdin <<'SQL'
-- Experience system fields (migration 20250115000000)
ALTER TABLE "ability_nodes"
ADD COLUMN IF NOT EXISTS "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "user_ability_state"
ADD COLUMN IF NOT EXISTS "internal_progress" DECIMAL(10,4) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "stored_experience" DECIMAL(10,4) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "last_activity_date" TIMESTAMP(3);

-- Monetization fields (migration 20260118000000)
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "subscription_plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- Index for subscription queries
CREATE INDEX IF NOT EXISTS "users_subscription_plan_idx" ON "users"("subscription_plan");
SQL
HOTFIX_EXIT=$?
set -e
if [ "$HOTFIX_EXIT" -ne 0 ]; then
  echo "DIAG entrypoint: db hotfix FAILED exit=${HOTFIX_EXIT} ts=$(date -Iseconds)"
else
  echo "DIAG entrypoint: db hotfix DONE ts=$(date -Iseconds)"
fi

# Seed admin user if not exists
echo "👤 Checking admin user..."
echo "DIAG entrypoint: seed-admin START ts=$(date -Iseconds)"
npx tsx ./src/prisma/seed-admin.ts 2>/dev/null || node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'yaroslav';
  const adminPassword = process.env.ADMIN_PASSWORD || 'LeaderArch2025!';

  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (existingAdmin) {
    console.log('✅ Admin exists:', existingAdmin.telegramUsername);
    return;
  }

  const existingUser = await prisma.user.findUnique({ where: { telegramUsername: adminUsername } });
  if (existingUser) {
    await prisma.user.update({ where: { id: existingUser.id }, data: { role: 'admin' } });
    console.log('✅ User upgraded to admin:', adminUsername);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: { telegramUsername: adminUsername, password: hashedPassword, role: 'admin', status: 'active' }
  });
  console.log('✅ Admin created:', adminUsername);
}

seedAdmin().catch(console.error).finally(() => prisma.\$disconnect());
"
echo "DIAG entrypoint: seed-admin DONE ts=$(date -Iseconds)"

echo "✅ Database ready"

# Start the application
echo "🎯 Starting NestJS server..."
echo "DIAG entrypoint: exec app cmd: $*"
exec "$@"
