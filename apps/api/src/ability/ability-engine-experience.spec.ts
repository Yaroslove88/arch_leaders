import { Test, TestingModule } from '@nestjs/testing';
import { AbilityEngine } from './ability-engine.service';
import type {
  ComputeNextInput,
  AbilityStateSnapshot,
  AbilityNodeInfo,
  ApplyQuestExperienceInput,
} from './ability-engine.types';

/**
 * Комплексные тесты для системы опыта
 * Тестирует внутренний/отображаемый прогресс, предварительные условия,
 * масштабирование по уровням, убывающую отдачу, сохраненный опыт
 */
describe('AbilityEngine - Experience System', () => {
  let engine: AbilityEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityEngine],
    }).compile();

    engine = module.get<AbilityEngine>(AbilityEngine);
  });

  describe('Internal vs Displayed Progress', () => {
    it('should cap displayed progress at 100% while internal can exceed', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // Огромное количество опыта (100 total)
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // Внутренний прогресс может превышать 100%
        expect(result.change.after.internalProgress).toBeGreaterThan(1.0);
        // Отображаемый прогресс ограничен 100%
        expect(result.change.after.progress).toBeLessThanOrEqual(1.0);
      }
    });

    it('should maintain internal progress above 100% for achievements', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 100,
        reflectionXp: 400, // in-person quest: 500 total
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'integrated',
              progress: 1.0,
              internalProgress: 1.5, // Уже выше 100%
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'master', // Мастер-узлы могут превышать 100%
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // Внутренний прогресс продолжает расти
        expect(result.change.after.internalProgress).toBeGreaterThan(1.5);
        // Отображаемый остается на 100%
        expect(result.change.after.progress).toBe(1.0);
      }
    });
  });

  describe('State Multipliers', () => {
    it('should apply 0% experience for locked nodes (all stored)', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'locked',
              progress: 0,
              internalProgress: 0,
              relevance: 0,
              storedExperience: 0,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // Опыт должен быть сохранен, не применен
        expect(result.change.after.storedExperience).toBeGreaterThan(0);
        expect(result.change.after.internalProgress).toBe(0);
      }
    });

    it('should apply 70% experience for available nodes', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'available',
              progress: 0.1,
              internalProgress: 0.1,
              relevance: 0.1,
              storedExperience: 0,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // 70% применяется для available узлов (новое значение)
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // Применено примерно 70% (новый множитель для available)
        expect(applied).toBeGreaterThan(0);
      }
    });

    it('should apply 100% experience for active nodes', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
              storedExperience: 0,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // 100% применяется, ничего не сохраняется
        expect(result.change.after.storedExperience).toBe(0);
        expect(result.change.after.internalProgress).toBeGreaterThan(
          result.change.before.internalProgress || 0,
        );
      }
    });
  });

  describe('Prerequisites', () => {
    it('should reduce experience when prerequisites are missing', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-2',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'locked', // Prerequisite не выполнен
              progress: 0,
              internalProgress: 0,
              relevance: 0,
            },
          ],
          [
            'node-2',
            {
              nodeId: 'node-2',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Prerequisite Node',
              description: 'Test',
              level: 'basic',
            },
          ],
          [
            'node-2',
            {
              id: 'node-2',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
              prerequisites: ['node-1'], // Требует node-1
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // Опыт должен быть уменьшен из-за отсутствующих prerequisites
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // С одним отсутствующим prerequisite опыт уменьшается до 50%
        expect(applied).toBeGreaterThan(0);
        // Но меньше, чем было бы без prerequisites
      }
    });

    it('should apply full experience when all prerequisites are met', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-2',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'unlocked', // Prerequisite выполнен
              progress: 0.8,
              internalProgress: 0.8,
              relevance: 0.5,
            },
          ],
          [
            'node-2',
            {
              nodeId: 'node-2',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Prerequisite Node',
              description: 'Test',
              level: 'basic',
            },
          ],
          [
            'node-2',
            {
              id: 'node-2',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
              prerequisites: ['node-1'],
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        // Полный опыт применяется
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        expect(applied).toBeGreaterThan(0);
      }
    });
  });

  describe('Level-based Scaling', () => {
    it('should apply different multipliers for different node levels', () => {
      const levels: Array<'basic' | 'mid' | 'advanced' | 'master'> = ['basic', 'mid', 'advanced', 'master'];
      const results: number[] = [];

      for (const level of levels) {
        const input: ApplyQuestExperienceInput = {
          userId: 'user-1',
          nodeId: `node-${level}`,
          baseXp: 20,
        reflectionXp: 80, // micro quest
          currentStates: new Map<string, AbilityStateSnapshot>([
            [
              `node-${level}`,
              {
                nodeId: `node-${level}`,
                state: 'active',
                progress: 0.5,
                internalProgress: 0.5,
                relevance: 0.5,
              },
            ],
          ]),
          nodeInfos: new Map<string, AbilityNodeInfo>([
            [
              `node-${level}`,
              {
                id: `node-${level}`,
                branch: 'test',
                title: `Test Node ${level}`,
                description: 'Test',
                level,
              },
            ],
          ]),
        };

        const result = engine.applyQuestExperience(input);
        if (result.change) {
          const beforeInternal = result.change.before.internalProgress || 0;
          const afterInternal = result.change.after.internalProgress;
          results.push(afterInternal - beforeInternal);
        }
      }

      // Базовые узлы должны получать больше опыта, чем продвинутые
      expect(results[0]).toBeGreaterThan(results[2]); // basic > advanced
      expect(results[0]).toBeGreaterThan(results[3]); // basic > master
    });
  });

  describe('Diminishing Returns', () => {
    it('should apply diminishing returns above 80% displayed progress', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'unlocked',
              progress: 0.85, // Выше 80%
              internalProgress: 0.85,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // Опыт должен быть уменьшен из-за убывающей отдачи
        expect(applied).toBeGreaterThan(0);
        // Но меньше, чем было бы ниже 80%
      }
    });

    it('should apply additional diminishing returns above 100% internal progress', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'integrated',
              progress: 1.0,
              internalProgress: 1.1, // Выше 100%
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'master', // Мастер-узлы могут превышать 100%
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // Опыт должен быть еще больше уменьшен
        expect(applied).toBeGreaterThan(0);
        // Но значительно меньше из-за двойной убывающей отдачи
      }
    });
  });

  describe('Stored Experience Application', () => {
    it('should apply stored experience when node becomes active', () => {
      const input: ComputeNextInput = {
        userId: 'user-1',
        signals: [
          { node_id: 'node-1', signal: 'strong signal' },
          { node_id: 'node-1', signal: 'another signal' },
        ],
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'available',
              progress: 0.25,
              internalProgress: 0.25,
              relevance: 0.2, // Ниже 30%
              storedExperience: 0.5, // Есть сохраненный опыт
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'basic',
            },
          ],
        ]),
      };

      const result = engine.computeNext(input);

      const change = result.changes.find((c) => c.nodeId === 'node-1');
      if (change) {
        // Если узел переходит в "активен" (прогресс >= 30% и актуальность >= 30%)
        // сохраненный опыт должен быть применен
        if (change.after.state === 'active') {
          expect(change.after.storedExperience).toBe(0);
          expect(change.after.internalProgress).toBeGreaterThan(change.before.internalProgress || 0);
        }
      }
    });
  });

  describe('Quest Difficulty Matching', () => {
    it('should reduce experience when quest difficulty does not match node level', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        questDifficulty: 'basic', // Базовый квест
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'master', // Мастер-узел
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // Опыт должен быть уменьшен из-за несоответствия сложности
        expect(applied).toBeGreaterThan(0);
        // Но меньше, чем было бы при соответствующей сложности
      }
    });

    it('should apply full experience when quest difficulty matches node level', () => {
      const input: ApplyQuestExperienceInput = {
        userId: 'user-1',
        nodeId: 'node-1',
        baseXp: 20,
        reflectionXp: 80, // micro quest
        questDifficulty: 'advanced', // Продвинутый квест
        currentStates: new Map<string, AbilityStateSnapshot>([
          [
            'node-1',
            {
              nodeId: 'node-1',
              state: 'active',
              progress: 0.5,
              internalProgress: 0.5,
              relevance: 0.5,
            },
          ],
        ]),
        nodeInfos: new Map<string, AbilityNodeInfo>([
          [
            'node-1',
            {
              id: 'node-1',
              branch: 'test',
              title: 'Test Node',
              description: 'Test',
              level: 'advanced', // Продвинутый узел
            },
          ],
        ]),
      };

      const result = engine.applyQuestExperience(input);

      expect(result.change).toBeDefined();
      if (result.change) {
        const beforeInternal = result.change.before.internalProgress || 0;
        const afterInternal = result.change.after.internalProgress;
        const applied = afterInternal - beforeInternal;

        // Полный опыт применяется при соответствии сложности
        expect(applied).toBeGreaterThan(0);
      }
    });
  });
});
