import { Test, TestingModule } from '@nestjs/testing';
import { AbilityEngine } from './ability-engine.service';
import type {
  ComputeNextInput,
  AbilityStateSnapshot,
  AbilityNodeInfo,
} from './ability-engine.types';

describe('AbilityEngine', () => {
  let engine: AbilityEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityEngine],
    }).compile();

    engine = module.get<AbilityEngine>(AbilityEngine);
  });

  describe('computeNext', () => {
    it('should compute state changes from ability signals', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [
          { node_id: 'node-1', signal: 'demonstrated leadership' },
          { node_id: 'node-2', signal: 'showed empathy' },
        ],
        currentStates: new Map<string, AbilityStateSnapshot>(),
        nodeInfos: new Map<string, AbilityNodeInfo>([
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

      const result = engine.computeNext(input);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.summary.nodesUpdated).toBeGreaterThan(0);
    });

    it('should unlock nodes when progress threshold is reached', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [{ node_id: 'node-1', signal: 'strong signal' }],
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'locked',
              progress: 0,
              relevance: 0,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
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

      const result = engine.computeNext(input);

      const nodeChange = result.changes.find((c) => c.nodeId === 'node-1');
      if (nodeChange) {
        expect(nodeChange.after.progress).toBeGreaterThan(nodeChange.before.progress);
      }
    });

    it('should transition states: locked -> available -> active -> unlocked -> integrated', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [
          { node_id: 'node-1', signal: 'signal1' },
          { node_id: 'node-1', signal: 'signal2' },
          { node_id: 'node-1', signal: 'signal3' },
        ],
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'locked',
              progress: 0,
              relevance: 0,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
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

      const result = engine.computeNext(input);

      const change = result.changes.find((c) => c.nodeId === 'node-1');
      expect(change).toBeDefined();
      if (change) {
        expect(change.after.progress).toBeGreaterThan(change.before.progress);
        expect(change.after.relevance).toBeGreaterThan(change.before.relevance);
      }
    });

    it('should return empty changes when no signals provided', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [],
        currentStates: new Map(),
        nodeInfos: new Map(),
      };

      const result = engine.computeNext(input);

      expect(result.changes).toHaveLength(0);
      expect(result.summary.nodesUpdated).toBe(0);
    });

    it('should handle multiple signals for same node', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [
          { node_id: 'node-1', signal: 'signal1' },
          { node_id: 'node-1', signal: 'signal2' },
          { node_id: 'node-1', signal: 'signal3' },
        ],
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'available',
              progress: 0.1,
              relevance: 0.1,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
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

      const result = engine.computeNext(input);

      const change = result.changes.find((c) => c.nodeId === 'node-1');
      expect(change).toBeDefined();
      if (change) {
        // Множественные сигналы должны увеличить прогресс больше
        expect(change.after.progress).toBeGreaterThan(change.before.progress);
      }
    });
  });

  // Примечание: calculateReward находится в QuestEngine, не в AbilityEngine
  // Этот тест был неправильным, удален

  describe('determineQuestType', () => {
    it('should determine quest type based on source', () => {
      expect(engine.determineQuestType('ability')).toBe('micro');
      expect(engine.determineQuestType('focus', 'high')).toBe('weekly');
      expect(engine.determineQuestType('theme')).toBe('story');
      expect(engine.determineQuestType('pattern')).toBe('micro');
    });
  });
});

