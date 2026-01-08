import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const role = process.argv[4] || 'super_admin';

  console.log(`Creating admin user: ${email} with role: ${role}`);

  // Проверяем, существует ли уже админ с таким email
  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin user with email ${email} already exists. Updating...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.adminUser.update({
      where: { email },
      data: {
        password: hashedPassword,
        role,
      },
    });
    console.log('Admin user updated:', updated);
    return;
  }

  // Хэшируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  // Создаем админа
  const admin = await prisma.adminUser.create({
    data: {
      email,
      password: hashedPassword,
      role,
    },
  });

  console.log('Admin user created:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

