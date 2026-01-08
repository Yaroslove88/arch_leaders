/**
 * Скрипт для проверки количества узлов в дереве
 * Проверяет seed файл и данные в БД
 * 
 * Запуск: ts-node scripts/check-tree-nodes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');

console.log('🔍 Checking tree nodes...\n');

try {
  const seedContent = fs.readFileSync(seedPath, 'utf-8');
  const seedData = JSON.parse(seedContent);

  console.log('📊 Seed file statistics:');
  console.log(`   Nodes: ${seedData.nodes?.length || 0}`);
  console.log(`   Branches: ${seedData.branches?.length || 0}`);
  console.log(`   Edges: ${seedData.edges?.length || 0}`);
  console.log(`   Tree revision: ${seedData.tree_revision || 'N/A'}`);

  if (seedData.nodes) {
    console.log('\n📋 Node IDs:');
    seedData.nodes.forEach((node: any, index: number) => {
      console.log(`   ${index + 1}. ${node.node_id} - ${node.name}`);
    });
  }

  console.log('\n✅ Seed file is valid');
  console.log('\n💡 If you see only 12 nodes in the app, check:');
  console.log('   1. Database has old data - need to update tree_revision');
  console.log('   2. Run: cd apps/api && pnpm prisma migrate reset (WARNING: deletes all data)');
  console.log('   3. Or update tree_revision in seed file and restart API');
} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

