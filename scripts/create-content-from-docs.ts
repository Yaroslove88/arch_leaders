/**
 * Скрипт для создания контента на основе документов пользователя
 * Извлекает информацию из папок: Продуктовые процессы, Маркетинг и коммуникация, Лидерство
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Ключевые темы и способности, связанные с работой
const abilityMapping = {
  'системное мышление': 'node_system_thinking',
  'архитектурное мышление': 'node_architecture_coupling',
  'сценарное мышление': 'node_scenario_thinking',
  'сборка форм': 'node_form_assembly',
  'контейнирование': 'node_containment',
  'точка опоры': 'node_grounding_point',
  'саморегуляция': 'node_self_regulation',
  'различение ролей': 'node_role_differentiation',
  'разбор сценария': 'node_scenario_analysis',
  'субъект в системе': 'node_subject_in_system',
  'авторство решений': 'node_decision_authorship',
  'обратная связь': 'node_feedback_types',
  'ответственность': 'node_responsibility_as_form',
  'делегирование': 'node_delegation_as_coupling',
  'среда зрелости': 'node_maturity_environment',
  'передача субъектности': 'node_subjectivity_transfer',
};

async function createContentFromDocs() {
  try {
    console.log('🚀 Создание контента на основе документов...\n');

    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
    });

    if (!user) {
      console.error('❌ Пользователь не найден!');
      return;
    }

    // 1. Создаем записи на основе работы над продуктовыми процессами
    console.log('📝 Создание записей о продуктовых процессах...');
    
    const productEntries = [
      {
        type: 'situation',
        text: 'Работа над систематизацией процесса Discovery to Delivery. Создал структуру досок (Backlog Board и Delivery Board), определил этапы от Intake до Release. Ключевой инсайт: разделение "мышления" (Discovery) и "делания" (Delivery) позволяет команде работать эффективнее. Применил системное мышление для структурирования процесса.',
        source: 'web',
        tags: ['продуктовые процессы', 'discovery to delivery', 'системное мышление', 'архитектура процессов'],
        context_json: {
          participants: ['команда продуктов', 'разработчики'],
          project: 'систематизация процессов',
          result: 'создана структура процесса с четкими этапами и переходами',
        },
      },
      {
        type: 'situation',
        text: 'Разработка методологии OBSM (Open Behavioral Systems Model) для сегментации и создания симулякров покупателей. Интегрировал BSM, Advanced JTBD, факт-карты в единую систему. Столкнулся с вызовом: как сделать модель открытой системой, способной к адаптации, а не просто суммой элементов. Применил архитектурное мышление для создания целостной модели.',
        source: 'web',
        tags: ['obsm', 'сегментация', 'симулякры', 'методология', 'архитектурное мышление'],
        context_json: {
          participants: ['команда маркетинга', 'исследователи'],
          project: 'разработка методологии OBSM',
          challenge: 'создание открытой системы, а не суммы элементов',
        },
      },
      {
        type: 'reflection',
        text: 'Размышляю о работе с симулякрами. Заметил паттерн: склонен создавать сложные структуры и модели, но иногда теряю фокус на практическом применении. Важно балансировать между глубиной понимания и простотой реализации. Нужно больше практиковать итеративный подход: создать базовую версию, протестировать, улучшить.',
        source: 'web',
        tags: ['рефлексия', 'симулякры', 'баланс', 'итеративность', 'саморегуляция'],
      },
      {
        type: 'situation',
        text: 'Работа над системой ранжирования для оценки качества бизнеса. Нужно было определить показатели, которые влияют на качество, и базовые показатели. Применил системное мышление: разложил проблему на уровни, определил зависимости между показателями. Важно было не утонуть в деталях, а создать работающую систему.',
        source: 'web',
        tags: ['система ранжирования', 'метрики', 'системное мышление', 'принятие решений'],
        context_json: {
          participants: ['команда аналитики'],
          project: 'система ранжирования',
          approach: 'системное мышление и декомпозиция',
        },
      },
      {
        type: 'situation',
        text: 'Создание курса "Архитектурное лидерство". Ключевая идея: переход от управленца к архитектору сцепок, создателю среды, носителю зрелости. Столкнулся с вызовом: как передать не набор приемов, а смену рамки мышления. Применил контейнирование: удержал напряжение между "простое объяснение" и "глубина понимания".',
        source: 'web',
        tags: ['лидерство', 'архитектурное лидерство', 'курс', 'контейнирование', 'передача субъектности'],
        context_json: {
          participants: ['участники курса'],
          project: 'курс архитектурного лидерства',
          challenge: 'передача смены рамки мышления, а не приемов',
        },
      },
      {
        type: 'reflection',
        text: 'Заметил паттерн в своей работе: склонен к перфекционизму при создании методологий и систем. Хочется создать идеальную систему, но это замедляет практическое применение. Важно больше практиковать итеративность: создать базовую версию, протестировать в реальных условиях, улучшить на основе обратной связи.',
        source: 'web',
        tags: ['рефлексия', 'перфекционизм', 'итеративность', 'практика', 'когнитивная зрелость'],
      },
      {
        type: 'situation',
        text: 'Работа над JTBD (Jobs to be Done) для e-commerce мебели. Нужно было описать сегменты покупателей, их задачи, барьеры и триггеры. Применил сценарное мышление: создал несколько сценариев развития ситуации для разных сегментов. Важно было не просто описать, а создать инструмент для принятия решений.',
        source: 'web',
        tags: ['jtbd', 'сегментация', 'e-commerce', 'сценарное мышление', 'принятие решений'],
        context_json: {
          participants: ['команда продуктов', 'маркетинг'],
          project: 'JTBD для e-commerce',
          approach: 'сценарное мышление и системный подход',
        },
      },
      {
        type: 'situation',
        text: 'Структурирование большого объема документации по продуктовым процессам, маркетингу и лидерству. Создал навигационную структуру, связал документы между собой. Применил архитектурное мышление: создал форму (структуру), которая работает сама, без постоянного вмешательства. Документация стала инструментом, а не просто хранилищем информации.',
        source: 'web',
        tags: ['документация', 'структурирование', 'архитектурное мышление', 'мышление через форму'],
        context_json: {
          participants: [],
          project: 'структурирование документации',
          result: 'создана работающая навигационная структура',
        },
      },
      {
        type: 'reflection',
        text: 'Размышляю о своей роли как лидера. Заметил, что иногда склонен брать на себя слишком много операционных задач, вместо того чтобы создавать формы и структуры, которые работают сами. Нужно больше практиковать "освобождение лидера": возвращать зоны ответственности команде, освобождать пространство для архитектурной функции.',
        source: 'web',
        tags: ['рефлексия', 'лидерство', 'освобождение лидера', 'делегирование', 'архитектурная функция'],
      },
      {
        type: 'situation',
        text: 'Работа над системой приоритизации задач в продуктовой команде. Создал систему кластеров и приоритетов (P0-P3), которая позволяет команде принимать решения быстрее. Применил сборку форм: собрал разные элементы (задачи, приоритеты, кластеры) в единую форму, которая работает. Важно было сохранить различия (не все задачи одинаковы), но собрать их в целое.',
        source: 'web',
        tags: ['приоритизация', 'кластеры', 'сборка форм', 'принятие решений', 'команда'],
        context_json: {
          participants: ['продуктовая команда'],
          project: 'система приоритизации',
          approach: 'сборка форм и системное мышление',
        },
      },
    ];

    let createdEntries = 0;
    for (const entryData of productEntries) {
      const existing = await prisma.entry.findFirst({
        where: {
          userId: user.id,
          text: entryData.text.substring(0, 100),
        },
      });

      if (!existing) {
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

    // 2. Создаем сессии анализа для новых записей
    console.log('📊 Создание сессий анализа...');
    const newEntries = await prisma.entry.findMany({
      where: {
        userId: user.id,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // За последние 24 часа
        },
      },
      take: 10,
    });

    let createdSessions = 0;
    for (const entry of newEntries) {
      const existing = await prisma.session.findUnique({
        where: { entry_id: entry.id },
      });

      if (!existing) {
        // Определяем связанные способности по тегам
        const linkedAbilities: string[] = [];
        for (const tag of entry.tags) {
          const ability = abilityMapping[tag.toLowerCase()];
          if (ability) {
            linkedAbilities.push(ability);
          }
        }

        // Если не нашли по тегам, используем общие
        if (linkedAbilities.length === 0) {
          if (entry.text.includes('систем') || entry.text.includes('архитектур')) {
            linkedAbilities.push('node_system_thinking', 'node_architecture_coupling');
          }
          if (entry.text.includes('лидер') || entry.text.includes('команда')) {
            linkedAbilities.push('node_responsibility_as_form', 'node_delegation_as_coupling');
          }
          if (entry.text.includes('рефлексия') || entry.text.includes('размышляю')) {
            linkedAbilities.push('node_self_regulation', 'node_scenario_analysis');
          }
        }

        const abilitySignals = linkedAbilities.map(nodeId => ({
          node_id: nodeId,
          signal: 'positive',
          strength: 0.7,
          evidence: entry.text.substring(0, 150),
        }));

        await prisma.session.create({
          data: {
            userId: user.id,
            entry_id: entry.id,
            summary: `Анализ: ${entry.text.substring(0, 200)}...`,
            insights_json: [
              {
                type: 'pattern',
                title: 'Системное мышление в работе',
                description: 'Регулярное применение системного подхода к структурированию процессов и созданию методологий',
              },
              {
                type: 'ability',
                title: 'Архитектурное мышление',
                description: 'Создание форм и структур, которые работают самостоятельно',
              },
            ],
            focus_json: [
              {
                area: 'Развитие продуктового мышления',
                priority: 'high',
              },
              {
                area: 'Архитектурное лидерство',
                priority: 'high',
              },
            ],
            themes: entry.tags.slice(0, 5),
            patterns: ['системное мышление', 'архитектурный подход', 'итеративность'],
            tensions: ['баланс между глубиной и простотой', 'перфекционизм vs практика'],
            ability_signals_json: abilitySignals,
            status: 'done',
            analyzed_at: new Date(),
          },
        });
        createdSessions++;
      }
    }
    console.log(`✅ Создано сессий: ${createdSessions}\n`);

    // 3. Обновляем прогресс по узлам на основе созданных записей
    console.log('🌳 Обновление прогресса по узлам...');
    const tree = await prisma.treeSemantic.findUnique({
      where: { userId: user.id },
    });

    if (tree) {
      const treeData = tree.data as any;
      if (treeData && treeData.nodes) {
        // Узлы, которые должны получить прогресс на основе работы
        const progressUpdates: Record<string, { xp: number; state: string }> = {
          'node_system_thinking': { xp: 150, state: 'available' },
          'node_architecture_coupling': { xp: 200, state: 'unlocked' },
          'node_scenario_thinking': { xp: 100, state: 'available' },
          'node_form_assembly': { xp: 120, state: 'available' },
          'node_containment': { xp: 80, state: 'available' },
          'node_self_regulation': { xp: 100, state: 'available' },
          'node_scenario_analysis': { xp: 90, state: 'available' },
          'node_decision_authorship': { xp: 110, state: 'available' },
          'node_responsibility_as_form': { xp: 130, state: 'available' },
          'node_delegation_as_coupling': { xp: 70, state: 'available' },
        };

        let updated = 0;
        for (const node of treeData.nodes) {
          const update = progressUpdates[node.node_id];
          if (update) {
            const oldXp = node.xp_current || 0;
            node.xp_current = Math.min((oldXp + update.xp), node.xp_required || 1000);
            if (node.xp_current >= (node.xp_required || 100)) {
              node.state = 'unlocked';
            } else if (node.state === 'locked') {
              node.state = update.state;
            }
            updated++;
          }
        }

        await prisma.treeSemantic.update({
          where: { userId: user.id },
          data: {
            data: treeData,
            tree_revision: (tree.tree_revision || 0) + 1,
          },
        });

        console.log(`✅ Обновлено узлов: ${updated}\n`);
      }
    }

    // 4. Создаем доказательства (Evidence)
    console.log('📝 Создание доказательств...');
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        status: 'done',
      },
      take: 5,
    });

    let createdEvidence = 0;
    for (const session of sessions) {
      const signals = session.ability_signals_json as any[];
      if (signals && signals.length > 0) {
        for (const signal of signals.slice(0, 2)) {
          const existing = await prisma.evidence.findFirst({
            where: {
              userId: user.id,
              ability_node_id: signal.node_id,
              session_id: session.id,
            },
          });

          if (!existing) {
            await prisma.evidence.create({
              data: {
                userId: user.id,
                type: 'situation',
                text: signal.evidence || 'Доказательство применения способности из реальной работы',
                ability_node_id: signal.node_id,
                session_id: session.id,
                tags: ['из документов', 'реальная работа'],
              },
            });
            createdEvidence++;
          }
        }
      }
    }
    console.log(`✅ Создано доказательств: ${createdEvidence}\n`);

    console.log('✨ Контент создан успешно!');
    console.log('\n📊 Итоги:');
    console.log(`   - Создано записей: ${createdEntries}`);
    console.log(`   - Создано сессий: ${createdSessions}`);
    console.log(`   - Обновлено узлов: ${Object.keys(progressUpdates).length}`);
    console.log(`   - Создано доказательств: ${createdEvidence}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Определяем progressUpdates для использования в finally
const progressUpdates: Record<string, { xp: number; state: string }> = {};

createContentFromDocs()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

