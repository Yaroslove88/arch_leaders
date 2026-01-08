/**
 * Скрипт для инициализации профиля пользователя на основе данных проекта
 * Заполняет: дерево способностей, начальные квесты, примеры записей
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  steps: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  criteria: {
    type: string;
    target?: number;
    description: string;
  };
  reward?: {
    xp?: number;
    skill_xp?: number;
    skill_node?: string;
  };
  linked_nodes: string[];
  tags: string[];
  estimated_duration_days?: number;
}

async function initializeUserProfile() {
  try {
    console.log('🚀 Начало инициализации профиля пользователя...\n');

    // 1. Найти пользователя admin
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
    });

    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      console.log('💡 Создайте пользователя admin через скрипт create-admin.ts');
      return;
    }

    console.log(`✅ Найден пользователь: ${user.telegramUsername} (${user.id})\n`);

    // 2. Создать начальное дерево способностей из seed файла
    console.log('🌳 Создание дерева способностей...');
    
    const existingTree = await prisma.treeSemantic.findUnique({
      where: { userId: user.id },
    });

    if (existingTree) {
      // Проверяем, есть ли данные в дереве
      const treeData = existingTree.data as any;
      if (!treeData || !treeData.branches || treeData.branches.length === 0) {
        console.log('⚠️  Дерево существует, но пустое. Обновляем структуру...');
        // Загружаем структуру дерева из seed файла
        const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
        const seedTreeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

        await prisma.treeSemantic.update({
          where: { userId: user.id },
          data: {
            semantic_version: seedTreeData.semantic_version || '1.0.0',
            tree_revision: seedTreeData.tree_revision || 1,
            data: seedTreeData as any,
          },
        });

        console.log(`✅ Дерево способностей обновлено:`);
        console.log(`   - Веток: ${seedTreeData.branches?.length || 0}`);
        console.log(`   - Узлов: ${seedTreeData.nodes?.length || 0}`);
        console.log(`   - Связей: ${seedTreeData.edges?.length || 0}\n`);
      } else {
        console.log('⚠️  Дерево способностей уже существует и заполнено, пропускаем создание');
      }
    } else {
      // Загружаем структуру дерева из seed файла
      const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
      const treeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

      await prisma.treeSemantic.create({
        data: {
          userId: user.id,
          semantic_version: treeData.semantic_version || '1.0.0',
          tree_revision: treeData.tree_revision || 1,
          data: treeData as any,
        },
      });

      console.log(`✅ Дерево способностей создано:`);
      console.log(`   - Веток: ${treeData.branches?.length || 0}`);
      console.log(`   - Узлов: ${treeData.nodes?.length || 0}`);
      console.log(`   - Связей: ${treeData.edges?.length || 0}\n`);
    }

    // 3. Создать начальные квесты
    console.log('📋 Создание начальных квестов...');
    
    const questTemplatesPath = path.join(__dirname, '../data/quest-templates.json');
    const questTemplatesData = JSON.parse(fs.readFileSync(questTemplatesPath, 'utf-8'));
    const questTemplates = questTemplatesData.quest_templates as QuestTemplate[];

    // Создаем начальные квесты разных типов (по одному каждого типа)
    const questsByType = new Map<string, QuestTemplate>();
    for (const template of questTemplates) {
      if (!questsByType.has(template.type)) {
        questsByType.set(template.type, template);
      }
    }

    let createdQuests = 0;
    for (const template of questsByType.values()) {
      const existingQuest = await prisma.quest.findFirst({
        where: {
          userId: user.id,
          title: template.title,
        },
      });

      if (!existingQuest) {
        await prisma.quest.create({
          data: {
            userId: user.id,
            title: template.title,
            description: template.description,
            type: template.type,
            status: 'backlog',
            steps_json: template.steps as any,
            criteria_json: template.criteria as any,
            reward_json: template.reward as any,
            linked_nodes: template.linked_nodes,
            tags: template.tags,
            source: 'initial_setup',
          },
        });
        createdQuests++;
      }
    }

    console.log(`✅ Создано квестов: ${createdQuests}\n`);

    // 4. Создать примеры записей (entries) на основе информации из проекта
    console.log('📝 Создание примеров записей...');

    const exampleEntries = [
      {
        type: 'situation',
        text: 'Работа над проектом "Архитектор лидерства" - создание системы для развития лидерских способностей через архитектурное мышление. Нужно было принять решение о структуре данных, архитектуре системы, балансе между сложностью и простотой использования.',
        source: 'web',
        tags: ['проект', 'архитектура', 'решение', 'системное мышление'],
        context_json: {
          participants: ['команда разработки'],
          meeting: 'планирование архитектуры',
          decision: 'выбор структуры данных и подходов',
          result: 'создана система с деревом способностей, квестами и доказательствами',
        },
      },
      {
        type: 'reflection',
        text: 'Размышляю о том, как я работаю с продуктовыми процессами и симулякрами. Заметил паттерн: склонен создавать сложные структуры и модели, но иногда теряю фокус на практическом применении. Важно балансировать между глубиной понимания и простотой реализации.',
        source: 'web',
        tags: ['рефлексия', 'продуктовые процессы', 'баланс', 'саморегуляция'],
      },
      {
        type: 'situation',
        text: 'Работа с документацией проекта - нужно было структурировать большое количество информации о продуктовых процессах, JTBD, OBSM, симулякрах. Применил системное мышление, чтобы создать навигационную структуру и связи между документами.',
        source: 'web',
        tags: ['документация', 'системное мышление', 'структурирование', 'навигация'],
        context_json: {
          participants: [],
          task: 'структурирование документации',
          approach: 'системное мышление и архитектурный подход',
        },
      },
      {
        type: 'reflection',
        text: 'Заметил, что при работе с ИИ-агентами и промптами склонен к перфекционизму - хочется создать идеальную систему, но это замедляет практическое применение. Нужно больше практиковать итеративный подход: создать базовую версию, протестировать, улучшить.',
        source: 'web',
        tags: ['рефлексия', 'итеративность', 'перфекционизм', 'практика'],
      },
      {
        type: 'situation',
        text: 'Создание админ-панели и системы аутентификации для проекта. Столкнулся с проблемами dependency injection в NestJS. Применил системный подход: разобрал проблему по шагам, проверил зависимости, добавил логирование, нашел решение через явную инъекцию.',
        source: 'web',
        tags: ['разработка', 'проблема', 'решение', 'системный подход'],
        context_json: {
          participants: [],
          problem: 'dependency injection в NestJS',
          solution: 'явная инъекция через @Inject()',
          learning: 'важность понимания порядка инициализации модулей',
        },
      },
    ];

    let createdEntries = 0;
    for (const entryData of exampleEntries) {
      const existingEntry = await prisma.entry.findFirst({
        where: {
          userId: user.id,
          text: entryData.text.substring(0, 100),
        },
      });

      if (!existingEntry) {
        await prisma.entry.create({
          data: {
            userId: user.id,
            ...entryData,
            participants: entryData.context_json?.participants || [],
            context_json: entryData.context_json || {},
          },
        });
        createdEntries++;
      }
    }

    console.log(`✅ Создано записей: ${createdEntries}\n`);

    console.log('✨ Инициализация профиля завершена успешно!');
    console.log('\n📊 Итоги:');
    console.log(`   - Пользователь: ${user.telegramUsername}`);
    console.log(`   - Дерево способностей: ${existingTree ? 'уже существует' : 'создано'}`);
    console.log(`   - Квесты: ${createdQuests} новых`);
    console.log(`   - Записи: ${createdEntries} новых`);
    console.log('\n💡 Теперь вы можете:');
    console.log('   1. Открыть веб-интерфейс и просмотреть свой профиль');
    console.log('   2. Просмотреть дерево способностей');
    console.log('   3. Начать выполнение квестов');
    console.log('   4. Добавить новые записи о ситуациях');

  } catch (error) {
    console.error('❌ Ошибка при инициализации:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск скрипта
initializeUserProfile()
  .then(() => {
    console.log('\n✅ Скрипт выполнен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка выполнения скрипта:', error);
    process.exit(1);
  });

