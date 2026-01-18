import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

// XP required по умолчанию для каждого tier
const tierXP: Record<string, number> = {
  basic: 100,
  intermediate: 200,
  advanced: 300,
  master: 500,
};

async function fixXPRequired() {
  console.log('🔧 Fixing xp_required in TreeSemantic...\n');

  const tree = await prisma.treeSemantic.findUnique({
    where: { userId },
  });

  if (!tree) {
    console.log('❌ TreeSemantic not found');
    process.exit(1);
  }

  const data = tree.data as any;
  let fixed = 0;

  // Fix each node
  data.nodes = data.nodes.map((node: any) => {
    if (!node.xp_required || node.xp_required === 0) {
      const xpRequired = tierXP[node.tier] || 100;
      fixed++;
      return { ...node, xp_required: xpRequired };
    }
    return node;
  });

  console.log(`Fixed ${fixed} nodes with missing xp_required`);

  // Update database
  await prisma.treeSemantic.update({
    where: { userId },
    data: {
      data: data,
      tree_revision: { increment: 1 },
    },
  });

  console.log('✅ TreeSemantic updated!\n');

  // Verify specific nodes
  const nodesWithXP = data.nodes.filter((n: any) => n.xp_current > 0);
  console.log('📊 Nodes with XP:');
  nodesWithXP.forEach((n: any) => {
    const progress = Math.round((n.xp_current / n.xp_required) * 100);
    console.log(`  ${n.name}: ${n.xp_current}/${n.xp_required} = ${progress}%`);
  });

  await prisma.$disconnect();
}

fixXPRequired();
