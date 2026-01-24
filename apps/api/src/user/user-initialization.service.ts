import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Сервис для инициализации нового пользователя
 * Создает базовые квесты и разблокирует базовые узлы первого уровня (tier: "basic")
 */
@Injectable()
export class UserInitializationService {
  private readonly logger = new Logger(UserInitializationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  /**
   * Проверяет, нужно ли инициализировать пользователя
   */
  async needsInitialization(userId: string): Promise<boolean> {
    // Проверяем наличие UserAbilityState для базовых узлов
    const stateCount = await this.prisma.userAbilityState.count({
      where: { user_id: userId },
    });

    // Проверяем наличие базовых квестов
    const questCount = await this.prisma.quest.count({
      where: { 
        userId,
        source: 'base_template',
      },
    });

    // Если нет состояний узлов или нет базовых квестов, нужна инициализация
    const needsInit = stateCount === 0 || questCount === 0;
    this.logger.warn(
      `DIAG needsInitialization: userId=${userId} stateCount=${stateCount} questCount=${questCount} needsInit=${needsInit}`,
    );
    return needsInit;
  }

  /**
   * Инициализирует пользователя: создает базовые квесты и разблокирует базовые узлы первого уровня
   */
  async initializeUser(userId: string): Promise<void> {
    this.logger.log(`🚀 Initializing user ${userId}...`);    this.logger.warn(
      `DIAG initializeUser context: cwd=${process.cwd()} __dirname=${__dirname}`,
    );

    try {
      // 1. Создаем базовые квесты
      await this.createBaseQuests(userId);

      // 2. Разблокируем базовые узлы первого уровня (tier: "basic")
      await this.unlockBaseNodes(userId);

      this.logger.log(`✅ User ${userId} initialized successfully`);
    } catch (error) {
      this.logger.error(`❌ Failed to initialize user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Создает базовые квесты из шаблонов
   */
  private async createBaseQuests(userId: string): Promise<void> {
    const questTemplatesPathAbs = '/app/data/quest-templates.json';
    const questTemplatesPathRel = path.join(
      __dirname,
      '../../../data/quest-templates.json',
    );
    const questTemplatesAbsExists = fs.existsSync(questTemplatesPathAbs);
    const questTemplatesRelExists = fs.existsSync(questTemplatesPathRel);
    const questTemplatesPath = questTemplatesAbsExists
      ? questTemplatesPathAbs
      : questTemplatesPathRel;

    const questTemplatesExists = fs.existsSync(questTemplatesPath);
    this.logger.warn(
      `DIAG quest templates: abs=${questTemplatesPathAbs} absExists=${questTemplatesAbsExists} rel=${questTemplatesPathRel} relExists=${questTemplatesRelExists} chosen=${questTemplatesPath} chosenExists=${questTemplatesExists}`,
    );

    if (!questTemplatesExists) {
      this.logger.warn(`Quest templates file not found: ${questTemplatesPath}`);return;
    }

    const templatesData = JSON.parse(
      fs.readFileSync(questTemplatesPath, 'utf-8'),
    );
    const templates = templatesData.quest_templates || [];

    this.logger.log(`📋 Creating ${templates.length} base quests for user ${userId}`);let created = 0;
    let skipped = 0;
    for (const template of templates) {
      try {
        const existing = await this.prisma.quest.findFirst({
          where: {
            userId,
            title: template.title,
          },
        });

        if (!existing) {
          await this.prisma.quest.create({
            data: {
              userId,
              title: template.title,
              description: template.description,
              type: template.type,
              status: 'backlog',
              steps_json: template.steps || [],
              criteria_json: template.criteria as any,
              reward_json: template.reward || null,
              linked_nodes: template.linked_nodes || [],
              evidence_links_json: [],
              tags: template.tags || [],
              source: 'base_template',
            },
          });
          created++;
          this.logger.debug(`Created quest: ${template.title}`);
        } else {
          skipped++;
        }
      } catch (error: any) {
        this.logger.error(
          `Failed to create quest "${template.title}":`,
          error.message,
        );
      }
    }

    this.logger.log(`✅ Created ${created} new quests, skipped ${skipped} existing for user ${userId}`);
  }

  /**
   * Разблокирует базовые узлы первого уровня (tier: "basic")
   * Эти узлы доступны любому пользователю при любых обстоятельствах
   */
  private async unlockBaseNodes(userId: string): Promise<void> {
    // Получаем дерево для определения базовых узлов
    const seedPathAbs = '/app/packages/shared/src/seed/initial-ability-tree.json';
    const seedPathCwd = path.join(
      process.cwd(),
      '../../packages/shared/src/seed/initial-ability-tree.json',
    );
    const seedPathRel = path.join(
      __dirname,
      '../../../packages/shared/src/seed/initial-ability-tree.json',
    );
    const seedAbsExists = fs.existsSync(seedPathAbs);
    const seedCwdExists = fs.existsSync(seedPathCwd);
    const seedRelExists = fs.existsSync(seedPathRel);
    const seedPath = seedAbsExists ? seedPathAbs : (seedCwdExists ? seedPathCwd : seedPathRel);

    const seedExists = fs.existsSync(seedPath);
    this.logger.warn(
      `DIAG seed: abs=${seedPathAbs} absExists=${seedAbsExists} cwd=${seedPathCwd} cwdExists=${seedCwdExists} rel=${seedPathRel} relExists=${seedRelExists} chosen=${seedPath} chosenExists=${seedExists}`,
    );

    if (!seedExists) {
      this.logger.warn(`Seed file not found: ${seedPath}`);return;
    }

    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    // Разблокируем все узлы первого уровня (tier: "basic")
    const baseNodes = (seedData.nodes || []).filter(
      (node: any) => node.tier === 'basic',
    );

    this.logger.log(
      `🔓 Unlocking ${baseNodes.length} tier-1 (basic) nodes for user ${userId}`,
    );for (const node of baseNodes) {
      try {
        // Проверяем, существует ли уже запись
        const existing = await this.prisma.userAbilityState.findUnique({
          where: {
            user_id_node_id: {
              user_id: userId,
              node_id: node.node_id,
            },
          },
        });

        if (existing) {
          // Обновляем состояние, если узел заблокирован
          if (existing.state === 'locked') {
            await this.prisma.userAbilityState.update({
              where: {
                user_id_node_id: {
                  user_id: userId,
                  node_id: node.node_id,
                },
              },
              data: {
                state: 'available',
              },
            });
            this.logger.debug(`Unlocked node ${node.node_id}`);
          }
        } else {
          // Создаем новую запись с состоянием 'available'
          await this.prisma.userAbilityState.create({
            data: {
              user_id: userId,
              node_id: node.node_id,
              state: 'available',
              relevance: 0,
            },
          });
          this.logger.debug(`Created available state for node ${node.node_id}`);
        }
      } catch (error: any) {
        this.logger.error(
          `Failed to unlock node ${node.node_id}:`,
          error.message,
        );
      }
    }

    this.logger.log(
      `✅ Base nodes unlocked for user ${userId}`,
    );
  }
}
