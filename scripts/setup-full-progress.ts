/**
 * Полная настройка прогресса пользователя: дерево + узлы + квесты + сессии
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function setupFullProgress() {
  try {
    console.log('🚀 Полная настройка прогресса пользователя...\n');

    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
    });

    if (!user) {
      console.error('❌ Пользователь не найден!');
      return;
    }

    // 1. Удаляем старое дерево и создаем новое
    console.log('🌳 Создание дерева способностей...');
    await prisma.treeSemantic.deleteMany({
      where: { userId: user.id },
    });

    const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
    const seedTreeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

    // Обновляем узлы перед сохранением
    const basicNodesToUnlock = [
      'node_grounding_point',
      'node_architecture_coupling',
      'node_personal_resilience',
      'node_responsibility_as_form',
      'node_feedback_types',
      'node_maturity_environment',
    ];

    const nodesWithProgress = [
      { id: 'node_self_regulation', xp: 50, state: 'available' },
      { id: 'node_system_thinking', xp: 80, state: 'available' },
      { id: 'node_containment', xp: 30, state: 'available' },
    ];

    const unlockedNodes = [
      { id: 'node_grounding_point', xp: 100, state: 'unlocked' },
      { id: 'node_architecture_coupling', xp: 100, state: 'unlocked' },
    ];

    let basicUnlocked = 0;
    let progressUpdated = 0;
    let fullyUnlocked = 0;

    for (const node of seedTreeData.nodes) {
      const unlockedNode = unlockedNodes.find(n => n.id === node.node_id);
      if (unlockedNode) {
        node.state = unlockedNode.state;
        node.xp_current = unlockedNode.xp;
        node.integration_level = 'Novice';
        fullyUnlocked++;
        continue;
      }

      const progressNode = nodesWithProgress.find(n => n.id === node.node_id);
      if (progressNode) {
        node.state = progressNode.state;
        node.xp_current = progressNode.xp;
        progressUpdated++;
        continue;
      }

      if (basicNodesToUnlock.includes(node.node_id)) {
        node.state = 'available';
        node.xp_current = 0;
        basicUnlocked++;
      }
    }

    const tree = await prisma.treeSemantic.create({
      data: {
        userId: user.id,
        semantic_version: seedTreeData.semantic_version || '1.0.0',
        tree_revision: seedTreeData.tree_revision || 1,
        data: seedTreeData,
      },
    });

    console.log(`✅ Дерево создано:`);
    console.log(`   - Веток: ${seedTreeData.branches.length}`);
    console.log(`   - Узлов: ${seedTreeData.nodes.length}`);
    console.log(`   - Разблокировано базовых: ${basicUnlocked}`);
    console.log(`   - С прогрессом: ${progressUpdated}`);
    console.log(`   - Полностью разблокировано: ${fullyUnlocked}\n`);

    // 2. Завершаем квесты
    console.log('📋 Завершение квестов...');
    const quests = await prisma.quest.findMany({
      where: {
        userId: user.id,
        status: { in: ['active', 'backlog'] },
      },
      take: 3,
    });

    for (const quest of quests) {
      await prisma.quest.update({
        where: { id: quest.id },
        data: {
          status: 'done',
          completed_at: new Date(),
        },
      });
    }
    console.log(`✅ Завершено квестов: ${quests.length}\n`);

    // 3. Создаем сессии для записей
    console.log('📊 Создание сессий анализа...');
    const entries = await prisma.entry.findMany({
      where: { userId: user.id },
      take: 5,
    });

    let createdSessions = 0;
    for (const entry of entries) {
      const existing = await prisma.session.findUnique({
        where: { entry_id: entry.id },
      });

      if (!existing) {
        await prisma.session.create({
          data: {
            userId: user.id,
            entry_id: entry.id,
            summary: `Анализ: ${entry.text.substring(0, 200)}...`,
            insights_json: [
              {
                type: 'pattern',
                title: 'Системное мышление',
                description: 'Применение системного подхода',
              },
            ],
            focus_json: [{ area: 'Развитие', priority: 'high' }],
            themes: ['развитие', 'рефлексия'],
            patterns: ['анализ'],
            tensions: [],
            ability_signals_json: [
              {
                node_id: 'node_system_thinking',
                signal: 'positive',
                strength: 0.7,
                evidence: entry.text.substring(0, 100),
              },
            ],
            status: 'done',
            analyzed_at: new Date(),
          },
        });
        createdSessions++;
      }
    }
    console.log(`✅ Создано сессий: ${createdSessions}\n`);

    console.log('✨ Прогресс настроен успешно!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupFullProgress()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

