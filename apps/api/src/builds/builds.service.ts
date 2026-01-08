import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import { PathConfigService } from '../config/path-config.service';
import { readFile, access } from 'fs/promises';
import * as path from 'path';
import { TreeService } from '../tree/tree.service';

export interface Build {
  build_id: string;
  name: string;
  icon: string;
  fantasy: string;
  description: string;
  entry_conditions: {
    required_skills?: string[];
    behavioral_patterns?: Record<string, any>;
    min_skills_count?: number;
  };
  bonuses: Record<string, any>;
  hidden_costs: Record<string, any>;
  exit_conditions: Record<string, any>;
  related_nodes: string[];
  color: string;
}

export interface BuildStatus {
  build_id: string;
  name: string;
  icon: string;
  is_active: boolean;
  activation_percentage: number;
  matched_conditions: string[];
  missing_conditions: string[];
  bonuses_active: boolean;
  risks_active: boolean;
}

@Injectable()
export class BuildsService {
  private readonly logger = new Logger(BuildsService.name);
  private buildsCache: Build[] | null = null;

  constructor(
    @Inject(PathConfigService) private readonly pathConfig: PathConfigService,
    @Inject(TreeService) private readonly treeService: TreeService,
  ) {
    if (!this.pathConfig) {
      throw new InternalServerErrorException('PathConfigService injection failed');
    }
    if (!this.treeService) {
      throw new InternalServerErrorException('TreeService injection failed');
    }
  }

  private getBuildsPath(): string {
    if (!this.pathConfig?.getProjectRoot) {
      throw new InternalServerErrorException('PathConfigService method getProjectRoot is not available');
    }
    const projectRoot = this.pathConfig.getProjectRoot();
    return path.resolve(projectRoot, 'data', 'builds.json');
  }

  private async loadBuilds(): Promise<Build[]> {
    if (this.buildsCache) {
      return this.buildsCache;
    }

    try {
      const buildsPath = this.getBuildsPath();
      this.logger.log(`Loading builds from: ${buildsPath}`);
      
      // Проверка существования файла
      try {
        await access(buildsPath);
      } catch (accessError) {
        this.logger.error(`Builds file not found at: ${buildsPath}`);
        throw new Error(`Builds file not found at: ${buildsPath}`);
      }

      const fileContent = await readFile(buildsPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid builds file format: root must be an object');
      }
      
      this.buildsCache = data.builds || [];
      if (this.buildsCache) {
        this.logger.log(`✅ Loaded ${this.buildsCache.length} builds`);
        
        if (this.buildsCache.length === 0) {
          this.logger.warn('⚠️ No builds found in file. Check builds.json structure.');
        }
        
        return this.buildsCache;
      }
      return [];
    } catch (error: any) {
      this.logger.error(`❌ Failed to load builds from ${this.getBuildsPath()}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Failed to load builds: ${error.message}`);
    }
  }

  async getAllBuilds(): Promise<{ builds: Build[] }> {
    const builds = await this.loadBuilds();
    return { builds };
  }

  async getBuild(buildId: string): Promise<Build> {
    const builds = await this.loadBuilds();
    const build = builds.find((b) => b.build_id === buildId);
    if (!build) {
      throw new Error(`Build with id ${buildId} not found`);
    }
    return build;
  }

  /**
   * Определить текущий билд пользователя на основе прогресса в дереве
   * @param userId ID пользователя (опционально, если не указан - используется глобальное дерево)
   */
  async detectCurrentBuild(userId?: string): Promise<BuildStatus[]> {
    const builds = await this.loadBuilds();
    const tree = await this.treeService.getSemantic(userId);
    
    // Получаем активные/разблокированные узлы
    const activeNodes = tree.nodes.filter(
      (n) => n.state === 'active' || n.state === 'unlocked' || n.state === 'integrated'
    );
    const activeNodeIds = activeNodes.map((n) => n.node_id);
    
    this.logger.log(`🔍 Detecting builds. Active nodes: ${activeNodeIds.length}/${tree.nodes.length}`);
    this.logger.log(`   Active node IDs: ${activeNodeIds.slice(0, 5).join(', ')}${activeNodeIds.length > 5 ? '...' : ''}`);

    const buildStatuses: BuildStatus[] = [];

    for (const build of builds) {
      const matchedConditions: string[] = [];
      const missingConditions: string[] = [];
      let activationScore = 0;
      let maxScore = 0;

      // Проверка навыков
      if (build.entry_conditions.required_skills) {
        const requiredSkills = build.entry_conditions.required_skills;
        const minSkillsCount = build.entry_conditions.min_skills_count || requiredSkills.length;
        maxScore += minSkillsCount;

        const matchedSkills = requiredSkills.filter((skillId) =>
          activeNodeIds.includes(skillId)
        );
        
        if (matchedSkills.length >= minSkillsCount) {
          matchedConditions.push(`Навыки: ${matchedSkills.length}/${requiredSkills.length}`);
          activationScore += matchedSkills.length;
        } else {
          missingConditions.push(`Навыки: нужно ${minSkillsCount}, есть ${matchedSkills.length}`);
        }
      }

      // Проверка связанных узлов (дополнительный бонус)
      const relatedActive = build.related_nodes.filter((nodeId) =>
        activeNodeIds.includes(nodeId)
      );
      if (relatedActive.length >= 2) {
        matchedConditions.push(`Связанные узлы: ${relatedActive.length}`);
        activationScore += 0.5;
        maxScore += 0.5;
      }

      const activationPercentage = maxScore > 0 ? (activationScore / maxScore) * 100 : 0;
      const isActive = activationPercentage >= 60; // Порог активации 60%

      buildStatuses.push({
        build_id: build.build_id,
        name: build.name,
        icon: build.icon,
        is_active: isActive,
        activation_percentage: Math.round(activationPercentage),
        matched_conditions: matchedConditions,
        missing_conditions: missingConditions,
        bonuses_active: isActive,
        risks_active: isActive,
      });
    }

    // Сортируем по проценту активации (самый активный первый)
    return buildStatuses.sort((a, b) => b.activation_percentage - a.activation_percentage);
  }

  /**
   * Получить билды, связанные с узлом
   */
  async getBuildsByNode(nodeId: string): Promise<{ builds: Build[] }> {
    const builds = await this.loadBuilds();
    const filtered = builds.filter((b) =>
      b.related_nodes.includes(nodeId) ||
      b.entry_conditions.required_skills?.includes(nodeId)
    );
    return { builds: filtered };
  }
}

