#!/usr/bin/env ts-node

/**
 * Скрипт для обновления seed файла: удаление контента, оставление только структуры
 * 
 * ВАЖНО: Этот скрипт обновляет seed файл, удаляя из него контент (name, description)
 * и пользовательские данные (state, xp_current), оставляя только структуру.
 * 
 * Использование:
 * npx ts-node scripts/update-seed-structure-only.ts
 * 
 * ⚠️ ВНИМАНИЕ: Этот скрипт изменяет seed файл. Создайте резервную копию перед запуском!
 */

import * as fs from 'fs';
import * as path from 'path';

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

/**
 * Извлекает только структуру из узла (удаляет контент и пользовательские данные)
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
    // НЕ включаем: name, description (контент)
    // НЕ включаем: state, xp_current (пользовательские данные)
    // НЕ включаем: integration_level, development_type (контент)
  };
}

/**
 * Извлекает только структуру из ветки (удаляет контент)
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
    // НЕ включаем: name, description (контент)
  };
}

/**
 * Извлекает структуру из дерева
 */
function extractStructure(tree: SemanticTree): SemanticTree {
  return {
    tree_id: tree.tree_id,
    semantic_version: tree.semantic_version || '1.0.0',
    seed_version: tree.seed_version,
    tree_revision: tree.tree_revision || 1,
    branches: tree.branches.map(extractBranchStructure) as AbilityBranch[],
    nodes: tree.nodes.map(extractNodeStructure) as AbilityNode[],
    edges: tree.edges || [],
  };
}

async function updateSeedStructureOnly() {
  console.log('🔧 Обновление seed файла: удаление контента, оставление только структуры\n');

  try {
    // Определяем путь к seed файлу
    const seedPath = path.join(
      __dirname,
      '../packages/shared/src/seed/initial-ability-tree.json',
    );

    if (!fs.existsSync(seedPath)) {
      console.error(`❌ Seed файл не найден: ${seedPath}`);
      process.exit(1);
    }

    // Создаем резервную копию
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `initial-ability-tree-backup-${Date.now()}.json`);
    fs.copyFileSync(seedPath, backupPath);
    console.log(`✅ Резервная копия создана: ${backupPath}\n`);

    // Читаем текущий seed файл
    console.log('📖 Чтение seed файла...');
    const content = fs.readFileSync(seedPath, 'utf-8');
    const seedData: SemanticTree = JSON.parse(content);

    console.log(`📊 Найдено: ${seedData.nodes?.length || 0} узлов, ${seedData.branches?.length || 0} веток`);

    // Извлекаем только структуру
    console.log('\n🔍 Извлечение структуры...');
    const structureOnly = extractStructure(seedData);

    // Проверяем результат
    console.log(`✅ Извлечено: ${structureOnly.nodes.length} узлов, ${structureOnly.branches.length} веток`);

    // Проверяем исходный файл на наличие контента
    const originalHasContent = seedData.nodes.some(
      (node: any) => node.name || node.description || node.state || node.xp_current,
    );
    
    // Проверяем, что структура не содержит контент (поля должны быть удалены)
    const structureHasContent = structureOnly.nodes.some(
      (node: any) => (node as any).name || (node as any).description || (node as any).state || (node as any).xp_current,
    );
    
    if (originalHasContent) {
      console.log(`   📝 В исходном файле найдены поля контента/пользовательских данных`);
    }
    
    if (structureHasContent) {
      console.warn('⚠️  ВНИМАНИЕ: В структуре все еще есть контент или пользовательские данные!');
    } else {
      console.log('✅ Структура очищена от контента и пользовательских данных');
    }

    // Сохраняем структуру в файл для проверки
    const structurePath = path.join(backupDir, 'initial-ability-tree-structure-only.json');
    fs.writeFileSync(structurePath, JSON.stringify(structureOnly, null, 2), 'utf-8');
    console.log(`✅ Структура сохранена для проверки: ${structurePath}`);

    // Проверяем, что структура валидна
    console.log('\n🔍 Проверка валидности структуры...');
    for (const node of structureOnly.nodes) {
      if (!node.node_id || !node.branch_id || !node.tier) {
        console.error(`❌ Невалидный узел: ${node.node_id || 'unknown'}`);
        process.exit(1);
      }
    }
    console.log('✅ Структура валидна');

    // Обновляем seed файл только структурой
    console.log('\n📝 Обновление seed файла...');
    fs.writeFileSync(seedPath, JSON.stringify(structureOnly, null, 2), 'utf-8');
    console.log(`✅ Seed файл обновлен: ${seedPath}`);

    console.log('\n✅ Обновление завершено успешно!');
    console.log('\n📋 Итоги:');
    console.log(`   - Узлов: ${structureOnly.nodes.length}`);
    console.log(`   - Веток: ${structureOnly.branches.length}`);
    console.log(`   - Резервная копия: ${backupPath}`);
    console.log(`   - Структура для проверки: ${structurePath}`);
    console.log(
      '\n⚠️  ВНИМАНИЕ: Контент теперь должен быть в node-descriptions.json, а не в seed файле!',
    );
  } catch (error: any) {
    console.error('❌ Ошибка при обновлении seed файла:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск скрипта
updateSeedStructureOnly()
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });
