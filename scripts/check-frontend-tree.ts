import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTree() {
  const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

  // 1. TreeSemantic data
  const tree = await prisma.treeSemantic.findUnique({
    where: { userId },
  });

  console.log('🌳 TreeSemantic:');
  if (tree) {
    const data = tree.data as any;
    console.log(`  Exists: YES`);
    console.log(`  Has nodes: ${data?.nodes ? 'YES (' + data.nodes.length + ')' : 'NO'}`);
    
    // Найти node_grounding_point
    if (data?.nodes) {
      const grounding = data.nodes.find((n: any) => 
        n.id === 'node_grounding_point' || 
        n.title === 'Точка опоры' ||
        n.id?.includes('grounding')
      );
      
      if (grounding) {
        console.log(`\n  📍 Точка опоры в TreeSemantic:`);
        console.log(`    id: ${grounding.id}`);
        console.log(`    state: ${grounding.state}`);
        console.log(`    xp_current: ${grounding.xp_current}`);
        console.log(`    progress: ${grounding.progress}`);
      } else {
        console.log(`\n  ❌ Точка опоры NOT FOUND in tree nodes`);
        console.log(`  First 3 node IDs:`);
        data.nodes.slice(0, 3).forEach((n: any) => {
          console.log(`    - ${n.id}: ${n.title}`);
        });
      }
    }
  } else {
    console.log('  ❌ TreeSemantic NOT FOUND');
  }

  // 2. UserAbilityState  
  console.log('\n📊 UserAbilityState:');
  const states = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });
  console.log(`  Records: ${states.length}`);
  states.forEach((s) => {
    console.log(`    ${s.node_id}: progress=${s.progress}, internal=${s.internal_progress}, state=${s.state}`);
  });

  // 3. AbilityNodes
  console.log('\n🎯 AbilityNodes:');
  const nodes = await prisma.abilityNode.findMany();
  console.log(`  Records: ${nodes.length}`);
  nodes.slice(0, 3).forEach((n) => {
    console.log(`    ${n.id}: ${n.title}`);
  });

  await prisma.$disconnect();
}

checkTree();
