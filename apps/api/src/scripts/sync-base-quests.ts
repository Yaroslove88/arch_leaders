import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  steps: Array<{ order: number; title: string | null; description: string }>;
  criteria: {
    type: string;
    items?: string[];
    theory_and_examples?: string;
  };
  reward: {
    xp?: number;
    skill_xp?: number;
    nodes?: Record<string, number>;
  };
  linked_nodes: string[];
  tags: string[];
}

async function syncBaseQuests() {
  console.log('Читаю quest-templates.json...');
  
  const templatesPath = path.join(__dirname, '../../../../data/quest-templates.json');
  const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
  const templates: QuestTemplate[] = templatesData.quest_templates || [];
  
  console.log(`Найдено ${templates.length} шаблонов квестов\n`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const template of templates) {
    try {
      const title = template.title.trim();
      
      // Ищем существующий квест по title
      const existing = await prisma.quest.findFirst({
        where: { title: title }
      });
      
      const questData = {
        title: title,
        description: template.description.trim(),
        type: template.type,
        steps_json: template.steps || [],
        criteria_json: template.criteria || {},
        reward_json: template.reward || {},
        linked_nodes: template.linked_nodes || [],
        tags: template.tags || [],
        status: 'backlog' as const,
        source: 'base_template' as const,
      };
      
      if (existing) {
        // ⚠️ ЗАЩИТА: Обновляем только базовые квесты (source='base_template')
        // Не перезаписываем пользовательские квесты (source='user_generated' или 'auto_generated')
        if (existing.source && existing.source !== 'base_template') {
          console.log(`⚠ Пропущен (пользовательский квест): ${title} (source=${existing.source})`);
          skipped++;
          continue;
        }
        
        // Обновляем только базовый квест
        await prisma.quest.update({
          where: { id: existing.id },
          data: questData
        });
        updated++;
        console.log(`✓ Обновлен: ${title}`);
      } else {
        // Создаем новый (нужен userId, используем системный или первый найденный)
        const firstUser = await prisma.user.findFirst();
        if (!firstUser) {
          console.log(`✗ Пропущен ${title}: нет пользователей в системе`);
          errors++;
          continue;
        }
        
        await prisma.quest.create({
          data: {
            ...questData,
            userId: firstUser.id,
            // Добавляем пометку что это базовый квест
            source: 'base_template',
          }
        });
        created++;
        console.log(`+ Создан: ${title}`);
      }
    } catch (error: any) {
      errors++;
      console.log(`✗ Ошибка при обработке "${template.title}": ${error.message}`);
    }
  }
  
  console.log(`\n[SUCCESS] Синхронизация завершена!`);
  console.log(`  Создано: ${created}`);
  console.log(`  Обновлено: ${updated}`);
  console.log(`  Пропущено (пользовательские): ${skipped}`);
  console.log(`  Ошибок: ${errors}`);
}

syncBaseQuests()
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

