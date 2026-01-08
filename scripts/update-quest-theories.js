/**
 * Скрипт для обновления теорий квестов (Node.js)
 * 
 * Использование:
 *   node scripts/update-quest-theories.js
 * 
 * Или через npm:
 *   npm run update-quest-theories
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const mappingPath = path.join(__dirname, '../data/quest-theories-mapping.json');

async function updateQuestTheories() {
  console.log(`Загрузка маппинга из ${mappingPath}...`);
  
  if (!fs.existsSync(mappingPath)) {
    console.error(`❌ Ошибка: файл ${mappingPath} не найден`);
    process.exit(1);
  }

  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  console.log(`Найдено ${mapping.length} записей для обновления\n`);

  // Проверка доступности сервера
  try {
    const healthCheck = await fetch(`${API_URL}/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.error(`❌ API сервер недоступен по адресу ${API_URL}`);
      console.error('   Убедитесь, что сервер запущен:');
      console.error('   cd apps/api && npm run dev');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Не удалось подключиться к API серверу: ${API_URL}`);
    console.error('   Убедитесь, что сервер запущен:');
    console.error('   cd apps/api && npm run dev');
    process.exit(1);
  }

  try {
    console.log(`Отправка запроса на ${API_URL}/quests/update-theories-from-mapping...`);
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
    console.error('❌ Ошибка при обновлении:', error.message);
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('   Сервер не запущен или недоступен');
      console.error('   Запустите сервер: cd apps/api && npm run dev');
    }
    process.exit(1);
  }
}

updateQuestTheories();

