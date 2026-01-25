#!/usr/bin/env ts-node
/**
 * Скрипт для полного удаления всех in-person квестов и их контента
 * Удаляет:
 * - Все квесты типа 'in-person'
 * - Все связанные Evidence (контент квестов)
 * 
 * ВАЖНО: Это необратимая операция! Контентная часть квестов будет полностью удалена.
 * 
 * Использование:
 *   npm run script:delete-in-person-quests
 *   или
 *   ts-node src/scripts/delete-all-in-person-quests.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllInPersonQuests() {
  console.log('🔍 Поиск всех in-person квестов...');

  // Находим все in-person квесты
  const inPersonQuests = await prisma.quest.findMany({
    where: {
      type: 'in-person',
    },
    select: {
      id: true,
      title: true,
      userId: true,
    },
  });

  console.log(`📊 Найдено ${inPersonQuests.length} in-person квестов`);

  if (inPersonQuests.length === 0) {
    console.log('✅ Нет in-person квестов для удаления');
    await prisma.$disconnect();
    return;
  }

  const questIds = inPersonQuests.map((q) => q.id);

  // Показываем список квестов перед удалением
  console.log('\n📋 Квесты для удаления:');
  inPersonQuests.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.id}] ${q.title.substring(0, 50)}... (user: ${q.userId})`);
  });

  // Удаляем связанные Evidence (контент квестов)
  console.log('\n🗑️  Удаление связанных Evidence...');
  const deletedEvidence = await prisma.evidence.deleteMany({
    where: {
      quest_id: {
        in: questIds,
      },
    },
  });
  console.log(`✅ Удалено ${deletedEvidence.count} записей Evidence`);

  // Удаляем сами квесты
  console.log('\n🗑️  Удаление in-person квестов...');
  const deleted = await prisma.quest.deleteMany({
    where: {
      type: 'in-person',
    },
  });

  console.log(`\n✅ Успешно удалено:`);
  console.log(`   - ${deleted.count} in-person квестов`);
  console.log(`   - ${deletedEvidence.count} записей Evidence`);
  console.log(`\n🎉 Контентная часть квестов полностью удалена из системы`);

  await prisma.$disconnect();
}

// Запуск скрипта
deleteAllInPersonQuests()
  .catch((error) => {
    console.error('❌ Ошибка при удалении квестов:', error);
    process.exit(1);
  });
