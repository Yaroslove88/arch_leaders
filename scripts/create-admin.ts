/**
 * Скрипт для создания админской учетки
 * 
 * Использование:
 *   pnpm tsx scripts/create-admin.ts <telegramUsername> <password>
 * 
 * Пример:
 *   pnpm tsx scripts/create-admin.ts admin mySecurePassword123
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin(telegramUsername: string, password: string) {
  try {
    console.log(`Создание админской учетки для пользователя: ${telegramUsername}`);

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { telegramUsername },
    });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('⚠️  Пользователь уже существует и имеет админские права');
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Telegram: ${existingUser.telegramUsername}`);
        console.log(`   Роль: ${existingUser.role}`);
        
        // Предлагаем обновить пароль
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          readline.question('Обновить пароль? (y/n): ', resolve);
        });
        readline.close();

        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { password: hashedPassword },
          });
          
          console.log('✅ Пароль обновлен');
        } else {
          console.log('Отменено');
        }
        return;
      } else {
        // Обновляем роль на admin
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'admin',
            password: hashedPassword,
          },
        });
        
        console.log('✅ Пользователь обновлен до админа');
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Telegram: ${existingUser.telegramUsername}`);
        console.log(`   Роль: admin`);
        return;
      }
    }

    // Создаем нового админа
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const admin = await prisma.user.create({
      data: {
        telegramUsername,
        password: hashedPassword,
        role: 'admin',
      },
    });

    console.log('✅ Админская учетка успешно создана!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Telegram: ${admin.telegramUsername}`);
    console.log(`   Роль: ${admin.role}`);
    console.log(`   Создано: ${admin.created_at}`);
  } catch (error) {
    console.error('❌ Ошибка при создании админской учетки:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Необходимо указать telegramUsername и password');
  console.log('');
  console.log('Использование:');
  console.log('  pnpm tsx scripts/create-admin.ts <telegramUsername> <password>');
  console.log('');
  console.log('Пример:');
  console.log('  pnpm tsx scripts/create-admin.ts admin mySecurePassword123');
  process.exit(1);
}

const [telegramUsername, password] = args;

if (password.length < 8) {
  console.error('❌ Пароль должен содержать минимум 8 символов');
  process.exit(1);
}

createAdmin(telegramUsername, password)
  .then(() => {
    console.log('');
    console.log('Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });

