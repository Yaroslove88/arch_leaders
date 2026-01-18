import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

// XP из выполненных квестов
const nodeXP: Record<string, number> = {
  node_grounding_point: 400,
  node_containment: 350,
  node_decision_authorship: 200,
  node_system_thinking: 450,
  node_thinking_through_form: 450,
  node_maturity_environment: 200,
  node_personal_resilience: 100,
  node_recovery_skills: 100,
  node_shared_leadership: 250,
  node_responsibility_as_form: 50,
};

async function createAll() {
  console.log('🚀 Creating all nodes and states for admin...\n');

  try {
    // 1. Создать все узлы
    for (const [nodeId, xp] of Object.entries(nodeXP)) {
      const nodeConfig: Record<string, any> = {
        node_grounding_point: { title: 'Точка опоры', branch: 'branch_subjectivity', level: 'basic', xp_req: 100 },
        node_containment: { title: 'Контейнирование', branch: 'branch_subjectivity', level: 'mid', xp_req: 200 },
        node_decision_authorship: { title: 'Авторство решений', branch: 'branch_subjectivity', level: 'master', xp_req: 500 },
        node_system_thinking: { title: 'Системное мышление', branch: 'branch_architectural_thinking', level: 'mid', xp_req: 200 },
        node_thinking_through_form: { title: 'Мышление через форму', branch: 'branch_architectural_thinking', level: 'master', xp_req: 500 },
        node_maturity_environment: { title: 'Среда зрелости', branch: 'branch_maturity_environment', level: 'basic', xp_req: 100 },
        node_personal_resilience: { title: 'Личная устойчивость', branch: 'branch_resilience', level: 'basic', xp_req: 100 },
        node_recovery_skills: { title: 'Навыки восстановления', branch: 'branch_resilience', level: 'mid', xp_req: 200 },
        node_shared_leadership: { title: 'Разделенное лидерство', branch: 'branch_responsibility', level: 'advanced', xp_req: 300 },
        node_responsibility_as_form: { title: 'Ответственность как форма', branch: 'branch_responsibility', level: 'basic', xp_req: 100 },
      };

      const config = nodeConfig[nodeId];
      if (!config) {
        console.log(`⚠️  No config for ${nodeId}, skipping`);
        continue;
      }

      await prisma.abilityNode.upsert({
        where: { id: nodeId },
        create: {
          id: nodeId,
          title: config.title,
          description: config.title,
          branch: config.branch,
          level: config.level,
          prerequisites: [],
        },
        update: {},
      });

      console.log(`✅ Node: ${nodeId}`);
    }

    console.log('');

    // 2. Создать все UserAbilityState
    for (const [nodeId, xp] of Object.entries(nodeXP)) {
      await prisma.userAbilityState.upsert({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
        create: {
          user_id: userId,
          node_id: nodeId,
          state: xp >= 100 ? 'available' : 'active',
          progress: Math.min(xp / 100, 1.0),
          internal_progress: xp,
          relevance: 1.0,
          stored_experience: 0,
        },
        update: {
          progress: Math.min(xp / 100, 1.0),
          internal_progress: xp,
          state: xp >= 100 ? 'available' : 'active',
        },
      });

      console.log(`✅ State: ${nodeId} (${xp} XP)`);
    }

    console.log('\n🎉 All done! Check your dashboard!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAll();
