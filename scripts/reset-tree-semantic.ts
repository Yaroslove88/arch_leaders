/**
 * Сбросить TreeSemantic.data к исходному seed состоянию
 * Удалить пользовательские данные из TreeSemantic (они должны обогащаться при запросе)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

async function reset() {
  console.log('🔄 Resetting TreeSemantic to seed state...\n');

  // 1. Загрузить seed
  const seedPath = path.resolve(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
  const seedContent = fs.readFileSync(seedPath, 'utf-8');
  const seedData = JSON.parse(seedContent);

  console.log(`✅ Loaded seed: ${seedData.nodes?.length || 0} nodes`);

  // 2. Сбросить все узлы к исходному состоянию (locked, xp=0)
  seedData.nodes = seedData.nodes.map((node: any) => ({
    ...node,
    state: 'locked',
    xp_current: 0,
  }));

  console.log(`🔧 Reset all nodes to locked, xp=0`);

  // 3. Обновить TreeSemantic
  await prisma.treeSemantic.update({
    where: { userId },
    data: {
      data: seedData,
      tree_revision: { increment: 1 },
    },
  });

  console.log(`✅ TreeSemantic reset!`);
  console.log(`\n📋 Now TreeSemantic.data contains only seed data (all locked, xp=0)`);
  console.log(`   UserAbilityState will enrich it on each GET /tree/semantic request`);

  await prisma.$disconnect();
}

reset().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
