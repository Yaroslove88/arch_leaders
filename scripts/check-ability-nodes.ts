import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAbilityNodes() {
  try {
    // Проверить, есть ли узлы в AbilityNode
    const nodes = await prisma.abilityNode.findMany({
      where: {
        OR: [
          { id: 'node_grounding_point' },
          { id: 'node_responsibility_as_form' },
          { id: 'node_containment' },
        ],
      },
    });

    console.log(`📊 Found ${nodes.length} ability nodes in AbilityNode table:`);
    nodes.forEach((node) => {
      console.log(`  - ${node.id}: ${node.title}`);
      console.log(`    XP Required: ${node.xp_required}`);
      console.log(`    Level: ${node.level}`);
    });
    console.log('');

    // Проверить TreeSemantic для admin
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin' },
          { telegramUsername: 'admin' },
        ],
      },
    });

    if (user) {
      const treeSemantic = await prisma.treeSemantic.findMany({
        where: { userId: user.id },
      });

      console.log(`🌳 TreeSemantic records for admin: ${treeSemantic.length}`);
      treeSemantic.forEach((tree, i) => {
        const nodes = tree.nodes_json as any;
        console.log(`  ${i + 1}. Tree: ${tree.tree_id}`);
        console.log(`     Version: ${tree.version_hash}`);
        console.log(`     Nodes count: ${nodes?.length || 0}`);
        console.log(`     Is Default: ${tree.is_default_tree}`);
        
        // Проверить node_grounding_point
        const groundingNode = nodes?.find((n: any) => n.id === 'node_grounding_point');
        if (groundingNode) {
          console.log(`     \u2705 Found node_grounding_point:`);
          console.log(`        State: ${groundingNode.state}`);
          console.log(`        XP Current: ${groundingNode.xp_current}`);
          console.log(`        XP Required: ${groundingNode.xp_required}`);
        } else {
          console.log(`     \u274c node_grounding_point not found in this tree`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAbilityNodes();
