/**
 * Скрипт для обновления ID узлов в квестах в БД
 * Применяет маппинг старых ID на новые из fix-quest-node-ids.ts
 * 
 * Использование: 
 *   cd leadership-architect
 *   npx ts-node scripts/update-quest-node-ids-in-db.ts
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Маппинг старых ID на новые
const nodeMapping: Record<string, string> = {
  'node_design_thinking': 'node_thinking_through_form',
  'node_organizational_culture': 'node_maturity_environment',
  'node_grounding': 'node_grounding_point',
  'node_giving_feedback': 'node_feedback_types',
  'node_receiving_feedback': 'node_feedback_through_vulnerability',
  'node_stress_tolerance': 'node_personal_resilience',
  'node_recovery': 'node_recovery_skills',
  'node_ownership': 'node_psychological_ownership',
  'node_accountability': 'node_responsibility_as_form',
  'node_team_development': 'node_shared_leadership',
};

async function updateQuestNodeIds() {
  try {
    console.log('🔍 Обновляю ID узлов в квестах в БД...\n');

    // Получаем все квесты
    const quests = await prisma.quest.findMany({
      where: {
        linked_nodes: {
          isEmpty: false,
        },
      },
    });

    console.log(`✅ Найдено ${quests.length} квестов с linked_nodes\n`);

    let updatedCount = 0;

    for (const quest of quests) {
      if (!quest.linked_nodes || quest.linked_nodes.length === 0) {
        continue;
      }

      // Проверяем, есть ли старые ID
      const hasOldIds = quest.linked_nodes.some((nodeId: string) => nodeMapping[nodeId]);
      
      if (!hasOldIds) {
        continue;
      }

      // Применяем маппинг
      const newLinkedNodes = quest.linked_nodes.map((nodeId: string) => 
        nodeMapping[nodeId] || nodeId
      );

      // Обновляем квест
      await prisma.quest.update({
        where: { id: quest.id },
        data: {
          linked_nodes: newLinkedNodes,
        },
      });

      console.log(`   ✅ ${quest.title}: обновлено ${quest.linked_nodes.length} узлов`);
      updatedCount++;
    }

    console.log(`\n✅ Обновлено ${updatedCount} квестов в БД\n`);
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateQuestNodeIds();

