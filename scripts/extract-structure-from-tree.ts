#!/usr/bin/env ts-node

/**
 * Скрипт для извлечения структуры из TreeSemantic.data
 * Удаляет контент (name, description) и пользовательские данные (state, xp_current)
 * Оставляет только структуру (node_id, branch_id, tier, prerequisites, unlock_conditions, xp_required)
 * 
 * ВАЖНО: Этот скрипт читает данные из БД и создает резервную копию перед изменениями
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

/**
 * Извлекает только структуру из узла (удаляет контент и пользовательские данные)
 */
function extractNodeStructure(node: AbilityNode): Partial<AbilityNode> {
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
function extractBranchStructure(branch: AbilityBranch): Partial<AbilityBranch> {
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

async function extractStructureFromTree() {
  console.log('🔍 Извлечение структуры из TreeSemantic.data...\n');

  try {
    // Читаем текущее дерево из БД
    const treeRecord = await prisma.treeSemantic.findUnique({
      where: { id: 'tree_main' },
    });

    if (!treeRecord) {
      console.log('❌ TreeSemantic.data не найдено в БД. Используйте seed файл для инициализации.');
      return;
    }

    const currentTree = treeRecord.data as unknown as SemanticTree;
    console.log(`📊 Найдено дерево: ${currentTree.nodes?.length || 0} узлов, ${currentTree.branches?.length || 0} веток`);

    // Создаем резервную копию
    const backupPath = path.join(
      __dirname,
      `../../backups/tree-semantic-backup-${Date.now()}.json`,
    );
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(backupPath, JSON.stringify(currentTree, null, 2), 'utf-8');
    console.log(`✅ Резервная копия создана: ${backupPath}\n`);

    // Извлекаем только структуру
    const structureOnly = extractStructure(currentTree);

    // Проверяем результат
    console.log('📋 Результат извлечения структуры:');
    console.log(`  Узлов: ${structureOnly.nodes.length}`);
    console.log(`  Веток: ${structureOnly.branches.length}`);
    console.log('\nПример узла (только структура):');
    if (structureOnly.nodes.length > 0) {
      console.log(JSON.stringify(structureOnly.nodes[0], null, 2));
    }
    console.log('\nПример ветки (только структура):');
    if (structureOnly.branches.length > 0) {
      console.log(JSON.stringify(structureOnly.branches[0], null, 2));
    }

    // Сохраняем структуру в файл для проверки
    const structurePath = path.join(
      __dirname,
      '../../backups/tree-structure-only.json',
    );
    fs.writeFileSync(structurePath, JSON.stringify(structureOnly, null, 2), 'utf-8');
    console.log(`\n✅ Структура сохранена в файл для проверки: ${structurePath}`);
    console.log('\n⚠️  ВНИМАНИЕ: Изменения НЕ применены к БД автоматически.');
    console.log('   После проверки файла используйте скрипт для обновления БД.');

    return structureOnly;
  } catch (error: any) {
    console.error('❌ Ошибка при извлечении структуры:', error.message);
    throw error;
  }
}

extractStructureFromTree()
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
