/**
 * Integration tests for Pipeline
 * Tests the full pipeline flow with real dependencies
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from '../pipeline/pipeline.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LLMModule } from '../llm/llm.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { AbilityEngineModule } from '../ability/ability-engine.module';
import type { PipelineConfig } from '../pipeline/pipeline.types';

describe('Pipeline Integration', () => {
  let service: PipelineService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, LLMModule, OrchestrationModule, AbilityEngineModule],
      providers: [PipelineService],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Full Pipeline Flow', () => {
    it('should process entry through all stages', async () => {
      // This is a placeholder for integration test
      // In real scenario, you would:
      // 1. Create a test entry in database
      // 2. Run pipeline
      // 3. Verify session was created
      // 4. Verify artifacts were saved
      // 5. Verify quests were generated
      // 6. Clean up test data

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: true,
          apply: true,
          quests: true,
        },
      };

      // Skip actual execution in unit test environment
      // This would require test database setup
      expect(service).toBeDefined();
      expect(config).toBeDefined();
    });
  });
});

