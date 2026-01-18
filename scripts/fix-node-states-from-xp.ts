/**
 * Исправить состояние узлов на основе xp_current / xp_required
 * ВАЖНО: НЕ трогает tree_main (это база)!
 * Работает только с персональными деревьями пользователей или создает их из UserAbilityState
 * 
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/fix-node-states-from-xp.ts [userId]
 * 
 * Если userId не указан, исправляет для всех пользователей
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Вычислить правильное состояние на основе прогресса
 */
function calculateState(xpCurrent: number, xpRequired: number, currentState: string): {
  state: string;
  integration_level: string;
} {
  const xpRequiredFixed = xpRequired || 100; // default to 100 if 0
  const progressPercent = xpRequiredFixed > 0 ? (xpCurrent / xpRequiredFixed) * 100 : (xpCurrent > 0 ? 100 : 0);
  
  let newState = currentState;
  let newIntegrationLevel = 'Novice';
  
  if (progressPercent >= 150) {
    newState = 'integrated';
    newIntegrationLevel = 'Embodied';
  } else if (progressPercent >= 100) {
    newState = 'unlocked';
    newIntegrationLevel = 'Integrated';
  } else if (progressPercent >= 30) {
    if (currentState === 'locked' || currentState === 'available') {
      newState = 'active';
    }
    newIntegrationLevel = 'Novice';
  } else if (progressPercent > 0) {
    if (currentState === 'locked') {
      newState = 'available';
    }
    newIntegrationLevel = 'Novice';
  }
  
  return { state: newState, integration_level: newIntegrationLevel };
}

/**
 * Исправить состояние узлов для пользователя
 * ВАЖНО: НЕ трогает tree_main!
 */
async function fixNodeStatesForUser(userId?: string) {
  console.log('🔍 Исправление состояния узлов на основе xp_current / xp_required\n');
  console.log('⚠️  ВАЖНО: Скрипт НЕ трогает tree_main (это база для всех пользователей)\n');
  
  // Получаем список пользователей
  let users: Array<{ id: string; email: string | null }> = [];
  if (userId) {
    // Ищем пользователя по ID, email или telegramUsername
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { email: userId },
          { telegramUsername: userId },
        ],
      },
      select: { id: true, email: true },
    });
    if (user) {
      users = [user];
      console.log(`👤 Пользователь: ${user.email || user.id} (${user.id})\n`);
    } else {
      console.error(`❌ Пользователь "${userId}" не найден\n`);
      await prisma.$disconnect();
      return;
    }
  } else {
    users = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    console.log(`🌍 Найдено пользователей: ${users.length}\n`);
  }
  
  // Получаем базовое дерево (НЕ изменяем его!)
  const baseTree = await prisma.treeSemantic.findUnique({
    where: { id: 'tree_main' },
  });
  
  if (!baseTree || !baseTree.data) {
    console.error('❌ Базовое дерево tree_main не найдено!\n');
    await prisma.$disconnect();
    return;
  }
  
  const baseTreeData = baseTree.data as any;
  const baseNodes = baseTreeData.nodes || [];
  
  let totalFixed = 0;
  let totalChecked = 0;
  
  for (const user of users) {
    console.log(`\n📊 Обработка пользователя: ${user.email || user.id}`);
    
    const userTreeId = `tree_user_${user.id}`;
    
    // Получаем персональное дерево или создаем его из базового
    let userTree = await prisma.treeSemantic.findUnique({
      where: { id: userTreeId },
    });
    
    // Получаем данные из UserAbilityState (где хранился опыт в internal_progress)
    const userStates = await prisma.userAbilityState.findMany({
      where: { user_id: user.id },
    });
    
    // Создаем персональное дерево на основе базового + данных из UserAbilityState
    const userTreeData: any = {
      ...baseTreeData,
      nodes: baseNodes.map((baseNode: any) => {
        const userState = userStates.find(s => s.node_id === baseNode.node_id);
        
        // Восстанавливаем xp_current из internal_progress (если есть)
        const xpCurrent = userState && userState.internal_progress 
          ? Number(userState.internal_progress) 
          : (baseNode.xp_current || 0);
        
        return {
          ...baseNode,
          xp_current: xpCurrent,
          state: userState?.state || baseNode.state,
        };
      }),
    };
    
    let treeFixed = 0;
    const updates: any[] = [];
    
    for (const node of userTreeData.nodes) {
      totalChecked++;
      const xpCurrent = node.xp_current || 0;
      const xpRequired = node.xp_required || 100;
      const currentState = node.state || 'locked';
      
      const { state: newState, integration_level: newIntegrationLevel } = calculateState(
        xpCurrent,
        xpRequired,
        currentState
      );
      
      if (newState !== currentState || newIntegrationLevel !== (node.integration_level || 'Novice')) {
        console.log(`  🔧 ${node.node_id}:`);
        console.log(`     XP: ${xpCurrent} / ${xpRequired} (${((xpCurrent / (xpRequired || 100)) * 100).toFixed(1)}%)`);
        console.log(`     State: ${currentState} → ${newState}`);
        console.log(`     Integration: ${node.integration_level || 'Novice'} → ${newIntegrationLevel}`);
        
        updates.push({
          node_id: node.node_id,
          patch: {
            state: newState,
            integration_level: newIntegrationLevel,
          },
        });
        
        treeFixed++;
        totalFixed++;
      }
    }
    
    if (updates.length > 0) {
      // Применяем обновления к персональному дереву
      const updatedNodes = [...userTreeData.nodes];
      for (const update of updates) {
        const nodeIndex = updatedNodes.findIndex((n: any) => n.node_id === update.node_id);
        if (nodeIndex >= 0) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            ...update.patch,
          };
        }
      }
      
      userTreeData.nodes = updatedNodes;
      userTreeData.tree_revision = (userTreeData.tree_revision || 1) + 1;
      
      // Сохраняем/обновляем персональное дерево
      await prisma.treeSemantic.upsert({
        where: { id: userTreeId },
        update: {
          data: userTreeData as any,
          tree_revision: userTreeData.tree_revision,
        },
        create: {
          id: userTreeId,
          data: userTreeData as any,
          tree_revision: userTreeData.tree_revision,
          userId: user.id,
        },
      });
      
      console.log(`  ✅ Исправлено ${treeFixed} узлов в дереве ${userTreeId}`);
      
      // Синхронизируем состояние с UserAbilityState
      for (const update of updates) {
        await syncStateToUserAbilityState(user.id, update.node_id, update.patch.state);
      }
    } else {
      console.log(`  ✅ Все узлы в правильном состоянии`);
    }
  }
  
  console.log(`\n📊 Итоговая статистика:`);
  console.log(`   Проверено узлов: ${totalChecked}`);
  console.log(`   Исправлено узлов: ${totalFixed}`);
  
  await prisma.$disconnect();
}

/**
 * Синхронизировать состояние с UserAbilityState
 */
async function syncStateToUserAbilityState(userId: string, nodeId: string, state: string) {
  try {
    const existing = await prisma.userAbilityState.findUnique({
      where: {
        user_id_node_id: {
          user_id: userId,
          node_id: nodeId,
        },
      },
    });
    
    if (existing) {
      await prisma.userAbilityState.update({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
        data: {
          state,
          last_updated_at: new Date(),
        },
      });
    } else {
      await prisma.userAbilityState.create({
        data: {
          user_id: userId,
          node_id: nodeId,
          state,
          progress: 0,
          relevance: 0,
          last_updated_at: new Date(),
        },
      });
    }
  } catch (error: any) {
    console.warn(`⚠️  Не удалось синхронизировать состояние для ${nodeId}: ${error.message}`);
  }
}

// Запуск
const userId = process.argv[2];
fixNodeStatesForUser(userId).catch((e) => {
  console.error('❌ Ошибка:', e);
  process.exit(1);
});
