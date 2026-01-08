/**
 * @deprecated Используйте scripts/tree-fix.ts --mode=activate вместо этого
 * Прямое исправление дерева через update
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fixTreeDirectly() {
  try {
    console.log('🚀 Прямое исправление дерева...\n');

    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
    });

    if (!user) {
      console.error('❌ Пользователь не найден!');
      return;
    }

    // Пробуем найти дерево по userId или по дефолтному ID
    let tree = await prisma.treeSemantic.findFirst({
      where: { userId: user.id },
    });

    // Если не нашли по userId, пробуем найти по дефолтному ID
    if (!tree) {
      tree = await prisma.treeSemantic.findUnique({
        where: { id: 'tree_main' },
      });
    }

    console.log(`📊 Найдено деревьев: ${tree ? 1 : 0}`);

    if (!tree) {
      console.log('❌ Дерево не найдено! Создаем новое...');
      // Создаем новое дерево
      const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
      const seedTreeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

      // Активируем узлы
      const basicNodesToUnlock = [
        'node_grounding_point',
        'node_architecture_coupling',
        'node_personal_resilience',
        'node_responsibility_as_form',
        'node_feedback_types',
        'node_maturity_environment',
      ];

      const nodesToUnlockWithXp: Record<string, { xp: number }> = {
        'node_self_regulation': { xp: 50 },
        'node_system_thinking': { xp: 150 },
        'node_containment': { xp: 80 },
        'node_scenario_thinking': { xp: 100 },
        'node_form_assembly': { xp: 120 },
        'node_scenario_analysis': { xp: 90 },
        'node_decision_authorship': { xp: 110 },
        'node_delegation_as_coupling': { xp: 70 },
      };

      for (const node of seedTreeData.nodes) {
        if (basicNodesToUnlock.includes(node.node_id)) {
          node.state = 'unlocked';
          node.xp_current = 100;
          node.integration_level = 'Novice';
        } else {
          const progressNode = nodesToUnlockWithXp[node.node_id];
          if (progressNode) {
            const requiredXp = node.xp_required || 100;
            const progressPercent = (progressNode.xp / requiredXp) * 100;
            if (progressPercent >= 50) {
              node.state = 'unlocked';
            } else {
              node.state = 'active';
            }
            node.xp_current = progressNode.xp;
          }
        }
      }

      // Создаем дерево с явным ID
      await prisma.treeSemantic.create({
        data: {
          id: `tree_${user.id}`,
          userId: user.id,
          semantic_version: seedTreeData.semantic_version || '1.0.0',
          tree_revision: seedTreeData.tree_revision || 1,
          data: seedTreeData,
        },
      });

      console.log('✅ Дерево создано');
      return; // Выходим, так как дерево создано
    }

    // Обновляем существующее дерево
    if (tree) {
      console.log(`📝 Обновление дерева ID: ${tree.id}`);

      let treeData = tree.data as any;
      
      // Если дерево пустое, загружаем из seed
      if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
        console.log('⚠️  Дерево пустое, загружаем из seed...');
        const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
        treeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      }

      // Активируем узлы
      const basicNodesToUnlock = [
        'node_grounding_point',
        'node_architecture_coupling',
        'node_personal_resilience',
        'node_responsibility_as_form',
        'node_feedback_types',
        'node_maturity_environment',
      ];

      const nodesToUnlockWithXp: Record<string, { xp: number }> = {
        'node_self_regulation': { xp: 50 },
        'node_system_thinking': { xp: 150 },
        'node_containment': { xp: 80 },
        'node_scenario_thinking': { xp: 100 },
        'node_form_assembly': { xp: 120 },
        'node_scenario_analysis': { xp: 90 },
        'node_decision_authorship': { xp: 110 },
        'node_delegation_as_coupling': { xp: 70 },
      };

      let unlocked = 0;
      let activated = 0;

      for (const node of treeData.nodes) {
        if (basicNodesToUnlock.includes(node.node_id)) {
          node.state = 'unlocked';
          node.xp_current = 100;
          node.integration_level = 'Novice';
          unlocked++;
        } else {
          const progressNode = nodesToUnlockWithXp[node.node_id];
          if (progressNode) {
            const requiredXp = node.xp_required || 100;
            const progressPercent = (progressNode.xp / requiredXp) * 100;
            if (progressPercent >= 50) {
              node.state = 'unlocked';
              unlocked++;
            } else {
              node.state = 'active';
              activated++;
            }
            node.xp_current = progressNode.xp;
          }
        }
      }

      await prisma.treeSemantic.update({
        where: { id: tree.id },
        data: {
          semantic_version: treeData.semantic_version || '1.0.0',
          tree_revision: (tree.tree_revision || 0) + 1,
          data: treeData,
        },
      });

      console.log(`✅ Дерево обновлено:`);
      console.log(`   - Разблокировано: ${unlocked}`);
      console.log(`   - Активировано: ${activated}`);

      // Проверяем финальное состояние
      const stats = {
        locked: 0,
        available: 0,
        active: 0,
        unlocked: 0,
        integrated: 0,
      };

      for (const node of treeData.nodes) {
        stats[node.state] = (stats[node.state] || 0) + 1;
      }

      const activeForBuilds = stats.active + stats.unlocked + stats.integrated;
      console.log(`\n🎯 Активных для билдов: ${activeForBuilds}/${treeData.nodes.length}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTreeDirectly()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

