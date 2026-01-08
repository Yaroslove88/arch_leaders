/**
 * Скрипт для обновления теорий квестов из файла маппинга
 * 
 * Использование:
 * 1. Убедитесь, что API сервер запущен
 * 2. Запустите: npx ts-node scripts/update-quest-theories.ts
 * 
 * Или через curl:
 * curl -X POST http://localhost:3001/quests/update-theories-from-mapping \
 *   -H "Content-Type: application/json" \
 *   -d @data/quest-theories-mapping.json
 */

import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function updateQuestTheories() {
  const mappingPath = path.join(__dirname, '../data/quest-theories-mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

  console.log(`Загрузка маппинга из ${mappingPath}...`);
  console.log(`Найдено ${mapping.length} записей для обновления\n`);

  try {
    const response = await fetch(`${API_URL}/quests/update-theories-from-mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mapping }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Результат обновления:');
    console.log(`   Обновлено квестов: ${result.updated}`);
    if (result.notFound && result.notFound.length > 0) {
      console.log(`   Не найдено: ${result.notFound.length}`);
      console.log(`   Список: ${result.notFound.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении:', error);
    process.exit(1);
  }
}

updateQuestTheories();

