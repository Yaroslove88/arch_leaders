/**
 * Скрипт для восстановления всех квестов из шаблонов
 * Запуск: ts-node scripts/restore-quests.ts [telegramUsername]
 * 
 * Этот скрипт:
 * 1. Читает шаблоны квестов из data/quest-templates.json
 * 2. Создает все квесты в базе данных для указанного пользователя
 * 3. Добавляет теории из data/quest-theories-mapping.json
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  steps?: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  criteria: {
    type: 'evidence' | 'count' | 'streak' | 'custom';
    target?: number;
    description: string;
  };
  reward?: {
    xp?: number;
    skill_xp?: number;
    skill_node?: string;
  };
  linked_nodes: string[];
  tags?: string[];
  estimated_duration_days?: number;
}

interface TheoryMapping {
  title: string;
  linkedNodes?: string[];
  theory: string;
}

async function main() {
  const telegramUsername = process.argv[2] || 'test_user';
  
  console.log(`🎮 Восстановление квестов для пользователя: ${telegramUsername}\n`);

  // 1. Найти или создать пользователя
  let user = await prisma.user.findUnique({
    where: { telegramUsername },
  });

  if (!user) {
    console.log(`⚠️  Пользователь ${telegramUsername} не найден. Создаю нового...`);
    // Создаем тестового пользователя
    user = await prisma.user.create({
      data: {
        telegramUsername,
        email: `${telegramUsername}@example.com`,
        password: 'dummy_hash', // В реальности нужен хэш
        role: 'user',
        status: 'active',
      },
    });
    console.log(`✅ Пользователь создан: ${user.id}\n`);
  } else {
    console.log(`✅ Пользователь найден: ${user.id}\n`);
  }

  // 2. Читаем шаблоны квестов
  const templatesPath = path.join(__dirname, '../data/quest-templates.json');
  if (!fs.existsSync(templatesPath)) {
    throw new Error(`Файл шаблонов не найден: ${templatesPath}`);
  }

  const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
  const templates: QuestTemplate[] = templatesData.quest_templates || [];

  console.log(`📋 Найдено шаблонов квестов: ${templates.length}\n`);

  // 3. Читаем теории
  const theoriesPath = path.join(__dirname, '../data/quest-theories-mapping.json');
  let theories: TheoryMapping[] = [];
  if (fs.existsSync(theoriesPath)) {
    theories = JSON.parse(fs.readFileSync(theoriesPath, 'utf-8'));
    console.log(`📚 Найдено теорий: ${theories.length}\n`);
  } else {
    console.log(`⚠️  Файл теорий не найден: ${theoriesPath}\n`);
  }

  // 4. Создаем квесты
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const template of templates) {
    try {
      // Проверяем, существует ли уже такой квест
      const existing = await prisma.quest.findFirst({
        where: {
          userId: user.id,
          title: template.title,
        },
      });

      if (existing) {
        console.log(`⏭️  Квест уже существует: "${template.title}"`);
        // Обновляем, если нужно
        await prisma.quest.update({
          where: { id: existing.id },
          data: {
            description: template.description,
            type: template.type,
            steps_json: template.steps || [],
            criteria_json: template.criteria as any,
            reward_json: template.reward || null,
            linked_nodes: template.linked_nodes,
            tags: template.tags || [],
            source: 'template',
          },
        });
        updated++;
      } else {
        // Создаем новый квест
        const quest = await prisma.quest.create({
          data: {
            userId: user.id,
            title: template.title,
            description: template.description,
            type: template.type,
            status: 'backlog',
            steps_json: template.steps || [],
            criteria_json: template.criteria as any,
            reward_json: template.reward || null,
            linked_nodes: template.linked_nodes,
            evidence_links_json: [],
            tags: template.tags || [],
            source: 'template',
          },
        });
        console.log(`✅ Создан квест: "${template.title}" (ID: ${quest.id.slice(0, 8)}...)`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Ошибка при создании квеста "${template.title}":`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Результаты создания квестов:`);
  console.log(`   ✅ Создано: ${created}`);
  console.log(`   🔄 Обновлено: ${updated}`);
  console.log(`   ❌ Ошибок: ${errors}\n`);

  // 5. Добавляем теории к квестам
  if (theories.length > 0) {
    console.log(`📚 Добавление теорий к квестам...\n`);
    
    let theoriesAdded = 0;
    let theoriesNotFound = 0;

    for (const theory of theories) {
      try {
        // Ищем квесты по названию или связанным узлам
        let quests = await prisma.quest.findMany({
          where: {
            userId: user.id,
            OR: [
              {
                title: {
                  contains: theory.title,
                  mode: 'insensitive',
                },
              },
              ...(theory.linkedNodes && theory.linkedNodes.length > 0
                ? [
                    {
                      linked_nodes: {
                        hasSome: theory.linkedNodes,
                      },
                    },
                  ]
                : []),
            ],
          },
        });

        if (quests.length === 0) {
          // Пробуем найти по частичному совпадению названия
          const titleWords = theory.title.toLowerCase().split(/\s+/);
          for (const word of titleWords) {
            if (word.length > 3) {
              const found = await prisma.quest.findMany({
                where: {
                  userId: user.id,
                  title: {
                    contains: word,
                    mode: 'insensitive',
                  },
                },
              });
              if (found.length > 0) {
                quests = found;
                break;
              }
            }
          }
        }

        if (quests.length > 0) {
          for (const quest of quests) {
            const criteria = (quest.criteria_json || {}) as any;
            criteria.theory_and_examples = theory.theory;

            await prisma.quest.update({
              where: { id: quest.id },
              data: {
                criteria_json: criteria,
              },
            });
          }
          console.log(`✅ Добавлена теория к "${theory.title}" (найдено квестов: ${quests.length})`);
          theoriesAdded += quests.length;
        } else {
          console.log(`⚠️  Квест не найден для теории: "${theory.title}"`);
          theoriesNotFound++;
        }
      } catch (error: any) {
        console.error(`❌ Ошибка при добавлении теории "${theory.title}":`, error.message);
      }
    }

    console.log(`\n📊 Результаты добавления теорий:`);
    console.log(`   ✅ Добавлено теорий: ${theoriesAdded}`);
    console.log(`   ⚠️  Не найдено квестов: ${theoriesNotFound}\n`);
  }

  // 6. Итоговая статистика
  const totalQuests = await prisma.quest.count({
    where: { userId: user.id },
  });

  const questsWithTheory = await prisma.quest.findMany({
    where: {
      userId: user.id,
      criteria_json: {
        path: ['theory_and_examples'],
        not: null,
      },
    },
  });

  console.log(`\n📈 Итоговая статистика:`);
  console.log(`   📋 Всего квестов: ${totalQuests}`);
  console.log(`   📚 Квестов с теорией: ${questsWithTheory.length}`);
  console.log(`   📝 Квестов без теории: ${totalQuests - questsWithTheory.length}\n`);

  console.log(`✨ Восстановление квестов завершено!\n`);
}

main()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

