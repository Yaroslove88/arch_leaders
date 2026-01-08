const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Получаем telegramUsername и пароль из аргументов командной строки
  const telegramUsername = process.argv[2];
  const password = process.argv[3];

  if (!telegramUsername || !password) {
    console.log('Usage: node migrate-existing-admin.js <telegramUsername> <password>');
    console.log('Example: node migrate-existing-admin.js admin admin123');
    console.log('\nNote: Email will be created as <telegramUsername>@admin.local');
    process.exit(1);
  }

  // Создаем email из telegramUsername
  const username = telegramUsername.replace('@', '');
  const email = `${username}@admin.local`;

  console.log(`Creating admin user: ${telegramUsername} (${email}) with role: super_admin`);

  // Проверяем, существует ли уже запись в admin_users
  const existingAdmin = await prisma.adminUser.findFirst({
    where: {
      email: email,
    },
  });

  if (existingAdmin) {
    console.log(`\nAdmin user with email ${email} already exists. Updating role to super_admin...`);
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: { 
        role: 'super_admin',
        password: hashedPassword,
      },
    });
    console.log(`✅ Updated admin user: ${email} -> super_admin`);
    return;
  }

  // Хэшируем пароль
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаем запись в admin_users
  const adminUser = await prisma.adminUser.create({
    data: {
      email: email,
      password: hashedPassword,
      role: 'super_admin',
    },
  });

  console.log(`\n✅ Created admin user in admin_users:`);
  console.log(`   ID: ${adminUser.id}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Role: ${adminUser.role}`);
  console.log(`\n✅ Migration complete!`);
  console.log(`\nYou can now login to admin panel using:`);
  console.log(`   Telegram Username: ${telegramUsername}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

