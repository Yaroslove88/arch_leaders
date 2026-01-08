/**
 * Скрипт для проверки заполненности профиля пользователя
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: {
        quests: true,
        entries: true,
        treeSemantic: true,
      },
    });

    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      return;
    }

    console.log('📊 Статистика профиля пользователя:');
    console.log(`   - Пользователь: ${user.telegramUsername} (${user.id})`);
    console.log(`   - Роль: ${user.role}`);
    console.log(`   - Квесты: ${user.quests.length}`);
    console.log(`   - Записи: ${user.entries.length}`);
    
    if (user.treeSemantic) {
      const tree = user.treeSemantic.data as any;
      console.log(`   - Дерево способностей:`);
      console.log(`     * Версия: ${user.treeSemantic.semantic_version || 'не указана'}`);
      console.log(`     * Ревизия: ${user.treeSemantic.tree_revision || 'не указана'}`);
      console.log(`     * Структура данных:`, JSON.stringify(Object.keys(tree || {})).substring(0, 100));
      if (tree) {
        console.log(`     * Веток: ${tree.branches?.length || 0}`);
        console.log(`     * Узлов: ${tree.nodes?.length || 0}`);
        console.log(`     * Связей: ${tree.edges?.length || 0}`);
      }
    } else {
      console.log(`   - Дерево способностей: не создано`);
    }

    console.log('\n📋 Квесты:');
    user.quests.forEach((quest, index) => {
      console.log(`   ${index + 1}. ${quest.title} (${quest.type}, ${quest.status})`);
    });

    console.log('\n📝 Записи:');
    user.entries.slice(0, 5).forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.type}: ${entry.text.substring(0, 60)}...`);
    });
    if (user.entries.length > 5) {
      console.log(`   ... и еще ${user.entries.length - 5} записей`);
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUserProfile()
  .then(() => {
    console.log('\n✅ Проверка завершена');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

