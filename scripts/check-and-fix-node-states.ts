/**
 * Проверить и исправить состояния узлов
 * Узлы с XP должны быть 'available' или выше, а не 'locked'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

async function checkAndFix() {
  console.log('🔍 Checking node states...\n');

  const states = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });

  console.log(`📊 Found ${states.length} UserAbilityState records\n`);

  let fixed = 0;
  for (const state of states) {
    const internalProgress = Number(state.internal_progress);
    const currentState = state.state;

    // Если у узла есть XP, но он все еще locked - исправляем
    if (internalProgress > 0 && currentState === 'locked') {
      // Определяем правильное состояние на основе прогресса
      const displayedProgress = Math.min(1.0, internalProgress);
      let newState: string;

      if (displayedProgress >= 1.0) {
        newState = 'integrated';
      } else if (displayedProgress >= 0.7) {
        newState = 'unlocked';
      } else if (displayedProgress >= 0.3) {
        newState = 'active';
      } else {
        newState = 'available'; // Минимум для узлов с XP
      }

      console.log(`  🔧 Fixing ${state.node_id}:`);
      console.log(`     Current: ${currentState}, XP: ${internalProgress}`);
      console.log(`     New: ${newState}`);

      await prisma.userAbilityState.update({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: state.node_id,
          },
        },
        data: {
          state: newState,
        },
      });

      fixed++;
    } else {
      console.log(`  ✅ ${state.node_id}: ${currentState} (XP: ${internalProgress})`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} node states`);

  // Показываем итоговую статистику
  const finalStates = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });

  const activeCount = finalStates.filter(
    (s) => s.state === 'active' || s.state === 'available' || s.state === 'unlocked' || s.state === 'integrated'
  ).length;

  console.log(`\n📊 Final stats:`);
  console.log(`   Total nodes: ${finalStates.length}`);
  console.log(`   Active nodes: ${activeCount}`);
  console.log(`   Locked nodes: ${finalStates.length - activeCount}`);

  await prisma.$disconnect();
}

checkAndFix().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
