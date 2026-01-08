/**
 * Скрипт для создания реального прогресса пользователя
 * Разблокирует узлы, завершает квесты, создает сессии и доказательства
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createUserProgress() {
  try {
    console.log('🚀 Создание прогресса пользователя...\n');

    // 1. Найти пользователя
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: {
        treeSemantic: true,
        quests: true,
        entries: true,
      },
    });

    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      return;
    }

    console.log(`✅ Пользователь: ${user.telegramUsername}\n`);

    // 2. Обновить дерево способностей - разблокировать базовые узлы и добавить прогресс
    if (user.treeSemantic) {
      console.log('🌳 Обновление дерева способностей...');
      const tree = user.treeSemantic.data as any;
      
      if (tree && tree.nodes) {
        // Разблокируем базовые узлы в каждой ветке
        const basicNodesToUnlock = [
          'node_grounding_point', // Субъектность
          'node_architecture_coupling', // Архитектурное мышление
          'node_personal_resilience', // Устойчивость
          'node_responsibility_as_form', // Ответственность
          'node_feedback_types', // Обратная связь
          'node_maturity_environment', // Среда зрелости
        ];

        // Узлы с прогрессом (частично прокачанные)
        const nodesWithProgress = [
          { id: 'node_self_regulation', xp: 50, state: 'available' },
          { id: 'node_system_thinking', xp: 80, state: 'available' },
          { id: 'node_containment', xp: 30, state: 'available' },
        ];

        // Узлы полностью разблокированные
        const unlockedNodes = [
          { id: 'node_grounding_point', xp: 100, state: 'unlocked' },
          { id: 'node_architecture_coupling', xp: 100, state: 'unlocked' },
        ];

        let basicUnlocked = 0;
        let progressUpdated = 0;
        let fullyUnlocked = 0;

        for (const node of tree.nodes) {
          // Полностью разблокируем некоторые узлы (приоритет выше)
          const unlockedNode = unlockedNodes.find(n => n.id === node.node_id);
          if (unlockedNode) {
            node.state = unlockedNode.state;
            node.xp_current = unlockedNode.xp;
            node.integration_level = 'Novice';
            fullyUnlocked++;
            continue;
          }

          // Добавляем прогресс к узлам
          const progressNode = nodesWithProgress.find(n => n.id === node.node_id);
          if (progressNode) {
            node.state = progressNode.state;
            node.xp_current = progressNode.xp;
            progressUpdated++;
            continue;
          }

          // Разблокируем базовые узлы
          if (basicNodesToUnlock.includes(node.node_id)) {
            node.state = 'available';
            node.xp_current = 0;
            basicUnlocked++;
          }
        }

        await prisma.treeSemantic.update({
          where: { userId: user.id },
          data: {
            data: tree as any,
            tree_revision: (user.treeSemantic.tree_revision || 0) + 1,
          },
        });

        console.log(`✅ Обновлено узлов: ${basicUnlocked + progressUpdated + fullyUnlocked}`);
        console.log(`   - Разблокировано базовых: ${basicUnlocked}`);
        console.log(`   - С прогрессом: ${progressUpdated}`);
        console.log(`   - Полностью разблокировано: ${fullyUnlocked}\n`);
      }
    }

    // 3. Завершить несколько квестов
    console.log('📋 Завершение квестов...');
    const questsToComplete = user.quests
      .filter(q => q.status === 'active' || q.status === 'backlog')
      .slice(0, 3);

    let completedQuests = 0;
    for (const quest of questsToComplete) {
      await prisma.quest.update({
        where: { id: quest.id },
        data: {
          status: 'done',
          completed_at: new Date(),
        },
      });
      completedQuests++;
    }
    console.log(`✅ Завершено квестов: ${completedQuests}\n`);

    // 4. Создать сессии анализа для записей
    console.log('📊 Создание сессий анализа...');
    const entriesWithoutSessions = user.entries.filter(e => {
      // Проверяем, есть ли уже сессия для этой записи
      return true; // Упрощенно - создадим для всех
    }).slice(0, 5);

    let createdSessions = 0;
    for (const entry of entriesWithoutSessions) {
      // Проверяем, нет ли уже сессии
      const existingSession = await prisma.session.findUnique({
        where: { entry_id: entry.id },
      });

      if (!existingSession) {
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            entry_id: entry.id,
            summary: `Анализ ситуации: ${entry.text.substring(0, 200)}...`,
            insights_json: [
              {
                type: 'pattern',
                title: 'Системное мышление',
                description: 'Применение системного подхода к решению задач',
              },
              {
                type: 'ability',
                title: 'Архитектурное мышление',
                description: 'Создание структуры и форм для эффективной работы',
              },
            ],
            focus_json: [
              {
                area: 'Развитие способностей',
                priority: 'high',
              },
            ],
            themes: ['системное мышление', 'архитектура', 'развитие'],
            patterns: ['структурирование', 'анализ', 'планирование'],
            tensions: [],
            ability_signals_json: [
              {
                node_id: 'node_system_thinking',
                signal: 'positive',
                strength: 0.7,
                evidence: entry.text.substring(0, 100),
              },
              {
                node_id: 'node_architecture_coupling',
                signal: 'positive',
                strength: 0.6,
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

    // 5. Создать доказательства (Evidence)
    console.log('📝 Создание доказательств...');
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      take: 3,
    });

    let createdEvidence = 0;
    for (const session of sessions) {
      const abilitySignals = session.ability_signals_json as any[];
      if (abilitySignals && abilitySignals.length > 0) {
        for (const signal of abilitySignals.slice(0, 2)) {
          const existingEvidence = await prisma.evidence.findFirst({
            where: {
              userId: user.id,
              ability_node_id: signal.node_id,
              session_id: session.id,
            },
          });

          if (!existingEvidence) {
            await prisma.evidence.create({
              data: {
                userId: user.id,
                type: 'situation',
                text: signal.evidence || 'Доказательство применения способности',
                ability_node_id: signal.node_id,
                session_id: session.id,
                tags: ['автоматически создано', 'прогресс'],
              },
            });
            createdEvidence++;
          }
        }
      }
    }
    console.log(`✅ Создано доказательств: ${createdEvidence}\n`);

    // 6. Связать квесты с сессиями
    console.log('🔗 Связывание квестов с сессиями...');
    const activeQuests = await prisma.quest.findMany({
      where: {
        userId: user.id,
        status: 'active',
      },
      take: 2,
    });

    if (activeQuests.length > 0 && sessions.length > 0) {
      for (const quest of activeQuests.slice(0, 2)) {
        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            session_id: sessions[0].id,
          },
        });
      }
      console.log(`✅ Связано квестов: ${Math.min(activeQuests.length, 2)}\n`);
    }

    console.log('✨ Прогресс пользователя создан успешно!');
    console.log('\n📊 Итоги:');
    console.log(`   - Завершено квестов: ${completedQuests}`);
    console.log(`   - Создано сессий: ${createdSessions}`);
    console.log(`   - Создано доказательств: ${createdEvidence}`);

  } catch (error) {
    console.error('❌ Ошибка при создании прогресса:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUserProgress()
  .then(() => {
    console.log('\n✅ Скрипт выполнен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });

