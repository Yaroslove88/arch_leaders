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
    return stateCount === 0 || questCount === 0;
  }

  /**
   * Инициализирует пользователя: создает базовые квесты и разблокирует базовые узлы первого уровня
   */
  async initializeUser(userId: string): Promise<void> {
    this.logger.log(`🚀 Initializing user ${userId}...`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-U1',location:'apps/api/src/user/user-initialization.service.ts:initializeUser',message:'initializeUser called',data:{cwd:process.cwd(),dirname:__dirname,userIdPresent:!!userId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    this.logger.warn(
      `DIAG initializeUser context: cwd=${process.cwd()} __dirname=${__dirname}`,
    );
    // #endregion

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
    const questTemplatesPath = path.join(
      __dirname,
      '../../../data/quest-templates.json',
    );

    const questTemplatesExists = fs.existsSync(questTemplatesPath);
    // #region agent log
    this.logger.warn(
      `DIAG quest templates: path=${questTemplatesPath} exists=${questTemplatesExists}`,
    );
    // #endregion

    if (!questTemplatesExists) {
      this.logger.warn(`Quest templates file not found: ${questTemplatesPath}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-U2',location:'apps/api/src/user/user-initialization.service.ts:createBaseQuests',message:'quest templates missing',data:{questTemplatesPath,cwd:process.cwd(),dirname:__dirname},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }

    const templatesData = JSON.parse(
      fs.readFileSync(questTemplatesPath, 'utf-8'),
    );
    const templates = templatesData.quest_templates || [];

    this.logger.log(`📋 Creating ${templates.length} base quests for user ${userId}`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-U2',location:'apps/api/src/user/user-initialization.service.ts:createBaseQuests',message:'quest templates loaded',data:{questTemplatesPath,templatesCount:Array.isArray(templates)?templates.length:-1},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let created = 0;
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
    const seedPath = path.join(
      __dirname,
      '../../../packages/shared/src/seed/initial-ability-tree.json',
    );

    const seedExists = fs.existsSync(seedPath);
    // #region agent log
    this.logger.warn(`DIAG seed: path=${seedPath} exists=${seedExists}`);
    // #endregion

    if (!seedExists) {
      this.logger.warn(`Seed file not found: ${seedPath}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-U3',location:'apps/api/src/user/user-initialization.service.ts:unlockBaseNodes',message:'seed file missing',data:{seedPath,cwd:process.cwd(),dirname:__dirname},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }

    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    // Разблокируем все узлы первого уровня (tier: "basic")
    const baseNodes = (seedData.nodes || []).filter(
      (node: any) => node.tier === 'basic',
    );

    this.logger.log(
      `🔓 Unlocking ${baseNodes.length} tier-1 (basic) nodes for user ${userId}`,
    );
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d62f3774-e975-44dd-84db-681709a5074c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H-U3',location:'apps/api/src/user/user-initialization.service.ts:unlockBaseNodes',message:'seed loaded',data:{seedPath,baseNodesCount:Array.isArray(baseNodes)?baseNodes.length:-1},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    for (const node of baseNodes) {
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
