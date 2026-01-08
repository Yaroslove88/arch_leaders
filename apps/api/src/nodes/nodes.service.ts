import { Injectable, Logger, NotFoundException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PathConfigService } from '../config/path-config.service';
import { readFile } from 'fs/promises';
import * as path from 'path';

export interface NodeDescription {
  name: string;
  full_description: string;
  practical_meaning: string;
  examples: string[];
  integration_levels: {
    Novice: string;
    Integrated: string;
    Embodied: string;
  };
  related_quests?: string[];
}

@Injectable()
export class NodesService {
  private readonly logger = new Logger(NodesService.name);
  private descriptionsCache: Record<string, NodeDescription> | null = null;

  constructor(@Inject(PathConfigService) private readonly pathConfig: PathConfigService) {
    if (!this.pathConfig) {
      throw new InternalServerErrorException('PathConfigService injection failed');
    }
  }

  private getDescriptionsPath(): string {
    if (!this.pathConfig?.getProjectRoot) {
      throw new InternalServerErrorException('PathConfigService method getProjectRoot is not available');
    }
    const projectRoot = this.pathConfig.getProjectRoot();
    return path.resolve(projectRoot, 'data', 'node-descriptions.json');
  }

  private async loadDescriptions(): Promise<Record<string, NodeDescription>> {
    if (this.descriptionsCache) {
      return this.descriptionsCache;
    }

    try {
      const descriptionsPath = this.getDescriptionsPath();
      this.logger.log(`Loading node descriptions from: ${descriptionsPath}`);
      const fileContent = await readFile(descriptionsPath, 'utf-8');
      const data = JSON.parse(fileContent);
      this.descriptionsCache = data.node_descriptions || {};
      if (this.descriptionsCache) {
        this.logger.log(`Loaded ${Object.keys(this.descriptionsCache).length} node descriptions`);
        return this.descriptionsCache;
      }
      return {};
    } catch (error: any) {
      this.logger.error(`Failed to load node descriptions from ${this.getDescriptionsPath()}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Failed to load node descriptions: ${error.message}`);
    }
  }

  async getAllDescriptions(): Promise<{ descriptions: Record<string, NodeDescription> }> {
    const descriptions = await this.loadDescriptions();
    return { descriptions };
  }

  async getNodeDescription(nodeId: string): Promise<NodeDescription> {
    const descriptions = await this.loadDescriptions();
    const description = descriptions[nodeId];
    if (!description) {
      throw new NotFoundException(`Description for node ${nodeId} not found`);
    }
    return description;
  }
}

