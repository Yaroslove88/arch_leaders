import { Test, TestingModule } from '@nestjs/testing';
import { QuestEngine } from './quest-engine.service';
import type { QuestGenerationInput, NodeInfo } from './quest-engine.types';

describe('QuestEngine', () => {
  let engine: QuestEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestEngine],
    }).compile();

    engine = module.get<QuestEngine>(QuestEngine);
  });

  describe('generateQuests', () => {
    it('should generate micro quests from ability signals', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: [
          { node_id: 'node-1', signal: 'demonstrated leadership' },
          { node_id: 'node-2', signal: 'showed empathy' },
        ],
        themes: [],
        patterns: [],
        focus: [],
        nodeInfos: new Map<string, NodeInfo>([
          [
            'node-1',
            {
              node_id: 'node-1',
              name: 'Leadership',
              level: 'basic',
              branch: 'communication',
            },
          ],
          [
            'node-2',
            {
              node_id: 'node-2',
              name: 'Empathy',
              level: 'mid',
              branch: 'emotional',
            },
          ],
        ]),
      };

      const result = engine.generateQuests(input);

      expect(result.quests.length).toBeGreaterThan(0);
      expect(result.summary.byType.micro).toBeGreaterThan(0);
      expect(result.quests[0].type).toBe('micro');
      expect(result.quests[0].criteria.type).toBe('evidence');
      expect(result.quests[0].criteria.target).toBe(3);
    });

    it('should generate weekly quests from high priority focus', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: [],
        themes: [],
        patterns: [],
        focus: [
          { area: 'Communication', priority: 'high' },
          { area: 'Decision Making', priority: 'high' },
        ],
        nodeInfos: new Map(),
      };

      const result = engine.generateQuests(input);

      expect(result.quests.length).toBeGreaterThan(0);
      expect(result.summary.byType.weekly).toBeGreaterThan(0);
      const weeklyQuest = result.quests.find((q) => q.type === 'weekly');
      expect(weeklyQuest).toBeDefined();
      if (weeklyQuest) {
        expect(weeklyQuest.criteria.type).toBe('count');
        expect(weeklyQuest.criteria.target).toBe(5);
      }
    });

    it('should generate story quest from main theme', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: [],
        themes: ['Team Collaboration', 'Conflict Resolution'],
        patterns: [],
        focus: [],
        nodeInfos: new Map(),
      };

      const result = engine.generateQuests(input);

      expect(result.quests.length).toBeGreaterThan(0);
      expect(result.summary.byType.story).toBe(1);
      const storyQuest = result.quests.find((q) => q.type === 'story');
      expect(storyQuest).toBeDefined();
      if (storyQuest) {
        expect(storyQuest.criteria.type).toBe('custom');
        expect(storyQuest.title).toContain('Team Collaboration');
      }
    });

    it('should respect maxQuests limits', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: Array.from({ length: 20 }, (_, i) => ({
          node_id: `node-${i}`,
          signal: `signal-${i}`,
        })),
        themes: [],
        patterns: [],
        focus: [],
        nodeInfos: new Map(),
      };

      const result = engine.generateQuests(input);

      // Максимум 10 квестов из ability signals
      expect(result.summary.byType.micro).toBeLessThanOrEqual(10);
    });

    it('should include correct rewards for each quest type', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: [{ node_id: 'node-1', signal: 'test' }],
        themes: ['Test Theme'],
        patterns: [],
        focus: [{ area: 'Test Area', priority: 'high' }],
        nodeInfos: new Map([
          [
            'node-1',
            {
              node_id: 'node-1',
              name: 'Test Node',
              level: 'basic',
              branch: 'test',
            },
          ],
        ]),
      };

      const result = engine.generateQuests(input);

      const microQuest = result.quests.find((q) => q.type === 'micro');
      expect(microQuest?.reward?.xp).toBe(100);
      expect(microQuest?.reward?.skill_xp).toBe(50);

      const weeklyQuest = result.quests.find((q) => q.type === 'weekly');
      expect(weeklyQuest?.reward?.xp).toBe(200);
      expect(weeklyQuest?.reward?.skill_xp).toBe(100);

      const storyQuest = result.quests.find((q) => q.type === 'story');
      expect(storyQuest?.reward?.xp).toBe(300);
    });

    it('should return empty quests when no input data', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        abilitySignals: [],
        themes: [],
        patterns: [],
        focus: [],
        nodeInfos: new Map(),
      };

      const result = engine.generateQuests(input);

      expect(result.quests.length).toBe(0);
      expect(result.summary.total).toBe(0);
    });

    it('should link nodes to ability quests', () => {
      const input: QuestGenerationInput = {
        userId: 'user-1',
        sessionId: 'session-1',
        abilitySignals: [{ node_id: 'node-1', signal: 'test signal' }],
        themes: [],
        patterns: [],
        focus: [],
        nodeInfos: new Map([
          [
            'node-1',
            {
              node_id: 'node-1',
              name: 'Test Node',
              level: 'basic',
              branch: 'test',
            },
          ],
        ]),
      };

      const result = engine.generateQuests(input);

      const quest = result.quests.find((q) => q.type === 'micro');
      expect(quest?.linked_nodes).toContain('node-1');
    });
  });

  describe('getRule', () => {
    it('should return rule for valid rule key', () => {
      const rule = engine.getRule('ability_micro');
      expect(rule).toBeDefined();
      expect(rule?.type).toBe('micro');
      expect(rule?.criteriaType).toBe('evidence');
    });

    it('should return undefined for invalid rule key', () => {
      const rule = engine.getRule('invalid_rule');
      expect(rule).toBeUndefined();
    });
  });

  describe('calculateReward', () => {
    it('should calculate rewards with level multipliers', () => {
      const basicReward = engine.calculateReward('micro', 'basic');
      const advancedReward = engine.calculateReward('micro', 'advanced');
      const masterReward = engine.calculateReward('micro', 'master');

      expect(advancedReward.xp).toBeGreaterThan(basicReward.xp);
      expect(masterReward.xp).toBeGreaterThan(advancedReward.xp);
    });
  });
});

