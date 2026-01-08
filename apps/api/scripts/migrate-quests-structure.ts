/**
 * Миграция структуры квестов
 * 
 * Обновляет существующие квесты в базе данных, применяя реструктуризацию:
 * - Разделяет description на краткое описание, шаги, критерии
 * - Интегрирует теорию из quest-theories-mapping.json
 * - Удаляет дублирование и мусорные данные
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Загружаем теории
// Путь относительно корня проекта
const projectRoot = path.resolve(__dirname, '../../..');
const theoriesPath = path.join(projectRoot, 'data/quest-theories-mapping.json');
const theories = JSON.parse(fs.readFileSync(theoriesPath, 'utf-8'));

// Функции парсинга (аналогичные restructure-quest-templates.py)
function parseDescription(description: string): {
  short_description: string;
  steps: Array<{ order: number; title: string | null; description: string }>;
  criteria_items: string[];
  theory_text: string | null;
} {
  if (!description) {
    return {
      short_description: '',
      steps: [],
      criteria_items: [],
      theory_text: null,
    };
  }

  // Ищем теорию
  const theoryMatch = description.match(/Подробнее\s*\(теория\s*и\s*примеры\)\s*:?\s*\n(.+)$/is);
  const theoryText = theoryMatch ? theoryMatch[1].trim() : null;

  // Удаляем теорию из description
  let cleanDescription = description;
  if (theoryMatch) {
    cleanDescription = description.substring(0, theoryMatch.index).trim();
  }

  // Извлекаем краткое описание
  const stepsMatch = cleanDescription.match(/\n\s*Шаги\s*:\s*\n/i);
  const prepMatch = cleanDescription.match(/\n\s*Подготовка\s*:\s*\n/i);

  let shortDescription: string;
  let remaining: string;

  if (stepsMatch) {
    shortDescription = cleanDescription.substring(0, stepsMatch.index).trim();
    remaining = cleanDescription.substring(stepsMatch.index + stepsMatch[0].length).trim();
  } else if (prepMatch) {
    shortDescription = cleanDescription.substring(0, prepMatch.index).trim();
    remaining = cleanDescription.substring(prepMatch.index).trim();
  } else {
    shortDescription = cleanDescription;
    remaining = '';
  }

  // Извлекаем шаги
  const steps: Array<{ order: number; title: string | null; description: string }> = [];

  if (remaining) {
    // Для структурированных квестов (Подготовка/Встреча/После встречи)
    if (remaining.includes('Подготовка:') || remaining.includes('Встреча:') || remaining.includes('После встречи:')) {
      let stepOrder = 1;

      // Подготовка
      const prepMatch = remaining.match(/Подготовка\s*:\s*\n(.+?)(?=\n\s*Встреча|$)/is);
      if (prepMatch) {
        const prepText = prepMatch[1].trim();
        const prepItems = [...prepText.matchAll(/^(\d+)\.\s+(.+?)(?=^\d+\.|^[-•]|$)/gim)];
        
        if (prepItems.length > 0) {
          for (const item of prepItems) {
            const itemText = item[2].trim();
            if (itemText.length > 3) {
              steps.push({
                order: stepOrder++,
                title: 'Подготовка',
                description: itemText,
              });
            }
          }
        } else if (prepText.length > 3) {
          steps.push({
            order: stepOrder++,
            title: 'Подготовка',
            description: prepText,
          });
        }
      }

      // Встреча
      const meetingMatch = remaining.match(/Встреча\s*:\s*\n(.+?)(?=\n\s*После встречи|$)/is);
      if (meetingMatch) {
        const meetingText = meetingMatch[1].trim();
        const meetingItems = [...meetingText.matchAll(/^[-•]\s+(.+?)(?=^[-•]|$)/gim)];
        
        if (meetingItems.length > 0) {
          for (const item of meetingItems) {
            const itemText = item[1].trim();
            if (itemText.length > 3) {
              steps.push({
                order: stepOrder++,
                title: 'Встреча',
                description: itemText,
              });
            }
          }
        } else if (meetingText.length > 3) {
          steps.push({
            order: stepOrder++,
            title: 'Встреча',
            description: meetingText,
          });
        }
      }

      // После встречи
      const afterMatch = remaining.match(/После встречи\s*:\s*\n(.+?)(?=\n\s*Критерии|$)/is);
      if (afterMatch) {
        const afterText = afterMatch[1].trim();
        const afterItems = [...afterText.matchAll(/^(\d+)\.\s+(.+?)(?=^\d+\.|^[-•]|$)/gim)];
        
        if (afterItems.length > 0) {
          for (const item of afterItems) {
            const itemText = item[2].trim();
            if (itemText.length > 3) {
              steps.push({
                order: stepOrder++,
                title: 'После встречи',
                description: itemText,
              });
            }
          }
        } else if (afterText.length > 3) {
          steps.push({
            order: stepOrder++,
            title: 'После встречи',
            description: afterText,
          });
        }
      }
    } else {
      // Обычный формат с нумерованными шагами
      const stepMatches = [...remaining.matchAll(/^(\d+)\.\s+(.+?)(?=^\d+\.|^Критерии|^Награда|^Связанные|^Условия|$)/gims)];
      for (const match of stepMatches) {
        const stepNum = parseInt(match[1]);
        const stepText = match[2].trim();
        if (stepText.length > 3) {
          steps.push({
            order: stepNum,
            title: null,
            description: stepText,
          });
        }
      }
    }
  }

  // Извлекаем критерии
  const criteriaItems: string[] = [];
  const criteriaMatch = remaining.match(/\n\s*Критерии\s*:\s*\n(.+?)(?=\n\s*Награда|$)/is);
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1].trim();
    for (const line of criteriaText.split('\n')) {
      const trimmed = line.trim();
      if ((trimmed.startsWith('-') || trimmed.startsWith('•')) && trimmed.length > 3) {
        const item = trimmed.replace(/^[-•]\s*/, '').trim();
        if (item.length > 3) {
          criteriaItems.push(item);
        }
      }
    }
  }

  return {
    short_description: shortDescription,
    steps,
    criteria_items: criteriaItems,
    theory_text: theoryText,
  };
}

function findTheoryForQuest(
  title: string,
  linkedNodes: string[],
  theories: any[]
): string | null {
  // Ищем по точному совпадению названия
  for (const theoryItem of theories) {
    if (theoryItem.title === title) {
      return theoryItem.theory;
    }
  }

  // Ищем по linkedNodes
  if (linkedNodes && linkedNodes.length > 0) {
    for (const theoryItem of theories) {
      const theoryNodes = theoryItem.linkedNodes || [];
      if (theoryNodes.some((node: string) => linkedNodes.includes(node))) {
        return theoryItem.theory;
      }
    }
  }

  return null;
}

async function restructureQuest(quest: any): Promise<any> {
  const parsed = parseDescription(quest.description);

  // Получаем текущие данные
  const currentSteps = (quest.steps_json as any[]) || [];
  const currentCriteria = (quest.criteria_json as any) || { type: 'custom' };
  const currentReward = quest.reward_json as any;
  const linkedNodes = quest.linked_nodes || [];

  // Обновляем описание - делаем более подробным
  let newDescription = parsed.short_description || quest.description;
  
  // Если описание короткое, добавляем информацию о связанных способностях
  if (newDescription.length < 150 && linkedNodes.length > 0) {
    const nodeNames = linkedNodes.map((nodeId: string) => {
      // Простое извлечение названия из nodeId (node_stress_tolerance -> "толерантность к стрессу")
      const name = nodeId.replace(/^node_/, '').replace(/_/g, ' ');
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    if (nodeNames.length > 0) {
      newDescription += ` Этот квест направлен на развитие способности "${nodeNames[0]}".`;
    }
  }

  // Обновляем шаги
  let newSteps = parsed.steps;
  if (newSteps.length === 0 && currentSteps.length > 0) {
    // Очищаем мусорные шаги
    newSteps = currentSteps
      .filter((step: any) => {
        const desc = (step.description || step.text || '').trim();
        const title = (step.title || '').trim();
        return (
          (desc && desc.length > 3 && !/^[А-Я]$/.test(desc)) ||
          (title && title.length > 3 && !/^[А-Я]$/.test(title))
        );
      })
      .map((step: any, idx: number) => ({
        order: step.order || idx + 1,
        title: (step.title || null) && (step.title || '').trim().length > 3 ? step.title : null,
        description: (step.description || step.text || '').trim(),
      }));
  }

  // Обновляем критерии
  const newCriteria: any = {
    type: currentCriteria.type || 'custom',
  };

  if (parsed.criteria_items.length > 0) {
    newCriteria.items = parsed.criteria_items;
  } else if (currentCriteria.items && Array.isArray(currentCriteria.items)) {
    newCriteria.items = currentCriteria.items.filter(
      (item: any) => typeof item === 'string' && item.trim().length > 3
    );
  }

  // Очищаем мусорное описание критериев
  if (currentCriteria.description) {
    const trimmed = String(currentCriteria.description).trim();
    if (trimmed.length > 3 && !/^[А-Я]$/.test(trimmed)) {
      if (!newCriteria.items || newCriteria.items.length === 0) {
        newCriteria.description = trimmed;
      }
    }
  }

  // Добавляем теорию
  let theory = parsed.theory_text;
  if (!theory) {
    theory = findTheoryForQuest(quest.title, linkedNodes, theories);
  }

  if (theory) {
    newCriteria.theory_and_examples = theory;
  } else if (currentCriteria.theory_and_examples) {
    // Сохраняем существующую теорию, если она есть
    newCriteria.theory_and_examples = currentCriteria.theory_and_examples;
  }

  return {
    description: newDescription,
    steps: newSteps,
    criteria: newCriteria,
    reward: currentReward,
    linked_nodes: linkedNodes,
  };
}

async function main() {
  console.log('🔄 Начало миграции структуры квестов...\n');

  try {
    // Загружаем все квесты
    const quests = await prisma.quest.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        steps_json: true,
        criteria_json: true,
        reward_json: true,
        linked_nodes: true,
      },
    });

    console.log(`📋 Найдено квестов: ${quests.length}\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const quest of quests) {
      try {
        // Пропускаем квесты, которые уже имеют правильную структуру
        const criteria = quest.criteria_json as any;
        const hasTheory = criteria?.theory_and_examples;
        const steps = (quest.steps_json as any[]) || [];
        const hasValidSteps = steps.some(
          (s: any) => s.description && s.description.length > 3
        );
        const criteriaItems = criteria?.items;

        // Если уже структурирован - пропускаем
        if (
          hasTheory &&
          (hasValidSteps || steps.length === 0) &&
          (criteriaItems || !criteria?.description || criteria.description.length > 3)
        ) {
          skipped++;
          continue;
        }

        // Реструктурируем квест
        const restructured = await restructureQuest(quest);

        // Обновляем в базе
        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            description: restructured.description,
            steps_json: restructured.steps,
            criteria_json: restructured.criteria,
            reward_json: restructured.reward,
            linked_nodes: restructured.linked_nodes,
          },
        });

        updated++;
        console.log(`✅ Обновлен: ${quest.title}`);
      } catch (error: any) {
        errors++;
        console.error(`❌ Ошибка при обработке квеста "${quest.title}":`, error.message);
      }
    }

    console.log('\n📊 Результаты миграции:');
    console.log(`   ✅ Обновлено: ${updated}`);
    console.log(`   ⏭️  Пропущено: ${skipped}`);
    console.log(`   ❌ Ошибок: ${errors}`);
    console.log(`\n✨ Миграция завершена!`);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

