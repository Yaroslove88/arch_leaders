#!/usr/bin/env ts-node
/**
 * Скрипт для добавления базовых промптов в prompt_registry
 * 
 * Промпты:
 * 1. analysis_situation - анализ управленческих ситуаций
 * 2. quest_theory - генерация теории и примеров для квестов
 * 
 * Использование:
 *   npm run script:seed-prompts
 *   или
 *   tsx src/scripts/seed-prompts.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env файл
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
  } catch {
    // Игнорируем ошибки загрузки .env
  }
}

const prisma = new PrismaClient();

const prompts = [
  {
    prompt_id: 'analysis_situation',
    version: 1,
    status: 'active',
    purpose: 'extract',
    template: `Проанализируй управленческую ситуацию и извлеки структурированные данные.

Ситуация:
{{entry.text}}

Участники: {{entry.participants}}
Контекст: {{entry.context_json}}

Извлеки:
1. **Темы** - повторяющиеся мотивы (массив строк)
2. **Паттерны** - поведенческие паттерны лидера (массив строк)
3. **Напряжения** - конфликты, противоречия (массив строк)
4. **Способности** - проявленные архитектурные способности (массив объектов с node_id и signal)
5. **Инсайты** - важные наблюдения (массив объектов с title и description)
6. **Фокус** - зоны для внимания (массив объектов с area и priority)

Верни JSON в формате:
{
  "summary": "краткая сводка ситуации",
  "themes": ["тема1", "тема2"],
  "patterns": ["паттерн1", "паттерн2"],
  "tensions": ["напряжение1"],
  "ability_signals": [{"node_id": "node_id", "signal": "описание"}],
  "insights": [{"title": "заголовок", "description": "описание"}],
  "focus": [{"area": "область", "priority": "high|medium|low"}]
}`,
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        themes: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        tensions: { type: 'array', items: { type: 'string' } },
        ability_signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              node_id: { type: 'string' },
              signal: { type: 'string' },
            },
            required: ['node_id', 'signal'],
          },
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['title', 'description'],
          },
        },
        focus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            },
            required: ['area', 'priority'],
          },
        },
      },
      required: ['summary', 'themes', 'patterns', 'tensions', 'ability_signals', 'insights', 'focus'],
    },
    description: 'Анализ управленческих ситуаций: извлечение тем, паттернов, способностей и других структурированных данных из записей пользователя',
  },
  {
    prompt_id: 'quest_theory',
    version: 1,
    status: 'active',
    purpose: 'quest_generate',
    template: `Ты — эксперт по лидерству и развитию способностей. Твоя задача — создать подробное описание теории и примеров для квеста, 
который поможет пользователю развить конкретную способность через практику.

КОНТЕКСТ КВЕСТА:
- Название: {{quest.title}}
- Описание: {{quest.description}}
- Тип: {{quest.type}} (micro/weekly/story/in-person)
- Связанные способности: {{quest.linked_nodes}}
- Шаги выполнения:
{{quest.steps}}
- Критерии успеха: {{quest.criteria}}

КОНТЕКСТ СПОСОБНОСТИ:
{{#if abilityNode}}
- Название: {{abilityNode.name}}
- Описание: {{abilityNode.full_description}}
- Практическое значение: {{abilityNode.practical_meaning}}
- Примеры: {{abilityNode.examples}}
{{/if}}

ЗАДАЧА:
Создай раздел "Подробнее" (теория и примеры) для этого квеста. Раздел должен включать:

1. **Теоретическое объяснение способности**
   - Что это за способность и почему она важна для лидерства
   - Как она связана с другими способностями
   - Какое место занимает в развитии лидера

2. **Что это значит на практике**
   - Конкретное объяснение, как эта способность проявляется в реальных ситуациях
   - Что нужно делать, а чего избегать
   - Какие ошибки часто делают при развитии этой способности

3. **Конкретные примеры применения**
   - 2-3 реальных примера ситуаций, где можно применить эту способность
   - Примеры того, как это выглядит "хорошо" и "плохо"
   - Примеры из разных контекстов (работа, команда, личное развитие)

4. **Практические советы**
   - Как начать практиковать эту способность
   - С чего начать, если это новая способность
   - Как заметить прогресс
   - Что делать, если не получается

5. **Как интегрировать в ежедневную практику**
   - Как сделать эту способность частью своей практики
   - Когда и где можно практиковать
   - Как отслеживать применение

СТИЛЬ:
- Пиши на русском языке
- Используй простой, понятный язык
- Будь конкретным, избегай абстракций
- Используй примеры из реальной практики лидерства
- Структурируй текст с помощью заголовков (##, ###) и списков
- Общий объем: 800-1200 слов

ФОРМАТ ВЫВОДА:
Верни текст в формате Markdown, готовый для отображения на странице квеста. 
Текст должен быть структурированным и легко читаемым. Используй заголовки ## и ### для структуры.

ВАЖНО:
- Фокус на практическом применении, а не на теории
- Примеры должны быть релевантными для реальных ситуаций лидерства
- Текст должен мотивировать к действию
- Учитывай тип квеста (micro квесты требуют более конкретных примеров, story квесты — более глубокого объяснения)`,
    schema: {
      type: 'string',
      description: 'Текст теории и примеров для квеста (800-1200 слов)',
    },
    description: 'Генерация теории и примеров для квестов: подробное объяснение способности, практические советы и примеры применения',
  },
];

async function seedPrompts() {
  console.log('🌱 Начало добавления промптов в prompt_registry...\n');

  for (const promptData of prompts) {
    try {
      // Проверяем, существует ли уже этот промпт с такой версией
      const existing = await prisma.promptRegistry.findUnique({
        where: {
          prompt_id_version: {
            prompt_id: promptData.prompt_id,
            version: promptData.version,
          },
        },
      });

      if (existing) {
        console.log(`⚠️  Промпт ${promptData.prompt_id} v${promptData.version} уже существует, пропускаем`);
        continue;
      }

      // Создаём промпт
      const prompt = await prisma.promptRegistry.create({
        data: {
          prompt_id: promptData.prompt_id,
          version: promptData.version,
          status: promptData.status,
          purpose: promptData.purpose,
          template: promptData.template,
          schema: promptData.schema as any,
          created_by_admin: 'system',
        },
      });

      console.log(`✅ Создан промпт: ${prompt.prompt_id} v${prompt.version} (${prompt.status})`);
      console.log(`   Purpose: ${prompt.purpose}`);
      console.log(`   Описание: ${promptData.description}\n`);
    } catch (error: any) {
      console.error(`❌ Ошибка при создании промпта ${promptData.prompt_id}:`, error.message);
    }
  }

  console.log('✅ Завершено добавление промптов');
  await prisma.$disconnect();
}

// Запуск скрипта
seedPrompts()
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });
