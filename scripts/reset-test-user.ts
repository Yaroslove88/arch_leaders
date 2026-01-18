/**
 * Скрипт для полного сброса данных пользователя testuser
 * 
 * Удаляет все данные пользователя, оставляя только самого пользователя
 * После сброса при следующем логине произойдет автоматическая инициализация
 * 
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/reset-test-user.ts [username]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTestUser(username: string) {
  console.log(`🧹 Resetting user "${username}" to initial state...\n`);

  // 1. Найти пользователя
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { telegramUsername: username },
      ],
    },
  });

  if (!user) {
    console.log(`❌ User "${username}" not found!`);
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found user: ${user.telegramUsername || user.email} (ID: ${user.id})\n`);

  // 2. Удаляем все связанные данные
  console.log('🗑️  Deleting user data...\n');

  const deletions = [
    { name: 'UserAbilityState', count: await prisma.userAbilityState.deleteMany({ where: { user_id: user.id } }) },
    { name: 'TreeSemantic', count: await prisma.treeSemantic.deleteMany({ 
      where: { 
        OR: [
          { userId: user.id },
          { id: `tree_user_${user.id}` }
        ]
      } 
    }) },
    { name: 'Quests', count: await prisma.quest.deleteMany({ where: { userId: user.id } }) },
    { name: 'CaseProgress', count: await prisma.caseProgress.deleteMany({ where: { user_id: user.id } }) },
    { name: 'Entries', count: await prisma.entry.deleteMany({ where: { userId: user.id } }) },
    { name: 'Sessions', count: await prisma.session.deleteMany({ where: { userId: user.id } }) },
    { name: 'Evidence', count: await prisma.evidence.deleteMany({ where: { userId: user.id } }) },
    { name: 'ChangeLog', count: await prisma.changeLog.deleteMany({ where: { userId: user.id } }) },
    { name: 'UserRetention', count: await prisma.userRetention.deleteMany({ where: { user_id: user.id } }) },
    { name: 'UserAchievements', count: await prisma.userAchievement.deleteMany({ where: { user_id: user.id } }) },
  ];

  for (const deletion of deletions) {
    console.log(`   ✅ ${deletion.name}: ${deletion.count.count} records deleted`);
  }

  console.log('\n✨ User reset complete!');
  console.log(`\n📋 What to expect on next login:`);
  console.log('   - Redirect to /introduce (onboarding page)');
  console.log('   - All tier-1 (basic) nodes will be unlocked automatically');
  console.log('   - Base quests will be available (not created, just accessible)');
  console.log('   - Progress: 0%');
  console.log('\n🚀 Login as this user to test the initialization flow!');

  await prisma.$disconnect();
}

// Get username from command line or use default
const username = process.argv[2] || 'testuser';

resetTestUser(username).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
