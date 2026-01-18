#!/usr/bin/env ts-node

/**
 * Скрипт для миграции: разделение структуры, контента и пользовательских данных
 * 
 * Процесс:
 * 1. Извлекает структуру из TreeSemantic.data (удаляет контент и пользовательские данные)
 * 2. Мигрирует контент в node-descriptions.json (если его там нет)
 * 3. Обновляет TreeSemantic.data только структурой
 * 4. Пользовательские данные остаются в UserAbilityState (не затрагиваются)
 * 
 * ВАЖНО: Этот скрипт создает резервные копии перед изменениями
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface AbilityNode {
  node_id: string;
  name?: string;
  description?: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  state?: string;
  unlock_conditions?: any;
  integration_level?: string;
  development_type?: string;
  xp_required?: number;
  xp_current?: number;
  prerequisites?: string[];
  [key: string]: any;
}

interface AbilityBranch {
  branch_id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  [key: string]: any;
}

interface SemanticTree {
  tree_id: string;
  semantic_version?: string;
  seed_version?: number;
  tree_revision?: number;
  branches: AbilityBranch[];
  nodes: AbilityNode[];
  edges?: any[];
}

interface NodeDescription {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  development_type?: string;
  situation_guidance?: string;
  reflection_prompts?: string[];
  [key: string]: any;
}

interface NodeDescriptionsData {
  node_descriptions: Record<string, NodeDescription>;
}

/**
 * Извлекает только структуру из узла
 */
function extractNodeStructure(node: AbilityNode): {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  unlock_conditions?: any;
  xp_required: number;
  prerequisites: string[];
} {
  return {
    node_id: node.node_id,
    branch_id: node.branch_id,
    tier: node.tier,
    unlock_conditions: node.unlock_conditions,
    xp_required: node.xp_required || 0,
    prerequisites: node.prerequisites || [],
  };
}

/**
 * Извлекает контент из узла
 */
function extractNodeContent(node: AbilityNode): NodeDescription | null {
  if (!node.name && !node.description) {
    return null; // Нет контента для миграции
  }

  const content: NodeDescription = {
    name: node.name || node.node_id,
  };

  if (node.description) {
    content.full_description = node.description;
  }

  if (node.integration_level) {
    content.integration_levels = {
      Novice: node.integration_level,
    };
  }

  if (node.development_type) {
    content.development_type = node.development_type;
  }

  return content;
}

/**
 * Извлекает структуру из ветки
 */
function extractBranchStructure(branch: AbilityBranch): {
  branch_id: string;
  color: string;
  icon: string;
} {
  return {
    branch_id: branch.branch_id,
    color: branch.color || '#4A90E2',
    icon: branch.icon || 'circle',
  };
}

async function migrateTreeSeparation() {
  console.log('🚀 Начало миграции: разделение структуры, контента и пользовательских данных\n');

  try {
    // 1. Читаем текущее дерево из БД
    console.log('1️⃣  Чтение TreeSemantic.data из БД...');
    const treeRecord = await prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!treeRecord) {
      console.log('❌ TreeSemantic.data не найдено в БД. Используйте seed файл для инициализации.');
      return;
    }

    const currentTree = treeRecord.data as unknown as SemanticTree;
    console.log(`   ✅ Найдено: ${currentTree.nodes?.length || 0} узлов, ${currentTree.branches?.length || 0} веток`);

    // 2. Создаем резервную копию
    console.log('\n2️⃣  Создание резервной копии...');
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `tree-semantic-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(currentTree, null, 2), 'utf-8');
    console.log(`   ✅ Резервная копия: ${backupPath}`);

    // 3. Извлекаем структуру
    console.log('\n3️⃣  Извлечение структуры из узлов и веток...');
    const structureOnly: SemanticTree = {
      tree_id: currentTree.tree_id,
      semantic_version: currentTree.semantic_version || '1.0.0',
      seed_version: currentTree.seed_version,
      tree_revision: currentTree.tree_revision || 1,
      branches: currentTree.branches.map(extractBranchStructure) as AbilityBranch[],
      nodes: currentTree.nodes.map(extractNodeStructure) as AbilityNode[],
      edges: currentTree.edges || [],
    };
    console.log(`   ✅ Извлечено: ${structureOnly.nodes.length} узлов, ${structureOnly.branches.length} веток`);

    // 4. Мигрируем контент в node-descriptions.json
    console.log('\n4️⃣  Миграция контента в node-descriptions.json...');
    const nodeDescPath = path.join(__dirname, '../../data/node-descriptions.json');
    
    // Создаем резервную копию node-descriptions.json
    if (fs.existsSync(nodeDescPath)) {
      const nodeDescBackup = path.join(backupDir, `node-descriptions-backup-${Date.now()}.json`);
      fs.copyFileSync(nodeDescPath, nodeDescBackup);
      console.log(`   ✅ Резервная копия node-descriptions.json: ${nodeDescBackup}`);
    }

    // Читаем существующий node-descriptions.json
    let nodeDescriptions: NodeDescriptionsData = { node_descriptions: {} };
    if (fs.existsSync(nodeDescPath)) {
      const existingContent = fs.readFileSync(nodeDescPath, 'utf-8');
      nodeDescriptions = JSON.parse(existingContent);
    }

    let migratedContent = 0;
    let skippedContent = 0;

    // Мигрируем контент из каждого узла
    for (const node of currentTree.nodes) {
      const nodeContent = extractNodeContent(node);
      if (!nodeContent) {
        skippedContent++;
        continue;
      }

      // Если контент уже есть в node-descriptions.json, пропускаем (не перезаписываем)
      if (nodeDescriptions.node_descriptions[node.node_id]) {
        skippedContent++;
        continue;
      }

      // Добавляем контент в node-descriptions.json
      nodeDescriptions.node_descriptions[node.node_id] = nodeContent;
      migratedContent++;
    }

    // Сохраняем обновленный node-descriptions.json
    fs.writeFileSync(nodeDescPath, JSON.stringify(nodeDescriptions, null, 2), 'utf-8');
    console.log(`   ✅ Мигрировано контента: ${migratedContent} узлов`);
    console.log(`   ⏭️  Пропущено (уже есть): ${skippedContent} узлов`);

    // 5. Обновляем TreeSemantic.data только структурой
    console.log('\n5️⃣  Обновление TreeSemantic.data только структурой...');
    console.log('   ⚠️  ВНИМАНИЕ: Это перезапишет TreeSemantic.data только структурой.');
    console.log('   Пользовательские данные сохраняются в UserAbilityState (не затрагиваются).');

    // Сохраняем структуру в файл для проверки
    const structurePath = path.join(backupDir, 'tree-structure-only-migrated.json');
    fs.writeFileSync(structurePath, JSON.stringify(structureOnly, null, 2), 'utf-8');
    console.log(`   ✅ Структура сохранена для проверки: ${structurePath}`);

    // Проверяем флаг --apply для применения изменений
    const shouldApply = process.argv.includes('--apply');

    if (!shouldApply) {
      console.log('\n⚠️  ВНИМАНИЕ: Изменения НЕ применены к БД автоматически.');
      console.log('   Проверьте файлы в папке backups/, затем запустите с флагом --apply:');
      console.log('   npx ts-node scripts/migrate-tree-separation.ts --apply');
    } else {
      console.log('\n6️⃣  Применение изменений к БД (транзакция)...');

      try {
        await prisma.$transaction(async (tx) => {
          // Обновляем глобальное дерево
          await tx.treeSemantic.update({
            where: { id: 'tree_main' },
            data: {
              data: structureOnly as any,
            },
          });
          console.log('   ✅ TreeSemantic (tree_main) обновлен');

          // Также обновляем все пользовательские деревья (если нужно)
          // Пока пропускаем - пользовательские деревья можно обновить отдельно
        });

        console.log('   ✅ Транзакция успешно завершена');
      } catch (txError: any) {
        console.error('   ❌ Ошибка транзакции:', txError.message);
        console.log('   Все изменения откачены. БД осталась без изменений.');
        throw txError;
      }
    }

    console.log('\n✅ Миграция завершена успешно!');
    console.log('\n📋 Итоги:');
    console.log(`   - Структура: ${structureOnly.nodes.length} узлов`);
    console.log(`   - Контент мигрирован: ${migratedContent} узлов`);
    console.log(`   - Контент пропущен: ${skippedContent} узлов`);
    console.log(`   - Резервные копии: ${backupDir}`);

    return {
      structure: structureOnly,
      migratedContent,
      skippedContent,
      backupPath,
    };
  } catch (error: any) {
    console.error('❌ Ошибка при миграции:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Запуск миграции
migrateTreeSeparation()
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
