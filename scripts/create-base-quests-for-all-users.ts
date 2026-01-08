/**
 * Скрипт для создания базовых квестов для всех пользователей
 * Запуск: ts-node scripts/create-base-quests-for-all-users.ts
 * 
 * Этот скрипт:
 * 1. Читает шаблоны квестов из data/quest-templates.json
 * 2. Создает базовые квесты для всех существующих пользователей
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

async function createQuestsForUser(userId: string, templates: QuestTemplate[], theories: TheoryMapping[]) {
  let created = 0;
  let updated = 0;
  let theoriesAdded = 0;

  // Создаем/обновляем квесты
  for (const template of templates) {
    try {
      const existing = await prisma.quest.findFirst({
        where: {
          userId,
          title: template.title,
        },
      });

      if (existing) {
        // Обновляем существующий квест
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
            source: 'base_template',
          },
        });
        updated++;
      } else {
        // Создаем новый квест
        await prisma.quest.create({
          data: {
            userId,
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
            source: 'base_template',
          },
        });
        created++;
      }
    } catch (error: any) {
      console.error(`   ❌ Ошибка при создании квеста "${template.title}":`, error.message);
    }
  }

  // Добавляем теории
  for (const theory of theories) {
    try {
      const quests = await prisma.quest.findMany({
        where: {
          userId,
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
        theoriesAdded += quests.length;
      }
    } catch (error: any) {
      console.error(`   ❌ Ошибка при добавлении теории "${theory.title}":`, error.message);
    }
  }

  return { created, updated, theoriesAdded };
}

async function main() {
  console.log('🎮 Создание базовых квестов для всех пользователей\n');

  // 1. Читаем шаблоны
  const templatesPath = path.join(__dirname, '../data/quest-templates.json');
  if (!fs.existsSync(templatesPath)) {
    throw new Error(`Файл шаблонов не найден: ${templatesPath}`);
  }

  const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
  const templates: QuestTemplate[] = templatesData.quest_templates || [];
  console.log(`📋 Найдено шаблонов: ${templates.length}\n`);

  // 2. Читаем теории
  const theoriesPath = path.join(__dirname, '../data/quest-theories-mapping.json');
  let theories: TheoryMapping[] = [];
  if (fs.existsSync(theoriesPath)) {
    theories = JSON.parse(fs.readFileSync(theoriesPath, 'utf-8'));
    console.log(`📚 Найдено теорий: ${theories.length}\n`);
  }

  // 3. Получаем всех пользователей
  const users = await prisma.user.findMany({
    where: {
      status: 'active',
    },
  });

  console.log(`👥 Найдено пользователей: ${users.length}\n`);

  if (users.length === 0) {
    console.log('⚠️  Нет активных пользователей. Создайте пользователя сначала.\n');
    return;
  }

  // 4. Создаем квесты для каждого пользователя
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalTheoriesAdded = 0;

  for (const user of users) {
    console.log(`👤 Обработка пользователя: ${user.telegramUsername || user.email || user.id}`);
    
    const result = await createQuestsForUser(user.id, templates, theories);
    
    totalCreated += result.created;
    totalUpdated += result.updated;
    totalTheoriesAdded += result.theoriesAdded;
    
    console.log(`   ✅ Создано: ${result.created}, Обновлено: ${result.updated}, Теорий: ${result.theoriesAdded}\n`);
  }

  // 5. Итоговая статистика
  console.log('📊 Итоговая статистика:');
  console.log(`   👥 Пользователей обработано: ${users.length}`);
  console.log(`   ✅ Квестов создано: ${totalCreated}`);
  console.log(`   🔄 Квестов обновлено: ${totalUpdated}`);
  console.log(`   📚 Теорий добавлено: ${totalTheoriesAdded}\n`);

  // 6. Проверяем результат
  const totalQuests = await prisma.quest.count({
    where: {
      source: 'base_template',
    },
  });

  const questsWithTheory = await prisma.quest.count({
    where: {
      source: 'base_template',
      criteria_json: {
        path: ['theory_and_examples'],
        not: null,
      },
    },
  });

  console.log('📈 Общая статистика в базе:');
  console.log(`   📋 Всего базовых квестов: ${totalQuests}`);
  console.log(`   📚 С теорией: ${questsWithTheory}`);
  console.log(`   📝 Без теории: ${totalQuests - questsWithTheory}\n`);

  console.log('✨ Создание базовых квестов завершено!\n');
}

main()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

