/**
 * Скрипт для создания тестовых квестов
 * Запуск: ts-node scripts/create-test-quests.ts
 */

import * as http from 'http';

const API_URL = 'http://localhost:3001';

interface Quest {
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  status?: 'active' | 'backlog' | 'done' | 'archived';
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
}

const testQuests: Quest[] = [
  {
    title: 'Удержать напряжение в сложном разговоре',
    description: 'В течение дня найдите ситуацию, где возникает напряжение (конфликт, неопределенность, давление). Вместо того чтобы сразу решать или гасить, удержите это напряжение 5-10 минут, наблюдая за своими реакциями.',
    type: 'micro',
    status: 'active',
    criteria: {
      type: 'evidence',
      target: 3,
      description: 'Создана запись с описанием ситуации, описаны свои реакции и наблюдения, удалось удержать паузу минимум 5 минут',
    },
    reward: {
      xp: 100,
      skill_xp: 50,
    },
    linked_nodes: ['node_containment'],
    tags: ['test', 'containment'],
  },
  {
    title: 'Нарисовать карту системы',
    description: 'Выберите проблему или ситуацию, которую вы решаете. Нарисуйте карту всех элементов системы: люди, процессы, ресурсы, связи между ними.',
    type: 'micro',
    status: 'active',
    criteria: {
      type: 'evidence',
      target: 1,
      description: 'Создана карта с минимум 5 элементами, обозначены связи между элементами, есть описание того, что вы заметили',
    },
    reward: {
      xp: 120,
      skill_xp: 60,
    },
    linked_nodes: ['node_system_thinking'],
    tags: ['test', 'system-thinking'],
  },
  {
    title: 'Дать конструктивную обратную связь',
    description: 'Найдите ситуацию, где вы можете дать обратную связь коллеге. Используйте структуру: факт → влияние → предложение.',
    type: 'micro',
    status: 'active',
    criteria: {
      type: 'evidence',
      target: 1,
      description: 'Использована структура факт-влияние-предложение, обратная связь дана лично (не письменно), записана реакция получателя',
    },
    reward: {
      xp: 80,
      skill_xp: 40,
    },
    linked_nodes: ['node_feedback_types'],
    tags: ['test', 'feedback'],
  },
  {
    title: 'Неделя удержания позиции',
    description: 'В течение недели практикуйте удержание своей позиции в ситуациях давления, конфликтов или неопределенности.',
    type: 'weekly',
    status: 'backlog',
    criteria: {
      type: 'count',
      target: 5,
      description: 'Минимум 3 записи о ситуациях, описаны попытки удержать позицию, итоговая рефлексия с инсайтами',
    },
    reward: {
      xp: 300,
      skill_xp: 150,
    },
    linked_nodes: ['node_containment', 'node_grounding_point'],
    tags: ['test', 'weekly', 'subjectivity'],
  },
];

function makeRequest(method: string, path: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createQuests() {
  console.log('🎮 Creating test quests...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const quest of testQuests) {
    try {
      console.log(`Creating: ${quest.title}...`);
      const result = await makeRequest('POST', '/quests', quest);
      console.log(`✅ Created: ${result.title || quest.title} (ID: ${result.id?.slice(0, 8) || 'N/A'}, Status: ${result.status || 'N/A'})`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed: ${quest.title}`);
      console.error(`   Error: ${error.message || error}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
      errorCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} created, ${errorCount} errors`);

  // Проверяем все квесты
  try {
    console.log('\n🔍 Checking all quests...');
    const allQuests = await makeRequest('GET', '/quests');
    console.log(`Total quests: ${allQuests.quests?.length || 0}`);
    
    const activeQuests = await makeRequest('GET', '/quests?status=active');
    console.log(`Active quests: ${activeQuests.quests?.length || 0}`);
  } catch (error: any) {
    console.error(`Failed to check quests: ${error.message}`);
  }
}

createQuests().catch(console.error);

