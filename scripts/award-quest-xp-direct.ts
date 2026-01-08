/**
 * Скрипт для прямого начисления exp за завершенный квест "путь к зрелости"
 * Использует прямой доступ к Prisma и TreeService
 * 
 * Использование: 
 *   cd leadership-architect
 *   npx ts-node scripts/award-quest-xp-direct.ts
 */

// Используем require для динамической загрузки модулей
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function awardQuestXP() {
  try {
    console.log('🔍 Ищу завершенный квест "путь к зрелости" для админа...\n');

    // Находим админа
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!admin) {
      console.error('❌ Админ не найден');
      return;
    }

    console.log(`✅ Найден админ: ${admin.id} (${admin.email || admin.name || 'без email'})\n`);

    // Находим завершенный квест "путь к зрелости" для админа
    const quest = await prisma.quest.findFirst({
      where: {
        userId: admin.id,
        title: {
          contains: 'путь к зрелости',
          mode: 'insensitive',
        },
        status: 'done',
      },
      orderBy: {
        completed_at: 'desc',
      },
    });

    if (!quest) {
      console.error('❌ Квест "путь к зрелости" не найден или не завершен для админа');
      console.log('\n💡 Попробуйте завершить квест через UI или API');
      return;
    }

    console.log(`✅ Найден квест: ${quest.id}`);
    console.log(`   Название: ${quest.title}`);
    console.log(`   Завершен: ${quest.completed_at}`);
    console.log(`   Пользователь: ${quest.userId}\n`);

    // Парсим reward
    const reward = quest.reward_json as any;
    const skillXp = reward?.skill_xp || 200;
    
    // Используем узлы из квеста, но применяем маппинг старых ID на новые
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
    
    let linkedNodes = quest.linked_nodes || [];
    // Применяем маппинг для старых ID
    linkedNodes = linkedNodes.map((nodeId: string) => nodeMapping[nodeId] || nodeId);
    
    // Если узлов нет, используем дефолтные (для квеста "путь к зрелости")
    if (linkedNodes.length === 0) {
      linkedNodes = [
        'node_system_thinking',
        'node_thinking_through_form',
        'node_maturity_environment',
      ];
    }

    console.log(`📊 Награда:`);
    console.log(`   Skill XP: ${skillXp}`);
    console.log(`   Связанные узлы: ${linkedNodes.join(', ')}\n`);

    // Загружаем пользовательское дерево
    let treeRecord = await prisma.treeSemantic.findUnique({
      where: { userId: quest.userId },
    });

    if (!treeRecord) {
      console.log('⚠️  Пользовательское дерево не найдено, создаю из seed...');
      
      // Загружаем seed файл
      const path = require('path');
      const fs = require('fs').promises;
      const seedPath = path.resolve(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
      
      try {
        const seedContent = await fs.readFile(seedPath, 'utf-8');
        const seedData = JSON.parse(seedContent);
        
        // Создаем пользовательское дерево из seed
        treeRecord = await prisma.treeSemantic.create({
          data: {
            id: `tree_user_${quest.userId}`,
            userId: quest.userId,
            semantic_version: seedData.semantic_version || '1.0.0',
            tree_revision: seedData.tree_revision || 1,
            data: seedData as any,
          },
        });
        
        console.log(`✅ Создано пользовательское дерево из seed (${seedData.nodes?.length || 0} узлов)\n`);
      } catch (error: any) {
        console.error(`❌ Ошибка при создании дерева из seed: ${error.message}`);
        return;
      }
    }

    const tree = treeRecord.data as any;
    
    // Проверяем текущее состояние узлов
    console.log('📋 Текущее состояние узлов:');
    for (const nodeId of linkedNodes) {
      const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
      if (node) {
        console.log(`   ${nodeId}: ${node.xp_current}/${node.xp_required} (${node.state})`);
      } else {
        console.log(`   ${nodeId}: не найден в дереве`);
      }
    }
    console.log('');

    // Начисляем exp на каждый узел напрямую
    console.log('🎯 Начисляю exp на узлы...\n');
    const updatedNodes: any[] = [];
    
    for (const nodeId of linkedNodes) {
      const node = tree?.nodes?.find((n: any) => n.node_id === nodeId);
      if (!node) {
        console.log(`   ⚠️  Узел ${nodeId} не найден в дереве, пропускаю`);
        continue;
      }

      const beforeXp = node.xp_current || 0;
      const newXp = Math.max(0, beforeXp + skillXp);
      const isNowUnlocked = newXp >= (node.xp_required || 0);

      // Обновляем узел в дереве
      node.xp_current = newXp;
      if (isNowUnlocked && node.state !== 'unlocked' && node.state !== 'integrated') {
        node.state = 'unlocked';
      }

      updatedNodes.push({
        nodeId,
        beforeXp,
        newXp,
        xpRequired: node.xp_required,
        state: node.state,
      });

      console.log(
        `   ✅ ${nodeId}: ${newXp}/${node.xp_required} (было: ${beforeXp}, состояние: ${node.state})`,
      );
    }

    if (updatedNodes.length > 0 && treeRecord) {
      // Увеличиваем ревизию
      tree.tree_revision = (tree.tree_revision || 1) + 1;

      // Сохраняем обновленное дерево
      await prisma.treeSemantic.update({
        where: { userId: quest.userId },
        data: {
          tree_revision: tree.tree_revision,
          data: tree as any,
        },
      });

      // Синхронизируем state с UserAbilityState
      // Проверяем, что узлы существуют в AbilityNode таблице
      for (const updatedNode of updatedNodes) {
        try {
          // Проверяем существование узла в AbilityNode
          const abilityNode = await prisma.abilityNode.findUnique({
            where: { id: updatedNode.nodeId },
          });
          
          if (!abilityNode) {
            console.log(`   ⚠️  Узел ${updatedNode.nodeId} не найден в таблице AbilityNode, пропускаю синхронизацию`);
            continue;
          }
          
          await prisma.userAbilityState.upsert({
            where: {
              user_id_node_id: {
                user_id: quest.userId,
                node_id: updatedNode.nodeId,
              },
            },
            create: {
              user_id: quest.userId,
              node_id: updatedNode.nodeId,
              state: updatedNode.state,
              progress: 0,
              relevance: 0,
              last_updated_at: new Date(),
            },
            update: {
              state: updatedNode.state,
              last_updated_at: new Date(),
            },
          });
        } catch (error: any) {
          console.log(`   ⚠️  Не удалось синхронизировать ${updatedNode.nodeId} с UserAbilityState: ${error.message}`);
        }
      }

      console.log(`\n✅ Exp успешно начислен на ${updatedNodes.length} узлов!`);
      console.log('\n💡 Примечание: После исправления кода, exp теперь начисляется автоматически');
      console.log('   при завершении квеста через метод complete() в quests.service.ts');
    } else {
      console.log('\n⚠️  Не удалось обновить ни одного узла');
    }
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

awardQuestXP();

