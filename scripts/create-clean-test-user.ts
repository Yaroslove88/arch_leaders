/**
 * Скрипт создания чистого тестового пользователя
 * 
 * Создает пользователя БЕЗ:
 * - TreeSemantic (будет создан при первом GET /tree/semantic из seed)
 * - UserAbilityState (все узлы будут locked с XP=0)
 * - Quests, CaseProgress, и т.д.
 * 
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/create-clean-test-user.ts [username]
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createCleanTestUser(username: string) {
  console.log('🧹 Creating clean test user...\n');

  // 1. Проверить что пользователь не существует
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { telegramUsername: username },
      ],
    },
  });

  if (existing) {
    console.log(`⚠️  User "${username}" already exists with ID: ${existing.id}`);
    console.log('   Cleaning up existing data...\n');

    // Удаляем связанные данные
    await prisma.userAbilityState.deleteMany({ where: { user_id: existing.id } });
    await prisma.treeSemantic.deleteMany({ where: { userId: existing.id } });
    await prisma.quest.deleteMany({ where: { userId: existing.id } });
    await prisma.caseProgress.deleteMany({ where: { user_id: existing.id } });
    await prisma.changeLog.deleteMany({ where: { userId: existing.id } });
    await prisma.userRetention.deleteMany({ where: { user_id: existing.id } });

    console.log('   ✅ Cleaned up existing data\n');

    console.log(`\n🎉 User "${username}" is now clean!`);
    console.log(`   ID: ${existing.id}`);
    console.log('\n📋 What to expect:');
    console.log('   - All nodes: locked, XP=0');
    console.log('   - All styles: inactive');
    console.log('   - Progress: 0%');
    console.log('\n🚀 Login and complete a quest to see XP appear!');

    await prisma.$disconnect();
    return;
  }

  // 2. Создать нового пользователя
  // Хэшируем пароль (по умолчанию "test123")
  const defaultPassword = 'test123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: username,
      telegramUsername: username,
      password: hashedPassword,
      role: 'user',
    },
  });

  console.log(`✅ Created new user:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${username}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${defaultPassword} (default)`);

  console.log('\n📋 What to expect:');
  console.log('   - TreeSemantic: will be created from seed on first /tree/semantic request');
  console.log('   - All nodes: locked, XP=0');
  console.log('   - All styles: inactive');
  console.log('   - Progress: 0%');

  console.log('\n🚀 Login as this user and complete a quest to test the XP flow!');

  await prisma.$disconnect();
}

// Get username from command line or use default
const username = process.argv[2] || 'testuser';

createCleanTestUser(username).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
