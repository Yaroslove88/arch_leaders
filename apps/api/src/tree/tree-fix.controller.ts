import { Controller, Post, Get, Param, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('tree-fix')
export class TreeFixController {
  private readonly logger = new Logger(TreeFixController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('check/:userId')
  async checkUserTree(@Param('userId') userId: string) {
    this.logger.log(`Checking tree for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    const nodes = await this.prisma.abilityNode.count();
    const tree = await this.prisma.treeSemantic.findUnique({
      where: { userId },
    });
    const states = await this.prisma.userAbilityState.count({
      where: { user_id: userId },
    });

    const treeData = tree?.data as any;

    return {
      user: {
        id: user.id,
        email: user.email,
        telegramUsername: user.telegramUsername,
      },
      abilityNodes: nodes,
      treeExists: !!tree,
      treeNodesCount: treeData?.nodes?.length || 0,
      userAbilityStates: states,
    };
  }

  @Post('fix/:userId')
  async fixUserTree(@Param('userId') userId: string) {
    this.logger.log(`Fixing tree for user ${userId}`);

    try {
      // 1. Проверить пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { error: 'User not found' };
      }

      // 2. Создать базовые узлы в AbilityNode
      const basicNodes = [
        {
          id: 'node_grounding_point',
          title: 'Точка опоры',
          description: 'Внутренняя устойчивость. Основа субъектности.',
          branch: 'branch_subjectivity',
          level: 'basic',
          xp_required: 100,
          prerequisites: [],
        },
        {
          id: 'node_responsibility_as_form',
          title: 'Ответственность как форма',
          description: 'Способность принимать ответственность',
          branch: 'branch_responsibility',
          level: 'basic',
          xp_required: 100,
          prerequisites: [],
        },
        {
          id: 'node_containment',
          title: 'Контейнирование',
          description: 'Способность удерживать напряжение',
          branch: 'branch_subjectivity',
          level: 'mid',
          xp_required: 200,
          prerequisites: ['node_grounding_point'],
        },
        {
          id: 'node_decision_authorship',
          title: 'Авторство решений',
          description: 'Способность принимать осознанные решения',
          branch: 'branch_subjectivity',
          level: 'master',
          xp_required: 500,
          prerequisites: ['node_grounding_point', 'node_containment'],
        },
        {
          id: 'node_system_thinking',
          title: 'Системное мышление',
          description: 'Способность видеть систему в целом',
          branch: 'branch_architectural_thinking',
          level: 'mid',
          xp_required: 200,
          prerequisites: [],
        },
        {
          id: 'node_thinking_through_form',
          title: 'Мышление через форму',
          description: 'Способность работать с формами и структурами',
          branch: 'branch_architectural_thinking',
          level: 'master',
          xp_required: 500,
          prerequisites: ['node_system_thinking'],
        },
        {
          id: 'node_maturity_environment',
          title: 'Среда зрелости',
          description: 'Создание среды для развития зрелости',
          branch: 'branch_maturity_environment',
          level: 'basic',
          xp_required: 100,
          prerequisites: [],
        },
        {
          id: 'node_personal_resilience',
          title: 'Личная устойчивость',
          description: 'Способность восстанавливаться после стресса',
          branch: 'branch_resilience',
          level: 'basic',
          xp_required: 100,
          prerequisites: [],
        },
        {
          id: 'node_recovery_skills',
          title: 'Навыки восстановления',
          description: 'Конкретные техники восстановления',
          branch: 'branch_resilience',
          level: 'mid',
          xp_required: 200,
          prerequisites: ['node_personal_resilience'],
        },
        {
          id: 'node_shared_leadership',
          title: 'Разделенное лидерство',
          description: 'Распределение лидерства в команде',
          branch: 'branch_responsibility',
          level: 'advanced',
          xp_required: 300,
          prerequisites: ['node_responsibility_as_form'],
        },
        {
          id: 'node_feedback_types',
          title: 'Типы обратной связи',
          description: 'Различные виды обратной связи',
          branch: 'branch_feedback',
          level: 'basic',
          xp_required: 100,
          prerequisites: [],
        },
        {
          id: 'node_feedback_through_vulnerability',
          title: 'Обратная связь через уязвимость',
          description: 'Давать и принимать обратную связь открыто',
          branch: 'branch_feedback',
          level: 'mid',
          xp_required: 200,
          prerequisites: ['node_feedback_types'],
        },
      ];

      const errors: Array<{ node: string; error: string }> = [];
      let createdNodes = 0;
      for (const node of basicNodes) {
        try {
          await this.prisma.abilityNode.upsert({
            where: { id: node.id },
            create: node,
            update: { title: node.title, description: node.description },
          });
          createdNodes++;
          this.logger.log(`✅ Created/updated node: ${node.id}`);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          this.logger.error(`❌ Failed to create node ${node.id}: ${errorMsg}`);
          errors.push({ node: node.id, error: errorMsg });
        }
      }

      // 3. Подсчитать XP из выполненных квестов
      const completedQuests = await this.prisma.quest.findMany({
        where: {
          userId,
          status: 'done',
        },
      });

      const nodeXP: Record<string, number> = {};
      for (const quest of completedQuests) {
        const reward = quest.reward_json as any;
        // Новая система: base_xp + reflection_xp (предпочитаем новые поля)
        // Обратная совместимость: используем старые поля если новых нет
        const xp = reward?.max || (reward?.base_xp && reward?.reflection_xp ? reward.base_xp + reward.reflection_xp : reward?.skill_xp || 50);
        for (const nodeId of quest.linked_nodes || []) {
          nodeXP[nodeId] = (nodeXP[nodeId] || 0) + xp;
        }
      }

      // 4. Создать UserAbilityState для узлов с XP
      let createdStates = 0;
      for (const [nodeId, xp] of Object.entries(nodeXP)) {
        try {
          await this.prisma.userAbilityState.upsert({
            where: {
              user_id_node_id: {
                user_id: userId,
                node_id: nodeId,
              },
            },
            create: {
              user_id: userId,
              node_id: nodeId,
              state: xp >= 100 ? 'unlocked' : (xp >= 30 ? 'active' : 'available'),
              relevance: 1.0,
            },
            update: {
              state: xp >= 100 ? 'unlocked' : (xp >= 30 ? 'active' : 'available'),
            },
          });
          createdStates++;
          this.logger.log(`✅ Created/updated state for: ${nodeId} (${xp} XP)`);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          this.logger.error(`❌ Failed to create state for ${nodeId}: ${errorMsg}`);
          errors.push({ node: nodeId, error: errorMsg });
        }
      }

      return {
        success: true,
        user: { id: user.id, email: user.email },
        created: {
          abilityNodes: createdNodes,
          userAbilityStates: createdStates,
        },
        completedQuests: completedQuests.length,
        nodeXP,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Error fixing tree:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: errorMessage };
    }
  }
}
