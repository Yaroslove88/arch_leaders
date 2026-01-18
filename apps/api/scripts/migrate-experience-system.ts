/**
 * Скрипт миграции для системы опыта
 * Мигрирует существующие данные пользователя (admin) в новую систему:
 * - Текущий progress становится internal_progress
 * - Отображаемый progress = min(1.0, internal_progress)
 * - Выдает ачивки, если internal_progress > 2.0 (200%)
 * - Устанавливает last_activity_date на текущую дату
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExperienceSystem() {
  console.log('🚀 Starting experience system migration...');

  try {
    // Находим пользователя admin
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'admin',
      },
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`📋 Found admin user: ${adminUser.id}`);

    // Получаем все состояния узлов для admin
    const userStates = await prisma.userAbilityState.findMany({
      where: {
        user_id: adminUser.id,
      },
    });

    console.log(`📊 Found ${userStates.length} node states to migrate`);

    let migrated = 0;
    let achievementsAwarded = 0;

    for (const state of userStates) {
      const currentProgress = Number(state.progress);
      const currentInternalProgress = state.internal_progress
        ? Number(state.internal_progress)
        : currentProgress; // Если internal_progress уже есть, используем его

      // Если internal_progress еще не установлен, используем progress
      const newInternalProgress =
        state.internal_progress == null ? currentProgress : currentInternalProgress;

      // Отображаемый прогресс = min(1.0, internal_progress)
      const newDisplayedProgress = Math.min(1.0, newInternalProgress);

      // Обновляем состояние
      await prisma.userAbilityState.update({
        where: {
          user_id_node_id: {
            user_id: adminUser.id,
            node_id: state.node_id,
          },
        },
        data: {
          progress: newDisplayedProgress,
          internal_progress: newInternalProgress,
          stored_experience: state.stored_experience || 0,
          last_activity_date: state.last_activity_date || new Date(),
        },
      });

      migrated++;

      // Проверяем и выдаем ачивки, если internal_progress >= 200%
      if (newInternalProgress >= 2.0) {
        const achievementThresholds = [2.0, 3.0, 5.0, 10.0]; // bronze, silver, gold, platinum
        const achievementTypes = ['bronze', 'silver', 'gold', 'platinum'] as const;

        for (let i = 0; i < achievementThresholds.length; i++) {
          if (newInternalProgress >= achievementThresholds[i]) {
            const achievementId = `achievement_${state.node_id}_${achievementTypes[i]}`;

            // Проверяем, есть ли уже эта ачивка
            const existing = await prisma.userAchievement.findUnique({
              where: {
                user_id_achievement_id: {
                  user_id: adminUser.id,
                  achievement_id: achievementId,
                },
              },
            });

            if (!existing) {
              // Создаем ачивку, если её еще нет
              await prisma.achievement.upsert({
                where: { id: achievementId },
                update: {},
                create: {
                  id: achievementId,
                  type: achievementTypes[i],
                  scope: 'node',
                  node_id: state.node_id,
                  title: `${achievementTypes[i]} achievement: ${state.node_id}`,
                  description: `Достигнут внутренний прогресс ${achievementThresholds[i] * 100}% по узлу ${state.node_id}`,
                  threshold: achievementThresholds[i],
                },
              });

              // Выдаем ачивку пользователю
              await prisma.userAchievement.create({
                data: {
                  user_id: adminUser.id,
                  achievement_id: achievementId,
                  node_id: state.node_id,
                  unlocked_at: new Date(),
                },
              });

              achievementsAwarded++;
              console.log(
                `  ✅ Awarded ${achievementTypes[i]} achievement for node ${state.node_id} (${(newInternalProgress * 100).toFixed(1)}%)`,
              );
            }
          }
        }
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   - Migrated ${migrated} node states`);
    console.log(`   - Awarded ${achievementsAwarded} achievements`);
    console.log(`\n🎉 Experience system migration successful!`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateExperienceSystem()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
