/**
 * Скрипт для проверки prerequisites узлов и их состояния
 * 
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/check-node-prerequisites.ts [nodeId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNodePrerequisites(nodeId?: string) {
  try {
    // Найти пользователя admin
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

    console.log(`✅ Found user: ${user.id}\n`);

    // Если nodeId не указан, проверяем проблемные узлы
    const nodesToCheck = nodeId 
      ? [nodeId]
      : [
          'node_feedback_types', // Типы обратной связи
          'node_architectural_thinking', // Архитектурное мышление (уровень 1)
          'node_grounding_point', // Точка опоры
        ];

    for (const checkNodeId of nodesToCheck) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Checking node: ${checkNodeId}`);
      console.log(`${'='.repeat(60)}\n`);

      // Найти узел в AbilityNode
      const node = await prisma.abilityNode.findUnique({
        where: { id: checkNodeId },
      });

      if (!node) {
        console.log(`❌ Node ${checkNodeId} not found in AbilityNode table`);
        continue;
      }

      console.log(`📋 Node Info:`);
      console.log(`   ID: ${node.id}`);
      console.log(`   Title: ${node.title}`);
      console.log(`   Branch: ${node.branch}`);
      console.log(`   Level: ${node.level}`);
      console.log(`   Prerequisites: ${JSON.stringify(node.prerequisites || [])}`);
      console.log('');

      // Проверить состояние узла для пользователя
      const userState = await prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: user.id,
            node_id: checkNodeId,
          },
        },
      });

      if (userState) {
        console.log(`👤 User State:`);
        console.log(`   State: ${userState.state}`);
        console.log(`   Progress: ${Number(userState.progress) * 100}%`);
        console.log(`   Internal Progress: ${Number(userState.internal_progress)}`);
        console.log(`   Stored Experience: ${Number(userState.stored_experience)}`);
        console.log('');
      } else {
        console.log(`⚠️  No UserAbilityState found for this node`);
        console.log('');
      }

      // Проверить prerequisites
      if (node.prerequisites && node.prerequisites.length > 0) {
        console.log(`🔗 Prerequisites (${node.prerequisites.length}):`);
        
        for (const prereqId of node.prerequisites) {
          const prereqNode = await prisma.abilityNode.findUnique({
            where: { id: prereqId },
          });

          const prereqState = await prisma.userAbilityState.findUnique({
            where: {
              user_id_node_id: {
                user_id: user.id,
                node_id: prereqId,
              },
            },
          });

          const status = prereqState && prereqState.state !== 'locked' 
            ? '✅' 
            : '❌';

          console.log(`   ${status} ${prereqId}`);
          if (prereqNode) {
            console.log(`      Title: ${prereqNode.title}`);
          }
          if (prereqState) {
            console.log(`      State: ${prereqState.state}`);
            console.log(`      Progress: ${Number(prereqState.progress) * 100}%`);
            console.log(`      Internal Progress: ${Number(prereqState.internal_progress)}`);
          } else {
            console.log(`      ⚠️  No UserAbilityState found`);
          }
          console.log('');
        }

        // Проверяем, все ли prerequisites выполнены
        const allPrerequisitesMet = node.prerequisites.every(async (prereqId) => {
          const prereqState = await prisma.userAbilityState.findUnique({
            where: {
              user_id_node_id: {
                user_id: user.id,
                node_id: prereqId,
              },
            },
          });
          return prereqState && prereqState.state !== 'locked';
        });

        // Исправляем: нужно использовать Promise.all для async операций
        const prereqStates = await Promise.all(
          node.prerequisites.map(async (prereqId) => {
            const prereqState = await prisma.userAbilityState.findUnique({
              where: {
                user_id_node_id: {
                  user_id: user.id,
                  node_id: prereqId,
                },
              },
            });
            return prereqState && prereqState.state !== 'locked';
          })
        );

        const allMet = prereqStates.every(met => met);
        console.log(`\n${allMet ? '✅' : '❌'} All prerequisites ${allMet ? 'met' : 'NOT met'}`);
        if (!allMet) {
          console.log(`   Node will remain LOCKED until all prerequisites are unlocked`);
        }
      } else {
        console.log(`ℹ️  No prerequisites required`);
      }

      // Проверить TreeSemantic для этого узла
      const treeSemantic = await prisma.treeSemantic.findFirst({
        where: { userId: user.id },
      });

      if (treeSemantic) {
        const treeData = treeSemantic.data as any;
        const treeNode = treeData?.nodes?.find((n: any) => n.node_id === checkNodeId);
        
        if (treeNode) {
          console.log(`\n🌳 TreeSemantic data:`);
          console.log(`   State: ${treeNode.state}`);
          console.log(`   XP Current: ${treeNode.xp_current || 0}`);
          console.log(`   XP Required: ${treeNode.xp_required || 0}`);
          if (treeNode.xp_required > 0) {
            const progressPercent = ((treeNode.xp_current || 0) / treeNode.xp_required) * 100;
            console.log(`   Progress: ${progressPercent.toFixed(1)}%`);
          }
        } else {
          console.log(`\n⚠️  Node not found in TreeSemantic.data.nodes`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get nodeId from command line or use default
const nodeId = process.argv[2];

checkNodePrerequisites(nodeId).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
