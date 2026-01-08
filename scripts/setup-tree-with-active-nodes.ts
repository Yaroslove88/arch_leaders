/**
 * Полная настройка дерева с активированными узлами для билдов
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function setupTreeWithActiveNodes() {
  try {
    console.log('🚀 Настройка дерева с активированными узлами...\n');

    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
    });

    if (!user) {
      console.error('❌ Пользователь не найден!');
      return;
    }

    // Загружаем seed файл
    const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
    const seedTreeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

    // Удаляем все существующие деревья для пользователя
    const deleted = await prisma.treeSemantic.deleteMany({
      where: { userId: user.id },
    });
    console.log(`🗑️  Удалено старых деревьев: ${deleted.count}\n`);

    // Активируем узлы перед сохранением
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

    for (const node of seedTreeData.nodes) {
      // Базовые узлы -> unlocked
      if (basicNodesToUnlock.includes(node.node_id)) {
        node.state = 'unlocked';
        node.xp_current = 100;
        node.integration_level = 'Novice';
        unlocked++;
        continue;
      }

      // Узлы с прогрессом
      const progressNode = nodesToUnlockWithXp[node.node_id];
      if (progressNode) {
        const requiredXp = node.xp_required || 100;
        const progressPercent = (progressNode.xp / requiredXp) * 100;

        if (progressPercent >= 50) {
          node.state = 'unlocked';
          node.xp_current = progressNode.xp;
        } else {
          node.state = 'active';
          node.xp_current = progressNode.xp;
        }
        activated++;
        continue;
      }

      // Остальные узлы остаются locked
      if (!node.state) {
        node.state = 'locked';
      }
    }

    // Создаем новое дерево
    const tree = await prisma.treeSemantic.create({
      data: {
        userId: user.id,
        semantic_version: seedTreeData.semantic_version || '1.0.0',
        tree_revision: seedTreeData.tree_revision || 1,
        data: seedTreeData,
      },
    });

    console.log(`✅ Дерево создано:`);
    console.log(`   - Веток: ${seedTreeData.branches.length}`);
    console.log(`   - Узлов: ${seedTreeData.nodes.length}`);
    console.log(`   - Разблокировано: ${unlocked}`);
    console.log(`   - Активировано: ${activated}\n`);

    // Проверяем финальное состояние
    const finalTree = tree.data as any;
    const stats = {
      locked: 0,
      available: 0,
      active: 0,
      unlocked: 0,
      integrated: 0,
    };

    for (const node of finalTree.nodes) {
      stats[node.state] = (stats[node.state] || 0) + 1;
    }

    console.log(`📊 Финальное состояние:`);
    console.log(`   - Заблокировано: ${stats.locked}`);
    console.log(`   - Доступно: ${stats.available}`);
    console.log(`   - Активно: ${stats.active}`);
    console.log(`   - Разблокировано: ${stats.unlocked}`);
    console.log(`   - Интегрировано: ${stats.integrated}`);
    
    const activeForBuilds = stats.active + stats.unlocked + stats.integrated;
    console.log(`\n🎯 Активных для билдов: ${activeForBuilds}/${finalTree.nodes.length}`);

    // Показываем примеры активных узлов
    const activeNodes = finalTree.nodes.filter((n: any) => 
      n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
    ).slice(0, 10);

    if (activeNodes.length > 0) {
      console.log(`\n📋 Примеры активных узлов:`);
      activeNodes.forEach((node: any) => {
        const progress = node.xp_required > 0 
          ? `${Math.round((node.xp_current || 0) / node.xp_required * 100)}%`
          : '100%';
        console.log(`   • ${node.name} (${node.state}, ${progress})`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTreeWithActiveNodes()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

