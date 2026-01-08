/**
 * Унифицированный скрипт для исправления дерева способностей
 * Заменяет: fix-tree.ts, fix-tree-directly.ts, check-and-fix-tree.ts
 * 
 * Использование:
 *   ts-node scripts/tree-fix.ts [--mode=check|fix|activate]
 * 
 * Режимы:
 *   check - только проверка структуры дерева
 *   fix - исправление/создание дерева из seed
 *   activate - исправление с активацией узлов (по умолчанию)
 */

import { PrismaClient } from '@prisma/client';
import { TreeUtils } from './tree-utils';

const prisma = new PrismaClient();

const MODES = ['check', 'fix', 'activate'] as const;
type Mode = typeof MODES[number];

async function main() {
  const mode: Mode = (process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] as Mode) || 'activate';
  
  if (!MODES.includes(mode)) {
    console.error(`❌ Неверный режим: ${mode}. Доступны: ${MODES.join(', ')}`);
    process.exit(1);
  }

  const utils = new TreeUtils(prisma);

  try {
    console.log(`🚀 Режим: ${mode}\n`);

    // Находим пользователя
    const user = await utils.findUser('admin');
    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      process.exit(1);
    }

    // Получаем дерево
    let tree = await utils.getTree(user.id);
    let treeData: any = null;

    if (tree) {
      treeData = typeof tree.data === 'string' ? JSON.parse(tree.data) : tree.data;
      console.log('📊 Текущее дерево:');
      const info = utils.getTreeInfo(treeData);
      console.log(`   - Узлов: ${info.nodes}`);
      console.log(`   - Веток: ${info.branches}`);
      console.log(`   - Связей: ${info.edges}`);
      console.log(`   - Версия: ${info.version}`);
      console.log(`   - Ревизия: ${info.revision}`);
    } else {
      console.log('⚠️  Дерево не найдено');
    }

    // Проверка структуры
    if (mode === 'check') {
      if (!treeData) {
        console.error('❌ Дерево не найдено для проверки!');
        process.exit(1);
      }

      const validation = utils.validateTree(treeData);
      if (validation.valid) {
        console.log('\n✅ Структура дерева валидна');
        const stats = utils.getTreeStats(treeData);
        console.log('\n📊 Статистика узлов:');
        console.log(`   - Заблокировано: ${stats.locked}`);
        console.log(`   - Доступно: ${stats.available}`);
        console.log(`   - Активно: ${stats.active}`);
        console.log(`   - Разблокировано: ${stats.unlocked}`);
        console.log(`   - Интегрировано: ${stats.integrated}`);
      } else {
        console.error('\n❌ Ошибки в структуре дерева:');
        validation.errors.forEach(err => console.error(`   - ${err}`));
        process.exit(1);
      }
      return;
    }

    // Загружаем seed данные если нужно
    if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
      console.log('📥 Загрузка дерева из seed файла...');
      treeData = utils.loadSeedTree();
    }

    // Активация узлов (если режим activate)
    if (mode === 'activate') {
      console.log('\n🔄 Активация узлов...');

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

      const { unlocked, activated } = utils.activateNodes(
        treeData,
        basicNodesToUnlock,
        nodesToUnlockWithXp,
      );

      console.log(`   - Разблокировано: ${unlocked}`);
      console.log(`   - Активировано: ${activated}`);
    }

    // Сохранение
    if (tree) {
      console.log('\n💾 Обновление дерева...');
      await utils.updateTree(user.id, treeData, true);
      console.log('✅ Дерево обновлено');
    } else {
      console.log('\n💾 Создание нового дерева...');
      await utils.createTree(user.id, treeData);
      console.log('✅ Дерево создано');
    }

    // Финальная статистика
    const finalStats = utils.getTreeStats(treeData);
    const activeForBuilds = finalStats.active + finalStats.unlocked + finalStats.integrated;
    console.log('\n📊 Финальная статистика:');
    console.log(`   - Всего узлов: ${treeData.nodes?.length || 0}`);
    console.log(`   - Активных для билдов: ${activeForBuilds}`);
    console.log(`   - Разблокировано: ${finalStats.unlocked}`);
    console.log(`   - Активировано: ${finalStats.active}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

