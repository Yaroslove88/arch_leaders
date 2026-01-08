/**
 * Скрипт для начисления exp за завершенный квест "путь к зрелости"
 * 
 * Использование через API (рекомендуется):
 *   1. Убедитесь, что API сервер запущен (npm run start:dev)
 *   2. Запустите: npx ts-node scripts/award-quest-xp.ts
 * 
 * Или вручную через curl:
 *   curl -X POST http://localhost:3001/quests/{questId}/complete \
 *     -H "Authorization: Bearer YOUR_TOKEN"
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function awardQuestXP() {
  try {
    console.log('🔍 Ищу завершенный квест "путь к зрелости" через API...');
    console.log(`   API URL: ${API_URL}\n`);

    // Получаем список квестов
    const questsResponse = await fetch(`${API_URL}/quests?status=done`);
    if (!questsResponse.ok) {
      throw new Error(`Failed to fetch quests: ${questsResponse.statusText}`);
    }

    const questsData = await questsResponse.json() as any;
    const quests = questsData.quests || [];

    // Находим квест "путь к зрелости"
    const quest = quests.find((q: any) =>
      q.title?.toLowerCase().includes('путь к зрелости'),
    );

    if (!quest) {
      console.error('❌ Квест "путь к зрелости" не найден или не завершен');
      console.log('\n💡 Инструкции:');
      console.log('   1. Убедитесь, что API сервер запущен: npm run start:dev');
      console.log('   2. Завершите квест через UI или API');
      console.log('   3. Или используйте прямой вызов API:');
      console.log(`      POST ${API_URL}/quests/{questId}/complete`);
      return;
    }

    console.log(`✅ Найден квест: ${quest.id}`);
    console.log(`   Название: ${quest.title}`);
    console.log(`   Пользователь: ${quest.userId || 'не указан'}`);

    // Парсим reward
    const reward = quest.reward || {};
    const skillXp = reward.skill_xp || 200;
    const linkedNodes = quest.linked_nodes || [
      'node_system_thinking',
      'node_design_thinking',
      'node_organizational_culture',
    ];

    console.log(`\n📊 Награда:`);
    console.log(`   Skill XP: ${skillXp}`);
    console.log(`   Связанные узлы: ${linkedNodes.join(', ')}`);

    if (!quest.userId) {
      console.error('\n❌ У квеста не указан userId, невозможно начислить exp');
      return;
    }

    // Начисляем exp на каждый узел через API
    console.log(`\n🎯 Начисляю exp на узлы через API...`);
    console.log('   ⚠️  Для этого нужна авторизация. Используйте один из способов:');
    console.log('\n   1. Через UI: завершите квест еще раз (exp начислится автоматически)');
    console.log(`   2. Через API с токеном: POST ${API_URL}/tree/node/{nodeId}`);
    console.log(`      Body: { "xpDelta": ${skillXp} }`);
    console.log(`      Headers: { "Authorization": "Bearer YOUR_TOKEN" }`);

    // Показываем команды для curl
    console.log('\n   3. Через curl (замените YOUR_TOKEN и nodeId):');
    for (const nodeId of linkedNodes) {
      console.log(
        `      curl -X PATCH ${API_URL}/tree/node/${nodeId} \\`,
      );
      console.log(
        `        -H "Content-Type: application/json" \\`,
      );
      console.log(
        `        -H "Authorization: Bearer YOUR_TOKEN" \\`,
      );
      console.log(
        `        -d '{"xpDelta": ${skillXp}}'`,
      );
      console.log('');
    }

    console.log('\n💡 Или просто завершите квест через UI - exp начислится автоматически!');
    console.log('\n📝 Примечание: После исправления кода, exp теперь начисляется автоматически');
    console.log('   при завершении квеста через метод complete() в quests.service.ts');
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Убедитесь, что API сервер запущен:');
      console.error('   npm run start:dev');
    }
  }
}

awardQuestXP();
