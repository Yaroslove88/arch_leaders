import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

async function verify() {
  const tree = await prisma.treeSemantic.findUnique({
    where: { userId },
  });

  if (!tree) {
    console.log('❌ TreeSemantic not found');
    process.exit(1);
  }

  const data = tree.data as any;
  console.log(`🌳 TreeSemantic nodes: ${data.nodes?.length || 0}\n`);

  // Show nodes with XP > 0
  const nodesWithXP = data.nodes?.filter((n: any) => n.xp_current > 0) || [];
  console.log(`📊 Nodes with XP > 0: ${nodesWithXP.length}`);
  nodesWithXP.forEach((n: any) => {
    console.log(`  ${n.node_id}: ${n.xp_current} XP (${n.state})`);
  });

  // Show "Точка опоры" specifically  
  const grounding = data.nodes?.find((n: any) => 
    n.node_id === 'node_grounding_point' || 
    n.name === 'Точка опоры'
  );
  console.log(`\n📍 Точка опоры:`);
  if (grounding) {
    console.log(`   node_id: ${grounding.node_id}`);
    console.log(`   name: ${grounding.name}`);
    console.log(`   state: ${grounding.state}`);
    console.log(`   xp_current: ${grounding.xp_current}`);
    console.log(`   xp_required: ${grounding.xp_required}`);
    console.log(`   branch_id: ${grounding.branch_id}`);
  } else {
    console.log('   ❌ NOT FOUND');
  }

  await prisma.$disconnect();
}

verify();
