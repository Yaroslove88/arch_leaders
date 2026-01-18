import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickFix() {
  console.log('🔧 Быстрое исправление узлов...\n');

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin' }, { telegramUsername: 'admin' }] },
  });

  if (!user) {
    console.error('❌ admin не найден');
    process.exit(1);
  }

  console.log(`✅ User: ${user.id}\n`);

  // Узлы для создания
  const nodes = [
    {
      id: 'node_grounding_point',
      title: 'Точка опоры',
      description: 'Внутренняя устойчивость',
      branch: 'branch_subjectivity',
      level: 'basic',
      xp_required: 100,
    },
    {
      id: 'node_responsibility_as_form',
      title: 'Ответственность как форма',
      description: 'Принятие ответственности',
      branch: 'branch_responsibility',
      level: 'basic',
      xp_required: 100,
    },
    {
      id: 'node_containment',
      title: 'Контейнирование',
      description: 'Удержание напряжения',
      branch: 'branch_subjectivity',
      level: 'mid',
      xp_required: 200,
    },
  ];

  console.log('📊 Создание узлов в AbilityNode...');
  for (const node of nodes) {
    try {
      await prisma.abilityNode.create({ data: node });
      console.log(`  ✅ ${node.id}`);
    } catch (e) {
      console.log(`  ⚠️  ${node.id} уже существует`);
    }
  }

  // Подсчитать XP из квестов
  const quests = await prisma.quest.findMany({
    where: { userId: user.id, status: 'done' },
  });

  console.log(`\n📋 Выполненных квестов: ${quests.length}`);

  const nodeXP: Record<string, number> = {};
  for (const q of quests) {
    const reward = q.reward_json as any;
    const xp = reward?.skill_xp || 50;
    for (const nodeId of q.linked_nodes || []) {
      nodeXP[nodeId] = (nodeXP[nodeId] || 0) + xp;
    }
  }

  console.log('\n🎯 XP по узлам:');
  for (const [nodeId, xp] of Object.entries(nodeXP)) {
    console.log(`  ${nodeId}: ${xp} XP`);
    
    try {
      await prisma.userAbilityState.create({
        data: {
          user_id: user.id,
          node_id: nodeId,
          state: xp >= 100 ? 'available' : 'active',
          progress: Math.min(xp / 100, 1) * 100,
          internal_progress: xp,
          relevance: 1.0,
          stored_experience: 0,
        },
      });
      console.log(`    ✅ Created`);
    } catch (e: any) {
      if (e.code === 'P2003') {
        console.log(`    ⚠️  Node ${nodeId} not found in AbilityNode`);
      } else {
        console.log(`    ⚠️  Already exists or error: ${e.message}`);
      }
    }
  }

  console.log('\n✅ Готово!');
  await prisma.$disconnect();
}

quickFix().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
