/**
 * Финальная проверка профиля пользователя
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalCheck() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: {
        quests: true,
        entries: true,
        treeSemantic: true,
        sessions: { take: 5 },
        evidence: { take: 5 },
      },
    });

    if (!user) {
      console.error('❌ Пользователь не найден!');
      return;
    }

    console.log('📊 ФИНАЛЬНАЯ СТАТИСТИКА ПРОФИЛЯ:\n');
    console.log(`👤 Пользователь: ${user.telegramUsername} (${user.role})`);
    console.log(`📋 Квесты: ${user.quests.length}`);
    console.log(`   - Завершено: ${user.quests.filter(q => q.status === 'done').length}`);
    console.log(`   - Активных: ${user.quests.filter(q => q.status === 'active').length}`);
    console.log(`   - Отложено: ${user.quests.filter(q => q.status === 'backlog').length}`);
    console.log(`\n📝 Записи: ${user.entries.length}`);
    console.log(`📊 Сессии анализа: ${user.sessions.length}`);
    console.log(`📎 Доказательства: ${user.evidence.length}`);

    if (user.treeSemantic) {
      const tree = user.treeSemantic.data as any;
      if (tree && tree.nodes) {
        const unlocked = tree.nodes.filter((n: any) => 
          n.state === 'unlocked' || n.state === 'integrated'
        ).length;
        const available = tree.nodes.filter((n: any) => 
          n.state === 'available'
        ).length;
        const withProgress = tree.nodes.filter((n: any) => 
          (n.xp_current || 0) > 0
        ).length;

        console.log(`\n🌳 Дерево способностей:`);
        console.log(`   - Всего узлов: ${tree.nodes.length}`);
        console.log(`   - Разблокировано: ${unlocked}`);
        console.log(`   - Доступно: ${available}`);
        console.log(`   - С прогрессом: ${withProgress}`);
        console.log(`   - Веток: ${tree.branches?.length || 0}`);

        // Показываем несколько разблокированных узлов
        const unlockedNodes = tree.nodes
          .filter((n: any) => n.state === 'unlocked' || n.state === 'available')
          .slice(0, 5);
        
        if (unlockedNodes.length > 0) {
          console.log(`\n   Примеры разблокированных узлов:`);
          unlockedNodes.forEach((node: any) => {
            const progress = node.xp_required > 0 
              ? `${Math.round((node.xp_current || 0) / node.xp_required * 100)}%`
              : '100%';
            console.log(`     • ${node.name} (${node.state}, ${progress})`);
          });
        }
      }
    }

    console.log(`\n✨ Профиль готов к использованию!`);
    console.log(`\n💡 Откройте веб-интерфейс и обновите страницу, чтобы увидеть:`);
    console.log(`   - Дерево способностей с разблокированными узлами`);
    console.log(`   - Завершенные квесты`);
    console.log(`   - Записи о вашей работе`);
    console.log(`   - Сессии анализа`);
    console.log(`   - Доказательства применения способностей`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });

