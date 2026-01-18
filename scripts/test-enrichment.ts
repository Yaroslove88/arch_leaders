/**
 * Тест обогащения дерева через API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

async function test() {
  console.log('🧪 Testing enrichment logic...\n');

  // 1. Проверить UserAbilityState
  const states = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });
  console.log(`📊 UserAbilityState records: ${states.length}`);
  states.slice(0, 3).forEach((s) => {
    console.log(`  ${s.node_id}: state=${s.state}, xp=${s.internal_progress}`);
  });

  // 2. Проверить TreeSemantic
  const tree = await prisma.treeSemantic.findUnique({
    where: { userId },
  });
  console.log(`\n🌳 TreeSemantic:`);
  if (tree) {
    const data = tree.data as any;
    console.log(`  userId: ${tree.userId}`);
    console.log(`  nodes: ${data.nodes?.length || 0}`);
    
    // Проверить node_grounding_point в TreeSemantic
    const grounding = data.nodes?.find((n: any) => n.node_id === 'node_grounding_point');
    if (grounding) {
      console.log(`\n  📍 node_grounding_point in TreeSemantic:`);
      console.log(`     state: ${grounding.state}`);
      console.log(`     xp_current: ${grounding.xp_current}`);
    }
    
    // Проверить node_grounding_point в UserAbilityState
    const groundingState = states.find((s) => s.node_id === 'node_grounding_point');
    if (groundingState) {
      console.log(`\n  📍 node_grounding_point in UserAbilityState:`);
      console.log(`     state: ${groundingState.state}`);
      console.log(`     internal_progress: ${groundingState.internal_progress}`);
    }
    
    // Сравнить
    if (grounding && groundingState) {
      console.log(`\n  🔍 Comparison:`);
      console.log(`     State match: ${grounding.state === groundingState.state ? '✅' : '❌'} (Tree: ${grounding.state}, DB: ${groundingState.state})`);
      console.log(`     XP match: ${grounding.xp_current === Number(groundingState.internal_progress) ? '✅' : '❌'} (Tree: ${grounding.xp_current}, DB: ${groundingState.internal_progress})`);
    }
  } else {
    console.log('  ❌ TreeSemantic NOT FOUND for user');
  }

  await prisma.$disconnect();
}

test().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
