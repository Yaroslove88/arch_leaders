#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationResult() {
  try {
    const tree = await prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!tree || !tree.data) {
      console.log('❌ TreeSemantic.data не найдено');
      return;
    }

    const data = tree.data as any;
    const firstNode = data?.nodes?.[0];

    if (!firstNode) {
      console.log('❌ Узлы не найдены');
      return;
    }

    console.log('✅ Проверка первого узла после миграции:');
    console.log(JSON.stringify({
      node_id: firstNode.node_id,
      branch_id: firstNode.branch_id,
      tier: firstNode.tier,
      has_name: !!firstNode.name,
      has_description: !!firstNode.description,
      has_state: !!firstNode.state,
      has_xp_current: !!firstNode.xp_current,
      xp_required: firstNode.xp_required,
      prerequisites: firstNode.prerequisites,
    }, null, 2));

    // Проверяем, что нет полей контента
    const hasContentFields = !!(firstNode.name || firstNode.description);
    const hasUserFields = !!(firstNode.state || firstNode.xp_current);

    if (hasContentFields || hasUserFields) {
      console.log('\n❌ ОШИБКА: В узле найдены поля контента или пользовательских данных!');
      if (hasContentFields) {
        console.log('   - Найдены поля контента: name, description');
      }
      if (hasUserFields) {
        console.log('   - Найдены поля пользовательских данных: state, xp_current');
      }
    } else {
      console.log('\n✅ УСПЕХ: Узел содержит только структуру!');
      console.log('   - Нет полей контента (name, description)');
      console.log('   - Нет полей пользовательских данных (state, xp_current)');
    }

    // Проверяем все узлы
    const nodesWithContent = data.nodes.filter((n: any) => n.name || n.description);
    const nodesWithUserData = data.nodes.filter((n: any) => n.state || n.xp_current);

    console.log('\n📊 Статистика по всем узлам:');
    console.log(`   - Всего узлов: ${data.nodes.length}`);
    console.log(`   - Узлов с контентом: ${nodesWithContent.length}`);
    console.log(`   - Узлов с пользовательскими данными: ${nodesWithUserData.length}`);

    if (nodesWithContent.length === 0 && nodesWithUserData.length === 0) {
      console.log('\n✅ ВСЕ УЗЛЫ КОРРЕКТНЫ: Миграция успешна!');
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: Некоторые узлы содержат контент или пользовательские данные!');
    }

  } catch (error: any) {
    console.error('❌ Ошибка при проверке:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationResult();
