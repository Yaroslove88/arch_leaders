import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminXP() {
  try {
    // Найти пользователя admin (либо по email, либо по telegram)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin' },
          { telegramUsername: 'admin' },
        ],
      },
    });

    if (!user) {
      console.log('❌ User admin not found');
      return;
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log('');

    // Найти все квесты admin
    const quests = await prisma.quest.findMany({
      where: { userId: user.id },
    });

    console.log(`📋 Quests for admin: ${quests.length}`);
    quests.forEach((quest, i) => {
      const reward = quest.reward_json as any;
      console.log(`  ${i + 1}. ${quest.title}`);
      console.log(`     Status: ${quest.status}`);
      console.log(`     Reward XP: ${reward?.skill_xp || 0}`);
      console.log(`     Linked Nodes: ${JSON.stringify(quest.linked_nodes)}`);
      console.log('');
    });

    // Найти все решенные кейсы admin
    const caseProgress = await prisma.caseProgress.findMany({
      where: { user_id: user.id },
    });

    console.log(`📦 Case Progress for admin: ${caseProgress.length}`);
    caseProgress.forEach((cp, i) => {
      console.log(`  ${i + 1}. Case ID: ${cp.case_id}`);
      console.log(`     Node ID: ${cp.node_id}`);
      console.log(`     XP Earned: ${cp.xp_earned}`);
      console.log(`     Selected Option: ${cp.selected_option}`);
      console.log('');
    });

    // Найти состояние узлов способностей admin
    const abilityStates = await prisma.userAbilityState.findMany({
      where: { user_id: user.id },
    });

    console.log(`🎯 Ability States for admin: ${abilityStates.length}`);
    abilityStates.forEach((state, i) => {
      console.log(`  ${i + 1}. Node ID: ${state.node_id}`);
      console.log(`     State: ${state.state}`);
      console.log(`     Progress: ${state.progress}`);
      console.log(`     Internal Progress: ${state.internal_progress}`);
      console.log(`     Stored Experience: ${state.stored_experience}`);
      console.log('');
    });

    // Найти узел "Точка опоры"
    const groundingNode = await prisma.abilityNode.findFirst({
      where: {
        OR: [
          { title: { contains: 'Точка опоры', mode: 'insensitive' } },
          { id: 'node_grounding_point' },
        ],
      },
    });

    if (groundingNode) {
      console.log(`🎯 Found "Точка опоры" node:`);
      console.log(`   ID: ${groundingNode.id}`);
      console.log(`   Title: ${groundingNode.title}`);
      console.log(`   XP Required: ${groundingNode.xp_required}`);
      console.log('');

      // Проверить состояние этого узла для admin
      const groundingState = await prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: user.id,
            node_id: groundingNode.id,
          },
        },
      });

      if (groundingState) {
        console.log(`   Admin's state for this node:`);
        console.log(`     State: ${groundingState.state}`);
        console.log(`     Progress: ${groundingState.progress}%`);
        console.log(`     Internal Progress: ${groundingState.internal_progress}`);
        console.log(`     Stored Experience: ${groundingState.stored_experience}`);
      } else {
        console.log(`   ❌ No state found for admin on this node!`);
      }
    } else {
      console.log(`❌ "Точка опоры" node not found`);
    }

    // Проверить ChangeLogs для начисления XP
    const changeLogs = await prisma.changeLog.findMany({
      where: {
        userId: user.id,
        scope: 'ability',
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    console.log('');
    console.log(`📜 Recent ability change logs: ${changeLogs.length}`);
    changeLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. Action: ${log.action} at ${log.created_at}`);
      console.log(`     Rationale: ${log.rationale}`);
      console.log(`     Before: ${JSON.stringify(log.before).substring(0, 100)}...`);
      console.log(`     After: ${JSON.stringify(log.after).substring(0, 100)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminXP();
