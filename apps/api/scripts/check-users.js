const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking all users...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      telegramUsername: true,
      role: true,
      status: true,
      created_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  console.log(`Found ${users.length} user(s):\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email || user.telegramUsername || 'N/A'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Created: ${user.created_at}`);
    console.log('');
  });

  // Проверяем, есть ли уже админы в admin_users
  const adminUsers = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      created_at: true,
    },
  });

  console.log(`\nFound ${adminUsers.length} admin user(s) in admin_users table:\n`);
  adminUsers.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.email}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Created: ${admin.created_at}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

