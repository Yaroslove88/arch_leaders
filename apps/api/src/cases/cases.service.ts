import { Injectable, Logger, NotFoundException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PathConfigService } from '../config/path-config.service';
import { AbilityStateService } from '../ability/ability-state.service';
import { TreeService } from '../tree/tree.service';
import { PrismaService } from '../prisma/prisma.service';
import { readFile } from 'fs/promises';
import * as path from 'path';

export interface InteractiveCase {
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  context: string;
  indicators?: {
    trust?: 'low' | 'medium' | 'high';
    risk?: 'low' | 'medium' | 'high';
    time?: 'low' | 'medium' | 'critical';
    chaos?: 'low' | 'medium' | 'high';
    autonomy?: 'low' | 'medium' | 'high';
    speed?: 'low' | 'medium' | 'high';
    quality?: 'low' | 'medium' | 'high';
    uncertainty?: 'low' | 'medium' | 'high';
    stakes?: 'low' | 'medium' | 'high';
  };
  pattern?: {
    trigger: string;
    behavior: string;
    result: string;
  };
  options: Array<{
    id: string;
    text: string;
    skill_used?: string;
    consequence: {
      immediate: string;
      second_order: string;
      systemic: string;
    };
    sm_impact?: {
      C?: number;
      K?: number;
      R?: number;
      S?: number;
      F?: number;
    };
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;
  reflection: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
  };
}

/**
 * Response format for case progress - computed from database records
 * This matches the frontend CaseProgress interface
 */
export interface CaseProgressResponse {
  solvedCases: string[];
  nodeProgress: Record<string, {
    solved: string[];
    progress: number;
  }>;
}

/**
 * Pattern analysis result
 */
export interface PatternAnalysis {
  totalAttempts: number;
  skillDistribution: Record<string, number>;
  mostUsedSkill: string;
  insight: string;
  recommendation?: string;
}

/**
 * Case attempt record from database
 */
export interface CaseAttemptRecord {
  caseId: string;
  selectedOption: string;
  timestamp: Date;
  skillUsed?: string;
  xpEarned: number;
  nodeId: string;
}

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);
  private casesCache: InteractiveCase[] | null = null;
  private casesCacheLoadedAt?: number;
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 минут

  constructor(
    @Inject(PathConfigService) private readonly pathConfig: PathConfigService,
    @Inject(AbilityStateService) private readonly abilityStateService: AbilityStateService,
    @Inject(TreeService) private readonly treeService: TreeService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    if (!this.pathConfig) {
      throw new InternalServerErrorException('PathConfigService injection failed');
    }
    if (!this.abilityStateService) {
      throw new InternalServerErrorException('AbilityStateService injection failed');
    }
    if (!this.prisma) {
      throw new InternalServerErrorException('PrismaService injection failed');
    }
  }

  private getCasesPath(): string {
    if (!this.pathConfig?.getProjectRoot) {
      throw new InternalServerErrorException('PathConfigService method getProjectRoot is not available');
    }
    const projectRoot = this.pathConfig.getProjectRoot();
    return path.resolve(projectRoot, 'data', 'interactive-cases.json');
  }

  private async loadCases(): Promise<InteractiveCase[]> {
    if (this.casesCache) {
      if (this.casesCacheLoadedAt && Date.now() - this.casesCacheLoadedAt < this.cacheTtlMs) {
        return this.casesCache;
      }
      this.logger.log('Cases cache expired, reloading...');
      this.casesCache = null;
    }

    try {
      const casesPath = this.getCasesPath();
      this.logger.log(`Loading cases from: ${casesPath}`);
      const fileContent = await readFile(casesPath, 'utf-8');
      const data = JSON.parse(fileContent);
      this.casesCache = data.interactive_cases || [];
      this.casesCacheLoadedAt = Date.now();
      await this.validateCaseLinks(this.casesCache || []);
      if (this.casesCache) {
        this.logger.log(`Loaded ${this.casesCache.length} cases`);
        return this.casesCache;
      }
      return [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Failed to load cases from ${this.getCasesPath()}: ${errorMessage}`);
      this.logger.error(`Error stack: ${errorStack}`);
      throw new Error(`Failed to load interactive cases: ${errorMessage}`);
    }
  }

  /**
   * Проверка связей кейсов с актуальным деревом (node_id / branch_id)
   */
  private async validateCaseLinks(cases: InteractiveCase[]): Promise<void> {
    try {
      const tree = await this.treeService.getSemantic();
      const nodeIds = new Set(tree.nodes.map((n) => n.node_id));
      const branchIds = new Set(tree.branches.map((b) => b.branch_id));

      const invalidNodes = cases
        .filter((c) => c.node_id && !nodeIds.has(c.node_id))
        .map((c) => c.id);
      const invalidBranches = cases
        .filter((c) => c.branch_id && !branchIds.has(c.branch_id))
        .map((c) => c.id);

      if (invalidNodes.length > 0) {
        this.logger.warn(
          `Cases reference missing node_id. cases=${invalidNodes.slice(0, 5).join(', ')}${invalidNodes.length > 5 ? '...' : ''}`,
        );
      }
      if (invalidBranches.length > 0) {
        this.logger.warn(
          `Cases reference missing branch_id. cases=${invalidBranches.slice(0, 5).join(', ')}${invalidBranches.length > 5 ? '...' : ''}`,
        );
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Case links validation skipped: ${msg}`);
    }
  }

  async getAllCases(): Promise<{ cases: InteractiveCase[] }> {
    const cases = await this.loadCases();
    return { cases };
  }

  async getCase(id: string): Promise<InteractiveCase> {
    const cases = await this.loadCases();
    const case_ = cases.find((c) => c.id === id);
    if (!case_) {
      throw new NotFoundException(`Case with id ${id} not found`);
    }
    return case_;
  }

  async getCasesByNode(nodeId: string): Promise<{ cases: InteractiveCase[] }> {
    const cases = await this.loadCases();
    const filtered = cases.filter((c) => c.node_id === nodeId);
    return { cases: filtered };
  }

  async getCasesByBranch(branchId: string): Promise<{ cases: InteractiveCase[] }> {
    const cases = await this.loadCases();
    const filtered = cases.filter((c) => c.branch_id === branchId);
    return { cases: filtered };
  }

  // Метод для очистки кеша (для разработки)
  clearCache(): void {
    this.casesCache = null;
    this.casesCacheLoadedAt = undefined;
    this.logger.log('Cases cache cleared');
  }

  /**
   * Get case progress for a user from database
   * Computes aggregate progress from individual CaseProgress records
   */
  async getCaseProgress(userId: string): Promise<CaseProgressResponse> {
    try {
      // Get all solved cases for this user from database
      const solvedRecords = await this.prisma.caseProgress.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
      });

      // Build the response format
      const solvedCases: string[] = [];
      const nodeProgress: Record<string, { solved: string[]; progress: number }> = {};

      // Load all cases to calculate progress percentages
      const allCases = await this.loadCases();

      // Process each solved record
      for (const record of solvedRecords) {
        solvedCases.push(record.case_id);

        // Initialize node progress if not exists
        if (!nodeProgress[record.node_id]) {
          nodeProgress[record.node_id] = { solved: [], progress: 0 };
        }

        // Add case to node's solved list if not already there
        if (!nodeProgress[record.node_id].solved.includes(record.case_id)) {
          nodeProgress[record.node_id].solved.push(record.case_id);
        }
      }

      // Calculate progress percentage for each node
      for (const nodeId of Object.keys(nodeProgress)) {
        const nodeCases = allCases.filter((c) => c.node_id === nodeId);
        const totalCount = nodeCases.length;
        const solvedCount = nodeProgress[nodeId].solved.length;
        nodeProgress[nodeId].progress = totalCount > 0 
          ? Math.round((solvedCount / totalCount) * 100) 
          : 0;
      }

      return { solvedCases, nodeProgress };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get case progress for user ${userId}: ${errorMessage}`);
      // Return empty progress on error
      return { solvedCases: [], nodeProgress: {} };
    }
  }

  /**
   * Mark a case as solved and save to database
   */
  async markCaseAsSolved(
    caseId: string,
    userId: string,
    selectedOption?: string,
    skillUsed?: string,
  ): Promise<{ success: boolean; message: string; xpEarned?: number }> {
    try {
      const cases = await this.loadCases();
      const case_ = cases.find((c) => c.id === caseId);
      
      if (!case_) {
        throw new NotFoundException(`Case with id ${caseId} not found`);
      }

      if (!case_.node_id) {
        throw new InternalServerErrorException(`Case ${caseId} is not linked to a node`);
      }

      // Check if already solved
      const existingProgress = await this.prisma.caseProgress.findUnique({
        where: {
          user_id_case_id: {
            user_id: userId,
            case_id: caseId,
          },
        },
      });

      if (existingProgress) {
        return { success: true, message: 'Case already solved', xpEarned: 0 };
      }

      // Новая система: Base XP + Reflection XP для кейсов
      // Кейсы считаются как story type согласно PRD
      const MIN_REFLECTION_LENGTH = 300;
      
      // Проверяем наличие рефлексии (Evidence с типом 'reflection' для этого узла)
      // Кейсы не имеют quest_id, поэтому проверяем по ability_node_id
      const reflectionEvidence = await this.prisma.evidence.findFirst({
        where: {
          ability_node_id: case_.node_id,
          userId: userId,
          type: 'reflection',
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // В течение последних 24 часов
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      const hasReflection =
        reflectionEvidence &&
        reflectionEvidence.text &&
        reflectionEvidence.text.trim().length >= MIN_REFLECTION_LENGTH;

      // Story type: baseXp = 60, reflectionXp = 240
      const baseXp = 60;
      const reflectionXp = hasReflection ? 240 : 0;
      const totalXp = baseXp + reflectionXp;

      // Save to database (используем старую структуру для обратной совместимости)
      await this.prisma.caseProgress.create({
        data: {
          user_id: userId,
          case_id: caseId,
          node_id: case_.node_id,
          selected_option: selectedOption || 'unknown',
          xp_earned: totalXp, // Сохраняем общий XP
        },
      });

      // Apply experience to the ability node с новой системой
      try {
        const questDifficulty = case_.difficulty === 'basic' 
          ? 'basic' 
          : case_.difficulty === 'intermediate' 
          ? 'intermediate' 
          : 'advanced';

        await this.abilityStateService.applyQuestExperience(
          userId,
          case_.node_id,
          baseXp,
          reflectionXp,
          questDifficulty,
        );

        const reflectionText = hasReflection 
          ? `${baseXp} base + ${reflectionXp} reflection` 
          : `${baseXp} base (no reflection)`;
        this.logger.log(
          `Applied ${totalXp} XP (${reflectionText}) to node ${case_.node_id} for user ${userId} from case ${caseId}`,
        );
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to apply experience for case ${caseId} to node ${case_.node_id}: ${errorMessage}`,
        );
        // Don't fail the operation if XP application fails
      }

      this.logger.log(`Case ${caseId} marked as solved for user ${userId}`);
      return { success: true, message: 'Case marked as solved', xpEarned: totalXp };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to mark case as solved: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get pattern analysis for a user based on their case attempts
   */
  async getPatternAnalysis(userId: string): Promise<PatternAnalysis> {
    try {
      const attempts = await this.prisma.caseProgress.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
      });

      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          skillDistribution: {},
          mostUsedSkill: '',
          insight: 'Пока нет данных для анализа. Пройди несколько кейсов, чтобы увидеть свои паттерны.',
        };
      }

      // Load cases to get skill information
      const allCases = await this.loadCases();
      const skillCounts: Record<string, number> = {};

      for (const attempt of attempts) {
        const case_ = allCases.find((c) => c.id === attempt.case_id);
        if (case_) {
          const option = case_.options.find((o) => o.id === attempt.selected_option);
          const skillUsed = option?.skill_used || 'Unknown';
          skillCounts[skillUsed] = (skillCounts[skillUsed] || 0) + 1;
        }
      }

      // Find most used skill
      const mostUsedSkill = Object.entries(skillCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // Generate insight
      const total = attempts.length;
      const mostUsedCount = skillCounts[mostUsedSkill] || 0;
      const percentage = Math.round((mostUsedCount / total) * 100);
      
      let insight = '';
      let recommendation = '';

      if (mostUsedSkill === 'Direct Order') {
        insight = `Ты часто выбираешь Прямой приказ (${percentage}% решений). Это быстро решает проблемы, но может снижать автономию команды.`;
        recommendation = 'Попробуй кейсы на "Передачу контекста" или "Дать сломаться" для развития системного мышления.';
      } else if (mostUsedSkill === 'Context Share') {
        insight = `Ты часто используешь Передачу контекста (${percentage}% решений). Это хорошо для развития команды.`;
        recommendation = 'Попробуй кейсы на "Дать сломаться" для тренировки удержания напряжения.';
      } else if (mostUsedSkill === 'Let It Break') {
        insight = `Ты часто выбираешь Дать сломаться (${percentage}% решений). Это развивает системное мышление и автономию.`;
        recommendation = 'Отличный паттерн! Продолжай развивать способность удерживать напряжение.';
      } else if (mostUsedSkill === 'Avoidance') {
        insight = `Ты часто избегаешь решений (${percentage}% решений). Это может быть признаком нежелания брать ответственность.`;
        recommendation = 'Попробуй кейсы на "Делегирование" и "Передачу контекста" для развития ответственности.';
      } else {
        insight = `Твой основной паттерн: ${mostUsedSkill} (${percentage}% решений).`;
      }

      return {
        totalAttempts: total,
        skillDistribution: skillCounts,
        mostUsedSkill,
        insight,
        recommendation,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to analyze patterns for user ${userId}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get all case attempts for a user
   */
  async getCaseAttempts(userId: string): Promise<CaseAttemptRecord[]> {
    try {
      const records = await this.prisma.caseProgress.findMany({
        where: { user_id: userId },
        orderBy: { completed_at: 'desc' },
      });

      return records.map((r) => ({
        caseId: r.case_id,
        selectedOption: r.selected_option,
        timestamp: r.completed_at,
        xpEarned: r.xp_earned,
        nodeId: r.node_id,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get case attempts for user ${userId}: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Get information about case availability for a user
   */
  async getCaseAvailability(caseId: string, userId: string): Promise<{
    available: boolean;
    reason: string;
    requirements: {
      questsRequired: number;
      questsCompleted: number;
      progressRequired: number;
      currentProgress: number;
      nodeState: string;
    };
  }> {
    const cases = await this.loadCases();
    const case_ = cases.find((c) => c.id === caseId);
    
    if (!case_) {
      throw new NotFoundException(`Case with id ${caseId} not found`);
    }

    if (!case_.node_id) {
      return {
        available: false,
        reason: 'Кейс не привязан к узлу.',
        requirements: {
          questsRequired: 1,
          questsCompleted: 0,
          progressRequired: 0,
          currentProgress: 0,
          nodeState: 'unknown',
        },
      };
    }

    // Get tree for node state check
    const tree = await this.treeService.getSemantic(userId);
    const node = tree.nodes.find((n: { node_id: string }) => n.node_id === case_.node_id);
    
    if (!node) {
      return {
        available: false,
        reason: 'Узел не найден в дереве.',
        requirements: {
          questsRequired: 1,
          questsCompleted: 0,
          progressRequired: 0,
          currentProgress: 0,
          nodeState: 'unknown',
        },
      };
    }

    const nodeState = node.state;

    // Get user's progress for this node from database
    const userProgress = await this.getCaseProgress(userId);
    const nodeProgress = userProgress.nodeProgress[case_.node_id] || { progress: 0, solved: [] };

    // Count completed quests for this node
    const questsCompleted = await this.prisma.quest.count({
      where: {
        userId: userId,
        status: 'done',
        linked_nodes: { has: case_.node_id },
      },
    });

    // Determine requirements based on difficulty
    let progressRequired = 0;
    if (case_.difficulty === 'intermediate') {
      progressRequired = 30;
    } else if (case_.difficulty === 'advanced') {
      progressRequired = 60;
    }

    // Check availability
    let available = false;
    let reason = '';

    // 1. Check node state
    if (nodeState === 'locked') {
      reason = 'Узел заблокирован. Разблокируйте его через развитие предыдущих способностей.';
    } else if (questsCompleted === 0) {
      // 2. Check for completed quests
      reason = 'Для доступа к кейсам сначала выполните хотя бы один квест на этом узле.';
    } else if (case_.difficulty === 'basic') {
      // Basic cases available after first quest
      available = true;
      reason = 'Кейс доступен.';
    } else if (case_.difficulty === 'intermediate') {
      // Intermediate requires progress >= 30% or >= 1 solved case
      if (nodeProgress.progress >= 30 || nodeProgress.solved.length >= 1) {
        available = true;
        reason = 'Кейс доступен.';
      } else {
        reason = `Для доступа к intermediate кейсам нужен прогресс ≥30% или хотя бы 1 решенный basic кейс. Текущий прогресс: ${nodeProgress.progress}%.`;
      }
    } else if (case_.difficulty === 'advanced') {
      // Advanced requires active/unlocked/integrated state and progress >= 60%
      if (nodeState === 'available') {
        reason = 'Для доступа к advanced кейсам узел должен быть активен (active или выше).';
      } else if (nodeProgress.progress >= 60 || nodeProgress.solved.length >= 2) {
        available = true;
        reason = 'Кейс доступен.';
      } else {
        reason = `Для доступа к advanced кейсам нужен прогресс ≥60% или ≥2 решенных кейса. Текущий прогресс: ${nodeProgress.progress}%.`;
      }
    }

    return {
      available,
      reason,
      requirements: {
        questsRequired: 1,
        questsCompleted,
        progressRequired,
        currentProgress: nodeProgress.progress,
        nodeState,
      },
    };
  }
}
