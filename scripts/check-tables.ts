import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Проверить таблицы в БД
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;

    console.log('📊 Tables in database:');
    tables.forEach((t) => console.log(`  - ${t.tablename}`));
    console.log('');

    // Проверить наличие ability_nodes
    const hasAbilityNodes = tables.some((t) => t.tablename === 'ability_nodes');
    console.log(`ability_nodes exists: ${hasAbilityNodes ? '✅' : '❌'}`);

    // Проверить наличие AbilityNode (с заглавной)
    const hasAbilityNode = tables.some((t) => t.tablename === 'AbilityNode');
    console.log(`AbilityNode exists: ${hasAbilityNode ? '✅' : '❌'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
