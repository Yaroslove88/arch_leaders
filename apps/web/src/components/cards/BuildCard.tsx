'use client';

import { cn } from '@/lib/utils';

export type BuildStatus = 'locked' | 'available' | 'active' | 'completed';

export interface BuildRequirement {
  nodeId: string;
  nodeName: string;
  requiredLevel: number;
  currentLevel: number;
  isCompleted: boolean;
}

export interface BuildCardProps {
  /** ID стиля лидерства */
  buildId: string;
  /** Название стиля */
  name: string;
  /** Краткое описание (фантазия) */
  fantasy?: string;
  /** Полное описание */
  description?: string;
  /** Иконка/эмодзи */
  icon?: string;
  /** Статус стиля */
  status: BuildStatus;
  /** Прогресс активации (0-100) */
  activationProgress: number;
  /** Требования для активации */
  requirements?: BuildRequirement[];
  /** Связанные узлы (которые развивает стиль) */
  relatedNodes?: {
    id: string;
    name: string;
  }[];
  /** Режим отображения: компактный (для списка) или детальный */
  variant?: 'compact' | 'detailed';
  /** Обработчик клика */
  onClick?: () => void;
  /** Обработчик активации стиля */
  onActivate?: () => void;
  /** Обработчик закрытия (для детального) */
  onClose?: () => void;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Карточка стиля лидерства (билда)
 * Поддерживает компактный и детальный режимы
 */
export function BuildCard({
  buildId,
  name,
  fantasy,
  description,
  icon = '🏛️',
  status,
  activationProgress,
  requirements = [],
  relatedNodes = [],
  variant = 'compact',
  onClick,
  onActivate,
  onClose,
  className,
}: BuildCardProps) {
  // Получаем стили для статуса
  const getStatusInfo = () => {
    switch (status) {
      case 'locked':
        return {
          label: 'Заблокирован',
          icon: '🔒',
          border: 'border-ui-border-soft',
          textColor: 'text-ui-text-muted',
        };
      case 'available':
        return {
          label: 'Доступен',
          icon: '⚪',
          border: 'border-catalyst-gold/50',
          textColor: 'text-catalyst-gold',
        };
      case 'active':
        return {
          label: 'Активен',
          icon: '✅',
          border: 'border-sage-green/50',
          textColor: 'text-sage-green',
        };
      case 'completed':
        return {
          label: 'Завершён',
          icon: '🏆',
          border: 'border-sage-green/50',
          textColor: 'text-sage-green',
        };
      default:
        return {
          label: 'Неизвестно',
          icon: '⚪',
          border: 'border-ui-border-soft',
          textColor: 'text-ash-light',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const completedRequirements = requirements.filter((r) => r.isCompleted).length;

  // Компактный режим
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 rounded-xl border transition-all duration-200',
          'bg-graphite-structure hover:shadow-active cursor-pointer',
          statusInfo.border,
          className
        )}
      >
        {/* Заголовок */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h4 className="font-semibold text-sm text-ash-light">{name}</h4>
              {fantasy && (
                <p className="text-xs text-ash-light opacity-90 italic line-clamp-1">{fantasy}</p>
              )}
            </div>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-lg', statusInfo.border, statusInfo.textColor)}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Прогресс активации */}
        {status !== 'locked' && status !== 'completed' && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-ash-light">
                Прогресс активации
              </span>
              <span className="text-xs font-medium text-ash-light">{activationProgress}%</span>
            </div>
            <div className="w-full bg-obsidian-core rounded-full h-1.5">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  status === 'active' ? 'bg-sage-green' : 'bg-strategic-blue'
                )}
                style={{ width: `${Math.min(100, activationProgress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Требования (краткая информация) */}
        {requirements.length > 0 && status !== 'completed' && (
          <div className="text-xs text-ash-light">
            {completedRequirements} из {requirements.length} требований выполнено
          </div>
        )}

        {/* Кнопка */}
        {status !== 'locked' && (
          <div className="mt-3 pt-2 border-t border-ui-border-soft">
            <span className="text-xs text-strategic-blue">
              {status === 'active' ? 'Управлять стилем →' : 'Подробнее →'}
            </span>
          </div>
        )}
      </button>
    );
  }

  // Детальный режим
  return (
    <div
      className={cn(
        'bg-graphite-structure rounded-2xl shadow-active border',
        statusInfo.border,
        'max-w-md w-full mx-auto',
        className
      )}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-ui-border-soft">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h2 className="font-bold text-lg text-ash-light tracking-tight">{name}</h2>
              {fantasy && (
                <p className="text-sm text-ash-light opacity-90 italic">{fantasy}</p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ui-text-muted hover:opacity-100 p-1"
            >
              ✕
            </button>
          )}
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1', statusInfo.border, statusInfo.textColor)}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>

      {/* Описание */}
      {description && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm text-ash-light opacity-90 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Прогресс активации */}
      {status !== 'completed' && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-ash-light">Прогресс активации</span>
            <span className="text-xs text-ash-light">{activationProgress}%</span>
          </div>
          <div className="w-full bg-obsidian-core rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                status === 'active' ? 'bg-sage-green' : 'bg-strategic-blue'
              )}
              style={{ width: `${Math.min(100, activationProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Требования */}
      {requirements.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-3">
            📋 Требования ({completedRequirements} / {requirements.length})
          </p>
          <div className="space-y-2">
            {requirements.map((req) => (
              <div
                key={req.nodeId}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg text-sm',
                  req.isCompleted ? 'bg-sage-green/10' : 'bg-obsidian-core'
                )}
              >
                <span className={req.isCompleted ? 'text-sage-green' : 'text-ash-light opacity-60'}>
                  {req.isCompleted ? '✅' : '⚪'}
                </span>
                <span className={cn(
                  'flex-1',
                  req.isCompleted ? 'text-sage-green' : 'text-ash-light'
                )}>
                  {req.nodeName}
                </span>
                <span className="text-xs text-ash-light opacity-80">
                  Ур. {req.currentLevel} / {req.requiredLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Связанные узлы */}
      {relatedNodes.length > 0 && (
        <div className="px-4 py-3 border-b border-ui-border-soft">
          <p className="text-sm font-medium text-ash-light mb-2">🔗 Развивает навыки</p>
          <div className="flex flex-wrap gap-2">
            {relatedNodes.map((node) => (
              <span
                key={node.id}
                className="text-xs px-2 py-1 bg-obsidian-core rounded-lg text-ash-light"
              >
                {node.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка активации */}
      {status === 'available' && onActivate && (
        <div className="p-4">
          <button
            onClick={onActivate}
            disabled={activationProgress < 100}
            className={cn(
              'w-full py-3 rounded-xl font-medium transition-colors',
              activationProgress >= 100
                ? 'bg-catalyst-gold text-obsidian-core hover:bg-catalyst-gold/90'
                : 'bg-obsidian-core text-ash-light opacity-60 cursor-not-allowed'
            )}
          >
            {activationProgress >= 100 ? '✅ Активировать стиль' : 'Выполните все требования'}
          </button>
        </div>
      )}

      {/* Активный стиль */}
      {status === 'active' && (
        <div className="p-4 text-center">
          <p className="text-sm text-sage-green font-medium">
            ✅ Этот стиль сейчас активен
          </p>
        </div>
      )}
    </div>
  );
}

export default BuildCard;
