import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin' }, { telegramUsername: 'admin' }] },
  });

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log(`✅ User: ${user.id}\n`);

  // 1. AbilityNode
  const nodes = await prisma.abilityNode.count();
  console.log(`📊 AbilityNode count: ${nodes}`);

  // 2. UserAbilityState
  const states = await prisma.userAbilityState.findMany({
    where: { user_id: user.id },
  });
  console.log(`\n🎯 UserAbilityState records: ${states.length}`);
  states.forEach((s) => {
    console.log(`  ${s.node_id}: state=${s.state}, progress=${s.progress}, internal=${s.internal_progress}`);
  });

  // 3. TreeSemantic
  const tree = await prisma.treeSemantic.findUnique({
    where: { userId: user.id },
  });
  const treeData = tree?.data as any;
  console.log(`\n🌳 TreeSemantic: ${tree ? 'exists' : 'missing'}`);
  if (tree) {
    console.log(`   Nodes in tree: ${treeData?.nodes?.length || 0}`);
  }

  // 4. ChangeLogs
  const logs = await prisma.changeLog.findMany({
    where: { userId: user.id, scope: 'ability' },
    orderBy: { created_at: 'desc' },
    take: 3,
  });
  console.log(`\n📜 Recent ChangeLogs: ${logs.length}`);
  logs.forEach((log) => {
    console.log(`  ${log.created_at}: ${log.action} - ${log.rationale}`);
  });

  await prisma.$disconnect();
}

debug();
