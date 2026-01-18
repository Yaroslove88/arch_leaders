'use client';

import { cn } from '@/lib/utils';
import { Card, Progress, Badge } from '@leadership-architect/ui';
import { Icon } from '@/components/icons/Icon';
import { getQuestIcon, getStatusIcon, getStatusIconColor } from '@/lib/icon-utils';
import { mapQuestStatusToTone } from '@/lib/ui-utils';

export type QuestType = 'micro' | 'weekly' | 'story' | 'default';
export type QuestDifficulty = 'basic' | 'intermediate' | 'advanced';
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'locked';

export interface QuestCardProps {
  /** ID квеста */
  questId: string;
  /** Название квеста */
  title: string;
  /** Гипотеза квеста (главная идея) */
  hypothesis?: string;
  /** Тип квеста */
  questType: QuestType;
  /** Сложность квеста */
  difficulty: QuestDifficulty;
  /** Статус квеста */
  status: QuestStatus;
  /** Количество выполненных шагов */
  completedSteps: number;
  /** Общее количество шагов */
  totalSteps: number;
  /** Награда XP */
  xpReward?: number;
  /** Влияние на дерево: массив узлов с процентами */
  treeImpact?: Array<{
    nodeName: string;
    percentage: number;
  }>;
  /** Время на выполнение (в минутах) */
  estimatedMinutes?: number;
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Компактная карточка квеста для списка
 * Рефакторинг на базе Card/Progress/Badge.
 */
export function QuestCard({
  questId,
  title,
  hypothesis,
  questType,
  difficulty,
  status,
  completedSteps,
  totalSteps,
  xpReward,
  treeImpact,
  estimatedMinutes,
  onClick,
  className,
}: QuestCardProps) {
  const tone = mapQuestStatusToTone(status);

  // Стили для типа квеста
  const getQuestTypeInfo = () => {
    const questIcon = getQuestIcon(questType);
    switch (questType) {
      case 'micro':
        return { label: 'Микро-квест', icon: '⚡', iconName: questIcon, tone: 'warning' as const };
      case 'weekly':
        return { label: 'Недельный', icon: '📅', iconName: questIcon, tone: 'focus' as const };
      case 'story':
        return { label: 'Сюжетный', icon: '📖', iconName: questIcon, tone: 'neutral' as const };
      default:
        return { label: 'Квест', icon: '⚔️', iconName: questIcon, tone: 'neutral' as const };
    }
  };

  const questTypeInfo = getQuestTypeInfo();
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Card
      onClick={onClick}
      elevated
      className={cn(
        'w-full text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-system-focus/60',
        status === 'locked' ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-active',
        className
      )}
      header={
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
               {questTypeInfo.iconName ? (
                <Icon 
                  name={questTypeInfo.iconName} 
                  size="xl" 
                  className={cn(status === 'locked' ? 'text-ui-text-dim' : 'text-catalyst-gold', 'flex-shrink-0 mt-0.5')}
                />
              ) : (
                <span className="text-lg" role="img" aria-hidden="true">{questTypeInfo.icon}</span>
              )}
              <h4 className="font-semibold text-sm text-ash-light leading-snug">
                {title}
              </h4>
            </div>
            <div className="flex-shrink-0">
              <Badge tone={tone} soft>
                {status === 'completed' ? 'Выполнен' : status === 'in_progress' ? 'В процессе' : status === 'available' ? 'Доступен' : 'Заблокирован'}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={questTypeInfo.tone} soft className="text-[10px]">
              {questTypeInfo.label}
            </Badge>
            {treeImpact && treeImpact.slice(0, 1).map((impact, index) => (
              <Badge key={index} tone="neutral" soft className="text-[10px]">
                🏷️ {impact.nodeName}
              </Badge>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className={cn(
              difficulty === 'advanced' ? 'text-tension-red' : 
              difficulty === 'intermediate' ? 'text-catalyst-gold' : 'text-sage-green'
            )}>
              {difficulty === 'basic' ? 'Базовый' : difficulty === 'intermediate' ? 'Средний' : 'Сложный'}
            </span>
            {estimatedMinutes && (
              <span className="text-ui-text-muted">~{estimatedMinutes} мин.</span>
            )}
          </div>
          {xpReward && (
            <span className="text-catalyst-gold font-bold">+{xpReward} XP</span>
          )}
        </div>
      }
    >
      <div className="space-y-3 py-1">
        {/* Гипотеза */}
        {hypothesis && hypothesis.trim().length > 10 && (
          <div className="p-3 bg-strategic-blue/10 rounded-lg border-l-2 border-strategic-blue/50">
            <p className="text-[11px] text-ash-light leading-relaxed italic">
              «{hypothesis}»
            </p>
          </div>
        )}

        {/* Прогресс */}
        {status !== 'locked' && status !== 'completed' && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-ash-light">
              <span>{completedSteps} из {totalSteps} шагов</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} tone={tone} className="h-1.5" />
          </div>
        )}

        {status === 'completed' && (
          <div className="text-[11px] text-sage-green font-medium flex items-center gap-1.5">
            <span>✅ Все {totalSteps} шагов выполнены</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default QuestCard;
