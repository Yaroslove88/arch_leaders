/**
 * Инициализация UserAbilityState для пользователя из seed файла
 *
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/init-user-ability-state.ts [username]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SeedNode {
  node_id: string;
  branch_id: string;
  tier: 'basic' | 'intermediate' | 'advanced' | 'master';
  xp_required: number;
  prerequisites: string[];
}

interface SeedData {
  nodes: SeedNode[];
}

// Маппинг tier -> level для AbilityNode
const tierToLevel: Record<string, string> = {
  basic: 'basic',
  intermediate: 'mid',
  advanced: 'advanced',
  master: 'master',
};

async function initUserAbilityState(username: string) {
  console.log(`\n🚀 Initializing UserAbilityState for "${username}"\n`);

  // 1. Найти пользователя
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { telegramUsername: username },
      ],
    },
  });

  if (!user) {
    console.log(`❌ User "${username}" not found!`);
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found user: ${user.telegramUsername || user.email} (ID: ${user.id})\n`);

  // 2. Загружаем seed файл
  const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
  if (!fs.existsSync(seedPath)) {
    console.log(`❌ Seed file not found: ${seedPath}`);
    await prisma.$disconnect();
    return;
  }

  const seedData: SeedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  console.log(`📋 Loaded ${seedData.nodes.length} nodes from seed\n`);

  // 3. Сначала создаем недостающие AbilityNode записи
  console.log('📦 Creating missing AbilityNode records...\n');
  let nodesCreated = 0;

  for (const node of seedData.nodes) {
    try {
      await prisma.abilityNode.upsert({
        where: { id: node.node_id },
        create: {
          id: node.node_id,
          branch: node.branch_id,
          title: node.node_id, // временно node_id, контент берется из node-descriptions.json
          description: node.node_id,
          level: tierToLevel[node.tier] || 'basic',
          prerequisites: node.prerequisites || [],
        },
        update: {}, // не обновляем если уже существует
      });
      nodesCreated++;
    } catch (error: any) {
      console.log(`   ⚠️ AbilityNode ${node.node_id}: ${error.message}`);
    }
  }
  console.log(`   ✅ AbilityNode records ensured: ${nodesCreated}\n`);

  // 4. Проверяем существующие UserAbilityState записи
  const existingStates = await prisma.userAbilityState.count({
    where: { user_id: user.id },
  });

  if (existingStates > 0) {
    console.log(`⚠️  User already has ${existingStates} UserAbilityState records`);
    console.log('   Skipping creation to avoid duplicates\n');
    console.log('   To reset, run: npx tsx ../../scripts/reset-test-user.ts ' + username);
    await prisma.$disconnect();
    return;
  }

  // 5. Создаем UserAbilityState для каждого узла
  console.log('📊 Creating UserAbilityState records...\n');
  let created = 0;
  let errors = 0;

  for (const node of seedData.nodes) {
    try {
      // Доступны только стартовые узлы (xp_required = 0 или не задан)
      // Это первый узел в каждой ветке, с которого начинается развитие
      const isStartingNode = !node.xp_required || node.xp_required === 0;
      const state = isStartingNode ? 'available' : 'locked';

      await prisma.userAbilityState.create({
        data: {
          user_id: user.id,
          node_id: node.node_id,
          state,
          progress: 0,
          internal_progress: 0,
          relevance: 1.0,
          stored_experience: 0,
        },
      });

      console.log(`   ✅ ${node.node_id}: ${state} (xp_required: ${node.xp_required || 0})`);
      created++;
    } catch (error: any) {
      console.log(`   ❌ ${node.node_id}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   AbilityNode records: ${nodesCreated}`);
  console.log(`   UserAbilityState created: ${created}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\n✨ Done! User "${username}" now has ${created} ability nodes initialized.\n`);

  await prisma.$disconnect();
}

// Get username from command line or use default
const username = process.argv[2] || 'testuser';

initUserAbilityState(username).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
