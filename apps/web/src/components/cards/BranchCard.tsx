'use client';

import { cn } from '@/lib/utils';
import { Card, Progress, Badge } from '@leadership-architect/ui';
import { Icon } from '@/components/icons/Icon';
import { getBranchIcon } from '@/lib/icon-utils';

export interface BranchCardProps {
  /** ID ветки */
  branchId: string;
  /** Название ветки */
  name: string;
  /** Краткое описание ветки (2-3 предложения) */
  description?: string;
  /** Иконка (эмодзи или компонент) */
  icon?: string;
  /** Прогресс (0-100) */
  progress: number;
  /** Количество активных узлов */
  activeNodes: number;
  /** Общее количество узлов */
  totalNodes: number;
  /** Текущий фокус (название узла) */
  currentFocus?: string;
  /** Рекомендация: focus (для баланса), growing (растёт), imbalanced (перекос) */
  recommendation?: 'focus' | 'growing' | 'imbalanced';
  /** Выбрана ли ветка */
  isSelected?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Карточка ветки способностей
 * Рефакторинг на базе Card/Progress/Badge.
 */
export function BranchCard({
  branchId,
  name,
  description,
  icon = '🌿',
  progress,
  activeNodes,
  totalNodes,
  currentFocus,
  recommendation,
  isSelected = false,
  onClick,
  className,
}: BranchCardProps) {
  const branchIcon = getBranchIcon(branchId);
  
  // Цветовая схема для каждой ветки
  const getBranchTone = (): 'focus' | 'growth' | 'warning' | 'critical' | 'neutral' => {
    switch (branchIcon) {
      case 'subjectivity': return 'focus';
      case 'architectural-thinking': return 'focus';
      case 'responsibility': return 'growth';
      case 'environment-maturity': return 'growth';
      case 'resilience': return 'warning';
      case 'feedback': return 'focus';
      default: return 'neutral';
    }
  };

  const branchTone = getBranchTone();

  // Рекомендации
  const getRecommendationInfo = () => {
    if (!recommendation) return null;
    switch (recommendation) {
      case 'focus':
        return { label: 'Рекомендуется для баланса', tone: 'warning' as const, icon: '⚡' };
      case 'growing':
        return { label: 'Растёт', tone: 'growth' as const, icon: '📈' };
      case 'imbalanced':
        return { label: 'Перекос', tone: 'critical' as const, icon: '⚠️' };
      default:
        return null;
    }
  };

  const recommendationInfo = getRecommendationInfo();

  return (
    <Card
      onClick={onClick}
      elevated
      className={cn(
        'w-full text-left transition-all duration-300 border-2',
        isSelected ? 'border-strategic-blue shadow-active scale-[1.01]' : 'border-ui-border-soft hover:shadow-active',
        className
      )}
      header={
        <div className="flex items-center gap-3">
          {branchIcon ? (
            <Icon 
              name={branchIcon} 
              size="2xl" 
              className={cn(
                branchTone === 'focus' ? 'text-strategic-blue' :
                branchTone === 'growth' ? 'text-sage-green' :
                branchTone === 'warning' ? 'text-catalyst-gold' : 'text-ash-light',
                'flex-shrink-0'
              )}
            />
          ) : (
            <span className="text-xl" role="img" aria-hidden="true">{icon}</span>
          )}
          <h3 className="font-semibold text-base md:text-lg text-ash-light tracking-tight">
            {name}
          </h3>
        </div>
      }
      footer={
        <div className="space-y-3">
          {/* Фокус или рекомендация */}
          {(currentFocus || recommendationInfo) && (
            <div className="flex flex-wrap items-center gap-2">
              {recommendationInfo && (
                <Badge tone={recommendationInfo.tone} soft className="text-[10px]">
                  {recommendationInfo.icon} {recommendationInfo.label}
                </Badge>
              )}
              {currentFocus && !recommendation && (
                <span className="text-[11px] text-ash-light">
                  ⚡ Фокус: <span className="font-medium text-catalyst-gold">"{currentFocus}"</span>
                </span>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {description && (
          <p className="text-xs md:text-sm text-ui-text-muted line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Прогресс */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] text-ash-light">
            <span>{activeNodes} из {totalNodes} узлов</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} tone={branchTone} className="h-2" />
        </div>
      </div>
    </Card>
  );
}

export default BranchCard;
