import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fixAdminTree() {
  try {
    console.log('🔧 Исправление дерева способностей для admin...\n');

    // 1. Найти пользователя admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin' },
          { telegramUsername: 'admin' },
        ],
      },
    });

    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      return;
    }

    console.log(`✅ Найден пользователь: ID ${user.id}\n`);

    // 2. Загрузить seed файл с деревом
    const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
    
    if (!fs.existsSync(seedPath)) {
      console.error(`❌ Seed файл не найден: ${seedPath}`);
      console.log('💡 Создаем минимальное дерево вручную...\n');
      
      // Создаем минимальное дерево с узлом "Точка опоры"
      const minimalTree = {
        semantic_version: '1.0.0',
        tree_revision: 1,
        branches: [
          {
            id: 'branch_subjectivity',
            title: 'Субъектность',
            description: 'Развитие субъектности и способности быть опорой',
          },
        ],
        nodes: [
          {
            node_id: 'node_grounding_point',
            title: 'Точка опоры',
            description: 'Внутренняя устойчивость. Основа субъектности. Способность иметь внутреннюю опору, на которую можно опереться в сложных ситуациях.',
            branch: 'branch_subjectivity',
            level: 'basic',
            xp_required: 100,
            xp_current: 0,
            state: 'locked',
            prerequisites: [],
          },
          {
            node_id: 'node_responsibility_as_form',
            title: 'Ответственность как форма',
            description: 'Способность принимать ответственность за свои решения и действия',
            branch: 'branch_subjectivity',
            level: 'basic',
            xp_required: 100,
            xp_current: 0,
            state: 'locked',
            prerequisites: [],
          },
          {
            node_id: 'node_containment',
            title: 'Контейнирование',
            description: 'Способность удерживать напряжение и не поддаваться импульсивным реакциям',
            branch: 'branch_subjectivity',
            level: 'mid',
            xp_required: 200,
            xp_current: 0,
            state: 'locked',
            prerequisites: ['node_grounding_point'],
          },
        ],
        edges: [
          {
            from: 'node_grounding_point',
            to: 'node_containment',
            type: 'prerequisite',
          },
        ],
      };

      // 3. Заполнить таблицу AbilityNode
      console.log('📊 Заполнение таблицы AbilityNode...');
      for (const node of minimalTree.nodes) {
        await prisma.abilityNode.upsert({
          where: { id: node.node_id },
          create: {
            id: node.node_id,
            title: node.title,
            description: node.description,
            branch: node.branch,
            level: node.level,
            xp_required: node.xp_required,
            prerequisites: node.prerequisites,
          },
          update: {
            title: node.title,
            description: node.description,
            xp_required: node.xp_required,
          },
        });
        console.log(`  ✅ ${node.node_id}: ${node.title}`);
      }
      console.log('');

      // 4. Создать/обновить TreeSemantic для admin
      console.log('🌳 Обновление TreeSemantic...');
      const existingTree = await prisma.treeSemantic.findUnique({
        where: { userId: user.id },
      });

      if (existingTree) {
        await prisma.treeSemantic.update({
          where: { userId: user.id },
          data: {
            data: minimalTree as any,
            semantic_version: '1.0.0',
            tree_revision: existingTree.tree_revision + 1,
          },
        });
        console.log('✅ TreeSemantic обновлен');
      } else {
        await prisma.treeSemantic.create({
          data: {
            userId: user.id,
            data: minimalTree as any,
            semantic_version: '1.0.0',
            tree_revision: 1,
          },
        });
        console.log('✅ TreeSemantic создан');
      }
      console.log('');

      // 5. Создать UserAbilityState для узлов с выполненными квестами
      console.log('🎯 Создание UserAbilityState для выполненных квестов...');
      
      // Найти выполненные квесты admin
      const completedQuests = await prisma.quest.findMany({
        where: {
          userId: user.id,
          status: 'done',
        },
      });

      console.log(`Найдено выполненных квестов: ${completedQuests.length}`);

      // Собрать все linked_nodes и подсчитать XP
      const nodeXP: Record<string, number> = {};
      for (const quest of completedQuests) {
        const reward = quest.reward_json as any;
        const xp = reward?.skill_xp || 50;
        const linkedNodes = quest.linked_nodes || [];

        console.log(`  Квест: "${quest.title}" (${xp} XP) -> [${linkedNodes.join(', ')}]`);

        for (const nodeId of linkedNodes) {
          nodeXP[nodeId] = (nodeXP[nodeId] || 0) + xp;
        }
      }

      console.log('\nXP по узлам:');
      for (const [nodeId, xp] of Object.entries(nodeXP)) {
        console.log(`  ${nodeId}: ${xp} XP`);
        
        // Создать UserAbilityState
        await prisma.userAbilityState.upsert({
          where: {
            user_id_node_id: {
              user_id: user.id,
              node_id: nodeId,
            },
          },
          create: {
            user_id: user.id,
            node_id: nodeId,
            state: xp >= 100 ? 'available' : 'locked',
            progress: Math.min(xp, 100),
            internal_progress: xp,
            relevance: 1.0,
            stored_experience: 0,
          },
          update: {
            progress: Math.min(xp, 100),
            internal_progress: xp,
            state: xp >= 100 ? 'available' : 'locked',
          },
        });
        console.log(`    ✅ UserAbilityState создан/обновлен`);
      }

      console.log('\n✨ Исправление завершено!');
      console.log('\n📊 Итог:');
      console.log(`  - Узлов в AbilityNode: ${minimalTree.nodes.length}`);
      console.log(`  - Узлов с XP: ${Object.keys(nodeXP).length}`);
      console.log(`  - TreeSemantic: обновлен`);
      
      return;
    }

    console.log('✅ Seed файл найден, используем полное дерево');
    // TODO: обработка полного seed файла

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminTree();
