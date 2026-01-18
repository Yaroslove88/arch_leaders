/**
 * Создание админа через прямой SQL (без Prisma Client)
 * Использование: node scripts/create-admin-direct-sql.js yaroslav SecurePass2025!
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function createAdmin(telegramUsername, password) {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL не установлен');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Подключен к БД');

    // Проверяем существует ли таблица users
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Таблица users не существует. Нужно применить миграции Prisma.');
      console.log('💡 Выполни: cd /app/apps/api && ./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma');
      process.exit(1);
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Проверяем существует ли пользователь
    const existing = await client.query(
      'SELECT id, role FROM users WHERE "telegramUsername" = $1',
      [telegramUsername]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      if (user.role === 'admin') {
        console.log('⚠️  Пользователь уже существует и имеет админские права');
        console.log(`   ID: ${user.id}`);
        console.log(`   Telegram: ${telegramUsername}`);
        console.log(`   Роль: admin`);
        
        // Обновляем пароль
        await client.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [hashedPassword, user.id]
        );
        console.log('✅ Пароль обновлен');
      } else {
        // Обновляем до админа
        await client.query(
          'UPDATE users SET role = $1, password = $2 WHERE id = $3',
          ['admin', hashedPassword, user.id]
        );
        console.log('✅ Пользователь обновлен до админа');
        console.log(`   ID: ${user.id}`);
        console.log(`   Telegram: ${telegramUsername}`);
      }
    } else {
      // Создаем нового админа
      const result = await client.query(
        `INSERT INTO users ("telegramUsername", password, role, status, "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, "telegramUsername", role`,
        [telegramUsername, hashedPassword, 'admin', 'active']
      );

      const admin = result.rows[0];
      console.log('✅ Админская учетка успешно создана!');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Telegram: ${admin.telegramUsername}`);
      console.log(`   Роль: ${admin.role}`);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.code === '42P01') {
      console.error('   Таблица не существует. Примени миграции Prisma.');
    }
    throw error;
  } finally {
    await client.end();
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('❌ Использование: node scripts/create-admin-direct-sql.js <telegramUsername> <password>');
  process.exit(1);
}

createAdmin(args[0], args[1])
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
