import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PathConfigService } from '../config/path-config.service';
import { readFile, access } from 'fs/promises';
import * as crypto from 'crypto';
import {
  NodeState,
  NodeTier,
  IntegrationLevel,
  DevelopmentType,
  XP_THRESHOLDS,
  getNextNodeState,
  getIntegrationLevelFromState,
} from '@leadership-architect/shared';

/**
 * Типы для дерева способностей
 * Используем enum'ы из ontology.ts для типобезопасности
 */
export interface AbilityNode {
  node_id: string;
  name: string;
  description: string;
  branch_id: string;
  tier: NodeTier | 'basic' | 'intermediate' | 'advanced';
  state: NodeState | 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
  unlock_conditions: any;
  integration_level: IntegrationLevel | 'Novice' | 'Integrated' | 'Embodied';
  development_type: DevelopmentType | 'practice' | 'reflection' | 'theory' | 'mixed';
  xp_required: number;
  xp_current: number;
  prerequisites?: string[]; // массив ID узлов, которые должны быть разблокированы
}

export interface AbilityEdge {
  edge_id: string;
  from_node: string;
  to_node: string;
  type: string;
}

export interface AbilityBranch {
  branch_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface SemanticTree {
  tree_id: string;
  semantic_version: string;
  tree_revision: number;
  branches: AbilityBranch[];
  nodes: AbilityNode[];
  edges: AbilityEdge[];
}

export type ChangeOp =
  | { op: 'node.create'; node: AbilityNode }
  | { op: 'node.update'; node_id: string; patch: Partial<AbilityNode> }
  | { op: 'node.delete'; node_id: string }
  | { op: 'edge.create'; edge: AbilityEdge }
  | { op: 'edge.delete'; edge_id: string }
  | { op: 'branch.create'; branch: AbilityBranch }
  | { op: 'branch.update'; branch_id: string; patch: Partial<AbilityBranch> }
  | { op: 'branch.delete'; branch_id: string };

/**
 * Интерфейс для кэшированного контента узлов
 */
export interface NodeContent {
  name: string;
  full_description?: string;
  practical_meaning?: string;
  examples?: string[];
  integration_levels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  development_type?: string;
  reflection_prompts?: string[];
}

/**
 * Интерфейс для кэшированного контента веток
 */
export interface BranchContent {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

@Injectable()
export class TreeService implements OnModuleInit {
  private readonly logger = new Logger(TreeService.name);

  /**
   * Кэш контента узлов из node-descriptions.json
   * Загружается один раз при первом обращении
   */
  private nodeContentCache: Map<string, NodeContent> | null = null;
  private nodeContentCacheLoadedAt?: number;

  /**
   * Кэш контента веток из branch-descriptions.json
   * Загружается один раз при первом обращении
   */
  private branchContentCache: Map<string, BranchContent> | null = null;
  private branchContentCacheLoadedAt?: number;
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 минут

  /**
   * Флаг для отключения auto-sync из seed файла
   * Можно установить через переменную окружения DISABLE_TREE_AUTO_SYNC=true
   */
  private readonly disableAutoSync: boolean;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PathConfigService) private readonly pathConfig: PathConfigService,
  ) {
    // Проверяем переменную окружения для отключения auto-sync
    this.disableAutoSync = process.env.DISABLE_TREE_AUTO_SYNC === 'true';
    // Валидация инжекции зависимостей
    if (!this.prisma) {
      this.logger.error('PrismaService is not injected!');
      throw new InternalServerErrorException('PrismaService injection failed');
    }
    if (!this.pathConfig) {
      this.logger.error('PathConfigService is not injected!');
      throw new InternalServerErrorException('PathConfigService injection failed');
    }
  }

  /**
   * Инициализация при старте модуля
   * Заполняет таблицу ability_nodes из seed если она пустая
   */
  async onModuleInit(): Promise<void> {
    // Не блокируем старт API (в Timeweb healthcheck короткий).
    // Seed можно догнать после старта; ошибки seed не должны валить приложение.void this.ensureAbilityNodesSeeded();
  }

  /**
   * Убедиться что таблица ability_nodes заполнена из seed
   */
  private async ensureAbilityNodesSeeded(): Promise<void> {
    try {
      const count = await this.prisma.abilityNode.count();
      if (count > 0) {
        this.logger.log(`AbilityNode table already has ${count} records, skipping seed`);
        return;
      }

      this.logger.log('AbilityNode table is empty, seeding from initial-ability-tree.json...');

      const seedPath = this.getSeedPath();
      const content = await readFile(seedPath, 'utf-8');
      const seedData = JSON.parse(content) as SemanticTree;

      if (!seedData.nodes || seedData.nodes.length === 0) {
        this.logger.warn('Seed file has no nodes, skipping AbilityNode seed');
        return;
      }

      let created = 0;
      for (const node of seedData.nodes) {
        try {
          await this.prisma.abilityNode.create({
            data: {
              id: node.node_id,
              title: node.name || node.node_id,
              description: node.description || '',
              branch: node.branch_id || 'unknown',
              level: node.tier || 'basic',
              prerequisites: [],
            },
          });
          created++;
        } catch (e: unknown) {
          // Игнорируем дубликаты
          const error = e as { code?: string };
          if (error.code !== 'P2002') {
            this.logger.warn(`Failed to create AbilityNode ${node.node_id}: ${e}`);
          }
        }
      }

      this.logger.log(`✅ Seeded ${created} AbilityNodes from seed file`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to seed AbilityNodes: ${errorMessage}`);
      // Не прерываем запуск приложения
    }
  }

  /**
   * Получает путь к seed файлу
   */
  private getSeedPath(): string {
    return this.pathConfig.getSeedPath();
  }

  /**
   * Получает путь к файлу с контентом узлов
   */
  private getNodeDescriptionsPath(): string {
    const projectRoot = this.pathConfig.getProjectRoot();
    return `${projectRoot}/data/node-descriptions.json`;
  }

  /**
   * Загружает и кэширует контент узлов из node-descriptions.json
   * Контент загружается один раз и хранится в памяти для производительности
   */
  async loadNodeContent(): Promise<Map<string, NodeContent>> {
    if (this.nodeContentCache) {
      if (this.nodeContentCacheLoadedAt && Date.now() - this.nodeContentCacheLoadedAt < this.cacheTtlMs) {
        return this.nodeContentCache;
      }
      this.logger.log('Node content cache expired, reloading...');
    }

    try {
      const contentPath = this.getNodeDescriptionsPath();const content = await readFile(contentPath, 'utf-8');
      const data = JSON.parse(content);
      const descriptions = data.node_descriptions || {};

      this.nodeContentCache = new Map(Object.entries(descriptions));
      this.nodeContentCacheLoadedAt = Date.now();
      const sampleNode = descriptions['node_grounding_point'];
      fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tree.service.ts:loadNodeContent:SUCCESS',message:'CONTENT_LOADED',data:{count:this.nodeContentCache.size,sampleNodeName:sampleNode?.name,sampleNodeHasDesc:!!sampleNode?.full_description},timestamp:Date.now(),sessionId:'debug-session',runId:'diag-1',hypothesisId:'H2'})}).catch(()=>{});
      this.logger.log(`✅ Loaded ${this.nodeContentCache.size} node descriptions into cache`);

      return this.nodeContentCache;
    } catch (error: any) {this.logger.warn(`Failed to load node-descriptions.json: ${error.message}`);
      // Возвращаем пустой кэш при ошибке, не прерываем работу
      this.nodeContentCache = new Map();
      return this.nodeContentCache;
    }
  }

  /**
   * Принудительно обновляет кэш контента (например, после редактирования файла)
   */
  async refreshContentCache(): Promise<void> {
    this.nodeContentCache = null;
    this.branchContentCache = null;
    this.nodeContentCacheLoadedAt = undefined;
    this.branchContentCacheLoadedAt = undefined;
    await this.loadNodeContent();
    await this.loadBranchContent();
    this.logger.log('Content cache refreshed');
  }

  /**
   * Получает путь к файлу с описаниями веток
   */
  private getBranchDescriptionsPath(): string {
    const projectRoot = this.pathConfig.getProjectRoot();
    return `${projectRoot}/data/branch-descriptions.json`;
  }

  /**
   * Загружает и кэширует контент веток из branch-descriptions.json
   * Контент загружается один раз и хранится в памяти для производительности
   */
  async loadBranchContent(): Promise<Map<string, BranchContent>> {
    if (this.branchContentCache) {
      if (this.branchContentCacheLoadedAt && Date.now() - this.branchContentCacheLoadedAt < this.cacheTtlMs) {
        return this.branchContentCache;
      }
      this.logger.log('Branch content cache expired, reloading...');
    }

    try {
      const contentPath = this.getBranchDescriptionsPath();
      const content = await readFile(contentPath, 'utf-8');
      const data = JSON.parse(content);
      const descriptions = data.branch_descriptions || {};

      this.branchContentCache = new Map(Object.entries(descriptions));
      this.branchContentCacheLoadedAt = Date.now();
      this.logger.log(`✅ Loaded ${this.branchContentCache.size} branch descriptions into cache`);

      return this.branchContentCache;
    } catch (error: any) {
      this.logger.warn(`Failed to load branch-descriptions.json: ${error.message}`);
      // Возвращаем пустой кэш при ошибке, не прерываем работу
      this.branchContentCache = new Map();
      return this.branchContentCache;
    }
  }

  /**
   * Обогащает ветку контентом из кэша
   * Используется для runtime-объединения структуры и контента
   */
  private enrichBranchWithContent(branch: any, contentCache: Map<string, BranchContent>): AbilityBranch {
    const content = contentCache.get(branch.branch_id);

    return {
      ...branch,
      // Контент из branch-descriptions.json (обязательно должен быть)
      name: content?.name || branch.name || branch.branch_id.replace('branch_', '').replace(/_/g, ' '),
      description: content?.description || branch.description || '',
      // Цвет и иконка могут быть из структуры или из контента
      color: branch.color || content?.color || '#808080',
      icon: branch.icon || content?.icon || 'default',
    } as AbilityBranch;
  }

  /**
   * Обогащает узел контентом из кэша
   * Используется для runtime-объединения структуры и контента
   * Контент из node-descriptions.json имеет приоритет над seed
   */
  private enrichNodeWithContent(node: any, contentCache: Map<string, NodeContent>): AbilityNode {
    const content = contentCache.get(node.node_id);
    
    if (node.node_id === 'node_grounding_point') {
      fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tree.service.ts:enrichNodeWithContent',message:'ENRICH_SAMPLE_NODE',data:{nodeId:node.node_id,hasContent:!!content,contentName:content?.name,nodeName:node.name,resultName:content?.name||node.name||node.node_id,cacheSize:contentCache.size},timestamp:Date.now(),sessionId:'debug-session',runId:'diag-1',hypothesisId:'H1'})}).catch(()=>{});
    }
    
    // После миграции структура не содержит name, description, state, xp_current
    // Эти поля добавляются из контента и UserAbilityState
    return {
      ...node,
      // Контент из node-descriptions.json (обязательно должен быть)
      name: content?.name || node.name || node.node_id,
      description: content?.full_description || content?.practical_meaning || node.description || '',
      // Поля по умолчанию, если их нет в структуре
      state: node.state || 'locked',
      xp_current: node.xp_current || 0,
      integration_level: content?.integration_levels?.Novice || node.integration_level || 'Novice',
      development_type: content?.development_type || node.development_type || 'reflection',
      // Дополнительные поля контента (если есть в node-descriptions.json)
      ...(content?.practical_meaning && { practical_meaning: content.practical_meaning }),
      ...(content?.examples && content.examples.length > 0 && { examples: content.examples }),
      ...(content?.integration_levels && { integration_levels: content.integration_levels }),
      ...(content?.reflection_prompts && content.reflection_prompts.length > 0 && { reflection_prompts: content.reflection_prompts }),
    } as AbilityNode;
  }

  /**
   * Объединяет структуру дерева с контентом из node-descriptions.json
   * Используется для runtime-объединения структуры и контента
   */
  private mergeStructureWithContent(structure: SemanticTree, contentCache: Map<string, NodeContent>): SemanticTree {
    // Загружаем контент веток из кэша (уже загружен или загрузится)
    const branchCache = this.branchContentCache || new Map<string, BranchContent>();

    return {
      ...structure,
      nodes: structure.nodes.map((node) => this.enrichNodeWithContent(node, contentCache)),
      // Обогащаем ветки контентом из branch-descriptions.json
      branches: (structure.branches || []).map((branch) => this.enrichBranchWithContent(branch, branchCache)),
      edges: structure.edges || [],
    };
  }

  /**
   * Получить семантическое дерево
   * @param userId - ID пользователя (опционально, если не указан - возвращает глобальное дерево)
   */
  async getSemantic(userId?: string): Promise<SemanticTree> {
    this.logger.log(`🔍 getSemantic called with userId=${userId || 'undefined'}`);
    
    // Проверка инжекции PrismaService
    if (!this.prisma) {
      this.logger.error('PrismaService is not injected in TreeService');
      throw new InternalServerErrorException('PrismaService is not injected');
    }

    // Проверка доступности модели (может быть недоступна если Prisma Client не сгенерирован)
    if (!this.prisma.treeSemantic) {
      this.logger.error('Prisma treeSemantic model is not available. Run: pnpm prisma generate');
      throw new InternalServerErrorException(
        'Prisma treeSemantic model is not available. Please run: pnpm prisma generate',
      );
    }

    try {
      // Предзагружаем кэш контента веток (один раз)
      if (!this.branchContentCache) {
        await this.loadBranchContent();
      }

      let treeRecord;

      // Если указан userId, ищем дерево пользователя
      if (userId) {
        treeRecord = await this.prisma.treeSemantic.findUnique({
          where: { userId },
        });
        this.logger.log(`Looking for user tree: userId=${userId}, found=${!!treeRecord}`);
      }
      
      // Если не нашли дерево пользователя, пробуем глобальное
      if (!treeRecord) {
        treeRecord = await this.prisma.treeSemantic.findUnique({
          where: { id: 'tree_main' },
        });
        this.logger.log(`Looking for global tree: found=${!!treeRecord}`);
      }

      if (treeRecord && treeRecord.data) {
        const data = treeRecord.data as unknown as SemanticTree & { seed_version?: number };
        // Валидация структуры данных
        if (!data || typeof data !== 'object') {
          throw new InternalServerErrorException('Semantic tree data is corrupted');
        }
        
        // Проверяем версию seed и применяем миграции если нужно
        let structureData = data;
        if (treeRecord.userId) {
          const migratedData = await this.checkAndMigrateSeedVersion(treeRecord.id, data);
          if (migratedData !== data) {
            this.logger.log(`✅ Found and migrated tree: userId=${treeRecord.userId}, nodes=${migratedData.nodes?.length || 0}`);
            structureData = migratedData as SemanticTree;
          }
        }
        
        const treeUserId = treeRecord.userId;
        this.logger.log(`✅ Found tree: userId=${treeUserId || 'global'}, nodes=${structureData.nodes?.length || 0}`);
        
        // Загружаем контент из node-descriptions.json
        const contentCache = await this.loadNodeContent();
        
        // Объединяем структуру с контентом в runtime
        const mergedData = this.mergeStructureWithContent(structureData, contentCache);
        
        // Обогащаем данными из UserAbilityState если есть userId
        // Приоритет: переданный userId > treeRecord.userId
        const targetUserId = userId || treeUserId;
        if (targetUserId) {
          this.logger.log(`🔧 Enriching tree with UserAbilityState for userId=${targetUserId}`);
          return this.enrichWithUserState(mergedData, targetUserId);
        }
        this.logger.log(`⚠️  No userId provided (param=${userId}, tree.userId=${treeUserId}), returning tree without enrichment`);
        return mergedData;
      }

      // Если не нашли дерево пользователя и userId указан, создаем из seed
      if (userId) {
        this.logger.log(`Tree not found for userId=${userId}, creating from seed...`);
        const seedPath = this.getSeedPath();
        try {
          await access(seedPath);
          const content = await readFile(seedPath, 'utf-8');
          const seedData = JSON.parse(content) as SemanticTree;
          
          await this.prisma.treeSemantic.create({
            data: {
              id: `tree_user_${userId}`,
              userId,
              semantic_version: seedData.semantic_version || '1.0.0',
              tree_revision: seedData.tree_revision || 1,
              data: seedData as any,
            },
          });
          
          this.logger.log(`✅ Created user tree: nodes=${seedData.nodes?.length || 0}`);
          
          // Загружаем контент из node-descriptions.json
          const contentCache = await this.loadNodeContent();
          
          // Объединяем структуру с контентом в runtime
          const mergedData = this.mergeStructureWithContent(seedData, contentCache);
          
          // Обогащаем данными из UserAbilityState (источник истины для XP)
          return this.enrichWithUserState(mergedData, userId);
        } catch (seedError: any) {
          this.logger.error(`Failed to create user tree: ${seedError.message}`);
          // Продолжаем с глобальным деревом
        }
      }

      // Если нет в БД или revision меньше, загружаем из seed файла
      const seedPath = this.getSeedPath();
      
      try {
        await access(seedPath);
      } catch (accessError) {
        throw new NotFoundException(
          `Seed file not found at ${seedPath}. Please ensure seed file exists.`,
        );
      }

      const content = await readFile(seedPath, 'utf-8');
      let seedData: SemanticTree;
      
      try {
        seedData = JSON.parse(content) as SemanticTree;
      } catch (parseError) {
        throw new InternalServerErrorException(
          `Failed to parse seed file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        );
      }

      // Валидация seed данных
      if (!seedData || typeof seedData !== 'object') {
        throw new InternalServerErrorException('Seed file contains invalid data');
      }

      const seedRevision = seedData.tree_revision || 1;
      const dbRevision = treeRecord?.tree_revision || 0;

      // Преобразуем unlock_conditions.required_nodes в prerequisites для узлов
      const normalizedSeedData = this.normalizeSeedData(seedData);

      // Если seed файл новее, обновляем БД (если auto-sync не отключен)
      if (seedRevision > dbRevision) {
        if (this.disableAutoSync) {
          this.logger.warn(
            `⚠️  Auto-sync отключен (DISABLE_TREE_AUTO_SYNC=true). ` +
            `Seed revision ${seedRevision} > DB revision ${dbRevision}, но обновление пропущено. ` +
            `Запустите миграцию вручную: npx ts-node scripts/migrate-tree-separation.ts`,
          );
          // Возвращаем данные из БД без обновления
          if (treeRecord?.data) {
            const structureData = this.normalizeSeedData(treeRecord.data as unknown as SemanticTree);
            
            // Загружаем контент из node-descriptions.json
            const contentCache = await this.loadNodeContent();
            
            // Объединяем структуру с контентом в runtime
            const mergedData = this.mergeStructureWithContent(structureData, contentCache);
            
            if (userId) {
              return this.enrichWithUserState(mergedData, userId);
            }
            return mergedData;
          }
        } else {
          this.logger.log(`Updating tree from revision ${dbRevision} to ${seedRevision}`);
          this.logger.warn(
            `⚠️  ВНИМАНИЕ: Обновление TreeSemantic.data перезапишет все данные (структура + контент + пользовательские данные). ` +
            `Пользовательские данные будут восстановлены из UserAbilityState, но контент может быть перезаписан английскими названиями из seed файла. ` +
            `Для отключения auto-sync установите DISABLE_TREE_AUTO_SYNC=true в переменных окружения.`,
          );
          try {
            await this.prisma.treeSemantic.upsert({
              where: { id: 'tree_main' },
              update: {
                tree_revision: seedRevision,
                data: normalizedSeedData as any,
                userId: null, // Global tree, no user
              },
              create: {
                id: 'tree_main',
                tree_revision: seedRevision,
                data: normalizedSeedData as any,
                userId: null, // Global tree, no user
              },
            });
            this.logger.log(`Tree updated successfully. Nodes: ${normalizedSeedData.nodes?.length || 0}`);
            this.logger.log(
              `✅ Пользовательские данные будут восстановлены из UserAbilityState при запросе с userId.`,
            );
          } catch (updateError: any) {
            this.logger.error(`Failed to update tree: ${updateError.message}`);
            throw new InternalServerErrorException(`Failed to update tree: ${updateError.message}`);
          }
          // Загружаем контент из node-descriptions.json
          const contentCache = await this.loadNodeContent();
          
          // Объединяем структуру с контентом в runtime
          const mergedData = this.mergeStructureWithContent(normalizedSeedData, contentCache);
          
          // Обогащаем данными из UserAbilityState если есть userId
          if (userId) {
            return this.enrichWithUserState(mergedData, userId);
          }
          return mergedData;
        }
      }

      // Если seed файл не новее, но данных нет в БД, создаем
      if (!treeRecord) {
        try {
          await this.prisma.treeSemantic.create({
            data: {
              id: 'tree_main',
              tree_revision: seedRevision,
              data: normalizedSeedData as any,
              userId: null, // Global tree, no user
            },
          });
          this.logger.log(`Tree created in DB. Nodes: ${normalizedSeedData.nodes?.length || 0}`);
        } catch (createError: any) {
          // Если запись уже существует (race condition), просто продолжаем
          if (createError?.code !== 'P2002') {
            throw createError;
          }
        }
        // Загружаем контент из node-descriptions.json
        const contentCache = await this.loadNodeContent();
        
        // Объединяем структуру с контентом в runtime
        const mergedData = this.mergeStructureWithContent(normalizedSeedData, contentCache);
        
        // Обогащаем данными из UserAbilityState если есть userId
        if (userId) {
          return this.enrichWithUserState(mergedData, userId);
        }
        return mergedData;
      }

      // Если данные в БД актуальны, возвращаем их
      // Нормализуем данные из БД (на случай, если они были сохранены до добавления normalizeSeedData)
      const structureData = this.normalizeSeedData(treeRecord.data as unknown as SemanticTree);
      
      // Загружаем контент из node-descriptions.json
      const contentCache = await this.loadNodeContent();
      
      // Объединяем структуру с контентом в runtime
      const mergedData = this.mergeStructureWithContent(structureData, contentCache);
      
      // Обогащаем данными из UserAbilityState если есть userId
      if (userId) {
        return this.enrichWithUserState(mergedData, userId);
      }
      return mergedData;
    } catch (error: any) {
      // Преобразуем известные ошибки
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Логируем неизвестные ошибки
      console.error('Unexpected error in getSemantic:', error);
      
      throw new InternalServerErrorException(
        `Failed to load semantic tree: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Обогатить дерево данными из UserAbilityState
   * UserAbilityState является источником истины для XP и state узлов
   */
  private async enrichWithUserState(
    data: SemanticTree,
    userId: string,
  ): Promise<SemanticTree> {
    this.logger.log(`🔧 enrichWithUserState called for userId=${userId}`);
    try {
      const userStates = await this.prisma.userAbilityState.findMany({
        where: { user_id: userId },
      });

      this.logger.log(`📊 Found ${userStates.length} UserAbilityState records for user ${userId}`);

      if (userStates.length === 0) {
        this.logger.warn(`⚠️  No UserAbilityState records for user ${userId}, returning tree without enrichment`);
        return data;
      }

      // Создаем Map для быстрого поиска
      const statesMap = new Map(
        userStates.map((s) => [s.node_id, s]),
      );

      // Нормализатор статуса по прогрессу (авто-переход при 100%)
      const deriveStateFromProgress = (
        progress: number,
        relevance: number,
        current: AbilityNode['state'],
      ): AbilityNode['state'] => {
        if (progress >= 1.0) return 'integrated';
        if (progress >= 0.7) return 'unlocked';
        if (progress >= 0.3 && relevance >= 0.3) return 'active';
        // если уже доступен/активен/разблокирован – оставляем как есть
        if (current === 'available' || current === 'active' || current === 'unlocked' || current === 'integrated') {
          return current;
        }
        // FIX: возвращаем locked, а не available!
        return 'locked';
      };

      // Добавляем отсутствующие записи UserAbilityState как миграцию по месту
      const missingNodes = data.nodes.filter((n) => !statesMap.has(n.node_id));
      if (missingNodes.length > 0) {
        this.logger.log(
          `UserAbilityState missing ${missingNodes.length} nodes for user ${userId}, seeding locked defaults`,
        );
        await this.prisma.userAbilityState.createMany({
          data: missingNodes.map((n) => ({
            user_id: userId,
            node_id: n.node_id,
            state: n.tier === 'basic' ? 'available' : 'locked',
            progress: 0,
            internal_progress: 0,
            stored_experience: 0,
            relevance: 0,
          })),
          skipDuplicates: true,
        });

        // Обновляем statesMap после вставки
        const inserted = await this.prisma.userAbilityState.findMany({
          where: { user_id: userId, node_id: { in: missingNodes.map((n) => n.node_id) } },
        });
        inserted.forEach((s) => statesMap.set(s.node_id, s));
      }

      const firstFiveStates = Array.from(statesMap.entries()).slice(0,5).map(([k,v])=>({nodeId:k,state:v.state,progress:Number(v.progress),tier:data.nodes.find(n=>n.node_id===k)?.tier}));
      fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tree.service.ts:enrichWithUserState',message:'USER_STATES_SAMPLE',data:{userId,statesCount:statesMap.size,firstFiveStates},timestamp:Date.now(),sessionId:'debug-session',runId:'diag-1',hypothesisId:'H3'})}).catch(()=>{});

      const enrichedNodes: AbilityNode[] = data.nodes.map((node) => {
        const state = statesMap.get(node.node_id);
        if (state) {
          // UserAbilityState - источник истины для state и xp_current
          let nodeState: AbilityNode['state'] = state.state as AbilityNode['state'];
          const xpCurrent = Number(state.internal_progress) || 0;
          const progress = Number(state.progress) || 0;
          const relevance = Number(state.relevance) || 0;

          // Автоматический апгрейд статуса по прогрессу (чтобы дочерние узлы открывались)
          const derivedState = deriveStateFromProgress(progress, relevance, nodeState);
          if (node.node_id === 'node_grounding_point' || progress > 0) {
            fetch('http://127.0.0.1:7243/ingest/c0326067-9caf-4823-b221-37edfa52cbb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tree.service.ts:deriveState',message:'DERIVE_STATE_DEBUG',data:{nodeId:node.node_id,dbState:state.state,progress,relevance,derivedState,tier:node.tier},timestamp:Date.now(),sessionId:'debug-session',runId:'diag-1',hypothesisId:'H4'})}).catch(()=>{});
          }
          nodeState = derivedState;
          
          // Базовые узлы первого уровня (tier: "basic") всегда должны быть разблокированы
          // Если узел базовый и заблокирован, разблокируем его
          if (node.tier === 'basic' && nodeState === 'locked') {
            nodeState = 'available';
            this.logger.debug(`Auto-unlocking tier-1 node ${node.node_id} (tier=basic)`);
          }
          
          return {
            ...node,
            state: nodeState,
            xp_current: xpCurrent,
            progress: progress,
            // prerequisites сохраняются из исходного узла
          } as AbilityNode;
        }
        
        // Если нет состояния в UserAbilityState, но узел базовый (tier: "basic"),
        // он должен быть доступен по умолчанию
        if (node.tier === 'basic') {
          return {
            ...node,
            state: 'available' as const,
            xp_current: 0,
          } as AbilityNode;
        }
        
        // Для остальных узлов используем значения по умолчанию (locked)
        return {
          ...node,
          state: 'locked' as const,
          xp_current: 0,
        } as AbilityNode;
      });

      // Логируем детали обогащения для отладки
      const enrichedCount = enrichedNodes.filter((n, i) => {
        const original = data.nodes[i];
        return original && (n.state !== original.state || n.xp_current !== original.xp_current);
      }).length;

      this.logger.log(
        `✅ Enriched ${enrichedCount}/${userStates.length} nodes with UserAbilityState data for user ${userId}`,
      );
      
      // Детальное логирование первых 3 узлов с изменениями
      if (enrichedCount > 0) {
        const changed = enrichedNodes
          .map((n, i) => ({ new: n, original: data.nodes[i] }))
          .filter(({ new: n, original: o }) => o && (n.state !== o.state || n.xp_current !== o.xp_current))
          .slice(0, 3);
        
        changed.forEach(({ new: n, original: o }) => {
          this.logger.debug(
            `  ${n.node_id}: state ${o?.state}→${n.state}, xp ${o?.xp_current || 0}→${n.xp_current}`,
          );
        });
      }

      return {
        ...data,
        nodes: enrichedNodes,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to enrich tree with user state: ${errorMessage}`);
      return data; // Возвращаем неизмененные данные при ошибке
    }
  }

  /**
   * Получить layout дерева
   */
  async getLayout(fromRevision?: number) {
    try {
      const treeRecord = await this.prisma.treeSemantic.findUnique({
        where: { id: 'tree_main' },
      });

      if (!treeRecord) {
        return {
          tree_id: 'tree_main',
          layout_version: '1.0.0',
          layout_revision: 0,
          computed_from_tree_revision: 0,
          nodes: [],
          edges: [],
          groups: [],
        };
      }

      const targetRevision = fromRevision || treeRecord.tree_revision;

      const layoutRecord = await this.prisma.treeLayout.findFirst({
        where: {
          tree_id: 'tree_main',
          computed_from_tree_revision: targetRevision,
        },
        orderBy: {
          layout_revision: 'desc',
        },
      });

      if (!layoutRecord) {
        return {
          tree_id: 'tree_main',
          layout_version: '1.0.0',
          layout_revision: 0,
          computed_from_tree_revision: targetRevision,
          nodes: [],
          edges: [],
          groups: [],
        };
      }

      if (
        layoutRecord.computed_from_tree_revision !== undefined &&
        layoutRecord.computed_from_tree_revision !== targetRevision
      ) {
        this.logger.warn(
          `Layout revision mismatch: layout=${layoutRecord.computed_from_tree_revision}, tree=${targetRevision}. Returning empty layout.`,
        );
        return {
          tree_id: 'tree_main',
          layout_version: '1.0.0',
          layout_revision: 0,
          computed_from_tree_revision: targetRevision,
          nodes: [],
          edges: [],
          groups: [],
        };
      }

      return layoutRecord.data;
    } catch (error: any) {
      throw new Error(`Failed to get layout: ${error.message}`);
    }
  }

  /**
   * Нормализует seed данные: преобразует unlock_conditions.required_nodes в prerequisites
   * Это необходимо, так как в seed файле prerequisites хранятся в unlock_conditions,
   * а в TreeSemantic узлы должны иметь поле prerequisites напрямую
   */
  private normalizeSeedData(seedData: SemanticTree): SemanticTree {
    // Цель: оставить только структурные поля дерева и нормализовать prerequisites/xp_required.
    const cleanedNodes = (seedData.nodes || []).map((node: any) => {
      const prerequisites =
        node?.prerequisites && Array.isArray(node.prerequisites)
          ? node.prerequisites
          : Array.isArray(node?.unlock_conditions?.required_nodes)
            ? node.unlock_conditions.required_nodes
            : [];

      return {
        node_id: node.node_id,
        branch_id: node.branch_id,
        tier: node.tier || 'basic',
        unlock_conditions: node.unlock_conditions,
        xp_required: typeof node.xp_required === 'number' ? node.xp_required : 100,
        prerequisites,
        // Структурное значение по умолчанию, без пользовательских данных
        xp_current: 0,
        state: 'locked',
        development_type: 'reflection',
      } as AbilityNode;
    });

    const cleanedBranches = (seedData.branches || []).map((branch: any) => ({
      branch_id: branch.branch_id,
      name: branch.name || branch.branch_id,
      description: branch.description || '',
      color: branch.color,
      icon: branch.icon,
    }));

    const cleanedEdges = (seedData.edges || []).map((edge: any) => ({
      edge_id: edge.edge_id,
      from_node: edge.from_node,
      to_node: edge.to_node,
      type: edge.type,
    }));

    return {
      tree_id: seedData.tree_id || 'tree_main',
      semantic_version: seedData.semantic_version || '1.0.0',
      tree_revision: seedData.tree_revision || 1,
      branches: cleanedBranches,
      nodes: cleanedNodes,
      edges: cleanedEdges,
    };
  }

  /**
   * Генерирует уникальный ID для изменения
   */
  private generateChangeId(): string {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '_');
    const random = crypto.randomBytes(4).toString('hex');
    return `chg_${dateStr}_${random}`;
  }

  /**
   * Применяет операцию изменения к дереву
   */
  private applyOperationToTree(tree: SemanticTree, op: ChangeOp): void {
    switch (op.op) {
      case 'node.create':
        if (!tree.nodes) tree.nodes = [];
        tree.nodes.push(op.node);
        break;

      case 'node.update':
        const nodeIndex = tree.nodes?.findIndex((n) => n.node_id === op.node_id);
        if (nodeIndex !== undefined && nodeIndex >= 0) {
          tree.nodes[nodeIndex] = { ...tree.nodes[nodeIndex], ...op.patch };
        }
        break;

      case 'node.delete':
        if (tree.nodes) {
          tree.nodes = tree.nodes.filter((n) => n.node_id !== op.node_id);
        }
        break;

      case 'edge.create':
        if (!tree.edges) tree.edges = [];
        tree.edges.push(op.edge);
        break;

      case 'edge.delete':
        if (tree.edges) {
          tree.edges = tree.edges.filter((e) => e.edge_id !== op.edge_id);
        }
        break;

      case 'branch.create':
        if (!tree.branches) tree.branches = [];
        tree.branches.push(op.branch);
        break;

      case 'branch.update':
        const branchIndex = tree.branches?.findIndex((b) => b.branch_id === op.branch_id);
        if (branchIndex !== undefined && branchIndex >= 0) {
          tree.branches[branchIndex] = { ...tree.branches[branchIndex], ...op.patch };
        }
        break;

      case 'branch.delete':
        if (tree.branches) {
          tree.branches = tree.branches.filter((b) => b.branch_id !== op.branch_id);
        }
        break;
    }
  }

  /**
   * Генерирует обратные операции для undo
   */
  private generateInverseOps(ops: ChangeOp[]): ChangeOp[] {
    const inverseOps: ChangeOp[] = [];

    for (let i = ops.length - 1; i >= 0; i--) {
      const op = ops[i];
      switch (op.op) {
        case 'node.create':
          inverseOps.push({ op: 'node.delete', node_id: op.node.node_id });
          break;
        case 'node.delete':
          // Нужно сохранить узел перед удалением для восстановления
          // Это упрощенная версия - в реальности нужно сохранять состояние
          break;
        case 'node.update':
          // Нужно сохранить старое состояние для восстановления
          break;
        case 'edge.create':
          inverseOps.push({ op: 'edge.delete', edge_id: op.edge.edge_id });
          break;
        case 'edge.delete':
          // Аналогично node.delete
          break;
        case 'branch.create':
          inverseOps.push({ op: 'branch.delete', branch_id: op.branch.branch_id });
          break;
        case 'branch.delete':
          // Аналогично
          break;
        case 'branch.update':
          // Аналогично node.update
          break;
      }
    }

    return inverseOps;
  }

  /**
   * Применить изменение к дереву
   */
  async applyChange(request: {
    ops: ChangeOp[];
    rationale: string;
    actor: string;
    links?: any[];
    userId?: string;
  }): Promise<{ change_id: string; tree_revision: number }> {
    // Получаем текущее дерево (пользовательское или глобальное)
    const userId = request.userId;
    const tree = await this.getSemantic(userId);

    // Применяем операции
    for (const op of request.ops) {
      this.applyOperationToTree(tree, op);
    }

    // Увеличиваем ревизию
    tree.tree_revision = (tree.tree_revision || 1) + 1;

    // Генерируем change_id
    const changeId = this.generateChangeId();

    // Генерируем обратные операции
    const inverseOps = this.generateInverseOps(request.ops);

    // Определяем ID дерева (пользовательское или глобальное)
    const treeId = userId ? `tree_user_${userId}` : 'tree_main';

    // Сохраняем в БД
    await this.prisma.$transaction(async (tx) => {
      // Обновляем дерево (пользовательское или глобальное)
      await tx.treeSemantic.upsert({
        where: { id: treeId },
        update: {
          tree_revision: tree.tree_revision,
          data: tree as any,
          userId: userId || null,
        },
        create: {
          id: treeId,
          tree_revision: tree.tree_revision,
          data: tree as any,
          userId: userId || null,
        },
      });

      // Определяем userId для ChangeLog
      // Приоритет: request.userId > actor (если это UUID) > системный пользователь
      let changeLogUserId: string;
      if (userId) {
        // Используем userId из запроса, если он есть
        changeLogUserId = userId;
      } else if (request.actor && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.actor)) {
        // actor выглядит как UUID - возможно это userId
        const user = await tx.user.findUnique({ where: { id: request.actor } });
        if (user) {
          changeLogUserId = request.actor;
        } else {
          // Если не найден, используем системного пользователя
          const systemUser = await tx.user.findFirst({ where: { role: 'admin' } });
          changeLogUserId = systemUser?.id || (await tx.user.findFirst())?.id || '';
        }
      } else {
        // actor - строка (system, analyzer, admin), используем системного пользователя
        const systemUser = await tx.user.findFirst({ where: { role: 'admin' } });
        changeLogUserId = systemUser?.id || (await tx.user.findFirst())?.id || '';
      }

      if (!changeLogUserId) {
        throw new InternalServerErrorException('No user found for ChangeLog. Please create at least one user.');
      }

      // Определяем scope и action на основе операций
      const scope = 'system'; // ability, quest, settings, system
      const firstOp = request.ops[0];
      let action = 'apply_change'; // create, update, unlock, integrate, regenerate, undo
      
      if (firstOp?.op === 'node.create' || firstOp?.op === 'edge.create' || firstOp?.op === 'branch.create') {
        action = 'create';
      } else if (firstOp?.op === 'node.update' || firstOp?.op === 'branch.update') {
        action = 'update';
      } else if (firstOp?.op === 'node.delete' || firstOp?.op === 'edge.delete' || firstOp?.op === 'branch.delete') {
        action = 'update'; // delete это тоже update
      }

      // Создаем запись в ChangeLog
      await tx.changeLog.create({
        data: {
          change_id: changeId,
          tree_revision: tree.tree_revision,
          scope,
          action,
          actor: request.actor,
          rationale: request.rationale,
          links_json: request.links || [],
          ops_json: request.ops as any,
          inverse_ops_json: inverseOps as any,
          user: { connect: { id: changeLogUserId } },
        },
      });
    });

    // Синхронизируем изменения state с UserAbilityState (если userId указан)
    if (userId) {
      await this.syncStateChangesToUserAbilityState(userId, request.ops, tree);
    }

    return {
      change_id: changeId,
      tree_revision: tree.tree_revision,
    };
  }

  /**
   * Синхронизировать изменения state из операций с UserAbilityState
   */
  private async syncStateChangesToUserAbilityState(
    userId: string,
    ops: ChangeOp[],
    tree: SemanticTree,
  ): Promise<void> {
    for (const op of ops) {
      if (op.op === 'node.update' && op.patch?.state !== undefined) {
        const nodeId = op.node_id;
        const newState = op.patch.state as AbilityNode['state'];
        await this.syncStateToUserAbilityState(userId, nodeId, newState);
      } else if (op.op === 'node.update' && op.patch) {
        // Если обновляется узел, но state не указан явно, проверяем текущее состояние в дереве
        const nodeId = op.node_id;
        const node = tree.nodes.find((n) => n.node_id === nodeId);
        if (node) {
          await this.syncStateToUserAbilityState(userId, nodeId, node.state);
        }
      }
    }
  }

  /**
   * Откатить изменение
   * Определяет, какое дерево откатывать (глобальное или пользовательское) на основе changeLog
   */
  async undoChange(changeId: string): Promise<{ tree_revision: number }> {
    const changeLog = await this.prisma.changeLog.findUnique({
      where: { change_id: changeId },
      include: { user: true },
    });

    if (!changeLog) {
      throw new NotFoundException(`Change ${changeId} not found`);
    }

    if (!changeLog.inverse_ops_json) {
      throw new BadRequestException(`Change ${changeId} has no inverse operations`);
    }

    // Определяем userId из changeLog (может быть null для глобальных изменений)
    const userId = changeLog.user?.id || undefined;
    const tree = await this.getSemantic(userId);
    const inverseOps = changeLog.inverse_ops_json as ChangeOp[];

    // Применяем обратные операции
    for (const op of inverseOps) {
      this.applyOperationToTree(tree, op);
    }

    tree.tree_revision = (tree.tree_revision || 1) + 1;

    // Определяем ID дерева (пользовательское или глобальное)
    const treeId = userId ? `tree_user_${userId}` : 'tree_main';

    await this.prisma.treeSemantic.update({
      where: { id: treeId },
      data: {
        tree_revision: tree.tree_revision,
        data: tree as any,
        userId: userId || null,
      },
    });

    return {
      tree_revision: tree.tree_revision,
    };
  }

  /**
   * Обновить прогресс узла
   * Автоматически обновляет state и integration_level на основе XP:
   * - locked -> available: при первом получении XP (если узел был locked)
   * - available/active -> unlocked: при достижении XP_THRESHOLDS.TO_UNLOCKED% xp_required
   * - unlocked -> integrated: при достижении XP_THRESHOLDS.TO_INTEGRATED% xp_required
   * - integration_level: Novice -> Integrated -> Embodied
   * 
   * Использует константы из ontology.ts для единообразия
   * @see packages/shared/src/ontology.ts
   * 
   * @param nodeId ID узла
   * @param xpDelta Изменение XP
   * @param userId ID пользователя (опционально, если не указан - работает с глобальным деревом)
   */
  async updateNodeProgress(nodeId: string, xpDelta: number, userId?: string): Promise<AbilityNode> {
    const tree = await this.getSemantic(userId);
    const node = tree.nodes.find((n) => n.node_id === nodeId);

    if (!node) {
      throw new NotFoundException(`Node ${nodeId} not found`);
    }

    const newXp = Math.max(0, node.xp_current + xpDelta);
    const xpRequired = node.xp_required || 100; // default to 100 for basic nodes
    
    // Вычисляем прогресс в процентах
    const progressPercent = xpRequired > 0 ? (newXp / xpRequired) * 100 : 100;
    
    // Используем функции из ontology.ts для определения нового состояния
    const newState = getNextNodeState(progressPercent);
    const newIntegrationLevel = getIntegrationLevelFromState(newState);
    
    // Для состояний active и available сохраняем текущее состояние если оно уже выше
    let finalState = newState;
    if (newState === NodeState.ACTIVE && (node.state === NodeState.UNLOCKED || node.state === NodeState.INTEGRATED)) {
      finalState = node.state as NodeState;
    } else if (newState === NodeState.AVAILABLE && node.state === NodeState.ACTIVE) {
      // Не понижаем active до available при малом прогрессе
      finalState = node.state as NodeState;
    }

    // Обновляем узел
    await this.applyChange({
      ops: [
        {
          op: 'node.update',
          node_id: nodeId,
          patch: {
            xp_current: newXp,
            state: finalState,
            integration_level: newIntegrationLevel,
          },
        },
      ],
      rationale: `Updated XP for node ${nodeId}: +${xpDelta} (${progressPercent.toFixed(0)}% progress, state: ${finalState}, level: ${newIntegrationLevel})`,
      actor: userId || 'system',
      userId,
    });

    // Получаем обновленное дерево
    const updatedTree = await this.getSemantic(userId);
    const updatedNode = updatedTree.nodes.find((n) => n.node_id === nodeId)!;

    // Синхронизируем state И XP с UserAbilityState (всегда, когда userId указан)
    // Это критически важно для SSOT — UserAbilityState хранит резервную копию XP
    if (userId) {
      await this.syncStateToUserAbilityState(
        userId, 
        nodeId, 
        updatedNode.state,
        updatedNode.xp_current,  // Синхронизируем XP для защиты от потери данных
        updatedNode.xp_required,
      );
      
      // ВАЖНО: Если узел перешел в 'unlocked' или 'integrated', проверяем и разблокируем зависимые узлы
      if ((updatedNode.state === NodeState.UNLOCKED || updatedNode.state === NodeState.INTEGRATED) && 
          (node.state !== NodeState.UNLOCKED && node.state !== NodeState.INTEGRATED)) {
        await this.checkAndUnlockDependentNodes(userId, nodeId, updatedTree);
      }
    }

    return updatedNode;
  }

  /**
   * Проверить и разблокировать зависимые узлы (узлы, у которых этот узел в prerequisites)
   * Вызывается автоматически когда prerequisite узел переходит в 'unlocked' или 'integrated'
   */
  private async checkAndUnlockDependentNodes(
    userId: string,
    prerequisiteNodeId: string,
    tree: SemanticTree,
  ): Promise<void> {
    // Находим все узлы, у которых prerequisiteNodeId в prerequisites
    const dependentNodes = tree.nodes.filter((n) => {
      if (!n.prerequisites || n.prerequisites.length === 0) {
        return false;
      }
      return n.prerequisites.includes(prerequisiteNodeId) && n.state === 'locked';
    });

    if (dependentNodes.length === 0) {
      return;
    }

    this.logger.log(
      `Checking ${dependentNodes.length} dependent nodes for prerequisite ${prerequisiteNodeId}`,
    );

    // Проверяем каждый зависимый узел
    for (const dependentNode of dependentNodes) {
      if (!dependentNode.prerequisites || dependentNode.prerequisites.length === 0) {
        continue;
      }

      // Проверяем, все ли prerequisites выполнены (unlocked или integrated)
      const allPrerequisitesMet = dependentNode.prerequisites.every((prereqId: string) => {
        const prereqNode = tree.nodes.find((n) => n.node_id === prereqId);
        return (
          prereqNode &&
          (prereqNode.state === 'unlocked' || prereqNode.state === 'integrated')
        );
      });

      if (allPrerequisitesMet) {
        // Разблокируем зависимый узел (переводим в 'available')
        this.logger.log(
          `Unlocking dependent node ${dependentNode.node_id} (all prerequisites met)`,
        );

        await this.applyChange({
          ops: [
            {
              op: 'node.update',
              node_id: dependentNode.node_id,
              patch: {
                state: 'available',
              },
            },
          ],
          rationale: `Unlocked node ${dependentNode.node_id} - all prerequisites (${dependentNode.prerequisites.join(', ')}) are unlocked`,
          actor: userId || 'system',
          userId,
        });

        // Синхронизируем состояние с UserAbilityState
        if (userId) {
          await this.syncStateToUserAbilityState(userId, dependentNode.node_id, 'available');
        }
      }
    }
  }

  /**
   * Синхронизировать state и progress узла с UserAbilityState
   * TreeSemantic является источником истины для state, но UserAbilityState
   * хранит internal_progress как резервную копию XP для защиты от потери данных при auto-sync
   * 
   * @param userId - ID пользователя
   * @param nodeId - ID узла
   * @param state - новое состояние узла
   * @param xpCurrent - текущий XP (опционально, для синхронизации прогресса)
   * @param xpRequired - требуемый XP (опционально, для вычисления progress)
   */
  private async syncStateToUserAbilityState(
    userId: string,
    nodeId: string,
    state: AbilityNode['state'],
    xpCurrent?: number,
    xpRequired?: number,
  ): Promise<void> {
    try {
      // Проверяем, существует ли запись в UserAbilityState
      const existing = await this.prisma.userAbilityState.findUnique({
        where: {
          user_id_node_id: {
            user_id: userId,
            node_id: nodeId,
          },
        },
      });

      // Вычисляем progress и internal_progress если XP указан
      const updateData: any = {
        state,
        last_updated_at: new Date(),
      };

      if (xpCurrent !== undefined) {
        const xpReq = xpRequired || 100;
        // internal_progress хранит XP как число (не процент), для восстановления при необходимости
        updateData.internal_progress = xpCurrent;
        // progress хранит процент (0..1), ограничен 1.0 для отображения
        updateData.progress = Math.min(1.0, xpReq > 0 ? xpCurrent / xpReq : 0);
      }

      if (existing) {
        // Обновляем state и прогресс
        await this.prisma.userAbilityState.update({
          where: {
            user_id_node_id: {
              user_id: userId,
              node_id: nodeId,
            },
          },
          data: updateData,
        });
        this.logger.debug(`Synced state and progress for node ${nodeId} to UserAbilityState: ${state}, xp=${xpCurrent}`);
      } else {
        // Если записи нет, создаем с дефолтными значениями
        await this.prisma.userAbilityState.create({
          data: {
            user_id: userId,
            node_id: nodeId,
            state,
            progress: updateData.progress || 0,
            internal_progress: updateData.internal_progress || 0,
            relevance: 0,
            last_updated_at: new Date(),
          },
        });
        this.logger.debug(`Created UserAbilityState entry for node ${nodeId} with state: ${state}, xp=${xpCurrent}`);
      }
    } catch (error: any) {
      // Логируем ошибку, но не прерываем выполнение
      this.logger.warn(`Failed to sync state to UserAbilityState for node ${nodeId}: ${error.message}`);
    }
  }

  /**
   * Проверить версию seed и применить миграции если дерево устарело
   * Текущая версия seed: 2 (базовые узлы разблокированы)
   */
  private async checkAndMigrateSeedVersion(
    treeId: string,
    data: SemanticTree & { seed_version?: number },
  ): Promise<SemanticTree & { seed_version?: number }> {
    const CURRENT_SEED_VERSION = 2;
    const treeSeedVersion = data.seed_version || 1;

    if (treeSeedVersion >= CURRENT_SEED_VERSION) {
      return data; // Дерево актуально
    }

    this.logger.log(`Migrating tree ${treeId} from seed_version ${treeSeedVersion} to ${CURRENT_SEED_VERSION}`);

    // Миграция версия 1 -> 2: разблокировка базовых узлов
    if (treeSeedVersion < 2) {
      const basicNodesToUnlock = [
        'node_grounding_point',
        'node_architecture_coupling',
        'node_personal_resilience',
        'node_responsibility_as_form',
        'node_feedback_types',
        'node_maturity_environment',
      ];

      let updated = false;
      for (const nodeId of basicNodesToUnlock) {
        const node = data.nodes.find(n => n.node_id === nodeId);
        if (node && node.state === 'locked') {
          node.state = 'available';
          updated = true;
          this.logger.debug(`Unlocked basic node: ${nodeId}`);
        }
      }

      if (updated) {
        data.seed_version = CURRENT_SEED_VERSION;
        data.tree_revision = (data.tree_revision || 1) + 1;

        // Сохраняем обновленное дерево
        await this.prisma.treeSemantic.update({
          where: { id: treeId },
          data: {
            data: data as any,
            tree_revision: data.tree_revision,
          },
        });

        this.logger.log(`✅ Tree ${treeId} migrated to seed_version ${CURRENT_SEED_VERSION}`);
      }
    }

    return data;
  }
}

