/**
 * Скрипт пересчета опыта для пользователей admin и testuser
 * Использует новую систему Base XP + Reflection XP
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Новая система наград
const REWARD_MAP: Record<string, { baseXp: number; reflectionXp: number; max: number }> = {
  micro: { baseXp: 20, reflectionXp: 80, max: 100 },
  weekly: { baseXp: 40, reflectionXp: 160, max: 200 },
  story: { baseXp: 60, reflectionXp: 240, max: 300 },
  'in-person': { baseXp: 100, reflectionXp: 400, max: 500 },
};

// Множители
const NODE_LEVEL_MULTIPLIERS: Record<string, number> = {
  basic: 1.0,
  mid: 0.8,
  advanced: 0.6,
  master: 0.4,
};

const STATE_MULTIPLIERS: Record<string, number> = {
  locked: 0.0,
  available: 0.7,
  active: 1.0,
  unlocked: 0.8,
  integrated: 0.6,
};

const MIN_REFLECTION_LENGTH = 300;

/**
 * Проверить наличие рефлексии для квеста
 */
async function hasReflection(questId: string, userId: string): Promise<boolean> {
  const reflectionEvidence = await prisma.evidence.findFirst({
    where: {
      quest_id: questId,
      userId: userId,
      type: 'reflection',
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return !!(
    reflectionEvidence &&
    reflectionEvidence.text &&
    reflectionEvidence.text.trim().length >= MIN_REFLECTION_LENGTH
  );
}

/**
 * Проверить наличие рефлексии для кейса (по ability_node_id)
 */
async function hasReflectionForCase(
  nodeId: string,
  userId: string,
  caseCompletedAt: Date | null | undefined,
): Promise<boolean> {
  if (!caseCompletedAt) {
    // Если дата не указана, ищем рефлексию за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const reflectionEvidence = await prisma.evidence.findFirst({
      where: {
        ability_node_id: nodeId,
        userId: userId,
        type: 'reflection',
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return !!(
      reflectionEvidence &&
      reflectionEvidence.text &&
      reflectionEvidence.text.trim().length >= MIN_REFLECTION_LENGTH
    );
  }

  // Ищем рефлексию в течение 24 часов после завершения кейса
  const reflectionEvidence = await prisma.evidence.findFirst({
    where: {
      ability_node_id: nodeId,
      userId: userId,
      type: 'reflection',
      created_at: {
        gte: new Date(caseCompletedAt.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(caseCompletedAt.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return !!(
    reflectionEvidence &&
    reflectionEvidence.text &&
    reflectionEvidence.text.trim().length >= MIN_REFLECTION_LENGTH
  );
}

/**
 * Получить уровень узла
 */
function getNodeLevel(level: string | null): string {
  return level || 'basic';
}

/**
 * Рассчитать XP для квеста
 */
async function calculateQuestXP(
  quest: any,
  userId: string,
  nodeInfo: any,
  currentState: string,
): Promise<number> {
  const questType = quest.type as string;
  const reward = REWARD_MAP[questType] || REWARD_MAP.micro;

  // Проверяем наличие рефлексии
  const hasRefl = await hasReflection(quest.id, userId);
  const baseXp = reward.baseXp;
  const reflectionXp = hasRefl ? reward.reflectionXp : 0;
  const totalXp = baseXp + reflectionXp;

  // Множители
  const nodeLevel = getNodeLevel(nodeInfo?.level);
  const nodeLevelMultiplier = NODE_LEVEL_MULTIPLIERS[nodeLevel] || 1.0;
  const stateMultiplier = STATE_MULTIPLIERS[currentState] || 1.0;

  // Если узел locked, XP не применяется
  if (currentState === 'locked') {
    return 0;
  }

  return totalXp * nodeLevelMultiplier * stateMultiplier;
}

/**
 * Рассчитать XP для кейса
 */
async function calculateCaseXP(
  caseProgress: any,
  caseData: any,
  userId: string,
  nodeInfo: any,
  currentState: string,
  completedAt: Date | null | undefined,
): Promise<number> {
  // Кейсы считаются как story type
  const reward = REWARD_MAP.story;

  // Проверяем наличие рефлексии (по ability_node_id в течение 24 часов)
  const hasRefl = await hasReflectionForCase(
    caseProgress.node_id,
    userId,
    completedAt,
  );

  const baseXp = reward.baseXp;
  const reflectionXp = hasRefl ? reward.reflectionXp : 0;
  const totalXp = baseXp + reflectionXp;

  // Множители
  const nodeLevel = getNodeLevel(nodeInfo?.level);
  const nodeLevelMultiplier = NODE_LEVEL_MULTIPLIERS[nodeLevel] || 1.0;
  const stateMultiplier = STATE_MULTIPLIERS[currentState] || 1.0;

  // Если узел locked, XP не применяется
  if (currentState === 'locked') {
    return 0;
  }

  return totalXp * nodeLevelMultiplier * stateMultiplier;
}

/**
 * Пересчитать XP для пользователя
 */
async function recalculateUserXP(userId: string, userEmail: string) {
  console.log(`\n🔄 Пересчет XP для пользователя: ${userEmail} (${userId})\n`);

  // Получаем дерево пользователя
  const tree = await prisma.treeSemantic.findFirst({
    where: { userId },
  });

  if (!tree) {
    console.log(`⚠️  Дерево не найдено для пользователя ${userEmail}`);
    return;
  }

  const treeData = tree.data as any;
  const nodes = treeData.nodes || [];

  // Получаем информацию об узлах
  const nodeInfos = await prisma.abilityNode.findMany({
    select: {
      id: true,
      level: true,
      branch: true,
      title: true,
    },
  });

  const nodeInfoMap = new Map(nodeInfos.map((n) => [n.id, n]));

  // Получаем текущие состояния узлов
  const userStates = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });

  const stateMap = new Map(userStates.map((s) => [s.node_id, s.state]));

  // Собираем XP по узлам
  const nodeXP: Record<string, number> = {};

  // 1. Обрабатываем завершенные квесты
  console.log('📋 Обработка завершенных квестов...');
  const completedQuests = await prisma.quest.findMany({
    where: {
      userId,
      status: 'done',
      completed_at: { not: null },
    },
  });

  console.log(`   Найдено завершенных квестов: ${completedQuests.length}`);

  for (const quest of completedQuests) {
    for (const nodeId of quest.linked_nodes || []) {
      const nodeInfo = nodeInfoMap.get(nodeId);
      if (!nodeInfo) {
        console.warn(`   ⚠️  Узел ${nodeId} не найден в AbilityNode`);
        continue;
      }

      // Получаем текущее состояние узла из дерева
      const treeNode = nodes.find((n: any) => n.node_id === nodeId);
      const currentState = treeNode?.state || stateMap.get(nodeId) || 'locked';

      const xp = await calculateQuestXP(quest, userId, nodeInfo, currentState);
      nodeXP[nodeId] = (nodeXP[nodeId] || 0) + xp;

      if (xp > 0) {
        console.log(
          `   ✅ Квест "${quest.title}" (${quest.type}): +${xp.toFixed(1)} XP к узлу ${nodeInfo.title || nodeId}`,
        );
      }
    }
  }

  // 2. Обрабатываем завершенные кейсы
  console.log('\n🎯 Обработка завершенных кейсов...');
  const completedCases = await prisma.caseProgress.findMany({
    where: {
      user_id: userId,
    },
  });

  console.log(`   Найдено завершенных кейсов: ${completedCases.length}`);

  // Загружаем данные кейсов (если нужно)
  for (const caseProgress of completedCases) {
    const nodeId = caseProgress.node_id;
    if (!nodeId) {
      continue;
    }

    const nodeInfo = nodeInfoMap.get(nodeId);
    if (!nodeInfo) {
      console.warn(`   ⚠️  Узел ${nodeId} не найден в AbilityNode`);
      continue;
    }

    // Получаем текущее состояние узла из дерева
    const treeNode = nodes.find((n: any) => n.node_id === nodeId);
    const currentState = treeNode?.state || stateMap.get(nodeId) || 'locked';

    const xp = await calculateCaseXP(
      caseProgress,
      null,
      userId,
      nodeInfo,
      currentState,
      null, // CaseProgress не имеет created_at, используем null для поиска рефлексии за последние 30 дней
    );
    nodeXP[nodeId] = (nodeXP[nodeId] || 0) + xp;

    if (xp > 0) {
      console.log(`   ✅ Кейс ${caseProgress.case_id}: +${xp.toFixed(1)} XP к узлу ${nodeInfo.title || nodeId}`);
    }
  }

  // 3. Сначала обнуляем XP для всех узлов, которые будут обновлены
  console.log('\n💾 Обновление XP в дереве...');
  let updatedNodes = 0;

  // Обнуляем xp_current для узлов, которые будут пересчитаны
  for (const nodeId of Object.keys(nodeXP)) {
    const treeNodeIndex = nodes.findIndex((n: any) => n.node_id === nodeId);
    if (treeNodeIndex !== -1) {
      nodes[treeNodeIndex].xp_current = 0;
    }
  }

  // Теперь применяем пересчитанный XP
  for (const [nodeId, totalXP] of Object.entries(nodeXP)) {
    const treeNodeIndex = nodes.findIndex((n: any) => n.node_id === nodeId);
    if (treeNodeIndex === -1) {
      console.warn(`   ⚠️  Узел ${nodeId} не найден в дереве`);
      continue;
    }

    // Устанавливаем пересчитанный XP (с нуля)
    nodes[treeNodeIndex].xp_current = Math.max(0, Math.round(totalXP));

    // Обновляем состояние на основе нового XP
    const nodeInfo = nodeInfoMap.get(nodeId);
    const xpRequired = nodes[treeNodeIndex].xp_required || 100;
    const xpCurrent = nodes[treeNodeIndex].xp_current || 0;
    const progressPercent = xpRequired > 0 ? (xpCurrent / xpRequired) * 100 : 0;

    // Определяем новое состояние на основе прогресса
    let newState = nodes[treeNodeIndex].state || 'locked';
    if (progressPercent >= 150) {
      newState = 'integrated';
      nodes[treeNodeIndex].integration_level = 'Embodied';
    } else if (progressPercent >= 100) {
      newState = 'unlocked';
      nodes[treeNodeIndex].integration_level = 'Integrated';
    } else if (progressPercent >= 30) {
      newState = 'active';
      nodes[treeNodeIndex].integration_level = 'Novice';
    } else if (progressPercent > 0) {
      newState = 'available';
      nodes[treeNodeIndex].integration_level = 'Novice';
    } else {
      newState = 'locked';
      nodes[treeNodeIndex].integration_level = 'Novice';
    }

    nodes[treeNodeIndex].state = newState;

    updatedNodes++;
    console.log(
      `   ✅ Узел ${nodeId}: ${xpCurrent} XP / ${xpRequired} XP (${progressPercent.toFixed(1)}%) → ${newState}`,
    );
  }

  // Сохраняем обновленное дерево
  if (updatedNodes > 0) {
    await prisma.treeSemantic.update({
      where: { id: tree.id },
      data: {
        data: treeData as any,
        tree_revision: (tree.tree_revision || 0) + 1,
      },
    });

    console.log(`\n✅ Обновлено узлов: ${updatedNodes}`);
    console.log(`📊 Всего XP распределено по ${Object.keys(nodeXP).length} узлам`);
  } else {
    console.log('\n⚠️  Нет узлов для обновления');
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🚀 Начало пересчета XP для пользователей admin и testuser\n');

  try {
    // Находим пользователей
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: 'admin' }, { telegramUsername: 'admin' }],
      },
    });

    const testUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: 'testuser' }, { telegramUsername: 'testuser' }],
      },
    });

    if (!adminUser && !testUser) {
      console.log('❌ Пользователи admin и testuser не найдены');
      return;
    }

    if (adminUser) {
      await recalculateUserXP(adminUser.id, adminUser.email || adminUser.telegramUsername);
    }

    if (testUser) {
      await recalculateUserXP(testUser.id, testUser.email || testUser.telegramUsername);
    }

    console.log('\n✅ Пересчет завершен!');
  } catch (error: any) {
    console.error('❌ Ошибка при пересчете XP:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Успешно завершено!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ошибка:', error);
      process.exit(1);
    });
}

export { recalculateUserXP };
