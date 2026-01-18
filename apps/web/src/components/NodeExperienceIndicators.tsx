'use client';

import { NodeAbilityState, Achievement } from '@/lib/api';

interface NodeExperienceIndicatorsProps {
  nodeId: string;
  nodeState?: NodeAbilityState;
  nodePrerequisites?: string[];
  prerequisitesStates?: Record<string, NodeAbilityState>;
  achievements?: Achievement[];
  allNodes?: Array<{ node_id: string; name: string }>;
}

/**
 * Компонент для отображения индикаторов опыта узла:
 * - Сохраненный опыт
 * - Предварительные условия
 * - Ачивки
 * - Деградация опыта
 * - Эффективность по статусу
 */
export function NodeExperienceIndicators({
  nodeId,
  nodeState,
  nodePrerequisites = [],
  prerequisitesStates = {},
  achievements = [],
  allNodes = [],
}: NodeExperienceIndicatorsProps) {
  if (!nodeState) {
    return null;
  }

  const storedExperience = nodeState.stored_experience || 0;
  const internalProgress = nodeState.internal_progress || nodeState.progress || 0;
  const displayedProgress = nodeState.progress || 0;
  const relevance = nodeState.relevance || 0;
  const lastActivityDate = nodeState.last_activity_date;

  // Проверяем предварительные условия
  const prerequisitesMet = nodePrerequisites.every(
    (prereqId) => prerequisitesStates[prereqId]?.state !== 'locked',
  );
  const missingPrerequisites = nodePrerequisites.filter(
    (prereqId) => prerequisitesStates[prereqId]?.state === 'locked',
  );

  // Проверяем деградацию (если нет активности более 30 дней и прогресс >= 100%)
  const daysSinceActivity = lastActivityDate
    ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isDegrading = daysSinceActivity !== null && daysSinceActivity >= 30 && internalProgress >= 1.0;

  // Эффективность опыта по статусу
  const stateEfficiency = {
    locked: 0,
    available: 50,
    active: 100,
    unlocked: 100,
    integrated: 100,
  }[nodeState.state] || 0;

  return (
    <div className="space-y-2 mt-2 text-xs">
      {/* Сохраненный опыт */}
      {storedExperience > 0 && (
        <div className="flex items-center gap-2 p-2 bg-obsidian-core border border-catalyst-gold/30 rounded">
          <span className="text-catalyst-gold">💾</span>
          <span className="text-ui-text-muted">
            Сохранено опыта: <span className="font-semibold text-catalyst-gold">{storedExperience.toFixed(1)}</span>
            {nodeState.state === 'locked' && ' (0% применяется)'}
            {nodeState.state === 'available' && ' (50% применяется)'}
          </span>
        </div>
      )}

      {/* Предварительные условия */}
      {nodePrerequisites.length > 0 && (
        <div className={`p-2 rounded border ${
          prerequisitesMet 
            ? 'bg-obsidian-core border-system-growth/30' 
            : 'bg-obsidian-core border-catalyst-gold/30'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={prerequisitesMet ? 'text-sage-green' : 'text-catalyst-gold'}>
              {prerequisitesMet ? '✅' : '⚠️'}
            </span>
            <span className="font-semibold text-ash-light">
              Предварительные условия:
            </span>
          </div>
          {prerequisitesMet ? (
            <span className="text-sage-green text-xs">Все выполнены</span>
          ) : (
            <div className="space-y-1">
              <span className="text-catalyst-gold text-xs">
                Отсутствуют: {missingPrerequisites.length} из {nodePrerequisites.length}
              </span>
              <ul className="list-disc list-inside ml-2 text-ui-text-muted text-xs">
                {missingPrerequisites.map((prereqId) => {
                  const prereqNode = allNodes.find((n) => n.node_id === prereqId);
                  return (
                    <li key={prereqId}>
                      {prereqNode?.name || prereqId}
                    </li>
                  );
                })}
              </ul>
              <span className="text-ui-text-muted text-xs">
                Опыт уменьшен до {prerequisitesMet ? '100%' : missingPrerequisites.length === 1 ? '50%' : missingPrerequisites.length === 2 ? '25%' : '10%'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Требование актуальности для перехода в "Активен" */}
      {nodeState.state === 'available' && displayedProgress >= 0.3 && relevance < 0.3 && (
        <div className="p-2 bg-obsidian-core border border-catalyst-gold/30 rounded">
          <div className="flex items-center gap-2">
            <span className="text-catalyst-gold">📊</span>
            <span className="text-ui-text-muted text-xs">
              Для перехода в "Активен" нужна актуальность ≥ 30% (сейчас: {(relevance * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {/* Эффективность опыта по статусу */}
      {nodeState.state !== 'active' && nodeState.state !== 'unlocked' && nodeState.state !== 'integrated' && (
        <div className="p-2 bg-obsidian-core border border-ui-border-soft rounded">
          <div className="flex items-center gap-2">
            <span className="text-ui-text-muted">⚡</span>
            <span className="text-ui-text-muted text-xs">
              Эффективность опыта: <span className="font-semibold">{stateEfficiency}%</span>
            </span>
          </div>
        </div>
      )}

      {/* Деградация опыта */}
      {isDegrading && (
        <div className="p-2 bg-obsidian-core border border-tension-red/30 rounded">
          <div className="flex items-center gap-2">
            <span className="text-tension-red">⚠️</span>
            <span className="text-tension-red text-xs">
              Опыт деградирует: нет активности {daysSinceActivity} дней
            </span>
          </div>
          <span className="text-ui-text-muted text-xs mt-1 block">
            Выполните квесты или кейсы, связанные с этим узлом, чтобы остановить деградацию
          </span>
        </div>
      )}

      {/* Ачивки */}
      {achievements.length > 0 && (
        <div className="p-2 bg-obsidian-core border border-system-growth/30 rounded">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sage-green">🏆</span>
            <span className="font-semibold text-ash-light text-xs">Ачивки:</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {achievements.map((achievement) => {
              const emoji = {
                bronze: '🥉',
                silver: '🥈',
                gold: '🥇',
                platinum: '💎',
              }[achievement.type] || '🏆';
              return (
                <span
                  key={achievement.id}
                  className="px-2 py-1 bg-graphite-structure border border-system-growth/30 rounded text-xs"
                  title={achievement.description}
                >
                  {emoji} {achievement.type}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Внутренний прогресс (только для админа или если > 100%) */}
      {internalProgress > 1.0 && (
        <div className="p-2 bg-obsidian-core border border-strategic-blue/30 rounded">
          <div className="flex items-center gap-2">
            <span className="text-system-focus">📈</span>
            <span className="text-ui-text-muted text-xs">
              Внутренний прогресс: <span className="font-semibold text-system-focus">{(internalProgress * 100).toFixed(1)}%</span>
              {internalProgress >= 2.0 && ' (бронзовая ачивка)'}
              {internalProgress >= 3.0 && ' (серебряная ачивка)'}
              {internalProgress >= 5.0 && ' (золотая ачивка)'}
              {internalProgress >= 10.0 && ' (платиновая ачивка)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
