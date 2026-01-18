import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding existing admin users...');

  // Ищем пользователей с ролью admin
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'admin',
    },
    select: {
      id: true,
      email: true,
      telegramUsername: true,
      password: true, // Нужен для копирования
      role: true,
    },
  });

  if (adminUsers.length === 0) {
    console.log('No admin users found in the users table.');
    console.log('Please create an admin user first or specify which user should be admin.');
    return;
  }

  console.log(`Found ${adminUsers.length} admin user(s):`);
  adminUsers.forEach((user: any, index: number) => {
    console.log(`${index + 1}. ${user.email || user.telegramUsername} (ID: ${user.id})`);
  });

  // Создаем записи в admin_users для каждого найденного админа
  for (const user of adminUsers) {
    // Проверяем, существует ли уже запись в admin_users
    const existingAdmin = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: user.email || undefined },
          // Можно также проверить по telegramUsername, если email нет
        ],
      },
    });

    if (existingAdmin) {
      console.log(`\nAdmin user with email ${user.email || user.telegramUsername} already exists in admin_users. Skipping...`);
      continue;
    }

    // Создаем email, если его нет (используем telegramUsername)
    const email = user.email || `${user.telegramUsername}@admin.local`;

    // Создаем запись в admin_users
    // Используем тот же пароль, что и у пользователя
    const adminUser = await prisma.adminUser.create({
      data: {
        email: email,
        password: user.password, // Копируем хэш пароля
        role: 'super_admin', // Делаем super_admin
      },
    });

    console.log(`\n✅ Created admin user in admin_users:`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   (Original user ID: ${user.id})`);
  }

  console.log('\n✅ Migration complete!');
  console.log('\nYou can now login to admin panel using:');
  adminUsers.forEach((user: any) => {
    const email = user.email || `${user.telegramUsername}@admin.local`;
    console.log(`   Email: ${email}`);
    console.log(`   (Use the same password as before)`);
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

