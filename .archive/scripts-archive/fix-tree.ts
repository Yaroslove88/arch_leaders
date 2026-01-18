/**
 * @deprecated Используйте scripts/tree-fix.ts вместо этого
 * Скрипт для исправления дерева способностей
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fixTree() {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramUsername: 'admin' },
      include: { treeSemantic: true },
    });

    if (!user) {
      console.error('❌ Пользователь admin не найден!');
      return;
    }

    // Загружаем структуру дерева из seed файла
    const seedPath = path.join(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
    const seedTreeData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

    if (user.treeSemantic) {
      console.log('🔄 Обновление существующего дерева...');
      // Убеждаемся, что данные правильно сериализуются
      const treeData = JSON.parse(JSON.stringify(seedTreeData));
      await prisma.treeSemantic.update({
        where: { userId: user.id },
        data: {
          semantic_version: seedTreeData.semantic_version || '1.0.0',
          tree_revision: (user.treeSemantic.tree_revision || 0) + 1,
          data: treeData,
        },
      });
      console.log('✅ Дерево обновлено');
      
      // Проверяем, что данные сохранились
      const updated = await prisma.treeSemantic.findUnique({
        where: { userId: user.id },
      });
      const checkData = updated?.data as any;
      console.log('   - Проверка сохранения:');
      console.log('     * Ключи:', Object.keys(checkData || {}));
      console.log('     * Веток:', checkData?.branches?.length || 0);
      console.log('     * Узлов:', checkData?.nodes?.length || 0);
    } else {
      console.log('🌳 Создание нового дерева...');
      await prisma.treeSemantic.create({
        data: {
          userId: user.id,
          semantic_version: seedTreeData.semantic_version || '1.0.0',
          tree_revision: seedTreeData.tree_revision || 1,
          data: seedTreeData as any,
        },
      });
      console.log('✅ Дерево создано');
    }

    console.log(`\n📊 Статистика дерева:`);
    console.log(`   - Веток: ${seedTreeData.branches?.length || 0}`);
    console.log(`   - Узлов: ${seedTreeData.nodes?.length || 0}`);
    console.log(`   - Связей: ${seedTreeData.edges?.length || 0}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTree()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });

