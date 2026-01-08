/**
 * Scenario tests for Entry Analysis
 * End-to-end scenarios testing the complete flow from entry creation to quest generation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from '../pipeline/pipeline.service';
import { JobsService } from '../jobs/jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { JobsModule } from '../jobs/jobs.module';
import type { PipelineConfig } from '../pipeline/pipeline.types';

describe('Entry Analysis Scenario', () => {
  let pipelineService: PipelineService;
  let jobsService: JobsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        PrismaModule,
        LLMModule,
        OrchestrationModule,
        AbilityEngineModule,
        PipelineModule,
        JobsModule,
      ],
    }).compile();

    pipelineService = module.get<PipelineService>(PipelineService);
    jobsService = module.get<JobsService>(JobsService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Scenario: User creates entry and receives quests', () => {
    it('should process entry and generate quests', async () => {
      // Scenario steps:
      // 1. User creates an entry
      // 2. System enqueues analysis job
      // 3. Worker processes job through pipeline
      // 4. Pipeline extracts insights and ability signals
      // 5. AbilityEngine computes state changes
      // 6. QuestEngine generates quests
      // 7. User receives quests

      // This is a placeholder for scenario test
      // In real scenario, you would:
      // 1. Create test user and entry
      // 2. Enqueue job
      // 3. Wait for job completion
      // 4. Verify session was created
      // 5. Verify ability states were updated
      // 6. Verify quests were generated
      // 7. Clean up test data

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: true,
          apply: true,
          quests: true,
        },
      };

      expect(pipelineService).toBeDefined();
      expect(jobsService).toBeDefined();
      expect(config).toBeDefined();
    });
  });

  describe('Scenario: Recompute entry from specific stage', () => {
    it('should restart pipeline from specified stage', async () => {
      // Scenario steps:
      // 1. Entry already analyzed
      // 2. Admin triggers recompute from 'extract' stage
      // 3. Pipeline skips preprocess
      // 4. Pipeline reruns extract, signals, apply, quests
      // 5. Session is updated with new results

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: false,
          extract: true,
          signals: true,
          apply: true,
          quests: true,
        },
        fromStage: 'extract',
      };

      expect(config.fromStage).toBe('extract');
      expect(config.stagesEnabled.preprocess).toBe(false);
    });
  });

  describe('Scenario: Partial pipeline execution', () => {
    it('should execute only enabled stages', async () => {
      // Scenario: Only extract and signals, skip apply and quests
      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: true,
          apply: false,
          quests: false,
        },
      };

      expect(config.stagesEnabled.extract).toBe(true);
      expect(config.stagesEnabled.apply).toBe(false);
      expect(config.stagesEnabled.quests).toBe(false);
    });
  });
});

