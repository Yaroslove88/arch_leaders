/**
 * @deprecated Используйте scripts/tree-fix.ts --mode=check или --mode=fix вместо этого
 * Скрипт для проверки и исправления дерева способностей
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function checkAndFixTree() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: { treeSemantic: true },
    });

    if (!user || !user.treeSemantic) {
      console.error('❌ Дерево не найдено!');
      return;
    }

    // Prisma может возвращать JSON как строку или объект
    let tree = user.treeSemantic.data;
    if (typeof tree === 'string') {
      tree = JSON.parse(tree);
    }
    tree = tree as any;
    
    console.log('📊 Проверка дерева:');
    console.log('   - Тип данных:', typeof user.treeSemantic.data);
    console.log('   - Ключи:', Object.keys(tree || {}));
    console.log('   - Есть nodes:', !!tree?.nodes);
    console.log('   - Количество nodes:', tree?.nodes?.length || 0);
    
    if (tree?.nodes && tree.nodes.length > 0) {
      console.log('   - Первый узел:', JSON.stringify(tree.nodes[0], null, 2).substring(0, 300));
      
      // Обновляем узлы
      console.log('\n🔄 Обновление узлов...');
      const basicNodesToUnlock = [
        'node_grounding_point',
        'node_architecture_coupling',
        'node_personal_resilience',
        'node_responsibility_as_form',
        'node_feedback_types',
        'node_maturity_environment',
      ];

      const nodesWithProgress = [
        { id: 'node_self_regulation', xp: 50, state: 'available' },
        { id: 'node_system_thinking', xp: 80, state: 'available' },
        { id: 'node_containment', xp: 30, state: 'available' },
      ];

      const unlockedNodes = [
        { id: 'node_grounding_point', xp: 100, state: 'unlocked' },
        { id: 'node_architecture_coupling', xp: 100, state: 'unlocked' },
      ];

      let basicUnlocked = 0;
      let progressUpdated = 0;
      let fullyUnlocked = 0;

      for (const node of tree.nodes) {
        const unlockedNode = unlockedNodes.find(n => n.id === node.node_id);
        if (unlockedNode) {
          node.state = unlockedNode.state;
          node.xp_current = unlockedNode.xp;
          node.integration_level = 'Novice';
          fullyUnlocked++;
          continue;
        }

        const progressNode = nodesWithProgress.find(n => n.id === node.node_id);
        if (progressNode) {
          node.state = progressNode.state;
          node.xp_current = progressNode.xp;
          progressUpdated++;
          continue;
        }

        if (basicNodesToUnlock.includes(node.node_id)) {
          node.state = 'available';
          node.xp_current = 0;
          basicUnlocked++;
        }
      }

      await prisma.treeSemantic.update({
        where: { userId: user.id },
        data: {
          data: tree as any,
          tree_revision: (user.treeSemantic.tree_revision || 0) + 1,
        },
      });

      console.log(`✅ Обновлено узлов: ${basicUnlocked + progressUpdated + fullyUnlocked}`);
      console.log(`   - Разблокировано базовых: ${basicUnlocked}`);
      console.log(`   - С прогрессом: ${progressUpdated}`);
      console.log(`   - Полностью разблокировано: ${fullyUnlocked}`);
    } else {
      console.log('❌ Дерево пустое! Нужно загрузить из seed файла.');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixTree()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

