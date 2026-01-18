/**
 * Диагностика состояния тестового пользователя
 *
 * Использование:
 *   cd apps/api
 *   npx tsx ../../scripts/diagnose-testuser.ts [username]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseUser(username: string) {
  console.log(`\n🔍 Диагностика пользователя "${username}"\n`);
  console.log('='.repeat(60) + '\n');

  // 1. Найти пользователя
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: username },
        { telegramUsername: username },
      ],
    },
    include: {
      treeSemantic: true,
    },
  });

  if (!user) {
    console.log(`❌ Пользователь "${username}" НЕ НАЙДЕН!\n`);
    console.log('Решение: Создайте пользователя через регистрацию или скрипт create-admin-user.ts\n');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ ПОЛЬЗОВАТЕЛЬ НАЙДЕН:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.telegramUsername || 'не задан'}`);
  console.log(`   Email: ${user.email || 'не задан'}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status || 'active'}`);
  console.log(`   Created: ${user.created_at}\n`);

  // 2. Проверяем TreeSemantic
  console.log('📊 ДЕРЕВО СПОСОБНОСТЕЙ (TreeSemantic):');
  if (user.treeSemantic) {
    const tree = user.treeSemantic.data as any;
    console.log(`   ✅ Дерево существует`);
    console.log(`      - ID: ${user.treeSemantic.id}`);
    console.log(`      - Version: ${user.treeSemantic.semantic_version || 'не указана'}`);
    console.log(`      - Revision: ${user.treeSemantic.tree_revision || 'не указана'}`);
    console.log(`      - Branches: ${tree?.branches?.length || 0}`);
    console.log(`      - Nodes: ${tree?.nodes?.length || 0}`);

    // Проверяем структуру узлов
    if (tree?.nodes && tree.nodes.length > 0) {
      const sampleNode = tree.nodes[0];
      console.log(`\n   📋 Пример узла (первый):`);
      console.log(`      - node_id: ${sampleNode.node_id}`);
      console.log(`      - name: ${sampleNode.name || 'НЕ ЗАДАНО'}`);
      console.log(`      - state: ${sampleNode.state || 'НЕ ЗАДАНО'}`);
      console.log(`      - tier: ${sampleNode.tier || 'НЕ ЗАДАНО'}`);

      // Проверяем язык названий
      const hasRussianNames = tree.nodes.some((n: any) => n.name && /[а-яА-ЯёЁ]/.test(n.name));
      const hasEnglishNames = tree.nodes.some((n: any) => n.name && /^[a-zA-Z_]+$/.test(n.name));

      console.log(`\n   🌐 Язык названий:`);
      console.log(`      - Есть русские названия: ${hasRussianNames ? '✅ Да' : '❌ Нет'}`);
      console.log(`      - Есть английские ID как названия: ${hasEnglishNames ? '⚠️ Да (проблема!)' : '✅ Нет'}`);

      // Проверяем состояния узлов
      const states = {
        available: 0,
        locked: 0,
        unlocked: 0,
        integrated: 0,
        undefined: 0,
      };
      tree.nodes.forEach((n: any) => {
        const s = n.state || 'undefined';
        states[s as keyof typeof states] = (states[s as keyof typeof states] || 0) + 1;
      });

      console.log(`\n   📈 Состояния узлов:`);
      Object.entries(states).forEach(([state, count]) => {
        if (count > 0) console.log(`      - ${state}: ${count}`);
      });
    }
  } else {
    console.log(`   ❌ Дерево НЕ НАЙДЕНО`);
    console.log('   Решение: При следующем запросе /tree/semantic дерево будет создано из seed\n');
  }

  // 3. Проверяем UserAbilityState
  console.log('\n📊 СОСТОЯНИЕ СПОСОБНОСТЕЙ (UserAbilityState):');
  const abilityStates = await prisma.userAbilityState.findMany({
    where: { user_id: user.id },
    take: 5,
  });
  const totalAbilityStates = await prisma.userAbilityState.count({
    where: { user_id: user.id },
  });

  if (totalAbilityStates === 0) {
    console.log(`   ❌ Записей UserAbilityState: 0`);
    console.log('   ⚠️ ПРОБЛЕМА: Без UserAbilityState все узлы будут показаны как locked');
    console.log('   Решение: Выполните скрипт create-all-nodes.ts или check-and-fix-node-states.ts\n');
  } else {
    console.log(`   ✅ Записей UserAbilityState: ${totalAbilityStates}`);

    // Статистика по состояниям
    const stateStats = await prisma.userAbilityState.groupBy({
      by: ['state'],
      where: { user_id: user.id },
      _count: { state: true },
    });

    console.log(`   📊 Статистика по состояниям:`);
    stateStats.forEach((s) => {
      console.log(`      - ${s.state}: ${s._count.state}`);
    });

    console.log(`\n   📋 Примеры записей (первые 5):`);
    abilityStates.forEach((s) => {
      console.log(`      - ${s.node_id}: state=${s.state}, xp=${s.xp_current}/${s.xp_required}`);
    });
  }

  // 4. Проверяем квесты
  console.log('\n📊 КВЕСТЫ:');
  const questStats = await prisma.quest.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { status: true },
  });
  const totalQuests = await prisma.quest.count({
    where: { userId: user.id },
  });

  if (totalQuests === 0) {
    console.log(`   ❌ Квестов у пользователя: 0`);
    console.log('   ⚠️ ПРОБЛЕМА: Пользователь не видит никаких квестов');
    console.log('   Решение: Выполните скрипт create-base-quests-for-all-users.ts\n');
  } else {
    console.log(`   ✅ Всего квестов: ${totalQuests}`);
    questStats.forEach((s) => {
      console.log(`      - ${s.status}: ${s._count.status}`);
    });

    // Проверяем базовые квесты
    const baseQuests = await prisma.quest.count({
      where: { userId: user.id, source: 'base_template' },
    });
    console.log(`\n   📋 Базовых квестов (source=base_template): ${baseQuests}`);
  }

  // 5. Проверяем глобальную статистику активных квестов
  console.log('\n📊 ГЛОБАЛЬНАЯ СТАТИСТИКА АКТИВНЫХ КВЕСТОВ:');
  const globalActiveCount = await prisma.quest.count({
    where: { status: 'active' },
  });
  const userActiveCount = await prisma.quest.count({
    where: { status: 'active', userId: user.id },
  });
  console.log(`   - Всего активных квестов в системе: ${globalActiveCount}`);
  console.log(`   - Активных квестов у ${username}: ${userActiveCount}`);

  if (globalActiveCount >= 5 && globalActiveCount !== userActiveCount) {
    console.log('   ⚠️ ПРОБЛЕМА: Есть баг с глобальным лимитом квестов (исправлен выше)');
  }

  // 6. Проверяем CaseProgress
  console.log('\n📊 ПРОГРЕСС ПО КЕЙСАМ:');
  const caseProgress = await prisma.caseProgress.count({
    where: { user_id: user.id },
  });
  console.log(`   Записей CaseProgress: ${caseProgress}`);

  // Итоговые рекомендации
  console.log('\n' + '='.repeat(60));
  console.log('📋 ДИАГНОСТИКА ЗАВЕРШЕНА\n');

  const issues: string[] = [];

  if (!user.treeSemantic) {
    issues.push('❌ Нет TreeSemantic - дерево не инициализировано');
  }
  if (totalAbilityStates === 0) {
    issues.push('❌ Нет UserAbilityState - узлы не инициализированы');
  }
  if (totalQuests === 0) {
    issues.push('❌ Нет квестов - базовые квесты не созданы');
  }

  if (issues.length === 0) {
    console.log('✅ Все основные данные присутствуют!\n');
    console.log('Если проблема с отображением сохраняется, проверьте:');
    console.log('1. Кэш браузера (очистите или откройте в инкогнито)');
    console.log('2. Токен авторизации (перелогиньтесь)');
    console.log('3. Логи API при загрузке /tree/semantic\n');
  } else {
    console.log('⚠️ НАЙДЕНЫ ПРОБЛЕМЫ:\n');
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    console.log('\n📋 РЕКОМЕНДУЕМЫЕ ДЕЙСТВИЯ:');
    console.log('   1. cd apps/api');
    console.log('   2. npx tsx ../../scripts/create-base-quests-for-all-users.ts');
    console.log('   3. npx tsx ../../scripts/check-and-fix-node-states.ts');
    console.log('   4. Или полный сброс: npx tsx ../../scripts/reset-test-user.ts testuser\n');
  }

  await prisma.$disconnect();
}

// Get username from command line or use default
const username = process.argv[2] || 'testuser';

diagnoseUser(username).catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
