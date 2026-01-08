import { Test, TestingModule } from '@nestjs/testing';
import { PipelineService } from './pipeline.service';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from '../llm/llm.service';
import { QuestOrchestrationService } from '../orchestration/quest-orchestration.service';
import { AbilityStateService } from '../ability/ability-state.service';
import type { PipelineConfig } from './pipeline.types';

describe('PipelineService', () => {
  let service: PipelineService;
  let prismaService: jest.Mocked<PrismaService>;
  let llmService: jest.Mocked<LLMService>;
  let questOrchestration: jest.Mocked<QuestOrchestrationService>;
  let abilityStateService: jest.Mocked<AbilityStateService>;

  beforeEach(async () => {
    const mockPrisma = {
      entry: {
        findUnique: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sessionArtifact: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockLLM = {
      analyzeSituation: jest.fn(),
    };

    const mockOrchestration = {
      handleSessionAnalyzed: jest.fn(),
    };

    const mockAbilityState = {
      applySignals: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: LLMService,
          useValue: mockLLM,
        },
        {
          provide: QuestOrchestrationService,
          useValue: mockOrchestration,
        },
        {
          provide: AbilityStateService,
          useValue: mockAbilityState,
        },
      ],
    }).compile();

    service = module.get<PipelineService>(PipelineService);
    prismaService = module.get(PrismaService);
    llmService = module.get(LLMService);
    questOrchestration = module.get(QuestOrchestrationService);
    abilityStateService = module.get(AbilityStateService);
  });

  describe('runPipeline', () => {
    it('should run full pipeline with all stages enabled', async () => {
      const entryId = 'entry-1';
      const userId = 'user-1';

      prismaService.entry.findUnique.mockResolvedValue({
        id: entryId,
        userId,
        text: 'Test entry text',
        type: 'situation',
        participants: [],
        context_json: null,
      });

      prismaService.session.findUnique.mockResolvedValue(null);

      llmService.analyzeSituation.mockResolvedValue({
        summary: 'Test summary',
        themes: ['Theme 1'],
        patterns: ['Pattern 1'],
        tensions: ['Tension 1'],
        insights: [{ title: 'Insight 1', description: 'Desc 1' }],
        focus: [{ area: 'Area 1', priority: 'high' }],
        ability_signals: [{ node_id: 'node-1', signal: 'signal-1' }],
      });

      prismaService.session.create.mockResolvedValue({
        id: 'session-1',
        userId,
        entry_id: entryId,
        summary: 'Test summary',
        insights_json: [],
        focus_json: [],
        themes: [],
        patterns: [],
        tensions: [],
        ability_signals_json: [],
        status: 'processing',
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      abilityStateService.applySignals.mockResolvedValue({
        changes: [],
      });

      questOrchestration.handleSessionAnalyzed.mockResolvedValue(0);

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: true,
          apply: true,
          quests: true,
        },
      };

      const result = await service.runPipeline({
        entryId,
        userId,
        config,
      });

      expect(result.sessionId).toBeDefined();
      expect(result.stages.preprocess.success).toBe(true);
      expect(result.stages.extract.success).toBe(true);
      expect(result.stages.signals.success).toBe(true);
      expect(result.stages.apply.success).toBe(true);
      expect(result.stages.quests.success).toBe(true);
    });

    it('should skip disabled stages', async () => {
      const entryId = 'entry-1';
      const userId = 'user-1';

      prismaService.entry.findUnique.mockResolvedValue({
        id: entryId,
        userId,
        text: 'Test entry text',
        type: 'situation',
        participants: [],
        context_json: null,
      });

      prismaService.session.findUnique.mockResolvedValue(null);

      llmService.analyzeSituation.mockResolvedValue({
        summary: 'Test summary',
        themes: [],
        patterns: [],
        tensions: [],
        insights: [],
        focus: [],
        ability_signals: [],
      });

      prismaService.session.create.mockResolvedValue({
        id: 'session-1',
        userId,
        entry_id: entryId,
        summary: 'Test summary',
        insights_json: [],
        focus_json: [],
        themes: [],
        patterns: [],
        tensions: [],
        ability_signals_json: [],
        status: 'processing',
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: true,
          extract: true,
          signals: false,
          apply: false,
          quests: false,
        },
      };

      const result = await service.runPipeline({
        entryId,
        userId,
        config,
      });

      expect(result.stages.preprocess.success).toBe(true);
      expect(result.stages.extract.success).toBe(true);
      expect(result.stages.signals.success).toBe(false); // Skipped
      expect(result.stages.apply.success).toBe(false); // Skipped
      expect(result.stages.quests.success).toBe(false); // Skipped
    });

    it('should start from specified stage', async () => {
      const entryId = 'entry-1';
      const userId = 'user-1';
      const sessionId = 'session-1';

      prismaService.session.findUnique.mockResolvedValue({
        id: sessionId,
        userId,
        entry_id: entryId,
        ability_signals_json: [{ node_id: 'node-1', signal: 'signal-1' }],
      });

      abilityStateService.applySignals.mockResolvedValue({
        changes: [],
      });

      questOrchestration.handleSessionAnalyzed.mockResolvedValue(0);

      const config: PipelineConfig = {
        stagesEnabled: {
          preprocess: false,
          extract: false,
          signals: true,
          apply: true,
          quests: true,
        },
        fromStage: 'signals',
      };

      const result = await service.runPipeline({
        entryId,
        sessionId,
        userId,
        config,
      });

      expect(result.stages.preprocess.success).toBe(false); // Skipped
      expect(result.stages.extract.success).toBe(false); // Skipped
      expect(result.stages.signals.success).toBe(true);
      expect(result.stages.apply.success).toBe(true);
      expect(result.stages.quests.success).toBe(true);
    });
  });
});

