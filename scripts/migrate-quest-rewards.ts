/**
 * Скрипт миграции существующих reward_json к новой системе
 * Конвертирует старые значения (xp, skill_xp) в новые (base_xp, reflection_xp)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Маппинг старых значений в новые согласно PRD
 */
const migrationMap: Record<string, { base_xp: number; reflection_xp: number; max: number }> = {
  // micro: xp: 100, skill_xp: 50 -> base_xp: 20, reflection_xp: 80, max: 100
  'micro_100_50': { base_xp: 20, reflection_xp: 80, max: 100 },
  // weekly: xp: 200, skill_xp: 100 -> base_xp: 40, reflection_xp: 160, max: 200
  'weekly_200_100': { base_xp: 40, reflection_xp: 160, max: 200 },
  // story: xp: 300, skill_xp: 150 -> base_xp: 60, reflection_xp: 240, max: 300
  'story_300_150': { base_xp: 60, reflection_xp: 240, max: 300 },
  // in-person: xp: 500, skill_xp: 250 -> base_xp: 100, reflection_xp: 400, max: 500
  'in-person_500_250': { base_xp: 100, reflection_xp: 400, max: 500 },
};

/**
 * Определить тип квеста и получить новые значения
 */
function getNewRewardValues(
  questType: string,
  oldXp?: number,
  oldSkillXp?: number,
): { base_xp: number; reflection_xp: number; max: number } | null {
  // Если уже есть новые поля, не мигрируем
  // Определяем тип на основе старых значений или типа квеста
  if (questType === 'micro' || (oldXp === 100 && oldSkillXp === 50)) {
    return migrationMap['micro_100_50'];
  }
  if (questType === 'weekly' || (oldXp === 200 && oldSkillXp === 100)) {
    return migrationMap['weekly_200_100'];
  }
  if (questType === 'story' || (oldXp === 300 && oldSkillXp === 150)) {
    return migrationMap['story_300_150'];
  }
  if (questType === 'in-person' || (oldXp === 500 && oldSkillXp === 250)) {
    return migrationMap['in-person_500_250'];
  }

  // Если тип не определен, используем micro как дефолт
  if (oldXp && oldSkillXp) {
    return migrationMap['micro_100_50'];
  }

  return null;
}

/**
 * Мигрировать все квесты
 */
async function migrateQuestRewards() {
  console.log('🚀 Начало миграции reward_json...\n');

  try {
    // Получаем все квесты с reward_json
    const quests = await prisma.quest.findMany({
      where: {
        reward_json: {
          not: null,
        },
      },
      select: {
        id: true,
        type: true,
        reward_json: true,
      },
    });

    console.log(`📊 Найдено ${quests.length} квестов с reward_json\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const quest of quests) {
      try {
        const reward = quest.reward_json as any;

        // Проверяем, нужно ли мигрировать (если есть base_xp и reflection_xp, пропускаем)
        if (reward && (reward.base_xp !== undefined || reward.reflection_xp !== undefined)) {
          console.log(`⏭️  Квест ${quest.id} уже использует новую систему, пропускаем`);
          skipped++;
          continue;
        }

        // Получаем старые значения
        const oldXp = reward?.xp;
        const oldSkillXp = reward?.skill_xp;

        // Определяем новые значения
        const newValues = getNewRewardValues(quest.type, oldXp, oldSkillXp);

        if (!newValues) {
          console.log(`⚠️  Квест ${quest.id}: не удалось определить тип, пропускаем`);
          skipped++;
          continue;
        }

        // Обновляем reward_json (сохраняем старые поля для обратной совместимости)
        const newReward = {
          ...reward, // Сохраняем другие поля (artifact и т.д.)
          // Новые поля
          base_xp: newValues.base_xp,
          reflection_xp: newValues.reflection_xp,
          max: newValues.max,
          // Старые поля для обратной совместимости (deprecated)
          xp: newValues.max,
          skill_xp: newValues.reflection_xp,
        };

        // Обновляем в базе данных
        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            reward_json: newReward as any,
          },
        });

        console.log(
          `✅ Квест ${quest.id} (${quest.type}): ${oldXp}/${oldSkillXp} -> ${newValues.base_xp}/${newValues.reflection_xp} (max: ${newValues.max})`,
        );
        migrated++;
      } catch (error: any) {
        console.error(`❌ Ошибка при миграции квеста ${quest.id}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n📈 Результаты миграции:');
    console.log(`   ✅ Мигрировано: ${migrated}`);
    console.log(`   ⏭️  Пропущено: ${skipped}`);
    console.log(`   ❌ Ошибок: ${errors}`);
    console.log(`   📊 Всего: ${quests.length}\n`);

    console.log('✅ Миграция завершена!');
  } catch (error: any) {
    console.error('❌ Критическая ошибка при миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск миграции
if (require.main === module) {
  migrateQuestRewards()
    .then(() => {
      console.log('\n🎉 Миграция успешно завершена!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ошибка при миграции:', error);
      process.exit(1);
    });
}

export { migrateQuestRewards };
