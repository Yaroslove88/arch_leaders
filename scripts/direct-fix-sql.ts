import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function directFix() {
  console.log('🔧 Прямое исправление через SQL...\n');

  const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

  try {
    // 1. Создать узел через raw SQL
    console.log('1. Creating node_grounding_point...');
    await prisma.$executeRaw`
      INSERT INTO ability_nodes (id, title, description, branch, level, prerequisites, created_at)
      VALUES ('node_grounding_point', 'Точка опоры', 'Внутренняя устойчивость', 'branch_subjectivity', 'basic', ARRAY[]::text[], NOW())
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
    `;
    console.log('✅ Node created\n');

    // 2. Создать UserAbilityState  
    console.log('2. Creating UserAbilityState...');
    await prisma.$executeRaw`
      INSERT INTO "user_ability_state" (user_id, node_id, state, progress, internal_progress, relevance, stored_experience, last_updated_at)
      VALUES (${userId}, 'node_grounding_point', 'available', 1.0, 400, 1.0, 0, NOW())
      ON CONFLICT (user_id, node_id) DO UPDATE 
      SET progress = EXCLUDED.progress, internal_progress = EXCLUDED.internal_progress, state = EXCLUDED.state;
    `;
    console.log('✅ State created\n');

    // 3. Проверить
    const state = await prisma.userAbilityState.findUnique({
      where: {
        user_id_node_id: {
          user_id: userId,
          node_id: 'node_grounding_point',
        },
      },
    });

    console.log('✅ Verification:');
    console.log(`   State: ${state?.state}`);
    console.log(`   Progress: ${state?.progress}`);
    console.log(`   Internal: ${state?.internal_progress}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directFix();
