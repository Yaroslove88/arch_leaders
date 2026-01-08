/**
 * Скрипт для извлечения всех квестов из docs/GAME_CONTENT.md
 * Создает полный список шаблонов квестов с теориями
 */

import * as fs from 'fs';
import * as path from 'path';

interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  steps: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  criteria: {
    type: 'evidence' | 'count' | 'streak' | 'custom';
    target?: number;
    description: string;
  };
  reward: {
    xp: number;
    skill_xp: number;
  };
  linked_nodes: string[];
  tags: string[];
  estimated_duration_days?: number;
  unlock_conditions?: string;
  theory?: string;
}

function extractQuests(content: string): QuestTemplate[] {
  const quests: QuestTemplate[] = [];
  
  // Регулярное выражение для поиска квестов
  // Формат: ##### Micro/Weekly/Story/In-person: Название категории
  // Затем блок кода с ``` в начале и конце
  // Используем многострочный режим и более гибкое выражение
  const questPattern = /#####\s+(Micro|Weekly|Story|In-person):\s+([^\n]+)\n```\s*\n([\s\S]*?)```/gm;
  
  let match;
  let questIndex = 0;
  
  while ((match = questPattern.exec(content)) !== null) {
    const type = match[1].toLowerCase() as 'micro' | 'weekly' | 'story' | 'in-person';
    const categoryTitle = match[2].trim();
    const questContent = match[3];
    
    questIndex++;
    
    // Парсим содержимое квеста
    const quest = parseQuestContent(type, categoryTitle, questContent, questIndex);
    if (quest) {
      quests.push(quest);
    }
  }
  
  return quests;
}

function parseQuestContent(
  type: string,
  title: string,
  content: string,
  index: number
): QuestTemplate | null {
  try {
    // Извлекаем описание
    const descriptionMatch = content.match(/Описание:\s*(.+?)(?:\n\n|$)/s);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';
    
    // Извлекаем шаги
    const steps: Array<{ order: number; title: string; description: string }> = [];
    const stepsMatch = content.match(/Шаги:\s*\n((?:\d+\.\s+.+?\n?)+)/s);
    if (stepsMatch) {
      const stepsText = stepsMatch[1];
      const stepLines = stepsText.split(/\d+\.\s+/).filter(line => line.trim());
      stepLines.forEach((step, idx) => {
        const stepParts = step.trim().split(/\n/);
        const stepTitle = stepParts[0] || `Шаг ${idx + 1}`;
        const stepDesc = stepParts.slice(1).join(' ').trim() || stepTitle;
        steps.push({
          order: idx + 1,
          title: stepTitle,
          description: stepDesc,
        });
      });
    }
    
    // Извлекаем критерии
    const criteriaMatch = content.match(/Критерии:\s*\n((?:- .+?\n?)+)/s);
    let criteriaDescription = '';
    if (criteriaMatch) {
      criteriaDescription = criteriaMatch[1]
        .split(/\n/)
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line)
        .join('. ');
    }
    
    // Определяем тип критерия
    let criteriaType: 'evidence' | 'count' | 'streak' | 'custom' = 'custom';
    let target: number | undefined;
    
    if (criteriaDescription.includes('запись') || criteriaDescription.includes('доказательство')) {
      criteriaType = 'evidence';
      const targetMatch = criteriaDescription.match(/(\d+)/);
      target = targetMatch ? parseInt(targetMatch[1]) : 1;
    } else if (criteriaDescription.includes('минимум') || criteriaDescription.includes('раз')) {
      criteriaType = 'count';
      const targetMatch = criteriaDescription.match(/(\d+)/);
      target = targetMatch ? parseInt(targetMatch[1]) : 1;
    }
    
    // Извлекаем награду
    const rewardMatch = content.match(/Награда:\s*(\d+)\s*XP[,\s]*\+(\d+)\s*к\s*"(.+?)"/);
    const xp = rewardMatch ? parseInt(rewardMatch[1]) : 100;
    const skillXp = rewardMatch ? parseInt(rewardMatch[2]) : 50;
    
    // Извлекаем связанные узлы
    const nodesMatch = content.match(/Связанные узлы:\s*(.+?)(?:\n|$)/);
    const linkedNodes: string[] = [];
    if (nodesMatch) {
      const nodesText = nodesMatch[1].trim();
      const nodeMatches = nodesText.match(/node_\w+/g);
      if (nodeMatches) {
        linkedNodes.push(...nodeMatches);
      }
    }
    
    // Извлекаем условия разблокировки
    const unlockMatch = content.match(/Условия разблокировки:\s*(.+?)(?:\n|$)/);
    const unlockConditions = unlockMatch ? unlockMatch[1].trim() : undefined;
    
    // Извлекаем теорию (раздел "Подробнее")
    const theoryMatch = content.match(/Подробнее \(теория и примеры\):\s*\n([\s\S]+?)(?=\n\n|$)/);
    const theory = theoryMatch ? theoryMatch[1].trim() : undefined;
    
    // Генерируем ID
    const id = `${type}_${title.toLowerCase().replace(/[^a-zа-я0-9]+/g, '_').substring(0, 50)}_${index}`;
    
    // Генерируем теги
    const tags: string[] = [type];
    if (linkedNodes.length > 0) {
      tags.push(...linkedNodes.map(node => node.replace('node_', '')));
    }
    
    // Оценка длительности
    let estimatedDuration: number | undefined;
    if (type === 'micro') {
      estimatedDuration = 1;
    } else if (type === 'weekly') {
      estimatedDuration = 7;
    } else if (type === 'story') {
      estimatedDuration = 28;
    } else if (type === 'in-person') {
      estimatedDuration = 3;
    }
    
    return {
      id,
      title,
      description,
      type: type as 'micro' | 'weekly' | 'story' | 'in-person',
      steps: steps.length > 0 ? steps : [
        {
          order: 1,
          title: 'Начать выполнение',
          description: description || title,
        },
      ],
      criteria: {
        type: criteriaType,
        target,
        description: criteriaDescription || 'Выполнить квест',
      },
      reward: {
        xp,
        skill_xp: skillXp,
      },
      linked_nodes: linkedNodes,
      tags,
      estimated_duration_days: estimatedDuration,
      unlock_conditions: unlockConditions,
      theory,
    };
  } catch (error) {
    console.error(`Ошибка при парсинге квеста "${title}":`, error);
    return null;
  }
}

async function main() {
  const contentPath = path.join(__dirname, '../docs/GAME_CONTENT.md');
  
  if (!fs.existsSync(contentPath)) {
    throw new Error(`Файл не найден: ${contentPath}`);
  }
  
  console.log('📖 Чтение GAME_CONTENT.md...\n');
  const content = fs.readFileSync(contentPath, 'utf-8');
  
  console.log('🔍 Извлечение квестов...\n');
  const quests = extractQuests(content);
  
  console.log(`✅ Найдено квестов: ${quests.length}\n`);
  
  // Разделяем на шаблоны и теории
  const templates: QuestTemplate[] = [];
  const theories: Array<{ title: string; linkedNodes: string[]; theory: string }> = [];
  
  quests.forEach(quest => {
    const { theory, ...template } = quest;
    templates.push(template);
    
    if (theory) {
      theories.push({
        title: quest.title,
        linkedNodes: quest.linked_nodes,
        theory,
      });
    }
  });
  
  // Сохраняем шаблоны
  const templatesPath = path.join(__dirname, '../data/quest-templates.json');
  const templatesData = {
    quest_templates: templates,
  };
  fs.writeFileSync(templatesPath, JSON.stringify(templatesData, null, 2), 'utf-8');
  console.log(`✅ Шаблоны сохранены: ${templatesPath} (${templates.length} квестов)\n`);
  
  // Сохраняем теории
  const theoriesPath = path.join(__dirname, '../data/quest-theories-mapping.json');
  fs.writeFileSync(theoriesPath, JSON.stringify(theories, null, 2), 'utf-8');
  console.log(`✅ Теории сохранены: ${theoriesPath} (${theories.length} теорий)\n`);
  
  // Статистика
  const byType = {
    micro: quests.filter(q => q.type === 'micro').length,
    weekly: quests.filter(q => q.type === 'weekly').length,
    story: quests.filter(q => q.type === 'story').length,
    'in-person': quests.filter(q => q.type === 'in-person').length,
  };
  
  console.log('📊 Статистика:');
  console.log(`   Micro: ${byType.micro}`);
  console.log(`   Weekly: ${byType.weekly}`);
  console.log(`   Story: ${byType.story}`);
  console.log(`   In-person: ${byType['in-person']}`);
  console.log(`   С теорией: ${theories.length}`);
  console.log(`   Без теории: ${quests.length - theories.length}\n`);
  
  console.log('✨ Извлечение завершено!\n');
}

main().catch(console.error);

