import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const userId = '91500418-d30d-49f3-9af0-0f881d90333b';

async function createTreeSemantic() {
  console.log('🌳 Creating TreeSemantic for admin...\n');

  // 1. Check if tree_main exists
  const mainTree = await prisma.treeSemantic.findUnique({
    where: { id: 'tree_main' },
  });
  console.log(`tree_main: ${mainTree ? 'EXISTS' : 'NOT FOUND'}`);

  // 2. Load seed file
  const seedPath = path.resolve(__dirname, '../packages/shared/src/seed/initial-ability-tree.json');
  console.log(`Seed path: ${seedPath}`);
  
  let seedData: any;
  try {
    const content = fs.readFileSync(seedPath, 'utf-8');
    seedData = JSON.parse(content);
    console.log(`✅ Seed loaded: ${seedData.nodes?.length || 0} nodes`);
  } catch (e) {
    console.log('❌ Seed file not found, creating minimal tree...');
    // Create minimal tree structure
    seedData = {
      tree_id: 'default',
      semantic_version: '1.0.0',
      tree_revision: 1,
      branches: [
        { branch_id: 'branch_subjectivity', name: 'Субъектность', description: 'Внутренняя устойчивость', color: '#3A6F8F', icon: '🌱' },
        { branch_id: 'branch_architectural_thinking', name: 'Архитектурное мышление', description: 'Мышление формами', color: '#6F8F3A', icon: '🏗️' },
        { branch_id: 'branch_responsibility', name: 'Ответственность', description: 'Связь и принятие', color: '#8F3A6F', icon: '🔗' },
        { branch_id: 'branch_resilience', name: 'Устойчивость', description: 'Восстановление', color: '#3A8F6F', icon: '💪' },
        { branch_id: 'branch_maturity_environment', name: 'Среда зрелости', description: 'Создание условий', color: '#8F6F3A', icon: '🌍' },
        { branch_id: 'branch_feedback', name: 'Обратная связь', description: 'Развитие через связь', color: '#6F3A8F', icon: '🔄' },
      ],
      nodes: [],
      edges: [],
    };
  }

  // 3. Get UserAbilityStates for admin
  const states = await prisma.userAbilityState.findMany({
    where: { user_id: userId },
  });
  console.log(`\n📊 UserAbilityStates: ${states.length}`);

  // 4. Get AbilityNodes from DB
  const abilityNodes = await prisma.abilityNode.findMany();
  console.log(`🎯 AbilityNodes: ${abilityNodes.length}`);

  // 5. Build nodes for tree
  const treeNodes = abilityNodes.map((node) => {
    const state = states.find((s) => s.node_id === node.id);
    return {
      node_id: node.id,
      name: node.title,
      description: node.description,
      branch_id: node.branch,
      tier: node.level === 'basic' ? 'basic' : node.level === 'mid' ? 'intermediate' : 'advanced',
      state: state?.state || 'locked',
      unlock_conditions: null,
      integration_level: 'Novice',
      development_type: 'practice',
      xp_required: 100, // default
      xp_current: state ? Number(state.internal_progress) : 0,
    };
  });

  // Merge with seed nodes (keep seed structure, update states)
  if (seedData.nodes?.length > 0) {
    seedData.nodes = seedData.nodes.map((seedNode: any) => {
      const state = states.find((s) => s.node_id === seedNode.node_id);
      if (state) {
        return {
          ...seedNode,
          state: state.state,
          xp_current: Number(state.internal_progress),
        };
      }
      return seedNode;
    });
    console.log(`\n📝 Using seed nodes with updated states`);
  } else {
    seedData.nodes = treeNodes;
    console.log(`\n📝 Using DB nodes`);
  }

  console.log(`   Nodes in tree: ${seedData.nodes.length}`);

  // 6. Create or update TreeSemantic
  try {
    await prisma.treeSemantic.upsert({
      where: { userId },
      create: {
        id: `tree_user_${userId}`,
        userId,
        semantic_version: seedData.semantic_version || '1.0.0',
        tree_revision: seedData.tree_revision || 1,
        data: seedData,
      },
      update: {
        data: seedData,
        tree_revision: { increment: 1 },
      },
    });
    console.log(`\n✅ TreeSemantic created/updated!`);
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
  }

  // 7. Verify
  const verify = await prisma.treeSemantic.findUnique({
    where: { userId },
  });
  if (verify) {
    const data = verify.data as any;
    console.log(`\n🎉 Verification:`);
    console.log(`   Tree exists: YES`);
    console.log(`   Nodes: ${data.nodes?.length || 0}`);
    
    const grounding = data.nodes?.find((n: any) => n.node_id === 'node_grounding_point');
    if (grounding) {
      console.log(`   Точка опоры: state=${grounding.state}, xp=${grounding.xp_current}`);
    }
  }

  await prisma.$disconnect();
}

createTreeSemantic();
