const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking quests...\n');

  // Получаем всех пользователей
  const users = await prisma.user.findMany({
    select: {
      id: true,
      telegramUsername: true,
      role: true,
    },
  });

  console.log(`Found ${users.length} user(s):\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. @${user.telegramUsername} (${user.role}) - ID: ${user.id}`);
  });

  // Получаем все квесты
  const allQuests = await prisma.quest.findMany({
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log(`\nFound ${allQuests.length} quest(s) total:\n`);
  allQuests.forEach((quest, index) => {
    const user = users.find(u => u.id === quest.userId);
    console.log(`${index + 1}. "${quest.title}"`);
    console.log(`   Status: ${quest.status}`);
    console.log(`   User: ${user ? `@${user.telegramUsername}` : quest.userId}`);
    console.log(`   Created: ${quest.created_at}`);
    console.log('');
  });

  // Проверяем квесты для админа
  const adminUser = users.find(u => u.role === 'admin' || u.telegramUsername === 'admin');
  if (adminUser) {
    const adminQuests = allQuests.filter(q => q.userId === adminUser.id);
    console.log(`\nQuests for admin (@${adminUser.telegramUsername}): ${adminQuests.length}`);
    adminQuests.forEach((quest, index) => {
      console.log(`  ${index + 1}. "${quest.title}" (${quest.status})`);
    });
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

