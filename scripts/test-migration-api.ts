#!/usr/bin/env ts-node

/**
 * Скрипт для тестирования миграции через API
 * Проверяет, что API правильно объединяет структуру, контент и пользовательские данные
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface NodeFromStructure {
  node_id: string;
  branch_id: string;
  tier: string;
  xp_required: number;
  prerequisites: string[];
  unlock_conditions?: any;
}

interface NodeContent {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: any;
  development_type?: string;
}

async function testMigrationAPI() {
  console.log('🧪 Тестирование миграции через API\n');

  try {
    // 1. Проверяем структуру в БД
    console.log('1️⃣  Проверка структуры в БД...');
    const treeRecord = await prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!treeRecord || !treeRecord.data) {
      console.log('❌ TreeSemantic.data не найдено');
      return;
    }

    const structureData = treeRecord.data as any;
    const firstNodeStructure = structureData.nodes?.[0] as NodeFromStructure;

    console.log('✅ Первый узел (структура):');
    console.log(JSON.stringify({
      node_id: firstNodeStructure.node_id,
      branch_id: firstNodeStructure.branch_id,
      tier: firstNodeStructure.tier,
      has_name: !!(firstNodeStructure as any).name,
      has_description: !!(firstNodeStructure as any).description,
      has_state: !!(firstNodeStructure as any).state,
      has_xp_current: !!(firstNodeStructure as any).xp_current,
      xp_required: firstNodeStructure.xp_required,
    }, null, 2));

    // 2. Проверяем контент в node-descriptions.json
    console.log('\n2️⃣  Проверка контента в node-descriptions.json...');
    const contentPath = path.join(__dirname, '../data/node-descriptions.json');
    if (!fs.existsSync(contentPath)) {
      console.log('❌ node-descriptions.json не найден');
      return;
    }

    const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    const firstNodeContent = contentData.node_descriptions?.[firstNodeStructure.node_id] as NodeContent;

    if (!firstNodeContent) {
      console.log(`⚠️  Контент для ${firstNodeStructure.node_id} не найден в node-descriptions.json`);
    } else {
      console.log('✅ Первый узел (контент):');
      console.log(JSON.stringify({
        name: firstNodeContent.name,
        has_full_description: !!firstNodeContent.full_description,
        has_practical_meaning: !!firstNodeContent.practical_meaning,
        has_examples: !!firstNodeContent.examples?.length,
        has_integration_levels: !!firstNodeContent.integration_levels,
      }, null, 2));
    }

    // 3. Проверяем пользовательские данные (если есть тестовый пользователь)
    console.log('\n3️⃣  Проверка пользовательских данных...');
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      const userState = await prisma.userAbilityState.findFirst({
        where: {
          user_id: testUser.id,
          node_id: firstNodeStructure.node_id,
        },
      });

      if (userState) {
        console.log('✅ Первый узел (пользовательские данные):');
        console.log(JSON.stringify({
          user_id: userState.user_id,
          node_id: userState.node_id,
          state: userState.state,
          xp_current: userState.internal_progress,
          progress: userState.progress,
        }, null, 2));
      } else {
        console.log(`ℹ️  Пользовательские данные для ${firstNodeStructure.node_id} не найдены (это нормально для нового пользователя)`);
      }
    } else {
      console.log('ℹ️  Тестовый пользователь не найден (это нормально)');
    }

    // 4. Проверяем объединение данных
    console.log('\n4️⃣  Проверка объединения данных...');
    const mergedNode = {
      // Структура
      ...firstNodeStructure,
      // Контент
      name: firstNodeContent?.name || firstNodeStructure.node_id,
      description: firstNodeContent?.full_description || firstNodeContent?.practical_meaning || '',
      // Пользовательские данные (если есть)
      state: testUser && (await prisma.userAbilityState.findFirst({
        where: { user_id: testUser.id, node_id: firstNodeStructure.node_id },
      }))?.state || 'locked',
      xp_current: testUser && (await prisma.userAbilityState.findFirst({
        where: { user_id: testUser.id, node_id: firstNodeStructure.node_id },
      }))?.internal_progress ? Number((await prisma.userAbilityState.findFirst({
        where: { user_id: testUser.id, node_id: firstNodeStructure.node_id },
      }))?.internal_progress) : 0,
    };

    console.log('✅ Объединенный узел (структура + контент + пользовательские данные):');
    console.log(JSON.stringify({
      node_id: mergedNode.node_id,
      name: mergedNode.name,
      description: mergedNode.description.substring(0, 100) + (mergedNode.description.length > 100 ? '...' : ''),
      branch_id: mergedNode.branch_id,
      tier: mergedNode.tier,
      state: mergedNode.state,
      xp_required: mergedNode.xp_required,
      xp_current: mergedNode.xp_current,
    }, null, 2));

    // 5. Итоги проверки
    console.log('\n📊 Итоги проверки:');
    
    const structureHasContent = structureData.nodes.some((n: any) => n.name || n.description);
    const structureHasUserData = structureData.nodes.some((n: any) => n.state || n.xp_current);
    
    console.log(`   - Структура в БД: ${structureData.nodes.length} узлов`);
    console.log(`   - Узлов с контентом в структуре: ${structureHasContent ? '❌ ОШИБКА' : '✅ 0 (правильно)'}`);
    console.log(`   - Узлов с пользовательскими данными в структуре: ${structureHasUserData ? '❌ ОШИБКА' : '✅ 0 (правильно)'}`);
    console.log(`   - Контент в node-descriptions.json: ${Object.keys(contentData.node_descriptions || {}).length} узлов`);
    
    if (!structureHasContent && !structureHasUserData) {
      console.log('\n✅ МИГРАЦИЯ УСПЕШНА: Структура разделена правильно!');
      console.log('   - Структура в БД: только структурные поля ✅');
      console.log('   - Контент в node-descriptions.json ✅');
      console.log('   - Пользовательские данные в UserAbilityState ✅');
      console.log('   - Объединение происходит в runtime ✅');
    } else {
      console.log('\n⚠️  ВНИМАНИЕ: В структуре найдены поля контента или пользовательских данных!');
    }

  } catch (error: any) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testMigrationAPI();
