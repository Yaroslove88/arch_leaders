/**
 * Создание админа при первом запуске
 * Вызывается из main.ts после применения миграций
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'yaroslav';
  const adminPassword = process.env.ADMIN_PASSWORD || 'LeaderArch2025!';

  try {
    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      console.log(`✅ Admin already exists: @${existingAdmin.telegramUsername}`);
      return;
    }

    // Проверяем, есть ли пользователь с таким username
    const existingUser = await prisma.user.findUnique({
      where: { telegramUsername: adminUsername },
    });

    if (existingUser) {
      // Обновляем до админа
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'admin' },
      });
      console.log(`✅ User @${adminUsername} upgraded to admin`);
      return;
    }

    // Создаём нового админа
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        telegramUsername: adminUsername,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
      },
    });

    console.log(`✅ Admin created: @${admin.telegramUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Change password after first login!`);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}
