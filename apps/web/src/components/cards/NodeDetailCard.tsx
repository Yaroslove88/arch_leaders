'use client';

import { cn } from '@/lib/utils';
import { NodeState, IntegrationLevel, DevelopmentType } from './NodeCard';
import { Progress, tokens } from '@leadership-architect/ui';

export interface NodeDetailCardProps {
  /** ID узла */
  nodeId: string;
  /** Название узла */
  name: string;
  /** Описание узла */
  description?: string;
  /** Название ветки */
  branchName: string;
  /** Цвет ветки */
  branchColor?: string;
  /** Уровень узла (tier в дереве) */
  level: number;
  /** Максимальный уровень */
  maxLevel?: number;
  /** Текущий XP */
  currentXP: number;
  /** XP, необходимый для следующего уровня */
  requiredXP: number;
  /** Состояние узла (статус разблокировки) */
  state: NodeState;
  /** Уровень интеграции способности */
  integrationLevel?: IntegrationLevel;
  /** Тип развития узла */
  developmentType?: DevelopmentType;
  /** Описания уровней интеграции из node-descriptions */
  integrationLevels?: {
    Novice?: string;
    Integrated?: string;
    Embodied?: string;
  };
  /** Связанные квесты */
  quests?: {
    id: string;
    title: string;
    status: 'available' | 'in_progress' | 'completed';
  }[];
  /** Связанные кейсы */
  cases?: {
    id: string;
    title: string;
    status: 'available' | 'completed';
  }[];
  /** Требования для разблокировки */
  requirements?: string[];
  /** Быстрые действия */
  quickActions?: {
    id: string;
    label: string;
    icon: string;
    onClick: () => void;
  }[];
  /** Обработчик клика на квест */
  onQuestClick?: (questId: string) => void;
  /** Обработчик клика на кейс */
  onCaseClick?: (caseId: string) => void;
  /** Обработчик закрытия */
  onClose?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Детальная карточка узла способностей
 * Показывает полную информацию: описание, прогресс, квесты, кейсы
 */
export function NodeDetailCard({
  nodeId,
  name,
  description,
  branchName,
  branchColor,
  level,
  maxLevel = 5,
  currentXP,
  requiredXP,
  state,
  integrationLevel,
  developmentType,
  integrationLevels,
  quests = [],
  cases = [],
  requirements = [],
  quickActions = [],
  onQuestClick,
  onCaseClick,
  onClose,
  className,
}: NodeDetailCardProps) {
  // Получаем иконку и стили состояния
  const getStateInfo = () => {
    switch (state) {
      case 'locked':
        return { icon: '🔒', label: 'Заблокирован', color: 'text-tension-red' };
      case 'available':
        return { icon: '🔵', label: 'Доступен', color: 'text-catalyst-gold' };
      case 'active':
        return { icon: '⚪', label: 'В работе', color: 'text-strategic-blue' };
      case 'unlocked':
        return { icon: '✅', label: 'Разблокирован', color: 'text-sage-green' };
      case 'integrated':
        return { icon: '⭐', label: 'Интегрирован', color: 'text-sage-green' };
      default:
        return { icon: '⚪', label: 'Неизвестно', color: 'text-ash-light' };
    }
  };

  // Получаем информацию о типе развития
  const getDevelopmentTypeInfo = () => {
    switch (developmentType) {
      case 'practice':
        return { 
          label: 'Практический', 
          icon: '🎯', 
          color: 'bg-strategic-blue/20 text-strategic-blue',
          description: 'Развивается через квесты, кейсы и реальные ситуации'
        };
      case 'reflection':
        return { 
          label: 'Рефлексивный', 
          icon: '🪞', 
          color: 'bg-inner-violet/20 text-inner-violet',
          description: 'Развивается через самоанализ и работу с паттернами'
        };
      case 'theory':
        return { 
          label: 'Теоретический', 
          icon: '📚', 
          color: 'bg-warm-amber/20 text-warm-amber',
          description: 'Развивается через изучение концепций и моделей'
        };
      case 'mixed':
        return { 
          label: 'Смешанный', 
          icon: '🔄', 
          color: 'bg-ui-border-soft text-ui-text-muted',
          description: 'Комбинация нескольких типов развития'
        };
      default:
        return null;
    }
  };

  const stateInfo = getStateInfo();
  const devTypeInfo = getDevelopmentTypeInfo();
  // ВАЖНО: Для узлов с xp_required = 0 используем дефолтное значение 100 для расчета прогресса
  // чтобы показать реальный прогресс (50.15 / 100 вместо 50.15 / 0)
  const xpRequiredForCalc = requiredXP > 0 ? requiredXP : 100;
  const xpProgress = Math.min(100, Math.round((currentXP / xpRequiredForCalc) * 100));

  return (
    <div
      className={cn(
        'bg-graphite-structure rounded-xl shadow-active border border-ui-border-soft',
        'max-w-md w-full mx-auto',
        className
      )}
      style={{
        borderTopWidth: '4px',
        borderTopColor: branchColor || tokens.colors.nodeStates.available.border,
      }}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-ui-border-soft">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs text-ui-text-muted mb-1">{branchName}</p>
            <h2 className="font-bold text-lg text-ash-light">{name}</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Закрыть карточку узла"
              className="text-ui-text-muted hover:text-ash-light p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('text-xs px-2 py-0.5 rounded border', stateInfo.color)}>
            {stateInfo.icon} {stateInfo.label}
          </span>
          {devTypeInfo && (
            <span className={cn('text-xs px-2 py-0.5 rounded', devTypeInfo.color)}>
              {devTypeInfo.icon} {devTypeInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Тип развития - подсказка */}
      {devTypeInfo && state !== 'locked' && (
        <div className="px-4 py-2 border-b border-ui-border-soft bg-obsidian-core/50">
          <p className="text-xs text-ui-text-muted">
            {devTypeInfo.description}
          </p>
        </div>
      )}

      {/* Описание */}
      {description && state !== 'locked' && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm text-ui-text-muted">{description}</p>
        </div>
      )}

      {/* Прогресс (для незаблокированных) */}
      {state !== 'locked' && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-ash-light">
              Прогресс XP
            </span>
            <span className="text-xs text-ash-light">
              {requiredXP > 0 
                ? `${Math.min(currentXP, requiredXP).toFixed(0)} / ${requiredXP} XP (${xpProgress}%)`
                : `${Math.min(currentXP, 100).toFixed(0)} / 100 XP (${xpProgress}%)`}
              {currentXP > (requiredXP || 100) && (
                <span className="ml-1 text-sage-green font-bold">+{ (currentXP - (requiredXP || 100)).toFixed(1) }!</span>
              )}
            </span>
          </div>
          <Progress value={xpProgress} customColor={branchColor} className="h-2" />
          {requiredXP > 0 && currentXP < requiredXP && (
            <p className="text-xs text-ui-text-dim mt-1">
              До разблокировки: {(requiredXP - currentXP).toFixed(1)} XP
            </p>
          )}
        </div>
      )}

      {/* Уровни интеграции */}
      {state !== 'locked' && integrationLevels && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-3">
            Уровни интеграции
          </p>
          <div className="space-y-2">
            {/* Novice */}
            <div className={cn(
              'p-2 rounded border text-sm',
              integrationLevel === 'Novice' 
                ? 'border-catalyst-gold/50 bg-catalyst-gold/10' 
                : 'border-ui-border-soft bg-obsidian-core/50'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span>🌱</span>
                <span className={cn(
                  'font-medium',
                  integrationLevel === 'Novice' ? 'text-catalyst-gold' : 'text-ui-text-muted'
                )}>
                  Новичок
                </span>
                {integrationLevel === 'Novice' && (
                  <span className="text-xs bg-catalyst-gold/20 text-catalyst-gold px-1.5 py-0.5 rounded">
                    Текущий
                  </span>
                )}
              </div>
              {integrationLevels.Novice && (
                <p className="text-xs text-ui-text-muted">{integrationLevels.Novice}</p>
              )}
            </div>

            {/* Integrated */}
            <div className={cn(
              'p-2 rounded border text-sm',
              integrationLevel === 'Integrated' 
                ? 'border-sage-green/50 bg-sage-green/10' 
                : 'border-ui-border-soft bg-obsidian-core/50'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span>🌿</span>
                <span className={cn(
                  'font-medium',
                  integrationLevel === 'Integrated' ? 'text-sage-green' : 'text-ui-text-muted'
                )}>
                  Интегрировано
                </span>
                {integrationLevel === 'Integrated' && (
                  <span className="text-xs bg-sage-green/20 text-sage-green px-1.5 py-0.5 rounded">
                    Текущий
                  </span>
                )}
              </div>
              {integrationLevels.Integrated && (
                <p className="text-xs text-ui-text-muted">{integrationLevels.Integrated}</p>
              )}
            </div>

            {/* Embodied */}
            <div className={cn(
              'p-2 rounded border text-sm',
              integrationLevel === 'Embodied' 
                ? 'border-sage-green/50 bg-sage-green/10' 
                : 'border-ui-border-soft bg-obsidian-core/50'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span>🌳</span>
                <span className={cn(
                  'font-medium',
                  integrationLevel === 'Embodied' ? 'text-sage-green' : 'text-ui-text-muted'
                )}>
                  Воплощено
                </span>
                {integrationLevel === 'Embodied' && (
                  <span className="text-xs bg-sage-green/20 text-sage-green px-1.5 py-0.5 rounded">
                    Текущий
                  </span>
                )}
              </div>
              {integrationLevels.Embodied && (
                <p className="text-xs text-ui-text-muted">{integrationLevels.Embodied}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Требования (для заблокированных) */}
      {state === 'locked' && requirements.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-2">Требуется:</p>
          <ul className="space-y-1.5">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-ui-text-muted">
                <span>⚪</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Квесты */}
      {state !== 'locked' && quests.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-2">
            ⚔️ Квесты ({quests.length})
          </p>
          <div className="space-y-2">
            {quests.map((quest) => (
              <button
                key={quest.id}
                onClick={() => onQuestClick?.(quest.id)}
                className="w-full text-left flex items-center gap-2 p-2 rounded bg-obsidian-core hover:bg-obsidian-core/80 transition-colors"
              >
                <span className="text-sm">
                  {quest.status === 'completed' ? '✅' : quest.status === 'in_progress' ? '🔵' : '⚪'}
                </span>
                <span className="text-sm text-ash-light flex-1 truncate">
                  {quest.title}
                </span>
                <span className="text-xs text-strategic-blue">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Кейсы */}
      {state !== 'locked' && cases.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-2">
            📊 Кейсы ({cases.length})
          </p>
          <div className="space-y-2">
            {cases.map((caseItem) => (
              <button
                key={caseItem.id}
                onClick={() => onCaseClick?.(caseItem.id)}
                className="w-full text-left flex items-center gap-2 p-2 rounded bg-obsidian-core hover:bg-obsidian-core/80 transition-colors"
              >
                <span className="text-sm">
                  {caseItem.status === 'completed' ? '✅' : '⚪'}
                </span>
                <span className="text-sm text-ash-light flex-1 truncate">
                  {caseItem.title}
                </span>
                <span className="text-xs text-strategic-blue">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      {state !== 'locked' && quickActions.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-ash-light mb-2">⚡ Быстрые действия</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex items-center gap-2 p-2 rounded bg-obsidian-core hover:bg-obsidian-core/80 transition-colors text-sm text-ash-light"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Пустое состояние: нет квестов и кейсов */}
      {state !== 'locked' && quests.length === 0 && cases.length === 0 && quickActions.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-ui-text-muted">
            Контент для этого узла скоро появится
          </p>
        </div>
      )}
    </div>
  );
}

export default NodeDetailCard;
