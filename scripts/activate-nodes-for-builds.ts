/**
 * Скрипт для активации узлов для системы билдов
 * Меняет статус узлов с 'available' на 'unlocked' или 'active'
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateNodesForBuilds() {
  try {
    console.log('🚀 Активация узлов для системы билдов...\n');

    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: { treeSemantic: true },
    });

    if (!user || !user.treeSemantic) {
      console.error('❌ Дерево не найдено!');
      return;
    }

    const tree = user.treeSemantic.data as any;
    if (!tree || !tree.nodes) {
      console.error('❌ Дерево пустое!');
      return;
    }

    console.log(`📊 Текущее состояние:`);
    const stats = {
      locked: 0,
      available: 0,
      active: 0,
      unlocked: 0,
      integrated: 0,
    };

    for (const node of tree.nodes) {
      stats[node.state] = (stats[node.state] || 0) + 1;
    }

    console.log(`   - Заблокировано: ${stats.locked}`);
    console.log(`   - Доступно: ${stats.available}`);
    console.log(`   - Активно: ${stats.active}`);
    console.log(`   - Разблокировано: ${stats.unlocked}`);
    console.log(`   - Интегрировано: ${stats.integrated}\n`);

    // Активируем узлы для билдов
    // Базовые узлы делаем 'unlocked'
    const basicNodesToUnlock = [
      'node_grounding_point',
      'node_architecture_coupling',
      'node_personal_resilience',
      'node_responsibility_as_form',
      'node_feedback_types',
      'node_maturity_environment',
    ];

    // Узлы с прогрессом делаем 'unlocked' если XP >= 50% от required
    // Или 'active' если XP > 0 но < 50%
    const nodesWithProgress = [
      { id: 'node_self_regulation', minXp: 50 },
      { id: 'node_system_thinking', minXp: 80 },
      { id: 'node_containment', minXp: 30 },
      { id: 'node_scenario_thinking', minXp: 100 },
      { id: 'node_form_assembly', minXp: 120 },
      { id: 'node_scenario_analysis', minXp: 90 },
      { id: 'node_decision_authorship', minXp: 110 },
      { id: 'node_delegation_as_coupling', minXp: 70 },
    ];

    let activated = 0;
    let unlocked = 0;
    let madeActive = 0;

    for (const node of tree.nodes) {
      // Базовые узлы -> unlocked
      if (basicNodesToUnlock.includes(node.node_id)) {
        if (node.state === 'available' || node.state === 'locked') {
          node.state = 'unlocked';
          node.xp_current = node.xp_current || 0;
          unlocked++;
          activated++;
        }
        continue;
      }

      // Узлы с прогрессом
      const progressNode = nodesWithProgress.find(n => n.id === node.node_id);
      if (progressNode) {
        const currentXp = node.xp_current || 0;
        const requiredXp = node.xp_required || 100;
        const progressPercent = requiredXp > 0 ? (currentXp / requiredXp) * 100 : 0;

        if (progressPercent >= 50) {
          // Если прогресс >= 50%, делаем unlocked
          if (node.state !== 'unlocked' && node.state !== 'integrated') {
            node.state = 'unlocked';
            unlocked++;
            activated++;
          }
        } else if (currentXp > 0) {
          // Если есть прогресс, но < 50%, делаем active
          if (node.state === 'available' || node.state === 'locked') {
            node.state = 'active';
            madeActive++;
            activated++;
          }
        }
        continue;
      }

      // Если узел уже unlocked/integrated, оставляем как есть
      if (node.state === 'unlocked' || node.state === 'integrated') {
        continue;
      }

      // Если у узла есть XP, но статус locked/available, делаем active
      if ((node.xp_current || 0) > 0 && (node.state === 'locked' || node.state === 'available')) {
        node.state = 'active';
        madeActive++;
        activated++;
      }
    }

    // Сохраняем обновленное дерево
    await prisma.treeSemantic.update({
      where: { userId: user.id },
      data: {
        data: tree,
        tree_revision: (user.treeSemantic.tree_revision || 0) + 1,
      },
    });

    console.log(`✅ Активировано узлов: ${activated}`);
    console.log(`   - Разблокировано (unlocked): ${unlocked}`);
    console.log(`   - Сделано активными (active): ${madeActive}\n`);

    // Проверяем финальное состояние
    const finalStats = {
      locked: 0,
      available: 0,
      active: 0,
      unlocked: 0,
      integrated: 0,
    };

    for (const node of tree.nodes) {
      finalStats[node.state] = (finalStats[node.state] || 0) + 1;
    }

    console.log(`📊 Финальное состояние:`);
    console.log(`   - Заблокировано: ${finalStats.locked}`);
    console.log(`   - Доступно: ${finalStats.available}`);
    console.log(`   - Активно: ${finalStats.active}`);
    console.log(`   - Разблокировано: ${finalStats.unlocked}`);
    console.log(`   - Интегрировано: ${finalStats.integrated}`);
    
    const activeForBuilds = finalStats.active + finalStats.unlocked + finalStats.integrated;
    console.log(`\n🎯 Активных для билдов: ${activeForBuilds}/${tree.nodes.length}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

activateNodesForBuilds()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
