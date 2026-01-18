#!/bin/sh
set -e

echo "🚀 Starting Leadership Architect API..."
echo "DIAG entrypoint: ts=$(date -Iseconds) node=$(node -v 2>/dev/null || echo 'unknown')"
if [ -n "${DATABASE_URL}" ]; then
  # Не логируем сам DATABASE_URL (секрет), только факт наличия и префикс.
  echo "DIAG entrypoint: DATABASE_URL is set (prefix=$(printf '%s' "$DATABASE_URL" | cut -c1-12))"
else
  echo "DIAG entrypoint: DATABASE_URL is MISSING"
fi

# Apply database migrations
echo "📦 Applying database migrations..."
echo "DIAG entrypoint: migrate deploy START ts=$(date -Iseconds)"
npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "DIAG entrypoint: migrate deploy DONE ts=$(date -Iseconds)"

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
