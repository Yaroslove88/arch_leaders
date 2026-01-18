'use client';

import { cn } from '@/lib/utils';
import { Card, Progress, Badge } from '@leadership-architect/ui';
import { mapNodeStateToTone } from '@/lib/ui-utils';

/**
 * Статус разблокировки узла (техническое состояние)
 * @see docs/ability/STATE_AND_INTEGRATION_LEVEL.md
 */
export type NodeState = 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';

/**
 * Уровень интеграции способности (качественное освоение)
 */
export type IntegrationLevel = 'Novice' | 'Integrated' | 'Embodied';

/**
 * Тип развития узла
 */
export type DevelopmentType = 'practice' | 'reflection' | 'theory' | 'mixed';

export interface NodeCardProps {
  /** ID узла */
  nodeId: string;
  /** Название узла */
  name: string;
  /** Название ветки */
  branchName?: string;
  /** Уровень узла (tier в дереве) */
  level?: number;
  /** Максимальный уровень */
  maxLevel?: number;
  /** Прогресс XP в процентах (0-150+) */
  progress: number;
  /** Количество квестов */
  questsCount?: number;
  /** Количество кейсов */
  casesCount?: number;
  /** Состояние узла (статус разблокировки) */
  state: NodeState;
  /** Уровень интеграции способности */
  integrationLevel?: IntegrationLevel;
  /** Тип развития узла */
  developmentType?: DevelopmentType;
  /** Требования для разблокировки (для заблокированных) */
  requirements?: string[];
  /** Цвет ветки */
  branchColor?: string;
  /** Количество узлов, которые открывает этот узел */
  unlocksCount?: number;
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Компактная карточка узла способностей
 * Рефакторинг на базе Card/Progress и семантических токенов.
 */
export function NodeCard({
  nodeId,
  name,
  branchName,
  level = 0,
  maxLevel = 5,
  progress,
  questsCount = 0,
  casesCount = 0,
  state,
  integrationLevel,
  developmentType,
  requirements = [],
  branchColor,
  unlocksCount = 0,
  onClick,
  className,
}: NodeCardProps) {
  const tone = mapNodeStateToTone(state);

  // Состояния для отображения (label/icon)
  const stateConfig = {
    locked: { icon: '🔒', label: 'Заблокирован' },
    available: { icon: '🔵', label: 'Доступен' },
    active: { icon: '⚪', label: 'В работе' },
    unlocked: { icon: '✅', label: 'Разблокирован' },
    integrated: { icon: '⭐', label: 'Интегрирован' },
  };

  const currentStatus = stateConfig[state] || { icon: '⚪', label: 'Неизвестно' };

  // Интеграция
  const getIntegrationLabel = (level?: IntegrationLevel) => {
    switch (level) {
      case 'Novice': return { label: 'Новичок', icon: '🌱' };
      case 'Integrated': return { label: 'Интегрировано', icon: '🌿' };
      case 'Embodied': return { label: 'Воплощено', icon: '🌳' };
      default: return null;
    }
  };

  // Тип развития
  const getDevTypeTone = (type?: DevelopmentType) => {
    switch (type) {
      case 'practice': return 'focus';
      case 'reflection': return 'neutral';
      case 'theory': return 'warning';
      case 'mixed': return 'neutral';
      default: return 'neutral';
    }
  };

  const integrationInfo = getIntegrationLabel(integrationLevel);

  return (
    <Card
      onClick={onClick}
      elevated
      className={cn(
        'w-full text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-system-focus/60',
        state === 'locked' ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-active',
        className
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: branchColor || undefined,
      }}
      header={
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base" role="img" aria-hidden="true">{currentStatus.icon}</span>
            <h4 className="font-semibold text-sm text-ash-light truncate">
              {name}
            </h4>
          </div>
          <Badge tone={tone} soft>
            {currentStatus.label}
          </Badge>
        </div>
      }
      footer={
        <div className="space-y-2">
          {/* Мета (квесты/кейсы) */}
          {state !== 'locked' && (questsCount > 0 || casesCount > 0) && (
            <div className="flex gap-3 text-[11px] text-ui-text-muted">
              {questsCount > 0 && <span>⚔️ {questsCount} {questsCount === 1 ? 'квест' : 'квеста'}</span>}
              {casesCount > 0 && <span>📊 {casesCount} {casesCount === 1 ? 'кейс' : 'кейса'}</span>}
            </div>
          )}

          {/* Unlocks */}
          {unlocksCount > 0 && (
            <div className="text-[10px] text-ui-text-dim flex items-center gap-1.5">
              <span className="flex items-center justify-center w-3.5 h-3.5 rounded bg-obsidian-core border border-ui-border-soft text-[8px]">
                🔓
              </span>
              <span>Открывает: <span className="text-ash-light font-bold">{unlocksCount}</span></span>
            </div>
          )}

          {/* Требования */}
          {state === 'locked' && requirements.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] text-ui-text-dim uppercase tracking-wider mb-1">Требуется:</p>
              <ul className="text-[11px] text-ui-text-muted space-y-0.5">
                {requirements.slice(0, 2).map((req, idx) => (
                  <li key={idx} className="truncate">• {req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-3 py-1">
        {/* Прогресс */}
        {state !== 'locked' && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-ash-light">
              <span>{level > 0 ? `Уровень ${level}` : 'Прогресс'}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} customColor={branchColor} className="h-1.5" />
          </div>
        )}

        {/* Доп. теги */}
        <div className="flex flex-wrap items-center gap-1.5">
          {branchName && (
            <span className="text-[11px] text-ui-text-muted">
              {branchName}
            </span>
          )}
          {developmentType && (
             <Badge tone={getDevTypeTone(developmentType)} soft className="text-[10px]">
                {developmentType === 'practice' ? '🎯 Практика' : 
                 developmentType === 'reflection' ? '🪞 Рефлексия' : 
                 developmentType === 'theory' ? '📚 Теория' : '🔄 Смешанный'}
             </Badge>
          )}
          {integrationInfo && state !== 'locked' && (
            <span className="text-[11px] font-medium text-sage-green">
               {integrationInfo.icon} {integrationInfo.label}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default NodeCard;
