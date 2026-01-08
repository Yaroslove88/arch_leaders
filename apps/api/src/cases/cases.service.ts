import { Injectable, Logger, NotFoundException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PathConfigService } from '../config/path-config.service';
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

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);
  private casesCache: InteractiveCase[] | null = null;

  constructor(@Inject(PathConfigService) private readonly pathConfig: PathConfigService) {
    if (!this.pathConfig) {
      throw new InternalServerErrorException('PathConfigService injection failed');
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
      return this.casesCache;
    }

    try {
      const casesPath = this.getCasesPath();
      this.logger.log(`Loading cases from: ${casesPath}`);
      const fileContent = await readFile(casesPath, 'utf-8');
      const data = JSON.parse(fileContent);
      this.casesCache = data.interactive_cases || [];
      if (this.casesCache) {
        this.logger.log(`Loaded ${this.casesCache.length} cases`);
        return this.casesCache;
      }
      return [];
    } catch (error: any) {
      this.logger.error(`Failed to load cases from ${this.getCasesPath()}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Failed to load interactive cases: ${error.message}`);
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
    this.logger.log('Cases cache cleared');
  }
}

