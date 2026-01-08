const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const telegramUsername = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const role = process.argv[4] || 'admin';

  console.log(`Creating user: ${telegramUsername} with role: ${role}`);

  // Проверяем, существует ли уже пользователь
  const existing = await prisma.user.findUnique({
    where: { telegramUsername },
  });

  if (existing) {
    console.log(`User with telegramUsername ${telegramUsername} already exists. Updating...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { telegramUsername },
      data: {
        password: hashedPassword,
        role,
      },
    });
    console.log('User updated:', {
      id: updated.id,
      telegramUsername: updated.telegramUsername,
      role: updated.role,
    });
    return;
  }

  // Хэшируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаем пользователя
  const user = await prisma.user.create({
    data: {
      telegramUsername,
      password: hashedPassword,
      role,
      status: 'active',
    },
  });

  console.log('User created:', {
    id: user.id,
    telegramUsername: user.telegramUsername,
    role: user.role,
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

